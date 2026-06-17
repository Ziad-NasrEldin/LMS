const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const StudentExamSubmission = require("../models/studentExamSubmissionModel");
const LecturerExamConfig = require("../models/ExamConfigModel");
const googleApiConfig = require("../config/googleApiConfig");
const {
  ensureAssessmentSheetTab,
  isLegacyFormResponsesTab,
  listSpreadsheetTabs,
  normalizeSheetTabName,
} = require("./assessmentSheetTabs");
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

const normalizeString = (value) => String(value ?? "").trim();

const normalizeAssessmentType = (value) => {
  const normalized = normalizeString(value).toLowerCase();
  if (normalized === "exam") return "exam";
  if (normalized === "homework") return "homework";
  return null;
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
    return { score: rawScore, maxScore: null };
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
    maxScore: null,
  };
};

const calculateThresholdComparableScore = (score, maxScore) => {
  if (!Number.isFinite(score)) return null;

  if (Number.isFinite(maxScore) && maxScore > 0) {
    return (score / maxScore) * 100;
  }

  return score;
};

const compareRowsByRecency = (left, right) => {
  if (right.submittedAt.getTime() !== left.submittedAt.getTime()) {
    return right.submittedAt - left.submittedAt;
  }

  return right.sourceRowNumber - left.sourceRowNumber;
};

const compareRowsByBestPassingAttempt = (left, right) => {
  const comparableDiff =
    (right.thresholdComparableScore ?? Number.NEGATIVE_INFINITY) -
    (left.thresholdComparableScore ?? Number.NEGATIVE_INFINITY);
  if (comparableDiff !== 0) {
    return comparableDiff;
  }

  const rawScoreDiff =
    (right.score ?? Number.NEGATIVE_INFINITY) - (left.score ?? Number.NEGATIVE_INFINITY);
  if (rawScoreDiff !== 0) {
    return rawScoreDiff;
  }

  return compareRowsByRecency(left, right);
};

const selectRelevantSubmissionRow = (rows, passingThreshold) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  const normalizedThreshold = Number(passingThreshold);
  if (Number.isFinite(normalizedThreshold)) {
    const passingRows = rows.filter(
      (row) =>
        Number.isFinite(row.thresholdComparableScore) &&
        row.thresholdComparableScore >= normalizedThreshold
    );

    if (passingRows.length > 0) {
      return [...passingRows].sort(compareRowsByBestPassingAttempt)[0];
    }
  }

  return [...rows].sort(compareRowsByRecency)[0];
};

const toComparableLower = (value) => normalizeString(value).toLowerCase();

const isMissingRangeError = (error) =>
  String(error?.message || "").toLowerCase().includes("unable to parse range");

const buildSheetTabCandidates = (configuredTabName, fallbackSheetTabName, fallbackSheetTabNames = []) => {
  const candidates = [
    normalizeSheetTabName(configuredTabName),
    normalizeSheetTabName(fallbackSheetTabName),
    ...(Array.isArray(fallbackSheetTabNames) ? fallbackSheetTabNames.map(normalizeSheetTabName) : []),
  ];

  return [...new Set(candidates.filter(Boolean))];
};

const buildTabLookupSet = (tabNames = []) =>
  new Set(tabNames.map(normalizeSheetTabName).filter(Boolean));

const detectDynamicFormResponseTabs = async (sheets, sheetId, existingTabNames = []) => {
  try {
    const existingTabs = buildTabLookupSet(existingTabNames);
    const spreadsheetTabs = await listSpreadsheetTabs({ sheets, sheetId });

    return spreadsheetTabs
      .filter((tab) => isLegacyFormResponsesTab(tab.title) && !existingTabs.has(tab.title))
      .map((tab) => tab.title);
  } catch (error) {
    return [];
  }
};

const buildOrderedSheetTabCandidates = async ({ sheets, sheetId, configuredCandidates }) => {
  const normalizedConfiguredCandidates = [
    ...new Set(configuredCandidates.map(normalizeSheetTabName).filter(Boolean)),
  ];
  const spreadsheetTabs = await listSpreadsheetTabs({ sheets, sheetId }).catch(() => []);
  const discoveredTitles = spreadsheetTabs.map((tab) => tab.title);
  const discoveredFormResponseTabs = await detectDynamicFormResponseTabs(
    sheets,
    sheetId,
    normalizedConfiguredCandidates
  );
  const existingTitles = buildTabLookupSet(normalizedConfiguredCandidates);

  const maybeRawTab = discoveredTitles.find(
    (title) => title === DEFAULT_MASTER_SHEET_RAW_TAB && !existingTitles.has(title)
  );
  if (maybeRawTab) {
    normalizedConfiguredCandidates.push(maybeRawTab);
    existingTitles.add(maybeRawTab);
  }

  for (const title of discoveredFormResponseTabs) {
    if (!existingTitles.has(title)) {
      normalizedConfiguredCandidates.push(title);
      existingTitles.add(title);
    }
  }

  for (const title of LEGACY_FORM_RESPONSES_TABS) {
    const normalizedTitle = normalizeSheetTabName(title);
    if (normalizedTitle && !existingTitles.has(normalizedTitle)) {
      normalizedConfiguredCandidates.push(normalizedTitle);
      existingTitles.add(normalizedTitle);
    }
  }

  return normalizedConfiguredCandidates;
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

  const sheets = googleApiConfig.configureGoogleSheets();
  const allSheetTabCandidates = await buildOrderedSheetTabCandidates({
    sheets,
    sheetId,
    configuredCandidates: sheetTabCandidates,
  });

  if (allSheetTabCandidates.length === 0) {
    return { found: false, error: "No candidate sheet tabs were found" };
  }

  let lastError = null;

  for (const sheetTabName of allSheetTabCandidates) {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: sheetTabName,
        valueRenderOption: "FORMATTED_VALUE",
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
              thresholdComparableScore: calculateThresholdComparableScore(
                parsedScore.score,
                parsedScore.maxScore
              ),
              submittedAt,
              sourceRowNumber: Number.isFinite(sourceRowNumber)
                ? sourceRowNumber
                : rowIndex + 2,
            };
          })
          .filter(Boolean);

        const selectedRow = selectRelevantSubmissionRow(
          filteredRows,
          options.passingThreshold
        );
        if (!selectedRow) {
          lastError = `No submission found in '${sheetTabName}' for the provided student`;
          continue;
        }

        return {
          found: true,
          score: selectedRow.score,
          maxScore: selectedRow.maxScore,
          studentRow: selectedRow.row,
          fetchTime: new Date().toISOString(),
          sheetTabName,
          usedLegacyTabName: isLegacyFormResponsesTab(sheetTabName),
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
      const comparableEmail = toComparableLower(studentEmail);
      const studentRows = dataRows
        .map((row, rowIndex) => ({ row, rowIndex }))
        .filter(({ row }) => {
          const rowIdentifier = toComparableLower(row[identifierColIndex]);
          return Boolean(rowIdentifier) && (
            rowIdentifier === comparableIdentifier ||
            (Boolean(comparableEmail) && rowIdentifier === comparableEmail)
          );
        });

      if (studentRows.length === 0) {
        lastError = `No submission found for student with identifier: ${studentIdentifier}`;
        continue;
      }

      const parsedRows = studentRows
        .map(({ row, rowIndex }) => {
          const parsedScore = parseSubmissionScore(row[scoreColIndex]);
          if (!parsedScore) return null;

          const submittedAt =
            parseDateValue(
              submittedAtIndex === -1 ? row[0] : row[submittedAtIndex]
            ) || new Date(0);

          return {
            row,
            score: parsedScore.score,
            maxScore: parsedScore.maxScore,
            thresholdComparableScore: calculateThresholdComparableScore(
              parsedScore.score,
              parsedScore.maxScore
            ),
            submittedAt,
            sourceRowNumber: rowIndex + 2,
          };
        })
        .filter(Boolean);

      const selectedRow = selectRelevantSubmissionRow(
        parsedRows,
        options.passingThreshold
      );
      if (!selectedRow) {
        lastError = `Invalid score format for student: ${studentIdentifier}`;
        continue;
      }

      return {
        found: true,
        score: selectedRow.score,
        maxScore: selectedRow.maxScore,
        studentRow: selectedRow.row,
        fetchTime: new Date().toISOString(),
        sheetTabName,
        usedLegacyTabName: isLegacyFormResponsesTab(sheetTabName),
      };
    } catch (error) {
      if (isMissingRangeError(error)) {
        lastError = lastError || `Configured tab '${sheetTabName}' was not found in this spreadsheet`;
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

const processAssessmentSubmissionFromSheet = async ({
  lecture,
  lectureId,
  studentId,
  studentIdentifier,
  studentEmail = null,
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

  if (existingSubmission?.passed && existingSubmission.maxScore != null) {
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
  const desiredTabName = normalizeSheetTabName(configDoc.googleSheetTabName);

  const configuredTabName =
    normalizeSheetTabName(configDoc.googleSheetTabName) || DEFAULT_MASTER_SHEET_RAW_TAB;
  let sheetResult = await getExamResultsFromSheet({
    sheetId: configDoc.googleSheetId,
    sheetTabName: configuredTabName,
    studentIdentifier,
    studentEmail: studentEmail || (normalizeString(studentIdentifier).includes("@")
      ? studentIdentifier
      : null),
    studentIdentifierColumn: MASTER_ASSESSMENT_IDENTIFIER_COLUMN,
    scoreColumn: MASTER_ASSESSMENT_SCORE_COLUMN,
    assessmentType,
    lecturerId: lecture?.createdBy || configDoc.lecturer,
    formUrl: configDoc.formUrl,
    passingThreshold,
  });

  if (!sheetResult.found) {
    if (existingSubmission) {
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
        submittedAt: existingSubmission.submittedAt || new Date(),
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

  if (desiredTabName && sheetResult.sheetTabName !== desiredTabName) {
    const writableSheets = googleApiConfig.configureGoogleSheets({ readOnly: false });
    const claimedConfigs = await LecturerExamConfig.find({
      googleSheetId: configDoc.googleSheetId,
      _id: { $ne: configDoc._id },
    })
      .select("googleSheetTabName")
      .lean();

    const ensuredTab = await ensureAssessmentSheetTab({
      sheets: writableSheets,
      sheetId: configDoc.googleSheetId,
      desiredTabName,
      currentTabName: sheetResult.sheetTabName,
      claimedTabNames: claimedConfigs.map((config) => config.googleSheetTabName),
      preferNewestUnclaimed: false,
      createIfMissing: false,
    });

    if (ensuredTab.action !== "missing") {
      sheetResult.sheetTabName = ensuredTab.title;
      if (configDoc.googleSheetTabName !== ensuredTab.title) {
        configDoc.googleSheetTabName = ensuredTab.title;
        await configDoc.save();
      }
    }
  }

  const thresholdComparableScore = calculateThresholdComparableScore(
    sheetResult.score,
    sheetResult.maxScore
  );
  const passed =
    Number.isFinite(thresholdComparableScore) &&
    thresholdComparableScore >= passingThreshold;
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
  calculateThresholdComparableScore,
  getExamResultsFromSheet,
  resolveAssessmentConfigDoc,
  upsertAssessmentSubmission,
  processAssessmentSubmissionFromSheet,
};
