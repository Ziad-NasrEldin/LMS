const mongoose = require("mongoose");

const containerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["year", "term", "month", "lecture", "course"],
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: false,
    },
    level: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Level",
      required: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecturer",
      required: true,
    },
    teacherAllowed: {
      type: Boolean,
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Container",
      default: null,
    },
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: "Container" }],
    price: { type: Number, default: 0 },
    description: { type: String }, // Optional field for courses
    goal: [{ type: String }], // Optional field for courses as an array of strings
    image: {
      url: { type: String },
      publicId: { type: String }
    }, // Container image (stored in top-level containers)
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    discriminatorKey: "kind",
  }
);

// Create virtual to get image from parent if not available
containerSchema.virtual('containerImage').get(function() {
  // If container has its own image, return it
  if (this.image && this.image.url) {
    return this.image;
  }
  // Otherwise, it will inherit from parent (handled in the controller)
  return null;
});

containerSchema.index({ parent: 1 });
containerSchema.index({ createdBy: 1 });

module.exports = mongoose.model("Container", containerSchema);
