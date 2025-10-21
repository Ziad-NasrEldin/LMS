const OTP = require("./otpModel");
const User = require("../../models/userModel");
const AppError = require("../appError");
const catchAsync = require("../catchAsync");
const { sendOTPEmail } = require("./emailService");

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate and send OTP to user's email
exports.sendOTP = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Email is required", 400));
  }

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("No user found with this email", 404));
  }

  // If user email is already verified, no need to send OTP
  if (user.isEmailVerified) {
    return res.status(200).json({
      status: "success",
      message: "Email is already verified",
      isEmailVerified: true
    });
  }

  // Generate a new OTP
  const otp = generateOTP();
  
  // Delete any existing OTP for this email
  await OTP.deleteMany({ email });
  
  // Save the new OTP
  await OTP.create({
    email,
    otp
  });

  // Send email using Resend
  try {
    console.log(`Attempting to send email to ${email} using Resend...`);
    
    // Check if Resend API key is set
    if (!process.env.RESEND_API_KEY) {
      console.warn('Resend API key missing. Check RESEND_API_KEY in .env');
      
      // For development, include OTP in response
      return res.status(200).json({
        status: "partial_success",
        message: "OTP generated but Resend API key missing. For testing purposes, OTP is included in response.",
        otp: otp
      });
    }
    
    await sendOTPEmail(email, otp);
    console.log(`Verification email sent to ${email} with OTP: ${otp}`);
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Still return a success response but include a warning about the email
    return res.status(200).json({
      status: "partial_success",
      message: "OTP generated but there was an issue sending the email. Check server logs for details.",
      otp: otp // Including OTP in response for testing purposes
    });
  }

  res.status(200).json({
    status: "success",
    message: "OTP sent to your email"
  });
});

// Verify OTP entered by user
exports.verifyOTP = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new AppError("Email and OTP are required", 400));
  }

  // Find the most recent OTP for this email
  const otpRecord = await OTP.findOne({ email }).sort({ createdAt: -1 });

  if (!otpRecord) {
    return next(new AppError("OTP expired or not found. Please request a new one", 400));
  }
  // Check if OTP matches
  if (otpRecord.otp !== otp) {
    return next(new AppError("Invalid OTP", 400));
  }

  await OTP.deleteMany({ email });

  // Update user's email verification status
  await User.findOneAndUpdate(
    { email },
    { isEmailVerified: true },
    { new: true }
  );

  res.status(200).json({
    status: "success",
    message: "Email verified successfully",
    isEmailVerified: true
  });
});