import React, { useState } from 'react';
import useTranslation from '../../hooks/useTranslation';
import { languages } from '../../utils/languageUtils';

const TranslationDemo = () => {
  const { t, language, setLanguage } = useTranslation();
  const [showRawKeys, setShowRawKeys] = useState(false);
  
  // Sample nested translation keys to demonstrate dot notation
  const nestedKey = 'common.settings';
  const authKey = 'auth.signIn';
  
  return (
    <div className="p-6 bg-card rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-4">{t("Translation System Demo")}</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          {t("Select Language")}
        </label>
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name} {lang.nativeName !== lang.name && `(${lang.nativeName})`}
            </option>
          ))}
        </select>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 bg-muted rounded-md">
          <h3 className="font-semibold mb-2">{t("Translation Example")}</h3>
          <p>
            {t("This text is translated using the new i18next integration.")}
          </p>
        </div>
        
        <div className="p-4 bg-muted rounded-md">
          <h3 className="font-semibold mb-2">{t("Nested Translation Keys")}</h3>
          <p>
            {showRawKeys ? nestedKey : t(nestedKey)} / {showRawKeys ? authKey : t(authKey)}
          </p>
          <button 
            className="mt-2 px-3 py-1 bg-primary text-primary-foreground text-sm rounded-md"
            onClick={() => setShowRawKeys(!showRawKeys)}
          >
            {showRawKeys ? t("Show Translated") : t("Show Raw Keys")}
          </button>
        </div>
        
        <div className="p-4 bg-muted rounded-md">
          <h3 className="font-semibold mb-2">{t("Common UI Elements")}</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-background p-2 rounded">{t("common.account")}</div>
            <div className="bg-background p-2 rounded">{t("common.appearance")}</div>
            <div className="bg-background p-2 rounded">{t("common.notifications")}</div>
            <div className="bg-background p-2 rounded">{t("common.security")}</div>
          </div>
        </div>
        
        <div className="p-4 bg-muted rounded-md">
          <h3 className="font-semibold mb-2">{t("Navigation Items")}</h3>
          <div className="flex flex-wrap gap-2">
            <div className="bg-background px-3 py-1 rounded">{t("navigation.dashboard")}</div>
            <div className="bg-background px-3 py-1 rounded">{t("navigation.inventory")}</div>
            <div className="bg-background px-3 py-1 rounded">{t("navigation.reports")}</div>
            <div className="bg-background px-3 py-1 rounded">{t("navigation.settings")}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationDemo;