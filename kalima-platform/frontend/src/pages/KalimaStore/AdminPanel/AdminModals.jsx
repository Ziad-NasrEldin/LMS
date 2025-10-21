"use client"
import { useTranslation } from "react-i18next"

const AdminModals = ({
  // Edit Section Modal
  showEditModal,
  setShowEditModal,
  editingSection,
  setEditingSection,
  sectionForm,
  setSectionForm,
  onUpdateSection,

  // Edit SubSection Modal
  showEditSubSectionModal,
  setShowEditSubSectionModal,
  editingSubSection,
  setEditingSubSection,
  subSectionForm,
  setSubSectionForm,
  onUpdateSubSection,

  // Edit Product Modal
  showEditProductModal,
  setShowEditProductModal,
  editingProduct,
  setEditingProduct,
  productForm,
  setProductForm,
  onUpdateProduct,
  sections = [],
  subjects = [],
  onFileChange,

  // Delete Section Modal
  showDeleteModal,
  setShowDeleteModal,
  sectionToDelete,
  setSectionToDelete,
  onDeleteSection,

  // Delete SubSection Modal
  showDeleteSubSectionModal,
  setShowDeleteSubSectionModal,
  subSectionToDelete,
  setSubSectionToDelete,
  onDeleteSubSection,

  // Delete Product Modal
  showDeleteProductModal,
  setShowDeleteProductModal,
  productToDelete,
  setProductToDelete,
  onDeleteProduct,

  actionLoading,
}) => {
  const { t } = useTranslation("kalimaStore-admin")

  const resetSectionForm = () => {
    setSectionForm?.({
      name: "",
      description: "",
      number: "",
      thumbnail: "logo",
    })
  }

  const resetSubSectionForm = () => {
    setSubSectionForm?.({
      name: "",
      section: "",
    })
  }

  const resetProductForm = () => {
    setProductForm?.({
      title: "",
      serial: "",
      section: "",
      price: "",
      discountPercentage: "",
      paymentNumber: "",
      whatsAppNumber: "",
      description: "",
      thumbnail: null,
      sample: null,
      gallery: [],
    })
  }

  return (
    <>
      {/* Edit Section Modal */}
      {showEditModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">{t("modals.editSection.title") || "Edit Section"}</h3>
            <form onSubmit={onUpdateSection}>
              <div className="space-y-4">
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

                <div>
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

                <div>
                  <label className="label">
                    <span className="label-text font-medium">
                      {t("forms.createSection.fields.thumbnail") || "Thumbnail"}
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder={t("forms.createSection.placeholders.thumbnail") || "Enter thumbnail"}
                    className="input input-bordered w-full"
                    value={sectionForm?.thumbnail || ""}
                    onChange={(e) => setSectionForm?.({ ...sectionForm, thumbnail: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowEditModal?.(false)
                    setEditingSection?.(null)
                    resetSectionForm()
                  }}
                >
                  {t("modals.editSection.cancelButton") || "Cancel"}
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    t("modals.editSection.updateButton") || "Update"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

            {/* Edit Item Modal (Product or Book) */}
            {showEditProductModal && (
              <div className="modal modal-open">
                <div className="modal-box max-w-2xl">
                  <h3 className="font-bold text-lg mb-4">
                  {t("modals.editProduct.title") || "Edit Product"}
                  </h3>

                  <form onSubmit={onUpdateProduct}>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {/* Title */}
                      <div>
                        <label className="label">
                          <span className="label-text font-medium">{t("forms.createProduct.fields.title") || "Title"} *</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          value={productForm?.title || ""}
                          onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                          required
                        />
                      </div>

                      {/* Serial */}
                      <div>
                        <label className="label">
                          <span className="label-text font-medium">{t("forms.createProduct.fields.serial") || "Serial"} *</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          value={productForm?.serial || ""}
                          onChange={(e) => setProductForm({ ...productForm, serial: e.target.value })}
                          required
                        />
                      </div>

                      {/* Section */}
                      <div>
                        <label className="label">
                          <span className="label-text font-medium">{t("forms.createProduct.fields.section") || "Section"} *</span>
                        </label>
                        <select
                          className="select select-bordered w-full"
                          value={productForm?.section || ""}
                          onChange={(e) => setProductForm({ ...productForm, section: e.target.value })}
                          required
                        >
                          <option value="">{t("forms.createProduct.placeholders.section") || "Select section"}</option>
                          {(sections || []).map((s) =>
                            s?._id && s?.name ? (
                              <option key={s._id} value={s._id}>
                                {s.name}
                              </option>
                            ) : null
                          )}
                        </select>
                      </div>

                      {/* Price */}
                      <div>
                        <label className="label">
                          <span className="label-text font-medium">{t("forms.createProduct.fields.price") || "Price"} *</span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered w-full"
                          value={productForm?.price || ""}
                          onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                          required
                        />
                      </div>

                      {/* Price After Discount (shared for both) */}
                      <div>
                        <label className="label">
                          <span className="label-text font-medium">{t("forms.createProduct.fields.priceAfterDiscount") || "Price After Discount"}</span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered w-full"
                          value={productForm?.priceAfterDiscount || ""}
                          onChange={(e) => setProductForm({ ...productForm, priceAfterDiscount: e.target.value })}
                        />
                      </div>

                      {/* Book-only → Subject */}
                      {editingProduct?.__t === "ECBook" && (
                        <div>
                          <label className="label">
                            <span className="label-text font-medium">{t("forms.createBook.fields.subject") || "Subject"} *</span>
                          </label>
                          <select
                            className="select select-bordered w-full"
                            value={productForm?.subject || ""}
                            onChange={(e) => setProductForm({ ...productForm, subject: e.target.value })}
                            required
                          >
                            <option value="">{t("forms.createBook.placeholders.subject") || "Select subject"}</option>
                            {(subjects || []).map((subj) =>
                              subj?._id && subj?.name ? (
                                <option key={subj._id} value={subj._id}>
                                  {subj.name}
                                </option>
                              ) : null
                            )}
                          </select>
                        </div>
                      )}

                      {/* Payment Number */}
                      <div>
                        <label className="label">
                          <span className="label-text font-medium">{t("forms.createProduct.fields.paymentNumber") || "Payment Number"} *</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          value={productForm?.paymentNumber || ""}
                          onChange={(e) => setProductForm({ ...productForm, paymentNumber: e.target.value })}
                          required
                        />
                      </div>

                      {/* WhatsApp Number */}
                      <div>
                        <label className="label">
                          <span className="label-text font-medium">{t("forms.createProduct.fields.whatsAppNumber") || "WhatsApp Number"} *</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          value={productForm?.whatsAppNumber || ""}
                          onChange={(e) => setProductForm({ ...productForm, whatsAppNumber: e.target.value })}
                          required
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="label">
                          <span className="label-text font-medium">{t("forms.createProduct.fields.description") || "Description"} *</span>
                        </label>
                        <textarea
                          className="textarea textarea-bordered w-full h-24"
                          value={productForm?.description || ""}
                          onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                          required
                        />
                      </div>

                      {/* Files */}
                      <div>
                        <label className="label">
                          <span className="label-text font-medium">{t("forms.createProduct.fields.thumbnail") || "Thumbnail"}</span>
                        </label>
                        <input
                          type="file"
                          className="file-input file-input-bordered w-full"
                          accept="image/*"
                          onChange={(e) => onFileChange?.(e, "thumbnail")}
                        />
                      </div>

                      <div>
                        <label className="label">
                          <span className="label-text font-medium">{t("forms.createProduct.fields.sampleFile") || "Sample File"}</span>
                        </label>
                        <input
                          type="file"
                          className="file-input file-input-bordered w-full"
                          onChange={(e) => onFileChange?.(e, "sample")}
                        />
                      </div>

                      <div>
                        <label className="label">
                          <span className="label-text font-medium">{t("forms.createProduct.fields.gallery") || "Gallery"}</span>
                        </label>
                        <input
                          type="file"
                          className="file-input file-input-bordered w-full"
                          accept="image/*"
                          multiple
                          onChange={(e) => onFileChange?.(e, "gallery")}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="modal-action">
                      <button
                        type="button"
                        className="btn"
                        onClick={() => {
                          setShowEditProductModal?.(false)
                          setEditingProduct?.(null)
                          resetProductForm()
                        }}
                      >
                        {t("common.cancel") || "Cancel"}
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                        {actionLoading ? (
                          <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                          t("common.update") || "Update"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}


      {/* Delete Section Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">{t("modals.deleteSection.title") || "Confirm Delete"}</h3>
            <p className="py-4">
              {t("modals.deleteSection.message", { sectionName: sectionToDelete?.name || t("unknown") }) ||
                `Are you sure you want to delete the section "${sectionToDelete?.name || t("unknown")}"? This action cannot be undone.`}
            </p>
            <div className="modal-action">
              <button
                className="btn"
                onClick={() => {
                  setShowDeleteModal?.(false)
                  setSectionToDelete?.(null)
                }}
              >
                {t("modals.deleteSection.cancelButton") || "Cancel"}
              </button>
              <button className="btn btn-error" onClick={onDeleteSection} disabled={actionLoading}>
                {actionLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  t("modals.deleteSection.deleteButton") || "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {showDeleteProductModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">{t("modals.deleteProduct.title") || "Confirm Delete"}</h3>
            <p className="py-4">
              {t("modals.deleteProduct.message", { productName: productToDelete?.title || t("unknown") }) ||
                `Are you sure you want to delete the product "${productToDelete?.title || t("unknown")}"? This action cannot be undone.`}
            </p>
            <div className="modal-action">
              <button
                className="btn"
                onClick={() => {
                  setShowDeleteProductModal?.(false)
                  setProductToDelete?.(null)
                }}
              >
                {t("modals.deleteProduct.cancelButton") || "Cancel"}
              </button>
              <button className="btn btn-error" onClick={onDeleteProduct} disabled={actionLoading}>
                {actionLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  t("modals.deleteProduct.deleteButton") || "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ Edit SubSection Modal ============ */}
      {showEditSubSectionModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg mb-4">
              {t("modals.editSubSection.title") || "Edit SubSection"}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                onUpdateSubSection?.()
              }}
            >
              <div className="space-y-4">
                {/* SubSection Name */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium">
                      {t("forms.createSubSection.fields.name") || "SubSection Name"} *
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={subSectionForm?.name || ""}
                    onChange={(e) => setSubSectionForm({ ...subSectionForm, name: e.target.value })}
                    required
                  />
                </div>

                {/* Parent Section */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium">
                      {t("forms.createSubSection.fields.section") || "Parent Section"} *
                    </span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={subSectionForm?.section || ""}
                    onChange={(e) => setSubSectionForm({ ...subSectionForm, section: e.target.value })}
                    required
                  >
                    <option value="">
                      {t("forms.createSubSection.placeholders.section") || "Select parent section"}
                    </option>
                    {(sections || []).map((section) =>
                      section?._id && section?.name ? (
                        <option key={section._id} value={section._id}>
                          {section.name}
                        </option>
                      ) : null
                    )}
                  </select>
                </div>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowEditSubSectionModal?.(false)
                    resetSubSectionForm?.()
                  }}
                >
                  {t("modals.editSubSection.cancelButton") || "Cancel"}
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    t("modals.editSubSection.updateButton") || "Update SubSection"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ Delete SubSection Modal ============ */}
      {showDeleteSubSectionModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              {t("modals.deleteSubSection.title") || "Delete SubSection"}
            </h3>
            <p className="py-4">
              {t("modals.deleteSubSection.message") || 
                `Are you sure you want to delete the subsection "${editingSubSection?.name}"? This action cannot be undone.`}
            </p>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowDeleteSubSectionModal?.(false)
                  setEditingSubSection?.(null)
                }}
              >
                {t("modals.deleteSubSection.cancelButton") || "Cancel"}
              </button>
              <button className="btn btn-error" onClick={onDeleteSubSection} disabled={actionLoading}>
                {actionLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  t("modals.deleteSubSection.deleteButton") || "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AdminModals
