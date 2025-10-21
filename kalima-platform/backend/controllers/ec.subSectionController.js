const mongoose = require("mongoose");
const ECSection = require("../models/ec.sectionModel");
const ECSubsection = require("../models/ec.subSectionModel");
const Product = require("../models/ec.productModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// Get all subsections
exports.getAllSubSections = catchAsync(async (req, res, next) => {
  const subsections = await ECSubsection.find()
    .populate("section", "name _id")
    .lean()
    .exec();

  // Manually fetch products for each subsection
  const subsectionsWithProducts = await Promise.all(
    subsections.map(async (subsection) => {
      const products = await Product.find({ subSection: subsection._id });
      return { ...subsection, products };
    })
  );

  res.status(200).json({
    status: "success",
    results: subsectionsWithProducts.length,
    data: { subsections: subsectionsWithProducts }
  });
});

// Create subsection
exports.createSubSection = catchAsync(async (req, res, next) => {
  const { name, section } = req.body;

  const parentSection = await ECSection.findById(section);
  if (!parentSection) return next(new AppError("Parent section not found", 404));

  const subsection = await ECSubsection.create({
    name,
    section,
    createdBy: req.user?._id,
  });

  parentSection.subSections.push(subsection._id);
  await parentSection.save();

  res.status(201).json({ status: "success", data: { subsection } });
});

// Get all subsections of a section
exports.getSubsectionsBySection = catchAsync(async (req, res, next) => {
  const { sectionId } = req.params;
  const section = await ECSection.findById(sectionId);
  if (!section) return next(new AppError("Section not found", 404));

  const subsections = await ECSubsection.find({ section: sectionId })
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  // Fetch products for each subsection
  const subsectionsWithProducts = await Promise.all(
    subsections.map(async (subsection) => {
      const products = await Product.find({ subSection: subsection._id });
      return { ...subsection, products };
    })
  );

  res.status(200).json({
    status: "success",
    results: subsectionsWithProducts.length,
    data: { subsections: subsectionsWithProducts },
  });
});

// Get single subsection with its products
exports.getSubSectionWithProducts = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Find the subsection and populate section info
  const subsection = await ECSubsection.findById(id)
    .populate({ path: "section", select: "name _id" })
    .lean()
    .exec();

  if (!subsection) return next(new AppError("Subsection not found", 404));

  // Fetch products for this subsection
  const products = await Product.find({ subSection: id });

  // Combine subsection data with products
  const subsectionWithProducts = {
    ...subsection,
    products
  };

  res.status(200).json({
    status: "success",
    data: {
      subsection: subsectionWithProducts
    }
  });
});

// Update subsection
exports.updateSubSection = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, description, sortOrder, isActive } = req.body;

  const subsection = await ECSubsection.findByIdAndUpdate(
    id,
    { name, description, sortOrder, isActive },
    { new: true, runValidators: true }
  );

  if (!subsection) return next(new AppError("Subsection not found", 404));

  res.status(200).json({ status: "success", data: { subsection } });
});

// Delete subsection (detach products; keep them in section)
exports.deleteSubSection = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const subsection = await ECSubsection.findById(id);
  if (!subsection) return next(new AppError("Subsection not found", 404));

  // Pull from parent section.subsections
  await ECSection.findByIdAndUpdate(subsection.section, {
    $pull: { subsections: subsection._id },
  });

  // Detach products from this subsection (do NOT delete products)
  await Product.updateMany(
    { subsection: subsection._id },
    { $set: { subsection: null } }
  );

  await subsection.deleteOne();

  res.status(200).json({ status: "success", data: null });
});
