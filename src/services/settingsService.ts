import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { SchoolSettings } from '../types';

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  schoolName: 'Shri Shivaji High School and Junior College, Chikhli',
  schoolNameLocal: 'श्री शिवाजी हायस्कूल आणि कनिष्ठ महाविद्यालय, चिखली',
  udiseNumber: '27070200119',
  boardAffiliation: 'Shri Shivaji Shikshan Sanstha, Amravati – Managed by',
  recognitionNo: 'Kr. Va Di. Bu. Ji. Pa. / Secondary School / Inspection 11150 Education Department Buldhana, Dt. 18/10/65',
  affiliationNo: '04.03.016',
  boardName: 'Amravati',
  address: 'Chikhli, Dist. Buldhana - 443201',
  phone: '(07264)-242113',
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
    let settings = DEFAULT_SCHOOL_SETTINGS;
    try {
      const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        settings = { ...DEFAULT_SCHOOL_SETTINGS, ...snapshot.data() } as SchoolSettings;
      }
    } catch (err) {
      console.warn('Could not fetch settings from Firestore, checking localStorage:', err);
    }
    
    // Fallback to localStorage or default
    const local = localStorage.getItem('shalaverse_school_settings');
    if (local) {
      try {
        settings = { ...settings, ...JSON.parse(local) };
      } catch {
        // ignore
      }
    }

    // Auto-clean legacy values
    if (!settings.boardAffiliation || settings.boardAffiliation.includes('MH-BD-0402') || settings.boardAffiliation.includes('SSC / HSC Maharashtra State Board')) {
      settings.boardAffiliation = 'Shri Shivaji Shikshan Sanstha, Amravati – Managed by';
    }
    if (!settings.phone || settings.phone.includes('+91 7264 242119')) {
      settings.phone = '(07264)-242113';
    }
    if (!settings.recognitionNo) {
      settings.recognitionNo = 'Kr. Va Di. Bu. Ji. Pa. / Secondary School / Inspection 11150 Education Department Buldhana, Dt. 18/10/65';
    }
    if (!settings.affiliationNo) {
      settings.affiliationNo = '04.03.016';
    }
    if (!settings.boardName) {
      settings.boardName = 'Amravati';
    }

    return settings;
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
