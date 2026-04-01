const test = require("node:test");
const assert = require("node:assert/strict");

const examSubmissionSync = require("../../utils/examSubmissionSync");
const googleApiConfig = require("../../config/googleApiConfig");

const originalConfigureGoogleSheets = googleApiConfig.configureGoogleSheets;

const restorePatches = () => {
  googleApiConfig.configureGoogleSheets = originalConfigureGoogleSheets;
};

test("getExamResultsFromSheet reads explicit tab and resolves latest matching row in RAW_SUBMISSIONS", async () => {
  try {
    googleApiConfig.configureGoogleSheets = () => ({
      spreadsheets: {
        values: {
          get: async ({ range }) => {
            assert.equal(range, "RAW_SUBMISSIONS");
            return {
              data: {
                values: [
                  [
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
                  ],
                  [
                    "evt-1",
                    "2026-04-01T09:00:00.000Z",
                    "exam",
                    "https://docs.google.com/forms/d/test-form/viewform",
                    "65f5aaee1e35cd6cf4899ee1",
                    "Dr. A",
                    "lecture-1",
                    "Lecture One",
                    "student@example.com",
                    "student@example.com",
                    "6",
                    "10",
                    "7",
                    "false",
                    "sub-1",
                    "11",
                    "sheet-1",
                    "synced",
                    "200",
                    "",
                    "2026-04-01T09:00:02.000Z",
                  ],
                  [
                    "evt-2",
                    "2026-04-01T10:00:00.000Z",
                    "exam",
                    "https://docs.google.com/forms/d/test-form/viewform",
                    "65f5aaee1e35cd6cf4899ee1",
                    "Dr. A",
                    "lecture-1",
                    "Lecture One",
                    "student@example.com",
                    "student@example.com",
                    "8",
                    "10",
                    "7",
                    "true",
                    "sub-2",
                    "12",
                    "sheet-1",
                    "synced",
                    "200",
                    "",
                    "2026-04-01T10:00:02.000Z",
                  ],
                ],
              },
            };
          },
        },
      },
    });

    const result = await examSubmissionSync.getExamResultsFromSheet({
      sheetId: "master-sheet-id",
      sheetTabName: "RAW_SUBMISSIONS",
      studentIdentifier: "student@example.com",
      studentEmail: "student@example.com",
      assessmentType: "exam",
      lecturerId: "65f5aaee1e35cd6cf4899ee1",
      formUrl: "https://docs.google.com/forms/d/test-form/viewform",
    });

    assert.equal(result.found, true);
    assert.equal(result.score, 8);
    assert.equal(result.maxScore, 10);
    assert.equal(result.sheetTabName, "RAW_SUBMISSIONS");
  } finally {
    restorePatches();
  }
});

test("getExamResultsFromSheet returns clean error when configured tab does not exist", async () => {
  try {
    googleApiConfig.configureGoogleSheets = () => ({
      spreadsheets: {
        values: {
          get: async () => {
            throw new Error("Unable to parse range: MissingTab");
          },
        },
      },
    });

    const result = await examSubmissionSync.getExamResultsFromSheet({
      sheetId: "master-sheet-id",
      sheetTabName: "LECTURE_BIOLOGY_EXAM",
      studentIdentifier: "student@example.com",
    });

    assert.equal(result.found, false);
    assert.equal(
      result.error,
      "Configured tab 'LECTURE_BIOLOGY_EXAM' was not found in this spreadsheet"
    );
  } finally {
    restorePatches();
  }
});
