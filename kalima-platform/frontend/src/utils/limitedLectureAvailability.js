export const MIN_LIMITED_LECTURE_DURATION_HOURS = 24

export const getLimitedLectureAvailabilityStatus = (lectureLike, now = new Date()) => {
  const enabled = Boolean(lectureLike?.limitedAvailabilityEnabled)
  const startsAt = lectureLike?.limitedAvailabilityStartsAt
    ? new Date(lectureLike.limitedAvailabilityStartsAt)
    : null
  const endsAt = lectureLike?.limitedAvailabilityEndsAt
    ? new Date(lectureLike.limitedAvailabilityEndsAt)
    : null

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

export const formatLimitedLectureRemaining = (remainingMs, { isRTL = false } = {}) => {
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) {
    return isRTL ? "انتهت المدة" : "Expired"
  }

  const totalHours = Math.ceil(remainingMs / (60 * 60 * 1000))
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24

  if (days > 0 && hours > 0) {
    return isRTL ? `${days} يوم ${hours} ساعة` : `${days}d ${hours}h`
  }

  if (days > 0) {
    return isRTL ? `${days} يوم` : `${days}d`
  }

  return isRTL ? `${totalHours} ساعة` : `${totalHours}h`
}
