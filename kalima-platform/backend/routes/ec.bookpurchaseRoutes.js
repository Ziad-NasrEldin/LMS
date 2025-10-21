const express = require("express");
const ecBookPurchaseController = require("../controllers/ec.bookpurchaseController");
const verifyJWT = require("../middleware/verifyJWT");
const authController = require("../controllers/authController");
const { uploadPaymentScreenshotToDisk } = require("../utils/upload files/uploadFiles");

const router = express.Router();

// Apply JWT verification to all routes
router.use(verifyJWT);

router
  .route("/")
  .get(ecBookPurchaseController.getAllBookPurchases)
  .post(
    authController.verifyRoles("Parent", "Student", "Teacher"),
    uploadPaymentScreenshotToDisk,
    ecBookPurchaseController.createBookPurchase
  );

// Statistics route
router
  .route("/stats")
  .get(
    authController.verifyRoles("Admin"),
    ecBookPurchaseController.getBookPurchaseStats
  );

// Get current user's book purchases
router.get("/myPurchases", ecBookPurchaseController.getBookPurchaseByUser);
//
router.get("/:userId", ecBookPurchaseController.getBookPurchaseByUser);

// Confirmation route
router
  .route("/:id/confirm")
  .patch(
    authController.verifyRoles("Admin", "SubAdmin", "Moderator"),
    ecBookPurchaseController.confirmBookPurchase
  );

// Individual book purchase routes
router
  .route("/:id")
  .get(ecBookPurchaseController.getBookPurchaseById)
  .patch(
    authController.verifyRoles("Admin", "SubAdmin", "Moderator"),
    uploadPaymentScreenshotToDisk,
    ecBookPurchaseController.updateBookPurchase
  )
  .delete(
    authController.verifyRoles("Admin", "SubAdmin"),
    ecBookPurchaseController.deleteBookPurchase
  );

module.exports = router;

// Public Routes (All authenticated users):
// Create, view, and search purchases
// Get personal purchases

// Management Routes (Admin/SubAdmin/Moderator):
// Confirm, update purchases
// Get statistics

// Admin-only Routes:
// Delete purchases