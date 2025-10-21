const express = require("express");
const attendanceController = require("../controllers/attendanceController");
const authController = require("../controllers/authController");
const verifyJWT = require("../middleware/verifyJWT");

const router = express.Router();

// Apply JWT verification to all attendance routes
router.use(verifyJWT);

router
  .route("/")
  .post(
    authController.verifyRoles("Assistant", "Admin", "Sub-Admin", "Moderator"), // Roles allowed to record
    attendanceController.recordAttendance
  )
  .get(
    authController.verifyRoles("Admin", "Sub-Admin", "Moderator", "Assistant"), // Roles allowed to view lists
    attendanceController.getAllAttendance
  );

router
  .route("/:id")
  .get(
    authController.verifyRoles("Admin", "Sub-Admin", "Moderator", "Assistant"), // Roles allowed to view specific record
    attendanceController.getAttendanceById
  )
  .patch(
    authController.verifyRoles("Assistant", "Admin", "Sub-Admin", "Moderator"), // Roles allowed to update attendance
    attendanceController.updateAttendance
  )
  .delete(
    authController.verifyRoles("Admin", "Sub-Admin", "Moderator"), // Roles allowed to delete
    attendanceController.deleteAttendance
  );

// New route for updating exam results
router.route("/:id/exam-results")
  .patch(
    authController.verifyRoles("Admin", "Sub-Admin", "Moderator", "Assistant", "Lecturer"), // Roles allowed to update exam results
    attendanceController.updateExamResults
  );

router.route("/student/:studentSequencedId").get(
  authController.verifyRoles("Admin", "Sub-Admin", "Moderator", "Assistant"), // Roles allowed to view specific student attendance
  attendanceController.getAttendance
);

module.exports = router;
