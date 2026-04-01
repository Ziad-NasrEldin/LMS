/**
 * Google Apps Script template for Google Forms -> backend exam sync.
 *
 * Install this as an "On form submit" trigger on the Google Sheets response
 * spreadsheet, not as a post-submit redirect.
 *
 * Fill in SETTINGS before deploying:
 * - webhookUrl: backend endpoint /api/v1/exam-submissions/sync
 * - webhookSecret: shared secret that matches EXAM_SYNC_WEBHOOK_SECRET
 * - configId: optional LecturerExamConfig Mongo ID
 * - sheetId: optional spreadsheet ID; defaults to the active sheet ID
 * - assessmentType: "exam" or "homework"
 * - studentIdentifierColumn: the column that stores the student identifier
 * - scoreColumn: the score column name as it appears in the sheet
 * - maxScoreColumn: optional max-score column name
 */

const SETTINGS = {
  webhookUrl: "https://your-backend.example.com/api/v1/exam-submissions/sync",
  webhookSecret: "replace-with-a-long-random-secret",
  configId: "",
  sheetId: "",
  formUrl: "",
  assessmentType: "exam",
  studentIdentifierColumn: "Email Address",
  scoreColumn: "Score",
  maxScoreColumn: "Maximum points",
};

function onFormSubmit(e) {
  if (!SETTINGS.webhookUrl || !SETTINGS.webhookSecret) {
    throw new Error("Missing webhookUrl or webhookSecret in SETTINGS");
  }

  const payload = buildPayload_(e);
  const timestamp = new Date().toISOString();
  const body = JSON.stringify({
    ...payload,
    timestamp,
  });
  const signature = Utilities.base64Encode(
    Utilities.computeHmacSha256Signature(`${timestamp}.${body}`, SETTINGS.webhookSecret)
  );

  const response = UrlFetchApp.fetch(SETTINGS.webhookUrl, {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-exam-sync-timestamp": timestamp,
      "x-exam-sync-signature": signature,
    },
    payload: body,
    muteHttpExceptions: true,
  });

  console.log(
    "Exam sync response:",
    response.getResponseCode(),
    response.getContentText()
  );
}

function buildPayload_(e) {
  const namedValues = (e && e.namedValues) || {};
  const sheet = e && e.source ? e.source : null;
  const rowNumber = e && e.range ? e.range.getRow() : null;
  const sheetId = SETTINGS.sheetId || (sheet && sheet.getId ? sheet.getId() : "");
  const studentIdentifier = firstNamedValue_([
    SETTINGS.studentIdentifierColumn,
    "Email Address",
    "Email",
    "E-mail",
    "Student Email",
  ], namedValues);
  const studentEmail = firstNamedValue_(
    ["Email Address", "Email", "E-mail", "Student Email"],
    namedValues
  );
  const score = parseScore_(
    firstNamedValue_([SETTINGS.scoreColumn, "Score", "Grade", "Result"], namedValues)
  );
  const maxScore = parseScore_(
    firstNamedValue_([SETTINGS.maxScoreColumn, "Maximum points", "Max Score", "Total"], namedValues)
  );
  const submittedAt = firstNamedValue_(
    ["Timestamp", "Date", "Submission time"],
    namedValues
  );

  return {
    configId: SETTINGS.configId || null,
    sheetId: sheetId || null,
    formUrl: SETTINGS.formUrl || null,
    assessmentType: SETTINGS.assessmentType || "exam",
    studentIdentifier: studentIdentifier || studentEmail || null,
    studentEmail: studentEmail || null,
    respondentEmail: studentEmail || null,
    score: score !== null ? score : null,
    maxScore: maxScore !== null ? maxScore : null,
    submittedAt: submittedAt || null,
    responseId: rowNumber ? `${sheetId}:${rowNumber}` : null,
    rowNumber: rowNumber || null,
    namedValues: namedValues,
  };
}

function firstNamedValue_(candidates, namedValues) {
  const keys = Object.keys(namedValues || {});

  for (const candidate of candidates) {
    const normalizedCandidate = normalize_(candidate);

    for (const key of keys) {
      if (normalize_(key) === normalizedCandidate) {
        const rawValue = namedValues[key];
        if (Array.isArray(rawValue)) {
          return rawValue.length > 0 ? rawValue[0] : null;
        }
        return rawValue !== undefined && rawValue !== null ? rawValue : null;
      }
    }
  }

  return null;
}

function normalize_(value) {
  return String(value || "").trim().toLowerCase();
}

function parseScore_(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }

  const text = String(value).trim();
  if (!text) {
    return null;
  }

  if (text.includes("/")) {
    const parts = text.split("/");
    const score = Number(parts[0].trim());
    if (Number.isFinite(score)) {
      return score;
    }
  }

  const numericValue = Number(text);
  return Number.isFinite(numericValue) ? numericValue : null;
}
