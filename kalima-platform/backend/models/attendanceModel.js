const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "cStudent", // Refers to the base User model
      required: true,
    },
    // Add studentSequencedId as a dedicated field for direct querying
    studentSequencedId: {
      type: Number,
      required: true,
      index: true // Add an index for faster lookups
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    center: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Center",
      required: true,
    },
    lecturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CLecturer", 
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    level: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Level",
      required: true,
    },
    attendanceDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    // New fields for attendance duration tracking
    leaveTime: {
      type: Date
    },
    attendanceDuration: {
      type: Number, // Duration in minutes
      min: 0
    },
    paymentType: {
      type: String,
      enum: ["daily", "multi-session", "unpaid"],
      required: true,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    // For multi-session payments: How many sessions this specific payment covered
    sessionsPaidFor: {
      type: Number,
      default: 0,
    },
    // For multi-session attendance: How many sessions are remaining *after* this attendance
    sessionsRemaining: {
      type: Number,
      default: 0,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Refers to the base User model (Assistant/Admin)
      required: true,
    },
    isBookletPurchased: {
      type: Boolean,
      default: false,
    },
    isNotGroup: {
      type: Boolean,
      default: false,
    },
    // New exam result fields
    examScore: {
      type: Number,
      min: 0
    },
    examMaxScore: {
      type: Number,
      min: 0
    },
    examPassThreshold: {
      type: Number,
      min: 0
    },
    examStatus: {
      type: String,
      enum: ["passed", "failed", "absent", "pending"],
    },
    examDate: {
      type: Date
    },
    examNotes: {
      type: String
    }
  },
  {
    timestamps: true,
  }
);

// Index to efficiently find the latest multi-session payment for a student/lecturer/subject/level
attendanceSchema.index({
  studentSequencedId: 1, // Use sequencedId instead of student ID
  lecturer: 1,
  subject: 1,
  level: 1,
  paymentType: 1,
  attendanceDate: -1,
});

// Index for querying by student sequenced ID and lesson
attendanceSchema.index({ studentSequencedId: 1, lesson: 1 });

// Other existing indexes
// Index for querying attendance by lesson and date
attendanceSchema.index({ lesson: 1, attendanceDate: 1 });
// Index for querying by center and date
attendanceSchema.index({ center: 1, attendanceDate: 1 });
// Index for querying by student and lesson (keep for backward compatibility)
attendanceSchema.index({ student: 1, lesson: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;
