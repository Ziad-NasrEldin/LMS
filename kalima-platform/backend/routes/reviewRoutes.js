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

// Student creates a review
router.post(
  "/",
  authController.verifyRoles("Student"),
  reviewController.createReview
);

// Student gets their own review for a course
router.get(
  "/my-review/:containerId",
  authController.verifyRoles("Student"),
  reviewController.getMyReview
);

// Student updates their review
router.patch(
  "/my-review/:containerId",
  authController.verifyRoles("Student"),
  reviewController.updateMyReview
);

// Student deletes their review
router.delete(
  "/my-review/:containerId",
  authController.verifyRoles("Student"),
  reviewController.deleteMyReview
);

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

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
