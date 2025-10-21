const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "cStudent",
      required: true,
    },
    reportType: {
      type: String,
      enum: ["lesson", "month", "course"],
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
    // For lesson report
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: function() {
        return this.reportType === "lesson";
      },
    },
    // For month and course reports - both use the courseOrmonth entity
    courseOrmonth: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "groupedLessons",
      required: function() {
        return this.reportType === "month" || this.reportType === "course";
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;