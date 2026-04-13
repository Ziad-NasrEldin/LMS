const test = require("node:test")
const assert = require("node:assert/strict")

const {
  MIN_LIMITED_LECTURE_DURATION_HOURS,
  getLimitedLectureAvailabilityStatus,
  resolveLimitedLectureCreateFields,
  resolveLimitedLectureUpdateFields,
} = require("../../utils/limitedLectureAvailability")

test("resolveLimitedLectureCreateFields starts a purchase window when enabled", () => {
  const now = new Date("2026-04-13T10:00:00.000Z")
  const result = resolveLimitedLectureCreateFields({
    limitedAvailabilityEnabled: true,
    limitedAvailabilityDurationHours: 48,
    now,
  })

  assert.equal(result.limitedAvailabilityEnabled, true)
  assert.equal(result.limitedAvailabilityDurationHours, 48)
  assert.equal(result.limitedAvailabilityStartsAt.toISOString(), "2026-04-13T10:00:00.000Z")
  assert.equal(result.limitedAvailabilityEndsAt.toISOString(), "2026-04-15T10:00:00.000Z")
})

test("resolveLimitedLectureCreateFields rejects durations below the minimum", () => {
  assert.throws(
    () =>
      resolveLimitedLectureCreateFields({
        limitedAvailabilityEnabled: true,
        limitedAvailabilityDurationHours: MIN_LIMITED_LECTURE_DURATION_HOURS - 1,
      }),
    /at least 24 hours/,
  )
})

test("resolveLimitedLectureUpdateFields preserves timestamps for active limited lectures", () => {
  const currentLecture = {
    limitedAvailabilityEnabled: true,
    limitedAvailabilityDurationHours: 48,
    limitedAvailabilityStartsAt: new Date("2026-04-13T10:00:00.000Z"),
    limitedAvailabilityEndsAt: new Date("2026-04-15T10:00:00.000Z"),
  }

  const result = resolveLimitedLectureUpdateFields({
    currentLecture,
    limitedAvailabilityEnabled: true,
    limitedAvailabilityDurationHours: 72,
    now: new Date("2026-04-14T08:00:00.000Z"),
  })

  assert.equal(result.limitedAvailabilityEnabled, true)
  assert.equal(result.limitedAvailabilityDurationHours, 72)
  assert.equal(result.limitedAvailabilityStartsAt, undefined)
  assert.equal(result.limitedAvailabilityEndsAt, undefined)
})

test("resolveLimitedLectureUpdateFields restarts the window when toggled back on", () => {
  const currentLecture = {
    limitedAvailabilityEnabled: false,
    limitedAvailabilityDurationHours: 48,
    limitedAvailabilityStartsAt: null,
    limitedAvailabilityEndsAt: null,
  }

  const result = resolveLimitedLectureUpdateFields({
    currentLecture,
    limitedAvailabilityEnabled: true,
    now: new Date("2026-04-20T09:00:00.000Z"),
  })

  assert.equal(result.limitedAvailabilityEnabled, true)
  assert.equal(result.limitedAvailabilityDurationHours, 48)
  assert.equal(result.limitedAvailabilityStartsAt.toISOString(), "2026-04-20T09:00:00.000Z")
  assert.equal(result.limitedAvailabilityEndsAt.toISOString(), "2026-04-22T09:00:00.000Z")
})

test("getLimitedLectureAvailabilityStatus marks expired windows as non-purchasable", () => {
  const status = getLimitedLectureAvailabilityStatus(
    {
      limitedAvailabilityEnabled: true,
      limitedAvailabilityEndsAt: "2026-04-10T09:00:00.000Z",
    },
    new Date("2026-04-11T09:00:00.000Z"),
  )

  assert.equal(status.status, "expired")
  assert.equal(status.isPurchasable, false)
  assert.equal(status.isExpired, true)
})
