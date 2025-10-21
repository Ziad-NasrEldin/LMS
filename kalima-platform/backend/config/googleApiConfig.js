const { google } = require('googleapis');

const configureGoogleSheets = () => {
  try {
    // Create a new JWT auth client using environment variables
    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      // Replace escaped newlines with actual newlines in the private key
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );

    // Create and return the Google Sheets API client
    const sheets = google.sheets({ version: 'v4', auth });
    return sheets;
  } catch (error) {
    console.error('Error configuring Google Sheets API client:', error);
    throw error;
  }
};

module.exports = { configureGoogleSheets };