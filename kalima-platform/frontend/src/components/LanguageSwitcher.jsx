import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { designTokens } from '../constants/designTokens';
import Button from './ui/Button'

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
     <Button
       type="button"
       onClick={toggleLanguage}
       variant="ghost"
       size="sm"
       className="rounded-full gap-2 px-3 hover:bg-slate-100 transition-colors"
       style={{ color: designTokens.colors.deepTeal }}
       title={i18n.language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
     >
       <Globe className="w-4 h-4" />
       <span className="font-semibold text-sm">
         {i18n.language === 'en' ? 'العربية' : 'EN'}
       </span>
     </Button>
   );
};

export default LanguageSwitcher;
