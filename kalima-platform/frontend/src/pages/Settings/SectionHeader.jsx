import { useTranslation } from "react-i18next"
import { designTokens } from "../../constants/designTokens"

function SectionHeader({ title, icon }) {
  const { i18n } = useTranslation("settings")
  const isRTL = i18n.language === 'ar'
  const TOKENS = designTokens.colors

  return (
    <div className={`mb-3 flex items-center justify-between gap-3 ${isRTL ? "flex-row-reverse" : "flex-row"}`}>
      <h2 className={`text-lg font-bold md:text-xl ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: TOKENS.deepTeal }}>
        {title}
      </h2>
      <div
        className="inline-flex h-8 w-8 items-center justify-center rounded-full"
        style={{
          background: "rgba(14,85,99,0.1)",
          color: TOKENS.deepTeal,
        }}
      >
        {icon || (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        )}
      </div>
    </div>
  )
}

export default SectionHeader