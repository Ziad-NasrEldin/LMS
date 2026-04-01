"use client"

import { useState, useEffect } from "react"
import { FolderPlus, FileText, Paperclip } from "lucide-react"
import toast from "react-hot-toast"
import { createContainer, createLecture, createLectureAttachment } from "../../routes/lectures"
import { getAllSubjects } from "../../routes/courses"
import ExamConfigSection from "../../components/ExamConfigSection"
import ContainerList from "./container-list"
import { translateErrorMessage } from "../../utils/errorTranslator"

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
  const [lectureType, setLectureType] = useState("Paid")
  const [requiresExam, setRequiresExam] = useState(false)
  const [selectedExamConfigId, setSelectedExamConfigId] = useState("")
  const [passingThreshold, setPassingThreshold] = useState(60)
  const [requiresHomework, setRequiresHomework] = useState(false)
  const [selectedHomeworkConfigId, setSelectedHomeworkConfigId] = useState("")
  const [homeworkPassingThreshold, setHomeworkPassingThreshold] = useState(60)
  const [containerPrice, setContainerPrice] = useState(0)
  const [description, setDescription] = useState("")
  const [imageFile, setImageFile] = useState(null)
  const [expandedItems, setExpandedItems] = useState({})
  const [attachmentType, setAttachmentType] = useState("homeworks")

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
        const lectureData = {
          name: containerName,
          type: "lecture",
          createdBy: createdBy,
          level: formData.gradeLevel,
          subject: formData.subject,
          parent: selectedParentId,
          price: Number(lecturePrice),
          description: description || `Lecture for ${containerName}`,
          numberOfViews: Number(numberOfViews),
          videoLink: lectureLink,
          teacherAllowed: formData.privacy === "teacher",
          lecture_type: lectureType,
        }

        if (requiresExam) {
          if (!selectedExamConfigId) {
            toast.error(isRTL ? "يرجى تحديد تكوين الامتحان" : "Please select an exam configuration")
            setIsSubmitting(false)
            return
          }

          lectureData.requiresExam = true
          lectureData.examConfig = selectedExamConfigId
          lectureData.passingThreshold = Number(passingThreshold)
        } else {
          lectureData.requiresExam = false
        }

        if (requiresHomework) {
          if (!selectedHomeworkConfigId) {
            toast.error(isRTL ? "يرجى تحديد تكوين الواجب المنزلي" : "Please select a homework configuration")
            setIsSubmitting(false)
            return
          }

          lectureData.requiresHomework = true
          lectureData.homeworkConfig = selectedHomeworkConfigId
          lectureData.homeworkPassingThreshold = Number(homeworkPassingThreshold)
        } else {
          lectureData.requiresHomework = false
        }

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
      } else {
        const formDataPayload = new FormData()
        formDataPayload.append("name", containerName)
        formDataPayload.append("type", containerType)
        formDataPayload.append("createdBy", createdBy)
        formDataPayload.append("level", formData.gradeLevel)
        formDataPayload.append("subject", formData.subject)
        formDataPayload.append("parent", selectedParentId)
        formDataPayload.append("price", Number(containerPrice))
        formDataPayload.append("description", description || `Container for ${containerName}`)
        formDataPayload.append("teacherAllowed", formData.privacy === "teacher")

        // Only append image if containerType is "course" and an image is selected
        if (containerType === CONTAINER_TYPES.COURSE && imageFile) {
          formDataPayload.append("image", imageFile)
        }

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
      }

      // Reset form fields
      setContainerName("")
      setLectureLink("")
      setAttachmentFile(null)
      setNumberOfViews(0)
      setLecturePrice(0)
      setLectureType("Paid")
      setRequiresExam(false)
      setSelectedExamConfigId("")
      setPassingThreshold(60)
      setRequiresHomework(false)
      setSelectedHomeworkConfigId("")
      setHomeworkPassingThreshold(60)
      setContainerPrice(0)
      setDescription("")
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
        return [courseStructure.parent]
      case CONTAINER_TYPES.TERM:
        return courseStructure.containers.filter((c) => c.type === CONTAINER_TYPES.YEAR)
      case CONTAINER_TYPES.MONTH:
        return courseStructure.containers.filter((c) => c.type === CONTAINER_TYPES.TERM)
      case CONTAINER_TYPES.LECTURE:
        return courseStructure.containers.filter((c) => c.type === CONTAINER_TYPES.MONTH)
      default:
        return [courseStructure.parent]
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
            <select
              value={containerType}
              onChange={(e) => {
                setContainerType(e.target.value)
                setSelectedParentId(null)
              }}
              className={compactSelect}
              required
            >
              <option value={CONTAINER_TYPES.COURSE}>{isRTL ? "دورة" : "Course"}</option>
              <option value={CONTAINER_TYPES.YEAR}>{isRTL ? "سنة دراسية" : "Academic Year"}</option>
              <option value={CONTAINER_TYPES.TERM}>{isRTL ? "فصل دراسي" : "Term"}</option>
              <option value={CONTAINER_TYPES.MONTH}>{isRTL ? "شهر" : "Month"}</option>
              <option value={CONTAINER_TYPES.LECTURE}>{isRTL ? "محاضرة" : "Lecture"}</option>
            </select>
            <p className="mt-1 text-xs text-base-content/55">
              {containerType === CONTAINER_TYPES.LECTURE
                ? (isRTL ? "المحاضرة ستظهر داخل الشهر المختار." : "The lecture will live under the selected month.")
                : isRTL
                  ? "أنشئ هذا الجزء في المكان الصحيح من الهيكل."
                  : "Create this part in the correct place within the structure."}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{isRTL ? "الحاوية الأب" : "Parent Container"}</label>
            <select
              value={selectedParentId || ""}
              onChange={(e) => setSelectedParentId(e.target.value)}
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
            </select>
            <p className="mt-1 text-xs text-base-content/55">
              {isRTL ? "اختر الحاوية التي ستحتوي هذا العنصر." : "Pick the parent container that will contain this item."}
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
          <select
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
          </select>
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

        {containerType === CONTAINER_TYPES.LECTURE ? (
          <>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
              <label className="block text-sm font-medium mb-1">{isRTL ? "نوع المحاضرة" : "Lecture Type"}</label>
              <select
                value={lectureType}
                onChange={(e) => setLectureType(e.target.value)}
                className={compactSelect}
              >
                <option value="Paid">{isRTL ? "مدفوع" : "Paid"}</option>
                <option value="Revision">{isRTL ? "مراجعة" : "Revision"}</option>
              </select>
              </div>
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
              <select
                value={requiresExam}
                onChange={(e) => setRequiresExam(e.target.value === "true")}
                className={compactSelect}
              >
                <option value={false}>{isRTL ? "لا" : "No"}</option>
                <option value={true}>{isRTL ? "نعم" : "Yes"}</option>
              </select>
            </div>

            {requiresExam && (
              <div className="mt-3 rounded-xl border border-base-300 bg-base-100/70 p-3">
                <ExamConfigSection
                  isEnabled={requiresExam}
                  selectedExamConfigId={selectedExamConfigId}
                  setSelectedExamConfigId={setSelectedExamConfigId}
                  passingThreshold={passingThreshold}
                  setPassingThreshold={setPassingThreshold}
                  onExamConfigCreated={setSelectedExamConfigId}
                />
              </div>
            )}

            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">
                {isRTL ? "هل تحتاج إلى واجب منزلي؟" : "Requires Homework?"}
              </label>
              <select
                value={requiresHomework}
                onChange={(e) => setRequiresHomework(e.target.value === "true")}
                className={compactSelect}
              >
                <option value={false}>{isRTL ? "لا" : "No"}</option>
                <option value={true}>{isRTL ? "نعم" : "Yes"}</option>
              </select>
            </div>

            {requiresHomework && (
              <div className="mt-3 rounded-xl border border-base-300 bg-base-100/70 p-3">
                <ExamConfigSection
                  isEnabled={requiresHomework}
                  selectedExamConfigId={selectedHomeworkConfigId}
                  setSelectedExamConfigId={setSelectedHomeworkConfigId}
                  passingThreshold={homeworkPassingThreshold}
                  setPassingThreshold={setHomeworkPassingThreshold}
                  onExamConfigCreated={setSelectedHomeworkConfigId}
                  configType="homework"
                />
              </div>
            )}

            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">{isRTL ? "نوع المرفق" : "Attachment Type"}</label>
              <select
                className={compactSelect}
                value={attachmentType}
                onChange={(e) => setAttachmentType(e.target.value)}
              >
                <option value="pdfsandimages">{isRTL ? "ملفات PDF وصور" : "PDFs and Images"}</option>
                <option value="booklets">{isRTL ? "كتيبات" : "Booklets"}</option>
                <option value="homeworks">{isRTL ? "واجبات منزلية" : "Homeworks"}</option>
                <option value="exams">{isRTL ? "امتحانات" : "Exams"}</option>
              </select>
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">
                {isRTL ? "إرفاق واجب (اختياري، .pdf فقط)" : "Attach Homework (Optional, .pdf only)"}
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={(e) => setAttachmentFile(e.target.files[0])}
                  className="file-input file-input-bordered file-input-sm w-full bg-base-200/80"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <Paperclip className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary" />
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
                    className="file-input file-input-bordered file-input-sm w-full bg-base-200/80"
                    accept="image/*"
                  />
                  <Paperclip className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary" />
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
        setSelectedParentId={setSelectedParentId}
        expandedItems={expandedItems}
        toggleExpand={toggleExpand}
      />
    </div>
  )
}

export default ContainerCreationPanel
