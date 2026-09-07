import { en, TranslationKey } from './en';
import { mr } from './mr';
import { Language } from '../types';

export const translations: Record<Language, typeof en> = {
  en,
  mr
};

export const languageNames: Record<Language, { label: string; flag: string; nativeName: string }> = {
  mr: { label: 'Marathi', flag: '🇮🇳', nativeName: 'मराठी' },
  en: { label: 'English', flag: '🇬🇧', nativeName: 'English' },
};

export function getTranslation(lang: Language, key: TranslationKey): string {
  const current = translations[lang] || translations.en;
  return current[key] || translations.en[key] || (key as string);
}
