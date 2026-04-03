const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  sessionId: {
    type: String,
    default: null,
  },
});

refreshTokenSchema.index({ user: 1 });
refreshTokenSchema.index({ user: 1, sessionId: 1 });

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
module.exports = RefreshToken;
