require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const StudentExamSubmission = require("../models/studentExamSubmissionModel");
const {
  processAssessmentSubmissionFromSheet,
} = require("../utils/examSubmissionSync");

const argSet = new Set(process.argv.slice(2));
const lectureIdFilter = argSet.has("--lecture-id")
  ? process.argv[process.argv.indexOf("--lecture-id") + 1]
  : null;
const limitArg = argSet.has("--limit")
  ? Number(process.argv[process.argv.indexOf("--limit") + 1])
  : null;

const toIdString = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value._id) return value._id.toString();
  return value.toString();
};

const ensureOutputDir = (outputDir) => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
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
    `exam-submissions-reconcile-${timestamp}.json`
  );

  const query = {
    syncStatus: { $in: ["pending", "failed"] },
  };

  if (lectureIdFilter) {
    query.lecture = lectureIdFilter;
  }

  const submissionsQuery = StudentExamSubmission.find(query)
    .sort({ updatedAt: 1 })
    .populate([
      {
        path: "student",
        select: "name email phoneNumber",
      },
      {
        path: "lecture",
        select:
          "_id name requiresExam requiresHomework passingThreshold homeworkPassingThreshold examConfig homeworkConfig",
      },
    ]);

  if (limitArg && Number.isFinite(limitArg) && limitArg > 0) {
    submissionsQuery.limit(limitArg);
  }

  const pendingSubmissions = await submissionsQuery.lean();
  const reportItems = [];
  const summary = {
    totalCandidates: pendingSubmissions.length,
    processed: 0,
    updated: 0,
    stillPending: 0,
    failed: 0,
    skipped: 0,
  };

  for (const submission of pendingSubmissions) {
    const lecture = submission.lecture;
    const student = submission.student;
    const lectureId = toIdString(lecture?._id);
    const studentId = toIdString(student?._id);

    if (!lecture || !student || !lectureId || !studentId) {
      summary.skipped += 1;
      reportItems.push({
        submissionId: toIdString(submission._id),
        lectureId,
        studentId,
        type: submission.type,
        status: "skipped",
        reason: "missing-lecture-or-student",
      });
      continue;
    }

    if (submission.type === "exam" && !lecture.requiresExam) {
      summary.skipped += 1;
      reportItems.push({
        submissionId: toIdString(submission._id),
        lectureId,
        studentId,
        type: submission.type,
        status: "skipped",
        reason: "lecture-no-longer-requires-exam",
      });
      continue;
    }

    if (submission.type === "homework" && !lecture.requiresHomework) {
      summary.skipped += 1;
      reportItems.push({
        submissionId: toIdString(submission._id),
        lectureId,
        studentId,
        type: submission.type,
        status: "skipped",
        reason: "lecture-no-longer-requires-homework",
      });
      continue;
    }

    const studentIdentifier =
      student.email || student.phoneNumber || studentId;

    try {
      const refreshed = await processAssessmentSubmissionFromSheet({
        lecture,
        lectureId,
        studentId,
        studentIdentifier,
        assessmentType: submission.type,
        syncSource: "reconciliation",
        upsertPendingOnMissing: true,
      });

      summary.processed += 1;

      if (!refreshed) {
        summary.skipped += 1;
        reportItems.push({
          submissionId: toIdString(submission._id),
          lectureId,
          studentId,
          type: submission.type,
          status: "skipped",
          reason: "no-refresh-result",
        });
        continue;
      }

      const updated =
        refreshed.status === "passed" ||
        refreshed.status === "failed" ||
        refreshed.status === "already_passed";
      if (updated) {
        summary.updated += 1;
      }

      if (refreshed.status === "pending") {
        summary.stillPending += 1;
      }

      if (refreshed.status === "failed") {
        summary.failed += 1;
      }

      reportItems.push({
        submissionId: toIdString(submission._id),
        lectureId,
        studentId,
        type: submission.type,
        status: refreshed.status,
        passed: refreshed.passed,
        requiredScore: refreshed.requiredScore,
        syncStatus: refreshed.syncStatus,
        syncSource: refreshed.syncSource,
        error: refreshed.error || null,
      });
    } catch (error) {
      summary.failed += 1;
      reportItems.push({
        submissionId: toIdString(submission._id),
        lectureId,
        studentId,
        type: submission.type,
        status: "failed",
        error: error.message,
      });
    }
  }

  const report = {
    generatedAt: now.toISOString(),
    options: {
      lectureId: lectureIdFilter,
      limit: limitArg,
    },
    summary,
    items: reportItems,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

  console.log("Exam submission reconciliation report written:");
  console.log(reportPath);
  console.log(JSON.stringify(summary, null, 2));

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
