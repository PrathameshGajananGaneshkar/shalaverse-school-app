import { useSettings } from '../../context/SettingsContext';
import { useLanguage } from '../../context/LanguageContext';

export function Footer() {
  const { settings } = useSettings();
  const { language } = useLanguage();

  const schoolName = language === 'mr'
    ? (settings.schoolNameLocal || settings.schoolName)
    : settings.schoolName;

  return (
    <footer className="bg-white border-t border-slate-200 py-4 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 print:hidden">
      <div>
        <span className="font-semibold text-slate-700">{schoolName}</span>
        <span className="hidden sm:inline">
          {language === 'mr' ? ' — शाळा प्रवेश व जनरल रजिस्टर व्यवस्थापन' : ' — Admission & General Register Management'}
        </span>
      </div>
      <div className="flex items-center gap-4 text-[11px]">
        <span>
          {language === 'mr' ? 'शैक्षणिक वर्ष: ' : 'Academic Year: '}
          <strong className="text-slate-700">{settings.academicYear || '2026-2027'}</strong>
        </span>
        <span>•</span>
        <span>
          {language === 'mr' ? 'शालाव्हर्स द्वारे समर्थित' : 'Powered by ShalaVerse'}
        </span>
      </div>
    </footer>
  );
}
