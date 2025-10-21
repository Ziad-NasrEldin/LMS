"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Upload, X, FileText, ImageIcon } from "lucide-react"
import EnhancedProgressBar from "../../../components/EnhancedProgressBar"
import { useFormProgress } from "./useFormProgress"
import { simulateFileUpload } from "../../../routes/uploadService"

const EnhancedAdminForms = ({
  activeTab,
  setActiveTab,
  productForm,
  setProductForm,
  bookForm,
  setBookForm,
  sectionForm,
  setSectionForm,
  subSectionForm,
  setSubSectionForm,
  sections = [],
  subSections = [],
  subjects = [],
  onCreateProduct,
  onCreateBook,
  onCreateSection,
  onCreateSubSection,
  onFileChange,
  actionLoading,
  isRTL,
}) => {
  const { t } = useTranslation("kalimaStore-admin")
  const progressTracker = useFormProgress()

  // Enhanced upload states
  const [uploadStates, setUploadStates] = useState({
    thumbnail: { file: null, uploaded: false, uploading: false, progress: 0, error: null, url: null },
    sample: { file: null, uploaded: false, uploading: false, progress: 0, error: null, url: null },
    gallery: { files: [], uploaded: false, uploading: false, progress: 0, error: null, urls: [] },
  })

  // Handle file selection
  const handleFileSelect = async (e, fieldName, formType) => {
    const files = e.target.files
    const file = files[0]

    if (!file && fieldName !== "gallery") return
    if (fieldName === "gallery" && (!files || files.length === 0)) return

    // Update form state
    if (formType === "product") {
      setProductForm?.((prev) => ({
        ...prev,
        [fieldName]: fieldName === "gallery" ? files : file,
      }))
    } else if (formType === "book") {
      setBookForm?.((prev) => ({
        ...prev,
        [fieldName]: fieldName === "gallery" ? files : file,
      }))
    }

    // Update upload state
    setUploadStates((prev) => ({
      ...prev,
      [fieldName]: {
        file: fieldName === "gallery" ? files : file,
        files: fieldName === "gallery" ? Array.from(files) : [],
        uploaded: false,
        uploading: false,
        progress: 0,
        error: null,
        url: null,
        urls: fieldName === "gallery" ? [] : prev[fieldName].urls,
      },
    }))

    // Call original file change handler
    onFileChange?.(e, fieldName, formType)
  }

  // Handle individual file upload
  const handleFileUpload = async (fieldName) => {
    const uploadState = uploadStates[fieldName]
    if (!uploadState.file && !uploadState.files?.length) return

    setUploadStates((prev) => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], uploading: true, progress: 0, error: null },
    }))

    try {
      if (fieldName === "gallery" && uploadState.files?.length > 0) {
        // Handle multiple files
        const uploadPromises = uploadState.files.map(async (file, index) => {
          return simulateFileUpload(file, (progress) => {
            setUploadStates((prev) => ({
              ...prev,
              [fieldName]: {
                ...prev[fieldName],
                progress: Math.round((progress + index * 100) / uploadState.files.length),
              },
            }))
          })
        })

        const results = await Promise.all(uploadPromises)
        const urls = results.map((result) => result.url)

        setUploadStates((prev) => ({
          ...prev,
          [fieldName]: {
            ...prev[fieldName],
            uploading: false,
            uploaded: true,
            progress: 100,
            urls,
          },
        }))
      } else {
        // Handle single file
        const result = await simulateFileUpload(uploadState.file, (progress) => {
          setUploadStates((prev) => ({
            ...prev,
            [fieldName]: { ...prev[fieldName], progress: Math.round(progress) },
          }))
        })

        setUploadStates((prev) => ({
          ...prev,
          [fieldName]: {
            ...prev[fieldName],
            uploading: false,
            uploaded: true,
            progress: 100,
            url: result.url,
          },
        }))
      }
    } catch (error) {
      setUploadStates((prev) => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          uploading: false,
          error: error.message,
        },
      }))
    }
  }

  // Handle form submission with progress
  const handleFormSubmitWithProgress = async (e, submitHandler, formType) => {
    e.preventDefault()

    // Validate subsection selection for products and books
    if (formType === "Product" || formType === "Book") {
      const currentForm = formType === "Product" ? productForm : bookForm
      if (!currentForm?.subSection || currentForm.subSection === "") {
        alert(t("alerts.fillRequiredFields") || "Please select a subsection before creating the " + formType.toLowerCase())
        return
      }
    }

    // Define progress steps
    const steps = [
      { title: t("progressSteps.validatingFormData"), description: t("progressSteps.checkingRequiredFields") },
      { title: t("progressSteps.preparingFiles"), description: t("progressSteps.processingUploadedFiles") },
      { title: t("progressSteps.uploadingFiles"), description: t("progressSteps.sendingFilesToServer") },
      { title: t(`progressSteps.creating${formType}`), description: t(`progressSteps.submitting${formType}Data`) },
      { title: t("progressSteps.finalizing"), description: t("progressSteps.completingProcess") },
    ]

    progressTracker.startProgress(steps, t(`progressSteps.creating${formType}`))

    try {
      // Step 1: Validation
      progressTracker.updateProgress(0, 20)
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Step 2: Prepare files
      progressTracker.updateProgress(1, 40)
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Step 3: Upload files (if any pending)
      progressTracker.updateProgress(2, 60)
      const pendingUploads = Object.entries(uploadStates).filter(
        ([key, state]) => state.file && !state.uploaded && !state.uploading,
      )

      if (pendingUploads.length > 0) {
        for (const [fieldName] of pendingUploads) {
          await handleFileUpload(fieldName)
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Step 4: Submit form
      progressTracker.updateProgress(3, 80)
      await submitHandler(e)
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Step 5: Complete
      progressTracker.updateProgress(4, 100)
      await new Promise((resolve) => setTimeout(resolve, 300))

      progressTracker.completeProgress()

      // Reset upload states after successful submission
      setUploadStates({
        thumbnail: { file: null, uploaded: false, uploading: false, progress: 0, error: null, url: null },
        sample: { file: null, uploaded: false, uploading: false, progress: 0, error: null, url: null },
        gallery: { files: [], uploaded: false, uploading: false, progress: 0, error: null, urls: [] },
      })
    } catch (error) {
      progressTracker.setProgressError(error.message || t("progressSteps.errorDuringSubmission"))
    }
  }

  // Remove uploaded file
  const removeFile = (fieldName) => {
    setUploadStates((prev) => ({
      ...prev,
      [fieldName]: {
        file: null,
        files: [],
        uploaded: false,
        uploading: false,
        progress: 0,
        error: null,
        url: null,
        urls: [],
      },
    }))

    // Clear form field
    if (activeTab === "product") {
      setProductForm?.((prev) => ({ ...prev, [fieldName]: null }))
    } else {
      setBookForm?.((prev) => ({ ...prev, [fieldName]: null }))
    }

    // Clear file input
    const fileInput = document.getElementById(`${activeTab}-${fieldName}`)
    if (fileInput) fileInput.value = ""
  }
  const roleOptions = [t("roles.Student"), t("roles.Parent"), t("roles.Teacher")]


  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = [t("fileSize.bytes"), t("fileSize.kb"), t("fileSize.mb"), t("fileSize.gb")]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Render file upload section
  const renderFileUpload = (fieldName, label, accept, hint, isMultiple = false) => {
    const uploadState = uploadStates[fieldName]
    const hasFile = uploadState.file || (uploadState.files && uploadState.files.length > 0)

    return (
      <div>
        <label className="label">
          <span className="label-text font-medium">{label}</span>
        </label>

        <input
          type="file"
          id={`${activeTab}-${fieldName}`}
          className="file-input file-input-bordered w-full"
          accept={accept}
          multiple={isMultiple}
          onChange={(e) => handleFileSelect(e, fieldName, activeTab)}
        />

        <p className="text-xs mt-1 text-gray-500">{hint}</p>

        {/* File Upload Progress */}
        {hasFile && (
          <div className="mt-3 p-4 bg-base-200 rounded-lg">
            {/* Single File Display */}
            {!isMultiple && uploadState.file && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      {fieldName === "thumbnail" ? (
                        <ImageIcon className="w-5 h-5 text-primary" />
                      ) : (
                        <FileText className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm truncate max-w-48">{uploadState.file.name}</p>
                      <p className="text-xs text-base-content/60">{formatFileSize(uploadState.file.size)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {uploadState.uploaded && (
                      <div className="flex items-center gap-1 text-success">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-xs">{t("fileUpload.uploaded")}</span>
                      </div>
                    )}

                    {!uploadState.uploaded && !uploadState.uploading && (
                      <button
                        type="button"
                        onClick={() => handleFileUpload(fieldName)}
                        className="btn btn-xs btn-primary"
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        {t("fileUpload.upload")}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => removeFile(fieldName)}
                      className="btn btn-xs btn-circle btn-ghost text-error hover:bg-error/10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                {(uploadState.uploading || uploadState.uploaded) && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>{uploadState.uploading ? t("fileUpload.uploading") : t("fileUpload.complete")}</span>
                      <span>{uploadState.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${uploadState.error ? "bg-error" : uploadState.uploaded ? "bg-success" : "bg-primary"
                          }`}
                        style={{ width: `${uploadState.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {uploadState.error && (
                  <div className="text-xs text-error bg-error/10 p-2 rounded">{uploadState.error}</div>
                )}
              </div>
            )}

            {/* Multiple Files Display */}
            {isMultiple && uploadState.files && uploadState.files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{uploadState.files.length} {t("fileUpload.filesSelected")}</p>
                      <p className="text-xs text-base-content/60">
                        {t("fileUpload.total")} {formatFileSize(uploadState.files.reduce((acc, file) => acc + file.size, 0))}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!uploadState.uploaded && !uploadState.uploading && (
                      <button
                        type="button"
                        onClick={() => handleFileUpload(fieldName)}
                        className="btn btn-xs btn-primary"
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        {t("fileUpload.uploadAll")}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => removeFile(fieldName)}
                      className="btn btn-xs btn-circle btn-ghost text-error hover:bg-error/10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Files List */}
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {uploadState.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-xs bg-base-100 p-2 rounded">
                      <span className="truncate flex-1">{file.name}</span>
                      <span className="text-base-content/60 ml-2">{formatFileSize(file.size)}</span>
                    </div>
                  ))}
                </div>

                {/* Progress Bar for Multiple Files */}
                {(uploadState.uploading || uploadState.uploaded) && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>{uploadState.uploading ? t("fileUpload.uploadingFiles") : t("fileUpload.allFilesUploaded")}</span>
                      <span>{uploadState.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${uploadState.error ? "bg-error" : uploadState.uploaded ? "bg-success" : "bg-primary"
                          }`}
                        style={{ width: `${uploadState.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Create Product/Book Form with Tabs */}
        <div className="card shadow-lg relative">
          <div className="card-body p-6">
            {/* Tab Navigation */}
            <div className="tabs tabs-boxed mb-6">
              <button
                className={`tab ${activeTab === "product" ? "tab-active" : ""}`}
                onClick={() => setActiveTab?.("product")}
              >
                {t("forms.createProduct.title") || "Create Product"}
              </button>
              <button
                className={`tab ${activeTab === "book" ? "tab-active" : ""}`}
                onClick={() => setActiveTab?.("book")}
              >
                {t("forms.createBook.title") || "Create Book"}
              </button>
            </div>

            <form
              onSubmit={(e) =>
                handleFormSubmitWithProgress(
                  e,
                  activeTab === "product" ? onCreateProduct : onCreateBook,
                  activeTab === "product" ? "Product" : "Book",
                )
              }
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">
                  {activeTab === "product"
                    ? t("forms.createProduct.title") || "Create Product"
                    : t("forms.createBook.title") || "Create Book"}
                </h3>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : activeTab === "product" ? (
                    t("forms.createProduct.submitButton") || "Create Product"
                  ) : (
                    t("forms.createBook.submitButton") || "Create Book"
                  )}
                </button>
              </div>

              <div className="space-y-4">
                {/* Title Field */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium">{t("forms.createProduct.fields.title") || "Title"} *</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t("forms.createProduct.placeholders.title") || "Enter title"}
                    className="input input-bordered w-full"
                    value={activeTab === "product" ? productForm?.title || "" : bookForm?.title || ""}
                    onChange={(e) => {
                      if (activeTab === "product") {
                        setProductForm?.({ ...productForm, title: e.target.value })
                      } else {
                        setBookForm?.({ ...bookForm, title: e.target.value })
                      }
                    }}
                    required
                  />
                </div>

                {/* Serial Field */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium">
                      {t("forms.createProduct.fields.serial") || "Serial"} *
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder={t("forms.createProduct.placeholders.serial") || "Enter serial"}
                    className="input input-bordered w-full"
                    value={activeTab === "product" ? productForm?.serial || "" : bookForm?.serial || ""}
                    onChange={(e) => {
                      if (activeTab === "product") {
                        setProductForm?.({ ...productForm, serial: e.target.value })
                      } else {
                        setBookForm?.({ ...bookForm, serial: e.target.value })
                      }
                    }}
                    required
                  />
                </div>

                {/* Enhanced File Upload Fields */}
                {renderFileUpload(
                  "thumbnail",
                  t("forms.createProduct.fields.thumbnail") || "Thumbnail *",
                  "image/*",
                  t("forms.createProduct.hints.thumbnail") || "Upload thumbnail image (JPG, PNG, WebP)",
                )}

                {/* Section Field */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium">
                      {t("forms.createProduct.fields.section") || "Section"} *
                    </span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={activeTab === "product" ? productForm?.section || "" : bookForm?.section || ""}
                    onChange={(e) => {
                      const selectedSection = e.target.value
                      if (activeTab === "product") {
                        setProductForm?.({ ...productForm, section: selectedSection, subSection: "" })
                      } else {
                        setBookForm?.({ ...bookForm, section: selectedSection, subSection: "" })
                      }
                    }}
                    required
                  >
                    <option value="">{t("forms.createProduct.placeholders.section") || "Select section"}</option>
                    {(sections || []).map((section) =>
                      section?._id && section?.name ? (
                        <option key={section._id} value={section._id}>
                          {section.name}
                        </option>
                      ) : null,
                    )}
                  </select>
                </div>

                {/* SubSection Field */}
                {((activeTab === "product" && productForm?.section) || (activeTab === "book" && bookForm?.section)) && (
                  <div>
                    <label className="label">
                      <span className="label-text font-medium">
                        {t("forms.createProduct.fields.subSection") || "SubSection"} *
                      </span>
                    </label>
                    <select
                      className={`select select-bordered w-full ${
                        ((activeTab === "product" && productForm?.section && !productForm?.subSection) ||
                         (activeTab === "book" && bookForm?.section && !bookForm?.subSection))
                          ? "select-error border-error"
                          : ""
                      }`}
                      value={activeTab === "product" ? productForm?.subSection || "" : bookForm?.subSection || ""}
                      onChange={(e) => {
                        if (activeTab === "product") {
                          setProductForm?.({ ...productForm, subSection: e.target.value })
                        } else {
                          setBookForm?.({ ...bookForm, subSection: e.target.value })
                        }
                      }}
                      required
                    >
                      <option value="">{t("forms.createProduct.placeholders.subSection") || "Select subsection"}</option>
                      {(subSections || [])
                        .filter((subSection) => {
                          const selectedSectionId = activeTab === "product" ? productForm?.section : bookForm?.section
                          // Handle both ObjectId and string comparisons
                          const subSectionId = subSection?.section?._id || subSection?.section
                          return subSectionId === selectedSectionId
                        })
                        .map((subSection) =>
                          subSection?._id && subSection?.name ? (
                            <option key={subSection._id} value={subSection._id}>
                              {subSection.name}
                            </option>
                          ) : null,
                        )}
                    </select>
                    
                    {/* Validation message */}
                    {((activeTab === "product" && productForm?.section && !productForm?.subSection) ||
                      (activeTab === "book" && bookForm?.section && !bookForm?.subSection)) && (
                      <div className="text-error text-xs mt-1">
                        {t("alerts.subSectionRequired") || "Please select a subsection"}
                      </div>
                    )}
                  </div>
                )}

                {/* Subject field - only for books */}
                {activeTab === "book" && (
                  <div>
                    <label className="label">
                      <span className="label-text font-medium">
                        {t("forms.createBook.fields.subject") || "Subject"} *
                      </span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={bookForm?.subject || ""}
                      onChange={(e) => setBookForm?.({ ...bookForm, subject: e.target.value })}
                      required
                    >
                      <option value="">{t("forms.createBook.placeholders.subject") || "Select subject"}</option>
                      {(subjects || []).map((subject) =>
                        subject?._id && subject?.name ? (
                          <option key={subject._id} value={subject._id}>
                            {subject.name}
                          </option>
                        ) : null,
                      )}
                    </select>
                  </div>
                )}

                {/* Price Field */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium">{t("forms.createProduct.fields.price") || "Price"} *</span>
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="input input-bordered w-full"
                    value={activeTab === "product" ? productForm?.price || "" : bookForm?.price || ""}
                    onChange={(e) => {
                      if (activeTab === "product") {
                        setProductForm?.({ ...productForm, price: e.target.value })
                      } else {
                        setBookForm?.({ ...bookForm, price: e.target.value })
                      }
                    }}
                    required
                  />
                </div>

                {/* price after discount Field */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium">
                      {t("forms.createProduct.fields.priceAfterDiscount") || "Price After Discount"}
                    </span>
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    className="input input-bordered w-full"
                    value={
                      activeTab === "product"
                        ? productForm?.priceAfterDiscount || ""
                        : bookForm?.priceAfterDiscount || ""
                    }
                    onChange={(e) => {
                      if (activeTab === "product") {
                        setProductForm?.({ ...productForm, priceAfterDiscount: e.target.value })
                      } else {
                        setBookForm?.({ ...bookForm, priceAfterDiscount: e.target.value })
                      }
                    }}
                  />
                </div>

                {/* Payment Number Field */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium">
                      {t("forms.createProduct.fields.paymentNumber") || "Payment Number"} *
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder={t("forms.createProduct.placeholders.paymentNumber") || "Enter payment number"}
                    className="input input-bordered w-full"
                    value={activeTab === "product" ? productForm?.paymentNumber || "" : bookForm?.paymentNumber || ""}
                    onChange={(e) => {
                      if (activeTab === "product") {
                        setProductForm?.({ ...productForm, paymentNumber: e.target.value })
                      } else {
                        setBookForm?.({ ...bookForm, paymentNumber: e.target.value })
                      }
                    }}
                    required
                  />
                </div>

                {/* WhatsApp Number field */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium">{t("forms.createProduct.fields.whatsAppNumber")} *</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t("forms.createProduct.placeholders.whatsAppNumber")}
                    className="input input-bordered w-full"
                    value={activeTab === "product" ? productForm?.whatsAppNumber || "" : bookForm?.whatsAppNumber || ""}
                    onChange={(e) => {
                      if (activeTab === "product") {
                        setProductForm?.({ ...productForm, whatsAppNumber: e.target.value })
                      } else {
                        setBookForm?.({ ...bookForm, whatsAppNumber: e.target.value })
                      }
                    }}
                    required
                  />
                  <p className="text-xs mt-1 text-gray-500">{t("forms.createProduct.hints.whatsAppNumber")}</p>
                </div>

                {/* Sample File Upload */}
                {renderFileUpload(
                  "sample",
                  t("forms.createProduct.fields.sampleFile") || "Sample File",
                  ".pdf",
                  t("forms.createProduct.hints.sampleFile") || "Upload sample file (PDF)",
                )}

                {/* Description Field */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium">
                      {activeTab === "product"
                        ? t("forms.createProduct.fields.description")
                        : t("forms.createBook.fields.description")}{" "}
                      *
                    </span>
                  </label>
                  <textarea
                    placeholder={
                      activeTab === "product"
                        ? t("forms.createProduct.placeholders.description")
                        : t("forms.createBook.placeholders.description")
                    }
                    className="textarea textarea-bordered w-full h-32"
                    value={activeTab === "product" ? productForm?.description || "" : bookForm?.description || ""}
                    onChange={(e) => {
                      if (activeTab === "product") {
                        setProductForm?.({ ...productForm, description: e.target.value })
                      } else {
                        setBookForm?.({ ...bookForm, description: e.target.value })
                      }
                    }}
                    required
                  />
                  <p className="text-xs mt-1 text-gray-500">
                    {activeTab === "product"
                      ? t("forms.createProduct.hints.description")
                      : t("forms.createBook.hints.description")}
                  </p>
                </div>
                {
                  renderFileUpload(
                    "gallery",
                    t("forms.createProduct.fields.gallery"),
                    "image/*",
                    t("forms.createProduct.hints.gallery"),
                    true,
                  )}
              </div>

              {/* Decorative elements */}
              <div className={`absolute bottom-4 ${isRTL ? "right-4" : "left-4"}`}>
                <img src="/waves.png" alt="Decorative zigzag" className="w-16 h-full animate-float-zigzag" />
              </div>
            </form>
          </div>
        </div>

        {/* Create Section & SubSection Forms */}
        <div className="card shadow-lg">
          <div className="card-body p-6">
            <div className="grid grid-rows-2 gap-8">
              {/* Create Section Form */}
              <div className="border-b border-base-300 pb-6">
                <form onSubmit={(e) => handleFormSubmitWithProgress(e, onCreateSection, "Section")}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold">{t("forms.createSection.title") || "Create Section"}</h3>
                    <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                      {actionLoading ? (
                        <span className="loading loading-spinner loading-sm"></span>
                      ) : (
                        t("forms.createSection.submitButton") || "Create Section"
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">
                        <span className="label-text font-medium">{t("forms.createSection.fields.name") || "Name"} *</span>
                      </label>
                      <input
                        type="text"
                        placeholder={t("forms.createSection.placeholders.name") || "Enter section name"}
                        className="input input-bordered w-full"
                        value={sectionForm?.name || ""}
                        onChange={(e) => setSectionForm?.({ ...sectionForm, name: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="label">
                        <span className="label-text font-medium">
                          {t("forms.createSection.fields.number") || "Number"} *
                        </span>
                      </label>
                      <input
                        type="number"
                        placeholder={t("forms.createSection.placeholders.number") || "Enter section number"}
                        className="input input-bordered w-full"
                        value={sectionForm?.number || ""}
                        onChange={(e) => setSectionForm?.({ ...sectionForm, number: e.target.value })}
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="label">
                        <span className="label-text font-medium">
                          {t("forms.createSection.fields.description") || "Description"} *
                        </span>
                      </label>
                      <textarea
                        placeholder={t("forms.createSection.placeholders.description") || "Enter section description"}
                        className="textarea textarea-bordered w-full h-24"
                        value={sectionForm?.description || ""}
                        onChange={(e) => setSectionForm?.({ ...sectionForm, description: e.target.value })}
                        required
                      ></textarea>
                    </div>

                    {/* Allowed Roles */}
                    <div className="md:col-span-2">
                      <label className="label">
                        <span className="label-text font-medium">
                          {t("forms.createSection.fields.allowedRoles") || "Allowed Roles"}
                        </span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {roleOptions.map((role) => (
                          <label key={role} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              className="checkbox checkbox-primary"
                              checked={sectionForm?.allowedFor?.includes(role)}
                              onChange={(e) => {
                                const checked = e.target.checked
                                const updatedRoles = checked
                                  ? [...(sectionForm?.allowedFor || []), role]
                                  : sectionForm?.allowedFor?.filter((r) => r !== role)

                                setSectionForm?.((prev) => ({
                                  ...prev,
                                  allowedFor: updatedRoles,
                                }))
                              }}
                            />
                            <span>{role}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Create SubSection Form */}
              <div className="pt-2">
                <form onSubmit={(e) => handleFormSubmitWithProgress(e, onCreateSubSection, "SubSection")}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold">{t("forms.createSubSection.title") || "Create SubSection"}</h3>
                    <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                      {actionLoading ? (
                        <span className="loading loading-spinner loading-sm"></span>
                      ) : (
                        t("forms.createSubSection.submitButton") || "Create SubSection"
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">
                        <span className="label-text font-medium">{t("forms.createSubSection.fields.name") || "Name"} *</span>
                      </label>
                      <input
                        type="text"
                        placeholder={t("forms.createSubSection.placeholders.name") || "Enter subsection name"}
                        className="input input-bordered w-full"
                        value={subSectionForm?.name || ""}
                        onChange={(e) => setSubSectionForm?.({ ...subSectionForm, name: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="label">
                        <span className="label-text font-medium">
                          {t("forms.createSubSection.fields.section") || "Parent Section"} *
                        </span>
                      </label>
                      <select
                        className="select select-bordered w-full"
                        value={subSectionForm?.section || ""}
                        onChange={(e) => setSubSectionForm?.({ ...subSectionForm, section: e.target.value })}
                        required
                      >
                        <option value="">{t("forms.createSubSection.placeholders.section") || "Select parent section"}</option>
                        {sections.map((section) => (
                          <option key={section._id} value={section._id}>
                            {section.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Arrow decoration */}
            <div className="flex justify-center mt-6">
              <img src="/vector22.png" alt="Decorative arrow" className="w-15 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Progress Bar Modal */}
      <EnhancedProgressBar
        isVisible={progressTracker.isVisible}
        title={t(`progressSteps.creating${activeTab === "product" ? "Product" : activeTab === "book" ? "Book" : activeTab === "section" ? "Section" : "SubSection"}`)}
        steps={progressTracker.steps}
        currentStep={progressTracker.currentStep}
        progress={progressTracker.progress}
        error={progressTracker.error}
        onCancel={progressTracker.hideProgress}
      />
    </>
  )
}

export default EnhancedAdminForms
