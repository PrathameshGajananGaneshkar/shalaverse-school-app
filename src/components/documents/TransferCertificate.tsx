import { Student } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { formatDate, dateToWords } from '../../utils/dateUtils';
import { 
  getLocalizedStudentName, 
  getLocalizedFatherName, 
  getLocalizedMotherName, 
  getLocalizedNationality, 
  getLocalizedMotherTongue, 
  getLocalizedReligion, 
  getLocalizedCaste, 
  getLocalizedSubCaste, 
  getLocalizedPreviousSchool, 
  getLocalizedClass, 
  getLocalizedProgress, 
  getLocalizedBehaviour, 
  getLocalizedLeavingReason,
  getLocalizedAddress,
  getLocalizedBoard,
  getLocalizedRecognitionNo,
  getLocalizedSansthaName,
  transliterateToDevanagari,
  cleanEnglishText,
  extractCleanLanguageName
} from '../../utils/devanagariUtils';
import { GraduationCap } from 'lucide-react';

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

function parseStudentNameParts(student: Student, lang: 'en' | 'mr' | 'hi' = 'mr') {
  const fullName = getLocalizedStudentName(student, lang).replace(/[()[\]{}]/g, '').trim();
  const rawFather = getLocalizedFatherName(student, lang).replace(/[()[\]{}]/g, '').trim();
  
  const parts = fullName.split(/\s+/).filter(Boolean);
  
  let surname = '';
  let firstName = '';
  let fatherName = '';

  if (parts.length === 1) {
    firstName = parts[0];
  } else if (parts.length === 2) {
    surname = parts[0];
    firstName = parts[1];
  } else if (parts.length >= 3) {
    surname = parts[0];
    firstName = parts[1];
    fatherName = parts.slice(2).join(' ');
  }

  // Refine fatherName cleanly without duplicate surname or repetition
  if (!fatherName && rawFather && rawFather !== '-') {
    fatherName = rawFather;
  } else if (rawFather && rawFather !== '-') {
    const fParts = rawFather.split(/\s+/).filter(Boolean);
    if (fParts.length > 1 && surname && fParts[0].toLowerCase() === surname.toLowerCase()) {
      fatherName = fParts.slice(1).join(' ');
    } else if (fParts.length === 1) {
      fatherName = fParts[0];
    } else {
      fatherName = rawFather;
    }
  }

  return {
    firstName: (firstName || fullName).replace(/[()[\]{}]/g, '').trim(),
    fatherName: (fatherName || '-').replace(/[()[\]{}]/g, '').trim(),
    surname: (surname || '-').replace(/[()[\]{}]/g, '').trim(),
  };
}

function parseBirthPlaceParts(placeStr?: string, lang: 'en' | 'mr' | 'hi' = 'mr') {
  if (!placeStr) {
    return {
      village: lang === 'mr' ? 'चिखली' : lang === 'hi' ? 'चिखली' : 'Chikhli',
      taluka: lang === 'mr' ? 'चिखली' : lang === 'hi' ? 'चिखली' : 'Chikhli',
      district: lang === 'mr' ? 'बुलढाणा' : lang === 'hi' ? 'बुलढाणा' : 'Buldhana',
      state: lang === 'mr' ? 'महाराष्ट्र' : lang === 'hi' ? 'महाराष्ट्र' : 'Maharashtra',
      country: lang === 'mr' ? 'भारत' : lang === 'hi' ? 'भारत' : 'India'
    };
  }
  const clean = placeStr.replace(/^(At Post|A\/P|At|Post|मु\.?\s*पो\.?)\s+/i, '');
  const parts = clean.split(/[,/•-]/).map(s => s.trim()).filter(Boolean);

  let rawVillage = parts[0] || (lang === 'en' ? 'Chikhli' : 'चिखली');
  let rawTaluka = lang === 'en' ? 'Chikhli' : 'चिखली';
  let rawDistrict = lang === 'en' ? 'Buldhana' : 'बुलढाणा';
  let rawState = lang === 'en' ? 'Maharashtra' : 'महाराष्ट्र';
  let rawCountry = lang === 'en' ? 'India' : 'भारत';

  for (const part of parts) {
    if (/tal|taluka|तहसील|ता\./i.test(part)) {
      rawTaluka = part.replace(/tal(uka)?\.?|तहसील|ता\./i, '').trim();
    } else if (/dist|district|जि|जिल्हा|जिला/i.test(part)) {
      rawDistrict = part.replace(/dist(rict)?\.?|जि(ल्हा)?\.?|जिला/i, '').trim();
    } else if (/maharashtra|महाराष्ट्र/i.test(part)) {
      rawState = lang === 'en' ? 'Maharashtra' : 'महाराष्ट्र';
    } else if (/india|भारत/i.test(part)) {
      rawCountry = lang === 'en' ? 'India' : 'भारत';
    }
  }

  if (lang === 'en') {
    return {
      village: cleanEnglishText(rawVillage) || 'Chikhli',
      taluka: cleanEnglishText(rawTaluka) || 'Chikhli',
      district: cleanEnglishText(rawDistrict) || 'Buldhana',
      state: cleanEnglishText(rawState) || 'Maharashtra',
      country: cleanEnglishText(rawCountry) || 'India'
    };
  }

  return {
    village: extractCleanLanguageName(rawVillage, lang) || 'चिखली',
    taluka: extractCleanLanguageName(rawTaluka, lang) || 'चिखली',
    district: extractCleanLanguageName(rawDistrict, lang) || 'बुलढाणा',
    state: lang === 'mr' ? 'महाराष्ट्र' : 'महाराष्ट्र',
    country: lang === 'mr' ? 'भारत' : 'भारत'
  };
}

function getStandardInWords(std?: string, lang: 'en' | 'mr' | 'hi' = 'mr'): string {
  const s = (std || '').toLowerCase();
  if (s.includes('1st') || s.includes('1') || s.includes('पहिली')) return lang === 'mr' ? 'पहिली' : lang === 'hi' ? 'पहली' : 'First (1st)';
  if (s.includes('2nd') || s.includes('2') || s.includes('दुसरी')) return lang === 'mr' ? 'दुसरी' : lang === 'hi' ? 'दूसरी' : 'Second (2nd)';
  if (s.includes('3rd') || s.includes('3') || s.includes('तिसरी')) return lang === 'mr' ? 'तिसरी' : lang === 'hi' ? 'तीसरी' : 'Third (3rd)';
  if (s.includes('4th') || s.includes('4') || s.includes('चौथी')) return lang === 'mr' ? 'चौथी' : lang === 'hi' ? 'चौथी' : 'Fourth (4th)';
  if (s.includes('5th') || s.includes('5') || s.includes('पाचवी')) return lang === 'mr' ? 'पाचवी' : lang === 'hi' ? 'पांचवीं' : 'Fifth (5th)';
  if (s.includes('6th') || s.includes('6') || s.includes('सहावी')) return lang === 'mr' ? 'सहावी' : lang === 'hi' ? 'छठी' : 'Sixth (6th)';
  if (s.includes('7th') || s.includes('7') || s.includes('सातवी')) return lang === 'mr' ? 'सातवी' : lang === 'hi' ? 'सातवीं' : 'Seventh (7th)';
  if (s.includes('8th') || s.includes('8') || s.includes('आठवी')) return lang === 'mr' ? 'आठवी' : lang === 'hi' ? 'आठवीं' : 'Eighth (8th)';
  if (s.includes('9th') || s.includes('9') || s.includes('नववी')) return lang === 'mr' ? 'नववी' : lang === 'hi' ? 'नौवीं' : 'Ninth (9th)';
  if (s.includes('10th') || s.includes('10') || s.includes('दहावी')) return lang === 'mr' ? 'दहावी' : lang === 'hi' ? 'दसवीं' : 'Tenth (10th)';
  if (s.includes('11th') || s.includes('11') || s.includes('अकरावी')) return lang === 'mr' ? 'अकरावी' : lang === 'hi' ? 'ग्यारहवीं' : 'Eleventh (11th)';
  if (s.includes('12th') || s.includes('12') || s.includes('बारावी')) return lang === 'mr' ? 'बारावी' : lang === 'hi' ? 'बारहवीं' : 'Twelfth (12th)';
  return lang === 'mr' ? 'दुसरी' : lang === 'hi' ? 'दूसरी' : std || 'Second (2nd)';
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

  const nameParts = parseStudentNameParts(student, lang);
  const birthParts = parseBirthPlaceParts(lang === 'en' ? (student.birthPlace || student.birthPlaceLocal) : (student.birthPlaceLocal || student.birthPlace), lang);
  const stdWords = getStandardInWords(student.admissionClass, lang);

  const placeName = lang === 'mr' 
    ? 'चिखली (जि. बुलढाणा)' 
    : lang === 'hi' 
    ? 'चिखली (जि. बुलढाणा)' 
    : 'Chikhli (Dist. Buldhana)';

  const formattedAddress = getLocalizedAddress(settings.address, lang);
  const boardName = getLocalizedBoard(settings.boardName, lang);
  const recognitionText = getLocalizedRecognitionNo(settings.recognitionNo, lang);
  const sansthaName = getLocalizedSansthaName(settings.boardAffiliation, lang);

  return (
    <div className="a4-document-page bg-white text-slate-900 mx-auto w-full max-w-[210mm] min-h-[297mm] p-3 sm:p-4 border-2 border-slate-900 relative font-serif print:border-2 print:border-black print:p-2 print:m-0 print:shadow-none shadow-xl group flex flex-col justify-between">
      {/* Decorative Outer Double Border */}
      <div className="a4-inner-box border-2 border-slate-900 p-3 sm:p-4.5 flex-1 flex flex-col justify-between">
        
        {/* Certificate Header */}
        <div className="text-center border-b-2 border-slate-900 pb-2">
          <div className="flex items-center justify-center gap-2.5 mb-1">
            <div className="w-10 h-10 rounded-full border-2 border-slate-900 flex items-center justify-center text-slate-900 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs uppercase font-sans font-bold tracking-wider text-slate-800">
                {sansthaName}
              </p>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase leading-tight font-serif">
                {lang === 'en' ? settings.schoolName : (settings.schoolNameLocal || settings.schoolName)}
              </h1>
            </div>
          </div>

          <p className="text-xs text-slate-700 font-sans mt-0.5 font-medium">
            {formattedAddress} • {lang === 'mr' ? 'दूरध्वनी:' : lang === 'hi' ? 'फोन:' : 'Ph:'} <strong className="font-mono text-slate-900 font-bold">{settings.phone || '(07264)-242113'}</strong> • {lang === 'mr' ? 'ई-मेल:' : lang === 'hi' ? 'ई-मेल:' : 'Email:'} {settings.email}
          </p>

          {/* School Recognition Number Bar */}
          <div className="bg-slate-50 border-t border-b border-slate-300 py-0.5 my-1 text-[10.5px] sm:text-[11.5px] font-sans font-semibold text-slate-800">
            <span>{lang === 'mr' ? 'शाळा मान्यता क्र.: ' : lang === 'hi' ? 'विद्यालय मान्यता क्र.: ' : 'School Recognition No.: '}</span>
            <strong className="font-semibold text-slate-950">{recognitionText}</strong>
          </div>

          {/* Board, Affiliation, U-DISE, Medium 4-Column Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[11px] sm:text-xs font-sans font-bold text-slate-900 px-1">
            <div className="text-left">
              <span className="text-slate-600 font-normal">{lang === 'mr' ? 'मंडळ: ' : lang === 'hi' ? 'बोर्ड: ' : 'Board: '}</span>
              <strong>{boardName}</strong>
            </div>
            <div>
              <span className="text-slate-600 font-normal">{lang === 'mr' ? 'संलग्नता क्र.: ' : lang === 'hi' ? 'संबद्धता क्र.: ' : 'Affiliation No.: '}</span>
              <strong className="font-mono">{settings.affiliationNo || '04.03.016'}</strong>
            </div>
            <div>
              <span className="text-slate-600 font-normal">{lang === 'mr' ? 'यु-डायस क्र.: ' : lang === 'hi' ? 'यू-डाइस क्र.: ' : 'U-DISE No.: '}</span>
              <strong className="font-mono text-slate-950">{settings.udiseNumber || '27040200119'}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-600 font-normal">{lang === 'mr' ? 'माध्यम: ' : lang === 'hi' ? 'माध्यम: ' : 'Medium: '}</span>
              <strong>{lang === 'mr' ? 'मराठी / सेमी इंग्रजी' : lang === 'hi' ? 'मराठी / सेमी' : 'Marathi / Semi'}</strong>
            </div>
          </div>

          {/* Certificate Title Badge */}
          <div className="mt-1.5">
            <div className="inline-block border-2 border-slate-900 px-6 py-1 bg-slate-100 font-sans shadow-sm">
              <h2 className="text-base sm:text-lg font-black tracking-wider uppercase text-slate-950">
                {lang === 'mr' && 'शाळा सोडल्याचा दाखला'}
                {lang === 'hi' && 'स्थानांतरण प्रमाण पत्र / टी.सी.'}
                {lang === 'en' && 'TRANSFER / SCHOOL LEAVING CERTIFICATE'}
              </h2>
              <p className="text-[10.5px] sm:text-[11.5px] font-bold text-slate-800">
                {lang === 'mr' && '( माध्यमिक शाळा संहिता नियम १७ व ३१ नुसार शाळा सोडल्याचे अधिकृत प्रमाणपत्र )'}
                {lang === 'hi' && '( माध्यमिक विद्यालय संहिता नियम १७ एवं ३१ के अंतर्गत शाला त्याग प्रमाण पत्र )'}
                {lang === 'en' && '( Under Secondary Schools Code Rules 17 & 31 )'}
              </p>
            </div>
          </div>
        </div>

        {/* Certificate Meta Info Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-sans font-semibold my-2.5 border-b-2 border-slate-900 pb-2 px-1 text-slate-900">
          <div>
            <span className="text-slate-600 block text-[11px] font-normal">{lang === 'mr' ? 'दाखला क्र.:' : lang === 'hi' ? 'प्रमाण पत्र क्र.:' : 'Serial No.:'}</span>
            <strong className="text-slate-950 font-mono text-sm underline block mt-0.5">{serialNumber || '___________'}</strong>
          </div>
          <div>
            <span className="text-slate-600 block text-[11px] font-normal">{lang === 'mr' ? 'विद्यार्थी आयडी:' : lang === 'hi' ? 'विद्यार्थी आईडी:' : 'Student ID:'}</span>
            <strong className="text-slate-950 font-mono text-sm font-bold block mt-0.5">{student.studentId || (student.grNumber ? `STU-${student.admissionYear?.slice(0, 4) || '2026'}-${student.grNumber}` : '-')}</strong>
          </div>
          <div>
            <span className="text-slate-800 block text-[11px] font-bold">{lang === 'mr' ? 'जनरल रजिस्टर क्र.:' : lang === 'hi' ? 'जनरल रजिस्टर क्र.:' : 'G.R. No.:'}</span>
            <strong className="text-slate-950 font-mono text-base font-black underline block mt-0.5">{student.grNumber || '__________'}</strong>
          </div>
          <div>
            <span className="text-slate-600 block text-[11px] font-normal">{lang === 'mr' ? 'सरल / आधार क्र.:' : lang === 'hi' ? 'आधार क्र.:' : 'Student UID:'}</span>
            <strong className="text-slate-950 font-mono text-sm block mt-0.5">{student.uid || '-'}</strong>
          </div>
        </div>

        {/* Certificate 13-Row Official Table */}
        <div className="flex-1 my-2 flex flex-col justify-center">
          <table className="w-full text-left border-collapse text-xs sm:text-[13px] print:text-[11.5px] border-2 border-slate-900 leading-normal">
            <tbody>
              {/* 1. Student's Full Name */}
              <tr className="border-b border-slate-900">
                <td className="py-2.5 px-2 print:py-1.5 font-bold w-9 text-center border-r border-slate-900 bg-slate-50">१</td>
                <td className="py-2.5 px-3 print:py-1.5 font-bold w-60 sm:w-72 border-r border-slate-900 text-slate-900">
                  <div className="text-slate-950">{lang === 'mr' ? "विद्यार्थ्याचे संपूर्ण नाव" : lang === 'hi' ? "विद्यार्थी का पूरा नाम" : "Student's Full Name"}</div>
                  {lang === 'en' && (
                    <div className="text-[11px] text-slate-600 font-normal">
                      (Name / Father's Name / Surname)
                    </div>
                  )}
                </td>
                <td className="py-2.5 px-3 print:py-1.5 text-slate-950 bg-white">
                  <div className="text-sm sm:text-[14.5px] font-black uppercase text-slate-950 mb-1">
                    {getLocalizedStudentName(student, lang)}
                  </div>
                  <div className="text-xs text-slate-800 pt-1 border-t border-slate-200 flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                      <span className="text-slate-600">{lang === 'mr' ? 'नाव: ' : lang === 'hi' ? 'नाम: ' : 'Name: '}</span>
                      <strong className="font-bold underline text-slate-950">{nameParts.firstName}</strong>
                    </span>
                    <span>
                      <span className="text-slate-600">{lang === 'mr' ? 'वडिलांचे नाव: ' : lang === 'hi' ? 'पिता का नाम: ' : "Father's Name: "}</span>
                      <strong className="font-bold underline text-slate-950">{nameParts.fatherName}</strong>
                    </span>
                    <span>
                      <span className="text-slate-600">{lang === 'mr' ? 'आडनाव: ' : lang === 'hi' ? 'उपनाम: ' : 'Surname: '}</span>
                      <strong className="font-bold underline text-slate-950">{nameParts.surname}</strong>
                    </span>
                  </div>
                </td>
              </tr>

              {/* 2. Mother's Name */}
              <tr className="border-b border-slate-900">
                <td className="py-2.5 px-2 print:py-1.5 font-bold text-center border-r border-slate-900 bg-slate-50">२</td>
                <td className="py-2.5 px-3 print:py-1.5 font-bold border-r border-slate-900 text-slate-900">
                  <div className="text-slate-950">{lang === 'mr' ? 'आईचे नाव' : lang === 'hi' ? 'माता का नाम' : "Mother's Name"}</div>
                </td>
                <td className="py-2.5 px-3 print:py-1.5 font-bold text-slate-950 text-sm">
                  {getLocalizedMotherName(student, lang) || '_________________'}
                </td>
              </tr>

              {/* 3. Nationality, Mother Tongue, Religion */}
              <tr className="border-b border-slate-900">
                <td className="py-2.5 px-2 print:py-1.5 font-bold text-center border-r border-slate-900 bg-slate-50">३</td>
                <td className="py-2.5 px-3 print:py-1.5 font-bold border-r border-slate-900 text-slate-900">
                  <div className="text-slate-950">{lang === 'mr' ? 'राष्ट्रीयत्व, मातृभाषा व धर्म' : lang === 'hi' ? 'राष्ट्रीयता, मातृभाषा एवं धर्म' : 'Nationality, Mother Tongue & Religion'}</div>
                </td>
                <td className="py-2.5 px-3 print:py-1.5 text-slate-950">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                    <div>
                      <span className="text-slate-600">{lang === 'mr' ? 'राष्ट्रीयत्व: ' : lang === 'hi' ? 'राष्ट्रीयता: ' : 'Nationality: '}</span>
                      <strong className="font-bold text-slate-950">{getLocalizedNationality(student, lang)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-600">{lang === 'mr' ? 'मातृभाषा: ' : lang === 'hi' ? 'मातृभाषा: ' : 'Mother Tongue: '}</span>
                      <strong className="font-bold text-slate-950">{getLocalizedMotherTongue(student, lang)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-600">{lang === 'mr' ? 'धर्म: ' : lang === 'hi' ? 'धर्म: ' : 'Religion: '}</span>
                      <strong className="font-bold text-slate-950">{getLocalizedReligion(student, lang)}</strong>
                    </div>
                  </div>
                </td>
              </tr>

              {/* 4. Caste & Sub-Caste */}
              <tr className="border-b border-slate-900">
                <td className="py-2.5 px-2 print:py-1.5 font-bold text-center border-r border-slate-900 bg-slate-50">४</td>
                <td className="py-2.5 px-3 print:py-1.5 font-bold border-r border-slate-900 text-slate-900">
                  <div className="text-slate-950">{lang === 'mr' ? 'जात व प्रवर्ग / पोटजात' : lang === 'hi' ? 'जाति एवं उपजाति' : 'Caste & Sub-Caste'}</div>
                </td>
                <td className="py-2.5 px-3 print:py-1.5 text-slate-950">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                    <div>
                      <span className="text-slate-600">{lang === 'mr' ? 'जात: ' : lang === 'hi' ? 'जाति: ' : 'Caste: '}</span>
                      <strong className="font-bold text-slate-950 text-sm">{getLocalizedCaste(student, lang) || '________'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-600">{lang === 'mr' ? 'पोटजात: ' : lang === 'hi' ? 'उपजाति: ' : 'Sub-Caste: '}</span>
                      <strong className="font-bold text-slate-950 text-sm">{getLocalizedSubCaste(student, lang) || '-'}</strong>
                    </div>
                  </div>
                </td>
              </tr>

              {/* 5. Place of Birth */}
              <tr className="border-b border-slate-900">
                <td className="py-2.5 px-2 print:py-1.5 font-bold text-center border-r border-slate-900 bg-slate-50">५</td>
                <td className="py-2.5 px-3 print:py-1.5 font-bold border-r border-slate-900 text-slate-900">
                  <div className="text-slate-950">{lang === 'mr' ? 'जन्मस्थळ' : lang === 'hi' ? 'जन्म स्थान' : 'Place of Birth'}</div>
                </td>
                <td className="py-2.5 px-3 print:py-1.5 text-slate-950">
                  <div className="text-xs sm:text-[13px] leading-relaxed">
                    <span className="text-slate-600">{lang === 'mr' ? 'गाव/शहर: ' : lang === 'hi' ? 'ग्राम/शहर: ' : 'Village/City: '}</span>
                    <strong className="font-bold text-slate-950 text-sm mr-2">{birthParts.village}</strong>
                    
                    <span className="text-slate-600">{lang === 'mr' ? 'ता.: ' : lang === 'hi' ? 'तहसील: ' : 'Tal.: '}</span>
                    <strong className="font-bold text-slate-950 mr-2">{birthParts.taluka}</strong>
                    
                    <span className="text-slate-600">{lang === 'mr' ? 'जि.: ' : lang === 'hi' ? 'जिला: ' : 'Dist.: '}</span>
                    <strong className="font-bold text-slate-950 mr-2">{birthParts.district}</strong>
                    
                    <span className="text-slate-500">|</span>
                    
                    <span className="text-slate-600 ml-2">{lang === 'mr' ? 'राज्य: ' : lang === 'hi' ? 'राज्य: ' : 'State: '}</span>
                    <strong className="font-bold text-slate-950 mr-2">{birthParts.state}</strong>
                    
                    <span className="text-slate-600">{lang === 'mr' ? 'देश: ' : lang === 'hi' ? 'देश: ' : 'Country: '}</span>
                    <strong className="font-bold text-slate-950">{birthParts.country}</strong>
                  </div>
                </td>
              </tr>

              {/* 6. Date of Birth according to Christian Era & in words */}
              <tr className="border-b border-slate-900">
                <td className="py-2.5 px-2 print:py-1.5 font-bold text-center border-r border-slate-900 bg-slate-50">६</td>
                <td className="py-2.5 px-3 print:py-1.5 font-bold border-r border-slate-900 text-slate-900">
                  <div className="text-slate-950">{lang === 'mr' ? 'इसवी सनाप्रमाणे जन्मदिनांक (अंकी व अक्षरी)' : lang === 'hi' ? 'ईस्वी सन् अनुसार जन्म तिथि (अंक व शब्द)' : 'Date of Birth (in figures & words)'}</div>
                </td>
                <td className="py-2.5 px-3 print:py-1.5">
                  <div className="flex flex-wrap items-baseline gap-2 mb-1">
                    <span className="text-slate-600 text-xs">{lang === 'mr' ? 'अंकी: ' : lang === 'hi' ? 'अंकों में: ' : 'In Figures: '}</span>
                    <strong className="font-mono font-black text-slate-950 text-sm underline">{formatDate(student.birthDate)}</strong>
                  </div>
                  <div className="text-xs pt-1 border-t border-slate-200">
                    <span className="text-slate-600">{lang === 'mr' ? 'अक्षरी: ' : lang === 'hi' ? 'शब्दों में: ' : 'In Words: '}</span>
                    <strong className="font-bold text-slate-950 italic">
                      {dateToWords(student.birthDate, lang)}
                    </strong>
                  </div>
                </td>
              </tr>

              {/* 7. Previous School and Standard */}
              <tr className="border-b border-slate-900">
                <td className="py-2.5 px-2 print:py-1.5 font-bold text-center border-r border-slate-900 bg-slate-50">७</td>
                <td className="py-2.5 px-3 print:py-1.5 font-bold border-r border-slate-900 text-slate-900">
                  <div className="text-slate-950">{lang === 'mr' ? 'यापूर्वीची शाळा व इयत्ता' : lang === 'hi' ? 'पूर्व विद्यालय एवं कक्षा' : 'Previous School and Standard'}</div>
                </td>
                <td className="py-2.5 px-3 print:py-1.5 font-bold text-slate-900">
                  {getLocalizedPreviousSchool(student, lang) || '_____________'}
                </td>
              </tr>

              {/* 8. Date of Admission to this School & Standard */}
              <tr className="border-b border-slate-900">
                <td className="py-2.5 px-2 print:py-1.5 font-bold text-center border-r border-slate-900 bg-slate-50">८</td>
                <td className="py-2.5 px-3 print:py-1.5 font-bold border-r border-slate-900 text-slate-900">
                  <div className="text-slate-950">{lang === 'mr' ? 'या शाळेत प्रवेश दिनांक व इयत्ता' : lang === 'hi' ? 'इस विद्यालय में प्रवेश तिथि एवं कक्षा' : 'Date of Admission to this School & Standard'}</div>
                </td>
                <td className="py-2.5 px-3 print:py-1.5 text-slate-950">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                    <div>
                      <span className="text-slate-600">{lang === 'mr' ? 'प्रवेश दिनांक: ' : lang === 'hi' ? 'प्रवेश तिथि: ' : 'Date of Admission: '}</span>
                      <strong className="font-bold font-mono text-slate-950 underline">{formatDate(student.admissionDate)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-600">{lang === 'mr' ? 'इयत्ता: ' : lang === 'hi' ? 'कक्षा: ' : 'Standard: '}</span>
                      <strong className="font-bold text-slate-950">{getLocalizedClass(student.admissionClass, lang)}</strong>
                    </div>
                  </div>
                </td>
              </tr>

              {/* 9. Progress in Studies & Conduct */}
              <tr className="border-b border-slate-900">
                <td className="py-2.5 px-2 print:py-1.5 font-bold text-center border-r border-slate-900 bg-slate-50">९</td>
                <td className="py-2.5 px-3 print:py-1.5 font-bold border-r border-slate-900 text-slate-900">
                  <div className="text-slate-950">{lang === 'mr' ? 'अभ्यासातील प्रगती व वर्तणूक' : lang === 'hi' ? 'अध्ययन में प्रगति एवं आचरण' : 'Progress in Studies & Conduct'}</div>
                </td>
                <td className="py-2.5 px-3 print:py-1.5 text-slate-950">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                    <div>
                      <span className="text-slate-600">{lang === 'mr' ? 'अभ्यासातील प्रगती: ' : lang === 'hi' ? 'प्रगति: ' : 'Progress in Studies: '}</span>
                      <strong className="font-bold text-slate-950">{getLocalizedProgress(finalProgress, lang)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-600">{lang === 'mr' ? 'वर्तणूक: ' : lang === 'hi' ? 'आचरण: ' : 'Conduct: '}</span>
                      <strong className="font-bold text-slate-950">{getLocalizedBehaviour(finalConduct, lang)}</strong>
                    </div>
                  </div>
                </td>
              </tr>

              {/* 10. Date of Leaving School */}
              <tr className="border-b border-slate-900">
                <td className="py-2.5 px-2 print:py-1.5 font-bold text-center border-r border-slate-900 bg-slate-50">१०</td>
                <td className="py-2.5 px-3 print:py-1.5 font-bold border-r border-slate-900 text-slate-900">
                  <div className="text-slate-950">{lang === 'mr' ? 'शाळा सोडल्याची तारीख' : lang === 'hi' ? 'विद्यालय छोड़ने की तिथि' : 'Date of Leaving School'}</div>
                </td>
                <td className="py-2.5 px-3 print:py-1.5 font-mono font-bold text-slate-950 text-sm">
                  {formatDate(issueDate)}
                </td>
              </tr>

              {/* 11. Standard in which studying & since when */}
              <tr className="border-b border-slate-900">
                <td className="py-2.5 px-2 print:py-1.5 font-bold text-center border-r border-slate-900 bg-slate-50">११</td>
                <td className="py-2.5 px-3 print:py-1.5 font-bold border-r border-slate-900 text-slate-900">
                  <div className="text-slate-950">{lang === 'mr' ? 'कोणत्या इयत्तेत शिकत होता व केव्हापासून' : lang === 'hi' ? 'किस कक्षा में अध्ययनरत था एवं कब से' : 'Standard in which studying & since when'}</div>
                </td>
                <td className="py-2.5 px-3 print:py-1.5 font-bold text-slate-950">
                  {lang === 'mr' 
                    ? `इयत्ता ${getLocalizedClass(student.admissionClass, lang)} (${stdWords}) - शैक्षणिक वर्ष ${student.admissionYear || '२०२६-२७'} पासून` 
                    : lang === 'hi'
                    ? `कक्षा ${getLocalizedClass(student.admissionClass, lang)} (${stdWords}) - शैक्षणिक सत्र ${student.admissionYear || '२०२६-२७'} से`
                    : `Class ${student.admissionClass} (${stdWords}) since academic year ${student.admissionYear || '2026-27'}`}
                </td>
              </tr>

              {/* 12. Reason for Leaving School */}
              <tr className="border-b border-slate-900">
                <td className="py-2.5 px-2 print:py-1.5 font-bold text-center border-r border-slate-900 bg-slate-50">१२</td>
                <td className="py-2.5 px-3 print:py-1.5 font-bold border-r border-slate-900 text-slate-900">
                  <div className="text-slate-950">{lang === 'mr' ? 'शाळा सोडण्याचे कारण' : lang === 'hi' ? 'विद्यालय छोड़ने का कारण' : 'Reason for Leaving School'}</div>
                </td>
                <td className="py-2.5 px-3 print:py-1.5 font-bold text-slate-950 text-sm">
                  {getLocalizedLeavingReason(finalLeavingReason, lang)}
                </td>
              </tr>

              {/* 13. Remarks */}
              <tr className="border-b-0 border-slate-900">
                <td className="py-2.5 px-2 print:py-1.5 font-bold text-center border-r border-slate-900 bg-slate-50">१३</td>
                <td className="py-2.5 px-3 print:py-1.5 font-bold border-r border-slate-900 text-slate-900">
                  <div className="text-slate-950">{lang === 'mr' ? 'शेरा' : lang === 'hi' ? 'टिप्पणी' : 'Remarks'}</div>
                </td>
                <td className="py-2.5 px-3 print:py-1.5 text-slate-900 font-medium">
                  {lang === 'mr' ? 'सर्व शालेय फी पूर्ण भरलेली आहे. कोणतीही बाकी नाही.' : lang === 'hi' ? 'सभी शालेय शुल्क पूर्णतः जमा हैं। कोई बकाया नहीं है।' : 'All school dues paid in full. No dues pending.'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Declaration Statement */}
        <div className="mt-2 pt-1.5 text-xs sm:text-[12.5px] text-slate-900 italic text-center font-sans border-t border-slate-300 font-semibold">
          {lang === 'mr' 
            ? 'प्रमाणित करण्यात येते की, वरील माहिती शाळेतील जनरल रजिस्टर क्र. १ मधील नोंदीनुसार अचूक आहे.' 
            : lang === 'hi' 
            ? 'प्रमाणित किया जाता है कि उपरोक्त विवरण विद्यालय के सामान्य रजिस्टर क्र. १ के अभिलेखों के अनुसार सत्य है।' 
            : 'Certified that the above information is as per General Register No. 1 of the school.'}
        </div>

        {/* Official Signatures & Seal Footer */}
        <div className="mt-2.5 pt-2 border-t-2 border-slate-900 font-sans">
          <div className="flex items-center justify-between text-xs text-slate-800 mb-2 font-semibold px-2">
            <span>{lang === 'mr' ? 'दिनांक: ' : lang === 'hi' ? 'दिनांक: ' : 'Date: '}<strong className="font-mono text-slate-950 underline">{formatDate(issueDate)}</strong></span>
            <span>{lang === 'mr' ? 'ठिकाण: ' : lang === 'hi' ? 'स्थान: ' : 'Place: '}<strong className="text-slate-950">{placeName}</strong></span>
          </div>

          <div className="grid grid-cols-3 text-center gap-3 text-xs font-bold text-slate-900 my-1">
            <div>
              <div className="h-12 sm:h-14 print:h-10 flex items-end justify-center">
                <span className="border-b border-dotted border-slate-600 w-32 inline-block"></span>
              </div>
              <p className="mt-1">{lang === 'mr' ? 'वर्गशिक्षक' : lang === 'hi' ? 'कक्षा शिक्षक' : 'Class Teacher'}</p>
            </div>

            <div>
              <div className="h-12 sm:h-14 print:h-10 flex items-center justify-center">
                <div className="w-20 h-10 border border-dashed border-slate-400 rounded flex items-center justify-center text-[10px] text-slate-400">
                  {lang === 'mr' ? 'शाळेचा शिक्का' : lang === 'hi' ? 'विद्यालय मोहर' : 'School Seal'}
                </div>
              </div>
              <p className="mt-1">{lang === 'mr' ? 'लिपिक' : lang === 'hi' ? 'लिपिक' : 'Clerk'}</p>
            </div>

            <div>
              <div className="h-12 sm:h-14 print:h-10 flex items-end justify-center">
                <span className="border-b border-dotted border-slate-600 w-36 inline-block"></span>
              </div>
              <p className="mt-1 text-slate-950">{lang === 'mr' ? 'मुख्याध्यापक' : lang === 'hi' ? 'प्रधानाचार्य' : 'Headmaster'}</p>
              <p className="text-[10px] font-normal text-slate-600 leading-none mt-0.5">{settings.headmasterName}</p>
            </div>
          </div>

          {/* Legal Warning Note */}
          <div className="mt-2 pt-1 border-t border-slate-200 text-[10px] sm:text-[11px] text-slate-700 font-sans italic text-center font-medium">
            {lang === 'mr' 
              ? 'टीप: शाळा सोडल्याच्या दाखल्यामध्ये कोणत्याही प्रकारची अनधिकृत खाडाखोड किंवा फेरबदल केल्यास संबंधितांवर कायदेशीर कारवाई करण्यात येईल.' 
              : lang === 'hi' 
              ? 'टीप: स्थानांतरण प्रमाण पत्र में किसी भी प्रकार का अनधिकृत परिवर्तन करने पर संबंधित के विरुद्ध वैधानिक कार्रवाई की जाएगी।' 
              : 'Note: If any unauthorized alteration is made in the School Leaving Certificate, legal action will be taken against the concerned person/persons.'}
          </div>
        </div>

      </div>
    </div>
  );
}
