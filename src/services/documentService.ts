import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  orderBy, 
  serverTimestamp,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { DocumentLog } from '../types';

const COLLECTION_NAME = 'documents_log';
const LOCAL_LOG_KEY = 'shalaverse_document_logs';

export const documentService = {
  async logDocumentIssue(log: Omit<DocumentLog, 'id'>): Promise<void> {
    try {
      await addDoc(collection(db, COLLECTION_NAME), {
        ...log,
        serverCreatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('Could not log document to Firestore, saving locally:', err);
    }

    // Save locally as fallback
    const current = await this.getDocumentLogs();
    const newLog: DocumentLog = {
      ...log,
      id: `doc_${Date.now()}`
    };
    localStorage.setItem(LOCAL_LOG_KEY, JSON.stringify([newLog, ...current]));
  },

  async getDocumentLogs(): Promise<DocumentLog[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('issuedDate', 'desc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const logs = snapshot.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<DocumentLog, 'id'>)
        }));
        localStorage.setItem(LOCAL_LOG_KEY, JSON.stringify(logs));
        return logs;
      } else {
        // If Firestore is empty, sync local cache to empty
        localStorage.setItem(LOCAL_LOG_KEY, JSON.stringify([]));
        return [];
      }
    } catch (err) {
      console.warn('Firestore doc log fetch failed:', err);
    }

    const local = localStorage.getItem(LOCAL_LOG_KEY);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // ignore
      }
    }
    return [];
  },

  // Completely wipe all document logs (when all students are deleted or full reset)
  async deleteAllDocumentLogs(): Promise<{ deleted: number }> {
    let deleted = 0;
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
      console.warn('Firestore deleteAllDocumentLogs error, wiping local cache:', err);
    }

    try {
      localStorage.setItem(LOCAL_LOG_KEY, JSON.stringify([]));
    } catch {
      // ignore
    }

    return { deleted };
  },

  // Delete logs for a specific student
  async deleteLogsByStudent(studentId: string, grNumber?: string): Promise<void> {
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
      console.warn('Firestore deleteLogsByStudent error:', err);
    }

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
  }
};
