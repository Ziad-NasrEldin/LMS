const mongoose = require("mongoose");
const StudentLectureAccess = require("../models/studentLectureAccessModel");
const StudentExamSubmission = require("../models/studentExamSubmissionModel");
const Lecture = require("../models/LectureModel");
const Container = require("../models/containerModel");
const Purchase = require("../models/purchaseModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const QueryFeatures = require("../utils/queryFeatures");
const { buildLectureRequirements } = require("../utils/lectureAccessUtils");

const PRIVILEGED_ROLES = new Set(["Admin", "SubAdmin", "Moderator"]);
const LECTURER_SCOPED_ROLES = new Set(["Lecturer", "Assistant"]);
const STUDENT_ROLE = "Student";

const STRICT_ENTITLEMENT_RECHECK =
  String(process.env.LECTURE_VIEW_STRICT_RECHECK || "false").toLowerCase() ===
  "true";

const normalizeRole = (role) => String(role || "").trim();

const toIdString = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value._id) return value._id.toString();
  return value.toString();
};

const isSameId = (left, right) => {
  const leftId = toIdString(left);
  const rightId = toIdString(right);
  return Boolean(leftId && rightId && leftId === rightId);
};

const isPrivilegedRole = (role) => PRIVILEGED_ROLES.has(normalizeRole(role));
const isLecturerScopedRole = (role) =>
  LECTURER_SCOPED_ROLES.has(normalizeRole(role));

const resolveLectureDocument = async (lectureId) => {
  const lectureDoc = await Lecture.findById(lectureId)
    .select("_id name createdBy")
    .lean();

  if (lectureDoc) {
    return {
      _id: lectureDoc._id,
      name: lectureDoc.name,
      ownerId: lectureDoc.createdBy,
      source: "lecture",
    };
  }

  const legacyLectureDoc = await Container.findById(lectureId)
    .select("_id name type createdBy")
    .lean();

  if (legacyLectureDoc && legacyLectureDoc.type === "lecture") {
    return {
      _id: legacyLectureDoc._id,
      name: legacyLectureDoc.name,
      ownerId: legacyLectureDoc.createdBy,
      source: "legacy-container-lecture",
    };
  }

  return null;
};

const assertLectureAccessReadPermission = async (req, lectureDoc) => {
  const role = normalizeRole(req.user?.role);

  if (isPrivilegedRole(role)) {
    return;
  }

  if (isLecturerScopedRole(role) && isSameId(lectureDoc.ownerId, req.user?._id)) {
    return;
  }

  throw new AppError("Forbidden, you don't have access to this lecture records", 403);
};

const assertSingleAccessPermission = async (
  req,
  accessDoc,
  { allowStudentRead = false } = {}
) => {
  const role = normalizeRole(req.user?.role);

  if (isPrivilegedRole(role)) {
    return;
  }

  if (role === STUDENT_ROLE) {
    if (!isSameId(accessDoc.student, req.user?._id)) {
      throw new AppError(
        "Forbidden, you can only access your own lecture access record",
        403
      );
    }

    if (!allowStudentRead) {
      throw new AppError(
        "Forbidden, students cannot modify lecture access records",
        403
      );
    }

    return;
  }

  if (isLecturerScopedRole(role)) {
    const lectureDoc = await resolveLectureDocument(accessDoc.lecture);

    if (!lectureDoc || !isSameId(lectureDoc.ownerId, req.user?._id)) {
      throw new AppError(
        "Forbidden, you don't have access to this lecture access record",
        403
      );
    }

    return;
  }

  throw new AppError("Forbidden", 403);
};

const buildLectureContainerChain = async (lectureId) => {
  const chainIds = [];
  const seen = new Set();

  const pushId = (id) => {
    const idStr = toIdString(id);

    if (!idStr || seen.has(idStr) || !mongoose.Types.ObjectId.isValid(idStr)) {
      return;
    }

    seen.add(idStr);
    chainIds.push(new mongoose.Types.ObjectId(idStr));
  };

  const lectureDoc = await Lecture.findById(lectureId).select("parent").lean();

  let cursor = lectureDoc?.parent || null;

  if (!lectureDoc) {
    const legacyLectureContainer = await Container.findById(lectureId)
      .select("_id type parent")
      .lean();

    if (legacyLectureContainer?.type === "lecture") {
      pushId(legacyLectureContainer._id);
      cursor = legacyLectureContainer.parent || null;
    }
  }

  let depth = 0;
  while (cursor && depth < 25) {
    const cursorId = toIdString(cursor);

    if (!cursorId || seen.has(cursorId)) {
      break;
    }

    pushId(cursorId);

    const containerDoc = await Container.findById(cursorId)
      .select("parent")
      .lean();

    if (!containerDoc) {
      break;
    }

    cursor = containerDoc.parent || null;
    depth += 1;
  }

  return chainIds;
};

const hasLectureEntitlement = async (studentId, lectureId, purchaseId) => {
  const entitlementOrFilters = [
    {
      type: "lecturePurchase",
      lecture: lectureId,
    },
  ];

  const lectureContainerChain = await buildLectureContainerChain(lectureId);

  if (lectureContainerChain.length > 0) {
    entitlementOrFilters.push({
      type: "containerPurchase",
      container: { $in: lectureContainerChain },
    });
  }

  if (mongoose.Types.ObjectId.isValid(lectureId)) {
    entitlementOrFilters.push({
      type: "containerPurchase",
      container: lectureId,
    });
  }

  const entitlementFilter = {
    student: studentId,
    $or: entitlementOrFilters,
  };

  if (purchaseId) {
    if (!mongoose.Types.ObjectId.isValid(purchaseId)) {
      return false;
    }

    entitlementFilter._id = purchaseId;
  }

  const matchingPurchase = await Purchase.findOne(entitlementFilter)
    .select("_id")
    .lean();

  return Boolean(matchingPurchase);
};

exports.createStudentLectureAccess = catchAsync(async (req, res, next) => {
  const { student, lecture } = req.body;

  const lectureDoc = await Lecture.findById(lecture)
    .populate("examConfig")
    .populate("homeworkConfig");

  if (!lectureDoc) {
    return next(new AppError("Lecture not found", 404));
  }

  if (lectureDoc.requiresExam) {
    const examSubmission = await StudentExamSubmission.findOne({
      student,
      lecture,
      passed: true,
      type: "exam",
    });

    if (!examSubmission) {
      return next(
        new AppError(
          "You must pass the exam before accessing this lecture",
          403
        )
      );
    }
  }

  if (lectureDoc.requiresHomework) {
    const homeworkSubmission = await StudentExamSubmission.findOne({
      student,
      lecture,
      passed: true,
      type: "homework",
    });

    if (!homeworkSubmission) {
      return next(
        new AppError(
          "You must pass the homework before accessing this lecture",
          403
        )
      );
    }
  }

  const access = await StudentLectureAccess.create(req.body);

  res.status(201).json({
    status: "success",
    data: access,
  });
});

exports.getStudentLectureAccess = catchAsync(async (req, res, next) => {
  const access = await StudentLectureAccess.findById(req.params.id).populate([
    { path: "student", select: "name email role" },
    { path: "lecture", select: "name videoLink createdBy" },
  ]);

  if (!access) {
    return next(new AppError("No document found with that ID", 404));
  }

  await assertSingleAccessPermission(req, access, { allowStudentRead: true });

  res.status(200).json({
    status: "success",
    data: access,
  });
});

exports.getAllStudentLectureAccess = catchAsync(async (req, res) => {
  let query = StudentLectureAccess.find();

  const features = new QueryFeatures(query, req.query).filter().sort().paginate();
  query = features.query;

  const accesses = await query.populate([
    { path: "student", select: "name email role" },
    { path: "lecture", select: "name videoLink createdBy" },
  ]);

  res.status(200).json({
    status: "success",
    results: accesses.length,
    data: accesses,
  });
});

exports.updateStudentLectureAccess = catchAsync(async (req, res, next) => {
  const existingAccess = await StudentLectureAccess.findById(req.params.id);

  if (!existingAccess) {
    return next(new AppError("No document found with that ID", 404));
  }

  await assertSingleAccessPermission(req, existingAccess);

  const allowedUpdates = [
    "remainingViews",
    "lastAccessed",
    "lastViewEventId",
    "lastViewEventAt",
  ];

  const updatePayload = Object.entries(req.body || {}).reduce(
    (accumulator, [key, value]) => {
      if (allowedUpdates.includes(key)) {
        accumulator[key] = value;
      }
      return accumulator;
    },
    {}
  );

  if (Object.keys(updatePayload).length === 0) {
    return next(new AppError("No supported fields provided for update", 400));
  }

  const access = await StudentLectureAccess.findByIdAndUpdate(
    req.params.id,
    updatePayload,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: "success",
    data: access,
  });
});

exports.deleteStudentLectureAccess = catchAsync(async (req, res, next) => {
  const access = await StudentLectureAccess.findById(req.params.id);

  if (!access) {
    return next(new AppError("No document found with that ID", 404));
  }

  await assertSingleAccessPermission(req, access);

  await StudentLectureAccess.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.consumeLectureView = catchAsync(async (req, res, next) => {
  const role = normalizeRole(req.user?.role);

  if (role !== STUDENT_ROLE) {
    return next(new AppError("Only students can consume lecture views", 403));
  }

  const accessId = req.params.id;
  const eventId = String(req.body?.eventId || "").trim();
  const purchaseId = req.body?.purchaseId || null;

  if (!mongoose.Types.ObjectId.isValid(accessId)) {
    return next(new AppError("Invalid student lecture access id", 400));
  }

  if (!eventId) {
    return next(new AppError("eventId is required", 400));
  }

  if (eventId.length > 128) {
    return next(new AppError("eventId cannot exceed 128 characters", 400));
  }

  if (purchaseId && !mongoose.Types.ObjectId.isValid(purchaseId)) {
    return next(new AppError("Invalid purchaseId", 400));
  }

  const accessSnapshot = await StudentLectureAccess.findById(accessId)
    .select(
      "_id student lecture remainingViews lastAccessed lastViewEventId lastViewEventAt"
    )
    .lean();

  if (!accessSnapshot) {
    return next(new AppError("No document found with that ID", 404));
  }

  if (!isSameId(accessSnapshot.student, req.user?._id)) {
    return next(
      new AppError(
        "Forbidden, you can only consume views for your own access record",
        403
      )
    );
  }

  if (accessSnapshot.lastViewEventId === eventId) {
    return res.status(200).json({
      status: "success",
      data: {
        access: accessSnapshot,
        consumed: false,
        idempotent: true,
        strictEntitlementRecheck: STRICT_ENTITLEMENT_RECHECK,
      },
    });
  }

  if ((accessSnapshot.remainingViews || 0) <= 0) {
    return next(new AppError("No remaining views for this lecture", 409));
  }

  if (STRICT_ENTITLEMENT_RECHECK) {
    const entitled = await hasLectureEntitlement(
      req.user._id,
      accessSnapshot.lecture,
      purchaseId
    );

    if (!entitled) {
      return next(new AppError("Lecture entitlement validation failed", 403));
    }
  }

  const now = new Date();

  const updatedAccess = await StudentLectureAccess.findOneAndUpdate(
    {
      _id: accessId,
      student: req.user._id,
      remainingViews: { $gt: 0 },
      $or: [
        { lastViewEventId: { $exists: false } },
        { lastViewEventId: null },
        { lastViewEventId: { $ne: eventId } },
      ],
    },
    {
      $inc: { remainingViews: -1 },
      $set: {
        lastAccessed: now,
        lastViewEventId: eventId,
        lastViewEventAt: now,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (updatedAccess) {
    return res.status(200).json({
      status: "success",
      data: {
        access: updatedAccess,
        consumed: true,
        idempotent: false,
        strictEntitlementRecheck: STRICT_ENTITLEMENT_RECHECK,
      },
    });
  }

  const latestAccess = await StudentLectureAccess.findById(accessId)
    .select(
      "_id student lecture remainingViews lastAccessed lastViewEventId lastViewEventAt"
    )
    .lean();

  if (latestAccess?.lastViewEventId === eventId) {
    return res.status(200).json({
      status: "success",
      data: {
        access: latestAccess,
        consumed: false,
        idempotent: true,
        strictEntitlementRecheck: STRICT_ENTITLEMENT_RECHECK,
      },
    });
  }

  if ((latestAccess?.remainingViews || 0) <= 0) {
    return next(new AppError("No remaining views for this lecture", 409));
  }

  return next(
    new AppError(
      "Failed to consume lecture view due to a concurrent update, please retry",
      409
    )
  );
});

exports.checkLectureAccess = catchAsync(async (req, res, next) => {
  const { lectureId } = req.params;
  const studentId = req.user._id;

  const lecture = await Lecture.findById(lectureId)
    .populate("examConfig")
    .populate("homeworkConfig");

  if (!lecture) {
    return next(new AppError("Lecture not found", 404));
  }

  if (lecture.requiresExam || lecture.requiresHomework) {
    const results = buildLectureRequirements(lecture);

    if (lecture.requiresExam) {
      const examSubmission = await StudentExamSubmission.findOne({
        student: studentId,
        lecture: lectureId,
        type: "exam",
        passed: true,
      });
      results.exam.passed = !!examSubmission;
    }

    if (lecture.requiresHomework) {
      const homeworkSubmission = await StudentExamSubmission.findOne({
        student: studentId,
        lecture: lectureId,
        type: "homework",
        passed: true,
      });
      results.homework.passed = !!homeworkSubmission;
    }

    if (
      (lecture.requiresExam && !results.exam.passed) ||
      (lecture.requiresHomework && !results.homework.passed)
    ) {
      return res.status(200).json({
        status: "restricted",
        message:
          "You must complete all required submissions before accessing this lecture",
        data: results,
      });
    }
  }

  res.status(200).json({
    status: "success",
    message: "Access granted",
    data: {
      hasAccess: true,
      requiresExam: lecture.requiresExam,
      requiresHomework: lecture.requiresHomework,
      examPassed: lecture.requiresExam ? true : undefined,
      homeworkPassed: lecture.requiresHomework ? true : undefined,
    },
  });
});

exports.getLectureAccessByLectureId = catchAsync(async (req, res, next) => {
  const { lectureId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(lectureId)) {
    return next(new AppError("Invalid lecture id", 400));
  }

  const lectureDoc = await resolveLectureDocument(lectureId);

  if (!lectureDoc) {
    return next(new AppError("Lecture not found", 404));
  }

  await assertLectureAccessReadPermission(req, lectureDoc);

  const accessRecords = await StudentLectureAccess.find({
    lecture: lectureDoc._id,
  })
    .populate({
      path: "student",
      select: "name email role",
    })
    .sort({ lastAccessed: -1 });

  res.status(200).json({
    status: "success",
    results: accessRecords.length,
    data: {
      lecture: {
        _id: lectureDoc._id,
        name: lectureDoc.name,
        source: lectureDoc.source,
      },
      accessRecords,
    },
  });
});
