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
    type: "points",
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

      const payload = {
        lecturerId: formData.lecturer,
        type: formData.type,
        pointsAmount: parseInt(formData.pointsAmount),
        amountBefore: formData.amountBefore ? parseInt(formData.amountBefore) : undefined,
        count: parseInt(formData.count),
        expiryDate: formData.expiryDate || undefined,
        generateQrCodes
      }

      const result = await generatePromoCodes(payload)

      if (result.success) {
        setGeneratedCodes(result.data || [])
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

  const handleTemplateUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setTemplateUploading(true)
    setTemplateError("")
    setTemplateSuccess("")

    try {
      const result = await uploadPromoCodeTemplate(file)
      if (result.success) {
        setTemplateSuccess(t("template.uploadSuccess"))
        setPromoTemplates(prev => [...prev, result.data])
        setSelectedTemplateUrl(result.data.url)
        toast.success(t("template.uploadSuccess"))
      } else {
        const translatedError = translateErrorMessage(result.error || t("template.uploadFailed"), t)
        setTemplateError(translatedError)
        toast.error(translatedError)
      }
    } catch (err) {
      setTemplateError(t("template.uploadFailed"))
    } finally {
      setTemplateUploading(false)
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

  const printQRCodes = () => {
    const printContent = qrCodeUrls
      .map((url, index) => {
        const code = generatedCodes[index]
        return `
          <div style="page-break-inside: avoid; margin-bottom: 20px; text-align: center;">
            <img src="${url}" alt="QR Code" style="width: 150px; height: 150px;" />
            <p style="font-family: monospace; margin-top: 5px;">${code.code}</p>
          </div>
        `
      })
      .join("")

    const printWindow = window.open("", "_blank")
    printWindow.document.write(`
      <html>
        <head>
          <title>${t("printQrCodes")}</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const templateOptions = [
    {
      id: "default",
      name: "Default Template",
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
        border: "1px solid rgba(17,24,39,0.05)"
      }}
    >
      <div className="flex items-center gap-3 mb-8 border-b pb-4" style={{ borderColor: "rgba(17,24,39,0.1)" }}>
        <div className="p-3 rounded-2xl" style={{ background: "rgba(77,179,194,0.1)" }}>
          <Ticket className="w-8 h-8" style={{ color: TOKENS.deepTeal }} />
        </div>
        <h2 className="text-2xl font-extrabold" style={{ color: TOKENS.deepTeal }}>{t("generatePromoCodes")}</h2>
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
          <div className="flex flex-col gap-1 xl:col-span-3 rounded-2xl border p-3 bg-white/70" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
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
  
          <div className="flex flex-col gap-1 xl:col-span-3 rounded-2xl border p-3 bg-white/70" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
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
  
          <div className="flex flex-col gap-1 xl:col-span-3 rounded-2xl border p-3 bg-white/70" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
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
  
          <div className="flex flex-col gap-1 xl:col-span-3 rounded-2xl border p-3 bg-white/70" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
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
  
          <div className="flex flex-col gap-1 xl:col-span-3 rounded-2xl border p-3 bg-white/70" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
            <label className="flex flex-col gap-1 pt-0 pb-1">
              <span className="text-xs font-medium">{t("form.codeType")}</span>
            </label>
            <DSSelect
              name="type"
              className="w-full max-w-[220px]"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="points">{t("form.points")}</option>
              <option value="promo">{t("form.promo")}</option>
            </DSSelect>
          </div>
  
          <div className="flex flex-col gap-1 xl:col-span-3 rounded-2xl border p-3 bg-white/70" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
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

          <div className="flex flex-col gap-1 xl:col-span-3 rounded-2xl border p-3 bg-white/70" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
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
                <div className="flex flex-col gap-1">
                  <label className="flex flex-col gap-1 py-0">
                    <span className="text-xs"> {t("template.selectorLabel")}</span>
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
              </div>
            )}
          </div>

            <p className="text-xs text-slate-600">
            {t("template.requiredDimensions", {
              width: PROMO_TEMPLATE_WIDTH,
              height: PROMO_TEMPLATE_HEIGHT,
            })}
          </p>
          {templateError && <p className="text-xs text-red-500">{templateError}</p>}
          {templateSuccess && <p className="text-xs text-green-500">{templateSuccess}</p>}

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
                <p className="text-sm mt-1">
                  {formData.type === "promo"
                    ? t("promoTable.discount")
                    : `${code.pointsAmount || formData.pointsAmount} ${t("points")}`}
                </p>
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
                  <th className="p-3 text-left text-sm font-semibold">{t("promoTable.code")}</th>
                  <th className="p-3 text-left text-sm font-semibold">{t("promoTable.points")}</th>
                  <th className="p-3 text-left text-sm font-semibold">{t("promoTable.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {generatedCodes.map((code, index) => (
                  <tr key={code.code || index} className="border-t border-slate-200">
                    <td className="p-3 font-mono text-sm">{code.code}</td>
                    <td className="p-3 text-sm">
                      {formData.type === "promo"
                        ? t("promoTable.discount")
                        : `${code.pointsAmount || formData.pointsAmount} ${t("points")}`}
                    </td>
                    <td className="p-3">
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
