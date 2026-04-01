const Container = require("../models/containerModel")
const mongoose = require("mongoose")
const AppError = require("../utils/appError")
const catchAsync = require("../utils/catchAsync")
const QueryFeatures = require("../utils/queryFeatures")
const Level = require("../models/levelModel")
const Subject = require("../models/subjectModel")
const Lecturer = require("../models/lecturerModel")
const Lecture = require("../models/LectureModel")
const LecturerExamConfig = require("../models/ExamConfigModel")
const Purchase = require("../models/purchaseModel")
const StudentLectureAccess = require("../models/studentLectureAccessModel")
const StudentExamSubmission = require("../models/studentExamSubmissionModel")
const { uploadSingleImageToDisk } = require("./../utils/upload files/uploadFiles")
const { buildLectureRequirements, getRestrictedLectureSnapshot } = require("../utils/lectureAccessUtils")
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

const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

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
        lecture_type,
        // New exam requirement fields
        requiresExam,
        examConfig,
        passingThreshold,
        requiresHomework,
        homeworkConfig,
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

      // Validate lecture type
      const allowedTypes = ["Free", "Paid", "Revision", "Teachers Only"]
      if (lecture_type && !allowedTypes.includes(lecture_type)) {
        if (thumbnailPath) deleteFile(thumbnailPath)
        throw new AppError(`Invalid lecture type. Allowed types are: ${allowedTypes.join(", ")}`, 400)
      }

      // Check required documents exist
      const levelDoc = await checkDoc(Level, level, session)
      const subjectDoc = await checkDoc(Subject, subject, session)
      const lecturerId = createdBy || req.user._id
      await checkDoc(Lecturer, lecturerId, session)

      validateThresholdRange(parsedPassingThreshold, "Exam passing threshold")
      validateThresholdRange(parsedHomeworkPassingThreshold, "Homework passing threshold")

      // Validate exam config if requires exam is true
      if (parsedRequiresExam && !examConfig) {
        if (thumbnailPath) deleteFile(thumbnailPath)
        throw new AppError("Exam configuration is required when requiresExam is true", 400)
      }

      if (parsedRequiresExam) {
        await validateLectureConfig({
          configId: examConfig,
          expectedType: "exam",
          lecturerId,
          session,
        })
      }

      // Validate homework config if requires homework is true
      if (parsedRequiresHomework && !homeworkConfig) {
        if (thumbnailPath) deleteFile(thumbnailPath)
        throw new AppError("Homework configuration is required when requiresHomework is true", 400)
      }

      if (parsedRequiresHomework) {
        await validateLectureConfig({
          configId: homeworkConfig,
          expectedType: "homework",
          lecturerId,
          session,
        })
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
            description,
            numberOfViews: parsedNumberOfViews,
            lecture_type,
            thumbnail: thumbnailPath,
            // Add exam requirement fields
            requiresExam: parsedRequiresExam,
            examConfig: parsedRequiresExam ? examConfig : undefined,
            passingThreshold: parsedRequiresExam ? parsedPassingThreshold : undefined,
            // Homework requirement fields
            requiresHomework: parsedRequiresHomework,
            homeworkConfig: parsedRequiresHomework ? homeworkConfig : undefined,
            homeworkPassingThreshold: parsedRequiresHomework ? parsedHomeworkPassingThreshold : undefined,
          },
        ],
        { session },
      )

      // Add lecture to parent's children if parent exists
      if (parent) {
        const parentContainer = await checkDoc(Container, parent, session)
        parentContainer.children.push(lecture[0]._id)
        await parentContainer.save({ session })
      }

      // Find or create lecturer's container

      let lecturerContainer = await Container.findOne({
        createdBy: lecturerId,
        type: "course", // Use a valid type from the enum
      }).session(session)

      if (!lecturerContainer) {
        // Create lecturer's container if it doesn't exist
        const lecturer = await Lecturer.findById(lecturerId).session(session)
        lecturerContainer = await Container.create(
          [
            {
              name: `${lecturer.name || "Lecturer"} Content`,
              type: "course", // Use a valid type from the enum
              createdBy: lecturerId,
              children: [],
              teacherAllowed: true, // Required field
            },
          ],
          { session },
        )
        lecturerContainer = lecturerContainer[0]
      }

      // Add lecture to lecturer's container if not already present
      if (!lecturerContainer.children.includes(lecture[0]._id)) {
        lecturerContainer.children.push(lecture[0]._id)
        await lecturerContainer.save({ session })
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
    { path: "level", select: "name" },
    { path: "examConfig", select: "name formUrl defaultPassingThreshold" },
    { path: "homeworkConfig", select: "name formUrl defaultPassingThreshold" },
  ])

  if (!container) {
    // Check in Container model for backward compatibility
    container = await Container.findOne({ _id: req.params.lectureId, type: "lecture" }).populate([
      { path: "createdBy", select: "name" },
      { path: "subject", select: "name" },
      { path: "level", select: "name" },
    ]);
  }

  if (!container) return next(new AppError("Lecture not found", 404))

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
    { path: "level", select: "name" },
    { path: "name", select: "name" },
    { path: "type", select: "name" },
  ])

  // Always select only basic, non-sensitive fields for this public route
  query = query.select("name type subject level createdBy price description lecture_type teacherAllowed thumbnail")

  const features = new QueryFeatures(query, req.query).filter().sort().paginate()

  const lectures = await features.query.lean()

  // Also fetch from Container model
  let containerQuery = Container.find({ type: "lecture" });
  containerQuery = containerQuery.populate([
    { path: "createdBy", select: "name" },
    { path: "subject", select: "name" },
    { path: "level", select: "name" },
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
    { path: "level", select: "name" },
  ])

  // No need to check req.user here as this route requires authentication
  // It will return all fields by default

  const features = new QueryFeatures(query, req.query).filter().sort().paginate()

  const lectures = await features.query.lean()

  // Also fetch from Container model
  const containerQuery = Container.find({ type: "lecture" }).populate([
    { path: "createdBy", select: "name" },
    { path: "subject", select: "name" },
    { path: "level", select: "name" },
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
    { path: "level", select: "name" },
  ]).lean();

  const containerLectures = await Container.find({
    createdBy: lecturerId,
    type: "lecture"
  }).populate([
    { path: "createdBy", select: "name" },
    { path: "subject", select: "name" },
    { path: "level", select: "name" },
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
      lecture_type,
      // New exam requirement fields
      requiresExam,
      examConfig,
      passingThreshold,
      requiresHomework,
      homeworkConfig,
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

      const canBypassOwnership = ["Admin", "SubAdmin", "Moderator"].includes(req.user?.role)
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
        lecture_type,
        teacherAllowed: teacherAllowed !== undefined ? parseBoolean(teacherAllowed) : undefined,
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

      // Basic validation for lecture_type (Mongoose enum validation also applies)
      if (lecture_type) {
        const allowedTypes = ["Free", "Paid", "Revision", "Teachers Only"]
        if (!allowedTypes.includes(lecture_type)) {
          if (req.file && req.file.path) {
            deleteFile(req.file.path)
          }
          throw new AppError(`Invalid lecture type. Allowed types are: ${allowedTypes.join(", ")}`, 400)
        }
      }

      const normalizedExamConfig = examConfig === "" ? null : examConfig
      const normalizedHomeworkConfig = homeworkConfig === "" ? null : homeworkConfig
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
        if (!nextExamConfig) {
          if (req.file && req.file.path) {
            deleteFile(req.file.path)
          }
          throw new AppError("Exam configuration is required when requiresExam is true", 400)
        }

        await validateLectureConfig({
          configId: nextExamConfig,
          expectedType: "exam",
          lecturerId: currentLecture.createdBy,
          session,
        })

        if (normalizedExamConfig !== undefined) {
          obj.examConfig = normalizedExamConfig
        }

        if (parsedPassingThreshold !== undefined) {
          obj.passingThreshold = parsedPassingThreshold
        }
      } else {
        obj.examConfig = null
        obj.passingThreshold = null
      }

      if (nextRequiresHomework) {
        if (!nextHomeworkConfig) {
          if (req.file && req.file.path) {
            deleteFile(req.file.path)
          }
          throw new AppError("Homework configuration is required when requiresHomework is true", 400)
        }

        await validateLectureConfig({
          configId: nextHomeworkConfig,
          expectedType: "homework",
          lecturerId: currentLecture.createdBy,
          session,
        })

        if (normalizedHomeworkConfig !== undefined) {
          obj.homeworkConfig = normalizedHomeworkConfig
        }

        if (parsedHomeworkPassingThreshold !== undefined) {
          obj.homeworkPassingThreshold = parsedHomeworkPassingThreshold
        }
      } else {
        obj.homeworkConfig = null
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
        { path: "examConfig", select: "name formUrl defaultPassingThreshold" },
        { path: "homeworkConfig", select: "name formUrl defaultPassingThreshold" },
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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { studentId, lectureId, purchaseId } = req.params;

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(studentId) ||
      !mongoose.Types.ObjectId.isValid(lectureId) ||
      !mongoose.Types.ObjectId.isValid(purchaseId)
    ) {
      throw new AppError("Invalid ID provided.", 400);
    }

    // Check if purchase exists and is a lecture purchase for this lecture
    const purchase = await Purchase.findById(purchaseId)
      .select("lecture type student")
      .session(session);

    if (!purchase) {
      throw new AppError("Purchase not found", 403);
    }

    if (purchase.type !== "lecturePurchase") {
      throw new AppError("Invalid purchase type for lecture access", 403);
    }

    if (purchase.lecture.toString() !== lectureId) {
      throw new AppError("Purchase does not match the requested lecture", 403);
    }

    if (purchase.student.toString() !== studentId) {
      throw new AppError("Purchase does not belong to this student", 403);
    }

    // Check if lecture exists
    const lecture = await Lecture.findById(lectureId).session(session);
    if (!lecture) {
      throw new AppError("Lecture not found", 404);
    }

    // Get or create student lecture access
    let access = await StudentLectureAccess.findOne({
      student: studentId,
      lecture: lectureId,
    }).session(session);

    if (!access) {
      const accessRecords = await StudentLectureAccess.create(
        [
          {
            student: studentId,
            lecture: lectureId,
            remainingViews: lecture.numberOfViews !== undefined && lecture.numberOfViews !== null
              ? lecture.numberOfViews
              : 3, // Only default to 3 if numberOfViews is not set
          },
        ],
        { session }
      );
      access = accessRecords[0];

      if (!access) {
        throw new AppError("Failed to grant access", 500);
      }
    } else {
      // Update last accessed time
      access.lastAccessed = Date.now();
      await access.save({ session });
    }

    await session.commitTransaction();

    res.status(200).json({
      status: "success",
      data: {
        lecture: {
          _id: lecture._id,
          name: lecture.name,
          kind: "Lecture"
        },
        access: {
          _id: access._id,
          remainingViews: access.remainingViews,
          lastAccessed: access.lastAccessed
        }
      },
    });
  } catch (error) {
    await session.abortTransaction();
    return next(error);
  } finally {
    session.endSession();
  }
});
