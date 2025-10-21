"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ImSpinner8 } from "react-icons/im"
import { FaEnvelope, FaPhone, FaGraduationCap, FaMapMarkerAlt, FaCalendarAlt } from "react-icons/fa"
import { getAllLecturers } from "../../../routes/fetch-users"
import { getUserDashboard } from "../../../routes/auth-services"

const SignedLecturers = () => {
  const { t, i18n } = useTranslation("admin-signedLecturers")
  const isRTL = i18n.language === "ar"
  const dir = isRTL ? "rtl" : "ltr"
  const navigate = useNavigate()

  const [state, setState] = useState({
    lecturers: [],
    filteredLecturers: [],
    currentPage: 1,
    itemsPerPage: 6,
    totalPages: 1,
    isLoading: true,
    error: null,
  })

  const [userRole, setUserRole] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    expertise: "",
  })

  // Check user role and fetch data
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const result = await getUserDashboard()
        if (result.success) {
          const role = result.data.data.userInfo.role
          setUserRole(role)

          if (role !== "Admin" && role !== "moderator") {
            navigate("/")
            return
          }

          // Fetch lecturers data
          await fetchLecturers()
        } else {
          navigate("/login")
        }
      } catch (error) {
        console.error("Error checking user role:", error)
        navigate("/login")
      }
    }

    checkUserRole()
  }, [navigate])

  const fetchLecturers = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const result = await getAllLecturers()

      if (result.success && Array.isArray(result.data)) {
        const lecturers = result.data
        const totalPages = Math.ceil(lecturers.length / state.itemsPerPage)

        setState((prev) => ({
          ...prev,
          lecturers,
          filteredLecturers: lecturers,
          totalPages,
          isLoading: false,
          error: null,
        }))
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          lecturers: [],
          filteredLecturers: [],
          error: result.error || t("errors.failedToFetchLecturers") || "Failed to fetch lecturers",
        }))
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || t("errors.unexpectedError") || "An unexpected error occurred",
      }))
    }
  }

  // Filter and search logic
  useEffect(() => {
    let filtered = [...state.lecturers]

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (lecturer) =>
          lecturer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lecturer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lecturer.expertise?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lecturer.phoneNumber?.includes(searchTerm),
      )
    }

    // Apply expertise filter
    if (filters.expertise) {
      filtered = filtered.filter((lecturer) => lecturer.expertise?.toLowerCase() === filters.expertise.toLowerCase())
    }

    const totalPages = Math.ceil(filtered.length / state.itemsPerPage)

    setState((prev) => ({
      ...prev,
      filteredLecturers: filtered,
      totalPages,
      currentPage: 1, // Reset to first page when filters change
    }))
  }, [searchTerm, filters, state.lecturers])

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= state.totalPages) {
      setState((prev) => ({ ...prev, currentPage: newPage }))
    }
  }

  const handlePreviousPage = () => {
    setState((prev) => ({
      ...prev,
      currentPage: Math.max(1, prev.currentPage - 1),
    }))
  }

  const handleNextPage = () => {
    setState((prev) => ({
      ...prev,
      currentPage: Math.min(prev.totalPages, prev.currentPage + 1),
    }))
  }

  const clearFilters = () => {
    setSearchTerm("")
    setFilters({
      expertise: "",
      government: "",
      status: "",
    })
  }

  // Get paginated data
  const paginatedLecturers = state.filteredLecturers.slice(
    (state.currentPage - 1) * state.itemsPerPage,
    state.currentPage * state.itemsPerPage,
  )

  // Get unique values for filter dropdowns
  const uniqueExpertise = [...new Set(state.lecturers.map((l) => l.expertise).filter(Boolean))]
  const uniqueGovernments = [...new Set(state.lecturers.map((l) => l.government).filter(Boolean))]

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log("Text copied to clipboard")
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err)
      })
  }

  if (state.isLoading && userRole === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <ImSpinner8 className="animate-spin text-4xl text-primary" />
      </div>
    )
  }

  return (
    <div className=" mx-auto p-4 sm:p-6 " dir={dir}>
      <div className="card bg-base-100 border border-primary shadow-2xl">
        <div className="card-body">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t("lecturers.title") || "Signed Lecturers"}</h1>
              <p className="text-base-content/70">
                {t("lecturers.subtitle") || "Manage and view all registered lecturers"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="badge badge-primary">
                {state.filteredLecturers.length} {t("lecturers.total") || "Total"}
              </div>
              <button onClick={fetchLecturers} className="btn btn-outline btn-sm" disabled={state.isLoading}>
                {state.isLoading ? (
                  <ImSpinner8 className="animate-spin" />
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    {t("actions.refresh") || "Refresh"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t("lecturers.searchPlaceholder") || "Search by name, email, expertise, or phone..."}
                  className="input input-bordered w-full pr-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-base-content/40"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap gap-3">
              <select
                className="select select-bordered select-sm"
                value={filters.expertise}
                onChange={(e) => setFilters((prev) => ({ ...prev, expertise: e.target.value }))}
              >
                <option value="">{t("filters.allExpertise") || "All Expertise"}</option>
                {uniqueExpertise.map((expertise) => (
                  <option key={expertise} value={expertise}>
                    {expertise}
                  </option>
                ))}
              </select>

              <button className="btn btn-outline btn-sm" onClick={clearFilters}>
                {t("filters.clear") || "Clear"}
              </button>
            </div>
          </div>

          {/* Loading State */}
          {state.isLoading ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center">
                <ImSpinner8 className="animate-spin text-4xl text-primary mb-4" />
                <p className="text-base-content/70">{t("loading") || "Loading lecturers..."}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Error State */}
              {state.error && (
                <div className="alert alert-error mb-6">
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
                  <span>{state.error}</span>
                  <button
                    className="btn btn-sm btn-ghost ml-auto"
                    onClick={() => setState((prev) => ({ ...prev, error: null }))}
                  >
                    {t("actions.dismiss") || "Dismiss"}
                  </button>
                </div>
              )}

              {/* Desktop Table View */}
              <div className="overflow-x-auto hidden lg:block">
                <table className="table w-full">
                  <thead>
                    <tr className="bg-base-200/50">
                      <th data-tip={t("lecturers.nameTooltip") || "Lecturer's full name"}>
                        {t("lecturers.name") || "Name"}
                      </th>
                      <th data-tip={t("lecturers.expertiseTooltip") || "Subject expertise"}>
                        {t("lecturers.expertise") || "Expertise"}
                      </th>
                      <th data-tip={t("lecturers.contactTooltip") || "Contact information"}>
                        {t("lecturers.contact") || "Contact"}
                      </th>
                      <th data-tip={t("lecturers.joinedTooltip") || "Registration date"}>
                        {t("lecturers.joined") || "Joined"}
                      </th>
                      <th>{t("actions.actions") || "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLecturers.map((lecturer, index) => (
                      <tr
                        key={lecturer._id}
                        className={`hover:bg-base-200 ${index % 2 === 0 ? "bg-base-100" : "bg-base-100/50"}`}
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar avatar-placeholder">
                              <div className="bg-primary/10 text-primary rounded-full w-10">
                                <span className="text-sm font-medium">
                                  {lecturer.name?.charAt(0)?.toUpperCase() || "L"}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">{lecturer.name || "N/A"}</div>
                              <div className="text-xs opacity-70">{lecturer.sequencedId || ""}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-primary badge-soft">{lecturer.expertise || "N/A"}</span>
                        </td>
                        <td>
                          <div className="text-sm">
                            <div className="flex items-center gap-1 mb-1">
                              <FaEnvelope className="w-3 h-3 opacity-60" />
                              <span className="truncate max-w-[150px]">{lecturer.email || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FaPhone className="w-3 h-3 opacity-60" />
                              <span>{lecturer.phoneNumber || "N/A"}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="text-sm">
                            {lecturer.createdAt ? new Date(lecturer.createdAt).toLocaleDateString() : "N/A"}
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-1">
                            <button
                              onClick={() => copyToClipboard(lecturer.email)}
                              className="btn btn-ghost btn-xs"
                              title={t("actions.copyEmail") || "Copy Email"}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => copyToClipboard(lecturer.phoneNumber)}
                              className="btn btn-ghost btn-xs"
                              title={t("actions.copyPhone") || "Copy Phone"}
                            >
                              <FaPhone className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="grid grid-cols-1 gap-4 lg:hidden">
                {paginatedLecturers.map((lecturer) => (
                  <div key={lecturer._id} className="card bg-base-200/30 shadow-sm">
                    <div className="card-body p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="avatar avatar-placeholder">
                          <div className="bg-primary/10 text-primary rounded-full w-12">
                            <span className="text-lg font-medium">
                              {lecturer.name?.charAt(0)?.toUpperCase() || "L"}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{lecturer.name || "N/A"}</h3>
                          <div className="badge badge-outline badge-sm mb-2">{lecturer.expertise || "N/A"}</div>
                          {lecturer.sequencedId && <div className="text-xs opacity-70">ID: {lecturer.sequencedId}</div>}
                        </div>
                      </div>

                      <div className="divider my-2"></div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <FaEnvelope className="w-4 h-4 text-primary" />
                          <span className="truncate">{lecturer.email || "N/A"}</span>
                          <button
                            onClick={() => copyToClipboard(lecturer.email)}
                            className="btn btn-ghost btn-xs ml-auto"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <FaPhone className="w-4 h-4 text-primary" />
                          <span>{lecturer.phoneNumber || "N/A"}</span>
                          <button
                            onClick={() => copyToClipboard(lecturer.phoneNumber)}
                            className="btn btn-ghost btn-xs ml-auto"
                          >
                            <FaPhone className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <FaMapMarkerAlt className="w-4 h-4 text-primary" />
                          <span>
                            {lecturer.government || "N/A"}
                            {lecturer.administrationZone && `, ${lecturer.administrationZone}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="w-4 h-4 text-primary" />
                          <span>{lecturer.createdAt ? new Date(lecturer.createdAt).toLocaleDateString() : "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty State */}
              {paginatedLecturers.length === 0 && !state.isLoading && (
                <div className="text-center py-12 bg-base-200/30 rounded-xl">
                  <div className="flex flex-col items-center justify-center text-base-content/60">
                    <div className="bg-base-200 p-4 rounded-full mb-4">
                      <FaGraduationCap className="w-8 h-8 text-base-content/60" />
                    </div>
                    <p className="text-lg font-medium mb-2">{t("lecturers.noLecturers") || "No lecturers found"}</p>
                    <p className="text-sm opacity-70 max-w-md">
                      {searchTerm || Object.values(filters).some((f) => f)
                        ? t("lecturers.noLecturersFiltered") ||
                          "No lecturers match your current filters. Try adjusting your search or filters."
                        : t("lecturers.noLecturersYet") || "No lecturers have signed up yet. Check back later."}
                    </p>
                    {(searchTerm || Object.values(filters).some((f) => f)) && (
                      <button className="btn btn-outline btn-sm mt-4" onClick={clearFilters}>
                        {t("filters.clearAll") || "Clear All Filters"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Pagination */}
              {state.totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 flex-wrap gap-4">
                  <div className="text-sm opacity-70">
                    {t("pagination.showing") || "Showing"} {paginatedLecturers.length} {t("pagination.of") || "of"}{" "}
                    {state.filteredLecturers.length} {t("lecturers.title") || "lecturers"}
                  </div>

                  <div className="join">
                    <button
                      className="join-item btn btn-sm"
                      onClick={handlePreviousPage}
                      disabled={state.currentPage === 1}
                    >
                      {isRTL ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      )}
                    </button>

                    <button className="join-item btn btn-sm btn-disabled">
                      {state.currentPage} / {state.totalPages}
                    </button>

                    <button
                      className="join-item btn btn-sm"
                      onClick={handleNextPage}
                      disabled={state.currentPage >= state.totalPages}
                    >
                      {isRTL ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SignedLecturers
