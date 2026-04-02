const mongoose = require("mongoose");

const levelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter level name in English"],
      trim: true,
    },
    nameAr: {
      type: String,
      required: [true, "Please enter level name in Arabic"],
      trim: true,
    },
    kind: {
      type: String,
      enum: ["stage", "grade"],
      required: true,
      default: "grade",
    },
    parentLevel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Level",
      default: null,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

levelSchema.pre("validate", function (next) {
  if (this.kind === "stage") {
    this.parentLevel = null;
  }

  if (this.kind === "grade" && !this.parentLevel) {
    this.invalidate("parentLevel", "Grade levels must belong to a stage");
  }

  next();
});

module.exports = mongoose.model("Level", levelSchema);
