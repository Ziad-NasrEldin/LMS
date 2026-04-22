"use client"

import { useTranslation } from "react-i18next"
import PromoCodeGenerator from "./home/PromoCodesGenerator"
import PromoCodesTable from "./home/PromoCodesTable"
import { designTokens } from "../../../constants/designTokens"

const PromoCodesManagementPage = () => {
  const { t, i18n } = useTranslation("common")
  const isRTL = i18n.language === "ar"

  const TOKENS = designTokens.colors
  const GRADIENTS = designTokens.gradients

  return (
    <div
      className="relative mx-auto min-h-screen w-full p-4 md:p-8"
      dir={isRTL ? "rtl" : "ltr"}
      style={{ background: TOKENS.creamSurface, color: TOKENS.inkText }}
    >
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-50"
        style={{ background: GRADIENTS.pageAtmosphere }}
      />

      <div className="mx-auto w-full max-w-7xl space-y-6 md:space-y-8">
        <div className={`rounded-3xl bg-white/80 p-4 md:p-6 ${isRTL ? "text-right" : "text-left"}`}>
          <h1 className="text-2xl font-bold md:text-3xl" style={{ color: TOKENS.deepTeal }}>
            {t("promoCodesManagement", { defaultValue: isRTL ? "إدارة أكواد الشحن" : "Promo Codes Management" })}
          </h1>
        <p className="mt-2 text-sm text-slate-700 md:text-base">
            {isRTL
              ? "إنشاء أكواد جديدة، ومراجعة الأكواد الحالية، وإدارة الحذف من صفحة مستقلة."
              : "Create new promo codes, review existing codes, and manage deletions from a dedicated page."}
          </p>
        </div>

        <section className="rounded-3xl bg-white/80 p-3 md:p-5">
          <PromoCodeGenerator />
        </section>

        <section className="rounded-3xl bg-white/80 p-3 md:p-5">
          <PromoCodesTable />
        </section>
      </div>
    </div>
  )
}

export default PromoCodesManagementPage
