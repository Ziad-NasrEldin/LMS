"use client"
import { useTranslation } from "react-i18next"
import { FaDownload, FaFileExport } from "react-icons/fa"

const ExportSection = ({
  products = [],
  books = [],
  sections = [],
  subjects = [],
  isExporting,
  onExportCSV,
  onExportJSON,
}) => {
  const { t } = useTranslation("kalimaStore-admin")

  // Helper functions
  const getSectionName = (sectionId) => {
    if (!sectionId) return t("products.unknownSection") || "Unknown Section"

    const section = sections.find(
      (s) => s?._id === sectionId || (typeof sectionId === "object" && s?._id === sectionId?._id),
    )
    return section?.name || t("products.unknownSection") || "Unknown Section"
  }

  const getSubjectName = (subjectId) => {
    if (!subjectId) return "Unknown Subject"

    const subject = subjects.find(
      (s) => s?._id === subjectId || (typeof subjectId === "object" && s?._id === subjectId?._id),
    )
    return subject?.name || "Unknown Subject"
  }

  const formatPrice = (price, discountPercentage) => {
    if (!price || !discountPercentage || discountPercentage <= 0) {
      return price || 0
    }
    const discountAmount = (price * discountPercentage) / 100
    return (price - discountAmount).toFixed(2)
  }

  const convertToCSV = (type) => {
    let headers = []
    let csvContent = ""

    try {
      switch (type) {
        case "products":
          headers = [
            t("export.title") || "Title",
            t("export.serial") || "Serial",
            t("export.section") || "Section",
            t("export.subject") || "Subject",
            t("export.price") || "Price",
            t("export.discount") || "Discount %",
            t("export.finalPrice") || "Final Price",
            t("export.paymentNumber") || "Payment Number",
            t("export.type") || "Type",
            t("export.createdDate") || "Created Date",
          ]

          const allProducts = [...(products || []), ...(books || [])]
          csvContent = [
            headers.join(","),
            ...allProducts
              .map((item) => {
                if (!item) return ""

                const isBook = books.some((book) => book?._id === item?._id)
                const finalPrice =
                  item?.discountPercentage > 0 ? formatPrice(item?.price, item?.discountPercentage) : item?.price || 0

                return [
                  `"${item?.title || ""}"`,
                  `"${item?.serial || ""}"`,
                  `"${getSectionName(item?.section)}"`,
                  `"${isBook && item?.subject ? getSubjectName(item?.subject) : "-"}"`,
                  `"${item?.price || 0}"`,
                  `"${item?.discountPercentage || 0}"`,
                  `"${finalPrice}"`,
                  `"${item?.paymentNumber || ""}"`,
                  `"${isBook ? "Book" : "Product"}"`,
                  `"${item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}"`,
                ].join(",")
              })
              .filter((row) => row !== ""),
          ].join("\n")
          break

        case "sections":
          headers = [
            t("export.name") || "Name",
            t("export.number") || "Number",
            t("export.description") || "Description",
            t("export.productCount") || "Product Count",
            t("export.thumbnail") || "Thumbnail",
            t("export.createdDate") || "Created Date",
          ]

          const sectionsWithCounts = (sections || [])
            .map((section) => {
              if (!section) return null

              const sectionProducts = (products || []).filter(
                (product) =>
                  product?.section && (product.section._id === section._id || product.section === section._id),
              )
              const sectionBooks = (books || []).filter((book) => book?.section === section._id)

              return {
                ...section,
                productCount: sectionProducts.length + sectionBooks.length,
              }
            })
            .filter(Boolean)

          csvContent = [
            headers.join(","),
            ...sectionsWithCounts.map((section) =>
              [
                `"${section?.name || ""}"`,
                `"${section?.number || ""}"`,
                `"${section?.description || ""}"`,
                `"${section?.productCount || 0}"`,
                `"${section?.thumbnail || ""}"`,
                `"${section?.createdAt ? new Date(section.createdAt).toLocaleDateString() : ""}"`,
              ].join(","),
            ),
          ].join("\n")
          break

        case "books":
          headers = [
            t("export.title") || "Title",
            t("export.serial") || "Serial",
            t("export.section") || "Section",
            t("export.subject") || "Subject",
            t("export.price") || "Price",
            t("export.discount") || "Discount %",
            t("export.finalPrice") || "Final Price",
            t("export.description") || "Description",
            t("export.paymentNumber") || "Payment Number",
            t("export.createdDate") || "Created Date",
          ]

          csvContent = [
            headers.join(","),
            ...(books || [])
              .map((book) => {
                if (!book) return ""

                const finalPrice =
                  book?.discountPercentage > 0 ? formatPrice(book?.price, book?.discountPercentage) : book?.price || 0

                return [
                  `"${book?.title || ""}"`,
                  `"${book?.serial || ""}"`,
                  `"${getSectionName(book?.section)}"`,
                  `"${book?.subject ? getSubjectName(book?.subject) : ""}"`,
                  `"${book?.price || 0}"`,
                  `"${book?.discountPercentage || 0}"`,
                  `"${finalPrice}"`,
                  `"${book?.description || ""}"`,
                  `"${book?.paymentNumber || ""}"`,
                  `"${book?.createdAt ? new Date(book.createdAt).toLocaleDateString() : ""}"`,
                ].join(",")
              })
              .filter((row) => row !== ""),
          ].join("\n")
          break

        default:
          throw new Error("Invalid export type")
      }

      return csvContent
    } catch (error) {
      console.error("Error converting to CSV:", error)
      throw new Error("Failed to convert data to CSV format")
    }
  }

  const handleExportCSV = async (type) => {
    try {
      const csvContent = convertToCSV(type)

      if (!csvContent || csvContent.split("\n").length <= 1) {
        throw new Error("No data available to export")
      }

      await onExportCSV(type, csvContent)
    } catch (error) {
      console.error("Export CSV error:", error)
      alert(t("export.error") || "Failed to export data. Please try again.")
    }
  }

  const handleExportJSON = async (type) => {
    try {
      let jsonData = []

      switch (type) {
        case "products":
          const allProducts = [...(products || []), ...(books || [])]
          jsonData = allProducts.filter(Boolean).map((item) => {
            const isBook = books.some((book) => book?._id === item?._id)
            const finalPrice =
              item?.discountPercentage > 0 ? formatPrice(item?.price, item?.discountPercentage) : item?.price || 0

            return {
              id: item?._id || "",
              title: item?.title || "",
              serial: item?.serial || "",
              section: getSectionName(item?.section),
              subject: isBook && item?.subject ? getSubjectName(item?.subject) : null,
              price: item?.price || 0,
              discountPercentage: item?.discountPercentage || 0,
              finalPrice: finalPrice,
              paymentNumber: item?.paymentNumber || "",
              type: isBook ? "Book" : "Product",
              description: item?.description || "",
              createdAt: item?.createdAt || "",
            }
          })
          break

        case "sections":
          jsonData = (sections || []).filter(Boolean).map((section) => {
            const sectionProducts = (products || []).filter(
              (product) => product?.section && (product.section._id === section._id || product.section === section._id),
            )
            const sectionBooks = (books || []).filter((book) => book?.section === section._id)

            return {
              id: section?._id || "",
              name: section?.name || "",
              number: section?.number || "",
              description: section?.description || "",
              productCount: sectionProducts.length + sectionBooks.length,
              thumbnail: section?.thumbnail || "",
              createdAt: section?.createdAt || "",
            }
          })
          break

        case "books":
          jsonData = (books || []).filter(Boolean).map((book) => {
            const finalPrice =
              book?.discountPercentage > 0 ? formatPrice(book?.price, book?.discountPercentage) : book?.price || 0

            return {
              id: book?._id || "",
              title: book?.title || "",
              serial: book?.serial || "",
              section: getSectionName(book?.section),
              subject: book?.subject ? getSubjectName(book?.subject) : "",
              price: book?.price || 0,
              discountPercentage: book?.discountPercentage || 0,
              finalPrice: finalPrice,
              description: book?.description || "",
              paymentNumber: book?.paymentNumber || "",
              createdAt: book?.createdAt || "",
            }
          })
          break

        default:
          throw new Error("Invalid export type")
      }

      if (jsonData.length === 0) {
        throw new Error("No data available to export")
      }

      await onExportJSON(type, jsonData)
    } catch (error) {
      console.error("Export JSON error:", error)
      alert(t("export.error") || "Failed to export data. Please try again.")
    }
  }

  return (
    <div className="px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t("adminPanel.title") || "Admin Panel"}</h1>
          <p className="text-base-content/70">{t("adminPanel.subtitle") || "Manage products, books, and sections"}</p>
        </div>

        {/* Export Dropdown */}
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-outline btn-primary" disabled={isExporting}>
            {isExporting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                {t("export.exporting") || "Exporting..."}
              </>
            ) : (
              <>
                <FaDownload className="mr-2" />
                {t("export.export") || "Export Data"}
              </>
            )}
          </div>
          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-80">
            <li className="menu-title">
              <span>{t("export.csvFormat") || "CSV Format"}</span>
            </li>
            <li>
              <button
                onClick={() => handleExportCSV("products")}
                disabled={isExporting || products.length + books.length === 0}
              >
                <FaFileExport className="mr-2" />
                {t("export.allProducts") || "All Products & Books"} ({products.length + books.length})
              </button>
            </li>
            <li>
              <button onClick={() => handleExportCSV("books")} disabled={isExporting || books.length === 0}>
                <FaFileExport className="mr-2" />
                {t("export.booksOnly") || "Books Only"} ({books.length})
              </button>
            </li>
            <li>
              <button onClick={() => handleExportCSV("sections")} disabled={isExporting || sections.length === 0}>
                <FaFileExport className="mr-2" />
                {t("export.sections") || "Sections"} ({sections.length})
              </button>
            </li>
            <div className="divider my-1"></div>
            <li className="menu-title">
              <span>{t("export.jsonFormat") || "JSON Format"}</span>
            </li>
            <li>
              <button
                onClick={() => handleExportJSON("products")}
                disabled={isExporting || products.length + books.length === 0}
              >
                <FaFileExport className="mr-2" />
                {t("export.allProducts") || "All Products & Books"} ({products.length + books.length})
              </button>
            </li>
            <li>
              <button onClick={() => handleExportJSON("books")} disabled={isExporting || books.length === 0}>
                <FaFileExport className="mr-2" />
                {t("export.booksOnly") || "Books Only"} ({books.length})
              </button>
            </li>
            <li>
              <button onClick={() => handleExportJSON("sections")} disabled={isExporting || sections.length === 0}>
                <FaFileExport className="mr-2" />
                {t("export.sections") || "Sections"} ({sections.length})
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Export Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat bg-primary/10 rounded-lg p-4">
          <div className="stat-title">{t("export.totalProducts") || "Total Products"}</div>
          <div className="stat-value text-primary">{products.length}</div>
        </div>
        <div className="stat bg-secondary/10 rounded-lg p-4">
          <div className="stat-title">{t("export.totalBooks") || "Total Books"}</div>
          <div className="stat-value text-secondary">{books.length}</div>
        </div>
        <div className="stat bg-accent/10 rounded-lg p-4">
          <div className="stat-title">{t("export.totalSections") || "Total Sections"}</div>
          <div className="stat-value text-accent">{sections.length}</div>
        </div>
        <div className="stat bg-info/10 rounded-lg p-4">
          <div className="stat-title">{t("export.totalItems") || "Total Items"}</div>
          <div className="stat-value text-info">{products.length + books.length + sections.length}</div>
        </div>
      </div>
    </div>
  )
}

export default ExportSection
