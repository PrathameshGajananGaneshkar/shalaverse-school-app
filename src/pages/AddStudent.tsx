import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Student } from '../types';
import { studentService } from '../services/studentService';
import { useLanguage } from '../context/LanguageContext';
import { StudentForm } from '../components/students/StudentForm';

export function AddStudent() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  const handleSubmit = async (data: Omit<Student, 'id'>) => {
    setLoading(true);
    try {
      await studentService.addStudent(data);
      setSuccessMessage(true);
      setTimeout(() => {
        navigate('/students');
      }, 1200);
    } catch (err) {
      console.error('Failed to add student:', err);
      alert('Error saving student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Back to list navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          id="btn-back-to-master"
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
            <span>{t('savedSuccessfully')}</span>
          </div>
        )}
      </div>

      <StudentForm
        onSubmit={handleSubmit}
        isEditing={false}
        isLoading={loading}
      />
    </div>
  );
}
