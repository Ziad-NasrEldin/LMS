const crypto = require("crypto");
const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const Student = require("../models/studentModel");
const StudentExamSubmission = require("../models/studentExamSubmissionModel");
const Lecture = require("../models/LectureModel");
const LecturerExamConfig = require("../models/ExamConfigModel");
const googleApiConfig = require("../config/googleApiConfig");
const {
  ASSESSMENT_MAP,
  resolvePassingThreshold,
  resolveAssessmentConfigUrl,
  resolveLegacyAssessmentUrl,
} = require("./lectureAccessUtils");
const { normalizeExternalUrl } = require("./urlValidation");

const DEFAULT_PASSING_THRESHOLD = 60;
const DEFAULT_MASTER_SHEET_RAW_TAB = "RAW_SUBMISSIONS";
const LEGACY_FORM_RESPONSES_TAB = "Form Responses 1";
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

const normalizeSheetTabName = (value) => {
  const normalizedValue = normalizeString(value);
  return normalizedValue || null;
};

const normalizeComparableUrl = (value) => {
  if (!value) return null;
  return normalizeExternalUrl(value) || normalizeString(value) || null;
};

const normalizeHeader = (header) => normalizeString(header).toLowerCase();

const findHeaderIndex = (headers, expectedHeader) => {
  const normalizedExpected = normalizeHeader(expectedHeader);
  return headers.findIndex(
    (header) => normalizeHeader(header) === normalizedExpected
  );
};

const toComparableLower = (value) => normalizeString(value).toLowerCase();

const parseDateValue = (value) => {
  if (value === undefined || value === null || value === "") return null;

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
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
  sheetIdOrOptions,
  legacyStudentIdentifier,
  legacyStudentIdentifierColumn,
  legacyScoreColumn
) => {
  const options =
    typeof sheetIdOrOptions === "object" && sheetIdOrOptions !== null
      ? sheetIdOrOptions
      : {
          sheetId: sheetIdOrOptions,
          studentIdentifier: legacyStudentIdentifier,
          studentIdentifierColumn: legacyStudentIdentifierColumn,
          scoreColumn: legacyScoreColumn,
        };

  const sheetId = normalizeString(options.sheetId);
  const studentIdentifier = normalizeString(options.studentIdentifier);
  const studentEmail = normalizeString(options.studentEmail);
  const studentIdentifierColumn =
    normalizeString(options.studentIdentifierColumn) || "Email Address";
  const scoreColumn = normalizeString(options.scoreColumn) || "Score";
  const assessmentType = normalizeAssessmentType(options.assessmentType);
  const lecturerId = normalizeString(options.lecturerId);
  const formUrl = normalizeComparableUrl(options.formUrl);
  const sheetTabName =
    normalizeSheetTabName(options.sheetTabName) ||
    normalizeSheetTabName(options.fallbackSheetTabName) ||
    DEFAULT_MASTER_SHEET_RAW_TAB;

  if (!sheetId) {
    return { found: false, error: "Google Sheet ID is required" };
  }

  if (!sheetTabName) {
    return { found: false, error: "Google Sheet tab name is required" };
  }

  try {
    const sheets = googleApiConfig.configureGoogleSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: sheetTabName,
      valueRenderOption: "UNFORMATTED_VALUE",
      dateTimeRenderOption: "FORMATTED_STRING",
    });

    if (!response.data.values || response.data.values.length === 0) {
      return {
        found: false,
        error: `No data found in '${sheetTabName}' tab`,
      };
    }

    const headers = response.data.values[0].map((header) =>
      normalizeString(header)
    );
    const dataRows = response.data.values.slice(1);

    const rawAssessmentIndex = findHeaderIndex(headers, "assessmentType");
    const rawFormUrlIndex = findHeaderIndex(headers, "formUrl");
    const rawLecturerIdIndex = findHeaderIndex(headers, "lecturerId");
    const rawStudentIdentifierIndex = findHeaderIndex(headers, "studentIdentifier");
    const rawStudentEmailIndex = findHeaderIndex(headers, "studentEmail");
    const rawScoreIndex = findHeaderIndex(headers, "score");
    const rawMaxScoreIndex = findHeaderIndex(headers, "maxScore");
    const rawSubmittedAtIndex = findHeaderIndex(headers, "submittedAt");
    const rawSourceRowNumberIndex = findHeaderIndex(headers, "sourceRowNumber");

    const canUseMasterRawLookup =
      rawAssessmentIndex !== -1 &&
      rawFormUrlIndex !== -1 &&
      rawLecturerIdIndex !== -1 &&
      rawScoreIndex !== -1 &&
      (rawStudentIdentifierIndex !== -1 || rawStudentEmailIndex !== -1);

    if (canUseMasterRawLookup) {
      const comparableIdentifier = toComparableLower(studentIdentifier);
      const comparableEmail = toComparableLower(studentEmail);
      const filteredRows = dataRows
        .map((row, rowIndex) => ({ row, rowIndex }))
        .filter(({ row }) => {
          if (assessmentType) {
            const rowAssessmentType = normalizeAssessmentType(
              row[rawAssessmentIndex]
            );
            if (rowAssessmentType !== assessmentType) {
              return false;
            }
          }

          if (lecturerId && normalizeString(row[rawLecturerIdIndex]) !== lecturerId) {
            return false;
          }

          if (formUrl) {
            const rowFormUrl = normalizeComparableUrl(row[rawFormUrlIndex]);
            if (!rowFormUrl || rowFormUrl !== formUrl) {
              return false;
            }
          }

          const rowStudentIdentifier = toComparableLower(
            rawStudentIdentifierIndex === -1 ? null : row[rawStudentIdentifierIndex]
          );
          const rowStudentEmail = toComparableLower(
            rawStudentEmailIndex === -1 ? null : row[rawStudentEmailIndex]
          );

          const matchesIdentifier =
            Boolean(comparableIdentifier) &&
            (rowStudentIdentifier === comparableIdentifier ||
              rowStudentEmail === comparableIdentifier);
          const matchesEmail =
            Boolean(comparableEmail) &&
            (rowStudentEmail === comparableEmail ||
              rowStudentIdentifier === comparableEmail);

          return matchesIdentifier || matchesEmail;
        })
        .map(({ row, rowIndex }) => {
          const parsedScore = parseSubmissionScore(row[rawScoreIndex]);
          if (!parsedScore) return null;

          if (rawMaxScoreIndex !== -1) {
            const parsedMaxScore = Number(row[rawMaxScoreIndex]);
            if (Number.isFinite(parsedMaxScore)) {
              parsedScore.maxScore = parsedMaxScore;
            }
          }

          const submittedAt =
            parseDateValue(rawSubmittedAtIndex === -1 ? null : row[rawSubmittedAtIndex]) ||
            new Date(0);
          const sourceRowNumber = Number(
            rawSourceRowNumberIndex === -1 ? NaN : row[rawSourceRowNumberIndex]
          );

          return {
            row,
            rowIndex,
            score: parsedScore.score,
            maxScore: parsedScore.maxScore,
            submittedAt,
            sourceRowNumber: Number.isFinite(sourceRowNumber)
              ? sourceRowNumber
              : rowIndex + 2,
          };
        })
        .filter(Boolean)
        .sort((left, right) => {
          if (right.submittedAt.getTime() !== left.submittedAt.getTime()) {
            return right.submittedAt - left.submittedAt;
          }

          return right.sourceRowNumber - left.sourceRowNumber;
        });

      const latestRow = filteredRows[0];
      if (!latestRow) {
        return {
          found: false,
          error: `No submission found in '${sheetTabName}' for the provided student`,
        };
      }

      return {
        found: true,
        score: latestRow.score,
        maxScore: latestRow.maxScore,
        studentRow: latestRow.row,
        fetchTime: new Date().toISOString(),
        sheetTabName,
      };
    }

    const identifierColIndex = findHeaderIndex(headers, studentIdentifierColumn);
    const scoreColIndex = findHeaderIndex(headers, scoreColumn);

    if (identifierColIndex === -1) {
      return {
        found: false,
        error: `Column '${studentIdentifierColumn}' not found in '${sheetTabName}'`,
      };
    }

    if (scoreColIndex === -1) {
      return {
        found: false,
        error: `Column '${scoreColumn}' not found in '${sheetTabName}'`,
      };
    }

    const comparableIdentifier = toComparableLower(studentIdentifier);
    const studentRows = dataRows.filter((row) => {
      const rowIdentifier = toComparableLower(row[identifierColIndex]);
      return rowIdentifier && rowIdentifier === comparableIdentifier;
    });

    if (studentRows.length === 0) {
      return {
        found: false,
        error: `No submission found for student with identifier: ${studentIdentifier}`,
      };
    }

    const submittedAtIndex = findHeaderIndex(headers, "submittedAt");
    studentRows.sort((leftRow, rightRow) => {
      const leftDate =
        parseDateValue(
          submittedAtIndex === -1 ? leftRow[0] : leftRow[submittedAtIndex]
        ) || new Date(0);
      const rightDate =
        parseDateValue(
          submittedAtIndex === -1 ? rightRow[0] : rightRow[submittedAtIndex]
        ) || new Date(0);
      return rightDate - leftDate;
    });

    const studentRow = studentRows[0];
    const parsedScore = parseSubmissionScore(studentRow[scoreColIndex]);

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
      sheetTabName,
    };
  } catch (error) {
    const message = String(error?.message || "");
    if (message.toLowerCase().includes("unable to parse range")) {
      return {
        found: false,
        error: `Configured tab '${sheetTabName}' was not found in this spreadsheet`,
      };
    }

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
  const lecturerId = normalizeString(
    payload.lecturerId ||
      payload.lecturer ||
      payload.lecturerUserId ||
      payload.ownerId ||
      payload.createdBy
  );
  const lecturerFilter = mongoose.Types.ObjectId.isValid(lecturerId)
    ? { lecturer: lecturerId }
    : {};
  const formUrl = normalizeExternalUrl(
    payload.formUrl || payload.examFormUrl || payload.homeworkFormUrl
  );

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

  if (formUrl && mongoose.Types.ObjectId.isValid(lecturerId)) {
    const configDoc = await LecturerExamConfig.findOne({
      formUrl,
      ...lecturerFilter,
      ...typeFilter,
    }).sort({ updatedAt: -1 });

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
      ...lecturerFilter,
      ...typeFilter,
    }).sort({ updatedAt: -1 });

    if (configDoc) {
      return configDoc;
    }
  }

  if (formUrl) {
    const configDoc = await LecturerExamConfig.findOne({
      formUrl,
      ...lecturerFilter,
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

const extractSyncReference = (payload = {}) =>
  normalizeString(
    payload.responseId ||
      payload.submissionId ||
      payload.eventId ||
      payload.rowId ||
      payload.syncReference
  ) || null;

const extractSubmittedAtValue = (payload = {}) =>
  payload.submittedAt ||
  payload.responseSubmittedAt ||
  payload.timestamp ||
  payload.createdAt ||
  null;

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

  const preferredSheetTabName =
    normalizeSheetTabName(configDoc.googleSheetTabName) ||
    DEFAULT_MASTER_SHEET_RAW_TAB;
  let sheetResult = await getExamResultsFromSheet({
    sheetId: configDoc.googleSheetId,
    sheetTabName: preferredSheetTabName,
    fallbackSheetTabName: DEFAULT_MASTER_SHEET_RAW_TAB,
    studentIdentifier,
    studentEmail: normalizeString(studentIdentifier).includes("@")
      ? studentIdentifier
      : null,
    studentIdentifierColumn: configDoc.studentIdentifierColumn,
    scoreColumn: configDoc.scoreColumn,
    assessmentType,
    lecturerId: lecture?.createdBy || configDoc.lecturer,
    formUrl: configDoc.formUrl,
  });

  if (
    !sheetResult.found &&
    !normalizeSheetTabName(configDoc.googleSheetTabName) &&
    preferredSheetTabName !== LEGACY_FORM_RESPONSES_TAB
  ) {
    const legacySheetResult = await getExamResultsFromSheet({
      sheetId: configDoc.googleSheetId,
      sheetTabName: LEGACY_FORM_RESPONSES_TAB,
      fallbackSheetTabName: LEGACY_FORM_RESPONSES_TAB,
      studentIdentifier,
      studentEmail: normalizeString(studentIdentifier).includes("@")
        ? studentIdentifier
        : null,
      studentIdentifierColumn: configDoc.studentIdentifierColumn,
      scoreColumn: configDoc.scoreColumn,
      assessmentType,
      lecturerId: lecture?.createdBy || configDoc.lecturer,
      formUrl: configDoc.formUrl,
    });

    if (legacySheetResult.found) {
      sheetResult = legacySheetResult;
    }
  }

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
  const payloadAssessmentType = normalizeAssessmentType(
    payload.assessmentType || payload.type
  );
  const payloadSheetId = normalizeString(
    payload.sheetId || payload.googleSheetId || payload.spreadsheetId
  );
  const payloadConfigId = normalizeString(
    payload.configId ||
      payload.lecturerExamConfigId ||
      payload.examConfigId ||
      payload.homeworkConfigId
  );
  const payloadFormUrl = normalizeExternalUrl(
    payload.formUrl || payload.examFormUrl || payload.homeworkFormUrl
  );
  const payloadLecturerId = normalizeString(
    payload.lecturerId ||
      payload.lecturer ||
      payload.lecturerUserId ||
      payload.ownerId ||
      payload.createdBy
  );
  const submittedAtValue = extractSubmittedAtValue(payload);
  const syncReference = extractSyncReference(payload);
  const hasLegacyResolverKeys = Boolean(payloadConfigId || payloadSheetId);

  if (!hasLegacyResolverKeys) {
    if (!payloadAssessmentType) {
      throw new AppError("assessmentType is required for master exam sync payload", 400);
    }

    if (!payloadFormUrl) {
      throw new AppError("formUrl is required for master exam sync payload", 400);
    }

    if (!payloadLecturerId || !mongoose.Types.ObjectId.isValid(payloadLecturerId)) {
      throw new AppError("lecturerId is required for master exam sync payload", 400);
    }

    if (!submittedAtValue) {
      throw new AppError("submittedAt is required for master exam sync payload", 400);
    }

    if (!syncReference) {
      throw new AppError(
        "submissionId (or eventId/responseId) is required for master exam sync payload",
        400
      );
    }

    const hasStudentIdentifier = Boolean(
      normalizeString(
        payload.studentIdentifier ||
          payload.studentEmail ||
          payload.email ||
          payload.respondentEmail
      )
    );
    if (!hasStudentIdentifier) {
      throw new AppError(
        "studentIdentifier or studentEmail is required for master exam sync payload",
        400
      );
    }
  }

  const configDoc = await resolveAssessmentConfigDocFromPayload(
    payload,
    payloadAssessmentType
  );
  if (!configDoc) {
    throw new AppError("No exam configuration found for this submission", 404);
  }

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
  const submittedAt = submittedAtValue ? new Date(submittedAtValue) : new Date();
  if (Number.isNaN(submittedAt.getTime())) {
    throw new AppError("submittedAt is invalid", 400);
  }
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
      googleSheetTabName: configDoc.googleSheetTabName || DEFAULT_MASTER_SHEET_RAW_TAB,
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
  DEFAULT_MASTER_SHEET_RAW_TAB,
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
