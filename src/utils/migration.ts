import { Student } from '../types';
import { studentService } from '../services/studentService';

export interface MigrationResult {
  migratedCount: number;
  skippedCount: number;
  message: string;
}

export async function migrateLegacyData(): Promise<MigrationResult> {
  const legacyKeys = ['students', 'student_data', 'students_list', 'shalaverse_students'];
  let foundRecords: any[] = [];

  for (const key of legacyKeys) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          foundRecords = [...foundRecords, ...parsed];
        }
      } catch {
        // ignore
      }
    }
  }

  if (foundRecords.length === 0) {
    return {
      migratedCount: 0,
      skippedCount: 0,
      message: 'No legacy localStorage student data was found to migrate.'
    };
  }

  let migrated = 0;
  let skipped = 0;

  const existing = await studentService.getAllStudents();
  const existingGrMap = new Set(existing.map(s => s.grNumber));

  for (const item of foundRecords) {
    const gr = item.grNumber || item.gr_no || item.grNo || item.gr;
    if (!gr || existingGrMap.has(gr)) {
      skipped++;
      continue;
    }

    const student: Omit<Student, 'id'> = {
      studentId: item.studentId || `STU-${item.admissionYear || '2026'}-${gr}`,
      grNumber: gr,
      admissionYear: item.admissionYear || item.year || '2026-2027',
      admissionDate: item.admissionDate || item.date || new Date().toISOString().split('T')[0],
      admissionClass: item.admissionClass || item.class || '9th',
      studentName: item.studentName || item.name || item.fullName || '',
      fatherName: item.fatherName || item.father || '',
      motherName: item.motherName || item.mother || '',
      birthDate: item.birthDate || item.dob || '',
      birthPlace: item.birthPlace || item.placeOfBirth || '',
      nationality: item.nationality || 'Indian',
      motherTongue: item.motherTongue || 'Marathi',
      religion: item.religion || 'Hindu',
      caste: item.caste || '',
      subCaste: item.subCaste || '',
      uid: item.uid || item.aadhaar || '',
      previousSchool: item.previousSchool || item.lastSchool || '',
      mobile: item.mobile || item.phone || '',
      address: item.address || '',
      academicProgress: item.academicProgress || item.progressConduct || 'Good',
      behaviour: item.behaviour || item.conduct || 'Good',
      leavingReason: item.leavingReason || '',
      certificateDate: item.certificateDate || '',
      headmasterSignature: item.headmasterSignature || 'Verified'
    };

    if (student.studentName && student.grNumber) {
      await studentService.addStudent(student);
      existingGrMap.add(gr);
      migrated++;
    } else {
      skipped++;
    }
  }

  return {
    migratedCount: migrated,
    skippedCount: skipped,
    message: `Migration completed: ${migrated} student records migrated into Firestore, ${skipped} skipped.`
  };
}
