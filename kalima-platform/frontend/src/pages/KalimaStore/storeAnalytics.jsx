"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { getAllStats, getProductStats } from "../../routes/orders"
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  CheckCircle,
  Clock,
  BarChart3,
  Calendar,
  Filter,
  X,
  Package,
  Target,
  Award,
} from "lucide-react"

const StoreAnalytics = () => {
  const { t, i18n } = useTranslation("kalimaStore-analytics")
  const isRTL = i18n.language === "ar"

  // Loading states
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [productStatsLoading, setProductStatsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Data states
  const [overviewStats, setOverviewStats] = useState({
    totalPurchases: 0,
    confirmedPurchases: 0,
    pendingPurchases: 0,
    totalRevenue: 0,
    confirmedRevenue: 0,
    averagePrice: 0,
  })

  // Store original overview stats to restore when clearing filters
  const [originalOverviewStats, setOriginalOverviewStats] = useState({
    totalPurchases: 0,
    confirmedPurchases: 0,
    pendingPurchases: 0,
    totalRevenue: 0,
    confirmedRevenue: 0,
    averagePrice: 0,
  })

  const [monthlyStats, setMonthlyStats] = useState([])
  const [productStats, setProductStats] = useState([])
  const [filteredProductStats, setFilteredProductStats] = useState([])

  // Filter states
  const [selectedMonth, setSelectedMonth] = useState("all")
  const [revenueFilter, setRevenueFilter] = useState("all") // all, high, medium, low
  const [confirmationFilter, setConfirmationFilter] = useState("all") // all, confirmed, pending

  // Add new state for date selection
  const [selectedDate, setSelectedDate] = useState("")
  const [dailyStats, setDailyStats] = useState({
    totalPurchases: 0,
    confirmedPurchases: 0,
    pendingPurchases: 0,
    totalRevenue: 0,
    confirmedRevenue: 0,
    averagePrice: 0,
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [exporting, setExporting] = useState(false)
  // lazy import xlsx when needed to avoid bundling issues
  const exportAnalyticsXlsx = async () => {
    try {
      setExporting(true)
      const XLSX = await import("xlsx")

      const rowsOverview = [
        [t("csv.overview")],
        [t("stats.totalPurchases"), overviewStats.totalPurchases],
        [t("stats.confirmed"), overviewStats.confirmedPurchases],
        [t("stats.pending"), overviewStats.pendingPurchases],
        [t("stats.totalRevenue"), overviewStats.totalRevenue],
        [t("stats.confirmedRevenue"), overviewStats.confirmedRevenue],
        [t("stats.averagePrice"), Math.round(overviewStats.averagePrice)],
        [],
      ]

      const ws = XLSX.utils.aoa_to_sheet(rowsOverview)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Overview")

      // Monthly sheet
      const monthlyHeader = [
        [t("table.month"), t("table.totalPurchases"), t("table.confirmed"), t("table.revenue"), t("table.confirmedRevenue")],
      ]
      const monthlyRows = monthlyStats.map((stat) => {
        const date = new Date(stat._id.year, stat._id.month - 1, 1)
        const monthName = date.toLocaleDateString(i18n.language, { year: "numeric", month: "long" })
        return [monthName, stat.count, stat.confirmedCount, stat.revenue, stat.confirmedRevenue]
      })
      const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyHeader.concat(monthlyRows))
      XLSX.utils.book_append_sheet(wb, wsMonthly, "Monthly")

      // Products sheet
      const productHeader = [[t("table.rank"), t("table.productName"), t("table.totalPurchases"), t("table.totalValue"), t("table.avgValue")]]
      const productRows = filteredProductStats.map((p, idx) => {
        const totalValue = Number(p.totalValue) || 0
        const totalPurchases = Number(p.totalPurchases) || 0
        const avgValue = totalPurchases > 0 ? Math.round(totalValue / totalPurchases) : 0
        return [idx + 1, p.productName, totalPurchases, totalValue, avgValue]
      })
      const wsProducts = XLSX.utils.aoa_to_sheet(productHeader.concat(productRows))
      XLSX.utils.book_append_sheet(wb, wsProducts, "Products")

      const filename = `kalima-analytics-${new Date().toISOString().slice(0, 10)}.xlsx`
      XLSX.writeFile(wb, filename)
    } catch (err) {
      console.error("Failed to export analytics xlsx:", err)
    } finally {
      setExporting(false)
    }
  }

  // Generate month options from monthly stats
  const generateMonthOptions = useCallback(() => {
    const options = [{ value: "all", label: t("filters.allMonths") }]
    monthlyStats.forEach((stat) => {
      const date = new Date(stat._id.year, stat._id.month - 1, 1)
      const monthName = date.toLocaleDateString(i18n.language, {
        year: "numeric",
        month: "long",
      })
      options.push({
        value: `${stat._id.year}-${stat._id.month}`,
        label: monthName,
        data: stat,
      })
    })
    return options
  }, [monthlyStats, i18n.language, t])

  // Fetch overview and monthly stats
  const fetchOverviewStats = useCallback(async () => {
    try {
      setOverviewLoading(true)
      setError(null)
      const response = await getAllStats()
      if (response.success) {
        const { overview, monthlyStats } = response.data.data
        setOverviewStats(overview)
        setOriginalOverviewStats(overview) // Store original stats
        setMonthlyStats(monthlyStats || [])
      } else {
        throw new Error(response.error)
      }
    } catch (err) {
      setError(err.message)
      console.error("Error fetching overview stats:", err)
    } finally {
      setOverviewLoading(false)
    }
  }, [])

  // Update the fetchProductStats function to handle date parameter
  const fetchProductStats = useCallback(async (date = null) => {
    try {
      setProductStatsLoading(true)
      const response = await getProductStats(date)
      if (response.success) {
        if (date) {
          // Handle date-specific stats response
          const { overview, dailyStats } = response.data.data
          setOverviewStats(overview)
          setDailyStats(dailyStats)
          setProductStats([]) // Clear product stats when viewing daily stats
        } else {
          // Handle regular product stats response
          const productData = response.data.data || []
          setProductStats(productData)
        }
      } else {
        throw new Error(response.error)
      }
    } catch (err) {
      console.error("Error fetching product stats:", err)
    } finally {
      setProductStatsLoading(false)
    }
  }, [])

  // Filter product stats based on current filters
  const applyFilters = useCallback(() => {
    let filtered = [...productStats]
    console.log("Applying filters to product stats:", filtered) // Debug log

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((product) => product.productName.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    // Revenue filter
    if (revenueFilter !== "all") {
      const maxRevenue = Math.max(...productStats.map((p) => p.totalValue || 0))
      const threshold = maxRevenue / 3

      filtered = filtered.filter((product) => {
        const productValue = product.totalValue || 0
        switch (revenueFilter) {
          case "high":
            return productValue >= threshold * 2
          case "medium":
            return productValue >= threshold && productValue < threshold * 2
          case "low":
            return productValue < threshold
          default:
            return true
        }
      })
    }

    // Sort by total purchases (descending)
    filtered.sort((a, b) => (b.totalPurchases || 0) - (a.totalPurchases || 0))

    console.log("Filtered product stats:", filtered) // Debug log
    setFilteredProductStats(filtered)
  }, [productStats, searchQuery, revenueFilter])

  // Initial data fetch
  useEffect(() => {
    fetchOverviewStats()
    fetchProductStats()
  }, [fetchOverviewStats, fetchProductStats])

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  // Handle month filter change
  const handleMonthFilterChange = (monthValue) => {
    setSelectedMonth(monthValue)
    if (monthValue === "all") {
      // Restore original overview stats
      setOverviewStats(originalOverviewStats)
    } else {
      // Find specific month stats
      const monthData = monthlyStats.find((stat) => `${stat._id.year}-${stat._id.month}` === monthValue)
      if (monthData) {
        setOverviewStats({
          totalPurchases: monthData.count,
          confirmedPurchases: monthData.confirmedCount,
          pendingPurchases: monthData.count - monthData.confirmedCount,
          totalRevenue: monthData.revenue,
          confirmedRevenue: monthData.confirmedRevenue,
          averagePrice: monthData.count > 0 ? monthData.revenue / monthData.count : 0,
        })
      }
    }
  }

  // Add date change handler
  const handleDateChange = (date) => {
    setSelectedDate(date)
    if (date) {
      fetchProductStats(date)
    } else {
      fetchProductStats()
      // Restore original overview stats when clearing date
      if (selectedMonth === "all") {
        setOverviewStats(originalOverviewStats)
      }
    }
  }

  // Update the clearFilters function to properly reset everything
  const clearFilters = () => {
    setSelectedMonth("all")
    setRevenueFilter("all")
    setConfirmationFilter("all")
    setSearchQuery("")
    setSelectedDate("")

    // Restore original overview stats
    setOverviewStats(originalOverviewStats)

    // Refetch regular product stats
    fetchProductStats()
  }

  // Update hasActiveFilters to include selectedDate
  const hasActiveFilters =
    selectedMonth !== "all" ||
    revenueFilter !== "all" ||
    confirmationFilter !== "all" ||
    searchQuery.trim() !== "" ||
    selectedDate !== ""

  // Format currency
  const formatPrice = (price) => {
    const numPrice = Number(price) || 0
    return `${Math.round(numPrice)} ج`
  }

  // CSV escape helper
  const escapeCsv = (value) => {
    if (value === null || value === undefined) return ""
    const str = String(value)
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  // Export analytics to CSV
  const exportAnalytics = async () => {
    try {
      setExporting(true)
      // Build rows: overview, monthlyStats, productStats (filtered)
      const rows = []

      // Overview
      rows.push([t("csv.overview")])
      rows.push([t("stats.totalPurchases"), overviewStats.totalPurchases])
      rows.push([t("stats.confirmed"), overviewStats.confirmedPurchases])
      rows.push([t("stats.pending"), overviewStats.pendingPurchases])
      rows.push([t("stats.totalRevenue"), overviewStats.totalRevenue])
      rows.push([t("stats.confirmedRevenue"), overviewStats.confirmedRevenue])
      rows.push([t("stats.averagePrice"), Math.round(overviewStats.averagePrice)])
      rows.push([])

      // Daily (if selected)
      if (selectedDate) {
        rows.push([t("csv.dailyStats"), selectedDate])
        rows.push([t("stats.totalPurchases"), dailyStats.totalPurchases])
        rows.push([t("stats.totalRevenue"), dailyStats.totalRevenue])
        rows.push([t("stats.confirmedRevenue"), dailyStats.confirmedRevenue])
        rows.push([])
      }

      // Monthly
      rows.push([t("csv.monthlyStats")])
      rows.push([t("table.month"), t("table.totalPurchases"), t("table.confirmed"), t("table.revenue"), t("table.confirmedRevenue")])
      monthlyStats.forEach((stat) => {
        const date = new Date(stat._id.year, stat._id.month - 1, 1)
        const monthName = date.toLocaleDateString(i18n.language, { year: "numeric", month: "long" })
        rows.push([monthName, stat.count, stat.confirmedCount, stat.revenue, stat.confirmedRevenue])
      })
      rows.push([])

      // Products (filtered)
      rows.push([t("csv.productStats")])
      rows.push([t("table.rank"), t("table.productName"), t("table.totalPurchases"), t("table.totalValue"), t("table.avgValue")])
      filteredProductStats.forEach((p, idx) => {
        const totalValue = Number(p.totalValue) || 0
        const totalPurchases = Number(p.totalPurchases) || 0
        const avgValue = totalPurchases > 0 ? Math.round(totalValue / totalPurchases) : 0
        rows.push([idx + 1, p.productName, totalPurchases, totalValue, avgValue])
      })

      // Convert to CSV string
      const csvContent = rows.map((r) => r.map(escapeCsv).join(",")).join("\n")

      // Download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const filename = `kalima-analytics-${new Date().toISOString().slice(0, 10)}.csv`
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      // Optional success feedback
      setExporting(false)
    } catch (err) {
      console.error("Failed to export analytics:", err)
      setExporting(false)
    }
  }

  // Calculate performance metrics
  const getPerformanceMetrics = () => {
    if (productStats.length === 0) return { topProduct: null, totalProducts: 0, averagePerProduct: 0 }

    const topProduct = productStats.reduce((max, product) =>
      (product.totalPurchases || 0) > (max.totalPurchases || 0) ? product : max,
    )

    const totalProducts = productStats.length
    const averagePerProduct =
      productStats.reduce((sum, product) => sum + (product.totalPurchases || 0), 0) / totalProducts

    return { topProduct, totalProducts, averagePerProduct }
  }

  const performanceMetrics = getPerformanceMetrics()

  if (overviewLoading && productStatsLoading) {
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
            <h3 className="font-bold">{t("errorLoadingAnalytics")}</h3>
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
          <BarChart3 className="w-8 h-8 text-primary" />
          {t("title")}
        </h1>
        <div className={`absolute ${isRTL ? "left-0" : "right-0"}`}>
          <img src="/ring.png" alt="Decorative circle" className="w-20 h-full animate-float-up-dottedball" />
        </div>
      </div>

      {/* Filters Section */}
      <div className="card shadow-lg mb-6">
        <div className="card-body p-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">{t("filters.title")}</h3>
              {(overviewLoading || productStatsLoading) && <span className="loading loading-spinner loading-sm"></span>}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
              {/* Month Filter */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <select
                  className="select select-bordered select-sm"
                  value={selectedMonth}
                  onChange={(e) => handleMonthFilterChange(e.target.value)}
                >
                  {generateMonthOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <input
                  type="date"
                  className="input input-bordered input-sm"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </div>
              {/* Revenue Filter */}
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <select
                  className="select select-bordered select-sm"
                  value={revenueFilter}
                  onChange={(e) => setRevenueFilter(e.target.value)}
                >
                  <option value="all">{t("filters.allRevenue")}</option>
                  <option value="high">{t("filters.highRevenue")}</option>
                  <option value="medium">{t("filters.mediumRevenue")}</option>
                  <option value="low">{t("filters.lowRevenue")}</option>
                </select>
              </div>
              {/* Search */}
              <input
                type="text"
                placeholder={t("searchProducts")}
                className="input input-bordered input-sm flex-1 min-w-48"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {hasActiveFilters && (
                <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                  <X className="w-4 h-4" />
                  {t("clearFilters")}
                </button>
              )}
              <button
                className="btn btn-outline btn-sm"
                onClick={async () => {
                  await exportAnalytics()
                }}
                disabled={exporting}
              >
                {exporting ? t("exporting") : t("exportCSV")}
              </button>
              <button
                className="btn btn-outline btn-sm ml-2"
                onClick={async () => {
                  await exportAnalyticsXlsx()
                }}
                disabled={exporting}
              >
                {exporting ? t("exporting") : t("exportXLSX")}
              </button>
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
              {selectedMonth !== "all" && (
                <div className="badge badge-primary gap-2">
                  {generateMonthOptions().find((opt) => opt.value === selectedMonth)?.label}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleMonthFilterChange("all")} />
                </div>
              )}
              {revenueFilter !== "all" && (
                <div className="badge badge-secondary gap-2">
                  {t(`filters.${revenueFilter}Revenue`)}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setRevenueFilter("all")} />
                </div>
              )}
              {searchQuery.trim() && (
                <div className="badge badge-accent gap-2">
                  Search: "{searchQuery}"
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                </div>
              )}
              {selectedDate && (
                <div className="badge badge-info gap-2">
                  Date: {selectedDate}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleDateChange("")} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedDate && (
        <div className="alert alert-info mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span>Showing daily statistics for {selectedDate}</span>
          </div>
        </div>
      )}

      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {/* Total Purchases */}
        <div className="card bg-blue-600 text-white shadow-lg">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium opacity-90">{t("stats.totalPurchases")}</h3>
                <p className="text-2xl font-bold">{overviewLoading ? "..." : overviewStats.totalPurchases}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmed Purchases */}
        <div className="card bg-green-600 text-white shadow-lg">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium opacity-90">{t("stats.confirmed")}</h3>
                <p className="text-2xl font-bold">{overviewLoading ? "..." : overviewStats.confirmedPurchases}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Purchases */}
        <div className="card bg-orange-600 text-white shadow-lg">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium opacity-90">{t("stats.pending")}</h3>
                <p className="text-2xl font-bold">{overviewLoading ? "..." : overviewStats.pendingPurchases}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="card bg-emerald-600 text-white shadow-lg">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium opacity-90">{t("stats.totalRevenue")}</h3>
                <p className="text-2xl font-bold">
                  {overviewLoading ? "..." : formatPrice(overviewStats.totalRevenue)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmed Revenue */}
        <div className="card bg-teal-600 text-white shadow-lg">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium opacity-90">{t("stats.confirmedRevenue")}</h3>
                <p className="text-2xl font-bold">
                  {overviewLoading ? "..." : formatPrice(overviewStats.confirmedRevenue)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Average Price */}
        <div className="card bg-indigo-600 text-white shadow-lg">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">📊</div>
              <div>
                <h3 className="text-sm font-medium opacity-90">{t("stats.averagePrice")}</h3>
                <p className="text-2xl font-bold">
                  {overviewLoading ? "..." : formatPrice(Math.round(overviewStats.averagePrice))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Top Performing Product */}
        <div className="card bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium opacity-90">{t("insights.topProduct")}</h3>
                <p className="text-lg font-bold truncate">
                  {productStatsLoading ? "..." : performanceMetrics.topProduct?.productName || "N/A"}
                </p>
                <p className="text-xs opacity-75">
                  {productStatsLoading ? "" : `${performanceMetrics.topProduct?.totalPurchases || 0} purchases`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div className="card bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium opacity-90">{t("insights.totalProducts")}</h3>
                <p className="text-2xl font-bold">{productStatsLoading ? "..." : performanceMetrics.totalProducts}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Average per Product */}
        <div className="card bg-gradient-to-r from-pink-600 to-pink-700 text-white shadow-lg">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium opacity-90">{t("insights.avgPerProduct")}</h3>
                <p className="text-2xl font-bold">
                  {productStatsLoading ? "..." : Math.round(performanceMetrics.averagePerProduct)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedDate ? (
        <div className="card shadow-lg overflow-hidden">
          <div className="card-header p-4 border-b border-base-200">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {t("dailyStats")} - {selectedDate}
            </h2>
          </div>
          <div className="card-body p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="stat">
                <div className="stat-title">Daily Purchases</div>
                <div className="stat-value">{dailyStats.totalPurchases}</div>
                <div className="stat-desc">Total orders today</div>
              </div>
              <div className="stat">
                <div className="stat-title">Daily Revenue</div>
                <div className="stat-value">{formatPrice(dailyStats.totalRevenue)}</div>
                <div className="stat-desc">Revenue generated today</div>
              </div>
              <div className="stat">
                <div className="stat-title">Confirmed Revenue</div>
                <div className="stat-value text-success">{formatPrice(dailyStats.confirmedRevenue)}</div>
                <div className="stat-desc">Confirmed orders today</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Keep the existing Product Performance Table here
        <div className="card shadow-lg overflow-hidden">
          <div className="card-header p-4 border-b border-base-200">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              {t("productPerformance")}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th className="text-center">{t("table.rank")}</th>
                  <th className="text-center">{t("table.productName")}</th>
                  <th className="text-center">{t("table.totalPurchases")}</th>
                  <th className="text-center">{t("table.totalValue")}</th>
                  <th className="text-center">{t("table.avgValue")}</th>
                  <th className="text-center">{t("table.performance")}</th>
                </tr>
              </thead>
              <tbody>
                {productStatsLoading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8">
                      <div className="loading loading-spinner loading-lg"></div>
                    </td>
                  </tr>
                ) : filteredProductStats.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8">
                      <div className="text-6xl mb-4">📊</div>
                      <h3 className="text-xl font-semibold mb-2">{t("table.noData")}</h3>
                      <p className="text-gray-500">{t("table.tryAdjustingFilters")}</p>
                    </td>
                  </tr>
                ) : (
                  filteredProductStats.map((product, index) => {
                    const totalValue = Number(product.totalValue) || 0
                    const totalPurchases = Number(product.totalPurchases) || 0
                    const avgValue = totalPurchases > 0 ? totalValue / totalPurchases : 0
                    const maxPurchases = Math.max(...filteredProductStats.map((p) => Number(p.totalPurchases) || 0))
                    const performancePercentage = maxPurchases > 0 ? (totalPurchases / maxPurchases) * 100 : 0

                    return (
                      <tr key={product.productId} className="hover">
                        <td className="text-center">
                          <div className="flex items-center justify-center">
                            {index === 0 && <Award className="w-4 h-4 text-yellow-500 mr-1" />}
                            <span className="font-bold">{index + 1}</span>
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="font-medium">{product.productName}</div>
                          <div className="text-xs opacity-50 font-mono">{product.productId}</div>
                        </td>
                        <td className="text-center">
                          <div className="badge badge-primary">{totalPurchases}</div>
                        </td>
                        <td className="text-center font-bold">
                          <span className="text-success">{formatPrice(totalValue)}</span>
                        </td>
                        <td className="text-center">{formatPrice(Math.round(avgValue))}</td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-20 bg-base-200 rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${performancePercentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium">{Math.round(performancePercentage)}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monthly Trends Section */}
      {monthlyStats.length > 1 && (
        <div className="card shadow-lg mt-8">
          <div className="card-header p-4 border-b border-base-200">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              {t("monthlyTrends")}
            </h2>
          </div>
          <div className="card-body p-4">
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>{t("table.month")}</th>
                    <th className="text-center">{t("table.totalPurchases")}</th>
                    <th className="text-center">{t("table.confirmed")}</th>
                    <th className="text-center">{t("table.revenue")}</th>
                    <th className="text-center">{t("table.confirmedRevenue")}</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyStats.map((stat) => {
                    const date = new Date(stat._id.year, stat._id.month - 1, 1)
                    const monthName = date.toLocaleDateString(i18n.language, {
                      year: "numeric",
                      month: "long",
                    })
                    return (
                      <tr key={`${stat._id.year}-${stat._id.month}`} className="hover">
                        <td className="font-medium">{monthName}</td>
                        <td className="text-center">
                          <div className="badge badge-outline">{stat.count}</div>
                        </td>
                        <td className="text-center">
                          <div className="badge badge-success">{stat.confirmedCount}</div>
                        </td>
                        <td className="text-center font-bold">{formatPrice(stat.revenue)}</td>
                        <td className="text-center font-bold text-success">{formatPrice(stat.confirmedRevenue)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>{" "}
        </div>
      )}
    </div>
  )
}

export default StoreAnalytics
