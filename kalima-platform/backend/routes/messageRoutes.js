// routes/messageRoutes.js
const express = require("express");
const messageController = require("../controllers/messageController");
const authController = require("../controllers/authController");
const verifyJWT = require("../middleware/verifyJWT");

const router = express.Router();

// Apply JWT verification middleware
router.use(verifyJWT);

// Bulk messaging endpoint
router.post(
  "/bulk",
  authController.verifyRoles("Admin", "Sub-Admin", "Moderator", "Lecturer", "Assistant"),
  messageController.sendBulkMessages
);

module.exports = router;