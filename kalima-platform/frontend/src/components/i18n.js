import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend) 
  .use(initReactI18next) 
  .init({
    lng:
      typeof window !== "undefined"
        ? localStorage.getItem("lng") || localStorage.getItem("i18nextLng") || "ar"
        : "ar",
    supportedLngs: ["ar", "en"],
    load: "languageOnly",
    fallbackLng: 'ar', 
    debug: false, 
    defaultNS: "common",
    interpolation: {
      escapeValue: false, 
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json', 
    },
    ns: ['common', 'home', 'privacyPolicy', 'register', 'createUser', 'admin', 'lectureDisplay'],
  });

export default i18n;
