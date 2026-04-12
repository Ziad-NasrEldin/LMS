const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
  lectureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lecture",
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: false,
  },
  type: {
    type: String,
    enum: ["booklets", "pdfsandimages", "homeworks", "exams"],
    required: true,
  },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: String, required: true },
  publicId: { type: String, required: false },
  uploadedOn: { type: Date, default: Date.now },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  comment: {
    type: String,
    trim: true,
    default: "",
  },
  feedbackDate: {
    type: Date,
    default: null,
  },
  feedbackBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
    default: null,
  },
});
attachmentSchema.index({ lectureId: 1, type: 1 });
attachmentSchema.index({ studentId: 1, type: 1 });

module.exports = mongoose.model("Attachment", attachmentSchema);
