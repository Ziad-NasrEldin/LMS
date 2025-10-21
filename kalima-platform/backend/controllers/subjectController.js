const Subject = require("../models/subjectModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Level = require("../models/levelModel");
const Student = require("../models/studentModel");
const NotificationTemplate = require("../models/notificationTemplateModel");
const Notification = require("../models/notification");
// Create a new subject
exports.createSubject = catchAsync(async (req, res, next) => {
  const subject = await Subject.create(req.body);
  if (!subject) {
    return next(new AppError("Subject could not be created", 400));
  }

  res.status(201).json({
    status: "success",
    data: {
      subject,
    },
  });
});

// Get all subjects
exports.getAllSubjects = catchAsync(async (req, res, next) => {
  const subjects = await Subject.find().populate({
    path: "level",
    select: "name",
  });
  if (subjects.length === 0) {
    return next(new AppError("No subjects found", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      subjects,
    },
  });
});

// Get a subject by ID
exports.getSubjectById = catchAsync(async (req, res, next) => {
  const subject = await Subject.findById(req.params.id).populate({
    path: "level",
    select: "name",
  });
  if (!subject) {
    return next(new AppError("No subject found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      subject,
    },
  });
});

// Update a subject by ID
exports.updateSubjectById = catchAsync(async (req, res, next) => {
  const { name } = req.body;
  if (!name) {
    return next(new AppError("Name is required", 400));
  }
  const subject = await Subject.findByIdAndUpdate(
    req.params.id,
    { name },
    {
      new: true,
      runValidators: true,
    }
  );
  if (!subject) {
    return next(new AppError("No subject found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      subject,
    },
  });
});

exports.updateLevelOfSubject = catchAsync(async (req, res, next) => {
  const { operation, levelId } = req.body;
  if (!operation || !levelId) {
    return next(new AppError("Operation and level ID are required", 400));
  }
  const level = await Level.findById(levelId);
  if (!level) {
    return next(new AppError("No level found with that ID", 404));
  }

  let studentsnotified = 0;
  let subject = await Subject.findById(req.params.id);
  if (!subject) {
    return next(new AppError("No subject found with that ID", 404));
  }
  if (operation === "add") {
    if (subject.level.includes(levelId)) {
      return next(new AppError("Level already exists in subject", 400));
    }
    subject.level.push(levelId);
    await subject.save();
    // Get notification template
    const template = await NotificationTemplate.findOne({
      type: "new_subject",
    });
    if (!template) {
      console.log("Notification template not found for new_subject");
      return res.status(201).json({
        status: "success",
        data: { subject },
      });
    }

    // Find all students who should be notified
    const students = await Student.find({
      level: levelId,
      $or: [{ subjectNotify: true }, { subjectNotify: { $exists: false } }],
    });

    const io = req.app.get("io");
    const notificationsToCreate = [];

    await Promise.all(
      students.map(async (student) => {
        const notificationData = {
          title: template.title,
          message: template.message.replace("{subject}", subject.name),
          type: "new_subject",
          relatedId: subject._id,
        };

        // Check if student is online
        const isOnline = io.sockets.adapter.rooms.has(student._id.toString());
        const isSent = isOnline;

        // Create notification (will be sent immediately if online)
        const notification = await Notification.create({
          userId: student._id,
          ...notificationData,
          isSent,
        });

        notificationsToCreate.push(notification);

        // Send immediately if online
        if (isOnline) {
          studentsnotified++;
          io.to(student._id.toString()).emit("notification", {
            ...notificationData,
            notificationId: notification._id,
          });
        }
      })
    );
  } else if (operation === "remove") {
    if (!subject.level.includes(levelId)) {
      return next(new AppError("Level does not exist in subject", 400));
    }
    subject.level = subject.level.filter(
      (level) => level.toString() !== levelId
    );
    await subject.save();
  } else {
    return next(new AppError("Invalid operation", 400));
  }
  if (!subject) {
    return next(new AppError("No subject found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      subject,
      studentsnotified,
    },
  });
});

// Delete a subject by ID
exports.deleteSubjectById = catchAsync(async (req, res, next) => {
  const subject = await Subject.findByIdAndDelete(req.params.id);
  if (!subject) {
    return next(new AppError("No subject found with that ID", 404));
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});
