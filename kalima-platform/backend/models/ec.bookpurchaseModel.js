const mongoose = require("mongoose");
const ECPurchase = require("./ec.purchaseModel");

// Only define the additional fields for the book purchase
const bookPurchaseSchema = new mongoose.Schema(
  {
    nameOnBook: {
      type: String,
      required: [true, "Name on book is required"],
      trim: true,
    },
    numberOnBook: {
      type: String,
      required: [true, "Number is required"],
      trim: true,
    },
    seriesName: {
      type: String,
      required: [true, "Series name is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Inherit from ECPurchase using discriminator
const ECBookPurchase = ECPurchase.discriminator("ECBookPurchase", bookPurchaseSchema);

module.exports = ECBookPurchase;