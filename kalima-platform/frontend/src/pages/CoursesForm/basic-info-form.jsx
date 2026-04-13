"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { ImageIcon, ChevronDown } from "lucide-react"
import toast from "react-hot-toast"
import { createContainer, updateContainer } from "../../routes/lectures"
import { buildContainerPayloadObject, objectToFormData } from "../../utils/contentCreationPayloads"
import { translateErrorMessage } from "../../utils/errorTranslator"
import { resolveUploadUrl } from "../../utils/uploadUrl"
import DSSelect from "../../components/DSSelect"
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Checkbox from "../../components/ui/Checkbox";
import Radio from "../../components/ui/Radio";
import FormContainer from "../../components/ui/FormContainer";
import { CONTAINER_TYPES } from "./course-form-helpers";
import { getGradeOptionsForStage } from "../../utils/levelHierarchy";

function BasicInfoForm({
  formData,
  handleChange,
  subjects,
  levels,
  levelHierarchy,
  isRTL,
  courseStructure,
  updateCourseStructure,
  createdBy,
  courseSnapshot,
  isEditMode = false,
  editContainerId = null,
  initialImageUrl = null,
}) {
  const compactSelect = "w-full border border-gray-300 bg-slate-100 rounded-lg h-10 min-h-10 appearance-none px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
  const COURSE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024
  const [courseImage, setCourseImage] = useState(null)
  const [courseImagePreview, setCourseImagePreview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submitLockRef = useRef(false)
  const fileInputRef = useRef(null)
  const isPaidCourse = formData.courseType === "paid"
  const gradeOptions = useMemo(
    () => (formData.stage ? getGradeOptionsForStage(levelHierarchy, formData.stage) : []),
    [formData.stage, levelHierarchy],
  )
  const existingCourseImagePreview = useMemo(
    () => (initialImageUrl ? resolveUploadUrl(initialImageUrl, "product_thumbnails") || initialImageUrl : null),
    [initialImageUrl],
  )
  const displayedCourseImage = courseImagePreview || existingCourseImagePreview

  useEffect(() => {
    if (!courseImage) {
      setCourseImagePreview(null)
      return
    }

    const previewUrl = URL.createObjectURL(courseImage)
    setCourseImagePreview(previewUrl)

    return () => {
      URL.revokeObjectURL(previewUrl)
    }
  }, [courseImage])

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    e.target.value = ""

    if (!file) return

    if (!file.type?.startsWith("image/")) {
      toast.error(translateErrorMessage("Please upload only images"))
      return
    }

    if (file.size > COURSE_IMAGE_MAX_SIZE_BYTES) {
      toast.error(isRTL ? "يجب أن يكون حجم الصورة أقل من 5 ميجابايت" : "Image size must be less than 5MB")
      return
    }

    setCourseImage(file)
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handleCreateParentContainer = async (e) => {
    e.preventDefault()

    if (
      submitLockRef.current ||
      isSubmitting ||
      (!isEditMode && courseStructure.parent)
    ) {
      return
    }

    if (!formData.courseName || !formData.stage || !formData.gradeLevel || !formData.subject) {
      toast.error(translateErrorMessage("Please fill all required fields"))
      return
    }

    if (!formData.description?.trim()) {
      toast.error(translateErrorMessage("Please enter a course description"))
      return
    }

    if (!formData.goal?.trim()) {
      toast.error(translateErrorMessage("Please enter a course goal"))
      return
    }

    if (isPaidCourse && (!formData.priceFull || Number(formData.priceFull) <= 0)) {
      toast.error(translateErrorMessage("Please enter a price greater than zero for the paid course"))
      return
    }

    submitLockRef.current = true
    setIsSubmitting(true)

    try {
      const containerPayload = buildContainerPayloadObject({
        name: formData.courseName,
        type: CONTAINER_TYPES.COURSE,
        createdBy,
        level: formData.gradeLevel,
        subject: formData.subject,
        description: formData.description.trim(),
        goal: formData.goal.trim(),
        price: isPaidCourse ? Number(formData.priceFull) || 0 : 0,
        teacherAllowed: formData.privacy === "teacher",
        sameGradeOnly: formData.sameGradeOnly === true || formData.sameGradeOnly === "true",
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
        toast.error(translateErrorMessage("Failed to save parent container"))
      }
    } catch (error) {
      console.error("Error creating parent container:", error)
      const errorMessage = error.response?.data?.message || error.message || "Error saving parent container"
      toast.error(translateErrorMessage(errorMessage))
    } finally {
      submitLockRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <FormContainer onSubmit={handleCreateParentContainer} isLoading={isSubmitting}>
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
                <Input
                  label={isRTL ? "اسم الكورس" : "Course Name"}
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleChange}
                  placeholder={isRTL ? "مثل: دوره تقديم اللغة الإنجليزية" : "e.g., English Language Course"}
                  required
                />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-1">{isRTL ? "المرحلة الدراسية" : "Academic Stage"}</label>
                <DSSelect
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  className={compactSelect}
                  required
                >
                  <option value="" disabled>
                    {isRTL ? "اختر المرحلة" : "Select stage"}
                  </option>
                  {(levelHierarchy?.stageOptions || []).map((stage) => (
                    <option key={stage.value} value={stage.value}>
                      {stage.label}
                    </option>
                  ))}
                </DSSelect>
                <ChevronDown
                  className={`h-4 w-4 absolute top-9 ${isRTL ? "left-3" : "right-3"} pointer-events-none`}
                />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-1">{isRTL ? "الصف الدراسي" : "Grade Level"}</label>
                <DSSelect
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleChange}
                  className={compactSelect}
                  disabled={!formData.stage || gradeOptions.length === 0}
                  required
                >
                  <option value="" disabled>
                    {!formData.stage
                      ? (isRTL ? "اختر المرحلة أولاً" : "Select stage first")
                      : gradeOptions.length === 0
                        ? (isRTL ? "لا توجد صفوف متاحة" : "No grades available")
                        : (isRTL ? "اختر الصف" : "Select grade")}
                  </option>
                  {gradeOptions.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </DSSelect>
                <ChevronDown
                  className={`h-4 w-4 absolute top-9 ${isRTL ? "left-3" : "right-3"} pointer-events-none`}
                />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-1">{isRTL ? "المادة الدراسية" : "Subject"}</label>
                <DSSelect
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
                </DSSelect>
                <ChevronDown
                  className={`h-4 w-4 absolute top-9 ${isRTL ? "left-3" : "right-3"} pointer-events-none`}
                />
              </div>
              <div>
                <Input
                  label={isRTL ? "مدة الكورس" : "Course Duration"}
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder={isRTL ? "مثل: عدد الأسبوع أو الساعات" : "e.g., Number of weeks or hours"}
                />
              </div>
              <div>
                <Input
                  label={isRTL ? "وصف الكورس" : "Course Description"}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder={
                    isRTL
                      ? "مثل: تهدف صف الدورة إلى تحسين مهارات المتعلمين في اللغة الإنجليزية من حيث القراءة والمحادثة..."
                      : "e.g., The course aims to improve learners' English language skills in reading and speaking..."
                  }
                  as="textarea"
                  rows="2"
                />
              </div>
              <div>
                <Input
                  label={isRTL ? "هدف الكورس" : "Course Goal"}
                  name="goal"
                  value={formData.goal}
                  onChange={handleChange}
                  placeholder={
                    isRTL
                      ? "مثل: تحسين مهارات القراءة والكتابة والمحادثة..."
                      : "e.g., Improve reading, writing and speaking skills..."
                  }
                  as="textarea"
                  rows="2"
                />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <h2 className="block text-base text-primary font-semibold mb-2">
                  {isRTL ? "صورة الكورس" : "Course Image"}
                </h2>
                <div
                  className="relative border border-dashed border-primary/25 rounded-xl p-4 flex flex-col items-center justify-center h-36 cursor-pointer bg-white overflow-hidden"
                  onClick={openFilePicker}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      openFilePicker()
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={isRTL ? "رفع صورة الكورس" : "Upload course image"}
                >
                  {displayedCourseImage && (
                    <>
                      <img
                        src={displayedCourseImage}
                        alt={isRTL ? "معاينة صورة الكورس" : "Course image preview"}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/35" />
                    </>
                  )}
  
                    <div className="relative z-10 flex flex-col items-center">
                      <ImageIcon className={`w-8 h-8 mb-2 ${displayedCourseImage ? "text-white" : "text-primary"}`} />
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="sm" 
                        className={`border-2 mb-2 ${
                          displayedCourseImage ? "text-white border-white hover:bg-white/15" : "text-primary border-primary"
                        }`}
                        onClick={(event) => {
                          event.stopPropagation()
                          openFilePicker()
                        }}
                      >
                        {isRTL ? "اختر صورة" : "Choose image"}
                      </Button>
                      <p className={`text-xs ${displayedCourseImage ? "text-white/90" : "text-neutral/50"}`}>
                        {isRTL ? "الحد الأقصى 5 ميجابايت" : "Max size 5MB"}
                      </p>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </div>
                {courseImage && (
                  <p className="text-sm mt-2 text-center">
                    {isRTL ? "تم اختيار: " : "Selected: "} {courseImage.name}
                  </p>
                )}
                <p className="mt-2 text-xs text-center text-neutral/55">
                  {isRTL ? "الصورة تظهر في بطاقة الكورس وفي المعاينات." : "This image appears in course cards and previews."}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <h2 className="block text-base text-primary font-semibold mb-2">
                    {isRTL ? "نوع الكورس" : "Course Type"}
                  </h2>
                  <div className="flex gap-4">
                    <Radio
                      name="courseType"
                      value="paid"
                      checked={formData.courseType === "paid"}
                      onChange={handleChange}
                      label={isRTL ? "مدفوع" : "Paid"}
                    />
                    <Radio
                      name="courseType"
                      value="free"
                      checked={formData.courseType === "free"}
                      onChange={handleChange}
                      label={isRTL ? "مجاني" : "Free"}
                    />
                  </div>
                  <p className="mt-2 text-xs text-neutral/60">
                    {isRTL
                      ? "اختر مجانياً أو مدفوعاً. يمكن تعديل السعر قبل الإطلاق."
                      : "Choose free or paid. You can adjust the price before launch."}
                  </p>
                  {isPaidCourse && (
                    <div className="mt-3">
                      <Input
                        label={isRTL ? "سعر الكورس" : "Course Price"}
                        type="number"
                        name="priceFull"
                        value={formData.priceFull}
                        onChange={handleChange}
                        placeholder={isRTL ? "أدخل سعر الكورس" : "Enter course price"}
                        min="1"
                        required={isPaidCourse}
                      />
                      <p className="mt-1 text-xs text-neutral/55">
                        {isRTL
                          ? "سيتم استخدام هذا السعر للحاوية الرئيسية الأولى."
                          : "This price will be used for the first parent container."}
                      </p>
                    </div>
                  )}
  
                    <div className="mt-6 p-3 rounded-xl border transition-all duration-300" 
                        style={{ 
                          borderColor: (formData.sameGradeOnly === true || formData.sameGradeOnly === "true") 
                            ? "rgba(20,106,120,0.3)" 
                            : "rgba(20,106,120,0.14)", 
                          background: (formData.sameGradeOnly === true || formData.sameGradeOnly === "true") 
                            ? "rgba(188,231,236,0.3)" 
                            : "rgba(188,231,236,0.12)" 
                        }}>
                      <div className="flex items-center gap-3 p-0">
                        <Checkbox
                          name="sameGradeOnly"
                          checked={formData.sameGradeOnly === true || formData.sameGradeOnly === "true"}
                          onChange={(e) => handleChange({ target: { name: "sameGradeOnly", value: e.target.checked } })}
                        />
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-bold text-primary">
                            {isRTL ? "تقييد الشراء لنفس الصف الدراسي فقط" : "Restrict purchase to the exact same grade only"}
                          </span>
                          <span className="text-xs text-neutral/70 whitespace-normal leading-relaxed">
                            {isRTL
                              ? "عند التفعيل، يمكن فقط للطلاب وأولياء الأمور الذين لديهم أبناء في نفس الصف الدراسي بالضبط شراء هذا الكورس"
                              : "When enabled, only students and parents with children in the exact same grade can purchase this course"}
                          </span>
                        </div>
                      </div>
                    </div>
                  <div>
                    <h2 className="block text-primary text-base font-semibold mb-2">
                      {isRTL ? "خصوصية الكورس" : "Course Privacy"}
                    </h2>
                    <div className="flex flex-wrap gap-4">
                      <Radio
                        name="privacy"
                        value="student"
                        checked={formData.privacy === "student"}
                        onChange={handleChange}
                        label={isRTL ? "طالب / ولی امر" : "Student / Guardian"}
                      />
                      <Radio
                        name="privacy"
                        value="teacher"
                        checked={formData.privacy === "teacher"}
                        onChange={handleChange}
                        label={isRTL ? "المعلم" : "Teacher"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center mt-5">
            <Button
              type="submit"
              variant="primary"
              className="rounded-full px-7 py-2 text-sm sm:text-base"
              isDisabled={isSubmitting || (!isEditMode && courseStructure.parent)}
              isLoading={isSubmitting}
            >
              {!isEditMode && courseStructure.parent ? (
                isRTL ? "تم حفظ أساسيات الكورس" : "Course basics saved"
              ) : isEditMode ? (
                isRTL ? "حفظ التعديلات" : "Save changes"
              ) : isRTL ? (
                "حفظ أساسيات الكورس"
              ) : (
                "Save course basics"
              )}
            </Button>
          </div>
          <p className="mt-2 text-xs text-center text-neutral/55">
            {isRTL
              ? "بعد الحفظ ستنتقل لإضافة السنوات والفصول والمحاضرات."
              : "After saving, you can add years, terms, months, and lectures."}
          </p>
        </div>
      </motion.div>
    </FormContainer>
  )
}




export default BasicInfoForm
