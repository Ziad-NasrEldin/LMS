import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const savedLang = localStorage.getItem('lng') || 'ar';
    i18n.changeLanguage(savedLang);

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [i18n]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('lng', lng);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="btn btn-ghost gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        {i18n.language === 'en' ? 'Language' : 'اللغه'}
      </button>

      {isOpen && (
        <ul className="absolute right-0 mt-2 w-52 p-2 shadow bg-base-100 rounded-box menu z-[50]">
          <li>
            <button
              type="button"
              onClick={() => changeLanguage('en')}
              className="flex justify-between w-full hover:bg-base-200"
            >
              <span>English</span>
              <span>🇺🇸</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => changeLanguage('ar')}
              className="flex justify-between w-full hover:bg-base-200"
            >
              <span>العربية</span>
              <span>🇸🇦</span>
            </button>
          </li>
        </ul>
      )}
    </div>
  );
};

export default LanguageSwitcher;
