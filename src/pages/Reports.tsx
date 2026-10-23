import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Users, 
  Filter, 
  Calendar, 
  Award, 
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  PieChart,
  ArrowLeft,
  FileText,
  GraduationCap,
  Scroll,
  ExternalLink,
  Search,
  FileCheck2
} from 'lucide-react';
import { Student, DocumentLog } from '../types';
import { studentService } from '../services/studentService';
import { documentService } from '../services/documentService';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { formatDate } from '../utils/dateUtils';
import { exportStudentsToCSV, exportDocumentsRosterToCSV } from '../utils/exportUtils';
import { useSchool } from '../context/SchoolContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { CLASS_OPTIONS } from '../components/students/StudentFilter';
import { getStudentGender, getGenderLabel } from '../utils/genderUtils';

type ReportTab = 'gr-master' | 'class-strength' | 'year-wise' | 'leaving-roster';

export function Reports() {
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const { currentSchool } = useSchool();
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [documentLogs, setDocumentLogs] = useState<DocumentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReportTab>('gr-master');

  // Filters and Pagination for GR Master
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [masterPage, setMasterPage] = useState<number>(1);
  const [masterPageSize, setMasterPageSize] = useState<number>(100);

  // Filters for Documents / Certificates Roster (TC, Nirgam, Bonafide)
  const [docTypeFilter, setDocTypeFilter] = useState<'all' | 'tc' | 'nirgam-utara' | 'bonafide'>('all');
  const [docClassFilter, setDocClassFilter] = useState<string>('');
  const [docSearchQuery, setDocSearchQuery] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const activeId = currentSchool?.id;
        const [list, logs] = await Promise.all([
          studentService.getAllStudents(activeId),
          documentService.getDocumentLogs(activeId).catch(() => [])
        ]);
        setStudents(list);
        setDocumentLogs(logs);
      } catch (err) {
        console.error('Failed to load reports data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentSchool?.id]);

  // Reset page when filters change
  useEffect(() => {
    setMasterPage(1);
  }, [selectedClass, selectedYear]);

  const years = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < students.length; i++) {
      const yr = students[i].admissionYear;
      if (yr) set.add(yr);
    }
    return Array.from(set).sort().reverse();
  }, [students]);

  // Filtered list
  const filteredStudents = useMemo(() => {
    if (!selectedClass && !selectedYear) return students;
    return students.filter(s => {
      if (selectedClass && s.admissionClass !== selectedClass) return false;
      if (selectedYear && s.admissionYear !== selectedYear) return false;
      return true;
    });
  }, [students, selectedClass, selectedYear]);

  const totalMasterPages = Math.ceil(filteredStudents.length / masterPageSize) || 1;
  const validMasterPage = Math.min(Math.max(masterPage, 1), totalMasterPages);
  const paginatedMasterStudents = useMemo(() => {
    const start = (validMasterPage - 1) * masterPageSize;
    return filteredStudents.slice(start, start + masterPageSize);
  }, [filteredStudents, validMasterPage, masterPageSize]);

  // Class Strength Calculations (Separate Boys, Girls, and Total)
  const classStats = useMemo(() => {
    const stats: Record<string, { total: number; boys: number; girls: number; castes: Record<string, number> }> = {};
    
    CLASS_OPTIONS.forEach(c => {
      stats[c] = { total: 0, boys: 0, girls: 0, castes: {} };
    });

    students.forEach(s => {
      const cls = s.admissionClass;
      if (stats[cls]) {
        const gender = getStudentGender(s);
        stats[cls].total += 1;
        if (gender === 'Female') {
          stats[cls].girls += 1;
        } else {
          stats[cls].boys += 1;
        }
        const caste = s.caste || 'General';
        stats[cls].castes[caste] = (stats[cls].castes[caste] || 0) + 1;
      }
    });

    return stats;
  }, [students]);

  // Overall School Strength Totals (Boys & Girls Separate)
  const schoolTotals = useMemo(() => {
    let boys = 0;
    let girls = 0;
    students.forEach(s => {
      const g = getStudentGender(s);
      if (g === 'Female') {
        girls += 1;
      } else {
        boys += 1;
      }
    });
    return {
      total: students.length,
      boys,
      girls
    };
  }, [students]);

  // Unified Certificates & Documents Roster (TC, Nirgam, Bonafide)
  const allDocumentRecords = useMemo(() => {
    const list: Array<{
      id: string;
      docType: 'TC' | 'NIRGAM_UTARA' | 'BONAFIDE';
      grNumber: string;
      studentName: string;
      studentNameLocal?: string;
      gender: string;
      admissionClass: string;
      issueDate: string;
      purposeOrReason: string;
      conduct: string;
      student?: Student;
    }> = [];

    const seenKeys = new Set<string>();

    // Upfront fast Map indexing
    const studentById = new Map<string, Student>();
    const studentByGr = new Map<string, Student>();
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      if (s.id) studentById.set(s.id, s);
      if (s.studentId) studentById.set(s.studentId, s);
      if (s.grNumber) studentByGr.set(String(s.grNumber).trim(), s);
    }

    // 1. Process documentLogs from database / service
    documentLogs.forEach((log, index) => {
      const docType: 'TC' | 'NIRGAM_UTARA' | 'BONAFIDE' = 
        log.documentType === 'BONAFIDE' ? 'BONAFIDE' :
        log.documentType === 'NIRGAM_UTARA' ? 'NIRGAM_UTARA' : 'TC';

      const matchedStudent = 
        (log.studentId ? studentById.get(log.studentId) : undefined) ||
        (log.grNumber ? studentByGr.get(String(log.grNumber).trim()) : undefined);

      const grNumber = log.grNumber || matchedStudent?.grNumber || '—';
      const studentName = log.studentName || matchedStudent?.studentName || '—';
      const studentNameLocal = matchedStudent?.studentNameLocal;
      const gender = matchedStudent ? getStudentGender(matchedStudent) : 'Male';
      const admissionClass = log.studentClass || matchedStudent?.admissionClass || '—';
      const issueDate = log.issuedDate || '—';
      const purposeOrReason = log.purpose || (docType === 'TC' ? (matchedStudent?.leavingReason || matchedStudent?.leavingReasonLocal) : '') || '—';
      const conduct = matchedStudent?.behaviour || matchedStudent?.behaviourLocal || 'उत्कृष्ट';

      const key = `${docType}_${grNumber}_${issueDate}`;
      seenKeys.add(key);

      list.push({
        id: log.id || `doc_${index}`,
        docType,
        grNumber,
        studentName,
        studentNameLocal,
        gender,
        admissionClass,
        issueDate,
        purposeOrReason: purposeOrReason || '—',
        conduct,
        student: matchedStudent
      });
    });

    // 2. Include students who have certificateDate or leavingReason recorded on their profile
    students.forEach(s => {
      if (s.certificateDate || s.leavingReason) {
        const key = `TC_${s.grNumber}_${s.certificateDate || 'profile'}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          list.push({
            id: `tc_profile_${s.id || s.grNumber}`,
            docType: 'TC',
            grNumber: s.grNumber || '—',
            studentName: s.studentName,
            studentNameLocal: s.studentNameLocal,
            gender: getStudentGender(s),
            admissionClass: s.admissionClass || '—',
            issueDate: s.certificateDate || (typeof s.createdAt === 'string' ? s.createdAt.split('T')[0] : '—'),
            purposeOrReason: s.leavingReason || s.leavingReasonLocal || 'अभ्यासक्रम पूर्ण / पुढील शिक्षणासाठी',
            conduct: s.behaviour || s.behaviourLocal || 'उत्कृष्ट',
            student: s
          });
        }
      }
    });

    // Sort by issue date descending
    return list.sort((a, b) => (b.issueDate || '').localeCompare(a.issueDate || ''));
  }, [students, documentLogs]);

  // Filtered documents roster based on sub-filter, class filter, and search query
  const filteredDocRecords = useMemo(() => {
    return allDocumentRecords.filter(item => {
      // Sub-filter by document type
      if (docTypeFilter === 'tc' && item.docType !== 'TC') return false;
      if (docTypeFilter === 'nirgam-utara' && item.docType !== 'NIRGAM_UTARA') return false;
      if (docTypeFilter === 'bonafide' && item.docType !== 'BONAFIDE') return false;

      // Filter by class
      if (docClassFilter && item.admissionClass !== docClassFilter) return false;

      // Search query filter (matches student name, local name, GR number, purpose)
      if (docSearchQuery) {
        const q = docSearchQuery.toLowerCase().trim();
        const matchName = item.studentName.toLowerCase().includes(q);
        const matchLocal = (item.studentNameLocal || '').toLowerCase().includes(q);
        const matchGr = item.grNumber.toLowerCase().includes(q);
        const matchReason = item.purposeOrReason.toLowerCase().includes(q);
        if (!matchName && !matchLocal && !matchGr && !matchReason) return false;
      }

      return true;
    });
  }, [allDocumentRecords, docTypeFilter, docClassFilter, docSearchQuery]);

  // Statistics for all documents (TC, Nirgam, Bonafide)
  const docStats = useMemo(() => {
    let tcCount = 0;
    let tcBoys = 0;
    let tcGirls = 0;

    let nirgamCount = 0;
    let nirgamBoys = 0;
    let nirgamGirls = 0;

    let bonafideCount = 0;
    let bonafideBoys = 0;
    let bonafideGirls = 0;

    allDocumentRecords.forEach(d => {
      const isFemale = d.gender === 'Female';

      if (d.docType === 'TC') {
        tcCount++;
        if (isFemale) tcGirls++; else tcBoys++;
      } else if (d.docType === 'NIRGAM_UTARA') {
        nirgamCount++;
        if (isFemale) nirgamGirls++; else nirgamBoys++;
      } else if (d.docType === 'BONAFIDE') {
        bonafideCount++;
        if (isFemale) bonafideGirls++; else bonafideBoys++;
      }
    });

    return {
      total: allDocumentRecords.length,
      tcCount,
      tcBoys,
      tcGirls,
      nirgamCount,
      nirgamBoys,
      nirgamGirls,
      bonafideCount,
      bonafideBoys,
      bonafideGirls,
      totalBoys: tcBoys + nirgamBoys + bonafideBoys,
      totalGirls: tcGirls + nirgamGirls + bonafideGirls
    };
  }, [allDocumentRecords]);

  // Leaving Students List (retained for backward compatibility)
  const leavingStudents = useMemo(() => {
    return allDocumentRecords.filter(d => d.docType === 'TC');
  }, [allDocumentRecords]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <LoadingSpinner label="Loading reports & register data..." />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Navigation Back Button */}
      <div className="flex items-center justify-between print:hidden">
        <button
          type="button"
          id="btn-reports-back"
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
      
      {/* Header & Controls (Hidden when printing) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 print:hidden space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-700" />
              <span>{language === 'mr' ? 'जनरल रजिस्टर अहवाल व सांख्यिकी' : 'General Register Reports & Statistics'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'mr' ? 'अधिकृत शालेय नोंदी, वर्गनिहाय पटसंख्या तक्ते आणि विद्यार्थी गोषवारा.' : 'Official school records, class strength rosters, and student summaries.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="btn-print-report"
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{t('print')}</span>
            </button>

            <button
              type="button"
              id="btn-export-report-csv"
              onClick={() => {
                if (activeTab === 'leaving-roster') {
                  exportDocumentsRosterToCSV(filteredDocRecords, `ShalaVerse_Documents_Issuance_Roster.csv`);
                } else {
                  exportStudentsToCSV(filteredStudents, `ShalaVerse_${activeTab}_Report.csv`);
                }
              }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{t('exportExcel')}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('gr-master')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'gr-master'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'mr' ? 'जनरल रजिस्टर (GR) मुख्य पत्रक' : 'General Register (GR) Master Sheet'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('class-strength')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'class-strength'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'mr' ? 'वर्गनिहाय पटसंख्या अहवाल' : 'Class-Wise Strength Report'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leaving-roster')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'leaving-roster'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'mr' 
              ? `दाखले व प्रमाणपत्रे नोंदवही (T.C., निर्गम, बोनाफाइड) (${allDocumentRecords.length})` 
              : `Documents Roster (T.C., Nirgam, Bonafide) (${allDocumentRecords.length})`}
          </button>
        </div>

        {/* Filter Bar for Master Sheet */}
        {activeTab === 'gr-master' && (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="w-44">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
              >
                <option value="">{language === 'mr' ? 'सर्व इयत्ता' : 'All Classes'}</option>
                {CLASS_OPTIONS.map(c => (
                  <option key={c} value={c}>{language === 'mr' ? `इयत्ता ${c}` : `Class ${c}`}</option>
                ))}
              </select>
            </div>

            <div className="w-44">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
              >
                <option value="">{language === 'mr' ? 'सर्व प्रवेश वर्षे' : 'All Admission Years'}</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {(selectedClass || selectedYear) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedClass('');
                  setSelectedYear('');
                }}
                className="px-3 py-2 text-xs text-blue-700 hover:underline font-semibold cursor-pointer"
              >
                {language === 'mr' ? 'फिल्टर काढा' : 'Clear Filters'}
              </button>
            )}

            <span className="text-xs text-slate-500 ml-auto">
              {language === 'mr' 
                ? `एकूण यादी: ${filteredStudents.length} विद्यार्थी` 
                : `Total Listed: ${filteredStudents.length} students`}
            </span>
          </div>
        )}

        {/* Filter Bar for Certificates & Documents Roster (TC, Nirgam, Bonafide) */}
        {activeTab === 'leaving-roster' && (
          <div className="space-y-3 pt-2">
            {/* Sub-Filters by Document Type */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDocTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  docTypeFilter === 'all'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>{language === 'mr' ? 'सर्व दाखले व प्रमाणपत्रे' : 'All Documents'}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  docTypeFilter === 'all' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {docStats.total}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDocTypeFilter('tc')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  docTypeFilter === 'tc'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                <Scroll className="w-3.5 h-3.5" />
                <span>{language === 'mr' ? 'शाळा सोडल्याचा दाखला (T.C.)' : 'School Leaving / T.C.'}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  docTypeFilter === 'tc' ? 'bg-white/25 text-white' : 'bg-amber-200 text-amber-900'
                }`}>
                  {docStats.tcCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDocTypeFilter('nirgam-utara')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  docTypeFilter === 'nirgam-utara'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{language === 'mr' ? 'निर्गम उतारा (Nirgam)' : 'Nirgam Extract'}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  docTypeFilter === 'nirgam-utara' ? 'bg-white/25 text-white' : 'bg-indigo-200 text-indigo-900'
                }`}>
                  {docStats.nirgamCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDocTypeFilter('bonafide')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  docTypeFilter === 'bonafide'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{language === 'mr' ? 'बोनाफाइड प्रमाणपत्र' : 'Bonafide Certificate'}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  docTypeFilter === 'bonafide' ? 'bg-white/25 text-white' : 'bg-emerald-200 text-emerald-900'
                }`}>
                  {docStats.bonafideCount}
                </span>
              </button>
            </div>

            {/* Class filter and Search */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="w-44">
                <select
                  value={docClassFilter}
                  onChange={(e) => setDocClassFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                >
                  <option value="">{language === 'mr' ? 'सर्व इयत्ता' : 'All Classes'}</option>
                  {CLASS_OPTIONS.map(c => (
                    <option key={c} value={c}>{language === 'mr' ? `इयत्ता ${c}` : `Class ${c}`}</option>
                  ))}
                </select>
              </div>

              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={docSearchQuery}
                  onChange={(e) => setDocSearchQuery(e.target.value)}
                  placeholder={language === 'mr' ? 'विद्यार्थी नाव / जी.आर. क्र. / कारण शोधा...' : 'Search student, GR No, or purpose...'}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:outline-blue-500"
                />
              </div>

              {(docTypeFilter !== 'all' || docClassFilter || docSearchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setDocTypeFilter('all');
                    setDocClassFilter('');
                    setDocSearchQuery('');
                  }}
                  className="px-3 py-2 text-xs text-blue-700 hover:underline font-semibold cursor-pointer"
                >
                  {language === 'mr' ? 'सर्व फिल्टर काढा' : 'Reset Filters'}
                </button>
              )}

              <div className="ml-auto flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600">
                  {language === 'mr' 
                    ? `नोंदी: ${filteredDocRecords.length} / ${allDocumentRecords.length}` 
                    : `Entries: ${filteredDocRecords.length} / ${allDocumentRecords.length}`}
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/documents')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200 transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{language === 'mr' ? 'नवीन दाखला तयार करा' : 'Issue New Document'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Printable Report Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-8 print:p-0 print:border-none print:shadow-none">
        
        {/* Printable Header */}
        <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-black uppercase text-slate-950">
            {language === 'mr' ? (settings.schoolNameLocal || settings.schoolName) : settings.schoolName}
          </h1>
          {language === 'mr' ? (
            <p className="text-xs text-slate-600 font-medium">{settings.schoolName}</p>
          ) : (
            settings.schoolNameLocal && (
              <p className="text-sm font-semibold text-slate-800">
                {settings.schoolNameLocal}
              </p>
            )
          )}
          <p className="text-xs text-slate-700 mt-1">
            {settings.address} • {language === 'mr' ? 'युडायस' : 'UDISE'}: <strong>{settings.udiseNumber}</strong> • {language === 'mr' ? 'शैक्षणिक वर्ष' : 'Academic Year'}: <strong>{settings.academicYear || '2026-2027'}</strong>
          </p>

          <div className="mt-3 inline-block border border-slate-900 px-4 py-1 bg-slate-100 font-bold text-xs uppercase">
            {activeTab === 'gr-master' && (language === 'mr' ? 'जनरल रजिस्टर (GR) मुख्य नोंदवही' : 'GENERAL REGISTER (GR) MASTER ROSTER')}
            {activeTab === 'class-strength' && (language === 'mr' ? 'वर्गनिहाय विद्यार्थी पटसंख्या व प्रवेश नोंदवही' : 'CLASS-WISE STUDENT STRENGTH & ENROLLMENT REGISTER')}
            {activeTab === 'leaving-roster' && (
              language === 'mr'
                ? docTypeFilter === 'tc'
                  ? 'शाळा सोडल्याचा दाखला (T.C.) वितरण नोंदवही'
                  : docTypeFilter === 'nirgam-utara'
                  ? 'जनरल रजिस्टर निर्गम नोंद उतारा वितरण नोंदवही'
                  : docTypeFilter === 'bonafide'
                  ? 'बोनाफाइड प्रमाणपत्र वितरण नोंदवही'
                  : 'शालेय दाखले व प्रमाणपत्रे वितरण नोंदवही (T.C., निर्गम उतारा, बोनाफाइड प्रमाणपत्र)'
                : docTypeFilter === 'tc'
                  ? 'SCHOOL LEAVING / T.C. ISSUANCE REGISTER'
                  : docTypeFilter === 'nirgam-utara'
                  ? 'GENERAL REGISTER (NIRGAM UTARA) ISSUANCE REGISTER'
                  : docTypeFilter === 'bonafide'
                  ? 'BONAFIDE CERTIFICATE ISSUANCE REGISTER'
                  : 'OFFICIAL CERTIFICATES & DOCUMENTS ISSUANCE REGISTER (T.C., NIRGAM, BONAFIDE)'
            )}
          </div>
        </div>

        {/* TAB 1: General Register Master Sheet Table */}
        {activeTab === 'gr-master' && (
          <div className="space-y-4">
            {/* Top Pagination Summary (Hidden when printing) */}
            {filteredStudents.length > masterPageSize && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs print:hidden">
                <span className="font-semibold text-slate-700">
                  {language === 'mr' ? (
                    <>एकूण <strong className="text-blue-900 font-bold">{filteredStudents.length}</strong> विद्यार्थ्यांपैकी {(validMasterPage - 1) * masterPageSize + 1} ते {Math.min(validMasterPage * masterPageSize, filteredStudents.length)} दाखवत आहे (पान {validMasterPage} / {totalMasterPages})</>
                  ) : (
                    <>Showing {(validMasterPage - 1) * masterPageSize + 1} to {Math.min(validMasterPage * masterPageSize, filteredStudents.length)} of <strong className="text-blue-900 font-bold">{filteredStudents.length}</strong> students (Page {validMasterPage} of {totalMasterPages})</>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <span>{language === 'mr' ? 'प्रति पान:' : 'Per Page:'}</span>
                  <select
                    value={masterPageSize}
                    onChange={(e) => {
                      setMasterPageSize(Number(e.target.value));
                      setMasterPage(1);
                    }}
                    className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-700"
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                    <option value={500}>500</option>
                  </select>
                  <button
                    type="button"
                    disabled={validMasterPage <= 1}
                    onClick={() => setMasterPage(prev => Math.max(1, prev - 1))}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-bold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    ◀ {language === 'mr' ? 'मागील' : 'Prev'}
                  </button>
                  <button
                    type="button"
                    disabled={validMasterPage >= totalMasterPages}
                    onClick={() => setMasterPage(prev => Math.min(totalMasterPages, prev + 1))}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-bold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {language === 'mr' ? 'पुढील' : 'Next'} ▶
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs border border-slate-800">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold border-b border-slate-900">
                    <th className="p-2 border border-slate-700 w-16">{language === 'mr' ? 'जी.आर. क्र.' : 'GR No.'}</th>
                    <th className="p-2 border border-slate-700">{language === 'mr' ? 'विद्यार्थ्याचे पूर्ण नाव' : 'Student Full Name'}</th>
                    <th className="p-2 border border-slate-700">{language === 'mr' ? 'वडिलांचे नाव' : "Father's Name"}</th>
                    <th className="p-2 border border-slate-700 w-16 text-center">{language === 'mr' ? 'लिंग' : 'Gender'}</th>
                    <th className="p-2 border border-slate-700 w-16">{language === 'mr' ? 'इयत्ता' : 'Class'}</th>
                    <th className="p-2 border border-slate-700 w-24">{language === 'mr' ? 'प्रवेश दिनांक' : 'Adm. Date'}</th>
                    <th className="p-2 border border-slate-700 w-24">{language === 'mr' ? 'जन्म दिनांक' : 'Birth Date'}</th>
                    <th className="p-2 border border-slate-700">{language === 'mr' ? 'जात / धर्म' : 'Caste / Rel.'}</th>
                    <th className="p-2 border border-slate-700 w-28">{language === 'mr' ? 'आधार क्र.' : 'UID (Aadhaar)'}</th>
                    <th className="p-2 border border-slate-700 w-24">{language === 'mr' ? 'मोबाईल' : 'Mobile'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {paginatedMasterStudents.map((s, idx) => {
                    const gender = getStudentGender(s);
                    return (
                      <tr key={s.id || idx} className="hover:bg-slate-50">
                        <td className="p-2 border border-slate-300 font-mono font-bold text-slate-950">{s.grNumber}</td>
                        <td className="p-2 border border-slate-300 font-bold uppercase">{s.studentName}</td>
                        <td className="p-2 border border-slate-300">{s.fatherName || '-'}</td>
                        <td className="p-2 border border-slate-300 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                            gender === 'Female' 
                              ? 'bg-pink-100 text-pink-800 border border-pink-200' 
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {getGenderLabel(gender, language)}
                          </span>
                        </td>
                        <td className="p-2 border border-slate-300 font-semibold">{s.admissionClass}</td>
                        <td className="p-2 border border-slate-300 font-mono">{formatDate(s.admissionDate)}</td>
                        <td className="p-2 border border-slate-300 font-mono">{formatDate(s.birthDate)}</td>
                        <td className="p-2 border border-slate-300">{s.caste || '-'} ({s.religion || 'Hindu'})</td>
                        <td className="p-2 border border-slate-300 font-mono">{s.uid || '-'}</td>
                        <td className="p-2 border border-slate-300 font-mono">{s.mobile || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Pagination Controls (Hidden when printing) */}
            {totalMasterPages > 1 && (
              <div className="flex items-center justify-between pt-2 text-xs print:hidden">
                <span className="text-slate-500">
                  {language === 'mr' ? `पान ${validMasterPage} / एकूण ${totalMasterPages} पाने` : `Page ${validMasterPage} of ${totalMasterPages}`}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={validMasterPage <= 1}
                    onClick={() => setMasterPage(1)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded font-bold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    ««
                  </button>
                  <button
                    type="button"
                    disabled={validMasterPage <= 1}
                    onClick={() => setMasterPage(prev => Math.max(1, prev - 1))}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded font-bold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    ◀
                  </button>
                  <span className="px-3 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded font-bold font-mono">
                    {validMasterPage}
                  </span>
                  <button
                    type="button"
                    disabled={validMasterPage >= totalMasterPages}
                    onClick={() => setMasterPage(prev => Math.min(totalMasterPages, prev + 1))}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded font-bold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    ▶
                  </button>
                  <button
                    type="button"
                    disabled={validMasterPage >= totalMasterPages}
                    onClick={() => setMasterPage(totalMasterPages)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded font-bold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    »»
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Class-Wise Strength (Separate Boys & Girls) */}
        {activeTab === 'class-strength' && (
          <div className="space-y-6">
            {/* Visual Metric Cards for Quick Inspection */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/60 border border-blue-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">
                    {language === 'mr' ? 'एकूण मुले (Boys)' : 'Total Boys'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-blue-950 font-mono">{schoolTotals.boys}</span>
                    <span className="text-xs text-blue-600 font-bold bg-blue-100 px-2 py-0.5 rounded-full">
                      {schoolTotals.total > 0 ? Math.round((schoolTotals.boys / schoolTotals.total) * 100) : 0}%
                    </span>
                  </div>
                  <span className="text-[11px] text-blue-600 block mt-1">
                    {language === 'mr' ? 'शाळेतील एकूण मुलांची संख्या' : 'Active enrolled boys'}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                  👦
                </div>
              </div>

              <div className="bg-gradient-to-br from-pink-50 to-pink-100/60 border border-pink-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-xs font-bold text-pink-800 uppercase tracking-wider block">
                    {language === 'mr' ? 'एकूण मुली (Girls)' : 'Total Girls'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-pink-950 font-mono">{schoolTotals.girls}</span>
                    <span className="text-xs text-pink-600 font-bold bg-pink-100 px-2 py-0.5 rounded-full">
                      {schoolTotals.total > 0 ? Math.round((schoolTotals.girls / schoolTotals.total) * 100) : 0}%
                    </span>
                  </div>
                  <span className="text-[11px] text-pink-600 block mt-1">
                    {language === 'mr' ? 'शाळेतील एकूण मुलींची संख्या' : 'Active enrolled girls'}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-pink-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                  👧
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-300 rounded-xl p-4 flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    {language === 'mr' ? 'सर्व एकूण पटसंख्या' : 'Grand Total Strength'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-slate-950 font-mono">{schoolTotals.total}</span>
                    <span className="text-xs text-slate-600 font-semibold bg-slate-200 px-2 py-0.5 rounded-full">
                      {language === 'mr' ? '१००% पट' : '100% Strength'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    {language === 'mr' ? 'मुले + मुली एकत्रित शालेय संख्या' : 'All students combined'}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                  👥
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs border border-slate-800">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold border-b border-slate-900">
                    <th className="p-2.5 border border-slate-700">{language === 'mr' ? 'इयत्ता' : 'Class'}</th>
                    <th className="p-2.5 border border-slate-700 text-center w-28 bg-blue-950/80">
                      {language === 'mr' ? 'मुले (Boys)' : 'Boys'}
                    </th>
                    <th className="p-2.5 border border-slate-700 text-center w-28 bg-pink-950/80">
                      {language === 'mr' ? 'मुली (Girls)' : 'Girls'}
                    </th>
                    <th className="p-2.5 border border-slate-700 text-center w-32 bg-slate-800">
                      {language === 'mr' ? 'एकूण विद्यार्थी (Total)' : 'Total Students'}
                    </th>
                    <th className="p-2.5 border border-slate-700">{language === 'mr' ? 'प्रवर्ग / जात निहाय पटसंख्या' : 'Category / Caste Distribution'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {CLASS_OPTIONS.map(c => {
                    const data = classStats[c] || { total: 0, boys: 0, girls: 0, castes: {} };
                    return (
                      <tr key={c} className="hover:bg-slate-50">
                        <td className="p-2.5 border border-slate-300 font-bold text-sm">
                          {language === 'mr' ? `इयत्ता ${c}` : `Class ${c}`}
                        </td>
                        <td className="p-2.5 border border-slate-300 font-bold text-center text-sm font-mono text-blue-700 bg-blue-50/30">
                          {data.boys}
                        </td>
                        <td className="p-2.5 border border-slate-300 font-bold text-center text-sm font-mono text-pink-700 bg-pink-50/30">
                          {data.girls}
                        </td>
                        <td className="p-2.5 border border-slate-300 font-black text-center text-sm font-mono text-slate-950 bg-slate-100/50">
                          {data.total}
                        </td>
                        <td className="p-2.5 border border-slate-300">
                          {Object.keys(data.castes).length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(data.castes).map(([cat, count]) => (
                                <span key={cat} className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-[11px]">
                                  {cat}: <strong>{count}</strong>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">
                              {language === 'mr' ? 'कोणतेही विद्यार्थी नाहीत' : 'No students enrolled'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Totals Row with Separate Boys, Girls, and Grand Total */}
                  <tr className="bg-slate-200/90 font-black text-sm border-t-2 border-slate-900">
                    <td className="p-3 border border-slate-400 font-black text-slate-950">
                      {language === 'mr' ? 'एकूण शालेय पटसंख्या' : 'Total School Strength'}
                    </td>
                    <td className="p-3 border border-slate-400 text-center font-mono text-base font-black text-blue-900 bg-blue-100/60">
                      {schoolTotals.boys}
                    </td>
                    <td className="p-3 border border-slate-400 text-center font-mono text-base font-black text-pink-900 bg-pink-100/60">
                      {schoolTotals.girls}
                    </td>
                    <td className="p-3 border border-slate-400 text-center font-mono text-base font-black text-slate-950 bg-slate-300/80">
                      {schoolTotals.total}
                    </td>
                    <td className="p-3 border border-slate-400 text-xs font-semibold text-slate-700">
                      {language === 'mr' 
                        ? `एकूण मुले: ${schoolTotals.boys} • एकूण मुली: ${schoolTotals.girls} (एकूण पट: ${schoolTotals.total})` 
                        : `Total Boys: ${schoolTotals.boys} • Total Girls: ${schoolTotals.girls} (Total: ${schoolTotals.total})`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Certificates & Documents Roster (T.C., Nirgam, Bonafide) */}
        {activeTab === 'leaving-roster' && (
          <div className="space-y-6">
            {/* Visual Metric Summary Cards (Hidden when printing) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 print:hidden">
              {/* Card 1: Total Documents */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    {language === 'mr' ? 'एकूण वितरित दाखले' : 'Total Issued Documents'}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {docStats.total}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {language === 'mr' ? `मुले: ${docStats.totalBoys} • मुली: ${docStats.totalGirls}` : `B: ${docStats.totalBoys} • G: ${docStats.totalGirls}`}
                  </span>
                </div>
              </div>

              {/* Card 2: T.C. / School Leaving */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex flex-col justify-between shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    {language === 'mr' ? 'शाळा सोडल्याचे दाखले (T.C.)' : 'Leaving Certificates (T.C.)'}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Scroll className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-amber-950 font-mono">
                    {docStats.tcCount}
                  </span>
                  <span className="text-[11px] font-semibold text-amber-700">
                    {language === 'mr' ? `मुले: ${docStats.tcBoys} • मुली: ${docStats.tcGirls}` : `Boys: ${docStats.tcBoys} • Girls: ${docStats.tcGirls}`}
                  </span>
                </div>
              </div>

              {/* Card 3: Nirgam Utara */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 flex flex-col justify-between shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                    {language === 'mr' ? 'निर्गम नोंद उतारे (Nirgam)' : 'Nirgam Utaras'}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-indigo-950 font-mono">
                    {docStats.nirgamCount}
                  </span>
                  <span className="text-[11px] font-semibold text-indigo-700">
                    {language === 'mr' ? `मुले: ${docStats.nirgamBoys} • मुली: ${docStats.nirgamGirls}` : `Boys: ${docStats.nirgamBoys} • Girls: ${docStats.nirgamGirls}`}
                  </span>
                </div>
              </div>

              {/* Card 4: Bonafide Certificates */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-col justify-between shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    {language === 'mr' ? 'बोनाफाइड प्रमाणपत्रे' : 'Bonafide Certificates'}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-emerald-950 font-mono">
                    {docStats.bonafideCount}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700">
                    {language === 'mr' ? `मुले: ${docStats.bonafideBoys} • मुली: ${docStats.bonafideGirls}` : `Boys: ${docStats.bonafideBoys} • Girls: ${docStats.bonafideGirls}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Document Roster Table */}
            <div className="overflow-x-auto">
              {filteredDocRecords.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    {language === 'mr' 
                      ? 'निवडलेल्या निकषानुसार कोणतेही दाखले किंवा प्रमाणपत्रे आढळली नाहीत.' 
                      : 'No certificate records found matching the selected criteria.'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 mb-4">
                    {language === 'mr'
                      ? 'नवीन T.C., निर्गम उतारा किंवा बोनाफाइड प्रमाणपत्र तयार करण्यासाठी खालील बटण दाबा.'
                      : 'Generate a new T.C., Nirgam Utara, or Bonafide certificate via the documents portal.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/documents')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-bold hover:bg-blue-800 transition cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{language === 'mr' ? 'दाखले पोर्टलवर जा' : 'Open Documents Portal'}</span>
                  </button>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs border border-slate-800">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold border-b border-slate-900">
                      <th className="p-2.5 border border-slate-700 w-12 text-center">{language === 'mr' ? 'अ.क्र.' : 'Sr.'}</th>
                      <th className="p-2.5 border border-slate-700 w-16 text-center font-mono">{language === 'mr' ? 'जी.आर. क्र.' : 'GR No.'}</th>
                      <th className="p-2.5 border border-slate-700">{language === 'mr' ? 'विद्यार्थ्याचे पूर्ण नाव' : 'Student Full Name'}</th>
                      <th className="p-2.5 border border-slate-700 w-16 text-center">{language === 'mr' ? 'लिंग' : 'Gender'}</th>
                      <th className="p-2.5 border border-slate-700 w-20 text-center">{language === 'mr' ? 'इयत्ता' : 'Class'}</th>
                      <th className="p-2.5 border border-slate-700 w-44">{language === 'mr' ? 'प्रमाणपत्र प्रकार' : 'Document Type'}</th>
                      <th className="p-2.5 border border-slate-700 w-28 text-center">{language === 'mr' ? 'वितरण तारीख' : 'Issue Date'}</th>
                      <th className="p-2.5 border border-slate-700">{language === 'mr' ? 'कारण / प्रयोजन / शेरा' : 'Reason / Purpose / Remarks'}</th>
                      <th className="p-2.5 border border-slate-700 w-24 text-center">{language === 'mr' ? 'वर्तणूक' : 'Conduct'}</th>
                      <th className="p-2.5 border border-slate-700 w-24 text-center print:hidden">{language === 'mr' ? 'कृती' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {filteredDocRecords.map((item, idx) => {
                      const isGirl = item.gender === 'Female';
                      const docTargetType = item.docType === 'TC' ? 'tc' : item.docType === 'NIRGAM_UTARA' ? 'nirgam-utara' : 'bonafide';
                      const studentTargetId = item.student?.studentId || item.student?.id || item.grNumber;

                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50 transition">
                          {/* Sr No */}
                          <td className="p-2.5 border border-slate-300 text-center font-mono font-semibold text-slate-600">
                            {idx + 1}
                          </td>

                          {/* GR No */}
                          <td className="p-2.5 border border-slate-300 text-center font-mono font-bold text-slate-950 bg-slate-50/50">
                            {item.grNumber}
                          </td>

                          {/* Student Name */}
                          <td className="p-2.5 border border-slate-300">
                            <div className="font-bold text-slate-950 uppercase tracking-tight">
                              {item.studentName}
                            </div>
                            {item.studentNameLocal && (
                              <div className="text-[11px] font-semibold text-blue-900 mt-0.5">
                                {item.studentNameLocal}
                              </div>
                            )}
                          </td>

                          {/* Gender */}
                          <td className="p-2.5 border border-slate-300 text-center">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                              isGirl
                                ? 'bg-pink-100 text-pink-800 border border-pink-200' 
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              <span>{isGirl ? '👧' : '👦'}</span>
                              <span>{language === 'mr' ? (isGirl ? 'मुलगी' : 'मुलगा') : (isGirl ? 'Girl' : 'Boy')}</span>
                            </span>
                          </td>

                          {/* Class */}
                          <td className="p-2.5 border border-slate-300 text-center font-semibold text-slate-800">
                            {language === 'mr' ? `इयत्ता ${item.admissionClass}` : `Class ${item.admissionClass}`}
                          </td>

                          {/* Document Type Badge */}
                          <td className="p-2.5 border border-slate-300">
                            {item.docType === 'TC' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                <Scroll className="w-3.5 h-3.5 text-amber-700" />
                                <span>{language === 'mr' ? 'शाळा सोडल्याचा दाखला (T.C.)' : 'School Leaving (T.C.)'}</span>
                              </span>
                            )}
                            {item.docType === 'NIRGAM_UTARA' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-300">
                                <FileText className="w-3.5 h-3.5 text-indigo-700" />
                                <span>{language === 'mr' ? 'निर्गम नोंद उतारा (Nirgam)' : 'Nirgam Extract'}</span>
                              </span>
                            )}
                            {item.docType === 'BONAFIDE' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                                <span>{language === 'mr' ? 'बोनाफाइड प्रमाणपत्र' : 'Bonafide Certificate'}</span>
                              </span>
                            )}
                          </td>

                          {/* Issue Date */}
                          <td className="p-2.5 border border-slate-300 text-center font-mono font-medium text-slate-800 whitespace-nowrap">
                            {item.issueDate && item.issueDate !== '—' ? formatDate(item.issueDate) : '—'}
                          </td>

                          {/* Purpose / Reason */}
                          <td className="p-2.5 border border-slate-300 text-slate-800">
                            <span className="font-medium">{item.purposeOrReason}</span>
                          </td>

                          {/* Conduct */}
                          <td className="p-2.5 border border-slate-300 text-center font-semibold text-slate-700">
                            {item.conduct}
                          </td>

                          {/* Action (Print/View) */}
                          <td className="p-2.5 border border-slate-300 text-center print:hidden">
                            <button
                              type="button"
                              onClick={() => navigate(`/documents?type=${docTargetType}&studentId=${encodeURIComponent(studentTargetId)}`)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded text-[11px] font-bold border border-slate-300 hover:border-blue-300 transition cursor-pointer"
                              title={language === 'mr' ? 'दाखला उघडा / प्रिंट करा' : 'Open / Print Document'}
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>{language === 'mr' ? 'पहा' : 'View'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Table Footer Summary Row */}
                    <tr className="bg-slate-200/90 font-bold border-t-2 border-slate-800">
                      <td colSpan={2} className="p-3 border border-slate-400 text-center uppercase tracking-wider text-slate-900 text-xs">
                        {language === 'mr' ? 'एकूण नोंदवही सारांश' : 'Total Roster Summary'}
                      </td>
                      <td className="p-3 border border-slate-400 font-bold text-slate-900">
                        {language === 'mr' ? `एकूण नोंदवही: ${filteredDocRecords.length} दाखले` : `Total: ${filteredDocRecords.length} records`}
                      </td>
                      <td colSpan={2} className="p-3 border border-slate-400 text-center text-xs font-semibold text-slate-800">
                        {language === 'mr' 
                          ? `👦 मुले: ${docStats.totalBoys} • 👧 मुली: ${docStats.totalGirls}` 
                          : `Boys: ${docStats.totalBoys} • Girls: ${docStats.totalGirls}`}
                      </td>
                      <td colSpan={5} className="p-3 border border-slate-400 text-xs font-semibold text-slate-800">
                        {language === 'mr'
                          ? `📜 T.C.: ${docStats.tcCount} | 📋 निर्गम उतारा: ${docStats.nirgamCount} | 🎓 बोनाफाइड: ${docStats.bonafideCount}`
                          : `T.C.: ${docStats.tcCount} | Nirgam: ${docStats.nirgamCount} | Bonafide: ${docStats.bonafideCount}`}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Printable Footer Signatures */}
        <div className="mt-12 pt-6 border-t-2 border-slate-900 grid grid-cols-3 text-center text-xs font-bold text-slate-900">
          <div>
            <p className="mt-8">{language === 'mr' ? 'तयार करणार (लिपिक)' : 'Prepared by Clerk'}</p>
          </div>
          <div>
            <p className="mt-8">{language === 'mr' ? 'तपासणार (अधीक्षक)' : 'Verified by Office Superintendent'}</p>
          </div>
          <div>
            <p className="mt-8">{language === 'mr' ? 'मुख्याध्यापक / प्राचार्य' : 'Headmaster / Principal'}</p>
            <p className="text-[10px] font-normal text-slate-600">{settings.headmasterName}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
