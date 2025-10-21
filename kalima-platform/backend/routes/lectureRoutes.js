const express = require("express");
const lectureController = require("../controllers/lectureController");
const attachmentController = require("../controllers/attachmentController");
const verifyJWT = require("../middleware/verifyJWT");
const authController = require("../controllers/authController");
// Apply JWT verification middleware
const router = express.Router();

// New public route for non-sensitive lecture data
router.route("/public").get(lectureController.getAllLecturesPublic);

// Apply JWT verification middleware for subsequent routes
router.use(verifyJWT);

router
  .route("/")
  .get(lectureController.getAllLectures)
  .post(lectureController.createLecture);

router
  .route("/:lectureId")
  .get(lectureController.getLectureById)
  .patch(lectureController.updatelectures)
  .delete(lectureController.deletelecture);

// Check student access to standalone lecture
router
  .route("/student/:studentId/lecture/:lectureId/purchase/:purchaseId")
  .get(lectureController.checkStudentLectureAccess);

router
  .route("/attachments/:lectureId")
  .get(attachmentController.getLectureAttachments)
  .post(
    attachmentController.multiUpload, // Use .fields for multi-file, multi-category
    attachmentController.createAttachment
  );

router
  .route("/attachment/:attachmentId")
  .get(attachmentController.getAttachment)
  .delete(attachmentController.deleteAttachment);

router
  .route("/attachment/:attachmentId/file")
  .get(attachmentController.getAttachmentFile);

router
  .route("/lecturer/:lecturerId")
  .get(lectureController.getLecturerLectures);

router
  .route("/:lectureId/homework")
  .get(attachmentController.getAllHomeWork)
  .post(
    attachmentController.upload.single("attachment"),
    attachmentController.uploadHomeWork
  );

router.route("/update-parent").patch(lectureController.UpdateParentOfLecture);

module.exports = router;
