/**
 * Firestore Quota & Circuit Breaker Utility
 * Detects when Firestore free tier daily quota (write/read units) has been reached,
 * prevents continuous backoff loops / network spam, and enables graceful local-first operation.
 */

const QUOTA_STORAGE_KEY = 'shalaverse_firestore_quota_exceeded_date';
const PROJECT_ID = 'hybrid-signal-3t3g1';
const FIRESTORE_DB_ID = 'ai-studio-shalaverse-312aa896-9e51-41f9-a2fa-07c3393d7f75';

let inMemoryQuotaExceeded = false;

// Check if error is related to quota exhaustion
export function isQuotaExceededError(err: unknown): boolean {
  if (!err) return false;
  const msg = typeof err === 'string' 
    ? err 
    : (err as any).message || (err as any).code || String(err);
  
  return (
    msg.includes('resource-exhausted') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('Free daily write units') ||
    msg.includes('Free daily read units') ||
    msg.includes('quota metric')
  );
}

// Mark quota as exceeded for today
export function recordQuotaExceeded(): void {
  inMemoryQuotaExceeded = true;
  try {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(QUOTA_STORAGE_KEY, today);
    // Dispatch custom event so UI can react immediately
    window.dispatchEvent(new CustomEvent('shalaverse-quota-changed', { detail: { exceeded: true } }));
  } catch {
    // ignore
  }
}

// Reset quota flag (e.g. if user upgraded or next day arrived)
export function resetQuotaExceeded(): void {
  inMemoryQuotaExceeded = false;
  try {
    localStorage.removeItem(QUOTA_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('shalaverse-quota-changed', { detail: { exceeded: false } }));
  } catch {
    // ignore
  }
}

// Check if quota is currently exceeded
export function isFirestoreQuotaExceeded(): boolean {
  if (inMemoryQuotaExceeded) return true;
  try {
    const savedDate = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (!savedDate) return false;
    const today = new Date().toISOString().split('T')[0];
    if (savedDate === today) {
      inMemoryQuotaExceeded = true;
      return true;
    }
    // New day has arrived, clear the old flag
    localStorage.removeItem(QUOTA_STORAGE_KEY);
    return false;
  } catch {
    return false;
  }
}

// Get the direct upgrade link required for the project
export function getFirestoreUpgradeUrl(): string {
  return `https://console.firebase.google.com/project/${PROJECT_ID}/firestore/databases/${FIRESTORE_DB_ID}/data?openUpgradeDialog=true`;
}
