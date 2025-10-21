const mongoose = require("mongoose");
const StudentExamSubmission = require("../models/studentExamSubmissionModel");
const LecturerExamConfig = require("../models/ExamConfigModel");
const Lecture = require("../models/LectureModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { configureGoogleSheets } = require("../config/googleApiConfig");

// Real Google Sheets API implementation to fetch exam results
const getExamResultsFromSheet = async (
  sheetId,
  studentIdentifier,
  studentIdentifierColumn,
  scoreColumn
) => {
  try {
    // Configure Google Sheets API client
    const sheets = configureGoogleSheets();

    // First, get sheet names from the spreadsheet
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: "sheets.properties.title",
    });

    if (!spreadsheet.data.sheets || spreadsheet.data.sheets.length === 0) {
      return { found: false, error: "No sheets found in the spreadsheet" };
    }

    // Get the first sheet's title (usually where form responses go)
    const sheetTitle = spreadsheet.data.sheets[0].properties.title;
    // Get all rows from the spreadsheet with cache busting to ensure fresh data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: sheetTitle, // Using the first sheet
      valueRenderOption: "UNFORMATTED_VALUE", // Get raw values, not formatted strings
      dateTimeRenderOption: "FORMATTED_STRING",
    });
    // If there's no data, return not found
    if (!response.data.values || response.data.values.length === 0) {
      return { found: false, error: "No data found in the spreadsheet" };
    }

    // Get headers (first row)
    const headers = response.data.values[0];

    // Find column indexes for the student identifier and score
    const identifierColIndex = headers.findIndex(
      (header) => header.toLowerCase() === studentIdentifierColumn.toLowerCase()
    );

    const scoreColIndex = headers.findIndex(
      (header) => header.toLowerCase() === scoreColumn.toLowerCase()
    );

    // If we can't find the required columns, return an error
    if (identifierColIndex === -1) {
      return {
        found: false,
        error: `Column '${studentIdentifierColumn}' not found`,
      };
    }

    if (scoreColIndex === -1) {
      return { found: false, error: `Column '${scoreColumn}' not found` };
    }

    // Find the row that matches the student identifier
    const dataRows = response.data.values.slice(1); // Skip header row

    // Filter all matching rows for this student
    const studentRows = dataRows.filter(
      (row) =>
        row[identifierColIndex] &&
        row[identifierColIndex].toLowerCase().trim() ===
          studentIdentifier.toLowerCase().trim()
    );

    // If there are multiple submissions, get the most recent one
    // Assuming the first column contains the timestamp
    let studentRow = null;
    if (studentRows.length > 0) {
      // Sort by timestamp (newest first) - assuming timestamp is in column 0
      studentRows.sort((a, b) => {
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);
        return dateB - dateA; // Newest first
      });

      studentRow = studentRows[0]; // Get the most recent submission
    }

    // If no matching row is found, return not found
    if (!studentRow) {
      return {
        found: false,
        error: `No submission found for student with identifier: ${studentIdentifier}`,
      };
    }
    // Get the score and parse it as a number
    const rawScore = studentRow[scoreColIndex];

    // Check if the score is in format "X/Y" (e.g. "9/9")
    let score, maxScore;

    if (typeof rawScore === "string" && rawScore.includes("/")) {
      // Score is in format X/Y
      const [scoreValue, maxScoreValue] = rawScore
        .split("/")
        .map((val) => parseFloat(val.trim()));

      if (!isNaN(scoreValue) && !isNaN(maxScoreValue)) {
        score = scoreValue;
        maxScore = maxScoreValue;
      } else {
        return {
          found: false,
          error: `Invalid score format for student: ${studentIdentifier}. Expected format X/Y.`,
        };
      }
    } else {
      // Score is a simple number
      score = parseFloat(rawScore);
      // If Google Forms doesn't provide max score, use the score as the max score if it's perfect
      maxScore = score;

      if (isNaN(score)) {
        return {
          found: false,
          error: `Invalid score format for student: ${studentIdentifier}`,
        };
      }
    }

    // All checks passed, return the student's score
    return {
      found: true,
      score: score,
      maxScore: maxScore, // Use the parsed max score
      studentRow: studentRow, // Include the full row for additional info if needed
      fetchTime: new Date().toISOString(), // Add timestamp to track when data was fetched
    };
  } catch (error) {
    console.error("Error fetching exam results from Google Sheet:", error);
    return {
      found: false,
      error: `Unable to fetch exam results: ${error.message}`,
    };
  }
};

exports.verifyExamSubmission = catchAsync(async (req, res, next) => {
  const { lectureId } = req.params;
  const studentId = req.user._id;

  // Find the lecture and populate both configs
  const lecture = await Lecture.findById(lectureId)
    .populate("examConfig")
    .populate("homeworkConfig");

  if (!lecture) {
    return next(new AppError("Lecture not found", 404));
  }

  // Check if lecture requires either exam or homework
  if (!lecture.requiresExam && !lecture.requiresHomework) {
    return next(
      new AppError("This lecture does not require any submissions", 400)
    );
  }

  // Get student identifier (email or ID)
  const studentIdentifier = req.user.email || req.user._id.toString();

  // Object to store results
  const results = {
    exam: null,
    homework: null,
    passed: false,
  };

  // Check exam if required
  if (lecture.requiresExam) {
    if (!lecture.examConfig) {
      return next(
        new AppError("Exam configuration not found for this lecture", 404)
      );
    }

    // Check if student has already passed the exam
    const existingExamSubmission = await StudentExamSubmission.findOne({
      student: studentId,
      lecture: lectureId,
      type: "exam",
      passed: true,
    });

    if (existingExamSubmission) {
      results.exam = {
        status: "already_passed",
        submission: existingExamSubmission,
      };
    } else {
      // Get exam config details
      const examConfig = await LecturerExamConfig.findById(
        lecture.examConfig._id
      );

      if (!examConfig) {
        return next(new AppError("Exam configuration not found", 404));
      }

      // Get results from Google Sheet
      const examResults = await getExamResultsFromSheet(
        examConfig.googleSheetId,
        studentIdentifier,
        examConfig.studentIdentifierColumn,
        examConfig.scoreColumn
      );

      if (!examResults.found) {
        results.exam = {
          status: "not_found",
          error:
            examResults.error || "No exam submission found for this student",
        };
      } else {
        // Determine passing threshold
        const passingThreshold =
          lecture.passingThreshold || examConfig.defaultPassingThreshold;
        const passed = examResults.score >= passingThreshold;

        // Create or update the exam submission record
        const submission = await StudentExamSubmission.findOneAndUpdate(
          {
            student: studentId,
            lecture: lectureId,
            type: "exam",
          },
          {
            type: "exam",
            score: examResults.score,
            maxScore: examResults.maxScore,
            passingThreshold: passingThreshold,
            passed: passed,
            submittedAt: new Date(),
            verifiedAt: new Date(),
            config: examConfig._id,
          },
          { new: true, upsert: true }
        );

        results.exam = {
          status: passed ? "passed" : "failed",
          submission,
          passed,
          requiredScore: passingThreshold,
          examUrl: examConfig.formUrl,
        };
      }
    }
  }

  // Check homework if required
  if (lecture.requiresHomework) {
    console.log("[Homework] Starting verification process");

    if (!lecture.homeworkConfig) {
      console.error("[Homework Error] Configuration missing but required");
      return next(
        new AppError("Homework configuration not found for this lecture", 404)
      );
    }

    // Get homework config details
    const homeworkConfig = await LecturerExamConfig.findById(
      lecture.homeworkConfig._id
    );

    if (!homeworkConfig) {
      console.error(
        `[Homework Error] Config ${lecture.homeworkConfig._id} not found`
      );
      return next(new AppError("Homework configuration not found", 404));
    }

    console.log(
      `[Homework Config] Using config ${homeworkConfig._id} (${homeworkConfig.name})`
    );

    // Check existing submission
    const existingHomeworkSubmission = await StudentExamSubmission.findOne({
      student: studentId,
      lecture: lectureId,
      type: "homework",
      passed: true,
    });

    if (existingHomeworkSubmission) {
      console.log("[Homework] Student already has passing submission");
      results.homework = {
        status: "already_passed",
        submission: existingHomeworkSubmission,
      };
    } else {
      console.log("[Homework] Checking Google Sheet for submissions...");

      // Get results from Google Sheet
      const homeworkResults = await getExamResultsFromSheet(
        homeworkConfig.googleSheetId,
        studentIdentifier,
        homeworkConfig.studentIdentifierColumn,
        homeworkConfig.scoreColumn
      );

      if (!homeworkResults.found) {
        console.warn(
          `[Homework] No submission found: ${homeworkResults.error}`
        );
        results.homework = {
          status: "not_found",
          error:
            homeworkResults.error ||
            "No homework submission found for this student",
        };
      } else {
        // Determine passing threshold (default to 0 if not set)
        const passingThreshold = lecture.homeworkPassingThreshold ?? 0;
        const passed = homeworkResults.score >= passingThreshold;

        console.log(
          `[Homework Result] Score: ${homeworkResults.score}/${homeworkResults.maxScore}, ` +
            `Threshold: ${passingThreshold}, Passed: ${passed}`
        );

        // Find and update or create homework submission
        const submission = await StudentExamSubmission.findOneAndUpdate(
          {
            student: studentId,
            lecture: lectureId,
            type: "homework",
          },
          {
            score: homeworkResults.score,
            maxScore: homeworkResults.maxScore,
            passingThreshold: passingThreshold,
            passed: passed,
            submittedAt: new Date(),
            verifiedAt: new Date(),
            config: homeworkConfig._id,
          },
          { new: true, upsert: true }
        );

        console.log(`[Homework] Saved submission: ${submission._id}`);

        results.homework = {
          status: passed ? "passed" : "failed",
          submission,
          passed,
          requiredScore: passingThreshold,
          homeworkUrl: homeworkConfig.formUrl,
        };
      }
    }
  } else {
    console.log("[Homework] Not required for this lecture");
  }

  // Determine overall pass status
  let overallPassed = true;

  if (lecture.requiresExam) {
    overallPassed =
      overallPassed &&
      (results.exam?.status === "passed" ||
        results.exam?.status === "already_passed");
  }

  if (lecture.requiresHomework) {
    overallPassed =
      overallPassed &&
      (results.homework?.status === "passed" ||
        results.homework?.status === "already_passed");
  }

  results.passed = overallPassed;

  res.status(200).json({
    status: "success",
    data: results,
  });
});

// Get a student's exam submissions
exports.getMyExamSubmissions = catchAsync(async (req, res, next) => {
  const studentId = req.user._id;

  const submissions = await StudentExamSubmission.find({ student: studentId })
    .populate({
      path: "lecture",
      select: "name subject requiresExam",
    })
    .sort({ submittedAt: -1 });

  res.status(200).json({
    status: "success",
    results: submissions.length,
    data: {
      submissions,
    },
  });
});

// Get all submissions for a specific lecture (for lecturers/assistants)
exports.getLectureSubmissions = catchAsync(async (req, res, next) => {
  const { lectureId } = req.params;

  // Find the lecture first to verify it exists and check permissions
  const lecture = await Lecture.findById(lectureId);

  if (!lecture) {
    return next(new AppError("Lecture not found", 404));
  }

  // Check if the user is the lecture creator or an admin/assistant
  const isCreator = lecture.createdBy.toString() === req.user._id.toString();
  const isAdmin = ["Admin", "SubAdmin", "Moderator"].includes(req.user.role);
  const isAssistant =
    req.user.role === "Assistant" &&
    req.user.assignedLecturer &&
    req.user.assignedLecturer.toString() === lecture.createdBy.toString();

  if (!isCreator && !isAdmin && !isAssistant) {
    return next(
      new AppError("You do not have permission to view these submissions", 403)
    );
  }

  // Get all submissions for this lecture
  const submissions = await StudentExamSubmission.find({ lecture: lectureId })
    .populate({
      path: "student",
      select: "name email",
    })
    .sort({ submittedAt: -1 });

  res.status(200).json({
    status: "success",
    results: submissions.length,
    data: {
      submissions,
    },
  });
});
