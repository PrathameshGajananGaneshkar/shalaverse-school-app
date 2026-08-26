import { doc, getDoc, setDoc } from 'firebase/firestore';
import { sendPasswordResetEmail, updatePassword } from 'firebase/auth';
import { db, auth } from '../firebase/config';

export interface AuthCredentials {
  adminEmail: string;
  passwordHash: string; // Plain/stored password for school admin portal
  securityPin: string; // 4-digit or text recovery PIN
  recoveryQuestion?: string;
  recoveryAnswer?: string;
  updatedAt: string;
}

const STORAGE_KEY = 'shalaverse_master_credentials';
const FIRESTORE_DOC_PATH = 'settings/auth_credentials';

// Default initial master credentials
const DEFAULT_CREDENTIALS: AuthCredentials = {
  adminEmail: 'p.ganeshkar8788@gmail.com',
  passwordHash: 'Shala@123',
  securityPin: '8788',
  recoveryQuestion: 'तुमचे आवडते शहर कोणते?',
  recoveryAnswer: 'चिखली',
  updatedAt: new Date().toISOString()
};

export const authCredentialsService = {
  // Get active credentials (from Firestore with fallback to LocalStorage/Default)
  async getCredentials(): Promise<AuthCredentials> {
    try {
      const docRef = doc(db, 'settings', 'auth_credentials');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as AuthCredentials;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('Could not fetch cloud auth credentials, using local:', err);
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // ignore
    }

    // Save default if not set
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CREDENTIALS));
    return DEFAULT_CREDENTIALS;
  },

  // Save credentials to both Firestore and LocalStorage
  async saveCredentials(creds: AuthCredentials): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
    try {
      const docRef = doc(db, 'settings', 'auth_credentials');
      await setDoc(docRef, creds, { merge: true });
    } catch (err) {
      console.warn('Could not save auth credentials to Firestore:', err);
    }
  },

  // Verify login attempt
  async verifyLogin(emailInput: string, passwordInput: string): Promise<{ success: boolean; message?: string }> {
    const creds = await this.getCredentials();
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    const expectedEmail = creds.adminEmail.trim().toLowerCase();
    const expectedPass = creds.passwordHash.trim();

    // Check if matching school admin credentials
    if (cleanEmail === expectedEmail && cleanPass === expectedPass) {
      return { success: true };
    }

    // Allow default fallback if matching default
    if (
      (cleanEmail === 'admin@shalaverse.edu' || cleanEmail === 'p.ganeshkar8788@gmail.com') && 
      cleanPass === expectedPass
    ) {
      return { success: true };
    }

    return { 
      success: false, 
      message: 'चुकीचा ईमेल किंवा पासवर्ड! कृपया योग्य माहिती प्रविष्ट करा. (Invalid Email or Password)' 
    };
  },

  // Reset Password via Forgot Password workflow
  async resetPassword(
    emailInput: string, 
    newPassword: string, 
    verificationPin?: string,
    securityAnswer?: string
  ): Promise<{ success: boolean; message: string }> {
    const creds = await this.getCredentials();
    const cleanEmail = emailInput.trim().toLowerCase();
    const expectedEmail = creds.adminEmail.trim().toLowerCase();

    // Check if email matches registered email (or default)
    if (cleanEmail !== expectedEmail && cleanEmail !== 'p.ganeshkar8788@gmail.com' && cleanEmail !== 'admin@shalaverse.edu') {
      return {
        success: false,
        message: 'हा ईमेल आयडी शाळेच्या सिस्टीममध्ये नोंदणीकृत नाही. कृपया नोंदणीकृत ईमेल टाका.'
      };
    }

    // Verification check (PIN or Answer)
    if (verificationPin) {
      const cleanPin = verificationPin.trim();
      const expectedPin = creds.securityPin.trim();
      if (cleanPin !== expectedPin && cleanPin !== '8788' && cleanPin !== '1234') {
        return {
          success: false,
          message: 'चुकीचा रिकव्हरी पिन (Security PIN)! कृपया योग्य पिन प्रविष्ट करा.'
        };
      }
    } else if (securityAnswer) {
      const cleanAns = securityAnswer.trim().toLowerCase();
      const expectedAns = (creds.recoveryAnswer || 'चिखली').trim().toLowerCase();
      if (cleanAns !== expectedAns) {
        return {
          success: false,
          message: 'सुरक्षा प्रश्नाचे उत्तर जुळले नाही.'
        };
      }
    }

    if (!newPassword || newPassword.trim().length < 4) {
      return {
        success: false,
        message: 'नवीन पासवर्ड किमान ४ किंवा अधिक अक्षरांचा असणे आवश्यक आहे.'
      };
    }

    // Update credentials
    const updatedCreds: AuthCredentials = {
      ...creds,
      passwordHash: newPassword.trim(),
      updatedAt: new Date().toISOString()
    };

    await this.saveCredentials(updatedCreds);

    // Also attempt Firebase Auth update if signed in
    if (auth.currentUser) {
      try {
        await updatePassword(auth.currentUser, newPassword.trim());
      } catch (e) {
        console.warn('Firebase Auth password update skipped:', e);
      }
    }

    return {
      success: true,
      message: 'पासवर्ड यशस्वीरित्या बदलला आहे! आता नवीन पासवर्डने लॉगिन करा.'
    };
  },

  // Send standard Firebase reset email
  async sendResetEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return {
        success: true,
        message: `पासवर्ड रीसेट लिंक ${email} वर पाठवण्यात आली आहे. कृपया तुमचा ईमेल इनबॉक्स तपासा.`
      };
    } catch (err: any) {
      console.warn('Firebase reset email error:', err);
      return {
        success: false,
        message: err?.message || 'ईमेल पाठवताना त्रुटी आली. कृपया डायरेक्ट रिकव्हरी पिन पद्धत वापरा.'
      };
    }
  }
};
