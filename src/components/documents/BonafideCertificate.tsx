import { Student } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { formatDate } from '../../utils/dateUtils';
import { 
  getLocalizedStudentName, 
  getLocalizedFatherName, 
  getLocalizedMotherName, 
  getLocalizedBirthPlace, 
  getLocalizedReligion, 
  getLocalizedCaste, 
  getLocalizedClass, 
  getLocalizedBehaviour 
} from '../../utils/devanagariUtils';
import { GraduationCap, Edit3 } from 'lucide-react';

interface BonafideCertificateProps {
  student: Student;
  issueDate?: string;
  purpose?: string;
  serialNumber?: string;
  lang?: 'en' | 'mr' | 'hi';
  onEdit?: () => void;
}

export function BonafideCertificate({
  student,
  issueDate = new Date().toISOString().split('T')[0],
  purpose,
  serialNumber = 'BONA-2026/142',
  lang = 'mr',
  onEdit
}: BonafideCertificateProps) {
  const { settings } = useSettings();

  const defaultPurpose = lang === 'mr' 
    ? 'शैक्षणिक / शासकीय कामासाठी व शिष्यवृत्ती अर्जासाठी' 
    : lang === 'hi' 
    ? 'शैक्षणिक / शासकीय कार्य एवं छात्रवृत्ति आवेदन हेतु' 
    : 'Educational / Official Purposes & Scholarship Application';

  const finalPurpose = purpose || defaultPurpose;

  const placeName = settings.address.includes('Chikhli') ? (
    lang === 'mr' ? 'चिखली (जि. बुलढाणा)' : lang === 'hi' ? 'चिखली (जि. बुलढाणा)' : 'Chikhli (Dist. Buldhana)'
  ) : 'Chikhli';

  return (
    <div className="a4-document-page bg-white text-slate-900 mx-auto w-full max-w-[210mm] min-h-[297mm] p-4 sm:p-6 border-4 border-double border-slate-900 relative font-serif print:border-4 print:border-double print:border-black print:p-2 print:m-0 print:shadow-none shadow-xl group">
      {/* Quick Edit Overlay Button (Screen only, hidden in print) */}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          title="बोनाफाईड माहिती बदला / Edit Bonafide Details"
          className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-sans font-black rounded-lg shadow-md flex items-center gap-1.5 transition print:hidden cursor-pointer opacity-90 hover:opacity-100"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{lang === 'mr' ? 'बदल करा (Edit)' : 'Edit'}</span>
        </button>
      )}

      <div className="a4-inner-box border border-slate-800 p-3 sm:p-4 flex flex-col justify-between">
        
        {/* Header with School Crest */}
        <div className="text-center border-b-2 border-slate-800 pb-2">
          <div className="flex items-center justify-center gap-2.5 mb-1">
            <div className="w-11 h-11 rounded-full border-2 border-slate-900 flex items-center justify-center text-slate-900 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] uppercase font-sans font-semibold tracking-wider text-slate-700">
                {lang === 'mr' 
                  ? 'महाराष्ट्र शासन मान्यताप्राप्त शिक्षण संस्था' 
                  : lang === 'hi' 
                  ? 'महाराष्ट्र शासन मान्यता प्राप्त शिक्षण संस्थान' 
                  : (settings.boardAffiliation || 'Recognized by Department of School Education, Maharashtra')}
              </p>
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-950 uppercase leading-tight">
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
            <span>{lang === 'mr' ? 'जावक क्र: ' : lang === 'hi' ? 'जावक क्र: ' : 'Ref No: '}<strong className="font-mono text-slate-900">{serialNumber}</strong></span>
            <span>{lang === 'mr' ? 'दिनांक: ' : lang === 'hi' ? 'दिनांक: ' : 'Date: '}<strong className="font-mono text-slate-900">{formatDate(issueDate)}</strong></span>
          </div>

          {/* Certificate Title Badge */}
          <div className="mt-2">
            <div className="inline-block border-2 border-slate-900 px-6 py-0.5 bg-slate-100 font-sans">
              <h2 className="text-sm sm:text-base font-black tracking-widest uppercase text-slate-950">
                {lang === 'mr' && 'बोनाफाईड प्रमाणपत्र ( BONAFIDE CERTIFICATE )'}
                {lang === 'hi' && 'बोनाफाइड प्रमाण पत्र ( BONAFIDE CERTIFICATE )'}
                {lang === 'en' && 'BONAFIDE CERTIFICATE'}
              </h2>
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-800">
                {lang === 'mr' && '( शाळेत नियमित शिकत असल्याचा अधिकृत दाखला )'}
                {lang === 'hi' && '( विद्यालय में नियमित अध्ययनरत होने का प्रमाण पत्र )'}
                {lang === 'en' && '( Certificate of Genuine Enrollment )'}
              </p>
            </div>
          </div>
        </div>

        {/* Certificate Body */}
        <div className="my-2 space-y-3 text-xs sm:text-sm leading-relaxed text-slate-900 px-1 sm:px-2">
          
          {/* Header Row with photo box */}
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 space-y-2">
              {lang === 'mr' && (
                <>
                  <p className="indent-6 text-justify">
                    दाखला देण्यात येतो की, कुमार / कुमारी{' '}
                    <strong className="font-black text-slate-950 text-sm sm:text-base underline uppercase px-1">
                      {getLocalizedStudentName(student, 'mr')}
                    </strong>
                    , रा.{' '}
                    <strong className="font-bold text-slate-950 underline px-1">
                      {getLocalizedBirthPlace(student, 'mr')}
                    </strong>
                    , वडिलांचे नाव श्री{' '}
                    <strong className="font-bold text-slate-950 underline px-1">
                      {getLocalizedFatherName(student, 'mr')}
                    </strong>{' '}
                    व आईचे नाव सौ.{' '}
                    <strong className="font-bold text-slate-950 underline px-1">
                      {getLocalizedMotherName(student, 'mr')}
                    </strong>
                    , हे या विद्यालयाचे / कनिष्ठ महाविद्यालयाचे नियमित व प्रामाणिक (Bonafide) विद्यार्थी आहेत.
                  </p>

                  <p className="indent-6 text-justify">
                    सदर विद्यार्थी शैक्षणिक वर्ष{' '}
                    <strong className="font-bold text-slate-950 border-b border-slate-900 px-1.5 font-mono">
                      {student.admissionYear || settings.academicYear || '2026-2027'}
                    </strong>{' '}
                    मध्ये{' '}
                    <strong className="font-black text-blue-900 text-sm border-b border-slate-900 px-1.5">
                      इयत्ता {getLocalizedClass(student.admissionClass, 'mr')}
                    </strong>{' '}
                    मध्ये नियमित शिक्षण घेत आहेत.
                  </p>
                </>
              )}

              {lang === 'hi' && (
                <>
                  <p className="indent-6 text-justify">
                    प्रमाणित किया जाता है कि कुमार / कुमारी{' '}
                    <strong className="font-black text-slate-950 text-sm sm:text-base underline uppercase px-1">
                      {getLocalizedStudentName(student, 'hi')}
                    </strong>
                    , निवासी{' '}
                    <strong className="font-bold text-slate-950 underline px-1">
                      {getLocalizedBirthPlace(student, 'hi')}
                    </strong>
                    , सुपुत्र/सुपुत्री श्री{' '}
                    <strong className="font-bold text-slate-950 underline px-1">
                      {getLocalizedFatherName(student, 'hi')}
                    </strong>{' '}
                    एवं श्रीमती{' '}
                    <strong className="font-bold text-slate-950 underline px-1">
                      {getLocalizedMotherName(student, 'hi')}
                    </strong>
                    , इस विद्यालय / कनिष्ठ महाविद्यालय के नियमित एवं वास्तविक (Bonafide) छात्र/छात्रा हैं।
                  </p>

                  <p className="indent-6 text-justify">
                    वह शैक्षणिक सत्र{' '}
                    <strong className="font-bold text-slate-950 border-b border-slate-900 px-1.5 font-mono">
                      {student.admissionYear || settings.academicYear || '2026-2027'}
                    </strong>{' '}
                    में{' '}
                    <strong className="font-black text-blue-900 text-sm border-b border-slate-900 px-1.5">
                      कक्षा {getLocalizedClass(student.admissionClass, 'hi')}
                    </strong>{' '}
                    में नियमित अध्ययनरत हैं।
                  </p>
                </>
              )}

              {lang === 'en' && (
                <>
                  <p className="indent-6 text-justify">
                    This is to certify that Kumar / Kumari{' '}
                    <strong className="font-black text-slate-950 text-sm sm:text-base underline uppercase px-1">
                      {getLocalizedStudentName(student, 'en')}
                    </strong>
                    , Son / Daughter of Shri{' '}
                    <strong className="font-bold text-slate-950 underline px-1">
                      {getLocalizedFatherName(student, 'en')}
                    </strong>{' '}
                    and Smt.{' '}
                    <strong className="font-bold text-slate-950 underline px-1">
                      {getLocalizedMotherName(student, 'en')}
                    </strong>
                    , is a regular and <strong>bonafide student</strong> of this institution.
                  </p>

                  <p className="indent-6 text-justify">
                    He / She is studying in{' '}
                    <strong className="font-black text-blue-900 text-sm border-b border-slate-900 px-1.5">
                      Class {student.admissionClass}
                    </strong>{' '}
                    for the Academic Year{' '}
                    <strong className="font-bold text-slate-950 border-b border-slate-900 px-1.5 font-mono">
                      {student.admissionYear || settings.academicYear || '2026-2027'}
                    </strong>
                    .
                  </p>
                </>
              )}
            </div>

            {/* Compact Photo Frame */}
            <div className="w-24 h-28 border-2 border-dashed border-slate-400 flex flex-col items-center justify-center text-[10px] text-slate-400 font-sans p-1 text-center bg-slate-50/50 shrink-0">
              <span>{lang === 'mr' ? 'विद्यार्थी फोटो' : lang === 'hi' ? 'छात्र फोटो' : 'Passport Photo'}</span>
              <span className="text-[8px] mt-1 text-slate-400">({lang === 'mr' ? 'मुख्याध्यापक साक्षांकित' : lang === 'hi' ? 'प्रधानाचार्य सत्यापित' : 'Attested by Principal'})</span>
            </div>
          </div>

          {/* Student Key Registered Details Table */}
          <div className="my-2 bg-slate-50 p-2.5 sm:p-3 border border-slate-300 font-sans text-[11px] sm:text-xs rounded">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div>
                <span className="text-slate-600">{lang === 'mr' ? 'विद्यार्थी आयडी: ' : lang === 'hi' ? 'छात्र आईडी: ' : 'Student ID: '}</span>
                <strong className="font-mono font-bold text-blue-900">{student.studentId || (student.grNumber ? `STU-${student.admissionYear?.slice(0, 4) || '2026'}-${student.grNumber}` : '-')}</strong>
              </div>
              <div>
                <span className="text-slate-600">{lang === 'mr' ? 'जनरल रजिस्टर (G.R.) नं: ' : lang === 'hi' ? 'जी.आर. नंबर: ' : 'General Register (G.R.) No: '}</span>
                <strong className="font-mono font-bold text-slate-950">{student.grNumber}</strong>
              </div>
              <div>
                <span className="text-slate-600">{lang === 'mr' ? 'आधार (UID) नंबर: ' : lang === 'hi' ? 'आधार (UID) नंबर: ' : 'Aadhaar (UID) Number: '}</span>
                <strong className="font-mono font-bold text-slate-950">{student.uid || '-'}</strong>
              </div>
              <div>
                <span className="text-slate-600">{lang === 'mr' ? 'जन्मदिनांक (GR नुसार): ' : lang === 'hi' ? 'जन्म तिथि: ' : 'Date of Birth (as per GR): '}</span>
                <strong className="font-bold text-slate-950 font-mono">{formatDate(student.birthDate)}</strong>
              </div>
              <div>
                <span className="text-slate-600">{lang === 'mr' ? 'जन्मस्थळ: ' : lang === 'hi' ? 'जन्म स्थान: ' : 'Place of Birth: '}</span>
                <strong className="font-bold text-slate-950">{getLocalizedBirthPlace(student, lang)}</strong>
              </div>
              <div>
                <span className="text-slate-600">{lang === 'mr' ? 'धर्म व जात: ' : lang === 'hi' ? 'धर्म एवं जाति: ' : 'Caste / Category: '}</span>
                <strong className="font-bold text-slate-950">{getLocalizedCaste(student, lang)} ({getLocalizedReligion(student, lang)})</strong>
              </div>
            </div>
          </div>

          <p className="indent-6 text-justify">
            {lang === 'mr' && (
              <>
                शाळेतील अधिकृत जनरल रजिस्टर (GR) नोंदीनुसार त्यांचे वर्तन व स्वभाव <strong className="font-bold text-slate-950">{getLocalizedBehaviour(student.behaviour, 'mr')}</strong> आहे. सदर प्रमाणपत्र हे विद्यार्थी / पालकांच्या विनंतीवरून <strong className="font-bold text-slate-950 underline">{finalPurpose}</strong> कामी देण्यात येत आहे.
              </>
            )}
            {lang === 'hi' && (
              <>
                विद्यालयीन सामान्य रजिस्टर (GR) के अनुसार इनका आचरण एवं स्वभाव <strong className="font-bold text-slate-950">{getLocalizedBehaviour(student.behaviour, 'hi')}</strong> है। यह प्रमाण पत्र छात्र/अभिभावक के अनुरोध पर <strong className="font-bold text-slate-950 underline">{finalPurpose}</strong> हेतु जारी किया जा रहा है।
              </>
            )}
            {lang === 'en' && (
              <>
                As per the school general records, his/her character and conduct during the stay in the school have been found to be <strong className="font-bold text-slate-950">{student.behaviour || 'Very Good'}</strong>. This certificate is issued upon the request of the student/parent for the purpose of <strong className="font-bold text-slate-950 underline">{finalPurpose}</strong>.
              </>
            )}
          </p>
        </div>

        {/* Signatures & Seal Footer */}
        <div className="mt-2 pt-2 border-t-2 border-slate-800 font-sans">
          <div className="grid grid-cols-3 text-center gap-2 text-[11px] font-bold text-slate-900">
            <div>
              <div className="h-9 sm:h-11 print:h-8 flex items-end justify-center">
                <span className="border-b border-dotted border-slate-600 w-28 inline-block"></span>
              </div>
              <p className="mt-0.5">{lang === 'mr' ? 'तयार करणार (लिपिक)' : lang === 'hi' ? 'तैयारकर्ता (लिपिक)' : 'Prepared by (Clerk)'}</p>
            </div>

            <div>
              <div className="h-9 sm:h-11 print:h-8 flex items-center justify-center">
                <div className="w-16 h-8 border border-dashed border-slate-400 rounded flex items-center justify-center text-[9px] text-slate-400">
                  {lang === 'mr' ? 'शाळेचा शिक्का' : lang === 'hi' ? 'विद्यालय मोहर' : 'School Seal'}
                </div>
              </div>
              <p className="mt-0.5">{lang === 'mr' ? 'तपासणार (वरिष्ठ लिपिक)' : lang === 'hi' ? 'सत्यापनकर्ता' : 'Verified by Office Supdt.'}</p>
            </div>

            <div>
              <div className="h-9 sm:h-11 print:h-8 flex items-end justify-center">
                <span className="border-b border-dotted border-slate-600 w-32 inline-block"></span>
              </div>
              <p className="mt-0.5 text-slate-950">{lang === 'mr' ? 'मुख्याध्यापक / प्राचार्य' : lang === 'hi' ? 'प्रधानाचार्य / प्राचार्य' : 'Headmaster / Principal'}</p>
              <p className="text-[9px] font-normal text-slate-600 leading-none">{settings.headmasterName}</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1 border-t border-slate-200">
            <span>{lang === 'mr' ? 'ठिकाण: ' : lang === 'hi' ? 'स्थान: ' : 'Place: '}<strong>{placeName}</strong></span>
            <span>{lang === 'mr' ? 'दिनांक: ' : lang === 'hi' ? 'दिनांक: ' : 'Date: '}<strong>{formatDate(issueDate)}</strong></span>
            <span>ShalaVerse Verified Document</span>
          </div>
        </div>

      </div>
    </div>
  );
}
