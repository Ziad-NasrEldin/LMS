// controllers/messageController.js
const Parent = require("../models/parentModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// Mock WhatsApp service (replace with actual WhatsApp API integration)
const whatsappService = {
  sendMessage: async (phoneNumber, message) => {
    console.log(`[WhatsApp Mock] Sending to ${phoneNumber}: ${message}`);
    // In real implementation, this would call the WhatsApp API
    return { success: true };
  }
};

exports.sendBulkMessages = catchAsync(async (req, res, next) => {
  const { message, studentIds } = req.body;
  const sender = req.user; // The teacher/assistant sending the message

  if (!message || !studentIds || !Array.isArray(studentIds)) {
    return next(new AppError("Message and student IDs array are required", 400));
  }

  // Get parents of the specified students
  const parents = await Parent.find({
    children: { $in: studentIds }
  }).select("phoneNumber");

  if (!parents || parents.length === 0) {
    return next(new AppError("No parents found for the specified students", 404));
  }

  
  const results = await Promise.all(
    parents.map(async parent => {
      try {
        // Personalize message - you can add more variables here
        const personalizedMessage = message
          .replace(/{phone}/g, parent.phoneNumber)
          .replace(/{sender}/g, sender.name);

        const result = await whatsappService.sendMessage(
          parent.phoneNumber,
          personalizedMessage
        );
        
        return {
          phoneNumber: parent.phoneNumber,
          success: result.success,
          error: result.success ? null : "Failed to send message"
        };
      } catch (error) {
        return {
          phoneNumber: parent.phoneNumber,
          success: false,
          error: error.message
        };
      }
    })
  );

  res.status(200).json({
    status: "success",
    sent: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  });
});