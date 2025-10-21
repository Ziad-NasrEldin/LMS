const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      name: {
        type: String,
        required: true
      },
      role: {
        type: String,
        required: true
      }
    },
    action: {
      type: String,
      enum: ["create", "read", "update", "delete"],
      required: true
    },
    resource: {
      type: {
        type: String,
        required: true,
        enum: [
          "center", "code", "container", "moderator", "subAdmin", 
          "assistant", "admin", "lecturer", "package", 
          "lesson", "timetable", "center-lesson", "ec.section", 
          "ec.product", "ec.purchase"
        ]
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
      },
      name: {
        type: String,
        required: false
      }
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound index for faster queries
auditLogSchema.index({ "user.userId": 1, "resource.type": 1, timestamp: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

module.exports = AuditLog;