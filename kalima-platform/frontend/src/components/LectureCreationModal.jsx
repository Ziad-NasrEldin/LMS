"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { FiX, FiPaperclip, FiImage, FiLink } from "react-icons/fi"
import { getAllLevels } from "../routes/levels"
import { getAllSubjects } from "../routes/courses"
import { getLectureAttachments } from "../routes/lectures"
import { resolveUploadUrl } from "../utils/uploadUrl"
import { translateErrorMessage } from "../utils/errorTranslator"
import { buildLecturePayloadObject } from "../utils/contentCreationPayloads"
import { buildLevelHierarchy } from "../utils/levelHierarchy"
import {
  MIN_LIMITED_LECTURE_DURATION_HOURS,
  formatLimitedLectureRemaining,
  getLimitedLectureAvailabilityStatus,
} from "../utils/limitedLectureAvailability"
import DSSelect from "./DSSelect"
import Button from "./ui/Button"
import Input from "./ui/Input"
import Textarea from "./ui/Textarea"
import Badge from "./ui/Badge"

const ATTACHMENT_BUCKET_KEYS = ["pdfsandimages", "booklets", "homeworks", "exams"]
const ATTACHMENT_FILE_BUCKET_KEY = "pdfsandimages"
const FORM_LINK_KEYS = ["homeworks", "exams"]

const createEmptyAttachmentBuckets = () =>
  ATTACHMENT_BUCKET_KEYS.reduce((acc, key) => ({ ...acc, [key]: [] }), {})

const createEmptyLinkBuckets = () =>
  FORM_LINK_KEYS.reduce((acc, key) => ({ ...acc, [key]: "" }), {})

const flattenAttachmentBuckets = (attachmentBuckets) =>
  ATTACHMENT_BUCKET_KEYS.flatMap((category) =>
    (attachmentBuckets?.[category] || []).map((attachment) => ({ ...attachment, category }))
  )

const normalizeExistingAttachment = (attachment) => {
  const filePath = attachment?.filePath || ""
  const fileType = attachment?.fileType || "file"
  const displayName =
    attachment?.fileName || attachment?.name || attachment?.title || attachment?.originalName || filePath.split("/").pop() || "Attachment"

  return {
    id: attachment?._id || attachment?.id || `${displayName}-${attachment?.uploadedOn || attachment?.createdAt || ""}`,
    fileName: displayName,
    filePath: resolveUploadUrl(filePath) || filePath,
    fileType,
    uploadedOn: attachment?.uploadedOn || attachment?.createdAt || null,
    isExisting: true,
  }
}

const TOKENS = {
  radius: { card: "rounded-xl", section: "rounded-2xl", modal: "rounded-[2rem]", full: "rounded-full" },
  spacing: { tight: "gap-3", default: "gap-4", section: "gap-6", loose: "gap-8" },
  surface: {
    card: "bg-white shadow-sm",
    highlighted: "bg-slate-50",
    summary: "bg-amber-50/30 border border-amber-200/60",
    gradient: "bg-gradient-to-br from-white to-primary/5",
  },
  typography: {
    meta: "text-xs font-bold uppercase tracking-wider",
    sectionTitle: "text-lg font-bold text-slate-900",
    cardTitle: "font-semibold text-slate-900",
    label: "text-sm font-medium text-slate-700",
    value: "text-sm font-semibold text-slate-900",
    hint: "text-xs text-slate-600",
  },
}

const Card = ({ children, variant = "default", className = "" }) => {
  const baseClasses = `${TOKENS.radius.card} ${TOKENS.spacing.tight} flex flex-col`
  const variantClasses = {
    default: TOKENS.surface.card,
    highlighted: TOKENS.surface.highlighted,
    summary: TOKENS.surface.summary,
    gradient: `${TOKENS.surface.gradient} ${TOKENS.surface.card}`,
  }
  return <div className={`${baseClasses} ${variantClasses[variant]} p-4 ${className}`}>{children}</div>
}

const InputWithIcon = ({ icon: Icon, children, className = "" }) => (
  <div className={`relative ${className}`}>
    {children}
    {Icon && <Icon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50 pointer-events-none" />}
  </div>
)

const SectionHeader = ({ number, title, subtitle, variant = "primary" }) => {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    accent: "bg-accent/10 text-accent",
  }
  return (
    <div className={`${TOKENS.spacing.tight} mb-5 flex items-center`}>
      <div className={`flex h-10 w-10 items-center justify-center ${TOKENS.radius.card} ${colorClasses[variant]} text-sm font-bold`}>
        {number}
      </div>
      <div>
        <h4 className={TOKENS.typography.sectionTitle}>{title}</h4>
        <p className={TOKENS.typography.label}>{subtitle}</p>
      </div>
    </div>
  )
}

const FormField = ({ label, children, fullWidth = false, className = "" }) => (
  <div className={`flex flex-col gap-2 ${fullWidth ? "md:col-span-2" : ""} ${className}`}>
    <label className="text-sm font-semibold text-slate-700">{label}</label>
    {children}
  </div>
)

const ToggleCard = ({ title, enabled, onToggle, children, t }) => (
  <Card variant="highlighted">
    <div className={`${TOKENS.spacing.tight} mb-3 flex items-center justify-between`}>
      <h5 className={TOKENS.typography.cardTitle}>{title}</h5>
      <DSSelect className="border border-slate-200 text-sm rounded-lg px-2 py-1" value={enabled} onChange={(e) => onToggle(e.target.value === "true")}>
        <option value={false}>{t("options.no")}</option>
        <option value={true}>{t("options.yes")}</option>
      </DSSelect>
    </div>
    {enabled && <div className={`${TOKENS.spacing.default} flex flex-col`}>{children}</div>}
  </Card>
)

const AssessmentConfig = ({ type, config, onToggle, onUrlChange, onThresholdChange, t }) => {
  const { enabled, formUrl, passingThreshold } = config
  const isExam = type === "exam"
  const title = isExam ? t("fields.requiresExam") : t("fields.requiresHomework")
  const urlLabel = t("attachments.formUrl", "Google Form URL")
  const urlPlaceholder = t("attachments.formUrlPlaceholder", isExam ? "Paste exam form URL" : "Paste homework form URL")
  const thresholdLabel = t("examConfig.passingThreshold", "Passing Threshold (%)")
  const thresholdHelper = t(
    "examConfig.thresholdHelper",
    "Use a percentage, not raw points. Example: 60 means 60%."
  )
  return (
    <ToggleCard title={title} enabled={enabled} onToggle={onToggle} t={t}>
      <FormField label={urlLabel}>
        <Input
          type="url"
          className={`w-full ${TOKENS.radius.section}`}
          placeholder={urlPlaceholder}
          value={formUrl}
          onChange={(e) => onUrlChange(e.target.value)}
        />
      </FormField>
      <FormField label={thresholdLabel}>
        <Input
          type="number"
          className={`w-full ${TOKENS.radius.section}`}
          value={passingThreshold}
          onChange={(e) => onThresholdChange(Number(e.target.value))}
          helperText={thresholdHelper}
          min="0"
          max="100"
        />
      </FormField>
    </ToggleCard>
  )
}


const SummaryRow = ({ label, value, loading = false }) => (
  <div className={`${TOKENS.radius.card} ${TOKENS.surface.summary} flex items-center justify-between gap-3 px-4 py-3`}>
    <span className={`${TOKENS.typography.label} flex-shrink-0`}>{label}</span>
    <span className={`${TOKENS.typography.value} text-right truncate flex-1`}>
      {loading ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> : value}
    </span>
  </div>
)

const AttachmentListItem = ({ attachment, categoryLabel }) => (
  <li className={`${TOKENS.spacing.tight} flex flex-col ${TOKENS.radius.card} bg-slate-100 px-3 py-2`}>
    <div className="flex items-center justify-between">
      <span className="font-medium text-slate-900">{attachment.fileName}</span>
      {categoryLabel ? <Badge>{categoryLabel}</Badge> : null}
    </div>
    <a href={attachment.filePath} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 break-all text-xs text-primary hover:underline">
      <FiLink className="h-3 w-3" />
      Open file
    </a>
  </li>
)

const LectureCreationModal = ({
  isOpen,
  onClose,
  onSubmit,
  containerId,
  userId,
  containerLevel,
  containerSubject,
  containerType,
  mode = "create",
  initialData = null,
  lectureId = null,
  lecturerCourseOptions = [],
  lecturerContainerOptionsByCourse = {},
}) => {
  const { t, i18n } = useTranslation(["lecturesPage"])
  const isRTL = i18n.language === "ar"
  const isEditMode = mode === "edit"
  const usesSelectableParent = !isEditMode && !containerId

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    videoLink: "",
    numberOfViews: 0,
    limitedAvailabilityEnabled: false,
    limitedAvailabilityDurationHours: MIN_LIMITED_LECTURE_DURATION_HOURS,
  })

  const [assessmentConfig, setAssessmentConfig] = useState({
    exam: { enabled: false, formUrl: "", passingThreshold: 50 },
    homework: { enabled: false, formUrl: "", passingThreshold: 50 },
  })

  const [attachments, setAttachments] = useState({
    files: createEmptyAttachmentBuckets(),
    existing: createEmptyAttachmentBuckets(),
    links: createEmptyLinkBuckets(),
    existingLinks: createEmptyLinkBuckets(),
    selectedLinkType: "homeworks",
    activeLinkValue: "",
  })

  const [thumbnail, setThumbnail] = useState({ file: null, preview: null })
  const [metadata, setMetadata] = useState({
    level: containerLevel || "",
    subject: containerSubject || "",
    courseId: "",
    parentContainerId: "",
  })
  const [dropdownData, setDropdownData] = useState({ levels: [], subjects: [] })
  const [loading, setLoading] = useState({ levels: false, subjects: false, submit: false })
  const [error, setError] = useState("")

  const resetAttachments = useCallback(() => {
    setAttachments({
      files: createEmptyAttachmentBuckets(),
      existing: createEmptyAttachmentBuckets(),
      links: createEmptyLinkBuckets(),
      existingLinks: createEmptyLinkBuckets(),
      selectedLinkType: "homeworks",
      activeLinkValue: "",
    })
  }, [])

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      videoLink: "",
      numberOfViews: 0,
      limitedAvailabilityEnabled: false,
      limitedAvailabilityDurationHours: MIN_LIMITED_LECTURE_DURATION_HOURS,
    })
    setAssessmentConfig({
      exam: { enabled: false, formUrl: "", passingThreshold: 50 },
      homework: { enabled: false, formUrl: "", passingThreshold: 50 },
    })
    resetAttachments()
    setThumbnail({ file: null, preview: null })
    setMetadata({
      level: containerLevel || "",
      subject: containerSubject || "",
      courseId: "",
      parentContainerId: "",
    })
    setError("")
    if (isEditMode && initialData?.thumbnail) {
      setThumbnail((prev) => ({ ...prev, preview: resolveUploadUrl(initialData.thumbnail, "lecture_thumbnails") }))
    }
  }, [containerLevel, containerSubject, isEditMode, initialData, resetAttachments])

  const populateFromInitialData = useCallback(() => {
    if (!initialData) return

    setFormData({
      name: initialData.name || "",
      description: initialData.description || "",
      price: initialData.price ?? 0,
      videoLink: initialData.videoLink || "",
      numberOfViews: initialData.numberOfViews ?? 0,
      limitedAvailabilityEnabled: Boolean(initialData.limitedAvailabilityEnabled),
      limitedAvailabilityDurationHours:
        initialData.limitedAvailabilityDurationHours ?? MIN_LIMITED_LECTURE_DURATION_HOURS,
    })

    setAssessmentConfig({
      exam: {
        enabled: Boolean(initialData.requiresExam),
        formUrl: initialData.examFormUrl || initialData.examLink || initialData.examConfig?.formUrl || "",
        passingThreshold: initialData.passingThreshold ?? 50,
      },
      homework: {
        enabled: Boolean(initialData.requiresHomework),
        formUrl: initialData.homeworkFormUrl || initialData.homeworkLink || initialData.homeworkConfig?.formUrl || "",
        passingThreshold: initialData.homeworkPassingThreshold ?? 50,
      },
    })

    setMetadata({
      level: initialData.level?._id || initialData.level || containerLevel || "",
      subject: initialData.subject?._id || initialData.subject || containerSubject || "",
      courseId: "",
      parentContainerId: "",
    })

    setThumbnail((prev) => ({
      ...prev,
      preview: initialData.thumbnail ? resolveUploadUrl(initialData.thumbnail, "lecture_thumbnails") : null,
    }))
  }, [initialData, containerLevel, containerSubject])

  const fetchLevels = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, levels: true }))
      const response = await getAllLevels()
      if (response.success) {
        const hierarchy = response.hierarchy || buildLevelHierarchy(response.data || [], i18n.language)
        setDropdownData((prev) => ({ ...prev, levels: hierarchy.gradeOptions || [] }))
      }
    } catch (error) {
      console.error("Error fetching levels:", error)
    } finally {
      setLoading((prev) => ({ ...prev, levels: false }))
    }
  }, [i18n.language])

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, subjects: true }))
      const response = await getAllSubjects()
      if (response.success) {
        setDropdownData((prev) => ({ ...prev, subjects: response.data }))
      }
    } catch (error) {
      console.error("Error fetching subjects:", error)
    } finally {
      setLoading((prev) => ({ ...prev, subjects: false }))
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    if (isOpen) {
      fetchLevels()
      fetchSubjects()

      if (isEditMode) {
        const loadEditData = async () => {
          populateFromInitialData()
          resetAttachments()

          const lectureAttachmentsId = initialData?._id || initialData?.id || lectureId
          if (!lectureAttachmentsId) return

          try {
            const result = await getLectureAttachments(lectureAttachmentsId)
            if (cancelled || result?.status !== "success" || !result.data) return

            const attachmentData = result.data
            const nextExisting = createEmptyAttachmentBuckets()
            const nextExistingLinks = createEmptyLinkBuckets()
            const nextPrefilledLinks = createEmptyLinkBuckets()

            ATTACHMENT_BUCKET_KEYS.forEach((category) => {
              const rawItems = Array.isArray(attachmentData?.[category]) ? attachmentData[category] : []
              const fileItems = rawItems.filter((item) => item?.fileType !== "link")
              nextExisting[category] = fileItems.map(normalizeExistingAttachment)

              if (category === "homeworks" || category === "exams") {
                const savedLink = rawItems.find((item) => item?.fileType === "link")?.filePath || ""
                nextExistingLinks[category] = savedLink
                nextPrefilledLinks[category] = savedLink
              }
            })

            const initialLinkType = nextExistingLinks.homeworks ? "homeworks" : nextExistingLinks.exams ? "exams" : "homeworks"

            setAttachments({
              files: createEmptyAttachmentBuckets(),
              existing: nextExisting,
              links: nextPrefilledLinks,
              existingLinks: nextExistingLinks,
              selectedLinkType: initialLinkType,
              activeLinkValue: nextExistingLinks[initialLinkType] || "",
            })
          } catch (error) {
            console.error("Error fetching lecture attachments for edit modal:", error)
          }
        }
        void loadEditData()
      } else {
        resetForm()
      }
    }

    return () => {
      cancelled = true
    }
  }, [isOpen, isEditMode, initialData, lectureId, containerLevel, containerSubject, fetchLevels, fetchSubjects, populateFromInitialData, resetAttachments, resetForm])

  useEffect(() => {
    if (!usesSelectableParent) return

    if (!metadata.courseId) {
      setMetadata((prev) => ({ ...prev, parentContainerId: "", level: "", subject: "" }))
      return
    }

    const nextCourseContainers = lecturerContainerOptionsByCourse[String(metadata.courseId)] || []
    const hasSelectedContainer = nextCourseContainers.some(
      (container) => String(container.value) === String(metadata.parentContainerId)
    )

    if (!hasSelectedContainer && metadata.parentContainerId) {
      setMetadata((prev) => ({ ...prev, parentContainerId: "" }))
    }

    const selectedCourseInfo = lecturerCourseOptions.find((course) => String(course.value) === String(metadata.courseId))
    const selectedContainerInfo = nextCourseContainers.find((container) => String(container.value) === String(metadata.parentContainerId))

    const nextLevelId = (hasSelectedContainer ? selectedContainerInfo?.levelId : null) || selectedCourseInfo?.levelId || ""
    const nextSubjectId = (hasSelectedContainer ? selectedContainerInfo?.subjectId : null) || selectedCourseInfo?.subjectId || ""

    setMetadata((prev) => ({ ...prev, level: nextLevelId, subject: nextSubjectId }))
  }, [usesSelectableParent, metadata.courseId, metadata.parentContainerId, lecturerCourseOptions, lecturerContainerOptionsByCourse])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }, [handleClose])

  const validateForm = useCallback(() => {
    if (!formData.name) throw new Error(t("validation.nameRequired"))
    if (usesSelectableParent && !metadata.courseId) throw new Error(t("validation.courseRequired"))
    if (usesSelectableParent && !metadata.parentContainerId) throw new Error(t("validation.containerRequired"))
    if (!metadata.level) throw new Error(t("validation.levelRequired"))
    if (!metadata.subject) throw new Error(t("validation.subjectRequired"))
    if (!formData.videoLink) throw new Error(t("validation.videoLinkRequired"))
    if (
      formData.limitedAvailabilityEnabled &&
      Number(formData.limitedAvailabilityDurationHours) < MIN_LIMITED_LECTURE_DURATION_HOURS
    ) {
      throw new Error(
        isRTL
          ? `مدة إتاحة المحاضرة يجب ألا تقل عن ${MIN_LIMITED_LECTURE_DURATION_HOURS} ساعة`
          : `Limited lecture duration must be at least ${MIN_LIMITED_LECTURE_DURATION_HOURS} hours`,
      )
    }
    if (assessmentConfig.exam.enabled && !assessmentConfig.exam.formUrl) {
      throw new Error(t("validation.examFormUrlRequired", "Exam form URL is required"))
    }
    if (assessmentConfig.homework.enabled && !assessmentConfig.homework.formUrl) {
      throw new Error(t("validation.homeworkFormUrlRequired", "Homework form URL is required"))
    }
  }, [formData, metadata, assessmentConfig, usesSelectableParent, t, isRTL])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setLoading((prev) => ({ ...prev, submit: true }))
    setError("")

    try {
      validateForm()

      const lectureData = buildLecturePayloadObject({
        name: formData.name,
        level: metadata.level,
        subject: metadata.subject,
        price: Number(formData.price) || 0,
        description: formData.description || `${t("defaults.lectureDescription")} ${formData.name}`,
        numberOfViews: Number(formData.numberOfViews) || 0,
        videoLink: formData.videoLink,
        teacherAllowed: true,
        limitedAvailabilityEnabled: formData.limitedAvailabilityEnabled,
        limitedAvailabilityDurationHours: Number(formData.limitedAvailabilityDurationHours),
        requiresExam: assessmentConfig.exam.enabled,
        examFormUrl: assessmentConfig.exam.formUrl,
        passingThreshold: Number(assessmentConfig.exam.passingThreshold),
        requiresHomework: assessmentConfig.homework.enabled,
        homeworkFormUrl: assessmentConfig.homework.formUrl,
        homeworkPassingThreshold: Number(assessmentConfig.homework.passingThreshold),
        createdBy: !isEditMode ? userId : undefined,
        parent: !isEditMode ? (containerId || metadata.parentContainerId) : undefined,
      })

      await onSubmit(
        isEditMode ? lectureId || initialData?._id || initialData?.id : lectureData,
        isEditMode ? lectureData : null,
        null,
        thumbnail.file,
        attachments.files,
        attachments.links,
        attachments.existingLinks
      )

      resetForm()
      onClose()
    } catch (err) {
      setError(translateErrorMessage(err.message))
      console.error("Creation error:", err)
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }))
    }
  }, [formData, metadata, assessmentConfig, thumbnail.file, attachments, isEditMode, lectureId, initialData, userId, containerId, onSubmit, onClose, resetForm, validateForm, t])

  const handleThumbnailChange = useCallback((e) => {
    const file = e.target.files[0]
    if (file) {
      setThumbnail({ file, preview: URL.createObjectURL(file) })
    }
  }, [])

  const handleFormLinkTypeChange = useCallback((nextType) => {
    const nextUrl = attachments.links[nextType] || attachments.existingLinks[nextType] || ""
    setAttachments((prev) => ({ ...prev, selectedLinkType: nextType, activeLinkValue: nextUrl }))
  }, [attachments.links, attachments.existingLinks])

  const handleFormLinkChange = useCallback((value) => {
    setAttachments((prev) => ({
      ...prev,
      activeLinkValue: value,
      links: { ...prev.links, [prev.selectedLinkType]: value },
    }))
  }, [])

  const handleAssessmentToggle = useCallback((type, enabled) => {
    setAssessmentConfig((prev) => ({ ...prev, [type]: { ...prev[type], enabled } }))
  }, [])

  const handleAssessmentUrlChange = useCallback((type, value) => {
    setAssessmentConfig((prev) => ({ ...prev, [type]: { ...prev[type], formUrl: value } }))
  }, [])

  const handleAssessmentThresholdChange = useCallback((type, value) => {
    setAssessmentConfig((prev) => ({ ...prev, [type]: { ...prev[type], passingThreshold: value } }))
  }, [])

  const handleAttachmentFilesChange = useCallback((files) => {
    setAttachments((prev) => ({
      ...prev,
      files: { ...createEmptyAttachmentBuckets(), [ATTACHMENT_FILE_BUCKET_KEY]: files },
    }))
  }, [])

  const selectedLabels = useMemo(() => {
    const selectedLevelInfo = dropdownData.levels.find((level) => (level.value || level._id) === metadata.level)
    const selectedSubjectInfo = dropdownData.subjects.find((subject) => subject._id === metadata.subject)
    const selectedCourseInfo = lecturerCourseOptions.find((course) => String(course.value) === String(metadata.courseId))
    const availableContainers = lecturerContainerOptionsByCourse[String(metadata.courseId)] || []
    const selectedContainerInfo = availableContainers.find((container) => String(container.value) === String(metadata.parentContainerId))

    return {
      level: selectedLevelInfo?.label || selectedLevelInfo?.displayName || selectedLevelInfo?.name || "",
      subject: selectedSubjectInfo?.name || "",
      course: selectedCourseInfo?.label || "",
      container: selectedContainerInfo?.label || "",
    }
  }, [dropdownData, metadata, lecturerCourseOptions, lecturerContainerOptionsByCourse])

  const attachmentStats = useMemo(() => {
    const saved = flattenAttachmentBuckets(attachments.existing)
    const newFiles = attachments.files[ATTACHMENT_FILE_BUCKET_KEY] || []
    const existingTotal = Object.values(attachments.existing).reduce((count, files) => count + (files?.length || 0), 0)
    const newTotal = Object.values(attachments.files).reduce((count, files) => count + (files?.length || 0), 0)

    const existingLinks = FORM_LINK_KEYS
      .map((key) => ({ key, label: key === "homeworks" ? t("attachments.homeworkType", "Homework") : t("attachments.examType", "Exam"), url: attachments.existingLinks[key] }))
      .filter((item) => Boolean(item.url))

    return { saved, newFiles, total: newTotal + existingTotal, existingLinks }
  }, [attachments, t])

  if (!isOpen) return null

  const titleText = isEditMode ? (isRTL ? "تعديل المحاضرة" : "Edit Lecture") : t("titles.createNewLecture")
  const limitedAvailabilityStatus = getLimitedLectureAvailabilityStatus({
    limitedAvailabilityEnabled: formData.limitedAvailabilityEnabled,
    limitedAvailabilityStartsAt: initialData?.limitedAvailabilityStartsAt,
    limitedAvailabilityEndsAt: initialData?.limitedAvailabilityEndsAt,
  })
  const limitedAvailabilityStatusLabel = !formData.limitedAvailabilityEnabled
    ? (isRTL ? "غير مفعلة" : "Disabled")
    : limitedAvailabilityStatus.isExpired
      ? (isRTL ? "منتهية" : "Expired")
      : (isRTL ? "نشطة" : "Active")

    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isOpen ? "block" : "hidden"}`} onClick={handleBackdropClick}>
        <div className={`relative w-11/12 max-w-7xl h-[92vh] max-h-[92vh] overflow-hidden ${TOKENS.surface.card} ${TOKENS.radius.modal} p-0 shadow-2xl flex flex-col`}>
    <div className={`flex items-start justify-between ${TOKENS.spacing.default} border-b border-slate-200 px-6 py-5 sm:px-8 flex-shrink-0`}>
      <div className="min-w-0">
        <p className={`${TOKENS.typography.meta} text-primary/70`}>{titleText}</p>
        <h3 className="mt-1 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">{titleText}</h3>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">{t("descriptions.createNewLectureModal")}</p>
      </div>
      <Button variant="ghost" size="sm" className="rounded-full p-2 shrink-0" onClick={handleClose}>
        <FiX className="w-5 h-5" />
      </Button>
    </div>


        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 min-h-0">
            <div className={`grid ${TOKENS.spacing.section} lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,380px)] max-w-full`}>
              <div className={`${TOKENS.spacing.section} flex flex-col`}>
                <section className={`${TOKENS.surface.card} ${TOKENS.radius.section} p-5`}>
                  <SectionHeader
                    number={1}
                    title={t("sections.contentBasics")}
                    subtitle={`${t("fields.name")}, ${t("fields.description")}, ${t("fields.price")}, ${t("fields.videoURL")}`}
                    variant="primary"
                  />

                  <div className={`grid ${TOKENS.spacing.default} md:grid-cols-2`}>
                   <FormField label={t("fields.name")} fullWidth>
                     <Input
                       type="text"
                       placeholder={t("placeholders.enterLectureName")}
                       className={`w-full ${TOKENS.radius.section}`}
                       value={formData.name}
                       onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                       required
                     />
                   </FormField>
                   <FormField label={t("fields.description")} fullWidth>
                     <Textarea
                       placeholder={t("placeholders.enterDescription")}
                       className={`min-h-32 w-full ${TOKENS.radius.section}`}
                       value={formData.description}
                       onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                     />
                   </FormField>
                   <FormField label={t("fields.price")}>
                     <Input
                       type="number"
                       placeholder={t("placeholders.enterPrice")}
                       className={`w-full ${TOKENS.radius.section}`}
                       value={formData.price}
                       onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                       min="0"
                       required
                     />
                   </FormField>
                   <FormField label={t("fields.numberOfViews")}>
                     <Input
                       type="number"
                       placeholder={t("placeholders.enterNumberOfViews")}
                       className={`w-full ${TOKENS.radius.section}`}
                       value={formData.numberOfViews}
                       onChange={(e) => setFormData((prev) => ({ ...prev, numberOfViews: e.target.value }))}
                       min="0"
                       required
                     />
                   </FormField>
                   <FormField label={t("fields.videoURL")} fullWidth>
                     <Input
                       type="url"
                       placeholder={t("placeholders.enterVideoLink")}
                       className={`w-full ${TOKENS.radius.section}`}
                       value={formData.videoLink}
                       onChange={(e) => setFormData((prev) => ({ ...prev, videoLink: e.target.value }))}
                       required
                     />
                   </FormField>
                   <FormField label={t("fields.description")} fullWidth>
                     <Textarea
                       placeholder={t("placeholders.enterDescription")}
                       className={`min-h-32 w-full ${TOKENS.radius.section}`}
                       value={formData.description}
                       onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                     />
                   </FormField>
                   <FormField label={t("fields.price")}>
                     <Input
                       type="number"
                       placeholder={t("placeholders.enterPrice")}
                       className={`w-full ${TOKENS.radius.section}`}
                       value={formData.price}
                       onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                       min="0"
                       required
                     />
                   </FormField>
                   <FormField label={t("fields.numberOfViews")}>
                     <Input
                       type="number"
                       placeholder={t("placeholders.enterNumberOfViews")}
                       className={`w-full ${TOKENS.radius.section}`}
                       value={formData.numberOfViews}
                       onChange={(e) => setFormData((prev) => ({ ...prev, numberOfViews: e.target.value }))}
                       min="0"
                       required
                     />
                   </FormField>
                   <FormField label={t("fields.videoURL")} fullWidth>
                      <Input
                        type="url"
                        placeholder={t("placeholders.enterVideoLink")}
                        className={`w-full ${TOKENS.radius.section}`}
                        value={formData.videoLink}
                        onChange={(e) => setFormData((prev) => ({ ...prev, videoLink: e.target.value }))}
                        required
                      />
                    </FormField>
                    <div className="md:col-span-2">
                      <ToggleCard
                        title={isRTL ? "محاضرة بمدة إتاحة محدودة" : "Limited lecture availability"}
                        enabled={formData.limitedAvailabilityEnabled}
                        onToggle={(enabled) =>
                          setFormData((prev) => ({ ...prev, limitedAvailabilityEnabled: enabled }))
                        }
                        t={t}
                      >
                        <FormField label={isRTL ? "مدة الإتاحة بالساعات" : "Availability Duration (Hours)"}>
                          <Input
                            type="number"
                            className={`w-full ${TOKENS.radius.section}`}
                            value={formData.limitedAvailabilityDurationHours}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                limitedAvailabilityDurationHours: e.target.value,
                              }))
                            }
                            min={MIN_LIMITED_LECTURE_DURATION_HOURS}
                          />
                        </FormField>
                        <p className={TOKENS.typography.hint}>
                          {isRTL
                            ? "يمكن شراء هذه المحاضرة مباشرة خلال هذه المدة فقط. بعد انتهاء المدة، أوقف الميزة ثم فعّلها مجددًا لإعادة فتح الشراء."
                            : "This lecture can be purchased directly only during this window. After expiry, disable it and enable it again to reopen purchases."}
                        </p>
                        {isEditMode && (
                          <div className={`${TOKENS.radius.card} bg-white px-3 py-2 text-sm text-slate-700`}>
                            <p>
                              {isRTL ? "الحالة الحالية:" : "Current status:"}{" "}
                              <span className="font-semibold text-slate-900">{limitedAvailabilityStatusLabel}</span>
                            </p>
                            {initialData?.limitedAvailabilityEndsAt && (
                              <p className="mt-1">
                                {limitedAvailabilityStatus.isExpired
                                  ? (isRTL ? "انتهت الإتاحة في:" : "Expired at:")
                                  : (isRTL ? "تنتهي الإتاحة في:" : "Expires at:")}{" "}
                                <span className="font-semibold text-slate-900">
                                  {new Date(initialData.limitedAvailabilityEndsAt).toLocaleString(
                                    isRTL ? "ar-EG" : "en-US",
                                  )}
                                </span>
                              </p>
                            )}
                            {formData.limitedAvailabilityEnabled && !limitedAvailabilityStatus.isExpired && initialData?.limitedAvailabilityEndsAt && (
                              <p className="mt-1">
                                {isRTL ? "الوقت المتبقي:" : "Time remaining:"}{" "}
                                <span className="font-semibold text-slate-900">
                                  {formatLimitedLectureRemaining(limitedAvailabilityStatus.remainingMs, { isRTL })}
                                </span>
                              </p>
                            )}
                          </div>
                        )}
                      </ToggleCard>
                    </div>
                  </div>
                </section>



                <section className={`${TOKENS.surface.card} ${TOKENS.radius.section} p-5`}>
                  <SectionHeader
                    number={2}
                    title={t("sections.publishSettings")}
                    subtitle={usesSelectableParent
                      ? `${t("fields.course")}, ${t("fields.container")}, ${t("fields.level")}, ${t("fields.subject")}`
                      : `${t("fields.level")}, ${t("fields.subject")}, ${t("fields.requiresExam")}, ${t("fields.requiresHomework")}`}
                    variant="secondary"
                  />

                  <div className={`grid ${TOKENS.spacing.default} md:grid-cols-2`}>
                    {usesSelectableParent && (
                      <>
                        <FormField label={t("fields.course")}>
                      <DSSelect
                        className={`border border-slate-200 w-full ${TOKENS.radius.section}`}
                        value={metadata.courseId}
                        onChange={(e) => setMetadata((prev) => ({ ...prev, courseId: e.target.value }))}
                        required
                      >
                        <option value="">{t("placeholders.selectCourse")}</option>
                        {lecturerCourseOptions.map((course) => (
                          <option key={course.value} value={course.value}>{course.label}</option>
                        ))}
                      </DSSelect>
                    </FormField>
                    <FormField label={t("fields.container")}>
                      <DSSelect
                          className={`border border-slate-200 w-full ${TOKENS.radius.section}`}

                        value={metadata.parentContainerId}
                        onChange={(e) => setMetadata((prev) => ({ ...prev, parentContainerId: e.target.value }))}
                        required
                        disabled={!metadata.courseId}
                      >
                        <option value="">{t("placeholders.selectContainer")}</option>
                        {(lecturerContainerOptionsByCourse[String(metadata.courseId)] || []).map((container) => (
                          <option key={container.value} value={container.value}>{container.label}</option>
                        ))}
                      </DSSelect>
                    </FormField>
                    <FormField label={t("fields.container")}>
                      <DSSelect
                          className={`border border-slate-200 w-full ${TOKENS.radius.section}`}

                        value={metadata.parentContainerId}
                        onChange={(e) => setMetadata((prev) => ({ ...prev, parentContainerId: e.target.value }))}
                        required
                        disabled={!metadata.courseId}
                      >
                        <option value="">{t("placeholders.selectContainer")}</option>
                        {(lecturerContainerOptionsByCourse[String(metadata.courseId)] || []).map((container) => (
                          <option key={container.value} value={container.value}>{container.label}</option>
                        ))}
                      </DSSelect>
                    </FormField>

                        <FormField label={t("fields.container")}>
                      <DSSelect
                        className={`border border-slate-200 w-full ${TOKENS.radius.section}`}
                        value={metadata.parentContainerId}
                        onChange={(e) => setMetadata((prev) => ({ ...prev, parentContainerId: e.target.value }))}
                        required
                        disabled={!metadata.courseId}
                      >
                        <option value="">{t("placeholders.selectContainer")}</option>
                        {(lecturerContainerOptionsByCourse[String(metadata.courseId)] || []).map((container) => (
                          <option key={container.value} value={container.value}>{container.label}</option>
                        ))}
                      </DSSelect>
                    </FormField>
                    </>
                  )}



                     <FormField label={t("fields.level")}>
                       <DSSelect
                           className={`border border-slate-200 w-full ${TOKENS.radius.section}`}

                         value={metadata.level}
                         onChange={(e) => setMetadata((prev) => ({ ...prev, level: e.target.value }))}
                         disabled={usesSelectableParent}
                         required
                       >
                         <option value="">{t("placeholders.selectLevel")}</option>
                         {dropdownData.levels.map((level) => (
                           <option key={level.value || level._id} value={level.value || level._id}>
                             {level.label || level.displayName || level.name}
                           </option>
                         ))}
                       </DSSelect>
                        {loading.levels && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mt-2"></div>}

                     </FormField>
                     <FormField label={t("fields.subject")}>
                      <DSSelect
                        className={`border border-slate-200 w-full ${TOKENS.radius.section}`}
                        value={metadata.subject}
                        onChange={(e) => setMetadata((prev) => ({ ...prev, subject: e.target.value }))}
                        disabled={usesSelectableParent}
                        required
                      >
                        <option value="">{t("placeholders.selectSubject")}</option>
                        {dropdownData.subjects.map((subject) => (
                          <option key={subject._id} value={subject._id}>{subject.name}</option>
                        ))}
                      </DSSelect>
                      {loading.subjects && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mt-2"></div>}
                    </FormField>


                  </div>

                  <div className={`mt-4 grid ${TOKENS.spacing.default} xl:grid-cols-2`}>
                    <AssessmentConfig
                      type="exam"
                      config={assessmentConfig.exam}
                      onToggle={(enabled) => handleAssessmentToggle("exam", enabled)}
                      onUrlChange={(value) => handleAssessmentUrlChange("exam", value)}
                      onThresholdChange={(value) => handleAssessmentThresholdChange("exam", value)}
                      t={t}
                    />
                    <AssessmentConfig
                      type="homework"
                      config={assessmentConfig.homework}
                      onToggle={(enabled) => handleAssessmentToggle("homework", enabled)}
                      onUrlChange={(value) => handleAssessmentUrlChange("homework", value)}
                      onThresholdChange={(value) => handleAssessmentThresholdChange("homework", value)}
                      t={t}
                    />
                  </div>
                </section>

                <section className={`${TOKENS.surface.card} ${TOKENS.radius.section} p-5`}>
                  <SectionHeader
                    number={3}
                    title={t("sections.attachments")}
                    subtitle={t("fields.attachmentOptional")}
                    variant="accent"
                  />

                  <div className={`grid ${TOKENS.spacing.default} xl:grid-cols-2`}>
                    <Card variant="highlighted">
                      <div className={`flex items-start justify-between ${TOKENS.spacing.tight}`}>
                        <div>
                          <h5 className={TOKENS.typography.cardTitle}>{t("attachments.uploadTitle", "Lecture files")}</h5>
                          <p className={TOKENS.typography.hint}>
                            {t("attachments.uploadHelper", "Upload PDFs, PowerPoints, documents, images, or any other lecture files here.")}
                          </p>
                        </div>
                        <Badge>{attachmentStats.newFiles.length} {t("attachments.fileCount", "files")}</Badge>
                      </div>

                      {attachmentStats.saved.length > 0 && (
                        <Card className="mt-4">
                          <p className={`${TOKENS.typography.meta} mb-3 text-slate-900/50`}>
                            {t("attachments.savedFiles", "Saved files")}
                          </p>
                          <ul className={`${TOKENS.spacing.tight} flex flex-col`}>
                            {attachmentStats.saved.map((attachment) => (
                              <AttachmentListItem
                                key={attachment.id}
                                attachment={attachment}
                                categoryLabel={t("attachments.fileLabel", "File")}
                              />
                            ))}
                          </ul>
                        </Card>
                      )}

                      <div className="mt-4">
                        <InputWithIcon icon={FiPaperclip}>
                       <Input
                         type="file"
                         multiple
                         onChange={(e) => handleAttachmentFilesChange(Array.from(e.target.files || []))}
                         className={`file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 w-full ${TOKENS.radius.section} pr-12`}
                         accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,image/*,application/*"
                       />
                        </InputWithIcon>
                      </div>

                      {attachmentStats.newFiles.length > 0 && (
                        <ul className={`mt-3 ${TOKENS.spacing.tight} ${TOKENS.radius.section} bg-slate-100 p-4 text-sm text-slate-900/70`}>
                          {attachmentStats.newFiles.map((file, idx) => (
                            <li key={`${file.name}-${idx}`} className="break-all">{t("fields.selectedFile")}: {file.name}</li>
                          ))}
                        </ul>
                      )}

                      <p className={`mt-3 ${TOKENS.typography.hint}`}>
                        {t("attachments.uploadHint", "This box is for lecture resources only. The files are unified on the lecture page.")}
                      </p>
                    </Card>

                    <Card variant="highlighted">
                      <div className={`flex items-start justify-between ${TOKENS.spacing.tight}`}>
                        <div>
                          <h5 className={TOKENS.typography.cardTitle}>{t("attachments.googleFormTitle", "Google Form link")}</h5>
                          <p className={TOKENS.typography.hint}>
                            {t("attachments.googleFormHelper", "Use one Google Form link for the after-lecture exam or homework.")}
                          </p>
                        </div>
                        <Badge>
                          {attachments.selectedLinkType === "homeworks"
                            ? t("attachments.homeworkType", "Homework")
                            : t("attachments.examType", "Exam")}
                        </Badge>
                      </div>

                      <div className={`mt-4 grid ${TOKENS.spacing.tight} sm:grid-cols-[180px_minmax(0,1fr)] items-center`}>
                        <FormField label={t("attachments.formType", "Form type")} className="px-0 pt-0">
                        <DSSelect
                          className={`border border-slate-200 w-full ${TOKENS.radius.section}`}
                          value={attachments.selectedLinkType}
                          onChange={(e) => handleFormLinkTypeChange(e.target.value)}
                        >

                         <option value="homeworks">{t("attachments.homeworkType", "Homework")}</option>
                         <option value="exams">{t("attachments.examType", "Exam")}</option>
                       </DSSelect>
                        </FormField>

                        <FormField label={t("attachments.formUrl", "Google Form URL")} className="px-0 pt-0">
                          <InputWithIcon icon={FiLink}>
                                <Input
                                  type="url"
                                  className={`border border-slate-200 w-full ${TOKENS.radius.section} pr-12`}
                                  placeholder={t("attachments.formUrlPlaceholder", "Paste the Google Form link here")}
                                  value={attachments.activeLinkValue}
                                  onChange={(e) => handleFormLinkChange(e.target.value)}
                                />

                          </InputWithIcon>
                          <span className={`mt-2 ${TOKENS.typography.hint}`}>
                            {t("attachments.formUrlHint", "Switch the form type if the link is for homework instead of exam, or vice versa.")}
                          </span>
                        </FormField>
                      </div>

                      {attachmentStats.existingLinks.length > 0 && (
                        <Card className="mt-4">
                          <p className={`${TOKENS.typography.meta} mb-3 text-slate-900/50`}>
                            {t("attachments.savedLinks", "Saved links")}
                          </p>
                          <ul className={`${TOKENS.spacing.tight} flex flex-col`}>
                            {attachmentStats.existingLinks.map((link) => (
                              <li key={link.key} className={`flex flex-col ${TOKENS.spacing.tight} ${TOKENS.radius.card} bg-slate-100 px-3 py-2`}>
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-slate-900">{link.label}</span>
                                  <Badge variant="neutral">{link.label}</Badge>
                                </div>
                                <a href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 break-all text-xs text-primary hover:underline">
                                  <FiLink className="h-3 w-3" />
                                  {link.url}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </Card>
                      )}
                    </Card>
                  </div>
                </section>
              </div>

              <aside className={`${TOKENS.spacing.section} lg:sticky lg:top-0 self-start`}>
                <Card variant="gradient" className="mb-6">
                  <div className={`flex items-start justify-between ${TOKENS.spacing.default}`}>
                    <div>
                      <p className={`${TOKENS.typography.meta} text-primary/70`}>{t("sections.assetPreview")}</p>
                      <h4 className="mt-1 text-xl font-bold text-slate-900">{t("fields.thumbnail", "Thumbnail")}</h4>
                    </div>
                    <Badge>{containerType ? t(`types.${containerType}`, containerType) : t("notSpecified", "غير محدد")}</Badge>
                  </div>

                  <div className={`mt-4 overflow-hidden ${TOKENS.radius.section} border border-dashed border-primary/20 bg-white`}>
                    {thumbnail.preview ? (
                      <img src={thumbnail.preview || "/placeholder.svg"} alt="Thumbnail preview" className="h-52 w-full object-cover" />
                    ) : (
                      <div className={`flex h-52 flex-col items-center justify-center ${TOKENS.spacing.tight} px-6 text-center text-slate-900/50`}>
                        <div className={`${TOKENS.radius.full} bg-primary/10 p-4 text-primary`}>
                          <FiImage className="h-7 w-7" />
                        </div>
                        <div>
                          <p className="font-semibold">{t("fields.thumbnail", "Thumbnail")}</p>
                          <p className="text-sm">{t("placeholders.enterLectureName")}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <FormField label={t("fields.thumbnail", "Thumbnail")} className="px-0 pt-0">
                      <div className="mt-4">
                        <InputWithIcon icon={FiImage}>
                           <Input
                             type="file"
                             onChange={handleThumbnailChange}
                             className={`file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 w-full ${TOKENS.radius.section} pr-12`}
                             accept="image/*"
                           />
                        </InputWithIcon>
                      </div>
                    </FormField>
                    {thumbnail.file && (
                      <p className="mt-2 text-sm text-slate-900/70">
                        {t("fields.selectedFile", "Selected file")}: {thumbnail.file.name}
                      </p>
                    )}
                  </div>
                </Card>

                <Card className="mb-6">
                  <div className={`flex items-center justify-between ${TOKENS.spacing.tight}`}>
                    <h4 className={TOKENS.typography.sectionTitle}>{t("sections.publishSummary")}</h4>
                    <Badge variant="neutral">{attachmentStats.total} files</Badge>
                  </div>

                  <div className={`mt-4 ${TOKENS.spacing.tight} flex flex-col`}>
                    {usesSelectableParent && <SummaryRow label={t("fields.course")} value={selectedLabels.course || t("notSpecified", "غير محدد")} />}
                    {usesSelectableParent && <SummaryRow label={t("fields.container")} value={selectedLabels.container || t("notSpecified", "غير محدد")} />}
                    <SummaryRow label={t("fields.level")} value={selectedLabels.level || t("notSpecified", "غير محدد")} loading={loading.levels} />
                    <SummaryRow label={t("fields.subject")} value={selectedLabels.subject || t("notSpecified", "غير محدد")} loading={loading.subjects} />
                    <SummaryRow label={t("fields.price")} value={`${Number(formData.price) || 0}`} />
                    <SummaryRow label={t("fields.numberOfViews")} value={`${Number(formData.numberOfViews) || 0}`} />
                    <SummaryRow
                      label={isRTL ? "الإتاحة المحدودة" : "Limited availability"}
                      value={
                        formData.limitedAvailabilityEnabled
                          ? `${Number(formData.limitedAvailabilityDurationHours) || MIN_LIMITED_LECTURE_DURATION_HOURS} ${isRTL ? "ساعة" : "hours"}`
                          : (isRTL ? "غير مفعلة" : "Disabled")
                      }
                    />
                    <SummaryRow label={t("fields.requiresExam")} value={assessmentConfig.exam.enabled ? t("options.yes") : t("options.no")} />
                    <SummaryRow label={t("fields.requiresHomework")} value={assessmentConfig.homework.enabled ? t("options.yes") : t("options.no")} />
                    <SummaryRow label={t("sections.attachments")} value={String(attachmentStats.total)} />
                  </div>
                </Card>

                 {error && (
          <div className={`mb-4 rounded-2xl border border-error/30 bg-error/10 p-4 text-sm text-[#991B1B] shadow-sm flex items-center gap-3 ${TOKENS.radius.section}`}>
                     <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                     <span>{error}</span>
                   </div>
                 )}
              </aside>
            </div>
          </div>

           <div className="border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur sm:px-8 flex-shrink-0">
             <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
               <Button variant="ghost" className="rounded-full" onClick={handleClose} disabled={loading.submit}>
                 {t("buttons.cancel")}
               </Button>
               <Button variant="primary" className="rounded-full" disabled={loading.submit}>
                 {loading.submit ? (
                   <>
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                     {isEditMode ? (isRTL ? "جارٍ الحفظ" : "Saving...") : t("buttons.creating")}
                   </>
                 ) : (
                   isEditMode ? (isRTL ? "حفظ التغييرات" : "Save Changes") : t("buttons.create")
                 )}
               </Button>
             </div>
           </div>
        </form>
      </div>
    </div>
  )
}

export default LectureCreationModal
