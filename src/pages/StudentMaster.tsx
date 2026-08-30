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
  Trash2,
  RotateCcw,
  AlertTriangle,
  X,
  CheckCircle2
} from 'lucide-react';
import { Student } from '../types';
import { studentService } from '../services/studentService';
import { useLanguage } from '../context/LanguageContext';
import { StudentTable } from '../components/students/StudentTable';
import { StudentFilter } from '../components/students/StudentFilter';
import { StudentViewModal } from '../components/students/StudentViewModal';
import { ExcelImportModal } from '../components/students/ExcelImportModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { 
  exportStudentsToExcel, 
  exportStudentsToCSV, 
  parseExcelOrCSVToStudents 
} from '../utils/exportUtils';

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
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      const idToDelete = studentToDelete.id || studentToDelete.studentId || '';
      await studentService.deleteStudent(idToDelete, studentToDelete.grNumber);
      setStudents(prev => prev.filter(s => 
        (studentToDelete.id ? s.id !== studentToDelete.id : true) &&
        (studentToDelete.studentId ? s.studentId !== studentToDelete.studentId : true) &&
        (studentToDelete.grNumber ? s.grNumber !== studentToDelete.grNumber : true)
      ));
      setStudentToDelete(null);
      await fetchStudents();
    } catch (err) {
      console.error('Failed to delete student:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);

  // Reset / Delete All Modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirmationStep, setResetConfirmationStep] = useState<'menu' | 'confirm_delete_all' | 'confirm_reset_demo'>('menu');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleImportFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImportFile(file);
    setIsImportModalOpen(true);
    e.target.value = '';
  };

  const handleImportSuccess = async (count: number) => {
    setNotification({
      type: 'success',
      message: `🎉 अभिनंदन! एकूण ${count} विद्यार्थ्यांची माहिती जनरल रजिस्टरमध्ये यशस्वीरित्या नोंदवली गेली आहे.`
    });
    await fetchStudents();
  };

  // Perform 1-Click Delete All or Sample Reset
  const handlePerformResetOrDelete = async (actionType: 'delete_all' | 'reset_sample') => {
    setIsResetting(true);
    try {
      if (actionType === 'delete_all') {
        const res = await studentService.deleteAllStudents();
        setStudents([]);
        setNotification({
          type: 'success',
          message: `🗑️ यशस्वी! जनरल रजिस्टरमधील सर्व विद्यार्थी (${res.deleted} रेकॉर्ड्स) एका क्लिकवर पूर्णपणे डिलीट केले आहेत. आता रजिस्टर पूर्णपणे मोकळे आहे.`
        });
      } else {
        const res = await studentService.resetToOriginalSchoolData();
        setNotification({
          type: 'success',
          message: `🔄 यशस्वी! जनरल रजिस्टर मूळ नमुना स्वरूपात (${res.restored} विद्यार्थी) रीसेट केले आहे.`
        });
      }
      await fetchStudents();
      setIsResetModalOpen(false);
      setResetConfirmationStep('menu');
    } catch (err) {
      console.error('Error during reset/delete operation:', err);
      setNotification({
        type: 'error',
        message: 'डेटा डिलीट करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.'
      });
    } finally {
      setIsResetting(false);
    }
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

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-xs transition ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-slate-500 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
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

        <div className="flex items-center gap-2 flex-wrap">
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

          {/* Import Excel / CSV Button */}
          <label
            htmlFor="input-import-excel-file"
            id="btn-import-excel-file"
            className="px-3 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Import students from Excel (.xlsx) or CSV file"
          >
            <FileUp className="w-4 h-4 text-emerald-700" />
            <span>Import Excel / CSV</span>
            <input
              id="input-import-excel-file"
              type="file"
              accept=".xlsx, .xls, .csv, .json"
              className="hidden"
              onChange={handleImportFile}
            />
          </label>

          {/* Export Excel (.xlsx) Button */}
          <button
            id="btn-export-excel-xlsx"
            type="button"
            onClick={() => exportStudentsToExcel(filteredStudents)}
            className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Export full student register to Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{t('exportExcel')}</span>
          </button>

          {/* 1-Click Reset / Delete All Button */}
          <button
            id="btn-open-reset-modal"
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="सर्व विद्यार्थी १ क्लिकमध्ये डिलीट किंवा रीसेट करा"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>डेटा रीसेट / साफ करा</span>
          </button>

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

      {/* Excel / CSV Import & Column Mapping Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        initialFile={selectedImportFile}
        onClose={() => {
          setIsImportModalOpen(false);
          setSelectedImportFile(null);
        }}
        onImportSuccess={handleImportSuccess}
      />

      {/* 1-Click Reset / Purge Students Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="p-2 bg-rose-100 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">डेटा रीसेट व डिलीट पर्याय (Data Wipe)</h3>
                  <p className="text-xs text-slate-500">रजिस्टरमधील एकूण विद्यार्थी: <span className="font-bold text-rose-600">{students.length}</span></p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isResetting) {
                    setIsResetModalOpen(false);
                    setResetConfirmationStep('menu');
                  }
                }}
                disabled={isResetting}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4">
              {resetConfirmationStep === 'menu' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    जर तुम्ही Excel मधील १०० किंवा ५०० विद्यार्थी इम्पोर्ट केले असतील आणि ते चुकीचे झाले असतील, तर १-१ विद्यार्थी डिलीट न करता खालीलपैकी एक पर्याय निवडून <strong>एका सेकंदात सर्व डेटा साफ करा:</strong>
                  </p>

                  {/* Option 1: Complete 1-Click Purge */}
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={() => setResetConfirmationStep('confirm_delete_all')}
                    className="w-full text-left p-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition flex items-start gap-3 group cursor-pointer"
                  >
                    <div className="p-2 bg-rose-600 text-white rounded-lg shrink-0 mt-0.5 group-hover:scale-105 transition">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                        <span>सर्व विद्यार्थी डिलीट करा (Complete Blank Wipe)</span>
                        <span className="bg-rose-200 text-rose-900 text-[10px] px-1.5 py-0.5 rounded font-bold">0 Records</span>
                      </h4>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        सर्व १००, ५०० किंवा १,००० विद्यार्थी १ क्लिकमध्ये पूर्णपणे साफ होतील व रजिस्टर नवीन Excel अपलोड करण्यासाठी तयार होईल.
                      </p>
                    </div>
                  </button>

                  {/* Option 2: Reset to default demo samples */}
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={() => setResetConfirmationStep('confirm_reset_demo')}
                    className="w-full text-left p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition flex items-start gap-3 group cursor-pointer"
                  >
                    <div className="p-2 bg-slate-700 text-white rounded-lg shrink-0 mt-0.5 group-hover:scale-105 transition">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-slate-900">
                        सुरुवातीचा मूळ नमुना डेटा रीसेट करा (Reset to Demo)
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        सर्व टेस्ट डेटा काढून सुरुवातीचे ५ नमुना विद्यार्थी रजिस्टरमध्ये सेट होतील.
                      </p>
                    </div>
                  </button>
                </div>
              )}

              {/* Step: Confirm Delete All */}
              {resetConfirmationStep === 'confirm_delete_all' && (
                <div className="space-y-4 p-4 bg-rose-50 border border-rose-200 rounded-xl">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>⚠️ अंतिम खात्री (Final Confirmation)</span>
                  </div>
                  <p className="text-xs text-rose-900 leading-relaxed">
                    तुम्ही नक्की रजिस्टरमधील <strong>सर्व {students.length} विद्यार्थ्यांचा डेटा</strong> पूर्णपणे हटवू इच्छिता का? हा डेटा हटवल्यानंतर रजिस्टर ० (मोकळे) होईल आणि तुम्ही तुमची नवीन Excel फाईल लगेच नव्याने अपलोड करू शकाल.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <button
                      type="button"
                      disabled={isResetting}
                      onClick={() => handlePerformResetOrDelete('delete_all')}
                      className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isResetting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>हटवले जात आहे...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>होय, सर्व {students.length} विद्यार्थी डिलीट करा</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={isResetting}
                      onClick={() => setResetConfirmationStep('menu')}
                      className="py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      मागे जा (Back)
                    </button>
                  </div>
                </div>
              )}

              {/* Step: Confirm Reset Demo */}
              {resetConfirmationStep === 'confirm_reset_demo' && (
                <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <RotateCcw className="w-5 h-5 text-slate-700 shrink-0" />
                    <span>मूळ नमुना डेटा रीसेट</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    सर्व टेस्ट डेटा हटवून जनरल रजिस्टरमध्ये सुरुवातीचे ५ नमुना विद्यार्थी सेट होतील.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <button
                      type="button"
                      disabled={isResetting}
                      onClick={() => handlePerformResetOrDelete('reset_sample')}
                      className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isResetting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>रीसेट केले जात आहे...</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          <span>होय, नमुना डेटा सेट करा</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={isResetting}
                      onClick={() => setResetConfirmationStep('menu')}
                      className="py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      मागे जा (Back)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {resetConfirmationStep === 'menu' && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  disabled={isResetting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  बंद करा (Close)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

