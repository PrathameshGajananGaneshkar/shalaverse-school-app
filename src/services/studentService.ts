import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Student } from '../types';
import { INITIAL_SAMPLE_STUDENTS } from '../utils/seedData';
import { generateStudentId } from '../utils/studentIdGenerator';
import { documentService } from './documentService';

const COLLECTION_NAME = 'students';
const LOCAL_STORAGE_KEY = 'shalaverse_students_cache';

export const studentService = {
  // Get all students from Firestore, with graceful fallback to local cache
  async getAllStudents(): Promise<Student[]> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      
      if (!snapshot.empty) {
        const students: Student[] = snapshot.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<Student, 'id'>)
        }));

        // Sort by GR Number in memory reliably (handles numbers & alphanumeric)
        students.sort((a, b) => {
          const grA = parseInt(a.grNumber || '0', 10);
          const grB = parseInt(b.grNumber || '0', 10);
          if (!isNaN(grA) && !isNaN(grB) && grA !== grB) {
            return grA - grB;
          }
          return (a.grNumber || '').localeCompare(b.grNumber || '');
        });

        // Cache locally
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(students));
        return students;
      } else {
        // If Firestore is reached and explicitly EMPTY (e.g. after Delete All)
        const hasInitialized = localStorage.getItem('shalaverse_initialized_v2');
        if (hasInitialized) {
          // System was already used / cleared, so empty means empty!
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
          return [];
        }
      }
    } catch (err) {
      console.warn('Firestore fetch failed, checking local cache:', err);
    }

    // Fallback: Check local storage
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached !== null) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // ignore parse error
      }
    }

    // Only for the very first fresh initial open if nothing was ever initialized
    const hasInitialized = localStorage.getItem('shalaverse_initialized_v2');
    if (!hasInitialized) {
      localStorage.setItem('shalaverse_initialized_v2', 'true');
      const samples = INITIAL_SAMPLE_STUDENTS.map((s, idx) => ({
        ...s,
        id: `sample-${idx + 1}`
      }));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(samples));
      return samples;
    }

    return [];
  },

  // Get student by Firestore ID or studentId
  async getStudentById(id: string): Promise<Student | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return {
          id: snapshot.id,
          ...(snapshot.data() as Omit<Student, 'id'>)
        };
      }
    } catch (err) {
      console.warn('Could not fetch student by ID from Firestore:', err);
    }

    // Fallback search in local cache
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      try {
        const list: Student[] = JSON.parse(cached);
        const found = list.find(s => s.id === id || s.studentId === id || s.grNumber === id);
        if (found) return found;
      } catch {
        // ignore
      }
    }

    return null;
  },

  // Add new student
  async addStudent(studentData: Omit<Student, 'id'>): Promise<string> {
    const finalStudentId = (studentData.studentId && studentData.studentId.trim()) 
      ? studentData.studentId.trim() 
      : generateStudentId(studentData.grNumber, studentData.admissionYear);

    const studentPayload = {
      ...studentData,
      studentId: finalStudentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let newDocId = `stu_${Date.now()}`;
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...studentPayload,
        serverCreatedAt: serverTimestamp()
      });
      newDocId = docRef.id;
    } catch (err) {
      console.warn('Firestore write failed, saving to local state:', err);
    }

    // Update local cache
    const current = await this.getAllStudents();
    const newStudent: Student = {
      ...studentPayload,
      id: newDocId
    };
    const updated = [newStudent, ...current.filter(s => s.id !== newDocId && s.grNumber !== studentPayload.grNumber)];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    return newDocId;
  },

  // Update student
  async updateStudent(id: string, updates: Partial<Student>): Promise<void> {
    const updatedPayload = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...updatedPayload,
        serverUpdatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('Firestore update failed, updating local state:', err);
    }

    // Update local cache
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      try {
        const list: Student[] = JSON.parse(cached);
        const index = list.findIndex(s => s.id === id || s.studentId === updates.studentId || (updates.grNumber && s.grNumber === updates.grNumber));
        if (index !== -1) {
          list[index] = { ...list[index], ...updatedPayload };
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
        }
      } catch {
        // ignore
      }
    }
  },

  // Delete student
  async deleteStudent(id: string, grNumber?: string): Promise<void> {
    try {
      if (id && !id.startsWith('sample-') && !id.startsWith('stu_')) {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
      }
    } catch (err) {
      console.warn('Firestore delete by direct ID failed, trying fallback search:', err);
    }

    // Try finding and deleting by grNumber or studentId in Firestore
    try {
      if (grNumber) {
        const q = query(collection(db, COLLECTION_NAME), where('grNumber', '==', grNumber));
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          try {
            await deleteDoc(d.ref);
          } catch {
            // ignore
          }
        }
      }
    } catch (err) {
      console.warn('Firestore delete by grNumber fallback:', err);
    }

    try {
      if (id) {
        const q = query(collection(db, COLLECTION_NAME), where('studentId', '==', id));
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          try {
            await deleteDoc(d.ref);
          } catch {
            // ignore
          }
        }
      }
    } catch (err) {
      console.warn('Firestore delete by studentId fallback:', err);
    }

    // Delete associated document logs for this student
    try {
      await documentService.deleteLogsByStudent(id, grNumber);
    } catch {
      // ignore
    }

    // Update local cache
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      try {
        const list: Student[] = JSON.parse(cached);
        const updated = list.filter(s => 
          s.id !== id && 
          s.studentId !== id && 
          (grNumber ? s.grNumber !== grNumber : true)
        );
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

        // If no students left, also clear all document logs
        if (updated.length === 0) {
          await documentService.deleteAllDocumentLogs();
        }
      } catch {
        // ignore
      }
    }
  },

  // Completely Delete All Students (1-click wipe)
  async deleteAllStudents(): Promise<{ deleted: number }> {
    let deletedCount = 0;
    try {
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      const docs = snapshot.docs;
      deletedCount = docs.length;
      
      // Batch delete in chunks of 400
      const CHUNK_SIZE = 400;
      for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + CHUNK_SIZE);
        chunk.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (err) {
      console.warn('Firestore deleteAll error, wiping local cache:', err);
    }

    // Completely wipe all document logs as well
    try {
      await documentService.deleteAllDocumentLogs();
    } catch (err) {
      console.warn('Error wiping document logs on deleteAllStudents:', err);
    }

    // Clear all local student caches and lock initialized flag so sample records never re-appear
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem('shalaverse_students', JSON.stringify([]));
      localStorage.setItem('shalaverse_students_v1', JSON.stringify([]));
      localStorage.setItem('shalaverse_initialized_v2', 'true');
    } catch {
      // ignore
    }

    return { deleted: deletedCount };
  },

  // Reset all student data to the original clean sample state
  async resetToOriginalSchoolData(): Promise<{ restored: number }> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      
      // Batch delete in chunks of 400
      const docs = snapshot.docs;
      const CHUNK_SIZE = 400;
      for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + CHUNK_SIZE);
        chunk.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }

      // Re-seed initial sample students to Firestore
      const newBatch = writeBatch(db);
      const initialStudents: Student[] = [];

      INITIAL_SAMPLE_STUDENTS.forEach((sample, idx) => {
        const docRef = doc(collection(db, COLLECTION_NAME));
        const studentObj: Student = {
          ...sample,
          id: docRef.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        newBatch.set(docRef, {
          ...studentObj,
          serverCreatedAt: serverTimestamp()
        });
        initialStudents.push(studentObj);
      });

      await newBatch.commit();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialStudents));
      return { restored: initialStudents.length };
    } catch (err) {
      console.warn('Firestore reset error, using local fallback:', err);
      const defaultSamples: Student[] = INITIAL_SAMPLE_STUDENTS.map((s, idx) => ({
        ...s,
        id: `sample-${idx + 1}`
      }));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultSamples));
      return { restored: defaultSamples.length };
    }
  },

  // Clear all sample / demo students
  async clearSampleStudents(): Promise<{ deleted: number }> {
    let deleted = 0;
    const current = await this.getAllStudents();
    const sampleIds = current
      .filter(s => s.id.startsWith('sample-') || s.id.startsWith('local-sample-') || s.studentId.startsWith('STU-2026-00') || s.studentId.startsWith('STU-2025-0') || s.studentId.startsWith('STU-2024-0'))
      .map(s => s.id);

    for (const sid of sampleIds) {
      try {
        await this.deleteStudent(sid);
        deleted++;
      } catch {
        // ignore
      }
    }

    const remaining = (await this.getAllStudents()).filter(s => !sampleIds.includes(s.id));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remaining));
    return { deleted };
  },

  // Seed sample data into Firestore if empty
  async seedInitialData(): Promise<void> {
    try {
      for (const sample of INITIAL_SAMPLE_STUDENTS) {
        await addDoc(collection(db, COLLECTION_NAME), {
          ...sample,
          serverCreatedAt: serverTimestamp()
        });
      }
      // Refresh local cache
      const refreshed = await this.getAllStudents();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(refreshed));
    } catch (err) {
      console.error('Seed initial data error:', err);
    }
  },

  // Restore & Import bulk students data (supports 100, 500, 1000, 10000+ students)
  async importBackupData(
    students: (Omit<Student, 'id'> | Student)[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ added: number; failed: number }> {
    let added = 0;
    let failed = 0;
    const addedStudents: Student[] = [];
    const total = students.length;

    // Normalize payloads
    const preparedList = students.map((student, idx) => {
      const { id, ...dataWithoutId } = student as any;
      const grNumber = String(dataWithoutId.grNumber || '').trim() || `${1000 + idx + 1}`;
      const studentName = String(dataWithoutId.studentName || '').trim() || `विद्यार्थी ${idx + 1}`;
      
      const payload: Omit<Student, 'id'> = {
        grNumber,
        studentId: dataWithoutId.studentId || `20252704020${(100 + idx + 1).toString().padStart(4, '0')}`,
        studentName,
        fatherName: dataWithoutId.fatherName || '',
        motherName: dataWithoutId.motherName || '',
        admissionClass: dataWithoutId.admissionClass || '1st',
        admissionYear: dataWithoutId.admissionYear || '2025-2026',
        admissionDate: dataWithoutId.admissionDate || '2025-06-16',
        birthDate: dataWithoutId.birthDate || '2015-05-10',
        birthPlace: dataWithoutId.birthPlace || '',
        nationality: dataWithoutId.nationality || 'Indian (भारतीय)',
        motherTongue: dataWithoutId.motherTongue || 'मराठी',
        religion: dataWithoutId.religion || 'Hindu (हिंदू)',
        caste: dataWithoutId.caste || '',
        subCaste: dataWithoutId.subCaste || '',
        uid: dataWithoutId.uid || '',
        mobile: dataWithoutId.mobile || '',
        address: dataWithoutId.address || '',
        previousSchool: dataWithoutId.previousSchool || '',
        academicProgress: dataWithoutId.academicProgress || 'Good',
        behaviour: dataWithoutId.behaviour || 'Good',
        leavingReason: dataWithoutId.leavingReason || '',
        certificateDate: dataWithoutId.certificateDate || '',
        createdAt: dataWithoutId.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docId = id && id.length > 5 ? id : `stu_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
      return { docId, payload };
    });

    // Chunk size: 350 items per batch to stay safely within Firestore 500 ops limit
    const CHUNK_SIZE = 350;
    const totalChunks = Math.ceil(preparedList.length / CHUNK_SIZE);

    for (let c = 0; c < totalChunks; c++) {
      const chunk = preparedList.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE);
      
      try {
        const batch = writeBatch(db);
        for (const item of chunk) {
          const docRef = doc(db, COLLECTION_NAME, item.docId);
          batch.set(docRef, {
            ...item.payload,
            serverCreatedAt: serverTimestamp()
          });
        }
        await batch.commit();

        for (const item of chunk) {
          addedStudents.push({
            id: item.docId,
            ...item.payload
          });
          added++;
        }
      } catch (batchErr) {
        console.warn(`Batch ${c + 1} Firestore commit fallback, writing to local state:`, batchErr);
        // Fallback to local memory saving for this chunk
        for (const item of chunk) {
          addedStudents.push({
            id: item.docId,
            ...item.payload
          });
          added++;
        }
      }

      if (onProgress) {
        onProgress(added, total);
      }
    }

    // Merge with current cache and save immediately
    const current = await this.getAllStudents();
    const grMap = new Map<string, Student>();
    
    // Add existing
    current.forEach(s => grMap.set(s.grNumber || s.id, s));
    // Overwrite / Add newly imported
    addedStudents.forEach(s => grMap.set(s.grNumber || s.id, s));

    const finalMerged = Array.from(grMap.values());
    // Sort merged list by GR number
    finalMerged.sort((a, b) => {
      const grA = parseInt(a.grNumber || '0', 10);
      const grB = parseInt(b.grNumber || '0', 10);
      if (!isNaN(grA) && !isNaN(grB) && grA !== grB) {
        return grA - grB;
      }
      return (a.grNumber || '').localeCompare(b.grNumber || '');
    });

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(finalMerged));

    return { added, failed };
  }
};
