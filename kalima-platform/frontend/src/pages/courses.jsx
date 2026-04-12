"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Search, ChevronDown, ChevronUp } from "lucide-react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { motion, AnimatePresence } from "framer-motion"

import { getAllContainers } from "../routes/lectures"
import { getAllSubjects } from "../routes/courses"
import { getAllLevels } from "../routes/levels"
import { FilterDropdown } from "../../src/components/FilterDropdown"
import { LoadingSpinner } from "../components/LoadingSpinner"
import { ErrorAlert } from "../components/ErrorAlert"
import { CourseCard } from "../components/CourseCard"
import { getAllLecturers } from "../routes/fetch-users"
import { designTokens } from "../constants/designTokens"
import { translateErrorMessage } from "../utils/errorTranslator"
import { buildLevelHierarchy, resolveLevelDisplayName } from "../utils/levelHierarchy"
import { buildCoursePath } from "../seo/site.mjs"
import { useSeo } from "../seo/useSeo"
import { buildBreadcrumbSchema } from "../seo/structuredData.mjs"

export default function CoursesPage() {
  const TOKENS = designTokens.colors
  const SHADOWS = designTokens.shadows
  const GRADIENTS = designTokens.gradients

  const [containers, setContainers] = useState([])
  const [filteredContainers, setFilteredContainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const ITEMS_PER_PAGE = 6

  // Data states
  const [subjects, setSubjects] = useState([])
  const [levels, setLevels] = useState([])
  const [lecturers, setLecturers] = useState([])

  const { t, i18n } = useTranslation("courses")
  const isRTL = i18n.language === "ar"

  useSeo({
    title: isRTL
      ? "دورات منصة فكرة التعليمية | اكتشف المسارات التعليمية المناسبة"
      : "Fekra Courses | Discover Learning Paths",
    description: isRTL
      ? "استكشف الدورات التعليمية على منصة فكرة التعليمية، واختر المسار المناسب لمرحلتك الدراسية وأهدافك التعليمية."
      : "Explore Fekra courses and choose the learning path that fits your goals.",
    canonicalPath: "/courses",
    lang: i18n.language?.startsWith("en") ? "en" : "ar",
    dir: isRTL ? "rtl" : "ltr",
    schema: [
      buildBreadcrumbSchema([
        { name: isRTL ? "الرئيسية" : "Home", path: "/" },
        { name: isRTL ? "الدورات" : "Courses", path: "/courses" },
      ]),
    ],
  })

  const sortByNewest = useCallback((list = []) => {
    return [...list].sort((left, right) => {
      const leftDate = new Date(left.createdAt || left._id || 0).getTime()
      const rightDate = new Date(right.createdAt || right._id || 0).getTime()
      return rightDate - leftDate
    })
  }, [])

  const normalizeText = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")

  const normalizeId = (value) => {
    if (!value) return ""
    if (typeof value === "string") return value
    if (typeof value === "object") {
      return value._id || value.id || ""
    }
    return String(value)
  }

  const getLevelRecord = (levelLike) => {
    if (!levelLike) return null

    const targetId = normalizeId(levelLike)
    if (targetId) {
      const matchedById = levels.find((level) => normalizeId(level._id) === targetId)
      if (matchedById) return matchedById
    }

    const targetName = normalizeText(typeof levelLike === "object" ? levelLike?.name : levelLike)
    if (!targetName) return null

    return (
      levels.find((level) => {
        const displayName = normalizeText(resolveLevelDisplayName(level, i18n.language))
        return normalizeText(level.name) === targetName || displayName === targetName
      }) || null
    )
  }

  // Filter states
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedCourseType, setSelectedCourseType] = useState("")
  const [selectedCourseStatus, setSelectedCourseStatus] = useState("")
  const [selectedPrice, setSelectedPrice] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  // Fetch initial data: subjects, levels, and lecturers
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch subjects
        const subjectsResult = await getAllSubjects()
        if (subjectsResult.success) {
          setSubjects(subjectsResult.data || [])
        } else {
          console.error("Failed to fetch subjects:", subjectsResult.error)
        }

        // Fetch levels
        const levelsResult = await getAllLevels()
        if (levelsResult.success) {
          const hierarchy = levelsResult.hierarchy || buildLevelHierarchy(levelsResult.data || [], i18n.language)
          setLevels(hierarchy.levels || [])
        } else {
          console.error("Failed to fetch levels:", levelsResult.error)
        }

        // Fetch lecturers
        const lecturersResult = await getAllLecturers()
        if (lecturersResult.success) {
          setLecturers(lecturersResult.data || [])
        } else {
          console.error("Failed to fetch lecturers:", lecturersResult.error)
        }
      } catch (err) {
        console.error("Error fetching initial data:", err)
      }
    }

    fetchInitialData()
  }, [])

  // Fetch containers once; filtering and pagination stay client-side.
  useEffect(() => {
    fetchContainers()
  }, [])

  // useEffect(() => {
  //   // Keep filters open on desktop and collapsed by default on smaller screens.
  //   setShowFilters(window.matchMedia("(min-width: 1024px)").matches)
  // }, [])

  const fetchContainers = async () => {
    setLoading(true)
    setError("")
    try {
      const result = await getAllContainers({
        type: "course",
        limit: 200,
        sort: "-createdAt",
      })

      if (result.status === "success") {
        const containers = sortByNewest(result.data.containers || [])
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
        const endIndex = startIndex + ITEMS_PER_PAGE
        const paginatedContainers = containers.slice(startIndex, endIndex)

        setContainers(containers)
        setFilteredContainers(paginatedContainers)
        setTotalResults(containers.length)
        setTotalPages(Math.ceil(containers.length / ITEMS_PER_PAGE))
      } else {
        setError(translateErrorMessage(result.error || "Failed to fetch containers"))
      }
    } catch (err) {
      console.error("Error fetching containers:", err)
      setError(translateErrorMessage("Failed to load data"))
    } finally {
      setLoading(false)
    }
  }

  const resetFilters = useCallback(() => {
    setSelectedSubject("")
    setSelectedCourseType("")
    setSelectedCourseStatus("")
    setSelectedPrice("")
    setSearchQuery("")
    setCurrentPage(1)
  }, [containers, sortByNewest])

  const applyFilters = useCallback(() => {
    setCurrentPage(1)

    // On mobile, collapse filter panel after apply to show results immediately.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setShowFilters(false)
    }
  }, [])

  const getFilteredCourseContainers = useCallback(
    (sourceContainers = containers) => {
      let filtered = sortByNewest(sourceContainers.filter((container) => container.type === "course"))

      if (selectedSubject) {
        filtered = filtered.filter((container) => container.subject?.name === selectedSubject)
      }

      if (selectedCourseType) {
        let apiType = "course"
        switch (selectedCourseType) {
          case t("types.course"):
            apiType = "course"
            break
          case t("types.year"):
            apiType = "year"
            break
          case t("types.term"):
            apiType = "term"
            break
          case t("types.month"):
            apiType = "month"
            break
          default:
            apiType = selectedCourseType
        }
        filtered = filtered.filter((container) => container.type === apiType)
      }

      if (selectedCourseStatus) {
        filtered = filtered.filter((container) => {
          const price = container.price || 0
          return selectedCourseStatus === t("status.free") ? price === 0 : price > 0
        })
      }

      if (selectedPrice) {
        const [min, max] = selectedPrice.split("-").map(Number)
        filtered = filtered.filter((container) => {
          const price = container.price || 0
          return price >= min && (max === 0 || price <= max)
        })
      }

      const normalizedSearch = searchQuery.trim().toLowerCase()
      if (normalizedSearch) {
        filtered = filtered.filter((container) => {
          const teacherId = container.createdBy?._id || container.createdBy
          const matchedLecturer = lecturers.find((lecturer) => lecturer._id === teacherId)
          const levelRecord = getLevelRecord(container.level)
          const stageRecord =
            levelRecord?.kind === "stage"
              ? levelRecord
              : getLevelRecord(levelRecord?.parentLevelId || levelRecord?.parentLevel)
          const gradeName = resolveLevelDisplayName(levelRecord || container.level, i18n.language)
          const stageName = stageRecord ? resolveLevelDisplayName(stageRecord, i18n.language) : ""

          const searchableText = [
            container.name,
            container.subject?.name,
            gradeName,
            stageName,
            matchedLecturer?.name,
            matchedLecturer?.role,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()

          return searchableText.includes(normalizedSearch)
        })
      }

      return filtered
    },
    [containers, lecturers, levels, searchQuery, selectedCourseStatus, selectedCourseType, selectedPrice, selectedSubject, sortByNewest, t],
  )

  useEffect(() => {
    if (containers.length === 0) return

    const filtered = getFilteredCourseContainers(containers)
    const nextTotalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
    const safePage = Math.min(currentPage, nextTotalPages)
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE

    if (safePage !== currentPage) {
      setCurrentPage(safePage)
    }

    setFilteredContainers(filtered.slice(startIndex, endIndex))
    setTotalResults(filtered.length)
    setTotalPages(nextTotalPages)
  }, [containers, currentPage, getFilteredCourseContainers, ITEMS_PER_PAGE])

  const generateCourseData = (containersData) =>
    containersData.map((container, index) => {
      const levelRecord = getLevelRecord(container.level)
      const stageRecord =
        levelRecord?.kind === "stage"
          ? levelRecord
          : getLevelRecord(levelRecord?.parentLevelId || levelRecord?.parentLevel)
      const grade = resolveLevelDisplayName(levelRecord || container.level, i18n.language)
      const stage = stageRecord ? resolveLevelDisplayName(stageRecord, i18n.language) : ""

      const isFree = container.price === 0
      const status = isFree ? t("status.free") : t("status.paid")

      let type = t("types.course")
      switch (container.type) {
        case "course":
          type = t("types.course")
          break
        case "year":
          type = t("types.year")
          break
        case "term":
          type = t("types.term")
          break
        case "month":
          type = t("types.month")
          break
        default:
          type = container.type || t("types.course")
      }

      const teacherId = container.createdBy?._id || container.createdBy
      const matchedLecturer = lecturers.find((lecturer) => lecturer._id === teacherId)

      // Get container image URL if available
      const containerImageUrl = container.containerImage?.url || container.image?.url || null

      return {
        id: container._id,
        image: `/course-${(index % 6) + 1}.png`, // Fallback image pattern
        containerImage: containerImageUrl, // Pass the actual container image URL
        title: container.name,
        subject: container.subject?.name || "",
        teacher: matchedLecturer?.name || t("unknownTeacher"),
        teacherRole: matchedLecturer?.role || t("lecturer"),
        grade,
        rating: 4 + (index % 2) * 0.5,
        stage,
        type,
        status,
        price: container.price || 0,
        childrenCount: container.children?.length || 0,
        containerType: container.type || "lecture",
      }
    })

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  const memoizedFilteredCourses = useMemo(() => generateCourseData(filteredContainers), [filteredContainers, lecturers])

  // Create subject options from fetched subjects
  const subjectOptions = useMemo(() => {
    return subjects.map((subject) => ({
      label: subject.name,
      value: subject.name,
      id: subject._id,
    }))
  }, [subjects])

  const priceOptions = [
    { label: t("priceRanges.free"), value: "0-0" },
    { label: t("priceRanges.under500"), value: "1-500" },
    { label: t("priceRanges.500to1000"), value: "500-1000" },
    { label: t("priceRanges.over1000"), value: "1000-10000" },
  ]

  const typeOptions = [
    { label: t("types.course"), value: t("types.course") },
    { label: t("types.year"), value: t("types.year") },
    { label: t("types.term"), value: t("types.term") },
    { label: t("types.month"), value: t("types.month") },
  ]

  const filterOptions = [
    {
      label: t("filters.subject"),
      value: selectedSubject,
      options: [{ label: t("filters.all"), value: "" }, ...subjectOptions],
      onSelect: setSelectedSubject,
    },
    {
      label: t("filters.type"),
      value: selectedCourseType,
      options: [{ label: t("filters.all"), value: "" }, ...typeOptions],
      onSelect: setSelectedCourseType,
    },
    {
      label: t("filters.status"),
      value: selectedCourseStatus,
      options: [
        { label: t("filters.all"), value: "" },
        { label: t("status.free"), value: t("status.free") },
        { label: t("status.paid"), value: t("status.paid") },
      ],
      onSelect: setSelectedCourseStatus,
    },
    {
      label: t("filters.price") || "السعر",
      value: selectedPrice,
      options: [{ label: t("filters.all"), value: "" }, ...priceOptions],
      onSelect: setSelectedPrice,
    },
  ]

  const activeFiltersCount = useMemo(() => {
    return [selectedSubject, selectedCourseType, selectedCourseStatus, selectedPrice, searchQuery].filter(Boolean).length
  }, [selectedSubject, selectedCourseType, selectedCourseStatus, selectedPrice, searchQuery])

  return (
    <main
      className="relative min-h-screen w-full px-4 py-8 sm:px-6 lg:px-8"
      dir={isRTL ? "rtl" : "ltr"}
      style={{ background: TOKENS.creamSurface, color: TOKENS.inkText }}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-50" style={{ background: GRADIENTS.pageAtmosphere }} />

      <div className="mx-auto max-w-[1160px] space-y-8 md:space-y-10">
        <section
          className="relative overflow-hidden rounded-[2rem] border p-6 md:p-10"
          style={{
            borderColor: "rgba(255,255,255,0.2)",
            background: GRADIENTS.hero,
            boxShadow: SHADOWS.level2,
            color: "#F8FCFF",
          }}
        >
          <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full opacity-70" style={{ background: "rgba(77,179,194,0.4)" }} />
          <div className="pointer-events-none absolute -bottom-12 right-6 h-36 w-36 rounded-full opacity-75" style={{ background: "rgba(243,154,63,0.33)" }} />

          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.08em]"
            style={{
              borderColor: "rgba(255,255,255,0.3)",
              background: "rgba(255,255,255,0.14)",
              color: "#ECFDFF",
            }}
          >
            {t("courses")}
          </span>

          <h1 className="mt-4 text-4xl font-extrabold leading-[1.15] tracking-[-0.02em] md:text-6xl">{t("title")}</h1>
          <p className="mt-3 max-w-[70ch] text-base leading-8 text-[#DDF6FB]">{t("subtitle", { defaultValue: t("discover") })}</p>

          <div className="mt-6 inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold" style={{ background: "rgba(255,255,255,0.15)" }}>
            {totalResults} {t("courses")}
          </div>
        </section>

        <section
          className="rounded-[2rem] border p-6 md:p-8"
          style={{
            borderColor: "rgba(17,24,39,0.08)",
            background: TOKENS.neutralCloud,
            boxShadow: SHADOWS.level1,
          }}
        >
          <div className={`mb-4 flex flex-wrap items-center gap-3 ${isRTL ? "justify-end" : "justify-start"}`}>
            <button
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-transform duration-200 hover:-translate-y-[1px] ${isRTL ? "flex-row-reverse" : ""}`}
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(17,24,39,0.12)",
                color: TOKENS.deepTeal,
                boxShadow: SHADOWS.level1,
              }}
              onClick={() => setShowFilters((prev) => !prev)}
              aria-expanded={showFilters}
              aria-controls="courses-filters-panel"
            >
              {showFilters
                ? (isRTL ? "إخفاء الفلاتر" : "Hide Filters")
                : (isRTL ? "إظهار الفلاتر" : "Show Filters")}
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            <button
              className="rounded-full px-5 py-2 text-sm font-semibold transition-transform duration-200 hover:-translate-y-[1px]"
              style={{ background: "#FFFFFF", border: "1px solid rgba(17,24,39,0.1)", color: TOKENS.deepTeal }}
              onClick={resetFilters}
            >
              {t("filters.reset")}
            </button>
            <label
              className={`flex min-w-[280px] flex-1 items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm shadow-sm ${isRTL ? "flex-row-reverse" : ""}`}
              style={{ borderColor: "rgba(17,24,39,0.1)", color: TOKENS.deepTeal }}
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="sr-only">{t("search.label")}</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  setCurrentPage(1)
                }}
                placeholder={t("search.placeholder")}
                className="w-full border-0 bg-transparent p-0 text-sm outline-none placeholder:text-slate-400"
                aria-label={t("search.label")}
              />
            </label>
            {activeFiltersCount > 0 && (
              <div
                className="inline-flex items-center rounded-full px-4 py-2 text-xs font-bold"
                style={{ background: "rgba(20,106,120,0.12)", color: TOKENS.deepTeal }}
              >
                {isRTL ? `${activeFiltersCount} فلاتر مفعلة` : `${activeFiltersCount} active filters`}
              </div>
            )}
          </div>

          <AnimatePresence initial={false}>
            {showFilters && (
              <motion.div
                id="courses-filters-panel"
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filterOptions.map((filter) => (
                    <FilterDropdown
                      key={filter.label}
                      label={filter.label}
                      options={filter.options}
                      selectedValue={filter.value}
                      placeholder={t("filters.select")}
                      onSelect={filter.onSelect}
                      isRTL={isRTL}
                    />
                  ))}
                </div>

                <div className={`mt-6 flex ${isRTL ? "justify-start" : "justify-end"}`}>
                  <button
                    className={`inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-bold transition-transform duration-200 hover:-translate-y-[1px] ${isRTL ? "flex-row-reverse" : ""}`}
                    style={{ background: TOKENS.goldenSand, color: TOKENS.inkText, boxShadow: SHADOWS.level1 }}
                    onClick={applyFilters}
                  >
                    <Search className="h-5 w-5" />
                    {t("showCourses")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section className="space-y-6">
          <h2 className={`text-2xl font-bold md:text-3xl ${isRTL ? "text-right" : "text-left"}`} style={{ color: TOKENS.deepTeal }}>
            {t("catalogTitle", { defaultValue: t("discover") })}
          </h2>

          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorAlert error={error} onRetry={fetchContainers} />
          ) : memoizedFilteredCourses.length === 0 ? (
            <div
              className={`rounded-[1.4rem] border bg-white py-12 ${isRTL ? "text-right" : "text-left"}`}
              style={{ borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}
            >
              <div className="px-6">
                <p className="text-lg">{t("noCourses")}</p>
                {(selectedSubject ||
                  selectedCourseType ||
                  selectedCourseStatus ||
                  selectedPrice ||
                  searchQuery) && (
                  <button
                    className="mt-4 rounded-full px-5 py-2 text-sm font-semibold"
                    style={{ border: "1px solid rgba(17,24,39,0.15)", color: TOKENS.deepTeal }}
                    onClick={resetFilters}
                  >
                    {t("filters.reset")}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {memoizedFilteredCourses.map((course) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <Link to={buildCoursePath({ _id: course.id, name: course.title })}>
                        <CourseCard {...course} isRTL={isRTL} />
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-2 py-2" style={{ boxShadow: SHADOWS.level1 }}>
                    <button
                      className="rounded-full px-4 py-2 text-sm font-semibold"
                      style={{ color: TOKENS.deepTeal }}
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      {isRTL ? t("pagination.next") : t("pagination.previous")}
                    </button>

                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <button
                          key={pageNum}
                          className="h-9 w-9 rounded-full text-sm font-bold"
                          style={{
                            background: currentPage === pageNum ? TOKENS.deepTeal : "transparent",
                            color: currentPage === pageNum ? "#F8FCFF" : TOKENS.deepTeal,
                          }}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      )
                    })}

                    <button
                      className="rounded-full px-4 py-2 text-sm font-semibold"
                      style={{ color: TOKENS.deepTeal }}
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      {isRTL ? t("pagination.previous") : t("pagination.next")}
                    </button>
                  </div>
                </div>
              )}

              <div className="text-center text-sm" style={{ color: TOKENS.slateText }}>
                {t("showing")} {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalResults)} {t("of")} {totalResults} {t("courses")}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  )
}



