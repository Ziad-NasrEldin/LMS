"use client"

import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { getAllSections, getAllProducts, getAllSubSections } from "../../routes/market"

const Market = () => {
  const { t, i18n } = useTranslation("kalimaStore-Market")
  const isRTL = i18n.language === "ar"
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState("all")
  const [activeSubSection, setActiveSubSection] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sections, setSections] = useState([])
  const [subSections, setSubSections] = useState([])
  const [allProducts, setAllProducts] = useState([]) // Store all products only
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(6)

  const convertPathToUrl = (filePath, folder = "product_thumbnails") => {
    if (!filePath) return null
    if (filePath.startsWith("http")) return filePath

    const normalizedPath = filePath.replace(/\\/g, "/")
    const API_URL = import.meta.env.VITE_API_URL || window.location.origin
    const baseUrl = API_URL.replace(/\/$/, "")
    const filename = normalizedPath.split("/").pop()

    return `${baseUrl}/uploads/${folder}/${filename}`
  }

  // Filter products based on active tab and subsection
  const filteredBySection = useMemo(() => {
    if (activeTab === "all") {
      return allProducts
    }
    
    let filtered = allProducts.filter((product) => product.section?._id === activeTab)
    
    // Further filter by subsection if one is selected
    if (activeSubSection !== "all") {
      filtered = filtered.filter((product) => product.subSection?._id === activeSubSection)
    }
    
    return filtered
  }, [activeTab, activeSubSection, allProducts])

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    return filteredBySection.filter((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [filteredBySection, searchQuery])

  // Calculate paginated items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredItems.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredItems, currentPage, itemsPerPage])

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredItems.length / itemsPerPage) || 1
  }, [filteredItems.length, itemsPerPage])

  // Fetch all data initially - ONLY PRODUCTS
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch sections
        const sectionsResponse = await getAllSections()
        if (sectionsResponse.status === "success") {
          setSections(sectionsResponse.data.sections)
        }

        // Fetch subsections
        const subSectionsResponse = await getAllSubSections()
        if (subSectionsResponse.status === "success") {
          setSubSections(subSectionsResponse.data.subsections)
        }

        // Fetch ONLY products (removed books fetching)
        const productsResponse = await getAllProducts()

        if (productsResponse.status === "success") {
          const now = new Date()
          const productsWithNewFlag = productsResponse.data.products.map(product => {
            const createdDate = new Date(product.createdAt)
            const diffInDays = (now - createdDate) / (1000 * 60 * 60 * 24) // ms → days

            return {
              ...product,
              isNew: diffInDays <= 3 // mark as new if within 3 days
            }
          })
          setAllProducts(productsWithNewFlag)
        }
      } catch (err) {
        setError(err.message)
        console.error(t("errors.fetchErrorLog"), err)
      } finally {
        setLoading(false)
      }
    }
// dummy comment to re-commit
    fetchInitialData()
  }, [t])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, activeSubSection, searchQuery])

  // Get subsections for the currently selected section
  const currentSubSections = useMemo(() => {
    if (activeTab === "all") return []
    return subSections.filter(subSection => subSection.section?._id === activeTab)
  }, [activeTab, subSections])

  // Reset subsection when section changes
  useEffect(() => {
    setActiveSubSection("all")
  }, [activeTab])

  // Create categories array with "All" option and fetched sections
  const categories = [
    { id: "all", icon: "☰" },
    ...sections.map((section) => ({
      id: section._id,
      name: section.name,
      icon: "📚",
    })),
  ]

  if (loading && allProducts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="alert alert-error">
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
          <span>
            {t("errors.loadingError")}: {error}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
      {/* Hero Section */}
      <div className="py-6 px-4">
        <div className="md:max-w-7xl lg:max-w-7xl max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <img src="/bookshelf.png" alt={t("hero.booksIllustration")} className="h-24 w-auto" />
            <h1 className={`text-lg font-semibold flex-1 text-center ${isRTL ? "md:text-left" : "md:text-right"}`}>
              {t("hero.tagline")}
            </h1>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-primary px-4 py-2">
        <div className="md:max-w-7xl lg:max-w-7xl sm:max-w-3xl mx-auto">
          <div className="flex flex-wrap overflow-x-auto scrollbar-hide gap-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.id)}
                className={`flex-shrink-0 px-10 py-2 text-sm font-medium transition-colors ${isRTL ? "border-l-2" : "border-r-2"
                  } border-secondary ${activeTab === category.id ? "bg-secondary/55 rounded-t-lg" : "hover:bg-primary"}`}
              >
                <span className={`${isRTL ? "ml-2" : "mr-2"}`}>{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Subsection Tabs (show only when a specific section is selected) */}
      {activeTab !== "all" && currentSubSections.length > 0 && (
        <div className="bg-secondary/20 px-4 py-2 border-b">
          <div className="md:max-w-7xl lg:max-w-7xl sm:max-w-3xl mx-auto">
            <div className="flex flex-wrap overflow-x-auto scrollbar-hide gap-1">
              <button
                onClick={() => setActiveSubSection("all")}
                className={`flex-shrink-0 px-6 py-1 text-sm font-medium transition-colors rounded ${
                  activeSubSection === "all" ? "bg-secondary text-white" : "hover:bg-secondary/30"
                }`}
              >
                {t("allSubSections") || "All"}
              </button>
              {currentSubSections.map((subSection) => (
                <button
                  key={subSection._id}
                  onClick={() => setActiveSubSection(subSection._id)}
                  className={`flex-shrink-0 px-6 py-1 text-sm font-medium transition-colors rounded ${
                    activeSubSection === subSection._id ? "bg-secondary text-white" : "hover:bg-secondary/30"
                  }`}
                >
                  {subSection.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={t("search.placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`input input-bordered w-full ${isRTL ? "pr-12" : "pl-12"
                  } focus:border-primary focus:ring-primary`}
              />
              <div className={`absolute ${isRTL ? "right-4" : "left-4"} top-1/2 transform -translate-y-1/2`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            <button className="btn btn-square btn-primary bg-primary border-primary hover:bg-primary/50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex justify-center mb-8">
            <div className="loading loading-spinner loading-md"></div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedItems.map((item) => (
            <div
              key={item._id}
              className="card bg-base-300 shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden"
            >
              {/* Discount Badge */}
              {item.discountPercentage && item.discountPercentage > 0 && (
                <div className={`absolute top-4 ${isRTL ? "right-4" : "left-4"} z-10`}>
                  <div
                    className={`bg-primary px-3 py-1 ${isRTL ? "rounded-bl-2xl" : "rounded-br-2xl"
                      } text-sm font-medium`}
                  >
                    {t("product.discounts")}
                    <br />
                    <span className="text-lg font-bold">{item.discountPercentage}%</span>
                  </div>
                </div>
              )}
              {item.isNew && (
                <div className={`absolute top-4 ${isRTL ? "left-4" : "right-4"} z-10`}>
                  <div
                    className={`bg-secondary px-3 py-1 ${isRTL ? "rounded-br-2xl" : "rounded-bl-2xl"
                      } text-sm font-medium`}
                  >
                    {t("product.new") || "NEW"}
                  </div>
                </div>
              )}
              <figure className="px-4 pt-4">
                <img
                  src={
                    convertPathToUrl(item.thumbnail, "product_thumbnails") ||
                    "/placeholder.svg?height=200&width=200" ||
                    "/placeholder.svg"
                  }
                  alt={item.title}
                  className="rounded-xl w-full h-48 object-cover"
                />
              </figure>

              <div className="card-body items-center text-center p-6">
                <h2 className="card-title text-lg font-semibold mb-2">{item.title}</h2>

                <div className="flex items-center gap-2 mb-4">
                  {item.priceAfterDiscount && item.priceAfterDiscount < item.price ? (
                    <>
                      <span className="text-2xl font-bold text-primary">
                        {item.priceAfterDiscount} {t("product.currency")}
                      </span>
                      <span className="text-sm line-through text-gray-500">
                        {item.price} {t("product.currency")}
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-primary">
                      {item.price} {t("product.currency")}
                    </span>
                  )}
                </div>

                <div className="card-actions w-full">
                  <button
                    onClick={() => {
                      // Determine type from the item data itself, not assumptions
                      const itemType = item.__t === "ECBook" ? "book" : "product"
                      navigate(`/market/product-details/${itemType}/${item._id}`)
                    }}
                    className="btn btn-primary bg-primary border-primary hover:bg-primary/50 w-full"
                  >
                    {t("product.viewDetails")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-2">{t("emptyState.title")}</h3>
            <p className="text-gray-500">{t("emptyState.description")}</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-12">
            <div className="join">
              <button
                className="join-item btn rounded-full"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                title={t("pagination.previous")}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ transform: isRTL ? "rotate(180deg)" : "none" }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`join-item btn rounded-full ${currentPage === page ? "btn-primary" : ""}`}
                  onClick={() => setCurrentPage(page)}
                  disabled={loading}
                >
                  {page}
                </button>
              ))}

              <button
                className="join-item btn rounded-full"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || loading}
                title={t("pagination.next")}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ transform: isRTL ? "rotate(180deg)" : "none" }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Market
