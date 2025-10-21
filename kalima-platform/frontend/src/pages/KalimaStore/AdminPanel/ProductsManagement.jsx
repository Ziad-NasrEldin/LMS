"use client"
import { useTranslation } from "react-i18next"
import { useState, useMemo, useCallback, memo } from "react"
import { FaPencilAlt, FaTrash } from "react-icons/fa"

const ProductsManagement = memo(({
  products = [],
  sections = [],
  subjects = [],
  onEditProduct,
  onDeleteProduct,
  actionLoading,
  isRTL,
}) => {
  const { t } = useTranslation("kalimaStore-admin")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const allItems = useMemo(() => {
    return products.map((item) => ({
      ...item,
      type: item.subject ? 'book' : 'product', // auto-detect based on presence of 'subject'
    }))
  }, [products])

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return allItems
    }

    const searchLower = searchTerm.toLowerCase().trim()
    const filtered = allItems.filter(item => {
      // Check if any of the searchable fields contain the search term
      const titleMatch = item.title?.toLowerCase().includes(searchLower)
      const serialMatch = item.serial?.toLowerCase().includes(searchLower)
      const descriptionMatch = item.description?.toLowerCase().includes(searchLower)

      return titleMatch || serialMatch || descriptionMatch
    })

    return filtered
  }, [allItems, searchTerm])

  // Paginate filtered items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredItems.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredItems, currentPage, itemsPerPage])

  // Calculate pagination info
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1

  // Helper functions
  const getSectionName = useCallback((sectionId) => {
    if (!sectionId) return t("products.unknownSection") || "Unknown Section"
    const section = sections.find(s => s?._id === sectionId || (typeof sectionId === "object" && s?._id === sectionId?._id))
    return section?.name || t("products.unknownSection") || "Unknown Section"
  }, [sections, t])

  const getSubjectName = useCallback((subjectId) => {
    if (!subjectId) return t("unknownSubject")
    const subject = subjects.find(s => s?._id === subjectId || (typeof subjectId === "object" && s?._id === subjectId?._id))
    return subject?.name || t("unknownSubject")
  }, [subjects, t])

  const formatPrice = useCallback((price, discountPercentage) => {
    if (!price || !discountPercentage || discountPercentage <= 0) {
      return price || 0
    }
  }, [])

  // Pagination handlers
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }, [totalPages])

  const changeItemsPerPage = useCallback((newLimit) => {
    setItemsPerPage(newLimit)
    setCurrentPage(1) // Reset to first page when changing items per page
  }, [])

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1) // Reset to first page when searching
  }, [])

  // Pagination Controls Component
  const PaginationControls = useMemo(() => (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          {t("pagination.showing") || "Showing"} {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredItems.length)} {t("pagination.of") || "of"} {filteredItems.length}
        </span>
        <select
          className="select select-bordered select-sm"
          value={itemsPerPage}
          onChange={(e) => changeItemsPerPage(Number(e.target.value))}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={15}>15</option>
        </select>
        <span className="text-sm text-gray-600">{t("pagination.perPage") || "per page"}</span>
      </div>

      <div className="join">
        <button
          className="join-item btn btn-sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={!hasPrevPage}
        >
          {t("pagination.previous") || "Previous"}
        </button>
        <button className="join-item btn btn-sm btn-active">{currentPage}</button>
        <button
          className="join-item btn btn-sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={!hasNextPage}
        >
          {t("pagination.next") || "Next"}
        </button>
      </div>
    </div>
  ), [currentPage, itemsPerPage, filteredItems.length, totalPages, hasPrevPage, hasNextPage, t, changeItemsPerPage, goToPage])

  return (
    <div className="mb-12">
      <div className="flex items-center justify-center relative mb-8">
        {/* Decorative elements */}
        <div className={`absolute ${isRTL ? "right-10" : "left-10"}`}>
          <img src="/waves.png" alt={t("decorativeZigzag")} className="w-20 h-full animate-float-zigzag" />
        </div>
        <h2 className="text-3xl font-bold text-center">{t("productsManagement.title") || "Products Management"}</h2>
        <div className={`absolute ${isRTL ? "left-0" : "right-0"}`}>
          <img src="/ring.png" alt={t("decorativeCircle")} className="w-20 h-full animate-float-up-dottedball" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex justify-center mb-8">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder={t("productsManagement.searchPlaceholder") || "Search products..."}
            value={searchTerm}
            onChange={handleSearchChange}
            className={`input input-bordered w-full ${isRTL ? "pr-4 pl-12" : "pl-4 pr-12"}`}
          />
          <button className={`absolute ${isRTL ? "left-2" : "right-2"} top-1/2 transform -translate-y-1/2 btn btn-ghost btn-sm`}>
            🔍
          </button>
        </div>

      </div>

      {/* Products Table */}
      <div className="card shadow-lg overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th className="text-center">{t("productsManagement.table.title") || "Title"}</th>
                <th className="text-center">{t("productsManagement.table.serial") || "Serial"}</th>
                <th className="text-center">{t("productsManagement.table.section") || "Section"}</th>
                <th className="text-center">{t("subject")}</th>
                <th className="text-center">{t("productsManagement.table.price") || "Price"}</th>
                <th className="text-center">{t("productsManagement.table.discount") || "Discount"}</th>
                <th className="text-center">{t("productsManagement.table.finalPrice") || "Final Price"}</th>
                <th className="text-center">{t("productsManagement.table.actions") || "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((product) => {
                if (!product?._id) return null

                return (
                  <tr key={product._id}>
                    <td className="text-center font-medium">{product.title || t("nA")}</td>
                    <td className="text-center font-mono text-sm">{product.serial || t("nA")}</td>
                    <td className="text-center">{getSectionName(product.section)}</td>
                    <td className="text-center">
                      {product.type === "book" ? getSubjectName(product.subject) : t("dash")}
                    </td>
                    <td className="text-center font-bold">{product.price || 0}</td>
                    <td className="text-center">
                      {product.discountPercentage > 0 ? `${product.discountPercentage}%` : t("zeroPercent")}
                    </td>
                    <td className="text-center font-bold text-primary">{product.priceAfterDiscount ? product.priceAfterDiscount : product.price}</td>
                    <td className="text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => onEditProduct?.(product)}
                          disabled={actionLoading}
                          title={t("productsManagement.table.edit") || "Edit"}
                        >
                          <FaPencilAlt />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => onDeleteProduct?.(product)}
                          disabled={actionLoading}
                          title={t("productsManagement.table.delete") || "Delete"}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {filteredItems.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-gray-500">
              {searchTerm
                ? t("productsManagement.noProducts") || "No products found"
                : t("productsManagement.noProductsAvailable") || "No products available"}
            </p>
            {searchTerm && (
              <p className="text-sm text-gray-400 mt-2">
                {t("productsManagement.tryDifferentSearch") || "Try a different search term"}
              </p>
            )}
          </div>
        )}

        {/* Pagination Controls */}
        {filteredItems.length > 0 && (
          <div className="p-4 border-t">
            {PaginationControls}
          </div>
        )}

        {/* Decorative dots */}
        {/* <div className={`absolute bottom-4 ${isRTL ? "left-4" : "right-4"}`}>
          <img src="/rDots.png" alt={t("decorativeDots")} className="w-16 h-full animate-float-down-dottedball" />
        </div> */}
      </div>
    </div>
  )
})

ProductsManagement.displayName = 'ProductsManagement'

export default ProductsManagement

