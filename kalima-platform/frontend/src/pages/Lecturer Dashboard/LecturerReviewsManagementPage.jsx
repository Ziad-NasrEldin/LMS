"use client"

import { useTranslation } from "react-i18next"
import { useEffect, useState, useCallback } from "react"
import { designTokens } from "../../constants/designTokens"
import { getAllReviews, approveReview, rejectReview, respondToReview, deleteReview } from "../../routes/reviews"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorAlert } from "../../components/ErrorAlert"
import { Star, MessageSquare, CheckCircle, XCircle, Trash2, Send, Search, Filter } from "lucide-react"
import { toast } from "react-hot-toast"
import { translateErrorMessage } from "../../utils/errorTranslator"

export default function LecturerReviewsManagementPage() {
  const { t, i18n } = useTranslation("lecturerDashboard")
  const isRTL = i18n.language === "ar"
  const TOKENS = designTokens.colors

  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState("all") // all, pending, approved, rejected
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedReview, setSelectedReview] = useState(null)
  const [responseText, setResponseText] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getAllReviews({ status: filter !== "all" ? filter : undefined })
      if (result?.status === "success") {
        const reviewsWithCourse = (result.data || []).map((review) => ({
          ...review,
          courseName: review.container?.name || t("unknownCourse", "Unknown Course"),
        }))
        setReviews(reviewsWithCourse)
      } else {
        setError(translateErrorMessage(result?.error || t("fetchReviewsError", "Failed to fetch reviews"), t))
      }
    } catch (err) {
      setError(translateErrorMessage(err.message, t))
    } finally {
      setLoading(false)
    }
  }, [filter, t])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleApprove = async (reviewId) => {
    setActionLoading(true)
    try {
      const result = await approveReview(reviewId)
      if (result?.status === "success") {
        toast.success(t("reviewApproved", "Review approved"))
        fetchReviews()
      } else {
        toast.error(translateErrorMessage(result?.error || t("approveError", "Failed to approve review"), t))
      }
    } catch (err) {
      toast.error(translateErrorMessage(err.message, t))
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (reviewId) => {
    setActionLoading(true)
    try {
      const result = await rejectReview(reviewId)
      if (result?.status === "success") {
        toast.success(t("reviewRejected", "Review rejected"))
        fetchReviews()
      } else {
        toast.error(translateErrorMessage(result?.error || t("rejectError", "Failed to reject review"), t))
      }
    } catch (err) {
      toast.error(translateErrorMessage(err.message, t))
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (reviewId) => {
    if (!window.confirm(t("confirmDeleteReview", "Are you sure you want to delete this review?"))) {
      return
    }
    setActionLoading(true)
    try {
      const result = await deleteReview(reviewId)
      // 204 No Content = success (result is empty string)
      if (result?.status === "success" || result === "") {
        toast.success(t("reviewDeleted", "Review deleted"))
        fetchReviews()
      } else {
        toast.error(translateErrorMessage(result?.error || t("deleteError", "Failed to delete review"), t))
      }
    } catch (err) {
      toast.error(translateErrorMessage(err.message, t))
    } finally {
      setActionLoading(false)
    }
  }

  const handleRespond = async () => {
    if (!selectedReview || !responseText.trim()) return
    setActionLoading(true)
    try {
      const result = await respondToReview(selectedReview._id, responseText)
      if (result?.status === "success") {
        toast.success(t("responseSent", "Response sent"))
        setResponseText("")
        setSelectedReview(null)
        fetchReviews()
      } else {
        toast.error(translateErrorMessage(result?.error || t("responseError", "Failed to send response"), t))
      }
    } catch (err) {
      toast.error(translateErrorMessage(err.message, t))
    } finally {
      setActionLoading(false)
    }
  }

  const filteredReviews = reviews.filter(
    (review) =>
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.courseName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "#10B981"
      case "pending":
        return "#F59E0B"
      case "rejected":
        return "#EF4444"
      default:
        return TOKENS.slateText
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case "approved":
        return t("approved", "Approved")
      case "pending":
        return t("pending", "Pending")
      case "rejected":
        return t("rejected", "Rejected")
      default:
        return status
    }
  }

  return (
    <div
      className="min-h-screen"
      dir={isRTL ? "rtl" : "ltr"}
      style={{ background: TOKENS.neutralCloud }}
    >
      <div className="pt-14">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:px-8 lg:px-10">
          {/* Header */}
          <div
            className="rounded-[2rem] border px-5 py-6 md:px-8 md:py-7 mb-8"
            style={{ background: "white", borderColor: "rgba(17,24,39,0.08)" }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="p-3 rounded-xl"
                style={{ background: `${TOKENS.lightAquaMist}40` }}
              >
                <MessageSquare className="h-6 w-6" style={{ color: TOKENS.deepTeal }} />
              </div>
              <h1
                className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight"
                style={{ color: TOKENS.deepTeal }}
              >
                {t("reviewsManagement", "Reviews Management")}
              </h1>
            </div>
            <p className="text-sm md:text-base" style={{ color: TOKENS.slateText }}>
              {t("reviewsManagementDesc", "Manage student reviews and feedback for your courses")}
            </p>
          </div>

          {/* Filters and Search */}
          <div
            className="rounded-[1.5rem] border px-4 py-4 mb-6"
            style={{ background: "white", borderColor: "rgba(17,24,39,0.08)" }}
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
                  style={{ color: TOKENS.slateText }}
                />
                <input
                  type="text"
                  placeholder={t("searchReviews", "Search reviews, students, or courses...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm"
                  style={{ borderColor: "rgba(17,24,39,0.15)" }}
                />
              </div>

              {/* Filter Dropdown */}
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" style={{ color: TOKENS.slateText }} />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border text-sm"
                  style={{ borderColor: "rgba(17,24,39,0.15)" }}
                >
                  <option value="all">{t("allReviews", "All Reviews")}</option>
                  <option value="pending">{t("pendingReviews", "Pending")}</option>
                  <option value="approved">{t("approvedReviews", "Approved")}</option>
                  <option value="rejected">{t("rejectedReviews", "Rejected")}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <ErrorAlert message={error} onRetry={fetchReviews} />
          ) : filteredReviews.length === 0 ? (
            <div
              className="rounded-[1.5rem] border px-8 py-12 text-center"
              style={{ background: "white", borderColor: "rgba(17,24,39,0.08)" }}
            >
              <MessageSquare
                className="h-12 w-12 mx-auto mb-4"
                style={{ color: `${TOKENS.slateText}50` }}
              />
              <p className="text-lg font-medium" style={{ color: TOKENS.slateText }}>
                {t("noReviewsFound", "No reviews found")}
              </p>
              <p className="text-sm mt-1" style={{ color: `${TOKENS.slateText}80` }}>
                {t("noReviewsDesc", "Reviews will appear here once students submit them")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <div
                  key={review._id}
                  className="rounded-[1.5rem] border px-5 py-5"
                  style={{ background: "white", borderColor: "rgba(17,24,39,0.08)" }}
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Left: Student Info */}
                    <div className="md:w-48 flex-shrink-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ background: TOKENS.deepTeal }}
                        >
                          {review.studentName?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: TOKENS.inkText }}>
                            {review.studentName || t("anonymous", "Anonymous")}
                          </p>
                          <p className="text-xs" style={{ color: TOKENS.slateText }}>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-0.5 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className="h-4 w-4"
                            style={{
                              color: TOKENS.warmMango,
                              fill: star <= review.rating ? TOKENS.warmMango : "none",
                            }}
                          />
                        ))}
                      </div>
                      <span
                        className="inline-block px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: `${getStatusColor(review.status)}20`,
                          color: getStatusColor(review.status),
                        }}
                      >
                        {getStatusLabel(review.status)}
                      </span>
                    </div>

                    {/* Middle: Review Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium mb-1" style={{ color: TOKENS.deepTeal }}>
                        {review.courseName}
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: TOKENS.inkText }}>
                        &ldquo;{review.comment}&rdquo;
                      </p>
                      {review.adminResponse && (
                        <div
                          className="mt-3 p-3 rounded-xl"
                          style={{ background: `${TOKENS.lightAquaMist}30` }}
                        >
                          <p className="text-xs font-bold mb-1" style={{ color: TOKENS.deepTeal }}>
                            {t("yourResponse", "Your Response")}:
                          </p>
                          <p className="text-sm" style={{ color: TOKENS.slateText }}>
                            {review.adminResponse}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex md:flex-col gap-2">
                      {review.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(review._id)}
                            disabled={actionLoading}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white transition-all hover:scale-105 disabled:opacity-50"
                            style={{ background: "#10B981" }}
                          >
                            <CheckCircle className="h-4 w-4" />
                            {t("approve", "Approve")}
                          </button>
                          <button
                            onClick={() => handleReject(review._id)}
                            disabled={actionLoading}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white transition-all hover:scale-105 disabled:opacity-50"
                            style={{ background: "#EF4444" }}
                          >
                            <XCircle className="h-4 w-4" />
                            {t("reject", "Reject")}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setSelectedReview(review)}
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 disabled:opacity-50"
                        style={{
                          background: `${TOKENS.deepTeal}15`,
                          color: TOKENS.deepTeal,
                        }}
                      >
                        <Send className="h-4 w-4" />
                        {t("respond", "Respond")}
                      </button>
                      <button
                        onClick={() => handleDelete(review._id)}
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 disabled:opacity-50"
                        style={{
                          background: "#FEE2E2",
                          color: "#DC2626",
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        {t("delete", "Delete")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Response Modal */}
          {selectedReview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div
                className="w-full max-w-lg rounded-[1.5rem] border p-6"
                style={{ background: "white", borderColor: "rgba(17,24,39,0.08)" }}
              >
                <h3
                  className="text-xl font-bold mb-4"
                  style={{ color: TOKENS.deepTeal }}
                >
                  {t("respondToReview", "Respond to Review")}
                </h3>
                <div className="mb-4 p-3 rounded-xl" style={{ background: TOKENS.neutralCloud }}>
                  <p className="text-sm" style={{ color: TOKENS.slateText }}>
                    &ldquo;{selectedReview.comment}&rdquo;
                  </p>
                  <p className="text-xs mt-2" style={{ color: TOKENS.slateText }}>
                    — {selectedReview.studentName || t("anonymous", "Anonymous")}
                  </p>
                </div>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder={t("responsePlaceholder", "Write your response...")}
                  className="w-full p-4 rounded-xl border text-sm resize-none mb-4"
                  style={{ borderColor: "rgba(17,24,39,0.15)", minHeight: "120px" }}
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleRespond}
                    disabled={!responseText.trim() || actionLoading}
                    className="flex-1 py-3 rounded-xl font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
                    style={{ background: TOKENS.deepTeal }}
                  >
                    {actionLoading
                      ? t("sending", "Sending...")
                      : t("sendResponse", "Send Response")}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedReview(null)
                      setResponseText("")
                    }}
                    className="px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
                    style={{
                      background: TOKENS.neutralCloud,
                      color: TOKENS.slateText,
                    }}
                  >
                    {t("cancel", "Cancel")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
