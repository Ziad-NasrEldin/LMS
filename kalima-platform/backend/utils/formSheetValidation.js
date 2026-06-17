const googleApiConfig = require("../config/googleApiConfig");
const AppError = require("./appError");
const { getUnclaimedFormResponseTabs, listSpreadsheetTabs } = require("./assessmentSheetTabs");

const extractGoogleFormId = (formUrl) => {
  try {
    const parsedUrl = new URL(String(formUrl || "").trim());
    const pathMatch = parsedUrl.pathname.match(/\/forms\/d\/(?:e\/)?([^/]+)/i);
    return pathMatch?.[1] || null;
  } catch (_error) {
    return null;
  }
};

const isGoogleFormsShortUrl = (formUrl) => {
  try {
    const parsedUrl = new URL(String(formUrl || "").trim());
    return parsedUrl.hostname.toLowerCase() === "forms.gle";
  } catch (_error) {
    return false;
  }
};

const resolveGoogleFormsShortUrl = async (formUrl) => {
  if (!isGoogleFormsShortUrl(formUrl) || typeof fetch !== "function") {
    return formUrl;
  }

  const requestOptions = {
    method: "GET",
    redirect: "manual",
  };

  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    requestOptions.signal = AbortSignal.timeout(5000);
  }

  try {
    const response = await fetch(formUrl, requestOptions);
    const redirectLocation = response?.headers?.get?.("location");
    if (redirectLocation) {
      return new URL(redirectLocation, formUrl).toString();
    }
    return response?.url || formUrl;
  } catch (error) {
    console.warn("Unable to resolve Google Forms short URL before validation:", error?.message || error);
    return formUrl;
  }
};

const normalizeDateValue = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeHeader = (value) => String(value ?? "").trim().toLowerCase();

const findHeaderIndex = (headers, target) => {
  const normalizedTarget = normalizeHeader(target);
  return headers.findIndex((header) => normalizeHeader(header) === normalizedTarget);
};

const buildSkippedValidationResult = (formId) => ({
  formId,
  linkedSheetId: null,
  responderUri: null,
  responseSamples: [],
  validationSkipped: true,
});

const assertPublishedFormValidationAvailable = (publishedFormDetails, assessmentLabel = "Assessment") => {
  if (!publishedFormDetails?.validationSkipped) {
    return;
  }

  const normalizedLabel = String(assessmentLabel || "assessment").trim().toLowerCase();
  throw new AppError(
    `Cannot bind ${normalizedLabel} form responses because Google Forms validation is unavailable. Enable the Google Forms API and ensure the service account can read the form before linking it to a lecture.`,
    500
  );
};

const getPublishedFormDetails = async ({ formUrl, expectedSheetId }) => {
  const resolvedFormUrl = await resolveGoogleFormsShortUrl(formUrl);
  const formId = extractGoogleFormId(resolvedFormUrl);
  if (!formId) {
    throw new AppError("Unable to extract a Google Form ID from the provided URL", 400);
  }

  let forms;
  try {
    forms = googleApiConfig.configureGoogleForms();
  } catch (error) {
    console.warn("Skipping Google Form inspection because Google Forms client could not be configured:", error?.message || error);
    return buildSkippedValidationResult(formId);
  }

  let form;
  try {
    const response = await forms.forms.get({ formId });
    form = response.data;
  } catch (error) {
    console.warn("Skipping Google Form inspection because form metadata could not be read:", error?.message || error);
    return buildSkippedValidationResult(formId);
  }

  if (!form?.linkedSheetId) {
    throw new AppError(
      "This Google Form is not linked to a response spreadsheet yet. Link it to the master sheet before creating the lecture.",
      400
    );
  }

  if (expectedSheetId && form.linkedSheetId !== expectedSheetId) {
    throw new AppError(
      "This Google Form is linked to a different spreadsheet. Link it to the master assessment sheet before creating the lecture.",
      400
    );
  }

  let responseSamples = [];
  try {
    const responseList = await forms.forms.responses.list({
      formId,
      pageSize: 10,
    });
    responseSamples = Array.isArray(responseList?.data?.responses)
      ? responseList.data.responses
      : [];
  } catch (_error) {
    responseSamples = [];
  }

  return {
    formId,
    linkedSheetId: form.linkedSheetId,
    responderUri: form.responderUri || null,
    responseSamples,
  };
};

const detectMatchingResponseTab = async ({
  sheetId,
  claimedTabNames,
  responseSamples,
}) => {
  if (!Array.isArray(responseSamples) || responseSamples.length === 0) {
    return null;
  }

  const sheets = googleApiConfig.configureGoogleSheets();
  const spreadsheetTabs = await listSpreadsheetTabs({ sheets, sheetId });
  const candidateTabs = getUnclaimedFormResponseTabs({
    tabs: spreadsheetTabs,
    claimedTabNames,
  });

  const normalizedSamples = responseSamples
    .map((response) => ({
      email: String(response.respondentEmail || "").trim().toLowerCase(),
      submittedAt:
        normalizeDateValue(response.lastSubmittedTime) ||
        normalizeDateValue(response.createTime),
      score:
        typeof response.totalScore === "number" && Number.isFinite(response.totalScore)
          ? response.totalScore
          : null,
    }))
    .filter((sample) => sample.email || sample.submittedAt || sample.score !== null);

  if (normalizedSamples.length === 0) {
    return null;
  }

  for (const tab of candidateTabs) {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: tab.title,
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "FORMATTED_STRING",
      });

      const rows = response?.data?.values || [];
      if (rows.length < 2) continue;

      const headers = rows[0].map((value) => String(value ?? "").trim());
      const emailIndex = findHeaderIndex(headers, "Email Address");
      const timestampIndex = findHeaderIndex(headers, "Timestamp");
      const scoreIndex = findHeaderIndex(headers, "Score");

      const matched = rows.slice(1).some((row) => {
        return normalizedSamples.some((sample) => {
          const rowEmail = String(row[emailIndex] || "").trim().toLowerCase();
          const rowTimestamp = normalizeDateValue(
            timestampIndex === -1 ? null : row[timestampIndex]
          );
          const rawScore = scoreIndex === -1 ? null : row[scoreIndex];
          const numericRowScore = Number(
            typeof rawScore === "string" ? rawScore.split("/")[0].trim() : rawScore
          );

          const emailMatches = sample.email && rowEmail && sample.email === rowEmail;
          const timeMatches =
            sample.submittedAt &&
            rowTimestamp &&
            Math.abs(sample.submittedAt.getTime() - rowTimestamp.getTime()) < 60_000;
          const scoreMatches =
            sample.score !== null && Number.isFinite(numericRowScore) && sample.score === numericRowScore;

          return (emailMatches && timeMatches) || (emailMatches && scoreMatches);
        });
      });

      if (matched) {
        return tab.title;
      }
    } catch (_error) {
      // Ignore unreadable candidate tabs and keep scanning.
    }
  }

  return null;
};

module.exports = {
  extractGoogleFormId,
  getPublishedFormDetails,
  assertPublishedFormValidationAvailable,
  detectMatchingResponseTab,
};
