"use client"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import SectionHeader from "./SectionHeader"
import { designTokens } from "../../constants/designTokens"
import DSSelect from "../../components/DSSelect"

function LanguageAppearanceSection() {
  const { t, i18n } = useTranslation("settings")
  const isRTL = i18n.language === 'ar'
  const TOKENS = designTokens.colors
  const SHADOWS = designTokens.shadows

  useEffect(() => {
    const savedLang = localStorage.getItem("lng") || "ar"
    i18n.changeLanguage(savedLang)
    document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr"
  }, [i18n])

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    localStorage.setItem("lng", lng)
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr"
  }

  return (
    <section>
      <SectionHeader title={t("languageAppearance.title")} />
      <div
        className="rounded-3xl border p-4 md:p-5"
        style={{
          background: "rgba(255,255,255,0.75)",
          borderColor: "rgba(17,24,39,0.08)",
          boxShadow: SHADOWS.level1,
        }}
      >
        <div className="mx-auto max-w-2xl">
          <h3 className={`mb-3 text-base font-semibold md:text-lg ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: TOKENS.slateText }}>
            {t("languageAppearance.title")}
          </h3>

          <div className="form-control">
            <label className={`label pb-1 ${isRTL ? 'justify-end' : 'justify-start'}`}>
              <span className="label-text">{t("languageAppearance.options.language")}</span>
            </label>
            <div className={`flex ${isRTL ? "justify-end" : "justify-start"}`}>
              <DSSelect
                className="select select-bordered w-full max-w-xs"
                value={i18n.language}
                onChange={e => changeLanguage(e.target.value)}
              >
                <option value="ar">{t("languageAppearance.languages.ar")}  🇸🇦</option>
                <option value="en">{t("languageAppearance.languages.en")}  🇺🇸</option>
              </DSSelect>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LanguageAppearanceSection