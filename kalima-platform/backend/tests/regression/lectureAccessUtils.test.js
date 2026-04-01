const test = require("node:test")
const assert = require("node:assert/strict")

const {
  resolvePassingThreshold,
  buildLectureRequirements,
  getRestrictedLectureSnapshot,
} = require("../../utils/lectureAccessUtils")

test("resolvePassingThreshold prefers lecture-level override", () => {
  const threshold = resolvePassingThreshold(75, 60, 50)
  assert.equal(threshold, 75)
})

test("resolvePassingThreshold falls back to config default", () => {
  const threshold = resolvePassingThreshold(undefined, 62, 50)
  assert.equal(threshold, 62)
})

test("resolvePassingThreshold falls back to global default", () => {
  const threshold = resolvePassingThreshold(undefined, undefined, 60)
  assert.equal(threshold, 60)
})

test("buildLectureRequirements returns normalized exam/homework requirements", () => {
  const requirements = buildLectureRequirements({
    requiresExam: true,
    requiresHomework: true,
    passingThreshold: 70,
    homeworkPassingThreshold: null,
    examConfig: {
      formUrl: "https://forms.google.com/exam-1",
      defaultPassingThreshold: 55,
    },
    homeworkConfig: {
      formUrl: "https://forms.google.com/homework-1",
      defaultPassingThreshold: 65,
    },
  })

  assert.deepEqual(requirements.exam, {
    required: true,
    passed: false,
    url: "https://forms.google.com/exam-1",
    source: "config",
    passingThreshold: 70,
  })

  assert.deepEqual(requirements.homework, {
    required: true,
    passed: false,
    url: "https://forms.google.com/homework-1",
    source: "config",
    passingThreshold: 65,
  })
})

test("buildLectureRequirements falls back to legacy links when config URL is unavailable", () => {
  const requirements = buildLectureRequirements({
    requiresExam: true,
    requiresHomework: true,
    passingThreshold: 70,
    homeworkPassingThreshold: 65,
    examConfig: {
      defaultPassingThreshold: 55,
    },
    homeworkConfig: {
      defaultPassingThreshold: 60,
    },
    examLink: "https://legacy.exam/form",
    attachments: {
      homeworks: [{ fileType: "link", filePath: "https://legacy.homework/form" }],
    },
  })

  assert.deepEqual(requirements.exam, {
    required: true,
    passed: false,
    url: "https://legacy.exam/form",
    source: "legacy",
    passingThreshold: 70,
  })

  assert.deepEqual(requirements.homework, {
    required: true,
    passed: false,
    url: "https://legacy.homework/form",
    source: "legacy",
    passingThreshold: 65,
  })
})

test("getRestrictedLectureSnapshot excludes protected content fields", () => {
  const snapshot = getRestrictedLectureSnapshot({
    _id: "lecture-1",
    name: "Physics Lecture",
    type: "lecture",
    lecture_type: "Paid",
    description: "desc",
    thumbnail: "thumb.jpg",
    price: 10,
    subject: { _id: "subject-1", name: "Physics" },
    level: { _id: "level-1", name: "First" },
    createdBy: { _id: "lecturer-1", name: "Dr. A" },
    requiresExam: true,
    requiresHomework: true,
    videoLink: "https://secret-video",
  })

  assert.equal(snapshot.videoLink, undefined)
  assert.equal(snapshot.name, "Physics Lecture")
  assert.equal(snapshot.requiresExam, true)
  assert.equal(snapshot.requiresHomework, true)
})
