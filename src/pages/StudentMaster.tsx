import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Download, 
  Upload,
  RefreshCw, 
  SlidersHorizontal,
  FileSpreadsheet,
  ArrowLeft,
  FileUp,
  Trash2
} from 'lucide-react';
import { Student } from '../types';
import { studentService } from '../services/studentService';
import { useLanguage } from '../context/LanguageContext';
import { StudentTable } from '../components/students/StudentTable';
import { StudentFilter } from '../components/students/StudentFilter';
import { StudentViewModal } from '../components/students/StudentViewModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { exportStudentsToCSV, parseCSVToStudents } from '../utils/exportUtils';

export function StudentMaster() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedYear, setSelectedYear] = useState(searchParams.get('year') || '');
  const [selectedClass, setSelectedClass] = useState(searchParams.get('class') || '');

  // Modal States
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await studentService.getAllStudents();
      setStudents(data);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Sync with searchParams if they change
  useEffect(() => {
    const classParam = searchParams.get('class');
    if (classParam) setSelectedClass(classParam);
  }, [searchParams]);

  // Unique years for filter dropdown
  const uniqueYears = useMemo(() => {
    const years = new Set<string>();
    students.forEach(s => {
      if (s.admissionYear && s.admissionYear.trim()) {
        years.add(s.admissionYear.trim());
      }
    });
    return Array.from(years).sort().reverse();
  }, [students]);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Search term matching
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const nameMatch = student.studentName?.toLowerCase().includes(query);
        const grMatch = student.grNumber?.toLowerCase().includes(query);
        const studentIdMatch = student.studentId?.toLowerCase().includes(query);
        const fatherMatch = student.fatherName?.toLowerCase().includes(query);
        const uidMatch = student.uid?.toLowerCase().includes(query);
        const mobileMatch = student.mobile?.toLowerCase().includes(query);
        if (!nameMatch && !grMatch && !studentIdMatch && !fatherMatch && !uidMatch && !mobileMatch) {
          return false;
        }
      }

      // Year filter
      if (selectedYear && student.admissionYear !== selectedYear) {
        return false;
      }

      // Class filter
      if (selectedClass && student.admissionClass !== selectedClass) {
        return false;
      }

      return true;
    });
  }, [students, searchTerm, selectedYear, selectedClass]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedYear('');
    setSelectedClass('');
    setSearchParams({});
  };

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
      await studentService.deleteStudent(studentToDelete.id);
      setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
      setStudentToDelete(null);
    } catch (err) {
      console.error('Failed to delete student:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const [isImporting, setIsImporting] = useState(false);

  const handleImportCSV = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        let parsedStudents: any[] = [];
        
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          parsedStudents = Array.isArray(parsed) ? parsed : (parsed.students || []);
        } else {
          // CSV import
          parsedStudents = parseCSVToStudents(text);
        }

        if (parsedStudents.length === 0) {
          alert('निवडलेल्या फाईलमध्ये विद्यार्थ्यांचा डेटा आढळला नाही. कृपया योग्य CSV किंवा JSON फाईल निवडा.');
          return;
        }

        if (confirm(`या फाईलमधून एकूण ${parsedStudents.length} विद्यार्थ्यांचा डेटा रजिस्टरमध्ये समाविष्ट करायचा आहे का?`)) {
          setIsImporting(true);
          const result = await studentService.importBackupData(parsedStudents);
          alert(`यशस्वी! ${result.added} विद्यार्थी जनरल रजिस्टरमध्ये नोंदवले गेले आहेत.`);
          await fetchStudents();
        }
      } catch (err) {
        console.error('Import error:', err);
        alert('डेटा इम्पोर्ट करताना त्रुटी आली. कृपया CSV किंवा JSON फाईलचे फॉरमॅट तपासा.');
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleClearDemo = async () => {
    if (!confirm('तुम्हाला सर्व नमुना (Sample / Demo) विद्यार्थ्यांची नोंदणी हटवून फक्त तुमचे स्वतःचे खरे विद्यार्थी ठेवायचे आहेत का?')) {
      return;
    }
    setLoading(true);
    try {
      const res = await studentService.clearSampleStudents();
      alert(`एकूण ${res.deleted} नमुना विद्यार्थी यशस्वीरित्या हटवले आहेत! आता फक्त तुमचे नोंदवलेले विद्यार्थी दिसतील.`);
      await fetchStudents();
    } catch (err) {
      console.error('Error clearing demo data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStudents();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Navigation Back Button */}
      <div className="flex items-center justify-between print:hidden">
        <button
          type="button"
          id="btn-master-back"
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

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {t('studentMaster')}
            </h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
              {students.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            General Register (GR) Master Records • Cloud Firestore Synchronized
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Refresh Button */}
          <button
            id="btn-refresh-students"
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
            title="Refresh from Database"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Import CSV / Excel Button */}
          <label
            htmlFor="input-import-csv"
            id="btn-import-excel-csv"
            className="px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Import students from Excel/CSV file"
          >
            <FileUp className="w-4 h-4 text-emerald-700" />
            <span>{isImporting ? 'इम्पोर्ट होत आहे...' : 'Import Excel / CSV'}</span>
            <input
              id="input-import-csv"
              type="file"
              accept=".csv, .json, text/csv"
              className="hidden"
              disabled={isImporting}
              onChange={handleImportCSV}
            />
          </label>

          {/* Export CSV Button */}
          <button
            id="btn-export-csv"
            type="button"
            onClick={() => exportStudentsToCSV(filteredStudents)}
            className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t('exportExcel')}</span>
          </button>

          {/* Clear Demo Records Button (shown if sample records exist) */}
          {students.some(s => s.id.startsWith('sample-') || s.id.startsWith('local-sample-') || s.studentId.startsWith('STU-2026-00') || s.studentId.startsWith('STU-2025-0') || s.studentId.startsWith('STU-2024-0')) && (
            <button
              id="btn-clear-demo-records"
              type="button"
              onClick={handleClearDemo}
              className="px-3 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              title="फक्त नमुना विद्यार्थी रेकॉर्ड्स डिलीट करा आणि तुमचे स्वतःचे खरे विद्यार्थी ठेवा"
            >
              <Trash2 className="w-4 h-4 text-amber-600" />
              <span>नमुना डेटा हटवा</span>
            </button>
          )}

          {/* Add Student Button */}
          <button
            id="btn-master-add-student"
            type="button"
            onClick={() => navigate('/add-student')}
            className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs sm:text-sm font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('addStudent')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Component */}
      <StudentFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        selectedClass={selectedClass}
        onClassChange={setSelectedClass}
        onReset={handleResetFilters}
        years={uniqueYears}
        totalResults={filteredStudents.length}
      />

      {/* Main Student Master Table */}
      {loading ? (
        <LoadingSpinner label={t('loading')} />
      ) : (
        <StudentTable
          students={filteredStudents}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeletePrompt}
          onAddNew={() => navigate('/add-student')}
        />
      )}

      {/* Student View Modal */}
      <StudentViewModal
        student={selectedStudent}
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        onEdit={handleEdit}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
