const MASTER_SHEET_ENV_KEYS = [
  "MASTER_ASSESSMENT_SHEET",
  "MASTER_ASSESSMENT_SHEET_LINK",
  "MASTER_ASSESSMENT_SHEET_ID",
  "MASTER_EXAM_SHEET_ID",
  "EXAM_MASTER_SHEET_ID",
];

const DEFAULT_IDENTIFIER_COLUMN = "Email Address";
const DEFAULT_SCORE_COLUMN = "Score";
const DEFAULT_MASTER_RAW_TAB = "RAW_SUBMISSIONS";

const normalizeString = (value) => String(value ?? "").trim();

const extractGoogleSheetId = (value) => {
  const normalizedValue = normalizeString(value);
  if (!normalizedValue) return null;

  if (/^[a-zA-Z0-9-_]{20,}$/.test(normalizedValue)) {
    return normalizedValue;
  }

  try {
    const parsedUrl = new URL(normalizedValue);
    const pathMatch = parsedUrl.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (pathMatch?.[1]) {
      return pathMatch[1];
    }

    const idQuery = parsedUrl.searchParams.get("id");
    if (idQuery && /^[a-zA-Z0-9-_]{20,}$/.test(idQuery)) {
      return idQuery;
    }
  } catch (_error) {
    return null;
  }

  return null;
};

const resolveMasterSheetId = () => {
  for (const envKey of MASTER_SHEET_ENV_KEYS) {
    const rawValue = process.env[envKey];
    const resolvedId = extractGoogleSheetId(rawValue);
    if (resolvedId) {
      return resolvedId;
    }
  }

  return null;
};

const MASTER_ASSESSMENT_SHEET_ID = resolveMasterSheetId();

const MASTER_ASSESSMENT_IDENTIFIER_COLUMN =
  normalizeString(process.env.MASTER_ASSESSMENT_IDENTIFIER_COLUMN) ||
  DEFAULT_IDENTIFIER_COLUMN;

const MASTER_ASSESSMENT_SCORE_COLUMN =
  normalizeString(process.env.MASTER_ASSESSMENT_SCORE_COLUMN) ||
  DEFAULT_SCORE_COLUMN;

const MASTER_ASSESSMENT_RAW_TAB =
  normalizeString(process.env.MASTER_ASSESSMENT_RAW_TAB) ||
  DEFAULT_MASTER_RAW_TAB;

module.exports = {
  DEFAULT_IDENTIFIER_COLUMN,
  DEFAULT_SCORE_COLUMN,
  DEFAULT_MASTER_RAW_TAB,
  MASTER_SHEET_ENV_KEYS,
  MASTER_ASSESSMENT_SHEET_ID,
  MASTER_ASSESSMENT_IDENTIFIER_COLUMN,
  MASTER_ASSESSMENT_SCORE_COLUMN,
  MASTER_ASSESSMENT_RAW_TAB,
  extractGoogleSheetId,
};
