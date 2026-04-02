"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ImageIcon, Video, ChevronDown } from "lucide-react"
import toast from "react-hot-toast"
import { createContainer, updateContainer } from "../../routes/lectures"
import { buildContainerPayloadObject, objectToFormData } from "../../utils/contentCreationPayloads"

function BasicInfoForm({
  formData,
  handleChange,
  subjects,
  levels,
  isRTL,
  courseStructure,
  updateCourseStructure,
  createdBy,
  courseSnapshot,
  isEditMode = false,
  editContainerId = null,
}) {
  const compactInput = "w-full input input-bordered input-sm h-10 min-h-10 bg-base-200/80 placeholder-base-content/50"
  const compactSelect = "w-full select select-bordered select-sm h-10 min-h-10 bg-base-200/80 appearance-none"
  const compactTextArea = "w-full textarea textarea-bordered textarea-sm bg-base-200/80 placeholder-base-content/50"
  const [courseImage, setCourseImage] = useState(null)
  const [courseVideo, setCourseVideo] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isPaidCourse = formData.courseType === "paid"

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file && file.size <= 1024 * 1024 * 1024) {
      setCourseImage(file)
    } else {
      toast.error(isRTL ? "حجم الملف يجب أن يكون أقل من 1 جيجابايت" : "File size must be less than 1GB")
    }
  }

  const handleCreateParentContainer = async (e) => {
    e.preventDefault()
    if (!formData.courseName || !formData.gradeLevel || !formData.subject) {
      toast.error(isRTL ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields")
      return
    }

    if (!formData.description?.trim()) {
      toast.error(isRTL ? "يرجى إدخال وصف للكورس" : "Please enter a course description")
      return
    }

    if (!formData.goal?.trim()) {
      toast.error(isRTL ? "يرجى إدخال هدف الكورس" : "Please enter a course goal")
      return
    }

    if (isPaidCourse && (!formData.priceFull || Number(formData.priceFull) <= 0)) {
      toast.error(
        isRTL
          ? "يرجى إدخال سعر أكبر من صفر للكورس المدفوع"
          : "Please enter a price greater than zero for the paid course",
      )
      return
    }

    setIsSubmitting(true)

    try {
      const containerPayload = buildContainerPayloadObject({
        name: formData.courseName,
        type: "course",
        createdBy,
        level: formData.gradeLevel,
        subject: formData.subject,
        description: formData.description.trim(),
        goal: formData.goal.trim(),
        price: isPaidCourse ? Number(formData.priceFull) || 0 : 0,
        teacherAllowed: formData.privacy === "teacher",
      })

      const formDataPayload = objectToFormData(containerPayload, courseImage ? [{ key: "image", file: courseImage }] : [])

      const response = isEditMode && editContainerId
        ? await updateContainer(editContainerId, formDataPayload)
        : await createContainer(formDataPayload)

      if (response.status === "success") {
        const container = response.data?.container || response.data || response.container
        updateCourseStructure({
          ...courseStructure,
          parent: {
            id: container._id || container.id,
            name: container.name,
            type: container.type,
          },
        })
        toast.success(isEditMode ? (isRTL ? "تم تحديث الحاوية الرئيسية بنجاح" : "Parent container updated successfully") : (isRTL ? "تم إنشاء الحاوية الرئيسية بنجاح" : "Parent container created successfully"))
      } else {
        toast.error(isRTL ? "فشل حفظ الحاوية الرئيسية" : "Failed to save parent container")
      }
    } catch (error) {
      console.error("Error creating parent container:", error)
      const errorMessage = error.response?.data?.message || "حدث خطأ أثناء حفظ الحاوية الرئيسية"
      toast.error(isRTL ? errorMessage : "Error saving parent container")
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
        className="rounded-[1.4rem] border p-4 shadow-md"
        style={{ borderColor: "rgba(17,24,39,0.08)", background: "rgba(255,255,255,0.9)" }}
      >
        <div className="mb-2">
          <h2 className="text-base font-bold mb-3 text-primary">
            {isEditMode ? (isRTL ? "تعديل أساسيات الكورس" : "Edit course basics") : (isRTL ? "أساسيات الكورس" : "Course basics")}
          </h2>
          <div className="mb-4 rounded-xl border p-3" style={{ borderColor: "rgba(20,106,120,0.14)", background: "rgba(188,231,236,0.18)" }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "rgba(17,24,39,0.6)" }}>
                  {isRTL ? "معاينة حية" : "Live preview"}
                </p>
                <h3 className="mt-1 text-base font-bold" style={{ color: "rgba(17,24,39,0.92)" }}>
                  {courseSnapshot?.title || (isRTL ? "اسم الكورس سيظهر هنا" : "Course title will appear here")}
                </h3>
              </div>
              <div className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "rgba(14,85,99,0.12)", color: "rgba(14,85,99,1)" }}>
                {formData.courseType === "free" ? (isRTL ? "مجاني" : "Free") : (isRTL ? "مدفوع" : "Paid")}
              </div>
            </div>
            <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
              <div className="rounded-lg bg-white/70 px-3 py-2">
                <span className="block opacity-60">{isRTL ? "المرحلة" : "Level"}</span>
                <span className="font-semibold">{courseSnapshot?.level || "-"}</span>
              </div>
              <div className="rounded-lg bg-white/70 px-3 py-2">
                <span className="block opacity-60">{isRTL ? "المادة" : "Subject"}</span>
                <span className="font-semibold">{courseSnapshot?.subject || "-"}</span>
              </div>
              <div className="rounded-lg bg-white/70 px-3 py-2">
                <span className="block opacity-60">{isRTL ? "السعر" : "Price"}</span>
                <span className="font-semibold">{courseSnapshot?.pricing || "-"}</span>
              </div>
              <div className="rounded-lg bg-white/70 px-3 py-2">
                <span className="block opacity-60">{isRTL ? "الخصوصية" : "Privacy"}</span>
                <span className="font-semibold">{courseSnapshot?.privacy || "-"}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[62%_38%] gap-3">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">{isRTL ? "اسم الكورس" : "Course Name"}</label>
                <input
                  type="text"
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleChange}
                  placeholder={isRTL ? "مثل: دوره تقديم اللغة الإنجليزية" : "e.g., English Language Course"}
                  className={compactInput}
                  required
                />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-1">{isRTL ? "المستوى التعليمي" : "Learning Level"}</label>
                <select
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleChange}
                  className={compactSelect}
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
                  className={`h-4 w-4 absolute top-9 ${isRTL ? "left-3" : "right-3"} pointer-events-none`}
                />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-1">{isRTL ? "المادة الدراسية" : "Subject"}</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className={compactSelect}
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
                  className={`h-4 w-4 absolute top-9 ${isRTL ? "left-3" : "right-3"} pointer-events-none`}
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
                  className={compactInput}
                />
              </div>
              <div>
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
                  rows="2"
                  className={compactTextArea}
                ></textarea>
              </div>
              <div>
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
                  rows="2"
                  className={compactTextArea}
                ></textarea>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <h2 className="block text-base text-primary font-semibold mb-2">
                  {isRTL ? "صورة الكورس" : "Course Image"}
                </h2>
                <label className="border border-dashed border-primary/25 rounded-xl p-4 flex flex-col items-center justify-center h-36 cursor-pointer bg-white">
                  <ImageIcon className="w-8 h-8 mb-2 text-primary" />
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
                <p className="mt-2 text-xs text-center text-base-content/55">
                  {isRTL ? "الصورة تظهر في بطاقة الكورس وفي المعاينات." : "This image appears in course cards and previews."}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <h2 className="block text-base text-primary font-semibold mb-2">
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
                  <p className="mt-2 text-xs text-base-content/60">
                    {isRTL
                      ? "اختر مجانياً أو مدفوعاً. يمكن تعديل السعر قبل الإطلاق."
                      : "Choose free or paid. You can adjust the price before launch."}
                  </p>
                  {isPaidCourse && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium mb-1">
                        {isRTL ? "سعر الكورس" : "Course Price"}
                      </label>
                      <input
                        type="number"
                        name="priceFull"
                        value={formData.priceFull}
                        onChange={handleChange}
                        placeholder={isRTL ? "أدخل سعر الكورس" : "Enter course price"}
                        className={compactInput}
                        min="1"
                        required={isPaidCourse}
                      />
                      <p className="mt-1 text-xs text-base-content/55">
                        {isRTL
                          ? "سيتم استخدام هذا السعر للحاوية الرئيسية الأولى."
                          : "This price will be used for the first parent container."}
                      </p>
                    </div>
                  )}
                  <div>
                    <h2 className="block text-primary text-base font-semibold mb-2">
                      {isRTL ? "خصوصية الكورس" : "Course Privacy"}
                    </h2>
                    <div className="flex flex-wrap gap-4">
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
        <div className="flex justify-center mt-5">
          <button
            type="submit"
            className="btn btn-primary rounded-full px-7 py-2 text-sm sm:text-base"
            disabled={isSubmitting || (!isEditMode && courseStructure.parent)}
          >
            {isSubmitting ? (
              <span className="loading loading-spinner"></span>
            ) : !isEditMode && courseStructure.parent ? (
              isRTL ? (
                "تم حفظ أساسيات الكورس"
              ) : (
                "Course basics saved"
              )
              ) : isEditMode ? (
                isRTL ? "حفظ التعديلات" : "Save changes"
              ) : isRTL ? (
                "حفظ أساسيات الكورس"
              ) : (
                "Save course basics"
              )}
          </button>
        </div>
        <p className="mt-2 text-xs text-center text-base-content/55">
          {isRTL
            ? "بعد الحفظ ستنتقل لإضافة السنوات والفصول والمحاضرات."
            : "After saving, you can add years, terms, months, and lectures."}
        </p>
      </motion.div>
    </form>
  )
}

export default BasicInfoForm
