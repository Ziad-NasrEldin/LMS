const Level = require("../models/levelModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// Create a new level
exports.createLevel = catchAsync(async (req, res, next) => {
  const { name, nameAr } = req.body;

  if (!name || !nameAr) {
    return next(new AppError("Both English and Arabic level names are required", 400));
  }

  const level = await Level.create({
    name: String(name).trim(),
    nameAr: String(nameAr).trim(),
  });

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
  const payload = { ...req.body };

  if (typeof payload.name === "string") {
    payload.name = payload.name.trim();
  }

  if (typeof payload.nameAr === "string") {
    payload.nameAr = payload.nameAr.trim();
  }

  const level = await Level.findByIdAndUpdate(req.params.id, payload, {
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
