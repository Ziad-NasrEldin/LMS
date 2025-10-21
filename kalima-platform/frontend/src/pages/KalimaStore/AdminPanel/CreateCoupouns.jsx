"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import {
  getAllCoupons,
  getActiveCoupons,
  getUsedCoupons,
  createCoupon,
  deleteCoupon,
} from "../../../routes/marketCoupouns"
import {
  Ticket,
  Plus,
  Search,
  Filter,
  X,
  Trash2,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Copy,
  Eye,
} from "lucide-react"

const CreateCoupons = () => {
  const { t, i18n } = useTranslation("kalimaStore-coupons")
  const isRTL = i18n.language === "ar"

  // Loading states
  const [loading, setLoading] = useState(true)
  const [createLoading, setCreateLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState({})
  const [error, setError] = useState(null)

  // Data states
  const [coupons, setCoupons] = useState([])
  const [filteredCoupons, setFilteredCoupons] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    used: 0,
    expired: 0,
  })

  // Filter states
  const [statusFilter, setStatusFilter] = useState("all") // all, active, used, expired
  const [searchQuery, setSearchQuery] = useState("")

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Create form state
  const [createForm, setCreateForm] = useState({
    value: "",
    expirationDays: "",
  })

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10) // Fixed items per page
  const [totalPages, setTotalPages] = useState(1)
  const [paginatedCoupons, setPaginatedCoupons] = useState([])

  // Fetch coupons based on filter
  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let response
      switch (statusFilter) {
        case "active":
          response = await getActiveCoupons()
          break
        case "used":
          response = await getUsedCoupons()
          break
        default:
          response = await getAllCoupons()
          break
      }

      if (response.success) {
        const couponData = response.data.data || []
        setCoupons(couponData)

        // Calculate stats
        const total = couponData.length
        const active = couponData.filter((coupon) => coupon.isActive && !coupon.isExpired).length
        const used = couponData.filter((coupon) => !coupon.isActive && coupon.usedBy).length
        const expired = couponData.filter((coupon) => coupon.isExpired).length

        setStats({ total, active, used, expired })
      } else {
        throw new Error(response.error)
      }
    } catch (err) {
      setError(err.message)
      console.error("Error fetching coupons:", err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  // Apply search filter and pagination
  const applySearchFilter = useCallback(() => {
    let filtered = [...coupons]

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (coupon) =>
          coupon.couponCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          coupon.createdBy?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          coupon.value.toString().includes(searchQuery),
      )
    }

    // Apply additional status filters for "all" view
    if (statusFilter === "all") {
      // No additional filtering needed
    } else if (statusFilter === "expired") {
      filtered = filtered.filter((coupon) => coupon.isExpired)
    }

    setFilteredCoupons(filtered)

    // Calculate pagination
    const total = Math.ceil(filtered.length / itemsPerPage)
    setTotalPages(total)

    // Reset to page 1 if current page is beyond total pages
    const validPage = currentPage > total ? 1 : currentPage
    if (validPage !== currentPage) {
      setCurrentPage(validPage)
    }

    // Get items for current page
    const startIndex = (validPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginated = filtered.slice(startIndex, endIndex)
    setPaginatedCoupons(paginated)
  }, [coupons, searchQuery, statusFilter, currentPage, itemsPerPage])

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchCoupons()
  }, [fetchCoupons])

  // Apply search when dependencies change
  useEffect(() => {
    applySearchFilter()
  }, [applySearchFilter])

  // Handle create coupon
  const handleCreateCoupon = async () => {
    if (!createForm.value || !createForm.expirationDays) {
      alert(t("alerts.fillAllFields"))
      return
    }

    try {
      setCreateLoading(true)

      const couponData = {
        value: Number.parseFloat(createForm.value),
        expirationDays: Number.parseInt(createForm.expirationDays),
      }

      const response = await createCoupon(couponData)

      if (response.success) {
        alert(t("alerts.couponCreated"))
        setShowCreateModal(false)
        setCreateForm({ value: "", expirationDays: "" })
        setCurrentPage(1) // Reset to first page to see new coupon
        fetchCoupons() // Refresh the list
      } else {
        throw new Error(response.error)
      }
    } catch (err) {
      alert(t("alerts.createFailed") + err.message)
    } finally {
      setCreateLoading(false)
    }
  }

  // Handle delete coupon
  const handleDeleteCoupon = async () => {
    if (!selectedCoupon) return

    try {
      setDeleteLoading({ ...deleteLoading, [selectedCoupon._id]: true })

      const response = await deleteCoupon(selectedCoupon._id)

      if (response.success) {
        alert(t("alerts.couponDeleted"))
        setShowDeleteModal(false)
        setSelectedCoupon(null)

        // Check if we need to go back a page after deletion
        const remainingItems = filteredCoupons.length - 1
        const maxPage = Math.ceil(remainingItems / itemsPerPage)
        if (currentPage > maxPage && maxPage > 0) {
          setCurrentPage(maxPage)
        }

        fetchCoupons() // Refresh the list
      } else {
        throw new Error(response.error)
      }
    } catch (err) {
      alert(t("alerts.deleteFailed") + err.message)
    } finally {
      setDeleteLoading({ ...deleteLoading, [selectedCoupon._id]: false })
    }
  }

  // Handle copy coupon code
  const handleCopyCouponCode = (couponCode) => {
    navigator.clipboard.writeText(couponCode)
    alert(t("alerts.codeCopied"))
  }

  // Get coupon status
  const getCouponStatus = (coupon) => {
    if (coupon.isExpired) return "expired"
    if (!coupon.isActive && coupon.usedBy) return "used"
    if (coupon.isActive) return "active"
    return "inactive"
  }

  // Get status badge
  const getStatusBadge = (coupon) => {
    const status = getCouponStatus(coupon)

    switch (status) {
      case "active":
        return <div className="badge badge-success">{t("status.active")}</div>
      case "used":
        return <div className="badge badge-warning">{t("status.used")}</div>
      case "expired":
        return <div className="badge badge-error">{t("status.expired")}</div>
      default:
        return <div className="badge badge-ghost">{t("status.inactive")}</div>
    }
  }

  // Clear filters
  const clearFilters = () => {
    setStatusFilter("all")
    setSearchQuery("")
    setCurrentPage(1) // Reset to first page
  }

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== "all" || searchQuery.trim() !== ""

  if (loading && coupons.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg mb-4"></div>
          <p className="text-lg">{t("loading")}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="alert alert-error max-w-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="font-bold">{t("errorLoadingCoupons")}</h3>
            <div className="text-xs">{error}</div>
          </div>
          <button onClick={() => window.location.reload()} className="btn btn-sm">
            {t("retry")}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen p-6 ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-center relative mb-8">
        <div className={`absolute ${isRTL ? "right-10" : "left-10"}`}>
          <img src="/waves.png" alt="Decorative zigzag" className="w-20 h-full animate-float-zigzag" />
        </div>
        <h1 className="text-3xl font-bold text-center flex items-center gap-3">
          <Ticket className="w-8 h-8 text-primary" />
          {t("title")}
        </h1>
        <div className={`absolute ${isRTL ? "left-0" : "right-0"}`}>
          <img src="/ring.png" alt="Decorative circle" className="w-20 h-full animate-float-up-dottedball" />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Coupons */}
        <div
          className={`card bg-blue-600 text-white shadow-lg cursor-pointer hover:shadow-xl transition-all ${
            statusFilter === "all" ? "ring-4 ring-blue-300" : ""
          }`}
          onClick={() => setStatusFilter("all")}
        >
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium opacity-90">{t("stats.total")}</h3>
                <p className="text-2xl font-bold">{loading ? "..." : stats.total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Coupons */}
        <div
          className={`card bg-green-600 text-white shadow-lg cursor-pointer hover:shadow-xl transition-all ${
            statusFilter === "active" ? "ring-4 ring-green-300" : ""
          }`}
          onClick={() => setStatusFilter("active")}
        >
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium opacity-90">{t("stats.active")}</h3>
                <p className="text-2xl font-bold">{loading ? "..." : stats.active}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Used Coupons */}
        <div
          className={`card bg-orange-600 text-white shadow-lg cursor-pointer hover:shadow-xl transition-all ${
            statusFilter === "used" ? "ring-4 ring-orange-300" : ""
          }`}
          onClick={() => setStatusFilter("used")}
        >
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium opacity-90">{t("stats.used")}</h3>
                <p className="text-2xl font-bold">{loading ? "..." : stats.used}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Expired Coupons */}
        <div
          className={`card bg-red-600 text-white shadow-lg cursor-pointer hover:shadow-xl transition-all ${
            statusFilter === "expired" ? "ring-4 ring-red-300" : ""
          }`}
          onClick={() => setStatusFilter("expired")}
        >
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium opacity-90">{t("stats.expired")}</h3>
                <p className="text-2xl font-bold">{loading ? "..." : stats.expired}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Indicator */}
      {hasActiveFilters && (
        <div className="card shadow-lg mb-6">
          <div className="card-body p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{t("activeFilters")}:</span>

              {statusFilter !== "all" && (
                <div className="badge badge-primary gap-2">
                  {t(`filters.${statusFilter}`)}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setStatusFilter("all")} />
                </div>
              )}

              {searchQuery.trim() && (
                <div className="badge badge-accent gap-2">
                  Search: "{searchQuery}"
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                </div>
              )}

              <button className="btn btn-ghost btn-xs ml-2" onClick={clearFilters}>
                {t("clearFilters")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls Section */}
      <div className="card shadow-lg mb-6">
        <div className="card-body p-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
              {/* Search */}
              <div className="relative flex-1 min-w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  className="input input-bordered w-full pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <select
                className="select select-bordered"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">{t("filters.all")}</option>
                <option value="active">{t("filters.active")}</option>
                <option value="used">{t("filters.used")}</option>
                <option value="expired">{t("filters.expired")}</option>
              </select>
            </div>

            {/* Create Button */}
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4" />
              {t("createCoupon")}
            </button>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="card shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th className="text-center">{t("table.code")}</th>
                <th className="text-center">{t("table.value")}</th>
                <th className="text-center">{t("table.status")}</th>
                <th className="text-center">{t("table.expiration")}</th>
                <th className="text-center">{t("table.createdBy")}</th>
                <th className="text-center">{t("table.usedBy")}</th>
                <th className="text-center">{t("table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8">
                    <div className="loading loading-spinner loading-lg"></div>
                  </td>
                </tr>
              ) : paginatedCoupons.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8">
                    <div className="text-6xl mb-4">🎫</div>
                    <h3 className="text-xl font-semibold mb-2">{t("table.noCoupons")}</h3>
                    <p className="text-gray-500">{t("table.tryAdjustingFilters")}</p>
                  </td>
                </tr>
              ) : (
                paginatedCoupons.map((coupon) => (
                  <tr key={coupon._id} className="hover">
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <code className="bg-base-200 px-2 py-1 rounded font-mono text-sm">{coupon.couponCode}</code>
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => handleCopyCouponCode(coupon.couponCode)}
                          title={t("copyCode")}
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-bold">{coupon.value}</span>
                      </div>
                    </td>
                    <td className="text-center">{getStatusBadge(coupon)}</td>
                    <td className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm">{coupon.expirationDateFormatted}</span>
                        {coupon.isExpired && <span className="text-xs text-error">Expired</span>}
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-medium text-sm">{coupon.createdBy?.name}</span>
                        <span className="text-xs opacity-50">{coupon.createdBy?.role}</span>
                      </div>
                    </td>
                    <td className="text-center">
                      {coupon.usedBy ? (
                        <div className="flex items-center justify-center gap-1">
                          <User className="w-4 h-4 text-orange-600" />
                          <span className="text-sm">Used by <span className="font-bold">{coupon.usedBy.name}</span></span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setSelectedCoupon(coupon)
                            setShowDetailsModal(true)
                          }}
                          title={t("viewDetails")}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="btn btn-error btn-sm"
                          onClick={() => {
                            setSelectedCoupon(coupon)
                            setShowDeleteModal(true)
                          }}
                          disabled={deleteLoading[coupon._id]}
                          title={t("deleteCoupon")}
                        >
                          {deleteLoading[coupon._id] ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <div className="join">
            <button
              className="join-item btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t("pagination.previous")}
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageToShow

              if (totalPages <= 5) {
                pageToShow = i + 1
              } else if (currentPage <= 3) {
                pageToShow = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageToShow = totalPages - 4 + i
              } else {
                pageToShow = currentPage - 2 + i
              }

              return (
                <button
                  key={pageToShow}
                  className={`join-item btn ${currentPage === pageToShow ? "btn-primary" : ""}`}
                  onClick={() => handlePageChange(pageToShow)}
                  disabled={loading}
                >
                  {pageToShow}
                </button>
              )
            })}

            <button
              className="join-item btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
            >
              {t("pagination.next")}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="text-sm text-gray-600">
            {t("pagination.showing")}{" "}
            {Math.min((currentPage - 1) * itemsPerPage + 1, filteredCoupons.length)} -{" "}
            {Math.min(currentPage * itemsPerPage, filteredCoupons.length)} {t("pagination.of")}{" "}
            {filteredCoupons.length} {t("pagination.coupons")}
          </div>
        </div>
      )}

      {/* Create Coupon Modal */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">{t("createCoupon")}</h3>

            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">{t("form.value")} *</span>
                </label>
                <input
                  type="number"
                  placeholder="15"
                  className="input input-bordered"
                  value={createForm.value}
                  onChange={(e) => setCreateForm({ ...createForm, value: e.target.value })}
                />
                <label className="label">
                  <span className="label-text-alt">{t("form.valueHint")}</span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">{t("form.expirationDays")} *</span>
                </label>
                <input
                  type="number"
                  placeholder="30"
                  className="input input-bordered"
                  value={createForm.expirationDays}
                  onChange={(e) => setCreateForm({ ...createForm, expirationDays: e.target.value })}
                />
                <label className="label">
                  <span className="label-text-alt">{t("form.daysHint")}</span>
                </label>
              </div>
            </div>

            <div className="modal-action">
              <button
                className="btn"
                onClick={() => {
                  setShowCreateModal(false)
                  setCreateForm({ value: "", expirationDays: "" })
                }}
              >
                {t("cancel")}
              </button>
              <button className="btn btn-primary" onClick={handleCreateCoupon} disabled={createLoading}>
                {createLoading ? <span className="loading loading-spinner loading-sm"></span> : t("create")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCoupon && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">{t("deleteCoupon")}</h3>

            <p className="mb-4">
              {t("deleteConfirmation")} <br />
              <strong>Code:</strong> {selectedCoupon.couponCode} <br />
              <strong>Value:</strong> {selectedCoupon.value}
            </p>

            <div className="modal-action">
              <button
                className="btn"
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedCoupon(null)
                }}
              >
                {t("cancel")}
              </button>
              <button
                className="btn btn-error"
                onClick={handleDeleteCoupon}
                disabled={deleteLoading[selectedCoupon._id]}
              >
                {deleteLoading[selectedCoupon._id] ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  t("delete")
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedCoupon && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">{t("couponDetails")}</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text font-medium">{t("details.code")}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="bg-base-200 px-3 py-2 rounded font-mono">{selectedCoupon.couponCode}</code>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleCopyCouponCode(selectedCoupon.couponCode)}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-medium">{t("details.value")}</span>
                  </label>
                  <p className="text-2xl font-bold text-primary">{selectedCoupon.value}</p>
                </div>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-medium">{t("details.status")}</span>
                </label>
                <div>{getStatusBadge(selectedCoupon)}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text font-medium">{t("details.created")}</span>
                  </label>
                  <p>{new Date(selectedCoupon.createdAt).toLocaleDateString()}</p>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-medium">{t("details.expiration")}</span>
                  </label>
                  <p>{selectedCoupon.expirationDateFormatted}</p>
                </div>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-medium">{t("details.createdBy")}</span>
                </label>
                <div className="bg-base-200 p-3 rounded">
                  <p>
                    <strong>{t("details.name")}:</strong> {selectedCoupon.createdBy?.name}
                  </p>
                  <p>
                    <strong>{t("details.email")}:</strong> {selectedCoupon.createdBy?.email}
                  </p>
                  <p>
                    <strong>{t("details.role")}:</strong> {selectedCoupon.createdBy?.role}
                  </p>
                </div>
              </div>

              {selectedCoupon.usedBy && (
                <div>
                  <label className="label">
                    <span className="label-text font-medium">{t("details.usageInfo")}</span>
                  </label>
                  <div className="bg-base-200 p-3 rounded">
                    <p>
                      <strong>{t("details.usedAt")}:</strong>{" "}
                      {new Date(selectedCoupon.usedAt).toLocaleDateString()}
                    </p>
                    {selectedCoupon.appliedToPurchase && (
                      <p>
                        <strong>{t("details.appliedTo")}:</strong>{" "}
                        {selectedCoupon.appliedToPurchase}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-action">
              <button
                className="btn"
                onClick={() => {
                  setShowDetailsModal(false)
                  setSelectedCoupon(null)
                }}
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CreateCoupons
