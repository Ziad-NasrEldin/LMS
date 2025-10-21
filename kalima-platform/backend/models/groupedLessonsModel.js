const mongoose = require("mongoose");

const groupedLessonsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  groupedLessonstype: {
    type: String,
  },
  lessons: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
    }
  ],

}, {
  timestamps: true,
});

module.exports = mongoose.model("groupedLessons", groupedLessonsSchema);