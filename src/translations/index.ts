import { en, TranslationKey } from './en';
import { mr } from './mr';
import { hi } from './hi';
import { Language } from '../types';

export const translations: Record<Language, typeof en> = {
  en,
  mr,
  hi
};

export const languageNames: Record<Language, { label: string; flag: string; nativeName: string }> = {
  en: { label: 'English', flag: '🇬🇧', nativeName: 'English' },
  mr: { label: 'Marathi', flag: '🇮🇳', nativeName: 'मराठी' },
  hi: { label: 'Hindi', flag: '🇮🇳', nativeName: 'हिंदी' },
};

export function getTranslation(lang: Language, key: TranslationKey): string {
  const current = translations[lang] || translations.en;
  return current[key] || translations.en[key] || (key as string);
}
