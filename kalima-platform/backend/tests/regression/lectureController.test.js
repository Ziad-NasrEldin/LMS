const test = require("node:test");
const assert = require("node:assert/strict");

const lectureController = require("../../controllers/lectureController");
const Lecture = require("../../models/LectureModel");
const Container = require("../../models/containerModel");
const Attachment = require("../../models/attachmentModel");

const originalLectureFindById = Lecture.findById;
const originalContainerFindOne = Container.findOne;
const originalAttachmentFind = Attachment.find;

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
  Attachment.find = originalAttachmentFind;
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
