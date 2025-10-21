const {
  generateAccessToken,
  generateRefreshToken,
} = require("./generateTokens");
const RefreshToken = require("../../models/refreshTokenModel");

const sendToken = async (user, res) => {
  const userId = user._id;
  const userRole = user.role;

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
  });

  return res.status(200).json({
    accessToken,
  });
};

module.exports = { sendToken };
