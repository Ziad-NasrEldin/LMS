"use client"

import { useTranslation } from "react-i18next"
import { designTokens } from "../../constants/designTokens"
// Components
import CourseGrid from "./CourseGrid"
import InstructorsList from "./InstructorsList"

export default function LecturerDashboard() {
  const { t, i18n } = useTranslation("lecturerDashboard")
  const isRTL = i18n.language === "ar"
  const TOKENS = designTokens.colors
  const GRADIENTS = designTokens.gradients

  return (
    <div
      className="flex min-h-screen flex-col"
      dir={isRTL ? "rtl" : "ltr"}
      style={{ background: `${GRADIENTS.pageAtmosphere}, ${TOKENS.creamSurface}` }}
    >
      <div className="transition-all duration-300 ease-in-out pt-14">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:px-8 lg:px-10 space-y-10 md:space-y-12">
          <div className="rounded-[2rem] border px-5 py-6 md:px-8 md:py-7" style={{ background: TOKENS.neutralCloud, borderColor: "rgba(17,24,39,0.08)" }}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight" style={{ color: TOKENS.deepTeal }}>
              {t("courseManagement")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm md:text-base" style={{ color: TOKENS.slateText }}>
              {t("dashboardManagementHint")}
            </p>
          </div>

          {/* Course Grid Section */}
          <section className="rounded-[2rem] border p-5 md:p-6" style={{ background: TOKENS.neutralCloud, borderColor: "rgba(17,24,39,0.08)" }}>
            <CourseGrid />
          </section>

          {/* Instructors List Section */}
          <section className="rounded-[2rem] border p-5 md:p-6" style={{ background: TOKENS.neutralCloud, borderColor: "rgba(17,24,39,0.08)" }}>
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
