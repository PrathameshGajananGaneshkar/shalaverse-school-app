import { Student } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { formatDate, dateToWords } from '../../utils/dateUtils';
import { 
  getLocalizedCaste, 
  cleanEnglishText,
  getLocalizedStudentName
} from '../../utils/devanagariUtils';

interface BonafideCertificateProps {
  student: Student;
  issueDate?: string;
  purpose?: string;
  serialNumber?: string;
  lang?: 'en' | 'mr' | 'hi';
  onEdit?: () => void;
}

// Clean and format class for Bonafide
function formatBonafideClass(rawClass: string, lang: 'en' | 'mr' | 'hi'): string {
  if (!rawClass) return lang === 'mr' ? '६ वी' : lang === 'hi' ? '६ वीं' : '6th';
  
  // Clean double suffixes e.g. "6th th B" -> "6th B"
  const clean = rawClass
    .replace(/\b(\d+)(st|nd|rd|th)(\s*(st|nd|rd|th))+/gi, '$1$2')
    .replace(/th\s*th/gi, 'th')
    .trim();

  if (lang === 'en') {
    return clean;
  }

  const numMatch = clean.match(/(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    const withoutSuffix = clean.replace(/\b\d+(st|nd|rd|th)\b/gi, '').trim();
    const division = withoutSuffix.replace(/[^a-zA-Z\u0900-\u097F]/g, '').trim();

    const mrOrdinal: Record<number, string> = {
      1: '१ ली', 2: '२ री', 3: '३ री', 4: '४ थी', 5: '५ वी',
      6: '६ वी', 7: '७ वी', 8: '८ वी', 9: '९ वी', 10: '१० वी',
      11: '११ वी', 12: '१२ वी'
    };
    const hiOrdinal: Record<number, string> = {
      1: '१ वीं', 2: '२ वीं', 3: '३ वीं', 4: '४ वीं', 5: '५ वीं',
      6: '६ वीं', 7: '७ वीं', 8: '८ वीं', 9: '९ वीं', 10: '१० वीं',
      11: '११ वीं', 12: '१२ वीं'
    };

    const base = lang === 'hi' 
      ? (hiOrdinal[num] || `${num} वीं`) 
      : (mrOrdinal[num] || `${num} वी`);

    if (division) {
      return `${base} (${division.toUpperCase()})`;
    }
    return base;
  }

  return clean;
}

// Format Caste for Bonafide
function formatBonafideCaste(student: Student, lang: 'en' | 'mr' | 'hi'): string {
  if (lang === 'en') {
    const rawCaste = student.caste || student.casteLocal || 'SC';
    const clean = cleanEnglishText(rawCaste).replace(/[()[\]{}]/g, '').trim().toUpperCase();
    if (student.subCaste && student.subCaste !== '-' && !clean.includes(student.subCaste.toUpperCase())) {
      return `${clean} - ${cleanEnglishText(student.subCaste).toUpperCase()}`;
    }
    return clean || 'SC';
  }

  if (lang === 'hi') {
    const localized = getLocalizedCaste(student, 'hi');
    const rawCaste = (student.caste || '').toUpperCase();
    if (rawCaste.includes('SC') && !localized.includes('SC')) return `${localized} (SC)`;
    if (rawCaste.includes('ST') && !localized.includes('ST')) return `${localized} (ST)`;
    if (rawCaste.includes('OBC') && !localized.includes('OBC')) return `${localized} (OBC)`;
    return localized;
  }

  // Marathi
  const localized = getLocalizedCaste(student, 'mr');
  const rawCaste = (student.caste || '').toUpperCase();
  if (rawCaste.includes('SC') && !localized.includes('SC')) return `${localized} (SC)`;
  if (rawCaste.includes('ST') && !localized.includes('ST')) return `${localized} (ST)`;
  if (rawCaste.includes('OBC') && !localized.includes('OBC')) return `${localized} (OBC)`;
  if (rawCaste.includes('VJNT') && !localized.includes('VJNT')) return `${localized} (VJNT)`;
  if (rawCaste.includes('NT') && !localized.includes('NT')) return `${localized} (NT)`;
  return localized;
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

  const currentLang = lang;
  const nameScript = currentLang === 'en' ? 'latin' : 'local';
  const wordsScript = currentLang;

  const defaultPurpose = currentLang === 'mr' 
    ? 'शैक्षणिक / शासकीय कामासाठी व शिष्यवृत्ती अर्जासाठी' 
    : currentLang === 'hi' 
    ? 'शैक्षणिक / शासकीय कार्य एवं छात्रवृत्ति आवेदन हेतु' 
    : 'Educational / Official Purposes & Scholarship Application';

  const finalPurpose = purpose || defaultPurpose;

  // Language Dictionary for the exact same Bonafide Proforma
  const texts = {
    en: {
      topHeader: 'BONAFIDE CERTIFICATE',
      schoolName: (settings.schoolName || 'SHRI SHIVAJI HIGH SCHOOL AND JUNIOR COLLEGE,').toUpperCase(),
      address: (settings.address || 'CHIKHLI, DIST. BULDHANA - 443201').toUpperCase(),
      udisePrefix: 'UDISE NO.',
      centerTitle: 'BONAFIDE CERTIFICATE',
      certifyPrefix: 'This is to certify that',
      honorific: 'Shri/Kr.',
      regularStudentPrefix: 'was the regular student of',
      classSuffix: 'class of the school',
      sessionPrefix: 'for the session',
      sessionInfix: '',
      classPrefix: '',
      recordStatement: 'His/her original Marksheet and school leaving certificate is with school record.',
      casteStatementPrefix: 'As per school (i.e. school leaving certificate) his/her caste is',
      casteStatementSuffix: '',
      dobStatementPrefix: 'as per school record his/her date of birth is (in figure)',
      dobWordsPrefix: '(in words)',
      grNoPrefix: 'Gen. Reg. No.',
      placeLabel: 'Place:',
      defaultPlace: 'Chikhli',
      dateLabel: 'Date:',
      refLabel: 'Ref / Outward No:',
      classTeacher: 'Class Teacher',
      principal: 'Principal',
      footerSchool: settings.schoolName || 'Shri Shivaji High School & Jr. College',
      footerAddress: 'Chikhli, Dist. Buldhana - 443201'
    },
    mr: {
      topHeader: 'बोनाफाईड प्रमाणपत्र',
      schoolName: (settings.schoolNameLocal || 'श्री शिवाजी हायस्कूल आणि कनिष्ठ महाविद्यालय, चिखली'),
      address: 'चिखली, जि. बुलढाणा - ४४३२०१',
      udisePrefix: 'यु-डायस क्र.',
      centerTitle: 'बोनाफाईड प्रमाणपत्र',
      certifyPrefix: 'प्रमाणित करण्यात येते की,',
      honorific: 'श्री / कु.',
      regularStudentPrefix: 'हे या शाळेचे चालू शैक्षणिक सत्र',
      sessionPrefix: '',
      sessionInfix: 'मध्ये',
      classPrefix: 'इयत्ता',
      classSuffix: 'चे नियमित विद्यार्थी आहेत/होते.',
      recordStatement: 'त्यांचे मूळ गुणपत्रक व शाळा सोडल्याचा दाखला शाळा दप्तरी जमा आहे.',
      casteStatementPrefix: 'शाळा दप्तरी (शाळा सोडल्याच्या दाखल्यानुसार) त्यांची जात',
      casteStatementSuffix: 'अशी नोंदलेली आहे.',
      dobStatementPrefix: 'शालेय दप्तरी नोंदीनुसार त्यांची जन्म तारीख (अंकी)',
      dobWordsPrefix: '(अक्षरी)',
      grNoPrefix: 'जनरल रजिस्टर नं. (Gen. Reg. No.)',
      placeLabel: 'ठिकाण:',
      defaultPlace: 'चिखली',
      dateLabel: 'दिनांक:',
      refLabel: 'जावक क्र.:',
      classTeacher: 'वर्ग शिक्षक',
      principal: 'मुख्याध्यापक / प्राचार्य',
      footerSchool: settings.schoolNameLocal || 'श्री शिवाजी हायस्कूल आणि कनिष्ठ महाविद्यालय, चिखली',
      footerAddress: 'चिखली, जि. बुलढाणा - ४४३२०१'
    },
    hi: {
      topHeader: 'बोनाफाइड प्रमाण पत्र',
      schoolName: (settings.schoolNameLocal || 'श्री शिवाजी हाईस्कूल एवं जूनियर कॉलेज, चिखली'),
      address: 'चिखली, जिला बुलढाणा - ४४३२०१',
      udisePrefix: 'यू-डायस क्र.',
      centerTitle: 'बोनाफाइड प्रमाण पत्र',
      certifyPrefix: 'प्रमाणित किया जाता है कि,',
      honorific: 'श्री / कु.',
      regularStudentPrefix: 'इस विद्यालय के चालू शैक्षणिक सत्र',
      sessionPrefix: '',
      sessionInfix: 'में',
      classPrefix: 'कक्षा',
      classSuffix: 'के नियमित विद्यार्थी हैं/थे।',
      recordStatement: 'उनकी मूल अंकसूची एवं विद्यालय छोड़ने का प्रमाण पत्र विद्यालय अभिलेख में जमा है।',
      casteStatementPrefix: 'विद्यालय अभिलेख (विद्यालय छोड़ने के प्रमाण पत्र) के अनुसार उनकी जाति',
      casteStatementSuffix: 'दर्ज है।',
      dobStatementPrefix: 'विद्यालय अभिलेख के अनुसार उनकी जन्म तिथि (अंकों में)',
      dobWordsPrefix: '(शब्दों में)',
      grNoPrefix: 'जनरल रजिस्टर नं. (Gen. Reg. No.)',
      placeLabel: 'स्थान:',
      defaultPlace: 'चिखली',
      dateLabel: 'दिनांक:',
      refLabel: 'जावक क्र.:',
      classTeacher: 'वर्ग शिक्षक',
      principal: 'प्रधानाचार्य / प्राचार्य',
      footerSchool: settings.schoolName || 'श्री शिवाजी हाईस्कूल एवं जूनियर कॉलेज',
      footerAddress: 'चिखली, जिला बुलढाणा - ४४३२०१'
    }
  };

  const t = texts[currentLang];

  // Academic year/session e.g. "2026 / 2027" or "2026-2027"
  const rawAcademicYear = student.admissionYear || settings.academicYear || '2026-2027';
  const sessionFormatted = rawAcademicYear.includes('-') 
    ? rawAcademicYear.replace('-', ' / ') 
    : rawAcademicYear.includes('/') 
    ? rawAcademicYear 
    : `${rawAcademicYear} / ${parseInt(rawAcademicYear, 10) + 1 || '2027'}`;

  // Student name - 100% clean single full name
  const localName = getLocalizedStudentName(student, 'mr');
  const latinName = getLocalizedStudentName(student, 'en');
  const displayStudentName = nameScript === 'latin' ? latinName : localName;

  // Class
  const displayClass = formatBonafideClass(student.admissionClass || '6th', currentLang);

  // Caste / Category
  const displayCaste = formatBonafideCaste(student, currentLang);

  // Date of birth Figure & Words
  const dobFigure = formatDate(student.birthDate);
  const dobWords = dateToWords(student.birthDate, wordsScript);

  // General Register Number
  const displayGrNumber = student.grNumber || '37563';

  // UDISE
  const displayUdise = settings.udiseNumber || '27070200119';

  // Issue Date
  const issueDateFormatted = formatDate(issueDate);

  return (
    <div className="w-full flex flex-col items-center">
      {/* 1. EXACT SCHOOL PROFORMA (Identical layout for English, Marathi & Hindi) */}
      <div className="a4-document-page bg-white text-slate-950 mx-auto w-full max-w-[210mm] min-h-[297mm] p-4 sm:p-6 border-4 border-double border-slate-900 relative font-serif print:border-4 print:border-double print:border-black print:p-4 print:m-0 print:shadow-none shadow-xl flex flex-col justify-between">
          <div className="a4-inner-box border-2 border-slate-900 p-6 sm:p-10 flex-1 flex flex-col justify-between">
            
            {/* Header Section */}
            <div className="text-center">
              <p className="font-serif font-black tracking-widest text-base sm:text-lg uppercase text-slate-900">
                {t.topHeader}
              </p>
              
              <h1 className="font-serif font-black text-xl sm:text-2xl tracking-wide uppercase text-slate-950 mt-2 leading-tight">
                {t.schoolName}
              </h1>

              <p className="font-sans font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-800 mt-1">
                {t.address}
              </p>

              <p className="font-mono font-black text-xs sm:text-sm uppercase tracking-wider text-slate-900 mt-1">
                {t.udisePrefix} {displayUdise}
              </p>

              {/* Decorative Header Double Line */}
              <div className="my-5 border-t-2 border-b-2 border-slate-900 py-1">
                <h2 className="text-center font-serif font-black text-xl sm:text-2xl uppercase tracking-widest text-slate-950">
                  {t.centerTitle}
                </h2>
              </div>
            </div>

            {/* Certificate Body Paragraphs */}
            <div className="my-auto space-y-6 sm:space-y-8 text-base sm:text-[18px] leading-relaxed text-slate-950 font-serif">
              
              <p className="font-medium">
                {t.certifyPrefix}
              </p>

              <p className="text-lg sm:text-xl font-bold tracking-wide">
                {t.honorific}{' '}
                <span className="font-black underline uppercase text-slate-950 decoration-slate-900 decoration-2 underline-offset-4 px-1">
                  {displayStudentName}
                </span>
              </p>

              {currentLang === 'en' ? (
                <p className="leading-loose">
                  {t.regularStudentPrefix}{' '}
                  <span className="font-black underline uppercase px-1 text-slate-950 decoration-slate-900 decoration-2 underline-offset-4">
                    {displayClass}
                  </span>{' '}
                  {t.classSuffix}
                  <br />
                  {t.sessionPrefix}{' '}
                  <span className="font-black underline font-mono px-1 text-slate-950 decoration-slate-900 decoration-2 underline-offset-4">
                    {sessionFormatted}
                  </span>
                  .
                </p>
              ) : (
                <p className="leading-loose">
                  {t.regularStudentPrefix}{' '}
                  <span className="font-black underline font-mono px-1 text-slate-950 decoration-slate-900 decoration-2 underline-offset-4">
                    {sessionFormatted}
                  </span>{' '}
                  {t.sessionInfix}
                  <br />
                  {t.classPrefix}{' '}
                  <span className="font-black underline uppercase px-1 text-slate-950 decoration-slate-900 decoration-2 underline-offset-4">
                    {displayClass}
                  </span>{' '}
                  {t.classSuffix}
                </p>
              )}

              <p className="leading-relaxed">
                {t.recordStatement}
              </p>

              <p className="leading-relaxed">
                {t.casteStatementPrefix}{' '}
                <span className="font-black underline uppercase px-1 text-slate-950 decoration-slate-900 decoration-2 underline-offset-4">
                  {displayCaste}
                </span>
                {t.casteStatementSuffix ? ` ${t.casteStatementSuffix}` : '.'}
              </p>

              <p className="leading-loose">
                {t.dobStatementPrefix}{' '}
                <span className="font-black underline font-mono px-1 text-slate-950 decoration-slate-900 decoration-2 underline-offset-4 text-lg">
                  {dobFigure}
                </span>
                <br />
                {t.dobWordsPrefix}{' '}
                <span className="font-black underline px-1 text-slate-950 decoration-slate-900 decoration-2 underline-offset-4">
                  {dobWords}
                </span>
              </p>

              <p className="text-lg sm:text-xl font-bold">
                {t.grNoPrefix}{' '}
                <span className="font-black underline font-mono text-slate-950 decoration-slate-900 decoration-2 underline-offset-4 px-1">
                  {displayGrNumber}
                </span>
              </p>

            </div>

            {/* Footer Information & Signatures */}
            <div className="pt-6 sm:pt-8 font-serif">
              
              <div className="flex justify-between items-start text-sm sm:text-base font-semibold text-slate-950 mb-6">
                <div className="space-y-1">
                  <p>
                    {t.placeLabel} <span className="font-bold">{t.defaultPlace}</span>
                  </p>
                  <p>
                    {t.dateLabel} <span className="font-bold font-mono">{issueDateFormatted}</span>
                  </p>
                  {serialNumber && (
                    <p className="text-xs text-slate-600 font-mono">
                      {t.refLabel} {serialNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Signature Line */}
              <div className="flex justify-between items-end pt-12 sm:pt-16 pb-2 px-2 sm:px-6">
                <div className="text-center">
                  <div className="h-10 flex items-end justify-center">
                    <span className="w-36 border-b border-dotted border-slate-800 inline-block"></span>
                  </div>
                  <p className="mt-2 font-black text-base sm:text-lg text-slate-950 uppercase font-sans tracking-wide">
                    {t.classTeacher}
                  </p>
                </div>

                <div className="text-center">
                  <div className="h-10 flex items-end justify-center">
                    <span className="w-48 border-b border-dotted border-slate-800 inline-block"></span>
                  </div>
                  <p className="mt-2 font-black text-base sm:text-lg text-slate-950 uppercase font-sans tracking-wide">
                    {t.principal}
                  </p>
                  <p className="text-xs text-slate-700 font-bold uppercase mt-0.5 font-sans">
                    {t.footerSchool}
                  </p>
                  <p className="text-[11px] text-slate-600 font-medium font-sans">
                    {t.footerAddress}
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
    </div>
  );
}
