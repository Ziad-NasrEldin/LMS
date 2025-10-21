"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import { getUserDashboard } from "../../routes/auth-services"
import { getAllLevels } from "../../routes/levels"
import { getAllSubjects } from "../../routes/courses"
import BasicInfoForm from "./basic-info-form"
import ContainerCreationPanel from "./container-creation-panel"
import CourseStructureVisualization from "./course-structure-visualization"
import { Link } from "react-router-dom"

function CourseCreationForm() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === "ar"

  // Form state
  const [formData, setFormData] = useState({
    courseName: "",
    teacherName: "",
    gradeLevel: "",
    subject: "",
    duration: "",
    description: "",
    goal: "",
    courseType: "paid",
    priceFull: "",
    priceMonthly: "",
    priceSession: "",
    accessType: "both",
    privacy: "student",
  })

  // Data fetching states
  const [subjects, setSubjects] = useState([])
  const [levels, setLevels] = useState([])
  const [teachers, setTeachers] = useState([])
  const [createdBy, setCreatedBy] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Course structure state
  const [courseStructure, setCourseStructure] = useState({
    parent: null,
    containers: [],
    lectures: [],
  })

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Fetch levels from API
        const levelsResponse = await getAllLevels()
        if (levelsResponse.success) {
          setLevels(levelsResponse.data)
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
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err.message || "Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "radio" ? (checked ? value : prev[name]) : value,
    }))
  }

  const updateCourseStructure = (newStructure) => {
    setCourseStructure(newStructure)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-error max-w-md mx-auto mt-8">
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
    <div className="min-h-screen bg-base-100 text-base-content py-8 px-4 sm:px-6 lg:px-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8 relative"
        >
          <Link to={"/dashboard/lecturer-dashboard/"} className="flex items-center text-primary hover:text-primary-600 text-sm">
            {isRTL ? (
              <>
                <ChevronRight className="h-4 w-4 mr-1" />
                <span>{t("الخروج")}</span>
              </>
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 ml-1" />
                <span>{t("back")}</span>
              </>
            )}
          </Link>
          <div className="absolute inset-x-0 flex justify-center">
            <div className="flex items-center">
              <div className="w-16 h-px bg-secondary"></div>
              <h1 className="mx-4 text-2xl font-bold text-primary">{isRTL ? "انشئ كورس" : "Create Course"}</h1>
              <div className="w-16 h-px bg-secondary"></div>
            </div>
          </div>
        </motion.div>

        {/* Basic Info Form */}
        <BasicInfoForm
          formData={formData}
          handleChange={handleChange}
          subjects={subjects}
          levels={levels}
          isRTL={isRTL}
          courseStructure={courseStructure}
          updateCourseStructure={updateCourseStructure}
          createdBy={createdBy}
        />

        {/* Container Creation Panel */}
        {courseStructure.parent && (
          <div className="mt-12">
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
          <div className="mt-12">
            <CourseStructureVisualization courseStructure={courseStructure} isRTL={isRTL} />
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseCreationForm