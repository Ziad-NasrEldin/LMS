"use client"

import { useTranslation } from "react-i18next"
import PageHeader from "./PageHeader"
import PersonalInfoSection from "./PersonalInfoSection"
import SecuritySection from "./SecuritySection"
import { designTokens } from "../../constants/designTokens"

function SettingsPage() {
  const { t, i18n } = useTranslation("settings")
  const isRTL = i18n.language === 'ar'
  const TOKENS = designTokens.colors
  const SHADOWS = designTokens.shadows
  const GRADIENTS = designTokens.gradients

  return (
    <div
      className="min-h-screen"
      style={{
        background: `${GRADIENTS.pageAtmosphere}, ${TOKENS.creamSurface}`,
        color: TOKENS.inkText,
      }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-16 md:px-6 lg:px-8">
        <div
          className={`rounded-[2rem] border p-4 md:p-6 lg:p-8 ${isRTL ? 'text-right' : 'text-left'}`}
          style={{
            background: TOKENS.neutralCloud,
            borderColor: "rgba(17,24,39,0.08)",
            boxShadow: SHADOWS.level1,
          }}
        >
          <PageHeader title={t('title')} />

          <div className="space-y-6">
            <PersonalInfoSection />
            <SecuritySection />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
