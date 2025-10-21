const express = require("express");
const ecPurchaseController = require("../controllers/ec.purchaseController");
const verifyJWT = require("../middleware/verifyJWT");
const authController = require("../controllers/authController");
const { uploadPaymentScreenshotToDisk } = require("../utils/upload files/uploadFiles");

const router = express.Router();

// Apply JWT verification to all routes
router.use(verifyJWT);

// Public routes (all authenticated users can access)
router
  .route("/")
  .get(authController.verifyRoles("Admin", "SubAdmin", "Moderator"), ecPurchaseController.getAllPurchases)
  .post(
    authController.verifyRoles("Parent", "Student", "Teacher"),
    uploadPaymentScreenshotToDisk,
    ecPurchaseController.createPurchase
  );

// Statistics route
router
  .route("/stats")
  .get(
    authController.verifyRoles("Admin"),
    ecPurchaseController.getPurchaseStats
  );

// Product purchase stats route
router.route("/product-purchase-stats").get(
  authController.verifyRoles("Admin"),
  ecPurchaseController.getProductPurchaseStats
);

router.route("/myPurchases").get(ecPurchaseController.getPurchasesByUser);
// Search by serial number
router.route("/search/serial/:serial").get(ecPurchaseController.searchBySerial);

// Get purchases by user name
router.route("/user/:userId").get(ecPurchaseController.getPurchasesByUser);
// Confirmation routes
router
  .route("/:id/confirm")
  .patch(
    authController.verifyRoles("Admin", "SubAdmin"),
    ecPurchaseController.confirmPurchase
  );

// router
//   .route("/:id/unconfirm")
//   .patch(
//     authController.verifyRoles("Admin", "SubAdmin", "Moderator"),
//     ecPurchaseController.unconfirmPurchase
//   );

// Individual purchase routes
router
  .route("/:id")
  .get(ecPurchaseController.getPurchaseById)
  .patch(
    authController.verifyRoles("Admin", "SubAdmin"),
    uploadPaymentScreenshotToDisk,
    ecPurchaseController.updatePurchase
  )
  .delete(
    authController.verifyRoles("Admin", "SubAdmin", "Moderator"),
    ecPurchaseController.deletePurchase
  );

module.exports = router;
