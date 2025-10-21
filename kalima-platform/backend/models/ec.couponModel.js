const mongoose = require("mongoose");
const User = require("./userModel");

const couponSchema = new mongoose.Schema(
  {
    value: {
      type: Number,
      required: [true, "Coupon value is required"],
      min: [1, "Coupon value must be at least 1"],
    },
    couponCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      validate: {
        validator: function (v) {
          return /^[A-Z0-9]{8}$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid coupon code! Must be 8 alphanumeric characters.`,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expirationDate: {
      type: Date,
      required: [true, "Expiration date is required"],
    },
    usedAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator user is required"],
    },
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    appliedToPurchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ECPurchase",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for active coupons
couponSchema.index({ isActive: 1 });
couponSchema.index({ expirationDate: 1 });
couponSchema.index({ couponCode: 1 });

// Virtual for checking if coupon is expired
couponSchema.virtual("isExpired").get(function () {
  return this.expirationDate < new Date();
});

// Virtual for formatted expiration date (DD-MM-YYYY)
couponSchema.virtual("expirationDateFormatted").get(function () {
  if (!this.expirationDate) return null;
  const d = new Date(this.expirationDate);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
});

// Pre-save hook to generate coupon code if not provided
couponSchema.pre("save", async function (next) {
  if (!this.couponCode) {
    this.couponCode = await this.constructor.generateCouponCode();
  }

  // Set default expiration (30 days from creation) if not provided
  if (!this.expirationDate) {
    const defaultExpiration = new Date();
    defaultExpiration.setDate(defaultExpiration.getDate() + 30);
    this.expirationDate = defaultExpiration;
  }

  next();
});

// Static method to generate random coupon code
couponSchema.statics.generateCouponCode = async function () {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code;
  let exists;

  do {
    code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    exists = await this.findOne({ couponCode: code });
  } while (exists);

  return code;
};

// Method to mark coupon as used
couponSchema.methods.markAsUsed = function (purchaseId, userId) {
  this.isActive = false;
  this.usedAt = new Date();
  this.appliedToPurchase = purchaseId;
  if (userId) this.usedBy = userId;
  return this.save();
};

const ECCoupon = mongoose.model("ECCoupon", couponSchema);

module.exports = ECCoupon;
