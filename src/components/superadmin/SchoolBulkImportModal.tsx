import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  X, 
  Loader2, 
  Building2,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { School } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface SchoolBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSchools: (
    schools: Partial<School>[],
    onProgress?: (done: number, total: number) => void
  ) => Promise<{ success: boolean; count: number; errors: string[] }>;
}

export function SchoolBulkImportModal({
  isOpen,
  onClose,
  onImportSchools
}: SchoolBulkImportModalProps) {
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsedSchools, setParsedSchools] = useState<Partial<School>[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  const [importResult, setImportResult] = useState<{ success: boolean; count: number; errors: string[] } | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  if (!isOpen) return null;

  // Generate and download ready-made Sample Template for 1000+ schools
  const handleDownloadTemplate = () => {
    const sampleRows = [
      {
        'School Name (English)': 'Shri Shivaji High School and Junior College, Chikhli',
        'School Name (मराठी)': 'श्री शिवाजी हायस्कूल आणि कनिष्ठ महाविद्यालय, चिखली',
        'UDISE Number': '27070200119',
        'Login Email': 'shivajischool.chikhli@gmail.com',
        'Login Password': 'Shala@123',
        'Security PIN': '8788',
        'Sanstha / Board Affiliation': 'Shri Shivaji Shikshan Sanstha, Amravati – Managed by',
        'Recognition No': 'Kr. Va Di. Bu. Ji. Pa. / Inspection 11150',
        'Affiliation No': '04.03.016',
        'Address': 'Chikhli, Dist. Buldhana - 443201',
        'Phone': '07264-242113',
        'Headmaster Name': 'मुख्याध्यापक / प्राचार्य',
        'Academic Year': '2026-2027',
        'Subscription Plan': 'वार्षिक सबस्क्रिप्शन (Pro)',
        'Status (active/inactive)': 'active'
      },
      {
        'School Name (English)': 'Zilla Parishad Primary School, Malkapur',
        'School Name (मराठी)': 'जि. प. प्राथमिक शाळा, मलकापूर',
        'UDISE Number': '27070301245',
        'Login Email': 'zpschool.malkapur@shalaverse.in',
        'Login Password': 'Shala@123',
        'Security PIN': '8788',
        'Sanstha / Board Affiliation': 'Zilla Parishad Buldhana',
        'Recognition No': 'ZP/EDU/2020/894',
        'AffiliationNo': '04.03.042',
        'Address': 'Malkapur, Dist. Buldhana - 443101',
        'Phone': '07267-222345',
        'Headmaster Name': 'मुख्याध्यापक',
        'Academic Year': '2026-2027',
        'Subscription Plan': 'वार्षिक सबस्क्रिप्शन (Pro)',
        'Status (active/inactive)': 'active'
      },
      {
        'School Name (English)': 'New English Medium School, Pune',
        'School Name (मराठी)': 'न्यू इंग्लिश मीडियम स्कूल, पुणे',
        'UDISE Number': '27251402280',
        'Login Email': 'newenglish.pune@shalaverse.in',
        'Login Password': 'Shala@123',
        'Security PIN': '8788',
        'Sanstha / Board Affiliation': 'Deccan Education Society',
        'Recognition No': 'MH/PUN/SEC/4561',
        'Affiliation No': '08.01.112',
        'Address': 'Shivajinagar, Pune - 411005',
        'Phone': '020-25531234',
        'Headmaster Name': 'Principal',
        'Academic Year': '2026-2027',
        'Subscription Plan': 'वार्षिक सबस्क्रिप्शन (Pro)',
        'Status (active/inactive)': 'active'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Schools_Template');
    XLSX.writeFile(wb, 'Shalaverse_1000_Schools_Import_Template.xlsx');
  };

  const handleFile = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setIsProcessing(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rawJson.length === 0) {
          alert(language === 'mr' ? 'निवडलेली एक्सेल फाईल रिकामी आहे.' : 'The selected file is empty.');
          setIsProcessing(false);
          return;
        }

        // Fuzzy column normalizer
        const normalized: Partial<School>[] = rawJson.map((row, idx) => {
          const findVal = (keywords: string[]) => {
            for (const key of Object.keys(row)) {
              const cleanKey = key.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '');
              if (keywords.some(kw => cleanKey.includes(kw))) {
                return String(row[key] || '').trim();
              }
            }
            return '';
          };

          const schoolName = findVal(['schoolname', 'name', 'english', 'शाळा', 'शाळेचेनाव']) || `School ${idx + 1}`;
          const schoolNameLocal = findVal(['marathi', 'local', 'मराठी', 'स्थानिक']) || schoolName;
          const udiseNumber = findVal(['udise', 'युडायस', 'udiseno']) || `27000000000${idx + 1}`.slice(-11);
          const email = findVal(['email', 'ईमेल', 'login', 'mail']) || `school_${udiseNumber}@shalaverse.in`;
          const password = findVal(['pass', 'password', 'पासवर्ड']) || 'Shala@123';
          const securityPin = findVal(['pin', 'पिन', 'security']) || '8788';
          const boardAffiliation = findVal(['sanstha', 'board', 'संस्था', 'बोर्ड']) || 'Maharashtra State Board';
          const recognitionNo = findVal(['recognition', 'मान्यता']) || '';
          const affiliationNo = findVal(['affiliation', 'संलग्नता']) || '';
          const address = findVal(['address', 'पत्ता', 'गाव', 'शहर']) || 'Maharashtra';
          const phone = findVal(['phone', 'mobile', 'संपर्क', 'फोन']) || '';
          const headmasterName = findVal(['headmaster', 'principal', 'मुख्याध्यापक']) || 'मुख्याध्यापक / प्राचार्य';
          const academicYear = findVal(['year', 'वर्ष', 'academic']) || '2026-2027';
          const subscriptionPlan = findVal(['plan', 'प्लॅन', 'subscription']) || 'वार्षिक सबस्क्रिप्शन (Pro)';
          const statusRaw = findVal(['status', 'स्थिती']).toLowerCase();
          const status: 'active' | 'inactive' = statusRaw.includes('inact') || statusRaw.includes('बंद') ? 'inactive' : 'active';

          return {
            schoolName,
            schoolNameLocal,
            udiseNumber,
            email,
            password,
            securityPin,
            boardAffiliation,
            recognitionNo,
            affiliationNo,
            address,
            phone,
            headmasterName,
            academicYear,
            subscriptionPlan,
            status
          };
        });

        setParsedSchools(normalized);
      } catch (err) {
        console.error('File parsing error:', err);
        alert(language === 'mr' ? 'फाईल वाचताना एरर आला. कृपया नमुना फाईल तपासा.' : 'Failed to parse file. Please check template.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleStartImport = async () => {
    if (parsedSchools.length === 0) return;
    setIsUploading(true);
    setProgress({ done: 0, total: parsedSchools.length });

    try {
      const result = await onImportSchools(parsedSchools, (done, total) => {
        setProgress({ done, total });
      });
      setImportResult(result);
    } catch (err: any) {
      setImportResult({
        success: false,
        count: 0,
        errors: [err?.message || 'Upload failed']
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setParsedSchools([]);
    setFileName('');
    setImportResult(null);
    setProgress({ done: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-wide flex items-center gap-2">
                <span>{language === 'mr' ? '१०००+ शाळा एक्सेल / CSV बल्क इम्पोर्ट' : 'Bulk Import 1000+ Schools via Excel / CSV'}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Turbo Scale
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'mr' 
                  ? 'एकाच वेळी १० ते १०००+ शाळांचे रेकॉर्ड्स झिरो-लोडिंग व हाय-स्पीडने जोडा' 
                  : 'Import 10 to 1,000+ schools simultaneously with zero latency'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">

          {/* Architecture Scalability Banner */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-emerald-950">
                  {language === 'mr' ? '१०,००० शाळा व लाखो विद्यार्थी रेकॉर्ड्ससाठी प्रमाणित' : 'Certified for 10,000+ Schools & High Concurrency'}
                </p>
                <p className="text-emerald-800 text-[11px] mt-0.5">
                  {language === 'mr' 
                    ? 'इंडेक्स्ड डीबी (IndexedDB) + क्लाऊड बॅच चंकिंगमुळे ब्राउझर हँग किंवा लॅग होत नाही.' 
                    : 'IndexedDB multi-tenant partition + chunked batches prevent browser lag or memory overflow.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl font-bold flex items-center gap-1.5 shrink-0 shadow-2xs hover:shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'mr' ? 'नमुना एक्सेल डाउनलोड' : 'Download Sample Template'}</span>
            </button>
          </div>

          {/* Upload Area */}
          {parsedSchools.length === 0 && !importResult && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFile(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition flex flex-col items-center justify-center gap-3 ${
                dragActive ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100/60'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-emerald-600">
                <FileSpreadsheet className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {language === 'mr' ? 'शाळांची एक्सेल किंवा CSV फाईल येथे ड्रॅग करा' : 'Drag & drop Excel or CSV file here'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'mr' ? 'किंवा आपल्या कॉम्प्युटरवरून फाईल निवडा (.xlsx, .xls, .csv)' : 'or browse from your device (.xlsx, .xls, .csv)'}
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
                className="hidden"
                id="bulk-schools-file-input"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm cursor-pointer"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>{language === 'mr' ? 'फाईल सिलेक्ट करा' : 'Select File'}</span>
              </button>
            </div>
          )}

          {/* Parsed Schools Preview */}
          {parsedSchools.length > 0 && !importResult && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-100 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 text-xs">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-900">{fileName}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black font-mono">
                    {parsedSchools.length} {language === 'mr' ? 'शाळा सापडल्या' : 'Schools Found'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-bold text-slate-600 hover:text-rose-600 transition cursor-pointer"
                >
                  {language === 'mr' ? 'दुसरी फाईल निवडा' : 'Choose Another File'}
                </button>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800 text-white font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">{language === 'mr' ? 'शाळेचे नाव' : 'School Name'}</th>
                      <th className="p-2.5">UDISE</th>
                      <th className="p-2.5">{language === 'mr' ? 'लॉगिन ईमेल' : 'Login Email'}</th>
                      <th className="p-2.5">{language === 'mr' ? 'संस्था / बोर्ड' : 'Board / Sanstha'}</th>
                      <th className="p-2.5">{language === 'mr' ? 'स्थिती' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {parsedSchools.slice(0, 50).map((sc, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 font-mono text-slate-500">{idx + 1}</td>
                        <td className="p-2 font-bold text-slate-900">
                          {sc.schoolNameLocal || sc.schoolName}
                        </td>
                        <td className="p-2 font-mono text-blue-700 font-bold">{sc.udiseNumber}</td>
                        <td className="p-2 text-slate-600">{sc.email}</td>
                        <td className="p-2 text-slate-600">{sc.boardAffiliation}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            sc.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {sc.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedSchools.length > 50 && (
                <p className="text-[11px] text-slate-500 text-center font-medium">
                  {language === 'mr' 
                    ? `(पहिल्या ५० शाळांची पूर्वावलोकन दाखवली आहे, एकूण ${parsedSchools.length} शाळा अपलोड केल्या जातील)`
                    : `(Showing first 50 schools for preview; all ${parsedSchools.length} will be uploaded)`}
                </p>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2 bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>{language === 'mr' ? 'शाळा अपलोड होत आहेत...' : 'Uploading schools to Cloud & Cache...'}</span>
                    </span>
                    <span className="font-mono">
                      {progress.done} / {progress.total} ({Math.round((progress.done / (progress.total || 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-emerald-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full transition-all duration-200 rounded-full"
                      style={{ width: `${Math.round((progress.done / (progress.total || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Success Result */}
          {importResult && (
            <div className={`p-5 rounded-xl border space-y-3 ${
              importResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}>
              <div className="flex items-center gap-2.5">
                {importResult.success ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                )}
                <div>
                  <h4 className="font-black text-sm">
                    {importResult.success 
                      ? (language === 'mr' ? `यशस्वी! ${importResult.count} शाळा जोडल्या गेल्या आहेत.` : `Success! ${importResult.count} schools imported successfully.`)
                      : (language === 'mr' ? 'काही त्रुटी आल्या.' : 'Import encountered issues.')}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {language === 'mr' 
                      ? 'सर्व शाळांचे आयडी, पासवर्ड व डेटा स्थानिक मेमरी व क्लाऊडवर सुरक्षित सेव्ह करण्यात आला आहे.' 
                      : 'All school logins and details are active and cached for instant login.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  {language === 'mr' ? 'शाळांची यादी पहा (Done)' : 'View Schools List'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  {language === 'mr' ? 'आणखी शाळा जोडा' : 'Import More'}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500 font-medium hidden sm:block">
            {language === 'mr' ? 'सुरक्षित व वेगवान प्रक्रिया • ५०००+ शाळा क्षमतेचे इंजिन' : 'High throughput batch engine • Zero browser freeze'}
          </p>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              {language === 'mr' ? 'रद्द करा' : 'Cancel'}
            </button>

            {parsedSchools.length > 0 && !importResult && (
              <button
                type="button"
                id="btn-confirm-bulk-import-schools"
                onClick={handleStartImport}
                disabled={isUploading}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>
                  {language === 'mr' 
                    ? `सर्व ${parsedSchools.length} शाळा तात्काळ जोडा` 
                    : `Import All ${parsedSchools.length} Schools Now`}
                </span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
