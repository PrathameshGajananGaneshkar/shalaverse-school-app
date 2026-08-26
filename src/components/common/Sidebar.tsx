import { NavLink, useNavigate } from 'react-router-dom';
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

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { logout } = useAuth();
  const { t } = useLanguage();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navItems = [
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
        { to: '/documents/tc', label: 'T.C. (Transfer Certificate)' },
        { to: '/documents/bonafide', label: 'Bonafide Certificate' },
        { to: '/documents/nirgam-utara', label: 'Nirgam Utara (Register Extract)' }
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
      label: t('settings'),
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
                Admission & Register
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* School Snapshot Pill */}
        <div className="px-4 py-3 mx-3 my-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
          <p className="text-xs font-semibold text-slate-200 truncate">{settings.schoolName}</p>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
            <span>UDISE: {settings.udiseNumber}</span>
            <span className="text-emerald-400 font-bold">Online</span>
          </div>
        </div>

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
                    isActive
                      ? 'bg-blue-700 text-white font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
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
              Maharashtra School Board Standard
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
