const test = require("node:test")
const assert = require("node:assert/strict")

const studentLectureAccessController = require("../../controllers/studentLectureAccessController")
const Lecture = require("../../models/LectureModel")
const StudentExamSubmission = require("../../models/studentExamSubmissionModel")

const originalLectureFindById = Lecture.findById
const originalSubmissionFindOne = StudentExamSubmission.findOne

const makeLectureQuery = (lectureDoc) => ({
  populate() {
    return this
  },
  then(resolve, reject) {
    return Promise.resolve(lectureDoc).then(resolve, reject)
  },
})

const runCheckLectureAccess = ({ lectureDoc, examSubmission = null, homeworkSubmission = null }) => {
  Lecture.findById = () => makeLectureQuery(lectureDoc)
  StudentExamSubmission.findOne = async (query) => {
    if (query.type === "exam") return examSubmission
    if (query.type === "homework") return homeworkSubmission
    return null
  }

  return new Promise((resolve, reject) => {
    const req = {
      params: { lectureId: "lecture-1" },
      user: { _id: "student-1" },
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
