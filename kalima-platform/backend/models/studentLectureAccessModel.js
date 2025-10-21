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
});

studentLectureAccessSchema.index({ student: 1, lecture: 1 }, { unique: true }); // Prevents duplicate records

module.exports = mongoose.model(
  "StudentLectureAccess",
  studentLectureAccessSchema
);
