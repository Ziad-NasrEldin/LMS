const express = require("express");
const router = express.Router();
const assistantHomeworkController = require("../controllers/assistantHomeworkController");
const verifyJWT = require("../middleware/verifyJWT");
const authController = require("../controllers/authController");

// Protect all routes
router.use(verifyJWT);

// Get all lectures with homework submissions
router.get(
  "/lectures", 
  authController.verifyRoles("Assistant", "Admin", "SubAdmin", "Moderator", "Lecturer"),
  assistantHomeworkController.getLecturesWithHomework
);

// Get hierarchical view of containers and lectures with homework counts
router.get(
  "/hierarchy", 
  authController.verifyRoles("Assistant", "Admin", "SubAdmin", "Moderator", "Lecturer"),
  assistantHomeworkController.getHomeworkHierarchy
);

// Get all students' homework submissions for a specific lecture
router.get(
  "/lecture/:lectureId", 
  authController.verifyRoles("Assistant", "Admin", "SubAdmin", "Moderator", "Lecturer"),
  assistantHomeworkController.getLectureHomeworkSubmissions
);

module.exports = router;