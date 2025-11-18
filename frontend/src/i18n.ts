import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { logDebug } from './utils/logger';

import enTranslation from './locales/en/translation.json';
import taTranslation from './locales/ta/translation.json';

// Get saved language preference or detect from browser
const savedLanguage = localStorage.getItem('perundhu-language');
const detectedLanguage = savedLanguage || navigator.language || 'en';
const defaultLanguage = detectedLanguage.startsWith('ta') ? 'ta' : 'en';

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      ta: {
        translation: taTranslation
      }
    },
    lng: defaultLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already safes from XSS
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'perundhu-language',
      caches: ['localStorage']
    },
    debug: false // Disable debug in production
  });

// Handle language changes and store in localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('perundhu-language', lng);
  document.documentElement.lang = lng;
  
  // Both English and Tamil are left-to-right, but we set it explicitly to ensure consistency
  document.documentElement.dir = 'ltr';
  
  // Apply language-specific font adjustments if needed
  if (lng === 'ta') {
    document.documentElement.classList.add('lang-ta');
    document.documentElement.classList.remove('lang-en');
    logDebug('Switched to Tamil language', { component: 'i18n' });
  } else {
    document.documentElement.classList.add('lang-en');
    document.documentElement.classList.remove('lang-ta');
    logDebug('Switched to English language', { component: 'i18n' });
  }
});

export default i18n;