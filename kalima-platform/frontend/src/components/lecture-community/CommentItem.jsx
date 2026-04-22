import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FiMessageSquare, FiThumbsUp, FiEdit2, FiTrash2, FiChevronDown, FiChevronUp } from "react-icons/fi";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { getCommentReplies, toggleCommentLike, updateComment, deleteComment } from "../../routes/comments";
import CommentInput from "./CommentInput";
import toast from "react-hot-toast";
import { designTokens } from "../../constants/designTokens";

const CommentItem = ({ comment, userRole, userId, onCommentUpdate }) => {
    const { t, i18n } = useTranslation("lectureDisplay");
    const isRTL = i18n.language === "ar";
    const commentAuthor = comment?.userId && typeof comment.userId === "object" ? comment.userId : null;
    const commentAuthorId = commentAuthor?._id || comment?.userId || null;
    const commentAuthorName = commentAuthor?.name || "User";
    const commentAuthorRole = commentAuthor?.role || "";
    const commentLikes = Array.isArray(comment?.likes) ? comment.likes : [];
    const likedByCurrentUser = commentLikes.some((likeId) => String(likeId) === String(userId));

    const [replies, setReplies] = useState([]);
    const [showReplies, setShowReplies] = useState(false);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content || "");
    const [likesCount, setLikesCount] = useState(commentLikes.length);
    const [isLiked, setIsLiked] = useState(likedByCurrentUser);
    const TOKENS = designTokens.colors;
    const SHADOWS = designTokens.shadows;
    const RADIUS = designTokens.radius;
    const GRADIENTS = designTokens.gradients;

    useEffect(() => {
        setEditContent(comment.content || "");
        setLikesCount(commentLikes.length);
        setIsLiked(likedByCurrentUser);
    }, [comment.content, commentLikes.length, likedByCurrentUser]);

    const fetchReplies = async () => {
        setLoadingReplies(true);
        try {
            const result = await getCommentReplies(comment._id);
            if (result.status === "success") {
                setReplies(result.data);
            }
        } catch (error) {
            toast.error(error?.message || t("failedToLoadComments"));
        } finally {
            setLoadingReplies(false);
        }
    };

    const handleToggleReplies = async () => {
        if (!showReplies) {
            await fetchReplies();
        }
        setShowReplies((prev) => !prev);
    };

    const handleReplyToggle = async () => {
        const nextShowReplyInput = !showReplyInput;
        setShowReplyInput(nextShowReplyInput);

        if (!showReplies) {
            setShowReplies(true);
            await fetchReplies();
        }
    };

    const handleLike = async () => {
        try {
            const result = await toggleCommentLike(comment._id);
            if (result.status === "success") {
                setLikesCount(result.data.likesCount);
                setIsLiked(result.data.isLiked);
            }
        } catch (error) {
            toast.error(error?.message || t("failedToLikeComment"));
        }
    };

    const handleSaveEdit = async () => {
        if (!editContent.trim()) {
            toast.error(t("commentCannotBeEmpty"));
            return;
        }

        try {
            const result = await updateComment(comment._id, editContent);
            if (result.status === "success") {
                onCommentUpdate();
                setIsEditing(false);
                toast.success(t("commentUpdated"));
            }
        } catch (error) {
            toast.error(error?.message || t("failedToUpdateComment"));
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(t("confirmDeleteComment"))) return;
        try {
            const result = await deleteComment(comment._id);
            if (result.status === "success") {
                onCommentUpdate();
                toast.success(t("commentDeleted"));
            }
        } catch (error) {
            toast.error(error?.message || t("failedToDeleteComment"));
        }
    };

    const handleNestedCommentUpdate = async () => {
        await fetchReplies();
        onCommentUpdate?.();
    };

    const canEdit =
        String(commentAuthorId) === String(userId) ||
        ["Admin", "SubAdmin", "Moderator"].includes(userRole);
    const canReply = Boolean(userId);
    const replyCount = comment.replyCount ?? replies.length;
    const isLecturer = commentAuthorRole === "Lecturer";

    return (
        <div
            className="flex flex-col gap-3 p-4 md:p-5"
            style={{
                background: "rgba(255,255,255,0.88)",
                borderColor: TOKENS.borderSubtle,
                borderRadius: RADIUS.card,
                boxShadow: SHADOWS.level1,
            }}
        >
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <div
                        className="flex items-center justify-center rounded-full w-10 h-10 text-[#F8FCFF] font-black"
                        style={{ background: isLecturer ? GRADIENTS.cta : TOKENS.deepTeal }}
                    >
                        <span>{commentAuthorName.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                        <span className="font-bold text-sm" style={{ color: TOKENS.deepTeal }}>{commentAuthorName}</span>
                        {isLecturer && (
                            <Badge variant="primary" size="sm" className="ml-2">{t("lecturer", "Lecturer")}</Badge>
                        )}
                        <span className="text-xs ml-2" style={{ color: TOKENS.slateText }}>
                            {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
                <div className="flex gap-1">
                    {canEdit && (
                        <>
                            <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => setIsEditing(true)}
                                className="p-1 rounded-full"
                                style={{ color: TOKENS.slateText }}
                            >
                                <FiEdit2 />
                            </Button>
                            <Button
                                variant="ghost"
                                size="xs"
                                onClick={handleDelete}
                                className="p-1 rounded-full"
                                style={{ color: TOKENS.slateText }}
                            >
                                <FiTrash2 />
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {isEditing ? (
                <div className="flex flex-col gap-2 mt-2">
                    <textarea
                        className="w-full p-3 rounded-xl text-sm outline-none"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        style={{
                            border: `1px solid ${TOKENS.borderSubtle}`,
                            background: TOKENS.neutralCloud,
                            color: TOKENS.inkText,
                        }}
                    />
                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setEditContent(comment.content || "");
                                setIsEditing(false);
                            }}
                        >
                            {t("cancel", "Cancel")}
                        </Button>
                        <Button variant="primary" size="sm" onClick={handleSaveEdit}>
                            {t("save", "Save")}
                        </Button>
                    </div>
                </div>
            ) : (
                <p className="text-sm mt-1 break-words whitespace-pre-wrap" style={{ color: TOKENS.inkText }}>{comment.content}</p>
            )}

            <div className="flex items-center gap-4 mt-2">
                <button
                    onClick={handleLike}
                    className="flex items-center gap-1 text-xs font-semibold transition-colors"
                    style={{ color: isLiked ? TOKENS.deepTeal : TOKENS.slateText }}
                >
                    <FiThumbsUp /> {likesCount}
                </button>
                {canReply && (
                    <button
                        onClick={handleReplyToggle}
                        className="flex items-center gap-1 text-xs font-semibold"
                        style={{ color: TOKENS.slateText }}
                    >
                        <FiMessageSquare /> {t("reply", "Reply")}
                    </button>
                )}
                <button
                    onClick={handleToggleReplies}
                    className="flex items-center gap-1 text-xs font-semibold"
                    style={{ color: TOKENS.slateText }}
                >
                    <FiMessageSquare /> {replyCount} {t("replies", "Replies")}
                    {showReplies ? <FiChevronUp /> : <FiChevronDown />}
                </button>
            </div>

            {showReplies && (
                <div
                    className="mt-4 ml-4 flex flex-col gap-4 pl-4"
                    style={{ borderLeft: `2px solid ${TOKENS.deepTealSubtle}` }}
                >
                    {showReplyInput && (
                        <CommentInput
                            lectureId={comment.lectureId}
                            parentId={comment._id}
                            compact
                            title={null}
                            placeholder={t("writeReplyPlaceholder", "Write your reply here...")}
                            submitLabel={t("reply", "Reply")}
                            onCommentCreated={async () => {
                                setShowReplyInput(false);
                                await handleNestedCommentUpdate();
                            }}
                        />
                    )}
                    {loadingReplies ? (
                        <div className="flex justify-center py-2">
                            <div
                                className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                                style={{ borderColor: TOKENS.deepTeal, borderTopColor: "transparent" }}
                            ></div>
                        </div>
                    ) : replies.length > 0 ? (
                        replies.map((reply) => (
                            <CommentItem
                                key={reply._id}
                                comment={reply}
                                userRole={userRole}
                                userId={userId}
                                onCommentUpdate={handleNestedCommentUpdate}
                            />
                        ))
                    ) : (
                        <p className="text-xs italic" style={{ color: TOKENS.slateText }}>{t("noRepliesYet", "No replies yet.")}</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default CommentItem;
