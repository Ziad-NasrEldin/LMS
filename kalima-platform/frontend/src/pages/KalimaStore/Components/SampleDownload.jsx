"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"

const SampleDownload = ({ sample, title, type, isRTL }) => {
  const { t } = useTranslation("kalimaStore-ProductDetails")
  const [downloadLoading, setDownloadLoading] = useState(false)

  // Helper to convert local path to full URL
  const convertPathToUrl = (filePath) => {
    if (!filePath) return null
    if (filePath.startsWith("http")) return filePath

    const normalizedPath = filePath.replace(/\\/g, "/")
    const API_URL = import.meta.env.VITE_API_URL || window.location.origin
    const baseUrl = API_URL.replace(/\/$/, "")
    const filename = normalizedPath.split("/").pop()

    return `${baseUrl}/uploads/docs/${filename}`
  }
// dummy comment to re-commit
  const fileUrl = convertPathToUrl(sample)

  const handleDownloadSample = async () => {
    if (!fileUrl) return

    try {
      setDownloadLoading(true)

      const response = await fetch(fileUrl)
      const blob = await response.blob()

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url

      const sanitizedTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase()
      link.download = `${sanitizedTitle}_sample.pdf`

      document.body.appendChild(link)
      link.click()

      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download failed:", error)
      alert("Failed to download sample. Please try again.")
    } finally {
      setDownloadLoading(false)
    }
  }

  if (!sample) {
    return (
      <div className="w-full mt-6">
        <div className="card bg-base-200 border-2 border-dashed border-base-300">
          <div className="card-body text-center">
            <div className="text-6xl mb-4">📄</div>
            <h5 className="text-lg font-semibold mb-2">{t("sample.noSample")}</h5>
            <p className="text-base-content/70">
              {t("sample.noSampleDesc", { type: t(type === "book" ? "product.types.book" : "product.types.product") })}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full mt-6">
      <div className="card bg-base-100 shadow-lg">
        <div className="card-header px-6 py-4 border-b border-base-200">
          <h4 className="text-lg font-semibold flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m-6 4h8" />
            </svg>
            {t("sample.available")}
          </h4>
        </div>

        <div className="card-body text-center">
          <div className="text-6xl mb-4">📋</div>
          <h5 className="text-xl font-semibold mb-2">{t("sample.pdf")}</h5>
          <p className="mb-6 leading-relaxed">
            {t("sample.downloadDesc", { type: t(type === "book" ? "product.types.book" : "product.types.product") })}
          </p>

          <button onClick={handleDownloadSample} disabled={downloadLoading} className="btn btn-primary btn-lg">
            {downloadLoading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                {t("sample.downloading")}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-4-4m4 4l4-4m-6 4h8"
                  />
                </svg>
                {t("sample.downloadButton")}
              </>
            )}
          </button>

          <div className="alert alert-info mt-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm">
              {t("sample.fileWillBeDownloadedAs", { filename: title.replace(/[^a-z0-9]/gi, "_").toLowerCase() + "_sample.pdf" })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SampleDownload
