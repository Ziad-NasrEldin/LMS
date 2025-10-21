"use client"

import { useState, useEffect } from "react"
import { FiX, FiFileText, FiChevronDown, FiEdit, FiRotateCw, FiSearch } from "react-icons/fi"
import { FaCheckCircle, FaHourglassHalf, FaExclamationTriangle, FaDownload, FaFileExport } from "react-icons/fa"
import { getAuditLogs } from "../../../routes/auditlog"
import { useTranslation } from "react-i18next"
import { getAuditLogsByEmail } from "../../../routes/auditlog"

const AuditLog = () => {
  const { t, i18n } = useTranslation("admin")
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
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
          setLogs(response.data.logs || [])
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
        setLogs(response.data.logs || [])
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
        return response.data.logs || []
      }
      return []
    } catch (e) {
      console.error("Error fetching all logs:", e)
      return []
    }
  }

  const translate = (category, key) => t(`admin.auditlog.${category}.${key}`)
  const translateStatus = (status) => translate("status", status.toLowerCase())
  const translateAction = (action) => translate("actions", action.toLowerCase())
  const translateResource = (resource) => translate("resources", resource.toLowerCase())
  const translateRole = (role) => translate("roles", role.toLowerCase())

  useEffect(() => {
    const fetch = async () => {
      const params = { page, limit, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) }
      const res = await getAuditLogs(page, limit, params)
      if (res.status === "success") setLogs(res.data.logs)
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
  const userNameMap = logs.reduce((m, log) => {
    if (log.user?.userId) m[log.user.userId] = log.user.name
    return m
  }, {})
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
          <div className="badge badge-error badge-sm p-3">
            <FiX className="h-4 w-4 text-white" />
          </div>
        )
      case "update":
      case "edit":
        return (
          <div className="badge badge-warning badge-sm p-3">
            <FiEdit className="h-4 w-4 text-white" />
          </div>
        )
      case "read":
        return (
          <div className="badge badge-neutral badge-sm p-3">
            <FiFileText className="h-4 w-4 text-white" />
          </div>
        )
      default:
        return (
          <div className="badge badge-info badge-sm p-3">
            <FiRotateCw className="h-4 w-4 text-white" />
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
    <div className="mx-auto w-full max-w-full p-4 md:p-8 lg:p-20 bg-base-100 min-h-screen bg-gradient-to-br" dir={dir}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("admin.auditlog.title")}</h1>
          <p className="text-gray-600 mt-2">{t("admin.auditlog.subtitle")}</p>
        </div>

        {/* Export Dropdown */}
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-outline btn-primary" disabled={isExporting}>
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
          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-80">
            <li className="menu-title">
              <span>{t("admin.auditlog.export.csvFormat")}</span>
            </li>
            <li>
              <button onClick={() => exportToCSV(false)} disabled={isExporting || logs.length === 0}>
                <FaFileExport className="mr-2" />
                {t("admin.auditlog.export.exportFiltered")} ({logs.length})
              </button>
            </li>
            <li>
              <button onClick={() => exportToCSV(true)} disabled={isExporting}>
                <FaFileExport className="mr-2" />
                {t("admin.auditlog.export.exportAll")}
              </button>
            </li>
            <div className="divider my-1"></div>
            <li className="menu-title">
              <span>{t("admin.auditlog.export.jsonFormat")}</span>
            </li>
            <li>
              <button onClick={() => exportToJSON(false)} disabled={isExporting || logs.length === 0}>
                <FaFileExport className="mr-2" />
                {t("admin.auditlog.export.exportFiltered")} ({logs.length})
              </button>
            </li>
            <li>
              <button onClick={() => exportToJSON(true)} disabled={isExporting}>
                <FaFileExport className="mr-2" />
                {t("admin.auditlog.export.exportAll")}
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Export Summary */}
      {(Object.values(filters).some((v) => v !== "") || logs.length > 0) && (
        <div className="alert alert-info mb-6">
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
          <span>
            {Object.values(filters).some((v) => v !== "")
              ? `${t("admin.auditlog.export.filterInfo")} ${logs.length} ${t("admin.auditlog.export.of")} ${t("admin.auditlog.export.totalLogs")}`
              : `${t("admin.auditlog.export.showing")} ${logs.length} ${t("admin.auditlog.export.logs")}`}
          </span>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-3 mb-6 justify-start bg-base-100">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder={t("admin.auditlog.filters.email")}
            className="input input-bordered w-full max-w-xs"
            value={filters.email || ""}
            onChange={(e) => setFilters((prev) => ({ ...prev, email: e.target.value }))}
          />
          <button className="btn btn-primary" onClick={() => handleSearchByEmail()}>
            <FiSearch className="mr-2" />
            {t("admin.auditlog.filters.search")}
          </button>
        </div>


        {/* Role Filter */}
        {/* <div className="dropdown dropdown-end bg-base-100">
          <label tabIndex={1} className="btn btn-outline rounded-full min-w-[180px] flex justify-between">
            <FiChevronDown className="h-5 w-5" />
            <span>{filters.role || t("admin.auditlog.filters.role")}</span>
          </label>
          <ul tabIndex={1} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
            <li>
              <button onClick={() => handleFilterChange("role", "")}>{t("admin.auditlog.filters.all")}</button>
            </li>
            {["admin", "lecturer", "student", "Teacher", "moderator", "subAdmin"].map((role) => (
              <li key={role}>
                <button onClick={() => handleFilterChange("role", role)}>{translateRole(role)}</button>
              </li>
            ))}
          </ul>
        </div> */}

        {/* Action Filter */}
        <div className="dropdown dropdown-end bg-base-100">
          <label tabIndex={2} className="btn btn-outline rounded-full min-w-[180px] flex justify-between">
            <FiChevronDown className="h-5 w-5" />
            <span>{filters.action || t("admin.auditlog.filters.action")}</span>
          </label>
          <ul tabIndex={2} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
            <li>
              <button onClick={() => handleFilterChange("action", "")}>{t("admin.auditlog.filters.all")}</button>
            </li>
            {["create", "read", "update", "delete"].map((action) => (
              <li key={action}>
                <button onClick={() => handleFilterChange("action", action)}>{translateAction(action)}</button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Date Filters */}
      {/* <div className="flex items-center gap-2 mb-6">
        <input
          type="date"
          className="input input-bordered"
          onChange={(e) => handleFilterChange("startDate", e.target.value)}
          placeholder={t("admin.auditlog.filters.date")}
        />
        <span>{t("admin.auditlog.filters.to")}</span>
        <input
          type="date"
          className="input input-bordered"
          onChange={(e) => handleFilterChange("endDate", e.target.value)}
        />
      </div> */}

      {/* Loading & Error States */}
      {loading && (
        <div className="flex justify-center my-8">
          <div className="loading loading-spinner loading-lg text-info"></div>
        </div>
      )}

      {error && (
        <div className="alert alert-error mb-6">
          <FiX className="h-6 w-6" />
          <span>{error}</span>
        </div>
      )}

      {/* Logs Table */}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                {["user", "email", "action", "datetime"].map((header) => (
                  <th key={header} className={`${isRTL ? "text-right" : "text-left"} text-sm`}>
                    {t(`admin.auditlog.columns.${header}`)}
                  </th>
                ))}
                {["role", "resource", "status"].map((header) => (
                  <th key={header} className={`${isRTL ? "text-right" : "text-left"} text-sm hidden sm:table-cell`}>
                    {t(`admin.auditlog.columns.${header}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-sm">
                    <div className="flex flex-col items-center justify-center text-base-content/60">
                      <div className="bg-base-200 p-4 rounded-full mb-4">
                        <FiFileText className="w-8 h-8 text-base-content/60" />
                      </div>
                      <p className="text-lg font-medium mb-2">{t("admin.auditlog.noRecords")}</p>
                      <p className="text-sm opacity-70 max-w-md">
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
                logs.map((log) => (
                  <tr key={log._id} className="hover">
                    <td className="text-sm py-2">{log.user?.name || t("admin.auditlog.status.unknown")}</td>
                    <td className="text-sm py-2">{log.user?.email || t("admin.auditlog.status.unknown")} </td>
                    <td className="text-sm py-2">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        {translateAction(log.action)}
                      </div>
                    </td>
                    <td className="text-sm py-2">
                      <div className="flex flex-col">
                        <span>{formatDate(log.timestamp)}</span>
                        <span className="text-xs opacity-70">{formatTime(log.timestamp)}</span>
                      </div>
                    </td>
                    <td className="text-sm py-2 hidden sm:table-cell">{translateRole(log.user?.role)}</td>
                    <td className="text-sm py-2 hidden sm:table-cell">
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
                    <td className="text-sm py-2 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        {translateStatus(log.status)}
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
      {!loading && !error && logs.length > 0 && (
        <div className="flex justify-center mt-8">
          <div className="btn-group">
            <button
              className="btn btn-outline"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
            >
              {t("admin.auditlog.pagination.previous")}
            </button>
            <button className="btn btn-outline">{page}</button>
            <button className="btn btn-outline" onClick={() => setPage((p) => p + 1)} disabled={logs.length < limit}>
              {t("admin.auditlog.pagination.next")}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditLog
