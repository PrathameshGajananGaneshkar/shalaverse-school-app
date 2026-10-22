import { useState, FormEvent, useEffect, ChangeEvent, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save, 
  School as SchoolIcon, 
  Database, 
  CheckCircle2, 
  Upload, 
  Download, 
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
  RefreshCw, 
  Crown, 
  Building, 
  ExternalLink, 
  Phone,
  Sparkles,
  Layers,
  ChevronRight,
  Check,
  User,
  HelpCircle
} from 'lucide-react';
import { useSettings, schoolToSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import { schoolService } from '../services/schoolService';
import type { SchoolSettings, School } from '../types';
import { studentService } from '../services/studentService';
import { documentService } from '../services/documentService';
import { 
  authCredentialsService, 
  AuthCredentials, 
  SuperAdminCredentials, 
  PlatformSettings,
  DEFAULT_PLATFORM_SETTINGS 
} from '../services/authCredentialsService';

export function Settings() {
  const { settings, updateSettings, loading } = useSettings();
  const { t, language } = useLanguage();
  const { 
    getCredentials, 
    saveCredentials, 
    saveSuperAdminCredentials, 
    updateUserProfile, 
    userProfile 
  } = useAuth();
  const { isSuperAdmin, allSchools, currentSchool, updateSchool, refreshSchools, selectSchool } = useSchool();
  const navigate = useNavigate();

  // Active School Form Data (for regular school or selected client school)
  const [formData, setFormData] = useState<SchoolSettings>(() => {
    if (currentSchool) return schoolToSettings(currentSchool);
    return { ...settings };
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Super Admin View Toggle: 'platform' (Master SaaS Settings) or 'client_school' (Configuring client schools)
  const [superAdminTab, setSuperAdminTab] = useState<'platform' | 'client_school'>('platform');
  const [superAdminSubTab, setSuperAdminSubTab] = useState<'security' | 'platform_info' | 'defaults' | 'database'>('security');

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(() => {
    return currentSchool?.id || allSchools[0]?.id || 'school_27070200119';
  });

  // Keep formData strictly synchronized with currentSchool and settings
  useEffect(() => {
    if (currentSchool) {
      setFormData(schoolToSettings(currentSchool));
    } else if (settings) {
      setFormData({ ...settings });
    }
  }, [currentSchool, settings]);

  // Sync selectedSchoolId when active school changes
  useEffect(() => {
    if (currentSchool?.id) {
      setSelectedSchoolId(currentSchool.id);
    }
  }, [currentSchool?.id]);

  // Selected client school state (for Super Admin Tab 2)
  const [clientSchoolForm, setClientSchoolForm] = useState<Partial<School>>({});
  const [savingClientSchool, setSavingClientSchool] = useState(false);
  const [clientSchoolSuccess, setClientSchoolSuccess] = useState(false);

  // Platform Master Settings for Super Admin
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('shalaverse_platform_settings') : null;
    if (saved) {
      try {
        return { ...DEFAULT_PLATFORM_SETTINGS, ...JSON.parse(saved) };
      } catch {}
    }
    return DEFAULT_PLATFORM_SETTINGS;
  });
  const [savingPlatform, setSavingPlatform] = useState(false);
  const [platformSaveSuccess, setPlatformSaveSuccess] = useState(false);

  // Super Admin Profile, Master Password & PIN state
  const [superAdminName, setSuperAdminName] = useState('गणेशकर सर (Super Admin)');
  const [superAdminEmail, setSuperAdminEmail] = useState('admin@shalaverse.in');
  const [superAdminPhone, setSuperAdminPhone] = useState('+91 8788000000');
  const [superAdminPassword, setSuperAdminPassword] = useState('Admin@8788');
  const [superAdminPin, setSuperAdminPin] = useState('8788');
  const [superAdminQuestion, setSuperAdminQuestion] = useState('तुमचे आवडते शहर / मूळ गाव कोणते?');
  const [superAdminAnswer, setSuperAdminAnswer] = useState('चिखली');
  const [showSuperAdminPass, setShowSuperAdminPass] = useState(false);
  const [savingSuperSecurity, setSavingSuperSecurity] = useState(false);
  const [superSecuritySuccess, setSuperSecuritySuccess] = useState(false);

  // Export All Schools Registry State
  const [isExportingAllSchools, setIsExportingAllSchools] = useState(false);
  const [allSchoolsExportSuccess, setAllSchoolsExportSuccess] = useState(false);
  const [refreshingGlobalCache, setRefreshingGlobalCache] = useState(false);
  const [globalCacheSuccess, setGlobalCacheSuccess] = useState(false);

  // Security Credentials State - STRICTLY ISOLATED PER SCHOOL
  const [authCreds, setAuthCreds] = useState<AuthCredentials>(() => {
    if (currentSchool) {
      return {
        adminEmail: currentSchool.email || 'school@shalaverse.in',
        passwordHash: currentSchool.password || 'Shala@123',
        securityPin: currentSchool.securityPin || '8788',
        updatedAt: currentSchool.updatedAt || new Date().toISOString()
      };
    }
    return {
      adminEmail: 'school@shalaverse.in',
      passwordHash: 'Shala@123',
      securityPin: '8788',
      updatedAt: new Date().toISOString()
    };
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

  // Load super admin credentials & platform settings when isSuperAdmin is true
  useEffect(() => {
    if (isSuperAdmin) {
      authCredentialsService.getSuperAdminCredentials().then(superCreds => {
        if (superCreds) {
          if (superCreds.name) setSuperAdminName(superCreds.name);
          if (superCreds.email) setSuperAdminEmail(superCreds.email);
          if (superCreds.phone) setSuperAdminPhone(superCreds.phone);
          if (superCreds.password) setSuperAdminPassword(superCreds.password);
          if (superCreds.securityPin) setSuperAdminPin(superCreds.securityPin);
          if (superCreds.recoveryQuestion) setSuperAdminQuestion(superCreds.recoveryQuestion);
          if (superCreds.recoveryAnswer) setSuperAdminAnswer(superCreds.recoveryAnswer);
        }
      }).catch(() => {});

      authCredentialsService.getPlatformSettings().then(plat => {
        if (plat) {
          setPlatformSettings(plat);
        }
      }).catch(() => {});
    }
  }, [isSuperAdmin]);

  // Synchronize school credentials strictly with the active currentSchool
  useEffect(() => {
    if (currentSchool) {
      const schoolKey = `shalaverse_school_creds_${currentSchool.id}`;
      const savedSchoolCreds = typeof window !== 'undefined' ? localStorage.getItem(schoolKey) : null;
      let credsToSet: AuthCredentials = {
        adminEmail: currentSchool.email || 'school@shalaverse.in',
        passwordHash: currentSchool.password || 'Shala@123',
        securityPin: currentSchool.securityPin || '8788',
        updatedAt: currentSchool.updatedAt || new Date().toISOString()
      };

      if (savedSchoolCreds) {
        try {
          const parsed = JSON.parse(savedSchoolCreds);
          if (parsed.adminEmail && parsed.passwordHash) {
            credsToSet = { ...credsToSet, ...parsed };
          }
        } catch {}
      }

      setAuthCreds(credsToSet);
    }
  }, [currentSchool]);

  // Sync clientSchoolForm when selectedSchoolId changes
  useEffect(() => {
    const found = allSchools.find(s => s.id === selectedSchoolId) || currentSchool || allSchools[0];
    if (found) {
      setClientSchoolForm({ ...found });
    }
  }, [selectedSchoolId, allSchools, currentSchool]);

  const handleChange = (field: keyof SchoolSettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCredsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!authCreds.adminEmail.trim() || !authCreds.passwordHash.trim()) {
      alert(language === 'mr' ? 'कृपया ईमेल आणि पासवर्ड दोन्ही भरा.' : 'Please enter both email and password.');
      return;
    }
    setSavingCreds(true);
    try {
      const nowStr = new Date().toISOString();
      const updatedCreds: AuthCredentials = {
        adminEmail: authCreds.adminEmail.trim(),
        passwordHash: authCreds.passwordHash.trim(),
        securityPin: authCreds.securityPin?.trim() || '8788',
        updatedAt: nowStr
      };

      // 1. Save specifically for this active school so no cross-school leak happens!
      if (currentSchool?.id) {
        localStorage.setItem(`shalaverse_school_creds_${currentSchool.id}`, JSON.stringify(updatedCreds));
        await updateSchool(currentSchool.id, {
          email: updatedCreds.adminEmail,
          password: updatedCreds.passwordHash,
          securityPin: updatedCreds.securityPin,
          updatedAt: nowStr
        });
      } else {
        await saveCredentials(updatedCreds);
      }

      setCredsSuccess(true);
      setTimeout(() => setCredsSuccess(false), 3000);
      alert(language === 'mr' 
        ? `"${currentSchool?.schoolNameLocal || currentSchool?.schoolName || 'शाळेचा'}" लॉगिन पासवर्ड व सुरक्षा यशस्वीरित्या सेव्ह झाली आहे!` 
        : `Login email and password for "${currentSchool?.schoolName || 'School'}" saved successfully!`);
    } catch (err) {
      console.error('Failed to update credentials:', err);
      alert(language === 'mr' ? 'पासवर्ड सेव्ह करताना त्रुटी आली.' : 'Error saving password.');
    } finally {
      setSavingCreds(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(formData);
      if (currentSchool?.id) {
        await updateSchool(currentSchool.id, {
          schoolName: formData.schoolName,
          schoolNameLocal: formData.schoolNameLocal || formData.schoolName,
          udiseNumber: formData.udiseNumber,
          boardAffiliation: formData.boardAffiliation,
          recognitionNo: formData.recognitionNo,
          affiliationNo: formData.affiliationNo,
          boardName: formData.boardName,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          academicYear: formData.academicYear,
          headmasterName: formData.headmasterName,
          logoUrl: formData.logoUrl,
          tagline: formData.tagline,
          updatedAt: new Date().toISOString()
        });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update settings:', err);
      alert('Error updating settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePlatformSettings = async (e: FormEvent) => {
    e.preventDefault();
    setSavingPlatform(true);
    try {
      const updated: PlatformSettings = {
        ...platformSettings,
        updatedAt: new Date().toISOString()
      };
      setPlatformSettings(updated);
      await authCredentialsService.savePlatformSettings(updated);
      setPlatformSaveSuccess(true);
      setTimeout(() => setPlatformSaveSuccess(false), 3500);
      alert('✅ प्लॅटफॉर्म माहिती व धोरणे क्लाऊडवर सुरक्षितपणे सेव्ह झाली आहेत!');
    } catch (err) {
      console.error('Error saving platform settings:', err);
      alert('माहिती जतन करताना त्रुटी आली.');
    } finally {
      setSavingPlatform(false);
    }
  };

  const handleSaveSuperSecurity = async (e: FormEvent) => {
    e.preventDefault();
    if (!superAdminPassword.trim()) {
      alert('कृपया पासवर्ड प्रविष्ट करा.');
      return;
    }
    if (!superAdminEmail.trim()) {
      alert('कृपया ईमेल प्रविष्ट करा.');
      return;
    }
    setSavingSuperSecurity(true);
    try {
      const updatedCreds: SuperAdminCredentials = {
        name: superAdminName.trim() || 'गणेशकर सर (Super Admin)',
        email: superAdminEmail.trim().toLowerCase(),
        phone: superAdminPhone.trim() || '+91 8788000000',
        password: superAdminPassword.trim(),
        securityPin: superAdminPin.trim() || '8788',
        recoveryQuestion: superAdminQuestion.trim() || 'तुमचे आवडते शहर / मूळ गाव कोणते?',
        recoveryAnswer: superAdminAnswer.trim() || 'चिखली',
        updatedAt: new Date().toISOString()
      };

      if (saveSuperAdminCredentials) {
        await saveSuperAdminCredentials(updatedCreds);
      } else {
        await authCredentialsService.saveSuperAdminCredentials(updatedCreds);
      }

      // Synchronize with platform settings
      const updatedPlatform: PlatformSettings = {
        ...platformSettings,
        ownerName: updatedCreds.name || platformSettings.ownerName,
        ownerEmail: updatedCreds.email,
        supportPhone: updatedCreds.phone || platformSettings.supportPhone,
        supportEmail: updatedCreds.email,
        updatedAt: new Date().toISOString()
      };
      setPlatformSettings(updatedPlatform);
      await authCredentialsService.savePlatformSettings(updatedPlatform);

      if (updateUserProfile && userProfile?.role === 'super_admin') {
        updateUserProfile({
          displayName: updatedCreds.name,
          email: updatedCreds.email
        });
      }

      setSuperSecuritySuccess(true);
      setTimeout(() => setSuperSecuritySuccess(false), 4000);
      alert('✅ तुमचा नवीन पासवर्ड आणि सर्व माहिती क्लाऊडवर यशस्वीरित्या अपडेट झाली आहे!');
    } catch (err) {
      console.error('Error saving super admin security:', err);
      alert('पासवर्ड व माहिती जतन करताना त्रुटी आली.');
    } finally {
      setSavingSuperSecurity(false);
    }
  };

  const handleExportAllSchools = async () => {
    setIsExportingAllSchools(true);
    try {
      const schools = await schoolService.getAllSchools();
      const filename = `ShalaVerse_All_Schools_Master_Registry_${new Date().toISOString().split('T')[0]}.json`;
      const data = {
        app: 'ShalaVerse Multi-School Management',
        version: '2.0',
        exportedAt: new Date().toISOString(),
        totalSchools: schools.length,
        platformOwner: 'admin@shalaverse.in',
        schools: schools
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 1500);
      setAllSchoolsExportSuccess(true);
      setTimeout(() => setAllSchoolsExportSuccess(false), 3500);
    } catch (err) {
      console.error('Export all schools failed:', err);
      alert('शाळांचा डेटा डाऊनलोड करताना त्रुटी आली.');
    } finally {
      setIsExportingAllSchools(false);
    }
  };

  const handleRefreshGlobalCache = async () => {
    setRefreshingGlobalCache(true);
    try {
      await refreshSchools();
      setGlobalCacheSuccess(true);
      setTimeout(() => setGlobalCacheSuccess(false), 3000);
    } catch (err) {
      console.error('Cache refresh error:', err);
    } finally {
      setRefreshingGlobalCache(false);
    }
  };

  const handleSaveClientSchool = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolId) return;
    setSavingClientSchool(true);
    try {
      await updateSchool(selectedSchoolId, clientSchoolForm);
      setClientSchoolSuccess(true);
      setTimeout(() => setClientSchoolSuccess(false), 3000);
      alert(`शाळा "${clientSchoolForm.schoolNameLocal || clientSchoolForm.schoolName}" चे तपशील यशस्वीरित्या अपडेट झाले आहेत!`);
    } catch (err) {
      console.error('Update client school error:', err);
      alert('शाळा अपडेट करताना त्रुटी आली.');
    } finally {
      setSavingClientSchool(false);
    }
  };

  const handleOpenClientSchoolDashboard = () => {
    const found = allSchools.find(s => s.id === selectedSchoolId);
    if (found) {
      selectSchool(found);
      navigate('/dashboard');
    }
  };

  const handleExportBackup = async () => {
    setIsExporting(true);
    setExportNotice(null);
    try {
      const students = await studentService.getAllStudents();
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
      if (restorePendingData.schoolSettings) {
        await updateSettings(restorePendingData.schoolSettings);
        setFormData({ ...restorePendingData.schoolSettings });
      }

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

      let docsRestored = 0;
      if (restorePendingData.documentLogs.length > 0) {
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
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
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
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-lg text-xs sm:text-sm font-semibold border border-slate-200 shadow-2xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-blue-700" />
          <span>{t('goBack')}</span>
        </button>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => navigate('/super-admin')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            <span>{language === 'mr' ? '👑 सुपर ॲडमिन हब वर जा' : 'Go to Super Admin Hub'}</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* A. SUPER ADMIN SPECIALIZED VIEW (If logged in as Super Admin)             */}
      {/* ========================================================================= */}
      {isSuperAdmin ? (
        <div className="space-y-6">
          {/* Super Admin Top Control Banner & View Mode Toggle */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 p-5 rounded-2xl border border-slate-850 text-white shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-400 text-slate-950 rounded-xl shadow-md">
                  <Crown className="w-6 h-6" />
                </span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <span>{language === 'mr' ? '👑 सुपर ॲडमिन मास्टर सेटिंग्ज' : '👑 Super Admin Master Settings'}</span>
                  </h2>
                  <p className="text-xs text-amber-300/90 font-medium">
                    {language === 'mr' 
                      ? 'प्लॅटफॉर्म मालक केंद्र • मास्टर पासवर्ड, सपोर्ट व ग्लोबल सिस्टम व्यवस्थापन' 
                      : 'Platform Owner Hub • Master Credentials, Support & SaaS Management'}
                  </p>
                </div>
              </div>
            </div>

            {/* View Mode Toggle: Super Admin Settings vs Client School Override */}
            <div className="flex items-center bg-slate-800/90 p-1.5 rounded-xl border border-slate-700/80 self-start md:self-auto">
              <button
                type="button"
                id="btn-tab-superadmin-master"
                onClick={() => setSuperAdminTab('platform')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                  superAdminTab === 'platform'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>{language === 'mr' ? '👑 सुपर ॲडमिन सेटिंग्ज' : '👑 Super Admin Settings'}</span>
              </button>

              <button
                type="button"
                id="btn-tab-superadmin-clientschool"
                onClick={() => setSuperAdminTab('client_school')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                  superAdminTab === 'client_school'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <SchoolIcon className="w-3.5 h-3.5" />
                <span>{language === 'mr' ? '🏫 शाळा कॉन्फिगरेशन' : '🏫 Client School Settings'}</span>
              </button>
            </div>
          </div>

          {/* 1. VIEW 1: SUPER ADMIN PLATFORM & SECURITY SETTINGS */}
          {superAdminTab === 'platform' && (
            <div className="space-y-6">
              {/* Sub-Tabs for Super Admin */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setSuperAdminSubTab('security')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
                    superAdminSubTab === 'security'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{language === 'mr' ? '१. सुपर ॲडमिन प्रोफाइल, पासवर्ड व सुरक्षा' : '1. Profile, Security & Password'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSuperAdminSubTab('platform_info')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
                    superAdminSubTab === 'platform_info'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>{language === 'mr' ? '२. प्लॅटफॉर्म ब्रँडिंग व सपोर्ट' : '2. Platform Info & Support'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSuperAdminSubTab('defaults')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
                    superAdminSubTab === 'defaults'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>{language === 'mr' ? '३. नवीन शाळांसाठी डीफॉल्ट नियम' : '3. New School Policies'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSuperAdminSubTab('database')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
                    superAdminSubTab === 'database'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  <span>{language === 'mr' ? '४. सर्व शाळा डेटाबेस व बॅकअप' : '4. Global Database & Backup'}</span>
                </button>
              </div>

              {/* Sub-Tab 1: Super Admin Profile, Security & Password */}
              {superAdminSubTab === 'security' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-amber-400" />
                      <div>
                        <h3 className="font-bold text-sm tracking-wide uppercase">
                          {language === 'mr' ? 'सुपर ॲडमिन प्रोफाइल, पासवर्ड व सुरक्षा व्यवस्थापन' : 'Super Admin Profile, Password & Master Credentials'}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {language === 'mr' ? 'येथून तुम्ही तुमचे नाव, ईमेल, फोन नंबर, लॉगिन पासवर्ड आणि रिकव्हरी पिन थेट बदलू शकता.' : 'Directly update your name, email, phone, login password, and security PIN.'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full font-black">
                      Super Admin Owner
                    </span>
                  </div>

                  <form onSubmit={handleSaveSuperSecurity} className="p-6 space-y-6">
                    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                      <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-950 space-y-1">
                        <p className="font-bold">
                          {language === 'mr' 
                            ? 'येथे सेव्ह केलेली सर्व माहिती व पासवर्ड Google Cloud Firestore आणि तुमच्या खात्यावर तत्काळ अपडेट होईल.' 
                            : 'All details and credentials saved here will be immediately synchronized with Google Cloud Firestore and your account.'}
                        </p>
                        <p className="text-amber-800">
                          {language === 'mr' 
                            ? 'पुढील वेळी लॉगिन करताना तुम्ही येथे टाकलेला नवीन पासवर्ड किंवा सुरक्षा पिन वापरून सहज लॉगिन करू शकता.' 
                            : 'Next time you log in, you can use your newly saved password or recovery PIN seamlessly.'}
                        </p>
                      </div>
                    </div>

                    {superSecuritySuccess && (
                      <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 font-bold text-xs sm:text-sm flex items-center gap-2 animate-in fade-in-50">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>{language === 'mr' ? 'सुपर ॲडमिन पासवर्ड आणि तुमची संपूर्ण माहिती क्लाऊडवर यशस्वीरित्या अपडेट झाली आहे!' : 'Super Admin master credentials and profile updated successfully!'}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {/* Super Admin Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          {language === 'mr' ? 'सुपर ॲडमिन नाव (तुमचे नाव)' : 'Super Admin Full Name'} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            id="input-superadmin-name"
                            type="text"
                            required
                            value={superAdminName}
                            onChange={(e) => setSuperAdminName(e.target.value)}
                            placeholder="गणेशकर सर"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {language === 'mr' ? 'हे नाव हेडर व डॅशबोर्डवर दिसेल' : 'Displayed in system header & badges'}
                        </p>
                      </div>

                      {/* Super Admin Email */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          {language === 'mr' ? 'सुपर ॲडमिन लॉगिन ईमेल' : 'Super Admin Login Email'} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            id="input-superadmin-email"
                            name="master_admin_email_id"
                            type="email"
                            required
                            autoComplete="off"
                            data-lpignore="true"
                            value={superAdminEmail}
                            onChange={(e) => setSuperAdminEmail(e.target.value)}
                            placeholder="example@gmail.com"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {language === 'mr' ? 'याच ईमेलने सुपर ॲडमिन लॉगिन करता येईल' : 'Master login email address'}
                        </p>
                      </div>

                      {/* Super Admin Mobile / WhatsApp */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          {language === 'mr' ? 'मोबाईल / WhatsApp क्रमांक' : 'Mobile / WhatsApp Number'} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            id="input-superadmin-phone"
                            type="text"
                            required
                            value={superAdminPhone}
                            onChange={(e) => setSuperAdminPhone(e.target.value)}
                            placeholder="+91 8788000000"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {language === 'mr' ? 'शाळांसाठी हेल्पलाइन नंबर म्हणून वापरला जाईल' : 'Helpline contact for registered schools'}
                        </p>
                      </div>

                      {/* Master Password */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          {language === 'mr' ? 'सुपर ॲडमिन लॉगिन पासवर्ड' : 'Super Admin Login Password'} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            id="input-superadmin-password"
                            type={showSuperAdminPass ? 'text' : 'password'}
                            required
                            value={superAdminPassword}
                            onChange={(e) => setSuperAdminPassword(e.target.value)}
                            placeholder="Admin@8788"
                            className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSuperAdminPass(!showSuperAdminPass)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showSuperAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {language === 'mr' ? 'तुम्ही येथे बदललेला पासवर्ड लगेच लागू होईल' : 'New password is saved immediately'}
                        </p>
                      </div>

                      {/* Emergency Recovery PIN */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          {language === 'mr' ? 'इमर्जन्सी रिकव्हरी पिन' : 'Emergency Recovery PIN'} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            id="input-superadmin-pin"
                            type="text"
                            required
                            value={superAdminPin}
                            onChange={(e) => setSuperAdminPin(e.target.value)}
                            placeholder="8788"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {language === 'mr' ? 'पासवर्ड विसरल्यास या पिनने रीसेट करता येईल' : 'Used to reset password if forgotten'}
                        </p>
                      </div>

                      {/* Security Question */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          {language === 'mr' ? 'गुप्त सुरक्षा प्रश्न (Security Question)' : 'Security Question'}
                        </label>
                        <div className="relative">
                          <HelpCircle className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            id="input-superadmin-question"
                            type="text"
                            value={superAdminQuestion}
                            onChange={(e) => setSuperAdminQuestion(e.target.value)}
                            placeholder="तुमचे आवडते शहर / मूळ गाव कोणते?"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {language === 'mr' ? 'खाते पुनर्प्राप्तीसाठी प्रश्न' : 'Account recovery question'}
                        </p>
                      </div>

                      {/* Security Answer */}
                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          {language === 'mr' ? 'सुरक्षा उत्तर (Security Answer)' : 'Security Answer'}
                        </label>
                        <input
                          id="input-superadmin-answer"
                          type="text"
                          value={superAdminAnswer}
                          onChange={(e) => setSuperAdminAnswer(e.target.value)}
                          placeholder="चिखली"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          {language === 'mr' ? 'सुरक्षा प्रश्नाचे उत्तर गुप्त ठेवा' : 'Keep this answer confidential'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                      <button
                        type="submit"
                        id="btn-save-superadmin-security"
                        disabled={savingSuperSecurity}
                        className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>{savingSuperSecurity ? (language === 'mr' ? 'क्लाऊडवर जतन होत आहे...' : 'Saving to Cloud...') : (language === 'mr' ? 'माझा पासवर्ड व सर्व माहिती जतन करा' : 'Save My Password & Info')}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Sub-Tab 2: Platform Info & Support */}
              {superAdminSubTab === 'platform_info' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Building className="w-5 h-5 text-blue-400" />
                      <div>
                        <h3 className="font-bold text-sm tracking-wide uppercase">
                          {language === 'mr' ? 'प्लॅटफॉर्म ब्रँडिंग व ग्राहक सपोर्ट माहिती' : 'Platform Branding & Customer Support'}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {language === 'mr' ? 'ही माहिती शाळांच्या लॉगिन पृष्ठावर व सपोर्ट विभागात दर्शवली जाते.' : 'Shown to schools on the login page and help contacts.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSavePlatformSettings} className="p-6 space-y-5">
                    {platformSaveSuccess && (
                      <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 font-bold text-xs sm:text-sm flex items-center gap-2 animate-in fade-in-50">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>{language === 'mr' ? 'प्लॅटफॉर्म माहिती यशस्वीरित्या सेव्ह झाली!' : 'Platform settings saved successfully!'}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Platform Name */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          {language === 'mr' ? 'प्लॅटफॉर्म / सॉफ्टवेअर नाव' : 'Platform / SaaS Title'} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={platformSettings.platformName}
                          onChange={(e) => setPlatformSettings({ ...platformSettings, platformName: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                      </div>

                      {/* Owner Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          {language === 'mr' ? 'प्लॅटफॉर्म मालक / संचालक' : 'Owner / Super Admin Name'}
                        </label>
                        <input
                          type="text"
                          value={platformSettings.ownerName || 'गणेशकर सर (Super Admin)'}
                          onChange={(e) => setPlatformSettings({ ...platformSettings, ownerName: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                      </div>

                      {/* Support Phone / WhatsApp */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          {language === 'mr' ? 'शाळा मदत / WhatsApp हेल्पलाईन क्रमांक' : 'Support Helpline / WhatsApp'} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            required
                            value={platformSettings.supportPhone}
                            onChange={(e) => setPlatformSettings({ ...platformSettings, supportPhone: e.target.value })}
                            placeholder="+91 8788000000"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-bold text-blue-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                          />
                        </div>
                      </div>

                      {/* Support Email */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          {language === 'mr' ? 'अधिकृत ग्राहक सपोर्ट ईमेल' : 'Official Support Email'} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="email"
                            required
                            value={platformSettings.supportEmail}
                            onChange={(e) => setPlatformSettings({ ...platformSettings, supportEmail: e.target.value })}
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                          />
                        </div>
                      </div>

                      {/* Platform Tagline */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          {language === 'mr' ? 'प्लॅटफॉर्म ब्रीदवाक्य / टॅगलाईन' : 'Platform Tagline'}
                        </label>
                        <input
                          type="text"
                          value={platformSettings.platformTagline}
                          onChange={(e) => setPlatformSettings({ ...platformSettings, platformTagline: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                      <button
                        type="submit"
                        disabled={savingPlatform}
                        className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>{savingPlatform ? (language === 'mr' ? 'जतन होत आहे...' : 'Saving...') : (language === 'mr' ? 'प्लॅटफॉर्म माहिती जतन करा' : 'Save Platform Settings')}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Sub-Tab 3: New School SaaS Policies */}
              {superAdminSubTab === 'defaults' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-5 h-5 text-purple-400" />
                      <div>
                        <h3 className="font-bold text-sm tracking-wide uppercase">
                          {language === 'mr' ? 'नवीन शाळा नोंदणी डीफॉल्ट धोरण व नियम' : 'Default Policies for New Schools'}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {language === 'mr' ? 'नवीन शाळा जोडताना किंवा एक्सेल इम्पोर्ट करताना हे नियम स्वयंचलित लागू होतात.' : 'Applied automatically when registering or importing new client schools.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSavePlatformSettings} className="p-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Default Subscription Plan */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          {language === 'mr' ? 'डीफॉल्ट सबस्क्रिप्शन प्लॅन' : 'Default Subscription Plan'}
                        </label>
                        <select
                          value={platformSettings.defaultSubscriptionPlan}
                          onChange={(e) => setPlatformSettings({ ...platformSettings, defaultSubscriptionPlan: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-600 outline-none"
                        >
                          <option value="वार्षिक सबस्क्रिप्शन (Pro)">वार्षिक सबस्क्रिप्शन (Pro) - 1 वर्ष (365 दिवस)</option>
                          <option value="आजीवन सबस्क्रिप्शन (Lifetime Pro)">आजीवन सबस्क्रिप्शन (Lifetime Pro)</option>
                          <option value="मोफत चाचणी (Trial 30 Days)">मोफत चाचणी (Trial 30 Days)</option>
                        </select>
                      </div>

                      {/* Default Academic Year */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          {language === 'mr' ? 'डीफॉल्ट शैक्षणिक वर्ष' : 'Default Academic Year'}
                        </label>
                        <input
                          type="text"
                          value={platformSettings.defaultAcademicYear}
                          onChange={(e) => setPlatformSettings({ ...platformSettings, defaultAcademicYear: e.target.value })}
                          placeholder="2026-2027"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-600 outline-none"
                        />
                      </div>

                      {/* Default State Board */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          {language === 'mr' ? 'डीफॉल्ट राज्य शिक्षण मंडळ' : 'Default State Education Board'}
                        </label>
                        <input
                          type="text"
                          value={platformSettings.defaultBoard}
                          onChange={(e) => setPlatformSettings({ ...platformSettings, defaultBoard: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-600 outline-none"
                        />
                      </div>

                      {/* Default Initial Password */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          {language === 'mr' ? 'नवीन शाळेसाठी डीफॉल्ट पासवर्ड पॅटर्न' : 'Default School Password Pattern'}
                        </label>
                        <input
                          type="text"
                          value={platformSettings.defaultSchoolPassword}
                          onChange={(e) => setPlatformSettings({ ...platformSettings, defaultSchoolPassword: e.target.value })}
                          placeholder="Shala@123"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-mono font-bold text-purple-900 focus:bg-white focus:ring-2 focus:ring-purple-600 outline-none"
                        />
                      </div>

                      {/* Default PIN */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          {language === 'mr' ? 'डीफॉल्ट सुरक्षा रिकव्हरी पिन' : 'Default Recovery PIN'}
                        </label>
                        <input
                          type="text"
                          value={platformSettings.defaultSecurityPin}
                          onChange={(e) => setPlatformSettings({ ...platformSettings, defaultSecurityPin: e.target.value })}
                          placeholder="8788"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-mono font-bold text-purple-900 focus:bg-white focus:ring-2 focus:ring-purple-600 outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                      <button
                        type="submit"
                        disabled={savingPlatform}
                        className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>{language === 'mr' ? 'डीफॉल्ट नियम जतन करा' : 'Save Default Policies'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Sub-Tab 4: Global Multi-School Database Tools */}
              {superAdminSubTab === 'database' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Database className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h3 className="font-bold text-sm tracking-wide uppercase">
                          {language === 'mr' ? 'क्लाऊड डेटाबेस व सर्व शाळा मास्टर बॅकअप' : 'Cloud Database & Global Schools Registry'}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {language === 'mr' ? 'सर्व शाळांचा एकाच क्लिकवर सुरक्षित बॅकअप व क्लाऊड सिंक्रोनायझेशन.' : 'One-click full multi-school registry export and cloud database sync.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Database Live Status Card */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                          <h4 className="text-sm font-black text-emerald-950">
                            Google Cloud Firestore Active & Operational
                          </h4>
                        </div>
                        <p className="text-xs text-emerald-800 mt-1 font-medium">
                          Database ID: <strong className="font-mono">ai-studio-shalaverse-312aa896</strong> • Live cloud persistence enabled.
                        </p>
                        <p className="text-[11px] text-emerald-700 mt-0.5">
                          {language === 'mr' 
                            ? 'सर्व ग्राहक शाळांचा डेटा सुरक्षितपणे क्लाऊडवर साठवला जात असून २४x७ उपलब्ध आहे.' 
                            : 'All client school records are safely backed up in the live cloud.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          id="btn-refresh-global-cache"
                          onClick={handleRefreshGlobalCache}
                          disabled={refreshingGlobalCache}
                          className="px-4 py-2 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${refreshingGlobalCache ? 'animate-spin' : ''}`} />
                          <span>{refreshingGlobalCache ? 'रिफ्रेश होत आहे...' : (language === 'mr' ? 'डेटाबेस सिंक करा' : 'Sync Database')}</span>
                        </button>
                      </div>
                    </div>

                    {globalCacheSuccess && (
                      <div className="p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>{language === 'mr' ? 'सर्व शाळांचा डेटाबेस यशस्वीरित्या सिंक व रिफ्रेश झाला!' : 'Schools database synchronized successfully!'}</span>
                      </div>
                    )}

                    {/* Master Export Tool */}
                    <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-black text-slate-900">
                            {language === 'mr' ? 'सर्व शाळांची संपूर्ण मास्टर फाईल (Registry Backup JSON)' : 'Master Multi-School Registry Backup'}
                          </h4>
                          <p className="text-xs text-slate-600 mt-1">
                            {language === 'mr' 
                              ? `नोंदणी केलेल्या सर्व ${allSchools.length} शाळांचे नाव, युडायस, मुख्याध्यापक, लॉगिन आयडी, पासवर्ड, सबस्क्रिप्शन मुदत अशी संपूर्ण माहिती फाईल स्वरूपात सुरक्षित डाऊनलोड करा.` 
                              : `Download a complete master JSON file of all ${allSchools.length} client schools.`}
                          </p>
                        </div>

                        <button
                          type="button"
                          id="btn-export-all-schools-json"
                          onClick={handleExportAllSchools}
                          disabled={isExportingAllSchools}
                          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          {isExportingAllSchools ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          <span>
                            {isExportingAllSchools 
                              ? (language === 'mr' ? 'डाऊनलोड होत आहे...' : 'Exporting...') 
                              : (language === 'mr' ? 'सर्व शाळांची फाईल डाऊनलोड करा' : 'Download All Schools Registry')}
                          </span>
                        </button>
                      </div>

                      {allSchoolsExportSuccess && (
                        <div className="p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span>{language === 'mr' ? 'सर्व शाळांची मास्टर फाईल यशस्वीरित्या डाऊनलोड झाली!' : 'Master registry file exported successfully!'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. VIEW 2: CLIENT SCHOOL CONFIGURATION (Super Admin modifying a specific school) */}
          {superAdminTab === 'client_school' && (
            <div className="space-y-6">
              {/* School Picker Header */}
              <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {language === 'mr' ? 'ग्राहक शाळा निवडक' : 'Client School Selector'}
                  </span>
                  <h3 className="text-base font-black text-slate-900">
                    {language === 'mr' ? 'कोणत्या शाळेचे सेटिंग्ज तपासायचे किंवा बदलायचे आहेत?' : 'Select School to Configure'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'mr' 
                      ? 'येथून निवडलेल्या शाळेची संपूर्ण माहिती तुम्ही थेट बदलू शकता व त्या शाळेचा डॅशबोर्ड उघडू शकता.' 
                      : 'You can update this school\'s profile and open its dashboard.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    id="select-superadmin-school-picker"
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none max-w-xs"
                  >
                    {allSchools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.schoolNameLocal || s.schoolName} ({s.udiseNumber})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    id="btn-open-selected-school-dashboard"
                    onClick={handleOpenClientSchoolDashboard}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{language === 'mr' ? 'या शाळेचा डॅशबोर्ड उघडा' : 'Open Dashboard'}</span>
                  </button>
                </div>
              </div>

              {/* Client School Edit Form */}
              <form onSubmit={handleSaveClientSchool} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <SchoolIcon className="w-5 h-5 text-blue-400" />
                    <div>
                      <h3 className="font-bold text-sm tracking-wide uppercase">
                        {clientSchoolForm.schoolNameLocal || clientSchoolForm.schoolName || 'शाळा प्रोफाइल'}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        UDISE: {clientSchoolForm.udiseNumber || '-'} • ID: {selectedSchoolId}
                      </p>
                    </div>
                  </div>

                  {clientSchoolSuccess && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs font-bold animate-in fade-in-50">
                      <Check className="w-3.5 h-3.5" />
                      <span>{language === 'mr' ? 'माहिती सेव्ह झाली!' : 'Saved!'}</span>
                    </div>
                  )}
                </div>

                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* School Name English */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {language === 'mr' ? 'शाळेचे संपूर्ण नाव (इंग्रजीत)' : 'School Full Name (English)'}
                    </label>
                    <input
                      type="text"
                      required
                      value={clientSchoolForm.schoolName || ''}
                      onChange={(e) => setClientSchoolForm({ ...clientSchoolForm, schoolName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>

                  {/* School Name Marathi */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {language === 'mr' ? 'शाळेचे नाव (मराठीत)' : 'School Name in Marathi'}
                    </label>
                    <input
                      type="text"
                      value={clientSchoolForm.schoolNameLocal || ''}
                      onChange={(e) => setClientSchoolForm({ ...clientSchoolForm, schoolNameLocal: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>

                  {/* UDISE Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {language === 'mr' ? 'युडायस क्रमांक (11 अंकी)' : 'School UDISE Number'}
                    </label>
                    <input
                      type="text"
                      required
                      value={clientSchoolForm.udiseNumber || ''}
                      onChange={(e) => setClientSchoolForm({ ...clientSchoolForm, udiseNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-mono text-xs sm:text-sm font-bold text-blue-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>

                  {/* Academic Year */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {language === 'mr' ? 'शैक्षणिक वर्ष' : 'Academic Year'}
                    </label>
                    <input
                      type="text"
                      value={clientSchoolForm.academicYear || '2026-2027'}
                      onChange={(e) => setClientSchoolForm({ ...clientSchoolForm, academicYear: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>

                  {/* Sanstha / Trust */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {language === 'mr' ? 'संस्था / व्यवस्थापन मंडळ' : 'Management / Sanstha'}
                    </label>
                    <input
                      type="text"
                      value={clientSchoolForm.boardAffiliation || ''}
                      onChange={(e) => setClientSchoolForm({ ...clientSchoolForm, boardAffiliation: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>

                  {/* Headmaster / Principal */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {language === 'mr' ? 'मुख्याध्यापक / प्राचार्य नाव' : 'Principal / Headmaster Name'}
                    </label>
                    <input
                      type="text"
                      value={clientSchoolForm.headmasterName || ''}
                      onChange={(e) => setClientSchoolForm({ ...clientSchoolForm, headmasterName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>

                  {/* School Single Login Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {language === 'mr' ? 'शाळेचा लॉगिन पासवर्ड' : 'School Login Password'}
                    </label>
                    <input
                      type="text"
                      value={clientSchoolForm.password || 'Shala@123'}
                      onChange={(e) => setClientSchoolForm({ ...clientSchoolForm, password: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-mono text-xs sm:text-sm font-bold text-amber-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {language === 'mr' ? 'शाळा संपर्क क्रमांक' : 'School Phone'}
                    </label>
                    <input
                      type="text"
                      value={clientSchoolForm.phone || ''}
                      onChange={(e) => setClientSchoolForm({ ...clientSchoolForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {language === 'mr' ? 'शाळा अधिकृत ईमेल' : 'School Email'}
                    </label>
                    <input
                      type="email"
                      value={clientSchoolForm.email || ''}
                      onChange={(e) => setClientSchoolForm({ ...clientSchoolForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>

                  {/* Address */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {language === 'mr' ? 'शाळेचा पत्ता' : 'School Address'}
                    </label>
                    <input
                      type="text"
                      value={clientSchoolForm.address || ''}
                      onChange={(e) => setClientSchoolForm({ ...clientSchoolForm, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleOpenClientSchoolDashboard}
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{language === 'mr' ? 'या शाळेच्या डॅशबोर्डवर थेट जा' : 'Go directly to this school\'s dashboard'}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={savingClientSchool}
                    className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingClientSchool ? (language === 'mr' ? 'जतन होत आहे...' : 'Saving...') : (language === 'mr' ? 'या शाळेची माहिती अपडेट करा' : 'Save School Changes')}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* B. REGULAR SCHOOL USER SETTINGS (Only for the active school)             */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Settings Header */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                <SchoolIcon className="w-6 h-6 text-blue-700" />
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

          {/* Main School Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center gap-2">
                <SchoolIcon className="w-5 h-5 text-blue-400" />
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
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {language === 'mr' ? 'शाळा मान्यता / नोंदणी क्र.' : 'School Recognition No.'}
                  </label>
                  <input
                    id="input-setting-recognition"
                    type="text"
                    value={formData.recognitionNo || ''}
                    onChange={(e) => handleChange('recognitionNo', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
                  />
                </div>

                {/* Principal / Headmaster Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {language === 'mr' ? 'मुख्याध्यापक / प्राचार्य नाव' : 'Principal / Headmaster Name'}
                  </label>
                  <input
                    id="input-setting-headmaster"
                    type="text"
                    value={formData.headmasterName || ''}
                    onChange={(e) => handleChange('headmasterName', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-blue-600"
                  />
                </div>

                {/* Official Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {language === 'mr' ? 'शाळा संपर्क क्रमांक' : 'Office Phone'}
                  </label>
                  <input
                    id="input-setting-phone"
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
                  />
                </div>

                {/* Official Email */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {language === 'mr' ? 'शाळेचा अधिकृत ईमेल' : 'Office Email'}
                  </label>
                  <input
                    id="input-setting-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {language === 'mr' ? 'शाळेचा पत्ता' : 'School Address'}
                  </label>
                  <input
                    id="input-setting-address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Save Settings Bar */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  id="btn-save-settings"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? (language === 'mr' ? 'जतन करत आहे...' : 'Saving...') : (language === 'mr' ? 'माहिती सेव्ह करा' : 'Save School Settings')}</span>
                </button>
              </div>
            </div>
          </form>

          {/* School Login Security & Master Credentials Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
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
                {/* School Login Email */}
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
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>
                </div>

                {/* Password */}
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
                      className="w-full pl-9 pr-9 py-2 rounded-lg border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
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

                {/* Security PIN */}
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
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
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
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingCreds ? (language === 'mr' ? 'जतन होत आहे...' : 'Saving...') : (language === 'mr' ? 'लॉगिन पासवर्ड व सुरक्षा जतन करा' : 'Update Security & Password')}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Database Storage & Single School Backup Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold tracking-wide uppercase">
                {language === 'mr' ? 'डेटा स्टोरेज व बॅकअप टूल्स' : 'Data Storage & Backup Tools'}
              </h3>
            </div>

            <div className="p-6 space-y-6">
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
                        : (language === 'mr' ? 'बॅकअप डाऊनलोड (JSON)' : 'Export Backup (JSON)')}
                    </span>
                  </button>

                  <button
                    type="button"
                    id="btn-restore-backup-file"
                    onClick={handleOpenRestoreSelector}
                    className="px-4 py-2 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 shrink-0 transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-emerald-700" />
                    <span>{language === 'mr' ? 'बॅकअप फाईल रीस्टोअर करा' : 'Restore from Backup File'}</span>
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
        </div>
      )}

      {/* Restore Confirmation & Progress Modal */}
      {restoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
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
