import { useState, useEffect, useMemo, useRef, useDeferredValue, ChangeEvent } from 'react';
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
  const { t, language } = useLanguage();
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

  // Deferred search term to guarantee 60 FPS input responsiveness on large datasets
  const deferredSearchTerm = useDeferredValue(searchTerm);

  // Unique years for filter dropdown
  const uniqueYears = useMemo(() => {
    const years = new Set<string>();
    for (let i = 0; i < students.length; i++) {
      const yr = students[i].admissionYear;
      if (yr && yr.trim()) {
        years.add(yr.trim());
      }
    }
    return Array.from(years).sort().reverse();
  }, [students]);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase();
    return students.filter(student => {
      // Search term matching
      if (query) {
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
  }, [students, deferredSearchTerm, selectedYear, selectedClass]);

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

  const handleCancelDelete = () => {
    setIsDeleting(false);
    setStudentToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    const targetStudent = studentToDelete;
    const idToDelete = targetStudent.id || targetStudent.studentId || '';
    const grNumber = targetStudent.grNumber;

    setIsDeleting(true);

    // Optimistically remove student from UI immediately
    setStudents(prev => prev.filter(s => 
      (targetStudent.id ? s.id !== targetStudent.id : true) &&
      (targetStudent.studentId ? s.studentId !== targetStudent.studentId : true) &&
      (targetStudent.grNumber ? s.grNumber !== targetStudent.grNumber : true)
    ));

    try {
      await studentService.deleteStudent(idToDelete, grNumber);
      setNotification({
        type: 'success',
        message: `विद्यार्थी (${targetStudent.fullName || targetStudent.grNumber}) यशस्वीरित्या डिलीट केला.`
      });
    } catch (err) {
      console.error('Failed to delete student:', err);
    } finally {
      setIsDeleting(false);
      setStudentToDelete(null);
    }
  };

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);

  // Reset / Delete All Modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirmationStep, setResetConfirmationStep] = useState<'menu' | 'confirm_delete_all' | 'confirm_reset_demo'>('menu');
  const [resetProgress, setResetProgress] = useState<{ current: number; total: number } | null>(null);
  const [activeDeleteTotal, setActiveDeleteTotal] = useState(0);
  const resetCancelTokenRef = useRef<{ isCancelled: boolean }>({ isCancelled: false });
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const handleCancelOrCloseResetModal = () => {
    if (isResetting) {
      resetCancelTokenRef.current.isCancelled = true;
      setIsResetting(false);
      setResetProgress(null);
      setIsResetModalOpen(false);
      setResetConfirmationStep('menu');
      setNotification({
        type: 'info',
        message: 'प्रक्रिया थांबवली गेली आहे.'
      });
      return;
    }
    setIsResetModalOpen(false);
    setResetConfirmationStep('menu');
  };

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
      message: `Successfully imported ${count} student records into General Register.`
    });
    await fetchStudents();
  };

  // Perform 1-Click Delete All or Sample Reset
  const handlePerformResetOrDelete = async (actionType: 'delete_all' | 'reset_sample') => {
    resetCancelTokenRef.current = { isCancelled: false };
    setIsResetting(true);
    const count = students.length || activeDeleteTotal;
    setActiveDeleteTotal(count);
    setResetProgress(actionType === 'delete_all' ? { current: 0, total: count } : null);

    try {
      if (actionType === 'delete_all') {
        const studentIds = students.map(s => s.id).filter(Boolean);

        // Optimistically clear local React state so tables don't spend CPU re-rendering thousands of rows
        setStudents([]);

        const res = await studentService.deleteAllStudents(
          studentIds,
          (current, total) => {
            setResetProgress({ current, total });
          },
          resetCancelTokenRef.current
        );

        if (res.cancelled) {
          setNotification({
            type: 'info',
            message: 'Data deletion cancelled.'
          });
          await fetchStudents();
          setIsResetModalOpen(false);
          setResetConfirmationStep('menu');
          return;
        }

        setNotification({
          type: 'success',
          message: `All ${count} student records have been deleted successfully.`
        });
      } else {
        const res = await studentService.resetToOriginalSchoolData();
        setNotification({
          type: 'success',
          message: `Reset completed. Restored ${res.restored} sample records.`
        });
      }

      await fetchStudents();
      setIsResetModalOpen(false);
      setResetConfirmationStep('menu');
    } catch (err) {
      console.error('Error during reset/delete operation:', err);
      setNotification({
        type: 'error',
        message: 'Failed to complete operation. Please try again.'
      });
    } finally {
      setIsResetting(false);
      setResetProgress(null);
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
              {students.length} {language === 'mr' ? 'नोंदी' : 'Records'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'mr' 
              ? 'जनरल रजिस्टर (GR) मुख्य नोंदी • क्लाउड डेटाबेस सिंक्रोनाइझ्ड' 
              : 'General Register (GR) Master Records • Cloud Firestore Synchronized'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Refresh Button */}
          <button
            id="btn-refresh-students"
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title={language === 'mr' ? 'डेटाबेसमधून ताजे करा' : 'Refresh from Database'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">{language === 'mr' ? 'ताजे करा' : 'Refresh'}</span>
          </button>

          {/* Import Excel / CSV Button */}
          <label
            htmlFor="input-import-excel-file"
            id="btn-import-excel-file"
            className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-md text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            title={language === 'mr' ? 'Excel किंवा CSV फाईलवरून विद्यार्थी आयात करा' : 'Import students from Excel (.xlsx) or CSV file'}
          >
            <FileUp className="w-3.5 h-3.5 text-emerald-700" />
            <span>{language === 'mr' ? 'एक्सेल आयात' : 'Import Excel / CSV'}</span>
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
            className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            title={language === 'mr' ? 'विद्यार्थी यादी एक्सेलमध्ये डाउनलोड करा' : 'Export full student register to Excel (.xlsx)'}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{t('exportExcel')}</span>
          </button>

          {/* 1-Click Reset / Delete All Button */}
          <button
            id="btn-open-reset-modal"
            type="button"
            onClick={() => {
              setActiveDeleteTotal(students.length);
              setIsResetModalOpen(true);
            }}
            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            title={language === 'mr' ? 'डेटा रीसेट किंवा हटवा' : 'Reset or delete all students'}
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>{language === 'mr' ? 'डेटा रीसेट' : 'Reset Data'}</span>
          </button>

          {/* Add Student Button */}
          <button
            id="btn-master-add-student"
            type="button"
            onClick={() => navigate('/add-student')}
            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
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
        onClose={handleCancelDelete}
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
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="p-2 bg-rose-100 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reset & Delete Data</h3>
                  <p className="text-xs text-slate-500">Total Students: <span className="font-bold text-rose-600">{activeDeleteTotal || students.length}</span></p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-reset-modal-x"
                onClick={handleCancelOrCloseResetModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4">
              {resetConfirmationStep === 'menu' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Choose an action to manage register data:
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
                      <h4 className="text-xs font-bold text-rose-950 flex items-center justify-between">
                        <span>Delete All Students</span>
                        <span className="bg-rose-200 text-rose-900 text-[10px] px-1.5 py-0.5 rounded font-bold">Clear All</span>
                      </h4>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        Permanently removes all student records from register.
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
                        Reset to Demo Data
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Restores the initial 5 sample student records.
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
                    <span>Confirm Deletion</span>
                  </div>
                  <p className="text-xs text-rose-900 leading-relaxed">
                    Are you sure you want to permanently delete all <strong>{activeDeleteTotal || students.length} student records</strong>? This cannot be undone.
                  </p>

                  {resetProgress && (
                    <div className="space-y-1.5 p-3 bg-white rounded-lg border border-rose-200">
                      <div className="flex justify-between text-xs font-semibold text-rose-800">
                        <span>Deleting...</span>
                        <span>{resetProgress.current} / {resetProgress.total} ({Math.round((resetProgress.current / (resetProgress.total || 1)) * 100)}%)</span>
                      </div>
                      <div className="w-full bg-rose-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-rose-600 h-2 rounded-full transition-all duration-150" 
                          style={{ width: `${Math.min(100, Math.round((resetProgress.current / (resetProgress.total || 1)) * 100))}%` }} 
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      type="button"
                      id="btn-perform-delete-all"
                      disabled={isResetting}
                      onClick={() => handlePerformResetOrDelete('delete_all')}
                      className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-75"
                    >
                      {isResetting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>Delete All {activeDeleteTotal || students.length} Records</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      id="btn-back-delete-all"
                      onClick={() => {
                        if (isResetting) {
                          handleCancelOrCloseResetModal();
                        } else {
                          setResetConfirmationStep('menu');
                        }
                      }}
                      className={`py-2.5 px-4 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        isResetting
                          ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
                          : 'bg-white border border-slate-300 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>
                        {isResetting ? 'Cancel' : 'Back'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Step: Confirm Reset Demo */}
              {resetConfirmationStep === 'confirm_reset_demo' && (
                <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <RotateCcw className="w-5 h-5 text-slate-700 shrink-0" />
                    <span>Confirm Reset</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Reset register to default demo data (5 sample students)?
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      type="button"
                      id="btn-perform-reset-demo"
                      disabled={isResetting}
                      onClick={() => handlePerformResetOrDelete('reset_sample')}
                      className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-75"
                    >
                      {isResetting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Resetting...</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          <span>Confirm Reset</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      id="btn-back-reset-demo"
                      onClick={() => {
                        if (isResetting) {
                          handleCancelOrCloseResetModal();
                        } else {
                          setResetConfirmationStep('menu');
                        }
                      }}
                      className={`py-2.5 px-4 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        isResetting
                          ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                          : 'bg-white border border-slate-300 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>
                        {isResetting ? 'Cancel' : 'Back'}
                      </span>
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
                  id="btn-close-reset-modal-footer"
                  onClick={handleCancelOrCloseResetModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

