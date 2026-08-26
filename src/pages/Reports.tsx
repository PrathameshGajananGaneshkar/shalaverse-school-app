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
  ArrowLeft
} from 'lucide-react';
import { Student } from '../types';
import { studentService } from '../services/studentService';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { formatDate } from '../utils/dateUtils';
import { exportStudentsToCSV } from '../utils/exportUtils';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { CLASS_OPTIONS } from '../components/students/StudentFilter';

type ReportTab = 'gr-master' | 'class-strength' | 'year-wise' | 'leaving-roster';

export function Reports() {
  const { t } = useLanguage();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReportTab>('gr-master');

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const list = await studentService.getAllStudents();
        setStudents(list);
      } catch (err) {
        console.error('Failed to load reports data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const years = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      if (s.admissionYear) set.add(s.admissionYear);
    });
    return Array.from(set).sort().reverse();
  }, [students]);

  // Filtered list
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (selectedClass && s.admissionClass !== selectedClass) return false;
      if (selectedYear && s.admissionYear !== selectedYear) return false;
      return true;
    });
  }, [students, selectedClass, selectedYear]);

  // Class Strength Calculations
  const classStats = useMemo(() => {
    const stats: Record<string, { total: number; boys: number; girls: number; castes: Record<string, number> }> = {};
    
    CLASS_OPTIONS.forEach(c => {
      stats[c] = { total: 0, boys: 0, girls: 0, castes: {} };
    });

    students.forEach(s => {
      const cls = s.admissionClass;
      if (stats[cls]) {
        stats[cls].total += 1;
        const caste = s.caste || 'General';
        stats[cls].castes[caste] = (stats[cls].castes[caste] || 0) + 1;
      }
    });

    return stats;
  }, [students]);

  // Leaving Students List (those with leaving reason or certificate date)
  const leavingStudents = useMemo(() => {
    return students.filter(s => s.leavingReason || s.certificateDate);
  }, [students]);

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
              <span>General Register Reports & Statistics</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Official school records, class strength rosters, and student summaries.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="btn-print-report"
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition"
            >
              <Printer className="w-4 h-4" />
              <span>{t('print')}</span>
            </button>

            <button
              type="button"
              id="btn-export-report-csv"
              onClick={() => exportStudentsToCSV(filteredStudents, `ShalaVerse_${activeTab}_Report.csv`)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 transition"
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
            className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'gr-master'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            General Register (GR) Master Sheet
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('class-strength')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'class-strength'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Class-Wise Strength Report
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leaving-roster')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'leaving-roster'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            T.C. & School Leaving Roster ({leavingStudents.length})
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
                <option value="">All Classes</option>
                {CLASS_OPTIONS.map(c => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
            </div>

            <div className="w-44">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
              >
                <option value="">All Admission Years</option>
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
                className="px-3 py-2 text-xs text-blue-700 hover:underline font-semibold"
              >
                Clear Filters
              </button>
            )}

            <span className="text-xs text-slate-500 ml-auto">
              Total Listed: <strong>{filteredStudents.length}</strong> students
            </span>
          </div>
        )}
      </div>

      {/* Printable Report Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-8 print:p-0 print:border-none print:shadow-none">
        
        {/* Printable Header */}
        <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-black uppercase text-slate-950">
            {settings.schoolName}
          </h1>
          {settings.schoolNameLocal && (
            <p className="text-sm font-semibold text-slate-800">
              {settings.schoolNameLocal}
            </p>
          )}
          <p className="text-xs text-slate-700 mt-1">
            {settings.address} • UDISE: <strong>{settings.udiseNumber}</strong> • Academic Year: <strong>{settings.academicYear || '2026-2027'}</strong>
          </p>

          <div className="mt-3 inline-block border border-slate-900 px-4 py-1 bg-slate-100 font-bold text-xs uppercase">
            {activeTab === 'gr-master' && 'GENERAL REGISTER (GR) MASTER ROSTER'}
            {activeTab === 'class-strength' && 'CLASS-WISE STUDENT STRENGTH & ENROLLMENT REGISTER'}
            {activeTab === 'leaving-roster' && 'SCHOOL LEAVING / T.C. ISSUANCE REGISTER'}
          </div>
        </div>

        {/* TAB 1: General Register Master Sheet Table */}
        {activeTab === 'gr-master' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs border border-slate-800">
              <thead>
                <tr className="bg-slate-900 text-white font-bold border-b border-slate-900">
                  <th className="p-2 border border-slate-700 w-16">GR No.</th>
                  <th className="p-2 border border-slate-700">Student Full Name</th>
                  <th className="p-2 border border-slate-700">Father's Name</th>
                  <th className="p-2 border border-slate-700 w-16">Class</th>
                  <th className="p-2 border border-slate-700 w-24">Adm. Date</th>
                  <th className="p-2 border border-slate-700 w-24">Birth Date</th>
                  <th className="p-2 border border-slate-700">Caste / Rel.</th>
                  <th className="p-2 border border-slate-700 w-28">UID (Aadhaar)</th>
                  <th className="p-2 border border-slate-700 w-24">Mobile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {filteredStudents.map((s, idx) => (
                  <tr key={s.id || idx} className="hover:bg-slate-50">
                    <td className="p-2 border border-slate-300 font-mono font-bold text-slate-950">{s.grNumber}</td>
                    <td className="p-2 border border-slate-300 font-bold uppercase">{s.studentName}</td>
                    <td className="p-2 border border-slate-300">{s.fatherName || '-'}</td>
                    <td className="p-2 border border-slate-300 font-semibold">{s.admissionClass}</td>
                    <td className="p-2 border border-slate-300 font-mono">{formatDate(s.admissionDate)}</td>
                    <td className="p-2 border border-slate-300 font-mono">{formatDate(s.birthDate)}</td>
                    <td className="p-2 border border-slate-300">{s.caste || '-'} ({s.religion || 'Hindu'})</td>
                    <td className="p-2 border border-slate-300 font-mono">{s.uid || '-'}</td>
                    <td className="p-2 border border-slate-300 font-mono">{s.mobile || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: Class-Wise Strength */}
        {activeTab === 'class-strength' && (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs border border-slate-800">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold border-b border-slate-900">
                    <th className="p-2.5 border border-slate-700">Class</th>
                    <th className="p-2.5 border border-slate-700 text-center">Total Students</th>
                    <th className="p-2.5 border border-slate-700">Category / Caste Distribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {CLASS_OPTIONS.map(c => {
                    const data = classStats[c] || { total: 0, castes: {} };
                    return (
                      <tr key={c} className="hover:bg-slate-50">
                        <td className="p-2.5 border border-slate-300 font-bold text-sm">Class {c}</td>
                        <td className="p-2.5 border border-slate-300 font-black text-center text-sm font-mono text-blue-900">
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
                            <span className="text-slate-400 italic">No students enrolled</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-100 font-black text-sm border-t-2 border-slate-900">
                    <td className="p-3 border border-slate-400">Total School Strength</td>
                    <td className="p-3 border border-slate-400 text-center font-mono text-base text-blue-950">
                      {students.length}
                    </td>
                    <td className="p-3 border border-slate-400">
                      Active Registered Strength across 12 Classes
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Leaving Roster */}
        {activeTab === 'leaving-roster' && (
          <div className="overflow-x-auto">
            {leavingStudents.length === 0 ? (
              <p className="text-center text-slate-500 py-12 text-sm">No students currently flagged as left or T.C. issued.</p>
            ) : (
              <table className="w-full text-left border-collapse text-xs border border-slate-800">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold border-b border-slate-900">
                    <th className="p-2 border border-slate-700 w-16">GR No.</th>
                    <th className="p-2 border border-slate-700">Student Name</th>
                    <th className="p-2 border border-slate-700 w-16">Class</th>
                    <th className="p-2 border border-slate-700 w-28">T.C. Issue Date</th>
                    <th className="p-2 border border-slate-700">Reason for Leaving</th>
                    <th className="p-2 border border-slate-700 w-24">Conduct</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {leavingStudents.map((s, idx) => (
                    <tr key={s.id || idx} className="hover:bg-slate-50">
                      <td className="p-2 border border-slate-300 font-mono font-bold">{s.grNumber}</td>
                      <td className="p-2 border border-slate-300 font-bold uppercase">{s.studentName}</td>
                      <td className="p-2 border border-slate-300">Class {s.admissionClass}</td>
                      <td className="p-2 border border-slate-300 font-mono">{formatDate(s.certificateDate)}</td>
                      <td className="p-2 border border-slate-300">{s.leavingReason || 'Completed Studies / Course'}</td>
                      <td className="p-2 border border-slate-300 font-semibold">{s.behaviour || 'Good'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Printable Footer Signatures */}
        <div className="mt-12 pt-6 border-t-2 border-slate-900 grid grid-cols-3 text-center text-xs font-bold text-slate-900">
          <div>
            <p className="mt-8">Prepared by Clerk</p>
          </div>
          <div>
            <p className="mt-8">Verified by Office Superintendent</p>
          </div>
          <div>
            <p className="mt-8">Headmaster / Principal</p>
            <p className="text-[10px] font-normal text-slate-600">{settings.headmasterName}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
