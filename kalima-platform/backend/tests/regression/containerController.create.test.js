const test = require("node:test");
const assert = require("node:assert/strict");

const mongoose = require("mongoose");

const containerController = require("../../controllers/containerController");
const Container = require("../../models/containerModel");
const Level = require("../../models/levelModel");
const Subject = require("../../models/subjectModel");
const Lecturer = require("../../models/lecturerModel");

const originalStartSession = mongoose.startSession;
const originalContainerCreate = Container.create;
const originalLevelFindById = Level.findById;
const originalSubjectFindById = Subject.findById;
const originalLecturerFindById = Lecturer.findById;

const createSession = () => ({
  committed: false,
  aborted: false,
  startTransaction() {},
  async commitTransaction() {
    this.committed = true;
  },
  async abortTransaction() {
    this.aborted = true;
  },
  async endSession() {},
});

const makeSessionQuery = (doc) => ({
  session() {
    return Promise.resolve(doc);
  },
});

const restoreMethods = () => {
  mongoose.startSession = originalStartSession;
  Container.create = originalContainerCreate;
  Level.findById = originalLevelFindById;
  Subject.findById = originalSubjectFindById;
  Lecturer.findById = originalLecturerFindById;
};

const runCreateContainer = (req) =>
  new Promise((resolve, reject) => {
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

    containerController.createContainer(req, res, reject);
  });

test("createContainer preserves explicit false sameGradeOnly from multipart-style course payloads", async () => {
  const session = createSession();
  let createdContainerData;

  mongoose.startSession = async () => session;
  Level.findById = (id) => makeSessionQuery({ _id: id });
  Subject.findById = (id) => makeSessionQuery({ _id: id });
  Lecturer.findById = (id) => makeSessionQuery({ _id: id });
  Container.create = async ([containerData]) => {
    createdContainerData = containerData;
    return [{ _id: "course-1", id: "course-1", ...containerData }];
  };

  try {
    const result = await runCreateContainer({
      body: {
        name: "Grade privacy course",
        type: "course",
        price: "100",
        level: "level-1",
        subject: "subject-1",
        teacherAllowed: "false",
        description: "Course description",
        goal: ["Course goal"],
        sameGradeOnly: "false",
      },
      user: { _id: "lecturer-1" },
    });

    assert.equal(result.statusCode, 201);
    assert.equal(result.payload.status, "success");
    assert.equal(session.committed, true);
    assert.equal(createdContainerData.teacherAllowed, false);
    assert.equal(createdContainerData.sameGradeOnly, false);
  } finally {
    restoreMethods();
  }
});
