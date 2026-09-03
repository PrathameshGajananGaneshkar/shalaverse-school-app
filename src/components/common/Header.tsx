import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Globe, 
  User as UserIcon, 
  LogOut, 
  School, 
  ChevronDown,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { Language } from '../../types';
import { languageNames } from '../../translations';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { userProfile, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { settings } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine current page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return t('dashboard');
    if (path === '/students') return t('studentMaster');
    if (path === '/add-student') return t('addStudent');
    if (path.startsWith('/edit-student')) return t('editStudent');
    if (path === '/documents' || path.startsWith('/documents/')) return t('documents');
    if (path === '/reports') return t('reports');
    if (path === '/settings') return t('settings');
    return 'ShalaVerse';
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs print:hidden">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Left section: mobile hamburger & page title */}
        <div className="flex items-center gap-3">
          <button
            id="btn-toggle-sidebar"
            type="button"
            onClick={onToggleSidebar}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden focus:outline-hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-100">
                <School className="w-3.5 h-3.5 text-blue-700" />
                {settings.academicYear || '2026-2027'}
              </span>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {getPageTitle()}
              </h1>
            </div>
            <p className="text-xs text-slate-500 hidden md:block truncate max-w-md">
              {settings.schoolName} (UDISE: {settings.udiseNumber})
            </p>
          </div>
        </div>

        {/* Right Section: Actions & Dropdowns */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Selector Dropdown */}
          <div className="relative" ref={langRef}>
            <button
              id="btn-lang-selector"
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg border border-slate-200 transition"
              title="Change Language"
            >
              <Globe className="w-4 h-4 text-blue-700" />
              <span className="font-semibold">{languageNames[language].nativeName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in-50 zoom-in-95">
                {(['en', 'mr', 'hi'] as Language[]).map((langKey) => (
                  <button
                    key={langKey}
                    type="button"
                    onClick={() => {
                      setLanguage(langKey);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs sm:text-sm flex items-center justify-between transition ${
                      language === langKey 
                        ? 'bg-blue-50 text-blue-700 font-bold' 
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{languageNames[langKey].label}</span>
                    <span className="text-xs text-slate-500 font-medium">({languageNames[langKey].nativeName})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Profile & Logout */}
          <div className="relative" ref={userRef}>
            <button
              id="btn-user-profile-menu"
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
            >
              <div className="w-7 h-7 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs">
                {userProfile?.displayName?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-none">
                  {userProfile?.displayName || 'Staff Member'}
                </p>
                <p className="text-[10px] text-blue-600 font-medium capitalize mt-0.5">
                  Office Desk
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{userProfile?.displayName || 'Staff Member'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{userProfile?.email || 'staff@shalaverse.edu'}</p>
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" /> Authenticated Staff
                  </span>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <School className="w-4 h-4 text-slate-400" />
                    {t('settings')}
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    id="btn-header-logout"
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
