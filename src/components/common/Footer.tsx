import { useSettings } from '../../context/SettingsContext';

export function Footer() {
  const { settings } = useSettings();

  return (
    <footer className="bg-white border-t border-slate-200 py-4 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 print:hidden">
      <div>
        <span className="font-semibold text-slate-700">{settings.schoolName}</span>
        <span className="hidden sm:inline"> — Admission & General Register Management</span>
      </div>
      <div className="flex items-center gap-4 text-[11px]">
        <span>Academic Year: <strong className="text-slate-700">{settings.academicYear || '2026-2027'}</strong></span>
        <span>•</span>
        <span>Powered by <strong className="text-blue-700">ShalaVerse</strong></span>
      </div>
    </footer>
  );
}
