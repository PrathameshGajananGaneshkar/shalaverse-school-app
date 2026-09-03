import * as XLSX from 'xlsx';
import { Student, AdmissionClass } from '../types';
import { formatDate } from './dateUtils';

// Headers mapping for Excel & CSV export/import
export const STUDENT_EXCEL_HEADERS = [
  'GR No.',
  'Student ID',
  'Student Full Name',
  "Father's Name",
  "Mother's Name",
  'Admission Class',
  'Admission Year',
  'Admission Date',
  'Date of Birth',
  'Birth Place',
  'Nationality',
  'Mother Tongue',
  'Religion',
  'Caste',
  'Sub-Caste',
  'UID / Aadhaar',
  'Mobile',
  'Address',
  'Previous School',
  'Academic Progress',
  'Behaviour',
  'Leaving Reason',
  'Certificate Date'
];

/**
 * Exports students list to Excel (.xlsx) file
 */
export function exportStudentsToExcel(students: Student[], filename = 'ShalaVerse_Student_Master.xlsx') {
  if (!students || students.length === 0) {
    alert('No data available to export.');
    return;
  }

  const dataRows = students.map(s => ({
    'GR No.': s.grNumber || '',
    'Student ID': s.studentId || '',
    'Student Full Name': s.studentName || '',
    "Father's Name": s.fatherName || '',
    "Mother's Name": s.motherName || '',
    'Admission Class': s.admissionClass || '',
    'Admission Year': s.admissionYear || '',
    'Admission Date': formatDate(s.admissionDate),
    'Date of Birth': formatDate(s.birthDate),
    'Birth Place': s.birthPlace || '',
    'Nationality': s.nationality || 'Indian',
    'Mother Tongue': s.motherTongue || 'मराठी',
    'Religion': s.religion || 'Hindu',
    'Caste': s.caste || '',
    'Sub-Caste': s.subCaste || '',
    'UID / Aadhaar': s.uid || '',
    'Mobile': s.mobile || '',
    'Address': s.address || '',
    'Previous School': s.previousSchool || '',
    'Academic Progress': s.academicProgress || 'Good',
    'Behaviour': s.behaviour || 'Good',
    'Leaving Reason': s.leavingReason || '',
    'Certificate Date': formatDate(s.certificateDate)
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
  XLSX.writeFile(workbook, filename);
}

/**
 * Exports students list to CSV file
 */
export function exportStudentsToCSV(students: Student[], filename = 'ShalaVerse_Student_Master.csv') {
  if (!students || students.length === 0) {
    alert('No data available to export.');
    return;
  }

  const rows = students.map(s => [
    `"${s.grNumber || ''}"`,
    `"${s.studentId || ''}"`,
    `"${(s.studentName || '').replace(/"/g, '""')}"`,
    `"${(s.fatherName || '').replace(/"/g, '""')}"`,
    `"${(s.motherName || '').replace(/"/g, '""')}"`,
    `"${s.admissionClass || ''}"`,
    `"${s.admissionYear || ''}"`,
    `"${formatDate(s.admissionDate)}"`,
    `"${formatDate(s.birthDate)}"`,
    `"${(s.birthPlace || '').replace(/"/g, '""')}"`,
    `"${s.nationality || ''}"`,
    `"${s.motherTongue || ''}"`,
    `"${s.religion || ''}"`,
    `"${s.caste || ''}"`,
    `"${s.subCaste || ''}"`,
    `"${s.uid || ''}"`,
    `"${s.mobile || ''}"`,
    `"${(s.address || '').replace(/"/g, '""')}"`,
    `"${(s.previousSchool || '').replace(/"/g, '""')}"`,
    `"${(s.academicProgress || '').replace(/"/g, '""')}"`,
    `"${(s.behaviour || '').replace(/"/g, '""')}"`,
    `"${(s.leavingReason || '').replace(/"/g, '""')}"`,
    `"${formatDate(s.certificateDate)}"`
  ]);

  const csvContent = '\uFEFF' + [STUDENT_EXCEL_HEADERS.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format Excel date (serial number, Marathi date string, DD/MM/YYYY, etc.) to YYYY-MM-DD
 */
function parseAnyDateToISO(val: any, fallbackYear = 2025): string {
  if (!val) return '';
  if (typeof val === 'number') {
    // Excel date serial number
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  const str = String(val).trim();
  if (!str) return '';

  // Check if already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    let year = dmyMatch[3];
    if (year.length === 2) {
      year = parseInt(year, 10) > 50 ? `19${year}` : `20${year}`;
    }
    return `${year}-${month}-${day}`;
  }

  // Try standard Date parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900) {
    return parsed.toISOString().split('T')[0];
  }

  return `${fallbackYear}-06-15`;
}

/**
 * Normalizes class text into standard AdmissionClass (e.g. '1 ली', '1st', '१० वी', '10th')
 */
function normalizeClass(raw: string): AdmissionClass {
  if (!raw) return '1st';
  const clean = raw.toLowerCase().trim();
  
  if (clean.includes('12') || clean.includes('१२')) return '12th';
  if (clean.includes('11') || clean.includes('११')) return '11th';
  if (clean.includes('10') || clean.includes('१०')) return '10th';
  if (clean.includes('9') || clean.includes('९')) return '9th';
  if (clean.includes('8') || clean.includes('८')) return '8th';
  if (clean.includes('7') || clean.includes('७')) return '7th';
  if (clean.includes('6') || clean.includes('६')) return '6th';
  if (clean.includes('5') || clean.includes('५')) return '5th';
  if (clean.includes('4') || clean.includes('४')) return '4th';
  if (clean.includes('3') || clean.includes('३')) return '3rd';
  if (clean.includes('2') || clean.includes('२')) return '2nd';
  if (clean.includes('1') || clean.includes('१')) return '1st';

  const validClasses: AdmissionClass[] = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
  const matched = validClasses.find(c => clean.includes(c));
  return matched || '1st';
}

/**
 * Parses raw Excel (ArrayBuffer) or CSV into Partial<Student>[]
 * Supports ANY number of students (100, 500, 1000, 10000+)
 * Supports both Marathi & English column headers with fuzzy matching
 */
export function parseExcelOrCSVToStudents(data: ArrayBuffer | string): Partial<Student>[] {
  try {
    const workbook = typeof data === 'string' 
      ? XLSX.read(data, { type: 'string' })
      : XLSX.read(data, { type: 'array' });

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];
    
    const worksheet = workbook.Sheets[firstSheetName];
    // Convert to 2D array of rows to accurately detect header row if top row contains school name/title
    const matrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (!matrix || matrix.length === 0) {
      return [];
    }

    // Step 1: Find the actual header row by scanning first 15 rows for keywords
    const headerKeywords = [
      'gr', 'जीआर', 'नाव', 'name', 'student', 'विद्यार्थी', 'class', 'वर्ग', 'इयत्ता', 
      'birth', 'जन्म', 'father', 'वडील', 'mother', 'आई', 'aadhaar', 'आधार', 'mobile', 'मोबाईल'
    ];

    let headerRowIndex = 0;
    let maxMatchCount = 0;

    for (let r = 0; r < Math.min(matrix.length, 15); r++) {
      const row = matrix[r];
      if (!Array.isArray(row)) continue;
      
      let matchCount = 0;
      for (const cell of row) {
        const cellStr = String(cell || '').toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '');
        if (headerKeywords.some(kw => cellStr.includes(kw))) {
          matchCount++;
        }
      }

      if (matchCount > maxMatchCount) {
        maxMatchCount = matchCount;
        headerRowIndex = r;
      }
    }

    // Header row columns
    const headerRow = (matrix[headerRowIndex] || []).map(h => 
      String(h || '').trim().toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '')
    );

    const findColIdx = (keywords: string[]): number => {
      return headerRow.findIndex(h => keywords.some(k => h.includes(k.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, ''))));
    };

    // Column Indices for Marathi and English headers
    const grIdx = findColIdx(['grno', 'grnum', 'gr', 'generalregister', 'जीआर', 'दाखलक्र', 'दाखलक्रमांक', 'जनरलरजिस्टर', 'रजिस्टरनं']);
    const stuIdIdx = findColIdx(['studentid', 'stuid', 'saralid', 'सरलआयडी', 'स्टुडंटआयडी', 'सरल', 'saral']);
    const nameIdx = findColIdx(['studentfullname', 'studentname', 'fullname', 'name', 'विद्यार्थ्याचेनाव', 'विद्यार्थ्यांचेनाव', 'संपूर्णनाव', 'नाव', 'विद्यार्थीनाव']);
    const fatherIdx = findColIdx(['fathername', 'father', 'guardian', 'वडिलांचेनाव', 'पालकांचेनाव', 'वडील']);
    const motherIdx = findColIdx(['mothername', 'mother', 'आईचेनाव', 'आई']);
    const classIdx = findColIdx(['admissionclass', 'class', 'standard', 'std', 'इयत्ता', 'वर्ग', 'प्रवेशवर्ग']);
    const yearIdx = findColIdx(['admissionyear', 'academicyear', 'year', 'प्रवेशवर्ष', 'शैक्षणिकवर्ष', 'वर्ष']);
    const admDateIdx = findColIdx(['admissiondate', 'admdate', 'dateofadmission', 'प्रवेशदिनांक', 'दाखलदिनांक', 'प्रवेशतारीख']);
    const dobIdx = findColIdx(['dateofbirth', 'birthdate', 'dob', 'जन्मतारीख', 'जन्मदिनांक', 'जन्म']);
    const birthPlaceIdx = findColIdx(['birthplace', 'placeofbirth', 'जन्मठिकाण', 'जन्मस्थळ', 'जन्मगाव']);
    const nationalityIdx = findColIdx(['nationality', 'राष्ट्रीयत्व', 'देश']);
    const motherTongueIdx = findColIdx(['mothertongue', 'मातृभाषा']);
    const religionIdx = findColIdx(['religion', 'धर्म']);
    const casteIdx = findColIdx(['caste', 'जात']);
    const subCasteIdx = findColIdx(['subcaste', 'category', 'उपजात', 'प्रवर्ग']);
    const uidIdx = findColIdx(['uid', 'aadhaar', 'aadhar', 'आधारकार्ड', 'आधारनंबर', 'आधार']);
    const mobileIdx = findColIdx(['mobile', 'phone', 'contact', 'मोबाईलनंबर', 'मोबाईल', 'फोन']);
    const addressIdx = findColIdx(['address', 'पत्ता', 'रहिवासीपत्ता', 'गाव']);
    const prevSchoolIdx = findColIdx(['previousschool', 'prevschool', 'lastschool', 'मागीलशाळा', 'पूर्वीचीशाळा']);
    const progressIdx = findColIdx(['academicprogress', 'progress', 'प्रगती', 'अभ्यासप्रगती']);
    const behaviourIdx = findColIdx(['behaviour', 'behavior', 'conduct', 'वर्तन', 'वर्तणूक']);
    const reasonIdx = findColIdx(['leavingreason', 'reason', 'शाळासोडण्याचेकारण', 'कारण']);
    const certDateIdx = findColIdx(['certificatedate', 'leavingdate', 'tcdate', 'दाखलादिनांक', 'टीसीदिनांक']);

    const students: Partial<Student>[] = [];

    // Parse all rows after headerRowIndex
    for (let i = headerRowIndex + 1; i < matrix.length; i++) {
      const row = matrix[i];
      if (!row || !Array.isArray(row) || row.length === 0) continue;

      const getCellVal = (idx: number): string => {
        if (idx >= 0 && idx < row.length) {
          const val = row[idx];
          return val !== null && val !== undefined ? String(val).trim() : '';
        }
        return '';
      };

      const rawName = nameIdx >= 0 ? getCellVal(nameIdx) : '';
      const rawGr = grIdx >= 0 ? getCellVal(grIdx) : '';

      // Skip completely blank rows
      if (!rawName && !rawGr && !row.some(c => String(c).trim().length > 0)) {
        continue;
      }

      const grNumber = rawGr || `GR-${1000 + students.length + 1}`;
      const studentName = rawName || `विद्यार्थी ${students.length + 1}`;
      const studentId = stuIdIdx >= 0 && getCellVal(stuIdIdx) ? getCellVal(stuIdIdx) : `20252704020${(100 + students.length + 1).toString().padStart(4, '0')}`;
      
      const fatherName = fatherIdx >= 0 ? getCellVal(fatherIdx) : '';
      const motherName = motherIdx >= 0 ? getCellVal(motherIdx) : '';
      const admissionClass = normalizeClass(classIdx >= 0 ? getCellVal(classIdx) : '1st');
      const admissionYear = yearIdx >= 0 && getCellVal(yearIdx) ? getCellVal(yearIdx) : '2025-2026';
      
      const admissionDate = admDateIdx >= 0 ? parseAnyDateToISO(row[admDateIdx], 2025) : '2025-06-16';
      const birthDate = dobIdx >= 0 ? parseAnyDateToISO(row[dobIdx], 2015) : '2015-05-10';
      const birthPlace = birthPlaceIdx >= 0 && getCellVal(birthPlaceIdx) ? getCellVal(birthPlaceIdx) : 'चिखली';
      const nationality = nationalityIdx >= 0 && getCellVal(nationalityIdx) ? getCellVal(nationalityIdx) : 'Indian (भारतीय)';
      const motherTongue = motherTongueIdx >= 0 && getCellVal(motherTongueIdx) ? getCellVal(motherTongueIdx) : 'मराठी';
      const religion = religionIdx >= 0 && getCellVal(religionIdx) ? getCellVal(religionIdx) : 'Hindu (हिंदू)';
      const caste = casteIdx >= 0 && getCellVal(casteIdx) ? getCellVal(casteIdx) : 'Maratha (मराठा)';
      const subCaste = subCasteIdx >= 0 ? getCellVal(subCasteIdx) : '';
      const uid = uidIdx >= 0 ? getCellVal(uidIdx).replace(/[^0-9]/g, '') : '';
      const mobile = mobileIdx >= 0 ? getCellVal(mobileIdx).replace(/[^0-9]/g, '') : '';
      const address = addressIdx >= 0 && getCellVal(addressIdx) ? getCellVal(addressIdx) : 'मु. पो. चिखली, ता. चिखली, जि. बुलढाणा';
      const previousSchool = prevSchoolIdx >= 0 && getCellVal(prevSchoolIdx) ? getCellVal(prevSchoolIdx) : 'जि. प. प्राथमिक शाळा';
      const academicProgress = progressIdx >= 0 && getCellVal(progressIdx) ? getCellVal(progressIdx) : 'Good (चांगली)';
      const behaviour = behaviourIdx >= 0 && getCellVal(behaviourIdx) ? getCellVal(behaviourIdx) : 'Good (उत्तम)';
      const leavingReason = reasonIdx >= 0 ? getCellVal(reasonIdx) : '';
      const certificateDate = certDateIdx >= 0 ? parseAnyDateToISO(row[certDateIdx]) : '';

      students.push({
        grNumber,
        studentId,
        studentName,
        fatherName,
        motherName,
        admissionClass,
        admissionYear,
        admissionDate,
        birthDate,
        birthPlace,
        nationality,
        motherTongue,
        religion,
        caste,
        subCaste,
        uid,
        mobile,
        address,
        previousSchool,
        academicProgress,
        behaviour,
        leavingReason,
        certificateDate
      });
    }

    return students;
  } catch (err) {
    console.error('Error parsing Excel/CSV:', err);
    return [];
  }
}

/**
 * Legacy CSV parser support
 */
export function parseCSVToStudents(csvText: string): Partial<Student>[] {
  return parseExcelOrCSVToStudents(csvText);
}

/**
 * Generates 100 Realistic Maharashtra School Students Data
 */
export function generate100SampleStudents(): Student[] {
  const firstNamesBoys = [
    { en: 'Aarav', mr: 'आरव' },
    { en: 'Aditya', mr: 'आदित्य' },
    { en: 'Aniket', mr: 'अनिकेत' },
    { en: 'Aryan', mr: 'आर्यन' },
    { en: 'Chetan', mr: 'चेतन' },
    { en: 'Darshan', mr: 'दर्शन' },
    { en: 'Digvijay', mr: 'दिग्विजय' },
    { en: 'Ganesh', mr: 'गणेश' },
    { en: 'Gaurav', mr: 'गौरव' },
    { en: 'Harshal', mr: 'हर्षल' },
    { en: 'Jayesh', mr: 'जयेश' },
    { en: 'Karan', mr: 'करण' },
    { en: 'Mayur', mr: 'मयूर' },
    { en: 'Nikhil', mr: 'निखिल' },
    { en: 'Omkar', mr: 'ओंकार' },
    { en: 'Pranav', mr: 'प्रणव' },
    { en: 'Prathamesh', mr: 'प्रथमेश' },
    { en: 'Rahul', mr: 'राहुल' },
    { en: 'Rohan', mr: 'रोहन' },
    { en: 'Rohit', mr: 'रोहित' },
    { en: 'Sahil', mr: 'साहिल' },
    { en: 'Sanket', mr: 'संकेत' },
    { en: 'Saurabh', mr: 'सौरभ' },
    { en: 'Shreyas', mr: 'श्रेयस' },
    { en: 'Siddhesh', mr: 'सिद्धेश' },
    { en: 'Swapnil', mr: 'स्वप्निल' },
    { en: 'Tanmay', mr: 'तन्मय' },
    { en: 'Tejas', mr: 'तेजस' },
    { en: 'Vaibhav', mr: 'वैभव' },
    { en: 'Varun', mr: 'वरुण' },
    { en: 'Vedant', mr: 'वेदांत' },
    { en: 'Yash', mr: 'यश' }
  ];

  const firstNamesGirls = [
    { en: 'Aarti', mr: 'आरती' },
    { en: 'Akanksha', mr: 'आकांक्षा' },
    { en: 'Ananya', mr: 'अनन्या' },
    { en: 'Anjali', mr: 'अंजली' },
    { en: 'Anushka', mr: 'अनुष्का' },
    { en: 'Bhakti', mr: 'भक्ती' },
    { en: 'Deepali', mr: 'दीपाली' },
    { en: 'Divya', mr: 'दिव्या' },
    { en: 'Gayatri', mr: 'गायत्री' },
    { en: 'Isha', mr: 'ईशा' },
    { en: 'Kajal', mr: 'काजल' },
    { en: 'Kalyani', mr: 'कल्याणी' },
    { en: 'Komal', mr: 'कोमल' },
    { en: 'Manasi', mr: 'मानसी' },
    { en: 'Mayuri', mr: 'मयुरी' },
    { en: 'Neha', mr: 'नेहा' },
    { en: 'Nikita', mr: 'निकिता' },
    { en: 'Pallavi', mr: 'पल्लवी' },
    { en: 'Pooja', mr: 'पूजा' },
    { en: 'Pranali', mr: 'प्रणाली' },
    { en: 'Pratiksha', mr: 'प्रतीक्षा' },
    { en: 'Priya', mr: 'प्रिया' },
    { en: 'Radhika', mr: 'राधिका' },
    { en: 'Rutuja', mr: 'ऋतुजा' },
    { en: 'Sakshi', mr: 'साक्षी' },
    { en: 'Samruddhi', mr: 'समृद्धी' },
    { en: 'Sanika', mr: 'सानिका' },
    { en: 'Sayali', mr: 'सायली' },
    { en: 'Shravani', mr: 'श्रावणी' },
    { en: 'Snehal', mr: 'स्नेहल' },
    { en: 'Tanvi', mr: 'तन्वी' },
    { en: 'Vaishnavi', mr: 'वैष्णवी' }
  ];

  const lastNames = [
    { en: 'Patil', mr: 'पाटील' },
    { en: 'Deshmukh', mr: 'देशमुख' },
    { en: 'Jadhav', mr: 'जाधव' },
    { en: 'Pawar', mr: 'पवार' },
    { en: 'Kadam', mr: 'कदम' },
    { en: 'Shinde', mr: 'शिंदे' },
    { en: 'Gaikwad', mr: 'गायकवाड' },
    { en: 'More', mr: 'मोरे' },
    { en: 'Chavan', mr: 'चव्हाण' },
    { en: 'Ganeshkar', mr: 'गणेशकर' },
    { en: 'Kulkarni', mr: 'कुलकर्णी' },
    { en: 'Sawant', mr: 'सावंत' },
    { en: 'Ghatge', mr: 'घाटगे' },
    { en: 'Kale', mr: 'काळे' },
    { en: 'Bhosale', mr: 'भोसले' },
    { en: 'Raut', mr: 'राऊत' },
    { en: 'Wagh', mr: 'वाघ' },
    { en: 'Thorat', mr: 'थोरात' },
    { en: 'Kharat', mr: 'खरात' },
    { en: 'Mane', mr: 'माने' },
    { en: 'Jagdale', mr: 'जगदाळे' },
    { en: 'Solanke', mr: 'सोळंके' },
    { en: 'Bhave', mr: 'भावे' },
    { en: 'Borade', mr: 'बोराडे' },
    { en: 'Waghmare', mr: 'वाघमारे' }
  ];

  const fatherNames = [
    { en: 'Gajanan', mr: 'गजानन' },
    { en: 'Ramesh', mr: 'रमेश' },
    { en: 'Suresh', mr: 'सुरेश' },
    { en: 'Santosh', mr: 'संतोष' },
    { en: 'Mahesh', mr: 'महेश' },
    { en: 'Dnyaneshwar', mr: 'ज्ञानेश्वर' },
    { en: 'Vijay', mr: 'विजय' },
    { en: 'Sanjay', mr: 'संजय' },
    { en: 'Sunil', mr: 'सुनील' },
    { en: 'Prakash', mr: 'प्रकाश' },
    { en: 'Anil', mr: 'अनिल' },
    { en: 'Nitin', mr: 'नितीन' },
    { en: 'Sachin', mr: 'सचिन' },
    { en: 'Rajendra', mr: 'राजेन्द्र' },
    { en: 'Vishnu', mr: 'विष्णू' }
  ];

  const motherNames = [
    { en: 'Sunita', mr: 'सुनिता' },
    { en: 'Shobha', mr: 'शोभा' },
    { en: 'Sangeeta', mr: 'संगीता' },
    { en: 'Mangal', mr: 'मंगल' },
    { en: 'Laxmi', mr: 'लक्ष्मी' },
    { en: 'Sarita', mr: 'सरिता' },
    { en: 'Vandana', mr: 'वंदना' },
    { en: 'Rekha', mr: 'रेखा' },
    { en: 'Usha', mr: 'उषा' },
    { en: 'Anita', mr: 'अनिता' },
    { en: 'Kavita', mr: 'कविता' },
    { en: 'Archana', mr: 'अर्चना' },
    { en: 'Suvarna', mr: 'सुवर्णा' },
    { en: 'Surekha', mr: 'सुरेखा' }
  ];

  const classes: AdmissionClass[] = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
  const castes = ['Maratha (मराठा)', 'Kunbi (कुणबी)', 'OBC (माळी)', 'Brahmin (ब्राह्मण)', 'SC (बौद्ध)', 'ST (आदिवासी)', 'VJNT (धनगर)', 'Open (खुला)'];
  const villages = ['चिखली', 'अंत्री', 'शेलगाव', 'मेरा बु.', 'अंधेरा', 'उंद्री', 'कोलारा', 'किन्ही', 'दरेगाव', 'आंबेवाडी', 'गांगुर्डे', 'बुलढाणा'];

  const students: Student[] = [];

  for (let i = 1; i <= 100; i++) {
    const isBoy = i % 2 !== 0;
    const fnList = isBoy ? firstNamesBoys : firstNamesGirls;
    const fn = fnList[(i - 1) % fnList.length];
    const ln = lastNames[(i - 1) % lastNames.length];
    const father = fatherNames[(i - 1) % fatherNames.length];
    const mother = motherNames[(i - 1) % motherNames.length];
    const village = villages[(i - 1) % villages.length];
    const caste = castes[(i - 1) % castes.length];
    const admClass = classes[(i - 1) % classes.length];

    const grNumber = `GR-${1000 + i}`;
    const studentId = `20252704020119${(100 + i).toString().padStart(4, '0')}`;
    const studentName = `${ln.mr} ${fn.mr} ${father.mr} (${ln.en} ${fn.en} ${father.en})`;

    // Calculate realistic birth year based on class
    const classNum = parseInt(admClass) || 1;
    const birthYear = 2025 - (5 + classNum);
    const birthMonth = String(((i * 3) % 12) + 1).padStart(2, '0');
    const birthDay = String(((i * 7) % 28) + 1).padStart(2, '0');
    const birthDate = `${birthYear}-${birthMonth}-${birthDay}`;

    // Aadhaar / UID (12 digits)
    const uid = `4523${String(10000000 + i * 7891).slice(0, 8)}`;
    // Mobile number
    const mobile = `9822${String(100000 + i * 3421).slice(0, 6)}`;

    students.push({
      id: `sample-100-${i}`,
      grNumber,
      studentId,
      studentName,
      fatherName: `${ln.mr} ${father.mr} (${ln.en} ${father.en})`,
      motherName: `${mother.mr} (${mother.en})`,
      admissionClass: admClass,
      admissionYear: '2025-2026',
      admissionDate: '2025-06-16',
      birthDate,
      birthPlace: village,
      nationality: 'Indian (भारतीय)',
      motherTongue: 'मराठी',
      religion: 'Hindu (हिंदू)',
      caste: caste,
      subCaste: 'मराठा',
      uid,
      mobile,
      address: `मु. पो. ${village}, ता. चिखली, जि. बुलढाणा - ४४३२०१`,
      previousSchool: 'जि. प. प्राथमिक शाळा, ' + village,
      academicProgress: i % 5 === 0 ? 'Excellent (अतिउत्कृष्ट)' : 'Good (चांगली)',
      behaviour: 'Good (उत्तम)',
      leavingReason: '',
      certificateDate: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  return students;
}

/**
 * Direct helper to download 100 Sample Students Excel file
 */
export function downloadSample100StudentsExcel(format: 'xlsx' | 'csv' = 'xlsx') {
  const sample100 = generate100SampleStudents();
  if (format === 'xlsx') {
    exportStudentsToExcel(sample100, 'ShalaVerse_100_Students_Sample_Master.xlsx');
  } else {
    exportStudentsToCSV(sample100, 'ShalaVerse_100_Students_Sample_Master.csv');
  }
}

export function triggerPrint() {
  printCertificateElement('certificate-print-area', 'Certificate');
}

/**
 * Robust cross-browser and iframe certificate printer
 * Handles sandboxed iframes (like AI Studio preview) by opening an isolated printable tab
 */
export function printCertificateElement(elementId: string = 'certificate-print-area', docTitle: string = 'Certificate') {
  try {
    window.focus();
  } catch (e) {
    // ignore
  }

  const targetElement = document.getElementById(elementId) || document.querySelector('.a4-document-page');

  if (!targetElement) {
    try {
      window.print();
    } catch (e) {
      console.error('Direct window.print error:', e);
    }
    return;
  }

  // Gather all active stylesheets and style blocks from document
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(s => s.outerHTML)
    .join('\n');

  // Clone clean certificate DOM without internal edit buttons
  const clone = targetElement.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('button, .print\\:hidden, [title*="Edit"], [title*="संपादित"]').forEach(el => el.remove());

  const printableHTML = `<!DOCTYPE html>
<html lang="mr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${docTitle} - Print</title>
    ${styles}
    <style>
      @page {
        size: A4 portrait;
        margin: 4mm 5mm;
      }
      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body {
        margin: 0;
        padding: 16px 0;
        background: #f1f5f9;
        font-family: serif;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .print-bar {
        width: 100%;
        max-width: 210mm;
        background: #0f172a;
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        margin-bottom: 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 4px 14px rgba(0,0,0,0.18);
        font-family: sans-serif;
      }
      .print-act-btn {
        background: #2563eb;
        color: white;
        border: none;
        padding: 8px 24px;
        font-size: 15px;
        font-weight: bold;
        border-radius: 8px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .print-act-btn:hover {
        background: #1d4ed8;
      }
      .close-act-btn {
        background: #475569;
        color: white;
        border: none;
        padding: 8px 16px;
        font-size: 14px;
        border-radius: 8px;
        cursor: pointer;
      }
      .close-act-btn:hover {
        background: #334155;
      }
      .a4-document-page {
        width: 100% !important;
        max-width: 210mm !important;
        min-height: 297mm !important;
        background: white !important;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
        box-sizing: border-box !important;
        margin: 0 auto !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
      }
      .a4-inner-box {
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
      }
      @media print {
        body {
          background: white !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        .print-bar {
          display: none !important;
        }
        .a4-document-page {
          box-shadow: none !important;
          border: 2px solid #000000 !important;
          padding: 3mm 4mm !important;
          width: 100% !important;
          max-width: 100% !important;
          min-height: 285mm !important;
          margin: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
        }
        .a4-inner-box {
          flex: 1 !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
        }
        button, .print\\:hidden, [title*="Edit"], [title*="संपादित"] {
          display: none !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="print-bar">
      <span style="font-size: 14px; font-weight: bold;">📄 ${docTitle}</span>
      <div style="display: flex; gap: 10px;">
        <button class="print-act-btn" onclick="window.print()">🖨️ प्रिंट करा / Save as PDF</button>
        <button class="close-act-btn" onclick="window.close()">✕ बंद करा</button>
      </div>
    </div>
    ${clone.outerHTML}
    <script>
      window.addEventListener('load', function() {
        setTimeout(function() {
          try {
            window.print();
          } catch(e) {
            console.error('Print auto trigger:', e);
          }
        }, 350);
      });
    </script>
  </body>
</html>`;

  // Create Blob & URL for seamless popup that escapes iframe sandbox
  try {
    const blob = new Blob([printableHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    
    if (!win) {
      // If popup blocked, create a temporary download / open link
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  } catch (err) {
    console.warn('Blob print trigger failed, attempting direct window.print:', err);
    try {
      window.print();
    } catch (e) {
      console.error('Native print also failed:', e);
    }
  }
}

export function printDocumentDirectly() {
  printCertificateElement('certificate-print-area', 'Certificate');
}

