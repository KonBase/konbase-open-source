import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import language files directly to ensure they're bundled with the app
import enUS from '../lang/en-US/common/translation.json';
import frFR from '../lang/fr-FR/common/translation.json';
import deDE from '../lang/de-DE/common/translation.json';
import esES from '../lang/es-ES/common/translation.json';

// Initialize i18next
i18n
  // Load translations using http backend
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Resources are pre-loaded for better performance and offline support
    resources: {
      'en-US': {
        common: enUS
      },
      'fr-FR': {
        common: frFR
      },
      'de-DE': {
        common: deDE
      },
      'es-ES': {
        common: esES
      }
    },
    // Default language to use if no language is detected
    fallbackLng: 'en-US',
    // Debug output in the console (remove in production)
    debug: process.env.NODE_ENV !== 'production',
    // Default namespace
    defaultNS: 'common',
    // Allow keys to be used as defaults if not found in translation files
    keySeparator: '.',
    interpolation: {
      // React escapes values by default
      escapeValue: false
    },
    react: {
      useSuspense: true
    }
  });

export default i18n;