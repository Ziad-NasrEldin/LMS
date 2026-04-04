const test = require("node:test");
const assert = require("node:assert/strict");

const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

const containerController = require("../../controllers/containerController");
const Container = require("../../models/containerModel");
const Lecture = require("../../models/LectureModel");
const Attachment = require("../../models/attachmentModel");
const Purchase = require("../../models/purchaseModel");
const StudentLectureAccess = require("../../models/studentLectureAccessModel");
const StudentExamSubmission = require("../../models/studentExamSubmissionModel");

const originalStartSession = mongoose.startSession;
const originalAggregate = Container.aggregate;
const originalFindById = Container.findById;
const originalUpdateMany = Container.updateMany;
const originalDeleteMany = Container.deleteMany;
const originalLectureFind = Lecture.find;
const originalLectureDeleteMany = Lecture.deleteMany;
const originalAttachmentFind = Attachment.find;
const originalAttachmentDeleteMany = Attachment.deleteMany;
const originalPurchaseDeleteMany = Purchase.deleteMany;
const originalAccessDeleteMany = StudentLectureAccess.deleteMany;
const originalSubmissionDeleteMany = StudentExamSubmission.deleteMany;
const originalDestroy = cloudinary.uploader.destroy;

const createSession = () => ({
  committed: false,
  aborted: false,
  ended: false,
  startTransaction() {},
  async commitTransaction() {
    this.committed = true;
  },
  async abortTransaction() {
    this.aborted = true;
  },
  endSession() {
    this.ended = true;
  },
});

const createQuery = (result) => ({
  select() {
    return this;
  },
  lean() {
    return this;
  },
  session() {
    return Promise.resolve(result);
  },
});

const runDelete = ({ user, params }) =>
  new Promise((resolve, reject) => {
    const req = { user, params };
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

    containerController.deleteContainerAndChildren(req, res, (error) => {
      if (error) reject(error);
    });
  });

const restoreMethods = () => {
  mongoose.startSession = originalStartSession;
  Container.aggregate = originalAggregate;
  Container.findById = originalFindById;
  Container.updateMany = originalUpdateMany;
  Container.deleteMany = originalDeleteMany;
  Lecture.find = originalLectureFind;
  Lecture.deleteMany = originalLectureDeleteMany;
  Attachment.find = originalAttachmentFind;
  Attachment.deleteMany = originalAttachmentDeleteMany;
  Purchase.deleteMany = originalPurchaseDeleteMany;
  StudentLectureAccess.deleteMany = originalAccessDeleteMany;
  StudentExamSubmission.deleteMany = originalSubmissionDeleteMany;
  cloudinary.uploader.destroy = originalDestroy;
};

test("deleteContainerAndChildren deletes a leaf container and prunes parent references", async () => {
  const session = createSession();
  const calls = {
    updateMany: [],
    purchaseDeleteMany: [],
    containerDeleteMany: [],
    cloudinaryDestroy: [],
  };

  mongoose.startSession = async () => session;
  Container.findById = () =>
    createQuery({
      _id: "69d05bff77e56cf8c6f94b56",
      createdBy: "lecturer-1",
      image: { publicId: "container-image-root" },
      toObject() {
        return { _id: this._id, createdBy: this.createdBy, image: this.image };
      },
    });
  Container.aggregate = () => ({
    session() {
      return Promise.resolve([
        {
          _id: "69d05bff77e56cf8c6f94b56",
          nestedChildren: [],
        },
      ]);
    },
  });
  Lecture.find = () => createQuery([]);
  Attachment.find = () => createQuery([]);
  Container.updateMany = (filter, update) => {
    calls.updateMany.push({ filter, update });
    return createQuery({ acknowledged: true });
  };
  Purchase.deleteMany = (filter) => {
    calls.purchaseDeleteMany.push(filter);
    return createQuery({ acknowledged: true });
  };
  Container.deleteMany = (filter) => {
    calls.containerDeleteMany.push(filter);
    return createQuery({ acknowledged: true });
  };
  Lecture.deleteMany = () => createQuery({ acknowledged: true });
  Attachment.deleteMany = () => createQuery({ acknowledged: true });
  StudentLectureAccess.deleteMany = () => createQuery({ acknowledged: true });
  StudentExamSubmission.deleteMany = () => createQuery({ acknowledged: true });
  cloudinary.uploader.destroy = async (publicId) => {
    calls.cloudinaryDestroy.push(publicId);
  };

  try {
    const result = await runDelete({
      user: { _id: "lecturer-1", role: "Lecturer" },
      params: { containerId: "69d05bff77e56cf8c6f94b56" },
    });

    assert.equal(result.statusCode, 204);
    assert.equal(result.payload.status, "success");
    assert.equal(session.committed, true);
    assert.deepEqual(calls.updateMany[0], {
      filter: { children: { $in: ["69d05bff77e56cf8c6f94b56"] } },
      update: { $pull: { children: { $in: ["69d05bff77e56cf8c6f94b56"] } } },
    });
    assert.deepEqual(calls.purchaseDeleteMany[0], {
      $or: [{ container: { $in: ["69d05bff77e56cf8c6f94b56"] } }],
    });
    assert.deepEqual(calls.containerDeleteMany[0], {
      _id: { $in: ["69d05bff77e56cf8c6f94b56"] },
    });
    assert.deepEqual(calls.cloudinaryDestroy, ["container-image-root"]);
  } finally {
    restoreMethods();
  }
});

test("deleteContainerAndChildren deletes nested lectures and dependent records for admin users", async () => {
  const session = createSession();
  const calls = {
    purchaseDeleteMany: [],
    attachmentDeleteMany: [],
    accessDeleteMany: [],
    submissionDeleteMany: [],
    lectureDeleteMany: [],
    containerDeleteMany: [],
    cloudinaryDestroy: [],
  };

  mongoose.startSession = async () => session;
  Container.findById = () =>
    createQuery({
      _id: "69d05bff77e56cf8c6f94b56",
      createdBy: "lecturer-owner",
      image: { publicId: "root-image" },
      toObject() {
        return { _id: this._id, createdBy: this.createdBy, image: this.image };
      },
    });
  Container.aggregate = () => ({
    session() {
      return Promise.resolve([
        {
          _id: "69d05bff77e56cf8c6f94b56",
          nestedChildren: [
            { _id: "69d05bff77e56cf8c6f94b57", image: { publicId: "child-image" } },
          ],
        },
      ]);
    },
  });
  Lecture.find = () =>
    createQuery([
      {
        _id: "79d05bff77e56cf8c6f94b56",
        thumbnail: null,
      },
    ]);
  Attachment.find = () =>
    createQuery([
      {
        _id: "89d05bff77e56cf8c6f94b56",
        publicId: "attachment-image",
      },
    ]);
  Container.updateMany = () => createQuery({ acknowledged: true });
  Purchase.deleteMany = (filter) => {
    calls.purchaseDeleteMany.push(filter);
    return createQuery({ acknowledged: true });
  };
  Attachment.deleteMany = (filter) => {
    calls.attachmentDeleteMany.push(filter);
    return createQuery({ acknowledged: true });
  };
  StudentLectureAccess.deleteMany = (filter) => {
    calls.accessDeleteMany.push(filter);
    return createQuery({ acknowledged: true });
  };
  StudentExamSubmission.deleteMany = (filter) => {
    calls.submissionDeleteMany.push(filter);
    return createQuery({ acknowledged: true });
  };
  Lecture.deleteMany = (filter) => {
    calls.lectureDeleteMany.push(filter);
    return createQuery({ acknowledged: true });
  };
  Container.deleteMany = (filter) => {
    calls.containerDeleteMany.push(filter);
    return createQuery({ acknowledged: true });
  };
  cloudinary.uploader.destroy = async (publicId) => {
    calls.cloudinaryDestroy.push(publicId);
  };

  try {
    const result = await runDelete({
      user: { _id: "admin-1", role: "Admin" },
      params: { containerId: "69d05bff77e56cf8c6f94b56" },
    });

    assert.equal(result.statusCode, 204);
    assert.equal(session.committed, true);
    assert.deepEqual(calls.purchaseDeleteMany[0], {
      $or: [
        { container: { $in: ["69d05bff77e56cf8c6f94b56", "69d05bff77e56cf8c6f94b57"] } },
        { lecture: { $in: ["79d05bff77e56cf8c6f94b56"] } },
      ],
    });
    assert.deepEqual(calls.attachmentDeleteMany[0], {
      lectureId: { $in: ["79d05bff77e56cf8c6f94b56"] },
    });
    assert.deepEqual(calls.accessDeleteMany[0], {
      lecture: { $in: ["79d05bff77e56cf8c6f94b56"] },
    });
    assert.deepEqual(calls.submissionDeleteMany[0], {
      lecture: { $in: ["79d05bff77e56cf8c6f94b56"] },
    });
    assert.deepEqual(calls.lectureDeleteMany[0], {
      _id: { $in: ["79d05bff77e56cf8c6f94b56"] },
    });
    assert.deepEqual(calls.containerDeleteMany[0], {
      _id: { $in: ["69d05bff77e56cf8c6f94b56", "69d05bff77e56cf8c6f94b57"] },
    });
    assert.deepEqual(calls.cloudinaryDestroy, ["root-image", "child-image", "attachment-image"]);
  } finally {
    restoreMethods();
  }
});

test("deleteContainerAndChildren blocks lecturers from deleting another lecturer's container", async () => {
  const session = createSession();
  let aggregateCalled = false;

  mongoose.startSession = async () => session;
  Container.findById = () =>
    createQuery({
      _id: "69d05bff77e56cf8c6f94b56",
      createdBy: "lecturer-owner",
      toObject() {
        return { _id: this._id, createdBy: this.createdBy };
      },
    });
  Container.aggregate = () => {
    aggregateCalled = true;
    return {
      session() {
        return Promise.resolve([]);
      },
    };
  };

  try {
    await assert.rejects(
      runDelete({
        user: { _id: "lecturer-other", role: "Lecturer" },
        params: { containerId: "69d05bff77e56cf8c6f94b56" },
      }),
      (error) => {
        assert.equal(error.statusCode, 403);
        assert.equal(error.message, "You do not have permission to delete this container");
        return true;
      }
    );

    assert.equal(session.aborted, true);
    assert.equal(aggregateCalled, false);
  } finally {
    restoreMethods();
  }
});
