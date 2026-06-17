const test = require("node:test");
const assert = require("node:assert/strict");

const lectureController = require("../../controllers/lectureController");
const Lecture = require("../../models/LectureModel");
const Container = require("../../models/containerModel");
const Attachment = require("../../models/attachmentModel");
const StudentLectureAccess = require("../../models/studentLectureAccessModel");
const StudentExamSubmission = require("../../models/studentExamSubmissionModel");
const Purchase = require("../../models/purchaseModel");

const originalLectureFindById = Lecture.findById;
const originalContainerFindOne = Container.findOne;
const originalContainerFindById = Container.findById;
const originalAttachmentFind = Attachment.find;
const originalStudentLectureAccessFindOne = StudentLectureAccess.findOne;
const originalStudentLectureAccessFindOneAndUpdate = StudentLectureAccess.findOneAndUpdate;
const originalStudentExamSubmissionFindOne = StudentExamSubmission.findOne;
const originalPurchaseFind = Purchase.find;

const makePopulatedDocQuery = (doc) => ({
  populate() {
    return this;
  },
  then(resolve, reject) {
    return Promise.resolve(doc).then(resolve, reject);
  },
});

const makeLeanQuery = (result) => ({
  lean() {
    return Promise.resolve(result);
  },
});

const makeHomeworkQuery = (result) => ({
  populate() {
    return this;
  },
  sort() {
    return this;
  },
  lean() {
    return Promise.resolve(result);
  },
});

const restoreModelMethods = () => {
  Lecture.findById = originalLectureFindById;
  Container.findOne = originalContainerFindOne;
  Container.findById = originalContainerFindById;
  Attachment.find = originalAttachmentFind;
  StudentLectureAccess.findOne = originalStudentLectureAccessFindOne;
  StudentLectureAccess.findOneAndUpdate = originalStudentLectureAccessFindOneAndUpdate;
  StudentExamSubmission.findOne = originalStudentExamSubmissionFindOne;
  Purchase.find = originalPurchaseFind;
};

test("loadLecturePage returns attachment-shaped homework submissions for privileged users", async () => {
  try {
    const lectureId = "507f1f77bcf86cd799439011";
    const lectureDoc = {
      _id: lectureId,
      name: "Lecture 1",
      requiresExam: false,
      requiresHomework: true,
      homeworkConfig: { formUrl: "https://forms.google.com/homework" },
      createdBy: { name: "Lecturer" },
      subject: { name: "Math" },
      level: { name: "Level 1" },
    };

    const categorizedAttachments = [
      {
        _id: "attachment-pdf-1",
        type: "pdfsandimages",
        fileName: "slides.pdf",
        filePath: "https://cdn.example.com/slides.pdf",
        fileType: "application/pdf",
      },
    ];

    const homeworkAttachments = [
      {
        _id: "attachment-homework-1",
        type: "homeworks",
        fileName: "submission-1.pdf",
        filePath: "https://cdn.example.com/submission-1.pdf",
        fileType: "application/pdf",
        fileSize: 2048,
        uploadedOn: new Date("2026-01-01T00:00:00.000Z"),
        studentId: { _id: "student-1", name: "Student One", email: "student@example.com" },
      },
    ];

    Lecture.findById = () => makePopulatedDocQuery(lectureDoc);
    Container.findOne = () => makePopulatedDocQuery(null);
    Attachment.find = (query) => {
      if (query?.type === "homeworks") {
        return makeHomeworkQuery(homeworkAttachments);
      }
      return makeLeanQuery(categorizedAttachments);
    };

    const result = await new Promise((resolve, reject) => {
      const req = {
        params: { lectureId },
        user: {
          _id: "lecturer-1",
          role: "Lecturer",
          email: "lecturer@example.com",
          name: "Lecturer Name",
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

      lectureController.loadLecturePage(req, res, (error) => {
        if (error) {
          reject(error);
        }
      });
    });

    assert.equal(result.statusCode, 200);
    assert.equal(result.payload.status, "success");
    assert.equal(result.payload.data.homeworks.length, 1);
    assert.equal(result.payload.data.homeworks[0].fileName, "submission-1.pdf");
    assert.equal(result.payload.data.homeworks[0].studentId.name, "Student One");
    assert.equal(result.payload.data.attachments.pdfsandimages.length, 1);
  } finally {
    restoreModelMethods();
  }
});

test("loadLecturePage enriches student assessment requirements with latest submission state", async () => {
  try {
    const lectureId = "507f1f77bcf86cd799439011";
    const lectureDoc = {
      _id: lectureId,
      name: "Lecture 1",
      requiresExam: true,
      requiresHomework: false,
      passingThreshold: 70,
      examConfig: {
        formUrl: "https://forms.google.com/exam",
        defaultPassingThreshold: 60,
      },
      createdBy: { name: "Lecturer" },
      subject: { name: "Math" },
      level: { name: "Level 1" },
    };
    const latestSubmission = {
      _id: "exam-submission-1",
      type: "exam",
      passed: false,
      syncStatus: "synced",
      syncError: "Score is below threshold",
      score: 42,
      maxScore: 100,
      passingThreshold: 70,
      verifiedAt: new Date("2026-01-02T00:00:00.000Z"),
    };

    Lecture.findById = () => makePopulatedDocQuery(lectureDoc);
    Container.findOne = () => makePopulatedDocQuery(null);
    Attachment.find = () => makeLeanQuery([]);
    StudentLectureAccess.findOne = () =>
      makeLeanQuery({
        _id: "access-1",
        remainingViews: 2,
        lastAccessed: new Date("2026-01-01T00:00:00.000Z"),
      });
    StudentExamSubmission.findOne = (query) => ({
      sort() {
        return this;
      },
      lean() {
        return Promise.resolve(query.type === "exam" ? latestSubmission : null);
      },
    });

    const result = await new Promise((resolve, reject) => {
      const req = {
        params: { lectureId },
        user: {
          _id: "507f1f77bcf86cd799439012",
          role: "Student",
          email: "student@example.com",
          name: "Student Name",
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

      lectureController.loadLecturePage(req, res, (error) => {
        if (error) {
          reject(error);
        }
      });
    });

    const examRequirement = result.payload.data.requirements.exam;

    assert.equal(result.statusCode, 200);
    assert.equal(examRequirement.required, true);
    assert.equal(examRequirement.passed, false);
    assert.equal(examRequirement.status, "failed");
    assert.equal(examRequirement.score, 42);
    assert.equal(examRequirement.maxScore, 100);
    assert.equal(examRequirement.requiredScore, 70);
    assert.equal(examRequirement.error, "Score is below threshold");
    assert.equal(examRequirement.url, "https://forms.google.com/exam");
    assert.equal(examRequirement.submission._id, "exam-submission-1");
  } finally {
    restoreModelMethods();
  }
});

test("loadLecturePage creates a student access record from an entitled purchase when no access row exists", async () => {
  try {
    const lectureId = "507f1f77bcf86cd799439011";
    const studentId = "507f1f77bcf86cd799439012";
    const parentContainerId = "507f1f77bcf86cd799439013";
    const accessDoc = {
      _id: "access-from-purchase",
      remainingViews: 4,
      lastAccessed: new Date("2026-01-03T00:00:00.000Z"),
    };
    const lectureDoc = {
      _id: lectureId,
      name: "Purchased lecture",
      numberOfViews: 4,
      parent: parentContainerId,
      requiresExam: false,
      requiresHomework: false,
      createdBy: { name: "Lecturer" },
      subject: { name: "Math" },
      level: { name: "Level 1" },
    };

    Lecture.findById = () => makePopulatedDocQuery(lectureDoc);
    Container.findOne = () => makePopulatedDocQuery(null);
    Container.findById = () => ({
      select() {
        return this;
      },
      lean() {
        return Promise.resolve({ _id: parentContainerId, parent: null });
      },
    });
    Attachment.find = () => makeLeanQuery([]);
    StudentExamSubmission.findOne = () => ({
      sort() {
        return this;
      },
      lean() {
        return Promise.resolve(null);
      },
    });
    StudentLectureAccess.findOne = () => ({
      lean() {
        return Promise.resolve(null);
      },
    });
    StudentLectureAccess.findOneAndUpdate = (filter, update) => {
      assert.equal(String(filter.student), studentId);
      assert.equal(String(filter.lecture), lectureId);
      assert.equal(update.$setOnInsert.remainingViews, 4);
      return Promise.resolve(accessDoc);
    };
    Purchase.find = (query) => ({
      select() {
        return this;
      },
      lean() {
        assert.equal(String(query.student), studentId);
        return Promise.resolve([
          {
            type: "containerPurchase",
            student: studentId,
            container: parentContainerId,
          },
        ]);
      },
    });

    const result = await new Promise((resolve, reject) => {
      const req = {
        params: { lectureId },
        user: {
          _id: studentId,
          role: "Student",
          email: "student@example.com",
          name: "Student Name",
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

      lectureController.loadLecturePage(req, res, (error) => {
        if (error) {
          reject(error);
        }
      });
    });

    assert.equal(result.statusCode, 200);
    assert.equal(result.payload.data.accessData._id, accessDoc._id);
    assert.equal(result.payload.data.accessData.remainingViews, 4);
  } finally {
    restoreModelMethods();
  }
});
