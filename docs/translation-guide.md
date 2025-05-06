# Translation Guide

This document explains how to work with translations in this project using i18next and Crowdin.

## Overview

The application uses [i18next](https://www.i18next.com/) and [react-i18next](https://react.i18next.com/) for internationalization. Source translations are stored in JSON files in the `/lang` directory and are managed through [Crowdin](https://crowdin.com/) for collaborative translation.

## Directory Structure

```
/lang
  /en-US        # English (source language)
    /common
      translation.json
  /fr-FR        # French
    /common
      translation.json
  /de-DE        # German
    /common
      translation.json
  /es-ES        # Spanish
    /common
      translation.json
  # Additional languages will be added here
```

## Adding Translations

### For Developers

1. **Use the translation hook in components**:
   ```tsx
   import useTranslation from '@/hooks/useTranslation';
   
   function MyComponent() {
     const { t } = useTranslation();
     
     return (
       <div>
         <h1>{t("Welcome to our application")}</h1>
         <p>{t("This is a translated paragraph.")}</p>
       </div>
     );
   }
   ```

2. **Using namespaced translations**:
   ```tsx
   // For nested translations
   <p>{t("common.settings")}</p>
   <button>{t("auth.signIn")}</button>
   ```

3. **Using variables in translations**:
   ```tsx
   // In code
   t("Hello, {{name}}!", { name: userName })
   
   // In translation file
   {
     "Hello, {{name}}!": "Hello, {{name}}!"
   }
   ```

4. **Extracting translations to JSON files**:
   After adding new translatable text in the code, run:
   ```bash
   npm run extract-translations
   ```
   This will scan the codebase for strings wrapped in `t()` function calls and add them to the translation files.

## Translation Workflow with Crowdin

1. **Upload source files to Crowdin**:
   ```bash
   npm run crowdin:upload
   ```
   This will upload the English source files to Crowdin for translation.

2. **Translate in Crowdin**:
   - Translators work in the Crowdin interface to provide translations for all supported languages
   - Project managers approve translations

3. **Download updated translations**:
   ```bash
   npm run crowdin:download
   ```
   This will download the latest translations from Crowdin to your local `/lang` directory.

4. **Build the project with updated translations**:
   ```bash
   npm run build
   ```

## Adding a New Language

1. Add the language code to the `languages` array in `src/utils/languageUtils.ts`
2. Create the language directory structure:
   ```
   /lang
     /new-language-code
       /common
         translation.json
   ```
3. Add the language to the i18next configuration in `src/i18n.ts`
4. Update the Crowdin configuration in `crowdin.yml` if necessary

## Best Practices

1. **Use simple keys**: Prefer using actual English text as keys rather than abstract identifiers. This makes the source files readable and serves as the fallback.

2. **Maintain context**: Add comments in the code or in Crowdin to explain context for translators when a string might be ambiguous.

3. **Consider text expansion**: Some languages may require more space than English. Design your UI to accommodate text expansion (up to 30% longer).

4. **Test with RTL languages**: If adding support for right-to-left languages like Arabic or Hebrew, ensure your UI adapts correctly.

5. **Keep translations organized**: Use namespaces to categorize translations logically (common, auth, navigation, etc.)

## Troubleshooting

- If translations aren't appearing, check that the language code matches exactly between your language selector and the i18n configuration
- Use the browser console to check for i18next warnings or errors
- Verify that the translation JSON files are properly formatted

## Resources

- [i18next Documentation](https://www.i18next.com/overview/introduction)
- [react-i18next Documentation](https://react.i18next.com/)
- [Crowdin Knowledge Base](https://support.crowdin.com/)
- [i18next Namespace Documentation](https://www.i18next.com/principles/namespaces)