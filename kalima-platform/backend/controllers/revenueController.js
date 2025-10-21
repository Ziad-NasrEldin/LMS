const mongoose = require("mongoose");
const Attendance = require("../models/attendanceModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

const buildRevenueMatchStage = (query) => {
  const matchStage = {};
  const {
    lecturerId,
    subjectId,
    levelId,
    centerId,
    lessonId,
    startDate,
    endDate,
  } = query;

  if (lecturerId) matchStage.lecturer = new mongoose.Types.ObjectId(lecturerId);
  if (subjectId) matchStage.subject = new mongoose.Types.ObjectId(subjectId);
  if (levelId) matchStage.level = new mongoose.Types.ObjectId(levelId);
  if (centerId) matchStage.center = new mongoose.Types.ObjectId(centerId);
  if (lessonId) matchStage.lesson = new mongoose.Types.ObjectId(lessonId);

  if (startDate || endDate) {
    matchStage.attendanceDate = {};
    if (startDate) matchStage.attendanceDate.$gte = new Date(startDate);
    if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999); // Include the whole end day
        matchStage.attendanceDate.$lte = endOfDay;
    }
  }

  // Ensure we only sum actual payments
  matchStage.amountPaid = { $gt: 0 };

  return matchStage;
};

exports.calculateRevenue = catchAsync(async (req, res, next) => {
  const matchStage = buildRevenueMatchStage(req.query);

  const revenueResult = await Attendance.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "lessons",
        localField: "lesson",
        foreignField: "_id",
        as: "lessonData"
      }
    },
    {
      $addFields: {
        bookletAmount: {
          $cond: [
            "$isBookletPurchased",
            { $arrayElemAt: ["$lessonData.bookletPrice", 0] },
            0
          ]
        },
        lessonAmount: {
          $subtract: ["$amountPaid", { 
            $cond: [
              "$isBookletPurchased",
              { $arrayElemAt: ["$lessonData.bookletPrice", 0] },
              0
            ] 
          }]
        }
      }
    },
    {
      $group: {
        _id: null, // Group all matched documents together
        totalLessonRevenue: { $sum: "$lessonAmount" },
        totalBookletRevenue: { $sum: "$bookletAmount" },
        totalAttendancesPaid: { $sum: 1 } // Count attendances where payment occurred
      },
    },
    {
      $project: {
        _id: 0, // Exclude the default _id field
        totalLessonRevenue: 1,
        totalBookletRevenue: 1,
        totalRevenue: { $add: ["$totalLessonRevenue", "$totalBookletRevenue"] },
        totalAttendancesPaid: 1
      }
    }
  ]);

  const result = revenueResult[0] || { 
    totalRevenue: 0, 
    totalLessonRevenue: 0,
    totalBookletRevenue: 0,
    totalAttendancesPaid: 0 
  }; // Default if no results

  res.status(200).json({
    status: "success",
    data: result,
  });
});

exports.calculateRevenueBreakdown = catchAsync(async (req, res, next) => {
  const matchStage = buildRevenueMatchStage(req.query);

  const revenueResult = await Attendance.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "lessons",
        localField: "lesson",
        foreignField: "_id",
        as: "lessonData"
      }
    },
    {
      $addFields: {
        bookletAmount: {
          $cond: [
            "$isBookletPurchased",
            { $arrayElemAt: ["$lessonData.bookletPrice", 0] },
            0
          ]
        }
      }
    },
    {
      $group: {
        _id: {
          paymentType: "$paymentType",
          bookletPurchased: "$isBookletPurchased"
        },
        totalRevenue: { $sum: "$amountPaid" },
        totalBookletRevenue: { $sum: "$bookletAmount" },
        count: { $sum: 1 }
      },
    },
    {
      $project: {
        _id: 0,
        paymentType: "$_id.paymentType",
        bookletPurchased: "$_id.bookletPurchased",
        totalRevenue: 1,
        totalBookletRevenue: 1,
        totalLessonRevenue: { $subtract: ["$totalRevenue", "$totalBookletRevenue"] },
        count: 1
      }
    },
    { $sort: { paymentType: 1, bookletPurchased: 1 } }
  ]);

  // Calculate overall total
  const overallTotal = revenueResult.reduce((sum, item) => sum + item.totalRevenue, 0);
  const overallCount = revenueResult.reduce((sum, item) => sum + item.count, 0);
  const overallBookletRevenue = revenueResult.reduce((sum, item) => sum + item.totalBookletRevenue, 0);
  const overallLessonRevenue = revenueResult.reduce((sum, item) => sum + item.totalLessonRevenue, 0);

  res.status(200).json({
    status: "success",
    data: {
      breakdown: revenueResult,
      overallTotalRevenue: overallTotal,
      overallLessonRevenue: overallLessonRevenue,
      overallBookletRevenue: overallBookletRevenue,
      overallAttendancesPaid: overallCount
    },
  });
});
