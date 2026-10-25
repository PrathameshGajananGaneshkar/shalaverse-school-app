import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  GraduationCap, 
  FileText, 
  Award, 
  Scroll, 
  Download, 
  ArrowRight,
  School,
  TrendingUp,
  Clock,
  Search,
  Building,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  Crown
} from 'lucide-react';
import { Student } from '../types';
import { studentService } from '../services/studentService';
import { documentService } from '../services/documentService';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { useSchool } from '../context/SchoolContext';
import { StatCard } from '../components/common/StatCard';
import { StudentTable } from '../components/students/StudentTable';
import { StudentViewModal } from '../components/students/StudentViewModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { exportStudentsToCSV } from '../utils/exportUtils';
import { CLASS_OPTIONS } from '../components/students/StudentFilter';
import { getStudentGender } from '../utils/genderUtils';
import { cleanEnglishText } from '../utils/devanagariUtils';

export function Dashboard() {
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const { currentSchool, allSchools, selectSchool, isSuperAdmin } = useSchool();
  const navigate = useNavigate();

  const [dashSchoolDropdown, setDashSchoolDropdown] = useState(false);

  // Active School resolution: prefer currentSchool, else find in allSchools by saved active id or first in list
  const activeSchool = currentSchool || (
    allSchools.find(s => s.id === (typeof window !== 'undefined' ? localStorage.getItem('shalaverse_active_school_id') : '')) ||
    (allSchools.length > 0 ? allSchools[0] : {
      id: 'school_27070200119',
      schoolName: settings.schoolName,
      schoolNameLocal: settings.schoolNameLocal || settings.schoolName,
      udiseNumber: settings.udiseNumber,
      boardAffiliation: settings.boardAffiliation,
      recognitionNo: settings.recognitionNo,
      affiliationNo: settings.affiliationNo,
      boardName: settings.boardName,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      academicYear: settings.academicYear || '2026-2027',
      headmasterName: settings.headmasterName,
      status: 'active' as const
    })
  );

  const isEn = language === 'en';

  const schoolName = isEn
    ? (activeSchool.schoolName || activeSchool.schoolNameLocal || 'School')
    : (activeSchool.schoolNameLocal || activeSchool.schoolName || 'शाळा');

  // Strict rule: If English is selected, NEVER show Marathi secondary subtitle under the logo/title!
  const schoolNameSecondary = !isEn && activeSchool.schoolName && activeSchool.schoolName !== schoolName
    ? activeSchool.schoolName
    : '';

  const udiseNumber = activeSchool.udiseNumber || '-';
  
  const boardAffiliation = isEn
    ? (activeSchool.boardName || (activeSchool.boardAffiliation ? cleanEnglishText(activeSchool.boardAffiliation) : 'Maharashtra State Board'))
    : (activeSchool.boardAffiliation || activeSchool.boardName || 'महाराष्ट्र राज्य माध्यमिक व उच्च माध्यमिक शिक्षण मंडळ');

  const schoolAddress = isEn
    ? (activeSchool.address ? cleanEnglishText(activeSchool.address) : 'Address not registered')
    : (activeSchool.address || 'पत्ता नोंदणीकृत नाही');

  const schoolPhone = activeSchool.phone || '';
  const schoolEmail = activeSchool.email || '';
  
  const headmasterName = isEn
    ? (activeSchool.headmasterName && !/[\u0900-\u097F]/.test(activeSchool.headmasterName)
        ? activeSchool.headmasterName
        : 'Headmaster / Principal')
    : (activeSchool.headmasterName || 'मुख्याध्यापक / प्राचार्य');

  const currentAcademicYear = activeSchool.academicYear || '2026-2027';

  const initialCachedStudents = useMemo(() => {
    return studentService.getSynchronousCachedStudents(currentSchool?.id) || [];
  }, [currentSchool?.id]);

  const initialCachedLogs = useMemo(() => {
    return documentService.getSynchronousDocumentLogs(currentSchool?.id) || [];
  }, [currentSchool?.id]);

  const [students, setStudents] = useState<Student[]>(() => initialCachedStudents);
  const [loading, setLoading] = useState<boolean>(() => initialCachedStudents.length === 0);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [docLogsCount, setDocLogsCount] = useState<number>(() => initialCachedLogs.length);

  const loadData = useCallback(async () => {
    if (students.length === 0) {
      setLoading(true);
    }
    try {
      const activeId = currentSchool?.id;
      const [data, logs] = await Promise.all([
        studentService.getAllStudents(activeId),
        documentService.getDocumentLogs(activeId)
      ]);
      setStudents(data);

      if (!data || data.length === 0) {
        setDocLogsCount(0);
      } else {
        const studentKeySet = new Set<string>();
        for (let i = 0; i < data.length; i++) {
          const s = data[i];
          if (s.id) studentKeySet.add(s.id);
          if (s.studentId) studentKeySet.add(s.studentId);
          if (s.grNumber) studentKeySet.add(String(s.grNumber).trim());
        }
        const validLogs = (logs || []).filter(l => 
          (l.studentId && studentKeySet.has(l.studentId)) ||
          (l.grNumber && studentKeySet.has(String(l.grNumber).trim()))
        );
        setDocLogsCount(validLogs.length);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentSchool?.id]);

  useEffect(() => {
    loadData();
  }, [loadData, currentSchool?.id]);

  // Compute metrics
  const totalStudents = students.length;
  const currentYearStudents = useMemo(() => {
    let count = 0;
    for (let i = 0; i < students.length; i++) {
      if (students[i].admissionYear === currentAcademicYear) count++;
    }
    return count;
  }, [students, currentAcademicYear]);
  
  // Fast Class strength distribution with separate boys & girls
  const dashboardStats = useMemo(() => {
    let boys = 0;
    let girls = 0;
    const classBreakdown: Record<string, { total: number; boys: number; girls: number }> = {};
    for (let i = 0; i < CLASS_OPTIONS.length; i++) {
      classBreakdown[CLASS_OPTIONS[i]] = { total: 0, boys: 0, girls: 0 };
    }
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const isGirl = s.gender === 'Female' || s.genderLocal === 'मुलगी' || s.gender === 'मुलगी';
      if (isGirl) girls++;
      else boys++;
      const cls = s.admissionClass || '5th';
      if (!classBreakdown[cls]) {
        classBreakdown[cls] = { total: 0, boys: 0, girls: 0 };
      }
      classBreakdown[cls].total++;
      if (isGirl) classBreakdown[cls].girls++;
      else classBreakdown[cls].boys++;
    }
    return { boys, girls, classBreakdown };
  }, [students]);

  const classCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CLASS_OPTIONS.forEach(c => {
      counts[c] = dashboardStats.classBreakdown[c]?.total || 0;
    });
    return counts;
  }, [dashboardStats]);

  // Recent 5 admissions
  const recentStudents = [...students].slice(0, 5);

  const handleView = (student: Student) => {
    setSelectedStudent(student);
    setIsViewOpen(true);
  };

  const handleEdit = (student: Student) => {
    navigate(`/edit-student/${student.id || student.studentId}`);
  };

  const handleDeletePrompt = (student: Student) => {
    setStudentToDelete(student);
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete || !studentToDelete.id) return;
    setIsDeleting(true);
    try {
      await studentService.deleteStudent(studentToDelete.id, studentToDelete.grNumber);
      const remaining = students.filter(s => s.id !== studentToDelete.id);
      setStudents(remaining);
      if (remaining.length === 0) {
        setDocLogsCount(0);
        await documentService.deleteAllDocumentLogs();
      } else {
        const updatedLogs = await documentService.getDocumentLogs();
        const validLogs = (updatedLogs || []).filter(l => 
          remaining.some(s => s.id === l.studentId || s.studentId === l.studentId || (s.grNumber && s.grNumber === l.grNumber))
        );
        setDocLogsCount(validLogs.length);
      }
      setStudentToDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label={t('loading')} size="lg" />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* School Office Greeting Banner with Complete School Profile */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-slate-800 relative overflow-hidden">
        {/* Background watermark */}
        <div className="absolute -right-8 -bottom-10 opacity-10 pointer-events-none">
          <GraduationCap className="w-56 h-56 text-white" />
        </div>

        <div className="relative z-10 space-y-4">
          {/* Top Bar with School Status and Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold">
                <School className="w-3.5 h-3.5" />
                <span>{language === 'mr' ? 'अधिकृत शाळा डॅशबोर्ड' : 'Official School Dashboard'}</span>
              </span>

              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                activeSchool.status === 'active' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {activeSchool.status === 'active' 
                  ? (language === 'mr' ? '🟢 सक्रिय (Active)' : '🟢 Active') 
                  : (language === 'mr' ? '🔴 बंद (Inactive)' : '🔴 Inactive')}
              </span>
            </div>

            {/* School Switcher for Super Admin or Testing */}
            {isSuperAdmin && allSchools.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  id="btn-dash-switch-school"
                  onClick={() => setDashSchoolDropdown(!dashSchoolDropdown)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black transition cursor-pointer shadow-sm"
                >
                  <Building className="w-3.5 h-3.5 text-slate-950" />
                  <span>{language === 'mr' ? 'शाळा बदला' : 'Switch School'}</span>
                  <ChevronDown className="w-3 h-3 text-slate-950" />
                </button>

                {dashSchoolDropdown && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in-50 text-slate-900">
                    <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                      <span>{language === 'mr' ? 'शाळा निवडा' : 'Select School'} ({allSchools.length})</span>
                      <button
                        type="button"
                        onClick={() => {
                          setDashSchoolDropdown(false);
                          navigate('/super-admin');
                        }}
                        className="text-indigo-600 hover:underline text-[11px]"
                      >
                        {language === 'mr' ? '+ व्यवस्थापन' : '+ Manage'}
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {allSchools.map((sch) => {
                        const isSel = activeSchool.id === sch.id;
                        return (
                          <button
                            key={sch.id}
                            type="button"
                            onClick={() => {
                              selectSchool(sch.id);
                              setDashSchoolDropdown(false);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between transition cursor-pointer ${
                              isSel ? 'bg-indigo-50 font-black text-indigo-950 border-l-4 border-indigo-600' : 'hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <p className="truncate font-bold">
                                {language === 'mr' ? (sch.schoolNameLocal || sch.schoolName) : (sch.schoolName || sch.schoolNameLocal)}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono">UDISE: {sch.udiseNumber}</p>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black shrink-0 ${sch.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {sch.status === 'active' ? 'Active' : 'Off'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* School Title Section */}
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
              {schoolName}
            </h2>
            {schoolNameSecondary && (
              <p className="text-sm sm:text-base text-blue-200/90 font-medium tracking-wide">
                {schoolNameSecondary}
              </p>
            )}
          </div>

          {/* School Details Pills Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2 text-xs">
            {/* UDISE & Affiliation */}
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10 space-y-1">
              <div className="flex items-center gap-1.5 text-blue-300 font-bold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{language === 'mr' ? 'शाळा ओळख व मंडळ' : 'Identification & Board'}</span>
              </div>
              <p className="font-mono font-black text-white text-sm">
                UDISE: <span className="text-amber-300">{udiseNumber}</span>
              </p>
              <p className="text-slate-300 text-[11px] truncate">
                {boardAffiliation}
              </p>
            </div>

            {/* Address & Headmaster */}
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10 space-y-1">
              <div className="flex items-center gap-1.5 text-blue-300 font-bold text-[11px]">
                <MapPin className="w-3.5 h-3.5" />
                <span>{language === 'mr' ? 'पत्ता व मुख्याध्यापक' : 'Address & Headmaster'}</span>
              </div>
              <p className="text-white text-xs truncate">
                {schoolAddress || (language === 'mr' ? 'पत्ता नोंदणीकृत नाही' : 'Address not set')}
              </p>
              <p className="text-slate-300 text-[11px] truncate flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{headmasterName}</span>
              </p>
            </div>

            {/* Academic Year & Contact */}
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10 space-y-1">
              <div className="flex items-center gap-1.5 text-blue-300 font-bold text-[11px]">
                <Clock className="w-3.5 h-3.5" />
                <span>{language === 'mr' ? 'शैक्षणिक वर्ष व संपर्क' : 'Academic Year & Contact'}</span>
              </div>
              <p className="font-bold text-white text-xs">
                {language === 'mr' ? 'शै. वर्ष: ' : 'Year: '}<span className="text-blue-300 font-mono">{currentAcademicYear}</span>
              </p>
              <p className="text-slate-300 text-[11px] truncate font-mono">
                {schoolPhone ? `📞 ${schoolPhone}` : ''} {schoolEmail ? `• ✉️ ${schoolEmail}` : ''}
              </p>
            </div>
          </div>

          {/* Quick Action Button Group */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                id="btn-dash-add-student"
                type="button"
                onClick={() => navigate('/add-student')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md flex items-center gap-2 transition cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t('addStudent')}</span>
              </button>

              <button
                id="btn-dash-export-csv"
                type="button"
                onClick={() => exportStudentsToCSV(students)}
                className="px-4 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white text-xs sm:text-sm font-semibold rounded-xl border border-slate-700 flex items-center gap-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{t('exportExcel')}</span>
              </button>
            </div>

            {isSuperAdmin && (
              <button
                type="button"
                id="btn-dash-back-to-superadmin"
                onClick={() => navigate('/super-admin')}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Crown className="w-3.5 h-3.5 text-slate-950" />
                <span>{language === 'mr' ? '👑 सर्व शाळा यादीकडे जा' : '👑 Back to Super Admin'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Core Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title={t('totalStudents')}
          value={totalStudents}
          subtitle={language === 'mr' ? `👦 मुले: ${dashboardStats.boys} • 👧 मुली: ${dashboardStats.girls}` : `👦 Boys: ${dashboardStats.boys} • 👧 Girls: ${dashboardStats.girls}`}
          icon={<Users className="w-6 h-6" />}
          color="blue"
          onClick={() => navigate('/students')}
        />
        <StatCard
          title={t('currentYearStudents')}
          value={currentYearStudents}
          subtitle={language === 'mr' ? `चालू वर्ष ${currentAcademicYear} चे प्रवेश` : `Enrolled for ${currentAcademicYear}`}
          icon={<GraduationCap className="w-6 h-6" />}
          color="emerald"
        />
        <StatCard
          title={language === 'mr' ? 'वितरित केलेले दाखले' : 'Documents Issued'}
          value={docLogsCount}
          subtitle={language === 'mr' ? 'T.C., बोनाफाईड व निर्गम उतारे' : 'T.C. & Bonafide Issued'}
          icon={<FileText className="w-6 h-6" />}
          color="purple"
          onClick={() => navigate('/documents?filter=issued')}
        />
        <StatCard
          title={t('activeClasses')}
          value={Object.keys(classCounts).length}
          subtitle={language === 'mr' ? 'वर्गनिहाय पटसंख्या अहवाल' : 'Class Strength Reports'}
          icon={<School className="w-6 h-6" />}
          color="amber"
          onClick={() => navigate('/reports')}
        />
      </div>

      {/* Quick Document Generation Hub Cards */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-700" />
              <span>{language === 'mr' ? 'अधिकृत दाखले व प्रमाणपत्र केंद्र' : 'Official Document Generation Hub'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'mr' 
                ? 'कोणत्याही विद्यार्थ्याचा दाखला तत्काळ तयार करा, तपासा व प्रिंट करा' 
                : 'Instantly generate, fill, preview and print verified certificates for any student'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/documents')}
            className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>{language === 'mr' ? 'सर्व दाखले पहा' : 'View All Documents'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Transfer Certificate */}
          <div 
            onClick={() => navigate('/documents/tc')}
            className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-lg bg-blue-600 text-white shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700">
                  {language === 'mr' ? 'शाळा सोडल्याचा दाखला (T.C.)' : 'Transfer Certificate (T.C.)'}
                </h4>
                <p className="text-[11px] text-slate-500">{language === 'mr' ? 'School Leaving Certificate' : 'शाळा सोडल्याचा दाखला'}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
              {language === 'mr'
                ? 'जन्मदिनांक अक्षरी, वर्तणूक, अभ्यास प्रगती व स्वाक्षरीसह अधिकृत १६ मुद्द्यांचे प्रमाणपत्र.'
                : 'Standard 16-point official format with birth date in words, conduct, progress, and signatures.'}
            </p>
          </div>

          {/* Card 2: Bonafide Certificate */}
          <div 
            onClick={() => navigate('/documents/bonafide')}
            className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-lg bg-emerald-600 text-white shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700">
                  {language === 'mr' ? 'बोनाफाईड प्रमाणपत्र' : 'Bonafide Certificate'}
                </h4>
                <p className="text-[11px] text-slate-500">{language === 'mr' ? 'Bonafide Certificate' : 'बोनाफाईड प्रमाणपत्र'}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
              {language === 'mr'
                ? 'विद्यार्थी फोटो साक्षांकन चौकट व उद्देश नोंदीसह अधिकृत बोनाफाईड दाखला.'
                : 'Official bonafide certification with student photo attestation box and purpose statement.'}
            </p>
          </div>

          {/* Card 3: Nirgam Utara */}
          <div 
            onClick={() => navigate('/documents/nirgam-utara')}
            className="p-4 rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-50 hover:border-purple-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-lg bg-purple-600 text-white shadow-xs">
                <Scroll className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-700">
                  {language === 'mr' ? 'निर्गम उतारा (जनरल रजिस्टर)' : 'Nirgam Utara (GR Extract)'}
                </h4>
                <p className="text-[11px] text-slate-500">{language === 'mr' ? 'General Register Extract' : 'जनरल रजिस्टर उतारा'}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
              {language === 'mr'
                ? 'शाळेच्या मूळ जनरल रजिस्टरमधील २० अधिकृत रकान्यांची कायदेशीर सत्यप्रत.'
                : 'True copy legal extract of the 20 official columns from the school General Register volume.'}
            </p>
          </div>
        </div>
      </div>

      {/* Class Strength Quick Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {t('studentsByClass')} ({language === 'mr' ? 'पटसंख्या सारांश' : 'Strength Overview'})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'mr' 
                ? `एकूण शालेय पटसंख्या: ${totalStudents} (👦 मुले: ${dashboardStats.boys} | 👧 मुली: ${dashboardStats.girls})` 
                : `Total School Strength: ${totalStudents} (👦 Boys: ${dashboardStats.boys} | 👧 Girls: ${dashboardStats.girls})`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>{language === 'mr' ? 'सविस्तर वर्गनिहाय अहवाल पहा' : 'View Class Strength Report'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-12 gap-2 sm:gap-2.5">
          {CLASS_OPTIONS.map((cls) => {
            const data = dashboardStats.classBreakdown[cls] || { total: 0, boys: 0, girls: 0 };
            return (
              <div
                key={cls}
                onClick={() => navigate(`/students?class=${cls}`)}
                className="bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg p-2.5 text-center transition cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-600 block">
                  {language === 'mr' ? `इयत्ता ${cls}` : `Class ${cls}`}
                </span>
                <span className="text-xl font-extrabold text-blue-900 block mt-1 font-mono">{data.total}</span>
                <div className="flex items-center justify-center gap-1.5 text-[10px] mt-1 font-semibold">
                  <span className="text-blue-700">👦 {data.boys}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-pink-700">👧 {data.girls}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Admissions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {language === 'mr' ? 'नुकतीच झालेली विद्यार्थी नोंदणी' : 'Recent General Register Entries'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'mr' ? 'जनरल रजिस्टरमधील नवीनतम नोंदी' : 'Latest students recorded in the register'}
            </p>
          </div>
          <button
            type="button"
            id="btn-dash-view-all-students"
            onClick={() => navigate('/students')}
            className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>{t('studentMaster')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {students.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 mx-auto flex items-center justify-center">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900">
                {language === 'mr' ? `"${schoolName}" मध्ये अद्याप विद्यार्थी नोंदणी झालेली नाही` : `No students registered yet for "${schoolName}"`}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                {language === 'mr' 
                  ? 'या शाळेसाठी जनरल रजिस्टर सुरू करण्यासाठी नवीन विद्यार्थी जोडा किंवा एक्सेल फाईल इम्पोर्ट करा.' 
                  : 'Start the register by adding a student or importing an Excel file.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => navigate('/add-student')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>{language === 'mr' ? '+ या शाळेत पहिला विद्यार्थी जोडा' : '+ Add First Student'}</span>
              </button>
            </div>
          </div>
        ) : (
          <StudentTable
            students={recentStudents}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDeletePrompt}
            onAddNew={() => navigate('/add-student')}
          />
        )}
      </div>

      {/* View Modal */}
      <StudentViewModal
        student={selectedStudent}
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        onEdit={handleEdit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
