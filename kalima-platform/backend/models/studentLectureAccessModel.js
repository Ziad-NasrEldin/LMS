const mongoose = require("mongoose");

const studentLectureAccessSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  lecture: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lecture",
    required: true,
  },
  remainingViews: { type: Number, default: 3 },
  lastAccessed: { type: Date, default: Date.now },
  lastViewEventId: {
    type: String,
    trim: true,
    default: null,
    maxlength: [128, "lastViewEventId cannot exceed 128 characters"],
  },
  lastViewEventAt: {
    type: Date,
    default: null,
  },
});

studentLectureAccessSchema.index({ student: 1, lecture: 1 }, { unique: true }); // Prevents duplicate records
studentLectureAccessSchema.index({ student: 1, lastViewEventId: 1 });

module.exports = mongoose.model(
  "StudentLectureAccess",
  studentLectureAccessSchema
);
