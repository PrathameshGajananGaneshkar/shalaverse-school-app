import { Student } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { formatDate, dateToWords } from '../../utils/dateUtils';
import { 
  getLocalizedStudentName, 
  getLocalizedFatherName, 
  getLocalizedMotherName, 
  getLocalizedBirthPlace, 
  getLocalizedNationality, 
  getLocalizedMotherTongue, 
  getLocalizedReligion, 
  getLocalizedCaste, 
  getLocalizedSubCaste, 
  getLocalizedPreviousSchool, 
  getLocalizedClass, 
  getLocalizedProgress, 
  getLocalizedBehaviour, 
  getLocalizedLeavingReason 
} from '../../utils/devanagariUtils';
import { GraduationCap, Edit3 } from 'lucide-react';

interface TransferCertificateProps {
  student: Student;
  serialNumber?: string;
  issueDate?: string;
  leavingReason?: string;
  conduct?: string;
  progress?: string;
  lang?: 'en' | 'mr' | 'hi';
  onEdit?: () => void;
}

export function TransferCertificate({
  student,
  serialNumber = 'TC-2026/084',
  issueDate = new Date().toISOString().split('T')[0],
  leavingReason,
  conduct,
  progress,
  lang = 'mr',
  onEdit
}: TransferCertificateProps) {
  const { settings } = useSettings();

  const finalLeavingReason = leavingReason || student.leavingReason;
  const finalConduct = conduct || student.behaviour;
  const finalProgress = progress || student.academicProgress;

  const placeName = settings.address.includes('Chikhli') ? (
    lang === 'mr' ? 'चिखली (जि. बुलढाणा)' : lang === 'hi' ? 'चिखली (जि. बुलढाणा)' : 'Chikhli (Dist. Buldhana)'
  ) : 'Chikhli';

  return (
    <div className="a4-document-page bg-white text-slate-900 mx-auto w-full max-w-[210mm] min-h-[297mm] p-4 sm:p-6 border-2 border-slate-900 relative font-serif print:border-2 print:border-black print:p-2 print:m-0 print:shadow-none shadow-xl group">
      {/* Quick Edit Overlay Button (Screen only, hidden in print) */}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          title="दाखला माहिती बदला / Edit T.C. Details"
          className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-sans font-black rounded-lg shadow-md flex items-center gap-1.5 transition print:hidden cursor-pointer opacity-90 hover:opacity-100"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{lang === 'mr' ? 'बदल करा (Edit T.C.)' : 'Edit T.C.'}</span>
        </button>
      )}

      {/* Decorative Outer Double Border */}
      <div className="a4-inner-box border border-slate-800 p-3 sm:p-4 flex flex-col justify-between">
        
        {/* Certificate Header */}
        <div className="text-center border-b-2 border-slate-800 pb-2">
          <div className="flex items-center justify-center gap-2.5 mb-1">
            <div className="w-10 h-10 rounded-full border-2 border-slate-900 flex items-center justify-center text-slate-900 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] uppercase font-sans font-semibold tracking-wider text-slate-700">
                {lang === 'mr' 
                  ? 'महाराष्ट्र शासन शालेय शिक्षण व क्रीडा विभाग मान्यताप्राप्त' 
                  : lang === 'hi' 
                  ? 'महाराष्ट्र शासन स्कूल शिक्षा एवं क्रीड़ा विभाग मान्यता प्राप्त' 
                  : (settings.boardAffiliation || 'Recognized by Department of School Education, Maharashtra')}
              </p>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-950 uppercase leading-tight">
                {lang === 'en' ? settings.schoolName : (settings.schoolNameLocal || settings.schoolName)}
              </h1>
              {lang !== 'en' && (
                <p className="text-[11px] font-semibold text-slate-700 font-sans">
                  {settings.schoolName}
                </p>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-700 font-sans">
            {settings.address} • Ph: {settings.phone} • Email: {settings.email}
          </p>

          <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-300 text-[11px] font-sans font-bold">
            <span>UDISE No: <strong className="font-mono text-slate-950">{settings.udiseNumber}</strong></span>
            <span>{lang === 'mr' ? 'मंडळ: महाराष्ट्र राज्य माध्यमिक व उच्च माध्यमिक शिक्षण मंडळ' : lang === 'hi' ? 'बोर्ड: महाराष्ट्र राज्य बोर्ड (SSC/HSC)' : 'Board: SSC / HSC Maharashtra Board'}</span>
            <span>{lang === 'mr' ? 'माध्यम: मराठी / सेमी-इंग्रजी' : lang === 'hi' ? 'माध्यम: मराठी / सेमी-अंग्रेजी' : 'Medium: Marathi / Semi-English'}</span>
          </div>

          {/* Certificate Title Badge */}
          <div className="mt-1.5">
            <div className="inline-block border-2 border-slate-900 px-5 py-0.5 bg-slate-100 font-sans">
              <h2 className="text-sm sm:text-base font-black tracking-wider uppercase text-slate-950">
                {lang === 'mr' && 'शाळा सोडल्याचा दाखला ( TRANSFER CERTIFICATE )'}
                {lang === 'hi' && 'स्थानांतरण प्रमाण पत्र / टी.सी. ( TRANSFER CERTIFICATE )'}
                {lang === 'en' && 'TRANSFER / SCHOOL LEAVING CERTIFICATE'}
              </h2>
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-800">
                {lang === 'mr' && '( नियम १७ व ३१ अन्वये शाळा सोडल्याचे प्रमाणपत्र )'}
                {lang === 'hi' && '( नियम १७ एवं ३१ के अंतर्गत शाला त्याग प्रमाण पत्र )'}
                {lang === 'en' && '( Under Secondary Schools Code Rules 17 & 31 )'}
              </p>
            </div>
          </div>
        </div>

        {/* Certificate Meta Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-sans font-semibold my-1.5 border-b border-slate-200 pb-1.5">
          <div>
            <span>{lang === 'mr' ? 'दाखला / अनुक्रमांक: ' : lang === 'hi' ? 'क्रमांक / संदर्भ: ' : 'Serial / Ref No: '}</span>
            <strong className="text-slate-950 font-mono text-xs underline block">{serialNumber}</strong>
          </div>
          <div>
            <span>{lang === 'mr' ? 'विद्यार्थी आयडी: ' : lang === 'hi' ? 'छात्र आईडी: ' : 'Student ID: '}</span>
            <strong className="text-blue-900 font-mono text-xs font-bold block">{student.studentId || (student.grNumber ? `STU-${student.admissionYear?.slice(0, 4) || '2026'}-${student.grNumber}` : '-')}</strong>
          </div>
          <div>
            <span>{lang === 'mr' ? 'जनरल रजिस्टर (G.R.) नं: ' : lang === 'hi' ? 'जनरल रजिस्टर (G.R.) नं: ' : 'G.R. No: '}</span>
            <strong className="text-slate-950 font-mono text-sm font-black underline block">{student.grNumber}</strong>
          </div>
          <div>
            <span>{lang === 'mr' ? 'सरल/आधार (UID): ' : lang === 'hi' ? 'आधार (UID) नंबर: ' : 'Student UID: '}</span>
            <strong className="text-slate-950 font-mono text-xs block">{student.uid || '-'}</strong>
          </div>
        </div>

        {/* Certificate 15-Row Official Table */}
        <div className="flex-1 my-0.5">
          <table className="w-full text-left border-collapse text-[11px] sm:text-xs print:text-[10.5px]">
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="py-1 print:py-[2px] font-bold w-6 text-slate-700">१.</td>
                <td className="py-1 print:py-[2px] font-semibold w-60 text-slate-800">
                  {lang === 'mr' ? 'विद्यार्थ्याचे संपूर्ण नाव (आडनाव प्रथम):' : lang === 'hi' ? 'विद्यार्थी का पूरा नाम (उपनाम पहले):' : 'Name of Student in Full (Surname First):'}
                </td>
                <td className="py-1 print:py-[2px] font-black text-slate-950 text-xs sm:text-sm">{getLocalizedStudentName(student, lang)}</td>
              </tr>

              <tr className="border-b border-slate-300">
                <td className="py-1 print:py-[2px] font-bold text-slate-700">२.</td>
                <td className="py-1 print:py-[2px] font-semibold text-slate-800">
                  {lang === 'mr' ? 'वडिलांचे / पालकांचे नाव:' : lang === 'hi' ? 'पिता / अभिभावक का नाम:' : "Father's / Guardian's Name:"}
                </td>
                <td className="py-1 print:py-[2px] font-bold text-slate-900">{getLocalizedFatherName(student, lang)}</td>
              </tr>

              <tr className="border-b border-slate-300">
                <td className="py-1 print:py-[2px] font-bold text-slate-700">३.</td>
                <td className="py-1 print:py-[2px] font-semibold text-slate-800">
                  {lang === 'mr' ? 'आईचे नाव:' : lang === 'hi' ? 'माता का नाम:' : "Mother's Name:"}
                </td>
                <td className="py-1 print:py-[2px] font-bold text-slate-900">{getLocalizedMotherName(student, lang)}</td>
              </tr>

              <tr className="border-b border-slate-300">
                <td className="py-1 print:py-[2px] font-bold text-slate-700">४.</td>
                <td className="py-1 print:py-[2px] font-semibold text-slate-800">
                  {lang === 'mr' ? 'राष्ट्रीयत्व व मातृभाषा:' : lang === 'hi' ? 'राष्ट्रीयता एवं मातृभाषा:' : 'Nationality & Mother Tongue:'}
                </td>
                <td className="py-1 print:py-[2px] text-slate-900 font-medium">
                  {getLocalizedNationality(student, lang)} • {lang === 'mr' ? 'मातृभाषा: ' : lang === 'hi' ? 'मातृभाषा: ' : 'Mother Tongue: '}<strong className="font-bold">{getLocalizedMotherTongue(student, lang)}</strong>
                </td>
              </tr>

              <tr className="border-b border-slate-300">
                <td className="py-1 print:py-[2px] font-bold text-slate-700">५.</td>
                <td className="py-1 print:py-[2px] font-semibold text-slate-800">
                  {lang === 'mr' ? 'धर्म, जात व पोटजात:' : lang === 'hi' ? 'धर्म, जाति एवं उपजाति:' : 'Religion, Caste & Sub-Caste:'}
                </td>
                <td className="py-1 print:py-[2px] text-slate-900 font-medium">
                  {getLocalizedReligion(student, lang)} — {lang === 'mr' ? 'जात: ' : lang === 'hi' ? 'जाति: ' : 'Caste: '}<strong className="font-bold">{getLocalizedCaste(student, lang)}</strong> ({lang === 'mr' ? 'पोटजात: ' : lang === 'hi' ? 'उपजाति: ' : 'Sub-Caste: '}{getLocalizedSubCaste(student, lang)})
                </td>
              </tr>

              <tr className="border-b border-slate-300">
                <td className="py-1 print:py-[2px] font-bold text-slate-700">६.</td>
                <td className="py-1 print:py-[2px] font-semibold text-slate-800">
                  {lang === 'mr' ? 'जन्मस्थळ (गाव/तालुका/जिल्हा):' : lang === 'hi' ? 'जन्म स्थान (ग्राम/तहसील/जिला):' : 'Place of Birth (Village/Tal/Dist):'}
                </td>
                <td className="py-1 print:py-[2px] font-medium text-slate-900">{getLocalizedBirthPlace(student, lang)}</td>
              </tr>

              <tr className="border-b border-slate-300 bg-slate-50/60">
                <td className="py-1 print:py-[2px] font-bold text-slate-700">७.</td>
                <td className="py-1 print:py-[2px] font-semibold text-slate-800">
                  <div>{lang === 'mr' ? 'जन्मदिनांक (अंकी व अक्षरी):' : lang === 'hi' ? 'जन्म तिथि (अंक व शब्द):' : 'Date of Birth:'}</div>
                </td>
                <td className="py-1 print:py-[2px]">
                  <span className="font-mono font-bold text-slate-950">{formatDate(student.birthDate)}</span>
                  <span className="text-[10.5px] font-semibold text-slate-700 italic ml-2">({dateToWords(student.birthDate, lang)})</span>
                </td>
              </tr>

              <tr className="border-b border-slate-300">
                <td className="py-1 print:py-[2px] font-bold text-slate-700">८.</td>
                <td className="py-1 print:py-[2px] font-semibold text-slate-800">
                  {lang === 'mr' ? 'यापूर्वीची शाळा:' : lang === 'hi' ? 'पूर्व विद्यालय का नाम:' : 'Last School Attended:'}
                </td>
                <td className="py-1 print:py-[2px] font-medium text-slate-900">{getLocalizedPreviousSchool(student, lang)}</td>
              </tr>

              <tr className="border-b border-slate-300">
                <td className="py-1 print:py-[2px] font-bold text-slate-700">९.</td>
                <td className="py-1 print:py-[2px] font-semibold text-slate-800">
                  {lang === 'mr' ? 'शाळेत दाखल दिनांक व इयत्ता:' : lang === 'hi' ? 'प्रवेश तिथि एवं कक्षा:' : 'Date of Admission & Class:'}
                </td>
                <td className="py-1 print:py-[2px] text-slate-900">
                  <strong className="font-bold font-mono">{formatDate(student.admissionDate)}</strong> {lang === 'mr' ? 'इयत्ता' : lang === 'hi' ? 'कक्षा' : 'in Class'} <strong className="font-bold">{getLocalizedClass(student.admissionClass, lang)}</strong>
                </td>
              </tr>

              <tr className="border-b border-slate-300">
                <td className="py-1 print:py-[2px] font-bold text-slate-700">१०.</td>
                <td className="py-1 print:py-[2px] font-semibold text-slate-800">
                  {lang === 'mr' ? 'अभ्यासातील प्रगती:' : lang === 'hi' ? 'अध्ययन में प्रगति:' : 'Progress in Studies:'}
                </td>
                <td className="py-1 print:py-[2px] font-bold text-slate-900">{getLocalizedProgress(finalProgress, lang)}</td>
              </tr>

              <tr className="border-b border-slate-300">
                <td className="py-1 print:py-[2px] font-bold text-slate-700">११.</td>
                <td className="py-1 print:py-[2px] font-semibold text-slate-800">
                  {lang === 'mr' ? 'वर्तणूक व स्वभाव:' : lang === 'hi' ? 'आचरण एवं चरित्र:' : 'Conduct & Character:'}
                </td>
                <td className="py-1 print:py-[2px] font-bold text-slate-900">{getLocalizedBehaviour(finalConduct, lang)}</td>
              </tr>

              <tr className="border-b border-slate-300">
                <td className="py-1 print:py-[2px] font-bold text-slate-700">१२.</td>
                <td className="py-1 print:py-[2px] font-semibold text-slate-800">
                  {lang === 'mr' ? 'शाळा सोडल्याची तारीख:' : lang === 'hi' ? 'विद्यालय छोड़ने की तिथि:' : 'Date of Leaving School:'}
                </td>
                <td className="py-1 print:py-[2px] font-mono font-bold text-slate-900">{formatDate(issueDate)}</td>
              </tr>

              <tr className="border-b border-slate-300">
                <td className="py-1 print:py-[2px] font-bold text-slate-700">१३.</td>
                <td className="py-1 print:py-[2px] font-semibold text-slate-800">
                  {lang === 'mr' ? 'कोणत्या इयत्तेत शिकत होता व केव्हापासून:' : lang === 'hi' ? 'वर्तमान अध्ययनरत कक्षा एवं कब से:' : 'Class in which Studying & Since:'}
                </td>
                <td className="py-1 print:py-[2px] font-bold text-slate-900">
                  {lang === 'mr' ? `इयत्ता ${getLocalizedClass(student.admissionClass, lang)} (${student.admissionYear})` : lang === 'hi' ? `कक्षा ${getLocalizedClass(student.admissionClass, lang)} (${student.admissionYear})` : `Class ${student.admissionClass} (${student.admissionYear})`}
                </td>
              </tr>

              <tr className="border-b border-slate-300">
                <td className="py-1 print:py-[2px] font-bold text-slate-700">१४.</td>
                <td className="py-1 print:py-[2px] font-semibold text-slate-800">
                  {lang === 'mr' ? 'शाळा सोडण्याचे कारण:' : lang === 'hi' ? 'विद्यालय छोड़ने का कारण:' : 'Reason for Leaving School:'}
                </td>
                <td className="py-1 print:py-[2px] font-bold text-slate-950">{getLocalizedLeavingReason(finalLeavingReason, lang)}</td>
              </tr>

              <tr className="border-b border-slate-300">
                <td className="py-1 print:py-[2px] font-bold text-slate-700">१५.</td>
                <td className="py-1 print:py-[2px] font-semibold text-slate-800">
                  {lang === 'mr' ? 'शेरा / फी बाकी नाही:' : lang === 'hi' ? 'टिप्पणी / शुल्क स्थिति:' : 'Remarks / Dues Status:'}
                </td>
                <td className="py-1 print:py-[2px] text-slate-900">
                  {lang === 'mr' ? 'सर्व शालेय फी पूर्ण भरलेली आहे. कोणतीही बाकी नाही.' : lang === 'hi' ? 'सभी शालेय शुल्क पूर्णतः जमा हैं। कोई बकाया नहीं है।' : 'All school dues paid in full. No dues pending.'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Declaration Statement */}
        <div className="mt-1 pt-1 text-[10px] sm:text-[10.5px] text-slate-700 italic text-center font-sans border-t border-slate-300">
          {lang === 'mr' 
            ? 'प्रमाणित करण्यात येते की, वरील माहिती शाळेतील जनरल रजिस्टर (नोंदवही) मधील नोंदीनुसार पूर्णपणे तपासून अचूक दिलेली आहे.' 
            : lang === 'hi' 
            ? 'प्रमाणित किया जाता है कि उपरोक्त विवरण विद्यालय के सामान्य रजिस्टर (जी.आर.) के अभिलेखों के अनुसार पूर्णतः सत्य एवं सही है।' 
            : 'Certified that the above information is in accordance with the School General Register.'}
        </div>

        {/* Official Signatures & Seal Footer */}
        <div className="mt-2 pt-2 border-t-2 border-slate-800 font-sans">
          <div className="grid grid-cols-3 text-center gap-2 text-[11px] font-bold text-slate-900">
            <div>
              <div className="h-8 sm:h-10 print:h-7 flex items-end justify-center">
                <span className="border-b border-dotted border-slate-600 w-28 inline-block"></span>
              </div>
              <p className="mt-0.5">{lang === 'mr' ? 'वर्गशिक्षकाची स्वाक्षरी' : lang === 'hi' ? 'कक्षा अध्यापक हस्ताक्षर' : 'Class Teacher Signature'}</p>
            </div>

            <div>
              <div className="h-8 sm:h-10 print:h-7 flex items-center justify-center">
                <div className="w-16 h-8 border border-dashed border-slate-400 rounded flex items-center justify-center text-[9px] text-slate-400">
                  {lang === 'mr' ? 'शाळेचा शिक्का' : lang === 'hi' ? 'विद्यालय मोहर' : 'School Seal'}
                </div>
              </div>
              <p className="mt-0.5">{lang === 'mr' ? 'लिपिकाची स्वाक्षरी' : lang === 'hi' ? 'लिपिक हस्ताक्षर' : 'Office Clerk Signature'}</p>
            </div>

            <div>
              <div className="h-8 sm:h-10 print:h-7 flex items-end justify-center">
                <span className="border-b border-dotted border-slate-600 w-32 inline-block"></span>
              </div>
              <p className="mt-0.5 text-slate-950">{lang === 'mr' ? 'मुख्याध्यापक / प्राचार्य' : lang === 'hi' ? 'प्रधानाचार्य / प्राचार्य' : 'Headmaster / Principal'}</p>
              <p className="text-[9px] font-normal text-slate-600 leading-none">{settings.headmasterName}</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-600 mt-2 pt-1 border-t border-slate-200">
            <span>{lang === 'mr' ? 'दाखला दिल्याची तारीख: ' : lang === 'hi' ? 'जारी तिथि: ' : 'Date of Issue: '}<strong>{formatDate(issueDate)}</strong></span>
            <span>{lang === 'mr' ? 'ठिकाण: ' : lang === 'hi' ? 'स्थान: ' : 'Place: '}<strong>{placeName}</strong></span>
            <span>ShalaVerse Verified Record</span>
          </div>
        </div>

      </div>
    </div>
  );
}
