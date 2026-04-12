const Container = require("../models/containerModel")
const mongoose = require("mongoose")
const AppError = require("../utils/appError")
const catchAsync = require("../utils/catchAsync")
const QueryFeatures = require("../utils/queryFeatures")
const Level = require("../models/levelModel")
const Subject = require("../models/subjectModel")
const Lecturer = require("../models/lecturerModel")
const Attachment = require("../models/attachmentModel")
const Lecture = require("../models/LectureModel")
const LecturerExamConfig = require("../models/ExamConfigModel")
const Purchase = require("../models/purchaseModel")
const StudentLectureAccess = require("../models/studentLectureAccessModel")
const StudentExamSubmission = require("../models/studentExamSubmissionModel")
const { uploadSingleImageToDisk } = require("./../utils/upload files/uploadFiles")
const { buildLectureRequirements, getRestrictedLectureSnapshot } = require("../utils/lectureAccessUtils")
const {
  buildTargetAncestorIds,
  loadPurchaseForStudent,
  purchaseUnlocksTarget,
  resolveAccessibleLectureTarget,
  sanitizeLectureForAccess,
  serializeStudentLectureAccess,
  upsertStudentLectureAccess,
} = require("../utils/lectureAccessResolver")
const { normalizeExternalUrl } = require("../utils/urlValidation")
const { fetchYouTubeDuration } = require("../utils/youtubeDuration")
const {
  MASTER_ASSESSMENT_SHEET_ID,
  MASTER_ASSESSMENT_IDENTIFIER_COLUMN,
  MASTER_ASSESSMENT_SCORE_COLUMN,
  MASTER_ASSESSMENT_RAW_TAB,
} = require("../config/masterAssessmentConfig")
const fs = require("fs")
const path = require("path")

// Helper function to check if document exists
const checkDoc = async (Model, id, session) => {
  const doc = await Model.findById(id).session(session)
  if (!doc) {
    throw new AppError(`${Model.modelName} not found`, 404)
  }
  return doc
}

const parseBoolean = (value) => {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase()
    if (trimmed === "true" || trimmed === "1" || trimmed === "yes") {
      return true
    }
    if (trimmed === "false" || trimmed === "0" || trimmed === "no" || trimmed === "") {
      return false
    }
  }

  if (value === 1 || value === "1") {
    return true
  }

  if (value === 0 || value === "0") {
    return false
  }

  return Boolean(value)
}

const parseOptionalNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined
  }

  const parsedValue = Number(value)
  return Number.isNaN(parsedValue) ? undefined : parsedValue
}

const validateThresholdRange = (value, label) => {
  if (value !== undefined && (value < 0 || value > 100)) {
    throw new AppError(`${label} must be between 0 and 100`, 400)
  }
}

const validateLectureConfig = async ({ configId, expectedType, lecturerId, session }) => {
  if (!mongoose.isValidObjectId(configId)) {
    throw new AppError(`Invalid ${expectedType} configuration ID`, 400)
  }

  const config = await LecturerExamConfig.findOne({
    _id: configId,
    lecturer: lecturerId,
  }).session(session)

  if (!config) {
    throw new AppError(`${expectedType} configuration not found for this lecturer`, 404)
  }

  if (config.type !== expectedType) {
    throw new AppError(`Selected configuration must be of type '${expectedType}'`, 400)
  }

  return config
}

const normalizePublicFormUrl = (rawUrl, assessmentLabel) => {
  const normalizedUrl = normalizeExternalUrl(rawUrl)
  if (!normalizedUrl) {
    throw new AppError(`${assessmentLabel} form URL must be a valid public HTTP/HTTPS URL`, 400)
  }
  return normalizedUrl
}

const sanitizeTabSegment = (value) => {
  const normalizedValue = String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return normalizedValue || "lecture"
}

const toObjectIdOrNull = (value) => {
  if (!value) return null
  const idValue = typeof value === "object" && value._id ? value._id : value
  if (!mongoose.Types.ObjectId.isValid(idValue)) return null
  return new mongoose.Types.ObjectId(idValue)
}

const buildAssessmentTabBase = (lectureName, assessmentType) => {
  const suffix = assessmentType === "homework" ? "homework" : "exam"
  return `${sanitizeTabSegment(lectureName)}-${suffix}`
}

const resolveUniqueAssessmentTabName = async ({
  sheetId,
  baseName,
  excludeConfigId = null,
  session,
}) => {
  const normalizedBaseName = (baseName || MASTER_ASSESSMENT_RAW_TAB).slice(0, 100)
  const maxAttempts = 200

  for (let index = 1; index <= maxAttempts; index += 1) {
    const candidate = index === 1 ? normalizedBaseName : `${normalizedBaseName}-${index}`.slice(0, 100)
    const query = {
      googleSheetId: sheetId,
      googleSheetTabName: candidate,
    }

    if (excludeConfigId) {
      query._id = { $ne: excludeConfigId }
    }

    const existingConfig = await LecturerExamConfig.findOne(query).session(session)
    if (!existingConfig) {
      return candidate
    }
  }

  throw new AppError("Unable to allocate a unique sheet tab for this lecture", 500)
}

const ensureManagedAssessmentConfig = async ({
  lecturerId,
  lectureName,
  assessmentType,
  formUrl,
  passingThreshold,
  existingConfigId = null,
  session,
}) => {
  if (!MASTER_ASSESSMENT_SHEET_ID) {
    throw new AppError(
      "Master assessment sheet is not configured on the server",
      500
    )
  }

  const assessmentLabel = assessmentType === "homework" ? "Homework" : "Exam"
  const normalizedFormUrl = normalizePublicFormUrl(formUrl, assessmentLabel)
  const existingId = toObjectIdOrNull(existingConfigId)
  const defaultPassingThreshold = passingThreshold !== undefined ? Number(passingThreshold) : 60

  let configDoc = null
  if (existingId) {
    configDoc = await LecturerExamConfig.findOne({
      _id: existingId,
      lecturer: lecturerId,
      type: assessmentType,
    }).session(session)
  }

  if (!configDoc) {
    const tabName = await resolveUniqueAssessmentTabName({
      sheetId: MASTER_ASSESSMENT_SHEET_ID,
      baseName: buildAssessmentTabBase(lectureName, assessmentType),
      session,
    })

    const createdConfig = await LecturerExamConfig.create(
      [
        {
          lecturer: lecturerId,
          name: `${lectureName} ${assessmentLabel}`,
          type: assessmentType,
          description: `${assessmentLabel} configuration for ${lectureName}`,
          googleSheetId: MASTER_ASSESSMENT_SHEET_ID,
          googleSheetTabName: tabName,
          formUrl: normalizedFormUrl,
          studentIdentifierColumn: MASTER_ASSESSMENT_IDENTIFIER_COLUMN,
          scoreColumn: MASTER_ASSESSMENT_SCORE_COLUMN,
          defaultPassingThreshold,
          isActive: true,
        },
      ],
      { session },
    )

    return createdConfig[0]
  }

  configDoc.formUrl = normalizedFormUrl
  configDoc.googleSheetId = MASTER_ASSESSMENT_SHEET_ID
  configDoc.studentIdentifierColumn = MASTER_ASSESSMENT_IDENTIFIER_COLUMN
  configDoc.scoreColumn = MASTER_ASSESSMENT_SCORE_COLUMN
  if (configDoc.defaultPassingThreshold === undefined || configDoc.defaultPassingThreshold === null) {
    configDoc.defaultPassingThreshold = defaultPassingThreshold
  }

  if (!configDoc.googleSheetTabName) {
    configDoc.googleSheetTabName = await resolveUniqueAssessmentTabName({
      sheetId: MASTER_ASSESSMENT_SHEET_ID,
      baseName: buildAssessmentTabBase(lectureName, assessmentType),
      excludeConfigId: configDoc._id,
      session,
    })
  }

  await configDoc.save({ session })
  return configDoc
}

const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

// Unified endpoint to load all data needed for the lecture page
exports.loadLecturePage = catchAsync(async (req, res, next) => {
  const { lectureId } = req.params;
  const user = req.user;

  if (!mongoose.Types.ObjectId.isValid(lectureId)) {
    throw new AppError("Invalid lecture ID", 400);
  }

  // 1. Fetch Lecture Data
  let lecture = await Lecture.findById(lectureId).populate([
    { path: "createdBy", select: "name" },
    { path: "subject", select: "name" },
    { path: "level", select: "name nameAr kind sortOrder parentLevel isActive" },
    { path: "examConfig", select: "name formUrl googleSheetId googleSheetTabName defaultPassingThreshold" },
    { path: "homeworkConfig", select: "name formUrl googleSheetId googleSheetTabName defaultPassingThreshold" },
  ]);

  if (!lecture) {
    lecture = await Container.findOne({ _id: lectureId, type: "lecture" }).populate([
      { path: "createdBy", select: "name" },
      { path: "subject", select: "name" },
      { path: "level", select: "name nameAr kind sortOrder parentLevel isActive" },
    ]);
  }

  if (!lecture) throw new AppError("Lecture not found", 404);

  // Normalize form URLs
  if (lecture.examConfig?.formUrl) lecture.examFormUrl = lecture.examConfig.formUrl;
  else if (lecture.examLink) lecture.examFormUrl = lecture.examLink;

  if (lecture.homeworkConfig?.formUrl) lecture.homeworkFormUrl = lecture.homeworkConfig.formUrl;
  else if (lecture.homeworkLink) lecture.homeworkFormUrl = lecture.homeworkLink;

  // 2. Fetch Attachments
  const attachmentsResult = await Attachment.find({ lectureId }).lean();
  const categorizedAttachments = {
    exams: [],
    booklets: [],
    homeworks: [],
    pdfsandimages: [],
  };

  attachmentsResult.forEach(att => {
    const type = att.type?.toLowerCase();
    if (type === "exams") categorizedAttachments.exams.push(att);
    else if (type === "booklets") categorizedAttachments.booklets.push(att);
    else if (type === "homeworks") categorizedAttachments.homeworks.push(att);
    else categorizedAttachments.pdfsandimages.push(att);
  });

  // 3. User-specific data
  let accessData = null;
  let requirements = null;
  let homeworks = [];

  if (user.role === "Student") {
    // Check access record
    const access = await StudentLectureAccess.findOne({
      student: user._id,
      lecture: lectureId,
    }).lean();

    accessData = access ? {
      _id: access._id,
      remainingViews: access.remainingViews,
      lastAccessed: access.lastAccessed,
    } : null;

    // Check requirements
    requirements = buildLectureRequirements(lecture);
    if (lecture.requiresExam) {
      const examPassed = await StudentExamSubmission.findOne({
        student: user._id,
        lecture: lectureId,
        type: "exam",
        passed: true,
      }).lean();
      requirements.exam.passed = !!examPassed;
    }
    if (lecture.requiresHomework) {
      const hwPassed = await StudentExamSubmission.findOne({
        student: user._id,
        lecture: lectureId,
        type: "homework",
        passed: true,
      }).lean();
      requirements.homework.passed = !!hwPassed;
    }
  }

  // 4. Privileged homework fetch
  const privilegedRoles = ["Lecturer", "Admin", "SubAdmin", "Moderator", "Assistant"];
  if (privilegedRoles.includes(user.role)) {
    homeworks = await StudentExamSubmission.find({
      lecture: lectureId,
      type: "homework",
    }).populate("student", "name sequencedId").lean();
  }

  res.status(200).json({
    status: "success",
    data: {
      lecture,
      attachments: categorizedAttachments,
      accessData,
      requirements,
      homeworks,
      user: {
        id: user._id,
        role: user.role,
        email: user.email,
        name: user.name,
        fullName: user.fullName,
        sequenceId: user.sequencedId || user.sequenceId,
        studentId: user.sequencedId,
      },
    },
  });
});

exports.createLecture = catchAsync(async (req, res, next) => {

  // Handle image upload first
  uploadSingleImageToDisk(req, res, async (uploadErr) => {
    if (uploadErr) {
      return next(new AppError(uploadErr.message, 400))
    }

    const session = await mongoose.startSession()
    session.startTransaction()
    try {
      const {
        name,
        price,
        level,
        subject,
        parent,
        teacherAllowed,
        createdBy,
        videoLink,
        description,
        numberOfViews,
        // New exam requirement fields
        requiresExam,
        examConfig,
        examFormUrl,
        passingThreshold,
        requiresHomework,
        homeworkConfig,
        homeworkFormUrl,
        homeworkPassingThreshold,
      } = req.body

      const parsedRequiresExam = requiresExam !== undefined ? parseBoolean(requiresExam) : false
      const parsedRequiresHomework = requiresHomework !== undefined ? parseBoolean(requiresHomework) : false
      const parsedTeacherAllowed = teacherAllowed !== undefined ? parseBoolean(teacherAllowed) : true
      const parsedNumberOfViews = numberOfViews !== undefined && numberOfViews !== null && numberOfViews !== ""
        ? Number(numberOfViews)
        : 0
      const parsedPassingThreshold = parseOptionalNumber(passingThreshold)
      const parsedHomeworkPassingThreshold = parseOptionalNumber(homeworkPassingThreshold)

      const thumbnailPath = req.file ? req.file.path : null

      // Check required documents exist
      const levelDoc = await checkDoc(Level, level, session)
      const subjectDoc = await checkDoc(Subject, subject, session)
      const lecturerId = createdBy || req.user._id
      await checkDoc(Lecturer, lecturerId, session)

      if (!parent) {
        if (thumbnailPath) deleteFile(thumbnailPath)
        throw new AppError("Parent container is required for lecture creation", 400)
      }

      const parentContainer = await checkDoc(Container, parent, session)

      if (parentContainer.type === "lecture") {
        if (thumbnailPath) deleteFile(thumbnailPath)
        throw new AppError("Lectures cannot be nested under another lecture", 400)
      }

      // Check if user has permission to create lecture under this container
      const canBypassOwnership = ["Admin", "SubAdmin", "Moderator", "Assistant"].includes(req.user?.role)
      if (!canBypassOwnership && parentContainer.createdBy?.toString() !== lecturerId.toString()) {
        if (thumbnailPath) deleteFile(thumbnailPath)
        throw new AppError("Selected parent container does not belong to this lecturer", 403)
      }

      if (parentContainer.level && parentContainer.level.toString() !== levelDoc._id.toString()) {
        if (thumbnailPath) deleteFile(thumbnailPath)
        throw new AppError("Lecture level must match the selected parent container", 400)
      }

      if (parentContainer.subject && parentContainer.subject.toString() !== subjectDoc._id.toString()) {
        if (thumbnailPath) deleteFile(thumbnailPath)
        throw new AppError("Lecture subject must match the selected parent container", 400)
      }

      validateThresholdRange(parsedPassingThreshold, "Exam passing threshold")
      validateThresholdRange(parsedHomeworkPassingThreshold, "Homework passing threshold")

      let resolvedExamConfigId = null
      let normalizedExamFormUrl = null
      if (parsedRequiresExam) {
        if (examFormUrl) {
          normalizedExamFormUrl = normalizePublicFormUrl(examFormUrl, "Exam")

          if (MASTER_ASSESSMENT_SHEET_ID) {
            const managedExamConfig = await ensureManagedAssessmentConfig({
              lecturerId,
              lectureName: name,
              assessmentType: "exam",
              formUrl: normalizedExamFormUrl,
              passingThreshold: parsedPassingThreshold,
              existingConfigId: examConfig,
              session,
            })
            resolvedExamConfigId = managedExamConfig._id
          } else if (examConfig) {
            const existingExamConfig = await validateLectureConfig({
              configId: examConfig,
              expectedType: "exam",
              lecturerId,
              session,
            })
            resolvedExamConfigId = existingExamConfig._id
          }
        } else if (examConfig) {
          const existingExamConfig = await validateLectureConfig({
            configId: examConfig,
            expectedType: "exam",
            lecturerId,
            session,
          })
          resolvedExamConfigId = existingExamConfig._id
        } else {
          if (thumbnailPath) deleteFile(thumbnailPath)
          throw new AppError("Exam form URL is required when requiresExam is true", 400)
        }
      }

      let resolvedHomeworkConfigId = null
      let normalizedHomeworkFormUrl = null
      if (parsedRequiresHomework) {
        if (homeworkFormUrl) {
          normalizedHomeworkFormUrl = normalizePublicFormUrl(homeworkFormUrl, "Homework")

          if (MASTER_ASSESSMENT_SHEET_ID) {
            const managedHomeworkConfig = await ensureManagedAssessmentConfig({
              lecturerId,
              lectureName: name,
              assessmentType: "homework",
              formUrl: normalizedHomeworkFormUrl,
              passingThreshold: parsedHomeworkPassingThreshold,
              existingConfigId: homeworkConfig,
              session,
            })
            resolvedHomeworkConfigId = managedHomeworkConfig._id
          } else if (homeworkConfig) {
            const existingHomeworkConfig = await validateLectureConfig({
              configId: homeworkConfig,
              expectedType: "homework",
              lecturerId,
              session,
            })
            resolvedHomeworkConfigId = existingHomeworkConfig._id
          }
        } else if (homeworkConfig) {
          const existingHomeworkConfig = await validateLectureConfig({
            configId: homeworkConfig,
            expectedType: "homework",
            lecturerId,
            session,
          })
          resolvedHomeworkConfigId = existingHomeworkConfig._id
        } else {
          if (thumbnailPath) deleteFile(thumbnailPath)
          throw new AppError("Homework form URL is required when requiresHomework is true", 400)
        }
      }

      // Fetch YouTube video duration if videoLink is provided
      let videoDuration = 0;
      if (videoLink) {
        videoDuration = await fetchYouTubeDuration(videoLink);
      }

      // Create the lecture
      const lecture = await Lecture.create(
        [
          {
            name,
            type: "lecture",
            price: price || 0,
            level,
            subject,
            teacherAllowed: parsedTeacherAllowed,
            parent,
            createdBy: lecturerId,
            videoLink,
            duration: videoDuration,
            description,
            numberOfViews: parsedNumberOfViews,
            thumbnail: thumbnailPath,
            // Add exam requirement fields
            requiresExam: parsedRequiresExam,
            examConfig: parsedRequiresExam ? resolvedExamConfigId : undefined,
            examLink: parsedRequiresExam ? normalizedExamFormUrl : undefined,
            passingThreshold: parsedRequiresExam ? parsedPassingThreshold : undefined,
            // Homework requirement fields
            requiresHomework: parsedRequiresHomework,
            homeworkConfig: parsedRequiresHomework ? resolvedHomeworkConfigId : undefined,
            homeworkLink: parsedRequiresHomework ? normalizedHomeworkFormUrl : undefined,
            homeworkPassingThreshold: parsedRequiresHomework ? parsedHomeworkPassingThreshold : undefined,
          },
        ],
        { session },
      )

      // Add lecture to parent's children if parent exists
      if (!parentContainer.children.some((childId) => childId.toString() === lecture[0]._id.toString())) {
        parentContainer.children.push(lecture[0]._id)
        await parentContainer.save({ session })
      }

      await session.commitTransaction()
      res.status(201).json({
        status: "success",
        data: {
          lecture: lecture[0],
        },
      })
    } catch (error) {
      await session.abortTransaction()
      if (req.file && req.file.path) {
        deleteFile(req.file.path)
      }
      return next(error)
    } finally {
      session.endSession()
    }
  })
})
// Get Lecture by ID
exports.getLectureById = catchAsync(async (req, res, next) => {
  const Role = req.user.role?.toLowerCase()
  let container = await Lecture.findById(req.params.lectureId).populate([
    { path: "createdBy", select: "name" },
    { path: "subject", select: "name" },
    { path: "level", select: "name nameAr kind sortOrder parentLevel isActive" },
    { path: "examConfig", select: "name formUrl googleSheetId googleSheetTabName defaultPassingThreshold" },
    { path: "homeworkConfig", select: "name formUrl googleSheetId googleSheetTabName defaultPassingThreshold" },
  ])

  if (!container) {
    // Check in Container model for backward compatibility
    container = await Container.findOne({ _id: req.params.lectureId, type: "lecture" }).populate([
      { path: "createdBy", select: "name" },
      { path: "subject", select: "name" },
      { path: "level", select: "name nameAr kind sortOrder parentLevel isActive" },
    ]);
  }

  if (!container) return next(new AppError("Lecture not found", 404))

  if (container?.examConfig?.formUrl) {
    container.examFormUrl = container.examConfig.formUrl
  } else if (container?.examLink) {
    container.examFormUrl = container.examLink
  }

  if (container?.homeworkConfig?.formUrl) {
    container.homeworkFormUrl = container.homeworkConfig.formUrl
  } else if (container?.homeworkLink) {
    container.homeworkFormUrl = container.homeworkLink
  }

  if (req.user.role === "Student" && (container.requiresExam || container.requiresHomework)) {
    const requirements = buildLectureRequirements(container)

    if (container.requiresExam) {
      const examSubmission = await StudentExamSubmission.findOne({
        student: req.user._id,
        lecture: container._id,
        type: "exam",
        passed: true,
      }).lean()
      requirements.exam.passed = !!examSubmission
    }

    if (container.requiresHomework) {
      const homeworkSubmission = await StudentExamSubmission.findOne({
        student: req.user._id,
        lecture: container._id,
        type: "homework",
        passed: true,
      }).lean()
      requirements.homework.passed = !!homeworkSubmission
    }

    const isRestricted =
      (container.requiresExam && !requirements.exam.passed) ||
      (container.requiresHomework && !requirements.homework.passed)

    if (isRestricted) {
      return res.status(200).json({
        status: "restricted",
        message: "You must complete all required submissions before accessing this lecture",
        data: {
          container: getRestrictedLectureSnapshot(container),
          requirements,
        },
      })
    }
  }

  if (Role === "teacher") {
    if (!container.teacherAllowed) {
      return res.status(200).json({
        status: "restricted",
        data: {
          id: container._id,
          name: container.name,
          owner: container.createdBy.name || container.createdBy._id,
          subject: container.subject.name || container.subject._id,
          type: container.type,
        },
      })
    }
  }

  res.status(200).json({
    status: "success",
    data: {
      container,
    },
  })
})

// New function specifically for public, non-sensitive data
exports.getAllLecturesPublic = catchAsync(async (req, res, next) => {
  let query = Lecture.find()

  // Populate common fields
  query = query.populate([
    { path: "createdBy", select: "name" },
    { path: "subject", select: "name" },
    { path: "level", select: "name nameAr kind sortOrder parentLevel isActive" },
    { path: "name", select: "name" },
    { path: "type", select: "name" },
  ])

  // Always select only basic, non-sensitive fields for this public route
  query = query.select("name type subject level createdBy price description teacherAllowed thumbnail")

  const features = new QueryFeatures(query, req.query).filter().sort().paginate()

  const lectures = await features.query.lean()

  // Also fetch from Container model
  let containerQuery = Container.find({ type: "lecture" });
  containerQuery = containerQuery.populate([
    { path: "createdBy", select: "name" },
    { path: "subject", select: "name" },
    { path: "level", select: "name nameAr kind sortOrder parentLevel isActive" },
  ]);
  containerQuery = containerQuery.select("name type subject level createdBy price description teacherAllowed image");

  const containerFeatures = new QueryFeatures(containerQuery, req.query).filter().sort().paginate();
  const containerLectures = await containerFeatures.query.lean();

  const allLectures = [...lectures, ...containerLectures];

  res.status(200).json({
    status: "success",
    results: allLectures.length,
    data: {
      containers: allLectures,
    },
  })
})

// Existing function for authenticated users (returns full data if authenticated)
exports.getAllLectures = catchAsync(async (req, res, next) => {
  // This function now assumes req.user exists because it's protected by verifyJWT middleware
  const query = Lecture.find().populate([
    { path: "createdBy", select: "name" },
    { path: "subject", select: "name" },
    { path: "level", select: "name nameAr kind sortOrder parentLevel isActive" },
  ])

  // No need to check req.user here as this route requires authentication
  // It will return all fields by default

  const features = new QueryFeatures(query, req.query).filter().sort().paginate()

  const lectures = await features.query.lean()

  // Also fetch from Container model
  const containerQuery = Container.find({ type: "lecture" }).populate([
    { path: "createdBy", select: "name" },
    { path: "subject", select: "name" },
    { path: "level", select: "name nameAr kind sortOrder parentLevel isActive" },
  ]);

  const containerFeatures = new QueryFeatures(containerQuery, req.query).filter().sort().paginate();
  const containerLectures = await containerFeatures.query.lean();

  const allLectures = [...lectures, ...containerLectures];

  if (!allLectures || allLectures.length === 0) {
    // Check length for lean() results
    return next(new AppError("Lectures not found", 404))
  }

  // Removed the teacher-specific role check and mapping logic.
  // Authenticated users get full data (unless specific role restrictions are added back later).

  res.status(200).json({
    status: "success",
    results: allLectures.length,
    data: {
      containers: allLectures,
    },
  })
})

exports.getLecturerLectures = catchAsync(async (req, res, next) => {
  const { lecturerId } = req.params

  if (!lecturerId) {
    return next(new AppError("Lecturer ID is required", 400))
  }

  const lectures = await Lecture.find({
    createdBy: lecturerId,
  }).populate([
    { path: "createdBy", select: "name" },
    { path: "subject", select: "name" },
    { path: "level", select: "name nameAr kind sortOrder parentLevel isActive" },
  ]).lean();

  const containerLectures = await Container.find({
    createdBy: lecturerId,
    type: "lecture"
  }).populate([
    { path: "createdBy", select: "name" },
    { path: "subject", select: "name" },
    { path: "level", select: "name nameAr kind sortOrder parentLevel isActive" },
  ]).lean();

  const allLectures = [...lectures, ...containerLectures];

  res.status(200).json({
    status: "success",
    results: allLectures.length,
    data: {
      containers: allLectures,
    },
  })
})

exports.updatelectures = catchAsync(async (req, res, next) => {
  // Handle image upload first
  uploadSingleImageToDisk(req, res, async (uploadErr) => {
    if (uploadErr) {
      return next(new AppError(uploadErr.message, 400))
    }

    const {
      name,
      type,
      price,
      level,
      subject,
      videoLink,
      teacherAllowed,
      description,
      numberOfViews,
      // New exam requirement fields
      requiresExam,
      examConfig,
      examFormUrl,
      passingThreshold,
      requiresHomework,
      homeworkConfig,
      homeworkFormUrl,
      homeworkPassingThreshold,
    } = req.body

    const session = await mongoose.startSession()
    session.startTransaction()
    try {
      const currentLecture = await Lecture.findById(req.params.lectureId).session(session)
      if (!currentLecture) {
        if (req.file && req.file.path) {
          deleteFile(req.file.path)
        }
        throw new AppError("No lecture found with that ID", 404)
      }

      const canBypassOwnership = ["Admin", "SubAdmin", "Moderator", "Assistant"].includes(req.user?.role)
      if (!canBypassOwnership && currentLecture.createdBy?.toString() !== req.user._id.toString()) {
        if (req.file && req.file.path) {
          deleteFile(req.file.path)
        }
        throw new AppError("You do not have permission to edit this lecture", 403)
      }

      const obj = {
        name,
        type,
        price,
        videoLink,
        description,
        numberOfViews,
        teacherAllowed: teacherAllowed !== undefined ? parseBoolean(teacherAllowed) : undefined,
      }

      // Fetch new YouTube duration if videoLink is being updated
      if (videoLink && videoLink !== currentLecture.videoLink) {
        const newDuration = await fetchYouTubeDuration(videoLink);
        obj.duration = newDuration;
      }

      const parsedPassingThreshold = parseOptionalNumber(passingThreshold)
      const parsedHomeworkPassingThreshold = parseOptionalNumber(homeworkPassingThreshold)

      validateThresholdRange(parsedPassingThreshold, "Exam passing threshold")
      validateThresholdRange(parsedHomeworkPassingThreshold, "Homework passing threshold")

      if (req.file && req.file.path) {
        // Delete old thumbnail if it exists
        if (currentLecture.thumbnail) {
          deleteFile(currentLecture.thumbnail)
        }
        obj.thumbnail = req.file.path
      }

      const normalizedExamConfig = examConfig === "" ? null : examConfig
      const normalizedHomeworkConfig = homeworkConfig === "" ? null : homeworkConfig
      const normalizedExamFormUrl = examFormUrl === "" ? null : examFormUrl
      const normalizedHomeworkFormUrl = homeworkFormUrl === "" ? null : homeworkFormUrl
      const nextRequiresExam =
        requiresExam !== undefined ? parseBoolean(requiresExam) : currentLecture.requiresExam
      const nextRequiresHomework =
        requiresHomework !== undefined ? parseBoolean(requiresHomework) : currentLecture.requiresHomework
      const nextExamConfig =
        normalizedExamConfig !== undefined ? normalizedExamConfig : currentLecture.examConfig
      const nextHomeworkConfig =
        normalizedHomeworkConfig !== undefined ? normalizedHomeworkConfig : currentLecture.homeworkConfig

      if (requiresExam !== undefined) {
        obj.requiresExam = nextRequiresExam
      }

      if (requiresHomework !== undefined) {
        obj.requiresHomework = nextRequiresHomework
      }

      if (nextRequiresExam) {
        if (normalizedExamFormUrl !== undefined && normalizedExamFormUrl !== null) {
          obj.examLink = normalizedExamFormUrl

          if (MASTER_ASSESSMENT_SHEET_ID) {
            const managedExamConfig = await ensureManagedAssessmentConfig({
              lecturerId: currentLecture.createdBy,
              lectureName: name || currentLecture.name,
              assessmentType: "exam",
              formUrl: normalizedExamFormUrl,
              passingThreshold: parsedPassingThreshold,
              existingConfigId: currentLecture.examConfig || normalizedExamConfig,
              session,
            })

            obj.examConfig = managedExamConfig._id
          } else {
            obj.examConfig = null
          }
        } else if (nextExamConfig) {
          const validatedExamConfig = await validateLectureConfig({
            configId: nextExamConfig,
            expectedType: "exam",
            lecturerId: currentLecture.createdBy,
            session,
          })

          if (normalizedExamConfig !== undefined) {
            obj.examConfig = validatedExamConfig._id
          }
        } else {
          if (req.file && req.file.path) {
            deleteFile(req.file.path)
          }
          throw new AppError("Exam form URL is required when requiresExam is true", 400)
        }

        if (parsedPassingThreshold !== undefined) {
          obj.passingThreshold = parsedPassingThreshold
        }
      } else {
        obj.examConfig = null
        obj.examLink = null
        obj.passingThreshold = null
      }

      if (nextRequiresHomework) {
        if (normalizedHomeworkFormUrl !== undefined && normalizedHomeworkFormUrl !== null) {
          obj.homeworkLink = normalizedHomeworkFormUrl

          if (MASTER_ASSESSMENT_SHEET_ID) {
            const managedHomeworkConfig = await ensureManagedAssessmentConfig({
              lecturerId: currentLecture.createdBy,
              lectureName: name || currentLecture.name,
              assessmentType: "homework",
              formUrl: normalizedHomeworkFormUrl,
              passingThreshold: parsedHomeworkPassingThreshold,
              existingConfigId: currentLecture.homeworkConfig || normalizedHomeworkConfig,
              session,
            })

            obj.homeworkConfig = managedHomeworkConfig._id
          } else {
            obj.homeworkConfig = null
          }
        } else if (nextHomeworkConfig) {
          const validatedHomeworkConfig = await validateLectureConfig({
            configId: nextHomeworkConfig,
            expectedType: "homework",
            lecturerId: currentLecture.createdBy,
            session,
          })

          if (normalizedHomeworkConfig !== undefined) {
            obj.homeworkConfig = validatedHomeworkConfig._id
          }
        } else {
          if (req.file && req.file.path) {
            deleteFile(req.file.path)
          }
          throw new AppError("Homework form URL is required when requiresHomework is true", 400)
        }

        if (parsedHomeworkPassingThreshold !== undefined) {
          obj.homeworkPassingThreshold = parsedHomeworkPassingThreshold
        }
      } else {
        obj.homeworkConfig = null
        obj.homeworkLink = null
        obj.homeworkPassingThreshold = null
      }

      if (subject) {
        const subjectDoc = await checkDoc(Subject, subject, session)
        obj.subject = subjectDoc._id
      }
      if (level) {
        const levelDoc = await checkDoc(Level, level, session)
        obj.level = levelDoc._id
      }
      const updatedContainer = await Lecture.findByIdAndUpdate(req.params.lectureId, obj, {
        new: true,
        runValidators: true,
        session,
      }).populate([
        { path: "createdBy", select: "name" },
        { path: "examConfig", select: "name formUrl googleSheetId googleSheetTabName defaultPassingThreshold" },
        { path: "homeworkConfig", select: "name formUrl googleSheetId googleSheetTabName defaultPassingThreshold" },
      ])

      if (!updatedContainer) {
        if (req.file && req.file.path) {
          deleteFile(req.file.path)
        }
        throw new AppError("No container found with that ID", 404)
      }

      await session.commitTransaction()
      res.status(200).json({
        status: "success",
        data: {
          container: updatedContainer,
        },
      })
    } catch (error) {
      await session.abortTransaction()
      if (req.file && req.file.path) {
        deleteFile(req.file.path)
      }
      return next(error)
    } finally {
      session.endSession()
    }
  })
})

exports.UpdateParentOfLecture = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession()
  session.startTransaction()
  try {
    const { parentId, lectureId, operation } = req.body
    const parentContainer = await Container.findById(parentId).session(session)
    if (!parentContainer) {
      throw new AppError("Container not found", 404)
    }

    const lecture = await Lecture.findById(lectureId).session(session)
    if (!lecture) {
      throw new AppError("lecture container not found", 404)
    }
    if (operation === "add") {
      lecture.parent = parentId
      await lecture.save({ session })
      parentContainer.children.push(lectureId)
      await parentContainer.save({ session })
    } else if (operation === "remove") {
      lecture.parent = null
      await lecture.save({ session })
      parentContainer.children = parentContainer.children.filter((child) => child.toString() !== lectureId)
      await parentContainer.save({ session })
    } else {
      throw new AppError("Invalid operation", 400)
    }
    await session.commitTransaction()

    res.status(200).json({ status: "success", data: { lecture } })
  } catch (error) {
    await session.abortTransaction()
    return next(error)
  } finally {
    session.endSession()
  }
})

exports.deletelecture = catchAsync(async (req, res, next) => {
  let session
  try {
    const { lectureId } = req.params
    if (!mongoose.Types.ObjectId.isValid(lectureId)) {
      throw new AppError("Invalid container id", 400)
    }

    session = await mongoose.startSession()
    session.startTransaction()

    const lecture = await Lecture.findById(lectureId).session(session)
    if (!lecture) {
      throw new AppError("Lecture not found", 404)
    }

    // Check if user has permission to delete this lecture
    const canBypassOwnership = ["Admin", "SubAdmin", "Moderator", "Assistant"].includes(req.user?.role)
    if (!canBypassOwnership && lecture.createdBy?.toString() !== req.user._id.toString()) {
      throw new AppError("You do not have permission to delete this lecture", 403)
    }

    if (lecture.thumbnail) {
      deleteFile(lecture.thumbnail)
    }

    // Remove this lecture from its parent container's children array if it has a parent
    if (lecture.parent) {
      const parent = await Container.findById(lecture.parent).session(session)
      if (parent) {
        parent.children = parent.children.filter((child) => child.toString() !== lectureId)
        await parent.save({ session })
      }
    }

    // Delete the actual lecture
    await Lecture.findByIdAndDelete(lectureId).session(session)

    await session.commitTransaction()
    res.status(204).json({ status: "success", data: null })
  } catch (error) {
    if (session) {
      await session.abortTransaction()
    }
    return next(error)
  } finally {
    if (session) {
      session.endSession()
    }
  }
})

exports.deleteLectureThumbnail = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession()
  session.startTransaction()
  try {
    const { lectureId } = req.params

    const lecture = await Lecture.findById(lectureId).session(session)
    if (!lecture) {
      throw new AppError("Lecture not found", 404)
    }

    // Check if user has permission to delete this lecture thumbnail
    const canBypassOwnership = ["Admin", "SubAdmin", "Moderator", "Assistant"].includes(req.user?.role)
    if (!canBypassOwnership && lecture.createdBy?.toString() !== req.user._id.toString()) {
      throw new AppError("You do not have permission to modify this lecture", 403)
    }

    if (lecture.thumbnail) {
      deleteFile(lecture.thumbnail)

      // Update lecture to remove thumbnail reference
      await Lecture.findByIdAndUpdate(lectureId, { $unset: { thumbnail: 1 } }, { session })
    }

    await session.commitTransaction()
    res.status(200).json({
      status: "success",
      message: "Thumbnail deleted successfully",
    })
  } catch (error) {
    await session.abortTransaction()
    return next(error)
  } finally {
    session.endSession()
  }
})

// Check student access to standalone lecture
exports.checkStudentLectureAccess = catchAsync(async (req, res, next) => {
  const { studentId, lectureId, purchaseId } = req.params

  if (
    !mongoose.Types.ObjectId.isValid(studentId) ||
    !mongoose.Types.ObjectId.isValid(lectureId) ||
    !mongoose.Types.ObjectId.isValid(purchaseId)
  ) {
    throw new AppError("Invalid ID provided.", 400)
  }

  const lectureResult = await resolveAccessibleLectureTarget(lectureId)

  if (!lectureResult) {
    throw new AppError("Lecture not found", 404)
  }

  const purchase = await loadPurchaseForStudent(purchaseId, studentId)
  const targetAncestorIds = await buildTargetAncestorIds(lectureResult.targetDoc)

  if (!purchaseUnlocksTarget(purchase, lectureResult.targetDoc, targetAncestorIds)) {
    throw new AppError("Purchase does not match the requested lecture", 403)
  }

  const access = await upsertStudentLectureAccess(studentId, lectureResult.targetDoc)
  const lecture = sanitizeLectureForAccess(lectureResult.targetDoc, access)

  res.status(200).json({
    status: "success",
    data: {
      lecture,
      access: serializeStudentLectureAccess(access),
    },
  })
});
