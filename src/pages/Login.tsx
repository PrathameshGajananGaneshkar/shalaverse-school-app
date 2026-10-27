import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  School, 
  Lock, 
  Mail, 
  LogIn,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Sparkles,
  Globe,
  Crown,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function Login() {
  const { login, resetPassword, isAuthenticated, userProfile } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      if (userProfile?.role === 'super_admin') {
        navigate('/super-admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, userProfile, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPin, setForgotPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError(language === 'mr' ? 'कृपया ईमेल / युडायस आणि पासवर्ड प्रविष्ट करा.' : 'Please enter Email / UDISE and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const profile = await login(email.trim(), password.trim());
      if (profile?.role === 'super_admin') {
        navigate('/super-admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.warn('Login attempt failed:', err?.message || err);
      setError(err?.message || (language === 'mr' ? 'चुकीचा ईमेल/युडायस किंवा पासवर्ड! कृपया योग्य माहिती प्रविष्ट करा.' : 'Authentication failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    const cleanForgotId = forgotEmail.trim();
    const cleanNewPass = newPassword.trim();

    if (!cleanForgotId) {
      setForgotError(language === 'mr' ? 'कृपया नोंदणीकृत ईमेल किंवा युडायस नंबर प्रविष्ट करा.' : 'Please enter registered email or UDISE number.');
      return;
    }

    if (!cleanNewPass || cleanNewPass.length < 4) {
      setForgotError(language === 'mr' ? 'नवीन पासवर्ड किमान ४ अक्षरांचा असावा.' : 'New password must be at least 4 characters long.');
      return;
    }

    if (cleanNewPass !== confirmPassword.trim()) {
      setForgotError(language === 'mr' ? 'नवीन पासवर्ड आणि कन्फर्म पासवर्ड जुळत नाहीत.' : 'Passwords do not match.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await resetPassword(cleanForgotId, cleanNewPass, forgotPin.trim());
      if (res.success) {
        // Immediately update login form fields with the verified credentials
        setEmail(cleanForgotId);
        setPassword(cleanNewPass);
        setError(null);
        setSuccessMsg(language === 'mr' ? 'नवीन पासवर्ड त्वरित अपडेट झाला आहे!' : 'Password updated immediately!');
        setForgotSuccess(language === 'mr' ? 'पासवर्ड यशस्वीरित्या बदलला आहे! त्वरित लॉगिन होत आहे...' : 'Password updated! Logging you in...');

        // Attempt instant auto-login with newly set password
        try {
          const profile = await login(cleanForgotId, cleanNewPass);
          setTimeout(() => {
            setShowForgotModal(false);
            setForgotSuccess(null);
            if (profile?.role === 'super_admin') {
              navigate('/super-admin', { replace: true });
            } else {
              navigate('/dashboard', { replace: true });
            }
          }, 400);
          return;
        } catch {
          // If auto login needs user click, keep fields populated and close modal smoothly
          setForgotSuccess(language === 'mr' ? 'पासवर्ड त्वरित अपडेट झाला आहे! आपण आता नवीन पासवर्डने लॉगिन करू शकता.' : 'Password updated immediately! You can now log in.');
          setTimeout(() => {
            setShowForgotModal(false);
            setForgotSuccess(null);
          }, 1200);
        }
      } else {
        setForgotError(res.message);
      }
    } catch (err: any) {
      setForgotError(err?.message || (language === 'mr' ? 'पासवर्ड रीसेट करताना त्रुटी आली.' : 'Password reset failed.'));
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>

      {/* Top Language Switcher Bar */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-lg backdrop-blur-md">
        <Globe className="w-4 h-4 text-slate-400 ml-2" />
        <button
          type="button"
          onClick={() => setLanguage('mr')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            language === 'mr'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          मराठी
        </button>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            language === 'en'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          English
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Heading */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-xl shadow-blue-600/30 mb-3.5 border border-blue-400/40">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider">
            SHALAVERSE
          </h1>
          <p className="text-xs sm:text-sm text-blue-300 font-medium mt-1 max-w-sm mx-auto leading-relaxed">
            {language === 'mr' 
              ? 'शाळा प्रवेश व जनरल रजिस्टर व्यवस्थापन प्रणाली' 
              : 'School Admission & General Register Management System'}
          </p>
        </div>

        {/* Main Login Card */}
        <div className="mt-6 bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-5">
          
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <LogIn className="w-5 h-5 text-blue-400" />
              <span>{language === 'mr' ? 'लॉगिन करा' : 'Sign In to Your Account'}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'mr'
                ? 'शाळेचा ईमेल किंवा युडायस नंबर वापरून लॉगिन करा'
                : 'Enter your registered school email or UDISE number to continue'}
            </p>
          </div>

          {/* Notification Messages */}
          {error && (
            <div className="p-3.5 bg-red-950/80 border border-red-500/60 rounded-xl text-xs text-red-200 font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-950/70 border border-emerald-500/60 rounded-xl text-xs text-emerald-200 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off" autoCorrect="off" autoCapitalize="none">
            {/* Email / UDISE Field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                {language === 'mr' ? 'नोंदणीकृत ईमेल किंवा युडायस (UDISE) नंबर' : 'Registered Email or UDISE Number'} <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="input-login-identifier"
                  name="school_portal_identifier_code"
                  type="text"
                  required
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-form-type="other"
                  aria-autocomplete="none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={language === 'mr' ? 'उदा. 27070200119 किंवा example@gmail.com' : 'e.g. 27070200119 or example@gmail.com'}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition outline-hidden"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {language === 'mr' ? 'पासवर्ड' : 'Password'} <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  id="btn-open-forgot-modal"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgotModal(true);
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{language === 'mr' ? 'पासवर्ड विसरलात?' : 'Forgot Password?'}</span>
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="input-login-pass"
                  name="school_portal_security_pass"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-form-type="other"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={language === 'mr' ? 'तुमचा पासवर्ड टाका' : 'Enter your password'}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="btn-login-submit"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>
                {loading 
                  ? (language === 'mr' ? 'तपासत आहे...' : 'Signing in...') 
                  : (language === 'mr' ? 'लॉगिन करा' : 'Sign In')}
              </span>
            </button>
          </form>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative space-y-5 animate-in fade-in-50">
            
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {language === 'mr' ? 'पासवर्ड रीसेट करा' : 'Reset Password'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language === 'mr' ? 'नवीन पासवर्ड सेट करण्यासाठी खालील माहिती भरा' : 'Enter your registered details to set a new password'}
                </p>
              </div>
            </div>

            {forgotError && (
              <div className="p-3 bg-red-950/80 border border-red-500/60 rounded-xl text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5" autoComplete="off">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  {language === 'mr' ? 'नोंदणीकृत ईमेल किंवा युडायस (UDISE) नंबर' : 'Registered Email or UDISE Number'} <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="input-forgot-identifier"
                    name="school_recovery_identifier_key"
                    type="text"
                    required
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    data-lpignore="true"
                    data-1p-ignore="true"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder={language === 'mr' ? 'उदा. 27070200119 किंवा example@gmail.com' : 'e.g. 27070200119 or example@gmail.com'}
                    className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-white focus:border-orange-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {language === 'mr' ? 'सुरक्षा पिन (Security Recovery PIN)' : 'Security Recovery PIN'}
                  </label>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={forgotPin}
                    onChange={(e) => setForgotPin(e.target.value)}
                    placeholder={language === 'mr' ? 'उदा. 8788' : 'e.g. 8788'}
                    className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-white focus:border-orange-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  {language === 'mr' ? 'नवीन पासवर्ड (New Password)' : 'New Password'} <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={language === 'mr' ? 'नवीन पासवर्ड टाका (किमान ४ अक्षरे)' : 'Enter new password (min. 4 chars)'}
                    className="w-full pl-10 pr-10 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-white focus:border-orange-500 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  {language === 'mr' ? 'कन्फर्म नवीन पासवर्ड (Confirm Password)' : 'Confirm New Password'} <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={language === 'mr' ? 'तोच नवीन पासवर्ड पुन्हा टाका' : 'Re-enter new password'}
                    className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-white focus:border-orange-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {language === 'mr' ? 'रद्द करा' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold shadow-md shadow-orange-600/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {forgotLoading 
                      ? (language === 'mr' ? 'बदलत आहे...' : 'Saving...') 
                      : (language === 'mr' ? 'नवीन पासवर्ड जतन करा' : 'Save New Password')}
                  </span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
