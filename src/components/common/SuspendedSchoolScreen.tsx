import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, 
  Crown, 
  ArrowLeft, 
  CheckCircle2, 
  ExternalLink, 
  Phone, 
  Mail, 
  ShieldAlert, 
  Eye,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { School } from '../../types';

interface SuspendedSchoolScreenProps {
  school: School | null;
  isSuperAdmin: boolean;
  onReactivate?: () => Promise<void> | void;
  onBypass?: () => void;
  onLogout?: () => void;
}

export function SuspendedSchoolScreen({
  school,
  isSuperAdmin,
  onReactivate,
  onBypass,
  onLogout
}: SuspendedSchoolScreenProps) {
  const navigate = useNavigate();
  const [activating, setActivating] = useState(false);
  const [activatedSuccess, setActivatedSuccess] = useState(false);

  const handleReactivateClick = async () => {
    if (!onReactivate) return;
    setActivating(true);
    try {
      await onReactivate();
      setActivatedSuccess(true);
    } catch (err) {
      console.error('Reactivation failed:', err);
    } finally {
      setActivating(false);
    }
  };

  const schoolTitle = school?.schoolNameLocal || school?.schoolName || 'शाळा पोर्टल';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between">
      {/* 1. TOP BAR: If Super Admin, show High-Contrast Control Bar */}
      {isSuperAdmin && (
        <aside 
          aria-label="Super admin simulation controls"
          className="sticky top-0 z-50 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-950 px-4 py-3 shadow-xl border-b-2 border-amber-400 print:hidden"
        >
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 bg-slate-950 text-amber-400 rounded-lg shadow-sm shrink-0">
                <Crown className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs sm:text-sm font-black flex items-center gap-1.5">
                  <span>👑 सुपर ॲडमिन थेट प्रिव्ह्यू (Live Simulation Mode)</span>
                  <span className="text-[10px] bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                    Owner View
                  </span>
                </p>
                <p className="text-[11px] text-slate-900 font-semibold">
                  ही शाळा सध्या बंद (Inactive) आहे. <strong>शाळेला तंतोतंत खालील स्क्रीन दिसत आहे.</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {/* Back to Super Admin */}
              <button
                type="button"
                id="btn-preview-back-superadmin"
                onClick={() => navigate('/super-admin')}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-amber-300 hover:text-white rounded-lg text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>सुपर ॲडमिन हब</span>
              </button>

              {/* Bypass Preview to inspect students/data */}
              {onBypass && (
                <button
                  type="button"
                  id="btn-preview-bypass"
                  onClick={onBypass}
                  className="px-3 py-1.5 bg-amber-200 hover:bg-amber-100 text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-amber-700/40 cursor-pointer"
                  title="शाळेचा डेटा तपासण्यासाठी तात्पुरते आत जा"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>डेटा तपासा (Bypass)</span>
                </button>
              )}

              {/* Reactivate School Now Button */}
              {onReactivate && (
                <button
                  type="button"
                  id="btn-preview-reactivate-school"
                  onClick={handleReactivateClick}
                  disabled={activating || activatedSuccess}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {activating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  )}
                  <span>
                    {activatedSuccess ? 'सुरू झाले!' : (activating ? 'सुरू होत आहे...' : '🟢 शाळा आताच सुरू करा')}
                  </span>
                </button>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* 2. MAIN LOCKOUT CARD: Exact screen seen by the suspended school */}
      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="max-w-lg w-full bg-slate-900/95 border border-rose-500/30 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl backdrop-blur-md animate-in fade-in-50 zoom-in-95">
          {/* Animated Lock Shield */}
          <div className="relative mx-auto w-20 h-20">
            <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border-2 border-rose-500/40 text-rose-500 flex items-center justify-center shadow-lg shadow-rose-950/50">
              <Lock className="w-10 h-10" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-black border-2 border-slate-900">
              ✕
            </div>
          </div>

          {/* Heading & Notice */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>खाते तात्पुरते बंद • Account Suspended</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {schoolTitle}
            </h1>

            {school?.udiseNumber && (
              <p className="text-xs font-mono text-slate-400">
                UDISE: {school.udiseNumber}
              </p>
            )}

            <p className="text-xs sm:text-sm text-slate-300 pt-2 leading-relaxed">
              या शाळेचे वार्षिक सबस्क्रिप्शन किंवा सेवा शुल्क बाकी असल्यामुळे ही प्रणाली तात्पुरती स्थगित करण्यात आली आहे.
            </p>
          </div>

          {/* Contact Details Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 text-left space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
              प्रणाली पुन्हा सुरू करण्यासाठी अधिकृत संपर्क:
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">सुपर ॲडमिन (मालक):</span>
                <span className="font-bold text-amber-300 text-sm">गणेशकर सर (ShalaVerse)</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">WhatsApp / फोन:</span>
                <a 
                  href="tel:+918788000000" 
                  className="font-mono font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>+91 8788000000</span>
                </a>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">ईमेल (Email):</span>
                <a 
                  href="mailto:support@example.com" 
                  className="font-mono text-slate-300 hover:text-white flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>support@example.com</span>
                </a>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            {onLogout && (
              <button
                type="button"
                id="btn-suspended-logout"
                onClick={onLogout}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>लॉगिन पृष्ठावर जा (Go to Login)</span>
              </button>
            )}

            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => navigate('/super-admin')}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>सुपर ॲडमिन पोर्टल वर जा</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* 3. FOOTER */}
      <footer className="text-center py-4 text-[11px] text-slate-500 font-medium">
        ShalaVerse Multi-School Management System • सुरक्षित क्लाऊड सुरक्षा कवच
      </footer>
    </div>
  );
}
