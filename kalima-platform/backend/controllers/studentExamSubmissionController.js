const Lecture = require("../models/LectureModel");
const StudentExamSubmission = require("../models/studentExamSubmissionModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const examSubmissionSync = require("../utils/examSubmissionSync");
const { ASSESSMENT_MAP } = require("../utils/lectureAccessUtils");

exports.verifyExamSubmission = catchAsync(async (req, res, next) => {
  const { lectureId } = req.params;
  const studentId = req.user._id;

  const lecture = await Lecture.findById(lectureId)
    .populate("examConfig")
    .populate("homeworkConfig");

  if (!lecture) {
    return next(new AppError("Lecture not found", 404));
  }

  if (!lecture.requiresExam && !lecture.requiresHomework) {
    return res.status(200).json({
      status: "success",
      data: {
        exam: null,
        homework: null,
        passed: true,
      },
      message: "This lecture does not require submissions",
    });
  }

  const studentIdentifier = req.user.email || req.user._id.toString();
  const results = {
    exam: null,
    homework: null,
    passed: false,
  };

  const requiredAssessmentTypes = Object.entries(ASSESSMENT_MAP)
    .filter(([, assessment]) => Boolean(lecture?.[assessment.requiresField]))
    .map(([assessmentType]) => assessmentType);

  for (const assessmentType of requiredAssessmentTypes) {
    const assessmentResult =
      await examSubmissionSync.processAssessmentSubmissionFromSheet({
        lecture,
        lectureId,
        studentId,
        studentIdentifier,
        studentEmail: req.user.email || null,
        assessmentType,
        syncSource: "sheet",
      });

    if (!assessmentResult) {
      continue;
    }

    const responseKey = assessmentType;
    results[responseKey] = assessmentResult;
  }

  results.passed = requiredAssessmentTypes.every((assessmentType) => {
    return results[assessmentType]?.passed === true;
  });

  res.status(200).json({
    status: "success",
    data: results,
  });
});

exports.getMyExamSubmissions = catchAsync(async (req, res) => {
  const studentId = req.user._id;

  const submissions = await StudentExamSubmission.find({ student: studentId })
    .populate({
      path: "lecture",
      select: "name subject requiresExam requiresHomework",
    })
    .sort({ submittedAt: -1 });

  res.status(200).json({
    status: "success",
    results: submissions.length,
    data: {
      submissions,
    },
  });
});

exports.getLectureSubmissions = catchAsync(async (req, res, next) => {
  const { lectureId } = req.params;

  const lecture = await Lecture.findById(lectureId);

  if (!lecture) {
    return next(new AppError("Lecture not found", 404));
  }

  const isCreator = lecture.createdBy.toString() === req.user._id.toString();
  const isAdmin = ["Admin", "SubAdmin", "Moderator"].includes(req.user.role);
  const isAssistant =
    req.user.role === "Assistant" &&
    req.user.assignedLecturer &&
    req.user.assignedLecturer.toString() === lecture.createdBy.toString();

  if (!isCreator && !isAdmin && !isAssistant) {
    return next(
      new AppError("You do not have permission to view these submissions", 403)
    );
  }

  const submissions = await StudentExamSubmission.find({ lecture: lectureId })
    .populate({
      path: "student",
      select: "name email",
    })
    .sort({ submittedAt: -1 });

  res.status(200).json({
    status: "success",
    results: submissions.length,
    data: {
      submissions,
    },
  });
});
