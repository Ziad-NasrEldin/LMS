const crypto = require("crypto");
const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const Student = require("../models/studentModel");
const StudentExamSubmission = require("../models/studentExamSubmissionModel");
const Lecture = require("../models/LectureModel");
const LecturerExamConfig = require("../models/ExamConfigModel");
const { configureGoogleSheets } = require("../config/googleApiConfig");
const {
  ASSESSMENT_MAP,
  resolvePassingThreshold,
  resolveAssessmentConfigUrl,
  resolveLegacyAssessmentUrl,
} = require("./lectureAccessUtils");
const { normalizeExternalUrl } = require("./urlValidation");

const DEFAULT_PASSING_THRESHOLD = 60;
const DEFAULT_SYNC_SKEW_MS = Number(
  process.env.EXAM_SYNC_MAX_SKEW_MS || 5 * 60 * 1000
);

const normalizeString = (value) => String(value ?? "").trim();

const normalizeAssessmentType = (value) => {
  const normalized = normalizeString(value).toLowerCase();

  if (normalized === "exam") return "exam";
  if (normalized === "homework") return "homework";
  return null;
};

const parseSubmissionScore = (rawScore) => {
  if (rawScore === undefined || rawScore === null || rawScore === "") {
    return null;
  }

  if (typeof rawScore === "number" && Number.isFinite(rawScore)) {
    return {
      score: rawScore,
      maxScore: rawScore,
    };
  }

  const rawText = normalizeString(rawScore);
  if (!rawText) return null;

  if (rawText.includes("/")) {
    const [scoreValue, maxScoreValue] = rawText
      .split("/")
      .map((part) => Number(part.trim()));

    if (Number.isFinite(scoreValue) && Number.isFinite(maxScoreValue)) {
      return {
        score: scoreValue,
        maxScore: maxScoreValue,
      };
    }

    return null;
  }

  const parsedScore = Number(rawText);
  if (!Number.isFinite(parsedScore)) {
    return null;
  }

  return {
    score: parsedScore,
    maxScore: parsedScore,
  };
};

const getNamedValue = (namedValues, key) => {
  if (!namedValues || typeof namedValues !== "object" || !key) {
    return null;
  }

  const value = namedValues[key];
  if (Array.isArray(value)) {
    return value.length > 0 ? value[0] : null;
  }

  return value ?? null;
};

const extractWebhookScore = (payload = {}) => {
  const scoreCandidates = [
    payload.score,
    payload.scoreRaw,
    payload.scoreValue,
    payload.rawScore,
    getNamedValue(payload.namedValues, payload.scoreColumn),
    getNamedValue(payload.namedValues, "Score"),
    getNamedValue(payload.namedValues, "score"),
  ];

  let parsedScore = null;
  for (const candidate of scoreCandidates) {
    parsedScore = parseSubmissionScore(candidate);
    if (parsedScore) {
      break;
    }
  }

  if (!parsedScore) {
    return null;
  }

  const maxScoreCandidates = [
    payload.maxScore,
    payload.maxScoreRaw,
    payload.maxScoreValue,
    payload.rawMaxScore,
    getNamedValue(payload.namedValues, payload.maxScoreColumn),
    getNamedValue(payload.namedValues, "Max Score"),
    getNamedValue(payload.namedValues, "Maximum points"),
  ];

  for (const candidate of maxScoreCandidates) {
    if (candidate === undefined || candidate === null || candidate === "") {
      continue;
    }

    const parsedMaxScore = Number(candidate);
    if (Number.isFinite(parsedMaxScore)) {
      parsedScore.maxScore = parsedMaxScore;
      break;
    }
  }

  return parsedScore;
};

const decodeSignature = (value) => {
  const normalized = normalizeString(value).replace(/^sha256=/i, "");
  if (!normalized) return null;

  if (/^[0-9a-f]{64}$/i.test(normalized)) {
    return Buffer.from(normalized, "hex");
  }

  const maybeBase64 = normalized.replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/=]+$/.test(maybeBase64)) {
    return null;
  }

  try {
    const buffer = Buffer.from(maybeBase64, "base64");
    return buffer.length > 0 ? buffer : null;
  } catch (_error) {
    return null;
  }
};

const buildSignedWebhookDigest = (rawBody, timestamp, secret) =>
  crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest();

const verifyExamSyncWebhook = ({
  rawBody,
  timestamp,
  signature,
  secret = process.env.EXAM_SYNC_WEBHOOK_SECRET || process.env.GOOGLE_FORMS_SYNC_SECRET,
  maxSkewMs = DEFAULT_SYNC_SKEW_MS,
} = {}) => {
  if (!secret) {
    throw new AppError("Exam sync webhook secret is not configured", 503);
  }

  const normalizedTimestamp = normalizeString(timestamp);
  if (!normalizedTimestamp) {
    throw new AppError("Exam sync timestamp is required", 400);
  }

  const parsedTimestamp = Date.parse(normalizedTimestamp);
  if (!Number.isFinite(parsedTimestamp)) {
    throw new AppError("Exam sync timestamp is invalid", 400);
  }

  const skewWindow = Number.isFinite(Number(maxSkewMs))
    ? Number(maxSkewMs)
    : DEFAULT_SYNC_SKEW_MS;

  if (Math.abs(Date.now() - parsedTimestamp) > skewWindow) {
    throw new AppError("Exam sync timestamp is outside the allowed window", 401);
  }

  const normalizedRawBody = typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody || {});
  const providedSignature = decodeSignature(signature);
  const expectedSignature = buildSignedWebhookDigest(
    normalizedRawBody,
    normalizedTimestamp,
    secret
  );

  if (
    !providedSignature ||
    providedSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(providedSignature, expectedSignature)
  ) {
    throw new AppError("Exam sync signature is invalid", 401);
  }

  return true;
};

const getExamResultsFromSheet = async (
  sheetId,
  studentIdentifier,
  studentIdentifierColumn,
  scoreColumn
) => {
  try {
    const sheets = configureGoogleSheets();

    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: "sheets.properties.title",
    });

    if (!spreadsheet.data.sheets || spreadsheet.data.sheets.length === 0) {
      return { found: false, error: "No sheets found in the spreadsheet" };
    }

    const sheetTitle = spreadsheet.data.sheets[0].properties.title;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: sheetTitle,
      valueRenderOption: "UNFORMATTED_VALUE",
      dateTimeRenderOption: "FORMATTED_STRING",
    });

    if (!response.data.values || response.data.values.length === 0) {
      return { found: false, error: "No data found in the spreadsheet" };
    }

    const headers = response.data.values[0];
    const identifierColIndex = headers.findIndex(
      (header) =>
        String(header).toLowerCase() ===
        String(studentIdentifierColumn).toLowerCase()
    );
    const scoreColIndex = headers.findIndex(
      (header) =>
        String(header).toLowerCase() === String(scoreColumn).toLowerCase()
    );

    if (identifierColIndex === -1) {
      return {
        found: false,
        error: `Column '${studentIdentifierColumn}' not found`,
      };
    }

    if (scoreColIndex === -1) {
      return { found: false, error: `Column '${scoreColumn}' not found` };
    }

    const dataRows = response.data.values.slice(1);
    const studentRows = dataRows.filter(
      (row) =>
        row[identifierColIndex] &&
        String(row[identifierColIndex]).toLowerCase().trim() ===
          String(studentIdentifier).toLowerCase().trim()
    );

    let studentRow = null;
    if (studentRows.length > 0) {
      studentRows.sort((a, b) => {
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);
        return dateB - dateA;
      });

      studentRow = studentRows[0];
    }

    if (!studentRow) {
      return {
        found: false,
        error: `No submission found for student with identifier: ${studentIdentifier}`,
      };
    }

    const rawScore = studentRow[scoreColIndex];
    const parsedScore = parseSubmissionScore(rawScore);

    if (!parsedScore) {
      return {
        found: false,
        error: `Invalid score format for student: ${studentIdentifier}`,
      };
    }

    return {
      found: true,
      score: parsedScore.score,
      maxScore: parsedScore.maxScore,
      studentRow,
      fetchTime: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching exam results from Google Sheet:", error);
    return {
      found: false,
      error: `Unable to fetch exam results: ${error.message}`,
    };
  }
};

const resolveAssessmentConfigDoc = async (lecture, assessmentType) => {
  const assessment = ASSESSMENT_MAP[assessmentType];
  if (!assessment) return null;

  const rawConfig = lecture?.[assessment.configField];
  if (!rawConfig) {
    return null;
  }

  if (
    rawConfig.googleSheetId &&
    rawConfig.studentIdentifierColumn &&
    rawConfig.scoreColumn
  ) {
    return rawConfig;
  }

  const configId = rawConfig._id || rawConfig;
  if (!mongoose.Types.ObjectId.isValid(configId)) {
    return null;
  }

  return LecturerExamConfig.findById(configId);
};

const resolveAssessmentConfigDocFromPayload = async (
  payload = {},
  assessmentType = null
) => {
  const normalizedAssessmentType = normalizeAssessmentType(assessmentType);
  const typeFilter = normalizedAssessmentType ? { type: normalizedAssessmentType } : {};

  const configId = normalizeString(
    payload.configId ||
      payload.lecturerExamConfigId ||
      payload.examConfigId ||
      payload.homeworkConfigId
  );
  if (configId && mongoose.Types.ObjectId.isValid(configId)) {
    const configDoc = await LecturerExamConfig.findOne({
      _id: configId,
      ...typeFilter,
    });
    if (configDoc) {
      return configDoc;
    }
  }

  const sheetId = normalizeString(
    payload.sheetId || payload.googleSheetId || payload.spreadsheetId
  );
  if (sheetId) {
    const configDoc = await LecturerExamConfig.findOne({
      googleSheetId: sheetId,
      ...typeFilter,
    }).sort({ updatedAt: -1 });

    if (configDoc) {
      return configDoc;
    }
  }

  const formUrl = normalizeExternalUrl(
    payload.formUrl || payload.examFormUrl || payload.homeworkFormUrl
  );
  if (formUrl) {
    const configDoc = await LecturerExamConfig.findOne({
      formUrl,
      ...typeFilter,
    }).sort({ updatedAt: -1 });

    if (configDoc) {
      return configDoc;
    }
  }

  return null;
};

const resolveAssessmentLectures = async ({
  configDoc,
  assessmentType,
  lectureId = null,
}) => {
  const assessment = ASSESSMENT_MAP[assessmentType];
  if (!assessment || !configDoc) return [];

  if (lectureId) {
    const lecture = await Lecture.findById(lectureId)
      .populate("examConfig")
      .populate("homeworkConfig");

    if (!lecture) {
      return [];
    }

    const linkedConfig = lecture?.[assessment.configField];
    const linkedConfigId = linkedConfig?._id || linkedConfig;
    if (linkedConfigId && String(linkedConfigId) !== String(configDoc._id)) {
      return [];
    }

    if (!lecture?.[assessment.requiresField]) {
      return [];
    }

    return [lecture];
  }

  return Lecture.find({
    [assessment.requiresField]: true,
    [assessment.configField]: configDoc._id,
  })
    .populate("examConfig")
    .populate("homeworkConfig");
};

const collectStudentCandidates = (payload = {}) => {
  const candidates = new Set();
  const pushCandidate = (value) => {
    const normalized = normalizeString(value);
    if (normalized) {
      candidates.add(normalized);
    }
  };

  [
    payload.studentId,
    payload.studentIdentifier,
    payload.studentEmail,
    payload.email,
    payload.respondentEmail,
    payload.studentPhone,
    payload.phoneNumber,
  ].forEach(pushCandidate);

  if (Array.isArray(payload.values)) {
    payload.values.forEach(pushCandidate);
  }

  if (payload.namedValues && typeof payload.namedValues === "object") {
    for (const value of Object.values(payload.namedValues)) {
      if (Array.isArray(value)) {
        value.forEach(pushCandidate);
      } else {
        pushCandidate(value);
      }
    }
  }

  return [...candidates];
};

const resolveStudentFromWebhookPayload = async (payload = {}) => {
  const candidateValues = collectStudentCandidates(payload);

  for (const candidate of candidateValues) {
    if (mongoose.Types.ObjectId.isValid(candidate)) {
      const studentById = await Student.findById(candidate);
      if (studentById) {
        return studentById;
      }
    }

    const studentByEmail = await Student.findOne({ email: candidate });
    if (studentByEmail) {
      return studentByEmail;
    }

    const studentByPhone = await Student.findOne({ phoneNumber: candidate });
    if (studentByPhone) {
      return studentByPhone;
    }
  }

  return null;
};

const upsertAssessmentSubmission = async ({
  studentId,
  lectureId,
  assessmentType,
  configId,
  score,
  maxScore,
  passingThreshold,
  passed,
  syncStatus = "synced",
  syncSource = "sheet",
  syncReference = null,
  syncError = null,
  submittedAt = new Date(),
  verifiedAt = new Date(),
}) => {
  const record = await StudentExamSubmission.findOneAndUpdate(
    {
      student: studentId,
      lecture: lectureId,
      type: assessmentType,
    },
    {
      type: assessmentType,
      config: configId || null,
      score: score ?? null,
      maxScore: maxScore ?? null,
      passingThreshold: passingThreshold ?? null,
      passed: Boolean(passed),
      syncStatus,
      syncSource,
      syncReference: syncReference ? String(syncReference) : null,
      syncError: syncError ? String(syncError) : null,
      submittedAt,
      verifiedAt,
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  );

  return record;
};

const buildAssessmentResult = ({
  assessmentType,
  submission,
  status,
  requiredScore,
  url,
  responseUrlKey,
  error = null,
  syncSource = null,
  syncStatus = null,
}) => ({
  required: true,
  assessmentType,
  status,
  passed: Boolean(submission?.passed),
  submission,
  requiredScore,
  url,
  [responseUrlKey]: url,
  error: error || null,
  syncSource: syncSource || submission?.syncSource || null,
  syncStatus: syncStatus || submission?.syncStatus || null,
});

const getExistingSubmissionStatus = (submission) => {
  if (!submission) {
    return null;
  }

  if (submission.passed) {
    return "already_passed";
  }

  if (submission.syncStatus === "pending") {
    return "pending";
  }

  return "failed";
};

const processAssessmentSubmissionFromSheet = async ({
  lecture,
  lectureId,
  studentId,
  studentIdentifier,
  assessmentType,
  syncSource = "sheet",
  syncReference = null,
  upsertPendingOnMissing = false,
}) => {
  const assessment = ASSESSMENT_MAP[assessmentType];
  if (!assessment || !lecture?.[assessment.requiresField]) {
    return null;
  }

  const existingSubmission = await StudentExamSubmission.findOne({
    student: studentId,
    lecture: lectureId,
    type: assessmentType,
  });

  if (existingSubmission?.passed) {
    const configDoc = await resolveAssessmentConfigDoc(lecture, assessmentType);
    const resolvedUrl =
      resolveAssessmentConfigUrl(lecture, assessmentType) ||
      resolveLegacyAssessmentUrl(lecture, assessmentType) ||
      configDoc?.formUrl ||
      null;
    const threshold = resolvePassingThreshold(
      lecture?.[assessment.thresholdField],
      configDoc?.defaultPassingThreshold,
      DEFAULT_PASSING_THRESHOLD
    );

    return buildAssessmentResult({
      assessmentType,
      submission: existingSubmission,
      status: "already_passed",
      requiredScore: threshold,
      url: resolvedUrl,
      responseUrlKey: assessmentType === "exam" ? "examUrl" : "homeworkUrl",
      syncSource: existingSubmission.syncSource || syncSource,
      syncStatus: existingSubmission.syncStatus || "synced",
    });
  }

  const rawConfig = lecture?.[assessment.configField];
  if (!rawConfig) {
    throw new AppError(
      `${assessmentType === "exam" ? "Exam" : "Homework"} configuration is required when ${assessment.requiresField} is true`,
      404
    );
  }

  const configDoc = await resolveAssessmentConfigDoc(lecture, assessmentType);
  if (!configDoc) {
    throw new AppError(
      `${assessmentType === "exam" ? "Exam" : "Homework"} configuration not found for this lecture`,
      404
    );
  }

  const resolvedUrl =
    resolveAssessmentConfigUrl(lecture, assessmentType) ||
    resolveLegacyAssessmentUrl(lecture, assessmentType) ||
    configDoc.formUrl ||
    null;
  const passingThreshold = resolvePassingThreshold(
    lecture?.[assessment.thresholdField],
    configDoc.defaultPassingThreshold,
    DEFAULT_PASSING_THRESHOLD
  );

  const sheetResult = await getExamResultsFromSheet(
    configDoc.googleSheetId,
    studentIdentifier,
    configDoc.studentIdentifierColumn,
    configDoc.scoreColumn
  );

  if (!sheetResult.found) {
    if (existingSubmission) {
      const existingStatus = getExistingSubmissionStatus(existingSubmission);

      return buildAssessmentResult({
        assessmentType,
        submission: existingSubmission,
        status: existingStatus || "failed",
        requiredScore: passingThreshold,
        url: resolvedUrl,
        responseUrlKey: assessmentType === "exam" ? "examUrl" : "homeworkUrl",
        error: sheetResult.error || existingSubmission.syncError || null,
        syncSource: existingSubmission.syncSource || syncSource,
        syncStatus: existingSubmission.syncStatus || null,
      });
    }

    if (upsertPendingOnMissing) {
      const pendingSubmission = await upsertAssessmentSubmission({
        studentId,
        lectureId,
        assessmentType,
        configId: configDoc._id,
        score: null,
        maxScore: null,
        passingThreshold,
        passed: false,
        syncStatus: "pending",
        syncSource,
        syncReference,
        syncError: sheetResult.error || "Submission is still pending",
        submittedAt: new Date(),
        verifiedAt: new Date(),
      });

      return buildAssessmentResult({
        assessmentType,
        submission: pendingSubmission,
        status: "pending",
        requiredScore: passingThreshold,
        url: resolvedUrl,
        responseUrlKey: assessmentType === "exam" ? "examUrl" : "homeworkUrl",
        error: sheetResult.error || "Submission is still pending",
        syncSource,
        syncStatus: "pending",
      });
    }

    return buildAssessmentResult({
      assessmentType,
      submission: null,
      status: "not_found",
      requiredScore: passingThreshold,
      url: resolvedUrl,
      responseUrlKey: assessmentType === "exam" ? "examUrl" : "homeworkUrl",
      error: sheetResult.error || "No submission found for this student",
      syncSource: null,
      syncStatus: null,
    });
  }

  const passed = sheetResult.score >= passingThreshold;
  const submission = await upsertAssessmentSubmission({
    studentId,
    lectureId,
    assessmentType,
    configId: configDoc._id,
    score: sheetResult.score,
    maxScore: sheetResult.maxScore,
    passingThreshold,
    passed,
    syncStatus: "synced",
    syncSource,
    syncReference:
      syncReference || `sheet:${configDoc.googleSheetId}:${studentIdentifier}`,
    submittedAt: new Date(sheetResult.fetchTime || Date.now()),
    verifiedAt: new Date(),
  });

  return buildAssessmentResult({
    assessmentType,
    submission,
    status: passed ? "passed" : "failed",
    requiredScore: passingThreshold,
    url: resolvedUrl,
    responseUrlKey: assessmentType === "exam" ? "examUrl" : "homeworkUrl",
    syncSource,
    syncStatus: "synced",
  });
};

const processAssessmentSubmissionFromWebhook = async ({
  payload = {},
  syncSource = "webhook",
} = {}) => {
  const configDoc = await resolveAssessmentConfigDocFromPayload(payload);
  if (!configDoc) {
    throw new AppError("No exam configuration found for this submission", 404);
  }

  const payloadAssessmentType = normalizeAssessmentType(payload.assessmentType);
  const configAssessmentType = normalizeAssessmentType(configDoc.type);
  const assessmentType = payloadAssessmentType || configAssessmentType;

  if (!assessmentType) {
    throw new AppError("Assessment type is required for exam sync", 400);
  }

  if (configAssessmentType && assessmentType !== configAssessmentType) {
    throw new AppError(
      `Assessment type '${assessmentType}' does not match configuration type '${configAssessmentType}'`,
      400
    );
  }

  const assessment = ASSESSMENT_MAP[assessmentType];
  if (!assessment) {
    throw new AppError("Unsupported assessment type", 400);
  }

  const student = await resolveStudentFromWebhookPayload(payload);
  if (!student) {
    throw new AppError("Unable to resolve student for exam submission", 404);
  }

  const lectureId = payload.lectureId || payload.lecture || null;
  const lectures = await resolveAssessmentLectures({
    configDoc,
    assessmentType,
    lectureId,
  });

  if (!lectures || lectures.length === 0) {
    throw new AppError("No lectures are linked to this assessment configuration", 404);
  }

  const parsedScore = extractWebhookScore(payload);
  const syncReference =
    normalizeString(
      payload.responseId ||
        payload.submissionId ||
        payload.eventId ||
        payload.rowId ||
        payload.syncReference
    ) || null;
  const submittedAtValue =
    payload.submittedAt ||
    payload.responseSubmittedAt ||
    payload.timestamp ||
    payload.createdAt;
  const submittedAt = submittedAtValue ? new Date(submittedAtValue) : new Date();
  const responseUrlKey = assessmentType === "exam" ? "examUrl" : "homeworkUrl";
  const results = [];

  for (const lecture of lectures) {
    const threshold = resolvePassingThreshold(
      lecture?.[assessment.thresholdField],
      configDoc.defaultPassingThreshold,
      DEFAULT_PASSING_THRESHOLD
    );
    const existingSubmission = await StudentExamSubmission.findOne({
      student: student._id,
      lecture: lecture._id,
      type: assessmentType,
    });

    const resolvedUrl =
      resolveAssessmentConfigUrl(lecture, assessmentType) ||
      resolveLegacyAssessmentUrl(lecture, assessmentType) ||
      configDoc.formUrl ||
      null;

    if (existingSubmission?.passed) {
      results.push(
        buildAssessmentResult({
          assessmentType,
          submission: existingSubmission,
          status: "already_passed",
          requiredScore: threshold,
          url: resolvedUrl,
          responseUrlKey,
          syncSource: existingSubmission.syncSource || syncSource,
          syncStatus: existingSubmission.syncStatus || "synced",
        })
      );
      continue;
    }

    if (!parsedScore) {
      if (existingSubmission?.syncStatus === "pending") {
        const pendingSubmission = await upsertAssessmentSubmission({
          studentId: student._id,
          lectureId: lecture._id,
          assessmentType,
          configId: configDoc._id,
          score: null,
          maxScore: null,
          passingThreshold: threshold,
          passed: false,
          syncStatus: "pending",
          syncSource,
          syncReference: syncReference || `webhook:${configDoc._id}:${lecture._id}`,
          syncError: existingSubmission.syncError || "Score is not available yet",
          submittedAt,
          verifiedAt: new Date(),
        });

        results.push(
          buildAssessmentResult({
            assessmentType,
            submission: pendingSubmission,
            status: "pending",
            requiredScore: threshold,
            url: resolvedUrl,
            responseUrlKey,
            error: pendingSubmission.syncError,
            syncSource,
            syncStatus: "pending",
          })
        );
        continue;
      }

      if (existingSubmission) {
        results.push(
          buildAssessmentResult({
            assessmentType,
            submission: existingSubmission,
            status: getExistingSubmissionStatus(existingSubmission) || "failed",
            requiredScore: threshold,
            url: resolvedUrl,
            responseUrlKey,
            error: existingSubmission.syncError || "Score is not available yet",
            syncSource: existingSubmission.syncSource || syncSource,
            syncStatus: existingSubmission.syncStatus || null,
          })
        );
        continue;
      }

      const pendingSubmission = await upsertAssessmentSubmission({
        studentId: student._id,
        lectureId: lecture._id,
        assessmentType,
        configId: configDoc._id,
        score: null,
        maxScore: null,
        passingThreshold: threshold,
        passed: false,
        syncStatus: "pending",
        syncSource,
        syncReference: syncReference || `webhook:${configDoc._id}:${lecture._id}`,
        syncError: "Score is not available yet",
        submittedAt,
        verifiedAt: new Date(),
      });

      results.push(
        buildAssessmentResult({
          assessmentType,
          submission: pendingSubmission,
          status: "pending",
          requiredScore: threshold,
          url: resolvedUrl,
          responseUrlKey,
          error: pendingSubmission.syncError,
          syncSource,
          syncStatus: "pending",
        })
      );
      continue;
    }

    const passed = parsedScore.score >= threshold;
    const submission = await upsertAssessmentSubmission({
      studentId: student._id,
      lectureId: lecture._id,
      assessmentType,
      configId: configDoc._id,
      score: parsedScore.score,
      maxScore: parsedScore.maxScore,
      passingThreshold: threshold,
      passed,
      syncStatus: "synced",
      syncSource,
      syncReference: syncReference || `webhook:${configDoc._id}:${lecture._id}`,
      syncError: null,
      submittedAt,
      verifiedAt: new Date(),
    });

    results.push(
      buildAssessmentResult({
        assessmentType,
        submission,
        status: passed ? "passed" : "failed",
        requiredScore: threshold,
        url: resolvedUrl,
        responseUrlKey,
        syncSource,
        syncStatus: "synced",
      })
    );
  }

  const summary = {
    totalLectures: results.length,
    passed: results.filter((result) => result.status === "passed" || result.status === "already_passed").length,
    failed: results.filter((result) => result.status === "failed").length,
    pending: results.filter((result) => result.status === "pending").length,
    alreadyPassed: results.filter((result) => result.status === "already_passed").length,
  };

  const overallStatus = summary.pending > 0
    ? "pending"
    : summary.failed > 0
      ? summary.passed > 0
        ? "partial"
        : "failed"
      : "passed";

  return {
    status: overallStatus,
    assessmentType,
    config: {
      _id: configDoc._id,
      name: configDoc.name,
      type: configDoc.type,
      googleSheetId: configDoc.googleSheetId,
      formUrl: configDoc.formUrl,
    },
    student: {
      _id: student._id,
      name: student.name,
      email: student.email,
    },
    summary,
    results,
    passed: results.every((result) => result.passed === true),
  };
};

module.exports = {
  DEFAULT_PASSING_THRESHOLD,
  DEFAULT_SYNC_SKEW_MS,
  normalizeAssessmentType,
  parseSubmissionScore,
  getNamedValue,
  extractWebhookScore,
  verifyExamSyncWebhook,
  getExamResultsFromSheet,
  resolveAssessmentConfigDoc,
  resolveAssessmentConfigDocFromPayload,
  resolveAssessmentLectures,
  resolveStudentFromWebhookPayload,
  upsertAssessmentSubmission,
  processAssessmentSubmissionFromSheet,
  processAssessmentSubmissionFromWebhook,
};
