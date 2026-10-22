import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut, 
  GraduationCap, 
  X,
  ScrollText,
  Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { useSchool } from '../../context/SchoolContext';
import { Crown } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { logout } = useAuth();
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const { isSuperAdmin, currentSchool } = useSchool();
  const navigate = useNavigate();
  const location = useLocation();

  const isSuperAdminPage = location.pathname === '/super-admin';

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navItems = [
    ...(isSuperAdmin ? [{
      to: '/super-admin',
      label: language === 'mr' ? '👑 सुपर ॲडमिन पॅनेल' : '👑 Super Admin Hub',
      icon: Crown,
      id: 'nav-super-admin',
      isSuper: true
    }] : []),
    {
      to: '/dashboard',
      label: t('dashboard'),
      icon: LayoutDashboard,
      id: 'nav-dashboard'
    },
    {
      to: '/students',
      label: t('studentMaster'),
      icon: Users,
      id: 'nav-students'
    },
    {
      to: '/documents',
      label: t('documents'),
      icon: FileText,
      id: 'nav-documents',
      subLinks: [
        { to: '/documents/tc', label: language === 'mr' ? 'शाळा सोडल्याचा दाखला (T.C.)' : 'T.C. (Transfer Certificate)' },
        { to: '/documents/bonafide', label: language === 'mr' ? 'बोनाफाईड प्रमाणपत्र (Bonafide)' : 'Bonafide Certificate' },
        { to: '/documents/nirgam-utara', label: language === 'mr' ? 'निर्गम उतारा (जनरल रजिस्टर उतारा)' : 'Nirgam Utara (Register Extract)' }
      ]
    },
    {
      to: '/reports',
      label: t('reports'),
      icon: BarChart3,
      id: 'nav-reports'
    },
    {
      to: '/settings',
      label: isSuperAdmin 
        ? (language === 'mr' ? '⚙️ सुपर ॲडमिन सेटिंग्ज' : '⚙️ Super Admin Settings')
        : t('settings'),
      icon: Settings,
      id: 'nav-settings'
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden print:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-68 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto print:hidden shadow-xl lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-900/40 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                ShalaVerse
              </h2>
              <p className="text-[10px] text-blue-400 font-medium tracking-wide uppercase">
                {language === 'mr' ? 'प्रवेश व जनरल रजिस्टर' : 'Admission & Register'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Context Badge in Sidebar: On Super Admin page, show Super Admin Hub badge; On school pages, show active school pill */}
        {isSuperAdminPage ? (
          <div className="px-4 py-3 mx-3 my-2 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold">
              <span className="text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-black">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'mr' ? 'सुपर ॲडमिन केंद्र' : 'Super Admin Hub'}</span>
              </span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{language === 'mr' ? 'मालक' : 'Owner'}</span>
              </span>
            </div>
            <p className="text-xs font-black text-white truncate">
              {language === 'mr' ? 'सर्व शाळांचे केंद्रीय नियंत्रण' : 'All Schools Management'}
            </p>
            <p className="text-[10px] text-amber-300/80 font-mono">
              {language === 'mr' ? 'प्लॅटफॉर्म मालक पॅनल' : 'Platform Owner Panel'}
            </p>
          </div>
        ) : currentSchool ? (
          <div className="px-4 py-3 mx-3 my-2 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold">
              <span className="text-blue-400 uppercase tracking-wider flex items-center gap-1">
                <span>🏫</span>
                <span>{language === 'mr' ? 'चालू शाळा' : 'Active School'}</span>
              </span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{language === 'mr' ? 'सक्रिय' : 'Online'}</span>
              </span>
            </div>
            <p className="text-xs font-bold text-white truncate" title={currentSchool.schoolNameLocal || currentSchool.schoolName}>
              {language === 'mr' 
                ? (currentSchool.schoolNameLocal || currentSchool.schoolName) 
                : (currentSchool.schoolName && !/^[\u0900-\u097F]/.test(currentSchool.schoolName) 
                    ? currentSchool.schoolName 
                    : 'Active School Portal')}
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              UDISE: {currentSchool.udiseNumber || '-'}
            </p>
          </div>
        ) : null}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <div key={item.to}>
              <NavLink
                id={item.id}
                to={item.to}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    (item as any).isSuper
                      ? (isActive
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                          : 'bg-amber-950/40 text-amber-300 border border-amber-500/30 hover:bg-amber-900/50 hover:text-white font-bold')
                      : (isActive
                          ? 'bg-blue-700 text-white font-bold shadow-xs'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80')
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            </div>
          ))}
        </nav>

        {/* Bottom Actions: Logout & Version */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-2">
          <button
            id="btn-sidebar-logout"
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-950/50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('logout')}</span>
          </button>

          <div className="pt-2 border-t border-slate-800/60 text-center">
            <p className="text-[10px] text-slate-400">
              ShalaVerse ERP v2.6.0
            </p>
            <p className="text-[9px] text-slate-400">
              {language === 'mr' ? 'महाराष्ट्र शासन शालेय शिक्षण विभाग प्रमाण' : 'Maharashtra School Board Standard'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
