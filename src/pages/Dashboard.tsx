import { useState, useEffect } from 'react';
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
  Sparkles,
  Search
} from 'lucide-react';
import { Student } from '../types';
import { studentService } from '../services/studentService';
import { documentService } from '../services/documentService';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { StatCard } from '../components/common/StatCard';
import { StudentTable } from '../components/students/StudentTable';
import { StudentViewModal } from '../components/students/StudentViewModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { exportStudentsToCSV } from '../utils/exportUtils';

export function Dashboard() {
  const { t } = useLanguage();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [docLogsCount, setDocLogsCount] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, logs] = await Promise.all([
        studentService.getAllStudents(),
        documentService.getDocumentLogs()
      ]);
      setStudents(data);
      setDocLogsCount(logs.length);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute metrics
  const totalStudents = students.length;
  const currentAcademicYear = settings.academicYear || '2026-2027';
  const currentYearStudents = students.filter(s => s.admissionYear === currentAcademicYear).length;
  
  // Class strength distribution
  const classCounts: Record<string, number> = {};
  students.forEach(s => {
    const cls = s.admissionClass || 'Other';
    classCounts[cls] = (classCounts[cls] || 0) + 1;
  });

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
      await studentService.deleteStudent(studentToDelete.id);
      setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
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
      {/* School Office Greeting Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold">
              <School className="w-3.5 h-3.5" />
              <span>General Register (GR) Central Portal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {settings.schoolName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              UDISE Code: <strong className="text-white font-mono">{settings.udiseNumber}</strong> • Academic Year: <strong className="text-blue-300">{currentAcademicYear}</strong>
            </p>
          </div>

          {/* Quick Action Button Group */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              id="btn-dash-add-student"
              type="button"
              onClick={() => navigate('/add-student')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-md flex items-center gap-2 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t('addStudent')}</span>
            </button>

            <button
              id="btn-dash-export-csv"
              type="button"
              onClick={() => exportStudentsToCSV(students)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-sm font-semibold rounded-xl border border-slate-700 flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4" />
              <span>{t('exportExcel')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title={t('totalStudents')}
          value={totalStudents}
          subtitle="Registered in General Book"
          icon={<Users className="w-6 h-6" />}
          color="blue"
          onClick={() => navigate('/students')}
        />
        <StatCard
          title={t('currentYearStudents')}
          value={currentYearStudents}
          subtitle={`Enrolled for ${currentAcademicYear}`}
          icon={<GraduationCap className="w-6 h-6" />}
          color="emerald"
        />
        <StatCard
          title="Documents Issued"
          value={docLogsCount}
          subtitle="T.C. & Bonafide Issued"
          icon={<FileText className="w-6 h-6" />}
          color="purple"
          onClick={() => navigate('/documents')}
        />
        <StatCard
          title={t('activeClasses')}
          value={Object.keys(classCounts).length}
          subtitle="Classes 1st to 12th"
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
              <span>Official Document Generation Hub</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Instantly generate, fill, preview and print verified certificates for any student
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/documents')}
            className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View All Documents</span>
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
                  Transfer Certificate (T.C.)
                </h4>
                <p className="text-[11px] text-slate-500">शाळा सोडल्याचा दाखला</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
              Standard 16-point official format with birth date in words, conduct, progress, and signatures.
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
                  Bonafide Certificate
                </h4>
                <p className="text-[11px] text-slate-500">बोनाफाईड प्रमाणपत्र</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
              Official bonafide certification with student photo attestation box and purpose statement.
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
                  Nirgam Utara (GR Extract)
                </h4>
                <p className="text-[11px] text-slate-500">जनरल रजिस्टर उतारा</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
              True copy legal extract of the 20 official columns from the school General Register volume.
            </p>
          </div>
        </div>
      </div>

      {/* Class Strength Quick Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">
            {t('studentsByClass')} (Strength Overview)
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            Total Classes: {Object.keys(classCounts).length}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map((cls) => {
            const count = classCounts[cls] || 0;
            return (
              <div
                key={cls}
                onClick={() => navigate(`/students?class=${cls}`)}
                className="bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg p-3 text-center transition cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-500 block">Class {cls}</span>
                <span className="text-xl font-extrabold text-blue-900 block mt-1">{count}</span>
                <span className="text-[10px] text-slate-400">students</span>
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
              Recent General Register Entries
            </h3>
            <p className="text-xs text-slate-500">
              Latest students recorded in the register
            </p>
          </div>
          <button
            type="button"
            id="btn-dash-view-all-students"
            onClick={() => navigate('/students')}
            className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
          >
            <span>{t('studentMaster')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <StudentTable
          students={recentStudents}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeletePrompt}
          onAddNew={() => navigate('/add-student')}
        />
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
