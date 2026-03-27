const resolvePassingThreshold = (lectureThreshold, configThreshold, fallback = 60) => {
  if (lectureThreshold !== undefined && lectureThreshold !== null) {
    return Number(lectureThreshold)
  }

  if (configThreshold !== undefined && configThreshold !== null) {
    return Number(configThreshold)
  }

  return fallback
}

const buildLectureRequirements = (lecture) => ({
  exam: lecture?.requiresExam
    ? {
        required: true,
        passed: false,
        url: lecture.examConfig ? lecture.examConfig.formUrl : null,
        passingThreshold: resolvePassingThreshold(
          lecture.passingThreshold,
          lecture.examConfig ? lecture.examConfig.defaultPassingThreshold : undefined,
          60,
        ),
      }
    : null,
  homework: lecture?.requiresHomework
    ? {
        required: true,
        passed: false,
        url: lecture.homeworkConfig ? lecture.homeworkConfig.formUrl : null,
        passingThreshold: resolvePassingThreshold(
          lecture.homeworkPassingThreshold,
          lecture.homeworkConfig ? lecture.homeworkConfig.defaultPassingThreshold : undefined,
          60,
        ),
      }
    : null,
})

const getRestrictedLectureSnapshot = (lecture) => ({
  _id: lecture._id,
  name: lecture.name,
  type: lecture.type,
  lecture_type: lecture.lecture_type,
  description: lecture.description,
  thumbnail: lecture.thumbnail,
  price: lecture.price,
  subject: lecture.subject,
  level: lecture.level,
  createdBy: lecture.createdBy,
  requiresExam: lecture.requiresExam,
  requiresHomework: lecture.requiresHomework,
})

module.exports = {
  resolvePassingThreshold,
  buildLectureRequirements,
  getRestrictedLectureSnapshot,
}
