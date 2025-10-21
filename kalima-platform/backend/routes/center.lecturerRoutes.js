const express = require("express");
const clecturerController = require("../controllers/center.lecturerController"); // Adjust path if necessary

const router = express.Router();

router
  .route("/")
  .get(clecturerController.getAllLecturers)
  .post(clecturerController.createLecturer);

router
  .route("/:id")
  .get(clecturerController.getLecturerById)
  .patch(clecturerController.updateLecturer)
  .delete(clecturerController.deleteLecturer);

module.exports = router;
