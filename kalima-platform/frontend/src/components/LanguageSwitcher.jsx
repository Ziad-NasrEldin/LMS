import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { designTokens } from '../constants/designTokens';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const savedLang = localStorage.getItem('lng') || 'ar';
    if (i18n.language !== savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('lng', newLang);
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="btn btn-ghost btn-sm rounded-full gap-2 px-3 hover:bg-base-200 transition-colors"
      style={{ color: designTokens.colors.deepTeal }}
      title={i18n.language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
    >
      <Globe className="w-4 h-4" />
      <span className="font-semibold text-sm">
        {i18n.language === 'en' ? 'العربية' : 'EN'}
      </span>
    </button>
  );
};

export default LanguageSwitcher;
