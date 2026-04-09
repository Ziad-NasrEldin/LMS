import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { designTokens } from "../../../../constants/designTokens"
import { getAllReviews, getReviewStats, approveReview, rejectReview, respondToReview, deleteReview } from "../../../../routes/reviews"
import { Star, CheckCircle, XCircle, MessageCircle, Trash2, RefreshCw } from "lucide-react"

const ReviewManagement = () => {
  const { t, i18n } = useTranslation('adminReviews')
  const isRTL = i18n.language === 'ar'
  const dir = isRTL ? 'rtl' : 'ltr'
  
  const TOKENS = designTokens.colors
  const GRADIENTS = designTokens.gradients
  const SHADOWS = designTokens.shadows

  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState({ total: 0, pending: 0, byStatus: {} })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedReview, setSelectedReview] = useState(null)
  const [responseText, setResponseText] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchReviews = async () => {
    setLoading(true)
    const status = filter === 'all' ? undefined : filter
    const result = await getAllReviews({ status, page, limit: 20 })
    if (result.status === 'success') {
      setReviews(result.data || [])
      setTotalPages(result.pagination?.pages || 1)
    }
    setLoading(false)
  }

  const fetchStats = async () => {
    const result = await getReviewStats()
    if (result.status === 'success') {
      setStats(result.data || { total: 0, pending: 0, byStatus: {} })
    }
  }

  useEffect(() => {
    fetchReviews()
    fetchStats()
  }, [filter, page])

  const handleApprove = async (reviewId) => {
    setActionLoading(true)
    const result = await approveReview(reviewId)
    if (result.status === 'success') {
      await fetchReviews()
      await fetchStats()
    }
    setActionLoading(false)
  }

  const handleReject = async (reviewId) => {
    setActionLoading(true)
    const result = await rejectReview(reviewId)
    if (result.status === 'success') {
      await fetchReviews()
      await fetchStats()
    }
    setActionLoading(false)
  }

  const handleRespond = async (reviewId) => {
    if (!responseText.trim()) return
    setActionLoading(true)
    const result = await respondToReview(reviewId, responseText)
    if (result.status === 'success') {
      setResponseText('')
      setSelectedReview(null)
      await fetchReviews()
    }
    setActionLoading(false)
  }

  const handleDelete = async (reviewId) => {
    if (!confirm(t('confirmDelete'))) return
    setActionLoading(true)
    const result = await deleteReview(reviewId)
    if (result.status === 'success') {
      await fetchReviews()
      await fetchStats()
    }
    setActionLoading(false)
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: 'bg-amber-100', text: 'text-amber-800' },
      approved: { bg: 'bg-green-100', text: 'text-green-800' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800' },
    }
    const style = styles[status] || styles.pending
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${style.bg} ${style.text}`}>
        {t(`status.${status}`)}
      </span>
    )
  }

  return (
    <div 
      className="relative mx-auto w-full max-w-full p-6 md:p-10 min-h-screen font-[Cairo]" 
      dir={dir}
      style={{ background: TOKENS.creamSurface, color: TOKENS.inkText }}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-50" style={{ background: GRADIENTS.pageAtmosphere }} />

      <div className="transition-all duration-300 space-y-8 relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black" style={{ color: TOKENS.deepTeal }}>
              {t('title')}
            </h1>
        <p className="mt-1 text-sm text-slate-700">
              {t('subtitle')}
            </p>
          </div>
          <button
            onClick={() => { fetchReviews(); fetchStats() }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all hover:scale-105"
            style={{ background: TOKENS.deepTeal, color: 'white' }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div 
            className="rounded-xl p-6"
            style={{ background: 'white', boxShadow: SHADOWS.level1 }}
          >
          <p className="text-sm font-bold text-slate-700">{t('stats.totalReviews')}</p>
            <p className="text-3xl font-black mt-2" style={{ color: TOKENS.deepTeal }}>{stats.total}</p>
          </div>
          <div 
            className="rounded-xl p-6"
            style={{ background: 'white', boxShadow: SHADOWS.level1 }}
          >
          <p className="text-sm font-bold text-slate-700">{t('stats.pendingApproval')}</p>
            <p className="text-3xl font-black mt-2" style={{ color: TOKENS.warmMango }}>{stats.pending}</p>
          </div>
          <div 
            className="rounded-xl p-6"
            style={{ background: 'white', boxShadow: SHADOWS.level1 }}
          >
          <p className="text-sm font-bold text-slate-700">{t('stats.approved')}</p>
            <p className="text-3xl font-black mt-2" style={{ color: '#16a34a' }}>{stats.byStatus?.approved || 0}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', labelKey: 'filters.all' },
            { id: 'pending', labelKey: 'filters.pending' },
            { id: 'approved', labelKey: 'filters.approved' },
            { id: 'rejected', labelKey: 'filters.rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setFilter(tab.id); setPage(1) }}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                filter === tab.id
                  ? 'text-white'
                  : 'bg-white hover:bg-gray-50'
              }`}
              style={{
                background: filter === tab.id ? TOKENS.deepTeal : undefined,
                boxShadow: SHADOWS.level1,
              }}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto" 
              style={{ borderColor: `${TOKENS.deepTeal}40`, borderTopColor: 'transparent' }}
            />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 rounded-xl" style={{ background: 'white', boxShadow: SHADOWS.level1 }}>
            <p className="text-lg font-medium opacity-60">
              {t('empty')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review._id}
                className="rounded-xl p-6 transition-all hover:shadow-lg"
                style={{ background: 'white', boxShadow: SHADOWS.level1 }}
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left: Student Info */}
                  <div className="lg:w-1/4 flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ background: GRADIENTS.hero }}
                    >
                      {review.studentName?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: TOKENS.deepTeal }}>{review.studentName}</p>
                      <p className="text-xs opacity-60">{new Date(review.createdAt).toLocaleDateString()}</p>
                      {getStatusBadge(review.status)}
                    </div>
                  </div>

                  {/* Middle: Review Content */}
                  <div className="lg:w-2/4 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className="h-4 w-4"
                            style={{
                              color: TOKENS.warmMango,
                              fill: star <= review.rating ? TOKENS.warmMango : 'none',
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-bold" style={{ color: TOKENS.warmMango }}>{review.rating}/5</span>
                    </div>
                    <p className="text-sm leading-relaxed mb-3">{review.comment}</p>
                    <p className="text-xs opacity-60">
                      {t('review.course')}: {review.container?.name || '-'}
                    </p>
                    {review.adminResponse && (
                      <div className="mt-3 p-3 rounded-lg" style={{ background: `${TOKENS.lightAquaMist}30` }}>
                        <p className="text-xs font-bold mb-1" style={{ color: TOKENS.deepTeal }}>
                          {t('review.adminResponse')}:
                        </p>
                        <p className="text-sm">{review.adminResponse}</p>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="lg:w-1/4 flex flex-wrap gap-2">
                    {review.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(review._id)}
                          disabled={actionLoading}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg font-bold text-xs text-green-700 bg-green-100 hover:bg-green-200 transition-all disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {t('actions.approve')}
                        </button>
                        <button
                          onClick={() => handleReject(review._id)}
                          disabled={actionLoading}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg font-bold text-xs text-red-700 bg-red-100 hover:bg-red-200 transition-all disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                          {t('actions.reject')}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedReview(review)}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg font-bold text-xs text-blue-700 bg-blue-100 hover:bg-blue-200 transition-all"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {t('actions.respond')}
                    </button>
                    <button
                      onClick={() => handleDelete(review._id)}
                      disabled={actionLoading}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg font-bold text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t('actions.delete')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-lg font-bold transition-all ${
                  page === p ? 'text-white' : 'bg-white hover:bg-gray-50'
                }`}
                style={{
                  background: page === p ? TOKENS.deepTeal : undefined,
                  boxShadow: SHADOWS.level1,
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Response Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: 'white', boxShadow: SHADOWS.level2 }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: TOKENS.deepTeal }}>
              {t('modal.respondTitle')}
            </h3>
            <div className="mb-4 p-4 rounded-lg" style={{ background: `${TOKENS.neutralCloud}50` }}>
              <p className="text-sm font-bold mb-1">{selectedReview.studentName}</p>
              <p className="text-sm italic">"{selectedReview.comment}"</p>
            </div>
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder={t('modal.placeholder')}
              className="w-full rounded-xl border p-4 text-sm resize-none mb-4"
              style={{ 
                borderColor: 'rgba(17,24,39,0.15)',
                minHeight: '100px'
              }}
              maxLength={500}
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleRespond(selectedReview._id)}
                disabled={!responseText.trim() || actionLoading}
                className="flex-1 py-3 rounded-full font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
                style={{ background: TOKENS.deepTeal }}
              >
                {t('modal.sendResponse')}
              </button>
              <button
                onClick={() => { setSelectedReview(null); setResponseText('') }}
                className="px-6 py-3 rounded-full font-bold border transition-all hover:bg-gray-50"
                style={{ borderColor: 'rgba(17,24,39,0.15)' }}
              >
                {t('modal.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReviewManagement
