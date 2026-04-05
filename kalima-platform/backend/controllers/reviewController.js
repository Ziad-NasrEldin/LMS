const Review = require("../models/reviewModel");
const Container = require("../models/containerModel");
const Purchase = require("../models/purchaseModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// ─── STUDENT ENDPOINTS ────────────────────────────────────────────────────────

// Create a new review (students only)
exports.createReview = catchAsync(async (req, res, next) => {
  const { containerId, rating, comment } = req.body;
  const studentId = req.user._id;
  const studentName = req.user.name;

  // Validate input
  if (!containerId || !rating || !comment) {
    return next(new AppError("Please provide containerId, rating, and comment", 400));
  }

  if (rating < 1 || rating > 5) {
    return next(new AppError("Rating must be between 1 and 5", 400));
  }

  // Check if container exists
  const container = await Container.findById(containerId);
  if (!container) {
    return next(new AppError("Course not found", 404));
  }

  // Check if student has purchased this course
  const hasPurchased = await Purchase.findOne({
    student: studentId,
    container: containerId,
    type: "containerPurchase",
  });

  if (!hasPurchased) {
    return next(new AppError("You can only review courses you have purchased", 403));
  }

  // Check if student has already reviewed this course
  const existingReview = await Review.findOne({
    student: studentId,
    container: containerId,
  });

  if (existingReview) {
    return next(new AppError("You have already reviewed this course. Please update your existing review instead.", 400));
  }

  // Create the review
  const review = await Review.create({
    student: studentId,
    studentName,
    container: containerId,
    rating,
    comment,
    status: "pending", // Reviews require admin approval
  });

  res.status(201).json({
    status: "success",
    message: "Review submitted successfully and is pending approval",
    data: review,
  });
});

// Get student's own review for a specific course
exports.getMyReview = catchAsync(async (req, res, next) => {
  const { containerId } = req.params;
  const studentId = req.user._id;

  const review = await Review.findOne({
    student: studentId,
    container: containerId,
  });

  res.status(200).json({
    status: "success",
    data: review || null,
  });
});

// Update student's own review
exports.updateMyReview = catchAsync(async (req, res, next) => {
  const { containerId } = req.params;
  const { rating, comment } = req.body;
  const studentId = req.user._id;

  // Validate input
  if (rating && (rating < 1 || rating > 5)) {
    return next(new AppError("Rating must be between 1 and 5", 400));
  }

  const review = await Review.findOneAndUpdate(
    { student: studentId, container: containerId },
    {
      ...(rating && { rating }),
      ...(comment && { comment }),
      status: "pending", // Reset to pending after update
    },
    { new: true, runValidators: true }
  );

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Review updated successfully and is pending approval",
    data: review,
  });
});

// Delete student's own review
exports.deleteMyReview = catchAsync(async (req, res, next) => {
  const { containerId } = req.params;
  const studentId = req.user._id;

  const review = await Review.findOneAndDelete({
    student: studentId,
    container: containerId,
  });

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  res.status(204).json({
    status: "success",
    message: "Review deleted successfully",
    data: null,
  });
});

// ─── PUBLIC ENDPOINTS ─────────────────────────────────────────────────────────

// Get all approved reviews for a course (public)
exports.getCourseReviews = catchAsync(async (req, res, next) => {
  const { containerId } = req.params;

  // Check if container exists
  const container = await Container.findById(containerId);
  if (!container) {
    return next(new AppError("Course not found", 404));
  }

  const reviews = await Review.find({
    container: containerId,
    status: "approved",
  })
    .sort({ createdAt: -1 })
    .select("-__v");

  // Calculate rating statistics
  const stats = await Review.aggregate([
    {
      $match: {
        container: container._id,
        status: "approved",
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: "$rating",
        },
      },
    },
  ]);

  let ratingStats = {
    average: 0,
    total: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  };

  if (stats.length > 0) {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    stats[0].ratingDistribution.forEach((r) => {
      distribution[r] = (distribution[r] || 0) + 1;
    });

    ratingStats = {
      average: Math.round(stats[0].averageRating * 10) / 10,
      total: stats[0].totalReviews,
      distribution,
    };
  }

  res.status(200).json({
    status: "success",
    results: reviews.length,
    data: {
      reviews,
      stats: ratingStats,
    },
  });
});

// ─── ADMIN ENDPOINTS ──────────────────────────────────────────────────────────

// Get all reviews (admin only) - with filtering and pagination
exports.getAllReviews = catchAsync(async (req, res, next) => {
  const { status, containerId, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (containerId) filter.container = containerId;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const reviews = await Review.find(filter)
    .populate("container", "name")
    .populate("student", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Review.countDocuments(filter);

  res.status(200).json({
    status: "success",
    results: reviews.length,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    },
    data: reviews,
  });
});

// Approve a review (admin only)
exports.approveReview = catchAsync(async (req, res, next) => {
  const { reviewId } = req.params;

  const review = await Review.findByIdAndUpdate(
    reviewId,
    {
      status: "approved",
      updatedAt: Date.now(),
    },
    { new: true }
  );

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Review approved successfully",
    data: review,
  });
});

// Reject a review (admin only)
exports.rejectReview = catchAsync(async (req, res, next) => {
  const { reviewId } = req.params;

  const review = await Review.findByIdAndUpdate(
    reviewId,
    {
      status: "rejected",
      updatedAt: Date.now(),
    },
    { new: true }
  );

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Review rejected successfully",
    data: review,
  });
});

// Respond to a review (admin only)
exports.respondToReview = catchAsync(async (req, res, next) => {
  const { reviewId } = req.params;
  const { response } = req.body;
  const adminId = req.user._id;

  if (!response || response.trim().length === 0) {
    return next(new AppError("Please provide a response", 400));
  }

  const review = await Review.findByIdAndUpdate(
    reviewId,
    {
      adminResponse: response.trim(),
      respondedBy: adminId,
      respondedAt: Date.now(),
      updatedAt: Date.now(),
    },
    { new: true }
  );

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Response added successfully",
    data: review,
  });
});

// Delete any review (admin only)
exports.deleteReview = catchAsync(async (req, res, next) => {
  const { reviewId } = req.params;

  const review = await Review.findByIdAndDelete(reviewId);

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  res.status(204).json({
    status: "success",
    message: "Review deleted successfully",
    data: null,
  });
});

// Get review statistics (admin only)
exports.getReviewStats = catchAsync(async (req, res, next) => {
  const stats = await Review.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const totalReviews = await Review.countDocuments();
  const pendingReviews = await Review.countDocuments({ status: "pending" });

  res.status(200).json({
    status: "success",
    data: {
      total: totalReviews,
      pending: pendingReviews,
      byStatus: stats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
    },
  });
});
