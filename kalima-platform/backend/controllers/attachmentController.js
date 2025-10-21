/* eslint-disable */
const mongoose = require("mongoose");
const Container = require("../models/containerModel");
const Lecture = require("../models/LectureModel");
const Attachment = require("../models/attachmentModel");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const axios = require("axios");
const configureCloudinary = require("../config/cloudinaryOptions");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Lecturer = require("../models/lecturerModel");
const { result } = require("lodash");
const QueryFeatures = require("../utils/queryFeatures");
const Assistant = require("../models/assistantModel");
const NotificationTemplate = require("../models/notificationTemplateModel");
const Notification = require("../models/notification");
const StudentLectureAccess = require("../models/studentLectureAccessModel");
const Purchase = require("../models/purchaseModel");

// You can configure storage options here
// Would be changed once we have established cloud storage

configureCloudinary();
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "attachments",
    resource_type: "auto", // Allow all file types including documents, images, videos, and archives
  },
});

// Still Considering that one
// function fileFilter (req, file, cb) {}

// For backward compatibility: .single method
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});
exports.upload = upload;
// For multi-file, multi-category support
exports.multiUpload = upload.fields([
  { name: 'booklets', maxCount: 10 },
  { name: 'pdfsandimages', maxCount: 10 },
  { name: 'homeworks', maxCount: 10 },
  { name: 'exams', maxCount: 10 },
]);
  (exports.getLectureAttachments = catchAsync(async (req, res, next) => {
    const { lectureId } = req.params;
    const lecture = await Lecture.findById(lectureId)
      .populate("attachments.booklets")
      .populate("attachments.pdfsandimages")
      .populate("attachments.homeworks")
      .populate("attachments.exams")
      .lean();

    if (!lecture) {
      throw new AppError(`Lecture not found`, 404);
    }
    res.status(201).json(lecture.attachments);
  }));

exports.getAllAttachments = catchAsync(async (req, res, next) => {
  let query = Attachment.find({});
  query = new QueryFeatures(query, req.query).filter().sort().paginate();
  const attachments = await query.query
    .populate("lectureId", "title description")
    .populate("studentId", "name email")
    .lean();

  res.status(200).json({
    status: "success",
    result: attachments.length,
    data: {
      attachments,
    },
  });
});

exports.getAttachment = catchAsync(async (req, res, next) => {
  const { attachmentId } = req.params;
  const attachment = await Attachment.findById(attachmentId);
  if (!attachment) {
    throw new AppError(`attachment not found`, 404);
  }
  res.status(201).json({ attachment });
});

exports.getAttachmentFile = catchAsync(async (req, res, next) => {
  const { attachmentId } = req.params;

  if (!mongoose.isValidObjectId(attachmentId)) {
    throw new AppError(`Invalid Schema ID`, 404);
  }

  const attachment = await Attachment.findById(attachmentId);
  if (!attachment) {
    throw new AppError(`Attachment not found`, 404);
  }
  const file = await axios.get(attachment.filePath, {
    responseType: "stream",
  });

  res.setHeader("Content-Type", attachment.fileType);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${attachment.fileName}"`
  );

  file.data.pipe(res);

  file.data.on("error", (err) => {
    console.error("Stream error:", err);
    throw new AppError(`Error streaming file`, 500);
  });
});

exports.createAttachment = catchAsync(async (req, res, next) => {
  const { lectureId } = req.params;
  const validTypes = ["booklets", "pdfsandimages", "homeworks", "exams"];
  if (!mongoose.isValidObjectId(lectureId)) {
    throw new AppError(`Invalid Schema ID`, 404);
  }
  const lecture = await Lecture.findById(lectureId);
  if (!lecture) {
    throw new AppError(`Lecture not found`, 404);
  }

  // Accept links for homeworks and exams
  const { homeworks: homeworkLink, exams: examLink } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let anyUploaded = false;
    for (const type of validTypes) {
      if (req.files && req.files[type]) {
        for (const file of req.files[type]) {
          const attachment = new Attachment({
            lectureId,
            type,
            fileType: file.mimetype,
            fileName: file.originalname,
            filePath: file.path,
            fileSize: file.size,
            publicId: file.filename,
            uploadedOn: new Date(),
          });
          const savedAttachment = await attachment.save({ session });
          lecture.attachments[type].push(savedAttachment._id);
          anyUploaded = true;
        }
      }
      // If type is homeworks or exams, check for link
      if ((type === "homeworks" && homeworkLink && homeworkLink.trim() !== "") ||
          (type === "exams" && examLink && examLink.trim() !== "")) {
        const linkValue = type === "homeworks" ? homeworkLink : examLink;
        const attachment = new Attachment({
          lectureId,
          type,
          fileType: "link",
          fileName: linkValue,
          filePath: linkValue,
          fileSize: 0,
          publicId: null,
          uploadedOn: new Date(),
        });
        const savedAttachment = await attachment.save({ session });
        lecture.attachments[type].push(savedAttachment._id);
        anyUploaded = true;
      }
    }
    if (!anyUploaded) {
      throw new AppError(`No files or links uploaded`, 404);
    }
    await lecture.save({ session });
    await session.commitTransaction();
    session.endSession();
    res.status(201).json({ message: "Attachments uploaded successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return next(error);
  }
});

exports.uploadHomeWork = catchAsync(async (req, res, next) => {
  if (!req.file && !req.file.filename) {
    return next(new AppError(`No file uploaded`, 404));
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { lectureId } = req.params;
    const { type } = req.body;

    // Check if user is a student
    if (!req.user || req.user.role !== "Student") {
      await cloudinary.uploader.destroy(req.file.filename);
      throw new AppError(`You are not authorized to upload homework`, 403);
    }

    if (!type || type !== "homeworks") {
      await cloudinary.uploader.destroy(req.file.filename);
      throw new AppError(`Invalid file type`, 404);
    }

    if (!mongoose.isValidObjectId(lectureId)) {
      await cloudinary.uploader.destroy(req.file.filename);
      throw new AppError(`Invalid Schema ID`, 404);
    }

    const lecture = await Lecture.findById(lectureId)
      .populate("createdBy")
      .session(session);

    if (!lecture) {
      await cloudinary.uploader.destroy(req.file.filename);
      throw new AppError(`Lecture not found`, 404);
    }

    // Create the attachment
    const attachment = new Attachment({
      lectureId: lectureId,
      studentId: req.user._id,
      type: type,
      fileType: req.file.mimetype,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      publicId: req.file.filename,
      uploadedOn: new Date(),
    });

    const savedAttachment = await attachment.save({ session });
    if (!savedAttachment) {
      await cloudinary.uploader.destroy(req.file.filename);
      throw new AppError("Error saving attachment", 500);
    }

    // Notification logic - notify all assistants assigned to this lecturer
    const template = await NotificationTemplate.findOne({
      type: "new_homework",
    }).session(session);

    console.log("Notification template found:", template ? "Yes" : "No");
    console.log("Lecture creator found:", lecture.createdBy ? "Yes" : "No");

    if (template && lecture.createdBy) {
      const io = req.app.get("io");
      const student = req.user;

      console.log("Socket IO object:", io ? "Available" : "Not available");

      // Create notification data object
      const notificationData = {
        title: template.title,
        message: template.message
          .replace("{student}", student.name)
          .replace("{lecture}", lecture.name),
        type: "new_homework",
        relatedId: lecture._id,
      };

      console.log(
        "Creating notification for lecturer:",
        lecture.createdBy._id.toString()
      );

      // Create notification for the lecturer who created the lecture
      const lecturerIsOnline = io.sockets.adapter.rooms.has(
        lecture.createdBy._id.toString()
      );
      console.log("Lecturer is online:", lecturerIsOnline);
      const lecturerIsSent = lecturerIsOnline;

      // Create notification for the lecturer
      const lecturerNotification = await Notification.create(
        [
          {
            userId: lecture.createdBy._id,
            ...notificationData,
            isSent: lecturerIsSent,
          },
        ],
        { session }
      );

      console.log(
        "Lecturer notification created:",
        lecturerNotification[0]._id.toString()
      );

      // Send immediately if lecturer is online
      if (lecturerIsOnline) {
        console.log("Emitting notification to lecturer via socket");
        io.to(lecture.createdBy._id.toString()).emit("newHomework", {
          ...notificationData,
          notificationId: lecturerNotification[0]._id,
        });
      }

      // Find all assistants assigned to this lecturer
      const assistants = await Assistant.find({
        assignedLecturer: lecture.createdBy._id,
      }).session(session);

      console.log(`Found ${assistants.length} assistants for this lecturer`);

      await Promise.all(
        assistants.map(async (assistant) => {
          // Check if assistant is online
          const isOnline = io.sockets.adapter.rooms.has(
            assistant._id.toString()
          );
          const isSent = isOnline;

          // Create notification
          const notification = await Notification.create(
            [
              {
                userId: assistant._id,
                ...notificationData,
                isSent,
              },
            ],
            { session }
          );

          // Send immediately if online
          if (isOnline) {
            io.to(assistant._id.toString()).emit("newHomework", {
              ...notificationData,
              notificationId: notification[0]._id,
            });
          }
        })
      );
    }

    await session.commitTransaction();
    session.endSession();
    res.status(201).json({
      status: "success",
      message: "Attachment uploaded successfully",
      data: {
        attachment: savedAttachment,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    await cloudinary.uploader.destroy(req.file.filename);
    return next(error);
  }
});
exports.getAllHomeWork = catchAsync(async (req, res, next) => {
  const { lectureId } = req.params;
  let query = Attachment.find({
    lectureId: lectureId,
    studentId: { $ne: null },
    type: "homeworks",
  });

  query = new QueryFeatures(query, req.query).filter().sort().paginate();
  const attachments = await query.query
    .populate("studentId", "name email")
    .lean();

  if (!attachments) {
    throw new AppError(`No homework found`, 404);
  }
  res.status(200).json({
    status: "success",
    result: attachments.length,
    data: {
      attachments,
    },
  });
});
exports.deleteAttachment = catchAsync(async (req, res, next) => {
  const { attachmentId } = req.params;

  if (!mongoose.isValidObjectId(attachmentId)) {
    return next(new AppError(`Invalid Schema ID`, 404));
  }

  const attachment = await Attachment.findById(attachmentId);
  if (!attachment) {
    return next(new AppError(`Couldn't find attachment`, 404));
  }
  if (req.user.role === "Student") {
    if (attachment.studentId.toString() !== req.user._id.toString()) {
      return next(
        new AppError(`You are not authorized to delete this attachment`, 403)
      );
    }
    await cloudinary.uploader.destroy(attachment.publicId);
  } else {
    await cloudinary.uploader.destroy(attachment.publicId);
  }

  if (!attachment.studentId) {
    const lecture = await Lecture.findById(attachment.lectureId);

    switch (attachment.type.toLowerCase()) {
      case "booklets":
        lecture.attachments.booklets.pull(attachment._id);
        break;
      case "pdfsandimages":
        lecture.attachments.pdfsandimages.pull(attachment._id);
        break;
      case "homeworks":
        lecture.attachments.homeworks.pull(attachment._id);
        break;
      case "exams":
        lecture.attachments.exams.pull(attachment._id);
        break;
      default:
        await cloudinary.uploader.destroy(req.file.filename);
        return next(new AppError(`Invalid file type`, 404));
    }

    await lecture.save();
  }
  await attachment.deleteOne();

  res.status(204).json({ message: "Attachment deleted successfully" });
});
