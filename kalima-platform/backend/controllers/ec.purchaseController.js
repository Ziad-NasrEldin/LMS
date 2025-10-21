const ECPurchase = require("../models/ec.purchaseModel");
const ECCoupon = require("../models/ec.couponModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const QueryFeatures = require("../utils/queryFeatures");
const ECProduct = require("../models/ec.productModel");
const mongoose = require("mongoose");
const { sendEmail } = require("../utils/emailVerification/emailService");

// Get all purchases
exports.getAllPurchases = catchAsync(async (req, res, next) => {
  let query = ECPurchase.find();
  let searchApplied = false;
  let searchFilter = {};

  // Handle search parameter
  if (req.query.search) {
    const searchTerm = req.query.search;
    const searchRegex = new RegExp(searchTerm, 'i'); // Case-insensitive

    searchFilter.$or = [
      { productName: searchRegex },
      { userName: searchRegex },
      { purchaseSerial: searchRegex },
      { numberTransferredFrom: searchRegex },
      { 'createdBy.email': searchRegex },
      { 'createdBy.name': searchRegex },
      { 'productId.title': searchRegex },
      { 'productId.serial': searchRegex }
    ];

    searchApplied = true;
    delete req.query.search;
  }

  // Handle date filter (exact day)
  if (req.query.date) {
    const inputDate = new Date(req.query.date);
    if (!isNaN(inputDate)) {
      const startOfDay = new Date(inputDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(inputDate.setHours(23, 59, 59, 999));

      searchFilter.createdAt = { $gte: startOfDay, $lte: endOfDay };
      searchApplied = true;
    }
    delete req.query.date;
  }

  // Apply combined search + date filter
  if (searchApplied) {
    query = query.find(searchFilter);
  }

  const features = new QueryFeatures(query, req.query)
    .filter()
    .sort()
    .paginate();

  // Count query for pagination
  let totalQuery = ECPurchase.find();
  if (searchApplied) {
    totalQuery = totalQuery.find(searchFilter);
  }

  const totalPurchases = await ECPurchase.countDocuments(
    totalQuery.getFilter ? totalQuery.getFilter() : totalQuery._conditions
  );

  // Populate & execute
  const purchases = await features.query.populate([
    { path: "createdBy", select: "name email role phoneNumber" },
    { path: "confirmedBy", select: "name email role" },
    { path: "adminNoteBy", select: "name" },
    { path: "couponCode", select: "couponCode value expirationDate" },
    {
      path: "productId",
      select: "title serial priceAfterDiscount section thumbnail",
    },
  ]);

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  res.status(200).json({
    status: "success",
    results: purchases.length,
    totalPurchases,
    totalPages: Math.ceil(totalPurchases / limit),
    currentPage: page,
    data: {
      purchases,
    },
  });
});

// Get purchase by ID
exports.getPurchaseById = catchAsync(async (req, res, next) => {
  const purchase = await ECPurchase.findById(req.params.id).populate([
    { path: "createdBy", select: "name email role" },
    { path: "confirmedBy", select: "name email role" },
    { path: "adminNoteBy", select: "name" }, // populate the new field
    { path: "couponCode", select: "couponCode value expirationDate" },

    {
      path: "productId",
      select: "title serial priceAfterDiscount section thumbnail",
    },
  ]);

  if (!purchase) {
    return next(new AppError("No purchase found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      purchase,
    },
  });
});

// Create new purchase
exports.createPurchase = catchAsync(async (req, res, next) => {
  // Handle payment screenshot upload
  let paymentScreenShotPath = null;
  if (req.file && req.file.fieldname === "paymentScreenShot") {
    paymentScreenShotPath = req.file.path;
    req.body.paymentScreenShot = paymentScreenShotPath;
  } else if (!req.body.paymentScreenShot) {
    // If not uploaded, set to null (model will error if required)
    req.body.paymentScreenShot = null;
  }
  const product = await ECProduct.findById(req.body.productId).populate(
    "section",
    "number"
  );
  if (!product) {
    return next(new AppError("No product found with that ID", 404));
  }

  if (req.body.confirmedBy) {
    return next(new AppError("Purchase cannot be confirmed at creation", 400));
  }
  let coupon;
  if (req.body.couponCode) {
    coupon = await ECCoupon.findOne({
      couponCode: req.body.couponCode.toString(),
    });
    if (!coupon) {
      return next(new AppError("Invalid or expired coupon code", 400));
    }
    // Check if the coupon is already used
    if (coupon.isActive === false) {
      return next(new AppError("Coupon code has already been used", 400));
    }
  }
  // Set the creator
  req.body.createdBy = req.user._id;
  req.body.userName = req.user.name;
  req.body.productName = product.title;
  req.body.price = product.priceAfterDiscount;
  req.body.paymentNumber = product.paymentNumber;
  req.body.finalPrice = req.body.price * 1 - (coupon ? coupon.value * 1 : 0);

  // Set coupon ID instead of coupon code string
  if (coupon) {
    console.log("Coupon found:", coupon);
    req.body.couponCode = coupon._id;
  } else {
    delete req.body.couponCode; // Remove couponCode if no coupon is used
  }

  if (!req.user.userSerial) {
    return next(
      new AppError("User serial is required to create a purchase", 400)
    );
  }
  // Get section number robustly from product data
  let sectionNumber = null;
  if (product.section && typeof product.section === "object" && product.section.number) {
    sectionNumber = product.section.number;
  } else if (product.sectionNumber) {
    sectionNumber = product.sectionNumber;
  }
  if (!sectionNumber) {
    return next(new AppError("Product section number is required", 400));
  }
  if (!product.serial) {
    return next(new AppError("Product serial is required", 400));
  }

  req.body.purchaseSerial = `${req.user.userSerial}-${sectionNumber}-${product.serial}`;

  // Support notes and adminNotes fields
  if (typeof req.body.notes === "undefined") req.body.notes = null;
  if (typeof req.body.adminNotes === "undefined") req.body.adminNotes = null;
  if (typeof req.body.adminNoteBy === "undefined") req.body.adminNoteBy = null;

  const purchase = await ECPurchase.create(req.body); // Populate the created purchase
  if (!purchase) {
    return next(new AppError("Purchase creation failed", 400));
  }
  if (purchase && coupon) {
    // Mark the coupon as used
    await coupon.markAsUsed(purchase._id, req.user._id);
  }

  // --- Referral successful invite logic ---
  // Only increment inviter's successfulInvites if this is the first purchase for the referred user
  if (req.user.referredBy) {
    const purchaseCount = await ECPurchase.countDocuments({ createdBy: req.user._id });
    if (purchaseCount === 1) {
      const { recalculateInviterSuccessfulInvites } = require("./ec.referralController");
      await recalculateInviterSuccessfulInvites(req.user.referredBy);
    }
  }
  // --- End referral logic ---

  // Send email to user after successful purchase
  try {
    await sendEmail(
      req.user.email,
      "Your Purchase Confirmation",
      `<div style='font-family: Arial, sans-serif;'>
        <h2>Thank you for your purchase!</h2>
        <p>Dear ${req.user.name},</p>
        <p>Your purchase (<b>${purchase.purchaseSerial}</b>) was successful.</p>
        <p>Product: <b>${purchase.productName}</b></p>
        <p>Amount Paid: <b>${purchase.finalPrice}</b></p>
        <p>your order is being processed by Fekra team  .</p>
        <p>If you have any questions, please contact support.</p>
        <br><p>Best regards,<br>Fekra Team</p>
      </div>`
    );
  } catch (err) {
    console.error("Failed to send purchase confirmation email:", err);
  }

  res.status(201).json({
    status: "success",
    data: {
      purchase,
      coupon: coupon ? coupon._id : null, // Return coupon ID if used
    },
  });
});

// Update purchase
exports.updatePurchase = catchAsync(async (req, res, next) => {
  // Get the current purchase to compare changes
  const oldPurchase = await ECPurchase.findById(req.params.id);

  if (!oldPurchase) {
    return next(new AppError("No purchase found with that ID", 404));
  }

  // Detect if adminNote is being added or changed
  const isAdminNoteChanged =
    req.body.adminNotes && req.body.adminNotes !== oldPurchase.adminNotes;

  if (isAdminNoteChanged) {
    req.body.adminNoteBy = req.user._id; // whoever is logged in
  }

  // Your existing update logic
  const purchase = await ECPurchase.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate([
    { path: "createdBy", select: "name email role" },
    { path: "confirmedBy", select: "name email role" },
    { path: "adminNoteBy", select: "name" }, // populate the new field
    {
      path: "productId",
      select: "title serial priceAfterDiscount section thumbnail",
    },
  ]);

  res.status(200).json({
    status: "success",
    data: { purchase },
  });
});


// Confirm purchase
exports.confirmPurchase = catchAsync(async (req, res, next) => {
  const purchase = await ECPurchase.findByIdAndUpdate(
    req.params.id,
    {
      confirmed: true,
      confirmedBy: req.user._id,
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate([
    { path: "createdBy", select: "name email role" },
    { path: "confirmedBy", select: "name email role" },
    {
      path: "productId",
      select: "title serial priceAfterDiscount section thumbnail",
    },
  ]);

  if (!purchase) {
    return next(new AppError("No purchase found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      purchase,
    },
  });
});

// Delete purchase
exports.deletePurchase = catchAsync(async (req, res, next) => {
  const purchase = await ECPurchase.findByIdAndDelete(req.params.id);

  if (!purchase) {
    return next(new AppError("No purchase found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Get purchase statistics
exports.getPurchaseStats = catchAsync(async (req, res, next) => {
  // 1) إحصائيات عامة
  const stats = await ECPurchase.aggregate([
    {
      $group: {
        _id: null,
        totalPurchases: { $sum: 1 },
        confirmedPurchases: {
          $sum: { $cond: [{ $eq: ["$confirmed", true] }, 1, 0] },
        },
        pendingPurchases: {
          $sum: { $cond: [{ $eq: ["$confirmed", false] }, 1, 0] },
        },
        totalRevenue: { $sum: "$finalPrice" },
        confirmedRevenue: {
          $sum: { $cond: [{ $eq: ["$confirmed", true] }, "$finalPrice", 0] },
        },
        averagePrice: { $avg: "$finalPrice" },
      },
    },
    {
      $project: {
        totalPurchases: 1,
        confirmedPurchases: 1,
        pendingPurchases: 1,
        totalRevenue: 1,
        confirmedRevenue: 1,
        averagePrice: { $round: ["$averagePrice", 2] },
      },
    },
  ]);

  // 2) إحصائيات شهرية (آخر 12 شهر)
  const monthlyStats = await ECPurchase.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        count: { $sum: 1 },
        revenue: { $sum: "$finalPrice" },
        confirmedCount: {
          $sum: { $cond: [{ $eq: ["$confirmed", true] }, 1, 0] },
        },
        confirmedRevenue: {
          $sum: { $cond: [{ $eq: ["$confirmed", true] }, "$finalPrice", 0] },
        },
      },
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },
  ]);

  // 3) إحصائيات اليوم المحدد (إن وُجد date)
  let dailyStats = null;
  if (req.query.date) {
    const targetDate = new Date(req.query.date);
    if (!isNaN(targetDate)) {
      const startOfDay = new Date(targetDate).setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate).setHours(23, 59, 59, 999);

      const [day] = await ECPurchase.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(startOfDay), $lte: new Date(endOfDay) },
          },
        },
        {
          $group: {
            _id: null,
            totalPurchases: { $sum: 1 },
            confirmedPurchases: {
              $sum: { $cond: [{ $eq: ["$confirmed", true] }, 1, 0] },
            },
            pendingPurchases: {
              $sum: { $cond: [{ $eq: ["$confirmed", false] }, 1, 0] },
            },
            totalRevenue: { $sum: "$finalPrice" },
            confirmedRevenue: {
              $sum: { $cond: [{ $eq: ["$confirmed", true] }, "$finalPrice", 0] },
            },
            averagePrice: { $avg: "$finalPrice" },
          },
        },
        {
          $project: {
            totalPurchases: 1,
            confirmedPurchases: 1,
            pendingPurchases: 1,
            totalRevenue: 1,
            confirmedRevenue: 1,
            averagePrice: { $round: ["$averagePrice", 2] },
          },
        },
      ]);

      dailyStats = day || {
        totalPurchases: 0,
        confirmedPurchases: 0,
        pendingPurchases: 0,
        totalRevenue: 0,
        confirmedRevenue: 0,
        averagePrice: 0,
      };
    }
  }

  // 4) الردّ
  res.status(200).json({
    status: "success",
    data: {
      overview: stats[0] || {
        totalPurchases: 0,
        confirmedPurchases: 0,
        pendingPurchases: 0,
        totalRevenue: 0,
        confirmedRevenue: 0,
        averagePrice: 0,
      },
      monthlyStats,
      // ستُرجع إما كائن stats لليوم المحدد أو null إذا لم يُرسل date
      dailyStats,
    },
  });
});

// Get purchases by user
exports.getPurchasesByUser = catchAsync(async (req, res, next) => {
  if (["Parent", "Student", "Teacher"].includes(req.user.role)) {
    req.body.userId = req.user._id;
  } else {
    if (req.params.userId) {
      req.body.userId = req.params.userId;
    }
  }
  if (!req.body.userId) {
    return next(new AppError("User ID is required to get purchases", 400));
  }
  // Build base query with userName filter
  let query = ECPurchase.find({ createdBy: req.body.userId });

  // Apply QueryFeatures for filtering, sorting, and pagination
  const features = new QueryFeatures(query, req.query)
    .filter()
    .sort()
    .paginate();

  // Get total count for pagination (before applying pagination)
  const totalPurchases = await ECPurchase.countDocuments({
    createdBy: req.body.userId,
    ...features.query.getFilter(),
  });

  // Apply population and execute query
  const purchases = await features.query.populate([
    { path: "createdBy", select: "name email role" },
    { path: "confirmedBy", select: "name email role" },
    { path: "couponCode", select: "couponCode value expirationDate" },
    {
      path: "productId",
      select: "title serial priceAfterDiscount section thumbnail",
    },
  ]);

  // Calculate pagination info
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  res.status(200).json({
    status: "success",
    results: purchases.length,
    totalPurchases,
    totalPages: Math.ceil(totalPurchases / limit),
    currentPage: page,
    data: {
      purchases,
    },
  });
});

// Search purchases by serial
exports.searchBySerial = catchAsync(async (req, res, next) => {
  const { serial } = req.params;
  const purchase = await ECPurchase.findOne({
    purchaseSerial: serial,
  }).populate([
    { path: "createdBy", select: "name email role" },
    { path: "confirmedBy", select: "name email role" },
    { path: "couponCode", select: "couponCode value expirationDate" },
    {
      path: "productId",
      select: "title serial priceAfterDiscount section thumbnail",
    },
  ]);

  if (!purchase) {
    return next(new AppError("No purchase found with that serial number", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      purchase,
    },
  });
});

// Get stats for every product: product name, section, total value, and number of purchases
exports.getProductPurchaseStats = catchAsync(async (req, res, next) => {
  const stats = await ECPurchase.aggregate([
    {
      $group: {
        _id: "$productId",
        totalPurchases: { $sum: 1 },
        totalValue: { $sum: "$finalPrice" },
        couponIds: { $push: "$couponCode" }, // collect coupon IDs for later lookup
      },
    },
    {
      $lookup: {
  from: "ecproducts",
        localField: "_id",
        foreignField: "_id",
        as: "productInfo"
      }
    },
    { $unwind: "$productInfo" },
    // Lookup all coupons used for this product's purchases
    {
      $lookup: {
        from: "eccoupons",
        let: { couponIds: "$couponIds" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $in: ["$_id", "$$couponIds"] },
                  { $ne: ["$_id", null] }
                ]
              }
            }
          },
          { $group: { _id: null, totalCouponValue: { $sum: "$value" } } }
        ],
        as: "couponStats"
      }
    },
    {
      $addFields: {
        totalCouponValue: {
          $ifNull: [{ $arrayElemAt: ["$couponStats.totalCouponValue", 0] }, 0]
        }
      }
    },
    {
      $project: {
        _id: 0,
        productId: "$_id",
        productName: "$productInfo.title",
        productSection: "$productInfo.section",
        totalPurchases: 1,
        totalValue: 1,
        totalCouponValue: 1
      }
    },
    { $sort: { totalPurchases: -1 } }
  ]);

  res.status(200).json({
    status: "success",
    data: stats,
  });
});
