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
import { Landmark, Edit3 } from 'lucide-react';

interface NirgamUtaraProps {
  student: Student;
  extractNumber?: string;
  issueDate?: string;
  applicantName?: string;
  lang?: 'en' | 'mr' | 'hi';
  onEdit?: () => void;
}

export function NirgamUtara({
  student,
  extractNumber = 'NU-2026/058',
  issueDate = new Date().toISOString().split('T')[0],
  applicantName,
  lang = 'mr',
  onEdit
}: NirgamUtaraProps) {
  const { settings } = useSettings();

  const placeName = settings.address.includes('Chikhli') ? (
    lang === 'mr' ? 'चिखली (जि. बुलढाणा)' : lang === 'hi' ? 'चिखली (जि. बुलढाणा)' : 'Chikhli (Dist. Buldhana)'
  ) : 'Chikhli';

  return (
    <div className="a4-document-page bg-white text-slate-900 mx-auto w-full max-w-[210mm] min-h-[297mm] p-4 sm:p-6 border-2 border-slate-900 font-serif print:border-2 print:border-black print:p-2 print:m-0 print:shadow-none shadow-xl group relative">
      {/* Quick Edit Overlay Button (Screen only, hidden in print) */}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          title="निर्गम उतारा माहिती बदला / Edit Nirgam Details"
          className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-sans font-black rounded-lg shadow-md flex items-center gap-1.5 transition print:hidden cursor-pointer opacity-90 hover:opacity-100"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{lang === 'mr' ? 'बदल करा (Edit)' : 'Edit'}</span>
        </button>
      )}

      <div className="a4-inner-box border border-slate-800 p-3 sm:p-4 flex flex-col justify-between">
        
        {/* Official Header */}
        <div className="text-center border-b-2 border-slate-900 pb-2">
          <div className="flex items-center justify-center gap-2 mb-0.5">
            <Landmark className="w-4 h-4 text-slate-800" />
            <span className="text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-wider text-slate-700">
              {lang === 'mr' 
                ? 'महाराष्ट्र शासन शालेय शिक्षण व क्रीडा विभाग' 
                : lang === 'hi' 
                ? 'महाराष्ट्र शासन स्कूल शिक्षा एवं क्रीड़ा विभाग' 
                : 'Department of School Education & Sports, Government of Maharashtra'}
            </span>
          </div>

          <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-950 uppercase leading-tight">
            {lang === 'en' ? settings.schoolName : (settings.schoolNameLocal || settings.schoolName)}
          </h1>
          {lang !== 'en' && (
            <p className="text-[11px] font-semibold text-slate-700 font-sans">
              {settings.schoolName}
            </p>
          )}

          <p className="text-[11px] text-slate-700 font-sans mt-0.5">
            {settings.address} • UDISE No: <strong>{settings.udiseNumber}</strong>
          </p>

          {/* Heading Banner */}
          <div className="mt-1.5">
            <div className="inline-block border-2 border-slate-900 px-5 py-0.5 bg-slate-100 font-sans">
              <h2 className="text-sm sm:text-base font-black tracking-wide uppercase text-slate-950">
                {lang === 'mr' && 'जनरल रजिस्टर (निर्गम नोंदवही) उतारा'}
                {lang === 'hi' && 'सामान्य रजिस्टर उद्धरण / निर्गम उतारा'}
                {lang === 'en' && 'GENERAL REGISTER EXTRACT ( NIRGAM UTARA )'}
              </h2>
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-800">
                {lang === 'mr' && '( शाळेतील जनरल रजिस्टर मधील अधिकृत नोंदीचा उतारा )'}
                {lang === 'hi' && '( विद्यालय सामान्य रजिस्टर से प्रमाणित उद्धरण )'}
                {lang === 'en' && '( Certified True Extract of School General Register )'}
              </p>
            </div>
          </div>
        </div>

        {/* Certificate Reference Metadata */}
        <div className="flex items-center justify-between text-[11px] font-sans font-semibold my-1.5 border-b border-slate-300 pb-1.5">
          <div>
            <span>{lang === 'mr' ? 'उतारा संदर्भ क्रमांक: ' : lang === 'hi' ? 'उद्धरण संदर्भ क्रमांक: ' : 'Extract Register Ref: '}</span>
            <strong className="font-mono text-xs underline">{extractNumber}</strong>
          </div>
          <div>
            <span>{lang === 'mr' ? 'जनरल रजिस्टर (G.R.) नं: ' : lang === 'hi' ? 'जनरल रजिस्टर (G.R.) नं: ' : 'General Register (G.R.) No: '}</span>
            <strong className="font-mono text-sm font-black text-blue-950 underline">{student.grNumber}</strong>
          </div>
          <div>
            <span>{lang === 'mr' ? 'उतारा दिनांक: ' : lang === 'hi' ? 'दिनांक: ' : 'Issue Date: '}</span>
            <strong className="font-mono text-xs">{formatDate(issueDate)}</strong>
          </div>
        </div>

        {/* 16 Official Register Columns */}
        <div className="my-0.5 flex-1">
          <p className="text-[10px] sm:text-[10.5px] font-sans font-medium text-slate-700 mb-1 italic">
            {lang === 'mr' 
              ? 'प्रमाणित करण्यात येते की, शाळेच्या अधिकृत जनरल रजिस्टर (GR) नोंदवहीमधील विद्यार्थ्यांची नोंद खालीलप्रमाणे आहे:' 
              : lang === 'hi' 
              ? 'प्रमाणित किया जाता है कि विद्यालय के अधिकृत सामान्य रजिस्टर (GR) में छात्र/छात्रा का विवरण निम्नवत है:' 
              : 'Certified true copy of entry in the General Register (GR) of Admissions and Withdrawals of the School:'}
          </p>

          <table className="w-full border-collapse text-[10.5px] sm:text-[11px] print:text-[10px] border border-slate-900 leading-tight">
            <tbody>
              <tr className="border-b border-slate-900">
                <td className="w-7 p-1 print:p-[2px] font-bold text-center border-r border-slate-900 bg-slate-50">१</td>
                <td className="w-56 p-1 print:p-[2px] font-semibold border-r border-slate-900">
                  {lang === 'mr' ? 'जनरल रजिस्टर नंबर (G.R. No.)' : lang === 'hi' ? 'जनरल रजिस्टर नंबर (G.R. No.)' : 'General Register No. (G.R. No.)'}
                </td>
                <td className="p-1 print:p-[2px] font-mono font-bold text-sm text-slate-950">{student.grNumber}</td>
              </tr>

              <tr className="border-b border-slate-900">
                <td className="p-1 print:p-[2px] font-bold text-center border-r border-slate-900 bg-slate-50">२</td>
                <td className="p-1 print:p-[2px] font-semibold border-r border-slate-900">
                  {lang === 'mr' ? 'विद्यार्थी ओळख आयडी (Student ID) / आधार (UID)' : lang === 'hi' ? 'छात्र पहचान आईडी (Student ID) / आधार' : 'Student ID / Aadhaar (UID) No.'}
                </td>
                <td className="p-1 print:p-[2px] font-mono font-semibold">
                  <span className="text-blue-900 font-bold">{student.studentId || (student.grNumber ? `STU-${student.admissionYear?.slice(0, 4) || '2026'}-${student.grNumber}` : '-')}</span>
                  {student.uid ? ` (Aadhaar: ${student.uid})` : ''}
                </td>
              </tr>

              <tr className="border-b border-slate-900">
                <td className="p-1 print:p-[2px] font-bold text-center border-r border-slate-900 bg-slate-50">३</td>
                <td className="p-1 print:p-[2px] font-semibold border-r border-slate-900">
                  {lang === 'mr' ? 'विद्यार्थ्याचे संपूर्ण नाव (आडनाव प्रथम)' : lang === 'hi' ? 'विद्यार्थी का पूरा नाम (उपनाम पहले)' : 'Full Name of Student (Surname First)'}
                </td>
                <td className="p-1 print:p-[2px] font-black text-xs uppercase text-slate-950">{getLocalizedStudentName(student, lang)}</td>
              </tr>

              <tr className="border-b border-slate-900">
                <td className="p-1 print:p-[2px] font-bold text-center border-r border-slate-900 bg-slate-50">४</td>
                <td className="p-1 print:p-[2px] font-semibold border-r border-slate-900">
                  {lang === 'mr' ? 'वडिलांचे / पालकांचे संपूर्ण नाव' : lang === 'hi' ? 'पिता / अभिभावक का पूरा नाम' : "Father's / Guardian's Full Name"}
                </td>
                <td className="p-1 print:p-[2px] font-bold text-slate-900">{getLocalizedFatherName(student, lang)}</td>
              </tr>

              <tr className="border-b border-slate-900">
                <td className="p-1 print:p-[2px] font-bold text-center border-r border-slate-900 bg-slate-50">५</td>
                <td className="p-1 print:p-[2px] font-semibold border-r border-slate-900">
                  {lang === 'mr' ? 'आईचे नाव' : lang === 'hi' ? 'माता का नाम' : "Mother's Full Name"}
                </td>
                <td className="p-1 print:p-[2px] font-bold text-slate-900">{getLocalizedMotherName(student, lang)}</td>
              </tr>

              <tr className="border-b border-slate-900">
                <td className="p-1 print:p-[2px] font-bold text-center border-r border-slate-900 bg-slate-50">६</td>
                <td className="p-1 print:p-[2px] font-semibold border-r border-slate-900">
                  {lang === 'mr' ? 'धर्म, जात व पोटजात' : lang === 'hi' ? 'धर्म, जाति एवं उपजाति' : 'Religion, Caste and Sub-Caste'}
                </td>
                <td className="p-1 print:p-[2px]">
                  {getLocalizedReligion(student, lang)} — {lang === 'mr' ? 'जात: ' : lang === 'hi' ? 'जाति: ' : 'Caste: '}<strong className="font-bold">{getLocalizedCaste(student, lang)}</strong> ({lang === 'mr' ? 'पोटजात: ' : lang === 'hi' ? 'उपजाति: ' : 'Sub-Caste: '}{getLocalizedSubCaste(student, lang)})
                </td>
              </tr>

              <tr className="border-b border-slate-900">
                <td className="p-1 print:p-[2px] font-bold text-center border-r border-slate-900 bg-slate-50">७</td>
                <td className="p-1 print:p-[2px] font-semibold border-r border-slate-900">
                  {lang === 'mr' ? 'राष्ट्रीयत्व व मातृभाषा' : lang === 'hi' ? 'राष्ट्रीयता एवं मातृभाषा' : 'Nationality & Mother Tongue'}
                </td>
                <td className="p-1 print:p-[2px]">{getLocalizedNationality(student, lang)} • {lang === 'mr' ? 'मातृभाषा: ' : lang === 'hi' ? 'मातृभाषा: ' : 'Mother Tongue: '}<strong className="font-bold">{getLocalizedMotherTongue(student, lang)}</strong></td>
              </tr>

              <tr className="border-b border-slate-900">
                <td className="p-1 print:p-[2px] font-bold text-center border-r border-slate-900 bg-slate-50">८</td>
                <td className="p-1 print:p-[2px] font-semibold border-r border-slate-900">
                  {lang === 'mr' ? 'जन्मस्थळ (गाव/तालुका/जिल्हा)' : lang === 'hi' ? 'जन्म स्थान (ग्राम/तहसील/जिला)' : 'Place of Birth (Village/Tal/Dist)'}
                </td>
                <td className="p-1 print:p-[2px]">{getLocalizedBirthPlace(student, lang)}</td>
              </tr>

              <tr className="border-b border-slate-900 bg-slate-50/60">
                <td className="p-1 print:p-[2px] font-bold text-center border-r border-slate-900">९</td>
                <td className="p-1 print:p-[2px] font-semibold border-r border-slate-900">
                  <div>{lang === 'mr' ? 'जन्मदिनांक (अंकी)' : lang === 'hi' ? 'जन्म तिथि (अंकों में)' : 'Date of Birth (in figures)'}</div>
                  <div className="text-[9.5px] text-slate-600 font-normal leading-none">{lang === 'mr' ? '(अक्षरी)' : lang === 'hi' ? '(शब्दों में)' : '(in words)'}</div>
                </td>
                <td className="p-1 print:p-[2px]">
                  <span className="font-mono font-bold text-slate-950 text-xs mr-2">{formatDate(student.birthDate)}</span>
                  <span className="text-[10px] font-semibold italic text-slate-800">({dateToWords(student.birthDate, lang)})</span>
                </td>
              </tr>

              <tr className="border-b border-slate-900">
                <td className="p-1 print:p-[2px] font-bold text-center border-r border-slate-900 bg-slate-50">१०</td>
                <td className="p-1 print:p-[2px] font-semibold border-r border-slate-900">
                  {lang === 'mr' ? 'यापूर्वीची शाळा' : lang === 'hi' ? 'पूर्व विद्यालय का नाम' : 'Previous School Attended'}
                </td>
                <td className="p-1 print:p-[2px]">{getLocalizedPreviousSchool(student, lang)}</td>
              </tr>

              <tr className="border-b border-slate-900">
                <td className="p-1 print:p-[2px] font-bold text-center border-r border-slate-900 bg-slate-50">११</td>
                <td className="p-1 print:p-[2px] font-semibold border-r border-slate-900">
                  {lang === 'mr' ? 'शाळेत दाखल दिनांक व दाखल इयत्ता' : lang === 'hi' ? 'प्रवेश तिथि एवं प्रवेश कक्षा' : 'Date of Admission & Class Admitted'}
                </td>
                <td className="p-1 print:p-[2px]">
                  {lang === 'mr' ? 'दिनांक: ' : lang === 'hi' ? 'दिनांक: ' : 'Date: '}<strong className="font-bold font-mono">{formatDate(student.admissionDate)}</strong> {lang === 'mr' ? 'इयत्ता ' : lang === 'hi' ? 'कक्षा ' : 'in Class '}<strong className="font-bold font-sans">{getLocalizedClass(student.admissionClass, lang)}</strong>
                </td>
              </tr>

              <tr className="border-b border-slate-900">
                <td className="p-1 print:p-[2px] font-bold text-center border-r border-slate-900 bg-slate-50">१२</td>
                <td className="p-1 print:p-[2px] font-semibold border-r border-slate-900">
                  {lang === 'mr' ? 'अभ्यासातील प्रगती' : lang === 'hi' ? 'अध्ययन में प्रगति' : 'Academic Progress in Studies'}
                </td>
                <td className="p-1 print:p-[2px] font-bold text-slate-900">{getLocalizedProgress(student.academicProgress, lang)}</td>
              </tr>

              <tr className="border-b border-slate-900">
                <td className="p-1 print:p-[2px] font-bold text-center border-r border-slate-900 bg-slate-50">१३</td>
                <td className="p-1 print:p-[2px] font-semibold border-r border-slate-900">
                  {lang === 'mr' ? 'वर्तणूक व स्वभाव नोंद' : lang === 'hi' ? 'आचरण एवं स्वभाव' : 'Conduct / Character Record'}
                </td>
                <td className="p-1 print:p-[2px] font-bold text-slate-900">{getLocalizedBehaviour(student.behaviour, lang)}</td>
              </tr>

              <tr className="border-b border-slate-900">
                <td className="p-1 print:p-[2px] font-bold text-center border-r border-slate-900 bg-slate-50">१४</td>
                <td className="p-1 print:p-[2px] font-semibold border-r border-slate-900">
                  {lang === 'mr' ? 'शाळा सोडल्याची तारीख / दाखला दिनांक' : lang === 'hi' ? 'विद्यालय छोड़ने / टी.सी. दिनांक' : 'Date of Leaving / T.C. Issue Date'}
                </td>
                <td className="p-1 print:p-[2px] font-mono font-bold text-slate-900">{formatDate(student.certificateDate || issueDate)}</td>
              </tr>

              <tr className="border-b border-slate-900">
                <td className="p-1 print:p-[2px] font-bold text-center border-r border-slate-900 bg-slate-50">१५</td>
                <td className="p-1 print:p-[2px] font-semibold border-r border-slate-900">
                  {lang === 'mr' ? 'शाळा सोडण्याचे कारण' : lang === 'hi' ? 'विद्यालय छोड़ने का कारण' : 'Reason for Leaving Institution'}
                </td>
                <td className="p-1 print:p-[2px] font-bold text-slate-950">{getLocalizedLeavingReason(student.leavingReason, lang)}</td>
              </tr>

              <tr className="border-b border-slate-900">
                <td className="p-1 print:p-[2px] font-bold text-center border-r border-slate-900 bg-slate-50">१६</td>
                <td className="p-1 print:p-[2px] font-semibold border-r border-slate-900">
                  {lang === 'mr' ? 'मुख्याध्यापक / प्राचार्य प्राधिकृत स्वाक्षरी' : lang === 'hi' ? 'प्रधानाचार्य / प्राचार्य प्राधिकृत हस्ताक्षर' : 'Headmaster / Principal Authority Signature'}
                </td>
                <td className="p-1 print:p-[2px] text-slate-900 font-semibold">{student.headmasterSignature || settings.headmasterName}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Verification & True Copy Seal Section */}
        <div className="mt-2 pt-2 border-t-2 border-slate-900 font-sans">
          <div className="bg-slate-50 p-1.5 border border-slate-300 rounded mb-2 text-[10px]">
            <p className="font-bold text-slate-900">{lang === 'mr' ? 'साक्षांकन व प्रमाणपत्र:' : lang === 'hi' ? 'प्रमाणीकरण एवं सत्यापन:' : 'CERTIFICATION & ATTESTATION:'}</p>
            <p className="text-slate-700 italic">
              {lang === 'mr' 
                ? 'मी प्रमाणित करतो/करते की, हा जनरल रजिस्टर उतारा शाळेच्या दफ्तरी असलेल्या मूळ जनरल रजिस्टर (दाखल-खारिज नोंदवही) मधील नोंदीवरून तपासून अगदी खरा व बरोबर घेतलेला आहे.' 
                : lang === 'hi' 
                ? 'मैं प्रमाणित करता/करती हूँ कि यह सामान्य रजिस्टर उद्धरण विद्यालय के मूल जनरल रजिस्टर (दाखिल-खारिज पंजिका) से मिलान कर पूर्णतः सत्य एवं सही प्रतिलिपि है।' 
                : 'I hereby certify that this is a true and accurate extract copied from the original General Register (GR) Book Volume maintained in the custody of this school office, verified against all original entries.'}
            </p>
          </div>

          <div className="grid grid-cols-3 text-center gap-2 text-[11px] font-bold text-slate-900">
            <div>
              <div className="h-8 sm:h-10 print:h-7 flex items-end justify-center">
                <span className="border-b border-dotted border-slate-600 w-28 inline-block"></span>
              </div>
              <p className="mt-0.5">{lang === 'mr' ? 'तयार करणार (लिपिक)' : lang === 'hi' ? 'तैयारकर्ता (लिपिक)' : 'Prepared by Clerk'}</p>
            </div>

            <div>
              <div className="h-8 sm:h-10 print:h-7 flex items-center justify-center">
                <div className="w-16 h-8 border border-dashed border-slate-400 rounded flex items-center justify-center text-[9px] text-slate-400">
                  {lang === 'mr' ? 'शाळेचा शिक्का' : lang === 'hi' ? 'कार्यालय मोहर' : 'Office Seal'}
                </div>
              </div>
              <p className="mt-0.5">{lang === 'mr' ? 'तपासणार (वरिष्ठ लिपिक)' : lang === 'hi' ? 'सत्यापनकर्ता' : 'Verified by Head Clerk'}</p>
            </div>

            <div>
              <div className="h-8 sm:h-10 print:h-7 flex items-end justify-center">
                <span className="border-b border-dotted border-slate-600 w-32 inline-block"></span>
              </div>
              <p className="mt-0.5 text-slate-950">{lang === 'mr' ? 'मुख्याध्यापक / प्राचार्य' : lang === 'hi' ? 'प्रधानाचार्य / प्राचार्य' : 'Headmaster / Principal'}</p>
              <p className="text-[9px] font-normal text-slate-600 leading-none">{settings.headmasterName}</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1 border-t border-slate-200">
            <span>{lang === 'mr' ? 'ठिकाण: ' : lang === 'hi' ? 'स्थान: ' : 'Place: '}<strong>{placeName}</strong></span>
            <span>{lang === 'mr' ? 'दिनांक: ' : lang === 'hi' ? 'दिनांक: ' : 'Date: '}<strong>{formatDate(issueDate)}</strong></span>
            <span>ShalaVerse General Register System</span>
          </div>
        </div>

      </div>
    </div>
  );
}
