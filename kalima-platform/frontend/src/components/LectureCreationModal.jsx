"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { FiX, FiPaperclip, FiImage, FiLink } from "react-icons/fi"
import { getAllLevels } from "../routes/levels"
import { getAllSubjects } from "../routes/courses"
import { getLectureAttachments } from "../routes/lectures"
import { resolveUploadUrl } from "../utils/uploadUrl"
import { translateErrorMessage } from "../utils/errorTranslator"
import { buildLecturePayloadObject } from "../utils/contentCreationPayloads"
import { buildLevelHierarchy } from "../utils/levelHierarchy"
import DSSelect from "./DSSelect"

const ATTACHMENT_BUCKET_KEYS = ["pdfsandimages", "booklets", "homeworks", "exams"]
const FORM_LINK_KEYS = ["homeworks", "exams"]

const createEmptyAttachmentBuckets = () =>
  ATTACHMENT_BUCKET_KEYS.reduce(
    (acc, key) => {
      acc[key] = []
      return acc
    },
    {},
  )

const createEmptyLinkBuckets = () =>
  FORM_LINK_KEYS.reduce(
    (acc, key) => {
      acc[key] = ""
      return acc
    },
    {},
  )

const flattenAttachmentBuckets = (attachmentBuckets) =>
  ATTACHMENT_BUCKET_KEYS.flatMap((category) =>
    (attachmentBuckets?.[category] || []).map((attachment) => ({
      ...attachment,
      category,
    })),
  )

const SummaryRow = ({ label, value, loading = false }) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl border border-base-300 bg-base-100/80 px-4 py-3">
    <span className="text-sm font-medium text-base-content/60">{label}</span>
    <span className="text-sm font-semibold text-right text-base-content">
      {loading ? <span className="loading loading-spinner loading-xs"></span> : value}
    </span>
  </div>
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

  // Form state
  const [newItemName, setNewItemName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newPrice, setNewPrice] = useState(0)
  const [newVideoLink, setNewVideoLink] = useState("")
  const [attachmentFilesByCategory, setAttachmentFilesByCategory] = useState(createEmptyAttachmentBuckets())
  const [existingAttachmentsByCategory, setExistingAttachmentsByCategory] = useState({
    ...createEmptyAttachmentBuckets(),
  })
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  const [creationLoading, setCreationLoading] = useState(false)
  const [creationError, setCreationError] = useState("")
  const [numberOfViews, setNumberOfViews] = useState(0)
  const [attachmentLinksByCategory, setAttachmentLinksByCategory] = useState(createEmptyLinkBuckets())
  const [existingAttachmentLinksByCategory, setExistingAttachmentLinksByCategory] = useState(createEmptyLinkBuckets())
  const [selectedFormLinkType, setSelectedFormLinkType] = useState("homeworks")
  const [googleFormLink, setGoogleFormLink] = useState("")

  // Exam related state
  const [requiresExam, setRequiresExam] = useState(false)
  const [passingThreshold, setPassingThreshold] = useState(50)
  const [examFormUrl, setExamFormUrl] = useState("")

  // Homework related state
  const [requiresHomework, setRequiresHomework] = useState(false)
  const [homeworkPassingThreshold, setHomeworkPassingThreshold] = useState(50)
  const [homeworkFormUrl, setHomeworkFormUrl] = useState("")

  // Levels and subjects state
  const [levels, setLevels] = useState([])
  const [subjects, setSubjects] = useState([])
  const [levelsLoading, setLevelsLoading] = useState(false)
  const [subjectsLoading, setSubjectsLoading] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [selectedParentContainerId, setSelectedParentContainerId] = useState("")

  const usesSelectableParent = !isEditMode && !containerId
  const selectedCourseInfo = lecturerCourseOptions.find((course) => String(course.value) === String(selectedCourseId))
  const availableContainersForCourse = lecturerContainerOptionsByCourse[String(selectedCourseId)] || []
  const selectedParentContainerInfo = availableContainersForCourse.find(
    (containerOption) => String(containerOption.value) === String(selectedParentContainerId),
  )

  const normalizeExistingAttachment = (attachment) => {
    const filePath = attachment?.filePath || ""
    const fileType = attachment?.fileType || "file"
    const displayName =
      attachment?.fileName ||
      attachment?.name ||
      attachment?.title ||
      attachment?.originalName ||
      filePath.split("/").pop() ||
      "Attachment"

    return {
      id: attachment?._id || attachment?.id || `${displayName}-${attachment?.uploadedOn || attachment?.createdAt || ""}`,
      fileName: displayName,
      filePath: resolveUploadUrl(filePath) || filePath,
      fileType,
      uploadedOn: attachment?.uploadedOn || attachment?.createdAt || null,
      isExisting: true,
    }
  }

  const resetAttachmentState = () => {
    const resetBuckets = createEmptyAttachmentBuckets()
    const resetLinks = createEmptyLinkBuckets()
    setAttachmentFilesByCategory(resetBuckets)
    setExistingAttachmentsByCategory(resetBuckets)
    setAttachmentLinksByCategory(resetLinks)
    setExistingAttachmentLinksByCategory(resetLinks)
    setSelectedFormLinkType("homeworks")
    setGoogleFormLink("")
  }

  const populateFromInitialData = () => {
    if (!initialData) {
      return
    }

    setNewItemName(initialData.name || "")
    setNewDescription(initialData.description || "")
    setNewPrice(initialData.price ?? 0)
    setNewVideoLink(initialData.videoLink || "")
    setNumberOfViews(initialData.numberOfViews ?? 0)
    setRequiresExam(Boolean(initialData.requiresExam))
    setRequiresHomework(Boolean(initialData.requiresHomework))
    setPassingThreshold(initialData.passingThreshold ?? 50)
    setHomeworkPassingThreshold(initialData.homeworkPassingThreshold ?? 50)
    setExamFormUrl(
      initialData.examFormUrl ||
      initialData.examLink ||
      initialData.examConfig?.formUrl ||
      "",
    )
    setHomeworkFormUrl(
      initialData.homeworkFormUrl ||
      initialData.homeworkLink ||
      initialData.homeworkConfig?.formUrl ||
      "",
    )
    setSelectedCourseId("")
    setSelectedParentContainerId("")
    setSelectedLevel(initialData.level?._id || initialData.level || containerLevel || "")
    setSelectedSubject(initialData.subject?._id || initialData.subject || containerSubject || "")
    setThumbnailPreview(
      initialData.thumbnail ? resolveUploadUrl(initialData.thumbnail, "lecture_thumbnails") : null,
    )
  }

  // Fetch levels and subjects when modal opens
  useEffect(() => {
    let cancelled = false

    if (isOpen) {
      fetchLevels()
      fetchSubjects()

      if (isEditMode) {
        const loadEditData = async () => {
          populateFromInitialData()
          resetAttachmentState()

          const lectureAttachmentsId = initialData?._id || initialData?.id || lectureId
          if (!lectureAttachmentsId) return

          try {
            const result = await getLectureAttachments(lectureAttachmentsId)
            if (cancelled || result?.status !== "success" || !result.data) {
              return
            }

          const attachmentData = result.data
            const nextExistingAttachments = createEmptyAttachmentBuckets()
            const nextExistingLinks = createEmptyLinkBuckets()
            const nextPrefilledLinks = createEmptyLinkBuckets()

            ATTACHMENT_BUCKET_KEYS.forEach((category) => {
              const rawItems = Array.isArray(attachmentData?.[category]) ? attachmentData[category] : []
              const fileItems = rawItems.filter((item) => item?.fileType !== "link")
              const normalizedItems = fileItems.map(normalizeExistingAttachment)

              nextExistingAttachments[category] = normalizedItems

              if (category === "homeworks" || category === "exams") {
                const savedLink =
                  rawItems.find((item) => item?.fileType === "link")?.filePath ||
                  ""
                nextExistingLinks[category] = savedLink
                nextPrefilledLinks[category] = savedLink
              }
            })

            setExistingAttachmentsByCategory(nextExistingAttachments)
            setExistingAttachmentLinksByCategory(nextExistingLinks)
            setAttachmentLinksByCategory(nextPrefilledLinks)
            const initialLinkType = nextExistingLinks.homeworks
              ? "homeworks"
              : nextExistingLinks.exams
                ? "exams"
                : "homeworks"
            setSelectedFormLinkType(initialLinkType)
            setGoogleFormLink(nextExistingLinks[initialLinkType] || "")
          } catch (error) {
            console.error("Error fetching lecture attachments for edit modal:", error)
          }
        }

        void loadEditData()
      } else {
        resetAttachmentState()

        // Set default values from container if available
        setSelectedCourseId("")
        setSelectedParentContainerId("")
        if (containerLevel) {
          setSelectedLevel(containerLevel)
        }
        if (containerSubject) {
          setSelectedSubject(containerSubject)
        }
      }
    }

    return () => {
      cancelled = true
    }
  }, [isOpen, containerLevel, containerSubject, isEditMode, initialData, lectureId])

  // Functions to fetch levels and subjects
  const fetchLevels = async () => {
    try {
      setLevelsLoading(true)
      const response = await getAllLevels()
      if (response.success) {
        const hierarchy = response.hierarchy || buildLevelHierarchy(response.data || [], i18n.language)
        setLevels(hierarchy.gradeOptions || [])
      } else {
        console.error("Failed to fetch levels:", response.error)
      }
    } catch (error) {
      console.error("Error fetching levels:", error)
    } finally {
      setLevelsLoading(false)
    }
  }

  const fetchSubjects = async () => {
    try {
      setSubjectsLoading(true)
      const response = await getAllSubjects()
      if (response.success) {
        setSubjects(response.data)
      } else {
        console.error("Failed to fetch subjects:", response.error)
      }
    } catch (error) {
      console.error("Error fetching subjects:", error)
    } finally {
      setSubjectsLoading(false)
    }
  }

  // Reset form function
  const resetForm = () => {
    setNewItemName("")
    setNewDescription("")
    setNewPrice(0)
    setNewVideoLink("")
    setNewLectureType("Revision")
    resetAttachmentState()
    setThumbnailFile(null)
    setThumbnailPreview(null)
    setNumberOfViews(0)

    // Reset exam fields
    setRequiresExam(false)
    setPassingThreshold(50)
    setExamFormUrl("")

    // Reset homework fields
    setRequiresHomework(false)
    setHomeworkPassingThreshold(50)
    setHomeworkFormUrl("")

    setSelectedCourseId("")
    setSelectedParentContainerId("")
    setSelectedLevel(containerLevel || "")
    setSelectedSubject(containerSubject || "")
    setCreationError("")
    if (isEditMode && initialData?.thumbnail) {
      setThumbnailPreview(resolveUploadUrl(initialData.thumbnail, "lecture_thumbnails"))
    }
  }

  useEffect(() => {
    if (!usesSelectableParent) {
      return
    }

    if (!selectedCourseId) {
      setSelectedParentContainerId("")
      setSelectedLevel("")
      setSelectedSubject("")
      return
    }

    const nextCourseContainers = lecturerContainerOptionsByCourse[String(selectedCourseId)] || []
    const hasSelectedContainer = nextCourseContainers.some(
      (containerOption) => String(containerOption.value) === String(selectedParentContainerId),
    )

    if (!hasSelectedContainer && selectedParentContainerId) {
      setSelectedParentContainerId("")
    }

    const nextLevelId =
      (hasSelectedContainer ? selectedParentContainerInfo?.levelId : null) ||
      selectedCourseInfo?.levelId ||
      ""
    const nextSubjectId =
      (hasSelectedContainer ? selectedParentContainerInfo?.subjectId : null) ||
      selectedCourseInfo?.subjectId ||
      ""

    setSelectedLevel(nextLevelId)
    setSelectedSubject(nextSubjectId)
  }, [
    lecturerContainerOptionsByCourse,
    selectedCourseId,
    selectedCourseInfo?.levelId,
    selectedCourseInfo?.subjectId,
    selectedParentContainerId,
    selectedParentContainerInfo?.levelId,
    selectedParentContainerInfo?.subjectId,
    usesSelectableParent,
  ])

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCreationLoading(true)
    setCreationError("")

    try {
      if (!newItemName) throw new Error(t("validation.nameRequired"))
      if (usesSelectableParent && !selectedCourseId) throw new Error(t("validation.courseRequired"))
      if (usesSelectableParent && !selectedParentContainerId) throw new Error(t("validation.containerRequired"))
      if (!selectedLevel) throw new Error(t("validation.levelRequired"))
      if (!selectedSubject) throw new Error(t("validation.subjectRequired"))
      if (!newVideoLink) throw new Error(t("validation.videoLinkRequired"))

      // Prepare lecture data
      if (requiresExam && !examFormUrl) {
        throw new Error(t("validation.examFormUrlRequired", "Exam form URL is required"))
      }
      if (requiresHomework && !homeworkFormUrl) {
        throw new Error(t("validation.homeworkFormUrlRequired", "Homework form URL is required"))
      }

      const lectureData = buildLecturePayloadObject({
        name: newItemName,
        level: selectedLevel,
        subject: selectedSubject,
        price: Number(newPrice) || 0,
        description: newDescription || `${t("defaults.lectureDescription")} ${newItemName}`,
        numberOfViews: Number(numberOfViews) || 0,
        videoLink: newVideoLink,
        teacherAllowed: true,
        requiresExam,
        examFormUrl,
        passingThreshold: Number(passingThreshold),
        requiresHomework,
        homeworkFormUrl,
        homeworkPassingThreshold: Number(homeworkPassingThreshold),
        createdBy: !isEditMode ? userId : undefined,
        parent: !isEditMode ? (containerId || selectedParentContainerId) : undefined,
      })

      // Call onSubmit ONCE with all files and links for all categories
      await onSubmit(
        isEditMode ? lectureId || initialData?._id || initialData?.id : lectureData,
        isEditMode ? lectureData : null,
        null,
        thumbnailFile,
        attachmentFilesByCategory,
        attachmentLinksByCategory,
        existingAttachmentLinksByCategory,
      )

      resetForm()
      onClose()
    } catch (err) {
      setCreationError(translateErrorMessage(err.message))
      console.error("Creation error:", err)
    } finally {
      setCreationLoading(false)
    }
  }

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setThumbnailFile(file)

      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setThumbnailPreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const selectedLevelInfo = levels.find((level) => (level.value || level._id) === selectedLevel)
  const selectedSubjectInfo = subjects.find((subject) => subject._id === selectedSubject)
  const selectedCourseLabel = selectedCourseInfo?.label || ""
  const selectedParentContainerLabel = selectedParentContainerInfo?.label || ""
  const selectedLevelLabel = selectedLevelInfo?.label || selectedLevelInfo?.displayName || selectedLevelInfo?.name || ""
  const selectedSubjectLabel = selectedSubjectInfo?.name || ""
  const attachmentCategoryLabels = {
    pdfsandimages: t("attachmentTypes.pdfsAndImages"),
    booklets: t("attachmentTypes.booklets"),
    homeworks: t("attachmentTypes.homeworks"),
    exams: t("attachmentTypes.exams"),
  }
  const savedAttachments = flattenAttachmentBuckets(existingAttachmentsByCategory)
  const newAttachmentFiles = attachmentFilesByCategory.pdfsandimages || []
  const existingAttachmentLinks = FORM_LINK_KEYS
    .map((key) => ({
      key,
      label: key === "homeworks"
        ? t("attachments.homeworkType", "Homework")
        : t("attachments.examType", "Exam"),
      url: existingAttachmentLinksByCategory[key],
    }))
    .filter((item) => Boolean(item.url))
  const existingAttachmentsTotal = Object.values(existingAttachmentsByCategory).reduce(
    (count, files) => count + (files?.length || 0),
    0,
  )
  const totalAttachments = Object.values(attachmentFilesByCategory).reduce(
    (count, files) => count + (files?.length || 0),
    0,
  ) + existingAttachmentsTotal
  const handleUnifiedAttachmentFilesChange = (files) => {
    setAttachmentFilesByCategory({
      ...createEmptyAttachmentBuckets(),
      pdfsandimages: files,
    })
  }

  const handleFormLinkTypeChange = (nextType) => {
    setSelectedFormLinkType(nextType)
    const nextUrl = attachmentLinksByCategory[nextType] || existingAttachmentLinksByCategory[nextType] || ""
    setGoogleFormLink(nextUrl)
  }

  const handleFormLinkChange = (value) => {
    setGoogleFormLink(value)
    setAttachmentLinksByCategory((prev) => ({
      ...prev,
      [selectedFormLinkType]: value,
    }))
  }

  return (
    <div className={`modal ${isOpen ? "modal-open" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
      <div className="modal-box w-11/12 max-w-7xl h-[92vh] max-h-[92vh] overflow-hidden rounded-[2rem] border border-base-300 bg-base-100 p-0 shadow-2xl">
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-base-300 px-6 py-5 sm:px-8">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary/70">
                {isEditMode ? (isRTL ? "تعديل المحاضرة" : "Edit Lecture") : t("titles.createNewLecture")}
              </p>
              <h3 className="mt-1 text-2xl font-bold leading-tight text-base-content sm:text-3xl">
                {isEditMode ? (isRTL ? "تعديل المحاضرة" : "Edit Lecture") : t("titles.createNewLecture")}
              </h3>
              <p className="mt-2 max-w-3xl text-sm text-base-content/60">{t("descriptions.createNewLectureModal")}</p>
            </div>
            <button type="button" onClick={handleClose} className="btn btn-sm btn-circle btn-ghost shrink-0">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,380px)]">
                <div className="space-y-6">
                  <section className="rounded-[1.75rem] border border-base-300 bg-base-100 p-5 shadow-sm">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
                        1
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-base-content">{t("sections.contentBasics")}</h4>
                        <p className="text-sm text-base-content/60">{t("fields.name")}, {t("fields.description")}, {t("fields.price")}, {t("fields.videoURL")}</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="form-control md:col-span-2">
                        <label className="label">
                          <span className="label-text font-semibold">{t("fields.name")}</span>
                        </label>
                        <input
                          type="text"
                          placeholder={t("placeholders.enterLectureName")}
                          className="input input-bordered w-full rounded-2xl"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-control md:col-span-2">
                        <label className="label">
                          <span className="label-text font-semibold">{t("fields.description")}</span>
                        </label>
                        <textarea
                          placeholder={t("placeholders.enterDescription")}
                          className="textarea textarea-bordered min-h-32 w-full rounded-2xl"
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-semibold">{t("fields.price")}</span>
                        </label>
                        <input
                          type="number"
                          placeholder={t("placeholders.enterPrice")}
                          className="input input-bordered w-full rounded-2xl"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          min="0"
                          required
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-semibold">{t("fields.numberOfViews")}</span>
                        </label>
                        <input
                          type="number"
                          placeholder={t("placeholders.enterNumberOfViews")}
                          className="input input-bordered w-full rounded-2xl"
                          value={numberOfViews}
                          onChange={(e) => setNumberOfViews(e.target.value)}
                          min="0"
                          required
                        />
                      </div>

                      <div className="form-control md:col-span-2">
                        <label className="label">
                          <span className="label-text font-semibold">{t("fields.videoURL")}</span>
                        </label>
                        <input
                          type="url"
                          placeholder={t("placeholders.enterVideoLink")}
                          className="input input-bordered w-full rounded-2xl"
                          value={newVideoLink}
                          onChange={(e) => setNewVideoLink(e.target.value)}
                          required
                        />
                      </div>

                    </div>
                  </section>

                  <section className="rounded-[1.75rem] border border-base-300 bg-base-100 p-5 shadow-sm">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/10 text-sm font-bold text-secondary">
                        2
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-base-content">{t("sections.publishSettings")}</h4>
                        <p className="text-sm text-base-content/60">
                          {usesSelectableParent
                            ? `${t("fields.course")}, ${t("fields.container")}, ${t("fields.level")}, ${t("fields.subject")}`
                            : `${t("fields.level")}, ${t("fields.subject")}, ${t("fields.requiresExam")}, ${t("fields.requiresHomework")}`}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {usesSelectableParent && (
                        <>
                          <div className="form-control">
                            <label className="label">
                              <span className="label-text font-semibold">{t("fields.course")}</span>
                            </label>
                            <DSSelect
                              className="select select-bordered w-full rounded-2xl"
                              value={selectedCourseId}
                              onChange={(e) => setSelectedCourseId(e.target.value)}
                              required
                            >
                              <option value="">{t("placeholders.selectCourse")}</option>
                              {lecturerCourseOptions.map((course) => (
                                <option key={course.value} value={course.value}>
                                  {course.label}
                                </option>
                              ))}
                            </DSSelect>
                          </div>

                          <div className="form-control">
                            <label className="label">
                              <span className="label-text font-semibold">{t("fields.container")}</span>
                            </label>
                            <DSSelect
                              className="select select-bordered w-full rounded-2xl"
                              value={selectedParentContainerId}
                              onChange={(e) => setSelectedParentContainerId(e.target.value)}
                              required
                              disabled={!selectedCourseId}
                            >
                              <option value="">{t("placeholders.selectContainer")}</option>
                              {availableContainersForCourse.map((containerOption) => (
                                <option key={containerOption.value} value={containerOption.value}>
                                  {containerOption.label}
                                </option>
                              ))}
                            </DSSelect>
                          </div>
                        </>
                      )}

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-semibold">{t("fields.level")}</span>
                        </label>
                        <DSSelect
                          className="select select-bordered w-full rounded-2xl"
                          value={selectedLevel}
                          onChange={(e) => setSelectedLevel(e.target.value)}
                          disabled={usesSelectableParent}
                          required
                        >
                          <option value="">{t("placeholders.selectLevel")}</option>
                          {levels.map((level) => (
                            <option key={level.value || level._id} value={level.value || level._id}>
                              {level.label || level.displayName || level.name}
                            </option>
                          ))}
                        </DSSelect>
                        {levelsLoading && <span className="loading loading-spinner loading-sm mt-2"></span>}
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-semibold">{t("fields.subject")}</span>
                        </label>
                        <DSSelect
                          className="select select-bordered w-full rounded-2xl"
                          value={selectedSubject}
                          onChange={(e) => setSelectedSubject(e.target.value)}
                          disabled={usesSelectableParent}
                          required
                        >
                          <option value="">{t("placeholders.selectSubject")}</option>
                          {subjects.map((subject) => (
                            <option key={subject._id} value={subject._id}>
                              {subject.name}
                            </option>
                          ))}
                        </DSSelect>
                        {subjectsLoading && <span className="loading loading-spinner loading-sm mt-2"></span>}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-2">
                      <div className="rounded-[1.5rem] border border-base-300 bg-base-200/40 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h5 className="font-semibold text-base-content">{t("fields.requiresExam")}</h5>
                          <DSSelect
                            className="select select-bordered select-sm rounded-xl"
                            value={requiresExam}
                            onChange={(e) => setRequiresExam(e.target.value === "true")}
                          >
                            <option value={false}>{t("options.no")}</option>
                            <option value={true}>{t("options.yes")}</option>
                          </DSSelect>
                        </div>
                        {requiresExam && (
                          <div className="space-y-3">
                            <div className="form-control">
                              <label className="label px-0">
                                <span className="label-text font-semibold">
                                  {t("attachments.formUrl", "Google Form URL")}
                                </span>
                              </label>
                              <input
                                type="url"
                                className="input input-bordered w-full rounded-2xl"
                                placeholder={t("attachments.formUrlPlaceholder", "Paste exam form URL")}
                                value={examFormUrl}
                                onChange={(e) => setExamFormUrl(e.target.value)}
                              />
                            </div>
                            <div className="form-control">
                              <label className="label px-0">
                                <span className="label-text font-semibold">
                                  {t("examConfig.passingThreshold", "Passing Threshold")}
                                </span>
                              </label>
                              <input
                                type="number"
                                className="input input-bordered w-full rounded-2xl"
                                value={passingThreshold}
                                onChange={(e) => setPassingThreshold(Number(e.target.value))}
                                min="0"
                                max="100"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="rounded-[1.5rem] border border-base-300 bg-base-200/40 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h5 className="font-semibold text-base-content">{t("fields.requiresHomework")}</h5>
                          <DSSelect
                            className="select select-bordered select-sm rounded-xl"
                            value={requiresHomework}
                            onChange={(e) => setRequiresHomework(e.target.value === "true")}
                          >
                            <option value={false}>{t("options.no")}</option>
                            <option value={true}>{t("options.yes")}</option>
                          </DSSelect>
                        </div>
                        {requiresHomework && (
                          <div className="space-y-3">
                            <div className="form-control">
                              <label className="label px-0">
                                <span className="label-text font-semibold">
                                  {t("attachments.formUrl", "Google Form URL")}
                                </span>
                              </label>
                              <input
                                type="url"
                                className="input input-bordered w-full rounded-2xl"
                                placeholder={t("attachments.formUrlPlaceholder", "Paste homework form URL")}
                                value={homeworkFormUrl}
                                onChange={(e) => setHomeworkFormUrl(e.target.value)}
                              />
                            </div>
                            <div className="form-control">
                              <label className="label px-0">
                                <span className="label-text font-semibold">
                                  {t("examConfig.passingThreshold", "Passing Threshold")}
                                </span>
                              </label>
                              <input
                                type="number"
                                className="input input-bordered w-full rounded-2xl"
                                value={homeworkPassingThreshold}
                                onChange={(e) => setHomeworkPassingThreshold(Number(e.target.value))}
                                min="0"
                                max="100"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[1.75rem] border border-base-300 bg-base-100 p-5 shadow-sm">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-sm font-bold text-accent">
                        3
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-base-content">{t("sections.attachments")}</h4>
                        <p className="text-sm text-base-content/60">{t("fields.attachmentOptional")}</p>
                      </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                      <div className="rounded-[1.5rem] border border-base-300 bg-base-200/40 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h5 className="font-semibold text-base-content">
                              {t("attachments.uploadTitle", "Lecture files")}
                            </h5>
                            <p className="mt-1 text-sm text-base-content/60">
                              {t(
                                "attachments.uploadHelper",
                                "Upload PDFs, PowerPoints, documents, images, or any other lecture files here.",
                              )}
                            </p>
                          </div>
                          <span className="badge badge-outline badge-primary">
                            {newAttachmentFiles.length} {t("attachments.fileCount", "files")}
                          </span>
                        </div>

                        {savedAttachments.length > 0 && (
                          <div className="mt-4 rounded-2xl border border-base-300 bg-base-100 p-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
                              {t("attachments.savedFiles", "Saved files")}
                            </p>
                            <ul className="space-y-2 text-sm text-base-content/75">
                              {savedAttachments.map((attachment) => (
                                <li key={attachment.id} className="flex flex-col gap-2 rounded-xl bg-base-200/40 px-3 py-2">
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="font-medium text-base-content">{attachment.fileName}</span>
                                    <span className="badge badge-outline badge-sm">
                                      {attachmentCategoryLabels[attachment.category] || attachment.category}
                                    </span>
                                  </div>
                                  <a
                                    href={attachment.filePath}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 break-all text-xs text-primary underline-offset-2 hover:underline"
                                  >
                                    <FiLink className="h-3 w-3" />
                                    {t("attachments.openFile", "Open file")}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="relative mt-4">
                          <input
                            type="file"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files || [])
                              handleUnifiedAttachmentFilesChange(files)
                            }}
                            className="file-input file-input-bordered w-full rounded-2xl"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,image/*,application/*"
                          />
                          <FiPaperclip className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                        </div>

                        {newAttachmentFiles.length > 0 && (
                          <ul className="mt-3 space-y-1 rounded-2xl bg-base-200/50 p-4 text-sm text-base-content/70">
                            {newAttachmentFiles.map((file, idx) => (
                              <li key={`${file.name}-${idx}`} className="break-all">
                                {t("fields.selectedFile")}: {file.name}
                              </li>
                            ))}
                          </ul>
                        )}

                        <p className="mt-3 text-xs text-base-content/60">
                          {t(
                            "attachments.uploadHint",
                            "This box is for lecture resources only. The files are unified on the lecture page.",
                          )}
                        </p>
                      </div>

                      <div className="rounded-[1.5rem] border border-base-300 bg-base-200/40 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h5 className="font-semibold text-base-content">
                              {t("attachments.googleFormTitle", "Google Form link")}
                            </h5>
                            <p className="mt-1 text-sm text-base-content/60">
                              {t(
                                "attachments.googleFormHelper",
                                "Use one Google Form link for the after-lecture exam or homework.",
                              )}
                            </p>
                          </div>
                          <span className="badge badge-outline badge-primary">
                            {selectedFormLinkType === "homeworks"
                              ? t("attachments.homeworkType", "Homework")
                              : t("attachments.examType", "Exam")}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
                          <div className="form-control">
                            <label className="label px-0 pt-0">
                              <span className="label-text font-semibold">
                                {t("attachments.formType", "Form type")}
                              </span>
                            </label>
                            <DSSelect
                              className="select select-bordered w-full rounded-2xl"
                              value={selectedFormLinkType}
                              onChange={(e) => handleFormLinkTypeChange(e.target.value)}
                            >
                              <option value="homeworks">{t("attachments.homeworkType", "Homework")}</option>
                              <option value="exams">{t("attachments.examType", "Exam")}</option>
                            </DSSelect>
                          </div>

                          <div className="form-control">
                            <label className="label px-0 pt-0">
                              <span className="label-text font-semibold">
                                {t("attachments.formUrl", "Google Form URL")}
                              </span>
                            </label>
                            <div className="relative">
                              <input
                                type="url"
                                className="input input-bordered w-full rounded-2xl"
                                placeholder={t(
                                  "attachments.formUrlPlaceholder",
                                  "Paste the Google Form link here",
                                )}
                                value={googleFormLink}
                                onChange={(e) => handleFormLinkChange(e.target.value)}
                              />
                              <FiLink className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                            </div>
                            <span className="mt-2 text-xs text-base-content/60">
                              {t(
                                "attachments.formUrlHint",
                                "Switch the form type if the link is for homework instead of exam, or vice versa.",
                              )}
                            </span>
                          </div>
                        </div>

                        {existingAttachmentLinks.length > 0 && (
                          <div className="mt-4 rounded-2xl border border-base-300 bg-base-100 p-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
                              {t("attachments.savedLinks", "Saved links")}
                            </p>
                            <ul className="space-y-2 text-sm text-base-content/75">
                              {existingAttachmentLinks.map((link) => (
                                <li
                                  key={link.key}
                                  className="flex flex-col gap-2 rounded-xl bg-base-200/40 px-3 py-2"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="font-medium text-base-content">{link.label}</span>
                                    <span className="badge badge-outline badge-sm">{link.label}</span>
                                  </div>
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 break-all text-xs text-primary underline-offset-2 hover:underline"
                                  >
                                    <FiLink className="h-3 w-3" />
                                    {link.url}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                </div>

                <aside className="space-y-6 lg:sticky lg:top-0 self-start">
                  <section className="rounded-[1.75rem] border border-base-300 bg-gradient-to-br from-base-100 to-primary/5 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary/70">{t("sections.assetPreview")}</p>
                        <h4 className="mt-1 text-xl font-bold text-base-content">{t("fields.thumbnail", "Thumbnail")}</h4>
                      </div>
                      <span className="badge badge-outline badge-primary">
                        {containerType ? t(`types.${containerType}`, containerType) : t("lecturesPage.notSpecified")}
                      </span>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-dashed border-primary/20 bg-base-100">
                      {thumbnailPreview ? (
                        <img
                          src={thumbnailPreview || "/placeholder.svg"}
                          alt="Thumbnail preview"
                          className="h-52 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-52 flex-col items-center justify-center gap-3 px-6 text-center text-base-content/50">
                          <div className="rounded-full bg-primary/10 p-4 text-primary">
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
                      <label className="label px-0 pt-0">
                        <span className="label-text font-semibold">{t("fields.thumbnail", "Thumbnail")}</span>
                      </label>
                      <input
                        type="file"
                        onChange={handleThumbnailChange}
                        className="file-input file-input-bordered w-full rounded-2xl"
                        accept="image/*"
                      />
                      {thumbnailFile && (
                        <p className="mt-2 text-sm text-base-content/70">
                          {t("fields.selectedFile", "Selected file")}: {thumbnailFile.name}
                        </p>
                      )}
                    </div>
                  </section>

                  <section className="rounded-[1.75rem] border border-base-300 bg-base-100 p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-lg font-bold text-base-content">{t("sections.publishSummary")}</h4>
                      <span className="badge badge-neutral">{totalAttachments} files</span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {usesSelectableParent && (
                        <SummaryRow
                          label={t("fields.course")}
                          value={selectedCourseLabel || t("lecturesPage.notSpecified")}
                        />
                      )}
                      {usesSelectableParent && (
                        <SummaryRow
                          label={t("fields.container")}
                          value={selectedParentContainerLabel || t("lecturesPage.notSpecified")}
                        />
                      )}
                      <SummaryRow label={t("fields.level")} value={selectedLevelLabel || t("lecturesPage.notSpecified")} loading={levelsLoading} />
                      <SummaryRow label={t("fields.subject")} value={selectedSubjectLabel || t("lecturesPage.notSpecified")} loading={subjectsLoading} />
                      <SummaryRow label={t("fields.price")} value={`${Number(newPrice) || 0}`} />
                      <SummaryRow label={t("fields.numberOfViews")} value={`${Number(numberOfViews) || 0}`} />
                      <SummaryRow label={t("fields.requiresExam")} value={requiresExam ? t("options.yes") : t("options.no")} />
                      <SummaryRow label={t("fields.requiresHomework")} value={requiresHomework ? t("options.yes") : t("options.no")} />
                      <SummaryRow label={t("sections.attachments")} value={String(totalAttachments)} />
                    </div>
                  </section>

                  {creationError && (
                    <div className="alert alert-error rounded-[1.5rem] border-none shadow-sm">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="stroke-current shrink-0 h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>{creationError}</span>
                    </div>
                  )}
                </aside>
              </div>
            </div>

            <div className="border-t border-base-300 bg-base-100/95 px-6 py-4 backdrop-blur sm:px-8">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" className="btn btn-ghost rounded-full" onClick={handleClose} disabled={creationLoading}>
                  {t("buttons.cancel")}
                </button>
                <button type="submit" className="btn btn-primary rounded-full" disabled={creationLoading}>
                  {creationLoading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      {isEditMode ? (isRTL ? "جارٍ الحفظ" : "Saving...") : t("buttons.creating")}
                    </>
                  ) : (
                    isEditMode ? (isRTL ? "حفظ التغييرات" : "Save Changes") : t("buttons.create")
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LectureCreationModal
