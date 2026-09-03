import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  School, 
  Lock, 
  Mail, 
  ShieldCheck, 
  LogIn,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  HelpCircle,
  X,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';

export function Login() {
  const { login, resetPassword, getCredentials, isAuthenticated } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { settings } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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

  useEffect(() => {
    // Pre-populate with registered master email if available for easy access
    getCredentials().then(creds => {
      if (creds && creds.adminEmail) {
        const targetEmail = creds.adminEmail === 'p.ganeshkar8788@gmail.com' 
          ? 'shivajischool.chikhli@gmail.com' 
          : creds.adminEmail;
        setEmail(targetEmail);
        setForgotEmail(targetEmail);
      } else {
        setEmail('shivajischool.chikhli@gmail.com');
        setForgotEmail('shivajischool.chikhli@gmail.com');
      }
    }).catch(() => {
      setEmail('shivajischool.chikhli@gmail.com');
      setForgotEmail('shivajischool.chikhli@gmail.com');
    });
  }, [getCredentials]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError(language === 'mr' ? 'कृपया शाळा ईमेल आणि पासवर्ड प्रविष्ट करा.' : 'Please enter school email ID and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || (language === 'mr' ? 'चुकीचा ईमेल किंवा पासवर्ड! कृपया योग्य माहिती प्रविष्ट करा.' : 'Authentication failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    if (!forgotEmail.trim()) {
      setForgotError(language === 'mr' ? 'कृपया नोंदणीकृत ईमेल प्रविष्ट करा.' : 'Please enter registered email.');
      return;
    }

    if (!newPassword || newPassword.trim().length < 4) {
      setForgotError(language === 'mr' ? 'नवीन पासवर्ड किमान ४ अक्षरांचा असावा.' : 'New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError(language === 'mr' ? 'नवीन पासवर्ड आणि कन्फर्म पासवर्ड जुळत नाहीत.' : 'Passwords do not match.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await resetPassword(forgotEmail, newPassword, forgotPin);
      if (res.success) {
        setForgotSuccess(language === 'mr' ? 'पासवर्ड यशस्वीरित्या बदलला आहे! आता नवीन पासवर्ड वापरून लॉगिन करा.' : 'Password reset successfully! You can now log in.');
        setPassword(newPassword);
        setSuccessMsg(language === 'mr' ? 'नवीन पासवर्ड सेट झाला आहे. कृपया लॉगिन करा.' : 'New password is set. Please log in.');
        setTimeout(() => {
          setShowForgotModal(false);
          setForgotSuccess(null);
        }, 1500);
      } else {
        setForgotError(res.message);
      }
    } catch (err: any) {
      setForgotError(err?.message || 'Password reset failed.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        
        {/* Language selector in top right */}
        <div className="flex justify-end mb-4">
          <div className="inline-flex rounded-lg bg-slate-900/90 p-1 border border-slate-800 text-xs shadow-md backdrop-blur-xs">
            <button
              type="button"
              id="btn-login-lang-mr"
              onClick={() => setLanguage('mr')}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${language === 'mr' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              मराठी
            </button>
            <button
              type="button"
              id="btn-login-lang-en"
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              English
            </button>
            <button
              type="button"
              id="btn-login-lang-hi"
              onClick={() => setLanguage('hi')}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${language === 'hi' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              हिंदी
            </button>
          </div>
        </div>

        {/* Brand Heading */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/30 mb-3 border border-blue-400/40">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            SHALAVERSE
          </h1>
          <p className="text-xs sm:text-sm text-blue-300 font-medium mt-0.5">
            {language === 'mr' 
              ? 'शाळा प्रवेश व जनरल रजिस्टर व्यवस्थापन प्रणाली' 
              : 'School Admission & General Register Management System'}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            {settings.schoolName} (UDISE: {settings.udiseNumber})
          </p>
        </div>

        {/* Main Login Card */}
        <div className="mt-6 bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-5">
          
          {/* Notification Messages */}
          {error && (
            <div className="p-3.5 bg-red-950/70 border border-red-500/60 rounded-xl text-xs text-red-200 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-950/70 border border-emerald-500/60 rounded-xl text-xs text-emerald-200 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                {language === 'mr' ? 'नोंदणीकृत शाळा ईमेल (Login Email)' : 'School Login Email ID'} <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="input-login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="shivajischool.chikhli@gmail.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition outline-hidden"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {language === 'mr' ? 'पासवर्ड (Password)' : 'Password'} <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  id="btn-open-forgot-modal"
                  onClick={() => {
                    setForgotEmail(email || 'shivajischool.chikhli@gmail.com');
                    setShowForgotModal(true);
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>{language === 'mr' ? 'पासवर्ड विसरलात?' : 'Forgot Password?'}</span>
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="input-login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
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
                  ? (language === 'mr' ? 'तपासत आहे...' : 'Verifying...') 
                  : (language === 'mr' ? 'वेबसाईट उघडा (Login Portal)' : 'Login to School Portal')}
              </span>
            </button>
          </form>

          {/* Quick Access Info / Security Guarantee */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-blue-300 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>{language === 'mr' ? 'सुरक्षित प्रमाणीकरण (Strict Auth Guard)' : 'Strict Auth Protected'}</span>
            </div>
            <p className="text-slate-400">
              {language === 'mr' 
                ? 'योग्य ईमेल आणि पासवर्ड टाकल्याशिवाय कोणतीही फाईल किंवा विद्यार्थी डेटा उघडता येणार नाही.' 
                : 'Unauthorized access is strictly blocked. Valid login credentials are required.'}
            </p>
          </div>

          {/* Security & Official Badge */}
          <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Protected
            </span>
            <button
              type="button"
              onClick={() => {
                setForgotEmail(email || 'shivajischool.chikhli@gmail.com');
                setShowForgotModal(true);
              }}
              className="text-slate-400 hover:text-slate-200 underline text-[11px]"
            >
              {language === 'mr' ? 'नवीन पासवर्ड कसा सेट करावा?' : 'Reset Password Help'}
            </button>
          </div>

        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative space-y-5">
            
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
                  {language === 'mr' ? 'पासवर्ड रीसेट करा (Forgot Password)' : 'Reset Your Password'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language === 'mr' ? 'नवीन पासवर्ड सेट करण्यासाठी खालील माहिती भरा' : 'Set a new password for school login'}
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

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  {language === 'mr' ? 'नोंदणीकृत ईमेल आयडी' : 'Registered Email ID'} <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="shivajischool.chikhli@gmail.com"
                    className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-white focus:border-orange-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {language === 'mr' ? 'सुरक्षा पिन (Security Recovery PIN)' : 'Security Recovery PIN'}
                  </label>
                  <span className="text-[10px] text-slate-400">Default PIN: 8788</span>
                </div>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={forgotPin}
                    onChange={(e) => setForgotPin(e.target.value)}
                    placeholder="उदा. 8788"
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
                    placeholder="नवीन पासवर्ड टाका (उदा. Shala@2026)"
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
                    placeholder="तोच नवीन पासवर्ड पुन्हा टाका"
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
                  <span>{forgotLoading ? (language === 'mr' ? 'बदलत आहे...' : 'Saving...') : (language === 'mr' ? 'नवीन पासवर्ड जतन करा' : 'Save New Password')}</span>
                </button>
              </div>
            </form>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 text-orange-400 font-semibold mb-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{language === 'mr' ? 'मदत व सूचना' : 'Help Note'}</span>
              </div>
              <p>
                {language === 'mr' 
                  ? 'तुम्ही तुमचा पासवर्ड कधीही विसरल्यास येथे नवीन पासवर्ड सेट करू शकता. तो त्वरित सेव्ह होतो व पुढील सर्व वेळेस लागू होतो.' 
                  : 'You can reset your login password at any time. The new password will take effect immediately.'}
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

