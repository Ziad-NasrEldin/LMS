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

test("getExamResultsFromSheet falls back to the Google Forms response tab", async () => {
  try {
    const calls = [];
    googleApiConfig.configureGoogleSheets = () => ({
      spreadsheets: {
        values: {
          get: async ({ range }) => {
            calls.push(range);

            if (range === "Form_Responses") {
              return {
                data: {
                  values: [
                    ["Timestamp", "Email Address", "Untitled Question", "Score", "Column 4"],
                    ["4/1/2026 4:54:29", "student@example.com", "Option 1", "10 / 10", "Option 1"],
                  ],
                },
              };
            }

            throw new Error(`Unable to parse range: ${range}`);
          },
        },
      },
    });

    const result = await examSubmissionSync.getExamResultsFromSheet({
      sheetId: "master-sheet-id",
      sheetTabName: "test 2-exam",
      studentIdentifier: "student@example.com",
      studentEmail: "student@example.com",
      assessmentType: "exam",
      lecturerId: "65f5aaee1e35cd6cf4899ee1",
      formUrl: "https://docs.google.com/forms/d/test-form/viewform",
    });

    assert.equal(result.found, true);
    assert.equal(result.score, 10);
    assert.equal(result.maxScore, 10);
    assert.equal(result.sheetTabName, "Form_Responses");
    assert.deepEqual(calls.slice(0, 3), ["test 2-exam", "RAW_SUBMISSIONS", "Form_Responses"]);
  } finally {
    restorePatches();
  }
});

test("getExamResultsFromSheet falls back to numbered Google Forms tabs", async () => {
  try {
    const calls = [];
    googleApiConfig.configureGoogleSheets = () => ({
      spreadsheets: {
        values: {
          get: async ({ range }) => {
            calls.push(range);

            if (range === "Form Responses 3") {
              return {
                data: {
                  values: [
                    ["Timestamp", "Email Address", "Untitled Question", "Score", "Column 4"],
                    ["4/1/2026 5:14:29", "student@example.com", "Option 1", "8 / 10", "Option 1"],
                  ],
                },
              };
            }

            throw new Error(`Unable to parse range: ${range}`);
          },
        },
      },
    });

    const result = await examSubmissionSync.getExamResultsFromSheet({
      sheetId: "master-sheet-id",
      sheetTabName: "test 2-exam",
      studentIdentifier: "student@example.com",
      studentEmail: "student@example.com",
      assessmentType: "exam",
      lecturerId: "65f5aaee1e35cd6cf4899ee1",
      formUrl: "https://docs.google.com/forms/d/test-form/viewform",
    });

    assert.equal(result.found, true);
    assert.equal(result.score, 8);
    assert.equal(result.maxScore, 10);
    assert.equal(result.sheetTabName, "Form Responses 3");
    assert.ok(calls.includes("Form Responses 3"));
  } finally {
    restorePatches();
  }
});

test("getExamResultsFromSheet discovers high-numbered Form Responses tabs from metadata", async () => {
  try {
    const calls = [];
    googleApiConfig.configureGoogleSheets = () => ({
      spreadsheets: {
        get: async () => ({
          data: {
            sheets: [
              { properties: { title: "RAW_SUBMISSIONS", index: 0 } },
              { properties: { title: "Form Responses 27", index: 1 } },
            ],
          },
        }),
        values: {
          get: async ({ range }) => {
            calls.push(range);

            if (range === "Form Responses 27") {
              return {
                data: {
                  values: [
                    ["Timestamp", "Email Address", "Untitled Question", "Score", "Column 4"],
                    ["4/1/2026 5:34:29", "student@example.com", "Option 1", "7 / 10", "Option 1"],
                  ],
                },
              };
            }

            throw new Error(`Unable to parse range: ${range}`);
          },
        },
      },
    });

    const result = await examSubmissionSync.getExamResultsFromSheet({
      sheetId: "master-sheet-id",
      sheetTabName: "test 2-exam",
      studentIdentifier: "student@example.com",
      studentEmail: "student@example.com",
      assessmentType: "exam",
      lecturerId: "65f5aaee1e35cd6cf4899ee1",
      formUrl: "https://docs.google.com/forms/d/test-form/viewform",
    });

    assert.equal(result.found, true);
    assert.equal(result.score, 7);
    assert.equal(result.maxScore, 10);
    assert.equal(result.sheetTabName, "Form Responses 27");
    assert.ok(calls.includes("Form Responses 27"));
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
    assert.match(result.error, /was not found in this spreadsheet/);
  } finally {
    restorePatches();
  }
});

test("calculateThresholdComparableScore treats scored forms as percentages when maxScore is present", () => {
  const normalizedScore = examSubmissionSync.calculateThresholdComparableScore(5, 10);
  assert.equal(normalizedScore, 50);

  const rawScore = examSubmissionSync.calculateThresholdComparableScore(75, null);
  assert.equal(rawScore, 75);
});

test("getExamResultsFromSheet prefers an older passing attempt over a newer failing attempt when threshold is provided", async () => {
  try {
    googleApiConfig.configureGoogleSheets = () => ({
      spreadsheets: {
        values: {
          get: async ({ range }) => {
            assert.equal(range, "Form_Responses");
            return {
              data: {
                values: [
                  ["Timestamp", "Email Address", "Untitled Question", "Score", "Column 4"],
                  ["4/14/2026 1:13:28", "student@example.com", "Option 2", "5 / 10", "Option 2"],
                  ["4/14/2026 1:16:29", "student@example.com", "Option 1", "0 / 10", "Option 2"],
                ],
              },
            };
          },
        },
      },
    });

    const result = await examSubmissionSync.getExamResultsFromSheet({
      sheetId: "master-sheet-id",
      sheetTabName: "Form_Responses",
      studentIdentifier: "student@example.com",
      studentEmail: "student@example.com",
      passingThreshold: 50,
    });

    assert.equal(result.found, true);
    assert.equal(result.score, 5);
    assert.equal(result.maxScore, 10);
    assert.equal(result.sheetTabName, "Form_Responses");
  } finally {
    restorePatches();
  }
});
