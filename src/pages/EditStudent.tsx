import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Student } from '../types';
import { studentService } from '../services/studentService';
import { useLanguage } from '../context/LanguageContext';
import { StudentForm } from '../components/students/StudentForm';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function EditStudent() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  useEffect(() => {
    async function loadStudent() {
      if (!id) return;
      setLoading(true);
      try {
        const data = await studentService.getStudentById(id);
        setStudent(data);
      } catch (err) {
        console.error('Error fetching student for edit:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStudent();
  }, [id]);

  const handleSubmit = async (data: Omit<Student, 'id'>) => {
    if (!id) return;
    setSaving(true);
    try {
      await studentService.updateStudent(id, data);
      setSuccessMessage(true);
      setTimeout(() => {
        navigate('/students');
      }, 1200);
    } catch (err) {
      console.error('Failed to update student:', err);
      alert('Error updating student. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading student record..." />;
  }

  if (!student) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto mt-10 shadow-xs">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Student Not Found</h3>
        <p className="text-sm text-slate-500 mb-6">
          The requested student record could not be found in the General Register database.
        </p>
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/students');
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('goBack')}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <button
          type="button"
          id="btn-back-from-edit"
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

        {successMessage && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 text-xs sm:text-sm font-semibold animate-in fade-in-50">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t('updatedSuccessfully')}</span>
          </div>
        )}
      </div>

      <StudentForm
        initialData={student}
        onSubmit={handleSubmit}
        isEditing={true}
        isLoading={saving}
      />
    </div>
  );
}
