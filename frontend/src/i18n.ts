import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/translation.json';
import taTranslation from './locales/ta/translation.json';
import taAdditionalTranslation from './locales/ta.json';

// Helper function to perform deep merge of objects
function deepMerge(target: any, source: any): any {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

// Helper to check if value is an object
function isObject(item: any): boolean {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

// Deep merge both Tamil translation files to preserve all keys
const mergedTaTranslations = deepMerge(taTranslation, taAdditionalTranslation);

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
        translation: mergedTaTranslations
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
    debug: true // Temporarily enable debug to see what's happening
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
    console.log('Switched to Tamil language');
  } else {
    document.documentElement.classList.add('lang-en');
    document.documentElement.classList.remove('lang-ta');
    console.log('Switched to English language');
  }
});

export default i18n;