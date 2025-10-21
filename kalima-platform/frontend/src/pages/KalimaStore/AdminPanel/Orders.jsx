"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  getAllProductPurchases,
  confirmProductPurchase,
  confirmBookPurchase,
  updatePurchase,
} from "../../../routes/orders"
import { FaWhatsapp } from "react-icons/fa"
import { Check, Eye, ImageIcon, Notebook, Edit3, MessageSquare, Save, X, Calendar, Filter } from "lucide-react"
import * as XLSX from "xlsx"

const Orders = () => {
  const { t, i18n } = useTranslation("kalimaStore-orders")
  const isRTL = i18n.language === "ar"

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirmLoading, setConfirmLoading] = useState({})
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedDate, setSelectedDate] = useState("") // Add date filter state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPurchases, setTotalPurchases] = useState(0)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    products: 0,
    books: 0,
  })
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [exporting, setExporting] = useState(false)

  // Enhanced notes modal state
  const [notesModal, setNotesModal] = useState({
    isOpen: false,
    orderId: null,
    notes: "",
    originalNotes: "",
    loading: false,
    hasChanges: false,
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      if (searchQuery !== debouncedSearchQuery && currentPage !== 1) {
        setCurrentPage(1)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, debouncedSearchQuery, currentPage])

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const queryParams = {
        page: currentPage,
      }
      if (debouncedSearchQuery.trim()) {
        queryParams.search = debouncedSearchQuery.trim()
      }
      if (statusFilter !== "all") {
        queryParams.confirmed = statusFilter === "confirmed"
      }
      // Add date filter to query params
      if (selectedDate) {
        queryParams.date = selectedDate
      }

      const response = await getAllProductPurchases(queryParams)
      if (response.success) {
        let purchases = response.data.data.purchases
        if (typeFilter !== "all") {
          if (typeFilter === "book") {
            purchases = purchases.filter((order) => order.__t === "ECBookPurchase")
          } else if (typeFilter === "product") {
            purchases = purchases.filter((order) => !order.__t || order.__t !== "ECBookPurchase")
          }
        }

        setOrders(purchases)
        setTotalPages(response.data.totalPages)
        setTotalPurchases(response.data.totalPurchases)

        const allPurchases = response.data.data.purchases
        const confirmed = allPurchases.filter((order) => order.confirmed).length
        const pending = allPurchases.filter((order) => !order.confirmed).length
        const products = allPurchases.filter((order) => !order.__t || order.__t !== "ECBookPurchase").length
        const books = allPurchases.filter((order) => order.__t === "ECBookPurchase").length

        setStats({
          total: response.data.totalPurchases,
          confirmed: confirmed,
          pending: pending,
          products: products,
          books: books,
        })
      } else {
        throw new Error(response.error)
      }
    } catch (err) {
      setError(err.message)
      console.error("Error fetching orders:", err)
    } finally {
      setLoading(false)
    }
  }, [currentPage, statusFilter, typeFilter, debouncedSearchQuery, selectedDate])

  const handleRefresh = useCallback(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Add date change handler
  const handleDateChange = (date) => {
    setSelectedDate(date)
    if (currentPage !== 1) {
      setCurrentPage(1) // Reset to first page when date changes
    }
  }

  // Add clear filters function
  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setTypeFilter("all")
    setSelectedDate("")
    setCurrentPage(1)
  }

  // Check if any filters are active
  const hasActiveFilters =
    searchQuery.trim() !== "" || statusFilter !== "all" || typeFilter !== "all" || selectedDate !== ""

  const handleConfirmOrder = async (order) => {
    try {
      setConfirmLoading({ ...confirmLoading, [order._id]: true })
      let response
      if (order.__t === "ECBookPurchase") {
        response = await confirmBookPurchase(order._id)
      } else {
        response = await confirmProductPurchase(order._id)
      }

      if (response.success) {
        setOrders((prevOrders) => prevOrders.map((o) => (o._id === order._id ? { ...o, confirmed: true } : o)))
        setStats((prevStats) => ({
          ...prevStats,
          confirmed: prevStats.confirmed + 1,
          pending: prevStats.pending - 1,
        }))
        alert(t("alerts.orderConfirmed"))
      } else {
        throw new Error(response.error)
      }
    } catch (err) {
      console.error("Error confirming order:", err)
      alert(t("alerts.failedToConfirm") + err.message)
    } finally {
      setConfirmLoading({ ...confirmLoading, [order._id]: false })
    }
  }

  const handleViewDetails = (order) => {
    setSelectedOrder(order)
    setShowDetailsModal(true)
  }

  const handleViewPaymentScreenshot = (screenshotPath) => {
    if (!screenshotPath) return
    const baseURL = import.meta.env.VITE_API_URL?.replace(/\/api\/v1$/, "") || ""
    const normalizedPath = screenshotPath.startsWith("uploads/")
      ? `${baseURL}/${screenshotPath}`
      : `${baseURL}/${screenshotPath}`
    window.open(normalizedPath, "_blank")
  }

  const handleWhatsAppContact = (order) => {
    const phoneNumber = order.createdBy?.phoneNumber
    const message = encodeURIComponent(
      `أهلاً بك أ/ ${order.userName} 👋 تم استلام طلبك ${order.productName} بنجاح، وجارٍ تجهيزه الآن.لو عندك أي استفسار بخصوص الطلب ، تقدر تتواصل معانا في أي وقت على نفس الرقم.نتمنى تعجبك تجربتك معانا، ومبسوطين إنك اخترتنا! 💙مع تحيات فريق عملمنصة فكرة`,
    )
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`
    window.open(whatsappUrl, "_blank")
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage)
    }
  }

  const getOrderType = (order) => {
    return order.__t === "ECBookPurchase" ? "Book" : "Product"
  }

  const formatPrice = (price) => {
    return `${price} ج`
  }

  const formatTime = (dateString) =>
    new Date(dateString).toLocaleTimeString(i18n.language, {
      hour: "2-digit",
      minute: "2-digit",
    })

  // Enhanced notes functionality
  const openNotesModal = (order) => {
    const currentNotes = order.adminNotes || ""
    setNotesModal({
      isOpen: true,
      orderId: order._id,
      notes: currentNotes,
      originalNotes: currentNotes,
      loading: false,
      hasChanges: false,
    })
  }

  const handleNotesChange = (newNotes) => {
    setNotesModal((prev) => ({
      ...prev,
      notes: newNotes,
      hasChanges: newNotes !== prev.originalNotes,
    }))
  }

  const handleSaveNotes = async () => {
    if (!notesModal.hasChanges) {
      setNotesModal({ isOpen: false, orderId: null, notes: "", originalNotes: "", loading: false, hasChanges: false })
      return
    }

    try {
      setNotesModal((prev) => ({ ...prev, loading: true }))
      const response = await updatePurchase(notesModal.orderId, {
        adminNotes: notesModal.notes,
      })

      if (response.success) {
        // Update the orders list
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === notesModal.orderId ? { ...order, adminNotes: notesModal.notes } : order,
          ),
        )
        // Update selected order if it's the same one
        if (selectedOrder && selectedOrder._id === notesModal.orderId) {
          setSelectedOrder((prev) => ({ ...prev, adminNotes: notesModal.notes }))
        }
        // Close modal
        setNotesModal({ isOpen: false, orderId: null, notes: "", originalNotes: "", loading: false, hasChanges: false })
        alert(t("alerts.notesSaved"))
      } else {
        throw new Error(response.error)
      }
    } catch (error) {
      console.error("Error saving notes:", error)
      alert(t("alerts.failedToSaveNotes") + error.message)
    } finally {
      setNotesModal((prev) => ({ ...prev, loading: false }))
    }
  }

  const closeNotesModal = () => {
    if (notesModal.hasChanges) {
      if (confirm(t("alerts.unsavedChanges"))) {
        setNotesModal({ isOpen: false, orderId: null, notes: "", originalNotes: "", loading: false, hasChanges: false })
      }
    } else {
      setNotesModal({ isOpen: false, orderId: null, notes: "", originalNotes: "", loading: false, hasChanges: false })
    }
  }

  // Get notes preview for table display
  const getNotesPreview = (notes) => {
    if (!notes) return ""
    return notes.length > 50 ? notes.substring(0, 50) + "..." : notes
  }

  // Memoize order items to prevent unnecessary re-renders
  const memoizedOrders = useMemo(() => {
    return orders.map((order) => ({
      ...order,
      orderType: getOrderType(order),
      formattedPrice: formatPrice(order.price),
      notesPreview: getNotesPreview(order.adminNotes),
    }))
  }, [orders])

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
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
            <h3 className="font-bold">{t("errorLoadingOrders")}</h3>
            <div className="text-xs">{error}</div>
          </div>
          <button onClick={fetchOrders} className="btn btn-sm">
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
        <h1 className="text-3xl font-bold text-center">{t("ordersManagement")}</h1>
        <div className={`absolute ${isRTL ? "left-0" : "right-0"}`}>
          <img src="/ring.png" alt="Decorative circle" className="w-20 h-full animate-float-up-dottedball" />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="card bg-blue-600 text-white shadow-lg">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">📦</div>
              <div>
                <h3 className="text-sm font-medium opacity-90">{t("stats.totalOrders")}</h3>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-green-600 text-white shadow-lg">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">✅</div>
              <div>
                <h3 className="text-sm font-medium opacity-90">{t("stats.confirmed")}</h3>
                <p className="text-2xl font-bold">{stats.confirmed}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-orange-600 text-white shadow-lg">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">⏳</div>
              <div>
                <h3 className="text-sm font-medium opacity-90">{t("stats.pending")}</h3>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-purple-600 text-white shadow-lg">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">📚</div>
              <div>
                <h3 className="text-sm font-medium opacity-90">{t("stats.books")}</h3>
                <p className="text-2xl font-bold">{stats.books}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-teal-600 text-white shadow-lg">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">🛍️</div>
              <div>
                <h3 className="text-sm font-medium opacity-90">{t("stats.products")}</h3>
                <p className="text-2xl font-bold">{stats.products}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card shadow-lg mb-6">
        <div className="card-body p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                className="input input-bordered w-full pr-12"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {searchQuery && (
                <button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 btn btn-ghost btn-sm"
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2 min-w-40">
              <Calendar className="w-4 h-4" />
              <input
                type="date"
                className="input input-bordered w-full"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                title={t("filters.selectDate")}
              />
            </div>

            <div className="min-w-40">
              <select
                className="select select-bordered w-full"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">{t("filters.allStatus")}</option>
                <option value="confirmed">{t("filters.confirmed")}</option>
                <option value="pending">{t("filters.pending")}</option>
              </select>
            </div>

            <div className="min-w-40">
              <select
                className="select select-bordered w-full"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">{t("filters.allTypes")}</option>
                <option value="book">{t("filters.books")}</option>
                <option value="product">{t("filters.products")}</option>
              </select>
            </div>

            <button onClick={handleRefresh} className="btn btn-primary" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm"></span> : "🔄"}
              {t("refresh")}
            </button>

              {/* Export CSV button */}
              <button
                onClick={async () => {
                  try {
                    setExporting(true)
                    // Build CSV rows from current orders (memoizedOrders contains derived fields)
                    const rows = memoizedOrders.map((o) => ({
                      orderId: o._id,
                      purchaseSerial: o.purchaseSerial || "",
                      productName: o.productName || o.product?.title || "",
                      customerName: o.userName || o.createdBy?.name || "",
                      type: o.orderType || (o.__t === "ECBookPurchase" ? t("table.book") : t("table.productType")),
                      price: o.price || "",
                      couponCode: o.couponCode || "",
                      transferredFrom: o.numberTransferredFrom || "",
                      status: o.confirmed ? t("table.confirmed") : t("table.pending"),
                      adminNotes: o.adminNotes || "",
                      date: o.createdAt || "",
                    }))

                    // Convert to CSV
                    const header = Object.keys(rows[0] || {}).map((h) => `"${h}"`).join(",")
                    const csv = [header]
                      .concat(
                        rows.map((r) =>
                          Object.values(r)
                            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                            .join(","),
                        ),
                      )
                      .join("\n")

                    // Create blob and download
                    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `orders_export_${new Date().toISOString().slice(0, 10)}.csv`
                    document.body.appendChild(a)
                    a.click()
                    a.remove()
                    URL.revokeObjectURL(url)
                    alert(t("alerts.exportSuccess") || "Export complete")
                  } catch (err) {
                    console.error("Error exporting orders:", err)
                    alert((t("alerts.exportFailed") || "Export failed") + (err?.message ? `: ${err.message}` : ""))
                  } finally {
                    setExporting(false)
                  }
                }}
                className="btn btn-secondary ml-2"
                disabled={exporting || loading || memoizedOrders.length === 0}
              >
                {exporting ? <span className="loading loading-spinner loading-sm"></span> : "📥"}
                {t("exportCSV")}
              </button>

              {/* Export XLSX button */}
              <button
                onClick={async () => {
                  try {
                    setExporting(true)
                    const rows = memoizedOrders.map((o) => ({
                      orderId: o._id,
                      purchaseSerial: o.purchaseSerial || "",
                      productName: o.productName || o.product?.title || "",
                      customerName: o.userName || o.createdBy?.name || "",
                      type: o.orderType || (o.__t === "ECBookPurchase" ? t("table.book") : t("table.productType")),
                      price: o.price || "",
                      couponCode: o.couponCode || "",
                      transferredFrom: o.numberTransferredFrom || "",
                      status: o.confirmed ? t("table.confirmed") : t("table.pending"),
                      adminNotes: o.adminNotes || "",
                      date: o.createdAt || "",
                    }))

                    const worksheet = XLSX.utils.json_to_sheet(rows)
                    const workbook = XLSX.utils.book_new()
                    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders")

                    const fileName = `orders_export_${new Date().toISOString().slice(0, 10)}.xlsx`
                    XLSX.writeFile(workbook, fileName)
                    alert(t("alerts.exportSuccess") || "Export complete")
                  } catch (err) {
                    console.error("Error exporting orders xlsx:", err)
                    alert((t("alerts.exportFailed") || "Export failed") + (err?.message ? `: ${err.message}` : ""))
                  } finally {
                    setExporting(false)
                  }
                }}
                className="btn btn-accent ml-2"
                disabled={exporting || loading || memoizedOrders.length === 0}
              >
                {exporting ? <span className="loading loading-spinner loading-sm"></span> : "📥"}
                {t("exportXLSX")}
              </button>

            {hasActiveFilters && (
              <button className="btn btn-ghost" onClick={clearFilters}>
                <X className="w-4 h-4" />
                {t("clearFilters")}
              </button>
            )}
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
              {selectedDate && (
                <div className="badge badge-info gap-2">
                  Date: {selectedDate}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleDateChange("")} />
                </div>
              )}
              {statusFilter !== "all" && (
                <div className="badge badge-primary gap-2">
                  {t(`filters.${statusFilter}`)}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setStatusFilter("all")} />
                </div>
              )}
              {typeFilter !== "all" && (
                <div className="badge badge-secondary gap-2">
                  {t(`filters.${typeFilter === "book" ? "books" : "products"}`)}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setTypeFilter("all")} />
                </div>
              )}
              {searchQuery.trim() && (
                <div className="badge badge-accent gap-2">
                  Search: "{searchQuery}"
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Date Filter Alert */}
      {selectedDate && (
        <div className="alert alert-info mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span>Showing orders for {selectedDate}</span>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="card shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th className="text-center">{t("table.product")}</th>
                <th className="text-center">{t("table.customer")}</th>
                <th className="text-center">{t("table.type")}</th>
                <th className="text-center">{t("table.price")}</th>
                <th className="text-center">{t("table.couponCode")}</th>
                <th className="text-center">{t("table.transferFrom")}</th>
                <th className="text-center">{t("table.status")}</th>
                <th className="text-center">{t("table.notes")}</th>
                <th className="text-center">{t("table.date")}</th>
                <th className="text-center">{t("table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-8">
                    <div className="loading loading-spinner loading-lg"></div>
                    <p className="mt-2 text-gray-500">{t("loading")}</p>
                  </td>
                </tr>
              ) : memoizedOrders.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-8">
                    <p className="text-gray-500">
                      {searchQuery || statusFilter !== "all" || typeFilter !== "all" || selectedDate
                        ? t("noOrdersFound")
                        : t("noOrdersAvailable")}
                    </p>
                  </td>
                </tr>
              ) : (
                memoizedOrders.map((order) => (
                  <tr key={order._id}>
                    <td className="text-center">
                      <div className="font-bold text-sm">{order.productName}</div>
                      <div className="text-xs opacity-50">{order.purchaseSerial}</div>
                    </td>
                    <td className="text-center">
                      <div>
                        <div className="font-medium">{order.userName}</div>
                        <div className="text-xs opacity-50">{order.createdBy?.email}</div>
                        <div className="text-xs opacity-50">{order.createdBy?.role}</div>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className={`badge ${order.orderType === "Book" ? "badge-primary" : "badge-secondary"}`}>
                        {t(order.orderType === "Book" ? "table.book" : "table.productType")}
                      </div>
                    </td>
                    <td className="text-center font-bold">{order.finalPrice}</td>
                    <td className="text-center font-bold">
                      {order.couponCode != null ? (
                        <span className="text-green-500">{order.couponCode.value}</span>
                      ) : (
                        "NA"
                      )}
                    </td>
                    <td className="text-center font-mono text-sm">{order.numberTransferredFrom}</td>
                    <td className="text-center">
                      {order.confirmed ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="badge badge-success">{t("table.confirmed")}</div>
                          {order.confirmedBy && (
                            <div className="text-xs opacity-50">
                              {t("table.by")} {order.confirmedBy.name}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="badge badge-warning">{t("table.pending")}</div>
                      )}
                    </td>
                    <td className="text-center max-w-32">
                      {order.adminNotes ? (
                        <div className="tooltip tooltip-left" data-tip={order.adminNotes}>
                          <div className="flex items-center gap-1 text-blue-600 cursor-help">
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-xs truncate">{order.notesPreview}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">{t("table.noNotes")}</span>
                      )}
                    </td>
                    <td className="text-center text-sm">
                      {order.formattedCreatedAt} - {formatTime(order.createdAt)}
                    </td>
                    <td className="text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleViewDetails(order)}
                          title={t("table.viewDetails")}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className={`btn btn-ghost btn-sm relative ${
                            order.adminNotes ? "text-blue-600" : "text-gray-400"
                          }`}
                          onClick={() => openNotesModal(order)}
                          title={order.adminNotes ? t("table.viewEditNotes") : t("table.addNotes")}
                        >
                          <Notebook className="w-4 h-4" />
                          {order.adminNotes && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </button>
                        {order.paymentScreenShot && (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleViewPaymentScreenshot(order.paymentScreenShot)}
                            title={t("table.viewPaymentScreenshot")}
                          >
                            <ImageIcon className="w-3 h-3" />
                          </button>
                        )}
                        {order.numberTransferredFrom && (
                          <button
                            className="btn btn-ghost btn-sm text-green-600 hover:bg-green-50"
                            onClick={() => handleWhatsAppContact(order)}
                            title={t("table.contactWhatsApp")}
                          >
                            <FaWhatsapp />
                          </button>
                        )}
                        {!order.confirmed && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleConfirmOrder(order)}
                            disabled={confirmLoading[order._id]}
                            title={t("table.confirmOrder")}
                          >
                            {confirmLoading[order._id] ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && (
          <div className="py-8 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-2">{t("table.noOrdersFound")}</h3>
            <p className="text-gray-500">{t("table.tryAdjustingSearch")}</p>
          </div>
        )}
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
              {t("table.previous")}
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
              {t("table.next")}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="text-sm text-gray-600">
            {t("table.page")} {currentPage} {t("table.of")} {totalPages} ({totalPurchases} {t("table.totalOrders")})
          </div>
        </div>
      )}

      {/* Enhanced Admin Notes Modal */}
      {notesModal.isOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-primary" />
                {t("table.adminNotes")}
              </h3>
              <button
                className="btn btn-sm btn-circle btn-ghost"
                onClick={closeNotesModal}
                disabled={notesModal.loading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">{t("table.notesLabel")}</span>
                  <span className="label-text-alt">
                    {notesModal.notes.length}/500 {t("table.characters")}
                  </span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full h-32 resize-none"
                  placeholder={t("table.notesPlaceholder")}
                  value={notesModal.notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  maxLength={500}
                  disabled={notesModal.loading}
                />
              </div>
              {notesModal.hasChanges && (
                <div className="alert alert-info">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-current shrink-0 w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span>{t("table.unsavedChanges")}</span>
                </div>
              )}
            </div>
            <div className="modal-action">
              <button className="btn" onClick={closeNotesModal} disabled={notesModal.loading}>
                {t("table.cancel")}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveNotes}
                disabled={notesModal.loading || !notesModal.hasChanges}
              >
                {notesModal.loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    {t("table.saving")}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t("table.saveNotes")}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">{t("table.orderDetails")}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text font-medium">{t("table.orderID")}</span>
                  </label>
                  <p className="font-mono text-sm">{selectedOrder._id}</p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text font-medium">{t("table.purchaseSerial")}</span>
                  </label>
                  <p className="font-mono text-sm">{selectedOrder.purchaseSerial}</p>
                </div>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-medium">{t("table.customerInfo")}</span>
                </label>
                <div className="bg-base-200 p-3 rounded">
                  <p>
                    <strong>{t("table.name")}:</strong> {selectedOrder.userName}
                  </p>
                  <p>
                    <strong>{t("table.email")}:</strong> {selectedOrder.createdBy?.email}
                  </p>
                  <p>
                    <strong>{t("table.role")}:</strong> {selectedOrder.createdBy?.role}
                  </p>
                </div>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-medium">{t("table.productInfo")}</span>
                </label>
                <div className="bg-base-200 p-3 rounded">
                  <p>
                    <strong>{t("table.name")}:</strong> {selectedOrder.productName}
                  </p>
                  <p>
                    <strong>{t("table.type")}:</strong>{" "}
                    {t(getOrderType(selectedOrder) === "Book" ? "table.book" : "table.productType")}
                  </p>
                  <p>
                    <strong>{t("table.price")}:</strong> {formatPrice(selectedOrder.price)}
                  </p>
                  <p>
                    <strong>{t("table.couponCode")}:</strong> {formatPrice(selectedOrder.couponCode?.value || "NA")}
                  </p>
                  {selectedOrder.notes && (
                    <p>
                      <strong>{t("table.customerNotes")}:</strong> {selectedOrder.notes}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-medium">{t("table.paymentInfo")}</span>
                </label>
                <div className="bg-base-200 p-3 rounded">
                  <p>
                    <strong>{t("table.paymentNumber")}:</strong> {selectedOrder.paymentNumber}
                  </p>
                  <p>
                    <strong>{t("table.transferredFrom")}:</strong> {selectedOrder.numberTransferredFrom}
                  </p>
                  {selectedOrder.paymentScreenShot && (
                    <div className="mt-2">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleViewPaymentScreenshot(selectedOrder.paymentScreenShot)}
                      >
                        {t("table.viewPaymentScreenshot")}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {selectedOrder.__t === "ECBookPurchase" && (
                <div>
                  <label className="label">
                    <span className="label-text font-medium">{t("table.bookInfo")}</span>
                  </label>
                  <div className="bg-base-200 p-3 rounded">
                    <p>
                      <strong>{t("table.nameOnBook")}:</strong> {selectedOrder.nameOnBook}
                    </p>
                    <p>
                      <strong>{t("table.numberOnBook")}:</strong> {selectedOrder.numberOnBook}
                    </p>
                    <p>
                      <strong>{t("table.seriesName")}:</strong> {selectedOrder.seriesName}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    {t("table.adminNotes")}
                  </span>
                </label>
                <div className="bg-base-200 p-3 rounded min-h-16">
                  {selectedOrder.adminNotes ? (
                    <div>
                    <p className="whitespace-pre-wrap">{selectedOrder.adminNotes}</p>
                    <div className="flex flex-col">
                    <p>Created By : </p>
                    <p><strong>{selectedOrder.adminNoteBy.name}</strong></p>
                    </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">{t("table.noAdminNotes")}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-action">
              <button
                className="btn"
                onClick={() => {
                  setShowDetailsModal(false)
                  setSelectedOrder(null)
                }}
              >
                {t("table.close")}
              </button>
              {!selectedOrder.confirmed && (
                <button
                  className="btn btn-success"
                  onClick={() => {
                    handleConfirmOrder(selectedOrder)
                    setShowDetailsModal(false)
                    setSelectedOrder(null)
                  }}
                  disabled={confirmLoading[selectedOrder._id]}
                >
                  {confirmLoading[selectedOrder._id] ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    t("table.confirmOrder")
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders
