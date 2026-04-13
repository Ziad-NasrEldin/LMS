import { useState, useEffect, useCallback, memo } from "react"
import { useTranslation } from "react-i18next"
import { Book, ChevronDown, ChevronRight } from "lucide-react"
import { getContainerHierarchy } from "../routes/lectures"
import { motion, AnimatePresence } from "framer-motion"
import SyllabusItem from "./SyllabusItem"
import { translateErrorMessage } from "../utils/errorTranslator"

const Syllabus = memo(function Syllabus({
  courseId,
  isPurchased,
  onPurchase,
  purchaseInProgress,
  onNavigate,
  tokens,
  purchaseHistory,
}) {
  const { t, i18n } = useTranslation("courseDetails")
  const isRTL = i18n.language === "ar"

  const [hierarchy, setHierarchy] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandAll, setExpandAll] = useState(false)

  // Fetch hierarchy on mount
  useEffect(() => {
    const fetchHierarchy = async () => {
      try {
        setLoading(true)
        setError(null)

        const result = await getContainerHierarchy(courseId)

        if (result?.status === "success" && result.data) {
          setHierarchy(result.data.container)
        } else if (result?.status === "restricted") {
          setError(
            result?.message
              ? translateErrorMessage(result.message)
              : t("errors.accessRestricted", "Access to this content is restricted")
          )
        } else {
          setError(
            result?.message
              ? translateErrorMessage(result.message)
              : t("errors.fetchError", "Failed to load syllabus")
          )
        }
      } catch (err) {
        console.error("Error fetching hierarchy:", err)
        setError(translateErrorMessage(err?.message || t("errors.unexpected", "An unexpected error occurred")))
      } finally {
        setLoading(false)
      }
    }

    if (courseId) {
      fetchHierarchy()
    }
  }, [courseId, t])

  // Check if a container is purchased (memoized)
  const checkIsPurchased = useCallback(
    (containerId) => {
      if (!purchaseHistory || !containerId) return false

      const normalizedId = containerId.toString()
      const purchasedIds = new Set(
        purchaseHistory
          .map((p) => {
            const id = p.container?._id || p.container?.id || p.container
            return id?.toString()
          })
          .filter(Boolean)
      )

      if (purchasedIds.has(normalizedId)) return true

      // Check if parent course is purchased
      if (hierarchy && hierarchy._id?.toString() === normalizedId) {
        return false // This is the root, check its ID directly above
      }

      // If the root course is purchased, all children are accessible
      const rootId = hierarchy?._id?.toString()
      if (rootId && purchasedIds.has(rootId)) {
        // Check if this is a descendant of the purchased course
        return true
      }

      return false
    },
    [purchaseHistory, hierarchy]
  )

  // Toggle all sections
  const handleToggleAll = () => {
    setExpandAll(!expandAll)
    // Note: This is a visual toggle, actual expansion is controlled by individual items
    // We could implement a context-based approach for global control
  }

  if (loading) {
    return (
      <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm">
        <div className="p-8 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: tokens.deepTeal }} />
          <p className="text-sm font-medium" style={{ color: tokens.slateText }}>
            {t("syllabus.loading", "Loading syllabus...")}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl overflow-hidden border border-red-100 bg-red-50 shadow-sm">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-500 text-lg">!</span>
            </div>
            <div>
              <p className="font-semibold text-red-700">{t("errors.error", "Error")}</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!hierarchy || !hierarchy.children || hierarchy.children.length === 0) {
    return (
      <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: `${tokens.lightAquaMist}30` }}
          >
            <Book className="w-8 h-8" style={{ color: tokens.deepTeal }} />
          </div>
          <p className="font-semibold text-sm" style={{ color: tokens.slateText }}>
            {t("syllabus.noContent", "No content available for this course yet")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold" style={{ color: tokens.deepTeal }}>
          {t("syllabus.title", "Course Content")}
        </h3>
        {hierarchy.children.length > 0 && (
          <button
            onClick={handleToggleAll}
            className="text-sm font-medium px-3 py-1.5 rounded-full transition-colors hover:bg-gray-100"
            style={{ color: tokens.deepTeal }}
          >
            {expandAll ? t("syllabus.collapseAll", "Collapse All") : t("syllabus.expandAll", "Expand All")}
          </button>
        )}
      </div>

      {/* Syllabus Content */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          border: "1.5px solid rgba(17,24,39,0.08)",
          background: "white",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
        }}
      >
        {hierarchy.children.map((child, idx) => (
          <SyllabusItem
            key={child._id || child.id || idx}
            item={child}
            depth={0}
            isPurchased={checkIsPurchased}
            onPurchase={onPurchase}
            purchaseInProgress={purchaseInProgress}
            onNavigate={onNavigate}
            t={t}
            isRTL={isRTL}
            tokens={tokens}
          />
        ))}
      </div>
    </div>
  )
})

export default Syllabus
