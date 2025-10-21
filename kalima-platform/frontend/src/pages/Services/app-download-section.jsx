"use client"

import { useTranslation } from "react-i18next"
import { useState, useEffect, useRef } from "react"
import QRCode from "qrcode"

export function AppDownloadSection() {
  const { t, i18n } = useTranslation("home")
  const isRTL = i18n.language === "ar"
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const appDownloadUrl = "https://play.google.com/apps/test/com.kalimatest.mavoid/8"
  const qrCodeRef = useRef(null)

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Generate QR code as data URL
        const dataUrl = await QRCode.toDataURL(appDownloadUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        })

        setQrCodeDataUrl(dataUrl)
        setIsLoading(false)
      } catch (err) {
        console.error("Error generating QR code:", err)
        setError("Failed to generate QR code")
        setIsLoading(false)
      }
    }

    generateQRCode()
  }, [appDownloadUrl])

  return (
    <div className="w-full py-16 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Yellow border overlay */}
        <div className="absolute inset-0 border-4 border-primary rounded-[3rem] -z-0"></div>

        {/* Blue accent dots */}
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full border-4 border-dashed border-blue-500 opacity-30 -translate-y-1/4 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full border-4 border-dashed border-blue-500 opacity-30 translate-y-1/4 -translate-x-1/4"></div>

        <div className="relative z-10 py-8 md:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
            {/* Text Content */}
            <div className={`text-center md:text-left md:w-1/2 ${isRTL ? "md:order-2" : "md:order-1"}`}>
              <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${isRTL ? "text-right" : "text-left"}`}>
                <span>{t("appDownload.title") || "Download"}</span>{" "}
                <span>{t("appDownload.now") || "Our App Now"}</span>
              </h2>

              <p className={`text-lg md:text-xl mb-6 ${isRTL ? "text-right" : "text-left"}`}>
                {t("appDownload.content1") || "Best free educational app. Download our app"}{" "}
                <span className="text-primary">{t("appDownload.now") || "now"}</span>{" "}
                {t("appDownload.content2") || "on your mobile to learn"}{" "}
                <span className="text-primary">{t("appDownload.everywhere") || "everywhere"}</span>
              </p>
            </div>

            {/* QR Code Section */}
            <div className={`md:w-1/2 flex justify-center ${isRTL ? "md:order-1" : "md:order-2"}`}>
              <div className="relative p-2 bg-white rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105">
                {isLoading ? (
                  <div className="h-48 w-48 md:h-64 md:w-64 flex items-center justify-center bg-gray-100">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : error ? (
                  <div className="h-48 w-48 md:h-64 md:w-64 flex items-center justify-center bg-gray-100 text-red-500">
                    <div className="text-center p-4">
                      <p>{error}</p>
                      <button
                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={() => {
                          setIsLoading(true)
                          QRCode.toDataURL(appDownloadUrl, {
                            width: 300,
                            margin: 2,
                          })
                            .then((url) => {
                              setQrCodeDataUrl(url)
                              setIsLoading(false)
                              setError(null)
                            })
                            .catch((err) => {
                              setError("Failed to generate QR code")
                              setIsLoading(false)
                            })
                        }}
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative group">
                    <img
                      ref={qrCodeRef}
                      src={qrCodeDataUrl || "/placeholder.svg"}
                      alt="Download App QR Code"
                      className="h-48 w-48 md:h-64 md:w-64 object-contain"
                    />
                  </div>
                )}

                {/* Decorative elements */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-secondary rounded-full"></div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-secondary rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
