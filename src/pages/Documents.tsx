import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  GraduationCap, 
  Scroll, 
  Printer, 
  History,
  FileCheck2,
  Languages,
  Edit3,
  Sparkles,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { Student, DocumentLog } from '../types';
import { studentService } from '../services/studentService';
import { documentService } from '../services/documentService';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { TransferCertificate } from '../components/documents/TransferCertificate';
import { BonafideCertificate } from '../components/documents/BonafideCertificate';
import { NirgamUtara } from '../components/documents/NirgamUtara';
import { CertificateEditModal, CustomDocFields } from '../components/documents/CertificateEditModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatDate } from '../utils/dateUtils';

type DocTab = 'tc' | 'bonafide' | 'nirgam-utara';
type DocLang = 'mr' | 'en' | 'hi';

export function Documents() {
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: 'tc', 'bonafide', 'nirgam-utara'
  const currentTab = (searchParams.get('type') as DocTab) || 'tc';
  const paramStudentId = searchParams.get('studentId') || '';

  // Document language state: default to Marathi or current app language
  const [docLang, setDocLang] = useState<DocLang>(() => {
    if (language === 'mr' || language === 'hi' || language === 'en') return language;
    return 'mr';
  });

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(paramStudentId);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  // Customization fields
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [serialNumber, setSerialNumber] = useState('2026/108');
  const [bonafidePurpose, setBonafidePurpose] = useState('');
  const [leavingReason, setLeavingReason] = useState('');
  const [conduct, setConduct] = useState('');
  const [progress, setProgress] = useState('');
  const [applicantName, setApplicantName] = useState('');

  // Live Edit Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Logs
  const [documentLogs, setDocumentLogs] = useState<DocumentLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [studentList, logs] = await Promise.all([
          studentService.getAllStudents(),
          documentService.getDocumentLogs()
        ]);
        setStudents(studentList);
        setDocumentLogs(logs);

        // Pre-select student
        if (paramStudentId) {
          const match = studentList.find(s => s.id === paramStudentId || s.studentId === paramStudentId || s.grNumber === paramStudentId);
          if (match) {
            setSelectedStudent(match);
            setSelectedStudentId(match.id || match.studentId);
            if (match.leavingReason) setLeavingReason(match.leavingReason);
            if (match.behaviour) setConduct(match.behaviour);
            if (match.academicProgress) setProgress(match.academicProgress);
          }
        } else if (studentList.length > 0) {
          setSelectedStudent(studentList[0]);
          setSelectedStudentId(studentList[0].id || studentList[0].studentId);
        }
      } catch (err) {
        console.error('Error fetching document data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [paramStudentId]);

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    const match = students.find(s => s.id === id || s.studentId === id || s.grNumber === id);
    if (match) {
      setSelectedStudent(match);
      if (match.leavingReason) setLeavingReason(match.leavingReason);
      if (match.behaviour) setConduct(match.behaviour);
      if (match.academicProgress) setProgress(match.academicProgress);
    }
  };

  const handleTabChange = (tab: DocTab) => {
    setSearchParams({ type: tab, ...(selectedStudentId ? { studentId: selectedStudentId } : {}) });
  };

  const handleApplyModalChanges = async (
    updatedStudent: Student,
    updatedCustomFields: CustomDocFields,
    saveToDatabase: boolean
  ) => {
    // 1. Update live custom fields
    setSerialNumber(updatedCustomFields.serialNumber);
    setIssueDate(updatedCustomFields.issueDate);
    setBonafidePurpose(updatedCustomFields.bonafidePurpose);
    setLeavingReason(updatedCustomFields.leavingReason);
    setConduct(updatedCustomFields.conduct);
    setProgress(updatedCustomFields.progress);
    setApplicantName(updatedCustomFields.applicantName);

    // 2. Update selected student state immediately for live certificate rendering
    setSelectedStudent(updatedStudent);

    // 3. If user chose to persist to master database
    if (saveToDatabase && (updatedStudent.id || updatedStudent.studentId)) {
      const studentKey = updatedStudent.id || updatedStudent.studentId;
      await studentService.updateStudent(studentKey, updatedStudent);

      // Update in students state list as well
      setStudents(prev => prev.map(s => (s.id === studentKey || s.studentId === studentKey) ? updatedStudent : s));
    }

    setNotification(saveToDatabase 
      ? (docLang === 'mr' ? 'माहिती दाखल्यावर लागू झाली व विद्यार्थी मास्टर रजिस्टरमध्ये जतन झाली!' : 'Saved to master register and applied to certificate!')
      : (docLang === 'mr' ? 'बदल दाखल्यावर तात्काळ लागू झाले आहेत.' : 'Changes applied to live certificate preview!')
    );
    setTimeout(() => setNotification(null), 4000);
  };

  const handlePrint = async () => {
    if (!selectedStudent) return;

    // Log the issuance to Firestore and cache
    const docType = currentTab === 'tc' ? 'TC' : currentTab === 'bonafide' ? 'BONAFIDE' : 'NIRGAM_UTARA';
    await documentService.logDocumentIssue({
      documentType: docType,
      studentId: selectedStudent.studentId || selectedStudent.grNumber,
      studentName: selectedStudent.studentName,
      grNumber: selectedStudent.grNumber,
      studentClass: selectedStudent.admissionClass,
      issuedDate: issueDate,
      academicYear: settings.academicYear || '2026-2027',
      issuedBy: 'Principal Office',
      purpose: currentTab === 'bonafide' ? bonafidePurpose : leavingReason
    });

    // Trigger Print
    window.print();
  };

  if (loading) {
    return <LoadingSpinner label="Loading document generator..." />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Navigation Back Button */}
      <div className="flex items-center justify-between print:hidden">
        <button
          type="button"
          id="btn-doc-back"
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
      
      {/* Control Panel (Hidden during printing) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 print:hidden space-y-6">
        
        {/* Document Header & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-6 h-6 text-blue-700 shrink-0" />
              <span>{settings.schoolName}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              UDISE: <strong className="text-slate-700">{settings.udiseNumber}</strong> • {settings.address}
            </p>
          </div>

          {/* Action buttons + Language Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Document Language Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <Languages className="w-4 h-4 text-slate-500 ml-1" />
              <span className="text-[11px] font-bold text-slate-600 mr-1 hidden sm:inline">भाषा / Language:</span>
              <button
                type="button"
                id="btn-doc-lang-mr"
                onClick={() => setDocLang('mr')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  docLang === 'mr' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                मराठी (Marathi)
              </button>
              <button
                type="button"
                id="btn-doc-lang-en"
                onClick={() => setDocLang('en')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  docLang === 'en' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                English
              </button>
              <button
                type="button"
                id="btn-doc-lang-hi"
                onClick={() => setDocLang('hi')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  docLang === 'hi' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                हिंदी (Hindi)
              </button>
            </div>

            <button
              type="button"
              id="btn-toggle-doc-logs"
              onClick={() => setShowLogs(!showLogs)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <History className="w-4 h-4 text-slate-500" />
              <span>{showLogs ? 'लॉग लपवा' : 'नोंदवही / Logs'} ({documentLogs.length})</span>
            </button>

            {/* Edit Certificate Details Button */}
            <button
              type="button"
              id="btn-open-edit-doc-modal"
              onClick={() => setIsEditModalOpen(true)}
              disabled={!selectedStudent}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-bold shadow-md flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>{docLang === 'mr' ? 'दाखला संपादित करा (Edit)' : docLang === 'hi' ? 'दाखिला संपादित करें (Edit)' : 'Edit Certificate'}</span>
            </button>

            <button
              type="button"
              id="btn-print-certificate"
              onClick={handlePrint}
              disabled={!selectedStudent}
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-bold shadow-md flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{docLang === 'mr' ? 'प्रिंट करा (Print)' : docLang === 'hi' ? 'प्रिंट करें (Print)' : 'Print Certificate'}</span>
            </button>
          </div>
        </div>

        {/* 3 Document Selection Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Tab 1: Transfer Certificate */}
          <button
            type="button"
            id="tab-btn-tc"
            onClick={() => handleTabChange('tc')}
            className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
              currentTab === 'tc'
                ? 'bg-blue-50 border-blue-600 text-blue-950 font-bold shadow-xs'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className={`p-2.5 rounded-lg ${currentTab === 'tc' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold leading-tight">School Leaving (T.C.)</p>
              <p className="text-[11px] text-slate-500">शाळा सोडल्याचा दाखला / T.C.</p>
            </div>
          </button>

          {/* Tab 2: Bonafide */}
          <button
            type="button"
            id="tab-btn-bonafide"
            onClick={() => handleTabChange('bonafide')}
            className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
              currentTab === 'bonafide'
                ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold shadow-xs'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className={`p-2.5 rounded-lg ${currentTab === 'bonafide' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold leading-tight">Bonafide Certificate</p>
              <p className="text-[11px] text-slate-500">बोनाफाईड प्रमाणपत्र</p>
            </div>
          </button>

          {/* Tab 3: Nirgam Utara */}
          <button
            type="button"
            id="tab-btn-nirgam"
            onClick={() => handleTabChange('nirgam-utara')}
            className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
              currentTab === 'nirgam-utara'
                ? 'bg-purple-50 border-purple-600 text-purple-950 font-bold shadow-xs'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className={`p-2.5 rounded-lg ${currentTab === 'nirgam-utara' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <Scroll className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold leading-tight">Nirgam Utara (GR Extract)</p>
              <p className="text-[11px] text-slate-500">जनरल रजिस्टर उतारा</p>
            </div>
          </button>
        </div>

        {/* Student Selector & Dynamic Customization Controls */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Select Student */}
          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 uppercase mb-1">
              विद्यार्थी निवडा / Select Student: <span className="text-red-500">*</span>
            </label>
            <select
              id="select-doc-student"
              value={selectedStudentId}
              onChange={(e) => handleSelectStudent(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600"
            >
              {students.map((stu) => (
                <option key={stu.id || stu.studentId} value={stu.id || stu.studentId}>
                  GR #{stu.grNumber} — {stu.studentName} (Class {stu.admissionClass})
                </option>
              ))}
            </select>
          </div>

          {/* Issue Date */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              दिनांक / Issue Date:
            </label>
            <input
              id="input-doc-issue-date"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Serial / Ref Number */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              दाखला / जावक क्र. (Serial No):
            </label>
            <input
              id="input-doc-serial-number"
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="e.g. TC-2026/084"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Contextual Inputs based on Tab */}
          {currentTab === 'bonafide' && (
            <div className="sm:col-span-4">
              <label className="block font-bold text-slate-700 uppercase mb-1">
                बोनाफाईड प्रमाणपत्र कारण (Purpose of Bonafide):
              </label>
              <input
                id="input-doc-bonafide-purpose"
                type="text"
                value={bonafidePurpose}
                onChange={(e) => setBonafidePurpose(e.target.value)}
                placeholder={docLang === 'mr' ? 'उदा. शैक्षणिक / शासकीय कामासाठी व शिष्यवृत्ती अर्जासाठी' : docLang === 'hi' ? 'उदा. शैक्षणिक / छात्रवृत्ति आवेदन हेतु' : 'e.g. Educational & Scholarship Application'}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-600"
              />
            </div>
          )}

          {currentTab === 'tc' && (
            <>
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  शाळा सोडण्याचे कारण (Reason for Leaving):
                </label>
                <input
                  id="input-doc-leaving-reason"
                  type="text"
                  value={leavingReason}
                  onChange={(e) => setLeavingReason(e.target.value)}
                  placeholder={docLang === 'mr' ? 'उदा. पालकांची बदली / पुढील शिक्षणासाठी' : docLang === 'hi' ? 'उदा. अभिभावक का स्थानांतरण' : 'e.g. Parent Transfer to Another City'}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  वर्तणूक व स्वभाव (Conduct):
                </label>
                <input
                  id="input-doc-conduct"
                  type="text"
                  value={conduct}
                  onChange={(e) => setConduct(e.target.value)}
                  placeholder={docLang === 'mr' ? 'उदा. उत्तम व आज्ञाधारक' : docLang === 'hi' ? 'उदा. उत्तम एवं आज्ञाकारी' : 'e.g. Good & Obedient'}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  अभ्यासातील प्रगती (Progress):
                </label>
                <input
                  id="input-doc-progress"
                  type="text"
                  value={progress}
                  onChange={(e) => setProgress(e.target.value)}
                  placeholder={docLang === 'mr' ? 'उदा. समाधानकारक / उत्तम' : docLang === 'hi' ? 'उदा. संतोषजनक / उत्तम' : 'e.g. Good / First Class'}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </>
          )}

          {currentTab === 'nirgam-utara' && (
            <div className="sm:col-span-4">
              <label className="block font-bold text-slate-700 uppercase mb-1">
                उतारा अर्जदार नाव / संदर्भ (Applicant Name / Reference):
              </label>
              <input
                id="input-doc-applicant-name"
                type="text"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                placeholder="उदा. अर्जदार पालक: श्री. राजेश देशमुख"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
              />
            </div>
          )}
        </div>

        {/* Issuance History Drawer */}
        {showLogs && (
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-blue-600" />
              <span>Recently Issued Certificates Register</span>
            </h4>

            {documentLogs.length === 0 ? (
              <p className="text-xs text-slate-500">No documents issued yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs bg-white rounded-lg border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2">Type</th>
                      <th className="p-2">GR No</th>
                      <th className="p-2">Student Name</th>
                      <th className="p-2">Class</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Issued By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {documentLogs.slice(0, 8).map((log, idx) => (
                      <tr key={log.id || idx}>
                        <td className="p-2 font-bold text-blue-800">{log.documentType}</td>
                        <td className="p-2 font-mono">{log.grNumber}</td>
                        <td className="p-2 font-semibold">{log.studentName}</td>
                        <td className="p-2">Class {log.studentClass}</td>
                        <td className="p-2">{formatDate(log.issuedDate)}</td>
                        <td className="p-2 text-slate-500">{log.issuedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Notification Toast */}
        {notification && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 font-bold text-xs flex items-center justify-between shadow-xs animate-in fade-in-50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notification}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-emerald-700 hover:text-emerald-950 font-bold text-xs"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Quick Action & Live Certificate Preview / Print Canvas */}
      {selectedStudent ? (
        <div className="space-y-4">
          
          {/* Quick Action Bar above Canvas (Hidden in print) */}
          <div className="bg-slate-900 text-white rounded-xl p-3.5 sm:px-5 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md border border-slate-800 print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
              <div>
                <p className="text-xs sm:text-sm font-black tracking-wide flex items-center gap-2">
                  <span>
                    {currentTab === 'tc' && 'शाळा सोडल्याचा दाखला (T.C.)'}
                    {currentTab === 'bonafide' && 'बोनाफाईड प्रमाणपत्र (Bonafide)'}
                    {currentTab === 'nirgam-utara' && 'जनरल रजिस्टर निर्गम उतारा (Nirgam Utara)'}
                  </span>
                  <span className="text-blue-300 font-mono text-xs font-bold bg-blue-900/60 px-2 py-0.5 rounded border border-blue-700/50">
                    GR #{selectedStudent.grNumber}
                  </span>
                  <span className="text-slate-300 font-medium text-xs hidden md:inline">
                    ({selectedStudent.studentName})
                  </span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {docLang === 'mr' 
                    ? 'प्रिंट काढण्यापूर्वी दाखल्यातील कोणत्याही माहितीत दुरुस्ती किंवा बदल करण्यासाठी "माहिती संपादित करा" बटण वापरा.' 
                    : 'To make any corrections or changes before printing, click the "Edit Details" button.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                id="btn-canvas-edit"
                onClick={() => setIsEditModalOpen(true)}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{docLang === 'mr' ? 'माहिती संपादित करा (Edit)' : 'Edit Details'}</span>
              </button>

              <button
                type="button"
                id="btn-canvas-print"
                onClick={handlePrint}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{docLang === 'mr' ? 'प्रिंट करा (Print)' : 'Print'}</span>
              </button>
            </div>
          </div>

          {/* Certificate Print Paper Canvas */}
          <div className="p-2 sm:p-4 bg-slate-200/60 rounded-2xl border border-slate-300/80 shadow-inner flex justify-center">
            {currentTab === 'tc' && (
              <TransferCertificate
                student={selectedStudent}
                serialNumber={serialNumber}
                issueDate={issueDate}
                leavingReason={leavingReason}
                conduct={conduct}
                progress={progress}
                lang={docLang}
                onEdit={() => setIsEditModalOpen(true)}
              />
            )}

            {currentTab === 'bonafide' && (
              <BonafideCertificate
                student={selectedStudent}
                issueDate={issueDate}
                purpose={bonafidePurpose}
                serialNumber={serialNumber}
                lang={docLang}
                onEdit={() => setIsEditModalOpen(true)}
              />
            )}

            {currentTab === 'nirgam-utara' && (
              <NirgamUtara
                student={selectedStudent}
                extractNumber={serialNumber}
                issueDate={issueDate}
                applicantName={applicantName}
                lang={docLang}
                onEdit={() => setIsEditModalOpen(true)}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-sm text-slate-500">Please select or register a student to generate documents.</p>
        </div>
      )}

      {/* Certificate Live Edit Modal */}
      {selectedStudent && (
        <CertificateEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          student={selectedStudent}
          currentDocType={currentTab}
          customFields={{
            serialNumber,
            issueDate,
            bonafidePurpose,
            leavingReason,
            conduct,
            progress,
            applicantName
          }}
          onApplyChanges={handleApplyModalChanges}
          lang={docLang}
        />
      )}

    </div>
  );
}
