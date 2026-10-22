import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { SchoolSettings, School } from '../types';
import { settingsService, DEFAULT_SCHOOL_SETTINGS } from '../services/settingsService';
import { useSchool } from './SchoolContext';

export function schoolToSettings(school: School): SchoolSettings {
  return {
    schoolName: school.schoolName || DEFAULT_SCHOOL_SETTINGS.schoolName,
    schoolNameLocal: school.schoolNameLocal || school.schoolName || DEFAULT_SCHOOL_SETTINGS.schoolNameLocal,
    udiseNumber: school.udiseNumber || '',
    boardAffiliation: school.boardAffiliation || '',
    recognitionNo: school.recognitionNo || '',
    affiliationNo: school.affiliationNo || '',
    boardName: school.boardName || '',
    address: school.address || '',
    phone: school.phone || '',
    email: school.email || '',
    website: school.website || '',
    academicYear: school.academicYear || '2026-2027',
    headmasterName: school.headmasterName || 'मुख्याध्यापक / प्राचार्य',
    logoUrl: school.logoUrl || '',
    tagline: school.tagline || '',
    schoolId: school.id
  };
}

interface SettingsContextType {
  settings: SchoolSettings;
  loading: boolean;
  updateSettings: (newSettings: SchoolSettings) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { currentSchool, updateSchool } = useSchool();
  const [settings, setSettings] = useState<SchoolSettings>(() => {
    if (currentSchool) {
      return schoolToSettings(currentSchool);
    }
    const local = typeof window !== 'undefined' ? localStorage.getItem('shalaverse_school_settings') : null;
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (parsed?.schoolName || parsed?.schoolNameLocal) {
          return { ...DEFAULT_SCHOOL_SETTINGS, ...parsed };
        }
      } catch {}
    }
    return DEFAULT_SCHOOL_SETTINGS;
  });
  const [loading, setLoading] = useState(false);

  // Synchronize immediately whenever active school changes in SchoolContext!
  useEffect(() => {
    if (currentSchool) {
      const activeSettings = schoolToSettings(currentSchool);
      setSettings(activeSettings);
      localStorage.setItem('shalaverse_school_settings', JSON.stringify(activeSettings));
    }
  }, [currentSchool]);

  const updateSettings = async (newSettings: SchoolSettings) => {
    setSettings(newSettings);
    await settingsService.updateSettings(newSettings);
    if (currentSchool) {
      await updateSchool(currentSchool.id, {
        schoolName: newSettings.schoolName,
        schoolNameLocal: newSettings.schoolNameLocal || newSettings.schoolName,
        udiseNumber: newSettings.udiseNumber,
        boardAffiliation: newSettings.boardAffiliation,
        recognitionNo: newSettings.recognitionNo,
        affiliationNo: newSettings.affiliationNo,
        boardName: newSettings.boardName,
        address: newSettings.address,
        phone: newSettings.phone,
        email: newSettings.email,
        website: newSettings.website,
        academicYear: newSettings.academicYear,
        headmasterName: newSettings.headmasterName,
        logoUrl: newSettings.logoUrl,
        tagline: newSettings.tagline,
      });
    }
  };

  const fetchSettings = useCallback(async () => {
    if (currentSchool) {
      setSettings(schoolToSettings(currentSchool));
      return;
    }
    try {
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, [currentSchool]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        updateSettings,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
