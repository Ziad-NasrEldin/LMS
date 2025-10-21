"use client"
import { useNavigate } from "react-router-dom"
import { useTranslation } from 'react-i18next'

const MobileOnly = () => {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('lecturesPage')
  const isRTL = i18n.language === 'ar'

  const handleBack = () => {
    navigate("/")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold text-primary mb-4">{t('mobileOnly.title')}</h1>
      <p className="text-base-content mb-6">{t('mobileOnly.message')}</p>
      <button onClick={handleBack} className="btn btn-primary">
        {t('mobileOnly.backButton')}
      </button>
    </div>
  )
}

export default MobileOnly