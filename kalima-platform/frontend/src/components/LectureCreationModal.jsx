"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { FiX, FiPaperclip, FiImage } from "react-icons/fi"
import { getAllLevels } from "../routes/levels"
import { getAllSubjects } from "../routes/courses"
import ExamConfigSection from "./ExamConfigSection"

const LectureCreationModal = ({
  isOpen,
  onClose,
  onSubmit,
  containerId,
  userId,
  containerLevel,
  containerSubject,
  containerType,
}) => {
  const { t, i18n } = useTranslation(["lecturesPage"])
  const isRTL = i18n.language === "ar"

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

  // Fetch levels and subjects when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchLevels()
      fetchSubjects()

      // Set default values from container if available
      if (containerLevel) {
        setSelectedLevel(containerLevel)
      }
      if (containerSubject) {
        setSelectedSubject(containerSubject)
      }
    }
  }, [isOpen, containerLevel, containerSubject])

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
        createdBy: userId,
        level: selectedLevel,
        subject: selectedSubject,
        parent: containerId,
        price: Number(newPrice) || 0,
        description: newDescription || `${t("defaults.lectureDescription")} ${newItemName}`,
        numberOfViews: Number(numberOfViews) || 0,
        videoLink: newVideoLink,
        teacherAllowed: true,
        lecture_type: newLectureType,
        requiresExam: requiresExam,
      }

      // Handle exam config if required
      if (requiresExam) {
        if (!selectedExamConfigId) {
          throw new Error(t("validation.examConfigRequired"))
        }
        lectureData.examConfig = selectedExamConfigId
      }
      if (requiresHomework) {
        if (!selectedHomeworkConfigId) {
          throw new Error(t("validation.homeworkConfigRequired"))
        }
        lectureData.requiresHomework = true
        lectureData.homeworkConfig = selectedHomeworkConfigId
      }

      // Call onSubmit ONCE with all files and links for all categories
      await onSubmit(
        lectureData,
        null,
        null,
        thumbnailFile,
        attachmentFilesByCategory,
        attachmentLinksByCategory
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

  return (
    <div className={`modal ${isOpen && "modal-open"}`} dir={isRTL ? "rtl" : "ltr"}>
      <div className="modal-box max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{t("titles.createNewLecture")}</h3>
          <button onClick={handleClose} className="btn btn-sm btn-circle btn-ghost">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">{t("fields.name")}</span>
            </label>
            <input
              type="text"
              placeholder={t("placeholders.enterLectureName")}
              className="input input-bordered w-full"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              required
            />
          </div>

          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">{t("fields.thumbnail", "Thumbnail")}</span>
            </label>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="file"
                  onChange={handleThumbnailChange}
                  className="input input-bordered w-full"
                  accept="image/*"
                />
                <FiImage className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary" />
              </div>
              {thumbnailFile && (
                <div className="space-y-2">
                  <p className="text-sm text-base-content/70">
                    {t("fields.selectedFile", "Selected file")}: {thumbnailFile.name}
                  </p>
                  {thumbnailPreview && (
                    <div className="flex justify-center">
                      <img
                        src={thumbnailPreview || "/placeholder.svg"}
                        alt="Thumbnail preview"
                        className="w-32 h-20 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Level dropdown */}
          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">{t("fields.level")}</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              required
            >
              <option value="">{t("placeholders.selectLevel")}</option>
              {levels.map((level) => (
                <option key={level._id} value={level._id}>
                  {level.name}
                </option>
              ))}
            </select>
            {levelsLoading && <span className="loading loading-spinner mt-2"></span>}
          </div>

          {/* Subject dropdown */}
          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">{t("fields.subject")}</span>
            </label>
            <select
              className="select select-bordered w-full"
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
            {subjectsLoading && <span className="loading loading-spinner mt-2"></span>}
          </div>

          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">{t("fields.description")}</span>
            </label>
            <textarea
              placeholder={t("placeholders.enterDescription")}
              className="textarea textarea-bordered w-full"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>

          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">{t("fields.price")}</span>
            </label>
            <input
              type="number"
              placeholder={t("placeholders.enterPrice")}
              className="input input-bordered w-full"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              min="0"
              required
            />
          </div>

          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">{t("fields.videoURL")}</span>
            </label>
            <input
              type="url"
              placeholder={t("placeholders.enterVideoLink")}
              className="input input-bordered w-full"
              value={newVideoLink}
              onChange={(e) => setNewVideoLink(e.target.value)}
              required
            />
          </div>

          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">{t("fields.numberOfViews")}</span>
            </label>
            <input
              type="number"
              placeholder={t("placeholders.enterNumberOfViews")}
              className="input input-bordered w-full"
              value={numberOfViews}
              onChange={(e) => setNumberOfViews(e.target.value)}
              min="0"
              required
            />
          </div>

          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">{t("fields.lectureType")}</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={newLectureType}
              onChange={(e) => setNewLectureType(e.target.value)}
            >
              <option value="Revision">{t("lectureTypes.revision")}</option>
              <option value="Paid">{t("lectureTypes.normal")}</option>
            </select>
          </div>

          {/* Exam Section */}
          <div className="divider">{t("sections.examSettings")}</div>

          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">{t("fields.requiresExam")}</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={requiresExam}
              onChange={(e) => setRequiresExam(e.target.value === "true")}
            >
              <option value={false}>{t("options.no")}</option>
              <option value={true}>{t("options.yes")}</option>
            </select>
          </div>

          {/* Exam Config Section */}
          <ExamConfigSection
            requiresExam={requiresExam}
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

          {/* Homework Section */}
          <div className="divider">{t("sections.homeworkSettings")}</div>

          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">{t("fields.requiresHomework")}</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={requiresHomework}
              onChange={(e) => setRequiresHomework(e.target.value === "true")}
            >
              <option value={false}>{t("options.no")}</option>
              <option value={true}>{t("options.yes")}</option>
            </select>
          </div>

          {/* Homework Config Section */}
          {requiresHomework && (
            <>
              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text">{t("fields.homeworkConfiguration")}</span>
                </label>
                <ExamConfigSection
                  requiresExam={requiresHomework}
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
              </div>
            </>
          )}

          {/* Attachment section with tab UI for categories */}
          <div className="divider">{t("sections.attachments")}</div>
          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">{t("fields.attachmentOptional")}</span>
            </label>
            <div className="tabs mb-2">
              {attachmentCategories.map((cat) => (
                <button
                  type="button"
                  key={cat.key}
                  className={`tab tab-bordered ${activeAttachmentTab === cat.key ? "tab-active" : ""}`}
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
                  className="input input-bordered w-full"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <FiPaperclip className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary" />
              </div>
              {attachmentFilesByCategory[activeAttachmentTab] && attachmentFilesByCategory[activeAttachmentTab].length > 0 && (
                <ul className="mt-2 text-sm text-base-content/70">
                  {attachmentFilesByCategory[activeAttachmentTab].map((file, idx) => (
                    <li key={idx}>
                      {t("fields.selectedFile")}: {file.name}
                    </li>
                  ))}
                </ul>
              )}
              {/* If homework or exams tab, show link input */}
              {(activeAttachmentTab === "homeworks" || activeAttachmentTab === "exams") && (
                <div>
                  <input
                    type="url"
                    className="input input-bordered w-full mt-2"
                    placeholder={t("fields.enterGoogleFormOrLink", "Enter Google Form or link")}
                    value={attachmentLinksByCategory[activeAttachmentTab] || ""}
                    onChange={e => setAttachmentLinksByCategory(prev => ({
                      ...prev,
                      [activeAttachmentTab]: e.target.value,
                    }))}
                  />
                  <span className="text-xs text-base-content/60">{t("fields.orPasteLink", "Or paste a link instead of uploading a file.")}</span>
                </div>
              )}
            </div>
          </div>

          {creationError && (
            <div className="alert alert-error mb-4">
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

          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={handleClose} disabled={creationLoading}>
              {t("buttons.cancel")}
            </button>
            <button type="submit" className="btn btn-primary" disabled={creationLoading}>
              {creationLoading ? (
                <>
                  <span className="loading loading-spinner"></span>
                  {t("buttons.creating")}
                </>
              ) : (
                t("buttons.create")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LectureCreationModal
