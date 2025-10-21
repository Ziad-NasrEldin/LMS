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
const Package = require("../models/packageModel");
const QueryFeatures = require("../utils/queryFeatures");

const findAllChildContainers = async (containerId, session) => {
  try {
    // Find the container and all its nested children using GraphLookup
    const containerTree = await Container.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(containerId) },
      },
      {
        $graphLookup: {
          from: "containers", // Collection name
          startWith: "$children",
          connectFromField: "children",
          connectToField: "_id",
          as: "nestedChildren",
        },
      },
    ]).session(session);

    if (!containerTree || containerTree.length === 0) {
      return [];
    }

    // Return all child containers regardless of price
    const containerDoc = containerTree[0];
    const allChildren = containerDoc.nestedChildren;

    console.log(
      `Found ${allChildren.length} child containers for container ${containerId}`
    );
    return allChildren;
  } catch (error) {
    console.error("Error finding child containers:", error);
    return [];
  }
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
      return next(new AppError("You don't have points to this lecturer", 400));
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
          "You don't have enough points for purchasing from this lecturer",
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

    await currentUser.save({ session });

    await Purchase.create(
      [
        {
          student: req.user._id,
          lecturer: lecture.createdBy,
          points: lecturePrice,
          type: "pointPurchase",
          description: `Purchased lecture ${lecture.name} for ${lecturePrice} points`,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    const updatedPoints = currentUser.getLecturerPointsBalance(lecturerId);

    res.status(200).json({
      status: "success",
      message: `Lecture purchased successfully, your remaining points for this lecturer now ${updatedPoints}`,
    });
  } catch (error) {
    await session.abortTransaction();

    if (error.code === 11000) {
      return next(new AppError("You have already purchased this lecture", 400));
    }
    console.log(error);
    return next(new AppError("Failed to purchase lecture", 500));
  } finally {
    await session.endSession();
  }
});

/**
 * Purchase points for a specific lecturer
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
    await userModel.save({ session });

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
 * Purchase a container using lecturer-specific points
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
    let userModel;
    if (req.user.role === "Teacher" && item.teacherAllowed === false) {
      return next(new AppError("You are not allowed to purchase this item", 400));
    }
    userModel = await Student.findById(userId).session(session);
    if (!userModel) {
      userModel = await Parent.findById(userId).session(session);
    }
    if (!userModel) {
      userModel = await Teacher.findById(userId).session(session);
    }
    if (!userModel) {
      const baseUser = await User.findById(userId).session(session);
      if (baseUser) {
        if (baseUser.role === "Student") {
          userModel = await Student.findById(userId).session(session);
        } else if (baseUser.role === "Parent") {
          userModel = await Parent.findById(userId).session(session);
        }
      }
    }
    if (!userModel) {
      return next(new AppError(`User not found with ID: ${userId}`, 404));
    }

    // Check if user has enough points for this lecturer
    const lecturerPoints = userModel.getLecturerPointsBalance(lecturerId);
    const generalPoints = userModel.generalPoints || 0;
    const promoPoints = userModel.promoPoints || 0;
    let purchaseType = "";
    let isPromoCodePurchase = false;

    // First try to use lecturer-specific points
    if (lecturerPoints >= pointsRequired) {
      const success = userModel.useLecturerPoints(lecturerId, pointsRequired);
      if (!success) {
        await session.abortTransaction();
        return next(new AppError("Failed to deduct lecturer points", 500));
      }
      purchaseType = pointsRequired === 0 ? "Free (lecturer)" : "Lecturer points";
    } else if (userModel.hasPromoCode && !userModel.hasUsedPromoCode && promoPoints > 0) {
      userModel.hasUsedPromoCode = true;
      userModel.promoPoints = 0;
      purchaseType = "Promo code (one-time use)";
      isPromoCodePurchase = true;
    } else if (generalPoints >= pointsRequired) {
      userModel.generalPoints -= pointsRequired;
      purchaseType = "General points";
    } else {
      await session.abortTransaction();
      return next(new AppError(`Not enough points. Required: ${pointsRequired}, Available lecturer points: ${lecturerPoints}, Available general points: ${generalPoints}`, 400));
    }

    await userModel.save({ session });
    // Create purchase record, set lecture field if it's a lecture
    const purchase = await Purchase.create([
      isLecture
        ? {
            student: userId,
            lecturer: lecturerId,
            points: isPromoCodePurchase ? 0 : pointsRequired,
            lecture: containerId,
            type: isPromoCodePurchase ? "promoCodePurchase" : "lecturePurchase",
            description: `Purchased lecture ${item.name} ${isPromoCodePurchase ? "using promotional code" : `for ${pointsRequired} points using ${purchaseType}`}`,
          }
        : {
            student: userId,
            lecturer: lecturerId,
            points: isPromoCodePurchase ? 0 : pointsRequired,
            container: containerId,
            type: isPromoCodePurchase ? "promoCodePurchase" : "containerPurchase",
            description: `Purchased container ${item.name} ${isPromoCodePurchase ? "using promotional code" : `for ${pointsRequired} points using ${purchaseType}`}`,
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
    console.error("Transaction error:", error);
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
  const purchases = await query.populate(["container", "lecturer", "student"]);

  res.status(200).json({
    status: "success",
    results: purchases.length,
    data: {
      purchases,
    },
  });
});

/**
 * Get points balance for a user with a specific lecturer
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

  // Find user directly based on role first
  let userModel;
  let pointsBalance = 0;

  // Try finding as Student
  userModel = await Student.findById(userId).populate({
    path: "lecturerPoints.lecturer",
    select: "name",
  });

  // If not found, try as Parent
  if (!userModel) {
    userModel = await Parent.findById(userId).populate({
      path: "lecturerPoints.lecturer",
      select: "name",
    });
  }
  if (!userModel) {
    userModel = await Teacher.findById(userId).populate({
      path: "lecturerPoints.lecturer",
      select: "name",
    });
  }

  // If still not found, check standard User model
  if (!userModel) {
    const baseUser = await User.findById(userId);

    if (baseUser) {
      if (baseUser.role === "Student") {
        userModel = await Student.findById(userId).populate({
          path: "lecturerPoints.lecturer",
          select: "name",
        });
      } else if (baseUser.role === "Parent") {
        userModel = await Parent.findById(userId).populate({
          path: "lecturerPoints.lecturer",
          select: "name",
        });
      }
    }
  }

  // Final check if we found a valid user model
  if (!userModel) {
    return next(new AppError(`User not found with ID: ${userId}`, 404));
  }

  // Get points balance
  pointsBalance = userModel.getLecturerPointsBalance(lecturerId);

  // Get purchase history for this user-lecturer combination
  const purchases = await Purchase.find({
    student: userId,
    lecturer: lecturerId,
  })
    .sort({ purchasedAt: -1 })
    .populate("container");

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
 * Get all user's points balances
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

  // Find user directly based on role first
  let userModel;
  let pointsBalances = [];

  // Try finding as Student
  userModel = await Student.findById(userId).populate({
    path: "lecturerPoints.lecturer",
    select: "name subject",
  });

  // If not found, try as Parent
  if (!userModel) {
    userModel = await Parent.findById(userId).populate({
      path: "lecturerPoints.lecturer",
      select: "name subject",
    });
  }
  if (!userModel) {
    userModel = await Teacher.findById(userId).populate({
      path: "lecturerPoints.lecturer",
      select: "name subject",
    });
  }

  // If still not found, check standard User model
  if (!userModel) {
    const baseUser = await User.findById(userId);

    if (baseUser) {
      if (baseUser.role === "Student") {
        userModel = await Student.findById(userId).populate({
          path: "lecturerPoints.lecturer",
          select: "name subject",
        });
      } else if (baseUser.role === "Parent") {
        userModel = await Parent.findById(userId).populate({
          path: "lecturerPoints.lecturer",
          select: "name subject",
        });
      }
    }
  }

  // Final check if we found a valid user model
  if (!userModel) {
    return next(new AppError(`User not found with ID: ${userId}`, 404));
  }

  // Get points balances
  pointsBalances = userModel.lecturerPoints || [];
  const generalPoints = userModel.generalPoints || 0;
  const promoPoints = userModel.promoPoints || 0;
  const hasPromoCode = userModel.hasPromoCode || false;

  // Log points balances for debugging
  console.log(`User ${userModel.name} general points: ${generalPoints}`);
  console.log(`User ${userModel.name} promo points: ${promoPoints}`);

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
    .populate(["container", "lecturer"])
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

//purchase package with general points
exports.purchasePackageWithPoints = catchAsync(async (req, res, next) => {
  const { packageId } = req.body;

  if (!packageId) {
    return next(new AppError("Package ID is required", 400));
  }

  // Start a session and transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the package within the session and rename variable to packageDoc
    const packageDoc = await Package.findById(packageId).session(session);
    if (!packageDoc) {
      await session.abortTransaction();
      return next(new AppError("Package not found", 404));
    }

    // Determine the appropriate user model based on role
    let Model =
      req.user.role === "Student"
        ? Student
        : req.user.role === "Parent"
          ? Parent
          : null;

    if (!Model) {
      await session.abortTransaction();
      return next(new AppError("User role not found", 400));
    }

    // Find the user using the correct model
    const user = await Model.findById(req.user._id).session(session);
    console.log("welcome", user.name);
    if (!user) {
      await session.abortTransaction();
      return next(new AppError(`User not found with ID: ${req.user._id}`, 404));
    }

    // Check if the user has enough points
    const currentPoints = user.generalPoints || 0;
    const packagePrice = packageDoc.price || 0;

    if (currentPoints < packagePrice) {
      await session.abortTransaction();
      return next(
        new AppError(
          `No enough points. Required: ${packagePrice}, Available: ${currentPoints}`,
          400
        )
      );
    }

    // Deduct points
    user.generalPoints -= packagePrice;
    await user.save({ session });

    // Create purchase record using packageDoc and passing required fields correctly
    const purchaseDocs = await Purchase.create(
      [
        {
          student: user._id,
          package: packageDoc._id,
          points: packagePrice,
          type: "packagePurchase",
          description: `Purchased package ${packageDoc.name} for ${packagePrice} points`,
        },
      ],
      { session }
    );
    if (!purchaseDocs[0]) {
      await session.abortTransaction();
      return next(new AppError("Failed to create purchase record", 500));
    }
    //Add lecturer-specific points from package to the student’s account.
    if (packageDoc.points && packageDoc.points.length > 0) {
      packageDoc.points.forEach((lp) => {
        // Use the helper method defined in Student model
        user.addLecturerPoints(lp.lecturer, lp.points);
      });
      await user.save({ session });
    }
    await session.commitTransaction();
    res.status(201).json({
      status: "success",
      data: {
        purchase: purchaseDocs[0],
        remainingPoints: user.generalPoints,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    return next(new AppError(error.message, 500));
  } finally {
    await session.endSession();
  }
});
