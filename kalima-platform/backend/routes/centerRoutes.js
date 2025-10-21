const express = require("express");
const centerController = require("../controllers/centerController");
const authController = require("../controllers/authController");
const verifyJWT = require("../middleware/verifyJWT");
const router = express.Router();

// Protect all routes
router.use(verifyJWT);

// Center routes
router
  .route("/")
  .get(centerController.getAllCenters)
  .post(authController.verifyRoles("Admin", "Lecturer", "Assistant"), centerController.createCenter);

router
  .route("/lessons")
  .post(authController.verifyRoles("Admin", "Lecturer", "Assistant"), centerController.addLesson);

router
  .route("/:centerId/timetable")
  .get(centerController.getTimetable);

router
  .route("/lessons/:lessonId")
  .delete(authController.verifyRoles("Admin", "Lecturer", "Assistant"), centerController.deleteLesson);

// new: GET /api/centers/:centerId/:type
router.get("/:centerId/:type", centerController.getCenterDataById);

module.exports = router;