"use client"

import { useState, useEffect } from "react"
import { FiX, FiFileText, FiChevronDown, FiEdit, FiRotateCw, FiSearch } from "react-icons/fi"
import { FaCheckCircle, FaHourglassHalf, FaExclamationTriangle, FaDownload, FaFileExport } from "react-icons/fa"
import { getAuditLogs } from "../../../routes/auditlog"
import { useTranslation } from "react-i18next"
import { getAuditLogsByEmail } from "../../../routes/auditlog"
import { designTokens } from "../../../constants/designTokens"

const AuditLog = () => {
  const { t, i18n } = useTranslation("admin")
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  
  const TOKENS = designTokens.colors;
  const SHADOWS = designTokens.shadows;
  // NOTE: keys now match server-side param names
  const [filters, setFilters] = useState({
    user: "",
    role: "",
    action: "",
    resource_type: "",
    status: "",
    startDate: "",
    endDate: "",
  })
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [allLogs, setAllLogs] = useState([]) // Store all logs for export
  const isRTL = i18n.language === "ar"
  const dir = isRTL ? "rtl" : "ltr"

  // Fetch audit logs on component mount and when filters change
  // Cleaned single useEffect for fetching logs
  useEffect(() => {
    if (filters.email) return
    const fetchAuditLogs = async () => {
      setLoading(true)
      try {
        // Transform filters so "role" becomes "user.role"
        const transformedFilters = { ...filters }
        if (transformedFilters.role) {
          transformedFilters["user.role"] = transformedFilters.role
          delete transformedFilters.role
        }

        const params = {
          page,
          limit,
          ...Object.fromEntries(Object.entries(transformedFilters).filter(([, v]) => v !== "" && v !== undefined)),
        }

        const response = await getAuditLogs(params.page, params.limit, params)

        if (response.status === "success") {
          setLogs(response.data?.logs || [])
          setError(null)
        } else {
          setError(response.error)
          setLogs([])
        }
      } catch (e) {
        setError("Error fetching logs")
      } finally {
        setLoading(false)
      }
    }

    fetchAuditLogs()
  }, [page, limit, filters])

  const handleSearchByEmail = async () => {
    if (!filters.email || filters.email.trim() === "") return

    setLoading(true)
    try {
      const response = await getAuditLogsByEmail(filters.email.trim())

      if (response.status === "success") {
        setLogs(response.data?.logs || [])
        setPage(1)
        setError(null)
      } else {
        setLogs([])
        setError(response.error)
      }
    } catch (e) {
      setLogs([])
      setError("Error searching by email")
    } finally {
      setLoading(false)
    }
  }



  // Fetch all logs for export (without pagination)
  const fetchAllLogs = async () => {
    try {
      const params = { ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "")) }
      const response = await getAuditLogs(1, 10000, params) // Large limit to get all logs
      if (response.status === "success") {
        return response.data?.logs || []
      }
      return []
    } catch (e) {
      console.error("Error fetching all logs:", e)
      return []
    }
  }

  const translate = (category, key) => t(`admin.auditlog.${category}.${key}`)
  const translateStatus = (status) => translate("status", (status || "").toLowerCase())
  const translateAction = (action) => translate("actions", (action || "").toLowerCase())
  const translateResource = (resource) => translate("resources", (resource || "").toLowerCase())
  const translateRole = (role) => translate("roles", (role || "").toLowerCase())

  useEffect(() => {
    const fetch = async () => {
      const params = { page, limit, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) }
      const res = await getAuditLogs(page, limit, params)
      if (res.status === "success") setLogs(res.data?.logs || [])
    }
    fetch()
  }, [page, filters, limit])

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }
  const applyFilters = () => setPage(1)

  // Export functionality
  const convertToCSV = (data) => {
    const headers = [
      t("admin.auditlog.export.user"),
      t("admin.auditlog.export.role"),
      t("admin.auditlog.export.action"),
      t("admin.auditlog.export.resource"),
      t("admin.auditlog.export.resourceDetails"),
      t("admin.auditlog.export.status"),
      t("admin.auditlog.export.timestamp"),
      t("admin.auditlog.export.ipAddress"),
      t("admin.auditlog.export.userAgent"),
      t("admin.auditlog.export.description"),
    ]

    const csvContent = [
      headers.join(","),
      ...data.map((log) => {
        const resourceDetails =
          log.resource?.details?.name || log.resource?.name || (log.resource?.id ? `ID: ${log.resource.id}` : "")

        return [
          `"${log.user?.name || t("admin.auditlog.status.unknown") || "Unknown"}"`,
          `"${log.user?.role ? translateRole(log.user.role) : ""}"`,
          `"${translateAction(log.action)}"`,
          `"${log.resource?.type ? t(`admin.auditlog.resources.${log.resource.type}`) : ""}"`,
          `"${resourceDetails}"`,
          `"${translateStatus(log.status)}"`,
          `"${new Date(log.timestamp).toLocaleString(i18n.language)}"`,
          `"${log.ipAddress || ""}"`,
          `"${log.userAgent || ""}"`,
          `"${log.description || ""}"`,
        ].join(",")
      }),
    ].join("\n")

    return csvContent
  }

  const exportToCSV = async (exportAll = false) => {
    setIsExporting(true)

    try {
      const dataToExport = exportAll ? await fetchAllLogs() : logs

      if (dataToExport.length === 0) {
        alert(t("admin.auditlog.export.noData"))
        return
      }

      const csvContent = convertToCSV(dataToExport)

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)

        const timestamp = new Date().toISOString().split("T")[0]
        const filename = exportAll ? `audit-logs-all-${timestamp}.csv` : `audit-logs-filtered-${timestamp}.csv`

        link.setAttribute("download", filename)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Show success message
        const successMessage = exportAll
          ? t("admin.auditlog.export.successAll", { count: dataToExport.length })
          : t("admin.auditlog.export.successFiltered", { count: dataToExport.length })

        alert(successMessage)
      }
    } catch (error) {
      console.error("Export error:", error)
      alert(t("admin.auditlog.export.error"))
    } finally {
      setIsExporting(false)
    }
  }

  const exportToJSON = async (exportAll = false) => {
    setIsExporting(true)

    try {
      const dataToExport = exportAll ? await fetchAllLogs() : logs

      if (dataToExport.length === 0) {
        alert(t("admin.auditlog.export.noData"))
        return
      }

      // Clean and format data for JSON export
      const jsonData = dataToExport.map((log) => {
        const resourceDetails =
          log.resource?.details?.name || log.resource?.name || (log.resource?.id ? `ID: ${log.resource.id}` : "")

        return {
          id: log._id,
          user: {
            name: log.user?.name || "Unknown",
            role: log.user?.role || "",
            userId: log.user?.userId || "",
          },
          action: log.action,
          actionTranslated: translateAction(log.action),
          resource: {
            type: log.resource?.type || "",
            typeTranslated: log.resource?.type ? t(`admin.auditlog.resources.${log.resource.type}`) : "",
            details: resourceDetails,
            id: log.resource?.id || "",
          },
          status: log.status,
          statusTranslated: translateStatus(log.status),
          timestamp: log.timestamp,
          timestampFormatted: new Date(log.timestamp).toLocaleString(i18n.language),
          ipAddress: log.ipAddress || "",
          userAgent: log.userAgent || "",
          description: log.description || "",
          metadata: log.metadata || {},
        }
      })

      const jsonContent = JSON.stringify(jsonData, null, 2)

      // Create blob and download
      const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" })
      const link = document.createElement("a")

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)

        const timestamp = new Date().toISOString().split("T")[0]
        const filename = exportAll ? `audit-logs-all-${timestamp}.json` : `audit-logs-filtered-${timestamp}.json`

        link.setAttribute("download", filename)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Show success message
        const successMessage = exportAll
          ? t("admin.auditlog.export.successAll", { count: dataToExport.length })
          : t("admin.auditlog.export.successFiltered", { count: dataToExport.length })

        alert(successMessage)
      }
    } catch (error) {
      console.error("Export error:", error)
      alert(t("admin.auditlog.export.error"))
    } finally {
      setIsExporting(false)
    }
  }

  // Prepare label text based on current selection
  const userNameMap = logs?.reduce((m, log) => {
    if (log.user?.userId) m[log.user.userId] = log.user.name
    return m
  }, {}) || {}
  const selectedUserLabel = filters.userId ? userNameMap[filters.userId] || "مستخدم غير معروف" : "المستخدم"
  const selectedRoleLabel = filters.role
    ? filters.role === "Admin"
      ? "مسؤول"
      : filters.role === "Lecturer"
        ? "معلم"
        : "طالب"
    : "الصلاحية"
  const selectedActionLabel = filters.action
    ? filters.action === "read"
      ? "قراءة"
      : filters.action === "update"
        ? "تعديل"
        : filters.action === "delete"
          ? "حذف"
          : "إنشاء"
    : "العملية"
  const selectedResourceLabel = filters.resourceType
    ? filters.resourceType === "container"
      ? "كورس"
      : filters.resourceType === "lecture"
        ? "درس"
        : filters.resourceType === "user"
          ? "مستخدم"
          : "جدول زمني"
    : "العنصر المتأثر"
  const selectedStatusLabel = filters.status ? (filters.status === "success" ? "نجاح" : "فشل") : "الحالة"

  // Format date for display
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString(i18n.language)

  const formatTime = (dateString) =>
    new Date(dateString).toLocaleTimeString(i18n.language, {
      hour: "2-digit",
      minute: "2-digit",
    })

  // Get icon for action type
  const getActionIcon = (action) => {
    switch (action) {
      case "delete":
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: "rgba(224,36,36,0.1)", color: "#E02424" }}>
            <FiX className="h-4 w-4" />
          </div>
        )
      case "update":
      case "edit":
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>
            <FiEdit className="h-4 w-4" />
          </div>
        )
      case "read":
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: "rgba(107,114,128,0.1)", color: TOKENS.slateText }}>
            <FiFileText className="h-4 w-4" />
          </div>
        )
      default:
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: "rgba(77,179,194,0.1)", color: TOKENS.deepTeal }}>
            <FiRotateCw className="h-4 w-4" />
          </div>
        )
    }
  }

  // Get icon for status
  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <FaCheckCircle className="h-5 w-5 text-success" />
      case "pending":
        return <FaHourglassHalf className="h-5 w-5 text-amber-700" />
      case "failed":
        return <FaExclamationTriangle className="h-5 w-5 text-warning" />
      default:
        return <FaCheckCircle className="h-5 w-5 text-success" />
    }
  }

  return (
    <div className="mx-auto w-full p-4 md:p-8" dir={dir}>
     <div 
        className="rounded-[2rem] border"
        style={{ 
          background: TOKENS.neutralCloud, 
          boxShadow: SHADOWS.level1, 
          borderColor: "rgba(17,24,39,0.05)"
        }}
      >
        <div className="p-6 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b pb-6" style={{ borderColor: "rgba(17,24,39,0.1)" }}>
        <div>
          <h1 className="text-3xl font-extrabold" style={{ color: TOKENS.deepTeal }}>{t("admin.auditlog.title")}</h1>
          <p className="mt-2 font-medium" style={{ color: TOKENS.slateText }}>{t("admin.auditlog.subtitle")}</p>
        </div>

        {/* Export Dropdown */}
        <div className="dropdown md:dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-outline rounded-full font-bold px-6" style={{ borderColor: TOKENS.deepTeal, color: TOKENS.deepTeal }} disabled={isExporting}>
            {isExporting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                {t("admin.auditlog.export.exporting")}
              </>
            ) : (
              <>
                <FaDownload className="mr-2" />
                {t("admin.auditlog.export.export")}
              </>
            )}
          </div>
          <ul tabIndex={0} className="dropdown-content z-[2] menu p-2 mt-2 shadow-lg rounded-2xl w-80" style={{ backgroundColor: TOKENS.neutralCloud, border: "1px solid rgba(17,24,39,0.05)" }}>
            <li className="menu-title py-2 px-3">
              <span className="font-bold text-xs uppercase" style={{ color: TOKENS.slateText }}>{t("admin.auditlog.export.csvFormat")}</span>
            </li>
            <li>
              <button className="py-3 px-4 font-medium hover:bg-gray-50 rounded-xl" onClick={() => exportToCSV(false)} disabled={isExporting || logs.length === 0} style={{ color: TOKENS.spaceDark }}>
                <FaFileExport className="mr-3 text-lg" style={{ color: TOKENS.deepTeal }} />
                {t("admin.auditlog.export.exportFiltered")} ({logs.length})
              </button>
            </li>
            <li>
              <button className="py-3 px-4 font-medium hover:bg-gray-50 rounded-xl" onClick={() => exportToCSV(true)} disabled={isExporting} style={{ color: TOKENS.spaceDark }}>
                <FaFileExport className="mr-3 text-lg" style={{ color: TOKENS.deepTeal }} />
                {t("admin.auditlog.export.exportAll")}
              </button>
            </li>
            <div className="divider my-1 opacity-10"></div>
            <li className="menu-title py-2 px-3">
              <span className="font-bold text-xs uppercase" style={{ color: TOKENS.slateText }}>{t("admin.auditlog.export.jsonFormat")}</span>
            </li>
            <li>
              <button className="py-3 px-4 font-medium hover:bg-gray-50 rounded-xl" onClick={() => exportToJSON(false)} disabled={isExporting || logs.length === 0} style={{ color: TOKENS.spaceDark }}>
                <FaFileExport className="mr-3 text-lg" style={{ color: TOKENS.deepTeal }} />
                {t("admin.auditlog.export.exportFiltered")} ({logs.length})
              </button>
            </li>
            <li>
              <button className="py-3 px-4 font-medium hover:bg-gray-50 rounded-xl" onClick={() => exportToJSON(true)} disabled={isExporting} style={{ color: TOKENS.spaceDark }}>
                <FaFileExport className="mr-3 text-lg" style={{ color: TOKENS.deepTeal }} />
                {t("admin.auditlog.export.exportAll")}
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Export Summary */}
      {(Object.values(filters).some((v) => v !== "") || logs.length > 0) && (
        <div className="alert mb-6 rounded-xl border-none shadow-sm" style={{ backgroundColor: "rgba(77,179,194,0.1)", color: TOKENS.deepTeal }}>
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
          <span className="font-medium">
            {Object.values(filters).some((v) => v !== "")
              ? `${t("admin.auditlog.export.filterInfo")} ${logs.length} ${t("admin.auditlog.export.of")} ${t("admin.auditlog.export.totalLogs")}`
              : `${t("admin.auditlog.export.showing")} ${logs.length} ${t("admin.auditlog.export.logs")}`}
          </span>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-4 mb-8 justify-start">
        <div className="flex gap-3 w-full max-w-sm">
          <input
            type="text"
            placeholder={t("admin.auditlog.filters.email")}
            className="input w-full rounded-xl"
            style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.spaceDark }}
            value={filters.email || ""}
            onChange={(e) => setFilters((prev) => ({ ...prev, email: e.target.value }))}
          />
          <button className="btn rounded-xl font-bold px-6" onClick={() => handleSearchByEmail()} style={{ backgroundColor: TOKENS.coralAccent, color: "white", border: "none" }}>
            <FiSearch className="mr-2" />
            {t("admin.auditlog.filters.search")}
          </button>
        </div>


        {/* Action Filter */}
        <div className="dropdown">
          <label tabIndex={2} className="btn bg-white border-gray-200 hover:bg-gray-50 rounded-xl min-w-[200px] flex justify-between px-6 font-medium shadow-sm h-12" style={{ color: TOKENS.spaceDark }}>
            <FiChevronDown className="h-5 w-5 opacity-50" />
            <span>{filters.action ? translateAction(filters.action) : t("admin.auditlog.filters.action")}</span>
          </label>
          <ul tabIndex={2} className="dropdown-content z-[2] menu p-2 mt-2 shadow-lg rounded-2xl w-full border" style={{ backgroundColor: TOKENS.neutralCloud, borderColor: "rgba(17,24,39,0.05)" }}>
            <li>
              <button className="py-3 font-medium hover:bg-gray-50 rounded-xl" onClick={() => handleFilterChange("action", "")}>{t("admin.auditlog.filters.all")}</button>
            </li>
            {["create", "read", "update", "delete"].map((action) => (
              <li key={action}>
                <button className="py-3 font-medium hover:bg-gray-50 rounded-xl" onClick={() => handleFilterChange("action", action)}>{translateAction(action)}</button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="flex justify-center my-12">
          <div className="loading loading-spinner loading-lg" style={{ color: TOKENS.deepTeal }}></div>
        </div>
      )}

      {error && (
        <div className="alert alert-error mb-6 rounded-xl border-none">
          <FiX className="h-6 w-6" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Logs Table */}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "rgba(17,24,39,0.05)" }}>
          <table className="table w-full">
            <thead>
              <tr style={{ backgroundColor: "rgba(17,24,39,0.02)", color: TOKENS.spaceDark, borderBottom: `2px solid rgba(17,24,39,0.05)` }}>
                <th className="font-bold py-4 px-6 text-sm uppercase tracking-wider">{t("admin.auditlog.table.user")}</th>
                <th className="font-bold py-4 px-6 text-sm uppercase tracking-wider">{t("admin.auditlog.table.email")}</th>
                <th className="font-bold py-4 px-6 text-sm uppercase tracking-wider">{t("admin.auditlog.table.action")}</th>
                <th className="font-bold py-4 px-6 text-sm uppercase tracking-wider">{t("admin.auditlog.table.timestamp")}</th>
                <th className="font-bold py-4 px-6 text-sm uppercase tracking-wider hidden sm:table-cell">{t("admin.auditlog.table.role")}</th>
                <th className="font-bold py-4 px-6 text-sm uppercase tracking-wider hidden sm:table-cell">{t("admin.auditlog.table.resource")}</th>
                <th className="font-bold py-4 px-6 text-sm uppercase tracking-wider hidden sm:table-cell">{t("admin.auditlog.table.status")}</th>
              </tr>
            </thead>
            <tbody>
              {logs?.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="p-5 rounded-full mb-4 shadow-sm" style={{ backgroundColor: TOKENS.neutralCloud }}>
                        <FiFileText className="w-10 h-10" style={{ color: TOKENS.slateText }} />
                      </div>
                      <p className="text-xl font-bold mb-2" style={{ color: TOKENS.spaceDark }}>{t("admin.auditlog.noRecords")}</p>
                      <p className="font-medium max-w-md" style={{ color: TOKENS.slateText }}>
                        {Object.values(filters).some((v) => v !== "")
                          ? t("admin.auditlog.noRecordsFiltered") ||
                          "No audit logs match your current filters. Try adjusting your search criteria."
                          : t("admin.auditlog.noRecordsYet") ||
                          "No audit logs have been recorded yet. Activity will appear here once users start interacting with the system."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs?.map((log, index) => (
                  <tr key={log._id} className="hover:bg-gray-50 transition-colors duration-200" style={{ borderBottom: index === logs.length - 1 ? 'none' : `1px solid rgba(17,24,39,0.05)` }}>
                    <td className="py-4 px-6 text-sm font-bold" style={{ color: TOKENS.spaceDark }}>{log.user?.name || t("admin.auditlog.status.unknown")}</td>
                    <td className="py-4 px-6 text-sm font-medium" style={{ color: TOKENS.slateText }}>{log.user?.email || t("admin.auditlog.status.unknown")} </td>
                    <td className="py-4 px-6 text-sm font-medium">
                      <div className="flex items-center gap-3">
                        {getActionIcon(log.action)}
                        <span style={{ color: TOKENS.spaceDark }}>{translateAction(log.action)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex flex-col">
                        <span className="font-bold" style={{ color: TOKENS.spaceDark }}>{formatDate(log.timestamp)}</span>
                        <span className="text-xs font-medium" style={{ color: TOKENS.slateText }}>{formatTime(log.timestamp)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm hidden sm:table-cell">
                      <span className="badge font-semibold px-3 py-3 rounded-xl" style={{ backgroundColor: "rgba(17,24,39,0.05)", color: TOKENS.spaceDark, border: "none" }}>
                        {translateRole(log.user?.role || "")}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm hidden sm:table-cell font-medium" style={{ color: TOKENS.slateText }}>
                      {log.resource?.type ? (
                        <div className="flex items-center gap-2">
                          <span>
                            {t(`admin.auditlog.resources.${log.resource.type}`)}
                            {log.resource.details?.name && `: ${log.resource.details.name}`}
                            {!log.resource.details?.name && log.resource.name && `: ${log.resource.name}`}
                            {!log.resource.details?.name &&
                              !log.resource.name &&
                              log.resource.id &&
                              ` (${t("admin.auditlog.idDisplay", { id: log.resource.id })}`}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm hidden sm:table-cell font-medium">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span style={{ color: TOKENS.spaceDark }}>{translateStatus(log.status)}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && logs?.length > 0 && (
        <div className="flex justify-between items-center mt-8 pt-6 border-t" style={{ borderColor: "rgba(17,24,39,0.1)" }}>
          <div className="text-sm font-medium" style={{ color: TOKENS.slateText }}>
            Page <span className="font-bold">{page}</span>
          </div>
          <div className="join shadow-sm rounded-xl overflow-hidden">
            <button
              className="join-item btn bg-white hover:bg-gray-50 border-gray-200 text-sm font-medium"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              style={{ color: TOKENS.spaceDark }}
            >
              {t("admin.auditlog.pagination.previous")}
            </button>
            <button className="join-item btn bg-white border-gray-200 pointer-events-none font-bold" style={{ color: TOKENS.deepTeal }}>{page}</button>
            <button 
              className="join-item btn bg-white hover:bg-gray-50 border-gray-200 text-sm font-medium" 
              onClick={() => setPage((p) => p + 1)} 
              disabled={logs?.length < limit}
              style={{ color: TOKENS.spaceDark }}
            >
              {t("admin.auditlog.pagination.next")}
            </button>
          </div>
        </div>
      )}
      </div>
      </div>
    </div>
  )
}

export default AuditLog
