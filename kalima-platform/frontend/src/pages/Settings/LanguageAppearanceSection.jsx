"use client"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import SectionHeader from "./SectionHeader"

function LanguageAppearanceSection() {
  const { t, i18n } = useTranslation("settings")
  const [isLangOpen, setIsLangOpen] = useState(false)
  const isRTL = i18n.language === 'ar'

  useEffect(() => {
    const savedLang = localStorage.getItem("lng") || "ar"
    i18n.changeLanguage(savedLang)
    document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr"
  }, [i18n])

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    localStorage.setItem("lng", lng)
    setIsLangOpen(false)
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr"
  }

  return (
    <div className="mb-8">
      <SectionHeader title={t("languageAppearance.title")} />
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h3 className={`text-lg font-semibold mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t("languageAppearance.title")}
          </h3>

          <div className="form-control mb-6">
            <label className={`label ${isRTL ? 'justify-end' : 'justify-start'}`}>
              <span className="label-text">{t("languageAppearance.options.language")}</span>
            </label>
            <div className="flex justify-end ">
              <select
                className="select select-bordered min-w-40 px-8"
                value={i18n.language}
                onChange={e => changeLanguage(e.target.value)}
              >
                <option value="ar">{t("languageAppearance.languages.ar")}  🇸🇦</option>
                <option value="en">{t("languageAppearance.languages.en")}  🇺🇸</option>
              </select>
            </div>
          </div>
          </div>
        </div>
      </div>
  )
} 
export default LanguageAppearanceSection