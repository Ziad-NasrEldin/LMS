"use client"
import { useState } from "react"
import { useTranslation } from "react-i18next"

const SubSectionsManagement = ({ 
  subSections = [], 
  sections = [],
  products = [], 
  books = [], 
  onEditSubSection, 
  onDeleteSubSection, 
  actionLoading = false, 
  isRTL = false 
}) => {
  const { t } = useTranslation("kalimaStore-admin")
  const [searchText, setSearchText] = useState("")
  const [sectionFilter, setSectionFilter] = useState("all")

  // Simple filtering
  const filteredSubSections = subSections.filter(subSection => {
    if (!subSection) return false
    
    // Text search filter
    if (searchText.trim()) {
      if (!subSection.name || !subSection.name.toLowerCase().includes(searchText.toLowerCase())) {
        return false
      }
    }
    
    // Section filter
    if (sectionFilter !== "all") {
      if (!subSection.section || subSection.section._id !== sectionFilter) {
        return false
      }
    }
    
    return true
  })

  // Add product counts
  const subSectionsWithCounts = filteredSubSections.map(subSection => {
    const subSectionProducts = products.filter(product => 
      product && product.subSection && (product.subSection._id === subSection._id || product.subSection === subSection._id)
    )
    const subSectionBooks = books.filter(book => 
      book && book.subSection === subSection._id
    )
    
    return {
      ...subSection,
      productCount: subSectionProducts.length + subSectionBooks.length
    }
  })

  // Get section name by ID
  const getSectionName = (sectionId) => {
    const section = sections.find(s => s._id === sectionId)
    return section ? section.name : t("unknownSection")
  }

  return (
    <div className="mb-12">
      {/* Header */}
      <div className="flex items-center justify-center relative mb-8">
        <div className={`absolute ${isRTL ? "right-10" : "left-10"}`}>
          <img src="/waves.png" alt={t("decorativeZigzag")} className="w-20 h-full animate-float-zigzag" />
        </div>
        <h2 className="text-3xl font-bold text-center">{t("subSectionsManagement.title") || "SubSections Management"}</h2>
        <div className={`absolute ${isRTL ? "left-0" : "right-0"}`}>
          <img src="/ring.png" alt={t("decorativeCircle")} className="w-20 h-full animate-float-up-dottedball" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-center mb-8">
        {/* Search Input */}
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder={t("subSectionsManagement.searchPlaceholder") || "Search subsections..."}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="input input-bordered w-full pl-4 pr-12"
          />
          <button className="absolute right-2 top-1/2 transform -translate-y-1/2 btn btn-ghost btn-sm">
            🔍
          </button>
        </div>

        {/* Section Filter */}
        <div className="w-full max-w-xs">
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="select select-bordered w-full"
          >
            <option value="all">{t("allSections") || "All Sections"}</option>
            {sections.map((section) => (
              <option key={section._id} value={section._id}>
                {section.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Debug Info */}
      <div className="text-center mb-4 text-sm text-gray-500">
        {t("subSectionsManagement.totalSubSections") || "Total SubSections"}: {subSections.length} | 
        {t("subSectionsManagement.filtered") || "Filtered"}: {subSectionsWithCounts.length} | 
        {t("subSectionsManagement.search") || "Search"}: "{searchText}"
      </div>

      {/* Table */}
      <div className="card shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th className="text-center">{t("subSectionsManagement.table.name") || "Name"}</th>
                <th className="text-center">{t("subSectionsManagement.table.section") || "Section"}</th>
                <th className="text-center">{t("subSectionsManagement.table.numberOfProducts") || "Products"}</th>
                <th className="text-center">{t("subSectionsManagement.table.createdAt") || "Created"}</th>
                <th className="text-center">{t("subSectionsManagement.table.actions") || "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {subSectionsWithCounts.map((subSection) => (
                <tr key={subSection._id}>
                  <td className="text-center font-medium">{subSection.name || t("nA")}</td>
                  <td className="text-center">
                    <span className="badge badge-primary">
                      {getSectionName(subSection.section?._id || subSection.section)}
                    </span>
                  </td>
                  <td className="text-center">{subSection.productCount || 0}</td>
                  <td className="text-center">
                    {subSection.createdAt 
                      ? new Date(subSection.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')
                      : t("nA")
                    }
                  </td>
                  <td className="text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => onEditSubSection?.(subSection)}
                        disabled={actionLoading}
                        title={t("subSectionsManagement.table.edit") || "Edit"}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => onDeleteSubSection?.(subSection)}
                        disabled={actionLoading}
                        title={t("subSectionsManagement.table.delete") || "Delete"}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {subSectionsWithCounts.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-gray-500">
              {subSections.length === 0 
                ? (t("subSectionsManagement.noSubSectionsAvailable") || "No subsections available")
                : (t("subSectionsManagement.noSubSections") || "No subsections found")
              }
            </p>
            {searchText && (
              <p className="text-sm text-gray-400 mt-2">
                {t("subSectionsManagement.tryDifferentSearch") || "Try a different search term"}
              </p>
            )}
          </div>
        )}

        {/* Decorative dots */}
        <div className="absolute bottom-4 right-4">
          <img src="/rDots.png" alt={t("decorativeDots")} className="w-16 h-full animate-float-down-dottedball" />
        </div>
      </div>
    </div>
  )
}

export default SubSectionsManagement
