"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Search } from "lucide-react"
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

export default function CoursesPage() {
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

  // Filter states
  const [selectedStage, setSelectedStage] = useState("")
  const [selectedGrade, setSelectedGrade] = useState("")
  const [selectedTerm, setSelectedTerm] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedCourseType, setSelectedCourseType] = useState("")
  const [selectedCourseStatus, setSelectedCourseStatus] = useState("")
  const [selectedPrice, setSelectedPrice] = useState("")

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
          setLevels(levelsResult.data || [])
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

  // Fetch containers when page changes
  useEffect(() => {
    fetchContainers()
  }, [currentPage])

  const fetchContainers = async () => {
  setLoading(true);
  setError("");
  try {
    // Fetch only containers with type "course" and a large limit
    const result = await getAllContainers({
      type: "course",
      limit: 200,
    });

    if (result.status === "success") {
      const containers = result.data.containers;
      // Apply pagination
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const paginatedContainers = containers.slice(startIndex, endIndex);

      setContainers(containers); // Store all fetched course containers
      setFilteredContainers(paginatedContainers); // Set paginated subset
      setTotalResults(containers.length);
      setTotalPages(Math.ceil(containers.length / ITEMS_PER_PAGE));
    } else {
      setError(result.error || "Failed to fetch containers");
    }
  } catch (err) {
    console.error("Error fetching containers:", err);
    setError("حدث خطأ أثناء تحميل البيانات");
  } finally {
    setLoading(false);
  }
};

  const resetFilters = useCallback(() => {
    setSelectedStage("")
    setSelectedGrade("")
    setSelectedTerm("")
    setSelectedSubject("")
    setSelectedCourseType("")
    setSelectedCourseStatus("")
    setSelectedPrice("")
    setCurrentPage(1)

    // Reset to show all course containers with pagination
    const courseContainers = containers.filter((container) => container.type === "course")
    const paginatedContainers = courseContainers.slice(0, ITEMS_PER_PAGE)
    setFilteredContainers(paginatedContainers)
    setTotalResults(courseContainers.length)
    setTotalPages(Math.ceil(courseContainers.length / ITEMS_PER_PAGE))
  }, [containers])

  const generateCourseData = (containersData) =>
    containersData.map((container, index) => {
      const levelName = container.level?.name || ""

      // Use the level name directly from the API and translate it
      const stage = t(`levels.${levelName}`, { defaultValue: levelName })

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
        grade: levelName,
        rating: 4 + (index % 2) * 0.5,
        stage,
        type,
        status,
        price: container.price || 0,
        childrenCount: container.children?.length || 0,
        containerType: container.type || "lecture",
      }
    })

  const applyFilters = useCallback(() => {
    // Filter the containers based on selected filters
    let filtered = [...containers].filter((container) => container.type === "course")

    // Apply stage filter
    if (selectedStage) {
      filtered = filtered.filter((container) => {
        const levelName = container.level?.name || ""
        const translatedStage = t(`levels.${levelName}`, { defaultValue: levelName })
        return translatedStage === selectedStage
      })
    }

    // Apply subject filter
    if (selectedSubject) {
      filtered = filtered.filter((c) => c.subject?.name === selectedSubject)
    }

    // Apply grade filter
    if (selectedGrade) {
      const levelId = levels.find((level) => {
        const translatedLevelName = t(`levels.${level.name}`, { defaultValue: level.name })
        return translatedLevelName === selectedGrade
      })?._id

      if (levelId) {
        filtered = filtered.filter((c) => c.level?._id === levelId)
      }
    }

    // Apply course type filter
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
      filtered = filtered.filter((c) => c.type === apiType)
    }

    // Apply course status filter
    if (selectedCourseStatus) {
      filtered = filtered.filter((c) => {
        const price = c.price || 0
        return selectedCourseStatus === t("status.free") ? price === 0 : price > 0
      })
    }

    // Apply price filter
    if (selectedPrice) {
      const [min, max] = selectedPrice.split("-").map(Number)
      filtered = filtered.filter((c) => {
        const price = c.price || 0
        return price >= min && (max === 0 || price <= max)
      })
    }

    // Reset to first page when applying new filters
    setCurrentPage(1)

    // Apply pagination to filtered results
    const startIndex = 0 // First page
    const endIndex = startIndex + ITEMS_PER_PAGE
    const paginatedContainers = filtered.slice(startIndex, endIndex)

    setFilteredContainers(paginatedContainers)
    setTotalResults(filtered.length)
    setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE))
  }, [
    containers,
    selectedStage,
    selectedGrade,
    selectedSubject,
    selectedCourseType,
    selectedCourseStatus,
    selectedPrice,
    levels,
  ])

  // Apply filters when filter selections change
  useEffect(() => {
    if (containers.length > 0) {
      applyFilters()
    }
  }, [
    selectedStage,
    selectedGrade,
    selectedSubject,
    selectedCourseType,
    selectedCourseStatus,
    selectedPrice,
    containers.length,
  ])

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)

      // Get all filtered containers (without pagination)
      const filtered = [...containers].filter((container) => container.type === "course")

      // Apply all active filters
      if (
        selectedStage ||
        selectedGrade ||
        selectedSubject ||
        selectedCourseType ||
        selectedCourseStatus ||
        selectedPrice
      ) {
        // The filters have already been applied, so we just need to paginate the current filtered set
        const startIndex = (newPage - 1) * ITEMS_PER_PAGE
        const endIndex = startIndex + ITEMS_PER_PAGE
        const paginatedContainers = filtered.slice(startIndex, endIndex)
        setFilteredContainers(paginatedContainers)
      } else {
        // No filters active, just paginate the course containers
        const courseContainers = containers.filter((container) => container.type === "course")
        const startIndex = (newPage - 1) * ITEMS_PER_PAGE
        const endIndex = startIndex + ITEMS_PER_PAGE
        const paginatedContainers = courseContainers.slice(startIndex, endIndex)
        setFilteredContainers(paginatedContainers)
      }
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

  // Create level options from fetched levels
  const levelOptions = useMemo(() => {
    return levels.map((level) => {
      // Use translation for the level name
      const displayName = t(`levels.${level.name}`, { defaultValue: level.name })

      return {
        label: displayName,
        value: displayName,
        id: level._id,
      }
    })
  }, [levels, t])

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
      label: t("filters.stage"),
      value: selectedStage,
      options: [
        { label: t("filters.all"), value: "" },
        { label: t("stages.primary"), value: t("stages.primary") },
        { label: t("stages.middle"), value: t("stages.middle") },
        { label: t("stages.secondary"), value: t("stages.secondary") },
      ],
      onSelect: setSelectedStage,
    },
    {
      label: t("filters.grade"),
      value: selectedGrade,
      options: [{ label: t("filters.all"), value: "" }, ...levelOptions],
      onSelect: setSelectedGrade,
    },
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

  return (
    <div className="relative min-h-screen w-full" dir={isRTL ? "rtl" : "ltr"}>
      <div className={`absolute top-0 ${isRTL ? "left-0" : "right-0"} w-2/3 h-screen pointer-events-none z-0`}>
        <div className="relative w-full h-full">
          <img
            src="/background-courses.png"
            alt="background"
            className="absolute top-0 left-0 w-full h-full object-top opacity-50"
            style={{ maxWidth: "600px" }}
          />
        </div>
      </div>

      <div className="relative z-10">
        <div className={`container mx-auto px-4 pt-8 pb-4 ${isRTL ? "text-right" : "text-left"}`}>
          <div className="relative inline-block">
            <p className="text-3xl font-bold text-primary md:mx-40">{t("title")}</p>
            <img src="/underline.png" alt="underline" className="object-contain" />
          </div>
        </div>

        <div className="container mx-auto px-4 py-4">
          <div className={`flex justify-start`}>
            <button className="btn btn-outline btn-sm rounded-md mx-2" onClick={resetFilters}>
              {t("filters.reset")}
            </button>
            <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <button className="btn btn-primary btn-sm rounded-md">{t("search.options")}</button>
              <Search className="h-6 w-6" />
            </div>
          </div>

          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl ${isRTL ? "ml-auto" : "mr-auto"} mt-4`}
          >
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

          <div className="flex justify-center mt-6">
            <button
              className={`btn btn-accent btn-md rounded-full px-8 ${isRTL ? "flex-row-reverse" : ""}`}
              onClick={applyFilters}
            >
              <Search className="h-5 w-5 ml-2" />
              {t("showCourses")}
            </button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <h2 className={`text-2xl font-bold text-center mb-8 ${isRTL ? "text-right" : "text-left"}`}>
            {t("discover")}
          </h2>

          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorAlert error={error} onRetry={fetchContainers} />
          ) : memoizedFilteredCourses.length === 0 ? (
            <div className={`text-center py-12 ${isRTL ? "text-right" : "text-left"}`}>
              <p className="text-lg">{t("noCourses")}</p>
              {(selectedStage ||
                selectedGrade ||
                selectedTerm ||
                selectedSubject ||
                selectedCourseType ||
                selectedCourseStatus ||
                selectedPrice) && (
                <button className="btn btn-outline btn-sm mt-4" onClick={resetFilters}>
                  {t("filters.reset")}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {memoizedFilteredCourses.map((course) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Link to={`/courses/${course.id}`}>
                        <CourseCard {...course} isRTL={isRTL} />
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="join">
                    <button
                      className="join-item btn"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      {isRTL ? t("pagination.next") : t("pagination.previous")}
                    </button>

                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        // If 5 or fewer pages, show all
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        // If near the start, show first 5 pages
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        // If near the end, show last 5 pages
                        pageNum = totalPages - 4 + i
                      } else {
                        // Otherwise show 2 before and 2 after current page
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <button
                          key={pageNum}
                          className={`join-item btn ${currentPage === pageNum ? "btn-active" : ""}`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      )
                    })}

                    <button
                      className="join-item btn"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      {isRTL ? t("pagination.previous") : t("pagination.next")}
                    </button>
                  </div>
                </div>
              )}

              <div className="text-center mt-4 text-sm text-gray-600">
                {t("showing")} {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, totalResults)} {t("of")} {totalResults} {t("courses")}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
