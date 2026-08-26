import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../common/Header';
import { Sidebar } from '../common/Sidebar';
import { Footer } from '../common/Footer';

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-900 antialiased font-sans">
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
