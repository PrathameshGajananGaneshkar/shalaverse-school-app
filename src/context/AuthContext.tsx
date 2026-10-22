import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  setPersistence,
  browserSessionPersistence,
  updatePassword,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { UserProfile } from '../types';
import { authCredentialsService, AuthCredentials, SuperAdminCredentials } from '../services/authCredentialsService';
import { schoolService } from '../services/schoolService';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<UserProfile>;
  login: (email: string, pass: string) => Promise<UserProfile>;
  signupWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (identifier: string, newPass: string, pin?: string, ans?: string) => Promise<{ success: boolean; message: string }>;
  getCredentials: () => Promise<AuthCredentials>;
  saveCredentials: (creds: AuthCredentials) => Promise<void>;
  getSuperAdminCredentials: () => Promise<SuperAdminCredentials>;
  saveSuperAdminCredentials: (creds: SuperAdminCredentials) => Promise<void>;
  changeSuperAdminPassword: (currentPassOrPin: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
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
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.displayName && parsed.displayName.includes('(प्लॅटफॉर्म मालक)')) {
          parsed.displayName = parsed.displayName.replace('(प्लॅटफॉर्म मालक)', '').trim();
          sessionStorage.setItem(SESSION_STORAGE_AUTH_KEY, JSON.stringify(parsed));
        }
        return parsed;
      }
      return null;
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
          const parsed = JSON.parse(currentSession);
          if (parsed.displayName && parsed.displayName.includes('(प्लॅटफॉर्म मालक)')) {
            parsed.displayName = parsed.displayName.replace('(प्लॅटफॉर्म मालक)', '').trim();
            sessionStorage.setItem(SESSION_STORAGE_AUTH_KEY, JSON.stringify(parsed));
          }
          setUserProfile(parsed);
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

  const loginWithEmail = async (email: string, pass: string): Promise<UserProfile> => {
    setLoading(true);
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = pass.trim();

    if (!trimmedEmail || !trimmedPass) {
      setLoading(false);
      throw new Error('कृपया शाळा ईमेल / युडायस क्रमांक आणि पासवर्ड प्रविष्ट करा.');
    }

    try {
      // 1. Check if user is Super Admin (Owner of Shalaverse)
      const cleanEmail = trimmedEmail.toLowerCase();
      const isSuperAdminEmail = 
        cleanEmail === 'p.ganeshkar8788@gmail.com' || 
        cleanEmail === 'superadmin@shalaverse.in' ||
        cleanEmail === 'superadmin@shalaverse.com' ||
        cleanEmail === 'admin@shalaverse.in' ||
        cleanEmail === 'superadmin' ||
        cleanEmail === 'admin';

      if (isSuperAdminEmail) {
        const superVerify = await authCredentialsService.verifySuperAdminLogin(trimmedEmail, trimmedPass);
        if (superVerify.success) {
          const profile: UserProfile = {
            uid: 'super-admin-' + Date.now(),
            email: trimmedEmail,
            displayName: 'Super Admin',
            role: 'super_admin'
          };
          setUserProfile(profile);
          sessionStorage.setItem(SESSION_STORAGE_AUTH_KEY, JSON.stringify(profile));
          return profile;
        } else {
          throw new Error(superVerify.message || 'चुकीचा सुपर ॲडमिन पासवर्ड!');
        }
      }

      // 2. Check if credentials belong to any registered Client School
      const schoolVerify = await schoolService.verifySchoolLogin(trimmedEmail, trimmedPass);
      if (schoolVerify.success && schoolVerify.school) {
        const sch = schoolVerify.school;
        const profile: UserProfile = {
          uid: sch.id,
          email: sch.email,
          displayName: sch.schoolNameLocal || sch.schoolName,
          role: 'school',
          schoolId: sch.id
        };
        setUserProfile(profile);
        sessionStorage.setItem(SESSION_STORAGE_AUTH_KEY, JSON.stringify(profile));
        localStorage.setItem('shalaverse_active_school_id', sch.id);
        localStorage.setItem('shalaverse_school_settings', JSON.stringify({
          schoolName: sch.schoolName,
          schoolNameLocal: sch.schoolNameLocal,
          udiseNumber: sch.udiseNumber,
          boardAffiliation: sch.boardAffiliation,
          recognitionNo: sch.recognitionNo,
          affiliationNo: sch.affiliationNo,
          boardName: sch.boardName,
          address: sch.address,
          phone: sch.phone,
          email: sch.email,
          website: sch.website,
          academicYear: sch.academicYear,
          headmasterName: sch.headmasterName,
          logoUrl: sch.logoUrl,
          tagline: sch.tagline,
          schoolId: sch.id
        }));
        return profile;
      }

      // If school was recognized but password was wrong or status inactive, report exact reason immediately
      if (schoolVerify.error && !schoolVerify.error.includes('नोंदणीकृत नाही')) {
        throw new Error(schoolVerify.error);
      }

      // 3. Fallback check for Master credentials if single school mode
      const masterVerify = await authCredentialsService.verifyLogin(trimmedEmail, trimmedPass);
      if (masterVerify.success) {
        const profile: UserProfile = {
          uid: 'school-admin-' + Date.now(),
          email: trimmedEmail,
          displayName: 'School Admin',
          role: 'school',
          schoolId: 'school_27070200119'
        };
        setUserProfile(profile);
        sessionStorage.setItem(SESSION_STORAGE_AUTH_KEY, JSON.stringify(profile));
        return profile;
      }

      // 4. Default error if no account matched
      throw new Error(schoolVerify.error || masterVerify.message || 'चुकीचा ईमेल किंवा पासवर्ड! कृपया योग्य माहिती प्रविष्ट करा.');

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

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      if (!prev) return prev;
      const updated: UserProfile = { ...prev, ...updates };
      sessionStorage.setItem(SESSION_STORAGE_AUTH_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const getSuperAdminCredentials = async () => {
    return await authCredentialsService.getSuperAdminCredentials();
  };

  const saveSuperAdminCredentials = async (creds: SuperAdminCredentials) => {
    await authCredentialsService.saveSuperAdminCredentials(creds);
    if (userProfile?.role === 'super_admin') {
      updateUserProfile({
        displayName: creds.name || userProfile.displayName || 'Super Admin',
        email: creds.email || userProfile.email
      });
    }
    if (auth.currentUser) {
      if (creds.password) {
        try {
          await updatePassword(auth.currentUser, creds.password);
        } catch (e) {
          console.warn('Firebase Auth password sync skipped:', e);
        }
      }
      if (creds.name) {
        try {
          await updateProfile(auth.currentUser, { displayName: creds.name });
        } catch (e) {
          console.warn('Firebase Auth profile displayName sync skipped:', e);
        }
      }
    }
  };

  const changeSuperAdminPassword = async (currentPassOrPin: string, newPassword: string) => {
    return await authCredentialsService.changeSuperAdminPassword(currentPassOrPin, newPassword);
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
        getSuperAdminCredentials,
        saveSuperAdminCredentials,
        changeSuperAdminPassword,
        updateUserProfile,
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
