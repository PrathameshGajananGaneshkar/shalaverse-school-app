import { 
  X, 
  History, 
  FileText, 
  Calendar, 
  User, 
  Award, 
  FileCheck2, 
  Scroll, 
  Sparkles,
  Clock,
  AlertTriangle,
  Printer
} from 'lucide-react';
import { Student, DocumentLog } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { formatDate } from '../../utils/dateUtils';
import { useLanguage } from '../../context/LanguageContext';

interface StudentTcHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  logs: DocumentLog[];
  onIssueDuplicate?: () => void;
  lang?: 'en' | 'mr';
}

export function StudentTcHistoryModal({
  isOpen,
  onClose,
  student,
  logs,
  onIssueDuplicate,
  lang = 'mr'
}: StudentTcHistoryModalProps) {
  const { language } = useLanguage();
  const currentLang = lang || language;

  if (!isOpen || !student) return null;

  // Filter logs for this specific student
  const studentLogs = logs.filter(l => 
    (l.studentId && (l.studentId === student.id || l.studentId === student.studentId)) ||
    (l.grNumber && student.grNumber && String(l.grNumber).trim() === String(student.grNumber).trim())
  );

  const tcLogs = studentLogs.filter(l => l.documentType === 'TC');
  const hasTc = Boolean(
    tcLogs.length > 0 || 
    (student.certificateDate && String(student.certificateDate).trim().length > 0)
  );
  const originalDate = tcLogs[0]?.issuedDate || student.certificateDate || '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentLang === 'mr' ? 'विद्यार्थी दाखला वितरण इतिहास' : 'Student Document Issuance History'}
      subtitle={`GR #${student.grNumber} • ${student.studentNameLocal || student.studentName} (Class ${student.admissionClass})`}
      maxWidth="4xl"
    >
      <div className="space-y-5">
        {/* Top Summary Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm border border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white">{student.studentName}</span>
              {hasTc ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-black bg-rose-500/30 text-rose-300 border border-rose-400/40">
                  🔴 {currentLang === 'mr' ? 'TC दिलेली आहे' : 'TC Issued'}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400/40">
                  🟢 {currentLang === 'mr' ? 'सक्रिय विद्यार्थी' : 'Active'}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-300 mt-1 flex flex-wrap gap-x-3 gap-y-1">
              <span>GR No: <strong className="text-white font-mono">{student.grNumber}</strong></span>
              <span>इयत्ता: <strong className="text-white">{student.admissionClass}</strong></span>
              {originalDate && (
                <span>मूळ TC दिनांक: <strong className="text-rose-300 underline font-mono">{formatDate(originalDate)}</strong></span>
              )}
            </div>
          </div>

          {hasTc && onIssueDuplicate && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onIssueDuplicate();
              }}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black shadow-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{currentLang === 'mr' ? 'द्वितीय प्रत (Duplicate TC) काढा' : 'Issue Duplicate TC'}</span>
            </button>
          )}
        </div>

        {/* Warning Callout for Duplicate Request */}
        {hasTc && (
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {currentLang === 'mr' 
                  ? 'टीप: या विद्यार्थ्याचा मूळ दाखला हरवल्यास किंवा गहाळ झाल्यास ' 
                  : 'Note: If original TC is reported lost, '}
                <strong className="underline text-amber-900">
                  {currentLang === 'mr' ? '"द्वितीय प्रत (Duplicate TC)"' : '"Duplicate TC"'}
                </strong>
                {currentLang === 'mr' 
                  ? ' देणे अनिवार्य आहे. दाखल्यावर अधिकृत "द्वितीय प्रत" असा शेरा छापला जातो.' 
                  : ' must be issued with the official duplicate remarks.'}
              </p>
              {student.leavingReason && (
                <p className="mt-1 text-amber-800">
                  {currentLang === 'mr' ? 'शाळा सोडण्याचे मूळ कारण: ' : 'Original Leaving Reason: '}
                  <strong>{student.leavingReason}</strong>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Issuance Table */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-blue-600" />
            <span>{currentLang === 'mr' ? 'वितरित केलेल्या दाखल्यांची सर्व नोंद' : 'Document Issuance Log Records'}</span>
            <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.2 rounded-full font-bold">
              {studentLogs.length > 0 ? studentLogs.length : hasTc ? 1 : 0}
            </span>
          </h4>

          {studentLogs.length === 0 && !hasTc ? (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs">
              {currentLang === 'mr' ? 'या विद्यार्थ्याला अद्याप कोणताही दाखला वितरित केलेला नाही.' : 'No certificates issued to this student yet.'}
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs bg-white">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">{currentLang === 'mr' ? 'दाखला प्रकार' : 'Document Type'}</th>
                    <th className="p-2.5">{currentLang === 'mr' ? 'निर्गमित दिनांक' : 'Issue Date'}</th>
                    <th className="p-2.5">{currentLang === 'mr' ? 'शैक्षणिक वर्ष' : 'Academic Year'}</th>
                    <th className="p-2.5">{currentLang === 'mr' ? 'कारण / तपशील' : 'Purpose / Details'}</th>
                    <th className="p-2.5">{currentLang === 'mr' ? 'वितरित अधिकारी' : 'Issued By'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {/* If student has certificateDate recorded in register but no explicit log yet */}
                  {hasTc && studentLogs.every(l => l.documentType !== 'TC') && (
                    <tr className="bg-rose-50/40">
                      <td className="p-2.5 font-bold text-rose-900">1</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          TC (शाळा सोडल्याचा दाखला - मूळ प्रत)
                        </span>
                      </td>
                      <td className="p-2.5 font-mono font-bold text-slate-900">
                        {formatDate(student.certificateDate || '')}
                      </td>
                      <td className="p-2.5 text-slate-600">{student.admissionYear || '-'}</td>
                      <td className="p-2.5 text-slate-800">
                        {student.leavingReason || (currentLang === 'mr' ? 'शाळा सोडल्याची नोंद' : 'School Leaving')}
                      </td>
                      <td className="p-2.5 text-slate-500">Principal Office</td>
                    </tr>
                  )}

                  {studentLogs.map((log, idx) => {
                    const isTc = log.documentType === 'TC';
                    return (
                      <tr key={log.id || idx} className={isTc ? 'bg-rose-50/30 hover:bg-rose-50/60' : 'hover:bg-slate-50'}>
                        <td className="p-2.5 font-bold text-slate-700">{idx + 1}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isTc 
                              ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                              : log.documentType === 'BONAFIDE' 
                              ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                              : 'bg-purple-100 text-purple-800 border border-purple-200'
                          }`}>
                            {isTc ? 'TC (शाळा सोडल्याचा दाखला)' : log.documentType === 'BONAFIDE' ? 'बोनाफाईड प्रमाणपत्र' : 'निर्गम उतारा'}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono font-bold text-slate-900">
                          {formatDate(log.issuedDate)}
                        </td>
                        <td className="p-2.5 text-slate-600">{log.academicYear || '-'}</td>
                        <td className="p-2.5 text-slate-800">
                          {log.purpose || '-'}
                        </td>
                        <td className="p-2.5 text-slate-500">{log.issuedBy || 'Office'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Action Bar */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {currentLang === 'mr' 
              ? 'नोंदी सुरक्षितपणे शाळा मास्टर रजिस्टरमध्ये नोंदवल्या जातात.' 
              : 'Records are securely preserved in the school register.'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            {currentLang === 'mr' ? 'बंद करा' : 'Close'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
