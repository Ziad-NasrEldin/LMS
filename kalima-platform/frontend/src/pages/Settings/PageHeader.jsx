import { useTranslation } from "react-i18next"
import { designTokens } from "../../constants/designTokens"

function PageHeader({ title }) {
  const { t, i18n } = useTranslation("settings")
  const isRTL = i18n.language === "ar"
  const TOKENS = designTokens.colors

  return (
    <div
      className="mb-6 rounded-3xl border px-4 py-5 md:px-6"
      style={{
        background: "rgba(255,255,255,0.72)",
        borderColor: "rgba(17,24,39,0.08)",
      }}
    >
      <div className={`flex flex-col gap-3 sm:items-center sm:justify-between ${isRTL ? "sm:flex-row-reverse" : "sm:flex-row"}`}>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold md:text-3xl" style={{ color: TOKENS.deepTeal }}>
            {title}
          </h1>
          <p className="mt-1 text-sm md:text-base" style={{ color: TOKENS.slateText }}>
            {t("personalInfo.subtitle")}
          </p>
        </div>
        <span
          className="self-start sm:self-auto rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap"
          style={{
            background: "rgba(14,85,99,0.1)",
            color: TOKENS.deepTeal,
          }}
        >
          {t("title")}
        </span>
      </div>
    </div>
  )
}

export default PageHeader
  
  