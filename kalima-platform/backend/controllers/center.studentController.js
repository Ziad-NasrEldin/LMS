const cStudent = require("../models/center.studentModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const QueryFeatures = require("../utils/queryFeatures");
const cParent = require("../models/center.parentModel"); // Import parent model

// Create a new student
exports.createStudent = catchAsync(async (req, res, next) => {
  const { name, phone, gender, center, parent } = req.body;
  
  // Verify parent exists before creating student
  const parentExists = await cParent.findById(parent);
  if (!parentExists) {
    return next(new AppError("Parent not found", 404));
  }

  // Create the new student
  const newStudent = await cStudent.create({
    name,
    phone,
    gender,
    center,
    parent
  });
  
  if (!newStudent) {
    return next(new AppError("Failed to create student", 400));
  }

  // Update parent's children array with the new student ID
  await cParent.findByIdAndUpdate(
    parent,
    { $push: { children: newStudent._id } },
    { new: true }
  );

  res.status(201).json({
    status: "success",
    data: {
      newStudent,
    },
  });
});
// Get all students
exports.getAllStudents = catchAsync(async (req, res, next) => {
  const features = new QueryFeatures(cStudent.find(), req.query)
    .filter()
    .sort()
    .paginate();
    
  const students = await features.query
    .populate('parent', 'name')
    .populate('center', 'name');
  
  res.status(200).json({
    status: "success",
    results: students.length,
    data: {
      students,
    },
  });
});

// Get a student by ID
exports.getStudentById = catchAsync(async (req, res, next) => {
  const student = await cStudent.findById(req.params.id).populate('parent', 'name email phoneNumber');
  
  if (!student) {
    return next(new AppError("Student not found", 404));
  }
  
  res.status(200).json({
    status: "success",
    data: {
      student,
    },
  });
});

// Get student by sequenced ID
exports.getStudentBySequencedId = catchAsync(async (req, res, next) => {
  const { sequencedId } = req.params;
  
  if (!sequencedId) {
    return next(new AppError("Sequenced ID is required", 400));
  }
  
  const student = await cStudent.findOne({ center_students_seq : sequencedId });
  
  if (!student) {
    return next(new AppError("Student not found", 404));
  }
  
  res.status(200).json({
    status: "success",
    data: {
      student,
    },
  });
});

// Update a student by ID
exports.updateStudent = catchAsync(async (req, res, next) => {
  // Check if parent is being changed
  if (req.body.parent) {
    const oldStudent = await cStudent.findById(req.params.id);
    if (oldStudent && oldStudent.parent.toString() !== req.body.parent) {
      // Remove student from old parent's children array
      await cParent.findByIdAndUpdate(
        oldStudent.parent,
        { $pull: { children: req.params.id } }
      );
      
      // Add student to new parent's children array
      await cParent.findByIdAndUpdate(
        req.body.parent,
        { $push: { children: req.params.id } }
      );
    }
  }

  const updatedStudent = await cStudent.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  if (!updatedStudent) {
    return next(new AppError("Student not found", 404));
  }
  
  res.status(200).json({
    status: "success",
    data: {
      updatedStudent,
    },
  });
});

// Delete a student by ID
exports.deleteStudent = catchAsync(async (req, res, next) => {
  const student = await cStudent.findById(req.params.id);
  
  if (!student) {
    return next(new AppError("Student not found", 404));
  }
  
  // Remove student from parent's children array
  await cParent.findByIdAndUpdate(
    student.parent,
    { $pull: { children: req.params.id } }
  );
  
  // Delete the student
  await cStudent.findByIdAndDelete(req.params.id);
  
  res.status(204).json({
    status: "success",
    message: "Student deleted successfully",
    data: null,
  });
});
