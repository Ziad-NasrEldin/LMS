const mongoose = require("mongoose");

const pricingRuleSchema = new mongoose.Schema(
  {
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
    center: {
      // Optional: Rule can apply to a specific center or globally if null
      type: mongoose.Schema.Types.ObjectId,
      ref: "Center",
      default: null,
    },
    dailyPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    multiSessionPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    multiSessionCount: {
      // Number of sessions included in the multi-session price
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    description: {
      // Optional description for the rule
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index to ensure only one pricing rule exists for a specific combination
// Null values are treated distinctly in unique indexes, allowing for global rules (center: null)
// alongside center-specific rules.
pricingRuleSchema.index(
  { lecturer: 1, subject: 1, level: 1, center: 1 },
  { unique: true }
);

const PricingRule = mongoose.model("PricingRule", pricingRuleSchema);

module.exports = PricingRule;
