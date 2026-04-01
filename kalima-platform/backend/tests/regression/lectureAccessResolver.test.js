const test = require("node:test")
const assert = require("node:assert/strict")

const Lecture = require("../../models/LectureModel")
const Container = require("../../models/containerModel")
const Purchase = require("../../models/purchaseModel")
const StudentLectureAccess = require("../../models/studentLectureAccessModel")
const {
  buildTargetAncestorIds,
  loadPurchaseForStudent,
  purchaseUnlocksTarget,
  resolveAccessibleLectureTarget,
  serializeStudentLectureAccess,
  upsertStudentLectureAccess,
} = require("../../utils/lectureAccessResolver")

const originalLectureFindById = Lecture.findById
const originalContainerFindById = Container.findById
const originalPurchaseFindById = Purchase.findById
const originalAccessFindOneAndUpdate = StudentLectureAccess.findOneAndUpdate
const originalAccessFindOne = StudentLectureAccess.findOne

const makeLeanQuery = (doc) => ({
  select() {
    return this
  },
  lean() {
    return Promise.resolve(doc)
  },
  then(resolve, reject) {
    return Promise.resolve(doc).then(resolve, reject)
  },
})

const restoreModelMethods = () => {
  Lecture.findById = originalLectureFindById
  Container.findById = originalContainerFindById
  Purchase.findById = originalPurchaseFindById
  StudentLectureAccess.findOneAndUpdate = originalAccessFindOneAndUpdate
  StudentLectureAccess.findOne = originalAccessFindOne
}

test("resolveAccessibleLectureTarget prefers the lecture model", async () => {
  try {
    Lecture.findById = () => makeLeanQuery({
      _id: "lecture-1",
      name: "Lecture 1",
      type: "lecture",
      parent: "container-1",
    })
    Container.findById = () => makeLeanQuery(null)

    const result = await resolveAccessibleLectureTarget("lecture-1")

    assert.equal(result.source, "lecture")
    assert.equal(result.targetDoc._id, "lecture-1")
    assert.equal(result.targetDoc.kind, "Lecture")
  } finally {
    restoreModelMethods()
  }
})

test("buildTargetAncestorIds walks container parents", async () => {
  try {
    Container.findById = (id) => {
      const docs = {
        "222222222222222222222222": {
          _id: "222222222222222222222222",
          parent: "333333333333333333333333",
        },
        "333333333333333333333333": {
          _id: "333333333333333333333333",
          parent: null,
        },
      }
      return makeLeanQuery(docs[id] || null)
    }

    const ids = await buildTargetAncestorIds({
      _id: "111111111111111111111111",
      parent: "222222222222222222222222",
    })

    assert.deepEqual(
      [...ids],
      [
        "111111111111111111111111",
        "222222222222222222222222",
        "333333333333333333333333",
      ],
    )
  } finally {
    restoreModelMethods()
  }
})

test("purchaseUnlocksTarget accepts lecture and container entitlements", () => {
  const targetAncestorIds = new Set(["lecture-1", "container-1", "container-2"])

  assert.equal(
    purchaseUnlocksTarget(
      { type: "pointPurchase", lecture: "lecture-1" },
      { _id: "lecture-1" },
      targetAncestorIds,
    ),
    true,
  )

  assert.equal(
    purchaseUnlocksTarget(
      { container: "container-2" },
      { _id: "lecture-1" },
      targetAncestorIds,
    ),
    true,
  )

  assert.equal(
    purchaseUnlocksTarget(
      { container: "container-x" },
      { _id: "lecture-1" },
      targetAncestorIds,
    ),
    false,
  )
})

test("loadPurchaseForStudent rejects purchases owned by another student", async () => {
  try {
    Purchase.findById = () => makeLeanQuery({
      _id: "purchase-1",
      student: "student-2",
      lecture: "lecture-1",
    })

    await assert.rejects(
      loadPurchaseForStudent("purchase-1", "student-1"),
      (error) => {
        assert.equal(error.statusCode, 403)
        assert.equal(error.message, "Purchase does not belong to this student")
        return true
      },
    )
  } finally {
    restoreModelMethods()
  }
})

test("upsertStudentLectureAccess returns the existing record when a duplicate key race occurs", async () => {
  try {
    let callCount = 0
    StudentLectureAccess.findOneAndUpdate = async () => {
      callCount += 1
      const error = new Error("duplicate key")
      error.code = 11000
      throw error
    }
    StudentLectureAccess.findOne = async () => ({
      _id: "access-1",
      student: "student-1",
      lecture: "lecture-1",
      remainingViews: 3,
      lastAccessed: new Date("2026-04-01T00:00:00Z"),
    })

    const access = await upsertStudentLectureAccess("student-1", {
      _id: "lecture-1",
      numberOfViews: 5,
    })

    assert.equal(callCount, 1)
    assert.equal(access._id, "access-1")
    assert.equal(access.remainingViews, 3)
  } finally {
    restoreModelMethods()
  }
})

test("serializeStudentLectureAccess keeps the frontend contract minimal", () => {
  const access = serializeStudentLectureAccess({
    _id: "access-1",
    remainingViews: 2,
    lastAccessed: new Date("2026-04-01T00:00:00Z"),
    extra: "ignored",
  })

  assert.deepEqual(access, {
    _id: "access-1",
    remainingViews: 2,
    lastAccessed: new Date("2026-04-01T00:00:00Z"),
  })
})
