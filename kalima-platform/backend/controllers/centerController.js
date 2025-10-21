const Center = require("../models/centerModel");
const Lesson = require("../models/lessonModel");
const Student = require("../models/center.studentModel");
const Lecturer = require("../models/center.lecturerModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const mongoose = require("mongoose");

// Create a new center
exports.createCenter = catchAsync(async (req, res, next) => {
  const { name, location } = req.body;
  const center = await Center.create({ name, location });
  res.status(201).json({
    status: "success",
    data: { center },
  });
});

// Get all centers
exports.getAllCenters = catchAsync(async (req, res, next) => {
  const centers = await Center.find();
  res.status(200).json({
    status: "success",
    results: centers.length,
    data: { centers },
  });
});

// Add a lesson to a center
exports.addLesson = catchAsync(async (req, res, next) => {
  const {
    subject,
    lecturer,
    level,
    startTime,
    duration,
    centerId,
  } = req.body;

  // Basic validation
  if (!subject || !lecturer || !level || !startTime || !centerId) {
    return next(new AppError("Subject, Lecturer, Level, StartTime, and CenterId are required.", 400));
  }
  if (!mongoose.Types.ObjectId.isValid(subject) || !mongoose.Types.ObjectId.isValid(lecturer) || !mongoose.Types.ObjectId.isValid(level) || !mongoose.Types.ObjectId.isValid(centerId)) {
    return next(new AppError("Invalid ID format for Subject, Lecturer, Level, or Center.", 400));
  }

  // Validate center exists
  const center = await Center.findById(centerId);
  if (!center) {
    return next(new AppError("Center not found.", 404));
  }

  const lesson = await Lesson.create({
    subject,
    lecturer,
    level,
    startTime,
    duration,
    center: centerId,
  });

  res.status(201).json({
    status: "success",
    data: { lesson },
  });
});

// Get timetable for a center
exports.getTimetable = catchAsync(async (req, res, next) => {
  const { centerId } = req.params;

  const center = await Center.findById(centerId);
  if (!center) return next(new AppError("Center not found", 404));

  const lessons = await Lesson.find({ center: centerId }).populate([
    { path: "lecturer", select: "name" },
    { path: "subject", select: "name" },
    { path: "level", select: "name" },
  ]);

  const timetable = lessons.map((lesson) => {
    const timetableEntry = {
      subject: lesson.subject?.name || 'N/A',
      lecturer: lesson.lecturer?.name || 'N/A',
      startTime: lesson.startTime,
      duration: lesson.duration,
      level: lesson.level?.name || 'N/A',
      lessonId: lesson._id,
    };

    if (lesson.duration) {
      timetableEntry.endTime = new Date(
        new Date(lesson.startTime).getTime() + lesson.duration * 60000
      );
    }

    return timetableEntry;
  });

  res.status(200).json({
    status: "success",
    data: { timetable },
  });
});

// Delete a lesson from a center
exports.deleteLesson = catchAsync(async (req, res, next) => {
  const { lessonId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(lessonId)) {
    return next(new AppError("Invalid Lesson ID format.", 400));
  }

  const lesson = await Lesson.findByIdAndDelete(lessonId);
  if (!lesson) return next(new AppError("Lesson not found", 404));

  res.status(200).json({
    status: "success",
    message: "Lesson deleted successfully",
    data: null,
  });
});

exports.getCenterDataById = catchAsync(async (req, res, next) => {
  const { centerId, type } = req.params;

  // Validate centerId
  if (!mongoose.Types.ObjectId.isValid(centerId)) {
    return next(new AppError("Invalid Center ID.", 400));
  }
  const center = await Center.findById(centerId);
  if (!center) {
    return next(new AppError("Center not found.", 404));
  }

  // Select model based on type
  let Model;
  switch (type) {
    case "lessons":
      Model = Lesson;
      break;
    case "students":
      Model = Student;
      break;
    case "lecturers":
      Model = Lecturer;
      break;
    default:
      return next(
        new AppError(
          "Invalid type. Use one of: lessons, students, lecturers.",
          400
        )
      );
  }

  const items = await Model.find({ center: centerId });
  res.status(200).json({
    status: "success",
    results: items.length,
    data: items,
  });
});
