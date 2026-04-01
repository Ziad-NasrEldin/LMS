const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const StudentExamSubmission = require("../models/studentExamSubmissionModel");
const LecturerExamConfig = require("../models/ExamConfigModel");
const googleApiConfig = require("../config/googleApiConfig");
const {
  MASTER_ASSESSMENT_IDENTIFIER_COLUMN,
  MASTER_ASSESSMENT_SCORE_COLUMN,
  MASTER_ASSESSMENT_RAW_TAB,
} = require("../config/masterAssessmentConfig");
const {
  ASSESSMENT_MAP,
  resolvePassingThreshold,
  resolveAssessmentConfigUrl,
  resolveLegacyAssessmentUrl,
} = require("./lectureAccessUtils");

const DEFAULT_PASSING_THRESHOLD = 60;
const DEFAULT_MASTER_SHEET_RAW_TAB = MASTER_ASSESSMENT_RAW_TAB;
const buildLegacyFormResponsesTabs = (maxNumberedTabs = 20) => {
  const tabs = ["Form_Responses", "Form Responses"];

  for (let index = 1; index <= maxNumberedTabs; index += 1) {
    tabs.push(`Form Responses ${index}`);
  }

  return tabs;
};

const LEGACY_FORM_RESPONSES_TABS = buildLegacyFormResponsesTabs();
const FORM_RESPONSES_TAB_PATTERN = /^Form Responses(?: \d+)?$/i;
const FORM_RESPONSES_UNDERSCORE_TAB_PATTERN = /^Form_Responses(?: \d+)?$/i;

const normalizeString = (value) => String(value ?? "").trim();

const normalizeAssessmentType = (value) => {
  const normalized = normalizeString(value).toLowerCase();
  if (normalized === "exam") return "exam";
  if (normalized === "homework") return "homework";
  return null;
};

const normalizeSheetTabName = (value) => {
  const normalized = normalizeString(value);
  return normalized || null;
};

const normalizeHeader = (value) => normalizeString(value).toLowerCase();

const findHeaderIndex = (headers, targetHeader) => {
  const normalizedTarget = normalizeHeader(targetHeader);
  return headers.findIndex((header) => normalizeHeader(header) === normalizedTarget);
};

const parseDateValue = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return null;
  return parsedDate;
};

const parseSubmissionScore = (rawScore) => {
  if (rawScore === undefined || rawScore === null || rawScore === "") {
    return null;
  }

  if (typeof rawScore === "number" && Number.isFinite(rawScore)) {
    return { score: rawScore, maxScore: rawScore };
  }

  const rawText = normalizeString(rawScore);
  if (!rawText) return null;

  if (rawText.includes("/")) {
    const [scoreValue, maxScoreValue] = rawText
      .split("/")
      .map((part) => Number(part.trim()));

    if (Number.isFinite(scoreValue) && Number.isFinite(maxScoreValue)) {
      return { score: scoreValue, maxScore: maxScoreValue };
    }
    return null;
  }

  const parsedScore = Number(rawText);
  if (!Number.isFinite(parsedScore)) return null;

  return {
    score: parsedScore,
    maxScore: parsedScore,
  };
};

const toComparableLower = (value) => normalizeString(value).toLowerCase();

const isMissingRangeError = (error) =>
  String(error?.message || "").toLowerCase().includes("unable to parse range");

const buildSheetTabCandidates = (configuredTabName, fallbackSheetTabName, fallbackSheetTabNames = []) => {
  const candidates = [
    normalizeSheetTabName(configuredTabName),
    normalizeSheetTabName(fallbackSheetTabName),
    ...(Array.isArray(fallbackSheetTabNames) ? fallbackSheetTabNames.map(normalizeSheetTabName) : []),
    DEFAULT_MASTER_SHEET_RAW_TAB,
    ...LEGACY_FORM_RESPONSES_TABS,
  ];

  return [...new Set(candidates.filter(Boolean))];
};

const buildTabLookupSet = (tabNames = []) =>
  new Set(tabNames.map(normalizeSheetTabName).filter(Boolean));

const detectDynamicFormResponseTabs = async (sheets, sheetId, existingTabNames = []) => {
  if (!sheetId || typeof sheets?.spreadsheets?.get !== "function") {
    return [];
  }

  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: "sheets(properties(title,index))",
    });

    const existingTabs = buildTabLookupSet(existingTabNames);

    return (response?.data?.sheets || [])
      .map((sheetMeta) => {
        const title = normalizeSheetTabName(sheetMeta?.properties?.title);
        const index = Number(sheetMeta?.properties?.index);

        return {
          title,
          index: Number.isFinite(index) ? index : Number.MAX_SAFE_INTEGER,
        };
      })
      .filter(({ title }) => {
        if (!title || existingTabs.has(title)) return false;

        return (
          FORM_RESPONSES_TAB_PATTERN.test(title) ||
          FORM_RESPONSES_UNDERSCORE_TAB_PATTERN.test(title)
        );
      })
      .sort((left, right) => {
        if (left.index !== right.index) {
          return left.index - right.index;
        }
        return left.title.localeCompare(right.title);
      })
      .map(({ title }) => title);
  } catch (error) {
    return [];
  }
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
  const assessmentType = normalizeAssessmentType(options.assessmentType);
  const lecturerId = normalizeString(options.lecturerId);
  const formUrl = normalizeString(options.formUrl);
  const studentIdentifierColumn =
    normalizeString(options.studentIdentifierColumn) || MASTER_ASSESSMENT_IDENTIFIER_COLUMN;
  const scoreColumn =
    normalizeString(options.scoreColumn) || MASTER_ASSESSMENT_SCORE_COLUMN;
  const sheetTabCandidates = buildSheetTabCandidates(
    options.sheetTabName,
    options.fallbackSheetTabName,
    options.fallbackSheetTabNames,
  );

  if (!sheetId) {
    return { found: false, error: "Google Sheet ID is required" };
  }

  if (sheetTabCandidates.length === 0) {
    return { found: false, error: "Google Sheet tab name is required" };
  }

  const sheets = googleApiConfig.configureGoogleSheets();
  const dynamicFormResponseTabs = await detectDynamicFormResponseTabs(
    sheets,
    sheetId,
    sheetTabCandidates
  );
  const allSheetTabCandidates = [...sheetTabCandidates, ...dynamicFormResponseTabs];
  let lastError = null;

  for (const sheetTabName of allSheetTabCandidates) {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: sheetTabName,
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "FORMATTED_STRING",
      });

      const rows = response.data.values || [];
      if (rows.length === 0) {
        lastError = `No data found in '${sheetTabName}' tab`;
        continue;
      }

      const headers = rows[0].map((value) => normalizeString(value));
      const dataRows = rows.slice(1);

      const rawAssessmentIndex = findHeaderIndex(headers, "assessmentType");
      const rawFormUrlIndex = findHeaderIndex(headers, "formUrl");
      const rawLecturerIdIndex = findHeaderIndex(headers, "lecturerId");
      const rawStudentIdentifierIndex = findHeaderIndex(headers, "studentIdentifier");
      const rawStudentEmailIndex = findHeaderIndex(headers, "studentEmail");
      const rawScoreIndex = findHeaderIndex(headers, "score");
      const rawMaxScoreIndex = findHeaderIndex(headers, "maxScore");
      const rawSubmittedAtIndex = findHeaderIndex(headers, "submittedAt");
      const rawSourceRowNumberIndex = findHeaderIndex(headers, "sourceRowNumber");

      const hasMasterRawShape =
        rawAssessmentIndex !== -1 &&
        rawFormUrlIndex !== -1 &&
        rawLecturerIdIndex !== -1 &&
        rawScoreIndex !== -1 &&
        (rawStudentIdentifierIndex !== -1 || rawStudentEmailIndex !== -1);

      if (hasMasterRawShape) {
        const comparableIdentifier = toComparableLower(studentIdentifier);
        const comparableEmail = toComparableLower(studentEmail);
        const normalizedFormUrl = normalizeString(formUrl);

        const filteredRows = dataRows
          .map((row, rowIndex) => ({ row, rowIndex }))
          .filter(({ row }) => {
            if (assessmentType) {
              const rowType = normalizeAssessmentType(row[rawAssessmentIndex]);
              if (rowType !== assessmentType) return false;
            }
            if (lecturerId && normalizeString(row[rawLecturerIdIndex]) !== lecturerId) {
              return false;
            }

            if (normalizedFormUrl && normalizeString(row[rawFormUrlIndex]) !== normalizedFormUrl) {
              return false;
            }

            const rowIdentifier = toComparableLower(
              rawStudentIdentifierIndex === -1 ? null : row[rawStudentIdentifierIndex]
            );
            const rowEmail = toComparableLower(
              rawStudentEmailIndex === -1 ? null : row[rawStudentEmailIndex]
            );

            const matchesIdentifier =
              Boolean(comparableIdentifier) &&
              (rowIdentifier === comparableIdentifier || rowEmail === comparableIdentifier);
            const matchesEmail =
              Boolean(comparableEmail) &&
              (rowEmail === comparableEmail || rowIdentifier === comparableEmail);

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
          lastError = `No submission found in '${sheetTabName}' for the provided student`;
          continue;
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
      const submittedAtIndex = findHeaderIndex(headers, "submittedAt");

      if (identifierColIndex === -1) {
        lastError = `Column '${studentIdentifierColumn}' not found in '${sheetTabName}'`;
        continue;
      }

      if (scoreColIndex === -1) {
        lastError = `Column '${scoreColumn}' not found in '${sheetTabName}'`;
        continue;
      }

      const comparableIdentifier = toComparableLower(studentIdentifier);
      const studentRows = dataRows.filter((row) => {
        const rowIdentifier = toComparableLower(row[identifierColIndex]);
        return rowIdentifier && rowIdentifier === comparableIdentifier;
      });

      if (studentRows.length === 0) {
        lastError = `No submission found for student with identifier: ${studentIdentifier}`;
        continue;
      }

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

      const parsedScore = parseSubmissionScore(studentRows[0][scoreColIndex]);
      if (!parsedScore) {
        lastError = `Invalid score format for student: ${studentIdentifier}`;
        continue;
      }

      return {
        found: true,
        score: parsedScore.score,
        maxScore: parsedScore.maxScore,
        studentRow: studentRows[0],
        fetchTime: new Date().toISOString(),
        sheetTabName,
      };
    } catch (error) {
      if (isMissingRangeError(error)) {
        lastError = `Configured tab '${sheetTabName}' was not found in this spreadsheet`;
        continue;
      }

      lastError = `Unable to fetch exam results: ${error.message}`;
      continue;
    }
  }

  return {
    found: false,
    error: lastError || "No matching submission was found",
  };
};

const resolveAssessmentConfigDoc = async (lecture, assessmentType) => {
  const assessment = ASSESSMENT_MAP[assessmentType];
  if (!assessment) return null;

  const rawConfig = lecture?.[assessment.configField];
  if (!rawConfig) return null;

  if (rawConfig.googleSheetId) {
    return rawConfig;
  }

  const configId = rawConfig._id || rawConfig;
  if (!mongoose.Types.ObjectId.isValid(configId)) {
    return null;
  }

  return LecturerExamConfig.findById(configId);
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
}) =>
  StudentExamSubmission.findOneAndUpdate(
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
  if (!submission) return null;
  if (submission.passed) return "already_passed";
  if (submission.syncStatus === "pending") return "pending";
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

  const configuredTabName =
    normalizeSheetTabName(configDoc.googleSheetTabName) || DEFAULT_MASTER_SHEET_RAW_TAB;
  let sheetResult = await getExamResultsFromSheet({
    sheetId: configDoc.googleSheetId,
    sheetTabName: configuredTabName,
    studentIdentifier,
    studentEmail: normalizeString(studentIdentifier).includes("@")
      ? studentIdentifier
      : null,
    studentIdentifierColumn: MASTER_ASSESSMENT_IDENTIFIER_COLUMN,
    scoreColumn: MASTER_ASSESSMENT_SCORE_COLUMN,
    assessmentType,
    lecturerId: lecture?.createdBy || configDoc.lecturer,
    formUrl: configDoc.formUrl,
  });

  if (!sheetResult.found) {
    if (existingSubmission) {
      return buildAssessmentResult({
        assessmentType,
        submission: existingSubmission,
        status: getExistingSubmissionStatus(existingSubmission) || "failed",
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

module.exports = {
  DEFAULT_PASSING_THRESHOLD,
  DEFAULT_MASTER_SHEET_RAW_TAB,
  buildSheetTabCandidates,
  detectDynamicFormResponseTabs,
  normalizeAssessmentType,
  parseSubmissionScore,
  getExamResultsFromSheet,
  resolveAssessmentConfigDoc,
  upsertAssessmentSubmission,
  processAssessmentSubmissionFromSheet,
};
