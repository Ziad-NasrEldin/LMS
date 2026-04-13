const MIN_LIMITED_LECTURE_DURATION_HOURS = 24

const parseBoolean = (value) => {
  if (value === undefined || value === null) return undefined
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (normalized === "true") return true
    if (normalized === "false") return false
  }
  return Boolean(value)
}

const parseDurationHours = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < MIN_LIMITED_LECTURE_DURATION_HOURS) {
    throw new Error(`Limited lecture duration must be at least ${MIN_LIMITED_LECTURE_DURATION_HOURS} hours`)
  }

  return Math.floor(parsed)
}

const addHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000)

const getLimitedLectureAvailabilityStatus = (lectureLike, now = new Date()) => {
  const enabled = Boolean(lectureLike?.limitedAvailabilityEnabled)
  const endsAtRaw = lectureLike?.limitedAvailabilityEndsAt
  const endsAt = endsAtRaw ? new Date(endsAtRaw) : null
  const startsAtRaw = lectureLike?.limitedAvailabilityStartsAt
  const startsAt = startsAtRaw ? new Date(startsAtRaw) : null

  if (!enabled) {
    return {
      status: "disabled",
      isLimited: false,
      isExpired: false,
      isPurchasable: true,
      startsAt,
      endsAt,
      remainingMs: null,
    }
  }

  if (!endsAt || Number.isNaN(endsAt.getTime())) {
    return {
      status: "active",
      isLimited: true,
      isExpired: false,
      isPurchasable: true,
      startsAt,
      endsAt: null,
      remainingMs: null,
    }
  }

  const remainingMs = endsAt.getTime() - now.getTime()
  const isExpired = remainingMs <= 0

  return {
    status: isExpired ? "expired" : "active",
    isLimited: true,
    isExpired,
    isPurchasable: !isExpired,
    startsAt,
    endsAt,
    remainingMs: isExpired ? 0 : remainingMs,
  }
}

const resolveLimitedLectureCreateFields = ({
  limitedAvailabilityEnabled,
  limitedAvailabilityDurationHours,
  now = new Date(),
}) => {
  const enabled = parseBoolean(limitedAvailabilityEnabled) === true

  if (!enabled) {
    return {
      limitedAvailabilityEnabled: false,
      limitedAvailabilityDurationHours: null,
      limitedAvailabilityStartsAt: null,
      limitedAvailabilityEndsAt: null,
    }
  }

  const durationHours = parseDurationHours(limitedAvailabilityDurationHours)
  if (!durationHours) {
    throw new Error("Limited lecture duration is required when limited availability is enabled")
  }

  return {
    limitedAvailabilityEnabled: true,
    limitedAvailabilityDurationHours: durationHours,
    limitedAvailabilityStartsAt: now,
    limitedAvailabilityEndsAt: addHours(now, durationHours),
  }
}

const resolveLimitedLectureUpdateFields = ({
  currentLecture,
  limitedAvailabilityEnabled,
  limitedAvailabilityDurationHours,
  now = new Date(),
}) => {
  const hasEnabledUpdate = limitedAvailabilityEnabled !== undefined
  const nextEnabled = hasEnabledUpdate
    ? parseBoolean(limitedAvailabilityEnabled) === true
    : Boolean(currentLecture?.limitedAvailabilityEnabled)
  const submittedDuration = parseDurationHours(limitedAvailabilityDurationHours)

  if (!nextEnabled) {
    const updateFields = {
      limitedAvailabilityEnabled: false,
      limitedAvailabilityStartsAt: null,
      limitedAvailabilityEndsAt: null,
    }

    if (submittedDuration !== undefined) {
      updateFields.limitedAvailabilityDurationHours = submittedDuration
    }

    return updateFields
  }

  const currentDuration = currentLecture?.limitedAvailabilityDurationHours
  const nextDuration = submittedDuration ?? currentDuration

  if (!nextDuration) {
    throw new Error("Limited lecture duration is required when limited availability is enabled")
  }

  const wasEnabled = Boolean(currentLecture?.limitedAvailabilityEnabled)
  const updateFields = {
    limitedAvailabilityEnabled: true,
    limitedAvailabilityDurationHours: nextDuration,
  }

  if (!wasEnabled && nextEnabled) {
    updateFields.limitedAvailabilityStartsAt = now
    updateFields.limitedAvailabilityEndsAt = addHours(now, nextDuration)
  }

  return updateFields
}

module.exports = {
  MIN_LIMITED_LECTURE_DURATION_HOURS,
  getLimitedLectureAvailabilityStatus,
  resolveLimitedLectureCreateFields,
  resolveLimitedLectureUpdateFields,
}
