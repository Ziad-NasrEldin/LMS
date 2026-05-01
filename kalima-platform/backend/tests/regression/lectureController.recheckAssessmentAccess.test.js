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

test("recheckAssessmentAccess uses child identifier for parent-driven recheck", async () => {
  const capturedIdentifiers = [];

  try {
    Lecture.findById = () =>
      makeQuery({
        _id: "507f191e810c19729de860aa",
        requiresExam: true,
        requiresHomework: false,
        examConfig: {
          _id: "507f191e810c19729de860ab",
          formUrl: "https://forms.google.com/exam",
        },
      });
    Parent.findById = () => ({ lean: async () => ({ children: ["507f191e810c19729de860ac"] }) });
    Student.findById = () => ({
      select() {
        return this;
      },
      lean: async () => ({
        email: "child@example.com",
        phoneNumber: "+201000000000",
        sequencedId: 42,
      }),
    });
    examSubmissionSync.processAssessmentSubmissionFromSheet = async ({ studentIdentifier }) => {
      capturedIdentifiers.push(studentIdentifier);
      return {
        passed: true,
        status: "passed",
        submission: { score: 8, maxScore: 10 },
        requiredScore: 60,
        examUrl: "https://forms.google.com/exam",
      };
    };

    const result = await new Promise((resolve, reject) => {
      const req = {
        params: { lectureId: "507f191e810c19729de860aa" },
        user: {
          _id: "507f191e810c19729de860ad",
          role: "Parent",
          email: "parent@example.com",
          name: "Parent Name",
        },
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

    assert.equal(result.statusCode, 200);
    assert.deepEqual(capturedIdentifiers, ["child@example.com"]);
    assert.equal(result.payload.data.results.exam.passed, true);
  } finally {
    restoreMethods();
  }
});
