const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

const examSubmissionSync = require("../../utils/examSubmissionSync");
const LecturerExamConfig = require("../../models/ExamConfigModel");
const googleApiConfig = require("../../config/googleApiConfig");

const { verifyExamSyncWebhook } = examSubmissionSync;

const originalFindOne = LecturerExamConfig.findOne;
const originalConfigureGoogleSheets = googleApiConfig.configureGoogleSheets;

const restorePatches = () => {
  LecturerExamConfig.findOne = originalFindOne;
  googleApiConfig.configureGoogleSheets = originalConfigureGoogleSheets;
};

test("verifyExamSyncWebhook accepts a correctly signed payload", () => {
  const secret = "test-secret";
  const timestamp = new Date().toISOString();
  const rawBody = JSON.stringify({
    configId: "config-1",
    assessmentType: "exam",
    studentIdentifier: "student@example.com",
    score: 9,
  });
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("base64");

  assert.equal(
    verifyExamSyncWebhook({
      rawBody,
      timestamp,
      signature,
      secret,
      maxSkewMs: 10000,
    }),
    true
  );
});

test("verifyExamSyncWebhook rejects an invalid signature", () => {
  assert.throws(
    () =>
      verifyExamSyncWebhook({
        rawBody: "{}",
        timestamp: new Date().toISOString(),
        signature: "invalid-signature",
        secret: "test-secret",
        maxSkewMs: 10000,
      }),
    (error) => {
      assert.equal(error.statusCode, 401);
      assert.equal(error.message, "Exam sync signature is invalid");
      return true;
    }
  );
});

test("resolveAssessmentConfigDocFromPayload prioritizes master key lookup (formUrl + lecturerId + assessmentType)", async () => {
  try {
    const lookupQueries = [];
    const expectedConfig = { _id: "config-master-1" };

    LecturerExamConfig.findOne = (query) => {
      lookupQueries.push(query);
      const shouldResolve =
        query.formUrl === "https://docs.google.com/forms/d/test-form/viewform" &&
        String(query.lecturer) === "65f5aaee1e35cd6cf4899ee1" &&
        query.type === "exam";

      return {
        sort: async () => (shouldResolve ? expectedConfig : null),
      };
    };

    const configDoc = await examSubmissionSync.resolveAssessmentConfigDocFromPayload(
      {
        formUrl: "https://docs.google.com/forms/d/test-form/viewform",
        lecturerId: "65f5aaee1e35cd6cf4899ee1",
        assessmentType: "exam",
      },
      "exam"
    );

    assert.equal(configDoc, expectedConfig);
    assert.equal(lookupQueries.length, 1);
    assert.equal(lookupQueries[0].formUrl, "https://docs.google.com/forms/d/test-form/viewform");
    assert.equal(String(lookupQueries[0].lecturer), "65f5aaee1e35cd6cf4899ee1");
    assert.equal(lookupQueries[0].type, "exam");
  } finally {
    restorePatches();
  }
});

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
      studentIdentifierColumn: "Email Address",
      scoreColumn: "Score",
    });

    assert.equal(result.found, true);
    assert.equal(result.score, 8);
    assert.equal(result.maxScore, 10);
    assert.equal(result.sheetTabName, "RAW_SUBMISSIONS");
  } finally {
    restorePatches();
  }
});

test("processAssessmentSubmissionFromWebhook enforces master payload lecturerId requirement", async () => {
  await assert.rejects(
    examSubmissionSync.processAssessmentSubmissionFromWebhook({
      payload: {
        assessmentType: "exam",
        formUrl: "https://docs.google.com/forms/d/test-form/viewform",
        submittedAt: "2026-04-01T10:00:00.000Z",
        submissionId: "sub-100",
        studentEmail: "student@example.com",
      },
    }),
    (error) => {
      assert.equal(error.statusCode, 400);
      assert.equal(error.message, "lecturerId is required for master exam sync payload");
      return true;
    }
  );
});
