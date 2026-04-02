const bcrypt = require("bcrypt");
const User = require("../models/userModel.js");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { sendOTPEmail, EMAIL_TYPES } = require("../utils/emailVerification/emailService");

// Store OTP codes temporarily (in production, consider using a database)
const otpStore = new Map();

const isOtpDebugEnabled =
  String(process.env.EMAIL_DEBUG || "false").toLowerCase() === "true" &&
  String(process.env.NODE_ENV || "").toLowerCase() !== "production";

const otpDebugLog = (...args) => {
  if (isOtpDebugEnabled) {
    console.log(...args);
  }
};

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Request password reset - send OTP to user's email
exports.requestPasswordReset = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Email is required", 400));
  }

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("No user found with this email", 404));
  }

  // Generate a new OTP
  const otp = generateOTP();
  
  // Store OTP with expiration (10 minutes)
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10);
  
  otpStore.set(email, {
    otp,
    expiry,
    attempts: 0
  });
  
  // Send password reset OTP email through the shared email pipeline
  try {
    otpDebugLog('Sending password reset OTP to:', email);
    
    await sendOTPEmail(email, otp, {
      type: EMAIL_TYPES.password_reset,
    });
    
    otpDebugLog(`Password reset OTP sent to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }

  // Return success regardless of email sending status (for security)
  res.status(200).json({
    status: "success",
    message: "If a user with that email exists, a password reset code has been sent."
  });
});

// Verify OTP and allow password reset
exports.verifyOTP = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new AppError("Email and verification code are required", 400));
  }

  // Check if OTP exists and is valid
  const otpData = otpStore.get(email);
  
  if (!otpData) {
    return next(new AppError("Verification code expired or not found. Please request a new one", 400));
  }
  
  // Increment attempts
  otpData.attempts += 1;
  
  // Check if OTP is expired
  if (new Date() > otpData.expiry) {
    otpStore.delete(email);
    return next(new AppError("Verification code has expired. Please request a new one", 400));
  }
  
  // Check for too many attempts (5 max)
  if (otpData.attempts > 5) {
    otpStore.delete(email);
    return next(new AppError("Too many incorrect attempts. Please request a new code", 400));
  }
  
  // Check if OTP matches
  if (otpData.otp !== otp) {
    return next(new AppError("Invalid verification code", 400));
  }

  // Generate a temporary token for the password reset form
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  const resetExpiry = new Date();
  resetExpiry.setHours(resetExpiry.getHours() + 1); // Token valid for 1 hour
  
  // Store token with email
  otpStore.set(resetToken, { 
    email,
    expiry: resetExpiry
  });
  
  // Remove the original OTP entry
  otpStore.delete(email);

  res.status(200).json({
    status: "success",
    message: "Email verified successfully",
    resetToken
  });
});

// Reset password with token
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { resetToken, password, confirmPassword } = req.body;

  if (!resetToken || !password) {
    return next(new AppError("Reset token and new password are required", 400));
  }
  
  if (password !== confirmPassword) {
    return next(new AppError("Passwords do not match", 400));
  }
  
  // Check if token exists and is valid
  const tokenData = otpStore.get(resetToken);
  
  if (!tokenData) {
    return next(new AppError("Reset token is invalid or has expired", 400));
  }
  
  // Check if token is expired
  if (new Date() > tokenData.expiry) {
    otpStore.delete(resetToken);
    return next(new AppError("Reset token has expired", 400));
  }
  
  const { email } = tokenData;
  
  // Find the user
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("User not found", 404));
  }
  
  // Password requirements validation
  if (password.length < 8) {
    return next(new AppError("Password must be at least 8 characters long", 400));
  }
  
  // Hash and update the password
  const hashedPassword = await bcrypt.hash(password, 12);
  
  user.password = hashedPassword;
  await user.save();
  
  // Remove the token
  otpStore.delete(resetToken);
  
  // Log out from all devices (optional)
  const RefreshToken = require('../models/refreshTokenModel.js');
  await RefreshToken.deleteMany({ user: user._id });

  res.status(200).json({
    status: "success",
    message: "Password has been reset successfully"
  });
});
