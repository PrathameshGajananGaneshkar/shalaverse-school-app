import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  FileText, 
  GraduationCap, 
  Scroll, 
  Printer, 
  History,
  FileCheck2,
  Languages,
  Edit3,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  Search,
  X,
  Check,
  Users
} from 'lucide-react';
import { Student, DocumentLog } from '../types';
import { studentService } from '../services/studentService';
import { documentService } from '../services/documentService';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { TransferCertificate } from '../components/documents/TransferCertificate';
import { BonafideCertificate } from '../components/documents/BonafideCertificate';
import { NirgamUtara } from '../components/documents/NirgamUtara';
import { DocumentPreviewCanvas } from '../components/documents/DocumentPreviewCanvas';
import { CertificateEditModal, CustomDocFields } from '../components/documents/CertificateEditModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatDate } from '../utils/dateUtils';
import { printCertificateElement } from '../utils/exportUtils';

type DocTab = 'tc' | 'bonafide' | 'nirgam-utara';
type DocLang = 'mr' | 'en';

// Helper to determine if a student has had a document (TC, Bonafide, Nirgam) issued
export const isStudentIssued = (student: Student, logs: DocumentLog[]): boolean => {
  if (!student) return false;
  const hasLog = logs.some(l => 
    (l.studentId && (l.studentId === student.id || l.studentId === student.studentId)) ||
    (l.grNumber && student.grNumber && String(l.grNumber).trim() === String(student.grNumber).trim())
  );
  if (hasLog) return true;
  if (student.certificateDate && String(student.certificateDate).trim().length > 0) return true;
  if (student.leavingReason && String(student.leavingReason).trim().length > 0) return true;
  return false;
};

// Helper to get which types of documents were issued for a student
export const getIssuedTypesForStudent = (student: Student, logs: DocumentLog[]): string[] => {
  if (!student) return [];
  const set = new Set<string>();
  logs.forEach(l => {
    if (
      (l.studentId && (l.studentId === student.id || l.studentId === student.studentId)) ||
      (l.grNumber && student.grNumber && String(l.grNumber).trim() === String(student.grNumber).trim())
    ) {
      if (l.documentType) set.add(l.documentType);
    }
  });
  if (student.certificateDate || student.leavingReason) {
    set.add('TC');
  }
  return Array.from(set);
};

export function Documents() {
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: Determine from route pathname (/documents/bonafide, /documents/tc, /documents/nirgam-utara) or query param (?type=bonafide)
  const getActiveTab = (): DocTab => {
    const path = location.pathname.toLowerCase();
    if (path.includes('bonafide')) return 'bonafide';
    if (path.includes('nirgam')) return 'nirgam-utara';
    if (path.includes('tc')) return 'tc';

    const typeParam = searchParams.get('type') as DocTab;
    if (typeParam === 'bonafide' || typeParam === 'nirgam-utara' || typeParam === 'tc') {
      return typeParam;
    }
    return 'tc';
  };

  const currentTab = getActiveTab();
  const paramStudentId = searchParams.get('studentId') || '';

  // Document language state: default to Marathi or current app language
  const [docLang, setDocLang] = useState<DocLang>(() => {
    if (language === 'mr' || language === 'en') return language;
    return 'mr';
  });

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(paramStudentId);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  // Customization fields
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [serialNumber, setSerialNumber] = useState('2026/108');
  const [bonafidePurpose, setBonafidePurpose] = useState('');
  const [leavingReason, setLeavingReason] = useState('');
  const [conduct, setConduct] = useState('');
  const [progress, setProgress] = useState('');
  const [applicantName, setApplicantName] = useState('');

  // Live Edit Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Logs
  const [documentLogs, setDocumentLogs] = useState<DocumentLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  // Student filter and search state
  const [filterMode, setFilterMode] = useState<'issued' | 'all'>(() => {
    const f = searchParams.get('filter');
    if (f === 'all') return 'all';
    return 'issued';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [logSearchTerm, setLogSearchTerm] = useState('');

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#dropdown-doc-students-container')) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [studentList, logs] = await Promise.all([
          studentService.getAllStudents(),
          documentService.getDocumentLogs()
        ]);
        setStudents(studentList);
        let validLogs: DocumentLog[] = [];
        if (studentList.length === 0) {
          setDocumentLogs([]);
          if (logs.length > 0) {
            documentService.deleteAllDocumentLogs().catch(() => {});
          }
        } else {
          validLogs = (logs || []).filter(l => 
            studentList.some(s => s.id === l.studentId || s.studentId === l.studentId || (s.grNumber && s.grNumber === l.grNumber))
          );
          setDocumentLogs(validLogs);
        }

        // Issued students
        const issued = studentList.filter(s => isStudentIssued(s, validLogs));

        // Pre-select student
        if (paramStudentId) {
          const match = studentList.find(s => s.id === paramStudentId || s.studentId === paramStudentId || s.grNumber === paramStudentId);
          if (match) {
            setSelectedStudent(match);
            setSelectedStudentId(match.id || match.studentId);
            if (match.leavingReason) setLeavingReason(match.leavingReason);
            if (match.behaviour) setConduct(match.behaviour);
            if (match.academicProgress) setProgress(match.academicProgress);
            // If the requested student is not in the issued list, switch to 'all' so they are displayed
            if (!isStudentIssued(match, validLogs)) {
              setFilterMode('all');
            }
          }
        } else if (filterMode === 'issued' && issued.length > 0) {
          setSelectedStudent(issued[0]);
          setSelectedStudentId(issued[0].id || issued[0].studentId);
          if (issued[0].leavingReason) setLeavingReason(issued[0].leavingReason);
          if (issued[0].behaviour) setConduct(issued[0].behaviour);
          if (issued[0].academicProgress) setProgress(issued[0].academicProgress);
        } else if (studentList.length > 0) {
          setSelectedStudent(studentList[0]);
          setSelectedStudentId(studentList[0].id || studentList[0].studentId);
          if (studentList[0].leavingReason) setLeavingReason(studentList[0].leavingReason);
          if (studentList[0].behaviour) setConduct(studentList[0].behaviour);
          if (studentList[0].academicProgress) setProgress(studentList[0].academicProgress);
        }
      } catch (err) {
        console.error('Error fetching document data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [paramStudentId]);

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    const match = students.find(s => s.id === id || s.studentId === id || s.grNumber === id);
    if (match) {
      setSelectedStudent(match);
      if (match.leavingReason) setLeavingReason(match.leavingReason);
      if (match.behaviour) setConduct(match.behaviour);
      if (match.academicProgress) setProgress(match.academicProgress);
    }
  };

  const handleFilterModeChange = (mode: 'issued' | 'all') => {
    setFilterMode(mode);
    setSearchTerm('');
    const candidateList = mode === 'issued' 
      ? students.filter(s => isStudentIssued(s, documentLogs))
      : students;

    if (candidateList.length > 0) {
      const stillInList = candidateList.some(s => s.id === selectedStudentId || s.studentId === selectedStudentId);
      if (!stillInList) {
        handleSelectStudent(candidateList[0].id || candidateList[0].studentId);
      }
    } else if (mode === 'issued') {
      setSelectedStudent(null);
      setSelectedStudentId('');
    }
  };

  const handleTabChange = (tab: DocTab) => {
    const route = tab === 'nirgam-utara' ? 'nirgam-utara' : tab;
    const params = new URLSearchParams(searchParams);
    if (selectedStudentId) {
      params.set('studentId', selectedStudentId);
    }
    if (filterMode) {
      params.set('filter', filterMode);
    }
    navigate(`/documents/${route}?${params.toString()}`);
  };

  // Student filtering calculations
  const issuedStudents = students.filter(s => isStudentIssued(s, documentLogs));
  const candidateStudents = filterMode === 'issued' ? issuedStudents : students;

  const displayedStudents = candidateStudents.filter(s => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    const nameEn = (s.studentName || '').toLowerCase();
    const nameMr = (s.studentNameLocal || '').toLowerCase();
    const gr = (s.grNumber || '').toLowerCase();
    const cls = (s.admissionClass || '').toLowerCase();
    const stuId = (s.studentId || '').toLowerCase();
    const types = getIssuedTypesForStudent(s, documentLogs).join(' ').toLowerCase();

    return nameEn.includes(q) || nameMr.includes(q) || gr.includes(q) || cls.includes(q) || stuId.includes(q) || types.includes(q);
  });

  const handleApplyModalChanges = async (
    updatedStudent: Student,
    updatedCustomFields: CustomDocFields,
    saveToDatabase: boolean
  ) => {
    // 1. Update live custom fields
    setSerialNumber(updatedCustomFields.serialNumber);
    setIssueDate(updatedCustomFields.issueDate);
    setBonafidePurpose(updatedCustomFields.bonafidePurpose);
    setLeavingReason(updatedCustomFields.leavingReason);
    setConduct(updatedCustomFields.conduct);
    setProgress(updatedCustomFields.progress);
    setApplicantName(updatedCustomFields.applicantName);

    // 2. Update selected student state immediately for live certificate rendering
    setSelectedStudent(updatedStudent);

    // 3. If user chose to persist to master database
    if (saveToDatabase && (updatedStudent.id || updatedStudent.studentId)) {
      const studentKey = updatedStudent.id || updatedStudent.studentId;
      await studentService.updateStudent(studentKey, updatedStudent);

      // Update in students state list as well
      setStudents(prev => prev.map(s => (s.id === studentKey || s.studentId === studentKey) ? updatedStudent : s));
    }

    setNotification(saveToDatabase 
      ? (docLang === 'mr' ? 'माहिती दाखल्यावर लागू झाली व विद्यार्थी मास्टर रजिस्टरमध्ये जतन झाली!' : 'Saved to master register and applied to certificate!')
      : (docLang === 'mr' ? 'बदल दाखल्यावर तात्काळ लागू झाले आहेत.' : 'Changes applied to live certificate preview!')
    );
    setTimeout(() => setNotification(null), 4000);
  };

  const handlePrint = () => {
    if (!selectedStudent) return;

    const docType = currentTab === 'tc' ? 'TC' : currentTab === 'bonafide' ? 'BONAFIDE' : 'NIRGAM_UTARA';
    const newLogItem: Omit<DocumentLog, 'id'> = {
      documentType: docType,
      studentId: selectedStudent.studentId || selectedStudent.grNumber,
      studentName: selectedStudent.studentName,
      grNumber: selectedStudent.grNumber,
      studentClass: selectedStudent.admissionClass,
      issuedDate: issueDate,
      academicYear: settings.academicYear || '2026-2027',
      issuedBy: 'Principal Office',
      purpose: currentTab === 'bonafide' ? bonafidePurpose : leavingReason
    };

    // Update documentLogs in state immediately so student appears in issued list right away
    setDocumentLogs(prev => [
      { ...newLogItem, id: `doc_${Date.now()}` },
      ...prev
    ]);

    // If TC, also update student's certificateDate in state and database
    if (currentTab === 'tc') {
      const updatedStu = {
        ...selectedStudent,
        certificateDate: issueDate,
        leavingReason: leavingReason || selectedStudent.leavingReason
      };
      setSelectedStudent(updatedStu);
      setStudents(prev => prev.map(s => 
        (s.id === selectedStudent.id || s.studentId === selectedStudent.studentId) ? updatedStu : s
      ));
      const sKey = selectedStudent.id || selectedStudent.studentId;
      if (sKey) {
        studentService.updateStudent(sKey, updatedStu).catch(() => {});
      }
    }

    // Log the issuance in the background without blocking the synchronous print dialog
    try {
      documentService.logDocumentIssue(newLogItem).catch((err) => console.warn('Document log background error:', err));
    } catch (e) {
      console.warn('Logging error:', e);
    }

    const docTitle = currentTab === 'tc' 
      ? `TC_${selectedStudent.grNumber}_${selectedStudent.studentName}`
      : currentTab === 'bonafide'
      ? `Bonafide_${selectedStudent.grNumber}_${selectedStudent.studentName}`
      : `Nirgam_${selectedStudent.grNumber}_${selectedStudent.studentName}`;

    // Trigger Print cleanly across sandboxed iframe and standalone tabs
    printCertificateElement('certificate-print-area', docTitle);
  };

  if (loading) {
    return <LoadingSpinner label="Loading document generator..." />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Navigation Back Button */}
      <div className="flex items-center justify-between print:hidden">
        <button
          type="button"
          id="btn-doc-back"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/students');
            }
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-lg text-xs sm:text-sm font-semibold border border-slate-200 shadow-2xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-blue-700" />
          <span>{t('goBack')}</span>
        </button>
      </div>
      
      {/* Control Panel (Hidden during printing) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 print:hidden space-y-6">
        
        {/* Document Header & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-6 h-6 text-blue-700 shrink-0" />
              <span>{language === 'mr' || docLang === 'mr' ? (settings.schoolNameLocal || settings.schoolName) : settings.schoolName}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'mr' ? 'युडायस' : 'UDISE'}: <strong className="text-slate-700">{settings.udiseNumber}</strong> • {settings.address}
            </p>
          </div>

          {/* Action buttons + Language Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Document Language Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <Languages className="w-4 h-4 text-slate-500 ml-1" />
              <span className="text-[11px] font-bold text-slate-600 mr-1 hidden sm:inline">भाषा / Language:</span>
              <button
                type="button"
                id="btn-doc-lang-mr"
                onClick={() => setDocLang('mr')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  docLang === 'mr' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                मराठी (Marathi)
              </button>
              <button
                type="button"
                id="btn-doc-lang-en"
                onClick={() => setDocLang('en')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  docLang === 'en' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                English
              </button>
            </div>

            <button
              type="button"
              id="btn-toggle-doc-logs"
              onClick={() => setShowLogs(!showLogs)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <History className="w-4 h-4 text-slate-500" />
              <span>{showLogs ? 'लॉग लपवा' : 'नोंदवही / Logs'} ({documentLogs.length})</span>
            </button>
          </div>
        </div>

        {/* 3 Document Selection Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Tab 1: Transfer Certificate */}
          <button
            type="button"
            id="tab-btn-tc"
            onClick={() => handleTabChange('tc')}
            className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
              currentTab === 'tc'
                ? 'bg-blue-50 border-blue-600 text-blue-950 font-bold shadow-xs'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className={`p-2.5 rounded-lg ${currentTab === 'tc' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold leading-tight">School Leaving (T.C.)</p>
              <p className="text-[11px] text-slate-500">शाळा सोडल्याचा दाखला / T.C.</p>
            </div>
          </button>

          {/* Tab 2: Bonafide */}
          <button
            type="button"
            id="tab-btn-bonafide"
            onClick={() => handleTabChange('bonafide')}
            className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
              currentTab === 'bonafide'
                ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold shadow-xs'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className={`p-2.5 rounded-lg ${currentTab === 'bonafide' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold leading-tight">Bonafide Certificate</p>
              <p className="text-[11px] text-slate-500">बोनाफाईड प्रमाणपत्र</p>
            </div>
          </button>

          {/* Tab 3: Nirgam Utara */}
          <button
            type="button"
            id="tab-btn-nirgam"
            onClick={() => handleTabChange('nirgam-utara')}
            className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
              currentTab === 'nirgam-utara'
                ? 'bg-purple-50 border-purple-600 text-purple-950 font-bold shadow-xs'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className={`p-2.5 rounded-lg ${currentTab === 'nirgam-utara' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <Scroll className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold leading-tight">Nirgam Utara (GR Extract)</p>
              <p className="text-[11px] text-slate-500">जनरल रजिस्टर उतारा</p>
            </div>
          </button>
        </div>

        {/* Student Selector & Dynamic Customization Controls */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          
          {/* Header Bar: Filter Tabs (Issued Only vs All Students) */}
          <div className="sm:col-span-4 flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                {language === 'mr' ? 'दाखले यादी:' : 'Document List:'}
              </span>
              
              {/* Option 1: Only Issued Students */}
              <button
                type="button"
                id="btn-filter-issued"
                onClick={() => handleFilterModeChange('issued')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  filterMode === 'issued'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>{language === 'mr' ? 'फक्त वितरित केलेले दाखले' : 'Issued Documents Only'}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterMode === 'issued' ? 'bg-purple-900 text-white' : 'bg-slate-200 text-slate-800'}`}>
                  {issuedStudents.length}
                </span>
              </button>

              {/* Option 2: All Students */}
              <button
                type="button"
                id="btn-filter-all"
                onClick={() => handleFilterModeChange('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{language === 'mr' ? 'सर्व विद्यार्थी (नवीन दाखला)' : 'All Students (Issue New)'}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterMode === 'all' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-800'}`}>
                  {students.length}
                </span>
              </button>
            </div>

            {filterMode === 'issued' ? (
              <span className="text-[11px] font-semibold text-purple-800 bg-purple-100/70 px-2 py-0.5 rounded border border-purple-200">
                {language === 'mr' 
                  ? 'फक्त ज्यांचा T.C., बोनाफाईड किंवा निर्गम उतारा वितरीत झाला आहे तेच विद्यार्थी' 
                  : 'Showing only students with issued T.C., Bonafide, or Nirgam'}
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded border border-blue-200">
                {language === 'mr' 
                  ? 'कोणत्याही विद्यार्थ्यासाठी नवीन दाखला तयार करू शकता' 
                  : 'You can issue a certificate for any student in the register'}
              </span>
            )}
          </div>

          {/* If in Issued Mode and 0 students issued */}
          {filterMode === 'issued' && issuedStudents.length === 0 && (
            <div className="sm:col-span-4 p-4 bg-purple-50 border border-purple-200 rounded-xl text-purple-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-bold text-sm">
                  {language === 'mr' ? 'अद्याप कोणत्याही विद्यार्थ्याचा दाखला वितरित केलेला नाही' : 'No certificates issued yet'}
                </p>
                <p className="text-xs text-purple-700 mt-0.5">
                  {language === 'mr' 
                    ? 'नवीन दाखला (T.C., बोनाफाईड किंवा निर्गम उतारा) काढण्यासाठी "सर्व विद्यार्थी" निवडून विद्यार्थ्याचे नाव शोधा.' 
                    : 'To generate a new certificate, switch to "All Students" and search for the student.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleFilterModeChange('all')}
                className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer shadow-xs transition"
              >
                {language === 'mr' ? 'सर्व विद्यार्थी निवडा' : 'Switch to All Students'}
              </button>
            </div>
          )}

          {/* Search & Select Student Dropdown with Live Search Input */}
          <div className="sm:col-span-2 relative" id="dropdown-doc-students-container">
            <label className="block font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
              <span>
                {language === 'mr' ? 'विद्यार्थी शोधा व निवडा:' : 'Search & Select Student:'} <span className="text-red-500">*</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                {displayedStudents.length} {language === 'mr' ? 'विद्यार्थी उपलब्ध' : 'available'}
              </span>
            </label>

            {/* Search Input Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                id="input-search-doc-student"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder={
                  filterMode === 'issued'
                    ? (language === 'mr' ? 'नाव, GR क्र., किंवा वर्ग शोधा...' : 'Search issued student by name, GR, class...')
                    : (language === 'mr' ? 'सर्व विद्यार्थ्यांमधून नाव, GR शोधा...' : 'Search all students by name, GR, class...')
                }
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Clear Search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Searchable Options Dropdown Menu */}
            {isSearchOpen && (
              <div 
                id="dropdown-doc-students-list"
                className="absolute z-30 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-300 rounded-xl shadow-xl divide-y divide-slate-100 animate-in fade-in-50"
              >
                {displayedStudents.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    <p className="font-semibold text-slate-700">
                      {language === 'mr' ? 'कोणताही विद्यार्थी सापडला नाही' : 'No students match your search'}
                    </p>
                    {filterMode === 'issued' && (
                      <button
                        type="button"
                        onClick={() => {
                          handleFilterModeChange('all');
                          setSearchTerm('');
                        }}
                        className="mt-2 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        {language === 'mr' ? 'सर्व विद्यार्थ्यांमधून शोधण्यासाठी येथे क्लिक करा' : 'Click here to search across all students'}
                      </button>
                    )}
                  </div>
                ) : (
                  displayedStudents.map((stu) => {
                    const isSelected = (stu.id && stu.id === selectedStudentId) || stu.studentId === selectedStudentId;
                    const issuedTypes = getIssuedTypesForStudent(stu, documentLogs);
                    return (
                      <div
                        key={stu.id || stu.studentId}
                        onClick={() => {
                          handleSelectStudent(stu.id || stu.studentId);
                          setIsSearchOpen(false);
                          setSearchTerm('');
                        }}
                        className={`p-2.5 hover:bg-blue-50 transition cursor-pointer flex items-center justify-between gap-2 text-xs ${
                          isSelected ? 'bg-blue-50 font-bold text-blue-950 border-l-4 border-blue-600' : 'text-slate-800'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded text-[11px]">
                              #GR-{stu.grNumber}
                            </span>
                            <span className="font-bold text-slate-900 truncate">
                              {stu.studentNameLocal || stu.studentName}
                            </span>
                            {stu.studentNameLocal && (
                              <span className="text-slate-500 text-[11px] truncate">
                                ({stu.studentName})
                              </span>
                            )}
                            <span className="text-[11px] text-slate-600 font-medium">
                              (Class {stu.admissionClass})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {issuedTypes.map((t, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              {t === 'TC' ? 'T.C.' : t === 'BONAFIDE' ? 'बोनाफाईड' : 'निर्गम'}
                            </span>
                          ))}
                          {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Currently Selected Student Indicator */}
            {selectedStudent && (
              <div className="mt-1.5 flex items-center justify-between text-[11px] bg-slate-200/70 px-2.5 py-1.5 rounded-lg border border-slate-300">
                <span className="text-slate-700 truncate">
                  {language === 'mr' ? 'निवडलेला विद्यार्थी:' : 'Selected:'}{' '}
                  <strong className="text-slate-950">#GR-{selectedStudent.grNumber} {selectedStudent.studentNameLocal || selectedStudent.studentName}</strong>{' '}
                  <span className="text-slate-500">(Class {selectedStudent.admissionClass})</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="text-blue-700 hover:text-blue-900 font-bold ml-2 shrink-0 cursor-pointer"
                >
                  {isSearchOpen ? (language === 'mr' ? 'यादी मिटवा' : 'Close') : (language === 'mr' ? 'बदला / शोधा' : 'Change')}
                </button>
              </div>
            )}

            {/* Hidden native select for accessibility & automation */}
            <select
              id="select-doc-student"
              value={selectedStudentId}
              onChange={(e) => handleSelectStudent(e.target.value)}
              className="sr-only"
              tabIndex={-1}
            >
              {displayedStudents.map((stu) => (
                <option key={stu.id || stu.studentId} value={stu.id || stu.studentId}>
                  GR #{stu.grNumber} — {stu.studentName} (Class {stu.admissionClass})
                </option>
              ))}
            </select>
          </div>

          {/* Issue Date */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              दिनांक / Issue Date:
            </label>
            <input
              id="input-doc-issue-date"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Serial / Ref Number */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              दाखला / जावक क्र. (Serial No):
            </label>
            <input
              id="input-doc-serial-number"
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="e.g. TC-2026/084"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Contextual Inputs based on Tab */}
          {currentTab === 'bonafide' && (
            <div className="sm:col-span-4">
              <label className="block font-bold text-slate-700 uppercase mb-1">
                बोनाफाईड प्रमाणपत्र कारण (Purpose of Bonafide):
              </label>
              <input
                id="input-doc-bonafide-purpose"
                type="text"
                value={bonafidePurpose}
                onChange={(e) => setBonafidePurpose(e.target.value)}
                placeholder={docLang === 'mr' ? 'उदा. शैक्षणिक / शासकीय कामासाठी व शिष्यवृत्ती अर्जासाठी' : 'e.g. Educational & Scholarship Application'}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-600"
              />
            </div>
          )}

          {currentTab === 'tc' && (
            <>
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  शाळा सोडण्याचे कारण (Reason for Leaving):
                </label>
                <input
                  id="input-doc-leaving-reason"
                  type="text"
                  value={leavingReason}
                  onChange={(e) => setLeavingReason(e.target.value)}
                  placeholder={docLang === 'mr' ? 'उदा. पालकांची बदली / पुढील शिक्षणासाठी' : 'e.g. Parent Transfer to Another City'}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  वर्तणूक व स्वभाव (Conduct):
                </label>
                <input
                  id="input-doc-conduct"
                  type="text"
                  value={conduct}
                  onChange={(e) => setConduct(e.target.value)}
                  placeholder={docLang === 'mr' ? 'उदा. उत्तम व आज्ञाधारक' : 'e.g. Good & Obedient'}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  अभ्यासातील प्रगती (Progress):
                </label>
                <input
                  id="input-doc-progress"
                  type="text"
                  value={progress}
                  onChange={(e) => setProgress(e.target.value)}
                  placeholder={docLang === 'mr' ? 'उदा. समाधानकारक / उत्तम' : 'e.g. Good / First Class'}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </>
          )}

          {currentTab === 'nirgam-utara' && (
            <div className="sm:col-span-4">
              <label className="block font-bold text-slate-700 uppercase mb-1">
                उतारा अर्जदार नाव / संदर्भ (Applicant Name / Reference):
              </label>
              <input
                id="input-doc-applicant-name"
                type="text"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                placeholder="उदा. अर्जदार पालक: श्री. राजेश देशमुख"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
              />
            </div>
          )}
        </div>

        {/* Issuance History Drawer */}
        {showLogs && (
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-purple-700" />
                <span>{language === 'mr' ? 'वितरित केलेल्या दाखल्यांची नोंदवही (Issued Register)' : 'Issued Certificates Register'}</span>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                  {documentLogs.length}
                </span>
              </h4>

              {/* Log Search Input */}
              {documentLogs.length > 0 && (
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={logSearchTerm}
                    onChange={(e) => setLogSearchTerm(e.target.value)}
                    placeholder={language === 'mr' ? 'नोंदवहीत शोधा (नाव, GR)...' : 'Search logs (Name, GR)...'}
                    className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-purple-600"
                  />
                  {logSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setLogSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {documentLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">
                {language === 'mr' ? 'अद्याप कोणतेही दाखले वितरीत केलेले नाहीत.' : 'No documents issued yet.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs bg-white rounded-lg border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2">Type / प्रकार</th>
                      <th className="p-2">GR No</th>
                      <th className="p-2">Student Name / नाव</th>
                      <th className="p-2">Class / वर्ग</th>
                      <th className="p-2">Date / दिनांक</th>
                      <th className="p-2">Issued By</th>
                      <th className="p-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {documentLogs
                      .filter(log => {
                        if (!logSearchTerm.trim()) return true;
                        const q = logSearchTerm.toLowerCase();
                        return (
                          (log.studentName || '').toLowerCase().includes(q) ||
                          (log.grNumber || '').toLowerCase().includes(q) ||
                          (log.documentType || '').toLowerCase().includes(q) ||
                          (log.studentClass || '').toLowerCase().includes(q)
                        );
                      })
                      .slice(0, 15)
                      .map((log, idx) => (
                        <tr key={log.id || idx} className="hover:bg-purple-50/40 transition">
                          <td className="p-2 font-bold text-purple-800">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              {log.documentType}
                            </span>
                          </td>
                          <td className="p-2 font-mono font-bold text-slate-800">#{log.grNumber}</td>
                          <td className="p-2 font-semibold text-slate-900">{log.studentName}</td>
                          <td className="p-2 text-slate-600">Class {log.studentClass}</td>
                          <td className="p-2 font-medium">{formatDate(log.issuedDate)}</td>
                          <td className="p-2 text-slate-500">{log.issuedBy}</td>
                          <td className="p-2 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectStudent(log.studentId);
                                if (log.documentType === 'TC') handleTabChange('tc');
                                else if (log.documentType === 'BONAFIDE') handleTabChange('bonafide');
                                else if (log.documentType === 'NIRGAM_UTARA') handleTabChange('nirgam-utara');
                              }}
                              className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded text-[11px] border border-purple-200 transition cursor-pointer"
                            >
                              {language === 'mr' ? 'दाखला पहा' : 'View'}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Notification Toast */}
        {notification && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 font-bold text-xs flex items-center justify-between shadow-xs animate-in fade-in-50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notification}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-emerald-700 hover:text-emerald-950 font-bold text-xs"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Quick Action & Live Certificate Preview / Print Canvas */}
      {selectedStudent ? (
        <div className="space-y-3">
          
          {/* Student & Document Summary Header Banner (Hidden in print) */}
          <div className="bg-slate-900 text-white rounded-xl p-3 sm:px-4 sm:py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-sm border border-slate-800 print:hidden">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
              <div>
                <p className="text-xs sm:text-sm font-black tracking-wide flex flex-wrap items-center gap-2">
                  <span>
                    {currentTab === 'tc' && 'शाळा सोडल्याचा दाखला (T.C.)'}
                    {currentTab === 'bonafide' && 'बोनाफाईड प्रमाणपत्र (Bonafide)'}
                    {currentTab === 'nirgam-utara' && 'जनरल रजिस्टर निर्गम उतारा (Nirgam Utara)'}
                  </span>
                  <span className="text-blue-300 font-mono text-xs font-bold bg-blue-950/80 px-2 py-0.5 rounded border border-blue-700/60">
                    GR #{selectedStudent.grNumber}
                  </span>
                  <span className="text-slate-300 font-medium text-xs">
                    ({selectedStudent.studentName})
                  </span>
                </p>
              </div>
            </div>
            
            <div className="text-[11px] text-slate-400 hidden sm:block">
              {docLang === 'mr' ? 'A4 मूळ प्रोफॉर्मानुसार तयार' : 'Official A4 Proforma'}
            </div>
          </div>

          {/* Fully Responsive Document Canvas with Auto-Fit and Zoom for Mobile & Desktop */}
          <DocumentPreviewCanvas
            lang={docLang}
            documentTitle={
              currentTab === 'tc' 
                ? 'शाळा सोडल्याचा दाखला (T.C.)' 
                : currentTab === 'bonafide' 
                ? 'बोनाफाईड प्रमाणपत्र (Bonafide)' 
                : 'जनरल रजिस्टर निर्गम उतारा (Nirgam Utara)'
            }
            onPrint={handlePrint}
            onEdit={() => setIsEditModalOpen(true)}
          >
            {currentTab === 'tc' && (
              <TransferCertificate
                student={selectedStudent}
                serialNumber={serialNumber}
                issueDate={issueDate}
                leavingReason={leavingReason}
                conduct={conduct}
                progress={progress}
                lang={docLang}
                onEdit={() => setIsEditModalOpen(true)}
              />
            )}

            {currentTab === 'bonafide' && (
              <BonafideCertificate
                student={selectedStudent}
                issueDate={issueDate}
                purpose={bonafidePurpose}
                serialNumber={serialNumber}
                lang={docLang}
                onEdit={() => setIsEditModalOpen(true)}
              />
            )}

            {currentTab === 'nirgam-utara' && (
              <NirgamUtara
                student={selectedStudent}
                extractNumber={serialNumber}
                issueDate={issueDate}
                applicantName={applicantName}
                lang={docLang}
                onEdit={() => setIsEditModalOpen(true)}
              />
            )}
          </DocumentPreviewCanvas>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-sm text-slate-500">Please select or register a student to generate documents.</p>
        </div>
      )}

      {/* Certificate Live Edit Modal */}
      {selectedStudent && (
        <CertificateEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          student={selectedStudent}
          currentDocType={currentTab}
          customFields={{
            serialNumber,
            issueDate,
            bonafidePurpose,
            leavingReason,
            conduct,
            progress,
            applicantName
          }}
          onApplyChanges={handleApplyModalChanges}
          lang={docLang}
        />
      )}

    </div>
  );
}
