const express = require("express");
const revenueController = require("../controllers/revenueController");
const authController = require("../controllers/authController");
const verifyJWT = require("../middleware/verifyJWT");

const router = express.Router();

// Apply JWT verification to all revenue routes
router.use(verifyJWT);

// Protect revenue routes - only accessible by admin roles
router.use(authController.verifyRoles("Admin", "Sub-Admin", "Moderator"));

router.get("/", revenueController.calculateRevenue);
router.get("/breakdown", revenueController.calculateRevenueBreakdown);

module.exports = router;
