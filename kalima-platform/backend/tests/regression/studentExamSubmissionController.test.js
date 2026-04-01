const test = require("node:test");
const assert = require("node:assert/strict");

const studentExamSubmissionController = require("../../controllers/studentExamSubmissionController");
const examSubmissionSync = require("../../utils/examSubmissionSync");
const Lecture = require("../../models/LectureModel");

const originalLectureFindById = Lecture.findById;
const originalProcessAssessmentSubmissionFromSheet =
  examSubmissionSync.processAssessmentSubmissionFromSheet;
const originalVerifyExamSyncWebhook = examSubmissionSync.verifyExamSyncWebhook;
const originalProcessAssessmentSubmissionFromWebhook =
  examSubmissionSync.processAssessmentSubmissionFromWebhook;

const makeLectureQuery = (lectureDoc) => ({
  populate() {
    return this;
  },
  then(resolve, reject) {
    return Promise.resolve(lectureDoc).then(resolve, reject);
  },
});

const restoreModelMethods = () => {
  Lecture.findById = originalLectureFindById;
  examSubmissionSync.processAssessmentSubmissionFromSheet =
    originalProcessAssessmentSubmissionFromSheet;
  examSubmissionSync.verifyExamSyncWebhook = originalVerifyExamSyncWebhook;
  examSubmissionSync.processAssessmentSubmissionFromWebhook =
    originalProcessAssessmentSubmissionFromWebhook;
};

const runVerifyExamSubmission = ({
  lectureDoc,
  processResultByType = {},
  studentEmail = "student@example.com",
}) => {
  Lecture.findById = () => makeLectureQuery(lectureDoc);
  examSubmissionSync.processAssessmentSubmissionFromSheet = async ({
    assessmentType,
  }) => processResultByType[assessmentType] || null;

  return new Promise((resolve, reject) => {
    const req = {
      params: { lectureId: "lecture-1" },
      user: { _id: "student-1", email: studentEmail },
    };

    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        resolve({ statusCode: this.statusCode, payload });
        return this;
      },
    };

    const next = (err) => {
      if (err) {
        reject(err);
      }
    };

    studentExamSubmissionController.verifyExamSubmission(req, res, next);
  });
};

const runSyncExamSubmission = ({ body, rawBody, headers, processResult }) => {
  const verifyCalls = [];
  const processCalls = [];

  examSubmissionSync.verifyExamSyncWebhook = (params) => {
    verifyCalls.push(params);
    return true;
  };

  examSubmissionSync.processAssessmentSubmissionFromWebhook = async (params) => {
    processCalls.push(params);
    return processResult;
  };

  return new Promise((resolve, reject) => {
    const req = {
      body,
      rawBody,
      headers,
      get(name) {
        return headers[String(name).toLowerCase()];
      },
    };

    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        resolve({ statusCode: this.statusCode, payload, verifyCalls, processCalls });
        return this;
      },
    };

    studentExamSubmissionController.syncExamSubmission(req, res, reject);
  });
};

test("verifyExamSubmission returns consistent already_passed payload for exam and homework", async () => {
  try {
    const result = await runVerifyExamSubmission({
      lectureDoc: {
        _id: "lecture-1",
        requiresExam: true,
        requiresHomework: true,
        examConfig: {
          _id: "exam-config-1",
          formUrl: "https://forms.google.com/exam",
          defaultPassingThreshold: 60,
        },
        homeworkConfig: {
          _id: "homework-config-1",
          formUrl: "https://forms.google.com/homework",
          defaultPassingThreshold: 60,
        },
      },
      processResultByType: {
        exam: {
          required: true,
          status: "already_passed",
          passed: true,
          submission: { _id: "exam-sub-1", passed: true },
          requiredScore: 70,
          url: "https://forms.google.com/exam",
          examUrl: "https://forms.google.com/exam",
          syncStatus: "synced",
          syncSource: "sheet",
        },
        homework: {
          required: true,
          status: "already_passed",
          passed: true,
          submission: { _id: "homework-sub-1", passed: true },
          requiredScore: 65,
          url: "https://forms.google.com/homework",
          homeworkUrl: "https://forms.google.com/homework",
          syncStatus: "synced",
          syncSource: "sheet",
        },
      },
    });

    assert.equal(result.statusCode, 200);
    assert.equal(result.payload.status, "success");
    assert.equal(result.payload.data.passed, true);
    assert.equal(result.payload.data.exam.status, "already_passed");
    assert.equal(result.payload.data.exam.passed, true);
    assert.equal(result.payload.data.exam.examUrl, "https://forms.google.com/exam");
    assert.equal(result.payload.data.homework.status, "already_passed");
    assert.equal(result.payload.data.homework.passed, true);
    assert.equal(
      result.payload.data.homework.homeworkUrl,
      "https://forms.google.com/homework"
    );
  } finally {
    restoreModelMethods();
  }
});

test("syncExamSubmission verifies signature and returns webhook sync result", async () => {
  try {
    const rawPayload = {
      configId: "config-1",
      assessmentType: "exam",
      studentIdentifier: "student@example.com",
      score: 8,
      maxScore: 10,
    };
    const rawBody = JSON.stringify(rawPayload);
    const result = await runSyncExamSubmission({
      body: rawPayload,
      rawBody,
      headers: {
        "x-exam-sync-timestamp": new Date().toISOString(),
        "x-exam-sync-signature": "signature",
      },
      processResult: {
        status: "passed",
        assessmentType: "exam",
        passed: true,
        summary: {
          totalLectures: 1,
          passed: 1,
          failed: 0,
          pending: 0,
          alreadyPassed: 0,
        },
        results: [
          {
            required: true,
            status: "passed",
            passed: true,
            submission: { _id: "submission-1", passed: true },
            requiredScore: 70,
            url: "https://forms.google.com/exam",
            examUrl: "https://forms.google.com/exam",
            syncStatus: "synced",
            syncSource: "webhook",
          },
        ],
      },
    });

    assert.equal(result.statusCode, 200);
    assert.equal(result.payload.status, "success");
    assert.equal(result.payload.data.status, "passed");
    assert.equal(result.payload.data.passed, true);
    assert.equal(result.verifyCalls.length, 1);
    assert.equal(result.verifyCalls[0].rawBody, rawBody);
    assert.equal(result.processCalls.length, 1);
    assert.equal(result.processCalls[0].payload.assessmentType, "exam");
  } finally {
    restoreModelMethods();
  }
});
