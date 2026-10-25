import { Student, School } from '../types';

const DB_NAME = 'ShalaverseDB';
const DB_VERSION = 2;
const STUDENTS_STORE = 'students';
const SCHOOLS_STORE = 'schools';

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

      // 1. Students store
      let studentStore: IDBObjectStore;
      if (!db.objectStoreNames.contains(STUDENTS_STORE)) {
        studentStore = db.createObjectStore(STUDENTS_STORE, { keyPath: 'id' });
        studentStore.createIndex('grNumber', 'grNumber', { unique: false });
        studentStore.createIndex('studentId', 'studentId', { unique: false });
        studentStore.createIndex('schoolId', 'schoolId', { unique: false });
      } else {
        const transaction = (e.target as IDBOpenDBRequest).transaction;
        if (transaction) {
          studentStore = transaction.objectStore(STUDENTS_STORE);
          if (!studentStore.indexNames.contains('schoolId')) {
            studentStore.createIndex('schoolId', 'schoolId', { unique: false });
          }
        }
      }

      // 2. Schools store (for ultra-fast caching of 1000+ schools)
      if (!db.objectStoreNames.contains(SCHOOLS_STORE)) {
        const schoolStore = db.createObjectStore(SCHOOLS_STORE, { keyPath: 'id' });
        schoolStore.createIndex('udiseNumber', 'udiseNumber', { unique: false });
        schoolStore.createIndex('email', 'email', { unique: false });
        schoolStore.createIndex('status', 'status', { unique: false });
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

// ==========================================
// SCHOOLS INDEXEDDB OPERATIONS
// ==========================================

export async function idbGetAllSchools(): Promise<School[]> {
  try {
    const db = await getIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SCHOOLS_STORE], 'readonly');
      const store = transaction.objectStore(SCHOOLS_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('idbGetAllSchools error:', err);
    return [];
  }
}

export async function idbSaveAllSchools(schools: School[]): Promise<void> {
  if (!schools || schools.length === 0) return;
  try {
    const db = await getIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SCHOOLS_STORE], 'readwrite');
      const store = transaction.objectStore(SCHOOLS_STORE);

      for (const s of schools) {
        if (s && s.id) {
          store.put(s);
        }
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('idbSaveAllSchools aborted'));
    });
  } catch (err) {
    console.warn('idbSaveAllSchools error:', err);
  }
}

export async function idbPutSchool(school: School): Promise<void> {
  if (!school || !school.id) return;
  try {
    const db = await getIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SCHOOLS_STORE], 'readwrite');
      const store = transaction.objectStore(SCHOOLS_STORE);
      store.put(school);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn('idbPutSchool error:', err);
  }
}

export async function idbDeleteSchool(id: string): Promise<void> {
  if (!id) return;
  try {
    const db = await getIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SCHOOLS_STORE], 'readwrite');
      const store = transaction.objectStore(SCHOOLS_STORE);
      store.delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn('idbDeleteSchool error:', err);
  }
}

// ==========================================
// STUDENTS INDEXEDDB OPERATIONS
// ==========================================

export async function idbGetAllStudents(): Promise<Student[]> {
  try {
    const db = await getIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STUDENTS_STORE], 'readonly');
      const store = transaction.objectStore(STUDENTS_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('idbGetAllStudents error:', err);
    return [];
  }
}

export async function idbGetStudentsBySchool(schoolId: string): Promise<Student[]> {
  if (!schoolId) return [];
  try {
    const db = await getIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STUDENTS_STORE], 'readonly');
      const store = transaction.objectStore(STUDENTS_STORE);

      const request = store.getAll();
      request.onsuccess = () => {
        const all = (request.result || []) as Student[];
        const isDefaultSchool = schoolId === 'school_27070200119' || schoolId === 'school_27040200119';
        const filtered = all.filter(s => {
          if (s.schoolId === schoolId) return true;
          if (isDefaultSchool) {
            return !s.schoolId || s.schoolId === 'school_27070200119' || s.schoolId === 'school_27040200119';
          }
          return false;
        });
        resolve(filtered);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('idbGetStudentsBySchool error:', err);
    return [];
  }
}

export async function idbSaveAllStudents(students: Student[], schoolIdScope?: string): Promise<void> {
  if (!students || students.length === 0) return;
  try {
    const db = await getIndexedDB();
    const BATCH_SIZE = 5000;
    for (let offset = 0; offset < students.length; offset += BATCH_SIZE) {
      const slice = students.slice(offset, offset + BATCH_SIZE);
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STUDENTS_STORE], 'readwrite');
        const store = transaction.objectStore(STUDENTS_STORE);

        for (let i = 0; i < slice.length; i++) {
          const st = slice[i];
          if (st && (st.id || st.studentId)) {
            store.put(st);
          }
        }

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(new Error('IDB transaction aborted'));
      });
    }
  } catch (err) {
    console.warn('idbSaveAllStudents error:', err);
  }
}

export async function idbSaveBulkStudents(students: Student[]): Promise<void> {
  return idbSaveAllStudents(students);
}

export async function idbClearStudents(schoolId?: string): Promise<void> {
  try {
    const db = await getIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STUDENTS_STORE], 'readwrite');
      const store = transaction.objectStore(STUDENTS_STORE);

      if (!schoolId || schoolId === 'ALL') {
        store.clear();
      } else {
        if (store.indexNames.contains('schoolId')) {
          const index = store.index('schoolId');
          const cursorReq = index.openCursor(schoolId);
          cursorReq.onsuccess = (e) => {
            const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
              cursor.delete();
              cursor.continue();
            }
          };
        } else {
          const req = store.getAll();
          req.onsuccess = () => {
            const items = req.result as Student[];
            items.forEach(st => {
              if (st.schoolId === schoolId) {
                if (st.id) store.delete(st.id);
              }
            });
          };
        }
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('IDB clear aborted'));
    });
  } catch (err) {
    console.warn('idbClearStudents error:', err);
  }
}

export async function idbPutStudent(student: Student): Promise<void> {
  try {
    const db = await getIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STUDENTS_STORE], 'readwrite');
      const store = transaction.objectStore(STUDENTS_STORE);
      store.put(student);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('IDB transaction aborted'));
    });
  } catch (err) {
    console.warn('idbPutStudent error:', err);
  }
}

export async function idbDeleteStudent(id: string, grNumber?: string): Promise<void> {
  try {
    const db = await getIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STUDENTS_STORE], 'readwrite');
      const store = transaction.objectStore(STUDENTS_STORE);
      
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
