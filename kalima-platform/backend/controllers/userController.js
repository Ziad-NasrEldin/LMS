const registerController = require("../controllers/registerController");
const User = require("../models/userModel.js");
const Parent = require("../models/parentModel.js");
const Lecturer = require("../models/lecturerModel.js");
const Student = require("../models/studentModel.js");
const Teacher = require("../models/teacherModel.js");
const Assistant = require("../models/assistantModel.js");
const Moderator = require("../models/moderatorModel.js");
const SubAdmin = require("../models/subAdminModel.js");
const Purchase = require("../models/purchaseModel.js");
const Code = require("../models/codeModel.js");
const StudentLectureAccess = require("../models/studentLectureAccessModel.js");
const StudentExamSubmission = require("../models/studentExamSubmissionModel.js");
const Container = require("../models/containerModel.js");
const Lecture = require("../models/LectureModel.js");
const Attachment = require("../models/attachmentModel.js");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const handleCSV = require("../utils/upload files/handleCSV.js");
const handleExcel = require("../utils/upload files/handleEXCEL.js");
const QueryFeatures = require("../utils/queryFeatures");
const { hasLectureAccessFromPurchase } = require("../utils/purchaseHistoryUtils");
const cleanupLecturerContent = require("../utils/cleanupLecturerContent.js");
const fs = require("fs");

const STUDENT_HOBBY_ALIASES = {
  "design/illustrating": "designillustrating",
  "design-illustrating": "designillustrating",
  "design_illustrating": "designillustrating",
  designillustrating: "designillustrating",
  designillustratings: "designillustrating",
};

const normalizeStudentHobby = (value) => {
  if (!value) return "";
  const raw = String(value).trim().toLowerCase();
  if (!raw) return "";
  return STUDENT_HOBBY_ALIASES[raw] || raw;
};

const extractStudentHobby = (studentDoc) => {
  if (!studentDoc) return "";

  const directHobby = normalizeStudentHobby(studentDoc.hobby);
  if (directHobby) return directHobby;

  if (Array.isArray(studentDoc.hobbies) && studentDoc.hobbies.length > 0) {
    const firstHobby = normalizeStudentHobby(studentDoc.hobbies[0]);
    if (firstHobby) return firstHobby;
  }

  if (typeof studentDoc.hobbies === "string") {
    return normalizeStudentHobby(studentDoc.hobbies);
  }

  return "";
};

const LECTURER_SOCIAL_MEDIA_PLATFORMS = new Set([
  "Facebook",
  "Instagram",
  "Twitter",
  "LinkedIn",
  "TikTok",
  "YouTube",
  "WhatsApp",
  "Telegram",
]);

const normalizeLecturerSocialMedia = (rawValue) => {
  if (rawValue === undefined) return undefined;

  let candidateValue = rawValue;

  if (typeof candidateValue === "string") {
    const trimmedValue = candidateValue.trim();
    if (!trimmedValue) return [];

    try {
      candidateValue = JSON.parse(trimmedValue);
    } catch (_error) {
      return [];
    }
  }

  if (!Array.isArray(candidateValue)) {
    return [];
  }

  const normalized = [];

  candidateValue.forEach((entry) => {
    let item = entry;

    if (typeof item === "string") {
      const trimmedItem = item.trim();
      if (!trimmedItem) return;

      try {
        item = JSON.parse(trimmedItem);
      } catch (_error) {
        throw new AppError("Invalid social media payload.", 400);
      }
    }

    if (!item || typeof item !== "object") return;

    const platform = String(item.platform || "").trim();
    const account = String(item.account || "").trim();

    if (!platform && !account) return;

    if (!platform || !account) {
      throw new AppError("Each social media entry must include both platform and account.", 400);
    }

    if (!LECTURER_SOCIAL_MEDIA_PLATFORMS.has(platform)) {
      throw new AppError(`Invalid social media platform: ${platform}`, 400);
    }

    normalized.push({ platform, account });
  });

  return normalized;
};

const RESTRICTED_SELF_UPDATE_ROLES = new Set(["student", "parent", "teacher"]);

const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find().select("-password").lean();

  if (!users.length) return next(new AppError("Couldn't find users.", 404));
  res.json(users);
});

const getAllUsersByRole = catchAsync(async (req, res, next) => {
  const role =
    req.params.role.charAt(0).toUpperCase() +
    req.params.role.slice(1).toLowerCase();

  const users = await User.find({ role }).select("-password").lean();
  if (!users.length)
    return next(new AppError("Couldn't find users with this role.", 404));

  res.json(users);
});

const getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.userId)
    .select("-password")
    .lean();

  if (!user) return next(new AppError("Couldn't find user.", 404));
  res.json(user);
});

const createUser = registerController.registerNewUser;

const updateUser = catchAsync(async (req, res, next) => {
  const { name, email, address, password, children, ...restBody } = req.body;

  const userId = req.params.userId;

  // If password is provided, hash it and allow update
  let hashedPassword = null;
  if (password) {
    if (password.length < 8) {
      return next(new AppError("Password must be at least 8 characters.", 400));
    }
    hashedPassword = await bcrypt.hash(password, 12);
  }

  const selectedFields = "-password -passwordChangedAt";

  const foundUser = await User.findById(userId).select(selectedFields);

  if (!foundUser) return next(new AppError("User not found", 404));

  const childrenById = [];
  if (!!children) {
    for (let id of children) {
      // Check if the id is a valid MongoDB ObjectId
      const isMongoId = mongoose.Types.ObjectId.isValid(id);
      if (isMongoId) {
        childrenById.push(id);
      } else {
        try {
          const student = await Student.findOne({ sequencedId: id }).lean();
          if (student) {
            childrenById.push(student._id);
          }
        } catch (error) {
          if (error.name === "CastError") {
            return next(
              new AppError(
                "Not all children values are valid UserId or SequenceId.",
                400
              )
            );
          }
        }
      }
    }
    req.body.children = childrenById;
  }
  const updatedUser = {
    name,
    email,
    address,
    children: childrenById,
    role: foundUser.role, // Explicitly preserve the original role
    ...restBody,
  };
  if (hashedPassword) {
    updatedUser.password = hashedPassword;
  }

  let user;

  switch (foundUser.role.toLowerCase()) {
    case "teacher":
      user = await Teacher.findByIdAndUpdate(userId, updatedUser, {
        new: true,
        runValidators: true,
      })
        .select(selectedFields)
        .lean();
      break;

    case "student":
      user = await Student.findByIdAndUpdate(userId, updatedUser, {
        new: true,
        runValidators: true,
      })
        .select(selectedFields)
        .lean();
      break;

    case "parent":
      user = await Parent.findByIdAndUpdate(userId, updatedUser, {
        new: true,
        runValidators: true,
      })
        .select(selectedFields)
        .lean();
      break;

    case "lecturer":
      user = await Lecturer.findByIdAndUpdate(userId, updatedUser, {
        new: true,
        runValidators: true,
      })
        .select(selectedFields)
        .lean();
      break;

    case "assistant":
      user = await Assistant.findByIdAndUpdate(userId, updatedUser, {
        new: true,
        runValidators: true,
      })
        .select(selectedFields)
        .lean();
      break;

    case "moderator":
      user = await Moderator.findByIdAndUpdate(userId, updatedUser, {
        new: true,
        runValidators: true,
      })
        .select(selectedFields)
        .lean();
      break;

    case "subadmin":
      user = await SubAdmin.findByIdAndUpdate(userId, updatedUser, {
        new: true,
        runValidators: true,
      })
        .select(selectedFields)
        .lean();
      break;

    default:
      // For base User model, if password is being updated, ensure select includes password
      user = await User.findByIdAndUpdate(userId, updatedUser, {
        new: true,
        runValidators: true,
      })
        .select(selectedFields)
        .lean();
  }

  res.json(user);
});

const deleteUser = catchAsync(async (req, res, next) => {
  const foundUser = await User.findById(req.params.userId).select("-password");

  if (!foundUser) return next(new AppError("User not found", 404));
  if (
    req.user.role === "SubAdmin" &&
    (foundUser.role === "Admin" || foundUser.role === "SubAdmin")
  ) {
    return next(new AppError("You are not allowed to delete this user", 403));
  }

  const normalizedRole = String(foundUser.role || "").toLowerCase();

  if (normalizedRole === "lecturer") {
    await cleanupLecturerContent(foundUser._id);
  }

  await foundUser.deleteOne();
  res.status(204).json({
    status: "success",
    data: null,
  });
});

// we ahould make a validation for newPassword field here
const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(
      new AppError("You should provide both current and new password", 400)
    );
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!user) {
    return next(new AppError("User not found, pleaze login again", 401));
  }

  const isValidCurrentPassword = await user.comparePassword(
    currentPassword,
    user.password
  );
  if (!isValidCurrentPassword) {
    return next(new AppError("Your current password is wrong", 401));
  }

  if (currentPassword === newPassword) {
    return next(
      new AppError("New password can't be the same as old password", 400)
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  user.password = hashedPassword;
  await user.save();

  // otional: regenerate jwt if we  wanna to keep the user logged in
  /*
    const accessToken = jwt.sign(
    {
      UserInfo: { id: user._id, role: user.role }, // we should select role also from the query
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "90d" }, // Time should be changed in production
  );

  const refreshToken = jwt.sign(
    { id: user._id, },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "1000s" }, // Time should be changed in production
  );

  res.cookie("jwt", refreshToken, {
    httpOnly: true,
    sameSite: "none", // Allow cross-site.
    secure: process.env.NODE_ENV === "production",
    maxAge: 300000 * 1000, // Should be set to match the Refresh Token age.
  });

    res.status(200).json({
    status:"success",
    message:"Password updated successfully",
    accessToken
  })
  */

  res.clearCookie("jwt", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
  });

  res.status(200).json({
    status: "success",
    message: "Password updated successfully, please login again",
  });
});

const uploadFileForBulkCreation = catchAsync(async (req, res, next) => {
  const { accountType } = req.body;

  const allAccountTypes = ["parent", "teacher", "student"];
  if (!accountType || !allAccountTypes.includes(accountType)) {
    return next(
      new AppError(
        "You should provide one of these account types: parent, teacher, student"
      )
    );
  }

  if (!req.file) {
    return next(new AppError("No file uploaded", 400));
  }
  const fileType = req.file.mimetype;

  if (fileType === "text/csv" || fileType === "application/csv") {
    await handleCSV(req.file.buffer, accountType, res, next);
  } else if (
    fileType ===
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    fileType === "application/vnd.ms-excel"
  ) {
    await handleExcel(req.file.buffer, accountType, res, next);
  } else {
    return next(
      new AppError(
        "Unsupported file type. Please upload a CSV or Excel file",
        400
      )
    );
  }
});

/**
 * Get all data for the currently logged-in user (any role)
 * Includes user profile, balance information (for student/parent) and purchase history (for student/parent)
 *
 * Query parameters supported:
 * - fields: Comma-separated list of fields to include (e.g., fields=userInfo,purchaseHistory)
 * - limit: Number of items per page for paginated results (default: 10)
 * - page: Page number for paginated results (default: 1)
 * - dateFrom: Filter purchases/activities from this date (YYYY-MM-DD)
 * - dateTo: Filter purchases/activities to this date (YYYY-MM-DD)
 * - sort: Field to sort by (e.g., sort=purchasedAt for purchases, default: -createdAt)
 */
const getMyData = catchAsync(async (req, res, next) => {
  // Get user ID from authenticated user
  const userId = req.user._id;
  const userRole = req.user.role;
  const normalizedUserRole = String(userRole || "").trim().toLowerCase();

  // Parse field selection (if provided)
  const fields = req.query.fields ? req.query.fields.split(",") : null;

  // Common response data
  let responseData = {
    userInfo: {
      id: userId,
      name: req.user.name,
      email: req.user.email,
      role: userRole,
      referredBy: req.user.referredBy || null,
      profilePic: req.user.profilePic || null,
      userSerial: req.user.userSerial || null, // Assuming userSrial is a field in User model
    },
  };

  // Role-specific data retrieval
  switch (normalizedUserRole) {
    case "student":
      // Find student with all related data
      const student = await Student.findById(userId)
        .populate("level", "name nameAr")
        .populate({
          path: "lecturerPoints.lecturer",
          select: "name subject expertise",
        })
        .lean();

      if (!student) {
        return next(new AppError("Student not found", 404));
      }

      // Add student-specific fields
      const resolvedStudentHobby = extractStudentHobby(student);
      responseData.userInfo = {
        ...responseData.userInfo,
        phoneNumber: student.phoneNumber,
        level: student.level,
        hobby: resolvedStudentHobby,
        hobbies: resolvedStudentHobby ? [resolvedStudentHobby] : [],
        generalPoints: student.generalPoints || 0,
        totalPoints: student.totalPoints || 0,
        faction: student.faction,
        sequencedId: student.sequencedId,
        profilePic: student.profilePic || responseData.userInfo.profilePic || null,
      };

      // Get student purchases, redeemed codes, and lecture access (with query params)
      if (
        !fields ||
        fields.includes("purchaseHistory") ||
        fields.includes("redeemedCodes") ||
        fields.includes("lectureAccess") ||
        fields.includes("pointsBalances") ||
        fields.includes("purchasedFeatures")
      ) {
        responseData = await getStudentParentAdditionalData(
          userId,
          responseData,
          student.lecturerPoints || [],
          req.query
        );
      }
      break;

    case "parent":
      // Find parent with all related data
      const parent = await Parent.findById(userId)
        .populate({
          path: "children",
          select: "name level sequencedId",
        })
        .populate({
          path: "lecturerPoints.lecturer",
          select: "name subject expertise",
        })
        .lean();

      if (!parent) {
        return next(new AppError("Parent not found", 404));
      }

      // Add parent-specific fields
      responseData.userInfo = {
        ...responseData.userInfo,
        phoneNumber: parent.phoneNumber,
        profession: parent.profession,
        level: parent.level,
        children: parent.children,
        generalPoints: parent.generalPoints || 0,
        profilePic: parent.profilePic || responseData.userInfo.profilePic || null,
      };

      // Get parent purchases, redeemed codes, and lecture access (with query params)
      if (
        !fields ||
        fields.includes("purchaseHistory") ||
        fields.includes("redeemedCodes") ||
        fields.includes("lectureAccess") ||
        fields.includes("pointsBalances") ||
        fields.includes("purchasedFeatures")
      ) {
        responseData = await getStudentParentAdditionalData(
          userId,
          responseData,
          parent.lecturerPoints || [],
          req.query
        );
      }
      break;

    case "lecturer":
      // Find lecturer with relevant data
      const lecturer = await Lecturer.findById(userId).lean();

      if (!lecturer) {
        return next(new AppError("Lecturer not found", 404));
      }

      // Add lecturer-specific fields
      responseData.userInfo = {
        ...responseData.userInfo,
        bio: lecturer.bio,
        expertise: lecturer.expertise,
        socialMedia: Array.isArray(lecturer.socialMedia) ? lecturer.socialMedia : [],
        profilePic: lecturer.profilePic || responseData.userInfo.profilePic || null,
      };


      // Only fetch additional lecturer data if no specific fields were requested or if these fields were included
      if (!fields || fields.includes("containers")) {
        // Get lecturer-specific data (containers created by this lecturer)
        let containerQuery = Container.find({ createdBy: userId })
          .select("name type price subject level createdAt")
          .populate("subject", "name")
          .populate("level", "name");

        // Apply query features for containers
        const containerFeatures = new QueryFeatures(containerQuery, req.query)
          .filter()
          .sort()
          .paginate();
        containerQuery = containerFeatures.query;
        const containers = await containerQuery.lean();

        responseData.containers = containers;
      }

      if (!fields || fields.includes("lectures")) {
        // Fetch lecturer lectures only when explicitly requested.
        const lectures = await Lecture.find({ createdBy: userId })
          .select("name type price subject level createdAt teacherAllowed thumbnail")
          .populate("subject", "name")
          .populate("level", "name")
          .lean();

        const containerLectures = await Container.find({ createdBy: userId, type: "lecture" })
          .select("name type price subject level createdAt teacherAllowed image")
          .populate("subject", "name")
          .populate("level", "name")
          .lean();

        responseData.lectures = [...lectures, ...containerLectures];
      }

      // Only fetch point purchases if no specific fields were requested or if pointPurchases field was included
      if (!fields || fields.includes("pointPurchases")) {
        // Get point purchases made for this lecturer's content
        let purchaseQuery = Purchase.find({ lecturer: userId });

        // Add date filtering if provided
        if (req.query.dateFrom || req.query.dateTo) {
          const dateFilter = {};
          if (req.query.dateFrom) {
            dateFilter.purchasedAt = { $gte: new Date(req.query.dateFrom) };
          }
          if (req.query.dateTo) {
            dateFilter.purchasedAt = {
              ...dateFilter.purchasedAt,
              $lte: new Date(req.query.dateTo),
            };
          }
          purchaseQuery = purchaseQuery.find(dateFilter);
        }

        // Apply query features for purchases
        const purchaseFeatures = new QueryFeatures(purchaseQuery, req.query)
          .filter()
          .sort()
          .paginate();
        purchaseQuery = purchaseFeatures.query;

        const pointPurchases = await purchaseQuery
          .populate("student", "name")
          .lean();

        responseData.pointPurchases = pointPurchases;
      }
      break;

    case "teacher":
      // Find teacher with relevant data
      const teacher = await Teacher.findById(userId).lean();

      if (!teacher) {
        return next(new AppError("Teacher not found", 404));
      }

      // Add teacher-specific fields
      responseData.userInfo = {
        ...responseData.userInfo,
        phoneNumber: teacher.phoneNumber,
        subject: teacher.subject,
        level: teacher.level,
        faction: teacher.faction,
        school: teacher.school,
        ...teacher,
        profilePic: teacher.profilePic || responseData.userInfo.profilePic || null,
      };

      // Get student purchases, redeemed codes, and lecture access (with query params)
      if (
        !fields ||
        fields.includes("purchaseHistory") ||
        fields.includes("redeemedCodes") ||
        fields.includes("lectureAccess") ||
        fields.includes("pointsBalances") ||
        fields.includes("purchasedFeatures")
      ) {
        responseData = await getStudentParentAdditionalData(
          userId,
          responseData,
          teacher.lecturerPoints || [],
          req.query
        );
      }

      break;

    case "admin":
    case "subadmin":
    case "moderator":
      // For admin roles, just return basic profile info
      const admin = await User.findById(userId).select("-password").lean();

      if (!admin) {
        return next(new AppError("User not found", 404));
      }
      responseData.userInfo = {
        ...responseData.userInfo,
        profilePic: admin.profilePic || responseData.userInfo.profilePic || null,
      };
      // No additional fields needed for admin roles
      break;

    case "assistant":
      // Find assistant with related lecturer and all lecture data
      const assistant = await Assistant.findById(userId)
        .populate({
          path: "assignedLecturer",
          select: "name expertise bio profilePicture"
        })
        .lean();

      if (!assistant) {
        return next(new AppError("Assistant not found", 404));
      }

      // Add assistant-specific fields to the response
      responseData.userInfo = {
        ...responseData.userInfo,
        assignedLecturer: assistant.assignedLecturer,
        profilePic: assistant.profilePic || responseData.userInfo.profilePic || null,
      };

      // Only fetch additional data if no specific fields were requested or the relevant fields were included
      if (!fields || fields.includes("lecturerContainers") || fields.includes("lectures")) {
        // Get containers (courses, terms, etc.) created by the assigned lecturer
        const containers = await Container.find({ createdBy: assistant.assignedLecturer._id })
          .populate("subject", "name")
          .populate("level", "name")
          .lean();

        responseData.lecturerContainers = containers;
      }

      if (!fields || fields.includes("lectures")) {
        // Get all lectures from the assigned lecturer
        const lectures = await Lecture.find({ createdBy: assistant.assignedLecturer._id })
          .populate("subject", "name")
          .populate("level", "name")
          .select(
            "name description videoLink numberOfViews requiresExam requiresHomework examConfig homeworkConfig"
          )
          .lean();

        // Also fetch from Container model
        const containerLectures = await Container.find({ createdBy: assistant.assignedLecturer._id, type: "lecture" })
          .populate("subject", "name")
          .populate("level", "name")
          .select("name description videoLink numberOfViews type")
          .lean();

        responseData.lectures = [...lectures, ...containerLectures];
      }

      if (!fields || fields.includes("attachments")) {
        // Get all attachments related to lecturer's lectures
        const lecturerLectures = await Lecture.find({ createdBy: assistant.assignedLecturer._id })
          .select("_id")
          .lean();

        const lectureIds = lecturerLectures.map(lecture => lecture._id);

        const attachments = await Attachment.find({ lectureId: { $in: lectureIds } })
          .populate("lectureId", "name")
          .populate("studentId", "name")
          .lean();

        responseData.attachments = attachments;
      }

      if (!fields || fields.includes("examSubmissions")) {
        // Get exam submissions for lectures created by the assigned lecturer
        const lecturerLectures = !responseData.lectures ?
          await Lecture.find({ createdBy: assistant.assignedLecturer._id }).select("_id").lean() :
          responseData.lectures;

        const lectureIds = lecturerLectures.map(lecture => lecture._id);

        const examSubmissions = await StudentExamSubmission.find({
          lecture: { $in: lectureIds },
          type: "exam"
        })
          .populate("student", "name sequencedId")
          .populate("lecture", "name")
          .populate("config", "name type")
          .lean();

        responseData.examSubmissions = examSubmissions;
      } if (!fields || fields.includes("homeworkSubmissions")) {
        // Get homework submissions for lectures created by the assigned lecturer
        const lecturerLectures = !responseData.lectures && !responseData.examSubmissions ?
          await Lecture.find({ createdBy: assistant.assignedLecturer._id }).select("_id").lean() :
          (responseData.lectures || responseData.examSubmissions);

        // Get lecture IDs, handling both direct lecture objects and exam submission objects
        const lectureIds = lecturerLectures.map(lecture => {
          if (lecture._id) return lecture._id;
          if (lecture.lecture && lecture.lecture._id) return lecture.lecture._id;
          return lecture;
        }).filter(id => id); // Filter out any undefined values

        const homeworkSubmissions = await StudentExamSubmission.find({
          lecture: { $in: lectureIds },
          type: "homework"
        })
          .populate("student", "name sequencedId")
          .populate("lecture", "name")
          .populate("config", "name type")
          .lean();

        responseData.homeworkSubmissions = homeworkSubmissions;
      }

      if (!fields || fields.includes("stats")) {
        // Calculate statistics about lecturer's content and student engagement
        const stats = {
          totalLectures: 0,
          totalStudentExamSubmissions: 0,
          totalStudentHomeworkSubmissions: 0,
          totalAttachments: 0,
          lectureViews: 0
        };

        if (responseData.lectures) {
          stats.totalLectures = responseData.lectures.length;
          stats.lectureViews = responseData.lectures.reduce(
            (sum, lecture) => sum + (lecture.numberOfViews || 0), 0
          );
        } else {
          const lectureCount = await Lecture.countDocuments({
            createdBy: assistant.assignedLecturer._id
          });
          stats.totalLectures = lectureCount;

          const lectures = await Lecture.find({
            createdBy: assistant.assignedLecturer._id
          }).select("numberOfViews").lean();

          stats.lectureViews = lectures.reduce(
            (sum, lecture) => sum + (lecture.numberOfViews || 0), 0
          );
        }
        stats.totalStudentExamSubmissions = responseData.examSubmissions ?
          responseData.examSubmissions.length :
          await StudentExamSubmission.countDocuments({
            lecture: { $in: await Lecture.find({ createdBy: assistant.assignedLecturer._id }).distinct("_id") },
            type: "exam"
          });

        stats.totalStudentHomeworkSubmissions = responseData.homeworkSubmissions ?
          responseData.homeworkSubmissions.length :
          await StudentExamSubmission.countDocuments({
            lecture: { $in: await Lecture.find({ createdBy: assistant.assignedLecturer._id }).distinct("_id") },
            type: "homework"
          });

        stats.totalAttachments = responseData.attachments ?
          responseData.attachments.length :
          await Attachment.countDocuments({
            lectureId: { $in: await Lecture.find({ createdBy: assistant.assignedLecturer._id }).distinct("_id") }
          });

        responseData.stats = stats;
      }
      break;

    default:
      // For any other role, return basic user info
      const user = await User.findById(userId).select("-password").lean();

      if (!user) {
        return next(new AppError("User not found", 404));
      }
      responseData.userInfo = {
        ...responseData.userInfo,
        profilePic: user.profilePic || responseData.userInfo.profilePic || null,
      };
  }

  // Filter out fields that weren't requested (if fields parameter was provided)
  if (fields) {
    const filteredResponse = {};
    fields.forEach((field) => {
      if (responseData[field]) {
        filteredResponse[field] = responseData[field];
      }
    });
    responseData = filteredResponse;
  }

  res.status(200).json({
    status: "success",
    data: responseData,
  });
});

const getMyPurchasedCourseContainers = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const userRole = req.user.role;
  const normalizedUserRole = String(userRole || "").trim().toLowerCase();

  if (normalizedUserRole !== "student") {
    return next(new AppError("Only students can access purchased course containers", 403));
  }

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit, 10) || 20, 1);

  const purchases = await Purchase.find({
    student: userId,
    type: "containerPurchase",
  })
    .select("container lecturer points purchasedAt")
    .populate({
      path: "container",
      select: "name type price subject level createdBy containerImage",
      populate: [
        { path: "subject", select: "name" },
        { path: "level", select: "name" },
      ],
    })
    .populate({ path: "lecturer", select: "name" })
    .sort({ purchasedAt: -1 })
    .lean();

  const uniqueContainers = new Map();

  for (const purchase of purchases) {
    if (!purchase.container || purchase.container.type !== "course") continue;

    const containerId = purchase.container._id.toString();
    if (uniqueContainers.has(containerId)) continue;

    uniqueContainers.set(containerId, {
      ...purchase.container,
      lecturer: purchase.lecturer || null,
      purchasedAt: purchase.purchasedAt,
      purchaseId: purchase._id,
      price: purchase.points || purchase.container.price || 0,
    });
  }

  const allContainers = Array.from(uniqueContainers.values());
  const start = (page - 1) * limit;
  const paginatedContainers = allContainers.slice(start, start + limit);

  return res.status(200).json({
    status: "success",
    data: {
      userInfo: {
        id: userId,
        role: userRole,
      },
      containers: paginatedContainers,
    },
    pagination: {
      totalCount: allContainers.length,
      page,
      limit,
      totalPages: Math.ceil(allContainers.length / limit) || 1,
    },
  });
});

const HIERARCHICAL_CONTAINER_TYPES = new Set(["course", "month", "term", "year"]);

const enrichPurchasesWithLectureData = async (purchaseHistory = []) => {
  if (!Array.isArray(purchaseHistory) || purchaseHistory.length === 0) {
    return [];
  }

  const lectureIdsToPopulate = [
    ...new Set(
      purchaseHistory
        .filter((p) => !p.lecture && p.container && p.container.type === "lecture")
        .map((p) => p.container?._id?.toString())
        .filter(Boolean)
    ),
  ];

  const purchasedHierarchicalContainerIds = [
    ...new Set(
      purchaseHistory
        .filter(
          (p) =>
            p.container &&
            p.container._id &&
            HIERARCHICAL_CONTAINER_TYPES.has(p.container.type)
        )
        .map((p) => p.container._id.toString())
    ),
  ];

  let lecturesMap = {};
  if (lectureIdsToPopulate.length > 0) {
    const lectures = await Lecture.find({
      _id: { $in: lectureIdsToPopulate.map((id) => new mongoose.Types.ObjectId(id)) },
    })
      .populate("subject", "name")
      .populate("level", "name")
      .lean();

    lecturesMap = lectures.reduce((acc, lec) => {
      acc[lec._id.toString()] = lec;
      return acc;
    }, {});
  }

  const courseContainerLecturesMap = {};
  if (purchasedHierarchicalContainerIds.length > 0) {
    const purchasedContainerTrees = await Container.aggregate([
      {
        $match: {
          _id: {
            $in: purchasedHierarchicalContainerIds.map(
              (id) => new mongoose.Types.ObjectId(id)
            ),
          },
        },
      },
      {
        $graphLookup: {
          from: "containers",
          startWith: "$children",
          connectFromField: "children",
          connectToField: "_id",
          as: "nestedChildren",
        },
      },
    ]);

    const containerToRootIds = new Map();

    purchasedContainerTrees.forEach((containerTree) => {
      const rootId = containerTree._id.toString();
      const scopedContainerIds = new Set([
        rootId,
        ...(containerTree.nestedChildren || []).map((child) => child._id.toString()),
      ]);

      scopedContainerIds.forEach((containerId) => {
        const roots = containerToRootIds.get(containerId) || [];
        roots.push(rootId);
        containerToRootIds.set(containerId, roots);
      });

      courseContainerLecturesMap[rootId] = [];
    });

    const allScopedContainerIds = [
      ...new Set(Array.from(containerToRootIds.keys())),
    ];

    const allScopedContainerObjectIds = allScopedContainerIds.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    const [lectureDocs, legacyLectureContainers] = await Promise.all([
      Lecture.find({ parent: { $in: allScopedContainerObjectIds } })
        .select(
          "name price subject level videoLink requiresExam examConfig requiresHomework homeworkConfig createdBy thumbnail createdAt parent"
        )
        .populate("subject", "name")
        .populate("level", "name")
        .populate("createdBy", "name")
        .lean(),
      Container.find({
        _id: { $in: allScopedContainerObjectIds },
        type: "lecture",
      })
        .select(
          "name type price subject level videoLink requiresExam examConfig requiresHomework homeworkConfig createdBy thumbnail createdAt"
        )
        .populate("subject", "name")
        .populate("level", "name")
        .populate("createdBy", "name")
        .lean(),
    ]);

    const seenLectureIdsByRoot = new Map();

    const registerLectureForRoots = (roots, lectureDoc) => {
      roots.forEach((rootId) => {
        const seenIds = seenLectureIdsByRoot.get(rootId) || new Set();
        const lectureId = lectureDoc._id.toString();

        if (!seenIds.has(lectureId)) {
          courseContainerLecturesMap[rootId].push(lectureDoc);
          seenIds.add(lectureId);
          seenLectureIdsByRoot.set(rootId, seenIds);
        }
      });
    };

    lectureDocs.forEach((lectureDoc) => {
      const parentId = lectureDoc.parent?.toString();
      if (!parentId) return;
      const roots = containerToRootIds.get(parentId) || [];
      if (roots.length === 0) return;
      registerLectureForRoots(roots, lectureDoc);
    });

    legacyLectureContainers.forEach((lectureDoc) => {
      const roots = containerToRootIds.get(lectureDoc._id.toString()) || [];
      if (roots.length === 0) return;
      registerLectureForRoots(roots, lectureDoc);
    });
  }

  return purchaseHistory.map((purchase) => {
    if (purchase.lecture) return purchase;

    if (purchase.container && purchase.container.type === "lecture") {
      const lectureData = lecturesMap[purchase.container._id?.toString()];
      if (lectureData) {
        return { ...purchase, lecture: lectureData };
      }
    }

    if (
      purchase.container &&
      purchase.container._id &&
      HIERARCHICAL_CONTAINER_TYPES.has(purchase.container.type)
    ) {
      const purchasedContainerLectures =
        courseContainerLecturesMap[purchase.container._id.toString()] || [];

      if (purchasedContainerLectures.length > 0) {
        return {
          ...purchase,
          container: {
            ...purchase.container,
            lectures: purchasedContainerLectures,
          },
        };
      }
    }

    return purchase;
  });
};

// Helper function to get additional data for students and parents
const getStudentParentAdditionalData = async (
  userId,
  responseData,
  pointsBalances,
  queryParams = {}
) => {
  const fields = queryParams.fields ? queryParams.fields.split(",") : null;

  // Only include purchase history if requested or no specific fields were requested
  if (!fields || fields.includes("purchaseHistory")) {
    // Get all types of purchases for the user
    let purchaseQuery = Purchase.find({
      student: userId,
    });

    // Add date filtering if provided
    if (queryParams.dateFrom || queryParams.dateTo) {
      const dateFilter = {};
      if (queryParams.dateFrom) {
        dateFilter.purchasedAt = { $gte: new Date(queryParams.dateFrom) };
      }
      if (queryParams.dateTo) {
        dateFilter.purchasedAt = {
          ...dateFilter.purchasedAt,
          $lte: new Date(queryParams.dateTo),
        };
      }
      purchaseQuery = purchaseQuery.find(dateFilter);
    }

    // Apply query features for purchases
    const purchaseFeatures = new QueryFeatures(purchaseQuery, queryParams)
      .filter()
      .sort()
      .paginate();
    purchaseQuery = purchaseFeatures.query;

    // Add relevant populated fields, including lecture for standalone lecture purchases
    const purchaseHistory = await purchaseQuery
      .populate([
        {
          path: "container",
          select:
            "name type price subject level videoLink requiresExam examConfig requiresHomework homeworkConfig createdBy thumbnail",
        },
        { path: "lecturer", select: "name expertise role" },
        {
          path: "lecture",
          select:
            "name price subject level videoLink requiresExam examConfig requiresHomework homeworkConfig createdBy thumbnail",
        },
      ])
      .lean();

    responseData.purchaseHistory = await enrichPurchasesWithLectureData(
      purchaseHistory
    );

    // Get total count of purchases for pagination info
    const totalPurchases = await Purchase.countDocuments({ student: userId });
    responseData.paginationInfo = {
      purchaseHistory: {
        totalCount: totalPurchases,
        page: parseInt(queryParams.page) || 1,
        limit: parseInt(queryParams.limit) || 10,
        totalPages: Math.ceil(
          totalPurchases / (parseInt(queryParams.limit) || 10)
        ),
      },
    };

  }

  // Only include redeemed codes if requested or no specific fields were requested
  if (!fields || fields.includes("redeemedCodes")) {
    let codesQuery = Code.find({
      redeemedBy: userId,
      isRedeemed: true,
    });

    // Apply query features for codes
    const codesFeatures = new QueryFeatures(codesQuery, queryParams)
      .filter()
      .sort()
      .paginate();
    codesQuery = codesFeatures.query;

    const redeemedCodes = await codesQuery.lean();
    responseData.redeemedCodes = redeemedCodes;

    // Get total count of redeemed codes for pagination info
    const totalCodes = await Code.countDocuments({
      redeemedBy: userId,
      isRedeemed: true,
    });

    if (!responseData.paginationInfo) responseData.paginationInfo = {};
    responseData.paginationInfo.redeemedCodes = {
      totalCount: totalCodes,
      page: parseInt(queryParams.page) || 1,
      limit: parseInt(queryParams.limit) || 10,
      totalPages: Math.ceil(totalCodes / (parseInt(queryParams.limit) || 10)),
    };
  }

  // Only include lecture access if requested or no specific fields were requested
  if (!fields || fields.includes("lectureAccess")) {
    let lectureAccessQuery = StudentLectureAccess.find({
      student: userId,
    });

    // Apply query features for lecture access
    const lectureAccessFeatures = new QueryFeatures(
      lectureAccessQuery,
      queryParams
    )
      .filter()
      .sort()
      .paginate();
    lectureAccessQuery = lectureAccessFeatures.query;

    const lectureAccess = await lectureAccessQuery
      .populate({
        path: "lecture",
        select: "name videoLink description numberOfViews",
      })
      .lean();

    // Get total count of lecture access entries for pagination info
    const totalLectureAccess = await StudentLectureAccess.countDocuments({
      student: userId,
    });

    if (!responseData.paginationInfo) responseData.paginationInfo = {};
    responseData.paginationInfo.lectureAccess = {
      totalCount: totalLectureAccess,
      page: parseInt(queryParams.page) || 1,
      limit: parseInt(queryParams.limit) || 10,
      totalPages: Math.ceil(
        totalLectureAccess / (parseInt(queryParams.limit) || 10)
      ),
    };
  }

  // Always include balance records as they're small
  if (!fields || fields.includes("pointsBalances")) {
    responseData.pointsBalances = pointsBalances;
  }

  // Calculate feature flags based on data
  if (!fields || fields.includes("purchasedFeatures")) {
    const purchasedLectureTypes = new Set();

    // If we have purchase history, use it to determine purchased features
    if (responseData.purchaseHistory) {
      responseData.purchaseHistory.forEach((purchase) => {
        if (hasLectureAccessFromPurchase(purchase)) {
          purchasedLectureTypes.add("lecture");
        }
      });
    }
    // Otherwise we need to query just to determine feature flags
    else {
      const featureFlagPurchases = await Purchase.find({
        student: userId,
        $or: [
          { lecture: { $exists: true, $ne: null } },
          { type: "containerPurchase", container: { $exists: true, $ne: null } },
        ],
      })
        .select("container lecture type")
        .populate({ path: "container", select: "type" })
        .populate({ path: "lecture", select: "_id" })
        .lean();

      const enrichedFeaturePurchases = await enrichPurchasesWithLectureData(
        featureFlagPurchases
      );

      if (enrichedFeaturePurchases.some(hasLectureAccessFromPurchase)) {
        purchasedLectureTypes.add("lecture");
      }
    }

    responseData.purchasedFeatures = {
      hasLectures: purchasedLectureTypes.size > 0,
    };
  }

  return responseData;
};

/**
 * Get parent's children data with detailed information
 * This allows a parent to see information about their children
 */
const getParentChildrenData = catchAsync(async (req, res, next) => {
  // Get parent ID from authenticated user
  const parentId = req.user._id;

  // Check if user is a parent
  if (req.user.role !== "Parent") {
    return next(new AppError("Only parents can access their children's data", 403));
  }

  // Find parent with children and get IDs
  const parent = await Parent.findById(parentId).lean();

  if (!parent) {
    return next(new AppError("Parent not found", 404));
  }

  if (!parent.children || parent.children.length === 0) {
    return res.status(200).json({
      status: "success",
      results: 0,
      data: {
        children: []
      }
    });
  }  // Find all children with detailed information
  const children = await Student.find({ _id: { $in: parent.children } })
    .populate("level", "name")
    .select("name level sequencedId faction generalPoints totalPoints")
    .lean();

  // For each child, get additional data like purchase history
  const childrenWithData = await Promise.all(
    children.map(async (child) => {
      // Get purchase history with both container and lecture data
      const purchaseHistory = await Purchase.find({ student: child._id })
        .populate({
          path: "container",
          select: "name type price subject level",
          populate: [
            { path: "subject", select: "name" },
            { path: "level", select: "name" }
          ]
        })
        .populate({
          path: "lecture",
          select:
            "name price subject level videoLink requiresExam examConfig requiresHomework homeworkConfig createdBy thumbnail",
          populate: [
            { path: "subject", select: "name" },
            { path: "level", select: "name" }
          ]
        })
        .sort({ createdAt: -1 })
        .lean();

      const enrichedPurchaseHistory = await enrichPurchasesWithLectureData(
        purchaseHistory
      );

      // Get lecture access
      const lectureAccess = await StudentLectureAccess.find({ student: child._id })
        .populate("lecture", "name")
        .lean();

      // Get exam scores with lecture information
      const examScores = await StudentExamSubmission.find({ student: child._id })
        .populate({
          path: "lecture",
          select: "name description"
        })
        .sort({ submittedAt: -1 })
        .lean();      // Get redeemed promo codes
      const redeemedCodes = await Code.find({
        redeemedBy: child._id,
        isRedeemed: true
      }).lean();

      // Return child with additional data
      return {
        ...child,
        purchaseHistory: enrichedPurchaseHistory,
        lectureAccess,
        redeemedCodes,
        examScores // Include exam scores in the response
      };
    })
  );

  res.status(200).json({
    status: "success",
    results: childrenWithData.length,
    data: {
      children: childrenWithData
    }
  });
});

/**
 * Update the currently logged in user information
 * Restricts student, parent, and teacher accounts to profile image changes
 * plus the small set of post-signup actions that remain supported here.
 */
const updateMe = catchAsync(async (req, res, next) => {
  // 1) Check if password is being updated
  if (req.body.password) {
    return next(
      new AppError("This route is not for password updates. Please use /update/password", 400)
    );
  }

  // 2) Get user ID from authenticated user
  const userId = req.user._id;
  const userRole = req.user.role;
  const normalizedUserRole = String(userRole || "").trim().toLowerCase();
  const isRestrictedSelfUpdateRole = RESTRICTED_SELF_UPDATE_ROLES.has(normalizedUserRole);

  // 3) Filter out unwanted fields that shouldn't be updated
  const allowedFields = new Set(["profilePic", "referralSerial"]);
  if (!isRestrictedSelfUpdateRole) {
    ["name", "email", "phoneNumber", "address"].forEach((field) => allowedFields.add(field));
  }
  if (normalizedUserRole === "parent") {
    allowedFields.add("children");
  }
  if (normalizedUserRole === "lecturer") {
    allowedFields.add("bio");
    allowedFields.add("expertise");
    allowedFields.add("socialMedia");
  }

  const disallowedFields = Object.keys(req.body).filter((field) => !allowedFields.has(field));
  if (disallowedFields.length > 0) {
    return next(
      new AppError(
        "This account cannot edit registration details from this page.",
        400
      )
    );
  }

  const filteredBody = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      filteredBody[field] = req.body[field];
    }
  });

  if (normalizedUserRole === "lecturer" && req.body.socialMedia !== undefined) {
    filteredBody.socialMedia = normalizeLecturerSocialMedia(req.body.socialMedia);
  }

  const currentUser = await User.findById(userId).select("profilePic referredBy userSerial").lean();
  if (!currentUser) {
    return next(new AppError("User not found", 404));
  }

  // Handle profile picture upload (if file is present)
  if (req.file && req.file.fieldname === "profilePic") {
    // Delete old profile picture if it exists
    if (currentUser && currentUser.profilePic && fs.existsSync(currentUser.profilePic)) {
      try {
        fs.unlinkSync(currentUser.profilePic);
      } catch (err) {
        // Log error but don't block the update
        console.error("Failed to delete old profile picture:", err);
      }
    }
    filteredBody.profilePic = req.file.path;
  }

  // Handle referralSerial update: allow user to set referredBy if not already set
  if (req.body.referralSerial) {
    if (!currentUser.referredBy) {
      const inviter = await User.findOne({ userSerial: req.body.referralSerial });
      if (inviter && inviter._id.toString() !== userId.toString()) {
        // Prevent self-referral by serial
        if (inviter.userSerial === currentUser.userSerial) {
          return next(new AppError("You cannot refer yourself.", 400));
        }
        filteredBody.referredBy = inviter._id;
      } else if (inviter && inviter._id.toString() === userId.toString()) {
        return next(new AppError("You cannot refer yourself.", 400));
      } else {
        return next(new AppError("Referral serial not found.", 400));
      }
    } else {
      return next(new AppError("Referral code already set and cannot be changed.", 400));
    }
  }

  delete filteredBody.referralSerial;

  // Handle special case for Parent role - adding children by sequenced ID
  if (normalizedUserRole === "parent" && req.body.children) {
    const childrenIds = req.body.children;

    // Get current children
    const currentParent = await Parent.findById(userId).lean();
    const currentChildren = currentParent?.children || [];

    // Track children to add
    const childrenToAdd = [...currentChildren]; // Start with existing children

    // For each child ID (which could be a sequenced ID or MongoDB ID)
    for (let childId of childrenIds) {
      let child;

      // Check if it's a MongoDB Object ID
      const isMongoId = mongoose.Types.ObjectId.isValid(childId);
      if (isMongoId) {
        // Find by MongoDB ID
        child = await Student.findById(childId).lean();
      } else {
        // Find by sequenced ID
        child = await Student.findOne({ sequencedId: childId }).lean();
      }

      if (child) {
        // Check if child is already in the list to avoid duplicates
        const childIdStr = child._id.toString();
        const alreadyAdded = childrenToAdd.some(id => id.toString() === childIdStr);

        if (!alreadyAdded) {
          childrenToAdd.push(child._id); // Always store MongoDB IDs in the database
        }
      } else {
        return next(new AppError(`No student found with ID: ${childId}`, 404));
      }
    }

    // Add children IDs to filteredBody (don't replace if empty array was provided)
    if (childrenToAdd.length > 0) {
      filteredBody.children = childrenToAdd;
    }
  }

  // 4) Update user document based on their role
  let updatedUser;

  switch (normalizedUserRole) {
    case "student":
      updatedUser = await Student.findByIdAndUpdate(userId, filteredBody, {
        new: true,
        runValidators: true,
      })
        .select("-password -passwordChangedAt")
        .lean();
      break;

    case "parent":
      updatedUser = await Parent.findByIdAndUpdate(userId, filteredBody, {
        new: true,
        runValidators: true,
      })
        .populate({
          path: "children",
          select: "name level sequencedId", // Include sequencedId in the populated result
        })
        .select("-password -passwordChangedAt")
        .lean();
      break;

    case "lecturer":
      // For lecturers, we might want to allow updating bio and expertise
      if (req.body.bio) filteredBody.bio = req.body.bio;
      if (req.body.expertise) filteredBody.expertise = req.body.expertise;

      updatedUser = await Lecturer.findByIdAndUpdate(userId, filteredBody, {
        new: true,
        runValidators: true,
      })
        .select("-password -passwordChangedAt")
        .lean();
      break;

    case "teacher":
      updatedUser = await Teacher.findByIdAndUpdate(userId, filteredBody, {
        new: true,
        runValidators: true,
      })
        .select("-password -passwordChangedAt")
        .lean();
      break;

    case "assistant":
      updatedUser = await Assistant.findByIdAndUpdate(userId, filteredBody, {
        new: true,
        runValidators: true,
      })
        .select("-password -passwordChangedAt")
        .lean();
      break;

    case "admin":
    case "subadmin":
    case "moderator":
    default:
      // For other roles, use the basic User model
      updatedUser = await User.findByIdAndUpdate(userId, filteredBody, {
        new: true,
        runValidators: true,
      })
        .select("-password -passwordChangedAt")
        .lean();
  }

  if (!updatedUser) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser
    }
  });
});

// Confirm a teacher account (admin only)
const confirmTeacher = catchAsync(async (req, res, next) => {
  const teacherId = req.params.id;
  const adminId = req.user._id;

  const teacher = await Teacher.findByIdAndUpdate(
    teacherId,
    { confrimed: true, confrimedBy: adminId },
    { new: true, runValidators: true }
  ).select("-password");

  if (!teacher) {
    return next(new AppError("Teacher not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Teacher confirmed successfully",
    data: { teacher }
  });
});

module.exports = {
  getAllUsers,
  getAllUsersByRole,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  uploadFileForBulkCreation,
  getMyData,
  getMyPurchasedCourseContainers,
  getParentChildrenData,
  updateMe,
  confirmTeacher
};
