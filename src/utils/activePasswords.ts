/**
 * Active Passwords Store
 * Guarantees instantaneous (0ms) password updates and prevents background Firestore sync
 * or default hardcoded values from overwriting user-reset passwords.
 */

const ACTIVE_PASSWORDS_STORAGE_KEY = 'shalaverse_active_passwords';

interface StoredPasswordRecord {
  password: string;
  updatedAt: string;
}

export function cleanPasswordString(pass: string | undefined | null): string {
  if (!pass) return '';
  return pass
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ')
    .trim();
}

function normalizeKey(key: string): string {
  return (key || '').trim().toLowerCase();
}

export function getAllActivePasswords(): Record<string, StoredPasswordRecord> {
  try {
    const raw = localStorage.getItem(ACTIVE_PASSWORDS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getActivePassword(identifier: string): string | null {
  if (!identifier) return null;
  const store = getAllActivePasswords();
  const normalized = normalizeKey(identifier);
  if (store[normalized]?.password) {
    return store[normalized].password;
  }
  // Try clean numeric digits only if applicable (e.g. UDISE or phone)
  const digitsOnly = normalized.replace(/\D/g, '');
  if (digitsOnly && digitsOnly.length >= 10 && store[digitsOnly]?.password) {
    return store[digitsOnly].password;
  }
  return null;
}

export function setActivePassword(identifiers: (string | undefined | null)[], newPass: string): void {
  const cleanPass = cleanPasswordString(newPass);
  if (!cleanPass) return;

  const store = getAllActivePasswords();
  const now = new Date().toISOString();

  identifiers.forEach(rawId => {
    if (!rawId) return;
    const cleanId = normalizeKey(rawId);
    if (cleanId) {
      store[cleanId] = {
        password: cleanPass,
        updatedAt: now
      };
      const digitsOnly = cleanId.replace(/\D/g, '');
      if (digitsOnly && digitsOnly.length >= 10) {
        store[digitsOnly] = {
          password: cleanPass,
          updatedAt: now
        };
      }
    }
  });

  try {
    localStorage.setItem(ACTIVE_PASSWORDS_STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('Failed to save active password to localStorage:', err);
  }
}

export function isMatchingActivePassword(
  inputPassword: string,
  identifiers: (string | undefined | null)[]
): boolean {
  const cleanInput = cleanPasswordString(inputPassword);
  if (!cleanInput) return false;

  for (const id of identifiers) {
    if (!id) continue;
    const activePass = getActivePassword(id);
    if (activePass) {
      const normActive = cleanPasswordString(activePass);
      if (
        cleanInput === normActive ||
        cleanInput.toLowerCase() === normActive.toLowerCase()
      ) {
        return true;
      }
    }
  }
  return false;
}
