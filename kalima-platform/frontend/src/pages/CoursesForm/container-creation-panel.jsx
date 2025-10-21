"use client"

import { useState, useEffect } from "react"
import { FolderPlus, FileText, Paperclip } from "lucide-react"
import { createContainer, createLecture, createLectureAttachment } from "../../routes/lectures"
import { getAllSubjects } from "../../routes/courses"
import { getExamConfigs, createExamConfig } from "../../routes/examConfigs"
import ContainerList from "./container-list"

const CONTAINER_TYPES = {
  COURSE: "course",
  YEAR: "year",
  TERM: "term",
  MONTH: "month",
  LECTURE: "lecture",
}

function ContainerCreationPanel({ courseStructure, updateCourseStructure, formData, createdBy, isRTL }) {
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
  const [examConfig, setExamConfig] = useState("")
  const [passingThreshold, setPassingThreshold] = useState(50)
  const [containerPrice, setContainerPrice] = useState(0)
  const [description, setDescription] = useState("")
  const [imageFile, setImageFile] = useState(null)
  const [expandedItems, setExpandedItems] = useState({})

  // New state variables for exam configuration
  const [examConfigs, setExamConfigs] = useState([])
  const [examConfigsLoading, setExamConfigsLoading] = useState(false)
  const [examConfigsError, setExamConfigsError] = useState("")
  const [selectedExamConfigId, setSelectedExamConfigId] = useState("")
  const [isCreatingNewExamConfig, setIsCreatingNewExamConfig] = useState(false)
  const [newExamConfig, setNewExamConfig] = useState({
    name: "",
    description: "",
    googleSheetId: "",
    formUrl: "",
    studentIdentifierColumn: "Email Address",
    scoreColumn: "Score",
    defaultPassingThreshold: 60,
  })
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

  // Fetch exam configs when container type is lecture and requiresExam is true
  useEffect(() => {
    if (containerType === CONTAINER_TYPES.LECTURE && requiresExam) {
      fetchExamConfigs()
    }
  }, [containerType, requiresExam])

  // Add this effect for default passing threshold
  useEffect(() => {
    if (selectedExamConfigId && !isCreatingNewExamConfig) {
      const selectedConfig = examConfigs.find((c) => c._id === selectedExamConfigId)
      if (selectedConfig) {
        setPassingThreshold(selectedConfig.defaultPassingThreshold)
      }
    }
  }, [selectedExamConfigId, examConfigs, isCreatingNewExamConfig])

  const fetchExamConfigs = async () => {
    setExamConfigsLoading(true)
    setExamConfigsError("")
    try {
      const response = await getExamConfigs()

      if (response.success && response.data) {
        // Try to extract exam configs from different possible response structures
        const configs =
          (response.data.data && response.data.data.examConfigs) || // Format: { data: { data: { examConfigs: [...] } } }
          response.data.examConfigs || // Format: { data: { examConfigs: [...] } }
          (Array.isArray(response.data) ? response.data : []) // Format: { data: [...] }


        if (Array.isArray(configs) && configs.length > 0) {
          setExamConfigs(configs)
        } else {
          setExamConfigsError("No exam configurations found. Please create a new one.")
          setExamConfigs([])
        }
      } else {
        console.error("Failed to fetch exam configs:", response.message)
        setExamConfigsError(response.message || "Failed to fetch exam configs")
        setExamConfigs([])
      }
    } catch (err) {
      console.error("Error fetching exam configs:", err)
      setExamConfigsError(err.message || "Failed to fetch exam configs")
      setExamConfigs([])
    } finally {
      setExamConfigsLoading(false)
    }
  }

  const toggleExpand = (type, id) => {
    setExpandedItems((prev) => ({
      ...prev,
      [`${type}_${id}`]: !prev[`${type}_${id}`],
    }))
  }

  const handleCreateContainer = async (e) => {
    e.preventDefault()

    if (!selectedParentId) {
      alert(isRTL ? "يرجى تحديد الحاوية الأب" : "Please select a parent container")
      return
    }

    if (!containerName) {
      alert(isRTL ? "يرجى إدخال اسم الحاوية" : "Please enter a container name")
      return
    }

    setIsSubmitting(true)

    try {
      if (containerType === CONTAINER_TYPES.LECTURE) {
        if (!lectureLink) {
          alert(isRTL ? "يرجى إدخال رابط المحاضرة" : "Please enter a lecture link")
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

        // Handle exam configuration if required
        if (requiresExam) {
          let examConfigIdToUse

          if (isCreatingNewExamConfig) {
            // Validate required fields for new exam config
            if (!newExamConfig.name || !newExamConfig.googleSheetId || !newExamConfig.formUrl) {
              alert(
                isRTL
                  ? "يرجى ملء جميع حقول تكوين الامتحان المطلوبة"
                  : "Please fill in all required exam configuration fields",
              )
              setIsSubmitting(false)
              return
            }

            const createResponse = await createExamConfig(newExamConfig)

            // Extract the exam config ID from different response formats
            if (createResponse.success === true && createResponse.data) {
              if (createResponse.data._id) {
                examConfigIdToUse = createResponse.data._id
              } else if (
                createResponse.data.data &&
                createResponse.data.data.examConfig &&
                createResponse.data.data.examConfig._id
              ) {
                examConfigIdToUse = createResponse.data.data.examConfig._id
              } else if (createResponse.data.examConfig && createResponse.data.examConfig._id) {
                examConfigIdToUse = createResponse.data.examConfig._id
              } else {
                console.error("Could not find exam config ID in response:", createResponse)
                throw new Error("Failed to extract exam config ID from response")
              }
            } else if (createResponse.status === "success" && createResponse.data && createResponse.data._id) {
              examConfigIdToUse = createResponse.data._id
            } else {
              console.error("Invalid response format from createExamConfig:", createResponse)
              throw new Error(createResponse.message || "Failed to create exam config")
            }
          } else {
            if (!selectedExamConfigId) {
              alert(isRTL ? "يرجى تحديد تكوين الامتحان" : "Please select an exam configuration")
              setIsSubmitting(false)
              return
            }
            examConfigIdToUse = selectedExamConfigId
          }

          // Set the exam config ID in the lecture data (without passing threshold)
          lectureData.requiresExam = true
          lectureData.examConfig = examConfigIdToUse
          // Passing threshold is now defined in the exam config
        }

        const response = await createLecture(lectureData)

        if (response.status !== "success" && response.success !== true) {
          throw new Error(response.message || "Failed to create lecture")
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
            alert(
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
      setExamConfig("")
      setPassingThreshold(50)
      setContainerPrice(0)
      setDescription("")
      setImageFile(null)
      setSelectedExamConfigId("")
      setIsCreatingNewExamConfig(false)
      setNewExamConfig({
        name: "",
        description: "",
        googleSheetId: "",
        formUrl: "",
        studentIdentifierColumn: "Email Address",
        scoreColumn: "Score",
        defaultPassingThreshold: 60,
      })
      setAttachmentType("homeworks")

      alert(
        isRTL
          ? `تم إنشاء ${containerType === CONTAINER_TYPES.LECTURE ? "المحاضرة" : "الحاوية"} بنجاح`
          : `${containerType === CONTAINER_TYPES.LECTURE ? "Lecture" : "Container"} created successfully`,
      )
    } catch (error) {
      console.error(`Error creating ${containerType}:`, error)
      alert(
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

  // Exam Config Section Component
  const ExamConfigSection = () => {
    if (!requiresExam) return null

    const hasExistingConfigs = Array.isArray(examConfigs) && examConfigs.length > 0

    return (
      <>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">{isRTL ? "تكوين الامتحان" : "Exam Configuration"}</label>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <select
                className="w-full select select-bordered bg-base-200"
                value={isCreatingNewExamConfig ? "new" : selectedExamConfigId}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === "new") {
                    setIsCreatingNewExamConfig(true)
                    setSelectedExamConfigId("")
                  } else {
                    setIsCreatingNewExamConfig(false)
                    setSelectedExamConfigId(value)
                  }
                }}
                disabled={examConfigsLoading}
              >
                <option value="">{isRTL ? "اختر تكوين الامتحان" : "Select Exam Config"}</option>
                {hasExistingConfigs ? (
                  examConfigs.map((config) => (
                    <option key={config._id} value={config._id}>
                      {config.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    {isRTL ? "لا توجد تكوينات موجودة" : "No existing configs"}
                  </option>
                )}
                <option value="new">{isRTL ? "إنشاء تكوين امتحان جديد" : "Create New Exam Config"}</option>
              </select>
              {examConfigsLoading && <span className="loading loading-spinner"></span>}
            </div>
            {examConfigsError && <div className="text-error text-sm">{examConfigsError}</div>}
            {!hasExistingConfigs && !examConfigsError && !examConfigsLoading && (
              <div className="text-info text-sm">
                {isRTL
                  ? "لم يتم العثور على تكوينات امتحان موجودة. يمكنك إنشاء واحدة جديدة."
                  : "No existing exam configurations found. You can create a new one."}
              </div>
            )}
          </div>
        </div>

        {isCreatingNewExamConfig ? (
          <NewExamConfigForm />
        ) : (
          selectedExamConfigId && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">{isRTL ? "عتبة النجاح" : "Passing Threshold"}</label>
              <input
                type="number"
                placeholder={isRTL ? "أدخل عتبة النجاح" : "Enter passing threshold"}
                className="w-full input input-bordered bg-base-200"
                value={passingThreshold}
                onChange={(e) => setPassingThreshold(e.target.value)}
                min="0"
                max="100"
                required
              />
            </div>
          )
        )}
      </>
    )
  }

  // New Exam Config Form Component
  const NewExamConfigForm = () => {
    return (
      <div className="space-y-4 mb-4 p-4 border border-base-300 rounded-lg bg-base-200">
        <h4 className="font-medium">{isRTL ? "تكوين امتحان جديد" : "New Exam Configuration"}</h4>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">{isRTL ? "الاسم" : "Name"}</label>
          <input
            type="text"
            placeholder={isRTL ? "أدخل اسم تكوين الامتحان" : "Enter exam config name"}
            className="w-full input input-bordered bg-base-200"
            value={newExamConfig.name}
            onChange={(e) => setNewExamConfig((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">{isRTL ? "الوصف" : "Description"}</label>
          <textarea
            placeholder={isRTL ? "أدخل الوصف" : "Enter description"}
            className="w-full textarea textarea-bordered bg-base-200"
            value={newExamConfig.description}
            onChange={(e) => setNewExamConfig((prev) => ({ ...prev, description: e.target.value }))}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            {isRTL ? "معرف جدول بيانات Google" : "Google Sheet ID"}
          </label>
          <input
            type="text"
            placeholder={
              isRTL
                ? "مثال : 1Iaosq_KHl7w6__oJB9nFnFr9QYiTDmSSKrWADszUcsM"
                : "Eg : 1Iaosq_KHl7w6__oJB9nFnFr9QYiTDmSSKrWADszUcsM"
            }
            className="w-full input input-bordered bg-base-200"
            value={newExamConfig.googleSheetId}
            onChange={(e) => setNewExamConfig((prev) => ({ ...prev, googleSheetId: e.target.value }))}
            required
          />
          <label className="label">
            <span className="label-text-alt">
              {isRTL ? "المعرف من عنوان URL لجدول بيانات Google الخاص بك" : "The ID from your Google Sheet URL"}
            </span>
          </label>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">{isRTL ? "عنوان URL للنموذج" : "Form URL"}</label>
          <input
            type="url"
            placeholder={isRTL ? "أدخل عنوان URL لنموذج Google" : "Enter Google Form URL"}
            className="w-full input input-bordered bg-base-200"
            value={newExamConfig.formUrl}
            onChange={(e) => setNewExamConfig((prev) => ({ ...prev, formUrl: e.target.value }))}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {isRTL ? "عمود معرف الطالب" : "Student Identifier Column"}
            </label>
            <input
              type="text"
              placeholder={isRTL ? "اسم العمود" : "Column name"}
              className="w-full input input-bordered bg-base-200"
              value={newExamConfig.studentIdentifierColumn}
              onChange={(e) => setNewExamConfig((prev) => ({ ...prev, studentIdentifierColumn: e.target.value }))}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">{isRTL ? "عمود النتيجة" : "Score Column"}</label>
            <input
              type="text"
              placeholder={isRTL ? "اسم العمود" : "Column name"}
              className="w-full input input-bordered bg-base-200"
              value={newExamConfig.scoreColumn}
              onChange={(e) => setNewExamConfig((prev) => ({ ...prev, scoreColumn: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            {isRTL ? "عتبة النجاح الافتراضية (%)" : "Default Passing Threshold (%)"}
          </label>
          <input
            type="number"
            placeholder={isRTL ? "أدخل العتبة" : "Enter threshold"}
            className="w-full input input-bordered bg-base-200"
            value={newExamConfig.defaultPassingThreshold}
            onChange={(e) => setNewExamConfig((prev) => ({ ...prev, defaultPassingThreshold: Number(e.target.value) }))}
            min="0"
            max="100"
            required
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-base-100 rounded-xl shadow-md p-6">
      <h2 className="text-lg font-bold mb-6 text-primary text-center">
        {isRTL ? "إضافة محتوى تعليمي" : "Add Educational Content"}
      </h2>

      <form onSubmit={handleCreateContainer} className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">{isRTL ? "نوع المحتوى" : "Content Type"}</label>
            <select
              value={containerType}
              onChange={(e) => {
                setContainerType(e.target.value)
                setSelectedParentId(null)
              }}
              className="w-full select select-bordered bg-base-200"
              required
            >
              <option value={CONTAINER_TYPES.COURSE}>{isRTL ? "دورة" : "Course"}</option>
              <option value={CONTAINER_TYPES.YEAR}>{isRTL ? "سنة دراسية" : "Academic Year"}</option>
              <option value={CONTAINER_TYPES.TERM}>{isRTL ? "فصل دراسي" : "Term"}</option>
              <option value={CONTAINER_TYPES.MONTH}>{isRTL ? "شهر" : "Month"}</option>
              <option value={CONTAINER_TYPES.LECTURE}>{isRTL ? "محاضرة" : "Lecture"}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{isRTL ? "الحاوية الأب" : "Parent Container"}</label>
            <select
              value={selectedParentId || ""}
              onChange={(e) => setSelectedParentId(e.target.value)}
              className="w-full select select-bordered bg-base-200"
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
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">{isRTL ? "اسم المحتوى" : "Content Name"}</label>
          <input
            type="text"
            value={containerName}
            onChange={(e) => setContainerName(e.target.value)}
            placeholder={isRTL ? "اسم المحتوى" : "Content name"}
            className="w-full input input-bordered bg-base-200"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">{isRTL ? "الموضوع" : "Subject"}</label>
          <select
            value={formData.subject || ""}
            onChange={(e) => {
              updateCourseStructure({ ...courseStructure, formData: { ...formData, subject: e.target.value } })
            }}
            className="w-full select select-bordered bg-base-200"
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

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">{isRTL ? "الوصف" : "Description"}</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={isRTL ? "الوصف" : "Description"}
            className="w-full input input-bordered bg-base-200"
          />
        </div>

        {containerType === CONTAINER_TYPES.LECTURE ? (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">{isRTL ? "نوع المحاضرة" : "Lecture Type"}</label>
              <select
                value={lectureType}
                onChange={(e) => setLectureType(e.target.value)}
                className="w-full select select-bordered bg-base-200"
              >
                <option value="Paid">{isRTL ? "مدفوع" : "Paid"}</option>
                <option value="Revision">{isRTL ? "مراجعة" : "Revision"}</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">{isRTL ? "سعر المحاضرة" : "Lecture Price"}</label>
              <input
                type="number"
                value={lecturePrice}
                onChange={(e) => setLecturePrice(e.target.value)}
                placeholder={isRTL ? "سعر المحاضرة" : "Lecture price"}
                className="w-full input input-bordered bg-base-200"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">{isRTL ? "رابط المحاضرة" : "Lecture Link"}</label>
              <input
                type="text"
                value={lectureLink}
                onChange={(e) => setLectureLink(e.target.value)}
                placeholder={isRTL ? "رابط الفيديو" : "Video link"}
                className="w-full input input-bordered bg-base-200"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">{isRTL ? "عدد المشاهدات" : "Number of Views"}</label>
              <input
                type="number"
                value={numberOfViews}
                onChange={(e) => setNumberOfViews(e.target.value)}
                placeholder={isRTL ? "عدد المشاهدات" : "Number of views"}
                className="w-full input input-bordered bg-base-200"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                {isRTL ? "هل تحتاج إلى امتحان؟" : "Requires Exam?"}
              </label>
              <select
                value={requiresExam}
                onChange={(e) => setRequiresExam(e.target.value === "true")}
                className="w-full select select-bordered bg-base-200"
              >
                <option value={false}>{isRTL ? "لا" : "No"}</option>
                <option value={true}>{isRTL ? "نعم" : "Yes"}</option>
              </select>
            </div>

            {/* Exam Config Section */}
            {requiresExam && <ExamConfigSection />}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">{isRTL ? "نوع المرفق" : "Attachment Type"}</label>
              <select
                className="w-full select select-bordered bg-base-200"
                value={attachmentType}
                onChange={(e) => setAttachmentType(e.target.value)}
              >
                <option value="pdfsandimages">{isRTL ? "ملفات PDF وصور" : "PDFs and Images"}</option>
                <option value="booklets">{isRTL ? "كتيبات" : "Booklets"}</option>
                <option value="homeworks">{isRTL ? "واجبات منزلية" : "Homeworks"}</option>
                <option value="exams">{isRTL ? "امتحانات" : "Exams"}</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                {isRTL ? "إرفاق واجب (اختياري، .pdf فقط)" : "Attach Homework (Optional, .pdf only)"}
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={(e) => setAttachmentFile(e.target.files[0])}
                  className="file-input file-input-bordered w-full bg-base-200"
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
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">{isRTL ? "سعر الحاوية" : "Container Price"}</label>
              <input
                type="number"
                value={containerPrice}
                onChange={(e) => setContainerPrice(e.target.value)}
                placeholder={isRTL ? "سعر الحاوية" : "Container price"}
                className="w-full input input-bordered bg-base-200"
              />
            </div>
            {containerType === CONTAINER_TYPES.COURSE && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  {isRTL ? "إرفاق صورة (اختياري)" : "Attach Image (Optional)"}
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    className="file-input file-input-bordered w-full bg-base-200"
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

        <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
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
