const { google } = require('googleapis');

const READONLY_SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const READWRITE_SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const FORMS_READONLY_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/forms.body.readonly',
  'https://www.googleapis.com/auth/forms.responses.readonly',
];

const normalizeGooglePrivateKey = (rawValue) => {
  let normalized = String(rawValue || "").trim();

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1);
  }

  return normalized
    .replace(/\\r/g, '')
    .replace(/\\n/g, '\n')
    .trim();
};

const createGoogleJwt = (scopes) => {
  const clientEmail = String(process.env.GOOGLE_CLIENT_EMAIL || "").trim();
  const privateKey = normalizeGooglePrivateKey(process.env.GOOGLE_PRIVATE_KEY);

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Google service account credentials are not configured"
    );
  }

  return new google.auth.JWT(
    clientEmail,
    null,
    privateKey.replace(/\\n/g, '\n'),
    scopes
  );
};

const configureGoogleSheets = ({ readOnly = true } = {}) => {
  try {
    const auth = createGoogleJwt(readOnly ? READONLY_SCOPES : READWRITE_SCOPES);

    // Create and return the Google Sheets API client
    const sheets = google.sheets({ version: 'v4', auth });
    return sheets;
  } catch (error) {
    console.error('Error configuring Google Sheets API client:', error);
    throw error;
  }
};

const configureGoogleForms = () => {
  try {
    const auth = createGoogleJwt(FORMS_READONLY_SCOPES);
    return google.forms({ version: 'v1', auth });
  } catch (error) {
    console.error('Error configuring Google Forms API client:', error);
    throw error;
  }
};

module.exports = {
  createGoogleJwt,
  configureGoogleSheets,
  configureGoogleForms,
  normalizeGooglePrivateKey,
  READONLY_SCOPES,
  READWRITE_SCOPES,
  FORMS_READONLY_SCOPES,
};
