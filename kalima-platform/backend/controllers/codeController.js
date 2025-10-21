const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Code = require("../models/codeModel");
const QueryFeatures = require("../utils/queryFeatures");
const User = require("../models/userModel");
const mongoose = require("mongoose");
const Lecturer = require("../models/lecturerModel");

// i will modify err msg and make validation later
// restricted to admin-center-lectural
const createCodes = catchAsync(async (req, res, next) => {
  const { pointsAmount, numOfCodes, type, lecturerId } = req.body;
  if (!numOfCodes || !type) {
    return next(new AppError("Code type and number of codes are required"));
  }

  // For promo codes, we'll set a very large point amount (e.g., 1,000,000) 
  // so users can purchase anything they want
  const actualPointsAmount = type === "promo" ? 1000000 : pointsAmount;

  // Validate pointsAmount for non-promo codes
  if (type !== "promo" && !pointsAmount) {
    return next(new AppError("Points amount is required for non-promo codes"));
  }

  let lecturer = null;
  if (type === "specific") {
    if (!lecturerId) {
      return next(new AppError("Lecturer ID is required for specific codes"));
    }
    lecturer = await Lecturer.findById(lecturerId);
    if (!lecturer) {
      return next(new AppError("Lecturer not found", 404));
    }
  }

  const newCodes = [];
  for (let i = 0; i < numOfCodes; i++) {
    const codeDoc = new Code({
      pointsAmount: actualPointsAmount,
      type,
      lecturerId: lecturer ? lecturer._id : null,
    });
    codeDoc.generateCode();
    newCodes.push(codeDoc);
  }

  const codes = await Code.insertMany(newCodes);

  res.status(201).json({
    status: "success",
    message: `${newCodes.length} Code(s) have been created successfully`,
    data: {
      codes,
    },
  });
});

const getAllCodes = catchAsync(async (req, res, next) => {
  const codesQuery = Code.find().select("-__v");

  const features = new QueryFeatures(codesQuery, req.query)
    .filter()
    .sort()
    .paginate();

  const codes = await features.query
    .populate({ path: "lecturerId", select: "name" })
    .lean();
  if (codes.length === 0) {
    return next(new AppError("No codes yet", 404));
  }
  res.status(201).json({
    status: "success",
    results: codes.length,
    data: {
      codes,
    },
  });
});

const getCodeById = catchAsync(async (req, res, next) => {
  if (!req.params.id) {
    return next(new AppError("Code ID is required", 400));
  }
  const code = await Code.findById(req.params.id)
    .select("-__v")
    .populate({ path: "lecturerId", select: "name" })
    .lean();
  if (!code) {
    return next(new AppError("Code not found", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      code,
    },
  });
});

const deleteCodes = catchAsync(async (req, res, next) => {
  const { code } = req.body;
  if (!code) {
    return next(new AppError("Code is required", 400));
  }

  const codeToDelete = await Code.findOneAndDelete({ code, isRedeemed: false });

  if (!codeToDelete) {
    return next(new AppError("Code not found or has been redeemed", 404));
  }

  res.status(200).json({
    status: "success",
    message: `Code <${code}> deleted successfully`,
  });
});

const deleteMultipleCodes = catchAsync(async (req, res, next) => {
  const { codes } = req.body;
  if (!Array.isArray(codes) || codes.length === 0) {
    return next(new AppError("An array of codes is required", 400));
  }

  const result = await Code.deleteMany({ code: { $in: codes }, isRedeemed: false });

  if (result.deletedCount === 0) {
    return next(new AppError("No codes deleted. They may not exist or have been redeemed.", 404));
  }

  res.status(200).json({
    status: "success",
    message: `${result.deletedCount} code(s) deleted successfully`,
  });
});

//restricted only to users(stud)
const redeemCode = catchAsync(async (req, res, next) => {
  const { code } = req.body;
  if (!code) {
    return next(new AppError("Code is required", 400));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const isExistCode = await Code.findOne({ code, isRedeemed: false }).session(
      session
    );
    if (!isExistCode) {
      await session.abortTransaction();
      return next(
        new AppError("Code not found or has been redeemed before", 404)
      );
    }

    // Instead of directly using User model, we need to find the user based on their role
    let currentUser;

    // First, find the base user to get the role
    const baseUser = await User.findById(req.user._id).session(session);
    if (!baseUser) {
      await session.abortTransaction();
      return next(new AppError("User not found", 404));
    }

    // Find the user in the appropriate model based on role
    if (baseUser.role === 'Student') {
      const Student = require('../models/studentModel');
      currentUser = await Student.findById(req.user._id).session(session);

      // For promo codes, check if the student already has an active promo
      if (isExistCode.type === "promo" && currentUser.hasPromoCode) {
        await session.abortTransaction();
        return next(new AppError("You already have an active promo code", 400));
      }
    } else if (baseUser.role === 'Parent') {
      const Parent = require('../models/parentModel');
      currentUser = await Parent.findById(req.user._id).session(session);
    } else {
      // If not a student or parent, use the base user model
      currentUser = baseUser;
    }

    if (!currentUser) {
      await session.abortTransaction();
      return next(new AppError("User profile not found", 404));
    }

    // Handle different code types
    let responseMessage;

    if (isExistCode.type === "promo") {
      // For promo codes: Mark the user as having a promo code
      if (currentUser.hasPromoCode !== undefined) {
        currentUser.hasPromoCode = true;
        currentUser.hasUsedPromoCode = false; // Reset this flag if they're redeeming a new promo code

        // Store promo points separately instead of adding to general points
        currentUser.promoPoints = isExistCode.pointsAmount;
      }

      responseMessage = "Your promotional code has been redeemed successfully. You can use it for one purchase of any value!";
    } else if (isExistCode.type === "specific") {
      // For specific lecturer codes: Add points to the specific lecturer's balance
      if (!isExistCode.lecturerId) {
        await session.abortTransaction();
        return next(new AppError("This code is not properly configured", 500));
      }

      currentUser.addLecturerPoints(
        isExistCode.lecturerId,
        isExistCode.pointsAmount
      );

      responseMessage = `Your code has been redeemed successfully, +${isExistCode.pointsAmount} points for this lecturer`;
    } else {
      // For general codes: Add points to the general points balance
      currentUser.generalPoints = (currentUser.generalPoints || 0) + isExistCode.pointsAmount;

      responseMessage = `Your code has been redeemed successfully, +${isExistCode.pointsAmount} general points`;
    }

    await currentUser.save({ session });

    // Mark the code as redeemed
    await Code.findOneAndUpdate(
      { code },
      {
        isRedeemed: true,
        redeemedBy: req.user._id,
        redeemedAt: new Date(),
      }
    ).session(session);

    await session.commitTransaction();
    res.status(200).json({
      status: "success",
      message: responseMessage,
    });
  } catch (error) {
    console.error("Error redeeming code:", error);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    return next(new AppError("Failed to redeem code, try again later", 500));
  } finally {
    await session.endSession();
  }
});

module.exports = {
  createCodes,
  getAllCodes,
  deleteCodes,
  deleteMultipleCodes,
  redeemCode,
  getCodeById,
};
