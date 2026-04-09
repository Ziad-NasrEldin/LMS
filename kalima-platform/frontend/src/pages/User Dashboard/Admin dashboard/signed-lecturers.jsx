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
import Button from "../../../components/ui/Button"

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
        }))
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.message || t("errors.fetchFailed"),
        }))
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || t("errors.fetchFailed"),
      }))
    }
  }

  useEffect(() => {
    let filtered = [...state.lecturers]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (l) =>
          l.name?.toLowerCase().includes(term) ||
          l.email?.toLowerCase().includes(term) ||
          l.expertise?.toLowerCase().includes(term) ||
          l.sequencedId?.toLowerCase().includes(term)
      )
    }

    if (filters.expertise) {
      filtered = filtered.filter((l) => l.expertise === filters.expertise)
    }

    const totalPages = Math.ceil(filtered.length / state.itemsPerPage)

    setState((prev) => ({
      ...prev,
      filteredLecturers: filtered,
      currentPage: 1,
      totalPages,
    }))
  }, [searchTerm, filters.expertise, state.lecturers])

  const paginatedLecturers = state.filteredLecturers.slice(
    (state.currentPage - 1) * state.itemsPerPage,
    state.currentPage * state.itemsPerPage
  )

  const uniqueExpertise = [...new Set(state.lecturers.map((l) => l.expertise).filter(Boolean))]

  const handlePreviousPage = () => {
    if (state.currentPage > 1) {
      setState((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }))
    }
  }

  const handleNextPage = () => {
    if (state.currentPage < state.totalPages) {
      setState((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }))
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setFilters({ expertise: "" })
  }

  const copyToClipboard = async (text) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8" dir={dir}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: TOKENS.spaceDark }}>
            {t("lecturers.title") || "Signed Lecturers"}
          </h1>
          <p className="text-sm md:text-base" style={{ color: TOKENS.slateText }}>
            {t("lecturers.subtitle") || "View and manage all registered lecturers"}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder={t("search.placeholder") || "Search by name, email, or ID..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
            style={{ 
              backgroundColor: "rgba(17,24,39,0.03)", 
              borderColor: "rgba(17,24,39,0.1)", 
              color: TOKENS.spaceDark 
            }}
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap gap-3 items-center mb-6">
          <DSSelect
            className="select-sm rounded-xl h-12 px-4"
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

          <Button className="rounded-xl h-12 px-6 font-bold" onClick={clearFilters} style={{ backgroundColor: TOKENS.coralAccent, color: "white", border: "none" }}>
            {t("filters.clear") || "Clear"}
          </Button>
        </div>
  
        {state.isLoading ? (
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center">
              <ImSpinner8 className="animate-spin text-4xl mb-4" style={{ color: TOKENS.deepTeal }} />
              <p className="font-medium" style={{ color: TOKENS.slateText }}>{t("loading") || "Loading lecturers..."}</p>
            </div>
          </div>
        ) : (
          <>
            {state.error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm flex items-center gap-3 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{state.error}</span>
                <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setState((prev) => ({ ...prev, error: null }))}>
                  {t("actions.dismiss") || "Dismiss"}
                </Button>
              </div>
            )}

            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden lg:block rounded-2xl" style={{ border: `1px solid rgba(17,24,39,0.05)` }}>
              <table className="w-full text-left">
                <thead>
                  <tr style={{ backgroundColor: "rgba(17,24,39,0.02)", color: TOKENS.spaceDark, borderBottom: `2px solid rgba(17,24,39,0.05)` }}>
                    <th className="font-bold py-4 px-6 text-sm uppercase tracking-wider">{t("lecturers.name") || "Name"}</th>
                    <th className="font-bold py-4 px-6 text-sm uppercase tracking-wider">{t("lecturers.expertise") || "Expertise"}</th>
                    <th className="font-bold py-4 px-6 text-sm uppercase tracking-wider">{t("lecturers.contact") || "Contact"}</th>
                    <th className="font-bold py-4 px-6 text-sm uppercase tracking-wider">{t("lecturers.joined") || "Joined"}</th>
                    <th className="font-bold py-4 px-6 text-sm uppercase tracking-wider">{t("actions.actions") || "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLecturers?.map((lecturer, index) => (
                    <tr key={lecturer._id} className="hover:bg-slate-100 transition-colors duration-200" style={{ borderBottom: index === paginatedLecturers.length - 1 ? 'none' : `1px solid rgba(17,24,39,0.05)` }}>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="rounded-full w-10 h-10 flex items-center justify-center font-bold text-white shadow-sm" style={{ backgroundColor: TOKENS.deepTeal }}>
                            <span className="text-sm font-medium">{(lecturer.name || "L").charAt(0)?.toUpperCase()}</span>
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
                          <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => copyToClipboard(lecturer.email)} style={{ color: TOKENS.deepTeal }} title={t("actions.copyEmail") || "Copy Email"}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </Button>
                          <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => copyToClipboard(lecturer.phoneNumber)} style={{ color: TOKENS.deepTeal }} title={t("actions.copyPhone") || "Copy Phone"}>
                            <FaPhone className="w-4 h-4" />
                          </Button>
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
                      <div className="rounded-full w-12 h-12 flex items-center justify-center font-bold text-white shadow-sm" style={{ backgroundColor: TOKENS.deepTeal }}>
                        <span className="text-lg font-medium">{(lecturer.name || "L").charAt(0)?.toUpperCase()}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg" style={{ color: TOKENS.spaceDark }}>{lecturer.name || "N/A"}</h3>
                        <div className="px-2 py-1 text-xs font-medium border rounded-full mt-1 mb-2" style={{ backgroundColor: "rgba(77,179,194,0.1)", color: TOKENS.deepTeal, border: "none" }}>{lecturer.expertise || "N/A"}</div>
                        {lecturer.sequencedId && <div className="text-xs font-medium" style={{ color: TOKENS.slateText }}>ID: {lecturer.sequencedId}</div>}
                      </div>
                    </div>
                    <div className="border-t my-4" style={{ borderColor: 'rgba(17,24,39,0.05)' }}></div>
                    <div className="flex items-center gap-3 mb-3">
                      <FaEnvelope className="w-4 h-4" style={{ color: TOKENS.deepTeal }} />
                      <span className="truncate" style={{ color: TOKENS.slateText }}>{lecturer.email || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <FaPhone className="w-4 h-4" style={{ color: TOKENS.deepTeal }} />
                      <span style={{ color: TOKENS.slateText }}>{lecturer.phoneNumber || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <FaMapMarkerAlt className="w-4 h-4" style={{ color: TOKENS.deepTeal }} />
                      <span style={{ color: TOKENS.slateText }}>{lecturer.government || "N/A"}{lecturer.administrationZone && `, ${lecturer.administrationZone}`}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FaCalendarAlt className="w-4 h-4" style={{ color: TOKENS.deepTeal }} />
                      <span style={{ color: TOKENS.slateText }}>{lecturer.createdAt ? new Date(lecturer.createdAt).toLocaleDateString() : "N/A"}</span>
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
                      ? t("lecturers.noLecturersFiltered") || "No lecturers match your current filters. Try adjusting your search or filters."
                      : t("lecturers.noLecturersYet") || "No lecturers have signed up yet. Check back later."}
                  </p>
                  {(searchTerm || Object.values(filters).some((f) => f)) && (
                    <Button variant="outline" className="mt-6 rounded-xl font-bold px-6 border-2" onClick={clearFilters} style={{ borderColor: TOKENS.deepTeal, color: TOKENS.deepTeal }}>
                      {t("filters.clearAll") || "Clear All Filters"}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Pagination */}
            {state.totalPages > 1 && (
              <div className="flex justify-between items-center mt-8 flex-wrap gap-4 pt-6 border-t" style={{ borderColor: "rgba(17,24,39,0.1)" }}>
                <div className="text-sm font-medium" style={{ color: TOKENS.slateText }}>
                  {t("pagination.showing") || "Showing"} <span className="font-bold">{paginatedLecturers.length}</span> {t("pagination.of") || "of"} <span className="font-bold">{state.filteredLecturers.length}</span> {t("lecturers.title") || "lecturers"}
                </div>
                <div className="flex items-center gap-2 shadow-sm rounded-xl overflow-hidden">
                  <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50 border-gray-200" onClick={handlePreviousPage} disabled={state.currentPage === 1}>
                    {isRTL ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    )}
                  </Button>
                  <div className="bg-white border-gray-200 px-4 py-2 text-sm" style={{ color: TOKENS.spaceDark }}>
                    {state.currentPage} / {state.totalPages}
                  </div>
                  <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50 border-gray-200" onClick={handleNextPage} disabled={state.currentPage >= state.totalPages}>
                    {isRTL ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default SignedLecturers
