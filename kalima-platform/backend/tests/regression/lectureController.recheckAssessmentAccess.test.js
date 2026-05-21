const test = require("node:test");
const assert = require("node:assert/strict");

const lectureController = require("../../controllers/lectureController");
const Lecture = require("../../models/LectureModel");
const Parent = require("../../models/parentModel");
const Student = require("../../models/studentModel");
const examSubmissionSync = require("../../utils/examSubmissionSync");

const originalLectureFindById = Lecture.findById;
const originalParentFindById = Parent.findById;
const originalStudentFindById = Student.findById;
const originalProcessAssessmentSubmissionFromSheet =
  examSubmissionSync.processAssessmentSubmissionFromSheet;

const makeQuery = (doc) => ({
  populate() {
    return this;
  },
  select() {
    return this;
  },
  lean() {
    return Promise.resolve(doc);
  },
  then(resolve, reject) {
    return Promise.resolve(doc).then(resolve, reject);
  },
});

const restoreMethods = () => {
  Lecture.findById = originalLectureFindById;
  Parent.findById = originalParentFindById;
  Student.findById = originalStudentFindById;
  examSubmissionSync.processAssessmentSubmissionFromSheet =
    originalProcessAssessmentSubmissionFromSheet;
};

const runRecheck = ({
  lectureDoc,
  user = {
    _id: "507f191e810c19729de860ad",
    role: "Student",
    email: "student@example.com",
    name: "Student Name",
  },
  parentDoc = null,
  studentDoc = {
    email: "student@example.com",
    phoneNumber: "+201000000000",
    sequencedId: 42,
  },
  syncImpl = async () => null,
}) => {
  Lecture.findById = () => makeQuery(lectureDoc);
  Parent.findById = () => ({ lean: async () => parentDoc });
  Student.findById = () => ({
    select() {
      return this;
    },
    lean: async () => studentDoc,
  });
  examSubmissionSync.processAssessmentSubmissionFromSheet = syncImpl;

  return new Promise((resolve, reject) => {
    const req = {
      params: { lectureId: lectureDoc?._id || "507f191e810c19729de860aa" },
      user,
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

    lectureController.recheckAssessmentAccess(req, res, reject);
  });
};

test("recheckAssessmentAccess uses child identifier and manual sync source for parent-driven recheck", async () => {
  const capturedCalls = [];

  try {
    const result = await runRecheck({
      lectureDoc: {
        _id: "507f191e810c19729de860aa",
        requiresExam: true,
        requiresHomework: false,
        examConfig: {
          _id: "507f191e810c19729de860ab",
          formUrl: "https://forms.google.com/exam",
        },
      },
      parentDoc: { children: ["507f191e810c19729de860ac"] },
      studentDoc: {
        email: "child@example.com",
        phoneNumber: "+201000000000",
        sequencedId: 42,
      },
      user: {
        _id: "507f191e810c19729de860ad",
        role: "Parent",
        email: "parent@example.com",
        name: "Parent Name",
      },
      syncImpl: async ({ studentIdentifier, syncSource, syncReference }) => {
        capturedCalls.push({ studentIdentifier, syncSource, syncReference });
        return {
          passed: true,
          status: "passed",
          submission: { score: 8, maxScore: 10 },
          requiredScore: 60,
          examUrl: "https://forms.google.com/exam",
        };
      },
    });

    assert.equal(result.statusCode, 200);
    assert.deepEqual(capturedCalls, [
      {
        studentIdentifier: "child@example.com",
        syncSource: "manual",
        syncReference: "manual-recheck",
      },
    ]);
    assert.equal(result.payload.data.results.exam.passed, true);
  } finally {
    restoreMethods();
  }
});

test("recheckAssessmentAccess returns pending for missing required exam submission", async () => {
  const capturedSources = [];

  try {
    const result = await runRecheck({
      lectureDoc: {
        _id: "507f191e810c19729de860aa",
        requiresExam: true,
        requiresHomework: false,
        examConfig: { formUrl: "https://forms.google.com/exam" },
      },
      syncImpl: async ({ syncSource, syncReference }) => {
        capturedSources.push({ syncSource, syncReference });
        return {
          passed: false,
          status: "pending",
          submission: { syncStatus: "pending", score: null, maxScore: null },
          requiredScore: 60,
          examUrl: "https://forms.google.com/exam",
        };
      },
    });

    assert.equal(result.statusCode, 200);
    assert.equal(result.payload.data.hasAccess, false);
    assert.equal(result.payload.data.results.exam.status, "pending");
    assert.equal(result.payload.data.results.exam.passed, false);
    assert.deepEqual(capturedSources, [
      { syncSource: "manual", syncReference: "manual-recheck" },
    ]);
  } finally {
    restoreMethods();
  }
});

test("recheckAssessmentAccess keeps access restricted when required exam sync errors", async () => {
  try {
    const result = await runRecheck({
      lectureDoc: {
        _id: "507f191e810c19729de860aa",
        requiresExam: true,
        requiresHomework: false,
        examConfig: { formUrl: "https://forms.google.com/exam" },
      },
      syncImpl: async () => {
        throw new Error("Sheet sync failed");
      },
    });

    assert.equal(result.statusCode, 200);
    assert.equal(result.payload.data.hasAccess, false);
    assert.equal(result.payload.data.results.exam.passed, false);
    assert.equal(result.payload.data.results.exam.status, "failed");
    assert.equal(result.payload.data.results.exam.error, "Sheet sync failed");
  } finally {
    restoreMethods();
  }
});

test("recheckAssessmentAccess keeps access restricted when required exam is not found", async () => {
  try {
    const result = await runRecheck({
      lectureDoc: {
        _id: "507f191e810c19729de860aa",
        requiresExam: true,
        requiresHomework: false,
        examConfig: { formUrl: "https://forms.google.com/exam" },
      },
      syncImpl: async () => ({
        passed: false,
        status: "not_found",
        submission: null,
        requiredScore: 60,
        examUrl: "https://forms.google.com/exam",
      }),
    });

    assert.equal(result.statusCode, 200);
    assert.equal(result.payload.data.hasAccess, false);
    assert.equal(result.payload.data.results.exam.status, "not_found");
    assert.equal(result.payload.data.results.exam.url, "https://forms.google.com/exam");
  } finally {
    restoreMethods();
  }
});

test("recheckAssessmentAccess keeps lecture restricted when exam passed but homework failed", async () => {
  try {
    const result = await runRecheck({
      lectureDoc: {
        _id: "507f191e810c19729de860aa",
        requiresExam: true,
        requiresHomework: true,
        examConfig: { formUrl: "https://forms.google.com/exam" },
        homeworkConfig: { formUrl: "https://forms.google.com/homework" },
      },
      syncImpl: async ({ assessmentType }) => {
        if (assessmentType === "exam") {
          return {
            passed: true,
            status: "passed",
            submission: { score: 9, maxScore: 10 },
            requiredScore: 6,
            examUrl: "https://forms.google.com/exam",
          };
        }

        return {
          passed: false,
          status: "failed",
          submission: { score: 4, maxScore: 10 },
          requiredScore: 6,
          homeworkUrl: "https://forms.google.com/homework",
        };
      },
    });

    assert.equal(result.statusCode, 200);
    assert.equal(result.payload.data.hasAccess, false);
    assert.equal(result.payload.data.results.exam.passed, true);
    assert.equal(result.payload.data.results.homework.passed, false);
    assert.equal(result.payload.data.results.homework.status, "failed");
    assert.equal(result.payload.data.results.homework.requiredScore, 6);
  } finally {
    restoreMethods();
  }
});
