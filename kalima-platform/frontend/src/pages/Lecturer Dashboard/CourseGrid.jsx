"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"
import { useTranslation } from "react-i18next"
import { User, BookOpen, Star, Edit, Eye, Clock, Users, FileText, ImageOff } from "lucide-react"
import { Link } from "react-router-dom"
import { getMyContainers, deleteContainerById } from "../../routes/lectures"
import Pagination from "../../components/Pagination"
import { designTokens } from "../../constants/designTokens"
import { translateErrorMessage } from "../../utils/errorTranslator"
import { resolveUploadUrl } from "../../utils/uploadUrl"

const TOKENS = designTokens.colors
const SHADOWS = designTokens.shadows
const RADIUS = designTokens.radius
const COURSE_CARD_FALLBACK_IMAGES = ["/course-1.png", "/course-4.png"]
const COURSE_CARD_UI = {
  border: "rgba(14,85,99,0.2)",
  borderSoft: "rgba(14,85,99,0.11)",
  imageOverlay: "linear-gradient(180deg, rgba(7,20,24,0.02) 12%, rgba(7,20,24,0.54) 100%)",
  imageFallbackBackground: "linear-gradient(180deg, #E6F6F9 0%, #C7EAF0 100%)",
  typeBadgeBackground: TOKENS.lightAquaMist,
  typeBadgeText: TOKENS.deepTeal,
  paidBadgeBackground: TOKENS.goldenSand,
  paidBadgeText: TOKENS.inkText,
  freeBadgeBackground: "#16A34A",
  freeBadgeText: "#F8FCFF",
  iconBadgeBackground: "#D8F1F4",
  iconBadgeText: TOKENS.deepTeal,
  metaChipBackground: "#F4FAFC",
  metaChipBorder: "rgba(20,106,120,0.2)",
  metaChipText: TOKENS.slateText,
  statsPanelBackground: "rgba(14,85,99,0.07)",
  statsPanelBorder: "rgba(14,85,99,0.2)",
  statsIconBackground: "#E8F7F9",
  statsIconText: TOKENS.deepTeal,
  statsText: TOKENS.slateText,
  viewActionBackground: TOKENS.lightAquaMist,
  viewActionText: TOKENS.deepTeal,
  editActionBackground: "#DBEEFF",
  editActionText: "#075985",
  deleteActionBackground: "#FDE8EE",
  deleteActionText: "#BE123C",
}

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
  const fallbackImage = COURSE_CARD_FALLBACK_IMAGES[index % COURSE_CARD_FALLBACK_IMAGES.length]
  const defaultImage = useMemo(
    () => getContainerImage(container, index) || fallbackImage,
    [container, fallbackImage, getContainerImage, index],
  )
  const [imageSrc, setImageSrc] = useState(defaultImage)
  const [showImageFallbackPanel, setShowImageFallbackPanel] = useState(false)

  useEffect(() => {
    setImageSrc(defaultImage)
    setShowImageFallbackPanel(false)
  }, [defaultImage, container?._id])

  const handleImageError = useCallback(() => {
    if (imageSrc !== fallbackImage) {
      setImageSrc(fallbackImage)
      return
    }

    setShowImageFallbackPanel(true)
  }, [fallbackImage, imageSrc])

  const actionIconSpacing = {
    marginRight: isRTL ? 0 : "0.25rem",
    marginLeft: isRTL ? "0.25rem" : 0,
  }
  const isPaid = Number(container.price) > 0
  const canEdit = container.type !== "lecture"
  const statItems = [
    { icon: Users, value: stats.students, label: t("student") },
    { icon: FileText, value: stats.lectures, label: t("content") },
    { icon: Clock, value: stats.duration, label: isRTL ? "المدة" : "Duration" },
  ]
  const actionBaseClass =
    "inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md"

  return (
    <article
      className="group overflow-hidden border bg-white transition-all duration-300 h-full flex flex-col hover:-translate-y-1"
      style={{
        borderColor: COURSE_CARD_UI.border,
        borderRadius: RADIUS.card,
        boxShadow: SHADOWS.level1,
      }}
    >
      <figure className="relative h-56 flex-shrink-0 overflow-hidden border-b" style={{ borderColor: COURSE_CARD_UI.borderSoft }}>
        {!showImageFallbackPanel && (
          <img
            src={imageSrc}
            alt={container.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
            onError={handleImageError}
          />
        )}
        {showImageFallbackPanel && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{ background: COURSE_CARD_UI.imageFallbackBackground, color: TOKENS.deepTeal }}
          >
            <ImageOff className="h-7 w-7" />
            <span className="text-xs font-semibold">{t("imageUnavailable", { defaultValue: "Image unavailable" })}</span>
          </div>
        )}
        {!showImageFallbackPanel && <div className="absolute inset-0" style={{ background: COURSE_CARD_UI.imageOverlay }} />}
        <div className="absolute left-3 top-3 flex gap-2">
          <div
            className="rounded-full px-3 py-1 text-xs font-semibold shadow-sm"
            style={{ background: COURSE_CARD_UI.typeBadgeBackground, color: COURSE_CARD_UI.typeBadgeText }}
          >
            {getContainerTypeTranslation(container.type)}
          </div>
        </div>
        {isPaid ? (
          <div
            className="absolute bottom-3 right-3 px-3 py-1 rounded-full text-xs font-semibold shadow-sm"
            style={{ background: COURSE_CARD_UI.paidBadgeBackground, color: COURSE_CARD_UI.paidBadgeText }}
          >
            {container.price} {t("currency")}
          </div>
        ) : (
          <div
            className="absolute bottom-3 right-3 px-3 py-1 rounded-full text-xs font-semibold shadow-sm"
            style={{ background: COURSE_CARD_UI.freeBadgeBackground, color: COURSE_CARD_UI.freeBadgeText }}
          >
            {t("free")}
          </div>
        )}
      </figure>

      <div className="flex-grow flex flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 min-h-[68px]">
          <div className="min-w-0">
            <h3 className="text-xl font-black tracking-tight line-clamp-2" style={{ color: TOKENS.inkText }}>
              {container.name}
            </h3>
            <p className="mt-1 text-sm font-semibold" style={{ color: TOKENS.slateText }}>
              {container.subject?.name || t("unspecified")}
            </p>
          </div>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ background: COURSE_CARD_UI.iconBadgeBackground, color: COURSE_CARD_UI.iconBadgeText }}
          >
            <Star className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <div
            className="rounded-full border px-3 py-1 text-xs font-semibold"
            style={{
              background: COURSE_CARD_UI.metaChipBackground,
              borderColor: COURSE_CARD_UI.metaChipBorder,
              color: COURSE_CARD_UI.metaChipText,
            }}
          >
            <User className={`inline-block h-3.5 w-3.5 ${chipSideMargin}`} />
            {container.createdBy?.name || t("unknown")}
          </div>
          <div
            className="rounded-full border px-3 py-1 text-xs font-semibold"
            style={{
              background: COURSE_CARD_UI.metaChipBackground,
              borderColor: COURSE_CARD_UI.metaChipBorder,
              color: COURSE_CARD_UI.metaChipText,
            }}
          >
            <BookOpen className={`inline-block h-3.5 w-3.5 ${chipSideMargin}`} />
            {container.level?.name || t("unspecified")}
          </div>
        </div>

        <div
          className="mt-4 rounded-2xl border px-3 py-3"
          style={{
            background: COURSE_CARD_UI.statsPanelBackground,
            borderColor: COURSE_CARD_UI.statsPanelBorder,
          }}
        >
          <div className="grid grid-cols-3 gap-2">
            {statItems.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="rounded-xl px-2 py-2 text-center" style={{ background: "rgba(255,255,255,0.75)" }}>
                  <div className="mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full" style={{ background: COURSE_CARD_UI.statsIconBackground, color: COURSE_CARD_UI.statsIconText }}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-xs font-bold leading-4" style={{ color: TOKENS.inkText }}>{item.value}</p>
                  <p className="text-[11px] leading-4" style={{ color: COURSE_CARD_UI.statsText }}>{item.label}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className={`mt-5 grid gap-2 ${canEdit ? "grid-cols-3" : "grid-cols-2"}`}>
          <Link to={`container-details/${container._id}`} className="block">
            <button
              className={actionBaseClass}
              style={{
                background: COURSE_CARD_UI.viewActionBackground,
                color: COURSE_CARD_UI.viewActionText,
                borderRadius: RADIUS.chip
              }}
            >
              <Eye className="h-4 w-4" style={actionIconSpacing} />
              {t("view")}
            </button>
          </Link>
          {canEdit && (
            <Link to={`/dashboard/lecturer-dashboard/CoursesForm/${container._id}`} className="block">
              <button
                className={actionBaseClass}
                style={{
                  background: COURSE_CARD_UI.editActionBackground,
                  color: COURSE_CARD_UI.editActionText,
                  borderRadius: RADIUS.chip
                }}
              >
                <Edit className="h-4 w-4" style={actionIconSpacing} />
                {t("edit", { defaultValue: "Edit" })}
              </button>
            </Link>
          )}
          <button
            className={actionBaseClass}
            style={{
              background: COURSE_CARD_UI.deleteActionBackground,
              color: COURSE_CARD_UI.deleteActionText,
              borderRadius: RADIUS.chip
            }}
            onClick={() => onDelete(container._id)}
            disabled={loading}
          >
            {t("delete")}
          </button>
        </div>
      </div>
    </article>
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
    setError(null)
    try {
      const result = await getMyContainers()
      const message = String(result?.message || "").toLowerCase()
      const noContainersMessage = message.includes("no containers found for this lecturer")

      if (result.status === "success") {
        setContainers(result.data?.containers || [])
      } else if (noContainersMessage) {
        setContainers([])
      } else {
        setError(translateErrorMessage(result.message || "Failed to fetch containers"))
      }
    } catch (err) {
      console.error("Error fetching containers:", err)
      setError(translateErrorMessage(t("errorDeletingContainer")))
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
        const isDeleteSuccess = result?.status === "success" || result?.success === true

        if (isDeleteSuccess) {
          setError(null)
          await fetchContainers()
        } else {
          setError(translateErrorMessage(result.message || t("failedToDeleteContainer")))
        }
      } catch (err) {
        console.error("Error deleting container:", err)
        setError(translateErrorMessage(t("errorDeletingContainer")))
      } finally {
        setLoading(false)
      }
    },
    [t, fetchContainers],
  )

  useEffect(() => {
    fetchContainers()
  }, [fetchContainers])

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredContainers.length / itemsPerPage))
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [filteredContainers.length, currentPage, itemsPerPage])

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
    const thumbnailFolder = container.type === "lecture" ? "lecture_thumbnails" : "product_thumbnails"
    const imagePath =
      container?.image?.url ||
      container?.containerImage?.url ||
      container?.inheritedImage?.image?.url ||
      container?.thumbnail

    const resolvedImage = resolveUploadUrl(imagePath, thumbnailFolder)
    if (resolvedImage) {
      return resolvedImage
    }
    return COURSE_CARD_FALLBACK_IMAGES[index % COURSE_CARD_FALLBACK_IMAGES.length]
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
          <button className="btn btn-primary mt-4" style={{ color: "#F8FCFF" }}>
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
          <button className="btn btn-primary mt-4" style={{ color: "#F8FCFF" }}>{t("addNewCourse")}</button>
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
            style={{ background: designTokens.gradients.cta, color: "#F8FCFF", boxShadow: SHADOWS.level1 }}
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
