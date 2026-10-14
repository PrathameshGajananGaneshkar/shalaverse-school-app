import { useState, FormEvent, useEffect, ChangeEvent, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings as SettingsIcon, 
  Save, 
  School, 
  Database, 
  CheckCircle2, 
  Upload, 
  Download, 
  HelpCircle,
  FileCode,
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  AlertCircle,
  X,
  FileCheck2,
  RefreshCw
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { SchoolSettings } from '../types';
import { studentService } from '../services/studentService';
import { documentService } from '../services/documentService';
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

  // Backup & Restore State
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<{ count: number; docsCount: number; filename: string; fallbackUrl?: string } | null>(null);

  // Restore Modal State
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restorePendingData, setRestorePendingData] = useState<{
    fileName: string;
    students: any[];
    documentLogs: any[];
    schoolSettings: any | null;
  } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState<{ current: number; total: number } | null>(null);
  const [restoreResult, setRestoreResult] = useState<{ success: boolean; added: number; docsCount: number; message: string } | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleExportBackup = async () => {
    setIsExporting(true);
    setExportNotice(null);
    try {
      // 1. Fetch all real students
      const students = await studentService.getAllStudents();
      // 2. Fetch all document logs (TC, Nirgam, Bonafide certificates)
      const documentLogs = await documentService.getDocumentLogs();

      const schoolSafeName = (settings.schoolName || 'School')
        .replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_')
        .replace(/_+/g, '_')
        .substring(0, 30);
      const todayDate = new Date().toISOString().split('T')[0];
      const filename = `ShalaVerse_Backup_${schoolSafeName}_${todayDate}.json`;

      const backupData = {
        app: 'ShalaVerse',
        version: '2.0',
        exportedAt: new Date().toISOString(),
        schoolSettings: settings,
        studentsCount: students.length,
        documentsCount: documentLogs.length,
        students: students,
        documentLogs: documentLogs
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Delay cleanup so browser download stream initiates safely
      setTimeout(() => {
        try {
          document.body.removeChild(a);
        } catch {}
      }, 1500);

      setExportNotice({
        count: students.length,
        docsCount: documentLogs.length,
        filename,
        fallbackUrl: url
      });
    } catch (err: any) {
      console.error('Export failed:', err);
      alert('बॅकअप डाऊनलोड करताना त्रुटी आली: ' + (err?.message || 'अज्ञात त्रुटी'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenRestoreSelector = () => {
    setRestoreError(null);
    setRestoreResult(null);
    setRestorePendingData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileRestore = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    setRestoreResult(null);
    setRestoreProgress(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text || !text.trim()) {
          setRestoreError('निवडलेली फाईल रिकामी आहे. कृपया योग्य .json फाईल निवडा.');
          setRestoreModalOpen(true);
          return;
        }

        const parsed = JSON.parse(text);

        let studentList: any[] = [];
        let docList: any[] = [];
        let schoolSettingsData: any = null;

        if (Array.isArray(parsed)) {
          studentList = parsed;
        } else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.students)) {
            studentList = parsed.students;
          }
          if (Array.isArray(parsed.documentLogs)) {
            docList = parsed.documentLogs;
          }
          if (parsed.schoolSettings && typeof parsed.schoolSettings === 'object') {
            schoolSettingsData = parsed.schoolSettings;
          }
        }

        if (studentList.length === 0 && docList.length === 0 && !schoolSettingsData) {
          setRestoreError('या फाईलमध्ये कोणतेही वैध विद्यार्थ्यांचे रेकॉर्ड्स अथवा माहिती आढळली नाही.');
          setRestoreModalOpen(true);
          return;
        }

        setRestorePendingData({
          fileName: file.name,
          students: studentList,
          documentLogs: docList,
          schoolSettings: schoolSettingsData
        });
        setRestoreModalOpen(true);
      } catch (err: any) {
        console.error('Failed to parse restore file:', err);
        setRestoreError('बॅकअप फाईल वाचताना त्रुटी आली. कृपया योग्य JSON (.json) बॅकअप फाईल निवडा.');
        setRestoreModalOpen(true);
      }
    };

    reader.onerror = () => {
      setRestoreError('फाईल वाचताना समस्या उद्भवली.');
      setRestoreModalOpen(true);
    };

    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!restorePendingData) return;
    setIsRestoring(true);
    setRestoreProgress({ current: 0, total: restorePendingData.students.length });

    try {
      // 1. Restore School settings if available
      if (restorePendingData.schoolSettings) {
        await updateSettings(restorePendingData.schoolSettings);
        setFormData({ ...restorePendingData.schoolSettings });
      }

      // 2. Restore students
      let added = 0;
      if (restorePendingData.students.length > 0) {
        const result = await studentService.importBackupData(
          restorePendingData.students,
          (completed, total) => {
            setRestoreProgress({ current: completed, total });
          }
        );
        added = result.added;
      }

      // 3. Restore document logs if present
      let docsRestored = 0;
      if (restorePendingData.documentLogs && restorePendingData.documentLogs.length > 0) {
        docsRestored = await documentService.restoreDocumentLogs(restorePendingData.documentLogs);
      }

      setRestoreResult({
        success: true,
        added,
        docsCount: docsRestored,
        message: `${added} विद्यार्थ्यांचा डेटा ${docsRestored > 0 ? `व ${docsRestored} दाखल्यांच्या नोंदी ` : ''}यशस्वीरित्या रीस्टोअर करण्यात आला आहे!`
      });
    } catch (err: any) {
      console.error('Restore error:', err);
      setRestoreResult({
        success: false,
        added: 0,
        docsCount: 0,
        message: 'डेटा रीस्टोअर करताना त्रुटी आली: ' + (err?.message || 'अज्ञात त्रुटी')
      });
    } finally {
      setIsRestoring(false);
    }
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
            <span>{language === 'mr' ? 'शाळा कॉन्फिगरेशन व सेटिंग्ज' : 'School Configuration & Settings'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'mr' 
              ? 'शाळेचे तपशील, लेटरहेड माहिती आणि डेटाबेस व्यवस्थापन.' 
              : 'Configure school profile, header branding, and manage database synchronization.'}
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
              {language === 'mr' ? 'शाळेची प्रोफाइल व लेटरहेड तपशील' : 'School Profile & Letterhead Details'}
            </h3>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* School Name (English) */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {language === 'mr' ? 'शाळेचे संपूर्ण नाव (इंग्रजीत)' : 'School / Institution Full Name (English)'} <span className="text-red-500">*</span>
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
                {language === 'mr' ? 'शाळेचे नाव (मराठीत - संकेतस्थळावर सर्वत्र दाखवण्यासाठी)' : 'School Name in Local Language (मराठी / हिंदी)'}
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
                {language === 'mr' ? 'शाळेचा युडायस कोड (11 अंकी)' : 'School UDISE Code (11 Digits)'} <span className="text-red-500">*</span>
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
                {language === 'mr' ? 'चालू शैक्षणिक वर्ष' : 'Current Academic Year'} <span className="text-red-500">*</span>
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
                {language === 'mr' ? 'संस्था / व्यवस्थापन मंडळ' : 'Management / Sanstha'}
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
                {language === 'mr' ? 'शाळा मान्यता / नोंदणी क्र.' : 'School Recognition No. (शाळा मान्यता क्र.)'}
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
                {language === 'mr' ? 'शिक्षण मंडळ (Board Name)' : 'Board Name (मंडळ)'}
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
                {language === 'mr' ? 'संलग्नता / इंडेक्स क्र.' : 'Affiliation No. (संलग्नता क्र.)'}
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
                {language === 'mr' ? 'मुख्याध्यापक / प्राचार्यांचे नाव व पदवी' : 'Headmaster / Principal Name & Degree'} <span className="text-red-500">*</span>
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
                {language === 'mr' ? 'शाळेचा संपूर्ण पत्ता' : 'School Postal Address'}
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
                {language === 'mr' ? 'शाळेचा फोन / मोबाईल' : 'Office Phone / Mobile'}
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
                {language === 'mr' ? 'शाळेचा अधिकृत ईमेल' : 'Office Email'}
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
            <span>{saving ? (language === 'mr' ? 'जतन करत आहे...' : 'Saving...') : (language === 'mr' ? 'माहिती सेव्ह करा' : 'Save School Settings')}</span>
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
                disabled={isExporting}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 shrink-0 transition cursor-pointer"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>
                  {isExporting 
                    ? (language === 'mr' ? 'बॅकअप तयार होत आहे...' : 'Exporting...') 
                    : 'Export Backup (JSON)'}
                </span>
              </button>

              <button
                type="button"
                id="btn-restore-backup-file"
                onClick={handleOpenRestoreSelector}
                className="px-4 py-2 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 shrink-0 transition cursor-pointer"
              >
                <Upload className="w-4 h-4 text-emerald-700" />
                <span>Restore from Backup File</span>
              </button>
              <input
                ref={fileInputRef}
                id="restore-file-input"
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileRestore}
              />
            </div>
          </div>

          {/* Export Success Notification Banner */}
          {exportNotice && (
            <div className="bg-emerald-100/90 border border-emerald-300 text-emerald-950 px-4 py-3 rounded-xl flex items-center justify-between gap-3 text-xs animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <p className="font-bold">
                    बॅकअप फाईल ({exportNotice.filename}) यशस्वीरित्या डाऊनलोड झाली आहे!
                  </p>
                  <p className="text-emerald-800 text-[11px] mt-0.5">
                    एकूण {exportNotice.count} विद्यार्थ्यांचा डेटा {exportNotice.docsCount > 0 ? `व ${exportNotice.docsCount} दाखले/नोंदी ` : ''}सुरक्षित सेव्ह झाले आहेत.
                  </p>
                </div>
              </div>
              {exportNotice.fallbackUrl && (
                <a
                  href={exportNotice.fallbackUrl}
                  download={exportNotice.filename}
                  className="px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-900 font-bold rounded-md border border-emerald-300 text-xs shadow-2xs shrink-0 transition cursor-pointer"
                >
                  पुन्हा डाऊनलोड करा
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Restore Confirmation & Progress Modal */}
      {restoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-sm tracking-wide">
                  {language === 'mr' ? 'बॅकअप फाईल रीस्टोअर (डेटा पुनर्प्राप्ती)' : 'Restore from Backup File'}
                </h3>
              </div>
              {!isRestoring && (
                <button
                  type="button"
                  onClick={() => setRestoreModalOpen(false)}
                  className="text-slate-400 hover:text-white transition p-1 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {restoreError ? (
                <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>फाईल वाचण्यात समस्या</span>
                  </div>
                  <p className="text-xs text-rose-800">{restoreError}</p>
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setRestoreModalOpen(false)}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition"
                    >
                      बंद करा
                    </button>
                  </div>
                </div>
              ) : restoreResult ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border ${restoreResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'}`}>
                    <div className="flex items-center gap-3">
                      {restoreResult.success ? (
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-8 h-8 text-rose-600 shrink-0" />
                      )}
                      <div>
                        <h4 className="font-bold text-sm">
                          {restoreResult.success ? 'रीस्टोअर यशस्वी झाले!' : 'रीस्टोअर अयशस्वी'}
                        </h4>
                        <p className="text-xs mt-1 text-slate-700">{restoreResult.message}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRestoreModalOpen(false);
                        window.location.reload();
                      }}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>डेटा अपडेट करा (पूर्ण झाले)</span>
                    </button>
                  </div>
                </div>
              ) : isRestoring ? (
                <div className="py-8 px-4 text-center space-y-4">
                  <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      डेटा रीस्टोअर केला जात आहे...
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      कृपया थांबा, क्लाऊड डेटाबेस व लोकल मेमरीमध्ये नोंदी सेव्ह केल्या जात आहेत.
                    </p>
                  </div>

                  {restoreProgress && restoreProgress.total > 0 && (
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                      <div
                        className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.round((restoreProgress.current / restoreProgress.total) * 100))}%`
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              ) : restorePendingData ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs">
                      <span className="text-slate-500 font-semibold">निवडलेली फाईल:</span>
                      <span className="font-mono font-bold text-slate-900 truncate max-w-[220px]">
                        {restorePendingData.fileName}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[11px]">एकूण विद्यार्थी</span>
                        <strong className="text-base text-emerald-700 font-black">
                          {restorePendingData.students.length} नोंदी
                        </strong>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[11px]">दाखले व प्रमाणपत्रे</span>
                        <strong className="text-base text-blue-700 font-black">
                          {restorePendingData.documentLogs.length} नोंदी
                        </strong>
                      </div>
                    </div>

                    {restorePendingData.schoolSettings && (
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                        <span className="text-slate-600 font-medium">शाळा प्रोफाइल माहिती:</span>
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          समाविष्ट (Included)
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    💡 <strong>सूचना:</strong> ही कृती बॅकअप फाईलमधील विद्यार्थ्यांचा संपूर्ण डेटा व दाखले तुमच्या Google Cloud Firestore डेटाबेसमध्ये पुनर्प्राप्त करेल.
                  </p>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setRestoreModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      रद्द करा
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteRestore}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileCheck2 className="w-4 h-4" />
                      <span>होय, डेटा रीस्टोअर करा</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
