require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const StudentLectureAccess = require("../models/studentLectureAccessModel");
const Lecture = require("../models/LectureModel");
const Container = require("../models/containerModel");
const User = require("../models/userModel");

const argSet = new Set(process.argv.slice(2));
const shouldApply = argSet.has("--apply");
const shouldDeleteOrphans = argSet.has("--delete-orphans");

const toIdString = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value._id) return value._id.toString();
  return value.toString();
};

const toDateMillis = (value) => {
  if (!value) return 0;
  const dateValue = new Date(value).getTime();
  return Number.isFinite(dateValue) ? dateValue : 0;
};

const ensureOutputDir = (outputDir) => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
};

const chooseKeeper = (rows) => {
  const sorted = [...rows].sort((left, right) => {
    const rightDate = toDateMillis(right.lastAccessed);
    const leftDate = toDateMillis(left.lastAccessed);

    if (rightDate !== leftDate) {
      return rightDate - leftDate;
    }

    return (right.remainingViews || 0) - (left.remainingViews || 0);
  });

  return sorted[0];
};

const run = async () => {
  if (!process.env.DATABASE_URI) {
    throw new Error("DATABASE_URI is required");
  }

  await mongoose.connect(process.env.DATABASE_URI);

  const outputDir = path.join(__dirname, "output");
  ensureOutputDir(outputDir);

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-");
  const reportPath = path.join(
    outputDir,
    `student-lecture-access-reconcile-${timestamp}.json`
  );

  const accesses = await StudentLectureAccess.find()
    .select("_id student lecture remainingViews lastAccessed lastViewEventId lastViewEventAt")
    .lean();

  const userExistsCache = new Map();
  const lectureCache = new Map();
  const containerCache = new Map();
  const linkedLectureCache = new Map();

  const resolveCanonicalLecture = async (lectureId) => {
    const lectureIdStr = toIdString(lectureId);
    if (!lectureIdStr) {
      return {
        canonicalLectureId: null,
        status: "invalid-lecture-id",
      };
    }

    if (lectureCache.has(lectureIdStr)) {
      return {
        canonicalLectureId: lectureCache.get(lectureIdStr),
        status: "lecture",
      };
    }

    const lectureDoc = await Lecture.findById(lectureIdStr).select("_id").lean();
    if (lectureDoc) {
      const canonicalId = toIdString(lectureDoc._id);
      lectureCache.set(lectureIdStr, canonicalId);
      return {
        canonicalLectureId: canonicalId,
        status: "lecture",
      };
    }

    if (!containerCache.has(lectureIdStr)) {
      const containerDoc = await Container.findById(lectureIdStr)
        .select("_id type")
        .lean();
      containerCache.set(lectureIdStr, containerDoc || null);
    }

    const containerDoc = containerCache.get(lectureIdStr);
    if (!containerDoc) {
      return {
        canonicalLectureId: null,
        status: "missing-lecture-and-container",
      };
    }

    if (containerDoc.type !== "lecture") {
      return {
        canonicalLectureId: null,
        status: `container-type-${containerDoc.type}`,
      };
    }

    if (!linkedLectureCache.has(lectureIdStr)) {
      const linkedLecture = await Lecture.findOne({ parent: lectureIdStr })
        .select("_id")
        .lean();
      linkedLectureCache.set(lectureIdStr, linkedLecture ? toIdString(linkedLecture._id) : null);
    }

    const linkedLectureId = linkedLectureCache.get(lectureIdStr);
    if (linkedLectureId) {
      return {
        canonicalLectureId: linkedLectureId,
        status: "container-linked-to-lecture",
      };
    }

    return {
      canonicalLectureId: lectureIdStr,
      status: "legacy-container-lecture",
    };
  };

  const orphanedAccesses = [];
  const canonicalGroups = new Map();
  const canonicalizationCandidates = [];

  for (const access of accesses) {
    const studentId = toIdString(access.student);
    const lectureId = toIdString(access.lecture);

    if (!userExistsCache.has(studentId)) {
      const userExists = await User.exists({ _id: studentId });
      userExistsCache.set(studentId, Boolean(userExists));
    }

    const hasStudent = userExistsCache.get(studentId);
    const lectureResolution = await resolveCanonicalLecture(lectureId);

    if (!hasStudent || !lectureResolution.canonicalLectureId) {
      orphanedAccesses.push({
        accessId: toIdString(access._id),
        studentId,
        lectureId,
        reason: !hasStudent
          ? "missing-student"
          : `unresolvable-lecture-${lectureResolution.status}`,
      });
      continue;
    }

    if (lectureResolution.canonicalLectureId !== lectureId) {
      canonicalizationCandidates.push({
        accessId: toIdString(access._id),
        fromLectureId: lectureId,
        toLectureId: lectureResolution.canonicalLectureId,
        reason: lectureResolution.status,
      });
    }

    const groupKey = `${studentId}::${lectureResolution.canonicalLectureId}`;
    if (!canonicalGroups.has(groupKey)) {
      canonicalGroups.set(groupKey, []);
    }

    canonicalGroups.get(groupKey).push({
      ...access,
      __studentId: studentId,
      __canonicalLectureId: lectureResolution.canonicalLectureId,
      __sourceLectureId: lectureId,
      __resolutionStatus: lectureResolution.status,
    });
  }

  const duplicateGroups = [];
  const applyPlan = [];

  for (const [groupKey, rows] of canonicalGroups.entries()) {
    const keeper = chooseKeeper(rows);
    const duplicates = rows.filter((row) => toIdString(row._id) !== toIdString(keeper._id));

    const mergedRemainingViews = rows.reduce(
      (max, row) => Math.max(max, Number(row.remainingViews || 0)),
      0
    );

    const mergedLastAccessed = rows.reduce((latest, row) => {
      const rowTime = toDateMillis(row.lastAccessed);
      if (!latest || rowTime > toDateMillis(latest)) {
        return row.lastAccessed || latest;
      }
      return latest;
    }, keeper.lastAccessed || null);

    const action = {
      groupKey,
      canonicalLectureId: keeper.__canonicalLectureId,
      studentId: keeper.__studentId,
      keeperId: toIdString(keeper._id),
      deleteIds: duplicates.map((row) => toIdString(row._id)),
      keeperNeedsCanonicalUpdate:
        keeper.__sourceLectureId !== keeper.__canonicalLectureId,
      mergedRemainingViews,
      mergedLastAccessed,
      sourceRows: rows.map((row) => ({
        accessId: toIdString(row._id),
        lectureId: row.__sourceLectureId,
        remainingViews: row.remainingViews,
        lastAccessed: row.lastAccessed,
      })),
    };

    if (duplicates.length > 0) {
      duplicateGroups.push({
        groupKey,
        accessIds: rows.map((row) => toIdString(row._id)),
      });
    }

    if (
      action.deleteIds.length > 0 ||
      action.keeperNeedsCanonicalUpdate ||
      Number(keeper.remainingViews || 0) !== mergedRemainingViews ||
      toDateMillis(keeper.lastAccessed) !== toDateMillis(mergedLastAccessed)
    ) {
      applyPlan.push(action);
    }
  }

  const applied = {
    updatedKeepers: [],
    deletedDuplicates: [],
    deletedOrphans: [],
  };

  if (shouldApply) {
    for (const action of applyPlan) {
      if (action.deleteIds.length > 0) {
        await StudentLectureAccess.deleteMany({ _id: { $in: action.deleteIds } });
        applied.deletedDuplicates.push(...action.deleteIds);
      }

      const updatePayload = {
        remainingViews: action.mergedRemainingViews,
      };

      if (action.mergedLastAccessed) {
        updatePayload.lastAccessed = action.mergedLastAccessed;
      }

      if (action.keeperNeedsCanonicalUpdate) {
        updatePayload.lecture = action.canonicalLectureId;
      }

      await StudentLectureAccess.updateOne(
        { _id: action.keeperId },
        { $set: updatePayload }
      );

      applied.updatedKeepers.push({
        accessId: action.keeperId,
        update: updatePayload,
      });
    }

    if (shouldDeleteOrphans && orphanedAccesses.length > 0) {
      const orphanIds = orphanedAccesses.map((row) => row.accessId);
      await StudentLectureAccess.deleteMany({ _id: { $in: orphanIds } });
      applied.deletedOrphans = orphanIds;
    }
  }

  const report = {
    generatedAt: now.toISOString(),
    options: {
      apply: shouldApply,
      deleteOrphans: shouldDeleteOrphans,
    },
    summary: {
      totalAccessRows: accesses.length,
      orphanedRows: orphanedAccesses.length,
      canonicalizationCandidates: canonicalizationCandidates.length,
      duplicateGroups: duplicateGroups.length,
      plannedActions: applyPlan.length,
      appliedKeeperUpdates: applied.updatedKeepers.length,
      appliedDuplicateDeletes: applied.deletedDuplicates.length,
      appliedOrphanDeletes: applied.deletedOrphans.length,
    },
    orphanedAccesses,
    canonicalizationCandidates,
    duplicateGroups,
    applyPlan,
    applied,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

  console.log("Student lecture access reconciliation report written:");
  console.log(reportPath);
  console.log(JSON.stringify(report.summary, null, 2));

  await mongoose.connection.close();
};

run()
  .then(() => {
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Reconciliation failed:", error);
    try {
      await mongoose.connection.close();
    } catch (_err) {
      // no-op
    }
    process.exit(1);
  });
