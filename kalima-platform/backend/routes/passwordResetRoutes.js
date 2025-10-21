const express = require("express");
const router = express.Router();
const passwordResetController = require("../controllers/passwordResetController");

// Route to request password reset (sends OTP to email)
router.post("/request", passwordResetController.requestPasswordReset);

// Route to verify OTP and get reset token
router.post("/verify-otp", passwordResetController.verifyOTP);

// Route to reset password with token
router.post("/reset", passwordResetController.resetPassword);

module.exports = router;