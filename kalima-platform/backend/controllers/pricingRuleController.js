const PricingRule = require("../models/pricingRuleModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const QueryFeatures = require("../utils/queryFeatures");
const mongoose = require("mongoose"); // Import mongoose
// Import models to check for existence
const CLecturer = require("../models/center.lecturerModel"); 
const Subject = require("../models/subjectModel");
const Level = require("../models/levelModel");
const Center = require("../models/centerModel");

// Helper function to check document existence
const checkDocExists = async (Model, id, modelName) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ID format for ${modelName}`, 400);
  }
  const doc = await Model.findById(id).lean(); // Use lean for performance
  if (!doc) {
    throw new AppError(`${modelName} not found with ID: ${id}`, 404);
  }
  // Special check for Lecturer role
  if (modelName === "CLecturer") {
    throw new AppError(`User with ID ${id} is not a Lecturer`, 400);
  }
  return doc;
};

// Create a new pricing rule
exports.createPricingRule = catchAsync(async (req, res, next) => {
  const {
    lecturer,
    subject,
    level,
    center, // Optional
    dailyPrice,
    multiSessionPrice,
    multiSessionCount,
    description,
  } = req.body;

  // Basic validation
  if (
    !lecturer ||
    !subject ||
    !level ||
    dailyPrice === undefined ||
    multiSessionPrice === undefined ||
    multiSessionCount === undefined
  ) {
    return next(
      new AppError(
        "Lecturer, Subject, Level, and all pricing fields are required.",
        400
      )
    );
  }

  // --- Validate Referenced IDs ---
  const validationPromises = [
    checkDocExists(CLecturer, lecturer, "Lecturer"), // Check User model for Lecturer role
    checkDocExists(Subject, subject, "Subject"),
    checkDocExists(Level, level, "Level"),
  ];
  if (center) {
    // Only validate center if it's provided
    validationPromises.push(checkDocExists(Center, center, "Center"));
  }

  try {
    await Promise.all(validationPromises);
  } catch (error) {
    // If any validation fails, catch the AppError and pass it to the error handler
    return next(error);
  }
  // --- End Validation ---

  try {
    const newRule = await PricingRule.create({
      lecturer,
      subject,
      level,
      center: center || null, // Store null if center is not provided
      dailyPrice,
      multiSessionPrice,
      multiSessionCount,
      description,
    });

    res.status(201).json({
      status: "success",
      data: {
        pricingRule: newRule,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      // Handle unique constraint violation
      return next(
        new AppError(
          "A pricing rule already exists for this combination of Lecturer, Subject, Level, and Center.",
          409
        )
      );
    }
    // Handle other potential errors during creation
    return next(new AppError(`Failed to create pricing rule: ${error.message}`, 500));
  }
});

// Get all pricing rules
exports.getAllPricingRules = catchAsync(async (req, res, next) => {
  const features = new QueryFeatures(PricingRule.find(), req.query)
    .filter()
    .sort()
    .paginate();

  const pricingRules = await features.query.populate([
    { path: "lecturer", select: "name" },
    { path: "subject", select: "name" },
    { path: "level", select: "name" },
    { path: "center", select: "name" }, // Populate center if it exists
  ]);

  res.status(200).json({
    status: "success",
    results: pricingRules.length,
    data: {
      pricingRules,
    },
  });
});

// Get a single pricing rule by ID
exports.getPricingRuleById = catchAsync(async (req, res, next) => {
  const rule = await PricingRule.findById(req.params.id).populate([
    { path: "lecturer", select: "name" },
    { path: "subject", select: "name" },
    { path: "level", select: "name" },
    { path: "center", select: "name" },
  ]);

  if (!rule) {
    return next(new AppError("No pricing rule found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      pricingRule: rule,
    },
  });
});

// Update a pricing rule by ID
exports.updatePricingRule = catchAsync(async (req, res, next) => {
  // Only allow updating pricing fields and description
  // No need to re-validate lecturer, subject, level, center here as they are not being updated.
  const { dailyPrice, multiSessionPrice, multiSessionCount, description } = req.body;
  const updateData = { dailyPrice, multiSessionPrice, multiSessionCount, description };

  // Filter out undefined values to avoid overwriting with null
  Object.keys(updateData).forEach(
    (key) => updateData[key] === undefined && delete updateData[key]
  );

  if (Object.keys(updateData).length === 0) {
    return next(new AppError("No valid fields provided for update.", 400));
  }

  const rule = await PricingRule.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!rule) {
    return next(new AppError("No pricing rule found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      pricingRule: rule,
    },
  });
});

// Delete a pricing rule by ID
exports.deletePricingRule = catchAsync(async (req, res, next) => {
  const rule = await PricingRule.findByIdAndDelete(req.params.id);

  if (!rule) {
    return next(new AppError("No pricing rule found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
