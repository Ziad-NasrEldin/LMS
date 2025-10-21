"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { FaWhatsapp } from "react-icons/fa"

const PaymentSection = ({ paymentNumber, isRTL, whatsAppNumber }) => {
  const { t } = useTranslation("kalimaStore-ProductDetails")
  const [copySuccess, setCopySuccess] = useState(false)

  const handleCopyNumber = async () => {
    try {
      await navigator.clipboard.writeText(paymentNumber)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error(t("errors.copyFailed"), err)
    }
  }
// dummy comment to re-commit
  return (
    <div className="text-center space-y-8">
      {/* Section Header */}
      <div>
        <h2 className="text-3xl font-bold mb-4">{t("paymentSection.title")}</h2>
        <p className="text-lg">{t("paymentSection.subtitle")}</p>
      </div>

      {/* Payment Number Card */}
      <div className="card bg-primary text-primary-content">
        <div className="card-body">
          <p className="text-sm opacity-90 mb-2">{t("paymentSection.paymentNumber")}</p>
          <button
            onClick={handleCopyNumber}
            className={`btn btn-lg font-mono text-2xl ${copySuccess ? "btn-success" : "btn-ghost bg-base-100 text-base-content hover:bg-base-200"
              }`}
          >
            {paymentNumber}
            <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
          {copySuccess && <p className="text-sm opacity-90 mt-2">{t("paymentSection.copied")}</p>}
          <p className="opacity-90 mt-2">{t("paymentSection.copyHint")}</p>
        </div>
      </div>

      {/* Purchase Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="flex items-start gap-4">
              <div className="badge badge-primary badge-lg">1</div>
              <div className="text-left">
                <h3 className="font-semibold mb-2">{t("paymentSection.step1.title")}</h3>
                <p>{t("paymentSection.step1.desc")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="flex items-start gap-4">
              <div className="badge badge-secondary badge-lg">2</div>
              <div className="text-left">
                <h3 className="font-semibold mb-2">{t("paymentSection.step2.title")}</h3>
                <p>{t("paymentSection.step2.desc")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body p-4">
          <div className="flex items-center gap-2 mb-2">
            <FaWhatsapp className="w-5 h-5 text-green-500" />
            <span className="font-semibold">{t("product.whatsapp")}</span>
          </div>
          <p className="font-mono text-lg">{whatsAppNumber}</p>
        </div>
      </div>

      {/* Additional Info */}
      <div className="alert alert-warning">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <h4 className="font-semibold">{t("paymentSection.noteTitle")}</h4>
          <p>{t("paymentSection.noteDesc")}</p>
        </div>
      </div>
    </div>
  )
}

export default PaymentSection
