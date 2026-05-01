const mongoose = require("mongoose");
const LecturerExamConfig = require("../models/ExamConfigModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { normalizeExternalUrl } = require("../utils/urlValidation");
const {
  MASTER_ASSESSMENT_SHEET_ID,
  MASTER_ASSESSMENT_IDENTIFIER_COLUMN,
  MASTER_ASSESSMENT_SCORE_COLUMN,
  extractGoogleSheetId,
} = require("../config/masterAssessmentConfig");

const normalizeSheetTabName = (value) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalizedValue = String(value).trim();
  return normalizedValue || undefined;
};

const normalizeSheetId = (value) => {
  if (value === undefined || value === null) return undefined;
  return extractGoogleSheetId(value) || undefined;
};

// Create a new exam configuration for a lecturer
exports.createExamConfig = catchAsync(async (req, res, next) => {
  const {
    name,
    type = "exam",
    description,
    googleSheetId,
    googleSheetTabName,
    formUrl,
    defaultPassingThreshold,
  } = req.body;

  const resolvedGoogleSheetId =
    MASTER_ASSESSMENT_SHEET_ID || normalizeSheetId(googleSheetId);

  // Validate required fields
  if (!name || !resolvedGoogleSheetId || !formUrl) {
    return next(new AppError("Name and Form URL are required", 400));
  }

  // Validate type
  if (type !== "exam" && type !== "homework") {
    return next(new AppError("Type must be either 'exam' or 'homework'", 400));
  }

  const normalizedFormUrl = normalizeExternalUrl(formUrl);
  if (!normalizedFormUrl) {
    return next(new AppError("Form URL must be a valid public HTTP/HTTPS URL", 400));
  }

  // Create the configuration
  const examConfig = await LecturerExamConfig.create({
    lecturer: req.user._id, // Use the authenticated user's ID
    name,
    type,
    description,
    googleSheetId: resolvedGoogleSheetId,
    googleSheetTabName: normalizeSheetTabName(googleSheetTabName),
    formUrl: normalizedFormUrl,
    studentIdentifierColumn: MASTER_ASSESSMENT_IDENTIFIER_COLUMN,
    scoreColumn: MASTER_ASSESSMENT_SCORE_COLUMN,
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
    googleSheetTabName,
    formUrl,
    defaultPassingThreshold,
    isActive,
  } = req.body;

  const resolvedGoogleSheetId =
    MASTER_ASSESSMENT_SHEET_ID || normalizeSheetId(googleSheetId);

  // Validate type if provided
  if (type && type !== "exam" && type !== "homework") {
    return next(new AppError("Type must be either 'exam' or 'homework'", 400));
  }

  let normalizedFormUrl;
  if (formUrl !== undefined) {
    normalizedFormUrl = normalizeExternalUrl(formUrl);
    if (!normalizedFormUrl) {
      return next(new AppError("Form URL must be a valid public HTTP/HTTPS URL", 400));
    }
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
  const updatePayload = {
    name,
    description,
    googleSheetId: resolvedGoogleSheetId,
    googleSheetTabName: normalizeSheetTabName(googleSheetTabName),
    studentIdentifierColumn: MASTER_ASSESSMENT_IDENTIFIER_COLUMN,
    scoreColumn: MASTER_ASSESSMENT_SCORE_COLUMN,
    defaultPassingThreshold,
    isActive,
  };

  if (resolvedGoogleSheetId === undefined) {
    delete updatePayload.googleSheetId;
  }

  if (normalizedFormUrl !== undefined) {
    updatePayload.formUrl = normalizedFormUrl;
  }

  const updatedConfig = await LecturerExamConfig.findByIdAndUpdate(
    req.params.id,
    updatePayload,
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
