import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { SettingsProvider } from './context/SettingsContext';
import { SchoolProvider } from './context/SchoolContext';

import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { StudentMaster } from './pages/StudentMaster';
import { AddStudent } from './pages/AddStudent';
import { EditStudent } from './pages/EditStudent';
import { Documents } from './pages/Documents';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { SuperAdmin } from './pages/SuperAdmin';
import { Login } from './pages/Login';
import { LoadingSpinner } from './components/common/LoadingSpinner';

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useSchool } from './context/SchoolContext';
import { SuspendedSchoolScreen } from './components/common/SuspendedSchoolScreen';

function ProtectedRoute() {
  const { isAuthenticated, loading, logout } = useAuth();
  const { currentSchool, isSuperAdmin, toggleSchoolStatus } = useSchool();
  const [bypassPreview, setBypassPreview] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <LoadingSpinner label="Authenticating school portal..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If school is inactive and user is on a school portal route (not super-admin portal)
  const isInactive = currentSchool?.status === 'inactive';
  const isSuperAdminPortal = location.pathname === '/super-admin';

  if (isInactive && !isSuperAdminPortal && !bypassPreview) {
    return (
      <SuspendedSchoolScreen
        school={currentSchool}
        isSuperAdmin={isSuperAdmin}
        onReactivate={async () => {
          if (currentSchool?.id) {
            await toggleSchoolStatus(currentSchool.id, 'active');
          }
        }}
        onBypass={() => setBypassPreview(true)}
        onLogout={logout}
      />
    );
  }

  return (
    <>
      {isInactive && isSuperAdmin && bypassPreview && (
        <div className="bg-rose-950 text-white px-4 py-2 border-b border-rose-500/40 text-xs font-bold flex items-center justify-between sticky top-0 z-40">
          <span className="flex items-center gap-1.5 text-rose-300">
            ⚠️ <span>तुम्ही सध्या सस्पेंड असलेल्या शाळेचा डेटा पाहत आहात (Bypass Mode). ही शाळा सामान्य वापरकर्त्यांसाठी बंद आहे.</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                if (currentSchool?.id) {
                  await toggleSchoolStatus(currentSchool.id, 'active');
                }
              }}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-black cursor-pointer"
            >
              🟢 शाळा सुरू करा
            </button>
            <button
              type="button"
              onClick={() => setBypassPreview(false)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-bold cursor-pointer"
            >
              सस्पेंशन स्क्रीन पहा
            </button>
          </div>
        </div>
      )}
      <Outlet />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <SchoolProvider>
          <SettingsProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Login Route */}
                <Route path="/login" element={<Login />} />

                {/* Protected School Portal Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<AppLayout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="super-admin" element={<SuperAdmin />} />
                    <Route path="students" element={<StudentMaster />} />
                    <Route path="add-student" element={<AddStudent />} />
                    <Route path="edit-student/:id" element={<EditStudent />} />
                    
                    {/* Document Hub & Certificate Routes */}
                    <Route path="documents" element={<Documents />} />
                    <Route path="documents/tc" element={<Documents />} />
                    <Route path="documents/bonafide" element={<Documents />} />
                    <Route path="documents/nirgam-utara" element={<Documents />} />

                    {/* Reports & Statistics */}
                    <Route path="reports" element={<Reports />} />

                    {/* School Settings & DB Sync */}
                    <Route path="settings" element={<Settings />} />
                  </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </BrowserRouter>
          </SettingsProvider>
        </SchoolProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
