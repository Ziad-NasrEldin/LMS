const express = require("express");
const lecturerController = require("../controllers/lecturerController");
const authController = require("../controllers/authController");
const verifyJWT = require("../middleware/verifyJWT");

const router = express.Router();

router.get(
    "/me/analytics",
    verifyJWT,
    authController.verifyRoles("Lecturer"),
    lecturerController.getMyAnalytics
);

router
    .route("/")
    .get(lecturerController.getAllLecturers)
    .post(lecturerController.uploadLecturerPhoto ,lecturerController.createLecturer);

router
    .route("/:id")
    .get(lecturerController.getLecturerById)
    .patch(lecturerController.updateLecturer)
    .delete(lecturerController.deleteLecturer);

module.exports = router;
