import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { languages } from '@/utils/languageUtils';
import i18n from '@/i18n';

// Define the context type
interface TranslationContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, options?: any) => string;
  translate: (key: string, options?: any) => Promise<string>;
  isLoading: boolean;
  availableLanguages: typeof languages;
}

// Create the context with a default value
const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, i18n: i18nInstance } = useI18nTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [language, setAppLanguage] = useState(() => {
    return localStorage.getItem('user-language') || 'en-US';
  });

  // Effect to synchronize language changes with i18n and localStorage
  useEffect(() => {
    const changeLanguage = async () => {
      setIsLoading(true);
      try {
        await i18nInstance.changeLanguage(language);
        localStorage.setItem('user-language', language);
      } catch (error) {
        console.error('Failed to change language:', error);
      } finally {
        setIsLoading(false);
      }
    };

    changeLanguage();
  }, [language, i18nInstance]);

  // Set language handler
  const setLanguage = (newLanguage: string) => {
    setAppLanguage(newLanguage);
  };

  // Synchronous translation function
  const translate = (text: string, options?: any): string => {
    return t(text, { ...options });
  };

  // Async translation function for compatibility with previous API
  const translateAsync = async (text: string, options?: any): Promise<string> => {
    return Promise.resolve(translate(text, options));
  };

  // Value to be provided by the context
  const value: TranslationContextType = {
    language,
    setLanguage,
    t: translate,
    translate: translateAsync,
    isLoading,
    availableLanguages: languages
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

// Custom hook to use translation context
export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

export default TranslationProvider;