const test = require("node:test")
const assert = require("node:assert/strict")

const { hasLectureAccessFromPurchase } = require("../../utils/purchaseHistoryUtils")

test("hasLectureAccessFromPurchase returns true for direct lecture purchase", () => {
  const purchase = {
    lecture: { _id: "lecture-1" },
  }

  assert.equal(hasLectureAccessFromPurchase(purchase), true)
})

test("hasLectureAccessFromPurchase returns true for lecture container purchase", () => {
  const purchase = {
    container: {
      type: "lecture",
      _id: "lecture-container-1",
    },
  }

  assert.equal(hasLectureAccessFromPurchase(purchase), true)
})

test("hasLectureAccessFromPurchase returns true for hierarchical container with lectures", () => {
  const purchase = {
    container: {
      type: "course",
      _id: "course-1",
      lectures: [{ _id: "lecture-1" }, { _id: "lecture-2" }],
    },
  }

  assert.equal(hasLectureAccessFromPurchase(purchase), true)
})

test("hasLectureAccessFromPurchase returns false when purchase has no lecture access", () => {
  const purchase = {
    container: {
      type: "course",
      _id: "course-1",
      lectures: [],
    },
  }

  assert.equal(hasLectureAccessFromPurchase(purchase), false)
})
