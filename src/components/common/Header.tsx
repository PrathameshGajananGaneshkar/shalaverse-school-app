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
  ShieldCheck,
  Crown,
  Building
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { useSchool } from '../../context/SchoolContext';
import { Language } from '../../types';
import { languageNames } from '../../translations';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { userProfile, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { settings } = useSettings();
  const { isSuperAdmin, currentSchool, allSchools, selectSchool } = useSchool();
  const location = useLocation();
  const navigate = useNavigate();

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [schoolDropdownOpen, setSchoolDropdownOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const schoolRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (schoolRef.current && !schoolRef.current.contains(e.target as Node)) {
        setSchoolDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine current page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/super-admin') return language === 'mr' ? 'सुपर ॲडमिन हब' : 'Super Admin Hub';
    if (path === '/' || path === '/dashboard') return t('dashboard');
    if (path === '/students') return t('studentMaster');
    if (path === '/add-student') return t('addStudent');
    if (path.startsWith('/edit-student')) return t('editStudent');
    if (path === '/documents' || path.startsWith('/documents/')) return t('documents');
    if (path === '/reports') return t('reports');
    if (path === '/settings') return isSuperAdmin ? (language === 'mr' ? 'सुपर ॲडमिन सेटिंग्ज' : 'Super Admin Settings') : t('settings');
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
              {isSuperAdmin ? (
                <button
                  type="button"
                  onClick={() => navigate('/super-admin')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-black bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-xs transition cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>{language === 'mr' ? 'सुपर ॲडमिन' : 'Super Admin'}</span>
                </button>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-100">
                  <School className="w-3.5 h-3.5 text-blue-700" />
                  {language === 'mr' ? 'शै. वर्ष: ' : 'Acad. Year: '}{currentSchool?.academicYear || settings.academicYear || '2026-2027'}
                </span>
              )}
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {getPageTitle()}
              </h1>
            </div>
            {location.pathname === '/super-admin' ? (
              <p className="text-xs text-slate-500 hidden sm:block truncate max-w-md mt-0.5">
                {language === 'mr' 
                  ? 'प्लॅटफॉर्म मालक केंद्र • सर्व शाळांचे नियंत्रण' 
                  : 'Platform Owner • Multi-School SaaS Management'}
              </p>
            ) : location.pathname === '/settings' && isSuperAdmin ? (
              <p className="text-xs text-slate-500 hidden sm:block truncate max-w-md mt-0.5">
                {language === 'mr' 
                  ? 'प्लॅटफॉर्म मास्टर व ग्लोबल सिस्टम सेटिंग्ज' 
                  : 'Platform Master & Global System Settings'}
              </p>
            ) : (
              <p className="text-xs text-slate-600 hidden sm:block truncate max-w-md mt-0.5">
                <span className="font-semibold text-slate-900">
                  {language === 'mr' 
                    ? (currentSchool?.schoolNameLocal || currentSchool?.schoolName || settings.schoolNameLocal || settings.schoolName) 
                    : (
                        currentSchool?.schoolName && !/^[\u0900-\u097F]/.test(currentSchool.schoolName)
                          ? currentSchool.schoolName
                          : (settings.schoolName && !/^[\u0900-\u097F]/.test(settings.schoolName)
                              ? settings.schoolName
                              : 'School Portal')
                      )}
                </span>
                <span className="text-slate-400 mx-1.5">•</span>
                <span className="font-mono text-slate-500">{language === 'mr' ? 'युडायस' : 'UDISE'}: {currentSchool?.udiseNumber || settings.udiseNumber}</span>
              </p>
            )}
          </div>
        </div>

        {/* Right Section: Actions & Dropdowns */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Super Admin School Switcher Dropdown (Only on school portal pages, never on Super Admin page) */}
          {isSuperAdmin && location.pathname !== '/super-admin' && allSchools.length > 0 && (
            <div className="relative hidden sm:block" ref={schoolRef}>
              <button
                type="button"
                id="btn-header-school-switcher"
                onClick={() => setSchoolDropdownOpen(!schoolDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-950 rounded-lg text-xs font-black transition cursor-pointer shadow-2xs"
                title={language === 'mr' ? 'शाळा बदला (Switch School)' : 'Switch School'}
              >
                <Building className="w-3.5 h-3.5 text-indigo-700" />
                <span className="max-w-[140px] truncate">
                  {language === 'mr' 
                    ? (currentSchool?.schoolNameLocal || currentSchool?.schoolName || 'शाळा निवडा')
                    : (currentSchool?.schoolName || currentSchool?.schoolNameLocal || 'Select School')}
                </span>
                <ChevronDown className="w-3 h-3 text-indigo-600" />
              </button>

              {schoolDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>{language === 'mr' ? 'सर्व शाळा' : 'All Schools'} ({allSchools.length})</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSchoolDropdownOpen(false);
                        navigate('/super-admin');
                      }}
                      className="text-indigo-600 hover:underline text-[11px]"
                    >
                      {language === 'mr' ? '+ शाळा व्यवस्थापन' : '+ Manage Schools'}
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {allSchools.map((sch) => {
                      const isSel = currentSchool?.id === sch.id;
                      return (
                        <button
                          key={sch.id}
                          type="button"
                          onClick={() => {
                            selectSchool(sch.id);
                            setSchoolDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition cursor-pointer ${
                            isSel ? 'bg-indigo-50 font-bold text-indigo-950 border-l-4 border-indigo-600' : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <p className="truncate font-semibold">
                              {language === 'mr' ? (sch.schoolNameLocal || sch.schoolName) : (sch.schoolName || sch.schoolNameLocal)}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">UDISE: {sch.udiseNumber}</p>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${sch.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {sch.status === 'active' ? 'Active' : 'Off'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Language Selector Dropdown */}
          <div className="relative" ref={langRef}>
            <button
              id="btn-lang-selector"
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg border border-slate-200 transition cursor-pointer"
              title={language === 'mr' ? 'भाषा बदला' : 'Change Language'}
            >
              <Globe className="w-4 h-4 text-blue-700" />
              <span className="font-semibold">{languageNames[language].nativeName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in-50 zoom-in-95">
                {(['mr', 'en'] as Language[]).map((langKey) => (
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
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs select-none">
                {(() => {
                  if (isSuperAdmin) {
                    return language === 'mr' ? 'सु' : 'S';
                  }
                  if (language === 'mr') {
                    const mrName = currentSchool?.schoolNameLocal || settings.schoolNameLocal || userProfile?.displayName || 'शा';
                    return mrName.trim().charAt(0) || 'शा';
                  } else {
                    const enName = currentSchool?.schoolName || settings.schoolName || 'School';
                    const firstChar = enName.trim().charAt(0).toUpperCase();
                    return /^[A-Z0-9]/.test(firstChar) ? firstChar : 'S';
                  }
                })()}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-none">
                  {isSuperAdmin 
                    ? (language === 'mr' ? 'सुपर ॲडमिन' : 'Super Admin')
                    : (language === 'mr' 
                        ? (currentSchool?.schoolNameLocal || settings.schoolNameLocal || 'कार्यालयीन कर्मचारी') 
                        : (
                            currentSchool?.schoolName && !/^[\u0900-\u097F]/.test(currentSchool.schoolName)
                              ? currentSchool.schoolName
                              : (settings.schoolName && !/^[\u0900-\u097F]/.test(settings.schoolName)
                                  ? settings.schoolName
                                  : 'Office Staff')
                          ))}
                </p>
                <p className="text-[10px] text-blue-600 font-medium capitalize mt-0.5">
                  {isSuperAdmin 
                    ? (language === 'mr' ? 'मुख्य प्रशासक' : 'Chief Admin') 
                    : (language === 'mr' ? 'कार्यालय डेस्क' : 'Office Desk')}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">
                    {isSuperAdmin 
                      ? (language === 'mr' ? 'सुपर ॲडमिन' : 'Super Admin')
                      : (language === 'mr' 
                          ? (currentSchool?.schoolNameLocal || settings.schoolNameLocal || 'कार्यालयीन कर्मचारी') 
                          : (currentSchool?.schoolName || settings.schoolName || 'Office Staff'))}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{userProfile?.email || 'admin@example.com'}</p>
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" /> {isSuperAdmin ? (language === 'mr' ? 'प्रमाणित सुपर ॲडमिन' : 'Verified Super Admin') : (language === 'mr' ? 'प्रमाणित कर्मचारी' : 'Authenticated Staff')}
                  </span>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    {isSuperAdmin ? <Crown className="w-4 h-4 text-amber-500" /> : <School className="w-4 h-4 text-slate-400" />}
                    <span>{isSuperAdmin ? (language === 'mr' ? 'सुपर ॲडमिन मास्टर सेटिंग्ज' : 'Super Admin Settings') : t('settings')}</span>
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
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('logout')}</span>
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
