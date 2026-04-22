"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, ListChecks } from "lucide-react"
import { motion } from "framer-motion"
import { useParams } from "react-router-dom"
import { getUserDashboard } from "../../routes/auth-services"
import { getAllLevels } from "../../routes/levels"
import { getAllSubjects } from "../../routes/courses"
import { getContainerById } from "../../routes/lectures"
import BasicInfoForm from "./basic-info-form"
import ContainerCreationPanel from "./container-creation-panel"
import CourseStructureVisualization from "./course-structure-visualization"
import { Link } from "react-router-dom"
import { designTokens } from "../../constants/designTokens"
import { translateErrorMessage } from "../../utils/errorTranslator"
import { buildLevelHierarchy } from "../../utils/levelHierarchy"
import {
  EMPTY_LEVEL_HIERARCHY,
  INITIAL_COURSE_FORM_DATA,
  INITIAL_COURSE_STRUCTURE,
  buildChecklistItems,
  buildCourseSnapshot,
  findLevelRecord,
} from "./course-form-helpers"

function CourseCreationForm() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === "ar"
  const { containerId } = useParams()
  const TOKENS = designTokens.colors
  const SHADOWS = designTokens.shadows
  const GRADIENTS = designTokens.gradients

  // Form state
  const [formData, setFormData] = useState(INITIAL_COURSE_FORM_DATA)

  // Data fetching states
  const [subjects, setSubjects] = useState([])
  const [levels, setLevels] = useState([])
  const [levelHierarchy, setLevelHierarchy] = useState(EMPTY_LEVEL_HIERARCHY)
  const [teachers, setTeachers] = useState([])
  const [createdBy, setCreatedBy] = useState("")
  const [initialCourseImageUrl, setInitialCourseImageUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Course structure state
  const [courseStructure, setCourseStructure] = useState(INITIAL_COURSE_STRUCTURE)

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        let resolvedLevelHierarchy = EMPTY_LEVEL_HIERARCHY

        // Fetch levels from API
        const levelsResponse = await getAllLevels()
        if (levelsResponse.success) {
          resolvedLevelHierarchy =
            levelsResponse.hierarchy || buildLevelHierarchy(levelsResponse.data || [], i18n.language)
          setLevelHierarchy(resolvedLevelHierarchy)
          setLevels(resolvedLevelHierarchy.grades || [])
        } else {
          console.error("Failed to fetch levels:", levelsResponse)
        }

        // Fetch subjects from API
        const subjectsResponse = await getAllSubjects()
        if (subjectsResponse.success && subjectsResponse.data) {
          setSubjects(subjectsResponse.data) // Corrected to directly use subjectsResponse.data
        } else {
          console.error("Failed to fetch subjects:", subjectsResponse.error)
        }

        // Fetch user dashboard data
        const dashboardResponse = await getUserDashboard()
        const userData = dashboardResponse.data
        const userId = userData?.data?.userInfo?.id
        setCreatedBy(userId)
        if (userData && userData?.data?.userInfo) {
          setTeachers([{ _id: userId, name: userData.data.userInfo.name }])
          setFormData((prev) => ({
            ...prev,
            teacherName: userData.data.userInfo.name,
            teacher: userId,
          }))
        }

        if (containerId) {
          const containerResponse = await getContainerById(containerId)

          if (containerResponse?.status === "error") {
            throw new Error(containerResponse?.message || translateErrorMessage("Failed to load the selected course"))
          }

          const containerData = containerResponse?.data?.container || containerResponse?.data || containerResponse?.container

          if (!containerData) {
            throw new Error(translateErrorMessage("Failed to load the selected course"))
          }

          setInitialCourseImageUrl(
            containerData?.image?.url ||
              containerData?.containerImage?.url ||
              containerData?.inheritedImage?.image?.url ||
              null,
          )

          const selectedLevelId = containerData.level?._id || containerData.level || ""
          const selectedLevelRecord = findLevelRecord({
            levels: resolvedLevelHierarchy?.grades || [],
            levelLike: selectedLevelId,
            language: i18n.language,
            resolveLevelDisplayName: (level) => level?.displayName || level?.name || "",
          })

          setFormData((prev) => ({
            ...prev,
            courseName: containerData.name || "",
            stage: selectedLevelRecord?.parentLevelId || "",
            gradeLevel: selectedLevelId,
            subject: containerData.subject?._id || containerData.subject || "",
            description: containerData.description || "",
            goal: Array.isArray(containerData.goal) ? containerData.goal.join("\n") : containerData.goal || "",
            courseType: Number(containerData.price || 0) > 0 ? "paid" : "free",
             priceFull: containerData.price ?? "",
             privacy: containerData.teacherAllowed ? "teacher" : "student",
             sameGradeOnly: containerData.sameGradeOnly ?? false,
           }))

          setCourseStructure({
            parent: {
              id: containerData._id || containerData.id,
              name: containerData.name,
              type: containerData.type,
            },
            containers: [],
            lectures: [],
          })
        } else {
          setInitialCourseImageUrl(null)
        }
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(translateErrorMessage(err.message || "Failed to load data"))
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [containerId, i18n.language])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => {
      const nextValue = type === "radio" ? (checked ? value : prev[name]) : value
      const nextState = {
        ...prev,
        [name]: nextValue,
      }

      if (name === "stage") {
        nextState.gradeLevel = ""
      }

      return nextState
    })
  }

  const updateCourseStructure = (newStructure) => {
    setCourseStructure(newStructure)
  }

  const checklistItems = useMemo(
    () => buildChecklistItems({ formData, courseStructure, isRTL }),
    [courseStructure, formData, isRTL],
  )

  const completedSteps = checklistItems.filter((item) => item.done).length
  const progressPercent = Math.round((completedSteps / checklistItems.length) * 100)
  const nextChecklistItem = useMemo(
    () => checklistItems.find((item) => !item.done) || checklistItems[checklistItems.length - 1],
    [checklistItems]
  )
  const courseSnapshot = useMemo(
    () => buildCourseSnapshot({ formData, levels, subjects, isRTL }),
    [formData, isRTL, levels, subjects],
  )

  if (isLoading) {
      return (
        <div className="flex justify-center items-center h-screen">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )
  }

  if (error) {
    return (
        <div className="mb-4 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-[#991B1B] shadow-sm flex items-center gap-3 max-w-md mx-auto mt-8">
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
        <span>{error}</span>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen py-6 text-slate-900 sm:py-8 px-4 sm:px-6 lg:px-8"
      dir={isRTL ? "rtl" : "ltr"}
      style={{ background: `${GRADIENTS.pageAtmosphere}, ${TOKENS.creamSurface}` }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 relative overflow-hidden rounded-[1.75rem] p-5 sm:p-6"
          style={{
            background: "linear-gradient(135deg, rgba(14,85,99,0.95), rgba(20,106,120,0.92))",
            boxShadow: SHADOWS.level2,
          }}
        >
          <div
            className={`mb-4 flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}
            style={{ color: "#E7F8FB" }}
          >
            <Link to={"/dashboard/lecturer-dashboard/"} className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs sm:text-sm" style={{ borderColor: "rgba(255,255,255,0.28)" }}>
              {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              <span>{isRTL ? "العودة للوحة التحكم" : "Back to dashboard"}</span>
            </Link>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              {isRTL ? "٣ خطوات فقط" : "3 quick steps"}
            </span>
          </div>

          <div className={`flex flex-col gap-3 ${isRTL ? "items-end text-right" : "items-start text-left"}`}>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{isRTL ? "أنشئ الكورس خطوة بخطوة" : "Build the course in clear steps"}</h1>
            <p className="text-sm sm:text-base" style={{ color: "#D8F2F5" }}>
              {isRTL
                ? "ابدأ بالمعلومات الأساسية، ثم أضف الهيكل والمحتوى بدون تشويش."
                : "Start with the basics, then add structure and lectures without the clutter."}
            </p>
            <div className={`flex flex-wrap gap-2 ${isRTL ? "justify-end" : ""}`}>
              <span className="rounded-full bg-white/16 px-3 py-1 text-xs text-white/95">{isRTL ? "1. البيانات الأساسية" : "1. Basic info"}</span>
              <span className="rounded-full bg-white/16 px-3 py-1 text-xs text-white/95">{isRTL ? "2. إضافة المحتوى" : "2. Add content"}</span>
              <span className="rounded-full bg-white/16 px-3 py-1 text-xs text-white/95">{isRTL ? "3. مراجعة الهيكل" : "3. Review structure"}</span>
            </div>
          </div>
        </motion.div>

        <div className={`grid gap-6 lg:gap-8 ${isRTL ? "lg:grid-cols-[290px_minmax(0,1fr)]" : "lg:grid-cols-[minmax(0,1fr)_290px]"}`}>
          <aside className={`${isRTL ? "lg:order-1" : "lg:order-2"}`}>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[1.3rem] p-4 sm:p-5 lg:sticky lg:top-24"
              style={{
                background: "rgba(255,255,255,0.9)",
                borderColor: "transparent",
                boxShadow: SHADOWS.level1,
              }}
            >
              <div className={`mb-3 flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                <ListChecks className="h-5 w-5" style={{ color: TOKENS.deepTeal }} />
                <h3 className={`font-bold ${isRTL ? "text-right" : "text-left"}`} style={{ color: TOKENS.inkText }}>
                  {isRTL ? "قائمة إعداد الكورس" : "Course setup checklist"}
                </h3>
              </div>
              <p className={`mb-4 text-xs sm:text-sm ${isRTL ? "text-right" : "text-left"}`} style={{ color: TOKENS.slateText }}>
                {isRTL ? "أكمل أول خطوة التالية بدل القفز بين الحقول." : "Complete the next step instead of jumping between fields."}
              </p>

              <div className="mb-4 rounded-xl border px-3 py-2" style={{ borderColor: "rgba(20,106,120,0.18)", background: "rgba(188,231,236,0.18)" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: TOKENS.slateText }}>
                  {isRTL ? "الخطوة التالية" : "Next step"}
                </p>
                <p className="mt-1 text-sm font-bold" style={{ color: TOKENS.inkText }}>
                  {nextChecklistItem.label}
                </p>
                <p className="text-xs" style={{ color: TOKENS.slateText }}>
                  {nextChecklistItem.hint}
                </p>
              </div>

              <div className="mb-4">
                <div className={`mb-1 flex items-center justify-between text-xs ${isRTL ? "flex-row-reverse" : ""}`} style={{ color: TOKENS.slateText }}>
                  <span>{isRTL ? "التقدم" : "Progress"}</span>
                  <span>{completedSteps}/{checklistItems.length}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full" style={{ background: "rgba(17,24,39,0.12)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%`, background: TOKENS.deepTeal }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {checklistItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border px-3 py-2 ${isRTL ? "text-right" : "text-left"}`}
                    style={{
                      borderColor: item.done ? "rgba(20,106,120,0.28)" : "rgba(17,24,39,0.1)",
                      background: item.done ? "rgba(188,231,236,0.28)" : "rgba(241,243,246,0.5)",
                    }}
                  >
                    <div className={`flex items-start gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                      {item.done ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none" style={{ color: TOKENS.deepTeal }} />
                      ) : (
                        <Circle className="mt-0.5 h-4 w-4 flex-none" style={{ color: TOKENS.slateText }} />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold" style={{ color: TOKENS.inkText }}>
                          {idx + 1}. {item.label}
                        </p>
                        <p className="text-xs" style={{ color: TOKENS.slateText }}>{item.hint}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {completedSteps === checklistItems.length && (
                <div
                  className={`mt-4 rounded-xl border px-3 py-2 text-xs sm:text-sm font-semibold ${isRTL ? "text-right" : "text-left"}`}
                  style={{
                    background: "rgba(188,231,236,0.35)",
                    borderColor: "rgba(20,106,120,0.3)",
                    color: TOKENS.deepTeal,
                  }}
                >
                  {isRTL ? "ممتاز! هيكل الكورس مكتمل تقريبًا." : "Great work! Your course structure is almost ready."}
                </div>
              )}
            </motion.div>
          </aside>

          <div className={`${isRTL ? "lg:order-2" : "lg:order-1"}`}>
            {/* Basic Info Form */}
            <BasicInfoForm
              formData={formData}
              handleChange={handleChange}
              subjects={subjects}
              levels={levels}
              levelHierarchy={levelHierarchy}
              isRTL={isRTL}
              courseStructure={courseStructure}
              updateCourseStructure={updateCourseStructure}
              createdBy={createdBy}
              isEditMode={Boolean(containerId)}
              editContainerId={containerId}
              courseSnapshot={courseSnapshot}
              initialImageUrl={initialCourseImageUrl}
            />

            {/* Container Creation Panel */}
            {courseStructure.parent && (
              <div className="mt-8">
                <ContainerCreationPanel
                  courseStructure={courseStructure}
                  updateCourseStructure={updateCourseStructure}
                  formData={formData}
                  createdBy={createdBy}
                  isRTL={isRTL}
                />
              </div>
            )}

            {/* Course Structure Visualization */}
            {courseStructure.parent && courseStructure.containers.length > 0 && (
              <div className="mt-8">
                <CourseStructureVisualization courseStructure={courseStructure} isRTL={isRTL} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseCreationForm
