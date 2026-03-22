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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Level", levelSchema);
