import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';

// Configuration loaded from provisioned firebase applet config
export const firebaseConfig = {
  projectId: "hybrid-signal-3t3g1",
  appId: "1:185398222822:web:f08c21b6a015a42a6c8027",
  apiKey: "AIzaSyA1yxcPxaNnkrhmMQb5qHxChIyzbPjXxgE",
  authDomain: "hybrid-signal-3t3g1.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-shalaverse-312aa896-9e51-41f9-a2fa-07c3393d7f75",
  storageBucket: "hybrid-signal-3t3g1.firebasestorage.app",
  messagingSenderId: "185398222822",
  oAuthClientId: "185398222822-lcp4a935jo508i4f4c5rotvs4h14fjc3.apps.googleusercontent.com"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Use custom provisioned database ID or default with long polling for reliability in browser sandboxes
const databaseId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  }, databaseId);
} catch {
  try {
    firestoreInstance = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  } catch {
    firestoreInstance = getFirestore(app);
  }
}

export const db = firestoreInstance;

export default app;
