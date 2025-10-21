const express = require("express");
const couponController = require("../controllers/ec.couponController");
const authController = require("../controllers/authController");
const verifyJWT = require("../middleware/verifyJWT");

const router = express.Router();

// Protect all routes after this middleware
router.use(verifyJWT);

// Admin and subadmin can create coupons
router.post(
  "/",
  authController.verifyRoles("Admin", "SubAdmin"),
  couponController.createCoupon
);


router.get(
  "/",
  authController.verifyRoles("Admin", "SubAdmin", "Moderator"),
  couponController.getAllCoupons
);

// Get active coupons
router.get(
  "/active",
  authController.verifyRoles("Admin", "SubAdmin", "Moderator"),
  couponController.getActiveCoupons
);

// Get used coupons
router.get(
  "/used",
  authController.verifyRoles("Admin", "SubAdmin", "Moderator"),
  couponController.getUsedCoupons
);

// Use a coupon
router.post(
  "/use",
  authController.verifyRoles("Parent", "Student", "Teacher"),
  couponController.useCoupon
);

// Validate a coupon (available to students)
router.post(
  "/validate",
  authController.verifyRoles("student", "parent", "teacher", "admin", "subadmin", "moderator"),
  couponController.validateCoupon
);


// Delete coupon (admin and subadmin only)
router.delete(
  "/:id",
  authController.verifyRoles("Admin", "SubAdmin"),
  couponController.deleteCoupon
);

// Get coupon by ID
router.get(
  "/:id",
  authController.verifyRoles("Admin", "SubAdmin", "Moderator"),
  couponController.getCouponById
);

module.exports = router;