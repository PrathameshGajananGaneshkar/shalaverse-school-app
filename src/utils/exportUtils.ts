import { Student, AdmissionClass } from '../types';
import { formatDate } from './dateUtils';

export function exportStudentsToCSV(students: Student[], filename = 'ShalaVerse_Student_Master.csv') {
  if (!students || students.length === 0) {
    alert('No data available to export.');
    return;
  }

  const headers = [
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

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
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

export function parseCSVToStudents(csvText: string): Partial<Student>[] {
  const lines = csvText.split(/\r\n|\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Helper to split CSV row taking into account quotes
  const parseCSVLine = (text: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        if (inQuotes && text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headerRow = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  const findIndex = (keywords: string[]) => {
    return headerRow.findIndex(h => keywords.some(k => h.includes(k)));
  };

  const grIdx = findIndex(['grno', 'gr', 'generalregister']);
  const stuIdIdx = findIndex(['studentid', 'stuid', 'saralid']);
  const nameIdx = findIndex(['studentfullname', 'studentname', 'fullname', 'name']);
  const fatherIdx = findIndex(['father', 'guardian']);
  const motherIdx = findIndex(['mother']);
  const classIdx = findIndex(['admissionclass', 'class', 'standard']);
  const yearIdx = findIndex(['admissionyear', 'year', 'academicyear']);
  const admDateIdx = findIndex(['admissiondate', 'admdate', 'dateofadmission']);
  const dobIdx = findIndex(['dateofbirth', 'birthdate', 'dob']);
  const birthPlaceIdx = findIndex(['birthplace', 'placeofbirth']);
  const nationalityIdx = findIndex(['nationality']);
  const motherTongueIdx = findIndex(['mothertongue']);
  const religionIdx = findIndex(['religion']);
  const casteIdx = findIndex(['caste']);
  const subCasteIdx = findIndex(['subcaste']);
  const uidIdx = findIndex(['uid', 'aadhaar', 'aadhar']);
  const mobileIdx = findIndex(['mobile', 'phone', 'contact']);
  const addressIdx = findIndex(['address']);
  const prevSchoolIdx = findIndex(['previousschool', 'prevschool', 'lastschool']);
  const progressIdx = findIndex(['academicprogress', 'progress']);
  const behaviourIdx = findIndex(['behaviour', 'behavior', 'conduct']);
  const reasonIdx = findIndex(['leavingreason', 'reason']);
  const certDateIdx = findIndex(['certificatedate', 'leavingdate', 'tcdate']);

  const students: Partial<Student>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length === 0 || !cols.some(c => c.length > 0)) continue;

    const grVal = grIdx >= 0 ? cols[grIdx] : '';
    const nameVal = nameIdx >= 0 ? cols[nameIdx] : '';

    if (!grVal && !nameVal) continue;

    const rawClass = classIdx >= 0 ? cols[classIdx] : '';
    const validClasses = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
    const matchedClass = validClasses.find(c => rawClass.toLowerCase().includes(c.toLowerCase())) as AdmissionClass || '1st';

    students.push({
      grNumber: grVal || `GR-${Date.now().toString().slice(-4)}`,
      studentId: stuIdIdx >= 0 ? cols[stuIdIdx] : '',
      studentName: nameVal || 'विद्यार्थी नाव',
      fatherName: fatherIdx >= 0 ? cols[fatherIdx] : '',
      motherName: motherIdx >= 0 ? cols[motherIdx] : '',
      admissionClass: matchedClass,
      admissionYear: yearIdx >= 0 ? cols[yearIdx] || '2025-2026' : '2025-2026',
      admissionDate: admDateIdx >= 0 && cols[admDateIdx] ? cols[admDateIdx] : new Date().toISOString().split('T')[0],
      birthDate: dobIdx >= 0 && cols[dobIdx] ? cols[dobIdx] : '2015-01-01',
      birthPlace: birthPlaceIdx >= 0 ? cols[birthPlaceIdx] : '',
      nationality: nationalityIdx >= 0 && cols[nationalityIdx] ? cols[nationalityIdx] : 'Indian (भारतीय)',
      motherTongue: motherTongueIdx >= 0 && cols[motherTongueIdx] ? cols[motherTongueIdx] : 'मराठी',
      religion: religionIdx >= 0 && cols[religionIdx] ? cols[religionIdx] : 'Hindu (हिंदू)',
      caste: casteIdx >= 0 ? cols[casteIdx] : 'Maratha',
      subCaste: subCasteIdx >= 0 ? cols[subCasteIdx] : '',
      uid: uidIdx >= 0 ? cols[uidIdx] : '',
      mobile: mobileIdx >= 0 ? cols[mobileIdx] : '',
      address: addressIdx >= 0 ? cols[addressIdx] : '',
      previousSchool: prevSchoolIdx >= 0 ? cols[prevSchoolIdx] : '',
      academicProgress: progressIdx >= 0 && cols[progressIdx] ? cols[progressIdx] : 'Good (चांगली)',
      behaviour: behaviourIdx >= 0 && cols[behaviourIdx] ? cols[behaviourIdx] : 'Good (उत्तम)',
      leavingReason: reasonIdx >= 0 ? cols[reasonIdx] : '',
      certificateDate: certDateIdx >= 0 ? cols[certDateIdx] : ''
    });
  }

  return students;
}

export function triggerPrint() {
  window.print();
}
