const express = require("express");
const AttachmentController = require("../controllers/attachmentController");
const verifyJWT = require("../middleware/verifyJWT");

const router = express.Router();

router.route("/").get(AttachmentController.getAllAttachments);

router
  .route("/:attachmentId")
  .get(AttachmentController.getAttachment)
  .delete(AttachmentController.deleteAttachment);

// Secure the upload route with JWT verification
router.use("/upload-homework/:lectureId", verifyJWT);

// Modified to use 'file' as the field name for uploads
router.post(
  "/upload-homework/:lectureId",
  AttachmentController.upload.single("file"), // Use 'file' as the field name
  AttachmentController.uploadHomeWork
);

// Add route to get all homework for a lecture
router.get(
  "/homework/:lectureId",
  verifyJWT,
  AttachmentController.getAllHomeWork
);

module.exports = router;
