import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { SettingsProvider } from './context/SettingsContext';

import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { StudentMaster } from './pages/StudentMaster';
import { AddStudent } from './pages/AddStudent';
import { EditStudent } from './pages/EditStudent';
import { Documents } from './pages/Documents';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { LoadingSpinner } from './components/common/LoadingSpinner';

function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

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

  return <Outlet />;
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
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
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </SettingsProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
