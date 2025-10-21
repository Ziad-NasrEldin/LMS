const express = require("express");
const router = express.Router();
const studentLectureAccessController = require("../controllers/studentLectureAccessController");
const verifyJWT = require("../middleware/verifyJWT");


router.use(verifyJWT);

router.route("/check/:lectureId")
  .get(studentLectureAccessController.checkLectureAccess);

router.route("/lecture/:lectureId")
  .get(studentLectureAccessController.getLectureAccessByLectureId);

router
  .route("/")
  .get(studentLectureAccessController.getAllStudentLectureAccess)
  .post(studentLectureAccessController.createStudentLectureAccess);

router
  .route("/:id")
  .get(studentLectureAccessController.getStudentLectureAccess)
  .patch(studentLectureAccessController.updateStudentLectureAccess)
  .delete(studentLectureAccessController.deleteStudentLectureAccess);

module.exports = router;
