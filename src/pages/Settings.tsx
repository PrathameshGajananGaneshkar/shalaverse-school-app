import { useState, FormEvent, useEffect, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings as SettingsIcon, 
  Save, 
  School, 
  Database, 
  CheckCircle2, 
  Upload, 
  Download, 
  RefreshCw,
  Sparkles,
  HelpCircle,
  FileCode,
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowLeft,
  Trash2
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { SchoolSettings } from '../types';
import { migrateLegacyData, MigrationResult } from '../utils/migration';
import { studentService } from '../services/studentService';
import { authCredentialsService, AuthCredentials } from '../services/authCredentialsService';

export function Settings() {
  const { settings, updateSettings, loading } = useSettings();
  const { t, language } = useLanguage();
  const { getCredentials, saveCredentials } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<SchoolSettings>({ ...settings });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Security Credentials State
  const [authCreds, setAuthCreds] = useState<AuthCredentials>({
    adminEmail: 'shivajischool.chikhli@gmail.com',
    passwordHash: 'Shala@123',
    securityPin: '8788',
    updatedAt: new Date().toISOString()
  });
  const [showPassword, setShowPassword] = useState(false);
  const [savingCreds, setSavingCreds] = useState(false);
  const [credsSuccess, setCredsSuccess] = useState(false);

  useEffect(() => {
    getCredentials().then(creds => {
      if (creds) {
        if (creds.adminEmail === 'p.ganeshkar8788@gmail.com') {
          creds.adminEmail = 'shivajischool.chikhli@gmail.com';
        }
        setAuthCreds(creds);
      }
    }).catch(() => {});
  }, [getCredentials]);

  // Migration status
  const [migrationStatus, setMigrationStatus] = useState<MigrationResult | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleChange = (field: keyof SchoolSettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCredsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!authCreds.adminEmail.trim() || !authCreds.passwordHash.trim()) {
      alert('कृपया ईमेल आणि पासवर्ड दोन्ही भरा.');
      return;
    }
    setSavingCreds(true);
    try {
      await saveCredentials({
        ...authCreds,
        updatedAt: new Date().toISOString()
      });
      setCredsSuccess(true);
      setTimeout(() => setCredsSuccess(false), 3000);
      alert('लॉगिन ईमेल व पासवर्ड सुरक्षितपणे सेव्ह झाला आहे! पुढील वेळी याच माहितीने लॉगिन करा.');
    } catch (err) {
      console.error('Failed to update credentials:', err);
      alert('पासवर्ड सेव्ह करताना त्रुटी आली.');
    } finally {
      setSavingCreds(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update settings:', err);
      alert('Error updating settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleRunMigration = async () => {
    setIsMigrating(true);
    try {
      const res = await migrateLegacyData();
      setMigrationStatus(res);
    } catch (err) {
      console.error('Migration error:', err);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSeedData = async () => {
    if (!confirm('This will insert standard sample student records into the Firestore database. Continue?')) {
      return;
    }
    setIsSeeding(true);
    try {
      await studentService.seedInitialData();
      alert('Sample records seeded into Firestore successfully!');
    } catch (err) {
      console.error('Seed error:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearDemoData = async () => {
    if (!confirm('सर्व नमुना (Sample / Demo) विद्यार्थी डेटा डिलीट करून फक्त तुमचे स्वतःचे विद्यार्थी ठेवायचे आहेत का?')) {
      return;
    }
    setIsSeeding(true);
    try {
      const res = await studentService.clearSampleStudents();
      alert(`यशस्वी! ${res.deleted} नमुना विद्यार्थी रेकॉर्ड्स हटवले गेले आहेत.`);
      window.location.reload();
    } catch (err) {
      console.error('Clear demo error:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleExportBackup = async () => {
    const students = await studentService.getAllStudents();
    const backupData = {
      exportedAt: new Date().toISOString(),
      schoolSettings: settings,
      studentsCount: students.length,
      students: students
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ShalaVerse_Complete_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileRestore = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        let studentList: any[] = [];
        if (Array.isArray(parsed)) {
          studentList = parsed;
        } else if (parsed && Array.isArray(parsed.students)) {
          studentList = parsed.students;
          if (parsed.schoolSettings) {
            await updateSettings(parsed.schoolSettings);
          }
        }

        if (studentList.length === 0) {
          alert('फाईलमध्ये कोणतेही विद्यार्थ्यांचे रेकॉर्ड आढळले नाही.');
          return;
        }

        if (confirm(`या बॅकअप फाईलमधून एकूण ${studentList.length} विद्यार्थ्यांचा डेटा रीस्टोअर (पुनर्प्राप्त) करायचा आहे का?`)) {
          setIsSeeding(true);
          const result = await studentService.importBackupData(studentList);
          alert(`यशस्वी! ${result.added} विद्यार्थ्यांचा डेटा पूर्ववत रीस्टोअर करण्यात आला आहे.`);
          window.location.reload();
        }
      } catch (err) {
        console.error('Failed to parse restore file:', err);
        alert('बॅकअप फाईल वाचताना त्रुटी आली. कृपया योग्य .json बॅकअप फाईल निवडा.');
      } finally {
        setIsSeeding(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Navigation Back Button */}
      <div className="flex items-center justify-between print:hidden">
        <button
          type="button"
          id="btn-settings-back"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/dashboard');
            }
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-lg text-xs sm:text-sm font-semibold border border-slate-200 shadow-2xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-blue-700" />
          <span>{t('goBack')}</span>
        </button>
      </div>

      {/* Settings Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <School className="w-6 h-6 text-blue-700" />
            <span>School Configuration & Settings</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure school profile, header branding, and manage database synchronization.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 text-xs font-bold animate-in fade-in-50">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t('settingsSaved')}</span>
          </div>
        )}
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center gap-2">
            <School className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold tracking-wide uppercase">
              School Profile & Letterhead Details
            </h3>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* School Name (English) */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                School / Institution Full Name (English) <span className="text-red-500">*</span>
              </label>
              <input
                id="input-setting-school-name"
                type="text"
                required
                value={formData.schoolName}
                onChange={(e) => handleChange('schoolName', e.target.value)}
                placeholder="e.g. Shree Saraswati Vidyamandir & Junior College"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm font-bold text-slate-900 focus:bg-white focus:ring-blue-600"
              />
            </div>

            {/* School Name (Marathi / Regional) */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                School Name in Local Language (मराठी / हिंदी)
              </label>
              <input
                id="input-setting-school-name-local"
                type="text"
                value={formData.schoolNameLocal || ''}
                onChange={(e) => handleChange('schoolNameLocal', e.target.value)}
                placeholder="उदा. श्री सरस्वती विद्यामंदिर व उच्च माध्यमिक विद्यालय, पुणे"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm font-medium text-slate-900 focus:bg-white focus:ring-blue-600"
              />
            </div>

            {/* UDISE Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                School UDISE Code (11 Digits) <span className="text-red-500">*</span>
              </label>
              <input
                id="input-setting-udise"
                type="text"
                required
                value={formData.udiseNumber}
                onChange={(e) => handleChange('udiseNumber', e.target.value)}
                placeholder="e.g. 27251401201"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 font-mono text-sm font-bold text-blue-900 focus:bg-white focus:ring-blue-600"
              />
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Current Academic Year <span className="text-red-500">*</span>
              </label>
              <input
                id="input-setting-academic-year"
                type="text"
                required
                value={formData.academicYear}
                onChange={(e) => handleChange('academicYear', e.target.value)}
                placeholder="e.g. 2026-2027"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm font-bold text-slate-900 focus:bg-white focus:ring-blue-600"
              />
            </div>

            {/* Board Affiliation */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Management / Sanstha
              </label>
              <input
                id="input-setting-affiliation"
                type="text"
                value={formData.boardAffiliation}
                onChange={(e) => handleChange('boardAffiliation', e.target.value)}
                placeholder="e.g. Shri Shivaji Shikshan Sanstha, Amravati – Managed by"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
              />
            </div>

            {/* School Recognition No */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                School Recognition No. (शाळा मान्यता क्र.)
              </label>
              <input
                id="input-setting-recognition"
                type="text"
                value={formData.recognitionNo || ''}
                onChange={(e) => handleChange('recognitionNo', e.target.value)}
                placeholder="e.g. Kr. Va Di. Bu. Ji. Pa. / Secondary School / Inspection 11150 Education Department Buldhana, Dt. 18/10/65"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm font-semibold focus:bg-white focus:ring-blue-600"
              />
            </div>

            {/* Board & Affiliation */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Board Name (मंडळ)
              </label>
              <input
                id="input-setting-board"
                type="text"
                value={formData.boardName || ''}
                onChange={(e) => handleChange('boardName', e.target.value)}
                placeholder="e.g. Amravati"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Affiliation No. (संलग्नता क्र.)
              </label>
              <input
                id="input-setting-affiliation-no"
                type="text"
                value={formData.affiliationNo || ''}
                onChange={(e) => handleChange('affiliationNo', e.target.value)}
                placeholder="e.g. 04.03.016"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm font-mono focus:bg-white focus:ring-blue-600"
              />
            </div>

            {/* Headmaster / Principal Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Headmaster / Principal Name & Degree <span className="text-red-500">*</span>
              </label>
              <input
                id="input-setting-headmaster"
                type="text"
                required
                value={formData.headmasterName}
                onChange={(e) => handleChange('headmasterName', e.target.value)}
                placeholder="e.g. Dr. Rameshwar S. Kulkarni (M.A., M.Ed., Ph.D.)"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm font-semibold focus:bg-white focus:ring-blue-600"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                School Postal Address
              </label>
              <input
                id="input-setting-address"
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="e.g. Station Road, Shivajinagar, Pune, Maharashtra - 411005"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Office Phone / Mobile
              </label>
              <input
                id="input-setting-phone"
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="e.g. +91 20 2553 4488 / 98220 12345"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
              />
            </div>

            {/* Official Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Office Email
              </label>
              <input
                id="input-setting-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="e.g. office@ssvmvidyamandir.edu.in"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Save Settings Bar */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            id="btn-save-settings"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save School Settings'}</span>
          </button>
        </div>
      </form>

      {/* LOGIN SECURITY & MASTER CREDENTIALS CARD */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-orange-400" />
            <h3 className="text-sm font-bold tracking-wide uppercase">
              {language === 'mr' ? 'शाळा लॉगिन सुरक्षा व पासवर्ड व्यवस्थापन' : 'School Portal Login & Password Security'}
            </h3>
          </div>
          <span className="text-[11px] bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2.5 py-0.5 rounded-full font-bold">
            Strict Auth Shield
          </span>
        </div>

        <form onSubmit={handleCredsSubmit} className="p-6 space-y-5">
          <div className="bg-orange-50/80 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div className="text-xs text-orange-950 space-y-1">
              <p className="font-bold">
                {language === 'mr' 
                  ? 'वेबसाईट उघडण्यासाठी येथे ठरवलेला एकच ईमेल व पासवर्ड वापरावा लागेल.' 
                  : 'Only the configured email and password will be authorized to access this website.'}
              </p>
              <p className="text-orange-800">
                {language === 'mr' 
                  ? 'जर तुम्ही पासवर्ड विसरलात, तर लॉगिन स्क्रीनवर "पासवर्ड विसरलात?" वर क्लिक करून रिकव्हरी पिनच्या सहाय्याने नवीन पासवर्ड ठेवू शकता.' 
                  : 'If you ever forget your password, you can reset it instantly on the login page using your Security Recovery PIN.'}
              </p>
            </div>
          </div>

          {credsSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in-50">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{language === 'mr' ? 'लॉगिन माहिती यशस्वीरित्या सेव्ह झाली!' : 'Login credentials updated successfully!'}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Master Login Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {language === 'mr' ? 'अधिकृत लॉगिन ईमेल आयडी' : 'Authorized Login Email'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="input-setting-admin-email"
                  type="email"
                  required
                  value={authCreds.adminEmail}
                  onChange={(e) => setAuthCreds({ ...authCreds, adminEmail: e.target.value })}
                  placeholder="shivajischool.chikhli@gmail.com"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-hidden"
                />
              </div>
            </div>

            {/* Master Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {language === 'mr' ? 'लॉगिन पासवर्ड (Master Password)' : 'Login Password'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="input-setting-admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={authCreds.passwordHash}
                  onChange={(e) => setAuthCreds({ ...authCreds, passwordHash: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-9 py-2 rounded-lg border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Security Recovery PIN */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {language === 'mr' ? 'सुरक्षा रिकव्हरी पिन' : 'Security Recovery PIN'} <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Default: 8788</span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="input-setting-security-pin"
                  type="text"
                  required
                  value={authCreds.securityPin}
                  onChange={(e) => setAuthCreds({ ...authCreds, securityPin: e.target.value })}
                  placeholder="8788"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
            <span>
              {language === 'mr' ? 'शेवटचा बदल:' : 'Last updated:'} {new Date(authCreds.updatedAt).toLocaleDateString()}
            </span>

            <button
              type="submit"
              id="btn-save-credentials"
              disabled={savingCreds}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-xs shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingCreds ? (language === 'mr' ? 'जतन होत आहे...' : 'Saving...') : (language === 'mr' ? 'लॉगिन पासवर्ड व सुरक्षा जतन करा' : 'Update Security & Password')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Database Maintenance & Tools Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold tracking-wide uppercase">
            Data Storage, Synchronization & Backup Tools
          </h3>
        </div>

        <div className="p-6 space-y-6">
          {/* Cloud Firestore Status & Backup / Restore Actions */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h4 className="text-sm font-bold text-emerald-950">Cloud Firestore Database Active</h4>
              </div>
              <p className="text-xs text-emerald-800 mt-1">
                Database ID: <strong className="font-mono">ai-studio-shalaverse-312aa896</strong> • Live cloud persistence enabled.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                id="btn-export-backup-json"
                onClick={handleExportBackup}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Export Backup (JSON)</span>
              </button>

              <label
                htmlFor="restore-file-input"
                className="cursor-pointer px-4 py-2 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 shrink-0 transition"
              >
                <Upload className="w-4 h-4 text-emerald-700" />
                <span>Restore from Backup File</span>
                <input
                  id="restore-file-input"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileRestore}
                />
              </label>
            </div>
          </div>

          {/* Migration, Seed & Clear Tools */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Migration Tool */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Migrate Local Storage</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scan local browser storage for legacy student records and import them into Firestore.
              </p>
              <button
                type="button"
                id="btn-run-migration"
                onClick={handleRunMigration}
                disabled={isMigrating}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isMigrating ? 'animate-spin' : ''}`} />
                <span>{isMigrating ? 'Migrating...' : 'Run Data Migration'}</span>
              </button>

              {migrationStatus && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 font-medium">
                  {migrationStatus.message}
                </div>
              )}
            </div>

            {/* Seed Sample Records */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Seed Samples</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Insert verified sample student records (classes 8th to 11th) into the database.
              </p>
              <button
                type="button"
                id="btn-seed-sample-data"
                onClick={handleSeedData}
                disabled={isSeeding}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{isSeeding ? 'Seeding...' : 'Seed Sample Records'}</span>
              </button>
            </div>

            {/* Clear Demo Records */}
            <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/60 space-y-3">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-amber-700" />
                <span>Clear Demo Records</span>
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                फक्त सर्व नमुना (Sample / Demo) विद्यार्थ्यांची नोंदणी हटवून तुमचे स्वतःचे खरे विद्यार्थी ठेवा.
              </p>
              <button
                type="button"
                id="btn-clear-demo-settings"
                onClick={handleClearDemoData}
                disabled={isSeeding}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isSeeding ? 'Clearing...' : 'नमुना विद्यार्थी हटवा'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
