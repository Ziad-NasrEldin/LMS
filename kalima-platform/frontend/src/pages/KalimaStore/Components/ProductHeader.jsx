"use client"

import { useTranslation } from "react-i18next"

const ProductHeader = ({ onBack, isRTL }) => {
  const { t } = useTranslation("kalimaStore-ProductDetails")

  return (
    <div className="py-6 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="btn btn-ghost gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ transform: isRTL ? "rotate(180deg)" : "none" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t("navigation.back")}
          </button>
          <h1 className="text-2xl font-bold">{t("header.purchaseDetails")}</h1>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>
      </div>
    </div>
  )
}
// dummy comment to re-commit
export default ProductHeader
