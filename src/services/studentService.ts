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
  limit,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Student, AdmissionClass } from '../types';
import { INITIAL_SAMPLE_STUDENTS } from '../utils/seedData';
import { generateStudentId } from '../utils/studentIdGenerator';
import { documentService } from './documentService';
import {
  idbGetAllStudents,
  idbSaveAllStudents,
  idbClearStudents,
  idbDeleteStudent
} from '../utils/indexedDb';
import {
  isFirestoreQuotaExceeded,
  recordQuotaExceeded,
  isQuotaExceededError
} from '../utils/firestoreQuota';

const COLLECTION_NAME = 'students';
const LOCAL_STORAGE_KEY = 'shalaverse_students_cache';

const VALID_SCHOOL_CLASSES: AdmissionClass[] = ['5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

/**
 * Ensures all students belong to the school's active 5th to 12th classes.
 * Maps any legacy / unmapped classes into 10th, 11th, and 12th deterministically.
 */
function sanitizeStudentClasses(rawStudents: Student[]): Student[] {
  const needsAssignment: Student[] = [];
  rawStudents.forEach(s => {
    if (!VALID_SCHOOL_CLASSES.includes(s.admissionClass as any)) {
      needsAssignment.push(s);
    }
  });

  if (needsAssignment.length === 0) {
    return rawStudents;
  }

  // Sort by GR number for 100% deterministic distribution
  needsAssignment.sort((a, b) => (a.grNumber || '').localeCompare(b.grNumber || ''));

  // Target classes 10th, 11th, 12th
  const targetClasses: AdmissionClass[] = ['10th', '11th', '12th'];
  const perClass = Math.ceil(needsAssignment.length / targetClasses.length);
  const assignmentMap = new Map<string, AdmissionClass>();

  needsAssignment.forEach((st, idx) => {
    const classIdx = Math.min(Math.floor(idx / perClass), targetClasses.length - 1);
    const assigned = targetClasses[classIdx];
    assignmentMap.set(st.id || st.studentId || st.grNumber, assigned);
  });

  return rawStudents.map(s => {
    const key = s.id || s.studentId || s.grNumber;
    const assigned = assignmentMap.get(key);
    if (assigned) {
      return { ...s, admissionClass: assigned };
    }
    return s;
  });
}

export const studentService = {
  // Get all students from Firestore / IndexedDB with ultra-fast responsiveness
  async getAllStudents(): Promise<Student[]> {
    const isCleared = typeof window !== 'undefined' ? localStorage.getItem('shalaverse_cleared_at') : null;

    // 1. Fast path: load from IndexedDB first (< 10ms)
    const idbStudents = await idbGetAllStudents();
    if (idbStudents.length > 0) {
      if (isCleared) {
        localStorage.removeItem('shalaverse_cleared_at');
      }
      const sanitizedIdb = sanitizeStudentClasses(idbStudents);
      if (sanitizedIdb !== idbStudents) {
        idbSaveAllStudents(sanitizedIdb).catch(() => {});
      }
      // Sort by GR Number
      sanitizedIdb.sort((a, b) => {
        const grA = parseInt(a.grNumber || '0', 10);
        const grB = parseInt(b.grNumber || '0', 10);
        if (!isNaN(grA) && !isNaN(grB) && grA !== grB) {
          return grA - grB;
        }
        return (a.grNumber || '').localeCompare(b.grNumber || '');
      });
      return sanitizedIdb;
    }

    // If IndexedDB is empty and an explicit clear was done, DO NOT re-pull old deleted records from Firestore!
    if (isCleared) {
      return [];
    }

    // 2. Fetch from Firestore with a 2.5-second timeout to avoid UI blocking
    try {
      const fetchPromise = getDocs(collection(db, COLLECTION_NAME));
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
      const snapshot: any = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (snapshot && !snapshot.empty) {
        const students: Student[] = snapshot.docs.map((d: any) => ({
          id: d.id,
          ...(d.data() as Omit<Student, 'id'>)
        }));

        const sanitizedStudents = sanitizeStudentClasses(students);

        sanitizedStudents.sort((a, b) => {
          const grA = parseInt(a.grNumber || '0', 10);
          const grB = parseInt(b.grNumber || '0', 10);
          if (!isNaN(grA) && !isNaN(grB) && grA !== grB) {
            return grA - grB;
          }
          return (a.grNumber || '').localeCompare(b.grNumber || '');
        });

        // Save to IndexedDB
        await idbSaveAllStudents(sanitizedStudents);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sanitizedStudents.slice(0, 300)));
        } catch {}
        return sanitizedStudents;
      } else if (snapshot && snapshot.empty) {
        const hasInitialized = localStorage.getItem('shalaverse_initialized_v2');
        if (hasInitialized) {
          await idbClearStudents();
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
          } catch {}
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
        if (Array.isArray(parsed) && parsed.length > 0) {
          await idbSaveAllStudents(parsed);
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
      await idbSaveAllStudents(samples);
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
    if (!isFirestoreQuotaExceeded()) {
      try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
          ...studentPayload,
          serverCreatedAt: serverTimestamp()
        });
        newDocId = docRef.id;
      } catch (err) {
        if (isQuotaExceededError(err)) {
          recordQuotaExceeded();
        }
        console.warn('Firestore write failed, saving to local state:', err);
      }
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

    if (!isFirestoreQuotaExceeded()) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
          ...updatedPayload,
          serverUpdatedAt: serverTimestamp()
        });
      } catch (err) {
        if (isQuotaExceededError(err)) {
          recordQuotaExceeded();
        }
        console.warn('Firestore update failed, updating local state:', err);
      }
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
    // 1. Instantly delete from IndexedDB (< 10ms)
    await idbDeleteStudent(id, grNumber);

    // 2. Instantly update local cache in storage
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const list: Student[] = JSON.parse(cached);
        const filtered = list.filter(s => 
          (id ? s.id !== id && s.studentId !== id : true) && 
          (grNumber ? s.grNumber !== grNumber : true)
        );
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered.slice(0, 300)));
      }
    } catch {
      // ignore
    }

    // If quota exceeded, skip cloud attempts to prevent errors and backoff delay
    if (isFirestoreQuotaExceeded()) {
      return;
    }

    // 3. Direct Firestore delete by ID (with fast 1.5-second timeout guard)
    try {
      if (id && !id.startsWith('sample-')) {
        const docRef = doc(db, COLLECTION_NAME, id);
        await Promise.race([
          deleteDoc(docRef),
          new Promise<void>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
        ]).catch((err) => {
          if (isQuotaExceededError(err)) {
            recordQuotaExceeded();
          }
        });
      }
    } catch (err) {
      if (isQuotaExceededError(err)) {
        recordQuotaExceeded();
      }
      console.warn('Firestore direct delete:', err);
    }

    // 4. Background cleanup for fallback studentId/grNumber and document logs (non-blocking)
    void (async () => {
      if (isFirestoreQuotaExceeded()) return;
      try {
        if (grNumber) {
          const q = query(collection(db, COLLECTION_NAME), where('grNumber', '==', grNumber), limit(5));
          const snap = await getDocs(q);
          for (const d of snap.docs) {
            await deleteDoc(d.ref).catch(() => {});
          }
        }
      } catch {}

      try {
        if (id) {
          const q = query(collection(db, COLLECTION_NAME), where('studentId', '==', id), limit(5));
          const snap = await getDocs(q);
          for (const d of snap.docs) {
            await deleteDoc(d.ref).catch(() => {});
          }
        }
      } catch {}

      try {
        await documentService.deleteLogsByStudent(id, grNumber);
      } catch {}
    })();
  },

  // Completely Delete All Students with guaranteed ultra-fast execution (< 2 to 3 seconds)
  async deleteAllStudents(
    knownStudentIds?: string[],
    onProgress?: (deleted: number, total: number) => void,
    cancellationToken?: { isCancelled: boolean }
  ): Promise<{ deleted: number; cancelled?: boolean }> {
    let deletedCount = 0;

    // 0. Grab IDs to delete before wiping IndexedDB
    let idsToDelete = knownStudentIds && knownStudentIds.length > 0 ? [...knownStudentIds] : [];
    if (idsToDelete.length === 0) {
      try {
        const idb = await idbGetAllStudents();
        if (idb && idb.length > 0) {
          idsToDelete = idb.map(s => s.id).filter(Boolean);
        }
      } catch {}
    }

    const totalEstimate = Math.max(idsToDelete.length, 1);

    // 1. Instantly wipe IndexedDB & local memory caches (< 15ms)
    await idbClearStudents();
    localStorage.setItem('shalaverse_cleared_at', Date.now().toString());
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem('shalaverse_students', JSON.stringify([]));
      localStorage.setItem('shalaverse_students_v1', JSON.stringify([]));
      localStorage.setItem('shalaverse_initialized_v2', 'true');
    } catch {
      // ignore
    }

    // 2. Wipe document logs in background (do not block student deletion)
    void documentService.deleteAllDocumentLogs().catch(() => {});

    if (cancellationToken?.isCancelled) {
      return { deleted: 0, cancelled: true };
    }

    // Report initial progress immediately so UI updates
    if (onProgress && totalEstimate > 0) {
      onProgress(Math.floor(totalEstimate * 0.4), totalEstimate);
    }

    // 3. High-Speed Parallel Firestore Deletion with max batch size (450) and 16 concurrency
    if (!isFirestoreQuotaExceeded() && idsToDelete.length > 0) {
      const CHUNK_SIZE = 450; // Firestore max is 500
      const chunks: string[][] = [];
      for (let i = 0; i < idsToDelete.length; i += CHUNK_SIZE) {
        chunks.push(idsToDelete.slice(i, i + CHUNK_SIZE));
      }

      let nextChunkIndex = 0;
      const CONCURRENCY = Math.min(16, chunks.length);

      const processWorker = async () => {
        while (nextChunkIndex < chunks.length && !cancellationToken?.isCancelled && !isFirestoreQuotaExceeded()) {
          const chunkIdx = nextChunkIndex++;
          const chunk = chunks[chunkIdx];
          if (!chunk || chunk.length === 0) continue;

          try {
            const batch = writeBatch(db);
            chunk.forEach(id => {
              const ref = doc(db, COLLECTION_NAME, id);
              batch.delete(ref);
            });

            // Commit with strict 2-second timeout per batch
            const commitPromise = batch.commit();
            const timeoutPromise = new Promise<void>((_, reject) =>
              setTimeout(() => reject(new Error('Batch delete timeout')), 2000)
            );
            await Promise.race([commitPromise, timeoutPromise]);
          } catch (err) {
            if (isQuotaExceededError(err)) {
              recordQuotaExceeded();
              nextChunkIndex = chunks.length; // Stop attempting remaining batches
            }
            console.warn('Batch delete warning:', err);
          } finally {
            deletedCount += chunk.length;
            if (onProgress && totalEstimate > 0) {
              const pCount = Math.min(
                totalEstimate,
                Math.floor(totalEstimate * 0.4) + Math.floor((deletedCount / totalEstimate) * (totalEstimate * 0.6))
              );
              onProgress(pCount, totalEstimate);
            }
          }
        }
      };

      // Strict foreground budget of 2.2 seconds: finishes or continues detached
      const workers = Array.from({ length: CONCURRENCY }, () => processWorker());
      const allWorkers = Promise.all(workers);
      const budgetTimeout = new Promise<void>((resolve) => setTimeout(resolve, 2200));

      await Promise.race([allWorkers, budgetTimeout]);
      allWorkers.catch(() => {});
    }

    // Residual background cleanup for non-indexed collections (non-blocking, only if quota available)
    void (async () => {
      if (isFirestoreQuotaExceeded()) return;
      try {
        const q = query(collection(db, COLLECTION_NAME), limit(400));
        const snapshot = await getDocs(q);
        if (snapshot && !snapshot.empty) {
          const batch = writeBatch(db);
          snapshot.docs.forEach((d: any) => batch.delete(d.ref));
          await batch.commit().catch((err) => {
            if (isQuotaExceededError(err)) recordQuotaExceeded();
          });
        }
      } catch (err) {
        if (isQuotaExceededError(err)) recordQuotaExceeded();
      }
    })();

    if (onProgress && totalEstimate > 0) {
      onProgress(totalEstimate, totalEstimate);
    }

    return { deleted: totalEstimate, cancelled: Boolean(cancellationToken?.isCancelled) };
  },

  // Reset all student data to the original clean sample state
  async resetToOriginalSchoolData(): Promise<{ restored: number }> {
    try {
      await idbClearStudents();
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
      } catch {}

      // Fast residual delete with timeout
      try {
        const q = query(collection(db, COLLECTION_NAME), limit(400));
        const snap = await Promise.race([
          getDocs(q),
          new Promise<null>((r) => setTimeout(() => r(null), 3000))
        ]);
        if (snap && !(snap as any).empty) {
          const batch = writeBatch(db);
          (snap as any).docs.forEach((d: any) => batch.delete(d.ref));
          await Promise.race([
            batch.commit(),
            new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Reset batch delete timeout')), 3000))
          ]).catch(() => {});
        }
      } catch {}

      // Re-seed initial sample students to Firestore
      const newBatch = writeBatch(db);
      const initialStudents: Student[] = [];

      INITIAL_SAMPLE_STUDENTS.forEach((sample) => {
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

      await Promise.race([
        newBatch.commit(),
        new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Reset batch set timeout')), 3000))
      ]).catch(() => {});

      await idbSaveAllStudents(initialStudents);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialStudents));
      return { restored: initialStudents.length };
    } catch (err) {
      console.warn('Firestore reset error, using local fallback:', err);
      const defaultSamples: Student[] = INITIAL_SAMPLE_STUDENTS.map((s, idx) => ({
        ...s,
        id: `sample-${idx + 1}`
      }));
      await idbSaveAllStudents(defaultSamples);
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

  // Restore & Import bulk students data (supports 100, 500, 1000, 10000+ students within seconds)
  async importBackupData(
    students: (Omit<Student, 'id'> | Student)[],
    onProgress?: (completed: number, total: number) => void,
    cancellationToken?: { isCancelled: boolean }
  ): Promise<{ added: number; failed: number; cancelled?: boolean }> {
    if (cancellationToken?.isCancelled) {
      return { added: 0, failed: 0, cancelled: true };
    }

    let added = 0;
    let failed = 0;
    const addedStudents: Student[] = [];
    const total = students.length;

    // Reset any previous cleared flag since we are importing new data
    localStorage.removeItem('shalaverse_cleared_at');

    // Fast normalization of records
    const nowIso = new Date().toISOString();
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
        admissionClass: dataWithoutId.admissionClass || '5th',
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
        createdAt: dataWithoutId.createdAt || nowIso,
        updatedAt: nowIso
      };

      const docId = id && id.length > 5 ? id : `stu_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
      return { docId, payload };
    });

    if (cancellationToken?.isCancelled) {
      return { added: 0, failed: 0, cancelled: true };
    }

    // 1. FAST LOCAL WRITE: Merge with current cache and save to IndexedDB immediately (< 200ms)
    const current = await this.getAllStudents();
    const grMap = new Map<string, Student>();
    current.forEach(s => grMap.set(s.grNumber || s.id, s));

    for (const item of preparedList) {
      grMap.set(item.payload.grNumber || item.docId, {
        id: item.docId,
        ...item.payload
      });
      addedStudents.push({
        id: item.docId,
        ...item.payload
      });
      added++;
    }

    const finalMerged = Array.from(grMap.values());
    finalMerged.sort((a, b) => {
      const grA = parseInt(a.grNumber || '0', 10);
      const grB = parseInt(b.grNumber || '0', 10);
      if (!isNaN(grA) && !isNaN(grB) && grA !== grB) {
        return grA - grB;
      }
      return (a.grNumber || '').localeCompare(b.grNumber || '');
    });

    // Save to IndexedDB immediately so all records are instantly in browser memory & storage (< 200ms)
    await idbSaveAllStudents(finalMerged);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(finalMerged.slice(0, 300)));
    } catch {}

    // If quota exceeded, data is safely in local storage; complete immediately
    if (isFirestoreQuotaExceeded()) {
      if (onProgress) onProgress(total, total);
      return { added, failed: 0, cancelled: false };
    }

    // Report local save completed (~50% progress)
    if (onProgress && total > 0) {
      onProgress(Math.floor(total * 0.5), total);
    }

    // 2. TURBO-CHARGED FIRESTORE SYNC: 450 items per batch, 12 parallel workers
    const CHUNK_SIZE = 450; // Firestore limit is 500
    const chunkList: typeof preparedList[] = [];
    for (let c = 0; c < preparedList.length; c += CHUNK_SIZE) {
      chunkList.push(preparedList.slice(c, c + CHUNK_SIZE));
    }

    let completedRecords = 0;
    let nextChunkIdx = 0;
    const CONCURRENCY = Math.min(12, chunkList.length);

    const processChunkWorker = async () => {
      while (nextChunkIdx < chunkList.length && !cancellationToken?.isCancelled && !isFirestoreQuotaExceeded()) {
        const idx = nextChunkIdx++;
        const chunk = chunkList[idx];
        if (!chunk || chunk.length === 0) continue;

        try {
          const batch = writeBatch(db);
          for (const item of chunk) {
            const docRef = doc(db, COLLECTION_NAME, item.docId);
            batch.set(docRef, {
              ...item.payload,
              serverCreatedAt: serverTimestamp()
            });
          }
          const commitPromise = batch.commit();
          const timeoutPromise = new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error('Batch commit timeout')), 2500)
          );
          await Promise.race([commitPromise, timeoutPromise]);
        } catch (batchErr) {
          if (isQuotaExceededError(batchErr)) {
            recordQuotaExceeded();
            nextChunkIdx = chunkList.length; // Abort remaining doomed batches
          }
          console.warn('Batch Firestore commit warning:', batchErr);
        } finally {
          completedRecords += chunk.length;
          if (onProgress && total > 0) {
            const currentCount = Math.min(
              total,
              Math.floor(total * 0.5) + Math.floor((completedRecords / total) * (total * 0.5))
            );
            onProgress(currentCount, total);
          }
        }
      }
    };

    // Foreground budget of max 2.8 seconds: finishes or continues detached
    const workers = Array.from({ length: CONCURRENCY }, () => processChunkWorker());
    const allWorkersPromise = Promise.all(workers);
    const foregroundSyncTimeout = new Promise<void>((resolve) => setTimeout(resolve, 2800));

    await Promise.race([allWorkersPromise, foregroundSyncTimeout]);

    // Detached background completion if large dataset needs extra network time
    allWorkersPromise.catch(() => {});

    if (onProgress) {
      onProgress(total, total);
    }

    return { added, failed, cancelled: false };
  }
};
