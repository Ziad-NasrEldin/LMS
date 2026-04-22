"use client"

import { useState, useEffect } from "react"
import { FolderPlus, FileText, Paperclip } from "lucide-react"
import toast from "react-hot-toast"
import { createContainer, createLecture, createLectureAttachment } from "../../routes/lectures"
import { getAllSubjects } from "../../routes/courses"
import ContainerList from "./container-list"
import { translateErrorMessage } from "../../utils/errorTranslator"
import DSSelect from "../../components/DSSelect"
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import FormContainer from "../../components/ui/FormContainer";
import {
  buildContainerPayloadObject,
  buildLecturePayloadObject,
  objectToFormData,
} from "../../utils/contentCreationPayloads"
import {
  CONTAINER_TYPES,
  DEFAULT_LECTURE_ATTACHMENT_TYPE,
  getAvailableParentsForType,
  getNextChildType,
  getSuggestedParentIdForType,
  INITIAL_CREATION_PANEL_STATE,
  normalizeStructureId,
  resetCreationPanelState,
} from "./course-form-helpers"
import { MIN_LIMITED_LECTURE_DURATION_HOURS } from "../../utils/limitedLectureAvailability"

function ContainerCreationPanel({ courseStructure, updateCourseStructure, formData, createdBy, isRTL }) {
  const [containerName, setContainerName] = useState(INITIAL_CREATION_PANEL_STATE.containerName)
  const [containerType, setContainerType] = useState(INITIAL_CREATION_PANEL_STATE.containerType)
  const [selectedParentId, setSelectedParentId] = useState(courseStructure.parent?.id || INITIAL_CREATION_PANEL_STATE.selectedParentId)
  const [lectureLink, setLectureLink] = useState(INITIAL_CREATION_PANEL_STATE.lectureLink)
  const [attachmentFile, setAttachmentFile] = useState(INITIAL_CREATION_PANEL_STATE.attachmentFile)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [subjects, setSubjects] = useState([])
  const [numberOfViews, setNumberOfViews] = useState(INITIAL_CREATION_PANEL_STATE.numberOfViews)
  const [lecturePrice, setLecturePrice] = useState(INITIAL_CREATION_PANEL_STATE.lecturePrice)
  const [limitedAvailabilityEnabled, setLimitedAvailabilityEnabled] = useState(
    INITIAL_CREATION_PANEL_STATE.limitedAvailabilityEnabled,
  )
  const [limitedAvailabilityDurationHours, setLimitedAvailabilityDurationHours] = useState(
    INITIAL_CREATION_PANEL_STATE.limitedAvailabilityDurationHours,
  )
  const [requiresExam, setRequiresExam] = useState(INITIAL_CREATION_PANEL_STATE.requiresExam)
  const [examFormUrl, setExamFormUrl] = useState(INITIAL_CREATION_PANEL_STATE.examFormUrl)
  const [passingThreshold, setPassingThreshold] = useState(INITIAL_CREATION_PANEL_STATE.passingThreshold)
  const [requiresHomework, setRequiresHomework] = useState(INITIAL_CREATION_PANEL_STATE.requiresHomework)
  const [homeworkFormUrl, setHomeworkFormUrl] = useState(INITIAL_CREATION_PANEL_STATE.homeworkFormUrl)
  const [homeworkPassingThreshold, setHomeworkPassingThreshold] = useState(INITIAL_CREATION_PANEL_STATE.homeworkPassingThreshold)
  const [containerPrice, setContainerPrice] = useState(INITIAL_CREATION_PANEL_STATE.containerPrice)
  const [description, setDescription] = useState(INITIAL_CREATION_PANEL_STATE.description)
  const [goal, setGoal] = useState(INITIAL_CREATION_PANEL_STATE.goal)
  const [imageFile, setImageFile] = useState(INITIAL_CREATION_PANEL_STATE.imageFile)
  const [expandedItems, setExpandedItems] = useState({})
  const attachmentType = DEFAULT_LECTURE_ATTACHMENT_TYPE

  const getContainerById = (containerId) => {
    if (!containerId) return null

    const rootId = normalizeStructureId(courseStructure.parent)
    if (rootId && String(rootId) === String(containerId)) {
      return courseStructure.parent
    }

    return courseStructure.containers.find((container) => String(container.id) === String(containerId)) || null
  }

  const handleContainerTypeChange = (nextType) => {
    setContainerType(nextType)
    const suggestedParentId = getSuggestedParentIdForType(courseStructure, nextType)
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
      toast.error(translateErrorMessage("Please select a parent container"))
      return
    }

    if (!containerName) {
      toast.error(translateErrorMessage("Please enter a container name"))
      return
    }

    setIsSubmitting(true)

    try {
      if (containerType === CONTAINER_TYPES.LECTURE) {
        if (!lectureLink) {
          toast.error(translateErrorMessage("Please enter a lecture link"))
          setIsSubmitting(false)
          return
        }

        // Create the base lecture data object
        if (requiresExam && !examFormUrl) {
          toast.error(translateErrorMessage("Please provide an exam form URL"))
          setIsSubmitting(false)
          return
        }

        if (requiresHomework && !homeworkFormUrl) {
          toast.error(translateErrorMessage("Please provide a homework form URL"))
          setIsSubmitting(false)
          return
        }

        if (
          limitedAvailabilityEnabled &&
          Number(limitedAvailabilityDurationHours) < MIN_LIMITED_LECTURE_DURATION_HOURS
        ) {
          toast.error(
            isRTL
              ? `مدة إتاحة المحاضرة يجب ألا تقل عن ${MIN_LIMITED_LECTURE_DURATION_HOURS} ساعة`
              : `Limited lecture duration must be at least ${MIN_LIMITED_LECTURE_DURATION_HOURS} hours`,
          )
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
          limitedAvailabilityEnabled,
          limitedAvailabilityDurationHours: Number(limitedAvailabilityDurationHours),
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
          toast.error(translateErrorMessage("Please enter a course description"))
          setIsSubmitting(false)
          return
        }

        if (isCourseContainer && !goal.trim()) {
          toast.error(translateErrorMessage("Please enter a course goal"))
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
      resetCreationPanelState({
        setContainerName,
        setLectureLink,
        setAttachmentFile,
        setNumberOfViews,
        setLecturePrice,
        setLimitedAvailabilityEnabled,
        setLimitedAvailabilityDurationHours,
        setRequiresExam,
        setExamFormUrl,
        setPassingThreshold,
        setRequiresHomework,
        setHomeworkFormUrl,
        setHomeworkPassingThreshold,
        setContainerPrice,
        setDescription,
        setGoal,
        setImageFile,
      })

      toast.success(
        isRTL
          ? `تم إنشاء ${containerType === CONTAINER_TYPES.LECTURE ? "المحاضرة" : "الحاوية"} بنجاح`
          : `${containerType === CONTAINER_TYPES.LECTURE ? "Lecture" : "Container"} created successfully`,
      )
    } catch (error) {
      console.error(`Error creating ${containerType}:`, error)
      toast.error(
        translateErrorMessage(
          error?.message ||
            `Error creating ${containerType === CONTAINER_TYPES.LECTURE ? "lecture" : "container"}`
        )
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const availableParents = getAvailableParentsForType(courseStructure, containerType)

  return (
    <div className="rounded-[1.4rem] bg-white/90 p-4 shadow-md sm:p-5" style={{ borderColor: "transparent" }}>
      <div className="mb-4 rounded-2xl border p-4" style={{ borderColor: "rgba(14,85,99,0.16)", background: "linear-gradient(135deg, rgba(188,231,236,0.42), rgba(248,243,233,0.9))" }}>
        <h2 className={`text-base sm:text-lg font-bold text-primary ${isRTL ? "text-right" : "text-left"}`}>
          {isRTL ? "إضافة محتوى تعليمي" : "Add Educational Content"}
        </h2>
         <p className={`mt-1 text-xs sm:text-sm text-slate-900/75 ${isRTL ? "text-right" : "text-left"}`}>
          {isRTL ? "ابدأ بالهيكل الصحيح: سنة ثم فصل ثم شهر ثم محاضرة." : "Use the hierarchy in order: year, term, month, then lecture."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-900/70">
            {isRTL ? "1. اختر النوع" : "1. Choose type"}
          </span>
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-900/70">
            {isRTL ? "2. اختر الأب" : "2. Choose parent"}
          </span>
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-900/70">
            {isRTL ? "3. املأ التفاصيل" : "3. Fill details"}
          </span>
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-900/70">
            {isRTL ? "4. احفظ" : "4. Save"}
          </span>
        </div>
         <p className={`mt-3 text-xs text-slate-900/60 ${isRTL ? "text-right" : "text-left"}`}>
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
              className="w-full h-10 bg-slate-100/80"
              required
            >
              <option value={CONTAINER_TYPES.COURSE}>{isRTL ? "دورة" : "Course"}</option>
              <option value={CONTAINER_TYPES.YEAR} disabled={!getSuggestedParentIdForType(courseStructure, CONTAINER_TYPES.YEAR)}>
                {isRTL ? "سنة دراسية" : "Academic Year"}
              </option>
              <option value={CONTAINER_TYPES.TERM} disabled={!getSuggestedParentIdForType(courseStructure, CONTAINER_TYPES.TERM)}>
                {isRTL ? "فصل دراسي" : "Term"}
              </option>
              <option value={CONTAINER_TYPES.MONTH} disabled={!getSuggestedParentIdForType(courseStructure, CONTAINER_TYPES.MONTH)}>
                {isRTL ? "شهر" : "Month"}
              </option>
              <option value={CONTAINER_TYPES.LECTURE} disabled={!getSuggestedParentIdForType(courseStructure, CONTAINER_TYPES.LECTURE)}>
                {isRTL ? "محاضرة" : "Lecture"}
              </option>
            </DSSelect>
            <p className="mt-1 text-xs text-slate-900/55">
              {containerType === CONTAINER_TYPES.LECTURE
                ? (isRTL ? "المحاضرة ستظهر داخل الشهر المختار." : "The lecture will live under the selected month.")
                : isRTL
                  ? "أنشئ هذا الجزء في المكان الصحيح من الهيكل."
                  : "Create this part in the correct place within the structure."}
            </p>
            <p className="mt-1 text-xs text-slate-900/45">
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
              className="w-full h-10 bg-slate-100/80"
              required
            >
              <option value="" disabled>
                {isRTL ? "اختر الحاوية الأب" : "Select parent container"}
              </option>
              {availableParents.map((container) => (
                <option key={container.id} value={container.id}>
                  {container.name}
                </option>
              ))}
            </DSSelect>
            <p className="mt-1 text-xs text-slate-900/55">
              {isRTL
                ? "اختيار الأب يملأ نوع المحتوى تلقائياً."
                : "Selecting a parent auto-fills the matching content type."}
            </p>
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-sm font-medium mb-1">{isRTL ? "اسم المحتوى" : "Content Name"}</label>
          <Input
            type="text"
            value={containerName}
            onChange={(e) => setContainerName(e.target.value)}
            placeholder={isRTL ? "اسم المحتوى" : "Content name"}
            size="sm"
            className="h-10 bg-slate-100/80"
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
            className="w-full h-10 bg-slate-100/80"
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
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isRTL ? "الوصف" : "Description"}
                size="sm"
                className="h-10 bg-slate-100/80"
              />
            </div>

            {containerType === CONTAINER_TYPES.COURSE && (
              <div className="mt-3">
                <label className="block text-sm font-medium mb-1">{isRTL ? "هدف الكورس" : "Course Goal"}</label>
                <Textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder={isRTL ? "هدف الكورس" : "Course goal"}
                  size="sm"
                  className="min-h-24 bg-slate-100/80"
                />
              </div>
            )}

            {containerType === CONTAINER_TYPES.LECTURE ? (
              <>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
              <label className="block text-sm font-medium mb-1">{isRTL ? "سعر المحاضرة" : "Lecture Price"}</label>
              <Input
                type="number"
                value={lecturePrice}
                onChange={(e) => setLecturePrice(e.target.value)}
                placeholder={isRTL ? "سعر المحاضرة" : "Lecture price"}
                size="sm"
                className="h-10 bg-slate-100/80"
              />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
              <label className="block text-sm font-medium mb-1">{isRTL ? "رابط المحاضرة" : "Lecture Link"}</label>
              <Input
                type="text"
                value={lectureLink}
                onChange={(e) => setLectureLink(e.target.value)}
                placeholder={isRTL ? "رابط الفيديو" : "Video link"}
                size="sm"
                className="h-10 bg-slate-100/80"
                required
              />
              </div>
              <div>
              <label className="block text-sm font-medium mb-1">{isRTL ? "عدد المشاهدات" : "Number of Views"}</label>
              <Input
                type="number"
                value={numberOfViews}
                onChange={(e) => setNumberOfViews(e.target.value)}
                placeholder={isRTL ? "عدد المشاهدات" : "Number of views"}
                size="sm"
                className="h-10 bg-slate-100/80"
                required
              />
              </div>
            </div>
            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {isRTL ? "محاضرة بمدة إتاحة محدودة؟" : "Limited Lecture?"}
                  </label>
                  <DSSelect
                    value={limitedAvailabilityEnabled}
                    onChange={(e) => setLimitedAvailabilityEnabled(e.target.value === "true")}
                    className="w-full h-10 bg-slate-100/80"
                  >
                    <option value={false}>{isRTL ? "لا" : "No"}</option>
                    <option value={true}>{isRTL ? "نعم" : "Yes"}</option>
                  </DSSelect>
                </div>
                {limitedAvailabilityEnabled && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {isRTL ? "مدة الإتاحة بالساعات" : "Availability Duration (Hours)"}
                    </label>
                    <Input
                      type="number"
                      value={limitedAvailabilityDurationHours}
                      onChange={(e) => setLimitedAvailabilityDurationHours(e.target.value)}
                      size="sm"
                      className="h-10 bg-slate-100/80"
                      min={MIN_LIMITED_LECTURE_DURATION_HOURS}
                    />
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-slate-600">
                {limitedAvailabilityEnabled
                  ? isRTL
                    ? "يمكن شراء هذه المحاضرة مباشرة خلال هذه المدة فقط. بعد انتهاء المدة يجب إيقاف الميزة ثم تفعيلها مرة أخرى لإعادة فتح الشراء."
                    : "This lecture can be purchased directly only during this window. After expiry, disable it and enable it again to reopen purchases."
                  : isRTL
                    ? "عند التفعيل، يمكن تحديد نافذة شراء تبدأ من 24 ساعة فأكثر."
                    : "Enable this to make the lecture purchasable only for a limited time window of at least 24 hours."}
              </p>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">
                {isRTL ? "هل تحتاج إلى امتحان؟" : "Requires Exam?"}
              </label>
              <DSSelect
                value={requiresExam}
                onChange={(e) => setRequiresExam(e.target.value === "true")}
                className="w-full h-10 bg-slate-100/80"
              >
                <option value={false}>{isRTL ? "لا" : "No"}</option>
                <option value={true}>{isRTL ? "نعم" : "Yes"}</option>
              </DSSelect>
            </div>

            {requiresExam && (
              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {isRTL ? "رابط الامتحان" : "Exam Form URL"}
                    </label>
                    <Input
                      type="url"
                      value={examFormUrl}
                      onChange={(e) => setExamFormUrl(e.target.value)}
                      placeholder={isRTL ? "رابط Google Form للامتحان" : "Google Form URL for exam"}
                      size="sm"
                      className="h-10 bg-slate-100/80"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {isRTL ? "حد النجاح (%)" : "Passing Threshold (%)"}
                    </label>
                    <Input
                      type="number"
                      value={passingThreshold}
                      onChange={(e) => setPassingThreshold(e.target.value)}
                      size="sm"
                      className="h-10 bg-slate-100/80"
                      helperText={
                        isRTL
                          ? "استخدم نسبة مئوية وليس عدد النقاط. مثال: 60 تعني 60٪."
                          : "Use a percentage, not raw points. Example: 60 means 60%."
                      }
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
                className="w-full h-10 bg-slate-100/80"
              >
                <option value={false}>{isRTL ? "لا" : "No"}</option>
                <option value={true}>{isRTL ? "نعم" : "Yes"}</option>
              </DSSelect>
            </div>

            {requiresHomework && (
              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {isRTL ? "رابط الواجب" : "Homework Form URL"}
                    </label>
                    <Input
                      type="url"
                      value={homeworkFormUrl}
                      onChange={(e) => setHomeworkFormUrl(e.target.value)}
                      placeholder={isRTL ? "رابط Google Form للواجب" : "Google Form URL for homework"}
                      size="sm"
                      className="h-10 bg-slate-100/80"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {isRTL ? "حد النجاح (%)" : "Passing Threshold (%)"}
                    </label>
                    <Input
                      type="number"
                      value={homeworkPassingThreshold}
                      onChange={(e) => setHomeworkPassingThreshold(e.target.value)}
                      size="sm"
                      className="h-10 bg-slate-100/80"
                      helperText={
                        isRTL
                          ? "استخدم نسبة مئوية وليس عدد النقاط. مثال: 60 تعني 60٪."
                          : "Use a percentage, not raw points. Example: 60 means 60%."
                      }
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            )}

              <div className="mt-3">
                <label className="block text-sm font-medium mb-1">
                  {isRTL ? "إرفاق ملف إضافي (اختياري)" : "Attach Supporting File (Optional)"}
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={(e) => setAttachmentFile(e.target.files[0])}
                    className="w-full text-sm text-neutral border border-gray-300 rounded-lg p-2 bg-slate-100/80 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <Paperclip className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
                </div>
                <p className="mt-1 text-xs text-slate-900/55">
                  {isRTL ? "يتم حفظ كل المرفقات في مسار واحد بدل تقسيمها إلى أنواع متعددة." : "Attachments are now stored through one unified path instead of multiple categories."}
                </p>
                {attachmentFile && (
                  <p className="mt-2 text-sm text-slate-900/70">
                    {isRTL ? "الملف المختار:" : "Selected file:"} {attachmentFile.name}
                  </p>
                )}
            </div>
          </>
        ) : (
          <>
            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">{isRTL ? "سعر الحاوية" : "Container Price"}</label>
              <Input
                type="number"
                value={containerPrice}
                onChange={(e) => setContainerPrice(e.target.value)}
                placeholder={isRTL ? "سعر الحاوية" : "Container price"}
                size="sm"
                className="h-10 bg-slate-100/80"
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
                    className="w-full text-sm text-neutral border border-gray-300 rounded-lg p-2 bg-slate-100/80 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                    accept="image/*"
                  />
                  <Paperclip className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
                </div>
                {imageFile && (
                  <p className="mt-2 text-sm text-slate-900/70">
                    {isRTL ? "الملف المختار:" : "Selected file:"} {imageFile.name}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        <Button 
          type="submit" 
          className="w-full rounded-full" 
          isLoading={isSubmitting}
          variant="primary"
        >
          {containerType === CONTAINER_TYPES.LECTURE ? (
            <>
              <FileText className="w-4 h-4 mr-1" />
              {isRTL ? `إضافة محاضرة` : `Add Lecture`}
            </>
          ) : (
            <>
              <FolderPlus className="w-4 h-4 mr-1" />
              {isRTL ? `إضافة حاوية` : `Add Container`}
            </>
          )}
        </Button>
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
