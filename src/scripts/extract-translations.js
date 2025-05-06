const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const sourceDir = path.resolve(__dirname, '../src');
const outputFile = path.resolve(__dirname, '../lang/en-US/common/translation.json');

// Regular expressions to match translation function calls
const translationRegexps = [
  /t\(['"](.+?)['"]\)/g,                // t('key')
  /translate\(['"](.+?)['"]\)/g,        // translate('key')
  /useTranslation\(\)\.t\(['"](.+?)['"]\)/g, // useTranslation().t('key')
  /\{t\(['"](.+?)['"]\)\}/g,           // {t('key')}
];

async function extractTranslations() {
  // Find all TypeScript and TSX files
  const files = glob.sync(`${sourceDir}/**/*.{ts,tsx}`);
  
  // Extract existing translations if the file exists
  let existingTranslations = {};
  if (fs.existsSync(outputFile)) {
    existingTranslations = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
  }

  const translations = { ...existingTranslations };
  const newTranslations = {};

  // Process each file
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');

    // Apply each regex to extract translation keys
    for (const regex of translationRegexps) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const key = match[1];
        
        // Categorize keys based on their structure and content
        let category = 'common';
        
        if (key.toLowerCase().includes('sign in') || 
            key.toLowerCase().includes('login') || 
            key.toLowerCase().includes('password')) {
          category = 'auth';
        } else if (key.toLowerCase().includes('dashboard') || 
                  key.toLowerCase().includes('profile') || 
                  key.toLowerCase().includes('settings') ||
                  key.toLowerCase().includes('logout')) {
          category = 'navigation';
        }
        
        // Ensure the category exists in both objects
        if (!translations[category]) translations[category] = {};
        if (!newTranslations[category]) newTranslations[category] = {};
        
        // Generate a safe key by removing special characters and spaces
        const safeKey = key
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .replace(/\s+/g, '');
          
        // Add to translations if it doesn't exist
        if (!translations[category][safeKey]) {
          translations[category][safeKey] = key;
          newTranslations[category][safeKey] = key;
        }
      }
    }
  }

  // Output stats
  console.log(`Found ${Object.keys(newTranslations).reduce((acc, category) => 
    acc + Object.keys(newTranslations[category]).length, 0)} new translation keys`);
  
  // Create directory if it doesn't exist
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write the complete translations to file
  fs.writeFileSync(
    outputFile,
    JSON.stringify(translations, null, 2),
    'utf8'
  );
  
  console.log(`Translations saved to ${outputFile}`);
}

// Run the extraction
extractTranslations().catch(console.error);