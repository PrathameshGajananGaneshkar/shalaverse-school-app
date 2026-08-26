import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
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
        return snapshot.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<DocumentLog, 'id'>)
        }));
      }
    } catch (err) {
      console.warn('Firestore doc log fetch failed:', err);
    }

    const local = localStorage.getItem(LOCAL_LOG_KEY);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        // ignore
      }
    }
    return [
      {
        id: 'doc_init_1',
        documentType: 'TC',
        studentId: 'STU-2025-025',
        studentName: 'Khan Ayesha Mohammed',
        grNumber: '3995',
        studentClass: '10th',
        issuedDate: '2026-04-10',
        academicYear: '2025-2026',
        issuedBy: 'Principal Office',
        purpose: 'Parent Transfer'
      }
    ];
  }
};
