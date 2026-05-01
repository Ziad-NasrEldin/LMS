const { google } = require('googleapis');

const READONLY_SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const READWRITE_SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const configureGoogleSheets = ({ readOnly = true } = {}) => {
  try {
    const clientEmail = String(process.env.GOOGLE_CLIENT_EMAIL || "").trim();
    const privateKey = String(process.env.GOOGLE_PRIVATE_KEY || "").trim();

    if (!clientEmail || !privateKey) {
      throw new Error(
        "Google Sheets service account credentials are not configured"
      );
    }

    // Create a new JWT auth client using environment variables
    const auth = new google.auth.JWT(
      clientEmail,
      null,
      // Replace escaped newlines with actual newlines in the private key
      privateKey.replace(/\\n/g, '\n'),
      readOnly ? READONLY_SCOPES : READWRITE_SCOPES
    );

    // Create and return the Google Sheets API client
    const sheets = google.sheets({ version: 'v4', auth });
    return sheets;
  } catch (error) {
    console.error('Error configuring Google Sheets API client:', error);
    throw error;
  }
};

module.exports = {
  configureGoogleSheets,
  READONLY_SCOPES,
  READWRITE_SCOPES,
};
