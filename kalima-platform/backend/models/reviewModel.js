const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  // Who wrote the review
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  // Which course is being reviewed
  container: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Container",
    required: true,
  },
  // Rating (1-5 stars)
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  // Review text content
  comment: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 1000,
    trim: true,
  },
  // Review status for moderation
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  // Admin response to the review
  adminResponse: {
    type: String,
    maxlength: 500,
    trim: true,
    default: null,
  },
  // Admin who responded
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  // When the review was created
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // When the review was last updated
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  // When the admin responded
  respondedAt: {
    type: Date,
    default: null,
  },
});

// Indexes for efficient queries
reviewSchema.index({ container: 1, status: 1 });
reviewSchema.index({ student: 1, container: 1 }, { unique: true }); // One review per student per course
reviewSchema.index({ createdAt: -1 });

// Update the updatedAt timestamp on save
reviewSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Review", reviewSchema);
