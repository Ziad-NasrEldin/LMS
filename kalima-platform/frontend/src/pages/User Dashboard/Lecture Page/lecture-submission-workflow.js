import { pickFirstUrl, findFirstAttachmentLinkUrl } from "./lectureDisplay.utils"

const LEGACY_ATTACHMENT_GROUPS = ["pdfsandimages", "homeworks", "exams", "booklets"]

export const createEmptyAssessments = () => ({
  exam: { required: false, verified: false, data: null, submission: null, url: "" },
  homework: { required: false, verified: false, data: null, submission: null, url: "" },
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

export const mapRequirementsToAssessments = (requirements) => {
  if (!requirements) {
    return createEmptyAssessments()
  }

  return {
    exam: {
      required: Boolean(requirements.exam?.required),
      verified: Boolean(requirements.exam?.passed),
      data: requirements.exam?.data || null,
      submission: requirements.exam?.submission || null,
      url: requirements.exam?.url || "",
    },
    homework: {
      required: Boolean(requirements.homework?.required),
      verified: Boolean(requirements.homework?.passed),
      data: requirements.homework?.data || null,
      submission: requirements.homework?.submission || null,
      url: requirements.homework?.url || "",
    },
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
  const payload = result?.data || {}
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
