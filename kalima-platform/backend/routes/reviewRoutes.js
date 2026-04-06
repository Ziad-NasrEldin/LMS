const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const verifyJWT = require("../middleware/verifyJWT");
const authController = require("../controllers/authController");

// ─── PUBLIC ROUTES ────────────────────────────────────────────────────────────

// Get approved reviews for a specific course (public - no auth required)
router.get("/course/:containerId", reviewController.getCourseReviews);

// ─── AUTHENTICATED USER ROUTES ────────────────────────────────────────────────

router.use(verifyJWT);

// ─── ADMIN ROUTES (exact paths first to avoid wildcard conflicts) ──────────────

// Get all reviews (with filtering and pagination)
router.get(
  "/",
  authController.verifyRoles("Admin", "Sub-Admin", "Moderator", "Lecturer"),
  reviewController.getAllReviews
);

// Get review statistics
router.get(
  "/stats",
  authController.verifyRoles("Admin", "Sub-Admin", "Moderator", "Lecturer"),
  reviewController.getReviewStats
);

// Student/Parent creates a review
router.post(
  "/",
  authController.verifyRoles("Student", "Parent"),
  reviewController.createReview
);

// Student/Parent gets their own review for a course
router.get(
  "/my-review/:containerId",
  authController.verifyRoles("Student", "Parent"),
  reviewController.getMyReview
);

// Student/Parent updates their review
router.patch(
  "/my-review/:containerId",
  authController.verifyRoles("Student", "Parent"),
  reviewController.updateMyReview
);

// Student/Parent deletes their review
router.delete(
  "/my-review/:containerId",
  authController.verifyRoles("Student", "Parent"),
  reviewController.deleteMyReview
);

// Approve a review
router.patch(
  "/:reviewId/approve",
  authController.verifyRoles("Admin", "Sub-Admin", "Moderator", "Lecturer"),
  reviewController.approveReview
);

// Reject a review
router.patch(
  "/:reviewId/reject",
  authController.verifyRoles("Admin", "Sub-Admin", "Moderator", "Lecturer"),
  reviewController.rejectReview
);

// Respond to a review
router.patch(
  "/:reviewId/respond",
  authController.verifyRoles("Admin", "Sub-Admin", "Moderator", "Lecturer"),
  reviewController.respondToReview
);

// Delete a review
router.delete(
  "/:reviewId",
  authController.verifyRoles("Admin", "Sub-Admin", "Moderator", "Lecturer"),
  reviewController.deleteReview
);

module.exports = router;
