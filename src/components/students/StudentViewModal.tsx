import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Award, 
  FileText, 
  Edit, 
  Printer,
  FileCheck2,
  Scroll,
  School,
  Fingerprint,
  Copy,
  Check
} from 'lucide-react';
import { Student } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { formatDate } from '../../utils/dateUtils';
import { useLanguage } from '../../context/LanguageContext';

interface StudentViewModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (student: Student) => void;
}

export function StudentViewModal({
  student,
  isOpen,
  onClose,
  onEdit
}: StudentViewModalProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState(false);

  if (!student) return null;

  const val = (v?: string | null) => (v && v.trim() ? v : '-');

  const studentDisplayId = student.studentId || (student.grNumber ? `STU-${student.admissionYear?.slice(0, 4) || '2026'}-${student.grNumber}` : '-');

  const handleCopyId = () => {
    if (studentDisplayId && studentDisplayId !== '-') {
      navigator.clipboard.writeText(studentDisplayId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={student.studentName || 'Student Record'}
      subtitle={`GR No: ${student.grNumber} | Class: ${student.admissionClass} | Academic Year: ${student.admissionYear}`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Quick Identity Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center font-black text-xl">
              {student.studentName?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white leading-tight">
                  {student.studentName}
                </h2>
                <Badge variant="green" size="sm">Active Student</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-blue-200">
                <div className="inline-flex items-center gap-1.5 bg-blue-500/25 border border-blue-400/40 px-2.5 py-0.5 rounded-md text-white font-mono font-bold">
                  <Fingerprint className="w-3.5 h-3.5 text-blue-300" />
                  <span>ID: {studentDisplayId}</span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    title="Copy Student ID"
                    className="ml-1 text-blue-300 hover:text-white cursor-pointer"
                  >
                    {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <span>• G.R. No: <strong className="text-white font-mono">{student.grNumber}</strong></span>
                <span>• Class: <strong>{student.admissionClass}</strong></span>
                <span>• Aadhaar: <strong className="font-mono text-blue-100">{val(student.uid)}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Certificate Generate Shortcuts */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              id="btn-modal-issue-bonafide"
              onClick={() => {
                onClose();
                navigate(`/documents/bonafide?studentId=${student.id || student.studentId}`);
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              Bonafide
            </button>

            <button
              type="button"
              id="btn-modal-issue-tc"
              onClick={() => {
                onClose();
                navigate(`/documents/tc?studentId=${student.id || student.studentId}`);
              }}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <FileText className="w-3.5 h-3.5" />
              T.C.
            </button>

            <button
              type="button"
              id="btn-modal-issue-nirgam"
              onClick={() => {
                onClose();
                navigate(`/documents/nirgam-utara?studentId=${student.id || student.studentId}`);
              }}
              className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Scroll className="w-3.5 h-3.5" />
              Nirgam
            </button>
          </div>
        </div>

        {/* 6 Comprehensive Information Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Section 1: Admission Information */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <School className="w-4 h-4 text-blue-700" />
              {t('admissionInfo')}
            </h4>
            <div className="grid grid-cols-2 gap-y-2.5 text-xs">
              <div>
                <span className="text-slate-500 block">Student ID:</span>
                <span className="font-bold text-blue-900 font-mono text-sm">{studentDisplayId}</span>
              </div>
              <div>
                <span className="text-slate-500 block">GR Number:</span>
                <span className="font-bold text-slate-800 font-mono text-sm">{val(student.grNumber)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Admission Year:</span>
                <span className="font-semibold text-slate-800">{val(student.admissionYear)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Admission Date:</span>
                <span className="font-medium text-slate-800">{formatDate(student.admissionDate)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Admission Class:</span>
                <span className="font-bold text-blue-700">{val(student.admissionClass)}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Personal Information */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-700" />
              {t('personalInfo')}
            </h4>
            <div className="grid grid-cols-2 gap-y-2.5 text-xs">
              <div className="col-span-2">
                <span className="text-slate-500 block">Full Name:</span>
                <span className="font-bold text-slate-900">{val(student.studentName)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Father's Name:</span>
                <span className="font-medium text-slate-800">{val(student.fatherName)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Mother's Name:</span>
                <span className="font-medium text-slate-800">{val(student.motherName)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Date of Birth (DOB):</span>
                <span className="font-semibold text-slate-800">{formatDate(student.birthDate)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Birth Place:</span>
                <span className="font-medium text-slate-800">{val(student.birthPlace)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Nationality:</span>
                <span className="font-medium text-slate-800">{val(student.nationality)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Mother Tongue:</span>
                <span className="font-medium text-slate-800">{val(student.motherTongue)}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Caste & Identity */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-blue-700" />
              {t('casteIdentity')}
            </h4>
            <div className="grid grid-cols-2 gap-y-2.5 text-xs">
              <div>
                <span className="text-slate-500 block">Religion:</span>
                <span className="font-medium text-slate-800">{val(student.religion)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Caste:</span>
                <span className="font-medium text-slate-800">{val(student.caste)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Sub-Caste:</span>
                <span className="font-medium text-slate-800">{val(student.subCaste)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">UID / Aadhaar:</span>
                <span className="font-mono font-semibold text-slate-800">{val(student.uid)}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Previous School & Section 5: Contact */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-blue-700" />
              Contact & Previous School
            </h4>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500 block">Previous School Attended:</span>
                <span className="font-medium text-slate-800">{val(student.previousSchool)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/50">
                <div>
                  <span className="text-slate-500 block">Mobile Number:</span>
                  <span className="font-mono font-semibold text-blue-800">{val(student.mobile)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Residential Address:</span>
                  <span className="font-medium text-slate-800 block truncate" title={student.address}>
                    {val(student.address)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: School Record Information */}
          <div className="md:col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-200/60">
            <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-blue-700" />
              {t('schoolRecordInfo')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Academic Progress:</span>
                <span className="font-semibold text-slate-800">{val(student.academicProgress)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Conduct / Behaviour:</span>
                <span className="font-semibold text-slate-800">{val(student.behaviour)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Reason for Leaving:</span>
                <span className="font-medium text-slate-700">{val(student.leavingReason)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Certificate Date:</span>
                <span className="font-medium text-slate-700">{formatDate(student.certificateDate)}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block">Headmaster Signature Authority:</span>
                <span className="font-medium text-slate-800">{val(student.headmasterSignature)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                id="btn-modal-edit"
                onClick={() => {
                  onClose();
                  onEdit(student);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-xs transition"
              >
                <Edit className="w-4 h-4" />
                {t('edit')}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
