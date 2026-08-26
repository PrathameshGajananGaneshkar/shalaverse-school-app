import { Student, AdmissionClass } from '../types';

/**
 * Common Marathi / Hindi translation dictionaries and phonetic transliteration engine.
 */

// Common First Names, Middle Names, Surnames
const NAME_DICTIONARY: Record<string, { mr: string; hi: string }> = {
  // Surnames
  'deshmukh': { mr: 'देशमुख', hi: 'देशमुख' },
  'patil': { mr: 'पाटील', hi: 'पाटिल' },
  'joshi': { mr: 'जोशी', hi: 'जोशी' },
  'shinde': { mr: 'शिंदे', hi: 'शिंदे' },
  'gaikwad': { mr: 'गायकवाड', hi: 'गायकवाड़' },
  'khan': { mr: 'खान', hi: 'खान' },
  'kulkarni': { mr: 'कुलकर्णी', hi: 'कुलकर्णी' },
  'jadhav': { mr: 'जाधव', hi: 'जाधव' },
  'chavan': { mr: 'चव्हाण', hi: 'चव्हाण' },
  'pawar': { mr: 'पवार', hi: 'पवार' },
  'more': { mr: 'मोरे', hi: 'मोरे' },
  'kadam': { mr: 'कदम', hi: 'कदम' },
  'sawant': { mr: 'सावंत', hi: 'सावंत' },
  'shaikh': { mr: 'शेख', hi: 'शेख' },
  'sayyed': { mr: 'सय्यद', hi: 'सैयद' },
  'raut': { mr: 'राऊत', hi: 'राउत' },
  'bhosale': { mr: 'भोसले', hi: 'भोसले' },
  'kale': { mr: 'काळे', hi: 'काले' },
  'mane': { mr: 'माने', hi: 'माने' },
  'ingale': { mr: 'इंगळे', hi: 'इंगले' },
  'waghmare': { mr: 'वाघमारे', hi: 'वाघमारे' },
  'kamble': { mr: 'कांबळे', hi: 'कांबले' },
  'ghadge': { mr: 'घाडगे', hi: 'घाडगे' },
  'salunke': { mr: 'साळुंखे', hi: 'सालुंखे' },
  'mali': { mr: 'माळी', hi: 'माली' },
  'thorat': { mr: 'थोरात', hi: 'थोरात' },

  // First / Middle Names
  'prathamesh': { mr: 'प्रथमेश', hi: 'प्रथमेश' },
  'rajesh': { mr: 'राजेश', hi: 'राजेश' },
  'vasantrao': { mr: 'वसंतराव', hi: 'वसंतराव' },
  'sunita': { mr: 'सुनिता', hi: 'सुनीता' },
  'ananya': { mr: 'अनन्या', hi: 'अनन्या' },
  'sunil': { mr: 'सुनील', hi: 'सुनील' },
  'mahadev': { mr: 'महादेव', hi: 'महादेव' },
  'archana': { mr: 'अर्चना', hi: 'अर्चना' },
  'aditya': { mr: 'आदित्य', hi: 'आदित्य' },
  'prasad': { mr: 'प्रसाद', hi: 'प्रसाद' },
  'narayan': { mr: 'नारायण', hi: 'नारायण' },
  'medha': { mr: 'मेधा', hi: 'मेधा' },
  'rohan': { mr: 'रोहन', hi: 'रोहन' },
  'prakash': { mr: 'प्रकाश', hi: 'प्रकाश' },
  'baburao': { mr: 'बाबुराव', hi: 'बाबूराव' },
  'surekha': { mr: 'सुरेखा', hi: 'सुरेखा' },
  'ayesha': { mr: 'आयशा', hi: 'आयशा' },
  'mohammed': { mr: 'मोहम्मद', hi: 'मोहम्मद' },
  'arif': { mr: 'आरिफ', hi: 'आरिफ' },
  'farzana': { mr: 'फरझाना', hi: 'फरजाना' },
  'tanvi': { mr: 'तन्वी', hi: 'तन्वी' },
  'santosh': { mr: 'संतोष', hi: 'संतोष' },
  'vitthal': { mr: 'विठ्ठल', hi: 'विट्ठल' },
  'kavita': { mr: 'कविता', hi: 'कविता' },
  'rahul': { mr: 'राहुल', hi: 'राहुल' },
  'amit': { mr: 'अमित', hi: 'अमित' },
  'priya': { mr: 'प्रिया', hi: 'प्रिया' },
  'pooja': { mr: 'पूजा', hi: 'पूजा' },
  'ganesh': { mr: 'गणेश', hi: 'गणेश' },
  'sachin': { mr: 'सचिन', hi: 'सचिन' },
  'rohit': { mr: 'रोहित', hi: 'रोहित' },
  'swapnil': { mr: 'स्वप्नील', hi: 'स्वप्निल' },
  'snehal': { mr: 'स्नेहल', hi: 'स्नेहल' },
  'vaishnavi': { mr: 'वैष्णवी', hi: 'वैष्णवी' },
  'omkar': { mr: 'ओंकार', hi: 'ओंकार' },
  'atharva': { mr: 'अथर्व', hi: 'अथर्व' },
  'aniket': { mr: 'अनिकेत', hi: 'अनिकेत' },
  'abhishek': { mr: 'अभिषेक', hi: 'अभिषेक' }
};

// Cities, Districts & Locations
const LOCATION_DICTIONARY: Record<string, { mr: string; hi: string }> = {
  'pune': { mr: 'पुणे', hi: 'पुणे' },
  'kolhapur': { mr: 'कोल्हापूर', hi: 'कोल्हापुर' },
  'nashik': { mr: 'नाशिक', hi: 'नासिक' },
  'satara': { mr: 'सातारा', hi: 'सतारा' },
  'aurangabad': { mr: 'छत्रपती संभाजीनगर (औरंगाबाद)', hi: 'छत्रपति संभाजीनगर (औरंगाबाद)' },
  'solapur': { mr: 'सोलापूर', hi: 'सोलापुर' },
  'chikhli': { mr: 'चिखली', hi: 'चिखली' },
  'buldhana': { mr: 'बुलढाणा', hi: 'बुलढाणा' },
  'mumbai': { mr: 'मुंबई', hi: 'मुंबई' },
  'thane': { mr: 'ठाणे', hi: 'ठाणे' },
  'nagpur': { mr: 'नागपूर', hi: 'नागपुर' },
  'amravati': { mr: 'अमरावती', hi: 'अमरावती' },
  'nanded': { mr: 'नांदेड', hi: 'नांदेड़' },
  'sangli': { mr: 'सांगली', hi: 'सांगली' },
  'kothrud': { mr: 'कोथरूड', hi: 'कोथरुड' },
  'karve nagar': { mr: 'कर्वे नगर', hi: 'कर्वे नगर' },
  'baner': { mr: 'बाणेर', hi: 'बानेर' },
  'hadapsar': { mr: 'हडपसर', hi: 'हडपसर' },
  'guruwar peth': { mr: 'गुरुवार पेठ', hi: 'गुरुवार पेठ' },
  'maharashtra': { mr: 'महाराष्ट्र', hi: 'महाराष्ट्र' },
  'india': { mr: 'भारत', hi: 'भारत' }
};

// Caste & Religion
const CASTE_DICTIONARY: Record<string, { mr: string; hi: string }> = {
  'maratha': { mr: 'मराठा', hi: 'मराठा' },
  '96 kuli': { mr: '९६ कुळी', hi: '९६ कुली' },
  '96-kuli': { mr: '९६ कुळी', hi: '९६ कुली' },
  'brahmin': { mr: 'ब्राह्मण', hi: 'ब्राह्मण' },
  'deshastha': { mr: 'देशस्थ', hi: 'देशस्थ' },
  'kokanastha': { mr: 'कोकणस्थ', hi: 'कोंकणस्थ' },
  'mali': { mr: 'माळी', hi: 'माली' },
  'mahar': { mr: 'महार', hi: 'महार' },
  'matang': { mr: 'मातंग', hi: 'मातंग' },
  'chambhar': { mr: 'चांभार', hi: 'चर्मकार' },
  'kunbi': { mr: 'कुणबी', hi: 'कुनबी' },
  'dhangar': { mr: 'धनगर', hi: 'धनगर' },
  'vanjari': { mr: 'वंजारी', hi: 'वंजारी' },
  'lingayat': { mr: 'लिंगायत', hi: 'लिंगायत' },
  'pinjari': { mr: 'पिंजारी', hi: 'पिंजारी' },
  'tamboli': { mr: 'तांबोळी', hi: 'तांबोली' },
  'open': { mr: 'खुला प्रवर्ग (Open)', hi: 'सामान्य वर्ग (Open)' },
  'obc': { mr: 'इतर मागास वर्ग (OBC)', hi: 'अन्य पिछड़ा वर्ग (OBC)' },
  'sc': { mr: 'अनुसूचित जाती (SC)', hi: 'अनुसूचित जाति (SC)' },
  'st': { mr: 'अनुसूचित जमाती (ST)', hi: 'अनुसूचित जनजाति (ST)' },
  'nt': { mr: 'भटक्या जमाती (NT)', hi: 'विमुक्त जनजाति (NT)' },
  'vjnt': { mr: 'विमुक्त व भटक्या जमाती (VJNT)', hi: 'विमुक्त व घुमंतू जाति (VJNT)' },
  'sbc': { mr: 'विशेष मागास प्रवर्ग (SBC)', hi: 'विशेष पिछड़ा वर्ग (SBC)' },
  'ews': { mr: 'आर्थिक दुर्बल घटक (EWS)', hi: 'आर्थिक रूप से कमजोर (EWS)' }
};

const RELIGION_DICTIONARY: Record<string, { mr: string; hi: string }> = {
  'hindu': { mr: 'हिंदू', hi: 'हिन्दू' },
  'muslim': { mr: 'मुस्लिम', hi: 'मुस्लिम' },
  'islam': { mr: 'इस्लाम', hi: 'इस्लाम' },
  'jain': { mr: 'जैन', hi: 'जैन' },
  'buddhist': { mr: 'बौद्ध', hi: 'बौद्ध' },
  'christian': { mr: 'ख्रिश्चन', hi: 'ईसाई' },
  'sikh': { mr: 'शीख', hi: 'सिख' },
  'parsi': { mr: 'पारशी', hi: 'पारसी' }
};

const NATIONALITY_DICTIONARY: Record<string, { mr: string; hi: string }> = {
  'indian': { mr: 'भारतीय', hi: 'भारतीय' },
  'india': { mr: 'भारतीय', hi: 'भारतीय' }
};

const MOTHER_TONGUE_DICTIONARY: Record<string, { mr: string; hi: string }> = {
  'marathi': { mr: 'मराठी', hi: 'मराठी' },
  'hindi': { mr: 'हिंदी', hi: 'हिंदी' },
  'urdu': { mr: 'उर्दू', hi: 'उर्दू' },
  'gujarati': { mr: 'गुजराती', hi: 'गुजराती' },
  'kannada': { mr: 'कन्नड', hi: 'कन्नड़' },
  'tamil': { mr: 'तमिळ', hi: 'तमिल' },
  'telugu': { mr: 'तेलगू', hi: 'तेलुगु' },
  'english': { mr: 'इंग्रजी', hi: 'अंग्रेजी' }
};

const CLASS_MAP: Record<string, { mr: string; hi: string; en: string }> = {
  '1st': { mr: '१ ली', hi: '१ वीं', en: '1st' },
  '2nd': { mr: '२ री', hi: '२ वीं', en: '2nd' },
  '3rd': { mr: '३ री', hi: '३ वीं', en: '3rd' },
  '4th': { mr: '४ थी', hi: '४ वीं', en: '4th' },
  '5th': { mr: '५ वी', hi: '५ वीं', en: '5th' },
  '6th': { mr: '६ वी', hi: '६ वीं', en: '6th' },
  '7th': { mr: '७ वी', hi: '७ वीं', en: '7th' },
  '8th': { mr: '८ वी', hi: '८ वीं', en: '8th' },
  '9th': { mr: '९ वी', hi: '९ वीं', en: '9th' },
  '10th': { mr: '१० वी', hi: '१० वीं', en: '10th' },
  '11th': { mr: '११ वी', hi: '११ वीं', en: '11th' },
  '12th': { mr: '१२ वी', hi: '१२ वीं', en: '12th' }
};

/**
 * Convert Latin characters phonetically to Devanagari as a high-quality fallback
 */
export function transliterateToDevanagari(text: string): string {
  if (!text) return '';
  
  // If already Devanagari, return directly
  if (/[\u0900-\u097F]/.test(text)) {
    return text;
  }

  // Tokenize by spaces and punctuation
  const words = text.split(/(\s+|[,\-()./])/);

  return words.map(chunk => {
    if (!chunk || /^\s+$/.test(chunk) || /^[,\-()./]$/.test(chunk)) {
      return chunk;
    }

    const lower = chunk.toLowerCase().trim();

    // Check dictionaries first
    if (NAME_DICTIONARY[lower]) return NAME_DICTIONARY[lower].mr;
    if (LOCATION_DICTIONARY[lower]) return LOCATION_DICTIONARY[lower].mr;
    if (CASTE_DICTIONARY[lower]) return CASTE_DICTIONARY[lower].mr;
    if (RELIGION_DICTIONARY[lower]) return RELIGION_DICTIONARY[lower].mr;
    if (NATIONALITY_DICTIONARY[lower]) return NATIONALITY_DICTIONARY[lower].mr;
    if (MOTHER_TONGUE_DICTIONARY[lower]) return MOTHER_TONGUE_DICTIONARY[lower].mr;

    // Direct words
    if (lower === 'school') return 'शाळा';
    if (lower === 'high') return 'हायस्कूल';
    if (lower === 'vidyalaya') return 'विद्यालय';
    if (lower === 'primary') return 'प्राथमिक';
    if (lower === 'passed') return 'उत्तीर्ण';
    if (lower === 'class') return 'इयत्ता';

    // Phonetic rule-based conversion
    return phoneticLatinToDevanagari(chunk);
  }).join('');
}

function phoneticLatinToDevanagari(str: string): string {
  let s = str.toLowerCase();
  
  // Multi-char replacements
  const mappings: [RegExp, string][] = [
    [/shree|shri/g, 'श्री'],
    [/sh/g, 'श'],
    [/ch/g, 'च'],
    [/th/g, 'थ'],
    [/dh/g, 'ध'],
    [/bh/g, 'भ'],
    [/kh/g, 'ख'],
    [/gh/g, 'घ'],
    [/jh/g, 'झ'],
    [/ph/g, 'फ'],
    [/ee|ii/g, 'ी'],
    [/oo|uu/g, 'ू'],
    [/aa/g, 'ा'],
    [/ai/g, 'ै'],
    [/au/g, 'ौ'],
    [/k/g, 'क'],
    [/g/g, 'ग'],
    [/j/g, 'ज'],
    [/t/g, 'त'],
    [/d/g, 'द'],
    [/n/g, 'न'],
    [/p/g, 'प'],
    [/b/g, 'ब'],
    [/m/g, 'म'],
    [/y/g, 'य'],
    [/r/g, 'र'],
    [/l/g, 'ल'],
    [/v|w/g, 'व'],
    [/s/g, 'स'],
    [/h/g, 'ह'],
    [/a/g, 'ा'],
    [/i/g, 'ि'],
    [/u/g, 'ु'],
    [/e/g, 'े'],
    [/o/g, 'ो']
  ];

  let result = s;
  for (const [pattern, dev] of mappings) {
    result = result.replace(pattern, dev);
  }

  return result;
}

// Full text translators for documents
export function getLocalizedStudentName(student: Student, lang: 'en' | 'mr' | 'hi'): string {
  if (lang === 'en') {
    return student.studentName.toUpperCase();
  }
  if (student.studentNameLocal) {
    return student.studentNameLocal;
  }
  // Transliterate full name parts
  const parts = student.studentName.split(/\s+/);
  const localizedParts = parts.map(p => {
    const low = p.toLowerCase();
    if (NAME_DICTIONARY[low]) return lang === 'hi' ? NAME_DICTIONARY[low].hi : NAME_DICTIONARY[low].mr;
    return transliterateToDevanagari(p);
  });
  return localizedParts.join(' ');
}

export function getLocalizedFatherName(student: Student, lang: 'en' | 'mr' | 'hi'): string {
  if (!student.fatherName) return '-';
  if (lang === 'en') return student.fatherName;
  if (student.fatherNameLocal) return student.fatherNameLocal;
  
  const parts = student.fatherName.split(/\s+/);
  return parts.map(p => {
    const low = p.toLowerCase();
    if (NAME_DICTIONARY[low]) return lang === 'hi' ? NAME_DICTIONARY[low].hi : NAME_DICTIONARY[low].mr;
    return transliterateToDevanagari(p);
  }).join(' ');
}

export function getLocalizedMotherName(student: Student, lang: 'en' | 'mr' | 'hi'): string {
  if (!student.motherName) return '-';
  if (lang === 'en') return student.motherName;
  if (student.motherNameLocal) return student.motherNameLocal;

  const parts = student.motherName.split(/\s+/);
  return parts.map(p => {
    const low = p.toLowerCase();
    if (NAME_DICTIONARY[low]) return lang === 'hi' ? NAME_DICTIONARY[low].hi : NAME_DICTIONARY[low].mr;
    return transliterateToDevanagari(p);
  }).join(' ');
}

export function getLocalizedBirthPlace(student: Student, lang: 'en' | 'mr' | 'hi'): string {
  if (!student.birthPlace) return '-';
  if (lang === 'en') return student.birthPlace;
  if (student.birthPlaceLocal) return student.birthPlaceLocal;

  const raw = student.birthPlace;
  const parts = raw.split(/,\s*/);
  const localized = parts.map(part => {
    const low = part.toLowerCase().trim();
    if (LOCATION_DICTIONARY[low]) {
      return lang === 'hi' ? LOCATION_DICTIONARY[low].hi : LOCATION_DICTIONARY[low].mr;
    }
    return transliterateToDevanagari(part);
  });
  return localized.join(', ');
}

export function getLocalizedNationality(student: Student, lang: 'en' | 'mr' | 'hi'): string {
  if (lang === 'en') return student.nationality || 'Indian';
  const low = (student.nationality || 'Indian').toLowerCase().trim();
  if (NATIONALITY_DICTIONARY[low]) {
    return lang === 'hi' ? NATIONALITY_DICTIONARY[low].hi : NATIONALITY_DICTIONARY[low].mr;
  }
  return lang === 'mr' ? 'भारतीय' : lang === 'hi' ? 'भारतीय' : 'Indian';
}

export function getLocalizedMotherTongue(student: Student, lang: 'en' | 'mr' | 'hi'): string {
  if (lang === 'en') return student.motherTongue || 'Marathi';
  const low = (student.motherTongue || 'Marathi').toLowerCase().trim();
  if (MOTHER_TONGUE_DICTIONARY[low]) {
    return lang === 'hi' ? MOTHER_TONGUE_DICTIONARY[low].hi : MOTHER_TONGUE_DICTIONARY[low].mr;
  }
  return transliterateToDevanagari(student.motherTongue || 'Marathi');
}

export function getLocalizedReligion(student: Student, lang: 'en' | 'mr' | 'hi'): string {
  if (!student.religion) return lang === 'mr' ? 'हिंदू' : lang === 'hi' ? 'हिन्दू' : 'Hindu';
  if (lang === 'en') return student.religion;
  if (student.religionLocal) return student.religionLocal;

  const low = student.religion.toLowerCase().trim();
  if (RELIGION_DICTIONARY[low]) {
    return lang === 'hi' ? RELIGION_DICTIONARY[low].hi : RELIGION_DICTIONARY[low].mr;
  }
  return transliterateToDevanagari(student.religion);
}

export function getLocalizedCaste(student: Student, lang: 'en' | 'mr' | 'hi'): string {
  if (!student.caste) return '-';
  if (lang === 'en') return student.caste;
  if (student.casteLocal) return student.casteLocal;

  const low = student.caste.toLowerCase().trim();
  if (CASTE_DICTIONARY[low]) {
    return lang === 'hi' ? CASTE_DICTIONARY[low].hi : CASTE_DICTIONARY[low].mr;
  }
  return transliterateToDevanagari(student.caste);
}

export function getLocalizedSubCaste(student: Student, lang: 'en' | 'mr' | 'hi'): string {
  if (!student.subCaste) return '-';
  if (lang === 'en') return student.subCaste;
  if (student.subCasteLocal) return student.subCasteLocal;

  const low = student.subCaste.toLowerCase().trim();
  if (CASTE_DICTIONARY[low]) {
    return lang === 'hi' ? CASTE_DICTIONARY[low].hi : CASTE_DICTIONARY[low].mr;
  }
  return transliterateToDevanagari(student.subCaste);
}

export function getLocalizedPreviousSchool(student: Student, lang: 'en' | 'mr' | 'hi'): string {
  if (!student.previousSchool) {
    return lang === 'mr' ? 'थेट प्रवेश / नवीन प्रवेश' : lang === 'hi' ? 'सीधा प्रवेश' : 'Direct Admission';
  }
  if (lang === 'en') return student.previousSchool;
  if (student.previousSchoolLocal) return student.previousSchoolLocal;

  const raw = student.previousSchool;
  
  // Specific known schools
  if (raw.includes('Adarsh High School')) {
    return lang === 'mr' ? 'आदर्श हायस्कूल, कोथरूड, पुणे (इयत्ता ८ वी उत्तीर्ण)' : 'आदर्श हाई स्कूल, कोथरुड, पुणे (कक्षा ८ वीं उत्तीर्ण)';
  }
  if (raw.includes('Chatrapati Shahu Vidyalaya')) {
    return lang === 'mr' ? 'छत्रपती शाहू विद्यालय, कोल्हापूर (इयत्ता ९ वी उत्तीर्ण)' : 'छत्रपति शाहू विद्यालय, कोल्हापुर (कक्षा ९ वीं उत्तीर्ण)';
  }
  if (raw.includes('Saraswati Bal Mandir')) {
    return lang === 'mr' ? 'सरस्वती बाल मंदिर, नाशिक (इयत्ता ७ वी उत्तीर्ण)' : 'सरस्वती बाल मंदिर, नासिक (कक्षा ७ वीं उत्तीर्ण)';
  }
  if (raw.includes('Zilla Parishad Primary School')) {
    return lang === 'mr' ? 'जिल्हा परिषद प्राथमिक शाळा, सातारा' : 'जिला परिषद प्राथमिक विद्यालय, सतारा';
  }
  if (raw.includes('National English Medium School')) {
    return lang === 'mr' ? 'नॅशनल इंग्लिश मीडियम स्कूल, पुणे' : 'नेशनल इंग्लिश मीडियम स्कूल, पुणे';
  }
  if (raw.includes('New English School')) {
    return lang === 'mr' ? 'न्यू इंग्लिश स्कूल, सोलापूर (इयत्ता १० वी ९१% गुणांसह उत्तीर्ण)' : 'न्यू इंग्लिश स्कूल, सोलापुर (कक्षा १० वीं ९१% अंकों के साथ उत्तीर्ण)';
  }

  return transliterateToDevanagari(raw);
}

export function getLocalizedClass(cls: AdmissionClass | string, lang: 'en' | 'mr' | 'hi'): string {
  const match = CLASS_MAP[cls];
  if (match) {
    return match[lang] || match.en;
  }
  return cls;
}

export function getLocalizedProgress(progress?: string, lang: 'en' | 'mr' | 'hi' = 'mr'): string {
  if (!progress) return lang === 'mr' ? 'समाधानकारक / उत्तम' : lang === 'hi' ? 'संतोषजनक / उत्तम' : 'Good & Satisfactory';
  if (lang === 'en') return progress;

  const low = progress.toLowerCase().trim();
  if (low.includes('excellent') && low.includes('a+')) {
    return lang === 'mr' ? 'उत्कृष्ट (अ+ श्रेणी)' : 'उत्कृष्ट (ए+ ग्रेड)';
  }
  if (low.includes('excellent')) {
    return lang === 'mr' ? 'उत्कृष्ट' : 'उत्कृष्ट';
  }
  if (low.includes('first class') || low.includes('good')) {
    return lang === 'mr' ? 'उत्तम (प्रथम श्रेणी)' : 'उत्तम (प्रथम श्रेणी)';
  }
  if (low.includes('outstanding')) {
    return lang === 'mr' ? 'अतिउत्कृष्ट' : 'अति उत्कृष्ट';
  }
  if (low.includes('satisfactory')) {
    return lang === 'mr' ? 'समाधानकारक' : 'संतोषजनक';
  }
  if (low.includes('distinction')) {
    return lang === 'mr' ? 'अतिउत्तम (विशेष प्राविण्य)' : 'अति उत्तम (विशेष योग्यता)';
  }
  return lang === 'mr' ? 'उत्तम व समाधानकारक' : 'उत्तम एवं संतोषजनक';
}

export function getLocalizedBehaviour(behaviour?: string, lang: 'en' | 'mr' | 'hi' = 'mr'): string {
  if (!behaviour) return lang === 'mr' ? 'उत्तम व आज्ञाधारक' : lang === 'hi' ? 'उत्तम एवं आज्ञाकारी' : 'Good & Obedient';
  if (lang === 'en') return behaviour;

  const low = behaviour.toLowerCase().trim();
  if (low.includes('cooperative') || (low.includes('very good') && low.includes('cooperative'))) {
    return lang === 'mr' ? 'उत्कृष्ट व सहकार्यशील' : 'अति उत्तम एवं सहयोगी';
  }
  if (low.includes('disciplined')) {
    return lang === 'mr' ? 'उत्तम व शिस्तबद्ध' : 'उत्तम एवं अनुशासित';
  }
  if (low.includes('exemplary')) {
    return lang === 'mr' ? 'अनुकरणीय' : 'अनुकरणीय';
  }
  if (low.includes('well behaved')) {
    return lang === 'mr' ? 'सद्वर्तनी व आज्ञाधारक' : 'सदाचारी एवं आज्ञाकारी';
  }
  if (low.includes('punctual') || low.includes('dedicated')) {
    return lang === 'mr' ? 'वेळेचे पालन करणारा व निष्ठावान' : 'समयनिष्ठ एवं समर्पित';
  }
  if (low.includes('good')) {
    return lang === 'mr' ? 'उत्तम व आज्ञाधारक' : 'उत्तम एवं आज्ञाकारी';
  }
  return lang === 'mr' ? 'उत्तम' : 'उत्तम';
}

export function getLocalizedLeavingReason(reason?: string, lang: 'en' | 'mr' | 'hi' = 'mr'): string {
  if (!reason) {
    return lang === 'mr' ? 'पालकांची बदली / अभ्यासक्रम पूर्ण' : lang === 'hi' ? 'अभिभावक का स्थानांतरण / पाठ्यक्रम पूर्ण' : 'Parent Transfer / Completed Course';
  }
  if (lang === 'en') return reason;

  const low = reason.toLowerCase().trim();
  if (low.includes('mumbai') && low.includes('transfer')) {
    return lang === 'mr' ? 'पालकांची मुंबई येथे बदली' : 'अभिभावक का मुंबई स्थानांतरण';
  }
  if (low.includes('transfer')) {
    return lang === 'mr' ? 'पालकांची बदली' : 'अभिभावक का स्थानांतरण';
  }
  if (low.includes('higher education') || low.includes('higher studies')) {
    return lang === 'mr' ? 'पुढील उच्च शिक्षणासाठी' : 'उच्च शिक्षा हेतु';
  }
  if (low.includes('completed')) {
    return lang === 'mr' ? 'अभ्यासक्रम पूर्ण झाल्यामुळे' : 'पाठ्यक्रम पूर्ण होने पर';
  }
  return transliterateToDevanagari(reason);
}
