const mongoose = require("mongoose");
const Report = require("../models/reportModel");
const Attendance = require("../models/attendanceModel");
const cStudent = require("../models/center.studentModel");
const cParent = require("../models/center.parentModel");
const Lesson = require("../models/lessonModel");
const GroupedLessons = require("../models/groupedLessonsModel");
const Purchase = require("../models/purchaseModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

/**
 * Generate a report for a single lesson for a specific student
 */
exports.generateLessonReport = catchAsync(async (req, res, next) => {
  const { studentId, lessonId, notes } = req.body;

  if (!studentId) {
    return next(new AppError("Student ID is required - you must specify which student this report is for", 400));
  }

  if (!lessonId) {
    return next(new AppError("Lesson ID is required", 400));
  }

  // Find the student
  const student = await cStudent.findById(studentId).populate("parent");
  if (!student) {
    return next(new AppError(`Student with ID ${studentId} not found`, 404));
  }

  // Find the parent
  const parent = await cParent.findById(student.parent);
  if (!parent) {
    return next(new AppError("Parent not found for this student", 404));
  }

  // Find the lesson
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    return next(new AppError("Lesson not found", 404));
  }

  // Find attendance record for this student and lesson
  const attendance = await Attendance.findOne({
    student: studentId,
    lesson: lessonId
  });
  
  let attendanceData = null;
  if (attendance) {
    attendanceData = {
      attendanceDate: attendance.attendanceDate,
      leaveTime: attendance.leaveTime,
      attendanceDuration: attendance.attendanceDuration,
      examScore: attendance.examScore,
      examMaxScore: attendance.examMaxScore,
      examStatus: attendance.examStatus,
      isBookletPurchased: attendance.isBookletPurchased,
      amountPaid: attendance.amountPaid
    };
  }

  // Create or update report
  const report = await Report.findOneAndUpdate(
    { student: studentId, lesson: lessonId, reportType: "lesson" },
    {
      student: studentId,
      lesson: lessonId,
      reportType: "lesson",
      notes: notes || "",
      createdBy: req.user._id
    },
    { new: true, upsert: true }
  );

  res.status(200).json({
    status: "success",
    data: {
      report: {
        _id: report._id,
        reportType: "lesson",
        notes: report.notes,
        studentName: student.name,
        parentName: parent.name,
        attendance: attendanceData,
        isBookletPurchased: attendance ? attendance.isBookletPurchased : false,
        amountPaid: attendance ? attendance.amountPaid : 0
      }
    }
  });
});

/**
 * Generate a report for a month (groupedLessons with type month)
 */
exports.generateMonthReport = catchAsync(async (req, res, next) => {
  const { studentId, courseOrmonthId, notes } = req.body;

  if (!studentId) {
    return next(new AppError("Student ID is required - you must specify which student this report is for", 400));
  }
  
  if (!courseOrmonthId) {
    return next(new AppError("GroupedLessons ID is required", 400));
  }

  // Find the student
  const student = await cStudent.findById(studentId).populate("parent");
  if (!student) {
    return next(new AppError(`Student with ID ${studentId} not found`, 404));
  }

  // Find the parent
  const parent = await cParent.findById(student.parent);
  if (!parent) {
    return next(new AppError("Parent not found for this student", 404));
  }

  // Find the grouped lessons (month) entity
  const monthEntity = await GroupedLessons.findById(courseOrmonthId);
  if (!monthEntity) {
    return next(new AppError("GroupedLessons entity not found", 404));
  }

  // Check if this is a month type (if type information is available)
  if (monthEntity.groupedLessonstype && monthEntity.groupedLessonstype !== "month") {
    return next(new AppError("The specified GroupedLessons is not a month type", 400));
  }

  // Get lessons in this grouped lessons entity
  let lessons = [];
  if (monthEntity.lessons && monthEntity.lessons.length > 0) {
    // If lessons are directly stored in the groupedLessons
    lessons = await Lesson.find({
      _id: { $in: monthEntity.lessons }
    }).select('_id startTime bookletPrice');
  } else {
    // Otherwise look up lessons that reference this groupedLessons
    lessons = await Lesson.find({ courseOrmonth: courseOrmonthId }).select('_id startTime bookletPrice');
  }
  
  const lessonIds = lessons.map(lesson => lesson._id);

  // Find all attendance records for this student and the lessons with full lesson data
  const attendanceRecords = await Attendance.find({
    student: studentId,
    lesson: { $in: lessonIds }
  }).populate({
    path: "lesson",
    select: "startTime bookletPrice"
  }).sort({ attendanceDate: 1 });

  // Calculate total amount paid correctly including booklet purchases
  let totalPaid = 0;
  
  attendanceRecords.forEach(record => {
    // Add the amount paid - this should already include booklet price
    // which is added in the attendanceController
    totalPaid += (record.amountPaid || 0);
  });

  // Create or update report
  const report = await Report.findOneAndUpdate(
    { student: studentId, courseOrmonth: courseOrmonthId, reportType: "month" },
    {
      student: studentId,
      courseOrmonth: courseOrmonthId,
      reportType: "month",
      notes: notes || "",
      createdBy: req.user._id
    },
    { new: true, upsert: true }
  );

  res.status(200).json({
    status: "success",
    data: {
      report: {
        _id: report._id,
        reportType: "month",
        monthName: monthEntity.name,
        notes: report.notes,
        studentName: student.name,
        parentName: parent.name,
        attendance: attendanceRecords.map(record => ({
          date: record.attendanceDate,
          leaveTime: record.leaveTime,
          duration: record.attendanceDuration,
          examScore: record.examScore,
          examMaxScore: record.examMaxScore,
          examStatus: record.examStatus,
          lessonStartTime: record.lesson ? record.lesson.startTime : null,
          isBookletPurchased: record.isBookletPurchased,
          paymentType: record.paymentType,
          amountPaid: record.amountPaid
        })),
        totalPaid
      }
    }
  });
});

/**
 * Generate a report for a course (groupedLessons with type course)
 */
exports.generateCourseReport = catchAsync(async (req, res, next) => {
  const { studentId, courseOrmonthId, notes } = req.body;

  if (!studentId) {
    return next(new AppError("Student ID is required - you must specify which student this report is for", 400));
  }
  
  if (!courseOrmonthId) {
    return next(new AppError("GroupedLessons ID is required", 400));
  }

  // Find the student
  const student = await cStudent.findById(studentId).populate("parent");
  if (!student) {
    return next(new AppError(`Student with ID ${studentId} not found`, 404));
  }

  // Find the parent
  const parent = await cParent.findById(student.parent);
  if (!parent) {
    return next(new AppError("Parent not found for this student", 404));
  }

  // Find the grouped lessons (course) entity
  const courseEntity = await GroupedLessons.findById(courseOrmonthId);
  if (!courseEntity) {
    return next(new AppError("GroupedLessons entity not found", 404));
  }

  // Check if this is a course type (if type information is available)
  if (courseEntity.groupedLessonstype && courseEntity.groupedLessonstype !== "course") {
    return next(new AppError("The specified GroupedLessons is not a course type", 400));
  }

  // Get lessons in this grouped lessons entity
  let lessons = [];
  if (courseEntity.lessons && courseEntity.lessons.length > 0) {
    // If lessons are directly stored in the groupedLessons
    lessons = courseEntity.lessons;
  } else {
    // Otherwise look up lessons that reference this groupedLessons
    lessons = await Lesson.find({ courseOrmonth: courseOrmonthId }).select('_id startTime bookletPrice');
    lessons = lessons.map(lesson => lesson);
  }

  const lessonIds = lessons.map(lesson => lesson._id || lesson);

  // Find all attendance records for this student and the lessons
  const attendanceRecords = await Attendance.find({
    student: studentId,
    lesson: { $in: lessonIds }
  }).populate({
    path: "lesson",
    select: "startTime bookletPrice"
  }).sort({ attendanceDate: 1 });

  // Group attendance records by month for payment summary
  const paymentsPerMonth = {};
  attendanceRecords.forEach(record => {
    const date = record.attendanceDate;
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
    if (!paymentsPerMonth[monthKey]) {
      paymentsPerMonth[monthKey] = {
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        total: 0
      };
    }
    
    paymentsPerMonth[monthKey].total += (record.amountPaid || 0);
  });

  // Create or update report
  const report = await Report.findOneAndUpdate(
    { student: studentId, courseOrmonth: courseOrmonthId, reportType: "course" },
    {
      student: studentId,
      courseOrmonth: courseOrmonthId,
      reportType: "course",
      notes: notes || "",
      createdBy: req.user._id
    },
    { new: true, upsert: true }
  );

  res.status(200).json({
    status: "success",
    data: {
      report: {
        _id: report._id,
        reportType: "course",
        courseName: courseEntity.name,
        notes: report.notes,
        studentName: student.name,
        parentName: parent.name,
        attendance: attendanceRecords.map(record => ({
          date: record.attendanceDate,
          leaveTime: record.leaveTime,
          duration: record.attendanceDuration,
          examScore: record.examScore,
          examMaxScore: record.examMaxScore,
          examStatus: record.examStatus,
          lessonStartTime: record.lesson ? record.lesson.startTime : null,
          isBookletPurchased: record.isBookletPurchased,
          paymentType: record.paymentType,
          amountPaid: record.amountPaid
        })),
        paymentsPerMonth: Object.values(paymentsPerMonth),
        totalPaid: Object.values(paymentsPerMonth).reduce((sum, month) => sum + month.total, 0)
      }
    }
  });
});

/**
 * Get a specific report by ID
 */
exports.getReportById = catchAsync(async (req, res, next) => {
  const reportId = req.params.id;
  
  const report = await Report.findById(reportId);
  if (!report) {
    return next(new AppError("Report not found", 404));
  }
  
  let reportData;
  
  if (report.reportType === "lesson") {
    reportData = await generateLessonReportData(report);
  } else if (report.reportType === "month") {
    reportData = await generateMonthReportData(report);
  } else if (report.reportType === "course") {
    reportData = await generateCourseReportData(report);
  }
  
  res.status(200).json({
    status: "success",
    data: {
      report: reportData
    }
  });
});

/**
 * Get all reports for a student
 */
exports.getStudentReports = catchAsync(async (req, res, next) => {
  const { studentId } = req.params;
  
  if (!studentId) {
    return next(new AppError("Student ID is required", 400));
  }
  
  const reports = await Report.find({ student: studentId });
  
  res.status(200).json({
    status: "success",
    results: reports.length,
    data: {
      reports
    }
  });
});

/**
 * Helper function to generate lesson report data
 */
const generateLessonReportData = async (report) => {
  const student = await cStudent.findById(report.student).populate("parent");
  const parent = await cParent.findById(student.parent);
  const attendance = await Attendance.findOne({
    student: report.student,
    lesson: report.lesson
  });
  
  let attendanceData = null;
  if (attendance) {
    attendanceData = {
      attendanceDate: attendance.attendanceDate,
      leaveTime: attendance.leaveTime,
      attendanceDuration: attendance.attendanceDuration,
      examScore: attendance.examScore,
      examMaxScore: attendance.examMaxScore,
      examStatus: attendance.examStatus,
      isBookletPurchased: attendance.isBookletPurchased,
      amountPaid: attendance.amountPaid
    };
  }
  
  return {
    _id: report._id,
    reportType: "lesson",
    notes: report.notes,
    studentName: student.name,
    parentName: parent.name,
    attendance: attendanceData,
    isBookletPurchased: attendance ? attendance.isBookletPurchased : false,
    amountPaid: attendance ? attendance.amountPaid : 0
  };
};

/**
 * Helper function to generate month report data
 */
const generateMonthReportData = async (report) => {
  const student = await cStudent.findById(report.student).populate("parent");
  const parent = await cParent.findById(student.parent);
  const monthEntity = await GroupedLessons.findById(report.courseOrmonth);
  
  if (!monthEntity) {
    throw new AppError("Month entity not found", 404);
  }
  
  // Get lessons in this month
  let lessons = [];
  if (monthEntity.lessons && monthEntity.lessons.length > 0) {
    lessons = monthEntity.lessons;
  } else {
    const lessonsInMonth = await Lesson.find({ courseOrmonth: report.courseOrmonth }).select('_id startTime bookletPrice');
    lessons = lessonsInMonth.map(lesson => lesson);
  }
  
  const lessonIds = lessons.map(lesson => lesson._id || lesson);
  
  const attendanceRecords = await Attendance.find({
    student: report.student,
    lesson: { $in: lessonIds }
  }).populate({
    path: "lesson",
    select: "startTime bookletPrice"
  }).sort({ attendanceDate: 1 });

  // Calculate total amount paid correctly including booklet purchases
  let totalPaid = 0;
  
  attendanceRecords.forEach(record => {
    // Add the direct payment amount
    totalPaid += (record.amountPaid || 0);
  });
  
  return {
    _id: report._id,
    reportType: "month",
    monthName: monthEntity.name,
    notes: report.notes,
    studentName: student.name,
    parentName: parent.name,
    attendance: attendanceRecords.map(record => ({
      date: record.attendanceDate,
      leaveTime: record.leaveTime,
      duration: record.attendanceDuration,
      examScore: record.examScore,
      examMaxScore: record.examMaxScore,
      examStatus: record.examStatus,
      lessonStartTime: record.lesson ? record.lesson.startTime : null,
      isBookletPurchased: record.isBookletPurchased,
      paymentType: record.paymentType,
      amountPaid: record.amountPaid
    })),
    totalPaid
  };
};

/**
 * Helper function to generate course report data
 */
const generateCourseReportData = async (report) => {
  const student = await cStudent.findById(report.student).populate("parent");
  const parent = await cParent.findById(student.parent);
  const courseEntity = await GroupedLessons.findById(report.courseOrmonth);
  
  if (!courseEntity) {
    throw new AppError("Course entity not found", 404);
  }
  
  // Get lessons in this month
  let lessons = [];
  if (courseEntity.lessons && courseEntity.lessons.length > 0) {
    lessons = courseEntity.lessons;
  } else {
    const lessonsInCourse = await Lesson.find({ courseOrmonth: report.courseOrmonth }).select('_id startTime bookletPrice');
    lessons = lessonsInCourse.map(lesson => lesson);
  }
  
  const lessonIds = lessons.map(lesson => lesson._id || lesson);
  
  const attendanceRecords = await Attendance.find({
    student: report.student,
    lesson: { $in: lessonIds }
  }).populate({
    path: "lesson",
    select: "startTime bookletPrice"
  }).sort({ attendanceDate: 1 });
  
  const paymentsPerMonth = {};
  attendanceRecords.forEach(record => {
    const date = record.attendanceDate;
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
    if (!paymentsPerMonth[monthKey]) {
      paymentsPerMonth[monthKey] = {
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        total: 0
      };
    }
    
    paymentsPerMonth[monthKey].total += (record.amountPaid || 0);
  });
  
  return {
    _id: report._id,
    reportType: "course",
    courseName: courseEntity.name,
    notes: report.notes,
    studentName: student.name,
    parentName: parent.name,
    attendance: attendanceRecords.map(record => ({
      date: record.attendanceDate,
      leaveTime: record.leaveTime,
      duration: record.attendanceDuration,
      examScore: record.examScore,
      examMaxScore: record.examMaxScore,
      examStatus: record.examStatus,
      lessonStartTime: record.lesson ? record.lesson.startTime : null,
      isBookletPurchased: record.isBookletPurchased,
      paymentType: record.paymentType,
      amountPaid: record.amountPaid
    })),
    paymentsPerMonth: Object.values(paymentsPerMonth),
    totalPaid: Object.values(paymentsPerMonth).reduce((sum, month) => sum + month.total, 0)
  };
};
