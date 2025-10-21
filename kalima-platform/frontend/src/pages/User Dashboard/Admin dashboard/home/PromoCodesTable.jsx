"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { ImSpinner8 } from "react-icons/im"
import { FaTrash } from "react-icons/fa"
import { getPromoCodes, deletePromoCode, deleteBulkPromoCodes } from "../../../../routes/codes"
import { getAllStudents } from "../../../../routes/fetch-users"

const PromoCodesTable = () => {
  const { t, i18n } = useTranslation("admin")
  const isRTL = i18n.language === "ar"
  const dir = isRTL ? "rtl" : "ltr"
  const [filters, setFilters] = useState({
    isRedeemed: "", // 'true' | 'false' | ''
    type: "general", //general | specific | false
  })
  const [state, setState] = useState({
    promoCodes: [],
    currentPage: 1,
    itemsPerPage: 10,
    totalPages: 1,
    isLoading: true,
    error: null,
  })
  const [students, setStudents] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [studentsError, setStudentsError] = useState(null)
  const [selectedCodes, setSelectedCodes] = useState([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [codeToDelete, setCodeToDelete] = useState(null)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

  // Fetch data (promo codes and students)
  useEffect(() => {
    const fetchData = async () => {
      setState((prev) => ({ ...prev, isLoading: true }))
      setStudentsLoading(true)

      const promoParams = {
        limit: 1000,
        ...(filters.isRedeemed !== "" && { isRedeemed: filters.isRedeemed }),
        ...(filters.type && { type: filters.type }),
      }

      const [promoResult, studentsResult] = await Promise.all([
        getPromoCodes({ params: promoParams }),
        getAllStudents(),
      ])

      if (promoResult.success && Array.isArray(promoResult.data)) {
        const totalPages = Math.ceil(promoResult.data.length / state.itemsPerPage)
        setState((prev) => ({
          ...prev,
          promoCodes: promoResult.data,
          totalPages,
          isLoading: false,
          error: null,
        }))
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          promoCodes: [],
          error: promoResult.error || t("errors.invalidResponse"),
        }))
      }

      if (studentsResult.success && Array.isArray(studentsResult.data)) {
        setStudents(studentsResult.data)
        setStudentsError(null)
      } else {
        setStudentsError(studentsResult.error || t("errors.failedToFetchStudents"))
      }

      setStudentsLoading(false)
    }

    fetchData()
  }, [t, filters])

  // Get student name by ID
  const getStudentName = (studentId) => {
    const student = students.find((s) => s._id === studentId)
    return student ? student.name : "--"
  }

  // Handle filter application
  const handleApplyFilters = () => {
    setState((prev) => ({ ...prev, currentPage: 1 }))
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

  // Handle single code deletion
  const handleDeleteCode = async () => {
    if (!codeToDelete) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const result = await deletePromoCode(codeToDelete)

      if (result.success) {
        // Remove the deleted code from the state
        setState((prev) => ({
          ...prev,
          promoCodes: prev.promoCodes.filter((code) => code.code !== codeToDelete),
        }))
        setShowDeleteConfirm(false)
        setCodeToDelete(null)
      } else {
        setDeleteError(result.error || t("errors.deleteFailed"))
      }
    } catch (error) {
      setDeleteError(error.message || t("errors.unexpectedError"))
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle bulk code deletion
  const handleBulkDelete = async () => {
    if (selectedCodes.length === 0) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const result = await deleteBulkPromoCodes(selectedCodes)

      if (result.success) {
        // Remove the deleted codes from the state
        setState((prev) => ({
          ...prev,
          promoCodes: prev.promoCodes.filter((code) => !selectedCodes.includes(code.code)),
        }))
        setSelectedCodes([])
        setShowBulkDeleteConfirm(false)
      } else {
        setDeleteError(result.error || t("errors.bulkDeleteFailed"))
      }
    } catch (error) {
      setDeleteError(error.message || t("errors.unexpectedError"))
    } finally {
      setIsDeleting(false)
    }
  }

  // Toggle code selection for bulk delete
  const toggleCodeSelection = (code) => {
    setSelectedCodes((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
  }

  // Select/deselect all unredeemed codes on current page
  const toggleSelectAll = () => {
    const unredeemedCodes = paginatedCodes.filter((code) => !code.isRedeemed).map((code) => code.code)

    if (unredeemedCodes.every((code) => selectedCodes.includes(code))) {
      // If all are selected, deselect all
      setSelectedCodes((prev) => prev.filter((code) => !unredeemedCodes.includes(code)))
    } else {
      // Otherwise, select all unredeemed codes
      setSelectedCodes((prev) => {
        const newSelection = [...prev]
        unredeemedCodes.forEach((code) => {
          if (!newSelection.includes(code)) {
            newSelection.push(code)
          }
        })
        return newSelection
      })
    }
  }

  // Paginated promo codes
  const paginatedCodes = state.promoCodes.slice(
    (state.currentPage - 1) * state.itemsPerPage,
    state.currentPage * state.itemsPerPage,
  )

  // Check if any unredeemed codes exist on the current page
  const hasUnredeemedCodes = paginatedCodes.some((code) => !code.isRedeemed)

  return (
    <div className="card bg-base-100 border border-primary shadow-2xl my-6" dir={dir}>
      <div className="card-body">
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title text-2xl">{t("promoCodes.title")}</h2>

          {hasUnredeemedCodes && (
            <div className="flex gap-2">
              <button
                className="btn btn-error btn-sm"
                onClick={() => setShowBulkDeleteConfirm(true)}
                disabled={selectedCodes.length === 0 || isDeleting}
              >
                {isDeleting ? (
                  <ImSpinner8 className="animate-spin" />
                ) : (
                  <>
                    <FaTrash className="mr-1" />
                    {t("admin.actions.delete")} ({selectedCodes.length})
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {state.isLoading || studentsLoading ? (
          <div className="flex justify-center py-8">
            <ImSpinner8 className="animate-spin text-4xl text-primary" />
          </div>
        ) : (
          <>
            {(state.error || studentsError || deleteError) && (
              <div className="alert alert-error mb-4">{state.error || studentsError || deleteError}</div>
            )}

            <div className="flex flex-wrap gap-4 mb-4">
              <select
                className="select select-bordered"
                value={filters.isRedeemed}
                onChange={(e) => setFilters((prev) => ({ ...prev, isRedeemed: e.target.value }))}
              >
                <option value="">{t("filters.allStatuses")}</option>
                <option value="false">{t("filters.active")}</option>
                <option value="true">{t("filters.redeemed")}</option>
              </select>


              <select
                className="select select-bordered"
                value={filters.type}
                onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
              >
                <option value="">{t("filters.all")}</option>
                <option value="specific">{t("filters.specific")}</option>
                <option value="general">{t("filters.general")}</option>
                <option value="promo">{t("filters.promo")}</option>
              </select>

              <button className="btn btn-primary" onClick={handleApplyFilters}>
                {t("filters.apply")}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    {hasUnredeemedCodes && (
                      <th>
                        <input
                          type="checkbox"
                          className="checkbox"
                          onChange={toggleSelectAll}
                          checked={paginatedCodes
                            .filter((code) => !code.isRedeemed)
                            .every((code) => selectedCodes.includes(code.code))}
                        />
                      </th>
                    )}
                    <th>{t("promoCodes.code")}</th>
                    <th>{t("promoCodes.points")}</th>
                    <th>{t("promoCodes.status")}</th>
                    <th>{t("promoCodes.redeemedAt")}</th>
                    <th>{t("promoCodes.redeemedBy")}</th>
                    {hasUnredeemedCodes ? (
                      <th>{t("promoCodes.actions")}</th>
                    ) : ""}
                  </tr>
                </thead>
                <tbody>
                  {paginatedCodes.map((code) => (
                    <tr key={code._id}>
                      {hasUnredeemedCodes && (
                        <td>
                          {!code.isRedeemed && (
                            <input
                              type="checkbox"
                              className="checkbox"
                              checked={selectedCodes.includes(code.code)}
                              onChange={() => toggleCodeSelection(code.code)}
                            />
                          )}
                        </td>
                      )}
                      <td className="font-mono">{code.code}</td>
                      <td>{code.pointsAmount?.toLocaleString() || "0"}</td>
                      <td>
                        <span className={`badge ${code.isRedeemed ? "badge-success" : "badge-warning"}`}>
                          {code.isRedeemed ? t("status.redeemed") : t("status.active")}
                        </span>
                      </td>
                      <td>{code.redeemedAt ? new Date(code.redeemedAt).toLocaleDateString() : "--"}</td>
                      <td className="truncate max-w-[100px]">{getStudentName(code.redeemedBy)}</td>
                      <td>
                        {!code.isRedeemed && (
                          <button
                            className="btn btn-error btn-sm"
                            onClick={() => {
                              setCodeToDelete(code.code)
                              setShowDeleteConfirm(true)
                            }}
                          >
                            <FaTrash />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {paginatedCodes.length === 0 && !state.isLoading && (
              <div className="text-center py-4">{t("promoCodes.noCodes")}</div>
            )}

            <div className="flex justify-between items-center mt-4 sm:w-1/2 mx-auto gap-2">
              <button className="btn btn-outline" onClick={handlePreviousPage} disabled={state.currentPage === 1}>
                {t("pagination.previous")}
              </button>
              <span>
                {t("pagination.page")} {state.currentPage} {t("pagination.of")} {state.totalPages}
              </span>
              <button
                className="btn btn-outline"
                onClick={handleNextPage}
                disabled={state.currentPage >= state.totalPages}
              >
                {t("pagination.next")}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Single Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-base-100 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="font-bold text-lg mb-4">{t("modals.confirmDelete")}</h3>
            <p>{t("modals.deleteCodeConfirm")}</p>
            <p className="font-mono bg-base-200 p-2 rounded my-2">{codeToDelete}</p>
            <div className="modal-action">
              <button
                className="btn btn-outline"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setCodeToDelete(null)
                }}
                disabled={isDeleting}
              >
                {t("admin.actions.cancel")}
              </button>
              <button className="btn btn-error" onClick={handleDeleteCode} disabled={isDeleting}>
                {isDeleting ? <ImSpinner8 className="animate-spin" /> : t("admin.actions.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-base-100 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="font-bold text-lg mb-4">{t("modals.confirmBulkDelete")}</h3>
            <p>{t("modals.bulkDeleteConfirm", { count: selectedCodes.length })}</p>

            <div className="my-4 max-h-40 overflow-y-auto bg-base-200 p-2 rounded">
              {selectedCodes.map((code) => (
                <div key={code} className="font-mono text-sm mb-1">
                  {code}
                </div>
              ))}
            </div>

            <div className="modal-action">
              <button className="btn btn-outline" onClick={() => setShowBulkDeleteConfirm(false)} disabled={isDeleting}>
                {t("actions.cancel")}
              </button>
              <button className="btn btn-error" onClick={handleBulkDelete} disabled={isDeleting}>
                {isDeleting ? <ImSpinner8 className="animate-spin" /> : t("actions.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PromoCodesTable
