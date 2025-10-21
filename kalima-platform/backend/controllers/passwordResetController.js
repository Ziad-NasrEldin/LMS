const bcrypt = require("bcrypt");
const User = require("../models/userModel.js");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { Resend } = require('resend');

// Initialize Resend with API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

// Store OTP codes temporarily (in production, consider using a database)
const otpStore = new Map();

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
  
  // Send email using Resend
  try {
    const fromEmail = 'Kalima Team <noreply@kalima-edu.com>';
    
    console.log('Sending password reset OTP to:', email);
    
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Password Reset Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p style="color: #555; font-size: 16px;">We received a request to reset your password. Please use the following code to verify your identity:</p>
          <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #777; font-size: 14px;">This code will expire in 10 minutes.</p>
          <p style="color: #777; font-size: 14px;">If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
      `,
    });
    
    console.log(`Password reset OTP sent to ${email}`);
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