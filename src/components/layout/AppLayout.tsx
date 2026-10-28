import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../common/Header';
import { Sidebar } from '../common/Sidebar';
import { Footer } from '../common/Footer';
import { useSchool } from '../../context/SchoolContext';
import { useLanguage } from '../../context/LanguageContext';
import { Crown } from 'lucide-react';

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isSuperAdmin, currentSchool } = useSchool();
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-900 antialiased font-sans">
      {/* Contextual Super Admin notification bar */}
      {isSuperAdmin && location.pathname !== '/super-admin' && (
        <div className="bg-amber-400 text-slate-950 px-4 py-1.5 flex items-center justify-between text-xs font-bold border-b border-amber-500 shadow-2xs print:hidden">
          <div className="flex items-center gap-2 truncate">
            <Crown className="w-4 h-4 text-slate-950 shrink-0 fill-slate-950" />
            <span className="truncate">
              {language === 'mr' ? (
                <>सुपर ॲडमिन मोड: तुम्ही <strong>{currentSchool?.schoolNameLocal || currentSchool?.schoolName}</strong> चे पोर्टल पाहत आहात</>
              ) : (
                <>Super Admin Mode: Viewing portal of <strong>{currentSchool?.schoolName || currentSchool?.schoolNameLocal}</strong></>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              id="btn-banner-superadmin-hub"
              onClick={() => navigate('/super-admin')}
              className="px-2.5 py-0.5 bg-slate-950 hover:bg-slate-800 text-amber-300 rounded text-[11px] font-black transition cursor-pointer"
            >
              {language === 'mr' ? '👑 सर्व शाळा व्यवस्थापन' : '👑 All Schools Hub'}
            </button>
          </div>
        </div>
      )}

      {/* Top Header Navigation (Hidden during printing) */}
      <div className="print:hidden">
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Hidden during printing) */}
        <div className="print:hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 print:p-0 print:overflow-visible">
          <Outlet />
        </main>
      </div>

      {/* Bottom Footer (Hidden during printing) */}
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
