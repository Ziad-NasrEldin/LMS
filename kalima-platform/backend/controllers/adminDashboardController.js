const mongoose = require("mongoose");
const Student = require("../models/studentModel");
const Parent = require("../models/parentModel");
const Teacher = require("../models/teacherModel");
const Lecturer = require("../models/lecturerModel");
const catchAsync = require("../utils/catchAsync");
const QuerFeatures = require("../utils/queryFeatures");
const User = require("../models/userModel");
const Purchase = require("../models/purchaseModel");
const Container = require("../models/containerModel");
const AppError = require("../utils/appError");

exports.getUserStats = catchAsync(async (req, res, next) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: stats,
  });
});

exports.getStudentData = catchAsync(async (req, res, next) => {
  const { studentId } = req.params;

  const student = await Student.findById(studentId)
    .populate("parent", "name email")
    .populate("level", "name")
    .populate("lecturerPoints.lecturer", "name")
    .lean();

  if (!student) return next(new AppError("Couldn't find student.", 404));
  res.status(200).json({
    status: "success",
    data: student,
  });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  let query = User.find().select("-password").lean();
  const features = new QuerFeatures(query, req.query)
    .filter()
    .sort()
    .paginate();
  query = features.query;

  const users = await query
    .populate({ path: "subject", select: "name" })
    .populate({ path: "level", select: "name" });

  if (!users.length) return next(new AppError("Couldn't find users.", 404));

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

exports.getAllContainers = catchAsync(async (req, res, next) => {
  let query = Container.find().lean();
  const features = new QuerFeatures(query, req.query)
    .filter()
    .sort()
    .paginate();
  query = features.query;
  const container = await query
    .populate({ path: "subject", select: "name" })
    .populate({ path: "level", select: "name" })
    .populate({ path: "createdBy", select: "name" })
    .populate({ path: "children", select: "name" });
  if (!container.length)
    return next(new AppError("Couldn't find containers.", 404));
  res.status(200).json({
    status: "success",
    results: container.length,
    data: {
      container,
    },
  });
});

exports.getContainerData = catchAsync(async (req, res, next) => {
  const { containerId } = req.params;
  const container = await Container.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(containerId) } },
    {
      $lookup: {
        from: "users",
        let: { userId: "$createdBy" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
          { $project: { name: 1, email: 1 } },
        ],
        as: "createdBy",
      },
    },
    {
      $lookup: {
        from: "containers",
        let: { parentId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$parent", "$$parentId"] } } },
          { $project: { _id: 1, name: 1 } },
        ],
        as: "children",
      },
    },

    {
      $lookup: {
        from: "subjects",
        let: { subjectId: "$subject" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$subjectId"] } } },
          { $project: { name: 1, _id: 1 } },
        ],
        as: "subject",
      },
    },
    {
      $lookup: {
        from: "levels",
        let: { levelId: "$level" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$levelId"] } } },
          { $project: { name: 1, _id: 1 } },
        ],
        as: "level",
      },
    },
    {
      $lookup: {
        from: "purchases",
        let: { containerId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$container", "$$containerId"] },
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "student",
              foreignField: "_id",
              as: "studentData",
            },
          },
          {
            $unwind: {
              path: "$studentData",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 1,
              student: { _id: "$studentData._id", name: "$studentData.name" },
              purchaseDate: 1,
              points: 1,
              status: 1,
            },
          },
        ],
        as: "purchases",
      },
    },
    {
      $addFields: {
        totalPurchases: { $size: "$purchases" },
        totalPoints: { $sum: "$purchases.points" },
      },
    },
  ]);
  if (!container) return next(new AppError("Couldn't find container.", 404));
  res.status(200).json({
    status: "success",
    data: container,
  });
});
