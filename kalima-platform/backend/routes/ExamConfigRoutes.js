const express = require("express");
const router = express.Router();
const examConfigController = require("../controllers/ExamConfigController");
const verifyJWT = require("../middleware/verifyJWT");
const authController = require("../controllers/authController");

// Protect all routes
router.use(verifyJWT);

// Routes - allow access to Lecturers, Admins, SubAdmins, and Moderators
router
  .route("/")
  .get(
    authController.verifyRoles("Lecturer", "Admin", "SubAdmin", "Moderator"),
    examConfigController.getMyExamConfigs
  )
  .post(
    authController.verifyRoles("Lecturer", "Admin", "SubAdmin", "Moderator"),
    examConfigController.createExamConfig
  );

router
  .route("/:id")
  .get(
    authController.verifyRoles("Lecturer", "Admin", "SubAdmin", "Moderator"),
    examConfigController.getExamConfig
  )
  .patch(
    authController.verifyRoles("Lecturer", "Admin", "SubAdmin", "Moderator"),
    examConfigController.updateExamConfig
  )
  .delete(
    authController.verifyRoles("Lecturer", "Admin", "SubAdmin", "Moderator"),
    examConfigController.deleteExamConfig
  );

module.exports = router;