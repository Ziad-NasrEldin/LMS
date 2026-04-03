"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ImSpinner8 } from "react-icons/im"
import { FaEnvelope, FaPhone, FaGraduationCap, FaMapMarkerAlt, FaCalendarAlt } from "react-icons/fa"
import { getAllLecturers } from "../../../routes/fetch-users"
import { getUserDashboard } from "../../../routes/auth-services"
import { designTokens } from "../../../constants/designTokens"
import DSSelect from "../../../components/DSSelect"

const SignedLecturers = () => {
  const { t, i18n } = useTranslation("admin-signedLecturers")
  const isRTL = i18n.language === "ar"
  const dir = isRTL ? "rtl" : "ltr"
  const navigate = useNavigate()

  const TOKENS = designTokens.colors;
  const SHADOWS = designTokens.shadows;

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
          const role = result.data?.data?.userInfo?.role
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
        const lecturers = result.data || []
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
        ((lecturer.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (lecturer.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (lecturer.expertise || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (lecturer.phoneNumber || "").includes(searchTerm)),
      )
    }

    // Apply expertise filter
    if (filters.expertise) {
      filtered = filtered.filter((lecturer) => (lecturer.expertise || "").toLowerCase() === filters.expertise.toLowerCase())
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
    <div 
      className="mx-auto p-6 md:p-8" 
      dir={dir}
    >
      <div 
        className="rounded-[2rem] border"
        style={{ 
          background: TOKENS.neutralCloud, 
          boxShadow: SHADOWS.level1, 
          borderColor: "rgba(17,24,39,0.05)"
        }}
      >
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b pb-6" style={{ borderColor: "rgba(17,24,39,0.1)" }}>
            <div>
              <h1 className="text-3xl font-extrabold mb-2" style={{ color: TOKENS.deepTeal }}>{t("lecturers.title") || "Signed Lecturers"}</h1>
              <p className="font-medium" style={{ color: TOKENS.slateText }}>
                {t("lecturers.subtitle") || "Manage and view all registered lecturers"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="badge font-bold px-4 py-3 rounded-full" style={{ backgroundColor: "rgba(77,179,194,0.1)", color: TOKENS.deepTeal, border: "none" }}>
                {state.filteredLecturers?.length || 0} {t("lecturers.total") || "Total"}
              </div>
              <button 
                onClick={fetchLecturers} 
                className="btn btn-outline btn-sm rounded-full font-bold px-4" 
                style={{ borderColor: TOKENS.deepTeal, color: TOKENS.deepTeal }}
                disabled={state.isLoading}
              >
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
                  className="input w-full pr-10 rounded-xl"
                  style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.spaceDark }}
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
            <div className="flex flex-wrap gap-3 items-center">
              <DSSelect
                className="select select-sm rounded-xl h-12 px-4"
                style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: TOKENS.spaceDark }}
                value={filters.expertise}
                onChange={(e) => setFilters((prev) => ({ ...prev, expertise: e.target.value }))}
              >
                <option value="">{t("filters.allExpertise") || "All Expertise"}</option>
                {uniqueExpertise?.map((expertise) => (
                  <option key={expertise} value={expertise}>
                    {expertise}
                  </option>
                ))}
              </DSSelect>

              <button className="btn btn-sm rounded-xl h-12 px-6 font-bold" onClick={clearFilters} style={{ backgroundColor: TOKENS.coralAccent, color: "white", border: "none" }}>
                {t("filters.clear") || "Clear"}
              </button>
            </div>
          </div>

          {/* Loading State */}
          {state.isLoading ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center">
                <ImSpinner8 className="animate-spin text-4xl mb-4" style={{ color: TOKENS.deepTeal }} />
                <p className="font-medium" style={{ color: TOKENS.slateText }}>{t("loading") || "Loading lecturers..."}</p>
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
              <div className="overflow-x-auto hidden lg:block rounded-2xl" style={{ border: `1px solid rgba(17,24,39,0.05)` }}>
                <table className="table w-full">
                  <thead>
                    <tr style={{ backgroundColor: "rgba(17,24,39,0.02)", color: TOKENS.spaceDark, borderBottom: `2px solid rgba(17,24,39,0.05)` }}>
                      <th className="font-bold py-4 px-6 text-sm uppercase tracking-wider" data-tip={t("lecturers.nameTooltip") || "Lecturer's full name"}>
                        {t("lecturers.name") || "Name"}
                      </th>
                      <th className="font-bold py-4 px-6 text-sm uppercase tracking-wider" data-tip={t("lecturers.expertiseTooltip") || "Subject expertise"}>
                        {t("lecturers.expertise") || "Expertise"}
                      </th>
                      <th className="font-bold py-4 px-6 text-sm uppercase tracking-wider" data-tip={t("lecturers.contactTooltip") || "Contact information"}>
                        {t("lecturers.contact") || "Contact"}
                      </th>
                      <th className="font-bold py-4 px-6 text-sm uppercase tracking-wider" data-tip={t("lecturers.joinedTooltip") || "Registration date"}>
                        {t("lecturers.joined") || "Joined"}
                      </th>
                      <th className="font-bold py-4 px-6 text-sm uppercase tracking-wider">{t("actions.actions") || "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLecturers?.map((lecturer, index) => (
                      <tr
                        key={lecturer._id}
                        className="hover:bg-gray-50 transition-colors duration-200"
                        style={{ borderBottom: index === paginatedLecturers.length - 1 ? 'none' : `1px solid rgba(17,24,39,0.05)` }}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <div className="avatar avatar-placeholder">
                              <div className="rounded-full w-10 h-10 flex items-center justify-center font-bold text-white shadow-sm" style={{ backgroundColor: TOKENS.deepTeal }}>
                                <span className="text-sm font-medium">
                                  {(lecturer.name || "L").charAt(0)?.toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="font-bold" style={{ color: TOKENS.spaceDark }}>{lecturer.name || "N/A"}</div>
                              <div className="text-xs font-medium" style={{ color: TOKENS.slateText }}>{lecturer.sequencedId || ""}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="badge font-semibold px-3 py-3 rounded-xl" style={{ backgroundColor: "rgba(77,179,194,0.1)", color: TOKENS.deepTeal, border: "none" }}>{lecturer.expertise || "N/A"}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-medium">
                            <div className="flex items-center gap-2 mb-2" style={{ color: TOKENS.slateText }}>
                              <FaEnvelope className="w-4 h-4 opacity-70" />
                              <span className="truncate max-w-[150px]">{lecturer.email || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2" style={{ color: TOKENS.slateText }}>
                              <FaPhone className="w-4 h-4 opacity-70" />
                              <span>{lecturer.phoneNumber || "N/A"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-medium flex items-center gap-2" style={{ color: TOKENS.slateText }}>
                            <FaCalendarAlt className="w-4 h-4 opacity-70" />
                            {lecturer.createdAt ? new Date(lecturer.createdAt).toLocaleDateString() : "N/A"}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex gap-2">
                            <button
                              onClick={() => copyToClipboard(lecturer.email)}
                              className="btn btn-ghost btn-sm rounded-xl"
                              style={{ color: TOKENS.deepTeal }}
                              title={t("actions.copyEmail") || "Copy Email"}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
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
                              className="btn btn-ghost btn-sm rounded-xl"
                              style={{ color: TOKENS.deepTeal }}
                              title={t("actions.copyPhone") || "Copy Phone"}
                            >
                              <FaPhone className="w-4 h-4" />
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
                {paginatedLecturers?.map((lecturer) => (
                  <div key={lecturer._id} className="rounded-2xl shadow-sm border" style={{ backgroundColor: TOKENS.neutralCloud, borderColor: "rgba(17,24,39,0.05)" }}>
                    <div className="p-5">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="avatar avatar-placeholder">
                          <div className="rounded-full w-12 h-12 flex items-center justify-center font-bold text-white shadow-sm" style={{ backgroundColor: TOKENS.deepTeal }}>
                            <span className="text-lg font-medium">
                              {(lecturer.name || "L").charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg" style={{ color: TOKENS.spaceDark }}>{lecturer.name || "N/A"}</h3>
                          <div className="badge font-semibold px-3 py-1 mt-1 rounded-xl mb-2" style={{ backgroundColor: "rgba(77,179,194,0.1)", color: TOKENS.deepTeal, border: "none" }}>{lecturer.expertise || "N/A"}</div>
                          {lecturer.sequencedId && <div className="text-xs font-medium" style={{ color: TOKENS.slateText }}>ID: {lecturer.sequencedId}</div>}
                        </div>
                      </div>

                      <div className="border-t my-4" style={{ borderColor: 'rgba(17,24,39,0.05)' }}></div>

                      <div className="space-y-3 text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <FaEnvelope className="w-4 h-4" style={{ color: TOKENS.deepTeal }} />
                          <span className="truncate" style={{ color: TOKENS.slateText }}>{lecturer.email || "N/A"}</span>
                          <button
                            onClick={() => copyToClipboard(lecturer.email)}
                            className="btn btn-ghost btn-xs ml-auto rounded-xl"
                            style={{ color: TOKENS.deepTeal }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
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

                        <div className="flex items-center gap-3">
                          <FaPhone className="w-4 h-4" style={{ color: TOKENS.deepTeal }} />
                          <span style={{ color: TOKENS.slateText }}>{lecturer.phoneNumber || "N/A"}</span>
                          <button
                            onClick={() => copyToClipboard(lecturer.phoneNumber)}
                            className="btn btn-ghost btn-xs ml-auto rounded-xl"
                            style={{ color: TOKENS.deepTeal }}
                          >
                            <FaPhone className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <FaMapMarkerAlt className="w-4 h-4" style={{ color: TOKENS.deepTeal }} />
                          <span style={{ color: TOKENS.slateText }}>
                            {lecturer.government || "N/A"}
                            {lecturer.administrationZone && `, ${lecturer.administrationZone}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <FaCalendarAlt className="w-4 h-4" style={{ color: TOKENS.deepTeal }} />
                          <span style={{ color: TOKENS.slateText }}>{lecturer.createdAt ? new Date(lecturer.createdAt).toLocaleDateString() : "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty State */}
              {paginatedLecturers.length === 0 && !state.isLoading && (
                <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: "rgba(17,24,39,0.02)" }}>
                  <div className="flex flex-col items-center justify-center">
                    <div className="p-5 rounded-full mb-4 shadow-sm" style={{ backgroundColor: TOKENS.neutralCloud }}>
                      <FaGraduationCap className="w-10 h-10" style={{ color: TOKENS.slateText }} />
                    </div>
                    <p className="text-xl font-bold mb-2" style={{ color: TOKENS.spaceDark }}>{t("lecturers.noLecturers") || "No lecturers found"}</p>
                    <p className="font-medium max-w-md" style={{ color: TOKENS.slateText }}>
                      {searchTerm || Object.values(filters).some((f) => f)
                        ? t("lecturers.noLecturersFiltered") ||
                        "No lecturers match your current filters. Try adjusting your search or filters."
                        : t("lecturers.noLecturersYet") || "No lecturers have signed up yet. Check back later."}
                    </p>
                    {(searchTerm || Object.values(filters).some((f) => f)) && (
                      <button className="btn btn-outline mt-6 rounded-xl font-bold px-6 border-2" onClick={clearFilters} style={{ borderColor: TOKENS.deepTeal, color: TOKENS.deepTeal }}>
                        {t("filters.clearAll") || "Clear All Filters"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Pagination */}
              {state.totalPages > 1 && (
                <div className="flex justify-between items-center mt-8 flex-wrap gap-4 pt-6 border-t" style={{ borderColor: "rgba(17,24,39,0.1)" }}>
                  <div className="text-sm font-medium" style={{ color: TOKENS.slateText }}>
                    {t("pagination.showing") || "Showing"} <span className="font-bold">{paginatedLecturers.length}</span> {t("pagination.of") || "of"}{" "}
                    <span className="font-bold">{state.filteredLecturers.length}</span> {t("lecturers.title") || "lecturers"}
                  </div>

                  <div className="join shadow-sm rounded-xl overflow-hidden">
                    <button
                      className="join-item btn bg-white hover:bg-gray-50 border-gray-200"
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

                    <button className="join-item btn bg-white border-gray-200 pointer-events-none" style={{ color: TOKENS.spaceDark }}>
                      {state.currentPage} / {state.totalPages}
                    </button>

                    <button
                      className="join-item btn bg-white hover:bg-gray-50 border-gray-200"
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
