const express = require("express");
const cStudentController = require("../controllers/center.studentController");

const router = express.Router();

router
  .route("/")
  .get(cStudentController.getAllStudents)
  .post(cStudentController.createStudent);
router
  .route("/:id")
  .get(cStudentController.getStudentById)
  .patch(cStudentController.updateStudent)
  .delete(cStudentController.deleteStudent);

router
  .route("/sequenced/:sequencedId")
  .get(cStudentController.getStudentBySequencedId);

module.exports = router;
