import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
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

const LOCAL_STORAGE_AUTH_KEY = 'shalaverse_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch of credentials to make sure cache is updated
    authCredentialsService.getCredentials().catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email || 'school@shalaverse.edu',
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'School Office Staff',
          role: 'admin'
        };
        setUserProfile(profile);
        localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(profile));
      } else {
        const saved = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
        if (saved) {
          try {
            setUserProfile(JSON.parse(saved));
          } catch {
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
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

      // 2. Attempt Firebase Auth sign-in or auto-provision
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

      // 3. Set authenticated session
      const profile: UserProfile = {
        uid: user?.uid || 'school-admin-' + Date.now(),
        email: trimmedEmail,
        displayName: trimmedEmail.split('@')[0] || 'School Admin',
        role: 'admin'
      };
      setUserProfile(profile);
      localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(profile));
    } finally {
      setLoading(false);
    }
  };

  const signupWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass.trim());
      setUser(cred.user);
      const profile: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email || email,
        displayName: email.split('@')[0] || 'School Staff',
        role: 'admin'
      };
      setUserProfile(profile);
      localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(profile));
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
      localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
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
