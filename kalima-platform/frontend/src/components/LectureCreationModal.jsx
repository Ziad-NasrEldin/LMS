"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { FiX, FiPaperclip, FiImage } from "react-icons/fi"
import { getAllLevels } from "../routes/levels"
import { getAllSubjects } from "../routes/courses"
import { resolveUploadUrl } from "../utils/uploadUrl"
import ExamConfigSection from "./ExamConfigSection"

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
}) => {
  const { t, i18n } = useTranslation(["lecturesPage"])
  const isRTL = i18n.language === "ar"
  const isEditMode = mode === "edit"

  // Form state
  const [newItemName, setNewItemName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newPrice, setNewPrice] = useState(0)
  const [newVideoLink, setNewVideoLink] = useState("")
  const [newLectureType, setNewLectureType] = useState("Revision")
  // Tab-like attachment state
  const attachmentCategories = [
    { key: "pdfsandimages", label: t("attachmentTypes.pdfsAndImages") },
    { key: "booklets", label: t("attachmentTypes.booklets") },
    { key: "homeworks", label: t("attachmentTypes.homeworks") },
    { key: "exams", label: t("attachmentTypes.exams") },
  ]
  const [activeAttachmentTab, setActiveAttachmentTab] = useState("pdfsandimages")
  const [attachmentFilesByCategory, setAttachmentFilesByCategory] = useState({
    pdfsandimages: [],
    booklets: [],
    homeworks: [],
    exams: [],
  })
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  const [creationLoading, setCreationLoading] = useState(false)
  const [creationError, setCreationError] = useState("")
  const [numberOfViews, setNumberOfViews] = useState(0)
  // Store links for homework and exams
  const [attachmentLinksByCategory, setAttachmentLinksByCategory] = useState({
    homeworks: "",
    exams: "",
  })

  // Exam related state
  const [requiresExam, setRequiresExam] = useState(false)
  const [passingThreshold, setPassingThreshold] = useState(50)
  const [selectedExamConfigId, setSelectedExamConfigId] = useState("")

  // Homework related state
  const [requiresHomework, setRequiresHomework] = useState(false)
  const [homeworkPassingThreshold, setHomeworkPassingThreshold] = useState(50)
  const [selectedHomeworkConfigId, setSelectedHomeworkConfigId] = useState("")

  // Levels and subjects state
  const [levels, setLevels] = useState([])
  const [subjects, setSubjects] = useState([])
  const [levelsLoading, setLevelsLoading] = useState(false)
  const [subjectsLoading, setSubjectsLoading] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [attachmentType, setAttachmentType] = useState("homeworks")

  const populateFromInitialData = () => {
    if (!initialData) {
      return
    }

    setNewItemName(initialData.name || "")
    setNewDescription(initialData.description || "")
    setNewPrice(initialData.price ?? 0)
    setNewVideoLink(initialData.videoLink || "")
    setNewLectureType(initialData.lecture_type || "Revision")
    setNumberOfViews(initialData.numberOfViews ?? 0)
    setRequiresExam(Boolean(initialData.requiresExam))
    setRequiresHomework(Boolean(initialData.requiresHomework))
    setPassingThreshold(initialData.passingThreshold ?? 50)
    setHomeworkPassingThreshold(initialData.homeworkPassingThreshold ?? 50)
    setSelectedExamConfigId(initialData.examConfig?._id || initialData.examConfig || "")
    setSelectedHomeworkConfigId(initialData.homeworkConfig?._id || initialData.homeworkConfig || "")
    setSelectedLevel(initialData.level?._id || initialData.level || containerLevel || "")
    setSelectedSubject(initialData.subject?._id || initialData.subject || containerSubject || "")
    setThumbnailPreview(
      initialData.thumbnail ? resolveUploadUrl(initialData.thumbnail, "lecture_thumbnails") : null,
    )
  }

  // Fetch levels and subjects when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchLevels()
      fetchSubjects()

      if (isEditMode) {
        populateFromInitialData()
      } else {
        // Set default values from container if available
        if (containerLevel) {
          setSelectedLevel(containerLevel)
        }
        if (containerSubject) {
          setSelectedSubject(containerSubject)
        }
      }
    }
  }, [isOpen, containerLevel, containerSubject, isEditMode, initialData])

  // Functions to fetch levels and subjects
  const fetchLevels = async () => {
    try {
      setLevelsLoading(true)
      const response = await getAllLevels()
      if (response.success) {
        setLevels(response.data)
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
    setAttachmentFilesByCategory({
      pdfsandimages: [],
      booklets: [],
      homeworks: [],
      exams: [],
    })
    setActiveAttachmentTab("pdfsandimages")
    setThumbnailFile(null)
    setThumbnailPreview(null)
    setNumberOfViews(0)

    // Reset exam fields
    setRequiresExam(false)
    setPassingThreshold(50)
    setSelectedExamConfigId("")

    // Reset homework fields
    setRequiresHomework(false)
    setHomeworkPassingThreshold(50)
    setSelectedHomeworkConfigId("")

    setSelectedLevel(containerLevel || "")
    setSelectedSubject(containerSubject || "")
    setAttachmentType("homeworks")
    setCreationError("")
    if (isEditMode && initialData?.thumbnail) {
      setThumbnailPreview(resolveUploadUrl(initialData.thumbnail, "lecture_thumbnails"))
    }
  }

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
      if (!selectedLevel) throw new Error(t("validation.levelRequired"))
      if (!selectedSubject) throw new Error(t("validation.subjectRequired"))
      if (!newVideoLink) throw new Error(t("validation.videoLinkRequired"))

      // Prepare lecture data
      const lectureData = {
        name: newItemName,
        type: "lecture",
        level: selectedLevel,
        subject: selectedSubject,
        price: Number(newPrice) || 0,
        description: newDescription || `${t("defaults.lectureDescription")} ${newItemName}`,
        numberOfViews: Number(numberOfViews) || 0,
        videoLink: newVideoLink,
        teacherAllowed: true,
        lecture_type: newLectureType,
        requiresExam: requiresExam,
        requiresHomework: requiresHomework,
      }

      // Handle exam config if required
      if (requiresExam) {
        if (!selectedExamConfigId) {
          throw new Error(t("validation.examConfigRequired"))
        }
        lectureData.examConfig = selectedExamConfigId
        lectureData.passingThreshold = Number(passingThreshold)
      }
      if (requiresHomework) {
        if (!selectedHomeworkConfigId) {
          throw new Error(t("validation.homeworkConfigRequired"))
        }
        lectureData.homeworkConfig = selectedHomeworkConfigId
        lectureData.homeworkPassingThreshold = Number(homeworkPassingThreshold)
      }

      // Call onSubmit ONCE with all files and links for all categories
      if (!isEditMode) {
        lectureData.createdBy = userId
        lectureData.parent = containerId
      }

      await onSubmit(
        isEditMode ? lectureId || initialData?._id || initialData?.id : lectureData,
        isEditMode ? lectureData : null,
        null,
        thumbnailFile,
        attachmentFilesByCategory,
        attachmentLinksByCategory,
      )

      resetForm()
      onClose()
    } catch (err) {
      setCreationError(err.message)
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

  const selectedLevelInfo = levels.find((level) => level._id === selectedLevel)
  const selectedSubjectInfo = subjects.find((subject) => subject._id === selectedSubject)
  const selectedLevelLabel = selectedLevelInfo?.displayName || selectedLevelInfo?.name || ""
  const selectedSubjectLabel = selectedSubjectInfo?.name || ""
  const totalAttachments = Object.values(attachmentFilesByCategory).reduce(
    (count, files) => count + (files?.length || 0),
    0,
  )
  const lectureTypeLabel = newLectureType === "Revision" ? t("lectureTypes.revision") : t("lectureTypes.normal")

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

                      <div className="form-control md:col-span-2">
                        <label className="label">
                          <span className="label-text font-semibold">{t("fields.lectureType")}</span>
                        </label>
                        <select
                          className="select select-bordered w-full rounded-2xl"
                          value={newLectureType}
                          onChange={(e) => setNewLectureType(e.target.value)}
                        >
                          <option value="Revision">{t("lectureTypes.revision")}</option>
                          <option value="Paid">{t("lectureTypes.normal")}</option>
                        </select>
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
                        <p className="text-sm text-base-content/60">{t("fields.level")}, {t("fields.subject")}, {t("fields.requiresExam")}, {t("fields.requiresHomework")}</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-semibold">{t("fields.level")}</span>
                        </label>
                        <select
                          className="select select-bordered w-full rounded-2xl"
                          value={selectedLevel}
                          onChange={(e) => setSelectedLevel(e.target.value)}
                          required
                        >
                          <option value="">{t("placeholders.selectLevel")}</option>
                          {levels.map((level) => (
                            <option key={level._id} value={level._id}>
                              {level.displayName || level.name}
                            </option>
                          ))}
                        </select>
                        {levelsLoading && <span className="loading loading-spinner loading-sm mt-2"></span>}
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-semibold">{t("fields.subject")}</span>
                        </label>
                        <select
                          className="select select-bordered w-full rounded-2xl"
                          value={selectedSubject}
                          onChange={(e) => setSelectedSubject(e.target.value)}
                          required
                        >
                          <option value="">{t("placeholders.selectSubject")}</option>
                          {subjects.map((subject) => (
                            <option key={subject._id} value={subject._id}>
                              {subject.name}
                            </option>
                          ))}
                        </select>
                        {subjectsLoading && <span className="loading loading-spinner loading-sm mt-2"></span>}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-2">
                      <div className="rounded-[1.5rem] border border-base-300 bg-base-200/40 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h5 className="font-semibold text-base-content">{t("fields.requiresExam")}</h5>
                          <select
                            className="select select-bordered select-sm rounded-xl"
                            value={requiresExam}
                            onChange={(e) => setRequiresExam(e.target.value === "true")}
                          >
                            <option value={false}>{t("options.no")}</option>
                            <option value={true}>{t("options.yes")}</option>
                          </select>
                        </div>
                        <ExamConfigSection
                          isEnabled={requiresExam}
                          selectedExamConfigId={selectedExamConfigId}
                          setSelectedExamConfigId={setSelectedExamConfigId}
                          passingThreshold={passingThreshold}
                          setPassingThreshold={setPassingThreshold}
                          onExamConfigCreated={(examConfigId) => {
                            setSelectedExamConfigId(examConfigId)
                          }}
                          t={t}
                          i18n={i18n}
                        />
                      </div>

                      <div className="rounded-[1.5rem] border border-base-300 bg-base-200/40 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h5 className="font-semibold text-base-content">{t("fields.requiresHomework")}</h5>
                          <select
                            className="select select-bordered select-sm rounded-xl"
                            value={requiresHomework}
                            onChange={(e) => setRequiresHomework(e.target.value === "true")}
                          >
                            <option value={false}>{t("options.no")}</option>
                            <option value={true}>{t("options.yes")}</option>
                          </select>
                        </div>
                        {requiresHomework && (
                          <ExamConfigSection
                            isEnabled={requiresHomework}
                            selectedExamConfigId={selectedHomeworkConfigId}
                            setSelectedExamConfigId={setSelectedHomeworkConfigId}
                            passingThreshold={homeworkPassingThreshold}
                            setPassingThreshold={setHomeworkPassingThreshold}
                            onExamConfigCreated={(homeworkConfigId) => {
                              setSelectedHomeworkConfigId(homeworkConfigId)
                            }}
                            configType="homework"
                            t={t}
                            i18n={i18n}
                          />
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

                    <div className="tabs tabs-boxed mb-4 flex flex-wrap gap-2 bg-base-200/60 p-1">
                      {attachmentCategories.map((cat) => (
                        <button
                          type="button"
                          key={cat.key}
                          className={`tab min-h-0 rounded-full px-4 py-2 text-sm font-medium ${activeAttachmentTab === cat.key ? "tab-active" : ""}`}
                          onClick={() => setActiveAttachmentTab(cat.key)}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type="file"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files)
                            setAttachmentFilesByCategory((prev) => ({
                              ...prev,
                              [activeAttachmentTab]: files,
                            }))
                          }}
                          className="file-input file-input-bordered w-full rounded-2xl"
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                        <FiPaperclip className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                      </div>

                      {attachmentFilesByCategory[activeAttachmentTab] && attachmentFilesByCategory[activeAttachmentTab].length > 0 && (
                        <ul className="space-y-1 rounded-2xl bg-base-200/50 p-4 text-sm text-base-content/70">
                          {attachmentFilesByCategory[activeAttachmentTab].map((file, idx) => (
                            <li key={idx}>
                              {t("fields.selectedFile")}: {file.name}
                            </li>
                          ))}
                        </ul>
                      )}

                      {(activeAttachmentTab === "homeworks" || activeAttachmentTab === "exams") && (
                        <div className="space-y-2">
                          <input
                            type="url"
                            className="input input-bordered w-full rounded-2xl"
                            placeholder={t("fields.enterGoogleFormOrLink", "Enter Google Form or link")}
                            value={attachmentLinksByCategory[activeAttachmentTab] || ""}
                            onChange={(e) =>
                              setAttachmentLinksByCategory((prev) => ({
                                ...prev,
                                [activeAttachmentTab]: e.target.value,
                              }))
                            }
                          />
                          <span className="text-xs text-base-content/60">{t("fields.orPasteLink", "Or paste a link instead of uploading a file.")}</span>
                        </div>
                      )}
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
                      <SummaryRow label={t("fields.level")} value={selectedLevelLabel || t("lecturesPage.notSpecified")} loading={levelsLoading} />
                      <SummaryRow label={t("fields.subject")} value={selectedSubjectLabel || t("lecturesPage.notSpecified")} loading={subjectsLoading} />
                      <SummaryRow label={t("fields.price")} value={`${Number(newPrice) || 0}`} />
                      <SummaryRow label={t("fields.numberOfViews")} value={`${Number(numberOfViews) || 0}`} />
                      <SummaryRow label={t("fields.lectureType")} value={lectureTypeLabel} />
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
