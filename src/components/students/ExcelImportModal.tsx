import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Layers, 
  Database,
  RefreshCw,
  Eye,
  Sliders
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student, AdmissionClass } from '../../types';
import { studentService } from '../../services/studentService';
import { deduplicateRepeatedPhrase } from '../../utils/devanagariUtils';
import { normalizeClass } from '../../utils/exportUtils';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (count: number) => void;
  initialFile?: File | null;
}

interface ColumnOption {
  key: string;
  label: string;
  field: keyof Student;
  required?: boolean;
}

const REQUIRED_COLUMNS: ColumnOption[] = [
  { key: 'studentName', label: 'Student Name', field: 'studentName', required: true },
  { key: 'grNumber', label: 'GR Number', field: 'grNumber', required: true },
  { key: 'admissionClass', label: 'Admission Class', field: 'admissionClass' },
  { key: 'admissionYear', label: 'Admission Year', field: 'admissionYear' },
  { key: 'admissionDate', label: 'Admission Date', field: 'admissionDate' },
  { key: 'birthDate', label: 'Birth Date (DOB)', field: 'birthDate' },
  { key: 'fatherName', label: "Father's Name", field: 'fatherName' },
  { key: 'motherName', label: "Mother's Name", field: 'motherName' },
  { key: 'mobile', label: 'Mobile Number', field: 'mobile' },
  { key: 'caste', label: 'Caste / Category', field: 'caste' },
  { key: 'uid', label: 'Aadhaar / UID', field: 'uid' },
  { key: 'address', label: 'Address / Village', field: 'address' }
];

export function ExcelImportModal({
  isOpen,
  onClose,
  onImportSuccess,
  initialFile
}: ExcelImportModalProps) {
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  
  const [rawRows, setRawRows] = useState<any[][]>([]);
  const [headerRowIdx, setHeaderRowIdx] = useState<number>(0);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, number>>({});
  
  const [parsedStudents, setParsedStudents] = useState<Partial<Student>[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const cancelTokenRef = useRef<{ isCancelled: boolean }>({ isCancelled: false });
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; pct: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'mapping'>('preview');

  const resetInternalState = () => {
    setWorkbook(null);
    setSheetNames([]);
    setSelectedSheet('');
    setRawRows([]);
    setHeaderRowIdx(0);
    setDetectedHeaders([]);
    setColumnMapping({});
    setParsedStudents([]);
    setIsProcessing(false);
    setIsImporting(false);
    setIsCancelling(false);
    setImportProgress(null);
    setActiveTab('preview');
  };

  const handleCancelOrClose = () => {
    if (isImporting || isProcessing) {
      cancelTokenRef.current.isCancelled = true;
      setIsCancelling(true);
      setTimeout(() => {
        resetInternalState();
        onClose();
      }, 150);
      return;
    }
    resetInternalState();
    onClose();
  };

  // Load File when opened
  useEffect(() => {
    if (initialFile && isOpen) {
      loadFile(initialFile);
    }
  }, [initialFile, isOpen]);

  const loadFile = (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);
        
        if (wb.SheetNames.length > 0) {
          const firstSheet = wb.SheetNames[0];
          setSelectedSheet(firstSheet);
          processSheet(wb, firstSheet);
        }
      } catch (err) {
        console.error('Failed to parse excel file:', err);
        alert('Could not open Excel file. Please choose a valid .xlsx or .csv file.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const processSheet = (wb: XLSX.WorkBook, sheetName: string) => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;

    const matrix: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    setRawRows(matrix);

    if (matrix.length === 0) {
      setParsedStudents([]);
      return;
    }

    // Auto-detect header row
    const keywords = ['नाव', 'name', 'gr', 'जीआर', 'student', 'विद्यार्थी', 'class', 'वर्ग', 'इयत्ता', 'birth', 'जन्म', 'father', 'आई', 'mother'];
    let bestRowIdx = 0;
    let maxMatch = 0;

    for (let r = 0; r < Math.min(matrix.length, 12); r++) {
      const row = matrix[r] || [];
      let count = 0;
      row.forEach(cell => {
        const cStr = String(cell || '').toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '');
        if (keywords.some(kw => cStr.includes(kw))) {
          count++;
        }
      });
      if (count > maxMatch) {
        maxMatch = count;
        bestRowIdx = r;
      }
    }

    setHeaderRowIdx(bestRowIdx);
    const headers = (matrix[bestRowIdx] || []).map((h, i) => String(h || `Column ${i + 1}`).trim());
    setDetectedHeaders(headers);

    // Build auto mapping
    const mapping: Record<string, number> = {};
    const findIdx = (terms: string[]) => {
      return headers.findIndex(h => {
        const clean = h.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '');
        return terms.some(t => clean.includes(t.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '')));
      });
    };

    mapping['studentName'] = findIdx(['studentfullname', 'studentname', 'fullname', 'name', 'विद्यार्थ्याचेनाव', 'विद्यार्थ्यांचेनाव', 'संपूर्णनाव', 'नाव', 'विद्यार्थीनाव', 'विद्यार्थी']);
    mapping['grNumber'] = findIdx(['grno', 'grnum', 'gr', 'generalregister', 'जीआर', 'दाखलक्र', 'दाखलक्रमांक', 'जनरलरजिस्टर', 'रजिस्टरनं', 'srno', 'अनुक्रमांक']);
    mapping['admissionClass'] = findIdx(['admissionclass', 'class', 'standard', 'std', 'इयत्ता', 'वर्ग', 'प्रवेशवर्ग']);
    mapping['admissionYear'] = findIdx(['admissionyear', 'academicyear', 'year', 'प्रवेशवर्ष', 'शैक्षणिकवर्ष', 'वर्ष']);
    mapping['admissionDate'] = findIdx(['admissiondate', 'admdate', 'dateofadmission', 'प्रवेशदिनांक', 'दाखलदिनांक', 'प्रवेशतारीख']);
    mapping['birthDate'] = findIdx(['dateofbirth', 'birthdate', 'dob', 'जन्मतारीख', 'जन्मदिनांक', 'जन्म']);
    mapping['fatherName'] = findIdx(['fathername', 'father', 'guardian', 'वडिलांचेनाव', 'पालकांचेनाव', 'वडील']);
    mapping['motherName'] = findIdx(['mothername', 'mother', 'आईचेनाव', 'आई']);
    mapping['mobile'] = findIdx(['mobile', 'phone', 'contact', 'मोबाईलनंबर', 'मोबाईल', 'फोन']);
    mapping['caste'] = findIdx(['caste', 'category', 'जात', 'प्रवर्ग']);
    mapping['uid'] = findIdx(['uid', 'aadhaar', 'aadhar', 'आधारकार्ड', 'आधारनंबर', 'आधार']);
    mapping['address'] = findIdx(['address', 'पत्ता', 'रहिवासीपत्ता', 'गाव']);

    setColumnMapping(mapping);
    generateStudentsFromMatrix(matrix, bestRowIdx, mapping);
  };

  const generateStudentsFromMatrix = (matrix: any[][], headerIdx: number, mapping: Record<string, number>) => {
    const students: Partial<Student>[] = [];
    const validClasses: AdmissionClass[] = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

    for (let r = headerIdx + 1; r < matrix.length; r++) {
      const row = matrix[r];
      if (!row || !Array.isArray(row) || row.length === 0) continue;

      const getVal = (field: string) => {
        const colIdx = mapping[field];
        if (colIdx !== undefined && colIdx >= 0 && colIdx < row.length) {
          return String(row[colIdx] || '').trim();
        }
        return '';
      };

      const nameVal = getVal('studentName');
      const grVal = getVal('grNumber');

      // Skip empty row
      if (!nameVal && !grVal && !row.some(c => String(c).trim().length > 0)) {
        continue;
      }

      // Normalize Class
      const matchedClass: AdmissionClass = normalizeClass(getVal('admissionClass'));

      // Dates parsing
      let rawDob = getVal('birthDate') || '2015-05-10';
      if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(rawDob)) {
        const parts = rawDob.split(/[\/\-\.]/);
        rawDob = `${parts[2].length === 2 ? '20' + parts[2] : parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }

      students.push({
        grNumber: grVal || `GR-${1000 + students.length + 1}`,
        studentId: `20252704020${(100 + students.length + 1).toString().padStart(4, '0')}`,
        studentName: deduplicateRepeatedPhrase(nameVal || `विद्यार्थी ${students.length + 1}`),
        fatherName: deduplicateRepeatedPhrase(getVal('fatherName')),
        motherName: deduplicateRepeatedPhrase(getVal('motherName')),
        admissionClass: matchedClass,
        admissionYear: getVal('admissionYear') || '2025-2026',
        admissionDate: getVal('admissionDate') || '2025-06-16',
        birthDate: rawDob,
        birthPlace: 'चिखली',
        nationality: 'Indian (भारतीय)',
        motherTongue: 'मराठी',
        religion: 'Hindu (हिंदू)',
        caste: getVal('caste') || 'Maratha (मराठा)',
        subCaste: '',
        uid: getVal('uid').replace(/[^0-9]/g, ''),
        mobile: getVal('mobile').replace(/[^0-9]/g, ''),
        address: getVal('address') || 'मु. पो. चिखली, ता. चिखली, जि. बुलढाणा',
        previousSchool: 'जि. प. प्राथमिक शाळा',
        academicProgress: 'Good (चांगली)',
        behaviour: 'Good (उत्तम)',
        leavingReason: '',
        certificateDate: ''
      });
    }

    setParsedStudents(students);
  };

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (workbook) {
      processSheet(workbook, sheetName);
    }
  };

  const handleMappingChange = (field: string, colIdx: number) => {
    const updated = { ...columnMapping, [field]: colIdx };
    setColumnMapping(updated);
    generateStudentsFromMatrix(rawRows, headerRowIdx, updated);
  };

  const handleConfirmImport = async () => {
    if (parsedStudents.length === 0) {
      alert('No student records found to import.');
      return;
    }

    cancelTokenRef.current = { isCancelled: false };
    setIsImporting(true);
    setIsProcessing(true);
    setIsCancelling(false);
    setImportProgress({ current: 0, total: parsedStudents.length, pct: 0 });

    try {
      const result = await studentService.importBackupData(
        parsedStudents,
        (current, total) => {
          const pct = Math.min(100, Math.round((current / (total || 1)) * 100));
          setImportProgress({ current, total, pct });
        },
        cancelTokenRef.current
      );

      if (result.cancelled) {
        setIsImporting(false);
        setIsProcessing(false);
        setIsCancelling(false);
        setImportProgress(null);
        resetInternalState();
        onClose();
        return;
      }

      setTimeout(() => {
        setIsImporting(false);
        setIsProcessing(false);
        setIsCancelling(false);
        setImportProgress(null);
        onImportSuccess(result.added);
        resetInternalState();
        onClose();
      }, 300);
    } catch (err) {
      console.error('Import error:', err);
      alert('Error importing student data. Please try again.');
      setIsImporting(false);
      setIsProcessing(false);
      setIsCancelling(false);
    }
  };

  if (!isOpen) return null;

  // Active Progress View (matching the delete progress modal in user's request)
  if (isImporting) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5 text-emerald-600">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Import Students</h3>
                <p className="text-xs text-slate-500">
                  Total Records: <span className="font-bold text-emerald-600">{parsedStudents.length}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              id="btn-close-importing-x"
              onClick={handleCancelOrClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer transition"
              title="Cancel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body: Progress Card */}
          <div className="py-4">
            <div className="space-y-4 p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
                <span>Importing Student Records</span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                Importing <strong>{parsedStudents.length} student records</strong> into the General Register. Please wait...
              </p>

              {/* Progress Indicator */}
              <div className="space-y-1.5 p-3 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                <div className="flex justify-between text-xs font-semibold text-emerald-900">
                  <span>Importing...</span>
                  <span>
                    {importProgress?.current || 0} / {importProgress?.total || parsedStudents.length} Records ({importProgress?.pct || 0}%)
                  </span>
                </div>
                <div className="w-full bg-emerald-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2.5 rounded-full transition-all duration-150"
                    style={{ width: `${importProgress?.pct || 0}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  disabled
                  className="flex-1 py-2.5 px-4 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs opacity-90 cursor-not-allowed"
                >
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Importing...</span>
                </button>
                <button
                  type="button"
                  id="btn-cancel-import-progress"
                  onClick={handleCancelOrClose}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700"
                >
                  <span>{isCancelling ? 'Cancelling...' : 'Cancel'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Import Students (Excel / CSV)
              </h2>
              <p className="text-xs text-slate-400">
                {parsedStudents.length > 0 
                  ? `${parsedStudents.length} student records found` 
                  : 'Check and verify your Excel file'}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-import-modal-close-x"
            onClick={handleCancelOrClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sheet Selector & Tabs */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Sheet:</span>
            <select
              value={selectedSheet}
              onChange={(e) => handleSheetChange(e.target.value)}
              disabled={isProcessing || sheetNames.length <= 1}
              className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              {sheetNames.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-300">
              {parsedStudents.length} Students Detected
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-200 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'preview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Data Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('mapping')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'mapping' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Column Settings</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'preview' ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Previewing first 10 of {parsedStudents.length} records:
                </h4>
                <span className="text-[11px] text-slate-500">
                  Click the Import button below to save these records.
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2.5">#</th>
                        <th className="px-3 py-2.5">GR No</th>
                        <th className="px-3 py-2.5">Student Name</th>
                        <th className="px-3 py-2.5">Class</th>
                        <th className="px-3 py-2.5">Birth Date</th>
                        <th className="px-3 py-2.5">Father's Name</th>
                        <th className="px-3 py-2.5">Mobile</th>
                        <th className="px-3 py-2.5">Caste</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {parsedStudents.slice(0, 10).map((st, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="px-3 py-2 font-bold text-blue-700">{st.grNumber}</td>
                          <td className="px-3 py-2 font-semibold text-slate-900">{st.studentName}</td>
                          <td className="px-3 py-2">{st.admissionClass}</td>
                          <td className="px-3 py-2 font-mono text-slate-600">{st.birthDate}</td>
                          <td className="px-3 py-2 text-slate-600">{st.fatherName || '-'}</td>
                          <td className="px-3 py-2 font-mono text-slate-600">{st.mobile || '-'}</td>
                          <td className="px-3 py-2 text-slate-600">{st.caste || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-900 leading-relaxed">
                  Match Excel columns to student database fields below if auto-detection missed any.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {REQUIRED_COLUMNS.map((col) => {
                  const currentIdx = columnMapping[col.key] ?? -1;
                  return (
                    <div key={col.key} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        {col.label} {col.required && <span className="text-rose-600">*</span>}
                      </label>
                      <select
                        value={currentIdx}
                        onChange={(e) => handleMappingChange(col.key, parseInt(e.target.value, 10))}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 font-medium"
                      >
                        <option value={-1}>-- Not Assigned --</option>
                        {detectedHeaders.map((h, i) => (
                          <option key={i} value={i}>
                            {i + 1}. {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            id="btn-import-modal-cancel"
            onClick={handleCancelOrClose}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 shadow-2xs"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>

          <button
            type="button"
            id="btn-import-modal-confirm"
            onClick={handleConfirmImport}
            disabled={isProcessing || parsedStudents.length === 0}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              Import All {parsedStudents.length} Students
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
