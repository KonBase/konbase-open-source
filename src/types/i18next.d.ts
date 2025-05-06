import 'i18next';
import enUS from '../../lang/en-US/common/translation.json';

// Create a type from the English translation file
type TranslationResource = typeof enUS;

declare module 'i18next' {
  // Extend the i18n interface
  interface CustomTypeOptions {
    // Define the structure of the resources
    resources: {
      common: TranslationResource;
    };
    // Define default namespace
    defaultNS: 'common';
    // Define fallback namespace
    fallbackNS: 'common';
  }
}