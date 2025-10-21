import { useTranslation } from "react-i18next"

function SectionHeader({ title, icon }) {
  const { i18n } = useTranslation("settings")
  const isRTL = i18n.language === 'ar'

  return (
    <div className={`flex items-center flex-row justify-between mb-4 gap-2`}>
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
      <h2 className={`text-xl font-bold ${isRTL ? 'text-right' : 'text-left'}`}>{title}</h2>
    </div>
  )
}

export default SectionHeader