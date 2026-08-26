import { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Sparkles, 
  FileText, 
  User, 
  Calendar, 
  School, 
  FileCheck2,
  RefreshCw,
  Info,
  CheckCircle2,
  Database,
  Printer,
  Sparkle
} from 'lucide-react';
import { Student, AdmissionClass } from '../../types';
import { CLASS_OPTIONS } from '../students/StudentFilter';
import { transliterateToDevanagari } from '../../utils/devanagariUtils';
import { dateToWords } from '../../utils/dateUtils';
import { generateStudentId } from '../../utils/studentIdGenerator';

export interface CustomDocFields {
  serialNumber: string;
  issueDate: string;
  bonafidePurpose: string;
  leavingReason: string;
  conduct: string;
  progress: string;
  applicantName: string;
}

interface CertificateEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  currentDocType: 'tc' | 'bonafide' | 'nirgam-utara';
  customFields: CustomDocFields;
  onApplyChanges: (
    updatedStudent: Student, 
    updatedCustomFields: CustomDocFields, 
    saveToDatabase: boolean
  ) => Promise<void>;
  lang?: 'en' | 'mr' | 'hi';
}

const COMMON_LEAVING_REASONS = [
  { mr: 'पालकांची बदली झाल्यामुळे', en: 'Due to Parent Transfer', hi: 'अभिभावक के स्थानांतरण के कारण' },
  { mr: 'पुढील उच्च शिक्षणासाठी', en: 'For Higher Education', hi: 'उच्च शिक्षा हेतु' },
  { mr: 'गावी स्थलांतरित झाल्यामुळे', en: 'Relocated to Native Town', hi: 'गांव स्थानांतरित होने के कारण' },
  { mr: 'इयत्ता १० वी उत्तीर्ण होऊन शाळा सोडली', en: 'Passed 10th Standard', hi: 'कक्षा १०वीं उत्तीर्ण' },
  { mr: 'इयत्ता १२ वी उत्तीर्ण होऊन शाळा सोडली', en: 'Passed 12th Standard', hi: 'कक्षा १२वीं उत्तीर्ण' },
  { mr: 'स्वेच्छेने / पालकांच्या विनंतीनुसार', en: 'As per Parent Request', hi: 'अभिभावक के अनुरोध पर' }
];

const COMMON_CONDUCTS = [
  { mr: 'उत्तम (Good)', en: 'Good', hi: 'उत्तम (Good)' },
  { mr: 'अतिशय उत्तम (Very Good)', en: 'Very Good', hi: 'अति उत्तम (Very Good)' },
  { mr: 'समाधानकारक (Satisfactory)', en: 'Satisfactory', hi: 'संतोषजनक (Satisfactory)' },
  { mr: 'आज्ञाधारक व शिस्तप्रिय (Disciplined)', en: 'Disciplined & Obedient', hi: 'आज्ञाकारी एवं अनुशासित' }
];

const COMMON_PROGRESS = [
  { mr: 'उत्तम (Good)', en: 'Good', hi: 'उत्तम (Good)' },
  { mr: 'समाधानकारक (Satisfactory)', en: 'Satisfactory', hi: 'संतोषजनक (Satisfactory)' },
  { mr: 'प्रथम श्रेणी (First Class)', en: 'First Class', hi: 'प्रथम श्रेणी (First Class)' },
  { mr: 'विशेष प्राविण्य (Distinction)', en: 'Distinction', hi: 'विशेष योग्यता (Distinction)' }
];

const COMMON_PURPOSES = [
  { mr: 'शैक्षणिक / शासकीय कामासाठी व शिष्यवृत्ती अर्जासाठी', en: 'Educational, Official & Scholarship Application' },
  { mr: 'बस पास / रेल्वे पास सवलतीसाठी', en: 'For Bus / Railway Concession Pass' },
  { mr: 'आधार कार्ड / पॅन कार्ड नोंदणीसाठी', en: 'For Aadhaar / Identity Verification' },
  { mr: 'बँक खाते उघडण्यासाठी', en: 'For Opening Bank Account' },
  { mr: 'शासकीय योजना लाभासाठी', en: 'For Govt Welfare Scheme Application' }
];

const CASTE_CATEGORIES = [
  'General / Open (खुला)',
  'OBC (इतर मागासवर्गीय)',
  'SC (अनुसूचित जाती)',
  'ST (अनुसूचित जमाती)',
  'VJ / NT-A (विमुक्त जाती)',
  'NT-B (भटक्या जमाती - ब)',
  'NT-C (भटक्या जमाती - क)',
  'NT-D (भटक्या जमाती - ड)',
  'SBC (विशेष मागास प्रवर्ग)',
  'EWS (आर्थिकदृष्ट्या दुर्बल)',
  'SEBC (सामाजिक व शैक्षणिक मागास)'
];

export function CertificateEditModal({
  isOpen,
  onClose,
  student,
  currentDocType,
  customFields,
  onApplyChanges,
  lang = 'mr'
}: CertificateEditModalProps) {
  // Active inner tab: 'doc_specific' | 'identity' | 'caste_birth' | 'academic'
  const [activeTab, setActiveTab] = useState<'doc_specific' | 'identity' | 'caste_birth' | 'academic'>('doc_specific');

  // Form State
  const [formData, setFormData] = useState<Student>({ ...student });
  const [docFields, setDocFields] = useState<CustomDocFields>({ ...customFields });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state whenever student or customFields change
  useEffect(() => {
    if (student) {
      setFormData({ ...student });
    }
  }, [student]);

  useEffect(() => {
    if (customFields) {
      setDocFields({ ...customFields });
    }
  }, [customFields]);

  if (!isOpen) return null;

  const handleStudentFieldChange = <K extends keyof Student>(field: K, value: Student[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDocFieldChange = (field: keyof CustomDocFields, value: string) => {
    setDocFields(prev => ({ ...prev, [field]: value }));
  };

  // Auto Devanagari Transliteration Helpers
  const handleAutoMarathi = (sourceField: keyof Student, targetField: keyof Student) => {
    const srcVal = String(formData[sourceField] || '');
    if (!srcVal.trim()) return;
    const devanagari = transliterateToDevanagari(srcVal);
    setFormData(prev => ({ ...prev, [targetField]: devanagari }));
  };

  const handleSubmit = async (saveToDb: boolean) => {
    setSaving(true);
    try {
      await onApplyChanges(formData, docFields, saveToDb);
      setSuccessMsg(saveToDb ? 'माहिती दाखल्यावर लागू झाली आणि डेटाबेसमध्ये सेव्ह झाली!' : 'माहिती दाखल्यावर यशस्वीरित्या लागू झाली!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error applying changes:', err);
      alert('बदल लागू करताना त्रुटी आली.');
    } finally {
      setSaving(false);
    }
  };

  const docTitle = currentDocType === 'tc' 
    ? 'शाळा सोडल्याचा दाखला (T.C.)' 
    : currentDocType === 'bonafide' 
    ? 'बोनाफाईड प्रमाणपत्र (Bonafide Certificate)' 
    : 'जनरल रजिस्टर निर्गम उतारा (Nirgam Utara)';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 print:hidden">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in-50 zoom-in-95">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-wide text-white">
                {lang === 'mr' ? 'दाखला माहिती थेट संपादन (Live Certificate Editor)' : 'Edit Certificate & Student Details'}
              </h3>
              <p className="text-xs text-blue-200">
                {docTitle} • GR #{formData.grNumber} ({formData.studentName})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Guidance Banner */}
        <div className="bg-blue-50/90 border-b border-blue-200 px-5 sm:px-6 py-2.5 flex items-center justify-between text-xs text-blue-900 shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-700 shrink-0" />
            <span>
              {lang === 'mr' 
                ? 'येथे केलेले बदल थेट दाखल्यावर लगेच दिसतील. तुम्ही फक्त या प्रिंटसाठी किंवा कायमस्वरूपी सेव्ह करू शकता.' 
                : 'Any changes made here will update the live certificate immediately.'}
            </span>
          </div>
          {successMsg && (
            <span className="font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {successMsg}
            </span>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100 px-4 pt-2 gap-1.5 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('doc_specific')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 border-t border-x cursor-pointer whitespace-nowrap ${
              activeTab === 'doc_specific'
                ? 'bg-white text-blue-700 border-slate-200 -mb-px font-black shadow-xs'
                : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>१. दाखला विशेष माहिती ({currentDocType.toUpperCase()})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('identity')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 border-t border-x cursor-pointer whitespace-nowrap ${
              activeTab === 'identity'
                ? 'bg-white text-blue-700 border-slate-200 -mb-px font-black shadow-xs'
                : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>२. नाव व पालक माहिती (Identity)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('caste_birth')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 border-t border-x cursor-pointer whitespace-nowrap ${
              activeTab === 'caste_birth'
                ? 'bg-white text-blue-700 border-slate-200 -mb-px font-black shadow-xs'
                : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>३. जन्म व जात माहिती (Birth & Caste)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('academic')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 border-t border-x cursor-pointer whitespace-nowrap ${
              activeTab === 'academic'
                ? 'bg-white text-blue-700 border-slate-200 -mb-px font-black shadow-xs'
                : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            <School className="w-3.5 h-3.5" />
            <span>४. प्रवेश व शैक्षणिक नोंद (Academic)</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: Document Specific Fields */}
          {activeTab === 'doc_specific' && (
            <div className="space-y-5">
              <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl">
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                  <FileText className="w-4 h-4 text-amber-700" />
                  <span>सध्याचा दाखला: {docTitle}</span>
                </h4>
                <p className="text-xs text-amber-800">
                  या विभागातील बदल थेट या दाखल्याच्या मुख्य मजकुरावर तात्काळ लागू होतात.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Serial / Extract No */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    दाखला / जावक क्रमांक (Certificate / Outward No):
                  </label>
                  <input
                    type="text"
                    value={docFields.serialNumber}
                    onChange={(e) => handleDocFieldChange('serialNumber', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600"
                    placeholder="उदा. 2026/108"
                  />
                </div>

                {/* Issue Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    दाखला दिल्याची तारीख (Date of Issue):
                  </label>
                  <input
                    type="date"
                    value={docFields.issueDate}
                    onChange={(e) => handleDocFieldChange('issueDate', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* TC Specific Controls */}
              {currentDocType === 'tc' && (
                <div className="space-y-4 pt-2 border-t border-slate-200">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        शाळा सोडण्याचे कारण (Reason for Leaving):
                      </label>
                      <span className="text-[11px] text-slate-500">खालील पर्यायांवर क्लिक करून निवडू शकता</span>
                    </div>
                    <input
                      type="text"
                      value={docFields.leavingReason}
                      onChange={(e) => {
                        handleDocFieldChange('leavingReason', e.target.value);
                        handleStudentFieldChange('leavingReason', e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                      placeholder="उदा. पुढील उच्च शिक्षणासाठी / पालकांची बदली झाल्यामुळे"
                    />

                    {/* Quick reason badges */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {COMMON_LEAVING_REASONS.map((r, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            handleDocFieldChange('leavingReason', r.mr);
                            handleStudentFieldChange('leavingReason', r.mr);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-700 text-xs rounded-md border border-slate-200 transition cursor-pointer"
                        >
                          + {r.mr}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Conduct */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        वर्तणूक / वर्तणूक शेरा (Conduct):
                      </label>
                      <input
                        type="text"
                        value={docFields.conduct}
                        onChange={(e) => {
                          handleDocFieldChange('conduct', e.target.value);
                          handleStudentFieldChange('behaviour', e.target.value);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                        placeholder="उदा. उत्तम / समाधानकारक"
                      />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {COMMON_CONDUCTS.map((c, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              handleDocFieldChange('conduct', c.mr);
                              handleStudentFieldChange('behaviour', c.mr);
                            }}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[11px] text-slate-700 rounded border border-slate-200"
                          >
                            {c.mr}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Academic Progress */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        अभ्यासातील प्रगती (Academic Progress):
                      </label>
                      <input
                        type="text"
                        value={docFields.progress}
                        onChange={(e) => {
                          handleDocFieldChange('progress', e.target.value);
                          handleStudentFieldChange('academicProgress', e.target.value);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                        placeholder="उदा. उत्तम / प्रथम श्रेणी"
                      />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {COMMON_PROGRESS.map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              handleDocFieldChange('progress', p.mr);
                              handleStudentFieldChange('academicProgress', p.mr);
                            }}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[11px] text-slate-700 rounded border border-slate-200"
                          >
                            {p.mr}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Leaving Date / Certificate Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        शाळा सोडल्याची तारीख (Leaving Date):
                      </label>
                      <input
                        type="date"
                        value={formData.certificateDate || docFields.issueDate}
                        onChange={(e) => handleStudentFieldChange('certificateDate', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        शाळा सोडतानाची इयत्ता (Class on Leaving):
                      </label>
                      <select
                        value={formData.admissionClass}
                        onChange={(e) => handleStudentFieldChange('admissionClass', e.target.value as AdmissionClass)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                      >
                        {CLASS_OPTIONS.map((c) => (
                          <option key={c} value={c}>
                            {c} Standard
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Bonafide Specific Controls */}
              {currentDocType === 'bonafide' && (
                <div className="space-y-4 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      बोनाफाईड प्रमाणपत्राचे प्रयोजन / कारण (Purpose of Certificate):
                    </label>
                    <input
                      type="text"
                      value={docFields.bonafidePurpose}
                      onChange={(e) => handleDocFieldChange('bonafidePurpose', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                      placeholder="उदा. शैक्षणिक / शासकीय कामासाठी व शिष्यवृत्ती अर्जासाठी"
                    />

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {COMMON_PURPOSES.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleDocFieldChange('bonafidePurpose', p.mr)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-700 text-xs rounded-md border border-slate-200 transition cursor-pointer"
                        >
                          + {p.mr}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        सध्या शिकत असलेली इयत्ता (Current Class):
                      </label>
                      <select
                        value={formData.admissionClass}
                        onChange={(e) => handleStudentFieldChange('admissionClass', e.target.value as AdmissionClass)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                      >
                        {CLASS_OPTIONS.map((c) => (
                          <option key={c} value={c}>
                            {c} Standard
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        शैक्षणिक वर्ष (Academic Year):
                      </label>
                      <input
                        type="text"
                        value={formData.admissionYear}
                        onChange={(e) => handleStudentFieldChange('admissionYear', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                        placeholder="उदा. 2026-2027"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Nirgam Utara Specific Controls */}
              {currentDocType === 'nirgam-utara' && (
                <div className="space-y-4 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      उतारा अर्जदार नाव / संदर्भ (Applicant Name / Application Reference):
                    </label>
                    <input
                      type="text"
                      value={docFields.applicantName}
                      onChange={(e) => handleDocFieldChange('applicantName', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                      placeholder="उदा. अर्जदार पालक: श्री. विजय देशमुख (स्वतःच्या मुलाच्या दाखल्यासाठी)"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        मुख्याध्यापक / स्वाक्षरीकर्ता (Signatory Headmaster / Clerk):
                      </label>
                      <input
                        type="text"
                        value={formData.headmasterSignature || 'मुख्याध्यापक'}
                        onChange={(e) => handleStudentFieldChange('headmasterSignature', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                        placeholder="उदा. मुख्याध्यापक"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        शाळा सोडल्याची नोंद तारीख (Date of Leaving):
                      </label>
                      <input
                        type="date"
                        value={formData.certificateDate || docFields.issueDate}
                        onChange={(e) => handleStudentFieldChange('certificateDate', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Student Identity & Parents */}
          {activeTab === 'identity' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Sparkle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    मराठी नावासाठी इंग्रजीमध्ये टाईप करून उजवीकडील <strong>"✨ मराठी करा"</strong> बटण दाबा.
                  </span>
                </p>
              </div>

              {/* Student Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    विद्यार्थ्याचे नाव (English):
                  </label>
                  <input
                    type="text"
                    value={formData.studentName}
                    onChange={(e) => handleStudentFieldChange('studentName', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g. Deshmukh Aarav Rajesh"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      विद्यार्थ्याचे नाव (मराठी):
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAutoMarathi('studentName', 'studentNameLocal')}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>मराठी करा</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.studentNameLocal || ''}
                    onChange={(e) => handleStudentFieldChange('studentNameLocal', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                    placeholder="उदा. देशमुख आरव राजेश"
                  />
                </div>
              </div>

              {/* Father Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    वडिलांचे नाव (Father's Name - English):
                  </label>
                  <input
                    type="text"
                    value={formData.fatherName}
                    onChange={(e) => handleStudentFieldChange('fatherName', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g. Rajesh"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      वडिलांचे नाव (मराठी):
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAutoMarathi('fatherName', 'fatherNameLocal')}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>मराठी करा</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.fatherNameLocal || ''}
                    onChange={(e) => handleStudentFieldChange('fatherNameLocal', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                    placeholder="उदा. राजेश"
                  />
                </div>
              </div>

              {/* Mother Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    आईचे नाव (Mother's Name - English):
                  </label>
                  <input
                    type="text"
                    value={formData.motherName}
                    onChange={(e) => handleStudentFieldChange('motherName', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g. Sunita"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      आईचे नाव (मराठी):
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAutoMarathi('motherName', 'motherNameLocal')}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>मराठी करा</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.motherNameLocal || ''}
                    onChange={(e) => handleStudentFieldChange('motherNameLocal', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                    placeholder="उदा. सुनिता"
                  />
                </div>
              </div>

              {/* UID / Aadhaar & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    आधार क्रमांक / UID (12 Digits):
                  </label>
                  <input
                    type="text"
                    maxLength={14}
                    value={formData.uid}
                    onChange={(e) => handleStudentFieldChange('uid', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-600"
                    placeholder="उदा. 4589 1234 5678"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    पालकांचा मोबाईल नंबर (Contact Mobile):
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={formData.mobile}
                    onChange={(e) => handleStudentFieldChange('mobile', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:ring-2 focus:ring-blue-600"
                    placeholder="9876543210"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Birth & Caste Details */}
          {activeTab === 'caste_birth' && (
            <div className="space-y-4">
              {/* DOB & In Words */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    जन्म तारीख (Date of Birth):
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleStudentFieldChange('birthDate', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    अक्षरी जन्मतारीख (DOB In Words Auto Preview):
                  </label>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 space-y-1">
                    <p><strong>मराठी:</strong> {dateToWords(formData.birthDate, 'mr')}</p>
                    <p><strong>English:</strong> {dateToWords(formData.birthDate, 'en')}</p>
                  </div>
                </div>
              </div>

              {/* Birth Place */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    जन्मस्थळ (Birth Place - English):
                  </label>
                  <input
                    type="text"
                    value={formData.birthPlace}
                    onChange={(e) => handleStudentFieldChange('birthPlace', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g. Chikhli, Buldhana"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      जन्मस्थळ (मराठी):
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAutoMarathi('birthPlace', 'birthPlaceLocal')}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>मराठी करा</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.birthPlaceLocal || ''}
                    onChange={(e) => handleStudentFieldChange('birthPlaceLocal', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                    placeholder="उदा. चिखली, जि. बुलढाणा"
                  />
                </div>
              </div>

              {/* Religion & Caste */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    धर्म (Religion):
                  </label>
                  <input
                    type="text"
                    value={formData.religion}
                    onChange={(e) => handleStudentFieldChange('religion', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                    placeholder="उदा. Hindu / Muslim / Buddhist"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    जात व प्रवर्ग (Caste & Category):
                  </label>
                  <input
                    type="text"
                    value={formData.caste}
                    onChange={(e) => handleStudentFieldChange('caste', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                    placeholder="उदा. Maratha / Mali / Chambhar"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    पोटजात (Sub-caste):
                  </label>
                  <input
                    type="text"
                    value={formData.subCaste}
                    onChange={(e) => handleStudentFieldChange('subCaste', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                    placeholder="उदा. 96 Kuli"
                  />
                </div>
              </div>

              {/* Nationality & Mother Tongue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    राष्ट्रीयत्व (Nationality):
                  </label>
                  <input
                    type="text"
                    value={formData.nationality || 'Indian'}
                    onChange={(e) => handleStudentFieldChange('nationality', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                    placeholder="Indian / भारतीय"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    मातृभाषा (Mother Tongue):
                  </label>
                  <input
                    type="text"
                    value={formData.motherTongue || 'Marathi'}
                    onChange={(e) => handleStudentFieldChange('motherTongue', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                    placeholder="Marathi / मराठी"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Academic Records & School History */}
          {activeTab === 'academic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* GR Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    जनरल रजिस्टर क्र. (GR Number):
                  </label>
                  <input
                    type="text"
                    value={formData.grNumber}
                    onChange={(e) => handleStudentFieldChange('grNumber', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold text-blue-900 focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g. 108"
                  />
                </div>

                {/* Student Unique ID */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      विद्यार्थी युनिक आयडी (Student ID):
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newId = generateStudentId(formData.admissionYear || '2026', formData.grNumber || '101');
                        handleStudentFieldChange('studentId', newId);
                      }}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Auto ID</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.studentId || ''}
                    onChange={(e) => handleStudentFieldChange('studentId', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-600"
                    placeholder="STU-2026-108"
                  />
                </div>

                {/* Admission Class */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    प्रवेश घेतलेली इयत्ता (Admission Class):
                  </label>
                  <select
                    value={formData.admissionClass}
                    onChange={(e) => handleStudentFieldChange('admissionClass', e.target.value as AdmissionClass)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                  >
                    {CLASS_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c} Standard
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Admission Date & Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    शाळेत दाखल तारीख (Date of Admission):
                  </label>
                  <input
                    type="date"
                    value={formData.admissionDate}
                    onChange={(e) => handleStudentFieldChange('admissionDate', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    शैक्षणिक प्रवेश वर्ष (Admission Year):
                  </label>
                  <input
                    type="text"
                    value={formData.admissionYear}
                    onChange={(e) => handleStudentFieldChange('admissionYear', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                    placeholder="उदा. 2026-2027"
                  />
                </div>
              </div>

              {/* Previous School */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  पूर्वीची शाळा (Previous School Name):
                </label>
                <input
                  type="text"
                  value={formData.previousSchool}
                  onChange={(e) => handleStudentFieldChange('previousSchool', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                  placeholder="उदा. जि. प. प्राथमिक शाळा, चिखली"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  कायमचा पत्ता (Residential Address):
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => handleStudentFieldChange('address', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                  placeholder="मु. पो. चिखली, ता. चिखली, जि. बुलढाणा"
                />
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setFormData({ ...student });
              setDocFields({ ...customFields });
            }}
            className="w-full sm:w-auto px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>मूळ माहिती पुनर्संचयित करा (Reset)</span>
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={saving}
              className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>केवळ दाखल्यावर लागू करा (Apply to Certificate)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={saving}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Database className="w-4 h-4" />
              <span>{saving ? 'जतन करत आहे...' : 'दाखल्यावर लागू व डेटाबेसमध्ये सेव्ह करा (Save & Apply)'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
