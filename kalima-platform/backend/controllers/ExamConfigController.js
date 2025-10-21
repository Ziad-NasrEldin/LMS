const mongoose = require("mongoose");
const LecturerExamConfig = require("../models/ExamConfigModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// Create a new exam configuration for a lecturer
exports.createExamConfig = catchAsync(async (req, res, next) => {
  const {
    name,
    type = "exam",
    description,
    googleSheetId,
    formUrl,
    studentIdentifierColumn,
    scoreColumn,
    defaultPassingThreshold,
  } = req.body;

  // Validate required fields
  if (!name || !googleSheetId || !formUrl) {
    return next(
      new AppError("Name, Google Sheet ID, and Form URL are required", 400)
    );
  }

  // Validate type
  if (type !== "exam" && type !== "homework") {
    return next(new AppError("Type must be either 'exam' or 'homework'", 400));
  }

  // Create the configuration
  const examConfig = await LecturerExamConfig.create({
    lecturer: req.user._id, // Use the authenticated user's ID
    name,
    type,
    description,
    googleSheetId,
    formUrl,
    studentIdentifierColumn: studentIdentifierColumn || "Email Address",
    scoreColumn: scoreColumn || "Score",
    defaultPassingThreshold:
      defaultPassingThreshold != null ? defaultPassingThreshold : 60,
  });

  res.status(201).json({
    status: "success",
    data: {
      examConfig,
    },
  });
});

// Get all exam configurations for the logged in lecturer
exports.getMyExamConfigs = catchAsync(async (req, res, next) => {
  const examConfigs = await LecturerExamConfig.find({
    lecturer: req.user._id,
  });

  res.status(200).json({
    status: "success",
    results: examConfigs.length,
    data: {
      examConfigs,
    },
  });
});

// Get a single exam configuration by ID
exports.getExamConfig = catchAsync(async (req, res, next) => {
  const examConfig = await LecturerExamConfig.findById(req.params.id);

  // Check if the config exists
  if (!examConfig) {
    return next(new AppError("No exam configuration found with that ID", 404));
  }

  // Check if the config belongs to the logged in user
  if (examConfig.lecturer.toString() !== req.user._id.toString()) {
    return next(
      new AppError(
        "You do not have permission to access this configuration",
        403
      )
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      examConfig,
    },
  });
});

// Update an exam configuration
exports.updateExamConfig = catchAsync(async (req, res, next) => {
  const {
    name,
    type,
    description,
    googleSheetId,
    formUrl,
    studentIdentifierColumn,
    scoreColumn,
    defaultPassingThreshold,
    isActive,
  } = req.body;

  // Validate type if provided
  if (type && type !== "exam" && type !== "homework") {
    return next(new AppError("Type must be either 'exam' or 'homework'", 400));
  }

  // Find the configuration
  const examConfig = await LecturerExamConfig.findById(req.params.id);

  // Check if the config exists
  if (!examConfig) {
    return next(new AppError("No exam configuration found with that ID", 404));
  }

  // Check if the config belongs to the logged in user
  if (examConfig.lecturer.toString() !== req.user._id.toString()) {
    return next(
      new AppError(
        "You do not have permission to modify this configuration",
        403
      )
    );
  }

  // Update the configuration
  const updatedConfig = await LecturerExamConfig.findByIdAndUpdate(
    req.params.id,
    {
      name,
      description,
      googleSheetId,
      formUrl,
      studentIdentifierColumn,
      scoreColumn,
      defaultPassingThreshold,
      isActive,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: "success",
    data: {
      examConfig: updatedConfig,
    },
  });
});

// Delete an exam configuration
exports.deleteExamConfig = catchAsync(async (req, res, next) => {
  // Find the configuration
  const examConfig = await LecturerExamConfig.findById(req.params.id);

  // Check if the config exists
  if (!examConfig) {
    return next(new AppError("No exam configuration found with that ID", 404));
  }

  // Check if the config belongs to the logged in user
  if (examConfig.lecturer.toString() !== req.user._id.toString()) {
    return next(
      new AppError(
        "You do not have permission to delete this configuration",
        403
      )
    );
  }

  // Delete the configuration
  await LecturerExamConfig.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});
