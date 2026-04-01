const ASSESSMENT_MAP = {
  exam: {
    requiresField: "requiresExam",
    configField: "examConfig",
    thresholdField: "passingThreshold",
    attachmentCategory: "exams",
    legacyUrlFields: ["examLink", "examFormLink", "examUrl"],
  },
  homework: {
    requiresField: "requiresHomework",
    configField: "homeworkConfig",
    thresholdField: "homeworkPassingThreshold",
    attachmentCategory: "homeworks",
    legacyUrlFields: ["homeworkFormLink", "homeworkLink", "homeworkUrl"],
  },
}

const normalizeUrl = (value) => {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

const getAttachmentLinkUrl = (attachment) => {
  if (!attachment) return null

  if (typeof attachment === "string") {
    return normalizeUrl(attachment)
  }

  if (typeof attachment === "object") {
    if (attachment.fileType === "link") {
      return normalizeUrl(attachment.filePath || attachment.fileName)
    }
    return normalizeUrl(attachment.filePath)
  }

  return null
}

const resolveLegacyAssessmentUrl = (lecture, assessmentType) => {
  const assessment = ASSESSMENT_MAP[assessmentType]

  if (!assessment || !lecture) return null

  for (const field of assessment.legacyUrlFields) {
    const directUrl = normalizeUrl(lecture[field])
    if (directUrl) return directUrl
  }

  const attachmentEntries = lecture?.attachments?.[assessment.attachmentCategory]
  if (Array.isArray(attachmentEntries)) {
    for (const entry of attachmentEntries) {
      const attachmentUrl = getAttachmentLinkUrl(entry)
      if (attachmentUrl) return attachmentUrl
    }
  }

  return null
}

const resolveAssessmentConfigUrl = (lecture, assessmentType) => {
  const assessment = ASSESSMENT_MAP[assessmentType]
  if (!assessment || !lecture) return null
  return normalizeUrl(lecture?.[assessment.configField]?.formUrl)
}

const resolvePassingThreshold = (lectureThreshold, configThreshold, fallback = 60) => {
  if (lectureThreshold !== undefined && lectureThreshold !== null) {
    return Number(lectureThreshold)
  }

  if (configThreshold !== undefined && configThreshold !== null) {
    return Number(configThreshold)
  }

  return fallback
}

const buildAssessmentRequirement = (lecture, assessmentType) => {
  const assessment = ASSESSMENT_MAP[assessmentType]

  if (!assessment || !lecture?.[assessment.requiresField]) {
    return null
  }

  const config = lecture?.[assessment.configField]
  const configUrl = resolveAssessmentConfigUrl(lecture, assessmentType)
  const legacyUrl = resolveLegacyAssessmentUrl(lecture, assessmentType)
  const resolvedUrl = configUrl || legacyUrl
  const source = configUrl ? "config" : legacyUrl ? "legacy" : null

  return {
    required: true,
    passed: false,
    url: resolvedUrl,
    source,
    passingThreshold: resolvePassingThreshold(
      lecture?.[assessment.thresholdField],
      config ? config.defaultPassingThreshold : undefined,
      60,
    ),
  }
}

const buildLectureRequirements = (lecture) => ({
  exam: buildAssessmentRequirement(lecture, "exam"),
  homework: buildAssessmentRequirement(lecture, "homework"),
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
  ASSESSMENT_MAP,
  resolvePassingThreshold,
  resolveLegacyAssessmentUrl,
  resolveAssessmentConfigUrl,
  buildAssessmentRequirement,
  buildLectureRequirements,
  getRestrictedLectureSnapshot,
}
