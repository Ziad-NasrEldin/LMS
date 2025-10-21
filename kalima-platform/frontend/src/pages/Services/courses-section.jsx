"use client"

import { useTranslation } from "react-i18next"
import { ChevronLeft, Loader } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import { CourseCard } from "../../components/CourseCard"
import { getAllContainers } from "../../routes/lectures"
import { getAllLecturers } from "../../routes/fetch-users"

export function CoursesSection() {
  const { t, i18n } = useTranslation("home")
  const isRTL = i18n.language === "ar"
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lecturers, setLecturers] = useState([])

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [containersResult, lecturersResult] = await Promise.all([
        getAllContainers(),
        getAllLecturers(),
      ])

      if (containersResult.status === "success" && lecturersResult.success) {
        const containersData = containersResult.data.containers
        const lecturersList = lecturersResult.data
        setLecturers(lecturersList)

        setCourses(
          containersData.map((container, index) => {
            const lecturer = lecturersList.find(
              (lect) => lect._id === container.createdBy
            )

            let grade = "الصف الأول"
            if (container.level) {
              const levelName = container.level.name
              if (levelName === "Primary") grade = "الصف الأول الابتدائي"
              else if (levelName === "Middle") grade = "الصف الأول الإعدادي"
              else if (levelName === "Upper Primary") grade = "الصف الرابع الابتدائي"
              else if (levelName === "Higher Secondary") grade = "الصف الأول الثانوي"
            }

            return {
              id: container._id,
              image: `/course-${(index % 6) + 1}.png`,
              title: container.name,
              subject: container.subject?.name || "",
              teacher: lecturer?.name || `أستاذ ${container.name}`,
              teacherRole: lecturer?.role || "محاضر",
              grade,
              rating: 4 + (index % 2) * 0.5,
              duration: 12 + index,
              status: container.price > 0 ? "مدفوع" : "مجاني",
              price: container.price || 0,
              childrenCount: container.children?.length || 0,
              type: container.type === "course" ? "شرح" : container.type,
            }
          })
        )
      } else {
        setError(t("courses.errors.failed"))
      }
    } catch (err) {
      console.error("Error fetching courses or lecturers:", err)
      setError(t("courses.errors.failed"))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  return (
    <section className="md:p-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="container mx-auto px-4">
        <h2 className="text-center text-2xl font-bold mb-2">{t("courses.title")}</h2>
        <h3 className="text-center text-3xl font-bold mb-12">
          {t("courses.heading")}
          <span className="text-primary border-b-2 border-primary pb-1">{t("courses.platform")}</span>
        </h3>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <span className={isRTL ? "mr-2" : "ml-2"}>{t("courses.errors.loading")}</span>
          </div>
        ) : error ? (
          <div className="alert alert-error max-w-md mx-auto">
            <p>{error}</p>
            <button className="btn btn-sm btn-outline" onClick={fetchCourses}>
              {t("courses.errors.retry")}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <AnimatePresence>
                {courses.slice(0, 4).map((course) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Link to={`/courses/${course.id}`}>
                      <CourseCard
                        {...course}
                        isRTL={isRTL}
                        childrenCount={course.childrenCount}
                        teacherRole={course.teacherRole}
                      />
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {courses.length > 4 && (
              <div className="flex justify-center mt-8">
                <Link to="/courses">
                  <button className="btn btn-primary rounded-full">
                    {t("courses.viewAll")}
                    <ChevronLeft className={`h-4 w-4 ${isRTL ? "mr-2" : "ml-2 rotate-180"}`} />
                  </button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
