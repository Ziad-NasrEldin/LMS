const express = require("express");
const notificationController = require("../controllers/notificationController");
const verifyJWT = require("../middleware/verifyJWT");

const router = express.Router();

// Apply JWT verification middleware to all routes
router.use(verifyJWT);

// Get unsent notifications for logged in user
router.get("/unsent", notificationController.getUnsentNotifications);

// Get all notifications for logged in user
router.get("/", notificationController.getAllNotifications);

// Mark a notification as read
router.patch("/:notificationId/read", notificationController.markAsRead);

module.exports = router;
