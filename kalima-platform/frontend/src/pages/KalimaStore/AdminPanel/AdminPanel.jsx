"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import {
  createSection,
  updateSection,
  deleteSection,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  createBook,
  createSubSection,
  updateSubSection,
  deleteSubSection,
} from "../../../routes/market"
import Orders from "./Orders"
import { useAdminData } from "./UseAdminData"
import ExportSection from "./ExportSection"
import ProductsManagement from "./ProductsManagement"
import SectionsManagement from "./SectionsManagement"
import SubSectionsManagement from "./SubSectionsManagement"
import AdminForms from "./AdminForms"
import AdminModals from "./AdminModals"
import ErrorBoundary from "./ErrorBoundary"
import CreateCoupons from "./CreateCoupouns"

const AdminPanel = () => {
  const { t, i18n } = useTranslation("kalimaStore-admin")
  const isRTL = i18n.language === "ar"

  // Use custom hook for data management
  const { loading, error, sections, subSections, books, products, subjects, stats, refetch, setSections, setSubSections, setBooks, setProducts } =
    useAdminData()

  // Local state
  const [actionLoading, setActionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("product")
  const [isExporting, setIsExporting] = useState(false)

  // Manual initial data fetch (since we removed auto-refresh)
  useEffect(() => {
    refetch()
  }, [refetch])

  // Form states
  const [sectionForm, setSectionForm] = useState({
    name: "",
    description: "",
    number: "",
    thumbnail: "logo",
    allowedFor: [],
  })

  const [subSectionForm, setSubSectionForm] = useState({
    name: "",
    section: "",
  })

  const [productForm, setProductForm] = useState({
    title: "",
    serial: "",
    section: "",
    price: "",
    priceAfterDiscount: "",
    paymentNumber: "",
    thumbnail: null,
    sample: null,
    gallery: [],
    whatsAppNumber: "",
    description: "",
  })

  const [bookForm, setBookForm] = useState({
    title: "",
    serial: "",
    section: "",
    price: "",
    priceAfterDiscount: "",
    subject: "",
    paymentNumber: "",
    thumbnail: null,
    sample: null,
    gallery: [],
    whatsAppNumber: "",
    description: "",
  })

  // Modal states
  const [editingSection, setEditingSection] = useState(null)
  const [editingSubSection, setEditingSubSection] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showEditSubSectionModal, setShowEditSubSectionModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDeleteSubSectionModal, setShowDeleteSubSectionModal] = useState(false)
  const [sectionToDelete, setSectionToDelete] = useState(null)
  const [subSectionToDelete, setSubSectionToDelete] = useState(null)
  const [showEditProductModal, setShowEditProductModal] = useState(false)
  const [showDeleteProductModal, setShowDeleteProductModal] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)

  // Export handlers
  const handleExportCSV = async (type, csvContent) => {
    setIsExporting(true)
    try {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)

        const timestamp = new Date().toISOString().split("T")[0]
        const filename = `${type}-${timestamp}.csv`

        link.setAttribute("download", filename)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        const dataCount =
          type === "products" ? products.length + books.length : type === "sections" ? sections.length : books.length
        const successMessage = t("export.successMessage", { count: dataCount, type })
        alert(successMessage)
      }
    } catch (error) {
      console.error("Export error:", error)
      alert(t("export.error"))
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportJSON = async (type, jsonData) => {
    setIsExporting(true)
    try {
      const jsonContent = JSON.stringify(jsonData, null, 2)
      const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" })
      const link = document.createElement("a")

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)

        const timestamp = new Date().toISOString().split("T")[0]
        const filename = `${type}-${timestamp}.json`

        link.setAttribute("download", filename)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        const successMessage = t("export.successMessage", { count: jsonData.length, type })
        alert(successMessage)
      }
    } catch (error) {
      console.error("Export error:", error)
      alert(t("export.error"))
    } finally {
      setIsExporting(false)
    }
  }

  // CRUD handlers with improved error handling
  const handleCreateBook = async (e) => {
    e.preventDefault()
    
    if (
      !bookForm.title ||
      !bookForm.serial ||
      !bookForm.section ||
      !bookForm.price ||
      !bookForm.paymentNumber ||
      !bookForm.subject
    ) {
      alert(t("alerts.fillRequiredFields"))
      return
    }

    // Check if subSection is selected
    if (!bookForm.subSection) {
      alert(t("alerts.subSectionRequired") || "Please select a subsection")
      return
    }

    try {
      setActionLoading(true)
      
      // 🐛 DEBUG: Log the data being sent to createBook
      const dataToSend = {
        title: bookForm.title,
        serial: bookForm.serial,
        section: bookForm.section,
        subSection: bookForm.subSection, // Add this field!
        price: bookForm.price,
        priceAfterDiscount: bookForm.priceAfterDiscount || bookForm.price,
        paymentNumber: bookForm.paymentNumber,
        subject: bookForm.subject,
        description: bookForm.description,
        thumbnail: bookForm.thumbnail,
        sample: bookForm.sample,
        gallery: bookForm.gallery,
        whatsAppNumber: bookForm.whatsAppNumber,
      }
      
      const response = await createBook(dataToSend)

      if (response?.message === "ECBook created successfully" || response?.status === "success") {
        // Reset form
        setBookForm({
          title: "",
          serial: "",
          section: "",
          subSection: "", // Reset subSection field
          price: "",
          priceAfterDiscount: "",
          subject: "",
          paymentNumber: "",
          description: "",
          thumbnail: null,
          sample: null,
          gallery: [],
          whatsAppNumber: "",
        })

        // Reset file inputs
        const thumbnailInput = document.getElementById("book-thumbnail")
        const sampleInput = document.getElementById("book-sample")
        if (thumbnailInput) thumbnailInput.value = ""
        if (sampleInput) sampleInput.value = ""

        alert(t("alerts.bookCreatedSuccess"))
        await refetch()
      } else {
        throw new Error(response?.error || "Failed to create book")
      }
    } catch (err) {
      console.error("Error creating book:", err)
      alert(t("alerts.bookCreateError") + (err?.message || "Unknown error"))
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateProduct = async (e) => {
    e.preventDefault()
    
    
    if (
      !productForm.title ||
      !productForm.serial ||
      !productForm.section ||
      !productForm.price ||
      !productForm.paymentNumber
    ) {
      alert(t("alerts.fillRequiredFields"))
      return
    }

    // Check if subSection is selected
    if (!productForm.subSection) {
      alert(t("alerts.subSectionRequired") || "Please select a subsection")
      return
    }

    try {
      setActionLoading(true)
      
      // 🐛 DEBUG: Log the data being sent to createProduct
      const dataToSend = {
        title: productForm.title,
        serial: productForm.serial,
        section: productForm.section,
        subSection: productForm.subSection, // Add this field!
        price: productForm.price,
        priceAfterDiscount: productForm.priceAfterDiscount || productForm.price,
        paymentNumber: productForm.paymentNumber,
        thumbnail: productForm.thumbnail,
        sample: productForm.sample,
        gallery: productForm.gallery,
        whatsAppNumber: productForm.whatsAppNumber,
        description: productForm.description,
      }
      
      
      const response = await createProduct(dataToSend)

      if (response?.message === "Product created successfully" || response?.status === "success") {
        // Reset form
        setProductForm({
          title: "",
          serial: "",
          section: "",
          subSection: "", // Reset subSection field
          price: "",
          priceAfterDiscount: "",
          paymentNumber: "",
          thumbnail: null,
          sample: null,
          gallery: [],
          whatsAppNumber: "",
          description: "",
        })

        // Reset file inputs
        const thumbnailInput = document.getElementById("product-thumbnail")
        const sampleInput = document.getElementById("product-sample")
        if (thumbnailInput) thumbnailInput.value = ""
        if (sampleInput) sampleInput.value = ""

        alert(t("alerts.productCreatedSuccess"))
        await refetch()
      } else {
        throw new Error(response?.error || "Failed to create product")
      }
    } catch (err) {
      console.error("Error creating product:", err)
      alert(t("alerts.productCreateError") + (err?.message || "Unknown error"))
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditProduct = async (product) => {
    if (!product?._id) {
      alert(t("validation.invalidProductSelected"))
      return
    }

    try {
      setActionLoading(true)
      const response = await getProductById(product._id)

      if (response?.status === "success" && response?.data?.product) {
        const productData = response.data.product
        setEditingProduct(productData)
        setProductForm({
          title: productData.title || "",
          serial: productData.serial || "",
          section: productData.section?._id || productData.section || "",
          price: productData.price?.toString() || "",
          discountPercentage: productData.discountPercentage?.toString() || "",
          paymentNumber: productData.paymentNumber || "",
          thumbnail: null,
          sample: null,
          gallery: productData.gallery || [],
          whatsAppNumber: productData.whatsAppNumber || "",
          description: productData.description || "",
        })
        setShowEditProductModal(true)
      } else {
        throw new Error(response?.error || "Failed to fetch product details")
      }
    } catch (err) {
      console.error("Error fetching product details:", err)
      alert(t("alerts.productFetchError") + (err?.message || "Unknown error"))
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateProduct = async (e) => {
    e.preventDefault()
    if (!editingProduct?._id) return

    try {
      setActionLoading(true)
      const response = await updateProduct(editingProduct._id, {
        title: productForm.title,
        serial: productForm.serial,
        section: productForm.section,
        price: productForm.price,
        priceAfterDiscount: productForm.priceAfterDiscount,
        paymentNumber: productForm.paymentNumber,
        thumbnail: productForm.thumbnail,
        sample: productForm.sample,
        gallery: productForm.gallery,
        whatsAppNumber: productForm.whatsAppNumber,
        description: productForm.description,
        ...(editingProduct.__t === "ECBook" && { subject: productForm.subject })
      }
    )

      if (response?.status === "success") {
        setShowEditProductModal(false)
        setEditingProduct(null)
        setProductForm({
          title: "",
          serial: "",
          section: "",
          price: "",
          discountPercentage: "",
          paymentNumber: "",
          thumbnail: null,
          sample: null,
          gallery: [],
          whatsAppNumber: "",
          description: "",
        })

        // Reset file inputs
        const thumbnailInput = document.getElementById("edit-product-thumbnail")
        const sampleInput = document.getElementById("edit-product-sample")
        if (thumbnailInput) thumbnailInput.value = ""
        if (sampleInput) sampleInput.value = ""

        alert(t("alerts.productUpdatedSuccess"))
        await refetch()
      } else {
        throw new Error(response?.error || "Failed to update product")
      }
    } catch (err) {
      console.error("Error updating product:", err)
      alert(t("alerts.productUpdateError") + (err?.message || "Unknown error"))
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (!productToDelete?._id) return

    try {
      setActionLoading(true)
      const response = await deleteProduct(productToDelete._id)

      if (response?.status === "success" || response) {
        setShowDeleteProductModal(false)
        setProductToDelete(null)
        alert(t("alerts.productDeletedSuccess"))
        await refetch()
      } else {
        throw new Error(response?.error || "Failed to delete product")
      }
    } catch (err) {
      console.error("Error deleting product:", err)
      alert(t("alerts.productDeleteError") + (err?.message || "Unknown error"))
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateSection = async (e) => {
    e.preventDefault()
    if (!sectionForm.name || !sectionForm.description || !sectionForm.number) {
      alert(t("alerts.fillRequiredFields"))
      return
    }

    try {
      setActionLoading(true)
      const response = await createSection({
        name: sectionForm.name,
        description: sectionForm.description,
        number: Number.parseInt(sectionForm.number),
        thumbnail: sectionForm.thumbnail,
        allowedFor: sectionForm.allowedFor || [],
      })

      if (response?.status === "success") {
        setSectionForm({
          name: "",
          description: "",
          number: "",
          thumbnail: "logo",
          allowedFor: [],
        })
        alert(t("alerts.sectionCreatedSuccess"))
        await refetch()
      } else {
        throw new Error(response?.error || "Failed to create section")
      }
    } catch (err) {
      console.error("Error creating section:", err)
      alert(t("alerts.sectionCreateError") + (err?.message || "Unknown error"))
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateSubSection = async (e) => {
    e.preventDefault()
    if (!subSectionForm.name || !subSectionForm.section) {
      alert(t("alerts.fillRequiredFields"))
      return
    }

    try {
      setActionLoading(true)
      const response = await createSubSection({
        name: subSectionForm.name,
        section: subSectionForm.section,
      })

      if (response?.status === "success") {
        setSubSectionForm({
          name: "",
          section: "",
        })
        alert(t("alerts.subSectionCreatedSuccess") || "SubSection created successfully")
        await refetch()
      } else {
        throw new Error(response?.error || "Failed to create subsection")
      }
    } catch (err) {
      console.error("Error creating subsection:", err)
      alert(t("alerts.subSectionCreateError") + (err?.message || "Unknown error"))
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditSection = (section) => {
    if (!section?._id) {
      alert(t("validation.invalidSectionSelected"))
      return
    }

    setEditingSection(section)
    setSectionForm({
      name: section.name || "",
      description: section.description || "",
      number: section.number?.toString() || "",
      thumbnail: section.thumbnail || "logo",
    })
    setShowEditModal(true)
  }

  const handleUpdateSection = async (e) => {
    e.preventDefault()
    if (!editingSection?._id) return

    try {
      setActionLoading(true)
      const response = await updateSection(editingSection._id, {
        name: sectionForm.name,
        description: sectionForm.description,
        number: Number.parseInt(sectionForm.number),
        thumbnail: sectionForm.thumbnail,
      })

      if (response?.status === "success") {
        setShowEditModal(false)
        setEditingSection(null)
        setSectionForm({
          name: "",
          description: "",
          number: "",
          thumbnail: "logo",
        })
        alert(t("alerts.sectionUpdatedSuccess"))
        await refetch()
      } else {
        throw new Error(response?.error || "Failed to update section")
      }
    } catch (err) {
      console.error("Error updating section:", err)
      alert(t("alerts.sectionUpdateError") + (err?.message || "Unknown error"))
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteSection = async () => {
    if (!sectionToDelete?._id) return

    try {
      setActionLoading(true)
      const response = await deleteSection(sectionToDelete._id)

      if (response?.status === "success" || response) {
        setShowDeleteModal(false)
        setSectionToDelete(null)
        alert(t("alerts.sectionDeletedSuccess"))
        await refetch()
      } else {
        throw new Error(response?.error || "Failed to delete section")
      }
    } catch (err) {
      console.error("Error deleting section:", err)
      alert(t("alerts.sectionDeleteError") + (err?.message || "Unknown error"))
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditSubSection = (subSection) => {
    if (!subSection?._id) {
      alert(t("validation.invalidSubSectionSelected") || "Invalid subsection selected")
      return
    }

    setEditingSubSection(subSection)
    setSubSectionForm({
      name: subSection.name || "",
      section: subSection.section?._id || subSection.section || "",
    })
    setShowEditSubSectionModal(true)
  }

  const handleUpdateSubSection = async (e) => {
    e.preventDefault()
    if (!editingSubSection?._id) return

    try {
      setActionLoading(true)
      const response = await updateSubSection(editingSubSection._id, {
        name: subSectionForm.name,
        section: subSectionForm.section,
      })

      if (response?.status === "success") {
        setShowEditSubSectionModal(false)
        setEditingSubSection(null)
        setSubSectionForm({
          name: "",
          section: "",
        })
        alert(t("alerts.subSectionUpdatedSuccess") || "SubSection updated successfully")
        await refetch()
      } else {
        throw new Error(response?.error || "Failed to update subsection")
      }
    } catch (err) {
      console.error("Error updating subsection:", err)
      alert(t("alerts.subSectionUpdateError") + (err?.message || "Unknown error"))
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteSubSection = async () => {
    if (!subSectionToDelete?._id) return

    try {
      setActionLoading(true)
      const response = await deleteSubSection(subSectionToDelete._id)

      if (response?.status === "success" || response) {
        setShowDeleteSubSectionModal(false)
        setSubSectionToDelete(null)
        alert(t("alerts.subSectionDeletedSuccess") || "SubSection deleted successfully")
        await refetch()
      } else {
        throw new Error(response?.error || "Failed to delete subsection")
      }
    } catch (err) {
      console.error("Error deleting subsection:", err)
      alert(t("alerts.subSectionDeleteError") + (err?.message || "Unknown error"))
    } finally {
      setActionLoading(false)
    }
  }

  const handleFileChange = (e, fieldName, formType = "product") => {
    const files = e.target.files

    if (formType === "product") {
      setProductForm((prev) => ({
        ...prev,
        [fieldName]: fieldName === "gallery" ? files : files[0],
      }))
    } else if (formType === "book") {
      setBookForm((prev) => ({
        ...prev,
        [fieldName]: fieldName === "gallery" ? files : files[0],
      }))
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="alert alert-error max-w-md">
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
          <div>
            <h3 className="font-bold">{t("error.title")}</h3>
            <div className="text-xs">{error}</div>
            <button className="btn btn-sm btn-outline mt-2" onClick={() => refetch()}>
              {t("error.retry")}
            </button>
          </div>
        </div>
      </div>
    )
  }
  return (
    <ErrorBoundary>
      <div className={`min-h-screen ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
        <Orders />

        <ExportSection
          products={products}
          books={books}
          sections={sections}
          subjects={subjects}
          isExporting={isExporting}
          onExportCSV={handleExportCSV}
          onExportJSON={handleExportJSON}
        />

        <div className="px-4 py-8">
          <ProductsManagement
            products={products}
            sections={sections}
            subjects={subjects}
            onEditProduct={handleEditProduct}
            onDeleteProduct={(product) => {
              setProductToDelete(product)
              setShowDeleteProductModal(true)
            }}
            actionLoading={actionLoading}
            isRTL={isRTL}
          />

          <SectionsManagement
            sections={sections}
            products={products}
            books={books}
            onEditSection={handleEditSection}
            onDeleteSection={(section) => {
              setSectionToDelete(section)
              setShowDeleteModal(true)
            }}
            actionLoading={actionLoading}
            isRTL={isRTL}
          />

          <SubSectionsManagement
            subSections={subSections}
            sections={sections}
            products={products}
            books={books}
            onEditSubSection={handleEditSubSection}
            onDeleteSubSection={(subSection) => {
              setSubSectionToDelete(subSection)
              setShowDeleteSubSectionModal(true)
            }}
            actionLoading={actionLoading}
            isRTL={isRTL}
          />

          <CreateCoupons
            isRTL={isRTL}
          />

          <AdminForms
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            productForm={productForm}
            setProductForm={setProductForm}
            bookForm={bookForm}
            setBookForm={setBookForm}
            sectionForm={sectionForm}
            setSectionForm={setSectionForm}
            subSectionForm={subSectionForm}
            setSubSectionForm={setSubSectionForm}
            sections={sections}
            subSections={subSections}
            subjects={subjects}
            onCreateProduct={handleCreateProduct}
            onCreateBook={handleCreateBook}
            onCreateSection={handleCreateSection}
            onCreateSubSection={handleCreateSubSection}
            onFileChange={handleFileChange}
            actionLoading={actionLoading}
            isRTL={isRTL}
          />

          {/* Bottom decorative elements */}
          <div className="relative">
            <div className={`absolute bottom-16 ${isRTL ? "right-10" : "left-10"}`}>
              <img src="/rDots.png" alt={t("decorativeDots")} className="w-16 h-full animate-float-up-dottedball" />
            </div>
            <div className={`absolute bottom-8 ${isRTL ? "left-10" : "right-10"}`}>
              <img src="/ring.png" alt={t("decorativeCircle")} className="w-16 h-full animate-float-down-dottedball" />
            </div>
          </div>
        </div>

        <AdminModals
          showEditModal={showEditModal}
          setShowEditModal={setShowEditModal}
          editingSection={editingSection}
          setEditingSection={setEditingSection}
          sectionForm={sectionForm}
          setSectionForm={setSectionForm}
          onUpdateSection={handleUpdateSection}
          showEditSubSectionModal={showEditSubSectionModal}
          setShowEditSubSectionModal={setShowEditSubSectionModal}
          editingSubSection={editingSubSection}
          setEditingSubSection={setEditingSubSection}
          subSectionForm={subSectionForm}
          setSubSectionForm={setSubSectionForm}
          onUpdateSubSection={handleUpdateSubSection}
          showEditProductModal={showEditProductModal}
          setShowEditProductModal={setShowEditProductModal}
          editingProduct={editingProduct}
          setEditingProduct={setEditingProduct}
          productForm={productForm}
          setProductForm={setProductForm}
          onUpdateProduct={handleUpdateProduct}
          sections={sections}
          subjects={subjects}
          onFileChange={handleFileChange}
          showDeleteModal={showDeleteModal}
          setShowDeleteModal={setShowDeleteModal}
          sectionToDelete={sectionToDelete}
          setSectionToDelete={setSectionToDelete}
          onDeleteSection={handleDeleteSection}
          showDeleteSubSectionModal={showDeleteSubSectionModal}
          setShowDeleteSubSectionModal={setShowDeleteSubSectionModal}
          onDeleteSubSection={handleDeleteSubSection}
          showDeleteProductModal={showDeleteProductModal}
          setShowDeleteProductModal={setShowDeleteProductModal}
          productToDelete={productToDelete}
          setProductToDelete={setProductToDelete}
          onDeleteProduct={handleDeleteProduct}
          actionLoading={actionLoading}
        />
      </div>
    </ErrorBoundary>
  )
}

export default AdminPanel
