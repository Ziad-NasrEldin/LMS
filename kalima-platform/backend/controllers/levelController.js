const Level = require("../models/levelModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// Create a new level
exports.createLevel = catchAsync(async (req, res, next) => {
  const level = await Level.create(req.body);
  if (!level) {
    return next(new AppError("Level could not be created", 400));
  }
  res.status(201).json({
    status: "success",
    data: {
      level,
    },
  });
});

// Get all levels
exports.getAllLevels = catchAsync(async (req, res, next) => {
  const levels = await Level.find();
  if (levels.length === 0) {
    return next(new AppError("No levels found", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      levels,
    },
  });
});

// Get a level by ID
exports.getLevelById = catchAsync(async (req, res, next) => {
  const level = await Level.findById(req.params.id);
  if (!level) {
    return next(new AppError("No level found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      level,
    },
  });
});

// Update a level by ID
exports.updateLevelById = catchAsync(async (req, res, next) => {
  const level = await Level.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!level) {
    return next(new AppError("No level found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      level,
    },
  });
});

// Delete a level by ID
exports.deleteLevelById = catchAsync(async (req, res, next) => {
  const level = await Level.findByIdAndDelete(req.params.id);
  if (!level) {
    return next(new AppError("No level found with that ID", 404));
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});
