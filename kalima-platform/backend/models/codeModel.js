const mongoose = require("mongoose");

const codeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,  // This already creates an index
  },
  type: {
    type: String,
    enum: ["general", "specific", "promo"],
    required: true,
  },
  pointsAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  lecturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lecturer",
    required: [
      function () {
        return this.type === "specific";
      },
      "Lecturer ID is required for specific codes",
    ],
  },
  isRedeemed: {
    type: Boolean,
    default: false,
  },
  redeemedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  redeemedAt: {
    type: Date,
    default: null,
  }
});

codeSchema.methods.generateCode = function () {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  // Get current time in nanoseconds (as string)
  const timestamp = Date.now().toString(36).toUpperCase(); // base36 for compactness
  // Generate random part to fill up to 10 characters
  let randLength = 10 - timestamp.length;
  let randPart = '';
  for (let i = 0; i < randLength; i++) {
    randPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Combine timestamp and random part, then shuffle for extra randomness
  let codeArr = (timestamp + randPart).split('');
  for (let i = codeArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [codeArr[i], codeArr[j]] = [codeArr[j], codeArr[i]];
  }
  this.code = codeArr.join('');
};

const Code = mongoose.model("Code", codeSchema);
module.exports = Code;
