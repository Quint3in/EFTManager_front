import { createContext, useContext, useState } from 'react';

const SUPPORTED_LANGUAGES = ['es', 'en'];
const STORAGE_KEY = 'appLanguage';

function detectBrowserLanguage() {
  const raw = navigator.language || navigator.userLanguage || 'en';
  const short = raw.slice(0, 2).toLowerCase();
  return SUPPORTED_LANGUAGES.includes(short) ? short : 'en';
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || detectBrowserLanguage();
  });

  function setLanguage(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
    setLanguageState(lang);
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, supportedLanguages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}