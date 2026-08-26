import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from '../types';
import { en, TranslationKey } from '../translations/en';
import { translations, getTranslation } from '../translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  strings: typeof en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('shalaverse_language') as Language;
    return saved && (saved === 'en' || saved === 'mr' || saved === 'hi') ? saved : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('shalaverse_language', lang);
  };

  const t = (key: TranslationKey): string => {
    return getTranslation(language, key);
  };

  const strings = translations[language] || translations.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, strings }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
