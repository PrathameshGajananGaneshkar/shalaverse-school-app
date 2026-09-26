import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, X, Users, FileText, PlusCircle } from 'lucide-react';
import { Student } from '../types';
import { studentService } from '../services/studentService';
import { useLanguage } from '../context/LanguageContext';
import { StudentForm } from '../components/students/StudentForm';

export function AddStudent() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Success popup modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [addedStudentData, setAddedStudentData] = useState<Omit<Student, 'id'> | null>(null);
  const [newStudentId, setNewStudentId] = useState<string>('');
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = async (data: Omit<Student, 'id'>) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const generatedId = await studentService.addStudent(data);
      setAddedStudentData(data);
      setNewStudentId(generatedId || data.studentId);
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Failed to add student:', err);
      setErrorMessage(
        language === 'mr'
          ? 'विद्यार्थी जतन करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.'
          : (err?.message || 'Error saving student. Please try again.')
      );
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
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-medium">
          {errorMessage}
        </div>
      )}

      <StudentForm
        key={formKey}
        onSubmit={handleSubmit}
        isEditing={false}
        isLoading={loading}
      />

      {/* Successful Registration Pop-up Modal */}
      {showSuccessModal && addedStudentData && (
        <div 
          id="modal-student-added-success"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center border border-slate-200 transform animate-in zoom-in-95 duration-200 relative">
            {/* Close icon */}
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Success Icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-4 border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            {/* Title */}
            <h3 className="text-xl font-black text-slate-900 mb-1">
              {language === 'mr' ? 'विद्यार्थी नोंदणी यशस्वी!' : 'Student Added Successfully!'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-5">
              {language === 'mr' 
                ? 'नवीन विद्यार्थ्याची माहिती जनरल रजिस्टरमध्ये यशस्वीरीत्या जतन करण्यात आली आहे.' 
                : 'The student has been successfully saved to the General Register.'}
            </p>

            {/* Student Details Summary Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-6 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">
                  {language === 'mr' ? 'जी.आर. नंबर (GR No):' : 'GR Number:'}
                </span>
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  #{addedStudentData.grNumber}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">
                  {language === 'mr' ? 'विद्यार्थ्याचे नाव:' : 'Student Name:'}
                </span>
                <span className="font-bold text-slate-900 text-right">
                  {addedStudentData.studentNameLocal || addedStudentData.studentName}
                </span>
              </div>

              {addedStudentData.studentNameLocal && (
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">
                    {language === 'mr' ? 'इंग्रजीत नाव:' : 'English Name:'}
                  </span>
                  <span className="font-medium text-slate-800 text-right">
                    {addedStudentData.studentName}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">
                  {language === 'mr' ? 'प्रवेश वर्ग:' : 'Admission Class:'}
                </span>
                <span className="font-bold text-slate-800">
                  {language === 'mr' ? `इयत्ता ${addedStudentData.admissionClass}` : `Class ${addedStudentData.admissionClass}`}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">
                  {language === 'mr' ? 'प्रवेश वर्ष:' : 'Academic Year:'}
                </span>
                <span className="font-medium text-slate-700">
                  {addedStudentData.admissionYear}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              {/* Button 1: Go to Student Register */}
              <button
                type="button"
                id="btn-modal-view-students"
                onClick={() => navigate('/students')}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>{language === 'mr' ? 'विद्यार्थी यादी पहा (Student List)' : 'View Students List'}</span>
              </button>

              {/* Button 2: Issue Certificate */}
              <button
                type="button"
                id="btn-modal-issue-doc"
                onClick={() => navigate(`/documents?studentId=${newStudentId}&filter=all`)}
                className="w-full py-2.5 px-4 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-bold text-sm border border-purple-200 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>{language === 'mr' ? 'दाखला काढा (T.C. / Bonafide)' : 'Issue Certificate'}</span>
              </button>

              {/* Button 3: Add Another Student */}
              <button
                type="button"
                id="btn-modal-add-another"
                onClick={() => {
                  setShowSuccessModal(false);
                  setAddedStudentData(null);
                  setFormKey(prev => prev + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>{language === 'mr' ? 'आणखी एक नवीन विद्यार्थी जोडा' : 'Add Another Student'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
