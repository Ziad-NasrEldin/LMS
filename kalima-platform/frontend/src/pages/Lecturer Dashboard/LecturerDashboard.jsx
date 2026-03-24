"use client"

import { useTranslation } from "react-i18next"
// Components
import LecturerOverviewPanel from "./LecturerOverviewPanel"
import CourseGrid from "./CourseGrid"
import InstructorsList from "./InstructorsList"

export default function LecturerDashboard() {
  const { t, i18n } = useTranslation("lecturerDashboard")
  const isRTL = i18n.language === "ar"

  return (
    <div className="flex flex-col min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
      <div className={`transition-all duration-300 ease-in-out pt-14`}>
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:px-8 lg:px-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl text-center mb-8 text-primary font-semibold">{t("courseManagement")}</h1>

          <LecturerOverviewPanel />

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

        </div>
      </div>
    </div>
  )
}
