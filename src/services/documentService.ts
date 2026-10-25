import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  orderBy, 
  serverTimestamp,
  writeBatch,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { DocumentLog } from '../types';
import { 
  isFirestoreQuotaExceeded, 
  recordQuotaExceeded, 
  isQuotaExceededError 
} from '../utils/firestoreQuota';

const COLLECTION_NAME = 'documents_log';
const LOCAL_LOG_KEY = 'shalaverse_document_logs';

export const INITIAL_SAMPLE_DOC_LOGS: DocumentLog[] = [];

const DEMO_GR_SET = new Set(['4120', '4121', '4122', '3980', '3995', '3810']);
const DEMO_STU_IDS = new Set(['STU-2026-001', 'STU-2026-002', 'STU-2026-003', 'STU-2025-014', 'STU-2025-025', 'STU-2024-008']);

function isDemoDocLog(log: DocumentLog): boolean {
  if (!log) return false;
  if (log.id && log.id.startsWith('doc_sample_')) return true;
  if (log.grNumber && DEMO_GR_SET.has(String(log.grNumber).trim())) return true;
  if (log.studentId && DEMO_STU_IDS.has(String(log.studentId).trim())) return true;
  return false;
}

interface DocLogsCacheEntry {
  schoolId: string;
  timestamp: number;
  logs: DocumentLog[];
}
let memoryDocLogsCache: DocLogsCacheEntry | null = null;

export function invalidateDocLogsMemoryCache() {
  memoryDocLogsCache = null;
}

export const documentService = {
  // Synchronous doc logs lookup for 0ms instant rendering
  getSynchronousDocumentLogs(schoolIdFilter?: string): DocumentLog[] {
    const effectiveSchoolId = schoolIdFilter !== undefined
      ? schoolIdFilter
      : ((typeof window !== 'undefined' ? localStorage.getItem('shalaverse_active_school_id') : null) || 'school_27070200119');

    const filterBySchool = (list: DocumentLog[]) => {
      if (effectiveSchoolId === 'ALL') return list;
      return list.filter(l => l.schoolId === effectiveSchoolId || (!l.schoolId && effectiveSchoolId === 'school_27070200119'));
    };

    if (memoryDocLogsCache && (effectiveSchoolId === 'ALL' || memoryDocLogsCache.schoolId === effectiveSchoolId)) {
      return memoryDocLogsCache.logs;
    }

    try {
      const local = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_LOG_KEY) : null;
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(l => !isDemoDocLog(l));
          return filterBySchool(cleaned);
        }
      }
    } catch {}

    return [];
  },

  async logDocumentIssue(log: Omit<DocumentLog, 'id'>): Promise<void> {
    const activeSchoolId = log.schoolId || (typeof window !== 'undefined' ? localStorage.getItem('shalaverse_active_school_id') : null) || 'school_27070200119';
    const logWithSchool = {
      ...log,
      schoolId: activeSchoolId
    };

    if (!isFirestoreQuotaExceeded()) {
      try {
        await addDoc(collection(db, COLLECTION_NAME), {
          ...logWithSchool,
          serverCreatedAt: serverTimestamp()
        });
      } catch (err) {
        if (isQuotaExceededError(err)) {
          recordQuotaExceeded();
        }
        console.warn('Could not log document to Firestore, saving locally:', err);
      }
    }

    // Save locally as fallback & update memory cache
    const current = await this.getDocumentLogs('ALL');
    const newLog: DocumentLog = {
      ...logWithSchool,
      id: `doc_${Date.now()}`
    };
    const updated = [newLog, ...current];
    localStorage.setItem(LOCAL_LOG_KEY, JSON.stringify(updated));
    memoryDocLogsCache = {
      schoolId: activeSchoolId,
      timestamp: Date.now(),
      logs: updated.filter(l => l.schoolId === activeSchoolId || (!l.schoolId && activeSchoolId === 'school_27070200119'))
    };
  },

  async getDocumentLogs(schoolIdFilter?: string): Promise<DocumentLog[]> {
    const effectiveSchoolId = schoolIdFilter !== undefined
      ? schoolIdFilter
      : ((typeof window !== 'undefined' ? localStorage.getItem('shalaverse_active_school_id') : null) || 'school_27070200119');

    const filterBySchool = (list: DocumentLog[]) => {
      if (effectiveSchoolId === 'ALL') return list;
      return list.filter(l => l.schoolId === effectiveSchoolId || (!l.schoolId && effectiveSchoolId === 'school_27070200119'));
    };

    // 0. Super-fast in-memory path (< 0.1ms)
    if (
      memoryDocLogsCache &&
      memoryDocLogsCache.schoolId === effectiveSchoolId &&
      (Date.now() - memoryDocLogsCache.timestamp < 120000)
    ) {
      return memoryDocLogsCache.logs;
    }

    // 1. Check local storage first for 0ms instant display
    const local = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_LOG_KEY) : null;
    let localCleanLogs: DocumentLog[] = [];
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localCleanLogs = parsed.filter(l => !isDemoDocLog(l));
        }
      } catch {}
    }

    if (!isFirestoreQuotaExceeded()) {
      try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('issuedDate', 'desc'));
        const fetchPromise = getDocs(q);
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
        const snapshot: any = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (snapshot && !snapshot.empty) {
          const logs = snapshot.docs
            .map((d: any) => ({
              id: d.id,
              ...(d.data() as Omit<DocumentLog, 'id'>)
            }))
            .filter((l: DocumentLog) => !isDemoDocLog(l));
          localStorage.setItem(LOCAL_LOG_KEY, JSON.stringify(logs));
          const result = filterBySchool(logs);
          memoryDocLogsCache = {
            schoolId: effectiveSchoolId,
            timestamp: Date.now(),
            logs: result
          };
          return result;
        }
      } catch (err) {
        if (isQuotaExceededError(err)) {
          recordQuotaExceeded();
        }
        console.warn('Firestore doc log fetch failed:', err);
      }
    }

    if (localCleanLogs.length > 0) {
      const res = filterBySchool(localCleanLogs);
      memoryDocLogsCache = {
        schoolId: effectiveSchoolId,
        timestamp: Date.now(),
        logs: res
      };
      return res;
    }

    return [];
  },

  // Restore document logs from backup
  async restoreDocumentLogs(logs: DocumentLog[]): Promise<number> {
    if (!logs || !Array.isArray(logs) || logs.length === 0) return 0;
    
    // 1. Save locally
    const current = await this.getDocumentLogs();
    const existingIds = new Set(current.map(c => c.id || `${c.grNumber}_${c.documentType}_${c.issuedDate}`));
    const newLogs: DocumentLog[] = [];
    
    for (const log of logs) {
      if (isDemoDocLog(log)) continue;
      const key = log.id || `${log.grNumber}_${log.documentType}_${log.issuedDate}`;
      if (!existingIds.has(key)) {
        newLogs.push(log);
        existingIds.add(key);
      }
    }
    
    const combined = [...newLogs, ...current];
    try {
      localStorage.setItem(LOCAL_LOG_KEY, JSON.stringify(combined));
    } catch {}

    // 2. Sync to Firestore if quota permits
    if (!isFirestoreQuotaExceeded() && newLogs.length > 0) {
      try {
        const CHUNK_SIZE = 400;
        for (let i = 0; i < newLogs.length; i += CHUNK_SIZE) {
          const chunk = newLogs.slice(i, i + CHUNK_SIZE);
          const batch = writeBatch(db);
          for (const item of chunk) {
            const { id, ...payload } = item;
            const docRef = id && id.length > 5 ? doc(db, COLLECTION_NAME, id) : doc(collection(db, COLLECTION_NAME));
            batch.set(docRef, {
              ...payload,
              serverCreatedAt: serverTimestamp()
            });
          }
          await batch.commit();
        }
      } catch (err) {
        console.warn('Document logs restore to Firestore warning:', err);
      }
    }
    return newLogs.length;
  },

  // Completely wipe all document logs (when all students are deleted or full reset)
  async deleteAllDocumentLogs(): Promise<{ deleted: number }> {
    let deleted = 0;
    try {
      localStorage.setItem(LOCAL_LOG_KEY, JSON.stringify([]));
    } catch {
      // ignore
    }

    if (!isFirestoreQuotaExceeded()) {
      try {
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        const docs = snapshot.docs;
        deleted = docs.length;

        const CHUNK_SIZE = 400;
        for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
          const batch = writeBatch(db);
          const chunk = docs.slice(i, i + CHUNK_SIZE);
          chunk.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
      } catch (err) {
        if (isQuotaExceededError(err)) {
          recordQuotaExceeded();
        }
        console.warn('Firestore deleteAllDocumentLogs error, wiping local cache:', err);
      }
    }

    return { deleted };
  },

  // Delete logs for a specific student
  async deleteLogsByStudent(studentId: string, grNumber?: string): Promise<void> {
    try {
      const local = localStorage.getItem(LOCAL_LOG_KEY);
      if (local) {
        const list: DocumentLog[] = JSON.parse(local);
        const updated = list.filter(l => 
          l.studentId !== studentId && (grNumber ? l.grNumber !== grNumber : true)
        );
        localStorage.setItem(LOCAL_LOG_KEY, JSON.stringify(updated));
      }
    } catch {
      // ignore
    }

    if (isFirestoreQuotaExceeded()) {
      return;
    }

    try {
      if (studentId) {
        const q1 = query(collection(db, COLLECTION_NAME), where('studentId', '==', studentId));
        const snap1 = await getDocs(q1);
        for (const d of snap1.docs) {
          try {
            await deleteDoc(d.ref);
          } catch {
            // ignore
          }
        }
      }

      if (grNumber) {
        const q2 = query(collection(db, COLLECTION_NAME), where('grNumber', '==', grNumber));
        const snap2 = await getDocs(q2);
        for (const d of snap2.docs) {
          try {
            await deleteDoc(d.ref);
          } catch {
            // ignore
          }
        }
      }
    } catch (err) {
      if (isQuotaExceededError(err)) {
        recordQuotaExceeded();
      }
      console.warn('Firestore deleteLogsByStudent error:', err);
    }
  }
};
