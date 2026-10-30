import { useState, useMemo, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Crown, 
  School as SchoolIcon, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Check, 
  KeyRound, 
  Lock,
  Eye,
  Mail, 
  Phone, 
  MapPin, 
  Power,
  Users,
  ShieldCheck,
  Building,
  Sparkles,
  X,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { School } from '../types';
import { formatDate } from '../utils/dateUtils';
import { SchoolBulkImportModal } from '../components/superadmin/SchoolBulkImportModal';
import { DEFAULT_INITIAL_SCHOOLS } from '../services/schoolService';

export function SuperAdmin() {
  const { 
    allSchools, 
    currentSchool, 
    selectSchool, 
    addSchool, 
    updateSchool, 
    deleteSchool, 
    toggleSchoolStatus, 
    bulkAddSchools,
    resetBulkSchools,
    loading, 
    isSuperAdmin 
  } = useSchool();
  const { language } = useLanguage();
  const { changeSuperAdminPassword, userProfile } = useAuth();
  const navigate = useNavigate();

  // Route security: Only Super Admin can access this SaaS management portal
  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, isSuperAdmin, navigate]);

  // Super Admin Password Change State
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentOrPin, setCurrentOrPin] = useState('');
  const [newSuperAdminPass, setNewSuperAdminPass] = useState('');
  const [confirmSuperAdminPass, setConfirmSuperAdminPass] = useState('');
  const [showPassText, setShowPassText] = useState(false);
  const [changePassLoading, setChangePassLoading] = useState(false);
  const [changePassError, setChangePassError] = useState<string | null>(null);
  const [changePassSuccess, setChangePassSuccess] = useState<string | null>(null);

  const handleChangeSuperAdminPassword = async (e: FormEvent) => {
    e.preventDefault();
    setChangePassError(null);
    setChangePassSuccess(null);

    if (!currentOrPin.trim()) {
      setChangePassError(language === 'mr' ? 'कृपया चालू पासवर्ड किंवा सुरक्षा पिन प्रविष्ट करा.' : 'Please enter current password or security recovery PIN.');
      return;
    }

    if (!newSuperAdminPass || newSuperAdminPass.trim().length < 4) {
      setChangePassError(language === 'mr' ? 'नवीन पासवर्ड किमान ४ अक्षरांचा असावा.' : 'New password must be at least 4 characters.');
      return;
    }

    if (newSuperAdminPass.trim() !== confirmSuperAdminPass.trim()) {
      setChangePassError(language === 'mr' ? 'नवीन पासवर्ड आणि कन्फर्म पासवर्ड जुळत नाहीत.' : 'New password and confirm password do not match.');
      return;
    }

    setChangePassLoading(true);
    try {
      const res = await changeSuperAdminPassword(currentOrPin.trim(), newSuperAdminPass.trim());
      if (res.success) {
        setChangePassSuccess(language === 'mr' ? 'सुपर ॲडमिन पासवर्ड यशस्वीरित्या बदलला आहे!' : 'Super Admin password updated successfully!');
        setNotification(language === 'mr' ? 'सुपर ॲडमिन पासवर्ड यशस्वीरित्या अपडेट झाला आहे.' : 'Super Admin password updated.');
        setTimeout(() => {
          setIsChangePasswordOpen(false);
          setCurrentOrPin('');
          setNewSuperAdminPass('');
          setConfirmSuperAdminPass('');
          setChangePassSuccess(null);
        }, 1600);
      } else {
        setChangePassError(res.message);
      }
    } catch (err: any) {
      setChangePassError(err?.message || 'Password update failed.');
    } finally {
      setChangePassLoading(false);
    }
  };

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    schoolName: '',
    schoolNameLocal: '',
    udiseNumber: '',
    boardAffiliation: 'Shri Shivaji Shikshan Sanstha, Amravati – Managed by',
    recognitionNo: '',
    affiliationNo: '',
    boardName: 'Maharashtra State Board',
    address: '',
    phone: '',
    email: '',
    password: '',
    website: '',
    academicYear: '2026-2027',
    headmasterName: 'मुख्याध्यापक / प्राचार्य',
    status: 'active' as 'active' | 'inactive',
    subscriptionPlan: 'वार्षिक सबस्क्रिप्शन (Pro)',
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Import Modal State
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Default schools ID set & imported schools count
  const defaultSchoolIds = useMemo(() => new Set(DEFAULT_INITIAL_SCHOOLS.map(s => s.id)), []);
  const importedSchoolsCount = useMemo(() => {
    return allSchools.filter(s => !defaultSchoolIds.has(s.id)).length;
  }, [allSchools, defaultSchoolIds]);

  // Bulk Reset State
  const [isResetBulkModalOpen, setIsResetBulkModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetProgress, setResetProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });

  const handleConfirmResetBulk = async () => {
    setIsResetting(true);
    setResetProgress({ done: 0, total: importedSchoolsCount });
    try {
      const res = await resetBulkSchools((done, total) => {
        setResetProgress({ done, total });
      });
      setNotification(
        language === 'mr'
          ? `सर्व ${res.deletedCount || importedSchoolsCount} बल्क शाळा यशस्वीरित्या हटवल्या आणि सिस्टीम रिसेट केली!`
          : `Successfully removed ${res.deletedCount || importedSchoolsCount} bulk schools and reset to defaults!`
      );
      setIsResetBulkModalOpen(false);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      console.error('Reset bulk schools error:', err);
      setNotification(language === 'mr' ? 'बल्क शाळा रिसेट करताना त्रुटी आली.' : 'Failed to reset bulk schools.');
    } finally {
      setIsResetting(false);
    }
  };

  // High-performance Pagination for 1000+ Schools
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Filtered Schools
  const filteredSchools = useMemo(() => {
    return allSchools.filter(school => {
      if (statusFilter !== 'all' && school.status !== statusFilter) {
        return false;
      }
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        (school.schoolName || '').toLowerCase().includes(q) ||
        (school.schoolNameLocal || '').toLowerCase().includes(q) ||
        (school.udiseNumber || '').includes(q) ||
        (school.email || '').toLowerCase().includes(q) ||
        (school.address || '').toLowerCase().includes(q)
      );
    });
  }, [allSchools, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSchools.length / (pageSize === -1 ? filteredSchools.length || 1 : pageSize)));
  const paginatedSchools = useMemo(() => {
    if (pageSize === -1) return filteredSchools;
    const start = (currentPage - 1) * pageSize;
    return filteredSchools.slice(start, start + pageSize);
  }, [filteredSchools, currentPage, pageSize]);

  const activeCount = allSchools.filter(s => s.status === 'active').length;
  const inactiveCount = allSchools.filter(s => s.status === 'inactive').length;

  const handleCopyCredentials = (school: School) => {
    const text = language === 'mr'
      ? `🏫 शाळेचे नाव: ${school.schoolNameLocal || school.schoolName}\n🌐 ShalaVerse पोर्टल लॉगिन लिंक: ${window.location.origin}/login\n👤 लॉगिन आयडी (Email किंवा UDISE): ${school.email} किंवा ${school.udiseNumber}\n🔑 पासवर्ड (Password): ${school.password || 'Shala@123'}\n📅 सबस्क्रिप्शन मुदत: ${school.expiryDate || '१ वर्ष'}`
      : `🏫 School Name: ${school.schoolName || school.schoolNameLocal}\n🌐 ShalaVerse Portal Link: ${window.location.origin}/login\n👤 Login ID (Email or UDISE): ${school.email} or ${school.udiseNumber}\n🔑 Password: ${school.password || 'Shala@123'}\n📅 Subscription Validity: ${school.expiryDate || '1 Year'}`;
    navigator.clipboard.writeText(text);
    setCopiedKey(school.id);
    setNotification(language === 'mr' ? `लॉगिन माहिती कॉपी केली! तुम्ही ही शाळेला WhatsApp वर पाठवू शकता.` : `Login credentials copied! You can share them via WhatsApp or Email.`);
    setTimeout(() => setCopiedKey(null), 2500);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setSelectedSchoolId(null);
    setFormData({
      schoolName: '',
      schoolNameLocal: '',
      udiseNumber: '',
      boardAffiliation: 'Shri Shivaji Shikshan Sanstha, Amravati – Managed by',
      recognitionNo: '',
      affiliationNo: '',
      boardName: 'Maharashtra State Board',
      address: '',
      phone: '',
      email: '',
      password: 'Shala@' + Math.floor(100 + Math.random() * 900),
      website: '',
      academicYear: '2026-2027',
      headmasterName: 'मुख्याध्यापक / प्राचार्य',
      status: 'active',
      subscriptionPlan: language === 'mr' ? 'वार्षिक सबस्क्रिप्शन (Pro)' : 'Annual Subscription (Pro)',
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (school: School) => {
    setModalMode('edit');
    setSelectedSchoolId(school.id);
    setFormData({
      schoolName: school.schoolName || '',
      schoolNameLocal: school.schoolNameLocal || '',
      udiseNumber: school.udiseNumber || '',
      boardAffiliation: school.boardAffiliation || '',
      recognitionNo: school.recognitionNo || '',
      affiliationNo: school.affiliationNo || '',
      boardName: school.boardName || 'Maharashtra State Board',
      address: school.address || '',
      phone: school.phone || '',
      email: school.email || '',
      password: school.password || 'Shala@123',
      website: school.website || '',
      academicYear: school.academicYear || '2026-2027',
      headmasterName: school.headmasterName || '',
      status: school.status || 'active',
      subscriptionPlan: school.subscriptionPlan || (language === 'mr' ? 'वार्षिक सबस्क्रिप्शन (Pro)' : 'Annual Subscription (Pro)'),
      expiryDate: school.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.schoolName.trim() || !formData.udiseNumber.trim() || !formData.email.trim() || !formData.password.trim()) {
      alert(language === 'mr' ? 'कृपया शाळेचे नाव, UDISE क्रमांक, ईमेल आणि पासवर्ड नक्की भरा.' : 'Please enter School Name, UDISE Number, Email, and Password.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'add') {
        const created = await addSchool(formData);
        const schoolTitle = language === 'mr' ? (created.schoolNameLocal || created.schoolName) : (created.schoolName || created.schoolNameLocal);
        setNotification(language === 'mr' ? `नवीन शाळा "${schoolTitle}" यशस्वीरित्या नोंदवली गेली!` : `New school "${schoolTitle}" registered successfully!`);
      } else if (selectedSchoolId) {
        await updateSchool(selectedSchoolId, formData);
        setNotification(language === 'mr' ? `शाळा माहिती यशस्वीरित्या अपडेट केली!` : `School details updated successfully!`);
      }
      setIsModalOpen(false);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert((language === 'mr' ? 'त्रुटी: ' : 'Error: ') + (err?.message || (language === 'mr' ? 'शाळा जतन करता आली नाही.' : 'Could not save school.')));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete School State
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSwitchToSchool = (school: School) => {
    selectSchool(school);
    const schoolTitle = language === 'mr' ? (school.schoolNameLocal || school.schoolName) : (school.schoolName || school.schoolNameLocal);
    setNotification(language === 'mr' ? `आता तुम्ही "${schoolTitle}" चे पोर्टल पाहत आहात.` : `Now viewing portal of "${schoolTitle}".`);
    navigate('/dashboard');
  };

  const handleDeleteSchool = (school: School) => {
    setSchoolToDelete(school);
  };

  const handleConfirmDelete = async () => {
    if (!schoolToDelete) return;
    const target = schoolToDelete;
    setIsDeleting(true);
    setSchoolToDelete(null); // Close modal immediately to avoid UI hang
    try {
      const schoolTitle = language === 'mr' 
        ? (target.schoolNameLocal || target.schoolName) 
        : (target.schoolName || target.schoolNameLocal);
      await deleteSchool(target.id);
      setNotification(language === 'mr' ? `शाळा "${schoolTitle}" यशस्वीरित्या हटवली गेली.` : `School "${schoolTitle}" deleted successfully.`);
      setTimeout(() => setNotification(null), 3500);
    } catch (err: any) {
      console.error('Delete school error:', err);
      setNotification(language === 'mr' ? 'शाळा हटवताना त्रुटी आली.' : 'Failed to delete school.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in-50">
      
      {/* 1. Super Admin Executive Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-xs">
            <Crown className="w-3.5 h-3.5" />
            <span>{language === 'mr' ? 'Super Admin • प्लॅटफॉर्म मालक केंद्र' : 'Super Admin • Platform Owner Hub'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <span>{language === 'mr' ? 'ShalaVerse शाळा व्यवस्थापन' : 'ShalaVerse Multi-School Management'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium">
            {language === 'mr' 
              ? 'येथून तुम्ही नवीन ग्राहक शाळांची नोंद करू शकता, त्यांना १ लॉगिन पासवर्ड देऊ शकता, आणि त्यांच्या सबस्क्रिप्शनची मुदत व स्थिती नियंत्रित करू शकता.' 
              : 'Register new client schools, provide them single login credentials, and manage SaaS subscriptions and validity.'}
          </p>
        </div>

        <div className="z-10 flex items-center gap-3 flex-wrap">

          <button
            type="button"
            id="btn-bulk-import-schools"
            onClick={() => setIsBulkImportOpen(true)}
            className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-950/40 flex items-center gap-2 transition active:scale-95 cursor-pointer shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span>{language === 'mr' ? '१०००+ शाळा एक्सेल इम्पोर्ट' : 'Bulk Import 1000+ Schools'}</span>
          </button>

          <button
            type="button"
            id="btn-reset-bulk-schools"
            onClick={() => setIsResetBulkModalOpen(true)}
            className="px-4 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-sm rounded-xl shadow-lg shadow-rose-950/40 flex items-center gap-2 transition active:scale-95 cursor-pointer shrink-0 border border-rose-400/30"
            title={language === 'mr' ? 'बल्क आयात केलेल्या शाळा रिसेट / हटवा' : 'Reset Bulk Imported Schools'}
          >
            <RotateCcw className="w-4 h-4 text-rose-200" />
            <span>{language === 'mr' ? 'बल्क शाळा रिसेट' : 'Reset Bulk Schools'}</span>
            {importedSchoolsCount > 0 && (
              <span className="px-2 py-0.5 bg-rose-950/80 text-rose-200 text-xs rounded-full font-bold">
                {importedSchoolsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            id="btn-add-new-school"
            onClick={handleOpenAddModal}
            className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>{language === 'mr' ? '+ नवीन शाळा जोडा (Add School)' : '+ Add New School'}</span>
          </button>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 font-bold text-sm flex items-center justify-between shadow-xs animate-in fade-in-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold text-sm p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              {language === 'mr' ? 'एकूण ग्राहक शाळा' : 'Total Client Schools'}
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <SchoolIcon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">{allSchools.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {language === 'mr' ? 'नोंदणीकृत शाळांची संख्या' : 'Registered schools count'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              {language === 'mr' ? 'सक्रिय शाळा (Active)' : 'Active Schools'}
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2 font-mono">{activeCount}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            {language === 'mr' ? 'सॉफ्टवेअर चालू असलेल्या शाळा' : 'Schools with active portal'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              {language === 'mr' ? 'निष्क्रिय शाळा (Inactive)' : 'Inactive Schools'}
            </span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <Power className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-700 mt-2 font-mono">{inactiveCount}</p>
          <p className="text-[11px] text-rose-600 font-semibold mt-1">
            {language === 'mr' ? 'बंद किंवा सबस्क्रिप्शन संपलेले' : 'Suspended or expired'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              {language === 'mr' ? 'क्लाऊड डेटाबेस सुरक्षा' : 'Cloud Database Status'}
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black text-emerald-900 mt-2 truncate flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span>{language === 'mr' ? '१००% सुरक्षित व ऑनलाइन' : '100% Live & Secure'}</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-mono truncate">
            {language === 'mr' ? 'Firestore Live Sync • २४x७ बॅकअप' : 'Firestore Live Sync • 24x7 Backup'}
          </p>
        </div>
      </div>

      {/* 3. Search and Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            id="input-search-schools"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'mr' ? 'शाळेचे नाव, UDISE नंबर, ईमेल किंवा पत्ता शोधा...' : 'Search by school name, UDISE number, email, or address...'}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 shrink-0">
            {language === 'mr' ? 'फिल्टर:' : 'Filter:'}
          </span>
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md transition ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {language === 'mr' ? 'सर्व' : 'All'} ({allSchools.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-md transition ${statusFilter === 'active' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {language === 'mr' ? 'सक्रिय' : 'Active'} ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1 rounded-md transition ${statusFilter === 'inactive' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {language === 'mr' ? 'निष्क्रिय' : 'Inactive'} ({inactiveCount})
            </button>
          </div>
        </div>
      </div>

      {/* 4. Schools Cards Grid */}
      <div className="space-y-4">
        {filteredSchools.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <SchoolIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">
              {language === 'mr' ? 'कोणतीही शाळा आढळली नाही' : 'No schools found'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'mr' 
                ? 'शोध शब्द तपासा किंवा वर "+ नवीन शाळा जोडा" वर क्लिक करून नवीन शाळा नोंदवा.' 
                : 'Check search terms or click "+ Add New School" above to register.'}
            </p>
          </div>
        ) : (
          paginatedSchools.map((school) => {
            const isInactive = school.status === 'inactive';
            const isCopied = copiedKey === school.id;

            return (
              <div 
                key={school.id} 
                className="bg-white rounded-2xl border border-slate-200 transition shadow-xs hover:shadow-md p-5 sm:p-6 space-y-4"
              >
                {/* School Title & Status Badges */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-black text-slate-950">
                        {language === 'mr' 
                          ? (school.schoolNameLocal || school.schoolName) 
                          : (school.schoolName && !/^[\u0900-\u097F]/.test(school.schoolName) ? school.schoolName : (school.schoolName || 'School'))}
                      </h2>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider ${
                        school.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {school.status === 'active' 
                          ? (language === 'mr' ? '🟢 सक्रिय (Active)' : '🟢 Active') 
                          : (language === 'mr' ? '🔴 बंद (Inactive)' : '🔴 Inactive')}
                      </span>
                    </div>

                    {language === 'mr' && school.schoolName && school.schoolName !== (school.schoolNameLocal || '') && (
                      <p className="text-xs text-slate-500 font-medium">
                        {school.schoolName}
                      </p>
                    )}
                  </div>

                  {/* Quick Action: Switch to this school */}
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    <button
                      type="button"
                      id={`btn-switch-school-${school.udiseNumber}`}
                      onClick={() => handleSwitchToSchool(school)}
                      className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer ${
                        school.status === 'inactive'
                          ? 'bg-rose-950/90 hover:bg-rose-900 text-rose-200 border border-rose-500/40 shadow-rose-950/40'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {school.status === 'inactive' ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-rose-400" />
                          <span>
                            {language === 'mr' ? '👁️ सस्पेंशन स्क्रीन पहा (Preview)' : '👁️ Preview Lock Screen'}
                          </span>
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                          <span>
                            {language === 'mr' ? 'या शाळेचा डॅशबोर्ड उघडा' : 'Open School Dashboard'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  
                  {/* UDISE & Sanstha */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
                    <span className="text-[10.5px] font-bold text-slate-500 uppercase">
                      {language === 'mr' ? 'शाळा ओळख व बोर्ड' : 'School ID & Board'}
                    </span>
                    <p className="font-mono font-bold text-slate-900">UDISE: {school.udiseNumber}</p>
                    <p className="text-slate-600 truncate">{school.boardAffiliation || (language === 'mr' ? 'महाराष्ट्र शासन' : 'Maharashtra State')}</p>
                    {school.affiliationNo && <p className="text-slate-500">{language === 'mr' ? 'संलग्नता क्र:' : 'Affiliation No:'} {school.affiliationNo}</p>}
                  </div>

                  {/* School Login Credentials Box */}
                  <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-black text-amber-900 uppercase flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-amber-700" />
                        <span>{language === 'mr' ? 'शाळेचा १ लॉगिन आयडी/पासवर्ड' : 'Single School Login'}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCredentials(school)}
                        title={language === 'mr' ? 'शाळेची लॉगिन माहिती कॉपी करा' : 'Copy School Credentials'}
                        className="text-amber-800 hover:text-amber-950 p-0.5 cursor-pointer"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="flex items-center gap-1 text-slate-800 font-mono font-bold truncate">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{school.email}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-800 font-mono font-bold">
                      <span className="text-slate-500 font-normal">Pass:</span>
                      <span className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 border border-amber-300">
                        {school.password || 'Shala@123'}
                      </span>
                    </div>
                  </div>

                  {/* Contact & Address */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
                    <span className="text-[10.5px] font-bold text-slate-500 uppercase">
                      {language === 'mr' ? 'पत्ता व मुख्याध्यापक' : 'Address & Headmaster'}
                    </span>
                    <p className="text-slate-800 font-semibold truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{school.address || '-'}</span>
                    </p>
                    <p className="text-slate-600 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{school.phone || '-'}</span>
                    </p>
                    <p className="text-slate-500 truncate">{language === 'mr' ? 'प्र:' : 'HM:'} {school.headmasterName || (language === 'mr' ? 'मुख्याध्यापक' : 'Principal')}</p>
                  </div>

                  {/* Subscription Plan & Validity */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
                    <span className="text-[10.5px] font-bold text-slate-500 uppercase">
                      {language === 'mr' ? 'सबस्क्रिप्शन मुदत' : 'Subscription Validity'}
                    </span>
                    <p className="font-bold text-slate-900 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{language === 'mr' ? 'मुदत:' : 'Expiry:'} {formatDate(school.expiryDate || '')}</span>
                    </p>
                    <p className="text-slate-600">{school.subscriptionPlan || (language === 'mr' ? 'वार्षिक प्लॅन' : 'Annual Plan')}</p>
                    <p className="text-[11px] text-slate-400">{language === 'mr' ? 'शैक्षणिक वर्ष:' : 'Academic Year:'} {school.academicYear}</p>
                  </div>

                </div>

                {/* Footer Controls: Edit, Suspend/Activate, Delete */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">
                      {language === 'mr' ? 'नोंदणी दिनांक:' : 'Registered On:'} {formatDate(school.createdAt || '')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Toggle Active / Inactive */}
                    <button
                      type="button"
                      id={`btn-toggle-status-${school.id}`}
                      onClick={async () => {
                        try {
                          const targetStatus = isInactive ? 'active' : 'inactive';
                          await toggleSchoolStatus(school.id, targetStatus);
                          const schoolTitle = language === 'mr' ? (school.schoolNameLocal || school.schoolName) : (school.schoolName || school.schoolNameLocal);
                          setNotification(
                            targetStatus === 'inactive'
                              ? (language === 'mr' ? `शाळा "${schoolTitle}" निलंबित (Suspend / Inactive) केली आहे.` : `School "${schoolTitle}" suspended successfully.`)
                              : (language === 'mr' ? `शाळा "${schoolTitle}" पुन्हा सुरू (Active) केली आहे.` : `School "${schoolTitle}" activated successfully.`)
                          );
                          setTimeout(() => setNotification(null), 3500);
                        } catch (err: any) {
                          alert((language === 'mr' ? 'त्रुटी: ' : 'Error: ') + (err?.message || 'Status update failed'));
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        isInactive
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{isInactive ? (language === 'mr' ? 'शाळा सुरू करा (Activate)' : 'Activate School') : (language === 'mr' ? 'तात्पुरते बंद करा (Suspend)' : 'Suspend School')}</span>
                    </button>

                    {/* Edit Details */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(school)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer border border-slate-300"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                      <span>{language === 'mr' ? 'माहिती बदला' : 'Edit Details'}</span>
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      id={`btn-delete-school-${school.id}`}
                      onClick={() => handleDeleteSchool(school)}
                      className="p-2 text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg font-bold flex items-center justify-center transition cursor-pointer border border-rose-200 hover:border-rose-600 shadow-2xs"
                      title={language === 'mr' ? 'शाळा हटवा (Delete School)' : 'Delete School'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Pagination Bar for 1000+ Schools */}
      {filteredSchools.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold">
          <div className="text-slate-600 flex items-center gap-2">
            <span>
              {language === 'mr' 
                ? `एकूण ${filteredSchools.length} शाळांपैकी ${(currentPage - 1) * pageSize + 1} ते ${Math.min(currentPage * pageSize, filteredSchools.length)} शाळा दाखवत आहे`
                : `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, filteredSchools.length)} of ${filteredSchools.length} schools`}
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {language === 'mr' ? 'हाय-स्पीड लोडलेस मोड' : 'Turbo Scaled'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="text-slate-500">{language === 'mr' ? 'प्रति पान:' : 'Per page:'}</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={-1}>{language === 'mr' ? 'सर्व (All)' : 'All'}</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>{language === 'mr' ? 'मागील' : 'Prev'}</span>
            </button>

            <span className="px-2 py-1 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-lg font-bold font-mono">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <span>{language === 'mr' ? 'पुढील' : 'Next'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 5. Add / Edit School Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-8 overflow-hidden animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <SchoolIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {modalMode === 'add' 
                      ? (language === 'mr' ? '+ नवीन शाळा जोडा (Register New School)' : '+ Register New School') 
                      : (language === 'mr' ? 'शाळा माहिती बदला (Edit School)' : 'Edit School Details')}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {modalMode === 'add' 
                      ? (language === 'mr' ? 'शाळेचे नाव, UDISE आणि लॉगिन आयडी/पासवर्ड सेट करा.' : 'Set school name, UDISE, and login credentials.') 
                      : (language === 'mr' ? 'शाळेची माहिती व सबस्क्रिप्शन मुदत अपडेट करा.' : 'Update school profile and subscription period.')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* School Name Local (Marathi) */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-800 uppercase mb-1">
                    {language === 'mr' ? 'शाळेचे नाव (मराठीत - दाखल्यावर हेच छापले जाईल)' : 'School Name in Marathi (Printed on Certificates)'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.schoolNameLocal}
                    onChange={(e) => setFormData({ ...formData, schoolNameLocal: e.target.value })}
                    placeholder={language === 'mr' ? 'उदा. श्री शिवाजी हायस्कूल आणि कनिष्ठ महाविद्यालय, चिखली' : 'e.g. श्री शिवाजी हायस्कूल, चिखली'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>

                {/* School Name English */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-800 uppercase mb-1">
                    {language === 'mr' ? 'शाळेचे नाव (इंग्रजीत - School Name in English)' : 'School Name in English'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.schoolName}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                    placeholder="e.g. Shri Shivaji High School and Junior College, Chikhli"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>

                {/* U-DISE Number */}
                <div>
                  <label className="block font-bold text-slate-800 uppercase mb-1">
                    {language === 'mr' ? 'यु-डायस क्रमांक (U-DISE Number)' : 'U-DISE Number'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.udiseNumber}
                    onChange={(e) => setFormData({ ...formData, udiseNumber: e.target.value })}
                    placeholder="e.g. 27070200119"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>

                {/* Academic Year */}
                <div>
                  <label className="block font-bold text-slate-800 uppercase mb-1">
                    {language === 'mr' ? 'चालू शैक्षणिक वर्ष (Academic Year)' : 'Academic Year'}
                  </label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    placeholder="2026-2027"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>

                {/* Sanstha / Management */}
                <div>
                  <label className="block font-bold text-slate-800 uppercase mb-1">
                    {language === 'mr' ? 'संस्था / मंडळ (Managed By / Society Name)' : 'Society / Management Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.boardAffiliation}
                    onChange={(e) => setFormData({ ...formData, boardAffiliation: e.target.value })}
                    placeholder={language === 'mr' ? 'उदा. श्री शिवाजी शिक्षण संस्था, अमरावती संचलित' : 'e.g. Managed by Shri Shivaji Education Society'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>

                {/* Board Name */}
                <div>
                  <label className="block font-bold text-slate-800 uppercase mb-1">
                    {language === 'mr' ? 'बोर्ड / मंडळ (Board)' : 'Board Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.boardName}
                    onChange={(e) => setFormData({ ...formData, boardName: e.target.value })}
                    placeholder={language === 'mr' ? 'उदा. अमरावती / महाराष्ट्र राज्य मंडळ' : 'e.g. Maharashtra State Board / Amravati'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-800 uppercase mb-1">
                    {language === 'mr' ? 'शाळेचा पत्ता (Address - चिखली, जि. बुलढाणा)' : 'School Address (City, Dist., Pin)'}
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder={language === 'mr' ? 'उदा. मु. पो. चिखली, जि. बुलढाणा - ४४३२०१' : 'e.g. At Post Chikhli, Dist. Buldhana - 443201'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>

                {/* Recognition No */}
                <div>
                  <label className="block font-bold text-slate-800 uppercase mb-1">
                    {language === 'mr' ? 'शाळा मान्यता क्रमांक (Recognition No)' : 'Recognition Number'}
                  </label>
                  <input
                    type="text"
                    value={formData.recognitionNo}
                    onChange={(e) => setFormData({ ...formData, recognitionNo: e.target.value })}
                    placeholder="e.g. Kr. Va Di. Bu. Ji. Pa. / Secondary School..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>

                {/* Affiliation No */}
                <div>
                  <label className="block font-bold text-slate-800 uppercase mb-1">
                    {language === 'mr' ? 'संलग्नता क्रमांक (Affiliation No)' : 'Affiliation Number'}
                  </label>
                  <input
                    type="text"
                    value={formData.affiliationNo}
                    onChange={(e) => setFormData({ ...formData, affiliationNo: e.target.value })}
                    placeholder="e.g. 04.03.016"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-bold text-slate-800 uppercase mb-1">
                    {language === 'mr' ? 'संपर्क फोन (School Phone)' : 'School Contact Phone'}
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(07264)-242113"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>

                {/* Headmaster Name */}
                <div>
                  <label className="block font-bold text-slate-800 uppercase mb-1">
                    {language === 'mr' ? 'मुख्याध्यापक / प्राचार्य नाव' : 'Headmaster / Principal Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.headmasterName}
                    onChange={(e) => setFormData({ ...formData, headmasterName: e.target.value })}
                    placeholder={language === 'mr' ? 'मुख्याध्यापक / प्राचार्य' : 'Principal / Headmaster'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>

              </div>

              {/* Login Credentials Section */}
              <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-300 space-y-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-800" />
                  <h4 className="font-black text-amber-950 uppercase tracking-wider text-xs">
                    {language === 'mr' ? 'शाळेसाठी १ लॉगिन आयडी व पासवर्ड (School Login Account)' : 'School Login Account (Single Credentials)'}
                  </h4>
                </div>
                <p className="text-[11px] text-amber-900">
                  {language === 'mr' 
                    ? 'हा ईमेल आणि पासवर्ड शाळेच्या मुख्याध्यापक किंवा ऑपरेटरला द्या. ते याने थेट त्यांच्या शाळेत लॉगिन करतील.' 
                    : 'Provide this Email and Password to the school headmaster or operator to log in directly.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-amber-950 uppercase mb-1">
                      {language === 'mr' ? 'शाळेचा लॉगिन ईमेल (Login Email)' : 'School Login Email'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. shivajischool.chikhli@gmail.com"
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-amber-950 uppercase mb-1">
                      {language === 'mr' ? 'लॉगिन पासवर्ड (Password)' : 'Login Password'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="e.g. Shala@123"
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Subscription Validity Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-700" />
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                    {language === 'mr' ? 'सबस्क्रिप्शन व खाते स्थिती (Subscription & Status)' : 'Subscription & Status'}
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      {language === 'mr' ? 'सबस्क्रिप्शन मुदत (Expiry Date)' : 'Expiry Date'}
                    </label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      {language === 'mr' ? 'प्लॅन नाव' : 'Plan Name'}
                    </label>
                    <input
                      type="text"
                      value={formData.subscriptionPlan}
                      onChange={(e) => setFormData({ ...formData, subscriptionPlan: e.target.value })}
                      placeholder={language === 'mr' ? 'वार्षिक सबस्क्रिप्शन' : 'Annual Subscription'}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      {language === 'mr' ? 'शाळा स्थिती (Status)' : 'Status'}
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                    >
                      <option value="active">{language === 'mr' ? '🟢 सक्रिय (Active)' : '🟢 Active'}</option>
                      <option value="inactive">{language === 'mr' ? '🔴 बंद / निलंबित (Inactive)' : '🔴 Inactive / Suspended'}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  {language === 'mr' ? 'रद्द करा (Cancel)' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {modalMode === 'add' 
                      ? (language === 'mr' ? 'शाळा नोंदणी जतन करा' : 'Save New School') 
                      : (language === 'mr' ? 'बदल जतन करा' : 'Save Changes')}
                  </span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* SUPER ADMIN CHANGE PASSWORD MODAL */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative space-y-5 animate-in fade-in-50">
            
            <button
              type="button"
              onClick={() => setIsChangePasswordOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{language === 'mr' ? 'सुपर ॲडमिन पासवर्ड बदला' : 'Change Super Admin Password'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language === 'mr' ? 'प्लॅटफॉर्म मालक खात्याचा लॉगिन पासवर्ड सुरक्षितपणे बदला' : 'Update the master password for the platform owner account'}
                </p>
              </div>
            </div>

            {changePassError && (
              <div className="p-3 bg-red-950/80 border border-red-500/60 rounded-xl text-xs text-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{changePassError}</span>
              </div>
            )}

            {changePassSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{changePassSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangeSuperAdminPassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {language === 'mr' ? 'चालू पासवर्ड किंवा सुरक्षा पिन' : 'Current Password or PIN'} <span className="text-amber-400">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Default PIN: 8788</span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={currentOrPin}
                    onChange={(e) => setCurrentOrPin(e.target.value)}
                    placeholder={language === 'mr' ? 'चालू पासवर्ड किंवा 8788' : 'Current password or 8788'}
                    className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-amber-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  {language === 'mr' ? 'नवीन पासवर्ड' : 'New Password'} <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassText ? 'text' : 'password'}
                    required
                    value={newSuperAdminPass}
                    onChange={(e) => setNewSuperAdminPass(e.target.value)}
                    placeholder={language === 'mr' ? 'नवीन गुप्त पासवर्ड टाका' : 'Enter strong new password'}
                    className="w-full pl-10 pr-10 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-amber-500 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassText(!showPassText)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassText ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  {language === 'mr' ? 'नवीन पासवर्ड कन्फर्म करा' : 'Confirm New Password'} <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassText ? 'text' : 'password'}
                    required
                    value={confirmSuperAdminPass}
                    onChange={(e) => setConfirmSuperAdminPass(e.target.value)}
                    placeholder={language === 'mr' ? 'तोच नवीन पासवर्ड पुन्हा टाका' : 'Re-enter new password'}
                    className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-amber-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {language === 'mr' ? 'रद्द करा (Cancel)' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={changePassLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-950/40 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {changePassLoading
                      ? (language === 'mr' ? 'बदलत आहे...' : 'Updating...')
                      : (language === 'mr' ? 'नवीन पासवर्ड सेव्ह करा' : 'Save Password')}
                  </span>
                </button>
              </div>
            </form>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p className="font-bold text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{language === 'mr' ? 'महत्त्वाची नोंद:' : 'Important Note:'}</span>
              </p>
              <p>
                {language === 'mr' 
                  ? 'हा पासवर्ड फक्त सुपर ॲडमिनसाठी (प्लॅटफॉर्म मालक) लागू होईल. शाळांचे स्वतःचे पासवर्ड सुरक्षित व वेगळे राहतील.' 
                  : 'This password is only for the Super Admin / Platform Owner account. Schools maintain their own credentials.'}
              </p>
            </div>

          </div>
        </div>
      )}

      {/* DELETE SCHOOL CONFIRMATION MODAL */}
      {schoolToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative">
            
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setSchoolToDelete(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'mr' ? 'शाळा कायमची हटवायची आहे का?' : 'Delete School Permanently?'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'mr' ? 'हा बदल पूर्ववत करता येणार नाही.' : 'This action cannot be undone.'}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5">
              <p className="text-sm font-bold text-rose-950">
                🏫 {schoolToDelete.schoolNameLocal || schoolToDelete.schoolName}
              </p>
              <p className="text-xs text-rose-700 font-mono font-medium">
                UDISE: {schoolToDelete.udiseNumber} • {schoolToDelete.email}
              </p>
              <p className="text-xs text-rose-800 pt-1 border-t border-rose-200/80">
                {language === 'mr' 
                  ? 'या शाळेचे सर्व लॉगिन पासवर्ड, नोंदणी व प्रवेश पोर्टल कायमचे काढून टाकले जाईल.' 
                  : 'All login credentials, records, and access for this school will be permanently removed.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setSchoolToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                {language === 'mr' ? 'रद्द करा (Cancel)' : 'Cancel'}
              </button>
              <button
                type="button"
                id="btn-confirm-delete-school"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {isDeleting
                    ? (language === 'mr' ? 'हटवत आहे...' : 'Deleting...')
                    : (language === 'mr' ? 'होय, शाळा हटवा' : 'Yes, Delete School')}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* BULK IMPORT MODAL FOR 1000+ SCHOOLS */}
      <SchoolBulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImportSchools={bulkAddSchools}
      />

      {/* RESET BULK SCHOOLS MODAL */}
      {isResetBulkModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in-50"
          onClick={() => {
            if (!isResetting) setIsResetBulkModalOpen(false);
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {language === 'mr' ? 'बल्क शाळा रिसेट / डेटाबेस क्लीनअप' : 'Reset Bulk Imported Schools'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'mr' ? 'अतिरिक्त किंवा चुकून जोडलेल्या शाळा काढून टाका' : 'Remove bulk uploaded schools safely'}
                  </p>
                </div>
              </div>
              {!isResetting && (
                <button
                  type="button"
                  onClick={() => setIsResetBulkModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Modal Body */}
            {importedSchoolsCount === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold text-slate-800">
                  {language === 'mr' 
                    ? 'सध्या कोणतीही अतिरिक्त किंवा बल्क आयात केलेली शाळा नाही!' 
                    : 'No bulk imported schools to remove!'}
                </p>
                <p className="text-xs text-slate-500">
                  {language === 'mr'
                    ? 'तुमची सिस्टीम आधीपासूनच डीफॉल्ट मूळ स्थितीत स्वच्छ आहे.'
                    : 'All schools are already at their default initial state.'}
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetBulkModalOpen(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    {language === 'mr' ? 'ठीक आहे' : 'Close'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>
                      {language === 'mr'
                        ? `एकूण ${importedSchoolsCount} आयात केलेल्या शाळा हटवल्या जातील`
                        : `Total ${importedSchoolsCount} imported schools will be removed`}
                    </span>
                  </div>
                  <p className="text-xs text-rose-700 leading-relaxed">
                    {language === 'mr'
                      ? 'तुम्ही एक्सेलद्वारे किंवा बल्क इम्पोर्टद्वारे जोडलेल्या सर्व अतिरिक्त शाळा क्लाऊड डेटाबेस (Firestore), IndexedDB कॅशे आणि स्थानिक मेमरीमधून कायमच्या काढून टाकल्या जातील.'
                      : 'All bulk-imported schools will be permanently deleted from Firestore cloud database, IndexedDB cache, and local memory.'}
                  </p>
                </div>

                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>{language === 'mr' ? 'मूळ शाळा १००% सुरक्षित राहील:' : 'Default School is Safe:'}</span>
                  </p>
                  <p className="text-xs text-emerald-800 font-medium pl-5">
                    {language === 'mr'
                      ? 'श्री शिवाजी हायस्कूल आणि कनिष्ठ महाविद्यालय, चिखली (UDISE: 27040200119) ही मूळ शाळा सुरक्षित राहील, ती हटवली जाणार नाही.'
                      : 'Shree Shivaji High School, Chikhli (UDISE: 27040200119) will remain completely intact.'}
                  </p>
                </div>

                {/* Progress bar if actively deleting */}
                {isResetting && (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 animate-in fade-in-50">
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                        {language === 'mr' ? 'शाळा डेटाबेसमधून साफ करत आहे...' : 'Resetting schools from database...'}
                      </span>
                      <span>
                        {resetProgress.done} / {resetProgress.total || importedSchoolsCount}
                      </span>
                    </div>
                    <div className="w-full bg-indigo-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min(100, Math.round((resetProgress.done / (resetProgress.total || importedSchoolsCount || 1)) * 100))}%` 
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={() => setIsResetBulkModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    {language === 'mr' ? 'रद्द करा (Cancel)' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    id="btn-confirm-reset-bulk-schools"
                    disabled={isResetting}
                    onClick={handleConfirmResetBulk}
                    className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isResetting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{language === 'mr' ? 'रिसेट करत आहे...' : 'Resetting...'}</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>
                          {language === 'mr' 
                            ? `होय, सर्व ${importedSchoolsCount} बल्क शाळा हटवा` 
                            : `Yes, Delete All ${importedSchoolsCount} Bulk Schools`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
