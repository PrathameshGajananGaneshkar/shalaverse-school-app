import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { UserProfile } from '../types';
import { authCredentialsService, AuthCredentials } from '../services/authCredentialsService';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string, newPass: string, pin?: string, ans?: string) => Promise<{ success: boolean; message: string }>;
  getCredentials: () => Promise<AuthCredentials>;
  saveCredentials: (creds: AuthCredentials) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_STORAGE_AUTH_KEY = 'shalaverse_auth_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    // Clear any legacy persistent localStorage key so old sessions don't keep user logged in across restarts
    try {
      localStorage.removeItem('shalaverse_auth_user');
    } catch {
      // ignore
    }

    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_AUTH_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch of credentials to make sure cache is updated
    authCredentialsService.getCredentials().catch(() => {});

    // Configure session-only persistence in Firebase Auth
    setPersistence(auth, browserSessionPersistence).catch(() => {});

    // If there is NO active session in this browser tab/window, force log out immediately
    const activeSession = sessionStorage.getItem(SESSION_STORAGE_AUTH_KEY);
    if (!activeSession) {
      signOut(auth).catch(() => {});
      setUser(null);
      setUserProfile(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      const currentSession = sessionStorage.getItem(SESSION_STORAGE_AUTH_KEY);
      if (currentSession) {
        try {
          setUserProfile(JSON.parse(currentSession));
        } catch {
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    const trimmedEmail = email.trim();
    const trimmedPass = pass.trim();

    if (!trimmedEmail || !trimmedPass) {
      setLoading(false);
      throw new Error('कृपया शाळा ईमेल आयडी आणि पासवर्ड दोन्ही प्रविष्ट करा.');
    }

    try {
      // 1. Strict credential verification against master credentials
      const verifyResult = await authCredentialsService.verifyLogin(trimmedEmail, trimmedPass);
      if (!verifyResult.success) {
        throw new Error(verifyResult.message || 'चुकीचा ईमेल किंवा पासवर्ड! वेबसाईट उघडण्यासाठी योग्य पासवर्ड आवश्यक आहे.');
      }

      // 2. Set session-only persistence before signing in
      try {
        await setPersistence(auth, browserSessionPersistence);
      } catch {
        // ignore
      }

      // 3. Attempt Firebase Auth sign-in or auto-provision
      try {
        const cred = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPass);
        setUser(cred.user);
      } catch (err: any) {
        if (
          err.code === 'auth/user-not-found' || 
          err.code === 'auth/invalid-credential' ||
          err.code === 'auth/configuration-not-found'
        ) {
          try {
            const newCred = await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPass);
            setUser(newCred.user);
          } catch (e) {
            // ignore
          }
        }
      }

      // 4. Set authenticated session in sessionStorage (clears upon closing browser/tab)
      const profile: UserProfile = {
        uid: user?.uid || 'school-admin-' + Date.now(),
        email: trimmedEmail,
        displayName: trimmedEmail.split('@')[0] || 'School Admin',
        role: 'admin'
      };
      setUserProfile(profile);
      sessionStorage.setItem(SESSION_STORAGE_AUTH_KEY, JSON.stringify(profile));
    } finally {
      setLoading(false);
    }
  };

  const signupWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await setPersistence(auth, browserSessionPersistence).catch(() => {});
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass.trim());
      setUser(cred.user);
      const profile: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email || email,
        displayName: email.split('@')[0] || 'School Staff',
        role: 'admin'
      };
      setUserProfile(profile);
      sessionStorage.setItem(SESSION_STORAGE_AUTH_KEY, JSON.stringify(profile));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth).catch(() => {});
      setUser(null);
      setUserProfile(null);
      sessionStorage.removeItem(SESSION_STORAGE_AUTH_KEY);
      try {
        localStorage.removeItem('shalaverse_auth_user');
      } catch {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string, newPass: string, pin?: string, ans?: string) => {
    return await authCredentialsService.resetPassword(email, newPass, pin, ans);
  };

  const getCredentials = async () => {
    return await authCredentialsService.getCredentials();
  };

  const saveCredentials = async (creds: AuthCredentials) => {
    await authCredentialsService.saveCredentials(creds);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        loginWithEmail,
        login: loginWithEmail,
        signupWithEmail,
        logout,
        resetPassword,
        getCredentials,
        saveCredentials,
        isAuthenticated: !!userProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
