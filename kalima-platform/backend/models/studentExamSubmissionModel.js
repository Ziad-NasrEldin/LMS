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
      min: 0,
      default: null,
    },
    maxScore: {
      type: Number,
      min: 0,
      default: null,
    },
    passingThreshold: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    passed: {
      type: Boolean,
      required: true,
      default: false,
    },
    syncStatus: {
      type: String,
      enum: ["pending", "synced", "failed"],
      default: "synced",
    },
    syncSource: {
      type: String,
      enum: ["sheet", "webhook", "reconciliation", "manual"],
      default: "sheet",
    },
    syncReference: {
      type: String,
      trim: true,
      default: null,
    },
    syncError: {
      type: String,
      trim: true,
      default: null,
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
studentExamSubmissionSchema.index({ syncStatus: 1, updatedAt: -1 });

module.exports = mongoose.model("StudentExamSubmission", studentExamSubmissionSchema);
