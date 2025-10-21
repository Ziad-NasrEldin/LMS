const express = require("express");
const router = express.Router();
const purchaseController = require("../controllers/purchaseController");
const verifyJWT = require("../middleware/verifyJWT");
const authController = require("../controllers/authController");

// Apply JWT verification to all routes
router.use(verifyJWT);

// Purchase points for a specific lecturer
/*
router.post("/points", 
  authController.verifyRoles("Student", "Parent"),
  purchaseController.purchaseLecturerPoints
);*/

// updated version
router.post(
  "/points",
  authController.verifyRoles("Student"),
  purchaseController.purchaseLecturerPoints
);

// Purchase a container with lecturer-specific points
router.post(
  "/container",
  authController.verifyRoles("Student", "Parent", "Teacher"),
  purchaseController.purchaseContainerWithPoints
);
// Purchase a package with General points
router.post(
  "/package",
  authController.verifyRoles("Student", "Parent"),
  purchaseController.purchasePackageWithPoints
);

// Get all purchases - admin only
router.get(
  "/",
  authController.verifyRoles("Admin", "Sub-Admin", "Moderator"),
  purchaseController.getAllPurchases
);

// Get current user's points balances across all lecturers
router.get(
  "/balances",
  authController.verifyRoles("Admin", "Student", "Parent"),
  purchaseController.getAllUserPointBalances
);

// Get all user's points balances across all lecturers
router.get(
  "/user/:userId/balances",
  authController.verifyRoles("Admin", "Sub-Admin", "Moderator"),
  purchaseController.getAllUserPointBalances
);

// Get current user's points balance with a specific lecturer
router.get(
  "/lecturer/:lecturerId/balance",
  authController.verifyRoles("Student", "Parent", "Teacher"),
  purchaseController.getLecturerPointsBalance
);

// Get points balance for a user with a specific lecturer
router.get(
  "/user/:userId/lecturer/:lecturerId/balance",
  authController.verifyRoles("Admin", "Sub-Admin", "Moderator"),
  purchaseController.getLecturerPointsBalance
);

// Get current user's purchases
router.get(
  "/history",
  authController.verifyRoles("Student", "Parent", "Teacher"),
  purchaseController.getPurchasesByUser
);

// Get all purchases for a specific user
router.get(
  "/user/:userId",
  authController.verifyRoles("Admin", "Sub-Admin", "Moderator"),
  purchaseController.getPurchasesByUser
);

// Get, update, or delete a specific purchase by ID
router
  .route("/:id")
  .get(purchaseController.getPurchaseById)
  .delete(
    authController.verifyRoles("Admin", "Sub-Admin", "Moderator"),
    purchaseController.deletePurchase
  );

module.exports = router;
