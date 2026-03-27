"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"
import { useTranslation } from "react-i18next"
import { User, BookOpen, Star, Edit, Eye, Clock, Users, FileText } from "lucide-react"
import { Link } from "react-router-dom"
import { getMyContainers, deleteContainerById } from "../../routes/lectures"
import Pagination from "../../components/Pagination"
import { designTokens } from "../../constants/designTokens"

const TOKENS = designTokens.colors
const SHADOWS = designTokens.shadows
const RADIUS = designTokens.radius

// Memoized Course Card Component
const CourseCard = memo(function CourseCard({
  container,
  index,
  stats,
  getContainerTypeTranslation,
  getContainerImage,
  onDelete,
  loading,
  t,
  isRTL,
}) {
  const chipSideMargin = isRTL ? "ml-1" : "mr-1"

  return (
    <div
      className="group card border bg-white transition-all duration-300 overflow-hidden h-full flex flex-col hover:-translate-y-1"
      style={{
        borderColor: "rgba(17,24,39,0.08)",
        borderRadius: RADIUS.card,
        boxShadow: SHADOWS.level1,
      }}
    >
      <figure className="relative h-52 flex-shrink-0 overflow-hidden">
        <img
          src={getContainerImage(container, index) || "/placeholder.svg"}
          alt={container.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          <div
            className="rounded-full px-3 py-1 text-xs font-semibold shadow-sm"
            style={{ background: TOKENS.lightAquaMist, color: TOKENS.deepTeal }}
          >
            {getContainerTypeTranslation(container.type)}
          </div>
        </div>
        {container.price > 0 ? (
          <div
            className="absolute bottom-3 right-3 px-3 py-1 rounded-full text-xs font-semibold shadow-sm"
            style={{ background: TOKENS.goldenSand, color: TOKENS.inkText }}
          >
            {container.price} {t("currency")}
          </div>
        ) : (
          <div className="absolute bottom-3 right-3 bg-success text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
            {t("free")}
          </div>
        )}
      </figure>

      <div className="card-body flex-grow flex flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-xl font-black tracking-tight line-clamp-2" style={{ color: TOKENS.inkText }}>
              {container.name}
            </h3>
            <p className="mt-1 text-sm font-medium" style={{ color: TOKENS.slateText }}>
              {container.subject?.name || t("unspecified")}
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: TOKENS.lightAquaMist, color: TOKENS.deepTeal }}>
            <Star className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <div className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: "rgba(17,24,39,0.08)", color: TOKENS.slateText }}>
            <User className={`inline-block h-3.5 w-3.5 ${chipSideMargin}`} />
            {container.createdBy?.name || t("unknown")}
          </div>
          <div className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: "rgba(17,24,39,0.08)", color: TOKENS.slateText }}>
            <BookOpen className={`inline-block h-3.5 w-3.5 ${chipSideMargin}`} />
            {container.level?.name || t("unspecified")}
          </div>
        </div>

        <div
          className="mt-4 rounded-2xl border px-4 py-3"
          style={{ background: "rgba(14,85,99,0.04)", borderColor: "rgba(17,24,39,0.06)" }}
        >
          <div className="flex justify-between text-xs font-semibold" style={{ color: TOKENS.slateText }}>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{stats.students} {t("student")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{stats.lectures} {t("content")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{stats.duration}</span>
            </div>
          </div>
        </div>

        <div className="card-actions mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
          <Link to={`container-details/${container._id}`} className="w-full sm:w-auto">
            <button
              className="btn btn-sm border-0 w-full sm:w-auto shadow-sm"
              style={{ background: TOKENS.lightAquaMist, color: TOKENS.deepTeal, borderRadius: RADIUS.chip }}
            >
              <Eye
                className="h-4 w-4"
                style={{ marginRight: isRTL ? 0 : "0.25rem", marginLeft: isRTL ? "0.25rem" : 0 }}
              />
              {t("view")}
            </button>
          </Link>
          {container.type !== "lecture" && (
            <Link to={`/dashboard/lecturer-dashboard/CoursesForm/${container._id}`} className="w-full sm:w-auto">
              <button
                className="btn btn-sm w-full sm:w-auto border-0 shadow-sm"
                style={{ background: "#E0F2FE", color: "#075985", borderRadius: RADIUS.chip }}
              >
                <Edit className="h-4 w-4" style={{ marginRight: isRTL ? 0 : "0.25rem", marginLeft: isRTL ? "0.25rem" : 0 }} />
                {t("edit", { defaultValue: "Edit" })}
              </button>
            </Link>
          )}
          <button
            className="btn btn-sm w-full sm:w-auto border-0 shadow-sm"
            style={{ background: "#FDE8EE", color: "#BE123C", borderRadius: RADIUS.chip }}
            onClick={() => onDelete(container._id)}
            disabled={loading}
          >
            {t("delete")}
          </button>
        </div>
      </div>
    </div>
  )
})

CourseCard.displayName = "CourseCard"

export default function CourseGrid() {
  const { t, i18n } = useTranslation("lecturerDashboard")
  const isRTL = i18n.language === "ar"
  const [containers, setContainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 3

  // Memoized filtered containers
  const filteredContainers = useMemo(() => {
    return containers
      .filter((container) => container.parent === null || container.type === "lecture")
      .sort((left, right) => {
        const leftDate = new Date(left.createdAt || left._id || 0).getTime()
        const rightDate = new Date(right.createdAt || right._id || 0).getTime()

        return rightDate - leftDate
      })
  }, [containers])

  // Fetch lecturer's containers
  const fetchContainers = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getMyContainers()

      if (result.status === "success") {
        setContainers(result.data?.containers || [])
      } else {
        setError(result.message || "Failed to fetch containers")
      }
    } catch (err) {
      console.error("Error fetching containers:", err)
      setError(t("errorDeletingContainer"))
    } finally {
      setLoading(false)
    }
  }, [t])

  const handleDeleteContainer = useCallback(
    async (containerId) => {
      if (!window.confirm(t("confirmDeleteContainer"))) return

      try {
        setLoading(true)
        const result = await deleteContainerById(containerId)
        if (result.status === "success") {
          fetchContainers()
        } else {
          setError(result.message || t("failedToDeleteContainer"))
        }
      } catch (err) {
        console.error("Error deleting container:", err)
        setError(t("errorDeletingContainer"))
      } finally {
        setLoading(false)
      }
    },
    [t, fetchContainers],
  )

  useEffect(() => {
    fetchContainers()
  }, [fetchContainers])

  // Memoized pagination data
  const paginationData = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    return {
      currentItems: filteredContainers.slice(indexOfFirstItem, indexOfLastItem),
      totalItems: filteredContainers.length,
    }
  }, [currentPage, filteredContainers, itemsPerPage])

  // Memoized container type getter using translations
  const getContainerTypeTranslation = useCallback(
    (type) => {
      return t(`containerTypes.${type}`, { defaultValue: type })
    },
    [t],
  )

  // Memoized container image getter
  const getContainerImage = useCallback((container, index) => {
    if (container.type === "lecture") {
      return `/course-${(index % 3) + 1}.png`
    }
    if (container.subject?.name === "Mathematics") {
      return `/course-${(index % 3) + 1}.png`
    }
    return `/course-${(index % 6) + 1}.png`
  }, [])

  // Memoized container stats calculator with translations
  const getContainerStats = useCallback(
    (container) => ({
      students: container.numberOfViews || 0,
      lectures: container.children?.length || 0,
      duration:
        container.type === "lecture" ? `45 ${t("minutes")}` : `${container.children?.length || 0} ${t("lectures")}`,
    }),
    [t],
  )

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="mx-auto w-24 h-24 bg-base-200 rounded-full flex items-center justify-center">
          <BookOpen className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-xl font-bold">{t("noCoursesTitle")}</h3>
        <p className="text-lg text-gray-500 max-w-md mx-auto">{t("noCoursesDescription")}</p>
        <Link to="/dashboard/lecturer-dashboard/CoursesForm">
          <button className="btn btn-primary mt-4">
            <Edit className="h-4 w-4" style={{ marginRight: isRTL ? 0 : "0.5rem", marginLeft: isRTL ? "0.5rem" : 0 }} />
            {t("addNewCourse")}
          </button>
        </Link>
      </div>
    )
  }

  // Empty state
  if (filteredContainers?.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-500">{t("noCourses")}</p>
        <Link to="/dashboard/lecturer-dashboard/CoursesForm">
          <button className="btn btn-primary mt-4">{t("addNewCourse")}</button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: TOKENS.deepTeal }}>
            {t("courseManagement")}
          </h2>
          <p className="mt-2 text-sm md:text-base" style={{ color: TOKENS.slateText }}>
            {isRTL ? "بطاقات محدثة تتبع لغة التصميم الحالية" : "Updated cards that follow the current design language."}
          </p>
        </div>
        <Link to="/dashboard/lecturer-dashboard/CoursesForm">
          <button
            className="btn border-none hover:scale-105 transition-transform rounded-full px-6 h-11 min-h-11"
            style={{ background: TOKENS.deepTeal, color: "#F8FCFF" }}
          >
            <span>{t("addNewCourse")}</span>
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 lg:gap-8">
        {paginationData.currentItems?.map((container, index) => {
          const stats = getContainerStats(container)
          return (
            <CourseCard
              key={container._id}
              container={container}
              index={index}
              stats={stats}
              getContainerTypeTranslation={getContainerTypeTranslation}
              getContainerImage={getContainerImage}
              onDelete={handleDeleteContainer}
              loading={loading}
              t={t}
              isRTL={isRTL}
            />
          )
        })}
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={paginationData.totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        labels={{
          previous: isRTL ? "السابق" : "Previous",
          next: isRTL ? "التالي" : "Next",
          showing: isRTL ? "عرض" : "Showing",
          of: isRTL ? "من" : "of",
        }}
      />
    </div>
  )
}
