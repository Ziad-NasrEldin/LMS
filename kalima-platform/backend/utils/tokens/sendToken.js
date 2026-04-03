const crypto = require("crypto");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("./generateTokens");
const RefreshToken = require("../../models/refreshTokenModel");
const {
  shouldEnforceSingleSession,
} = require("../auth/sessionPolicy.js");

const sendToken = async (user, res) => {
  const userId = user._id;
  const userRole = user.role;
  const enforceSingleSession = shouldEnforceSingleSession({ role: userRole });

  if (enforceSingleSession) {
    const sessionId = crypto.randomUUID();
    const accessToken = generateAccessToken(userId, userRole, { sessionId });
    const refreshToken = generateRefreshToken(userId, userRole);

    const activeSession = await RefreshToken.findOneAndUpdate(
      { user: userId },
      {
        token: refreshToken,
        sessionId,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await RefreshToken.deleteMany({
      user: userId,
      _id: { $ne: activeSession._id },
    });

    return res.status(200).json({
      accessToken,
      sessionId,
    });
  }

  // Check if user already has a refresh token
  const existingToken = await RefreshToken.findOne({ user: userId });

  // Generate a new access token regardless
  const accessToken = generateAccessToken(userId, userRole);

  // If user already has a refresh token, reuse it instead of creating a new one
  if (existingToken) {
    return res.status(200).json({
      accessToken,
      message: "Welcome back! Using your existing session.",
    });
  }

  // If no existing token, generate a new refresh token
  const refreshToken = generateRefreshToken(userId, userRole);

  await RefreshToken.create({
    user: userId,
    token: refreshToken,
    sessionId: null,
  });

  return res.status(200).json({
    accessToken,
  });
};

module.exports = { sendToken };
