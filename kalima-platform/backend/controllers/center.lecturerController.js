const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const CLecturer = require("../models/center.lecturerModel");
const Center = require("../models/centerModel");
const Subject = require("../models/subjectModel");
const AppError = require("../utils/appError");
const QueryFeatures = require("../utils/queryFeatures");

exports.createLecturer = catchAsync(async (req, res, next) => {
  const { name, phone, subjects, center } = req.body;
  if (!name || !phone || !subjects || !center) {
    return next(new AppError("Name, phone, and subjects are required.", 400));
  }
  const existedSubjects = await Promise.all(
    subjects.map((subjectId) => Subject.findById(subjectId))
  );
  if (existedSubjects.includes(null)) {
    return next(new AppError("One or more subjects do not exist.", 400));
  }
  const existedCenter = await Center.findById(center);
  if (!existedCenter) {
    return next(new AppError("Center not found.", 400));
  }
  const newLecturer = new CLecturer({ name, phone, subjects, center });

  await newLecturer.save();
  if (!newLecturer) {
    return next(new AppError("Error creating lecturer.", 400));
  }
  res.status(201).json({
    status: "success",
    data: {
      lecturer: newLecturer,
    },
  });
});

// Get all lecturers
exports.getAllLecturers = catchAsync(async (req, res, next) => {
  const features = new QueryFeatures(CLecturer.find(), req.query)
    .filter()
    .sort()
    .paginate();
  const lecturers = await features.query
    .populate({
      path: "subjects",
      select: "name",
    })
    .populate({ path: "center", select: "name" });

  res.status(200).json({
    status: "success",
    results: lecturers.length,
    data: {
      lecturers,
    },
  });
});

// Get a single lecturer by ID
exports.getLecturerById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next("Invalid lecturer ID format.", 400);
  }

  const lecturer = await CLecturer.findById(id)
    .populate({
      path: "subjects",
      select: "name",
    })
    .populate({ path: "center", select: "name" });

  if (!lecturer) {
    return next(new AppError("Lecturer not found.", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      lecturer,
    },
  });
});

// Update a lecturer by ID
exports.updateLecturer = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, phone, subjects, center } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid lecturer ID format." });
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (subjects) {
    const existedSubjects = await Promise.all(
      subjects.map((subjectId) => Subject.findById(subjectId))
    );
    if (existedSubjects.includes(null)) {
      return next(new AppError("One or more subjects do not exist.", 400));
    }
    updateData.subjects = subjects;
  }
  if (center) {
    const existedCenter = await Center.findById(center);
    if (!existedCenter) {
      return next(new AppError("Center not found.", 400));
    }
    updateData.center = center;
  }
  const updatedLecturer = await CLecturer.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate({ path: "subjects", select: "name" })
    .populate({ path: "center", select: "name" });

  if (!updatedLecturer) {
    return next(new AppError("Lecturer not found.", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      lecturer: updatedLecturer,
    },
  });
});

// Delete a lecturer by ID
exports.deleteLecturer = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid lecturer ID format.", 400));
  }

  const deletedLecturer = await CLecturer.findByIdAndDelete(id);
  if (!deletedLecturer) {
    returnnext(new AppError("Lecturer not found.", 404));
  }
  res.status(204).json({
    status: "success",
    message: "Lecturer deleted successfully.",
    data: null,
  });
});
