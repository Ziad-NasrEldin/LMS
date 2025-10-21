const express = require("express");
const reportController = require("../controllers/reportController");
const authController = require("../controllers/authController");
const verifyJWT = require("../middleware/verifyJWT");

const router = express.Router();

router.use(verifyJWT);

router.use(authController.verifyRoles("Admin", "Sub-Admin", "Moderator", "Assistant"));

// Student-specific report generation endpoints
// All require studentId in the request body
router.route("/lesson")
  .post(
        reportController.generateLessonReport
  );

router.route("/month")
  .post(
        reportController.generateMonthReport
  );

router.route("/course")
  .post(
        reportController.generateCourseReport
  );

// Get report by ID
router.route("/:id")
  .get(
        reportController.getReportById
  );

// Get all reports for a student
router.route("/student/:studentId")
  .get(
        reportController.getStudentReports
  );

module.exports = router;