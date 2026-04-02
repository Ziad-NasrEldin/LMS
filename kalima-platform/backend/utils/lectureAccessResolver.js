const mongoose = require("mongoose");

const Lecture = require("../models/LectureModel");
const Container = require("../models/containerModel");
const Purchase = require("../models/purchaseModel");
const StudentLectureAccess = require("../models/studentLectureAccessModel");
const AppError = require("./appError");

const TARGET_SELECT =
  "_id name type parent numberOfViews videoLink lecture_type requiresExam requiresHomework thumbnail createdBy subject level teacherAllowed price examConfig homeworkConfig examLink homeworkLink";

const PURCHASE_SELECT = "student container lecture type";

const toIdString = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value._id) return value._id.toString();
  return value.toString();
};

const resolveAccessibleLectureTarget = async (
  targetId,
  { LectureModel = Lecture, ContainerModel = Container } = {},
) => {
  const lectureDoc = await LectureModel.findById(targetId)
    .select(TARGET_SELECT)
    .lean();

  if (lectureDoc) {
    return {
      targetDoc: {
        ...lectureDoc,
        kind: "Lecture",
      },
      source: "lecture",
    };
  }

  const legacyLectureDoc = await ContainerModel.findById(targetId)
    .select(TARGET_SELECT)
    .lean();

  if (legacyLectureDoc && legacyLectureDoc.type === "lecture") {
    return {
      targetDoc: {
        ...legacyLectureDoc,
        kind: "Lecture",
      },
      source: "legacy-container-lecture",
    };
  }

  return null;
};

const buildTargetAncestorIds = async (
  targetDoc,
  { ContainerModel = Container } = {},
) => {
  const ancestorIds = new Set();

  const pushId = (value) => {
    const id = toIdString(value);
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return;
    ancestorIds.add(id);
  };

  pushId(targetDoc?._id);

  let cursor = targetDoc?.parent || null;
  let depth = 0;

  while (cursor && depth < 25) {
    const cursorId = toIdString(cursor);

    if (!cursorId || ancestorIds.has(cursorId)) {
      break;
    }

    pushId(cursorId);

    const parentDoc = await ContainerModel.findById(cursorId)
      .select("_id parent")
      .lean();

    if (!parentDoc) {
      break;
    }

    cursor = parentDoc.parent || null;
    depth += 1;
  }

  return ancestorIds;
};

const loadPurchaseForStudent = async (
  purchaseId,
  studentId,
  { PurchaseModel = Purchase } = {},
) => {
  const purchase = await PurchaseModel.findById(purchaseId)
    .select(PURCHASE_SELECT)
    .lean();

  if (!purchase) {
    throw new AppError("Purchase not found", 403);
  }

  if (toIdString(purchase.student) !== toIdString(studentId)) {
    throw new AppError("Purchase does not belong to this student", 403);
  }

  return purchase;
};

const purchaseUnlocksTarget = (purchase, targetDoc, targetAncestorIds) => {
  const targetId = toIdString(targetDoc?._id);
  const purchasedLectureId = toIdString(purchase?.lecture);
  const purchasedContainerId = toIdString(purchase?.container);

  if (purchasedLectureId && purchasedLectureId === targetId) {
    return true;
  }

  if (purchasedContainerId && targetAncestorIds.has(purchasedContainerId)) {
    return true;
  }

  return false;
};

const upsertStudentLectureAccess = async (
  studentId,
  lectureDoc,
  { StudentLectureAccessModel = StudentLectureAccess } = {},
) => {
  const remainingViews =
    lectureDoc?.numberOfViews !== undefined && lectureDoc?.numberOfViews !== null
      ? lectureDoc.numberOfViews
      : 3;
  const now = new Date();

  try {
    return await StudentLectureAccessModel.findOneAndUpdate(
      { student: studentId, lecture: lectureDoc._id },
      {
        $setOnInsert: {
          student: studentId,
          lecture: lectureDoc._id,
          remainingViews,
        },
        $set: {
          lastAccessed: now,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
  } catch (error) {
    if (error?.code === 11000) {
      return StudentLectureAccessModel.findOne({
        student: studentId,
        lecture: lectureDoc._id,
      });
    }

    throw error;
  }
};

const sanitizeLectureForAccess = (lectureDoc, access) => {
  if (!lectureDoc) return lectureDoc;

  if ((access?.remainingViews || 0) > 0) {
    return lectureDoc;
  }

  const sanitized = { ...lectureDoc };
  delete sanitized.videoLink;
  return sanitized;
};

const serializeStudentLectureAccess = (access) => {
  if (!access) return null;

  return {
    _id: access._id,
    remainingViews: access.remainingViews,
    lastAccessed: access.lastAccessed,
  };
};

module.exports = {
  buildTargetAncestorIds,
  loadPurchaseForStudent,
  purchaseUnlocksTarget,
  resolveAccessibleLectureTarget,
  sanitizeLectureForAccess,
  serializeStudentLectureAccess,
  upsertStudentLectureAccess,
};
