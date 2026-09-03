import { useState, useEffect } from 'react';
import { Student } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { formatDate, dateToWords } from '../../utils/dateUtils';
import { 
  getLocalizedStudentName, 
  getLocalizedFatherName, 
  getLocalizedBirthPlace, 
  getLocalizedMotherTongue, 
  getLocalizedCaste, 
  getLocalizedPreviousSchool, 
  getLocalizedLeavingReason,
  cleanEnglishText,
  transliterateToDevanagari,
  cleanAndLocalizePlace,
  cleanAndLocalizeTaluka
} from '../../utils/devanagariUtils';

interface NirgamUtaraProps {
  student: Student;
  extractNumber?: string;
  issueDate?: string;
  applicantName?: string;
  lang?: 'en' | 'mr' | 'hi';
  onEdit?: () => void;
}

// Format standard / class specifically for Register
function formatRegisterClass(rawClass?: string, lang: 'en' | 'mr' | 'hi' = 'mr'): string {
  if (!rawClass) {
    return lang === 'mr' ? '२ री' : lang === 'hi' ? '२ वीं' : '2nd Std';
  }
  const clean = rawClass.trim();
  const numMatch = clean.match(/(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    
    // Extract division letter if exists e.g. "A", "B", "अ", "ब"
    let division = '';
    const withoutSuffix = clean.replace(/\b\d+(st|nd|rd|th|वी|ली|री|थी)\b/gi, '').trim();
    const divMatch = withoutSuffix.match(/[a-zA-Z\u0900-\u097F]/);
    if (divMatch) {
      division = divMatch[0];
    }

    if (lang === 'mr') {
      const mrOrdinal: Record<number, string> = {
        1: '१ ली', 2: '२ री', 3: '३ री', 4: '४ थी', 5: '५ वी',
        6: '६ वी', 7: '७ वी', 8: '८ वी', 9: '९ वी', 10: '१० वी',
        11: '११ वी', 12: '१२ वी'
      };
      const base = mrOrdinal[num] || `${num} वी`;
      return division ? `${base} (${division})` : base;
    }

    if (lang === 'hi') {
      const hiOrdinal: Record<number, string> = {
        1: '१ वीं', 2: '२ वीं', 3: '३ वीं', 4: '४ वीं', 5: '५ वीं',
        6: '६ वीं', 7: '७ वीं', 8: '८ वीं', 9: '९ वीं', 10: '१० वीं',
        11: '११ वीं', 12: '१२ वीं'
      };
      const base = hiOrdinal[num] || `${num} वीं`;
      return division ? `${base} (${division})` : base;
    }

    // English
    const enOrdinal: Record<number, string> = {
      1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th',
      6: '6th', 7: '7th', 8: '8th', 9: '9th', 10: '10th',
      11: '11th', 12: '12th'
    };
    const base = `${enOrdinal[num] || `${num}th`} Std`;
    return division ? `${base} (${division.toUpperCase()})` : base;
  }

  if (lang === 'mr') {
    return transliterateToDevanagari(clean);
  }
  return clean;
}

// Clean Caste Formatting strictly separated by language
function formatRegisterCaste(student: Student, lang: 'en' | 'mr' | 'hi'): string {
  if (lang === 'en') {
    const rawCaste = student.caste || student.casteLocal || 'OPEN';
    let clean = cleanEnglishText(rawCaste).replace(/[()[\]{}]/g, '').trim().toUpperCase();
    if (student.subCaste && student.subCaste !== '-' && !clean.includes(student.subCaste.toUpperCase())) {
      clean = `${clean} - ${cleanEnglishText(student.subCaste).toUpperCase()}`;
    }
    return clean || 'OPEN';
  }

  // Marathi
  let localized = getLocalizedCaste(student, 'mr');
  // If there's subcaste, add in Marathi
  if (student.subCaste && student.subCaste !== '-' && !localized.includes(student.subCaste)) {
    const sub = student.subCasteLocal || transliterateToDevanagari(student.subCaste);
    localized = `${localized} - ${sub}`;
  }

  // Ensure absolutely no English characters remain in Marathi
  localized = localized
    .replace(/\bSC\b/gi, 'अनु. जाती (एससी)')
    .replace(/\bST\b/gi, 'अनु. जमाती (एसटी)')
    .replace(/\bOBC\b/gi, 'इ.मा.व. (ओबीसी)')
    .replace(/\bOPEN\b/gi, 'खुला प्रवर्ग')
    .replace(/\bNT\b/gi, 'भटके विमुक्त (एनटी)')
    .replace(/\bVJNT\b/gi, 'वि.जा.भ.ज.');

  if (/[a-zA-Z]/.test(localized)) {
    localized = transliterateToDevanagari(localized);
  }

  return localized;
}

export function NirgamUtara({
  student,
  issueDate = new Date().toISOString().split('T')[0],
  lang: initialLang = 'mr',
  onEdit
}: NirgamUtaraProps) {
  const { settings } = useSettings();
  const [currentLang, setCurrentLang] = useState<'en' | 'mr' | 'hi'>(initialLang);

  // Sync when prop changes
  useEffect(() => {
    setCurrentLang(initialLang);
  }, [initialLang]);

  // Parse Taluka and District intelligently based on current language
  const parseAddressDetails = (l: 'en' | 'mr' | 'hi') => {
    const rawAddr = settings.address || '';
    if (l === 'en') {
      let taluka = 'Chikhli';
      let district = 'Buldhana';
      let place = 'At Post Chikhli';
      if (rawAddr.includes(',')) {
        const parts = rawAddr.split(',');
        const part0 = parts[0]?.trim() || '';
        taluka = cleanEnglishText(part0.replace(/At\s+Post|A\/P/gi, '').trim() || 'Chikhli');
        place = cleanEnglishText(part0 || 'At Post Chikhli');
        const distMatch = rawAddr.match(/Dist\.?\s*([A-Za-z]+)/i);
        if (distMatch) district = cleanEnglishText(distMatch[1]);
      }
      return { taluka, district, place };
    } else {
      let taluka = 'चिखली';
      let district = 'बुलढाणा';
      let place = 'मु. पो. चिखली';
      if (rawAddr.includes(',')) {
        const parts = rawAddr.split(',');
        const part0 = parts[0]?.trim() || '';
        place = cleanAndLocalizePlace(part0 || 'मु. पो. चिखली', l);
        taluka = cleanAndLocalizeTaluka(part0 || 'चिखली', l);
        const distMatch = rawAddr.match(/जि\.?\s*([^\s,-]+)|Dist\.?\s*([A-Za-z]+)/i);
        if (distMatch) {
          const distRaw = distMatch[1] || distMatch[2];
          district = cleanAndLocalizePlace(distRaw, l).replace(/^(जि\.?|जिला)\s*/, '').trim() || 'बुलढाणा';
        }
      }
      return { taluka, district, place };
    }
  };

  // Pure language-specific default values generator
  const getDefaultsForLanguage = (l: 'en' | 'mr' | 'hi') => {
    const loc = parseAddressDetails(l);
    const classStr = formatRegisterClass(student.admissionClass, l);

    if (l === 'en') {
      return {
        taluka: loc.taluka,
        district: loc.district,
        place: loc.place || 'At Post Chikhli',
        occupation: 'Agriculture',
        currentClass: classStr,
        leavingClass: classStr,
        identificationMarks: '1. Mole on right hand  2. Scar on forehead',
        remarks: 'Progress: Good, Conduct: Satisfactory. Verified with original register.'
      };
    } else if (l === 'hi') {
      return {
        taluka: loc.taluka,
        district: loc.district,
        place: loc.place || 'मु. पो. चिखली',
        occupation: 'कृषि / व्यवसाय',
        currentClass: classStr,
        leavingClass: classStr,
        identificationMarks: '१. दाहिने हाथ पर तिल  २. माथे पर निशान',
        remarks: 'प्रगति: उत्तम, आचरण: संतोषजनक। मूल जनरल रजिस्टर से मिलान कर प्रमाणित किया गया।'
      };
    } else {
      // Marathi (Default - 100% Pure Marathi)
      return {
        taluka: loc.taluka,
        district: loc.district,
        place: loc.place || 'मु. पो. चिखली',
        occupation: 'शेती',
        currentClass: classStr,
        leavingClass: classStr,
        identificationMarks: '१. उजव्या हातावर तीळ  २. कपाळावर खूण',
        remarks: 'प्रगती: उत्तम, वर्तणूक: समाधानकारक. मूळ जनरल रजिस्टरशी तपासून नोंद प्रमाणित केली.'
      };
    }
  };

  // Form states
  const [taluka, setTaluka] = useState('');
  const [district, setDistrict] = useState('');
  const [place, setPlace] = useState('');
  const [occupation, setOccupation] = useState('');
  const [currentClass, setCurrentClass] = useState('');
  const [leavingClass, setLeavingClass] = useState('');
  const [identificationMarks, setIdentificationMarks] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isEditingInline, setIsEditingInline] = useState(false);

  // Storage key separated by student AND language
  const storageKey = `shalaverse_nirgam_${student.id || student.grNumber}_${currentLang}`;

  // Initialize or re-initialize values when language or student changes
  useEffect(() => {
    // Clean up any old unilingual key that may contain mixed English in Marathi
    const legacyKey = `shalaverse_nirgam_custom_${student.id || student.grNumber}`;
    localStorage.removeItem(legacyKey);

    const defaults = getDefaultsForLanguage(currentLang);
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      try {
        const data = JSON.parse(saved);
        
        if (currentLang === 'mr' || currentLang === 'hi') {
          // If Marathi/Hindi mode, strictly cleanse any English leaks from saved data
          const cleanPlace = cleanAndLocalizePlace(data.place || defaults.place, currentLang);
          const cleanTaluka = cleanAndLocalizeTaluka(data.taluka || defaults.taluka, currentLang);
          const cleanDistrict = cleanAndLocalizePlace(data.district || defaults.district, currentLang).replace(/^(जि\.?|जिला)\s*/, '').trim() || 'बुलढाणा';

          const hasEnglishLeak = 
            /[a-zA-Z]/.test(data.identificationMarks || '') || 
            /[a-zA-Z]/.test(data.remarks || '') ||
            /\b(1st|2nd|3rd|4th|5th|6th|7th|8th|9th|10th|11th|12th)\b/i.test(data.currentClass || '') ||
            data.occupation === 'Agriculture';

          setPlace(cleanPlace);
          setTaluka(cleanTaluka);
          setDistrict(cleanDistrict);

          if (hasEnglishLeak) {
            setOccupation(defaults.occupation);
            setCurrentClass(defaults.currentClass);
            setLeavingClass(defaults.leavingClass);
            setIdentificationMarks(defaults.identificationMarks);
            setRemarks(defaults.remarks);
          } else {
            setOccupation(data.occupation || defaults.occupation);
            setCurrentClass(formatRegisterClass(data.currentClass, currentLang));
            setLeavingClass(formatRegisterClass(data.leavingClass, currentLang));
            setIdentificationMarks(data.identificationMarks || defaults.identificationMarks);
            setRemarks(data.remarks || defaults.remarks);
          }
          return;
        } else {
          // English mode
          setPlace(cleanEnglishText(data.place || defaults.place));
          setTaluka(cleanEnglishText(data.taluka || defaults.taluka));
          setDistrict(cleanEnglishText(data.district || defaults.district));
          setOccupation(cleanEnglishText(data.occupation || defaults.occupation));
          setCurrentClass(formatRegisterClass(data.currentClass, 'en'));
          setLeavingClass(formatRegisterClass(data.leavingClass, 'en'));
          setIdentificationMarks(cleanEnglishText(data.identificationMarks || defaults.identificationMarks));
          setRemarks(cleanEnglishText(data.remarks || defaults.remarks));
          return;
        }
      } catch {
        // Fall back to clean language defaults
      }
    }

    // Default to clean language-specific values
    setTaluka(defaults.taluka);
    setDistrict(defaults.district);
    setPlace(defaults.place);
    setOccupation(defaults.occupation);
    setCurrentClass(defaults.currentClass);
    setLeavingClass(defaults.leavingClass);
    setIdentificationMarks(defaults.identificationMarks);
    setRemarks(defaults.remarks);
  }, [currentLang, student.id, student.grNumber, student.admissionClass]);

  const handleSaveCustomData = () => {
    const dataToSave = {
      taluka,
      district,
      place,
      occupation,
      currentClass,
      leavingClass,
      identificationMarks,
      remarks
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    setIsEditingInline(false);
  };

  const handleResetCustomData = () => {
    localStorage.removeItem(storageKey);
    const defaults = getDefaultsForLanguage(currentLang);
    setTaluka(defaults.taluka);
    setDistrict(defaults.district);
    setPlace(defaults.place);
    setOccupation(defaults.occupation);
    setCurrentClass(defaults.currentClass);
    setLeavingClass(defaults.leavingClass);
    setIdentificationMarks(defaults.identificationMarks);
    setRemarks(defaults.remarks);
    setIsEditingInline(false);
  };

  // Header and Labels dictionary
  const t = {
    mr: {
      title: 'विद्यार्थी प्रवेश निर्गम प्रमाणे नोंदणी रजिस्टर',
      schoolNameLabel: 'शाळेचे नाव',
      talukaLabel: 'तालुका',
      districtLabel: 'जिल्हा',
      dateLabel: 'दिनांक',
      placeLabel: 'स्थळ',
      principalSign: 'मुख्याध्यापकांची स्वाक्षरी',
      rows: [
        { no: '१', label: 'प्रवेश अनुक्रमांक' },
        { no: '२', label: 'विद्यार्थ्याचे संपूर्ण नाव आडनावासह' },
        { no: '३', label: 'वडिलांचे नाव / वडील हयात नसल्यास पालकाचे नाव' },
        { no: '४', label: 'जात' },
        { no: '५', label: 'वडील / पालकाचा व्यवसाय' },
        { no: '६', label: 'मातृभाषा' },
        { no: '७', label: 'प्रवेश दिनांक' },
        { no: '८', label: 'जन्म दिनांक — अंक' },
        { no: '९', label: 'जन्म दिनांक — अक्षर' },
        { no: '१०', label: 'जन्म स्थळ तालुका व जिल्हा' },
        { no: '११', label: 'प्रवेश समयी वर्ग' },
        { no: '१२', label: 'पूर्वीच्या शाळेचे नाव' },
        { no: '१३', label: 'इयत्ता' },
        { no: '१४', label: 'प्रवेश देणाऱ्या अधिकाऱ्याची सही' },
        { no: '१५', label: 'निर्गम समयी वर्ग' },
        { no: '१६', label: 'निर्गम दिनांक' },
        { no: '१७', label: 'शाळा सोडण्याचे कारण' },
        { no: '१८', label: 'परिचय चिन्ह विद्यार्थ्याचे थोडक्यात दोन चिन्ह' },
        { no: '१९', label: 'निर्गम समयी निर्गमाची नोंद घेणाऱ्या अधिकाऱ्याची सही' },
        { no: '२०', label: 'मुख्याध्यापकांची स्वाक्षरी' },
        { no: '२१', label: 'विवरण' }
      ]
    },
    hi: {
      title: 'विद्यार्थी प्रवेश निर्गम पंजीयन रजिस्टर',
      schoolNameLabel: 'विद्यालय का नाम',
      talukaLabel: 'तहसील / तालुका',
      districtLabel: 'जिला',
      dateLabel: 'दिनांक',
      placeLabel: 'स्थान',
      principalSign: 'प्रधानाचार्य के हस्ताक्षर',
      rows: [
        { no: '१', label: 'प्रवेश क्रमांक' },
        { no: '२', label: 'विद्यार्थी का पूरा नाम उपनाम सहित' },
        { no: '३', label: 'पिता का नाम / जीवित न होने पर अभिभावक का नाम' },
        { no: '४', label: 'जाति' },
        { no: '५', label: 'पिता / अभिभावक का व्यवसाय' },
        { no: '६', label: 'मातृभाषा' },
        { no: '७', label: 'प्रवेश दिनांक' },
        { no: '८', label: 'जन्म दिनांक — अंक' },
        { no: '९', label: 'जन्म दिनांक — अक्षर' },
        { no: '१०', label: 'जन्म स्थान तहसील व जिला' },
        { no: '११', label: 'प्रवेश समय कक्षा' },
        { no: '१२', label: 'पूर्व विद्यालय का नाम' },
        { no: '१३', label: 'कक्षा' },
        { no: '१४', label: 'प्रवेश देने वाले अधिकारी के हस्ताक्षर' },
        { no: '१५', label: 'निर्गम समय कक्षा' },
        { no: '१६', label: 'निर्गम दिनांक' },
        { no: '१७', label: 'विद्यालय छोड़ने का कारण' },
        { no: '१८', label: 'पहचान चिह्न (संक्षेप में दो चिह्न)' },
        { no: '१९', label: 'निर्गम समय प्रविष्टि करने वाले अधिकारी के हस्ताक्षर' },
        { no: '२०', label: 'प्रधानाचार्य के हस्ताक्षर' },
        { no: '२१', label: 'विवरण' }
      ]
    },
    en: {
      title: 'STUDENT ADMISSION & WITHDRAWAL REGISTER',
      schoolNameLabel: 'School Name',
      talukaLabel: 'Taluka',
      districtLabel: 'District',
      dateLabel: 'Date',
      placeLabel: 'Place',
      principalSign: "Headmaster's Signature",
      rows: [
        { no: '1', label: 'Admission / General Register No.' },
        { no: '2', label: 'Full Name of Student with Surname' },
        { no: '3', label: "Father's Name / Guardian's Name if deceased" },
        { no: '4', label: 'Caste & Category' },
        { no: '5', label: "Father's / Guardian's Occupation" },
        { no: '6', label: 'Mother Tongue' },
        { no: '7', label: 'Date of Admission' },
        { no: '8', label: 'Date of Birth — Figures' },
        { no: '9', label: 'Date of Birth — Words' },
        { no: '10', label: 'Place of Birth (Taluka & District)' },
        { no: '11', label: 'Class Admitted' },
        { no: '12', label: 'Previous School Attended' },
        { no: '13', label: 'Standard / Class' },
        { no: '14', label: 'Signature of Admission Officer' },
        { no: '15', label: 'Class at Time of Leaving' },
        { no: '16', label: 'Date of Leaving' },
        { no: '17', label: 'Reason for Leaving School' },
        { no: '18', label: 'Identification Marks (Brief two marks)' },
        { no: '19', label: 'Signature of Leaving Recording Officer' },
        { no: '20', label: "Headmaster's Signature" },
        { no: '21', label: 'Remarks / Particulars' }
      ]
    }
  }[currentLang];

  // Clean School Name
  const displaySchoolName = currentLang === 'en' 
    ? cleanEnglishText(settings.schoolName)
    : (settings.schoolNameLocal || settings.schoolName);

  // Student Full Name - 100% pure Marathi in mr, 100% pure English in en
  const getStudentDisplayName = () => {
    return getLocalizedStudentName(student, currentLang);
  };

  // Father's Name - pure Marathi in mr, pure English in en
  const getFatherDisplayName = () => {
    return getLocalizedFatherName(student, currentLang);
  };

  // Mother Tongue
  const getMotherTongueDisplayName = () => {
    if (currentLang === 'en') {
      return cleanEnglishText(student.motherTongue) || 'Marathi';
    }
    if (currentLang === 'hi') {
      return 'मराठी';
    }
    return 'मराठी';
  };

  // Previous School
  const getPreviousSchoolDisplayName = () => {
    if (currentLang === 'en') {
      return cleanEnglishText(student.previousSchool) || 'Direct Admission / Fresh';
    }
    return getLocalizedPreviousSchool(student, currentLang);
  };

  // Birth Place
  const getBirthPlaceDisplayName = () => {
    if (currentLang === 'en') {
      return cleanEnglishText(getLocalizedBirthPlace(student, 'en'));
    }
    return cleanAndLocalizePlace(getLocalizedBirthPlace(student, currentLang), currentLang);
  };

  // Leaving Reason
  const getLeavingReasonDisplayName = () => {
    if (currentLang === 'en') {
      return cleanEnglishText(getLocalizedLeavingReason(student.leavingReason, 'en'));
    }
    return getLocalizedLeavingReason(student.leavingReason, currentLang);
  };

  // Officer signatures
  const admissionOfficerSign = currentLang === 'en' ? 'Sd/- Admission Officer' : 'स्वाक्षरी / सही';
  const leavingOfficerSign = currentLang === 'en' ? 'Sd/- Official' : 'स्वाक्षरी / सही';
  const headmasterSign = currentLang === 'en' ? 'Sd/- Headmaster' : 'स्वाक्षरी (मुख्याध्यापक)';

  // Values mapping for all 21 items
  const rowValues: Record<number, { text: string; editable?: boolean; key?: string }> = {
    1: { text: student.grNumber || '37563' },
    2: { text: getStudentDisplayName() },
    3: { text: getFatherDisplayName() },
    4: { text: formatRegisterCaste(student, currentLang) },
    5: { text: occupation, editable: true, key: 'occupation' },
    6: { text: getMotherTongueDisplayName() },
    7: { text: formatDate(student.admissionDate) },
    8: { text: formatDate(student.birthDate) },
    9: { text: dateToWords(student.birthDate, currentLang) },
    10: { text: getBirthPlaceDisplayName() },
    11: { text: formatRegisterClass(student.admissionClass, currentLang) },
    12: { text: getPreviousSchoolDisplayName() },
    13: { text: currentClass, editable: true, key: 'currentClass' },
    14: { text: admissionOfficerSign },
    15: { text: leavingClass, editable: true, key: 'leavingClass' },
    16: { text: formatDate(student.certificateDate || issueDate) },
    17: { text: getLeavingReasonDisplayName() },
    18: { text: identificationMarks, editable: true, key: 'identificationMarks' },
    19: { text: leavingOfficerSign },
    20: { text: headmasterSign },
    21: { text: remarks, editable: true, key: 'remarks' }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* A4 Printable Document Container */}
      <div className="a4-document-page bg-white text-slate-950 mx-auto w-full max-w-[210mm] min-h-[297mm] p-5 sm:p-7 border-4 border-double border-slate-900 relative font-serif print:border-4 print:border-double print:border-black print:p-5 print:m-0 print:shadow-none shadow-xl flex flex-col justify-between">
        <div className="a4-inner-box border-2 border-slate-900 p-4 sm:p-6 flex-1 flex flex-col justify-between">
          
          {/* Top Title Section */}
          <div className="text-center pb-2 border-b-2 border-slate-900">
            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-950 uppercase leading-snug">
              {t.title}
            </h1>

            {/* School Name, Taluka & District Details Block */}
            <div className="mt-3 text-sm sm:text-[15px] font-semibold text-slate-900 space-y-1.5 text-left px-1 sm:px-2">
              <div className="flex items-baseline">
                <span className="font-bold min-w-[100px] sm:min-w-[120px] text-slate-950">
                  {t.schoolNameLabel} :
                </span>
                <span className="font-black text-base sm:text-lg border-b border-dotted border-slate-800 flex-1 pb-0.5 uppercase">
                  {displaySchoolName}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-6 pt-1">
                <div className="flex items-baseline">
                  <span className="font-bold min-w-[70px] sm:min-w-[80px] text-slate-950">
                    {t.talukaLabel} :
                  </span>
                  {isEditingInline ? (
                    <input
                      type="text"
                      value={taluka}
                      onChange={(e) => setTaluka(e.target.value)}
                      className="border-b border-blue-600 bg-blue-50/50 px-1 py-0.5 text-sm font-bold flex-1 outline-none"
                    />
                  ) : (
                    <span className="font-bold border-b border-dotted border-slate-800 flex-1 pb-0.5">
                      {cleanAndLocalizeTaluka(taluka, currentLang)}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline">
                  <span className="font-bold min-w-[60px] sm:min-w-[70px] text-slate-950">
                    {t.districtLabel} :
                  </span>
                  {isEditingInline ? (
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="border-b border-blue-600 bg-blue-50/50 px-1 py-0.5 text-sm font-bold flex-1 outline-none"
                    />
                  ) : (
                    <span className="font-bold border-b border-dotted border-slate-800 flex-1 pb-0.5">
                      {cleanAndLocalizePlace(district, currentLang).replace(/^(जि\.?|जिला)\s*/, '').trim() || (currentLang === 'en' ? 'Buldhana' : 'बुलढाणा')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 21 Exact Rows Table */}
          <div className="my-2 flex-1 flex flex-col justify-center">
            <table className="w-full border-collapse text-xs sm:text-[13px] print:text-[11.5px] border-2 border-slate-900 leading-normal">
              <tbody>
                {t.rows.map((rowItem, idx) => {
                  const rowNum = idx + 1;
                  const itemData = rowValues[rowNum];

                  return (
                    <tr 
                      key={rowItem.no} 
                      className={`border-b border-slate-900 ${idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}`}
                    >
                      {/* Column 1: Row Number (1 to 21) */}
                      <td className="w-10 sm:w-12 py-1.5 px-2 print:py-1 font-bold text-center border-r border-slate-900 bg-slate-100/70 shrink-0">
                        {rowItem.no}
                      </td>

                      {/* Column 2: Particular / Label */}
                      <td className="w-[45%] sm:w-[48%] py-1.5 px-3 print:py-1 font-semibold border-r border-slate-900 text-slate-900">
                        {rowItem.label}
                      </td>

                      {/* Column 3: Record Value */}
                      <td className="py-1.5 px-3 print:py-1 font-bold text-slate-950">
                        {isEditingInline && itemData.editable ? (
                          <input
                            type="text"
                            value={itemData.text}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (itemData.key === 'occupation') setOccupation(val);
                              if (itemData.key === 'currentClass') setCurrentClass(val);
                              if (itemData.key === 'leavingClass') setLeavingClass(val);
                              if (itemData.key === 'identificationMarks') setIdentificationMarks(val);
                              if (itemData.key === 'remarks') setRemarks(val);
                            }}
                            className="w-full border-b border-blue-600 bg-blue-50/60 px-1 py-0.5 text-xs sm:text-[13px] font-bold outline-none rounded"
                          />
                        ) : (
                          <span className={rowNum === 1 || rowNum === 2 ? 'font-black tracking-wide text-[13.5px] sm:text-[14px]' : ''}>
                            {itemData.text}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Footer Section: Date, Place and Principal Signature */}
          <div className="mt-3 pt-2.5 border-t-2 border-slate-900 text-xs sm:text-sm font-semibold">
            <div className="flex items-end justify-between px-2">
              
              {/* Left: Date & Place */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-slate-950">{t.dateLabel} :</span>
                  <span className="font-mono font-bold border-b border-dotted border-slate-800 pb-0.5 min-w-[120px] inline-block">
                    {formatDate(issueDate)}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-slate-950">{t.placeLabel} :</span>
                  {isEditingInline ? (
                    <input
                      type="text"
                      value={place}
                      onChange={(e) => setPlace(e.target.value)}
                      className="border-b border-blue-600 bg-blue-50/50 px-1 py-0.5 text-xs sm:text-sm font-bold outline-none"
                    />
                  ) : (
                    <span className="font-bold border-b border-dotted border-slate-800 pb-0.5 min-w-[120px] inline-block">
                      {cleanAndLocalizePlace(place, currentLang)}
                    </span>
                  )}
                </div>
              </div>

              {/* Center: Stamp Circle (Subtle School Seal) */}
              <div className="hidden sm:flex flex-col items-center justify-center">
                <div className="w-20 h-14 border border-dashed border-slate-400 rounded flex items-center justify-center text-[10px] text-slate-400 font-sans">
                  {currentLang === 'en' ? 'School Seal' : 'शाळेचा शिक्का'}
                </div>
              </div>

              {/* Right: Principal Signature */}
              <div className="text-center space-y-1">
                <div className="h-12 sm:h-14 flex items-end justify-center">
                  <span className="border-b border-dotted border-slate-800 w-40 sm:w-48 inline-block"></span>
                </div>
                <p className="font-bold text-slate-950 text-xs sm:text-[13px] pt-0.5">
                  {t.principalSign}
                </p>
                <p className="text-[10px] font-normal text-slate-600 leading-none">
                  {settings.headmasterName || (currentLang === 'en' ? 'Headmaster / Principal' : 'मुख्याध्यापक')}
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
