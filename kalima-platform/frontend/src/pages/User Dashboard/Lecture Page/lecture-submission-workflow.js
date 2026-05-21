import { pickFirstUrl, findFirstAttachmentLinkUrl } from "./lectureDisplay.utils"

const LEGACY_ATTACHMENT_GROUPS = ["pdfsandimages", "homeworks", "exams", "booklets"]

const createEmptyAssessment = () => ({
  required: false,
  verified: false,
  data: null,
  submission: null,
  url: "",
  status: "pending",
  score: null,
  maxScore: null,
  requiredScore: null,
  error: null,
})

export const createEmptyAssessments = () => ({
  exam: createEmptyAssessment(),
  homework: createEmptyAssessment(),
})

export const createEmptyAttachmentGroups = () => ({
  exams: [],
  booklets: [],
  homeworks: [],
  pdfsandimages: [],
})

export const flattenLectureAttachments = (attachmentGroups = {}) =>
  LEGACY_ATTACHMENT_GROUPS.flatMap((groupKey) =>
    (attachmentGroups?.[groupKey] || []).map((attachment) => ({
      ...attachment,
      sourceType: attachment?.sourceType || groupKey,
    })),
  )

const mapRequirementToAssessment = (requirement, responseUrlKey) => {
  if (!requirement) {
    return createEmptyAssessment()
  }

  const submission = requirement.submission || null
  const status =
    requirement.status ||
    (requirement.passed || submission?.passed ? "passed" : "pending")
  const url = pickFirstUrl(
    requirement[responseUrlKey],
    requirement.url,
    requirement.data?.[responseUrlKey],
    requirement.data?.url,
  )
  const requiredScore =
    requirement.requiredScore ??
    requirement.passingThreshold ??
    requirement.data?.requiredScore ??
    requirement.data?.passingThreshold ??
    submission?.passingThreshold ??
    null
  const score = requirement.score ?? submission?.score ?? null
  const maxScore = requirement.maxScore ?? submission?.maxScore ?? null
  const error = requirement.error || submission?.syncError || null

  return {
    required: Boolean(requirement.required),
    verified: Boolean(requirement.passed || submission?.passed),
    data: {
      ...(requirement.data || {}),
      [responseUrlKey]: pickFirstUrl(requirement.data?.[responseUrlKey], url),
      url,
      passingThreshold: requiredScore,
      requiredScore,
      status,
      score,
      maxScore,
      error,
    },
    submission,
    url: url || "",
    status,
    score,
    maxScore,
    requiredScore,
    error,
  }
}

export const mapRequirementsToAssessments = (requirements) => {
  if (!requirements) {
    return createEmptyAssessments()
  }

  return {
    exam: mapRequirementToAssessment(requirements.exam, "examUrl"),
    homework: mapRequirementToAssessment(requirements.homework, "homeworkUrl"),
  }
}

export const resolveAssessmentFormUrls = ({ lecture, attachments, assessments }) => {
  const legacyExamFormUrl = pickFirstUrl(
    lecture?.examLink,
    lecture?.examFormLink,
    lecture?.examUrl,
    findFirstAttachmentLinkUrl(attachments?.exams),
  )

  const legacyHomeworkFormUrl = pickFirstUrl(
    lecture?.homeworkFormLink,
    lecture?.homeworkLink,
    lecture?.homeworkUrl,
    findFirstAttachmentLinkUrl(attachments?.homeworks),
  )

  return {
    exam: pickFirstUrl(
      assessments?.exam?.data?.examUrl,
      assessments?.exam?.data?.url,
      assessments?.exam?.url,
      legacyExamFormUrl,
    ),
    homework: pickFirstUrl(
      assessments?.homework?.data?.homeworkUrl,
      assessments?.homework?.data?.url,
      assessments?.homework?.url,
      legacyHomeworkFormUrl,
    ),
  }
}

export const normalizeLecturePageData = (result, lectureId) => {
  const payload = result?.data?.data || result?.data || result || {}
  const attachments = payload.attachments || createEmptyAttachmentGroups()
  const assessments = mapRequirementsToAssessments(payload.requirements)
  const accessData = payload.accessData || null

  return {
    lecture: payload.lecture || null,
    user: payload.user || null,
    attachments,
    allAttachments: flattenLectureAttachments(attachments),
    homeworks: Array.isArray(payload.homeworks) ? payload.homeworks : [],
    assessments,
    accessData,
    accessDataLoaded: Boolean(payload.user?.role !== "Student" || accessData || lectureId),
  }
}

export const uploadLectureHomeworkFiles = async ({ lectureId, files, uploadHomework }) => {
  const uploads = files.map((file) =>
    uploadHomework(lectureId, {
      type: "homeworks",
      attachment: file,
    }),
  )

  const results = await Promise.all(uploads)
  const failedUpload = results.find((result) => !result.success)

  if (failedUpload) {
    throw new Error(failedUpload.error || "Failed to upload homework")
  }

  return results
}
