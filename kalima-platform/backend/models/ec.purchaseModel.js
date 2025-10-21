const mongoose = require("mongoose");

const ecPurchaseSchema = new mongoose.Schema(
  {
    // User information
    userName: {
      type: String,
      required: [true, "User name is required"],
      trim: true,
    },
    // Product information
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },

    // Product reference
    productId: {
      type: mongoose.Schema.Types.ObjectId,
  ref: "ECProduct",
      required: [true, "Product ID is required"],
    },

    // Pricing
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },

    // Payment number that the user transfer from
    numberTransferredFrom: {
      type: String,
      required: [true, "Transfer number is required"],
      trim: true,
    },
    // Payment number that the user transfer to
    paymentNumber: {
      type: String,
      required: [true, "Payment Number  number is required"],
      trim: true,
    },

    // Purchase serial number ("userserial"-"section number"-"product serial")
    purchaseSerial: {
      type: String,
      required: [true, "Purchase serial is required"],
      unique: false, // Allow duplicates
      trim: true,
    },

    // Confirmation status
    confirmed: {
      type: Boolean,
      default: false,
    },

    // id of the user do the purchase
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by user is required"],
    },

    // User who updated or confirmed this record
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Payment screenshot (local file path)
    paymentScreenShot: {
      type: String,
      required: [true, "Payment screenshot is required"],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
    adminNotes: {
      type: String,
      trim: true,
      default: null,
    },
    adminNoteBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    couponCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ECCoupon",
      default: null,
    },
    finalPrice: {
      type: Number,
      required: [true, "Final price is required"],
      min: [0, "Final price cannot be negative"],
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ecPurchaseSchema.index({ userName: 1 });
// ecPurchaseSchema.index({ productName: 1 });
ecPurchaseSchema.index({ productId: 1 });
ecPurchaseSchema.index({ confirmed: 1 });
ecPurchaseSchema.index({ createdBy: 1 });
ecPurchaseSchema.index({ createdAt: -1 });

// Remove unique index for purchaseSerial if present
// ecPurchaseSchema.index({ purchaseSerial: 1 }, { unique: true });

// Virtual to get formatted creation date
ecPurchaseSchema.virtual("formattedCreatedAt").get(function () {
  return this.createdAt ? this.createdAt.toLocaleDateString() : null;
});

module.exports = mongoose.model("ECPurchase", ecPurchaseSchema);
