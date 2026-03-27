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
const NotificationTemplate = require("../models/notificationTemplateModel")
const Notification = require("../models/notification")
const Student = require("../models/studentModel")
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
  console.log("[v0] parseBoolean input:", value, "type:", typeof value)

  if (typeof value === "boolean") {
    console.log("[v0] parseBoolean boolean result:", value)
    return value
  }

  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase()
    if (trimmed === "true" || trimmed === "1" || trimmed === "yes") {
      console.log("[v0] parseBoolean string true result:", true, "from:", value)
      return true
    }
    if (trimmed === "false" || trimmed === "0" || trimmed === "no" || trimmed === "") {
      console.log("[v0] parseBoolean string false result:", false, "from:", value)
      return false
    }
  }

  if (value === 1 || value === "1") {
    console.log("[v0] parseBoolean numeric true result:", true)
    return true
  }

  if (value === 0 || value === "0") {
    console.log("[v0] parseBoolean numeric false result:", false)
    return false
  }

  const result = Boolean(value)
  console.log("[v0] parseBoolean default result:", result, "from:", value)
  return result
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

      console.log("[v0] Raw requiresExam:", requiresExam, "type:", typeof requiresExam)
      console.log("[v0] Raw requiresHomework:", requiresHomework, "type:", typeof requiresHomework)

      const parsedRequiresExam = requiresExam !== undefined ? parseBoolean(requiresExam) : false
      const parsedRequiresHomework = requiresHomework !== undefined ? parseBoolean(requiresHomework) : false
      const parsedTeacherAllowed = teacherAllowed !== undefined ? parseBoolean(teacherAllowed) : true
      const parsedNumberOfViews = numberOfViews !== undefined && numberOfViews !== null && numberOfViews !== ""
        ? Number(numberOfViews)
        : 0
      const parsedPassingThreshold = parseOptionalNumber(passingThreshold)
      const parsedHomeworkPassingThreshold = parseOptionalNumber(homeworkPassingThreshold)

      console.log("[v0] Parsed requiresExam:", parsedRequiresExam)
      console.log("[v0] Parsed requiresHomework:", parsedRequiresHomework)

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

      console.log("[v0] Created lecture requiresHomework:", lecture[0].requiresHomework)
      console.log("[v0] Created lecture requiresExam:", lecture[0].requiresExam)

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

      // Notification logic - only for paid lectures
      let studentsNotified = 0
      if (lecture_type === "Paid" && parent) {
        // Get the container chain (all parent containers up the hierarchy)
        const containerChainResult = await Container.aggregate([
          {
            $match: { _id: new mongoose.Types.ObjectId(parent) },
          },
          {
            $graphLookup: {
              from: "containers",
              startWith: "$parent",
              connectFromField: "parent",
              connectToField: "_id",
              as: "parentChain",
            },
          },
        ]).session(session)

        // Extract all container IDs in the hierarchy (including the direct parent)
        const containerIds = [parent, ...(containerChainResult[0]?.parentChain.map((c) => c._id) || [])]

        // Find all purchases where container is in this hierarchy
        const purchases = await Purchase.find({
          container: { $in: containerIds },
          type: "containerPurchase",
        }).session(session)

        // Get unique student IDs from these purchases
        const studentIds = [...new Set(purchases.map((p) => p.student.toString()))]

        // Find these students who want notifications
        const students = await Student.find({
          _id: { $in: studentIds },
          $or: [{ lectureNotify: true }, { lectureNotify: { $exists: false } }],
        }).session(session)

        // Get notification template
        const template = await NotificationTemplate.findOne({
          type: "new_lecture",
        }).session(session)
        console.log("students" + template)

        if (template && students.length > 0) {
          const io = req.app.get("io")
          const notificationsToCreate = []

          await Promise.all(
            students.map(async (student) => {
              // Prepare notification data
              const notificationData = {
                title: template.title,
                message: template.message.replace("{lecture}", name).replace("{subject}", subjectDoc.name),
                type: "new_lecture",
                relatedId: lecture[0]._id,
              }

              // Check if student is online
              const isOnline = io.sockets.adapter.rooms.has(student._id.toString())
              const isSent = isOnline

              // Create notification
              const notification = await Notification.create(
                [
                  {
                    userId: student._id,
                    ...notificationData,
                    isSent,
                  },
                ],
                { session },
              )

              notificationsToCreate.push(notification[0])

              // Send immediately if online
              if (isOnline) {
                studentsNotified++
                io.to(student._id.toString()).emit("newLecture", {
                  ...notificationData,
                  notificationId: notification[0]._id,
                })
              }
            }),
          )
        }
      }

      await session.commitTransaction()
      res.status(201).json({
        status: "success",
        data: {
          lecture: lecture[0],
          studentsNotified,
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

      // Send notifications to students who have access to this lecture
      try {
        // Get notification template for lecture updates
        const template = await NotificationTemplate.findOne({
          type: "lecture_updated",
        }).session(session)

        if (!template) {
          console.log("No notification template found for lecture_updated")
        } else {
          // IMPROVED STUDENT ACCESS DETECTION
          // Step 1: Get students with direct access
          const studentAccess = await StudentLectureAccess.find({
            lecture: req.params.lectureId,
          }).session(session)
          let studentIdsWithAccess = studentAccess.map((access) => access.student.toString())

          // Step 2: Get students with access through container purchases
          // Find lecture to get its parent container
          if (updatedContainer && updatedContainer.parent) {
            // Get the parent container and any containers above it
            const containerHierarchy = await Container.aggregate([
              {
                $match: {
                  _id: new mongoose.Types.ObjectId(updatedContainer.parent),
                },
              },
              {
                $graphLookup: {
                  from: "containers",
                  startWith: "$parent",
                  connectFromField: "parent",
                  connectToField: "_id",
                  as: "parentContainers",
                },
              },
            ]).session(session)

            if (containerHierarchy.length > 0) {
              // Get all container IDs in the hierarchy (including direct parent)
              const containerIds = [
                updatedContainer.parent.toString(),
                ...containerHierarchy[0].parentContainers.map((c) => c._id.toString()),
              ]

              // Find all purchases for these containers
              const purchases = await Purchase.find({
                container: {
                  $in: containerIds.map((id) => new mongoose.Types.ObjectId(id)),
                },
                type: "containerPurchase",
              }).session(session)

              // Get student IDs from these purchases
              const studentIdsFromPurchases = purchases.map((p) => p.student.toString())

              // Combine with direct access student IDs, removing duplicates
              studentIdsWithAccess = [...new Set([...studentIdsWithAccess, ...studentIdsFromPurchases])]
            }
          }

          console.log(
            `Found ${studentIdsWithAccess.length} students with access to updated lecture ${req.params.lectureId} (direct or through purchase)`,
          )

          if (studentIdsWithAccess.length > 0) {
            const io = req.app.get("io")
            if (!io) {
              console.log("Socket.IO instance not found")
              return
            }

            // Create notification message based on what was updated
            let updateDescription = "Content was updated"
            if (name) updateDescription = "Title was updated"
            if (description) updateDescription = "Description was updated"
            if (videoLink) updateDescription = "Video link was updated"
            if (examConfig) updateDescription = "Exam requirements were updated"
            if (homeworkConfig) updateDescription = "Homework requirements were updated"

            // Prepare notification data
            const notificationData = {
              title: template.title,
              message: template.message
                .replace("{lecture}", updatedContainer.name || "lecture")
                .replace("{update}", updateDescription),
              type: "lecture_updated",
              relatedId: updatedContainer._id,
            }

            console.log("Creating lecture update notifications with data:", notificationData)

            // Create notifications for all students
            const notificationsToCreate = studentIdsWithAccess.map((studentId) => ({
              userId: studentId,
              ...notificationData,
              isSent: false,
            }))

            // Bulk create notifications
            const createdNotifications = await Notification.insertMany(notificationsToCreate, { session })

            console.log(`Created ${createdNotifications.length} lecture update notifications`)

            // Attempt to send to online users
            let sentCount = 0
            for (const studentId of studentIdsWithAccess) {
              // Check if student is online
              if (io.sockets.adapter.rooms.has(studentId.toString())) {
                console.log(`Student ${studentId} is online, sending lecture update notification`)

                // Find notification for this student
                const notification = createdNotifications.find((n) => n.userId.toString() === studentId.toString())

                if (notification) {
                  // Send notification
                  io.to(studentId.toString()).emit("lectureUpdate", {
                    title: notification.title,
                    message: notification.message,
                    type: notification.type,
                    subjectId: notification.relatedId,
                    notificationId: notification._id,
                    createdAt: notification.createdAt,
                  })

                  // Mark as sent
                  await Notification.findByIdAndUpdate(notification._id, { isSent: true }, { session })

                  sentCount++
                }
              }
            }

            console.log(`Sent ${sentCount} lecture update notifications in real-time`)
          } else {
            console.log("No students have access to this lecture yet")
          }
        }
      } catch (notificationError) {
        console.error("Error sending notifications:", notificationError)
        // Continue without failing - notifications are not critical
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
