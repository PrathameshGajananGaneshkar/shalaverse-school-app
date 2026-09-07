import { Student } from '../types';

const DB_NAME = 'ShalaverseDB';
const DB_VERSION = 1;
const STORE_NAME = 'students';

let dbInstance: IDBDatabase | null = null;

export async function getIndexedDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('grNumber', 'grNumber', { unique: false });
        store.createIndex('studentId', 'studentId', { unique: false });
      }
    };

    request.onsuccess = (e) => {
      dbInstance = (e.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (e) => {
      console.warn('IndexedDB open error:', e);
      reject((e.target as IDBOpenDBRequest).error);
    };
  });
}

export async function idbGetAllStudents(): Promise<Student[]> {
  try {
    const db = await getIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('idbGetAllStudents error:', err);
    return [];
  }
}

export async function idbSaveAllStudents(students: Student[]): Promise<void> {
  try {
    const db = await getIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      store.clear();

      for (let i = 0; i < students.length; i++) {
        store.put(students[i]);
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('IDB transaction aborted'));
    });
  } catch (err) {
    console.warn('idbSaveAllStudents error:', err);
  }
}

export async function idbClearStudents(): Promise<void> {
  try {
    const db = await getIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('IDB clear aborted'));
    });
  } catch (err) {
    console.warn('idbClearStudents error:', err);
  }
}

export async function idbDeleteStudent(id: string, grNumber?: string): Promise<void> {
  try {
    const db = await getIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      if (id) {
        store.delete(id);
      }
      
      if (grNumber && store.indexNames.contains('grNumber')) {
        const index = store.index('grNumber');
        const keyReq = index.getKey(grNumber);
        keyReq.onsuccess = () => {
          if (keyReq.result) {
            store.delete(keyReq.result);
          }
        };
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn('idbDeleteStudent error:', err);
  }
}
