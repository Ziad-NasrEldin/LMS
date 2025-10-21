const ECCoupon = require("../models/ec.couponModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");

exports.createCoupon = catchAsync(async (req, res, next) => {
  const { value, expirationDays, couponCode } = req.body;

  // Validate the target user exists
  const expirationDate = expirationDays
    ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000)
    : undefined;

  const couponData = {
    value,
    createdBy: req.user._id,
    expirationDate,
  };

  // If couponCode is provided, use it (for admin bulk/manual creation)
  if (couponCode) {
    couponData.couponCode = couponCode;
  } else {
    // Always generate a code if not provided (controller fallback)
    couponData.couponCode = await ECCoupon.generateCouponCode();
  }

  const coupon = await ECCoupon.create(couponData);

  res.status(201).json({
    status: "success",
    data: coupon,
  });
});

exports.getAllCoupons = catchAsync(async (req, res, next) => {
  const coupons = await ECCoupon.find()
    .populate("createdBy", "name email")
    .populate("usedBy", "name email")
    .sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: coupons.length,
    data: coupons,
  });
});

exports.getActiveCoupons = catchAsync(async (req, res, next) => {
  const coupons = await ECCoupon.find({
    isActive: true,
    expirationDate: { $gt: new Date() },
  })
    .populate("createdBy", "name email")
    .sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: coupons.length,
    data: coupons,
  });
});

exports.getUsedCoupons = catchAsync(async (req, res, next) => {
  const coupons = await ECCoupon.find({ isActive: false })
    .populate("createdBy", "name email")
    .populate("appliedToPurchase")
    .sort("-usedAt");

  res.status(200).json({
    status: "success",
    results: coupons.length,
    data: coupons,
  });
});

exports.getCouponById = catchAsync(async (req, res, next) => {
  const coupon = await ECCoupon.findById(req.params.id)
    .populate("createdBy", "name email")
    .populate("appliedToPurchase")
    .populate("usedBy", "name email");

  if (!coupon) {
    return next(new AppError("No coupon found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      coupon,
    },
  });
});

exports.useCoupon = catchAsync(async (req, res, next) => {
  const { couponCode, purchaseId } = req.body;

  if (!couponCode || !purchaseId) {
    return next(new AppError("Coupon code and purchase ID are required", 400));
  }

  const coupon = await ECCoupon.findOne({ couponCode });

  if (!coupon) {
    return next(new AppError("Invalid coupon code", 404));
  }

  if (!coupon.isActive) {
    return next(new AppError("This coupon has already been used", 400));
  }

  if (coupon.expirationDate < new Date()) {
    return next(new AppError("This coupon has expired", 400));
  }

  // Pass userId to markAsUsed
  const updatedCoupon = await coupon.markAsUsed(purchaseId, req.user._id);

  // Populate usedBy with name and email
  await updatedCoupon.populate("usedBy", "name email");

  res.status(200).json({
    status: "success",
    data: updatedCoupon,
  });
});

exports.validateCoupon = catchAsync(async (req, res, next) => {
  const { couponCode } = req.body;

  if (!couponCode) {
    return next(new AppError("Coupon code is required", 400));
  }

  const coupon = await ECCoupon.findOne({ couponCode });

  if (!coupon) {
    return next(new AppError("Invalid coupon code", 404));
  }

  if (!coupon.isActive) {
    return next(new AppError("This coupon has already been used", 400));
  }

  if (coupon.expirationDate < new Date()) {
    return next(new AppError("This coupon has expired", 400));
  }

  res.status(200).json({
    status: "success",
    data: {
      isValid: true,
      coupon,
    },
  });
});

exports.deleteCoupon = catchAsync(async (req, res, next) => {
  const coupon = await ECCoupon.findByIdAndDelete(req.params.id);
  if (!coupon) {
    return next(new AppError("No coupon found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    message: "Coupon deleted successfully",
    data: null,
  });
});

