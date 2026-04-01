const test = require("node:test");
const assert = require("node:assert/strict");

const studentExamSubmissionController = require("../../controllers/studentExamSubmissionController");
const examSubmissionSync = require("../../utils/examSubmissionSync");
const Lecture = require("../../models/LectureModel");

const originalLectureFindById = Lecture.findById;
const originalProcessAssessmentSubmissionFromSheet =
  examSubmissionSync.processAssessmentSubmissionFromSheet;

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
