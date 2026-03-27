const express = require("express");
const router = express.Router();
const studentLectureAccessController = require("../controllers/studentLectureAccessController");
const { verifyRoles } = require("../controllers/authController");
const verifyJWT = require("../middleware/verifyJWT");

router.use(verifyJWT);

router
  .route("/check/:lectureId")
  .get(verifyRoles("Student"), studentLectureAccessController.checkLectureAccess);

router
  .route("/lecture/:lectureId")
  .get(
    verifyRoles("Lecturer", "Assistant", "Admin", "SubAdmin", "Moderator"),
    studentLectureAccessController.getLectureAccessByLectureId
  );

router
  .route("/")
  .get(
    verifyRoles("Admin", "SubAdmin", "Moderator"),
    studentLectureAccessController.getAllStudentLectureAccess
  )
  .post(
    verifyRoles("Admin", "SubAdmin", "Moderator"),
    studentLectureAccessController.createStudentLectureAccess
  );

router
  .route("/:id/play-start")
  .post(verifyRoles("Student"), studentLectureAccessController.accountLecturePlayStart);

router
  .route("/:id/consume-view")
  .post(verifyRoles("Student"), studentLectureAccessController.consumeLectureView);

router
  .route("/:id")
  .get(
    verifyRoles("Student", "Lecturer", "Assistant", "Admin", "SubAdmin", "Moderator"),
    studentLectureAccessController.getStudentLectureAccess
  )
  .patch(
    verifyRoles("Lecturer", "Assistant", "Admin", "SubAdmin", "Moderator"),
    studentLectureAccessController.updateStudentLectureAccess
  )
  .delete(
    verifyRoles("Admin", "SubAdmin", "Moderator"),
    studentLectureAccessController.deleteStudentLectureAccess
  );

module.exports = router;
