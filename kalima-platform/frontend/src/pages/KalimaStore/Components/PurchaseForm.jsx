"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { BookOpen, Clock, Trash2 } from "lucide-react"

const PurchaseForm = ({
  type,
  purchaseForm,
  setPurchaseForm,
  uploadedFile,
  setUploadedFile,
  onSubmit,
  purchaseLoading,
  // Updated props for coupon functionality
  productPrice, // The absolute original price
  displayPrice, // The price before coupon (could be priceAfterDiscount)
  finalPrice, // The price after coupon
  couponCode,
  setCouponCode,
  onValidateCoupon,
  onRemoveCoupon,
  couponValidation,
}) => {
  const [dragActive, setDragActive] = useState(false)
  const { t } = useTranslation("kalimaStore-ProductDetails")
// dummy comment to re-commit
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0])
    }
  }

  const hasInitialDiscount = displayPrice < productPrice

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">{t("purchaseForm.title")}</h2>
        <p className="text-lg">{t("purchaseForm.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Form Fields */}
        <div className="space-y-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">{t("purchaseForm.transferNumber")}</span>
            </label>
            <input
              type="text"
              placeholder={t("purchaseForm.transferNumberPlaceholder")}
              className="input input-bordered input-lg"
              value={purchaseForm.numberTransferredFrom}
              onChange={(e) => setPurchaseForm({ ...purchaseForm, numberTransferredFrom: e.target.value })}
              required
            />
            <label className="label">
              <span className="label-text-alt">{t("purchaseForm.transferNumberHint")}</span>
            </label>
          </div>

          {type === "book" && (
            <div className="card bg-info text-info-content">
              <div className="card-body">
                <h3 className="card-title">
                  <BookOpen className="w-5 h-5" />
                  {t("purchaseForm.bookPersonalization")}
                </h3>
                <div className="space-y-4">
                  {/* Book fields remain the same */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">{t("purchaseForm.nameOnBook")}</span>
                    </label>
                    <input
                      type="text"
                      placeholder={t("purchaseForm.nameOnBookPlaceholder")}
                      className="input input-bordered bg-base-100 text-base-content"
                      value={purchaseForm.nameOnBook}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, nameOnBook: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">{t("purchaseForm.numberOnBook")}</span>
                    </label>
                    <input
                      type="text"
                      placeholder={t("purchaseForm.numberOnBookPlaceholder")}
                      className="input input-bordered bg-base-100 text-base-content"
                      value={purchaseForm.numberOnBook}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, numberOnBook: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">{t("purchaseForm.seriesName")}</span>
                    </label>
                    <input
                      type="text"
                      placeholder={t("purchaseForm.seriesNamePlaceholder")}
                      className="input input-bordered bg-base-100 text-base-content"
                      value={purchaseForm.seriesName}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, seriesName: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">{t("purchaseForm.notes")}</span>
            </label>
            <textarea
              placeholder={t("purchaseForm.notesPlaceholder")}
              className="textarea textarea-bordered h-24"
              value={purchaseForm.notes}
              onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
            ></textarea>
          </div>
        </div>

        {/* Right Column: Upload & Coupon */}
        <div className="space-y-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">{t("purchaseForm.paymentScreenshot")}</span>
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${dragActive ? "border-primary bg-primary/10" : uploadedFile ? "border-success bg-success/10" : "border-base-300 bg-base-200 hover:bg-base-300"}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {/* File upload UI remains the same */}
              <div className="space-y-4">
                <div className="text-6xl">{uploadedFile ? "✅" : "📤"}</div>
                {uploadedFile ? (
                  <div className="space-y-3">
                    <p className="font-semibold text-success">{t("purchaseForm.fileUploaded")}</p>
                    <p className="text-sm bg-base-100 rounded-lg px-3 py-2 inline-block">📎 {uploadedFile.name}</p>
                    <button onClick={() => setUploadedFile(null)} className="btn btn-error btn-sm">
                      {t("purchaseForm.removeFile")}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <p className="text-lg font-medium">{t("purchaseForm.dragDrop")}</p>
                      <p className="text-sm opacity-70">{t("purchaseForm.orBrowse")}</p>
                    </div>
                    <div className="text-xs opacity-50">{t("purchaseForm.maxFileSize")}</div>
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="file-upload" className="btn btn-outline cursor-pointer">
                      {t("purchaseForm.chooseFile")}
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Coupon Code Section */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">{t("purchaseForm.couponCode", "Coupon Code")}</span>
            </label>
            <div className="join w-full">
              <input
                type="text"
                placeholder={t("purchaseForm.couponCodePlaceholder", "Enter coupon")}
                className="input input-bordered join-item w-full"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                disabled={couponValidation.isValid || couponValidation.loading}
              />
              {couponValidation.isValid ? (
                <button onClick={onRemoveCoupon} className="btn join-item btn-ghost" aria-label="Remove coupon">
                  <Trash2 className="w-5 h-5" />
                </button>
              ) : (
                <button
                  className="btn btn-outline join-item"
                  onClick={onValidateCoupon}
                  disabled={couponValidation.loading || !couponCode}
                >
                  {couponValidation.loading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    t("purchaseForm.applyCoupon", "Apply")
                  )}
                </button>
              )}
            </div>
            {couponValidation.message && (
              <label className="label">
                <span className={`label-text-alt ${couponValidation.isValid ? "text-success" : "text-error"}`}>
                  {couponValidation.message}
                </span>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Price Summary & Submit */}
      <div className="mt-8">
        <div className="max-w-md mx-auto">
          <div className="p-6 bg-base-200 rounded-lg space-y-3">
            <h3 className="text-xl font-bold text-center mb-4">{t("purchaseForm.priceSummary", "Price Summary")}</h3>

            {hasInitialDiscount ? (
              <>
                <div className="flex justify-between text-lg">
                  <span>{t("purchaseForm.originalPrice", "Original Price")}</span>
                  <span className="line-through text-gray-500">{productPrice?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span>{t("purchaseForm.discountedPrice")}</span>
                  <span>{displayPrice?.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-lg">
                <span>{t("purchaseForm.price", "Price")}</span>
                <span>{productPrice?.toFixed(2)}</span>
              </div>
            )}

            {couponValidation.isValid && (
              <div className="flex justify-between text-lg text-success">
                <span>
                  {t("purchaseForm.couponDiscount", "Coupon Discount")}
                  {displayPrice && couponValidation.discount ? (
                    <span className="ml-1 text-sm font-bold">
                      ({((couponValidation.discount / displayPrice) * 100).toFixed(1)}%)
                    </span>
                  ) : null}
                </span>
                <span>-{couponValidation.discount?.toFixed(2)}</span>
              </div>
            )}
            <div className="divider my-2"></div>
            <div className="flex justify-between text-2xl font-bold">
              <span>{t("purchaseForm.total", "Total")}</span>
              <span>{finalPrice?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={onSubmit}
            className="btn btn-primary btn-lg px-12"
            disabled={!uploadedFile || !purchaseForm.numberTransferredFrom || purchaseLoading}
          >
            {purchaseLoading ? <span className="loading loading-spinner loading-sm"></span> : t("purchaseForm.submit")}
          </button>
        </div>
      </div>

      <div className="alert alert-info mt-8">
        <Clock className="w-6 h-6" />
        <div>
          <h4 className="font-semibold">{t("purchaseForm.processingTimeTitle")}</h4>
          <p>
            {t("purchaseForm.processingTimeDesc")} <strong>1-2 {t("purchaseForm.hours")}</strong>
          </p>
        </div>
      </div>
    </div>
  )
}

export default PurchaseForm
