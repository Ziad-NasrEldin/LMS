"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ImageIcon, Video, ChevronDown } from "lucide-react"
import { createContainer } from "../../routes/lectures"

function BasicInfoForm({
  formData,
  handleChange,
  subjects,
  levels,
  isRTL,
  courseStructure,
  updateCourseStructure,
  createdBy,
}) {
  const [courseImage, setCourseImage] = useState(null)
  const [courseVideo, setCourseVideo] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file && file.size <= 1024 * 1024 * 1024) {
      setCourseImage(file)
    } else {
      alert(isRTL ? "حجم الملف يجب أن يكون أقل من 1 جيجابايت" : "File size must be less than 1GB")
    }
  }

  const handleCreateParentContainer = async (e) => {
    e.preventDefault()
    if (!formData.courseName || !formData.gradeLevel || !formData.subject) {
      alert(isRTL ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      const formDataPayload = new FormData()
      
      // Append required fields
      formDataPayload.append("name", formData.courseName)
      formDataPayload.append("type", "course") // Adjust to "month" if required by your API
      formDataPayload.append("createdBy", createdBy)
      formDataPayload.append("level", formData.gradeLevel)
      formDataPayload.append("subject", formData.subject)
      formDataPayload.append("description", formData.description || "")
      formDataPayload.append("goal", formData.goal || "")
      formDataPayload.append("price", formData.courseType === "paid" ? Number(formData.priceFull) || 0 : 0)
      formDataPayload.append("teacherAllowed", formData.privacy === "teacher")
      formDataPayload.append("priceAllowed", formData.courseType === "paid")

      // Append image file if exists (video omitted unless API supports it)
      if (courseImage) {
        formDataPayload.append("image", courseImage)
      }

      const response = await createContainer(formDataPayload)
      if (response.status === "success") {
        const container = response.data.container
        updateCourseStructure({
          ...courseStructure,
          parent: {
            id: container.id,
            name: container.name,
            type: container.type,
          },
        })
        alert(isRTL ? "تم إنشاء الحاوية الرئيسية بنجاح" : "Parent container created successfully")
      } else {
        alert(isRTL ? "فشل إنشاء الحاوية الرئيسية" : "Failed to create parent container")
      }
    } catch (error) {
      console.error("Error creating parent container:", error)
      const errorMessage = error.response?.data?.message || "حدث خطأ أثناء إنشاء الحاوية الرئيسية"
      alert(isRTL ? errorMessage : "Error creating parent container")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleCreateParentContainer}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-base-100 rounded-xl shadow-md p-6"
      >
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-6 text-primary">{isRTL ? "البيانات الاساسية" : "Basic Information"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-[65%_35%] gap-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1">{isRTL ? "اسم الكورس" : "Course Name"}</label>
                <input
                  type="text"
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleChange}
                  placeholder={isRTL ? "مثل: دوره تقديم اللغة الإنجليزية" : "e.g., English Language Course"}
                  className="w-full input input-bordered bg-base-200 placeholder-base-content/50"
                  required
                />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-1">{isRTL ? "المرحلة الدراسية" : "Grade Level"}</label>
                <select
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleChange}
                  className="w-full select select-bordered bg-base-200 appearance-none"
                  required
                >
                  <option value="" disabled>
                    {isRTL ? "اختر المرحلة" : "Select Level"}
                  </option>
                  {levels.map((level) => (
                    <option key={level._id} value={level._id}>
                      {level.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className={`h-4 w-4 absolute top-10 ${isRTL ? "left-3" : "right-3"} pointer-events-none`}
                />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-1">{isRTL ? "المادة الدراسية" : "Subject"}</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full select select-bordered bg-base-200 appearance-none"
                  required
                >
                  <option value="" disabled>
                    {isRTL ? "اختر المادة" : "Select Subject"}
                  </option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className={`h-4 w-4 absolute top-10 ${isRTL ? "left-3" : "right-3"} pointer-events-none`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{isRTL ? "مدة الكورس" : "Course Duration"}</label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder={isRTL ? "مثل: عدد الأسبوع أو الساعات" : "e.g., Number of weeks or hours"}
                  className="w-full input input-bordered bg-base-200 placeholder-base-content/50"
                />
              </div>
              <div className="mb-8">
                <label className="block text-sm font-medium mb-1">{isRTL ? "وصف الكورس" : "Course Description"}</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder={
                    isRTL
                      ? "مثل: تهدف صف الدورة إلى تحسين مهارات المتعلمين في اللغة الإنجليزية من حيث القراءة والمحادثة..."
                      : "e.g., The course aims to improve learners' English language skills in reading and speaking..."
                  }
                  rows="4"
                  className="w-full textarea textarea-bordered bg-base-200 placeholder-base-content/50"
                ></textarea>
              </div>
              <div className="mb-8">
                <label className="block text-sm font-medium mb-1">{isRTL ? "هدف الكورس" : "Course Goal"}</label>
                <textarea
                  name="goal"
                  value={formData.goal}
                  onChange={handleChange}
                  placeholder={
                    isRTL
                      ? "مثل: تحسين مهارات القراءة والكتابة والمحادثة..."
                      : "e.g., Improve reading, writing and speaking skills..."
                  }
                  rows="4"
                  className="w-full textarea textarea-bordered bg-base-200 placeholder-base-content/50"
                ></textarea>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h2 className="block text-lg text-primary font-medium mb-2">
                  {isRTL ? "صورة الكورس" : "Course Image"}
                </h2>
                <label className="border-2 border-dashed border-primary/20 rounded-lg p-6 flex flex-col items-center justify-center h-48 cursor-pointer">
                  <ImageIcon className="w-10 h-10 mb-2 text-primary" />
                  <span className="btn text-primary btn-sm btn-ghost border-primary border-2 mb-2">
                    {isRTL ? "اضف صورة" : "Add Image"}
                  </span>
                  <p className="text-xs text-base-content/50">{isRTL ? "المساحة القصوى 1 Gb" : "Max size 1 Gb"}</p>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                {courseImage && (
                  <p className="text-sm mt-2 text-center">
                    {isRTL ? "تم اختيار: " : "Selected: "} {courseImage.name}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h2 className="block text-lg text-primary font-medium mb-2">
                    {isRTL ? "نوع الكورس" : "Course Type"}
                  </h2>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="courseType"
                        value="paid"
                        checked={formData.courseType === "paid"}
                        onChange={handleChange}
                        className="radio radio-primary"
                      />
                      <span>{isRTL ? "مدفوع" : "Paid"}</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="courseType"
                        value="free"
                        checked={formData.courseType === "free"}
                        onChange={handleChange}
                        className="radio radio-primary"
                      />
                      <span>{isRTL ? "مجاني" : "Free"}</span>
                    </label>
                  </div>
                  {formData.courseType === "paid" && (
                    <div className="mt-6 space-y-4 mb-6">
                      <h2 className="block text-lg text-primary font-medium">
                        {isRTL ? "سعر الكورس" : "Course Price"}
                      </h2>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          {isRTL ? "الكورس كامل" : "Full Course"}
                        </label>
                        <input
                          type="text"
                          name="priceFull"
                          value={formData.priceFull}
                          onChange={handleChange}
                          placeholder={isRTL ? "الكورس كامل" : "Full Course"}
                          className="input input-bordered bg-base-200 flex-1"
                        />
                      </div>
                    </div>
                  )}
                  <div className="mb-6">
                    <h2 className="block text-primary text-lg font-medium mb-2">
                      {isRTL ? "صلاحية الوصول" : "Access Validity"}
                    </h2>
                    <div className="flex gap-8">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="accessType"
                          value="both"
                          checked={formData.accessType === "both"}
                          onChange={handleChange}
                          className="radio radio-primary"
                        />
                        <span>{isRTL ? "التطبيق و المنصة" : "App and Platform"}</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="accessType"
                          value="app"
                          checked={formData.accessType === "app"}
                          onChange={handleChange}
                          className="radio radio-primary"
                        />
                        <span>{isRTL ? "التطبيق" : "App"}</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <h2 className="block text-primary text-lg font-medium mb-3">
                      {isRTL ? "خصوصية الكورس" : "Course Privacy"}
                    </h2>
                    <div className="flex gap-8">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="privacy"
                          value="student"
                          checked={formData.privacy === "student"}
                          onChange={handleChange}
                          className="radio radio-primary"
                        />
                        <span>{isRTL ? "طالب / ولی امر" : "Student / Guardian"}</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="privacy"
                          value="teacher"
                          checked={formData.privacy === "teacher"}
                          onChange={handleChange}
                          className="radio radio-primary"
                        />
                        <span>{isRTL ? "المعلم" : "Teacher"}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-8">
          <button
            type="submit"
            className="btn btn-primary px-8 py-3 text-lg"
            disabled={isSubmitting || courseStructure.parent}
          >
            {isSubmitting ? (
              <span className="loading loading-spinner"></span>
            ) : courseStructure.parent ? (
              isRTL ? (
                "تم إنشاء الحاوية الرئيسية"
              ) : (
                "Parent Container Created"
              )
            ) : isRTL ? (
              "إنشاء الحاوية الرئيسية"
            ) : (
              "Create Parent Container"
            )}
          </button>
        </div>
      </motion.div>
    </form>
  )
}

export default BasicInfoForm