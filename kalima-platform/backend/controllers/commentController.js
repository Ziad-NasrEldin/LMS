const Comment = require("../models/CommentModel");
const Lecture = require("../models/LectureModel");
const { studentHasLectureEntitlement } = require("../utils/lectureAccessResolver");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

const COMMENT_MODERATOR_ROLES = new Set(["Admin", "SubAdmin", "Moderator"]);
const PRIVILEGED_COMMENT_ROLES = new Set(["Lecturer", "Admin", "SubAdmin", "Moderator", "Assistant"]);

const getDescendantCommentIds = async (rootId) => {
    const descendantIds = [];
    const queue = [rootId];

    while (queue.length > 0) {
        const currentId = queue.shift();
        const children = await Comment.find({ parentId: currentId }).select("_id");

        for (const child of children) {
            const childId = child._id.toString();
            descendantIds.push(childId);
            queue.push(childId);
        }
    }

    return descendantIds;
};

const attachReplyCounts = async (comments) => {
    const parentIds = comments.map((comment) => comment._id);
    if (parentIds.length === 0) {
        return [];
    }

    const replyCounts = await Comment.aggregate([
        {
            $match: {
                parentId: { $in: parentIds },
            },
        },
        {
            $group: {
                _id: "$parentId",
                count: { $sum: 1 },
            },
        },
    ]);

    const replyCountMap = new Map(
        replyCounts.map((entry) => [entry._id.toString(), entry.count])
    );

    return comments.map((comment) => ({
        ...comment.toObject(),
        replyCount: replyCountMap.get(comment._id.toString()) || 0,
    }));
};

// Create a new comment or reply
exports.createComment = catchAsync(async (req, res, next) => {
    const { lectureId, content, parentId } = req.body;
    const userId = req.user._id;
    const normalizedContent = String(content || "").trim();

    if (!lectureId || !normalizedContent) {
        return next(new AppError("Please provide lectureId and content", 400));
    }

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
        return next(new AppError("Lecture not found", 404));
    }

    if (parentId) {
        const parentComment = await Comment.findById(parentId).select("lectureId");
        if (!parentComment) {
            return next(new AppError("Parent comment not found", 404));
        }
        if (parentComment.lectureId.toString() !== lectureId.toString()) {
            return next(new AppError("Reply must belong to the same lecture", 400));
        }
    }

    if (!PRIVILEGED_COMMENT_ROLES.has(req.user.role)) {
        const lectureTarget = {
            _id: lecture._id,
            parent: lecture.parent || null,
        };
        const hasPurchased = await studentHasLectureEntitlement(userId, lectureTarget);

        if (!hasPurchased) {
            return next(new AppError("You must purchase the lecture to post a comment", 403));
        }
    }

    const comment = await Comment.create({
        lectureId,
        userId,
        content: normalizedContent,
        parentId: parentId || null,
    });

    await comment.populate("userId", "name role");

    res.status(201).json({
        status: "success",
        data: comment,
    });
});

// Get comments for a lecture with pagination
exports.getLectureComments = catchAsync(async (req, res, next) => {
    const { lectureId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const comments = await Comment.find({
        lectureId,
        parentId: null,
    })
        .populate("userId", "name role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber);

    const total = await Comment.countDocuments({ lectureId, parentId: null });
    const commentsWithReplyCount = await attachReplyCounts(comments);

    res.status(200).json({
        status: "success",
        results: commentsWithReplyCount.length,
        pagination: {
            total,
            page: pageNumber,
            pages: Math.ceil(total / limitNumber),
        },
        data: commentsWithReplyCount,
    });
});

// Get replies for a specific comment
exports.getCommentReplies = catchAsync(async (req, res, next) => {
    const { commentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const replies = await Comment.find({ parentId: commentId })
        .populate("userId", "name role")
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limitNumber);

    const total = await Comment.countDocuments({ parentId: commentId });
    const repliesWithReplyCount = await attachReplyCounts(replies);

    res.status(200).json({
        status: "success",
        results: repliesWithReplyCount.length,
        pagination: {
            total,
            page: pageNumber,
            pages: Math.ceil(total / limitNumber),
        },
        data: repliesWithReplyCount,
    });
});

// Edit a comment
exports.updateComment = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { content } = req.body;
    const normalizedContent = String(content || "").trim();

    if (!normalizedContent) {
        return next(new AppError("Comment content cannot be empty", 400));
    }

    const comment = await Comment.findById(id);
    if (!comment) {
        return next(new AppError("Comment not found", 404));
    }

    if (comment.userId.toString() !== req.user._id.toString() && !COMMENT_MODERATOR_ROLES.has(req.user.role)) {
        return next(new AppError("You are not allowed to edit this comment", 403));
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        id,
        { content: normalizedContent },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        status: "success",
        data: updatedComment,
    });
});

// Delete a comment
exports.deleteComment = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
        return next(new AppError("Comment not found", 404));
    }

    if (comment.userId.toString() !== req.user._id.toString() && !COMMENT_MODERATOR_ROLES.has(req.user.role)) {
        return next(new AppError("You are not allowed to delete this comment", 403));
    }

    const descendantIds = await getDescendantCommentIds(id);
    const idsToDelete = [id, ...descendantIds];

    await Comment.deleteMany({ _id: { $in: idsToDelete } });

    res.status(200).json({
        status: "success",
        data: null,
    });
});

// Toggle like on a comment
exports.toggleLike = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(id);
    if (!comment) {
        return next(new AppError("Comment not found", 404));
    }

    const isLiked = comment.likes.some((likeId) => likeId.toString() === userId.toString());
    if (isLiked) {
        comment.likes = comment.likes.filter((likeId) => likeId.toString() !== userId.toString());
    } else {
        comment.likes.push(userId);
    }

    await comment.save();

    res.status(200).json({
        status: "success",
        data: {
            likesCount: comment.likes.length,
            isLiked: !isLiked,
        },
    });
});
