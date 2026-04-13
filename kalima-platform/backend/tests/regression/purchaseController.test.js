const test = require("node:test");
const assert = require("node:assert/strict");

const mongoose = require("mongoose");
const purchaseController = require("../../controllers/purchaseController");
const Container = require("../../models/containerModel");
const Lecture = require("../../models/LectureModel");
const Purchase = require("../../models/purchaseModel");
const Student = require("../../models/studentModel");
const StudentLectureAccess = require("../../models/studentLectureAccessModel");

const originalStartSession = mongoose.startSession;
const originalContainerFindById = Container.findById;
const originalLectureFindById = Lecture.findById;
const originalPurchaseFindOne = Purchase.findOne;
const originalPurchaseCreate = Purchase.create;
const originalStudentFindById = Student.findById;
const originalAccessFindOneAndUpdate = StudentLectureAccess.findOneAndUpdate;
const originalAccessFindOne = StudentLectureAccess.findOne;

const makeQuery = (doc) => ({
  session() {
    return Promise.resolve(doc);
  },
  lean() {
    return Promise.resolve(doc);
  },
  then(resolve, reject) {
    return Promise.resolve(doc).then(resolve, reject);
  },
});

const restore = () => {
  mongoose.startSession = originalStartSession;
  Container.findById = originalContainerFindById;
  Lecture.findById = originalLectureFindById;
  Purchase.findOne = originalPurchaseFindOne;
  Purchase.create = originalPurchaseCreate;
  Student.findById = originalStudentFindById;
  StudentLectureAccess.findOneAndUpdate = originalAccessFindOneAndUpdate;
  StudentLectureAccess.findOne = originalAccessFindOne;
};

test("purchaseContainerWithPoints returns success for an already-owned lecture without creating duplicates", async () => {
  const fakeSession = {
    startTransaction() {},
    async commitTransaction() {},
    async abortTransaction() {},
    async endSession() {},
  };

  let purchaseCreateCalls = 0;

  mongoose.startSession = async () => fakeSession;
  Container.findById = () => makeQuery(null);
  Lecture.findById = () =>
    makeQuery({
      _id: "69dd73b19de97c0d348bc747",
      name: "Free lecture",
      createdBy: "lecturer-1",
      price: 0,
      sameGradeOnly: false,
      limitedAvailabilityEnabled: false,
      numberOfViews: 3,
    });
  Student.findById = () =>
    makeQuery({
      _id: "student-1",
      role: "Student",
      level: null,
      generalPoints: 0,
      getLecturerPointsBalance: () => 0,
      useLecturerPoints: () => true,
      async save() {},
    });
  Purchase.findOne = () => ({
    session() {
      return this;
    },
    lean() {
      return Promise.resolve({
        _id: "purchase-1",
        student: "student-1",
        lecture: "69dd73b19de97c0d348bc747",
        type: "lecturePurchase",
      });
    },
  });
  Purchase.create = async () => {
    purchaseCreateCalls += 1;
    return [];
  };
  StudentLectureAccess.findOneAndUpdate = async () => ({
    _id: "access-1",
    student: "student-1",
    lecture: "69dd73b19de97c0d348bc747",
    remainingViews: 3,
    lastAccessed: new Date("2026-04-14T00:00:00Z"),
  });
  StudentLectureAccess.findOne = async () => null;

  try {
    const result = await new Promise((resolve, reject) => {
      const req = {
        body: { containerId: "69dd73b19de97c0d348bc747" },
        user: { _id: "student-1", id: "student-1", role: "Student" },
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

      purchaseController.purchaseContainerWithPoints(req, res, reject);
    });

    assert.equal(result.statusCode, 200);
    assert.equal(result.payload.status, "success");
    assert.equal(result.payload.data.purchase._id, "purchase-1");
    assert.equal(result.payload.data.usedPointsType, "already-owned");
    assert.equal(purchaseCreateCalls, 0);
  } finally {
    restore();
  }
});
