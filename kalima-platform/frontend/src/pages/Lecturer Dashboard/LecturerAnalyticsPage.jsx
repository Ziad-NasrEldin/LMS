"use client"

import { useTranslation } from "react-i18next"
import { designTokens } from "../../constants/designTokens"
import LecturerOverviewPanel from "./LecturerOverviewPanel"

export default function LecturerAnalyticsPage() {
  const { t, i18n } = useTranslation(["common", "lecturerDashboard"])
  const isRTL = i18n.language === "ar"
  const TOKENS = designTokens.colors
  const GRADIENTS = designTokens.gradients

  return (
    <div
      className="flex min-h-screen flex-col"
      dir={isRTL ? "rtl" : "ltr"}
      style={{ background: `${GRADIENTS.pageAtmosphere}, ${TOKENS.creamSurface}` }}
    >
      <div className="transition-all duration-300 ease-in-out pt-14">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:px-8 lg:px-10 space-y-10 md:space-y-12">
          <div className="rounded-[2rem] border px-5 py-6 md:px-8 md:py-7" style={{ background: TOKENS.neutralCloud, borderColor: "rgba(17,24,39,0.08)" }}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight" style={{ color: TOKENS.deepTeal }}>
              {t("common:Analytics")}
            </h1>
          </div>

          <LecturerOverviewPanel />
        </div>
      </div>
    </div>
  )
}
