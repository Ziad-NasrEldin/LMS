"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate} from "react-router-dom"
// Components
import CourseGrid from "./CourseGrid"
import InstructorsList from "./InstructorsList"

export default function LecturerDashboard() {
  const { t, i18n } = useTranslation("lecturerDashboard")
  const isRTL = i18n.language === "ar"
  const navigate = useNavigate()

  // State
  const [currentPage, setCurrentPage] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setSidebarOpen(false)
      }
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  // const toggleSidebar = () => {
  //   setSidebarOpen(!sidebarOpen)
  // }

  return (
    <div className="flex flex-col min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
      {/* Sidebar */}

      {/* Main Content */}
      <div className={`transition-all duration-300 ease-in-out pt-14`}>
        <div className="mx-auto p-6 md:p-10 lg:p-14">
          <h1 className="text-3xl md:text-4xl text-center mb-8 text-primary font-semibold">{t("courseManagement")}</h1>

          {/* Course Grid Section */}
          <section className="mb-16">
            <CourseGrid />
          </section>

          {/* Instructors List Section */}
          <section className="mb-16">
            <InstructorsList />
          </section>

          {/* Course Categories Section */}
          {/* <section className="mb-16">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{t("top_categories")}</h2>
              <span className="text-sm text-base-content/70">{t("most_popular")}</span>
            </div>
            {/* <CourseCategories />
          </section> */}

          {/* Featured Courses Section */}
          {/* <section className="mb-16">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{t("featured_courses")}</h2>
              <button className="btn btn-ghost btn-sm text-primary">{t("view_all")}</button>
            </div>
            <FeaturedCourses />
          </section> */}

          {/* Pagination */}
          {/* <div className="flex justify-center my-8">
            <div className="join">
              <button
                className="join-item btn btn-sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>

              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  className={`join-item btn btn-sm ${currentPage === page ? "btn-primary" : ""}`}
                  onClick={() => setCurrentPage(page)}
                  aria-label={`Page ${page}`}
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  {page}
                </button>
              ))}

              <button
                className="join-item btn btn-sm"
                onClick={() => setCurrentPage((p) => p + 1)}
                aria-label="Next page"
              >
                {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  )
}
