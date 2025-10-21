const Attendance = require("../models/attendanceModel");
const Lesson = require("../models/lessonModel");
const PricingRule = require("../models/pricingRuleModel");
const AppError = require("../utils/appError");
const cStudent = require("../models/center.studentModel");
const catchAsync = require("../utils/catchAsync");
const QueryFeatures = require("../utils/queryFeatures");
const mongoose = require("mongoose");

// Record attendance using student sequenced ID only
exports.recordAttendance = catchAsync(async (req, res, next) => {
  const {
    studentSequencedId,  // Only accept sequenced ID for student identification
    lessonId,
    paymentType,
    isBookletPurchased,
    isNotGroup
  } = req.body;
  
  const recordedById = req.user._id;
  
  // Validate student sequenced ID
  if (!studentSequencedId) {
    return next(new AppError("Student Sequenced ID is required.", 400));
  }
  
  if (!lessonId || !paymentType) {
    return next(new AppError("Lesson ID and Payment Type are required.", 400));
  }

  // Find the lesson
  const lesson = await Lesson.findById(lessonId).lean();
  if (!lesson) {
    return next(new AppError("Lesson not found.", 404));
  }

  // Find student by sequenced ID only
  const student = await cStudent.findOne({ center_students_seq: studentSequencedId }).lean();
  if (!student) {
    return next(new AppError(`Student with Sequenced ID ${studentSequencedId} not found.`, 404));
  }

  // Check for existing attendance
  const existingAttendance = await Attendance.findOne({ student: student._id, lesson: lessonId });
  if (existingAttendance) {
    return next(new AppError("Student attendance already recorded for this specific lesson.", 409));
  }

  // Find applicable pricing rule
  const pricingRule = await PricingRule.findOne({
    lecturer: lesson.lecturer,
    subject: lesson.subject,
    level: lesson.level,
    $or: [{ center: lesson.center }, { center: null }],
  }).sort({ center: -1 });

  if (!pricingRule && paymentType !== 'unpaid') {
    return next(new AppError("No pricing rule found for this lesson combination. Cannot record paid attendance.", 404));
  }

  // Use default 0 if no rule found and type is unpaid, otherwise use rule prices
  const lessonDailyPrice = pricingRule ? pricingRule.dailyPrice : 0;
  const lessonMultiSessionPrice = pricingRule ? pricingRule.multiSessionPrice : 0;
  const lessonMultiSessionCount = pricingRule ? pricingRule.multiSessionCount : 1;

  // Prepare attendance data
  let attendanceData = {
    student: student._id, // We still store MongoDB ID internally
    studentSequencedId: student.center_students_seq, // But we also store sequencedId for easier lookup
    lesson: lessonId,
    center: lesson.center,
    lecturer: lesson.lecturer,
    subject: lesson.subject,
    level: lesson.level,
    paymentType,
    recordedBy: recordedById,
    attendanceDate: new Date(),
    amountPaid: 0,
    sessionsPaidFor: 0,
    sessionsRemaining: 0,
    isBookletPurchased: isBookletPurchased || false,
    isNotGroup: isNotGroup || false,
  };

  // Handle payment type specific logic
  if (paymentType === "daily") {
    attendanceData.amountPaid = lessonDailyPrice;
  } else if (paymentType === "multi-session") {
    // Find the latest multi-session record for this student by sequencedId
    const latestMultiSessionRecord = await Attendance.findOne({
      studentSequencedId: student.center_students_seq, // Use sequencedId for lookup
      lecturer: lesson.lecturer,
      subject: lesson.subject,
      level: lesson.level,
      paymentType: "multi-session",
    }).sort({ attendanceDate: -1 });

    if (latestMultiSessionRecord && latestMultiSessionRecord.sessionsRemaining > 0) {
      // Use existing session
      attendanceData.amountPaid = 0;
      attendanceData.sessionsPaidFor = 0;
      attendanceData.sessionsRemaining = latestMultiSessionRecord.sessionsRemaining - 1;
    } else {
      // New payment required
      if (!pricingRule) {
        return next(new AppError("Cannot process multi-session payment without a valid pricing rule.", 404));
      }
      
      if (lessonMultiSessionCount <= 0) {
        return next(new AppError("Pricing rule's multi-session count must be positive.", 400));
      }

      attendanceData.amountPaid = lessonMultiSessionPrice;
      attendanceData.sessionsPaidFor = lessonMultiSessionCount;
      attendanceData.sessionsRemaining = lessonMultiSessionCount - 1;
    }
  } else if (paymentType === "unpaid") {
    attendanceData.amountPaid = 0;
  } else {
    return next(new AppError("Invalid payment type.", 400));
  }

  // Add booklet price if purchased
  if (attendanceData.isBookletPurchased && lesson.bookletPrice) {
    attendanceData.amountPaid += lesson.bookletPrice;
  }

  // Create attendance record
  const newAttendance = await Attendance.create(attendanceData);

  // Determine payment status for response
  let paymentStatus = 'unknown';
  if (attendanceData.paymentType === 'unpaid') {
    paymentStatus = 'unpaid';
  } else if (attendanceData.amountPaid > 0) {
    paymentStatus = 'paid';
  } else if (attendanceData.paymentType === 'multi-session' && attendanceData.amountPaid === 0) {
    paymentStatus = 'session_used';
  }

  // Focus response on sequencedId instead of MongoDB ID
  res.status(201).json({
    status: "success",
    data: {
      attendance: {
        ...newAttendance.toObject(),
        student: {
          center_students_seq: student.center_students_seq,
          name: student.name
        }
      },
      paymentStatus,
    },
  });
});

// Get attendance by student sequenced ID
exports.getAttendance = catchAsync(async (req, res, next) => {
  const { studentSequencedId } = req.params;
  
  // If no sequencedId provided, require it
  if (!studentSequencedId) {
    return next(new AppError('Student sequenced ID is required', 400));
  }
  
  // Find attendance records directly by sequencedId 
  // (after we add the field to the attendanceModel)
  const features = new QueryFeatures(
    Attendance.find({ studentSequencedId }),
    req.query
  )
  .filter()
  .sort()
  .paginate();
  
  const attendanceRecords = await features.query.populate([
    { path: 'student', select: 'name center_students_seq' },
    { path: 'lesson', select: 'startTime' },
    { path: 'lecturer', select: 'name' },
    { path: 'recordedBy', select: 'name' },
    { path: 'center', select: 'name' },
    { path: 'subject', select: 'name' },
    { path: 'level', select: 'name' }
  ]);
  
  // Format response to emphasize sequencedId
  const formattedRecords = attendanceRecords.map(record => {
    const recordObj = record.toObject();
    if (recordObj.student) {
      recordObj.student = {
        center_students_seq: recordObj.student.center_students_seq,
        name: recordObj.student.name
      };
    }
    return recordObj;
  });
  
  res.status(200).json({
    status: 'success',
    results: attendanceRecords.length,
    data: {
      studentSequencedId,
      attendance: formattedRecords
    }
  });
});

// Get all attendance records
exports.getAllAttendance = catchAsync(async (req, res, next) => {
  // Standard attendance query processing
  const features = new QueryFeatures(Attendance.find(), req.query)
    .filter()
    .sort()
    .paginate();

  const attendanceRecords = await features.query.populate([
    { path: 'student', select: 'name center_students_seq' },
    { path: 'lesson', select: 'startTime' },
    { path: 'lecturer', select: 'name' },
    { path: 'recordedBy', select: 'name' },
    { path: 'center', select: 'name' },
    { path: 'subject', select: 'name' },
    { path: 'level', select: 'name' }
  ]);

  // Format response to emphasize sequencedId
  const formattedRecords = attendanceRecords.map(record => {
    const recordObj = record.toObject();
    if (recordObj.student) {
      recordObj.student = {
        center_students_seq: recordObj.student.center_students_seq,
        name: recordObj.student.name
      };
    }
    return recordObj;
  });

  res.status(200).json({
    status: 'success',
    results: formattedRecords.length,
    data: {
      attendance: formattedRecords
    }
  });
});

// Get an attendance record by ID
exports.getAttendanceById = catchAsync(async (req, res, next) => {
  const attendanceRecord = await Attendance.findById(req.params.id).populate([
    { path: 'student', select: 'name center_students_seq' },
    { path: 'lesson', select: 'startTime' },
    { path: 'lecturer', select: 'name' },
    { path: 'recordedBy', select: 'name' },
    { path: 'center', select: 'name' },
    { path: 'subject', select: 'name' },
    { path: 'level', select: 'name' }
  ]);

  if (!attendanceRecord) {
    return next(new AppError('No attendance record found with that ID', 404));
  }

  // Format response to emphasize sequencedId
  const formattedRecord = attendanceRecord.toObject();
  if (formattedRecord.student) {
    formattedRecord.student = {
      center_students_seq: formattedRecord.student.center_students_seq,
      name: formattedRecord.student.name
    };
  }

  res.status(200).json({
    status: 'success',
    data: {
      attendance: formattedRecord
    }
  });
});

// Update attendance with exam results
exports.updateExamResults = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { 
    examScore, 
    examMaxScore, 
    examPassThreshold, 
    examStatus, 
    examDate, 
    examNotes 
  } = req.body;

  // Validate required fields
  if (!examScore && examScore !== 0) {
    return next(new AppError('Exam score is required', 400));
  }
  
  if (!examMaxScore && examMaxScore !== 0) {
    return next(new AppError('Maximum exam score is required', 400));
  }

  // Check if attendance record exists
  const attendanceRecord = await Attendance.findById(id);
  if (!attendanceRecord) {
    return next(new AppError('No attendance record found with that ID', 404));
  }

  // Update the attendance record with exam results
  const updatedAttendance = await Attendance.findByIdAndUpdate(
    id,
    {
      examScore,
      examMaxScore,
      examPassThreshold: examPassThreshold || examMaxScore / 2, // Default to 50% if not provided
      examStatus,
      examDate: examDate || new Date(),
      examNotes
    },
    {
      new: true,
      runValidators: true
    }
  ).populate([
    { path: 'student', select: 'name center_students_seq' },
    { path: 'lesson', select: 'startTime' },
    { path: 'lecturer', select: 'name' },
    { path: 'subject', select: 'name' },
    { path: 'level', select: 'name' }
  ]);

  // Format response to emphasize sequencedId
  const formattedRecord = updatedAttendance.toObject();
  if (formattedRecord.student) {
    formattedRecord.student = {
      center_students_seq: formattedRecord.student.center_students_seq,
      name: formattedRecord.student.name
    };
  }

  res.status(200).json({
    status: 'success',
    data: {
      attendance: formattedRecord
    }
  });
});

// Update attendance record with leave time and calculate duration
exports.updateAttendance = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  // Check if attendance record exists
  const attendanceRecord = await Attendance.findById(id);
  if (!attendanceRecord) {
    return next(new AppError('No attendance record found with that ID', 404));
  }

  // Use current server time as leave time
  const parsedLeaveTime = new Date();

  // Ensure leave time is after attendance date
  const attendanceDate = new Date(attendanceRecord.attendanceDate);
  if (parsedLeaveTime < attendanceDate) {
    return next(new AppError('System time is earlier than attendance time, please check your system clock', 400));
  }

  // Calculate duration in minutes
  const durationInMs = parsedLeaveTime - attendanceDate;
  const durationInMinutes = Math.round(durationInMs / (1000 * 60));

  // Update the attendance record
  const updatedAttendance = await Attendance.findByIdAndUpdate(
    id,
    {
      leaveTime: parsedLeaveTime,
      attendanceDuration: durationInMinutes
    },
    {
      new: true,
      runValidators: true
    }
  ).populate([
    { path: 'student', select: 'name center_students_seq' },
    { path: 'lesson', select: 'startTime' },
    { path: 'lecturer', select: 'name' },
    { path: 'recordedBy', select: 'name' },
    { path: 'center', select: 'name' },
    { path: 'subject', select: 'name' },
    { path: 'level', select: 'name' }
  ]);

  // Format response to emphasize sequencedId
  const formattedRecord = updatedAttendance.toObject();
  if (formattedRecord.student) {
    formattedRecord.student = {
      center_students_seq: formattedRecord.student.center_students_seq,
      name: formattedRecord.student.name
    };
  }

  // Add formatted duration to the response for easier reading
  const hours = Math.floor(durationInMinutes / 60);
  const minutes = durationInMinutes % 60;
  formattedRecord.formattedDuration = hours > 0 
    ? `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`
    : `${minutes} minute${minutes !== 1 ? 's' : ''}`;

  res.status(200).json({
    status: 'success',
    data: {
      attendance: formattedRecord
    }
  });
});

// Delete an attendance record (unchanged)
exports.deleteAttendance = catchAsync(async (req, res, next) => {
  const attendanceRecord = await Attendance.findByIdAndDelete(req.params.id);

  if (!attendanceRecord) {
    return next(new AppError('No attendance record found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});
