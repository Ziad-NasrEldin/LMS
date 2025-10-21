const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  lecturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CLecturer",
    required: true,
  },
  level: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Level",
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number, // Duration in minutes
    default: 120,
  },
  center: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Center",
    required: true,
  },
  bookletPrice: {
    type: Number,
    default: 0,
  },
  courseOrmonth: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "groupedLessons",
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("Lesson", lessonSchema);
