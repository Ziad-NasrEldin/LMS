const Notification = require("../models/notification");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

/**
 * Get all unsent notifications for a user
 */
exports.getUnsentNotifications = catchAsync(async (req, res, next) => {
  // Get user ID from authenticated user
  const userId = req.user._id;

  console.log(`Fetching unsent notifications for user ${userId}`);

  // Find all unsent notifications for this user
  const unsentNotifications = await Notification.find({
    userId,
    isSent: false,
  }).sort({ createdAt: -1 });

  console.log(`Found ${unsentNotifications.length} unsent notifications`);

  // Mark these notifications as sent
  if (unsentNotifications.length > 0) {
    await Notification.updateMany({ userId, isSent: false }, { isSent: true });
  }

  // Return the notifications
  res.status(200).json({
    status: "success",
    data: unsentNotifications.map((notification) => ({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      subjectId: notification.relatedId,
      notificationId: notification._id,
      createdAt: notification.createdAt,
    })),
  });
});

/**
 * Get all notifications for a user
 */
exports.getAllNotifications = catchAsync(async (req, res, next) => {
  // Get user ID from authenticated user
  const userId = req.user._id;

  // Find all notifications for this user
  const notifications = await Notification.find({
    userId,
  })
    .sort({ createdAt: -1 })
    .limit(50);

  // Return the notifications
  res.status(200).json({
    status: "success",
    data: notifications.map((notification) => ({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      subjectId: notification.relatedId,
      notificationId: notification._id,
      createdAt: notification.createdAt,
      read: notification.read || false,
    })),
  });
});

/**
 * Mark a notification as read
 */
exports.markAsRead = catchAsync(async (req, res, next) => {
  const { notificationId } = req.params;
  const userId = req.user._id;

  console.log(
    `Marking notification ${notificationId} as read for user ${userId}`
  );

  // Find the notification and ensure it belongs to the user
  const notification = await Notification.findOne({
    _id: notificationId,
    userId,
  });

  if (!notification) {
    return next(
      new AppError("Notification not found or does not belong to you", 404)
    );
  }

  // Mark as read
  notification.read = true;
  await notification.save();

  res.status(200).json({
    status: "success",
    message: "Notification marked as read",
  });
});
