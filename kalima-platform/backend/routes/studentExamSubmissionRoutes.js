const express = require("express");
const router = express.Router();
const examSubmissionController = require("../controllers/studentExamSubmissionController");
const verifyJWT = require("../middleware/verifyJWT");
const authController = require("../controllers/authController");
const { configureGoogleSheets } = require("../config/googleApiConfig");

// Protect all routes
router.use(verifyJWT);

// Routes for students
router.get(
  "/my-submissions", 
  authController.verifyRoles("Student", "Admin", "SubAdmin", "Moderator"),
  examSubmissionController.getMyExamSubmissions
);

router.post(
  "/verify/:lectureId", 
  authController.verifyRoles("Student", "Admin", "SubAdmin", "Moderator"),
  examSubmissionController.verifyExamSubmission
);

// Routes for lecturers/assistants and administrators
router.get(
  "/lecture/:lectureId", 
  authController.verifyRoles("Lecturer", "Assistant", "Admin", "SubAdmin", "Moderator"),
  examSubmissionController.getLectureSubmissions
);

// Test route for Google Sheets API connection
router.get(
  "/test-sheets-connection/:sheetId",
  authController.verifyRoles("Admin", "SubAdmin", "Moderator"),
  async (req, res) => {
    try {
      const { sheetId } = req.params;
      
      if (!sheetId) {
        return res.status(400).json({
          status: "error",
          message: "Sheet ID is required"
        });
      }
      
      // Configure Google Sheets API client
      const sheets = configureGoogleSheets();
      
      // Get basic spreadsheet info as a connection test
      const response = await sheets.spreadsheets.get({
        spreadsheetId: sheetId,
        fields: 'sheets.properties.title,properties.title'
      });
      
      return res.status(200).json({
        status: "success",
        message: "Google Sheets API connection successful",
        data: {
          spreadsheetTitle: response.data.properties.title,
          sheets: response.data.sheets.map(sheet => sheet.properties.title)
        }
      });
    } catch (error) {
      console.error("Google Sheets API test error:", error);
      return res.status(500).json({
        status: "error",
        message: "Google Sheets API connection failed",
        error: error.message
      });
    }
  }
);

module.exports = router;