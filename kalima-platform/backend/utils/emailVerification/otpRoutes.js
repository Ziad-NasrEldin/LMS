const express = require("express");
const router = express.Router();
const otpController = require("./otpController");

// Route to send OTP to user's email
router.post("/send", otpController.sendOTP);

// Route to verify OTP
router.post("/verify", otpController.verifyOTP);

module.exports = router;