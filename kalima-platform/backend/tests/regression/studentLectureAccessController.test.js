const test = require("node:test")
const assert = require("node:assert/strict")

const studentLectureAccessController = require("../../controllers/studentLectureAccessController")
const Lecture = require("../../models/LectureModel")
const StudentExamSubmission = require("../../models/studentExamSubmissionModel")
const Purchase = require("../../models/purchaseModel")
const Parent = require("../../models/parentModel")

const originalLectureFindById = Lecture.findById
const originalSubmissionFindOne = StudentExamSubmission.findOne
const originalPurchaseFindOne = Purchase.findOne
const originalParentFindById = Parent.findById

const makeLectureQuery = (lectureDoc) => ({
  select() {
    return this
  },
  populate() {
    return this
  },
  lean() {
    return Promise.resolve(lectureDoc)
  },
  then(resolve, reject) {
    return Promise.resolve(lectureDoc).then(resolve, reject)
  },
})

const runCheckLectureAccess = ({
  lectureDoc,
  examSubmission = null,
  homeworkSubmission = null,
  submissionResolver = null,
  user = { _id: "student-1" },
  parentDoc = null,
}) => {
  Lecture.findById = () => makeLectureQuery(lectureDoc)
  StudentExamSubmission.findOne = async (query) => {
    if (submissionResolver) return submissionResolver(query)
    if (query.type === "exam") return examSubmission
    if (query.type === "homework") return homeworkSubmission
    return null
  }
  Parent.findById = () => ({
    lean() {
      return Promise.resolve(parentDoc)
    },
  })
  Purchase.findOne = () => ({
    select() {
      return this
    },
    lean() {
      return Promise.resolve({ _id: "purchase-1" })
    },
  })

  return new Promise((resolve, reject) => {
    const req = {
      params: { lectureId: "lecture-1" },
      user,
    }

    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code
        return this
      },
      json(payload) {
        resolve({ statusCode: this.statusCode, payload })
        return this
      },
    }

    const next = (err) => {
      if (err) {
        reject(err)
      }
    }

    studentLectureAccessController.checkLectureAccess(req, res, next)
  })
}

const restoreModelMethods = () => {
  Lecture.findById = originalLectureFindById
  StudentExamSubmission.findOne = originalSubmissionFindOne
  Purchase.findOne = originalPurchaseFindOne
  Parent.findById = originalParentFindById
}

test("checkLectureAccess returns restricted when required exam is not passed", async () => {
  try {
    const result = await runCheckLectureAccess({
      lectureDoc: {
        _id: "lecture-1",
        requiresExam: true,
        requiresHomework: false,
        examConfig: { formUrl: "https://forms.google.com/exam" },
      },
      examSubmission: null,
    })

    assert.equal(result.statusCode, 200)
    assert.equal(result.payload.status, "restricted")
    assert.equal(result.payload.data.exam.required, true)
    assert.equal(result.payload.data.exam.passed, false)
  } finally {
    restoreModelMethods()
  }
})

test("checkLectureAccess returns restricted when required homework is not passed", async () => {
  try {
    const result = await runCheckLectureAccess({
      lectureDoc: {
        _id: "lecture-1",
        requiresExam: false,
        requiresHomework: true,
        homeworkConfig: { formUrl: "https://forms.google.com/homework" },
      },
      homeworkSubmission: null,
    })

    assert.equal(result.statusCode, 200)
    assert.equal(result.payload.status, "restricted")
    assert.equal(result.payload.data.homework.required, true)
    assert.equal(result.payload.data.homework.passed, false)
  } finally {
    restoreModelMethods()
  }
})

test("checkLectureAccess returns success when all required submissions are passed", async () => {
  try {
    const result = await runCheckLectureAccess({
      lectureDoc: {
        _id: "lecture-1",
        requiresExam: true,
        requiresHomework: true,
        examConfig: { formUrl: "https://forms.google.com/exam" },
        homeworkConfig: { formUrl: "https://forms.google.com/homework" },
      },
      examSubmission: { _id: "exam-sub-1", passed: true },
      homeworkSubmission: { _id: "homework-sub-1", passed: true },
    })

    assert.equal(result.statusCode, 200)
    assert.equal(result.payload.status, "success")
    assert.equal(result.payload.data.hasAccess, true)
    assert.equal(result.payload.data.requiresExam, true)
    assert.equal(result.payload.data.requiresHomework, true)
  } finally {
    restoreModelMethods()
  }
})

test("checkLectureAccess keeps restricted state when only one requirement is passed", async () => {
  try {
    const result = await runCheckLectureAccess({
      lectureDoc: {
        _id: "lecture-1",
        requiresExam: true,
        requiresHomework: true,
        examConfig: { formUrl: "https://forms.google.com/exam" },
        homeworkConfig: { formUrl: "https://forms.google.com/homework" },
      },
      examSubmission: { _id: "exam-sub-1", passed: true },
      homeworkSubmission: null,
    })

    assert.equal(result.statusCode, 200)
    assert.equal(result.payload.status, "restricted")
    assert.equal(result.payload.data.exam.passed, true)
    assert.equal(result.payload.data.homework.passed, false)
  } finally {
    restoreModelMethods()
  }
})

test("checkLectureAccess returns legacy exam url when config url is unavailable", async () => {
  try {
    const result = await runCheckLectureAccess({
      lectureDoc: {
        _id: "lecture-1",
        requiresExam: true,
        requiresHomework: false,
        examConfig: { defaultPassingThreshold: 60 },
        examLink: "https://legacy.exam/form",
      },
      examSubmission: null,
    })

    assert.equal(result.statusCode, 200)
    assert.equal(result.payload.status, "restricted")
    assert.equal(result.payload.data.exam.url, "https://legacy.exam/form")
    assert.equal(result.payload.data.exam.source, "legacy")
  } finally {
    restoreModelMethods()
  }
})

test("checkLectureAccess returns success when lecture has no exam or homework requirements", async () => {
  try {
    const result = await runCheckLectureAccess({
      lectureDoc: {
        _id: "lecture-1",
        requiresExam: false,
        requiresHomework: false,
      },
    })

    assert.equal(result.statusCode, 200)
    assert.equal(result.payload.status, "success")
    assert.equal(result.payload.data.hasAccess, true)
  } finally {
    restoreModelMethods()
  }
})

test("checkLectureAccess grants parent access when any child passed the required exam", async () => {
  try {
    const result = await runCheckLectureAccess({
      lectureDoc: {
        _id: "lecture-1",
        requiresExam: true,
        requiresHomework: false,
        examConfig: { formUrl: "https://forms.google.com/exam" },
      },
      user: { _id: "parent-1", role: "Parent" },
      parentDoc: { children: ["child-1", "child-2"] },
      submissionResolver: (query) =>
        query.type === "exam" && query.student === "child-2"
          ? { _id: "exam-sub-2", passed: true }
          : null,
    })

    assert.equal(result.statusCode, 200)
    assert.equal(result.payload.status, "success")
    assert.equal(result.payload.data.hasAccess, true)
    assert.equal(result.payload.data.requiresExam, true)
  } finally {
    restoreModelMethods()
  }
})

test("checkLectureAccess keeps parent restricted when no child passed the required exam", async () => {
  try {
    const result = await runCheckLectureAccess({
      lectureDoc: {
        _id: "lecture-1",
        requiresExam: true,
        requiresHomework: false,
        examConfig: { formUrl: "https://forms.google.com/exam" },
      },
      user: { _id: "parent-1", role: "Parent" },
      parentDoc: { children: ["child-1", "child-2"] },
      submissionResolver: () => null,
    })

    assert.equal(result.statusCode, 200)
    assert.equal(result.payload.status, "restricted")
    assert.equal(result.payload.data.exam.passed, false)
  } finally {
    restoreModelMethods()
  }
})

test("checkLectureAccess returns 404 when lecture does not exist", async () => {
  try {
    await assert.rejects(
      runCheckLectureAccess({
        lectureDoc: null,
      }),
      (error) => {
        assert.equal(error.statusCode, 404)
        assert.equal(error.message, "Lecture not found")
        return true
      }
    )
  } finally {
    restoreModelMethods()
  }
})
