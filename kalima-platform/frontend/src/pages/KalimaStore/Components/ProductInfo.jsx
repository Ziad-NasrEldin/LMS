"use client"

import { useTranslation } from "react-i18next"
import { FaWhatsapp } from "react-icons/fa"

const ProductInfo = ({ product, type, isRTL }) => {
  const { t } = useTranslation("kalimaStore-ProductDetails")

  // Determine actual type from product data
  const getActualType = () => {
    if (product && product.__t === "ECBook") {
      return "book"
    }
    return "product"
  }

  const actualType = getActualType()
// dummy comment to re-commit
  const getItemCategory = () => {
    if (actualType === "book" && product.subject) {
      return product.subject.name || product.subject
    }
    if (product.section && product.section.name) {
      return product.section.name
    }
    return actualType === "book" ? t("product.types.book") : t("product.types.product")
  }

  const getDisplayPrice = () => {
    if (product.priceAfterDiscount && product.priceAfterDiscount < product.price) {
      return product.priceAfterDiscount
    }
    return product.price
  }

  const hasDiscount = () => {
    return product.priceAfterDiscount && product.priceAfterDiscount < product.price
  }

  return (
    <div className="space-y-8">
      {/* Product Title */}
      <div>
        <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
        <div className="flex flex-wrap gap-2">
          <div className={`badge ${actualType === "book" ? "badge-success" : "badge-info"}`}>
            {actualType === "book" ? `📚 ${t("product.types.book")}` : `📦 ${t("product.types.product")}`}
          </div>
          <div className="badge badge-outline">{getItemCategory()}</div>
        </div>
      </div>

      {/* Product Details */}
      <div className="space-y-4">

        {product.description && (
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="font-semibold">{t("product.description")}</span>
              </div>
              <p className="leading-relaxed">{product.description}</p>
            </div>
          </div>
        )}

        {/* Subject info for books */}
        {actualType === "book" && product.subject && (
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <span className="font-semibold">{t("product.subject")}</span>
              </div>
              <p className="text-lg">{product.subject.name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Section */}
      <div className="card bg-primary text-primary-content">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">{t("product.price")}</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold">
                  {getDisplayPrice()} {t("product.currency")}
                </span>
                {hasDiscount() && (
                  <span className="text-lg line-through opacity-70">
                    {product.price} {t("product.currency")}
                  </span>
                )}
              </div>
            </div>

            {hasDiscount() && (
              <div className="text-right">
                <div className="badge badge-error badge-lg font-bold">{product.discountPercentage}% {t("product.off")}</div>
                <p className="text-sm opacity-90 mt-1">
                  {t("product.save", { amount: (product.price - getDisplayPrice()).toFixed(2), currency: t("product.currency") })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card bg-success text-success-content">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-semibold">{t("product.instantAccess")}</p>
                <p className="text-sm opacity-90">{t("product.downloadImmediately")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-info text-info-content">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <div>
                <p className="font-semibold">{t("product.securePayment")}</p>
                <p className="text-sm opacity-90">{t("product.safeProtected")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductInfo
