const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
  // Who purchased the points
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // For which lecturer these points are valid
  lecturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lecturer",
    required: [
      function () {
        return this.type === "containerPurchase";
      },
      "Lecturer ID is required for specific codes",
    ],
  },
  // Points amount purchased or container purchased
  points: {
    type: Number,
    required: true,
    default: 0,
  },

  // If this is a container purchase, reference it
  container: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Container",
    required: [
      function () {
        return this.type === "containerPurchase";
      },
      "Container ID is required for specific codes",
    ],
  },

  // If this is a lecture purchase, reference it
  lecture: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lecture",
    required: [
      function () {
        return this.type === "lecturePurchase";
      },
      "Lecture ID is required for lecture purchases",
    ],
  },

  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Package",
    required: [
      function () {
        return this.type === "packagePurchase";
      },
      "package ID is required for specific codes",
    ],
  },
  // Type of transaction: "pointPurchase" or "containerPurchase"
  type: {
    type: String,
    enum: ["pointPurchase", "containerPurchase", "lecturePurchase", "packagePurchase", "promoCodePurchase"],
    required: true,
  },
  // Additional details
  description: {
    type: String,
    default: "Purchase",
  },
  // When the purchase was made
  purchasedAt: {
    type: Date,
    default: Date.now,
  },
});
purchaseSchema.index({ student: 1 });
purchaseSchema.index({ lecturer: 1 });
module.exports = mongoose.model("Purchase", purchaseSchema);
