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
const StudentLectureAccess = require("../models/studentLectureAccessModel");
const { normalizeExternalUrl } = require("../utils/urlValidation");

const ADMIN_ROLES = ["Admin", "SubAdmin", "Moderator"];

const sanitizeAsciiFilename = (value) => {
  const normalized = String(value || "attachment")
    .replace(/[\r\n"]/g, "")
    .replace(/[^\x20-\x7E]/g, "_")
    .trim();

  return normalized || "attachment";
};

const buildContentDispositionHeader = (fileName) => {
  const normalized = String(fileName || "attachment")
    .replace(/[\r\n]/g, "")
    .trim();
  const asciiFallback = sanitizeAsciiFilename(normalized);
  const encodedUtf8Name = encodeURIComponent(normalized || asciiFallback);
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodedUtf8Name}`;
};

const canManageLectureAttachments = async (user, lecture) => {
  if (!user || !lecture) {
    return false;
  }

  if (ADMIN_ROLES.includes(user.role)) {
    return true;
  }

  if (user.role === "Lecturer") {
    return lecture.createdBy?.toString() === user._id?.toString();
  }

  if (user.role === "Assistant") {
    const assistant = await Assistant.findById(user._id).select("assignedLecturer").lean();
    return assistant?.assignedLecturer?.toString() === lecture.createdBy?.toString();
  }

  return false;
};

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

  if (attachment.fileType === "link") {
    throw new AppError("Link attachments should be opened directly from the stored URL", 400);
  }

  const safeFileUrl = normalizeExternalUrl(attachment.filePath);
  if (!safeFileUrl) {
    throw new AppError("Attachment URL is invalid or not publicly reachable", 400);
  }

  const file = await axios.get(safeFileUrl, {
    responseType: "stream",
    timeout: 15000,
    maxRedirects: 3,
  });

  const fileName = attachment.fileName || "attachment";
  res.setHeader("Content-Type", attachment.fileType || "application/octet-stream");
  res.setHeader("Content-Disposition", buildContentDispositionHeader(fileName));
  res.setHeader("X-Download-Filename", encodeURIComponent(fileName));

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

  const canManageAttachments = await canManageLectureAttachments(req.user, lecture);
  if (!canManageAttachments) {
    throw new AppError(`You are not authorized to upload attachments for this lecture`, 403);
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
        const safeLink = normalizeExternalUrl(linkValue);
        if (!safeLink) {
          throw new AppError(`Invalid ${type} link. Please provide a valid public HTTP/HTTPS URL`, 400);
        }

        const attachment = new Attachment({
          lectureId,
          type,
          fileType: "link",
          fileName: safeLink,
          filePath: safeLink,
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
      throw new AppError(`No files or links uploaded`, 400);
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
