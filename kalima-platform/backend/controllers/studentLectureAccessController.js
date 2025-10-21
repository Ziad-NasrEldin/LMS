const mongoose = require("mongoose");
const StudentLectureAccess = require("../models/studentLectureAccessModel");
const StudentExamSubmission = require("../models/studentExamSubmissionModel");
const Lecture = require("../models/LectureModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const QueryFeatures = require("../utils/queryFeatures");

exports.createStudentLectureAccess = catchAsync(async (req, res, next) => {
  const { student, lecture } = req.body;
  // Check if the lecture requires exam or homework
  const lectureDoc = await Lecture.findById(lecture)
    .populate("examConfig")
    .populate("homeworkConfig");
  if (!lectureDoc) {
    return next(new AppError("Lecture not found", 404));
  }

  // If lecture requires exam, verify that student has passed it
  if (lectureDoc.requiresExam) {
    const examSubmission = await StudentExamSubmission.findOne({
      student,
      lecture,
      passed: true,
      type: "exam",
    });

    if (!examSubmission) {
      return next(
        new AppError(
          "You must pass the exam before accessing this lecture",
          403
        )
      );
    }
  }

  if (lectureDoc.requiresHomework) {
    const homeworkSubmission = await StudentExamSubmission.findOne({
      student,
      lecture,
      passed: true,
      type: "homework",
    });
    if (!homeworkSubmission) {
      return next(
        new AppError(
          "You must pass the homework before accessing this lecture",
          403
        )
      );
    }
  }

  const access = await StudentLectureAccess.create(req.body);
  res.status(201).json({
    status: "success",
    data: access,
  });
});

exports.getStudentLectureAccess = catchAsync(async (req, res, next) => {
  const access = await StudentLectureAccess.findById(req.params.id).populate([
    { path: "student", select: "name" },
    { path: "lecture", select: "name videoLink" },
  ]);
  if (!access) {
    return next(new AppError("No document found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: access,
  });
});

exports.getAllStudentLectureAccess = catchAsync(async (req, res, next) => {
  let query = StudentLectureAccess.find();
  const features = new QueryFeatures(query, req.query)
    .filter()
    .sort()
    .paginate();
  query = features.query;
  const accesses = await query.populate([
    { path: "student", select: "name" },
    { path: "lecture", select: "name videoLink" },
  ]);
  res.status(200).json({
    status: "success",
    results: accesses.length,
    data: accesses,
  });
});

exports.updateStudentLectureAccess = catchAsync(async (req, res, next) => {
  const access = await StudentLectureAccess.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );
  if (!access) {
    return next(new AppError("No document found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: access,
  });
});

exports.deleteStudentLectureAccess = catchAsync(async (req, res, next) => {
  const access = await StudentLectureAccess.findByIdAndDelete(req.params.id);
  if (!access) {
    return next(new AppError("No document found with that ID", 404));
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});

// New function to check if a student can access a lecture
exports.checkLectureAccess = catchAsync(async (req, res, next) => {
  const { lectureId } = req.params;
  const studentId = req.user._id;
  // Get the lecture and populate both configs
  const lecture = await Lecture.findById(lectureId)
    .populate("examConfig")
    .populate("homeworkConfig");
  if (!lecture) {
    return next(new AppError("Lecture not found", 404));
  }

  // Check requirements
  if (lecture.requiresExam || lecture.requiresHomework) {
    const results = {
      exam: lecture.requiresExam ? {
        required: true,
        passed: false,
        url: lecture.examConfig ? lecture.examConfig.formUrl : null,
        passingThreshold: lecture.examConfig ? lecture.examConfig.defaultPassingThreshold : 60
      } : null,
      homework: lecture.requiresHomework ? {
        required: true,
        passed: false,
        url: lecture.homeworkConfig ? lecture.homeworkConfig.formUrl : null,
        passingThreshold: lecture.homeworkConfig ? lecture.homeworkConfig.defaultPassingThreshold : 60
      } : null
    };

    // Check exam if required
    if (lecture.requiresExam) {
      const examSubmission = await StudentExamSubmission.findOne({
        student: studentId,
        lecture: lectureId,
        type: "exam",
        passed: true,
      });
      results.exam.passed = !!examSubmission;
    }

    // Check homework if required
    if (lecture.requiresHomework) {
      const homeworkSubmission = await StudentExamSubmission.findOne({
        student: studentId,
        lecture: lectureId,
        type: "homework",
        passed: true,
      });
      results.homework.passed = !!homeworkSubmission;
    }

    // If any required submission is not passed, return restricted access
    if ((lecture.requiresExam && !results.exam.passed) || 
        (lecture.requiresHomework && !results.homework.passed)) {
      return res.status(200).json({
        status: "restricted",
        message: "You must complete all required submissions before accessing this lecture",
        data: results
      });
    }
  }

  // If exam is passed or not required, check standard access permissions
  // Rest of your existing access control logic would go here
  // Return success with exam and homework status
  res.status(200).json({
    status: "success",
    message: "Access granted",
    data: {
      hasAccess: true,
      requiresExam: lecture.requiresExam,
      requiresHomework: lecture.requiresHomework,
      examPassed: lecture.requiresExam ? true : undefined,
      homeworkPassed: lecture.requiresHomework ? true : undefined
    },
  });
});

// Get student lecture access by lecture ID
exports.getLectureAccessByLectureId = catchAsync(async (req, res, next) => {
  const { lectureId } = req.params;

  // Verify lecture exists
  const lecture = await Lecture.findById(lectureId);
  if (!lecture) {
    return next(new AppError("Lecture not found", 404));
  }

  // Find all access records for this lecture
  const accessRecords = await StudentLectureAccess.find({
    lecture: lectureId,
  }).populate({
    path: "student",
    select: "name email", // Include student details you want to return
  });

  res.status(200).json({
    status: "success",
    results: accessRecords.length,
    data: {
      lecture: {
        _id: lecture._id,
        name: lecture.name,
      },
      accessRecords,
    },
  });
});
