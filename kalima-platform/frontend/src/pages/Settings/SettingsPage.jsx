"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import PageHeader from "./PageHeader"
import PersonalInfoSection from "./PersonalInfoSection"
import LanguageAppearanceSection from "./LanguageAppearanceSection"
import SecuritySection from "./SecuritySection"
import NotificationsSection from "./NotificationsSection"
import { FaBars } from "react-icons/fa"

function SettingsPage() {
  const { t, i18n } = useTranslation("settings")
  const isRTL = i18n.language === 'ar'
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [formData, setFormData] = useState({
    fullName: t('personalInfo.placeholders.fullName'),
    phoneNumber: t('personalInfo.placeholders.phoneNumber'),
    email: t('personalInfo.placeholders.email'),
    idNumber: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  useEffect(() => {
    setFormData({
      fullName: t('personalInfo.placeholders.fullName'),
      phoneNumber: t('personalInfo.placeholders.phoneNumber'),
      email: t('personalInfo.placeholders.email'),
      idNumber: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
  }, [t])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  return (
      <div 
      className={`flex flex-col ${isRTL ? 'lg:flex-row-reverse' : 'lg:flex-row'} min-h-screen bg-base-100`} 
      dir={isRTL ? 'ltr' : 'rtl'}
    >
      <div className="container mx-auto">

        {/* Main Content */}
        <div className={`flex-1 p-4 lg:p-8 md:pt-4 pt-16 ${isRTL ? 'text-right' : 'text-left'}`}>
          <PageHeader title={t('title')} />

          <PersonalInfoSection 
            formData={formData}
            handleInputChange={handleInputChange}
          />

          <LanguageAppearanceSection 
            title={t('languageAppearance.title')}
            options={t('languageAppearance.options', { returnObjects: true })}
          />

          <SecuritySection
            formData={formData}
            handleInputChange={handleInputChange}
            labels={t('security.labels', { returnObjects: true })}
          />

          <NotificationsSection
            title={t('notifications.title')}
            options={t('notifications.options', { returnObjects: true })}
          />
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
