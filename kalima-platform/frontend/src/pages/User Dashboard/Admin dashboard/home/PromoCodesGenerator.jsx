"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import toast from "react-hot-toast"
import { Ticket, Copy, Check, AlertCircle, Download, Printer } from 'lucide-react'
import JSZip from "jszip"
import { generatePromoCodes, getPromoCodeTemplates, uploadPromoCodeTemplate } from "../../../../routes/codes"
import { getAllLecturers } from "../../../../routes/fetch-users"
import QRCode from "qrcode"
import { designTokens } from "../../../../constants/designTokens"
import { translateErrorMessage } from "../../../../utils/errorTranslator"
import DSSelect from "../../../../components/DSSelect"
import Button from "../../../../components/ui/Button"
import Input from "../../../../components/ui/Input"

const PROMO_TEMPLATE_WIDTH = 392
const PROMO_TEMPLATE_HEIGHT = 210
const DEFAULT_PROMO_TEMPLATE_URL = "/promocodes/promocode-template.png"

const PromoCodeGenerator = () => {
  const { t, i18n } = useTranslation("admin")
  const isRTL = i18n.language === "ar"
  const dir = isRTL ? "rtl" : "ltr"
  const iconInlineGap = isRTL ? "ml-1" : "mr-1"
  const spinnerInlineGap = isRTL ? "ml-2" : "mr-2"

  const TOKENS = designTokens.colors;
  const SHADOWS = designTokens.shadows;

  const [lecturers, setLecturers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [generatedCodes, setGeneratedCodes] = useState([])
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [generateQrCodes, setGenerateQrCodes] = useState(false)
  const [qrCodeSize, setQrCodeSize] = useState(128)
  const [qrCodeUrls, setQrCodeUrls] = useState([])
  const [promoTemplates, setPromoTemplates] = useState([])
  const [selectedTemplateUrl, setSelectedTemplateUrl] = useState(DEFAULT_PROMO_TEMPLATE_URL)
  const [templateLoading, setTemplateLoading] = useState(false)
  const [templateUploading, setTemplateUploading] = useState(false)
  const [templateError, setTemplateError] = useState("")
  const [templateSuccess, setTemplateSuccess] = useState("")
  const [isBulkDownloading, setIsBulkDownloading] = useState(false)
  const printFrameRef = useRef(null)

  useEffect(() => {
    const fetchLecturers = async () => {
      try {
        setLoading(true)
        const response = await getAllLecturers()

        if (response.success) {
          setLecturers(Array.isArray(response.data) ? response.data : [])
        } else {
          setError(t("errors.fetchLecturers"))
        }
      } catch (err) {
        console.error("Error fetching lecturers:", err)
        setError(t("errors.fetchLecturers"))
      } finally {
        setLoading(false)
      }
    }

    fetchLecturers()
  }, [t])

  useEffect(() => {
    const fetchPromoTemplates = async () => {
      try {
        setTemplateLoading(true)
        const response = await getPromoCodeTemplates()

        if (response.success) {
          setPromoTemplates(Array.isArray(response.data) ? response.data : [])
        } else {
          setTemplateError(response.error || t("template.loadFailed"))
        }
      } catch (err) {
        console.error("Error fetching promo templates:", err)
        setTemplateError(t("template.loadFailed"))
      } finally {
        setTemplateLoading(false)
      }
    }

    fetchPromoTemplates()
  }, [t])

  useEffect(() => {
    if (generateQrCodes && generatedCodes.length > 0) {
      generateQrCodeUrls()
    }
  }, [generateQrCodes, generatedCodes, qrCodeSize])

  const generateQrCodeUrls = async () => {
    try {
      const urls = await Promise.all(
        generatedCodes.map(async (code) => {
          const url = await QRCode.toDataURL(code.code, {
            width: qrCodeSize,
            margin: 1,
            color: {
              dark: "#000000",
              light: "#ffffff"
            }
          })
          return url
        })
      )
      setQrCodeUrls(urls)
    } catch (err) {
      console.error("Error generating QR codes:", err)
    }
  }

  const [formData, setFormData] = useState({
    lecturer: "",
    type: "general",
    pointsAmount: "",
    amountBefore: "",
    count: 1,
    expiryDate: ""
  })

  const handleNumberChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      setLoading(true)

      const resolvedType = formData.type === "specific" ? "specific" : "general";

      const payload = {
        lecturerId: resolvedType === "specific" ? formData.lecturer : undefined,
        type: resolvedType,
        pointsAmount: parseInt(formData.pointsAmount, 10),
        amountBefore: formData.amountBefore ? parseInt(formData.amountBefore) : undefined,
        numOfCodes: parseInt(formData.count, 10),
        expiryDate: formData.expiryDate || undefined,
        generateQrCodes
      }

      const result = await generatePromoCodes(payload)

      if (result.success) {
        setGeneratedCodes(Array.isArray(result.data) ? result.data : [])
        setSuccess(t("success.codesGenerated"))
        toast.success(t("success.codesGenerated"))
      } else {
        const translatedError = translateErrorMessage(result.error, t)
        setError(translatedError)
        toast.error(translatedError)
      }
    } catch (err) {
      const translatedError = translateErrorMessage(err.message, t)
      setError(translatedError)
      toast.error(translatedError)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (code, index) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const validateTemplateDimensions = (file) =>
    new Promise((resolve, reject) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)

      img.onload = () => {
        const isValid = img.naturalWidth === PROMO_TEMPLATE_WIDTH && img.naturalHeight === PROMO_TEMPLATE_HEIGHT
        URL.revokeObjectURL(objectUrl)

        if (!isValid) {
          reject(
            new Error(
              t("template.invalidDimensions", {
                width: PROMO_TEMPLATE_WIDTH,
                height: PROMO_TEMPLATE_HEIGHT,
              })
            )
          )
          return
        }

        resolve()
      }

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error(t("template.invalidImage")))
      }

      img.src = objectUrl
    })

  const handleTemplateUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setTemplateError("")
    setTemplateSuccess("")

    if (!file.type || !file.type.startsWith("image/")) {
      const message = t("template.imageOnly")
      setTemplateError(message)
      toast.error(message)
      e.target.value = ""
      return
    }

    try {
      await validateTemplateDimensions(file)
    } catch (err) {
      const translatedError = translateErrorMessage(err.message, t)
      setTemplateError(translatedError)
      toast.error(translatedError)
      e.target.value = ""
      return
    }

    setTemplateUploading(true)

    try {
      const result = await uploadPromoCodeTemplate(file)
      if (result.success && result.data) {
        setTemplateSuccess(t("template.uploadSuccess"))
        setPromoTemplates(prev => {
          const withoutDuplicate = prev.filter(template => template.id !== result.data.id)
          return [result.data, ...withoutDuplicate]
        })
        setSelectedTemplateUrl(result.data.url)
        toast.success(t("template.uploadSuccess"))
      } else {
        const translatedError = translateErrorMessage(result.error || t("template.uploadFailed"), t)
        setTemplateError(translatedError)
        toast.error(translatedError)
      }
    } catch (err) {
      setTemplateError(t("template.uploadFailed"))
      toast.error(t("template.uploadFailed"))
    } finally {
      setTemplateUploading(false)
      e.target.value = ""
    }
  }

  const downloadAllQRCodes = async () => {
    if (qrCodeUrls.length === 0) return

    setIsBulkDownloading(true)

    try {
      const zip = new JSZip()
      
      for (let i = 0; i < qrCodeUrls.length; i++) {
        const code = generatedCodes[i]
        const url = qrCodeUrls[i]
        
        const base64Data = url.replace(/^data:image\/png;base64,/, "")
        zip.file(`${code.code}.png`, base64Data, { base64: true })
      }

      const content = await zip.generateAsync({ type: "blob" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(content)
      link.download = "promo-codes-qr.zip"
      link.click()
      URL.revokeObjectURL(link.href)
      
      toast.success(t("downloadSuccess"))
    } catch (err) {
      console.error("Error downloading QR codes:", err)
      toast.error(t("downloadFailed"))
    } finally {
      setIsBulkDownloading(false)
    }
  }

  const getPrintableTemplateUrl = () => {
    const resolvedUrl = new URL(selectedTemplateUrl, window.location.origin)

    if (resolvedUrl.hostname === window.location.hostname) {
      resolvedUrl.protocol = window.location.protocol
    }

    return resolvedUrl.toString()
  }

  const printQRCodes = () => {
    if (!generatedCodes.length || !qrCodeUrls.length) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      const message = t("printPopupBlocked", { defaultValue: "Please allow pop-ups to print QR codes" })
      toast.error(message)
      return
    }

    const templateImage = getPrintableTemplateUrl()
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t("printQrCodes")}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 6mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .print-container {
              display: grid;
              grid-template-columns: repeat(2, ${PROMO_TEMPLATE_WIDTH}px);
              grid-auto-rows: ${PROMO_TEMPLATE_HEIGHT}px;
              gap: 10px;
              align-items: start;
              justify-content: start;
              width: 100%;
            }
            .qr-item {
              position: relative;
              width: ${PROMO_TEMPLATE_WIDTH}px;
              height: ${PROMO_TEMPLATE_HEIGHT}px;
              page-break-inside: avoid;
              break-inside: avoid;
              overflow: hidden;
            }
            .template-image {
              position: absolute;
              inset: 0;
              width: 100%;
              height: 100%;
              object-fit: fill;
              display: block;
              z-index: 1;
            }
            .code-number {
              position: absolute;
              top: 3%;
              left: 2%;
              font-size: 14px;
              font-weight: bold;
              color: #fff;
              z-index: 2;
            }
            .qr-code {
              position: absolute;
              top: 35%;
              left: 7%;
              width: 50px;
              height: 50px;
              z-index: 2;
            }
            .qr-code img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            .code-value {
              position: absolute;
              top: 12%;
              left: 11%;
              font-size: 11px;
              font-weight: bold;
              color: #000;
              width: 40%;
              text-align: left;
              z-index: 2;
            }
            .amount-stack {
              position: absolute;
              top: 9%;
              left: 6.8%;
              width: 15%;
              display: flex;
              flex-direction: column;
              align-items: center;
              z-index: 2;
            }
            .amount-before {
              position: relative;
              font-size: 10px;
              font-weight: 700;
              color: #111;
              line-height: 1.1;
              text-decoration: line-through;
              text-decoration-thickness: 1.5px;
              text-decoration-color: #c51616;
            }
            .amount-before::after {
              content: "";
              position: absolute;
              left: -4%;
              right: -4%;
              top: 52%;
              border-top: 1.5px solid rgba(197, 22, 22, 0.8);
              transform: rotate(-2deg);
            }
            .amount-after {
              margin-top: 4px;
              font-size: 14px;
              font-weight: 800;
              color: #000;
              line-height: 1;
              letter-spacing: 0.2px;
            }
            .promo-code {
              position: absolute;
              bottom: 13%;
              right: 30%;
              font-size: 16px;
              font-weight: 700;
              color: #000;
              width: 40%;
              text-align: center;
              word-break: break-all;
              z-index: 2;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${generatedCodes.map((code, index) => {
              const hasAmountBefore = Number(formData.amountBefore) > 0
              const amountBeforeDisplay = hasAmountBefore ? Number(formData.amountBefore) : null
              const amountAfterDisplay = code.pointsAmount || formData.pointsAmount

              return `
                <div class="qr-item">
                  <img class="template-image" src="${templateImage}" alt="" />
                  <div class="code-number">#${index + 1}</div>
                  <div class="qr-code">
                    <img src="${qrCodeUrls[index]}" alt="QR Code" />
                  </div>
                  ${hasAmountBefore
                    ? `<div class="amount-stack">
                        <div class="amount-before">${amountBeforeDisplay}</div>
                        <div class="amount-after">${amountAfterDisplay}</div>
                      </div>`
                    : `<div class="code-value">${amountAfterDisplay}</div>`
                  }
                  <div class="promo-code">${code.code}</div>
                </div>
              `
            }).join("")}
          </div>
          <script>
            window.onload = function() {
              Promise.all(
                Array.from(document.querySelectorAll('img')).map(function(img) {
                  return img.complete
                    ? Promise.resolve()
                    : new Promise(function(resolve) {
                        img.onload = resolve;
                        img.onerror = resolve;
                      });
                })
              ).then(function() {
                return new Promise(function(resolve) { setTimeout(resolve, 500); });
              }).then(function() {
                window.print();
              });
            };
          </script>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
  }

  const templateOptions = [
    {
      id: "default",
      name: t("template.defaultOption"),
      url: DEFAULT_PROMO_TEMPLATE_URL,
      width: PROMO_TEMPLATE_WIDTH,
      height: PROMO_TEMPLATE_HEIGHT,
    },
    ...promoTemplates,
  ]

  return (
    <div 
      className="p-6 md:p-8 mb-10 w-full" 
      dir={dir}
      style={{ 
        background: TOKENS.neutralCloud, 
        boxShadow: SHADOWS.level1, 
        borderRadius: "2rem",
        border: "1px solid transparent"
      }}
    >
      <div className="flex items-center gap-3 mb-8 border-b pb-4" style={{ borderColor: "rgba(17,24,39,0.1)" }}>
        <div className="p-3 rounded-2xl" style={{ background: "rgba(77,179,194,0.1)" }}>
          <Ticket className="w-8 h-8" style={{ color: TOKENS.deepTeal }} />
        </div>
        <h2 className="text-2xl font-extrabold" style={{ color: TOKENS.deepTeal }}>
          {t("admin.generatePromoCodes", "إنشاء أكواد ترويجية")}
        </h2>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm flex items-center gap-3 mb-4">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
  
      {success && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 shadow-sm flex items-center gap-3 mb-4">
          <Check className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}
  
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 md:gap-4 mb-4">
          <div className="flex flex-col gap-1 xl:col-span-3 rounded-2xl p-3 bg-white/70" style={{ borderColor: "transparent" }}>
            <label className="flex flex-col gap-1 pt-0 pb-1">
              <span className="text-xs font-medium">{t("form.amountAfter")}</span>
            </label>
            <Input
              type="number"
              name="pointsAmount"
              className="w-full max-w-[220px]"
              value={formData.pointsAmount}
              onChange={handleNumberChange}
              min="1"
              inputMode="numeric"
            />
                    <span className="mt-2 text-xs leading-5 text-slate-600">
              {isRTL ? "قيمة رقمية أكبر من 0" : "Numeric value greater than 0"}
            </span>
          </div>
  
          <div className="flex flex-col gap-1 xl:col-span-3 rounded-2xl p-3 bg-white/70" style={{ borderColor: "transparent" }}>
            <label className="flex flex-col gap-1 pt-0 pb-1">
              <span className="text-xs font-medium">{t("form.amountBefore")}</span>
            </label>
            <Input
              type="number"
              name="amountBefore"
              className="w-full max-w-[220px]"
              value={formData.amountBefore}
              onChange={handleNumberChange}
              min="1"
              inputMode="numeric"
              placeholder={t("form.amountBeforePlaceholder")}
            />
                    <span className="mt-2 text-xs leading-5 text-slate-600">
              {t("form.amountBeforeHint")}
            </span>
          </div>
  
          <div className="flex flex-col gap-1 xl:col-span-3 rounded-2xl p-3 bg-white/70" style={{ borderColor: "transparent" }}>
            <label className="flex flex-col gap-1 pt-0 pb-1">
              <span className="text-xs font-medium">{t("form.numCodes")}</span>
            </label>
            <Input
              type="number"
              name="count"
              className="w-full max-w-[220px]"
              value={formData.count}
              onChange={handleNumberChange}
              min="1"
              max="100"
              inputMode="numeric"
            />
          </div>
  
          <div className="flex flex-col gap-1 xl:col-span-3 rounded-2xl p-3 bg-white/70" style={{ borderColor: "transparent" }}>
            <label className="flex flex-col gap-1 pt-0 pb-1">
              <span className="text-xs font-medium">{t("form.lecturer")}</span>
            </label>
            <DSSelect
              name="lecturer"
              className="w-full max-w-[220px]"
              value={formData.lecturer}
              onChange={(e) => setFormData(prev => ({ ...prev, lecturer: e.target.value }))}
            >
              <option value="">{t("form.allLecturers")}</option>
              {lecturers.map(lecturer => (
                <option key={lecturer._id} value={lecturer._id}>
                  {lecturer.name}
                </option>
              ))}
            </DSSelect>
          </div>
  
          <div className="flex flex-col gap-1 xl:col-span-3 rounded-2xl p-3 bg-white/70" style={{ borderColor: "transparent" }}>
            <label className="flex flex-col gap-1 pt-0 pb-1">
              <span className="text-xs font-medium">{t("form.codeType")}</span>
            </label>
            <DSSelect
              name="type"
              className="w-full max-w-[220px]"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="general">{t("form.general", { defaultValue: isRTL ? "عام" : "General" })}</option>
              <option value="specific">{t("form.specific", { defaultValue: isRTL ? "لمحاضر محدد" : "Specific lecturer" })}</option>
            </DSSelect>
          </div>
  
          <div className="flex flex-col gap-1 xl:col-span-3 rounded-2xl p-3 bg-white/70" style={{ borderColor: "transparent" }}>
            <label className="flex flex-col gap-1 pt-0 pb-1">
              <span className="text-xs font-medium">{t("form.expiryDate")}</span>
            </label>
            <Input
              type="date"
              name="expiryDate"
              className="w-full max-w-[220px]"
              value={formData.expiryDate}
              onChange={handleNumberChange}
            />
          </div>

          <div className="flex flex-col gap-1 xl:col-span-3 rounded-2xl p-3 bg-white/70" style={{ borderColor: "transparent" }}>
            <label className="flex flex-col gap-1 pt-0 pb-1">
              <span className="text-xs font-medium">{t("form.qrCodes")}</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="generateQrCodes"
                checked={generateQrCodes}
                onChange={(e) => setGenerateQrCodes(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="generateQrCodes" className="text-sm">
                {t("form.generateQrCodes")}
              </label>
            </div>
          </div>
        </div>
  
        <div className="flex justify-end">
          <Button 
            type="submit" 
            className="w-full sm:w-auto min-w-[180px] px-8 rounded-full" 
            style={{ background: designTokens.gradients.cta, boxShadow: "0 4px 14px rgba(77, 179, 194, 0.4)" }} 
            disabled={loading}
          >
            {loading ? (
              <>
                <span className={`animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4 inline-block ${spinnerInlineGap}`}></span>
                {t("generating")}
              </>
            ) : (
              t("generateCodes")
            )}
          </Button>
        </div>
      </form>

      {generatedCodes.length > 0 && (
        <div className="mt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-3">
            <h3 className="text-lg font-bold">{t("generatedCodes")}</h3>
            {generateQrCodes && qrCodeUrls.length > 0 && (
              <div className="flex flex-col gap-2 sm:items-end">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex flex-col gap-1">
                    <label className="flex flex-col gap-1 py-0">
                      <span className="text-xs">{t("template.selectorLabel")}</span>
                    </label>
                    <DSSelect
                      className="select-bordered select-sm min-w-[220px]"
                      value={selectedTemplateUrl}
                      onChange={(e) => {
                        setSelectedTemplateUrl(e.target.value)
                        setTemplateError("")
                        setTemplateSuccess("")
                      }}
                      disabled={templateLoading}
                    >
                      {templateOptions.map((template) => (
                        <option key={template.id} value={template.url}>
                          {template.name}
                        </option>
                      ))}
                    </DSSelect>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="flex flex-col gap-1 py-0">
                      <span className="text-xs">{t("template.uploadLabel")}</span>
                    </label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="block min-w-[220px] max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-slate-700"
                      onChange={handleTemplateUpload}
                      disabled={templateUploading}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {generateQrCodes && qrCodeUrls.length > 0 && (
            <div className="mb-3 flex flex-col gap-1 sm:items-end">
              <p className="text-xs text-slate-600">
                {t("template.requiredDimensions", {
                  width: PROMO_TEMPLATE_WIDTH,
                  height: PROMO_TEMPLATE_HEIGHT,
                })}
              </p>
              {templateError && <p className="text-xs text-red-500">{templateError}</p>}
              {templateSuccess && <p className="text-xs text-green-500">{templateSuccess}</p>}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={printQRCodes}>
              <Printer className={`w-4 h-4 ${iconInlineGap}`} />
              {t("printQrCodes")}
            </Button>
            <Button size="sm" variant="outline" onClick={downloadAllQRCodes} disabled={isBulkDownloading}>
              {isBulkDownloading ? (
                <>
                  <span className={`animate-spin border-2 border-primary border-t-transparent rounded-full w-3 h-3 inline-block ${spinnerInlineGap}`}></span>
                  {t("exporting", { defaultValue: isRTL ? "جاري التحضير..." : "Preparing..." })}
                </>
              ) : (
                <>
                  <Download className={`w-4 h-4 ${iconInlineGap}`} />
                  {t("downloadAllQrCodes")}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {generateQrCodes && qrCodeUrls.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {generatedCodes.map((code, index) => (
            <div key={code.code || index} className="bg-slate-100 p-4 rounded-lg flex flex-col items-center">
              {qrCodeUrls[index] && (
                <img
                  src={qrCodeUrls[index] || "/placeholder.svg"}
                  alt={`QR Code for ${code.code}`}
                  width={qrCodeSize}
                  height={qrCodeSize}
                  className="border border-slate-200"
                />
              )}
              <div className="mt-2 text-center">
                <p className="font-mono text-sm break-all">{code.code}</p>
                <p className="text-sm mt-1">{`${code.pointsAmount || formData.pointsAmount} ${t("points")}`}</p>
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(code.code, index)}
                >
                  {copiedIndex === index ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedIndex === index ? t("copied") : t("copy")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : generatedCodes.length > 0 ? (
        <div className="mt-6">
          <div className="bg-slate-100 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-200">
                  <th className={`p-3 text-sm font-semibold ${isRTL ? "text-right" : "text-left"}`}>{t("promoTable.code")}</th>
                  <th className={`p-3 text-sm font-semibold ${isRTL ? "text-right" : "text-left"}`}>{t("promoTable.points")}</th>
                  <th className={`p-3 text-sm font-semibold ${isRTL ? "text-right" : "text-left"}`}>{t("promoTable.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {generatedCodes.map((code, index) => (
                  <tr key={code.code || index} className="border-t border-slate-200">
                    <td className={`p-3 font-mono text-sm ${isRTL ? "text-right" : "text-left"}`} dir="ltr">{code.code}</td>
                    <td className={`p-3 text-sm ${isRTL ? "text-right" : "text-left"}`}>
                      {`${code.pointsAmount || formData.pointsAmount} ${t("points")}`}
                    </td>
                    <td className={`p-3 ${isRTL ? "text-right" : "text-left"}`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(code.code, index)}
                      >
                        {copiedIndex === index ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedIndex === index ? t("copied") : t("copy")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default PromoCodeGenerator
