/**
 * Google Forms -> Master Sheet -> Backend Webhook template.
 *
 * Required per-form constants:
 * - LECTURER_ID
 * - ASSESSMENT_TYPE ("exam" | "homework")
 * - FORM_URL
 * - MASTER_SPREADSHEET_ID
 * - WEBHOOK_URL
 * - WEBHOOK_SECRET
 */

const MASTER_SPREADSHEET_ID = "REPLACE_WITH_MASTER_SPREADSHEET_ID";
const RAW_TAB = "RAW_SUBMISSIONS";
const ERROR_TAB = "SYNC_ERRORS";
const WEBHOOK_URL = "https://your-domain.com/api/v1/exam-submissions/sync";
const WEBHOOK_SECRET = "REPLACE_WITH_WEBHOOK_SECRET";

const LECTURER_ID = "REPLACE_WITH_LECTURER_ID";
const LECTURER_NAME = "";
const ASSESSMENT_TYPE = "exam";
const FORM_URL = "https://docs.google.com/forms/d/REPLACE/edit";

const RAW_HEADERS = [
  "eventId",
  "submittedAt",
  "assessmentType",
  "formUrl",
  "lecturerId",
  "lecturerName",
  "lectureId",
  "lectureName",
  "studentIdentifier",
  "studentEmail",
  "score",
  "maxScore",
  "passingThreshold",
  "passedComputed",
  "submissionId",
  "sourceRowNumber",
  "sourceSheetId",
  "webhookStatus",
  "webhookCode",
  "webhookMessage",
  "syncedAt",
];

const ERROR_HEADERS = [
  "loggedAt",
  "eventId",
  "submissionId",
  "assessmentType",
  "lecturerId",
  "lectureId",
  "studentIdentifier",
  "studentEmail",
  "errorCode",
  "errorMessage",
  "attempts",
  "status",
  "rawRowNumber",
  "payloadJson",
  "lastAttemptAt",
];

const LECTURER_HEADERS = [
  "submittedAt",
  "assessmentType",
  "lectureId",
  "lectureName",
  "studentIdentifier",
  "studentEmail",
  "score",
  "maxScore",
  "passingThreshold",
  "passedComputed",
  "submissionId",
  "webhookStatus",
  "webhookCode",
  "webhookMessage",
  "syncedAt",
  "rawRowNumber",
  "formUrl",
];

function onFormSubmit(e) {
  const submission = buildSubmissionRecord_(e);
  const spreadsheet = SpreadsheetApp.openById(MASTER_SPREADSHEET_ID);

  ensureSheetStructure_(spreadsheet);
  const rawSheet = spreadsheet.getSheetByName(RAW_TAB);
  const lecturerSheet = getOrCreateLecturerSheet_(spreadsheet, submission.lecturerId, submission.lecturerName);
  const errorSheet = spreadsheet.getSheetByName(ERROR_TAB);

  const rawRowNumber = appendRawSubmission_(rawSheet, submission);
  submission.rawRowNumber = rawRowNumber;

  const webhookResult = sendWebhook_(submission);
  updateRawWebhookStatus_(rawSheet, rawRowNumber, webhookResult);
  upsertLecturerSubmission_(lecturerSheet, submission, webhookResult);

  if (!webhookResult.ok) {
    appendSyncError_(errorSheet, submission, webhookResult);
    ensureRetryTrigger_();
  }
}

function retryFailedSyncs() {
  const spreadsheet = SpreadsheetApp.openById(MASTER_SPREADSHEET_ID);
  ensureSheetStructure_(spreadsheet);

  const rawSheet = spreadsheet.getSheetByName(RAW_TAB);
  const errorSheet = spreadsheet.getSheetByName(ERROR_TAB);
  const data = errorSheet.getDataRange().getValues();
  if (data.length <= 1) return;

  const nowIso = new Date().toISOString();
  for (let rowIndex = 1; rowIndex < data.length; rowIndex += 1) {
    const row = data[rowIndex];
    const status = String(row[11] || "");
    if (status === "resolved" || status === "dead") continue;

    const attempts = Number(row[10] || 0);
    if (attempts >= 10) {
      errorSheet.getRange(rowIndex + 1, 12).setValue("dead");
      continue;
    }

    const payloadJson = row[13];
    let payload;
    try {
      payload = JSON.parse(payloadJson);
    } catch (_error) {
      errorSheet.getRange(rowIndex + 1, 12).setValue("dead");
      continue;
    }

    const webhookResult = sendWebhook_(payload);
    errorSheet.getRange(rowIndex + 1, 11).setValue(attempts + 1);
    errorSheet.getRange(rowIndex + 1, 15).setValue(nowIso);

    if (webhookResult.ok) {
      errorSheet.getRange(rowIndex + 1, 12).setValue("resolved");
      const rawRowNumber = Number(row[12] || 0);
      if (rawRowNumber > 1) {
        updateRawWebhookStatus_(rawSheet, rawRowNumber, webhookResult);
      }
      continue;
    }

    errorSheet.getRange(rowIndex + 1, 9).setValue(String(webhookResult.code || ""));
    errorSheet.getRange(rowIndex + 1, 10).setValue(String(webhookResult.message || "Retry failed"));
    errorSheet.getRange(rowIndex + 1, 12).setValue("retrying");
  }
}

function setupMasterSheet() {
  const spreadsheet = SpreadsheetApp.openById(MASTER_SPREADSHEET_ID);
  ensureSheetStructure_(spreadsheet);
}

function ensureSheetStructure_(spreadsheet) {
  const rawSheet = getOrCreateSheetWithHeaders_(spreadsheet, RAW_TAB, RAW_HEADERS);
  const errorSheet = getOrCreateSheetWithHeaders_(spreadsheet, ERROR_TAB, ERROR_HEADERS);

  rawSheet.setFrozenRows(1);
  errorSheet.setFrozenRows(1);
  ensureFilter_(rawSheet);
  ensureFilter_(errorSheet);
}

function getOrCreateLecturerSheet_(spreadsheet, lecturerId, lecturerName) {
  const safeId = String(lecturerId || "unknown").replace(/[^a-zA-Z0-9_-]/g, "_");
  let tabName = `LECTURER_${safeId}`;

  if (tabName.length > 99) {
    tabName = tabName.slice(0, 99);
  }

  const sheet = getOrCreateSheetWithHeaders_(spreadsheet, tabName, LECTURER_HEADERS);
  sheet.setFrozenRows(1);
  ensureFilter_(sheet);

  if (lecturerName) {
    sheet.getRange("A1").setNote(`Lecturer: ${lecturerName}`);
  }

  return sheet;
}

function getOrCreateSheetWithHeaders_(spreadsheet, sheetName, headers) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const needsHeaders = headers.some((header, index) => String(firstRow[index] || "") !== header);

  if (needsHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return sheet;
}

function ensureFilter_(sheet) {
  const lastColumn = sheet.getLastColumn() || 1;
  const lastRow = Math.max(sheet.getLastRow(), 1);
  const range = sheet.getRange(1, 1, lastRow, lastColumn);

  const existingFilter = sheet.getFilter();
  if (existingFilter) {
    existingFilter.remove();
  }
  range.createFilter();
}

function appendRawSubmission_(rawSheet, submission) {
  const nextRow = rawSheet.getLastRow() + 1;
  const row = [
    submission.eventId,
    submission.submittedAt,
    submission.assessmentType,
    submission.formUrl,
    submission.lecturerId,
    submission.lecturerName,
    submission.lectureId,
    submission.lectureName,
    submission.studentIdentifier,
    submission.studentEmail,
    submission.score,
    submission.maxScore,
    submission.passingThreshold,
    submission.passedComputed,
    submission.submissionId,
    submission.sourceRowNumber,
    submission.sourceSheetId,
    "pending",
    "",
    "",
    "",
  ];

  rawSheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
  return nextRow;
}

function updateRawWebhookStatus_(rawSheet, rawRowNumber, webhookResult) {
  if (!rawRowNumber || rawRowNumber < 2) return;

  rawSheet.getRange(rawRowNumber, 18).setValue(webhookResult.ok ? "synced" : "failed");
  rawSheet.getRange(rawRowNumber, 19).setValue(String(webhookResult.code || ""));
  rawSheet.getRange(rawRowNumber, 20).setValue(String(webhookResult.message || ""));
  rawSheet.getRange(rawRowNumber, 21).setValue(
    webhookResult.ok ? new Date().toISOString() : ""
  );
}

function upsertLecturerSubmission_(lecturerSheet, submission, webhookResult) {
  const submissionId = String(submission.submissionId || "");
  const existingRow = findLecturerRowBySubmissionId_(lecturerSheet, submissionId);

  const row = [
    submission.submittedAt,
    submission.assessmentType,
    submission.lectureId,
    submission.lectureName,
    submission.studentIdentifier,
    submission.studentEmail,
    submission.score,
    submission.maxScore,
    submission.passingThreshold,
    submission.passedComputed,
    submission.submissionId,
    webhookResult.ok ? "synced" : "failed",
    String(webhookResult.code || ""),
    String(webhookResult.message || ""),
    webhookResult.ok ? new Date().toISOString() : "",
    submission.rawRowNumber || "",
    submission.formUrl,
  ];

  if (existingRow > 1) {
    lecturerSheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
  } else {
    const nextRow = lecturerSheet.getLastRow() + 1;
    lecturerSheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
  }

  sortLecturerSheet_(lecturerSheet);
}

function findLecturerRowBySubmissionId_(lecturerSheet, submissionId) {
  if (!submissionId) return -1;
  const values = lecturerSheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i += 1) {
    if (String(values[i][10] || "") === submissionId) {
      return i + 1;
    }
  }
  return -1;
}

function sortLecturerSheet_(lecturerSheet) {
  const lastRow = lecturerSheet.getLastRow();
  const lastColumn = lecturerSheet.getLastColumn();
  if (lastRow <= 2) return;

  lecturerSheet
    .getRange(2, 1, lastRow - 1, lastColumn)
    .sort([{ column: 1, ascending: false }]);
}

function appendSyncError_(errorSheet, submission, webhookResult) {
  const nextRow = errorSheet.getLastRow() + 1;
  const row = [
    new Date().toISOString(),
    submission.eventId,
    submission.submissionId,
    submission.assessmentType,
    submission.lecturerId,
    submission.lectureId,
    submission.studentIdentifier,
    submission.studentEmail,
    String(webhookResult.code || ""),
    String(webhookResult.message || "Webhook sync failed"),
    1,
    "pending",
    submission.rawRowNumber || "",
    JSON.stringify(submission),
    new Date().toISOString(),
  ];

  errorSheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
}

function sendWebhook_(submission) {
  const payload = {
    eventId: submission.eventId,
    submissionId: submission.submissionId,
    submittedAt: submission.submittedAt,
    assessmentType: submission.assessmentType,
    formUrl: submission.formUrl,
    lecturerId: submission.lecturerId,
    lectureId: submission.lectureId || "",
    lectureName: submission.lectureName || "",
    studentIdentifier: submission.studentIdentifier,
    studentEmail: submission.studentEmail,
    score: submission.score,
    maxScore: submission.maxScore,
    passingThreshold: submission.passingThreshold,
    sourceRowNumber: submission.sourceRowNumber,
    sourceSheetId: submission.sourceSheetId,
  };

  const rawBody = JSON.stringify(payload);
  const timestamp = new Date().toISOString();
  const signature = Utilities.base64Encode(
    Utilities.computeHmacSha256Signature(`${timestamp}.${rawBody}`, WEBHOOK_SECRET)
  );

  try {
    const response = UrlFetchApp.fetch(WEBHOOK_URL, {
      method: "post",
      contentType: "application/json",
      payload: rawBody,
      muteHttpExceptions: true,
      headers: {
        "x-exam-sync-timestamp": timestamp,
        "x-exam-sync-signature": signature,
      },
    });

    const statusCode = response.getResponseCode();
    const bodyText = response.getContentText() || "";
    const ok = statusCode >= 200 && statusCode < 300;

    return {
      ok,
      code: statusCode,
      message: ok ? "Synced" : bodyText.slice(0, 1000),
    };
  } catch (error) {
    return {
      ok: false,
      code: 0,
      message: String(error && error.message ? error.message : "Unknown webhook error"),
    };
  }
}

function buildSubmissionRecord_(e) {
  const response = e && e.response ? e.response : null;
  const namedValues = e && e.namedValues ? e.namedValues : {};
  const responses = response ? response.getItemResponses() : [];
  const sourceRowNumber =
    e && e.range && e.range.getRow ? String(e.range.getRow()) : "";
  const sourceSheetId =
    e && e.source && e.source.getId ? String(e.source.getId()) : "";

  const submissionId = response && response.getId ? String(response.getId()) : Utilities.getUuid();
  const submittedAtDate =
    response && response.getTimestamp ? response.getTimestamp() : new Date();
  const submittedAtIso = new Date(submittedAtDate).toISOString();

  const studentEmail = normalizeValue_(
    getNamedValue_(namedValues, "Email Address") ||
      getNamedValue_(namedValues, "email") ||
      (response && response.getRespondentEmail ? response.getRespondentEmail() : "")
  );
  const studentIdentifier = normalizeValue_(
    getNamedValue_(namedValues, "studentIdentifier") ||
      getNamedValue_(namedValues, "Student ID") ||
      studentEmail
  );

  const scoreValue = normalizeNumericValue_(
    getNamedValue_(namedValues, "Score") || getNamedValue_(namedValues, "score")
  );
  const maxScoreValue = normalizeNumericValue_(
    getNamedValue_(namedValues, "Max Score") || getNamedValue_(namedValues, "maxScore")
  );
  const passingThresholdValue = normalizeNumericValue_(
    getNamedValue_(namedValues, "Passing Threshold") ||
      getNamedValue_(namedValues, "passingThreshold")
  );

  const lectureId = normalizeValue_(
    getNamedValue_(namedValues, "lectureId") || getNamedValue_(namedValues, "Lecture ID")
  );
  const lectureName = normalizeValue_(
    getNamedValue_(namedValues, "lectureName") || getNamedValue_(namedValues, "Lecture Name")
  );

  const passedComputed =
    Number.isFinite(scoreValue) && Number.isFinite(passingThresholdValue)
      ? scoreValue >= passingThresholdValue
      : "";

  return {
    eventId: Utilities.getUuid(),
    submittedAt: submittedAtIso,
    assessmentType: String(ASSESSMENT_TYPE || "exam").toLowerCase() === "homework" ? "homework" : "exam",
    formUrl: FORM_URL,
    lecturerId: LECTURER_ID,
    lecturerName: LECTURER_NAME || "",
    lectureId: lectureId || "",
    lectureName: lectureName || "",
    studentIdentifier: studentIdentifier || studentEmail || "",
    studentEmail: studentEmail || "",
    score: Number.isFinite(scoreValue) ? scoreValue : "",
    maxScore: Number.isFinite(maxScoreValue) ? maxScoreValue : "",
    passingThreshold: Number.isFinite(passingThresholdValue) ? passingThresholdValue : "",
    passedComputed,
    submissionId,
    sourceRowNumber,
    sourceSheetId: sourceSheetId || MASTER_SPREADSHEET_ID,
    namedValues,
    values: responses.map((item) => item.getResponse()),
  };
}

function ensureRetryTrigger_() {
  const triggers = ScriptApp.getProjectTriggers();
  const exists = triggers.some((trigger) => trigger.getHandlerFunction() === "retryFailedSyncs");
  if (exists) return;

  ScriptApp.newTrigger("retryFailedSyncs")
    .timeBased()
    .everyMinutes(5)
    .create();
}

function getNamedValue_(namedValues, key) {
  if (!namedValues || !key) return "";
  const value = namedValues[key];
  if (Array.isArray(value)) return value.length > 0 ? value[0] : "";
  return value || "";
}

function normalizeValue_(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function normalizeNumericValue_(value) {
  if (value === undefined || value === null || value === "") return NaN;
  const parsedValue = Number(String(value).replace(",", "."));
  return Number.isFinite(parsedValue) ? parsedValue : NaN;
}
