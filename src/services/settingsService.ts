import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { SchoolSettings } from '../types';

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  schoolName: 'Shree Shivaji High School and Junior College, Chikhli',
  schoolNameLocal: 'श्री शिवाजी हायस्कूल आणि कनिष्ठ महाविद्यालय, चिखली',
  udiseNumber: '27040200119',
  boardAffiliation: 'SSC / HSC Maharashtra State Board (Reg. No. MH-BD-0402)',
  address: 'At Post Chikhli, Dist. Buldhana, Maharashtra - 443201',
  phone: '+91 7264 242119 / 98220 12345',
  email: 'shivajischool.chikhli@gmail.com',
  website: 'https://shalaverse.edu.in',
  academicYear: '2026-2027',
  headmasterName: 'Principal / Headmaster',
  logoUrl: '',
  tagline: 'विद्ययाऽमृतमश्नुते | ज्ञान हेच सामर्थ्य'
};

const SETTINGS_DOC_ID = 'general_school_config';

export const settingsService = {
  async getSettings(): Promise<SchoolSettings> {
    try {
      const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { ...DEFAULT_SCHOOL_SETTINGS, ...snapshot.data() } as SchoolSettings;
      }
    } catch (err) {
      console.warn('Could not fetch settings from Firestore, checking localStorage:', err);
    }
    
    // Fallback to localStorage or default
    const local = localStorage.getItem('shalaverse_school_settings');
    if (local) {
      try {
        return { ...DEFAULT_SCHOOL_SETTINGS, ...JSON.parse(local) };
      } catch {
        // ignore
      }
    }
    return DEFAULT_SCHOOL_SETTINGS;
  },

  async updateSettings(settings: SchoolSettings): Promise<void> {
    localStorage.setItem('shalaverse_school_settings', JSON.stringify(settings));
    try {
      const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
      await setDoc(docRef, settings, { merge: true });
    } catch (err) {
      console.error('Error saving settings to Firestore:', err);
    }
  }
};
