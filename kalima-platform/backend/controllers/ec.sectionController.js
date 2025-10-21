const ECSection = require("../models/ec.sectionModel");
const ECProduct = require("../models/ec.productModel");
const ECSubsection = require("../models/ec.subSectionModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// Create a new section
exports.createSection = catchAsync(async (req, res, next) => {
  const section = await ECSection.create(req.body);
  if (!section) {
    return next(new AppError("Section could not be created", 400));
  }
  res.status(201).json({
    status: "success",
    data: {
      section,
    },
  });
});

// Get all sections
exports.getAllSections = catchAsync(async (req, res, next) => {
  const sections = await ECSection.find().populate({ path: "subSections", select: "name _id" });
  res.status(200).json({
    status: "success",
    results: sections.length,
    data: {
      sections,
    },
  });
});

// Get section by ID
exports.getSectionById = catchAsync(async (req, res, next) => {
  const section = await ECSection.findById(req.params.id).populate({ path: "subSections", select: "name _id" });
  if (!section) {
    return next(new AppError("No section found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      section,
    },
  });
});

// Get section by ID with products
exports.getSection = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Get section with subsections first
  const section = await ECSection.findById(id)
    .populate({
      path: "subSections",
      options: { sort: { createdAt: -1 } }
    });

  if (!section) {
    return next(new AppError("Section not found", 404));
  }

  // Get products for the section
  const sectionProducts = await ECProduct.find({ section: id }).sort({ createdAt: -1 });

  // Get products for each subsection
  const subsectionsWithProducts = await Promise.all(
    section.subSections.map(async (subsection) => {
      const subsectionProducts = await ECProduct.find({ subSection: subsection._id });
      const subsectionObj = subsection.toObject();
      return {
        ...subsectionObj,
        products: subsectionProducts
      };
    })
  );

  // Create the final response
  const response = section.toObject();
  response.products = sectionProducts;
  // response.subSections = subsectionsWithProducts;

  res.status(200).json({ status: "success", data: { section: response } });
});

// Update section
exports.updateSection = catchAsync(async (req, res, next) => {
  const section = await ECSection.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!section) {
    return next(new AppError("No section found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      section,
    },
  });
});

// Delete section
exports.deleteSection = catchAsync(async (req, res, next) => {
  const section = await ECSection.findByIdAndDelete(req.params.id);
  if (!section) {
    return next(new AppError("No section found with that ID", 404));
  }
  // Delete all subsections related to this section
  await ECSubsection.deleteMany({ section: section._id });

  // Delete all products related to this section
  await ECProduct.deleteMany({ section: section._id });
  res.status(203).json({
    message: "Section deleted successfully",
    status: "success",
    data: null,
  });
});

// Get section by ID only if allowed for current user's role
exports.getSectionByIdAllowed = catchAsync(async (req, res, next) => {
  const userRole = req.user && req.user.role;
  if (!userRole) {
    return next(new AppError("User role not found in request", 401));
  }
  // Debug log
  console.log('User role:', userRole, 'Section ID:', req.params.id);
  const section = await ECSection.findOne({
    _id: req.params.id,
    allowedFor: { $elemMatch: { $eq: userRole } },
  });
  if (section) {
    console.log('Section allowedFor:', section.allowedFor);
  }
  if (!section) {
    return next(new AppError("No section found with that ID for your role", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      section,
    },
  });
});

// Get all sections visible to the current user's role
exports.getAllowedSections = catchAsync(async (req, res, next) => {
  const userRole = req.user && req.user.role;
  if (!userRole) {
    return next(new AppError("User role not found in request", 401));
  }
  const sections = await ECSection.find({ allowedFor: { $elemMatch: { $eq: userRole } } });
  res.status(200).json({
    status: "success",
    results: sections.length,
    data: {
      sections,
    },
  });
});

// Export all controller functions using the exports object
module.exports = exports;
