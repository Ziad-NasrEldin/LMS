const mongoose = require("mongoose");

const studentExamSubmissionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    lecture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['exam', 'homework'],
      default: 'exam'
    },
    config: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LecturerExamConfig"
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    maxScore: {
      type: Number,
      required: true,
      min: 0,
    },
    passingThreshold: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    verifiedAt: {
      type: Date,
      default: Date.now,
    }
  },
  {
    timestamps: true,
  }
);

// Updated compound index to include type field for uniqueness
studentExamSubmissionSchema.index({ student: 1, lecture: 1, type: 1 }, { unique: true });
studentExamSubmissionSchema.index({ lecture: 1, submittedAt: -1 });
studentExamSubmissionSchema.index({ type: 1, passed: 1 });

module.exports = mongoose.model("StudentExamSubmission", studentExamSubmissionSchema);