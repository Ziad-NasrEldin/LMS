const mongoose = require("mongoose");
const Purchase = require("../models/purchaseModel");
const Container = require("../models/containerModel");
const Student = require("../models/studentModel");
const Parent = require("../models/parentModel");
const User = require("../models/userModel");
const Teacher = require("../models/teacherModel");
const Lecturer = require("../models/lecturerModel"); // Add this import
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const studentLectureAccess = require("../models/studentLectureAccessModel");

const QueryFeatures = require("../utils/queryFeatures");

const ROLE_MODEL_MAP = {
  Student,
  Parent,
  Teacher,
};

const resolvePointsUserModel = async ({ userId, session, roleHint, populate }) => {
  const applyQueryOptions = (query) => {
    let nextQuery = query;

    if (session) {
      nextQuery = nextQuery.session(session);
    }

    if (populate) {
      nextQuery = nextQuery.populate(populate);
    }

    return nextQuery;
  };

  const findByModel = async (Model) => {
    if (!Model) {
      return null;
    }

    return applyQueryOptions(Model.findById(userId));
  };

  if (roleHint && ROLE_MODEL_MAP[roleHint]) {
    const hintedUser = await findByModel(ROLE_MODEL_MAP[roleHint]);
    if (hintedUser) {
      return hintedUser;
    }
  }

  let baseUserQuery = User.findById(userId).select("role");
  if (session) {
    baseUserQuery = baseUserQuery.session(session);
  }

  const baseUser = await baseUserQuery;
  if (baseUser?.role && ROLE_MODEL_MAP[baseUser.role]) {
    const userFromRole = await findByModel(ROLE_MODEL_MAP[baseUser.role]);
    if (userFromRole) {
      return userFromRole;
    }
  }

  for (const Model of [Student, Parent, Teacher]) {
    const fallbackUser = await findByModel(Model);
    if (fallbackUser) {
      return fallbackUser;
    }
  }

  return null;
};

// updated version
exports.purchaseLecturerPoints = catchAsync(async (req, res, next) => {
  const { lecturerId, lectureId } = req.body;
  if (!lecturerId) {
    return next(new AppError("lecturer Id and Lecture Id is required", 400));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [lecture, currentUser] = await Promise.all([
      Container.findOne({
        _id: lectureId,
        createdBy: lecturerId,
        kind: "Lecture",
      }).session(session),
      User.findById(req.user._id).session(session),
    ]);

    if (!lecture) {
      await session.abortTransaction();
      return next(new AppError("Lecture not found", 404));
    }
    if (!currentUser) {
      await session.abortTransaction();
      return next(new AppError("Unauthorized", 401));
    }

    const currentUserIndexOfPointsToThisLecture =
      currentUser.lecturerPoints.findIndex(
        (index) => index.lecturer.toString() === lecturerId
      );
    if (currentUserIndexOfPointsToThisLecture === -1) {
      return next(new AppError("You don't have balance for this lecturer", 400));
    }

    const lecturePrice = lecture.price;

    const hasEnoughPoints = currentUser.useLecturerPoints(
      lecturerId,
      lecturePrice
    );
    if (!hasEnoughPoints) {
      await session.abortTransaction();
        return next(
          new AppError(
            "You don't have enough balance for purchasing from this lecturer",
            400
          )
        );
    }

    currentUser.totalPoints -= lecturePrice;

    await studentLectureAccess.create(
      [{
        student: req.user._id,
        lecture: lecture._id,
        remainingViews: lecture.numberOfViews !== undefined && lecture.numberOfViews !== null
          ? lecture.numberOfViews
          : 3 // Only default to 3 if numberOfViews is not set
      }],
      { session }
    );

    // Purchase-related balance updates should not fail due unrelated legacy profile validators.
    await currentUser.save({ session, validateBeforeSave: false });

    await Purchase.create(
      [
        {
          student: req.user._id,
          lecturer: lecture.createdBy,
          points: lecturePrice,
          type: "pointPurchase",
          description: `Purchased lecture ${lecture.name} for ${lecturePrice} EGP`,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    const updatedPoints = currentUser.getLecturerPointsBalance(lecturerId);

    res.status(200).json({
      status: "success",
      message: `Lecture purchased successfully, your remaining balance for this lecturer now ${updatedPoints}`,
    });
  } catch (error) {
    await session.abortTransaction();

    if (error.code === 11000) {
      return next(new AppError("You have already purchased this lecture", 400));
    }
    return next(new AppError("Failed to purchase lecture", 500));
  } finally {
    await session.endSession();
  }
});

/**
 * Purchase balance for a specific lecturer
 */
/*
exports.purchaseLecturerPoints = catchAsync(async (req, res, next) => {
  // Get userId from the authenticated user's JWT token - try multiple possible properties
  let userId;

  if (req.user) {
    userId = req.user.id || req.user._id;
    // Convert to string if it's an ObjectId
    if (userId && typeof userId === "object" && userId.toString) {
      userId = userId.toString();
    }
  }

  if (!userId) {
    return next(new AppError("User ID not found in authentication token", 401));
  }

  const { lecturerId, pointsAmount } = req.body;

  if (!lecturerId || !pointsAmount || pointsAmount <= 0) {
    return next(
      new AppError("Missing required fields or invalid points amount", 400)
    );
  }

  // Start a transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find lecturer
    const lecturer = await Lecturer.findById(lecturerId).session(session);
    if (!lecturer) {
      return next(new AppError("Lecturer not found", 404));
    }

    // Find user directly based on role first
    let userModel;

    // Try finding as Student
    userModel = await Student.findById(userId).session(session);

    // If not found, try as Parent
    if (!userModel) {
      userModel = await Parent.findById(userId).session(session);
    }

    // If still not found, check standard User model
    if (!userModel) {
      const baseUser = await User.findById(userId).session(session);

      if (baseUser) {
        // If found in base User model, look up the specialized model
        if (baseUser.role === "Student") {
          userModel = await Student.findById(userId).session(session);
        } else if (baseUser.role === "Parent") {
          userModel = await Parent.findById(userId).session(session);
        }
      }
    }

    // Final check if we found a valid user model
    if (!userModel) {
      console.log(`No user model found for ID: ${userId}`);
      await session.abortTransaction();
      session.endSession();
      return next(new AppError(`User not found with ID: ${userId}`, 404));
    }

    console.log(
      `Found user model: ${userModel.name} with role: ${
        userModel.role || userModel.constructor.modelName
      }`
    );

    // Add points to user's balance
    userModel.addLecturerPoints(lecturerId, pointsAmount);
    // Purchasing only changes balances/promo flags; avoid blocking on unrelated legacy profile validators.
    await userModel.save({ session, validateBeforeSave: false });

    // Create purchase record
    const purchase = await Purchase.create(
      [
        {
          student: userId,
          lecturer: lecturerId,
          points: pointsAmount,
          type: "pointPurchase",
          description: `Purchased ${pointsAmount} points for lecturer ${lecturer.name}`,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    res.status(201).json({
      status: "success",
      data: {
        purchase: purchase[0],
        pointsBalance: userModel.getLecturerPointsBalance(lecturerId),
      },
    });
  } catch (error) {
    console.error("Transaction error:", error);
    await session.abortTransaction();
    return next(new AppError(error.message, 500));
  } finally {
    session.endSession();
  }
});
*/
/**
 * Purchase a container using lecturer-specific balance
 */
exports.purchaseContainerWithPoints = catchAsync(async (req, res, next) => {
  // Get userId from the authenticated user's JWT token - try multiple possible properties
  let userId;

  if (req.user) {
    userId = req.user.id || req.user._id;
    // Convert to string if it's an ObjectId
    if (userId && typeof userId === "object" && userId.toString) {
      userId = userId.toString();
    }
  }

  if (!userId) {
    return next(new AppError("User ID not found in authentication token", 401));
  }

  const { containerId } = req.body;

  if (!containerId) {
    return next(new AppError("Container ID is required", 400));
  }

  // Start a transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Try to find as Container first, then as Lecture
    let item = await Container.findById(containerId).session(session);
    let isLecture = false;
    if (!item) {
      const Lecture = require("../models/LectureModel");
      item = await Lecture.findById(containerId).session(session);
      if (!item) {
        return next(new AppError("Container or Lecture not found", 404));
      }
      isLecture = true;
    }

    if (!item.createdBy) {
      return next(new AppError("Item is not associated with any lecturer", 400));
    }

    const lecturerId = item.createdBy.toString();
    const pointsRequired = item.price || 0;

    // Find user model
    if (req.user.role === "Teacher" && item.teacherAllowed === false) {
      return next(new AppError("You are not allowed to purchase this item", 400));
    }
    const userModel = await resolvePointsUserModel({
      userId,
      session,
      roleHint: req.user.role,
    });

    if (!userModel) {
      return next(new AppError(`User not found with ID: ${userId}`, 404));
    }

    // Grade level restriction check
    if (item.sameGradeOnly) {
      const role = req.user.role;
      
      // Apply restriction only to Students and Parents
      if (role === "Student" || role === "Parent") {
        const userLevel = userModel.level ? userModel.level.toString() : null;
        const itemLevel = item.level ? item.level.toString() : null;

        if (role === "Student") {
          // Students MUST be in the exact grade and level
          if (!userLevel || !itemLevel || userLevel !== itemLevel) {
            await session.abortTransaction();
            return next(new AppError("This course is restricted to students in the exact same grade level only", 400));
          }
        } else if (role === "Parent") {
          // Parents can buy if it's their level OR any of their children's stages
          const userStages = userModel.stages && Array.isArray(userModel.stages) 
            ? userModel.stages.map(s => s.toString()) 
            : [];
          
          const isLevelMatch = itemLevel && userLevel === itemLevel;
          const isStageMatch = itemLevel && userStages.includes(itemLevel);

          if (!isLevelMatch && !isStageMatch) {
            await session.abortTransaction();
            return next(new AppError("This course is restricted to parents with children in the same grade level only", 400));
          }
        }
      }
    }

    // Check if user has enough balance for this lecturer
    const lecturerPoints = userModel.getLecturerPointsBalance(lecturerId);
    const generalPoints = userModel.generalPoints || 0;
    const promoPoints = userModel.promoPoints || 0;
    let purchaseType = "";
    let isPromoCodePurchase = false;

    // First try to use lecturer-specific balance
    if (lecturerPoints >= pointsRequired) {
      const success = userModel.useLecturerPoints(lecturerId, pointsRequired);
      if (!success) {
        await session.abortTransaction();
        return next(new AppError("Failed to deduct lecturer balance", 500));
      }
      purchaseType = pointsRequired === 0 ? "Free (lecturer)" : "Lecturer balance";
    } else if (userModel.hasPromoCode && !userModel.hasUsedPromoCode && promoPoints > 0) {
      userModel.hasUsedPromoCode = true;
      userModel.promoPoints = 0;
      purchaseType = "Promo code (one-time use)";
      isPromoCodePurchase = true;
    } else if (generalPoints >= pointsRequired) {
      userModel.generalPoints -= pointsRequired;
      purchaseType = "General balance";
    } else {
      await session.abortTransaction();
      return next(new AppError(`Not enough balance. Required: ${pointsRequired}, Available lecturer balance: ${lecturerPoints}, Available general balance: ${generalPoints}`, 400));
    }

    // Purchasing only changes balances/promo flags; avoid blocking on unrelated legacy profile validators.
    await userModel.save({ session, validateBeforeSave: false });
    // Create purchase record, set lecture field if it's a lecture
    const purchase = await Purchase.create([
      isLecture
        ? {
          student: userId,
          lecturer: lecturerId,
          points: isPromoCodePurchase ? 0 : pointsRequired,
          lecture: containerId,
          type: isPromoCodePurchase ? "promoCodePurchase" : "lecturePurchase",
          description: `Purchased lecture ${item.name} ${isPromoCodePurchase ? "using promotional code" : `for ${pointsRequired} EGP using ${purchaseType}`}`,
        }
        : {
          student: userId,
          lecturer: lecturerId,
          points: isPromoCodePurchase ? 0 : pointsRequired,
          container: containerId,
          type: isPromoCodePurchase ? "promoCodePurchase" : "containerPurchase",
          description: `Purchased container ${item.name} ${isPromoCodePurchase ? "using promotional code" : `for ${pointsRequired} EGP using ${purchaseType}`}`,
        },
    ], { session });
    // Grant access if it's a lecture
    let lectureInfo = null;
    if (isLecture) {
      await studentLectureAccess.create([
        {
          student: userId,
          lecture: containerId,
          remainingViews: item.numberOfViews !== undefined && item.numberOfViews !== null
            ? item.numberOfViews
            : 3, // Only default to 3 if numberOfViews is not set
        },
      ], { session });
      // Populate lecture info for response
      const Lecture = require("../models/LectureModel");
      lectureInfo = await Lecture.findById(containerId).lean();
    }
    await session.commitTransaction();
    res.status(201).json({
      status: "success",
      data: {
        purchase: purchase[0],
        lecture: lectureInfo,
        remainingLecturerPoints: userModel.getLecturerPointsBalance(lecturerId),
        remainingGeneralPoints: userModel.generalPoints,
        usedPointsType: purchaseType,
        promoUsed: isPromoCodePurchase,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    return next(new AppError(error.message, 500));
  } finally {
    session.endSession();
  }
});

/**
 * Get all purchases
 */
exports.getAllPurchases = catchAsync(async (req, res, next) => {
  let query = Purchase.find();
  const features = new QueryFeatures(query, req.query)
    .filter()
    .sort()
    .paginate();
  query = features.query;
  const purchases = await query.populate(["container", "lecture", "lecturer", "student"]);

  res.status(200).json({
    status: "success",
    results: purchases.length,
    data: {
      purchases,
    },
  });
});

/**
 * Get balance for a user with a specific lecturer
 */
exports.getLecturerPointsBalance = catchAsync(async (req, res, next) => {
  // Use current user's ID if not specified in params
  let userId = req.params.userId;

  if (!userId && req.user) {
    userId = req.user.id || req.user._id;
    if (userId && typeof userId === "object" && userId.toString) {
      userId = userId.toString();
    }
  }

  const { lecturerId } = req.params;

  if (!lecturerId) {
    return next(new AppError("Lecturer ID is required", 400));
  }

  if (!userId) {
    return next(new AppError("User ID is required", 400));
  }

  const userModel = await resolvePointsUserModel({
    userId,
    roleHint: req.user?.role,
    populate: {
      path: "lecturerPoints.lecturer",
      select: "name",
    },
  });

  // Final check if we found a valid user model
  if (!userModel) {
    return next(new AppError(`User not found with ID: ${userId}`, 404));
  }

  // Get balance
  const pointsBalance = userModel.getLecturerPointsBalance(lecturerId);

  // Get purchase history for this user-lecturer combination
  const purchases = await Purchase.find({
    student: userId,
    lecturer: lecturerId,
  })
    .sort({ purchasedAt: -1 })
    .populate(["container", "lecture"]);

  res.status(200).json({
    status: "success",
    data: {
      userId,
      lecturerId,
      pointsBalance,
      purchases,
    },
  });
});

/**
 * Get all user's balances
 */
exports.getAllUserPointBalances = catchAsync(async (req, res, next) => {
  // Use current user's ID if not specified in params
  let userId = req.params.userId;

  if (!userId && req.user) {
    userId = req.user.id || req.user._id;
    if (userId && typeof userId === "object" && userId.toString) {
      userId = userId.toString();
    }
  }

  if (!userId) {
    return next(new AppError("User ID is required", 400));
  }

  const userModel = await resolvePointsUserModel({
    userId,
    roleHint: req.user?.role,
    populate: {
      path: "lecturerPoints.lecturer",
      select: "name subject",
    },
  });

  // Final check if we found a valid user model
  if (!userModel) {
    return next(new AppError(`User not found with ID: ${userId}`, 404));
  }

  // Get balances
  const pointsBalances = userModel.lecturerPoints || [];
  const generalPoints = userModel.generalPoints || 0;
  const promoPoints = userModel.promoPoints || 0;
  const hasPromoCode = userModel.hasPromoCode || false;

  // Log balances for debugging
  console.log(`User ${userModel.name} general balance: ${generalPoints}`);
  console.log(`User ${userModel.name} promo balance: ${promoPoints}`);

  res.status(200).json({
    status: "success",
    data: {
      userId,
      user: userModel.name,
      userRole: userModel.role || userModel.constructor.modelName,
      generalPoints: generalPoints,
      promoPoints: promoPoints,
      hasActivePromoCode: hasPromoCode && !userModel.hasUsedPromoCode,
      pointsBalances,
    },
  });
});

/**
 * Get purchases by user
 */
exports.getPurchasesByUser = catchAsync(async (req, res, next) => {
  // Use current user's ID if not specified in params
  let userId = req.params.userId;

  if (!userId && req.user) {
    userId = req.user.id || req.user._id;
    if (userId && typeof userId === "object" && userId.toString) {
      userId = userId.toString();
    }
  }

  if (!userId) {
    return next(new AppError("User ID is required", 400));
  }

  const purchases = await Purchase.find({
    student: userId,
  })
    .populate(["container", "lecture", "lecturer"])
    .sort({ purchasedAt: -1 });

  res.status(200).json({
    status: "success",
    results: purchases.length,
    data: {
      purchases,
    },
  });
});

/**
 * Get a purchase by ID
 */
exports.getPurchaseById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const purchase = await Purchase.findById(id).populate([
    "container",
    "lecture",
    "lecturer",
    "student",
  ]);

  if (!purchase) {
    return next(new AppError("Purchase not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      purchase,
    },
  });
});

/**
 * Delete a purchase by ID
 */
exports.deletePurchase = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const purchase = await Purchase.findByIdAndDelete(id);

  if (!purchase) {
    return next(new AppError("Purchase not found", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

