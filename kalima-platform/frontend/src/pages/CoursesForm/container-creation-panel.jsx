"use client"

import { useState, useEffect } from "react"
import { FolderPlus, FileText, Paperclip } from "lucide-react"
import toast from "react-hot-toast"
import { createContainer, createLecture, createLectureAttachment } from "../../routes/lectures"
import { getAllSubjects } from "../../routes/courses"
import ContainerList from "./container-list"
import { translateErrorMessage } from "../../utils/errorTranslator"
import DSSelect from "../../components/DSSelect"
import {
  buildContainerPayloadObject,
  buildLecturePayloadObject,
  objectToFormData,
} from "../../utils/contentCreationPayloads"

const CONTAINER_TYPES = {
  COURSE: "course",
  YEAR: "year",
  TERM: "term",
  MONTH: "month",
  LECTURE: "lecture",
}

function ContainerCreationPanel({ courseStructure, updateCourseStructure, formData, createdBy, isRTL }) {
  const compactInput = "w-full input input-bordered input-sm h-10 min-h-10 bg-base-200/80"
  const compactSelect = "w-full select select-bordered select-sm h-10 min-h-10 bg-base-200/80"
  const [containerName, setContainerName] = useState("")
  const [containerType, setContainerType] = useState(CONTAINER_TYPES.YEAR)
  const [selectedParentId, setSelectedParentId] = useState(courseStructure.parent?.id || null)
  const [lectureLink, setLectureLink] = useState("")
  const [attachmentFile, setAttachmentFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [subjects, setSubjects] = useState([])
  const [numberOfViews, setNumberOfViews] = useState(0)
  const [lecturePrice, setLecturePrice] = useState(0)
  const [requiresExam, setRequiresExam] = useState(false)
  const [examFormUrl, setExamFormUrl] = useState("")
  const [passingThreshold, setPassingThreshold] = useState(60)
  const [requiresHomework, setRequiresHomework] = useState(false)
  const [homeworkFormUrl, setHomeworkFormUrl] = useState("")
  const [homeworkPassingThreshold, setHomeworkPassingThreshold] = useState(60)
  const [containerPrice, setContainerPrice] = useState(0)
  const [description, setDescription] = useState("")
  const [goal, setGoal] = useState("")
  const [imageFile, setImageFile] = useState(null)
  const [expandedItems, setExpandedItems] = useState({})
  const [attachmentType, setAttachmentType] = useState("homeworks")

  const normalizeId = (value) => value?._id || value?.id || value || null

  const getContainerById = (containerId) => {
    if (!containerId) return null

    const rootId = normalizeId(courseStructure.parent)
    if (rootId && String(rootId) === String(containerId)) {
      return courseStructure.parent
    }

    return courseStructure.containers.find((container) => String(container.id) === String(containerId)) || null
  }

  const getNextChildType = (parentType) => {
    switch (String(parentType || "").toLowerCase()) {
      case CONTAINER_TYPES.COURSE:
        return CONTAINER_TYPES.YEAR
      case CONTAINER_TYPES.YEAR:
        return CONTAINER_TYPES.TERM
      case CONTAINER_TYPES.TERM:
        return CONTAINER_TYPES.MONTH
      case CONTAINER_TYPES.MONTH:
        return CONTAINER_TYPES.LECTURE
      default:
        return null
    }
  }

  const getSuggestedParentIdForType = (nextType) => {
    switch (nextType) {
      case CONTAINER_TYPES.YEAR:
        return normalizeId(courseStructure.parent)
      case CONTAINER_TYPES.TERM: {
        const latestYear = [...courseStructure.containers].filter((container) => container.type === CONTAINER_TYPES.YEAR).slice(-1)[0]
        return normalizeId(latestYear)
      }
      case CONTAINER_TYPES.MONTH: {
        const latestTerm = [...courseStructure.containers].filter((container) => container.type === CONTAINER_TYPES.TERM).slice(-1)[0]
        return normalizeId(latestTerm)
      }
      case CONTAINER_TYPES.LECTURE: {
        const latestMonth = [...courseStructure.containers].filter((container) => container.type === CONTAINER_TYPES.MONTH).slice(-1)[0]
        return normalizeId(latestMonth)
      }
      case CONTAINER_TYPES.COURSE:
      default:
        return normalizeId(courseStructure.parent)
    }
  }

  const handleContainerTypeChange = (nextType) => {
    setContainerType(nextType)
    const suggestedParentId = getSuggestedParentIdForType(nextType)
    setSelectedParentId(suggestedParentId || "")
  }

  const handleParentSelection = (parentId) => {
    setSelectedParentId(parentId)
    const parentContainer = getContainerById(parentId)
    const nextType = getNextChildType(parentContainer?.type)
    if (nextType) {
      setContainerType(nextType)
    }
  }

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const subjectsResponse = await getAllSubjects()
        if (subjectsResponse.success && subjectsResponse.data) {
          setSubjects(subjectsResponse.data)
        } else {
          console.error(subjectsResponse.error)
        }
      } catch (error) {
        console.error("Error fetching subjects:", error)
      }
    }
    fetchSubjects()
  }, [])

  const toggleExpand = (type, id) => {
    setExpandedItems((prev) => ({
      ...prev,
      [`${type}_${id}`]: !prev[`${type}_${id}`],
    }))
  }

  const handleCreateContainer = async (e) => {
    e.preventDefault()

    if (!selectedParentId) {
      toast.error(isRTL ? "يرجى تحديد الحاوية الأب" : "Please select a parent container")
      return
    }

    if (!containerName) {
      toast.error(isRTL ? "يرجى إدخال اسم الحاوية" : "Please enter a container name")
      return
    }

    setIsSubmitting(true)

    try {
      if (containerType === CONTAINER_TYPES.LECTURE) {
        if (!lectureLink) {
          toast.error(isRTL ? "يرجى إدخال رابط المحاضرة" : "Please enter a lecture link")
          setIsSubmitting(false)
          return
        }

        // Create the base lecture data object
        if (requiresExam && !examFormUrl) {
          toast.error(isRTL ? "يرجى إدخال رابط امتحان" : "Please provide an exam form URL")
          setIsSubmitting(false)
          return
        }

        if (requiresHomework && !homeworkFormUrl) {
          toast.error(isRTL ? "يرجى إدخال رابط واجب" : "Please provide a homework form URL")
          setIsSubmitting(false)
          return
        }

        const lectureData = buildLecturePayloadObject({
          name: containerName,
          price: Number(lecturePrice),
          level: formData.gradeLevel,
          subject: formData.subject,
          parent: selectedParentId,
          createdBy,
          videoLink: lectureLink,
          teacherAllowed: formData.privacy === "teacher",
          description: description || `Lecture for ${containerName}`,
          numberOfViews: Number(numberOfViews),
          requiresExam,
          examFormUrl,
          passingThreshold: Number(passingThreshold),
          requiresHomework,
          homeworkFormUrl,
          homeworkPassingThreshold: Number(homeworkPassingThreshold),
        })

        const response = await createLecture(lectureData)

        if (response.status !== "success" && response.success !== true) {
          throw new Error(translateErrorMessage(response.message || "Failed to create lecture"))
        }

        // Extract the lecture ID from the response
        let lectureId = null
        if (response.data && response.data.lecture && response.data.lecture._id) {
          lectureId = response.data.lecture._id
        } else if (response.data && response.data._id) {
          lectureId = response.data._id
        } else if (response.data && response.data.lecture && response.data.lecture.id) {
          lectureId = response.data.lecture.id
        } else if (response.data && response.data.id) {
          lectureId = response.data.id
        }

        // Handle attachment after successful lecture creation
        if (attachmentFile && lectureId) {
          try {

            const attachmentData = {
              type: attachmentType,
              attachment: attachmentFile,
            }

            const attachmentResponse = await createLectureAttachment(lectureId, attachmentData)
          } catch (attachmentError) {
            console.error("Error uploading attachment:", attachmentError)
            toast.error(
              isRTL
                ? `تم إنشاء المحاضرة ولكن فشل تحميل المرفق: ${attachmentError.message}`
                : `Lecture created but failed to upload attachment: ${attachmentError.message}`,
            )
          }
        }

        // Extract lecture data for updating course structure
        const lecture = response.data.lecture || response.data
        const newLecture = {
          id: lecture.id || lecture._id,
          name: lecture.name,
          parent: lecture.parent,
          type: lecture.type,
          videoLink: lecture.videoLink,
          attachment: attachmentFile ? { type: attachmentType, name: attachmentFile.name } : null,
        }

        updateCourseStructure({
          ...courseStructure,
          lectures: [...courseStructure.lectures, newLecture],
        })

        const nextLectureType = getNextChildType(lecture.type || containerType)
        if (nextLectureType) {
          setContainerType(nextLectureType)
          setSelectedParentId(newLecture.id)
        }
      } else {
        const isCourseContainer = containerType === CONTAINER_TYPES.COURSE

        if (isCourseContainer && !description.trim()) {
          toast.error(isRTL ? "يرجى إدخال وصف الكورس" : "Please enter a course description")
          setIsSubmitting(false)
          return
        }

        if (isCourseContainer && !goal.trim()) {
          toast.error(isRTL ? "يرجى إدخال هدف الكورس" : "Please enter a course goal")
          setIsSubmitting(false)
          return
        }

        const containerPayload = buildContainerPayloadObject({
          name: containerName,
          type: containerType,
          createdBy,
          level: formData.gradeLevel,
          subject: formData.subject,
          parent: selectedParentId,
          price: Number(containerPrice),
          description: isCourseContainer ? description.trim() : undefined,
          goal: isCourseContainer ? goal.trim() : undefined,
          teacherAllowed: formData.privacy === "teacher",
        })

        const formDataPayload = isCourseContainer && imageFile
          ? objectToFormData(containerPayload, [{ key: "image", file: imageFile }])
          : containerPayload

        const response = await createContainer(formDataPayload)
        const container = response.data.container

        const newContainer = {
          id: container.id,
          name: container.name,
          parent: container.parent,
          type: containerType,
        }

        updateCourseStructure({
          ...courseStructure,
          containers: [...courseStructure.containers, newContainer],
        })

        const nextContainerType = getNextChildType(containerType)
        if (nextContainerType) {
          setContainerType(nextContainerType)
          setSelectedParentId(newContainer.id)
        }
      }

      // Reset form fields
      setContainerName("")
      setLectureLink("")
      setAttachmentFile(null)
      setNumberOfViews(0)
      setLecturePrice(0)
      setRequiresExam(false)
      setExamFormUrl("")
      setPassingThreshold(60)
      setRequiresHomework(false)
      setHomeworkFormUrl("")
      setHomeworkPassingThreshold(60)
      setContainerPrice(0)
      setDescription("")
      setGoal("")
      setImageFile(null)
      setAttachmentType("homeworks")

      toast.success(
        isRTL
          ? `تم إنشاء ${containerType === CONTAINER_TYPES.LECTURE ? "المحاضرة" : "الحاوية"} بنجاح`
          : `${containerType === CONTAINER_TYPES.LECTURE ? "Lecture" : "Container"} created successfully`,
      )
    } catch (error) {
      console.error(`Error creating ${containerType}:`, error)
      toast.error(
        isRTL
          ? `حدث خطأ أثناء إنشاء ${containerType === CONTAINER_TYPES.LECTURE ? "المحاضرة" : "الحاوية"}`
          : `Error creating ${containerType === CONTAINER_TYPES.LECTURE ? "lecture" : "container"}`,
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const getAvailableParents = () => {
    switch (containerType) {
      case CONTAINER_TYPES.YEAR:
        return [courseStructure.parent].filter(Boolean)
      case CONTAINER_TYPES.TERM:
        return courseStructure.containers.filter((c) => c.type === CONTAINER_TYPES.YEAR)
      case CONTAINER_TYPES.MONTH:
        return courseStructure.containers.filter((c) => c.type === CONTAINER_TYPES.TERM)
      case CONTAINER_TYPES.LECTURE:
        return courseStructure.containers.filter((c) => c.type === CONTAINER_TYPES.MONTH)
      default:
        return [courseStructure.parent].filter(Boolean)
    }
  }

  return (
    <div className="rounded-[1.4rem] border bg-white/90 p-4 shadow-md sm:p-5" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
      <div className="mb-4 rounded-2xl border p-4" style={{ borderColor: "rgba(14,85,99,0.16)", background: "linear-gradient(135deg, rgba(188,231,236,0.42), rgba(248,243,233,0.9))" }}>
        <h2 className={`text-base sm:text-lg font-bold text-primary ${isRTL ? "text-right" : "text-left"}`}>
          {isRTL ? "إضافة محتوى تعليمي" : "Add Educational Content"}
        </h2>
        <p className={`mt-1 text-xs sm:text-sm text-base-content/75 ${isRTL ? "text-right" : "text-left"}`}>
          {isRTL ? "ابدأ بالهيكل الصحيح: سنة ثم فصل ثم شهر ثم محاضرة." : "Use the hierarchy in order: year, term, month, then lecture."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-base-content/70">
            {isRTL ? "1. اختر النوع" : "1. Choose type"}
          </span>
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-base-content/70">
            {isRTL ? "2. اختر الأب" : "2. Choose parent"}
          </span>
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-base-content/70">
            {isRTL ? "3. املأ التفاصيل" : "3. Fill details"}
          </span>
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-base-content/70">
            {isRTL ? "4. احفظ" : "4. Save"}
          </span>
        </div>
        <p className={`mt-3 text-xs text-base-content/60 ${isRTL ? "text-right" : "text-left"}`}>
          {isRTL
            ? "المحاضرات يجب أن تكون داخل الشهور، والشهور داخل الفصول، والفصول داخل السنوات."
            : "Lectures belong under months, months under terms, and terms under years."}
        </p>
      </div>

      <form onSubmit={handleCreateContainer} className="mb-8">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">{isRTL ? "نوع المحتوى" : "Content Type"}</label>
            <DSSelect
              value={containerType}
              onChange={(e) => handleContainerTypeChange(e.target.value)}
              className={compactSelect}
              required
            >
              <option value={CONTAINER_TYPES.COURSE}>{isRTL ? "دورة" : "Course"}</option>
              <option value={CONTAINER_TYPES.YEAR} disabled={!getSuggestedParentIdForType(CONTAINER_TYPES.YEAR)}>
                {isRTL ? "سنة دراسية" : "Academic Year"}
              </option>
              <option value={CONTAINER_TYPES.TERM} disabled={!getSuggestedParentIdForType(CONTAINER_TYPES.TERM)}>
                {isRTL ? "فصل دراسي" : "Term"}
              </option>
              <option value={CONTAINER_TYPES.MONTH} disabled={!getSuggestedParentIdForType(CONTAINER_TYPES.MONTH)}>
                {isRTL ? "شهر" : "Month"}
              </option>
              <option value={CONTAINER_TYPES.LECTURE} disabled={!getSuggestedParentIdForType(CONTAINER_TYPES.LECTURE)}>
                {isRTL ? "محاضرة" : "Lecture"}
              </option>
            </DSSelect>
            <p className="mt-1 text-xs text-base-content/55">
              {containerType === CONTAINER_TYPES.LECTURE
                ? (isRTL ? "المحاضرة ستظهر داخل الشهر المختار." : "The lecture will live under the selected month.")
                : isRTL
                  ? "أنشئ هذا الجزء في المكان الصحيح من الهيكل."
                  : "Create this part in the correct place within the structure."}
            </p>
            <p className="mt-1 text-xs text-base-content/45">
              {isRTL
                ? "اختيار الأب سيملأ النوع المناسب تلقائياً، ويمكنك تغييره يدوياً لاحقاً."
                : "Picking a parent auto-fills the right type, and you can still change it later."}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{isRTL ? "الحاوية الأب" : "Parent Container"}</label>
            <DSSelect
              value={selectedParentId || ""}
              onChange={(e) => handleParentSelection(e.target.value)}
              className={compactSelect}
              required
            >
              <option value="" disabled>
                {isRTL ? "اختر الحاوية الأب" : "Select parent container"}
              </option>
              {getAvailableParents().map((container) => (
                <option key={container.id} value={container.id}>
                  {container.name}
                </option>
              ))}
            </DSSelect>
            <p className="mt-1 text-xs text-base-content/55">
              {isRTL
                ? "اختيار الأب يملأ نوع المحتوى تلقائياً."
                : "Selecting a parent auto-fills the matching content type."}
            </p>
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-sm font-medium mb-1">{isRTL ? "اسم المحتوى" : "Content Name"}</label>
          <input
            type="text"
            value={containerName}
            onChange={(e) => setContainerName(e.target.value)}
            placeholder={isRTL ? "اسم المحتوى" : "Content name"}
            className={compactInput}
            required
          />
        </div>

        <div className="mt-3">
          <label className="block text-sm font-medium mb-1">{isRTL ? "الموضوع" : "Subject"}</label>
          <DSSelect
            value={formData.subject || ""}
            onChange={(e) => {
              updateCourseStructure({ ...courseStructure, formData: { ...formData, subject: e.target.value } })
            }}
            className={compactSelect}
            required
          >
            <option value="" disabled>
              {isRTL ? "اختر الموضوع" : "Select subject"}
            </option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.name}
              </option>
            ))}
          </DSSelect>
        </div>

            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">{isRTL ? "الوصف" : "Description"}</label>
              <input
                type="text"
                value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={isRTL ? "الوصف" : "Description"}
                className={compactInput}
              />
            </div>

            {containerType === CONTAINER_TYPES.COURSE && (
              <div className="mt-3">
                <label className="block text-sm font-medium mb-1">{isRTL ? "هدف الكورس" : "Course Goal"}</label>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder={isRTL ? "هدف الكورس" : "Course goal"}
                  className={`${compactTextArea} min-h-24`}
                />
              </div>
            )}

            {containerType === CONTAINER_TYPES.LECTURE ? (
              <>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
              <label className="block text-sm font-medium mb-1">{isRTL ? "سعر المحاضرة" : "Lecture Price"}</label>
              <input
                type="number"
                value={lecturePrice}
                onChange={(e) => setLecturePrice(e.target.value)}
                placeholder={isRTL ? "سعر المحاضرة" : "Lecture price"}
                className={compactInput}
              />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
              <label className="block text-sm font-medium mb-1">{isRTL ? "رابط المحاضرة" : "Lecture Link"}</label>
              <input
                type="text"
                value={lectureLink}
                onChange={(e) => setLectureLink(e.target.value)}
                placeholder={isRTL ? "رابط الفيديو" : "Video link"}
                className={compactInput}
                required
              />
              </div>
              <div>
              <label className="block text-sm font-medium mb-1">{isRTL ? "عدد المشاهدات" : "Number of Views"}</label>
              <input
                type="number"
                value={numberOfViews}
                onChange={(e) => setNumberOfViews(e.target.value)}
                placeholder={isRTL ? "عدد المشاهدات" : "Number of views"}
                className={compactInput}
                required
              />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">
                {isRTL ? "هل تحتاج إلى امتحان؟" : "Requires Exam?"}
              </label>
              <DSSelect
                value={requiresExam}
                onChange={(e) => setRequiresExam(e.target.value === "true")}
                className={compactSelect}
              >
                <option value={false}>{isRTL ? "لا" : "No"}</option>
                <option value={true}>{isRTL ? "نعم" : "Yes"}</option>
              </DSSelect>
            </div>

            {requiresExam && (
              <div className="mt-3 rounded-xl border border-base-300 bg-base-100/70 p-3">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {isRTL ? "رابط الامتحان" : "Exam Form URL"}
                    </label>
                    <input
                      type="url"
                      value={examFormUrl}
                      onChange={(e) => setExamFormUrl(e.target.value)}
                      placeholder={isRTL ? "رابط Google Form للامتحان" : "Google Form URL for exam"}
                      className={compactInput}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {isRTL ? "حد النجاح" : "Passing Threshold"}
                    </label>
                    <input
                      type="number"
                      value={passingThreshold}
                      onChange={(e) => setPassingThreshold(e.target.value)}
                      className={compactInput}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">
                {isRTL ? "هل تحتاج إلى واجب منزلي؟" : "Requires Homework?"}
              </label>
              <DSSelect
                value={requiresHomework}
                onChange={(e) => setRequiresHomework(e.target.value === "true")}
                className={compactSelect}
              >
                <option value={false}>{isRTL ? "لا" : "No"}</option>
                <option value={true}>{isRTL ? "نعم" : "Yes"}</option>
              </DSSelect>
            </div>

            {requiresHomework && (
              <div className="mt-3 rounded-xl border border-base-300 bg-base-100/70 p-3">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {isRTL ? "رابط الواجب" : "Homework Form URL"}
                    </label>
                    <input
                      type="url"
                      value={homeworkFormUrl}
                      onChange={(e) => setHomeworkFormUrl(e.target.value)}
                      placeholder={isRTL ? "رابط Google Form للواجب" : "Google Form URL for homework"}
                      className={compactInput}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {isRTL ? "حد النجاح" : "Passing Threshold"}
                    </label>
                    <input
                      type="number"
                      value={homeworkPassingThreshold}
                      onChange={(e) => setHomeworkPassingThreshold(e.target.value)}
                      className={compactInput}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">{isRTL ? "نوع المرفق" : "Attachment Type"}</label>
              <DSSelect
                className={compactSelect}
                value={attachmentType}
                onChange={(e) => setAttachmentType(e.target.value)}
              >
                <option value="pdfsandimages">{isRTL ? "ملفات PDF وصور" : "PDFs and Images"}</option>
                <option value="booklets">{isRTL ? "كتيبات" : "Booklets"}</option>
                <option value="homeworks">{isRTL ? "واجبات منزلية" : "Homeworks"}</option>
                <option value="exams">{isRTL ? "امتحانات" : "Exams"}</option>
              </DSSelect>
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">
                {isRTL ? "إرفاق واجب (اختياري، .pdf فقط)" : "Attach Homework (Optional, .pdf only)"}
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={(e) => setAttachmentFile(e.target.files[0])}
                  className="file-input file-input-bordered file-input-sm w-full bg-base-200/80 pr-10"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <Paperclip className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
              </div>
              {attachmentFile && (
                <p className="mt-2 text-sm text-base-content/70">
                  {isRTL ? "الملف المختار:" : "Selected file:"} {attachmentFile.name}
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">{isRTL ? "سعر الحاوية" : "Container Price"}</label>
              <input
                type="number"
                value={containerPrice}
                onChange={(e) => setContainerPrice(e.target.value)}
                placeholder={isRTL ? "سعر الحاوية" : "Container price"}
                className={compactInput}
              />
            </div>
            {containerType === CONTAINER_TYPES.COURSE && (
              <div className="mt-3">
                <label className="block text-sm font-medium mb-1">
                  {isRTL ? "إرفاق صورة (اختياري)" : "Attach Image (Optional)"}
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    className="file-input file-input-bordered file-input-sm w-full bg-base-200/80 pr-10"
                    accept="image/*"
                  />
                  <Paperclip className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
                </div>
                {imageFile && (
                  <p className="mt-2 text-sm text-base-content/70">
                    {isRTL ? "الملف المختار:" : "Selected file:"} {imageFile.name}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        <button type="submit" className="btn btn-primary w-full rounded-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <>
              {containerType === CONTAINER_TYPES.LECTURE ? (
                <FileText className="w-4 h-4 mr-1" />
              ) : (
                <FolderPlus className="w-4 h-4 mr-1" />
              )}
              {isRTL
                ? `إضافة ${containerType === CONTAINER_TYPES.LECTURE ? "محاضرة" : "حاوية"}`
                : `Add ${containerType === CONTAINER_TYPES.LECTURE ? "Lecture" : "Container"}`}
            </>
          )}
        </button>
      </form>

      <ContainerList
        courseStructure={courseStructure}
        isRTL={isRTL}
        selectedParentId={selectedParentId}
        setSelectedParentId={handleParentSelection}
        expandedItems={expandedItems}
        toggleExpand={toggleExpand}
      />
    </div>
  )
}

export default ContainerCreationPanel
