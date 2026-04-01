"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Ticket, Copy, Check, AlertCircle, Download, Printer } from 'lucide-react'
import { generatePromoCodes, getPromoCodeTemplates, uploadPromoCodeTemplate } from "../../../../routes/codes"
import { getAllLecturers } from "../../../../routes/fetch-users"
import QRCode from "qrcode"
import { designTokens } from "../../../../constants/designTokens"
import { translateErrorMessage } from "../../../../utils/errorTranslator"

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
  const printFrameRef = useRef(null)

  useEffect(() => {
    const fetchLecturers = async () => {
      try {
        setLoading(true)
        const response = await getAllLecturers()

        if (response.success) {
          setLecturers(Array.isArray(response.data) ? response.data : [])
        } else {
          setError(t("admin.errors.fetchLecturers"))
        }
      } catch (err) {
        console.error("Error fetching lecturers:", err)
        setError(t("admin.errors.fetchLecturers"))
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
          setTemplateError(response.error || t("admin.template.loadFailed"))
        }
      } catch (err) {
        console.error("Error fetching promo templates:", err)
        setTemplateError(t("admin.template.loadFailed"))
      } finally {
        setTemplateLoading(false)
      }
    }

    fetchPromoTemplates()
  }, [t])

  // Generate QR codes when codes are generated and QR option is enabled
  useEffect(() => {
    if (generateQrCodes && generatedCodes.length > 0) {
      generateQrCodeUrls()
    }
  }, [generateQrCodes, generatedCodes, qrCodeSize])

  const generateQrCodeUrls = async () => {
    try {
      const urls = await Promise.all(
        generatedCodes.map(async (code) => {
          const codeData = getQrCodeValue(code)
          const options = {
            errorCorrectionLevel: "H",
            margin: 1,
            width: qrCodeSize,
            color: {
              dark: "#000000",
              light: "#ffffff",
            },
          }

          try {
            const url = await QRCode.toDataURL(codeData, options)
            return url
          } catch (err) {
            console.error("Error generating QR code:", err)
            return null
          }
        }),
      )

      setQrCodeUrls(urls.filter((url) => url !== null))
    } catch (err) {
      console.error("Error generating QR codes:", err)
      setError(t("admin.errors.qrCodeGenerationFailed"))
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === "type") {
      // Reset lecturerId when changing to general or promo type
      const newFormData = { ...formData, [name]: value }
      if (value !== "specific") {
        newFormData.lecturerId = ""
      }
      setFormData(newFormData)
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleNumberChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      if (name === "amountBefore") {
        if (value === "") {
          return { ...prev, amountBefore: "" }
        }
        return { ...prev, amountBefore: Number.parseInt(value, 10) || 0 }
      }
      return { ...prev, [name]: Number.parseInt(value, 10) || 0 }
    })
  }

  const handleQrSizeChange = (e) => {
    setQrCodeSize(Number.parseInt(e.target.value) || 128)
  }

  const validateTemplateDimensions = (file) =>
    new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file)
      const img = new Image()

      img.onload = () => {
        const isValid =
          img.width === PROMO_TEMPLATE_WIDTH && img.height === PROMO_TEMPLATE_HEIGHT
        URL.revokeObjectURL(objectUrl)

        if (!isValid) {
          reject(
            new Error(
              t("admin.template.invalidDimensions", {
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
        reject(new Error(t("admin.template.invalidImage")))
      }

      img.src = objectUrl
    })

  const handleTemplateUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setTemplateError("")
    setTemplateSuccess("")

    if (!file.type || !file.type.startsWith("image/")) {
      setTemplateError(t("admin.template.imageOnly"))
      e.target.value = ""
      return
    }

    try {
      await validateTemplateDimensions(file)
    } catch (err) {
      setTemplateError(translateErrorMessage(err.message))
      e.target.value = ""
      return
    }

    try {
      setTemplateUploading(true)
      const response = await uploadPromoCodeTemplate(file)

      if (response.success && response.data) {
        setPromoTemplates((prev) => {
          const withoutDuplicate = prev.filter((template) => template.id !== response.data.id)
          return [response.data, ...withoutDuplicate]
        })
        setSelectedTemplateUrl(response.data.url)
        setTemplateSuccess(t("admin.template.uploadSuccess"))
      } else {
        setTemplateError(response.error || t("admin.template.uploadFailed"))
      }
    } catch (err) {
      console.error("Error uploading promo template:", err)
      setTemplateError(t("admin.template.uploadFailed"))
    } finally {
      setTemplateUploading(false)
      e.target.value = ""
    }
  }

  const [formData, setFormData] = useState({
    pointsAmount: 1000,
    amountBefore: "",
    numOfCodes: 3,
    lecturerId: "",
    type: "general",
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setGeneratedCodes([])
    setQrCodeUrls([])

    if (formData.type !== "promo" && formData.pointsAmount <= 0) {
      setError(t("admin.errors.pointsError"))
      return
    }

    if (formData.numOfCodes <= 0) {
      setError(t("admin.errors.codesError"))
      return
    }

    if (formData.type === "specific" && !formData.lecturerId) {
      setError(t("admin.errors.lecturerRequired"))
      return
    }

    try {
      setLoading(true)
      const payload = {
        numOfCodes: formData.numOfCodes,
        type: formData.type,
      }

      // Only include pointsAmount if not promo type
      if (formData.type !== "promo") {
        payload.pointsAmount = formData.pointsAmount
      }

      // Only include lecturerId if specific type
      if (formData.type === "specific") {
        payload.lecturerId = formData.lecturerId
      }

      const response = await generatePromoCodes(payload)

      if (response.status === "success") {
        setSuccess(t("admin.success.codesGenerated"))
        setGeneratedCodes(response.data?.codes || [])
      } else {
        setError(response.message || t("admin.errors.generationFailed"))
      }
    } catch (err) {
      console.error("Error generating promo codes:", err)
      setError(t("admin.errors.generationFailed"))
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (code, index) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    })
  }

  const downloadQRCode = (dataUrl, code) => {
    const downloadLink = document.createElement("a")
    downloadLink.href = dataUrl
    downloadLink.download = `qrcode-${code}.png`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  const downloadAllQRCodes = () => {
    qrCodeUrls.forEach((url, index) => {
      if (url && generatedCodes[index]) {
        setTimeout(() => {
          downloadQRCode(url, generatedCodes[index].code)
        }, index * 500) // Add delay to prevent browser issues with multiple downloads
      }
    })
  }

  // Create a value for the QR code that includes relevant information
  const getQrCodeValue = (code) => {
    const codeData = {
      code: code.code,
      type: formData.type,
      pointsAmount: formData.type !== "promo" ? code.pointsAmount || formData.pointsAmount : null,
    }
    return JSON.stringify(codeData)
  }

  // Print QR codes
  const printQRCodes = () => {
    if (!generatedCodes.length) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert(translateErrorMessage("Please allow pop-ups to print QR codes"))
      return
    }

    const templateImage = new URL(selectedTemplateUrl, window.location.origin).toString()

    const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>QR Codes - ${new Date().toLocaleDateString()}</title>
      <style>
        @page {
          size: A4;
          margin: 0;
        }
        body {
          margin: 0;
        }
        .print-container {
          display: grid;
          grid-template-columns: repeat(3, 9cm);
          grid-auto-rows: 4.75cm;
          width: 100%;
        }
        .qr-item {
          position: relative;
          width: 9cm;
          height: 4.75cm;
        }
        .template-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
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
          text-shadow: 0 0 0.01px #000;
        }
        .promo-code {
          position: absolute;
          bottom: 13%;
          right: 30%;
          font-size: 16px;
          color: #000;
          width: 40%;
          text-align: center;
          word-break: break-all;
          z-index: 2;
        }
        img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        ${generatedCodes.map((code, index) => {
      const hasAmountBefore = Number(formData.amountBefore) > 0
      const amountBeforeDisplay = hasAmountBefore ? Number(formData.amountBefore) : null
      const amountAfterDisplay = formData.type === "promo"
        ? formData.pointsAmount
        : code.pointsAmount || formData.pointsAmount
      const legacyCodeValue = formData.type === "promo"
        ? t("admin.discount")
        : `${amountAfterDisplay}`

      return `
          <div class="qr-item">
            <img class="template-image" src="${templateImage}" /> <!-- Added template image -->
            <div class="code-number">#${index + 1}</div>
            <div class="qr-code">
              <img src="${qrCodeUrls[index]}" alt="QR Code">
            </div>
            ${hasAmountBefore
          ? `<div class="amount-stack">
                <div class="amount-before">${amountBeforeDisplay}</div>
                <div class="amount-after">${amountAfterDisplay}</div>
              </div>`
          : `<div class="code-value">${legacyCodeValue}</div>`
        }
            <div class="promo-code">${code.code}</div>
          </div>
        `
    }).join("")}
      </div>
      <script>
        window.onload = function() {
          // Wait for all images (template + QR codes)
          Promise.all(
            Array.from(document.querySelectorAll('img'))
              .map(img => img.complete 
                ? Promise.resolve() 
                : new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                  })
              )
          ).then(() => {
            return new Promise(resolve => setTimeout(resolve, 1000));
          }).then(() => {
            window.print();
            setTimeout(() => window.close(), 1500);
          }).catch(error => {
            console.error('Error loading images:', error);
            window.print();
            window.close();
          });
        }
      </script>
    </body>
    </html>
  `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  }

  const templateOptions = [
    {
      id: "default-template",
      name: t("admin.template.defaultOption"),
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
        <h2 className="text-2xl font-extrabold" style={{ color: TOKENS.deepTeal }}>{t("admin.generatePromoCodes")}</h2>
      </div>

      {error && (
        <div className="alert alert-error mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-4 flex items-center gap-2">
          <Check className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 md:gap-4 mb-4">
          <div className="form-control xl:col-span-3 rounded-2xl border p-3 bg-white/70" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
            <label className="label pt-0 pb-1">
              <span className="label-text font-medium">{t("admin.form.amountAfter")}</span>
            </label>
            <input
              type="number"
              name="pointsAmount"
              className="input input-bordered w-full max-w-[220px]"
              value={formData.pointsAmount}
              onChange={handleNumberChange}
              min="1"
              inputMode="numeric"
            />
            <span className="text-xs opacity-70 mt-2 leading-5">
              {isRTL ? "قيمة رقمية أكبر من 0" : "Numeric value greater than 0"}
            </span>
          </div>

          <div className="form-control xl:col-span-3 rounded-2xl border p-3 bg-white/70" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
            <label className="label pt-0 pb-1">
              <span className="label-text font-medium">{t("admin.form.amountBefore")}</span>
            </label>
            <input
              type="number"
              name="amountBefore"
              className="input input-bordered w-full max-w-[220px]"
              value={formData.amountBefore}
              onChange={handleNumberChange}
              min="1"
              inputMode="numeric"
              placeholder={t("admin.form.amountBeforePlaceholder")}
            />
            <span className="text-xs opacity-70 mt-2 leading-5">
              {t("admin.form.amountBeforeHint")}
            </span>
          </div>

          <div className="form-control xl:col-span-3 rounded-2xl border p-3 bg-white/70" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
            <label className="label pt-0 pb-1">
              <span className="label-text font-medium">{t("admin.form.numCodes")}</span>
            </label>
            <input
              type="number"
              name="numOfCodes"
              className="input input-bordered w-full max-w-[180px]"
              value={formData.numOfCodes}
              onChange={handleNumberChange}
              min="1"
              max="100"
              inputMode="numeric"
              required
            />
            <span className="text-xs opacity-70 mt-2 leading-5">
              {isRTL ? "من 1 إلى 100" : "From 1 to 100"}
            </span>
          </div>

          <div className="form-control xl:col-span-3 rounded-2xl border p-3 bg-white/70" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
            <label className="label pt-0 pb-1">
              <span className="label-text font-medium">{t("admin.form.codeType")}</span>
            </label>
            <select
              name="type"
              className="select select-bordered w-full"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="general">{t("admin.form.general")}</option>
              <option value="specific">{t("admin.form.specific")}</option>
              <option value="promo">{t("admin.form.promo")}</option>
            </select>
          </div>

          <div className="form-control xl:col-span-3 rounded-2xl border p-3 bg-white/70" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
            <label className="label pt-0 pb-1">
              <span className="label-text font-medium">{t("admin.form.lecturer")}</span>
            </label>
            <select
              name="lecturerId"
              className="select select-bordered w-full"
              value={formData.lecturerId}
              onChange={handleChange}
              disabled={formData.type !== "specific"}
              required={formData.type === "specific"}
            >
              <option value="">{t("admin.form.lecturerPlaceholder")}</option>
              {lecturers.map((lecturer) => (
                <option key={lecturer._id} value={lecturer._id}>
                  {lecturer.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-2xl border p-4 bg-white/70 mb-4" style={{ borderColor: "rgba(17,24,39,0.08)" }}>
          <div className="form-control mb-2">
            <label className="cursor-pointer label justify-start gap-2 py-0">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={generateQrCodes}
              onChange={() => setGenerateQrCodes(!generateQrCodes)}
            />
            <span className="label-text font-medium">{t("admin.form.generateQrCodes")}</span>
          </label>
          <p className="text-sm text-base-content/70 mt-1">{t("admin.form.qrCodeDescription")}</p>
          </div>

          {generateQrCodes && (
            <div className="form-control mt-3">
              <label className="label pt-0">
                <span className="label-text font-medium">{t("admin.form.qrCodeSize")}</span>
              </label>
              <div className="flex items-center gap-3 w-full max-w-md">
                <input
                  type="range"
                  min="64"
                  max="256"
                  step="8"
                  value={qrCodeSize}
                  onChange={handleQrSizeChange}
                  className="range range-primary"
                />
                <span className="font-semibold min-w-[58px] text-sm">{qrCodeSize}px</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn border-none text-white w-full sm:w-auto min-w-[180px] px-8 rounded-full" style={{ background: designTokens.gradients.cta, boxShadow: "0 4px 14px rgba(77, 179, 194, 0.4)" }} disabled={loading}>
            {loading ? (
              <>
                <span className={`loading loading-spinner text-white w-5 h-5 ${spinnerInlineGap}`}></span>
                {t("admin.generating")}
              </>
            ) : (
              t("admin.generateCodes")
            )}
          </button>
        </div>
      </form>

      {generatedCodes.length > 0 && (
        <div className="mt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-3">
            <h3 className="text-lg font-bold">{t("admin.generatedCodes")}</h3>
            {generateQrCodes && qrCodeUrls.length > 0 && (
              <div className="flex flex-col gap-2 sm:items-end">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="form-control">
                    <label className="label py-0">
                      <span className="label-text text-xs">{t("admin.template.selectorLabel")}</span>
                    </label>
                    <select
                      className="select select-bordered select-sm min-w-[220px]"
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
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label py-0">
                      <span className="label-text text-xs">{t("admin.template.uploadLabel")}</span>
                    </label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="file-input file-input-bordered file-input-sm min-w-[220px]"
                      onChange={handleTemplateUpload}
                      disabled={templateUploading}
                    />
                  </div>
                </div>

                <p className="text-xs opacity-70">
                  {t("admin.template.requiredDimensions", {
                    width: PROMO_TEMPLATE_WIDTH,
                    height: PROMO_TEMPLATE_HEIGHT,
                  })}
                </p>
                {templateError && <p className="text-xs text-error">{templateError}</p>}
                {templateSuccess && <p className="text-xs text-success">{templateSuccess}</p>}

                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn btn-sm btn-outline" onClick={printQRCodes}>
                    <Printer className={`w-4 h-4 ${iconInlineGap}`} />
                    {t("admin.printQrCodes")}
                  </button>
                  <button type="button" className="btn btn-sm btn-outline" onClick={downloadAllQRCodes}>
                    <Download className={`w-4 h-4 ${iconInlineGap}`} />
                    {t("admin.downloadAllQrCodes")}
                  </button>
                </div>
              </div>
            )}
          </div>

          {generateQrCodes && qrCodeUrls.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {generatedCodes.map((code, index) => (
                <div key={code.code || index} className="bg-base-200 p-4 rounded-lg flex flex-col items-center">
                  {qrCodeUrls[index] && (
                    <img
                      src={qrCodeUrls[index] || "/placeholder.svg"}
                      alt={`QR Code for ${code.code}`}
                      width={qrCodeSize}
                      height={qrCodeSize}
                      className="border border-base-300"
                    />
                  )}
                  <div className="mt-2 text-center">
                    <p className="font-mono text-sm break-all">{code.code}</p>
                    <p className="text-sm mt-1">
                      {formData.type === "promo"
                        ? t("admin.discount")
                        : `${code.pointsAmount || formData.pointsAmount} ${t("admin.points")}`}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => copyToClipboard(code.code, index)}
                      title={t("admin.copy")}
                    >
                      {copiedIndex === index ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    {qrCodeUrls[index] && (
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => downloadQRCode(qrCodeUrls[index], code.code)}
                        title={t("admin.download")}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>{t("admin.promoTable.number")}</th>
                    <th>{t("admin.promoTable.code")}</th>
                    <th>{formData.type === "promo" ? t("admin.promoTable.discount") : t("admin.promoTable.points")}</th>
                    <th>{t("admin.promoTable.type")}</th>
                    <th>{t("admin.promoTable.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedCodes.map((code, index) => (
                    <tr key={code.code || index}>
                      <td>{index + 1}</td>
                      <td>
                        <code className="bg-base-200 px-2 py-1 rounded">{code.code}</code>
                      </td>
                      <td>
                        {formData.type === "promo" ? t("admin.discount") : code.pointsAmount || formData.pointsAmount}
                      </td>
                      <td>
                        {formData.type === "specific"
                          ? t("admin.specific")
                          : formData.type === "promo"
                            ? t("admin.promo")
                            : t("admin.general")}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => copyToClipboard(code.code, index)}
                        >
                          {copiedIndex === index ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          <span className="sr-only">{t("admin.copy")}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Hidden iframe for printing */}
      <iframe ref={printFrameRef} style={{ display: "none" }} title="Print Frame" />
    </div>
  )
}

export default PromoCodeGenerator
