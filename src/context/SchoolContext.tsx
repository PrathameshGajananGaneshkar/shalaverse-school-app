import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { School } from '../types';
import { schoolService, DEFAULT_INITIAL_SCHOOL, DEFAULT_INITIAL_SCHOOLS } from '../services/schoolService';
import { useAuth } from './AuthContext';
import { getCodeSchoolStatus } from '../config/schoolStatusConfig';

interface SchoolContextType {
  allSchools: School[];
  currentSchool: School | null;
  loading: boolean;
  isSuperAdmin: boolean;
  selectSchool: (schoolIdOrSchool: string | School) => void;
  refreshSchools: () => Promise<void>;
  addSchool: (data: Omit<School, 'id' | 'createdAt' | 'updatedAt'>) => Promise<School>;
  updateSchool: (id: string, partial: Partial<School>) => Promise<School>;
  deleteSchool: (id: string) => Promise<void>;
  toggleSchoolStatus: (id: string, status: 'active' | 'inactive') => Promise<School>;
  bulkAddSchools: (
    schools: Partial<School>[],
    onProgress?: (done: number, total: number) => void
  ) => Promise<{ success: boolean; count: number; errors: string[] }>;
  resetBulkSchools: (
    onProgress?: (done: number, total: number) => void
  ) => Promise<{ success: boolean; deletedCount: number; errors: string[] }>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

const ACTIVE_SCHOOL_STORAGE_KEY = 'shalaverse_active_school_id';

export function SchoolProvider({ children }: { children: ReactNode }) {
  const { userProfile } = useAuth();
  
  const [allSchools, setAllSchools] = useState<School[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('shalaverse_schools_cache');
        if (cached) {
          const list = JSON.parse(cached);
          if (Array.isArray(list) && list.length > 0) {
            const deletedIds = schoolService.getDeletedSchoolIds();
            const initialNonDeleted = DEFAULT_INITIAL_SCHOOLS.filter(s => !deletedIds.includes(s.id));
            const mergedMap = new Map<string, School>();
            initialNonDeleted.forEach(s => mergedMap.set(s.id, s));
            list.forEach((s: School) => {
              if (!deletedIds.includes(s.id)) mergedMap.set(s.id, s);
            });
            const overrides = schoolService.getStatusOverrides();
            return Array.from(mergedMap.values()).map(s => {
              const codeStatus = getCodeSchoolStatus(s.id) || getCodeSchoolStatus(s.udiseNumber);
              const cloudStatus = overrides[s.id];
              return { ...s, status: codeStatus || cloudStatus || s.status || 'active' };
            });
          }
        }
      } catch {}
    }
    return DEFAULT_INITIAL_SCHOOLS.map(s => {
      const codeStatus = getCodeSchoolStatus(s.id) || getCodeSchoolStatus(s.udiseNumber);
      return { ...s, status: codeStatus || s.status || 'active' };
    });
  });

  const [currentSchool, setCurrentSchool] = useState<School | null>(() => {
    let initial: School = DEFAULT_INITIAL_SCHOOLS[0] || DEFAULT_INITIAL_SCHOOL;
    if (typeof window !== 'undefined') {
      const savedSchoolId = localStorage.getItem(ACTIVE_SCHOOL_STORAGE_KEY);
      if (savedSchoolId) {
        const match = DEFAULT_INITIAL_SCHOOLS.find(s => s.id === savedSchoolId);
        if (match) initial = match;
        const cached = localStorage.getItem('shalaverse_schools_cache');
        if (cached) {
          try {
            const list = JSON.parse(cached);
            const found = list.find((s: School) => s.id === savedSchoolId);
            if (found) initial = found;
          } catch {}
        }
      }
    }
    const codeStatus = getCodeSchoolStatus(initial.id) || getCodeSchoolStatus(initial.udiseNumber);
    const overrides = schoolService.getStatusOverrides();
    const finalStatus = codeStatus || overrides[initial.id] || initial.status || 'active';
    return { ...initial, status: finalStatus };
  });
  const [loading, setLoading] = useState<boolean>(false);

  // Super Admin detection
  const isSuperAdmin = Boolean(
    userProfile?.role === 'super_admin' || 
    (userProfile?.email && userProfile.email.toLowerCase() === 'p.ganeshkar8788@gmail.com')
  );

  const loadSchools = useCallback(async () => {
    try {
      const list = await schoolService.getAllSchools();
      setAllSchools(list);

      // Determine which school should be active:
      // 1. If school user is logged in, their specific school MUST be active
      if (userProfile?.schoolId) {
        const matchingSchool = list.find(s => s.id === userProfile.schoolId) || DEFAULT_INITIAL_SCHOOLS.find(s => s.id === userProfile.schoolId);
        if (matchingSchool) {
          setCurrentSchool(matchingSchool);
          localStorage.setItem(ACTIVE_SCHOOL_STORAGE_KEY, matchingSchool.id);
          return;
        }
      }

      // 2. Otherwise check saved active school in localStorage (for Super Admin or dev)
      const savedSchoolId = localStorage.getItem(ACTIVE_SCHOOL_STORAGE_KEY);
      if (savedSchoolId) {
        const found = list.find(s => s.id === savedSchoolId) || DEFAULT_INITIAL_SCHOOLS.find(s => s.id === savedSchoolId);
        if (found) {
          setCurrentSchool(found);
          return;
        }
      }

      // 3. Fallback to first school in list
      if (list.length > 0) {
        setCurrentSchool(list[0]);
        localStorage.setItem(ACTIVE_SCHOOL_STORAGE_KEY, list[0].id);
      }
    } catch (err) {
      console.error('Failed to load schools:', err);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.schoolId]);

  useEffect(() => {
    // 0. Lightweight cloud status & deletion sync across all devices
    Promise.all([
      schoolService.fetchCloudStatusOverrides(),
      schoolService.fetchCloudDeletedSchoolIds()
    ]).then(([statuses, deletedIds]) => {
      loadSchools();
    }).catch(() => {});

    loadSchools();

    // 1. Listen for background sync updates on this device
    const handleSchoolsUpdated = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setAllSchools(e.detail);
        setCurrentSchool(prev => {
          if (!prev) return prev;
          const match = e.detail.find((s: School) => s.id === prev.id);
          return match || prev;
        });
      }
    };
    window.addEventListener('shalaverse_schools_updated', handleSchoolsUpdated);

    // 2. Real-time Firebase cloud listener on dedicated status document (guaranteed multi-device sync)
    const unsubCloudStatus = schoolService.subscribeToCloudStatus((freshStatuses) => {
      setAllSchools(prev => prev.map(s => {
        const codeStatus = getCodeSchoolStatus(s.id) || getCodeSchoolStatus(s.udiseNumber);
        const cloudStatus = freshStatuses[s.id];
        const finalStatus = codeStatus || cloudStatus || s.status || 'active';
        return { ...s, status: finalStatus };
      }));
      setCurrentSchool(prev => {
        if (!prev) return prev;
        const codeStatus = getCodeSchoolStatus(prev.id) || getCodeSchoolStatus(prev.udiseNumber);
        const cloudStatus = freshStatuses[prev.id];
        const finalStatus = codeStatus || cloudStatus || prev.status || 'active';
        return { ...prev, status: finalStatus };
      });
    });

    // 3. Real-time Master Document Listener (for immediate addition/deletion sync across devices)
    const unsubMasterSync = schoolService.subscribeToMasterSync((deletedIds, customSchools) => {
      // If schools were deleted or added on another device, update immediately
      setAllSchools(prev => {
        let updated = prev.filter(s => !deletedIds.includes(s.id));
        if (customSchools && customSchools.length > 0) {
          const map = new Map(updated.map(s => [s.id, s]));
          customSchools.forEach(cs => {
            if (!deletedIds.includes(cs.id)) {
              map.set(cs.id, cs);
            }
          });
          updated = Array.from(map.values());
        }
        const overrides = schoolService.getStatusOverrides();
        return updated.map(s => {
          const codeStatus = getCodeSchoolStatus(s.id) || getCodeSchoolStatus(s.udiseNumber);
          const cloudStatus = overrides[s.id];
          const finalStatus = codeStatus || cloudStatus || s.status || 'active';
          return { ...s, status: finalStatus };
        });
      });

      setCurrentSchool(prev => {
        if (!prev) return prev;
        if (deletedIds.includes(prev.id)) {
          return DEFAULT_INITIAL_SCHOOLS[0] || DEFAULT_INITIAL_SCHOOL;
        }
        const overrides = schoolService.getStatusOverrides();
        const codeStatus = getCodeSchoolStatus(prev.id) || getCodeSchoolStatus(prev.udiseNumber);
        const cloudStatus = overrides[prev.id];
        const finalStatus = codeStatus || cloudStatus || prev.status || 'active';
        return { ...prev, status: finalStatus };
      });
    });

    // 4. Real-time Firebase cloud listener across all devices (Desktop, Mobile, etc.)
    const unsubscribe = schoolService.subscribeToSchools((freshSchools) => {
      setAllSchools(freshSchools);
      setCurrentSchool(prev => {
        if (!prev) return prev;
        const match = freshSchools.find(s => s.id === prev.id);
        return match || prev;
      });
    });

    return () => {
      window.removeEventListener('shalaverse_schools_updated', handleSchoolsUpdated);
      unsubCloudStatus();
      unsubMasterSync();
      unsubscribe();
    };
  }, [loadSchools]);

  // Switch active school (Super Admin or preview)
  const selectSchool = (schoolIdOrSchool: string | School) => {
    let match: School | undefined;
    if (typeof schoolIdOrSchool === 'object' && schoolIdOrSchool !== null) {
      match = schoolIdOrSchool;
    } else {
      const schoolId = schoolIdOrSchool;
      match = allSchools.find(s => s.id === schoolId) || DEFAULT_INITIAL_SCHOOLS.find(s => s.id === schoolId);
      if (!match) {
        const cached = localStorage.getItem('shalaverse_schools_cache');
        if (cached) {
          try {
            const list = JSON.parse(cached);
            match = list.find((s: School) => s.id === schoolId);
          } catch {}
        }
      }
    }

    if (match) {
      setCurrentSchool(match);
      localStorage.setItem(ACTIVE_SCHOOL_STORAGE_KEY, match.id);
      // Also update local storage school settings so all existing components stay in sync
      localStorage.setItem('shalaverse_school_settings', JSON.stringify({
        schoolName: match.schoolName,
        schoolNameLocal: match.schoolNameLocal,
        udiseNumber: match.udiseNumber,
        boardAffiliation: match.boardAffiliation,
        recognitionNo: match.recognitionNo,
        affiliationNo: match.affiliationNo,
        boardName: match.boardName,
        address: match.address,
        phone: match.phone,
        email: match.email,
        website: match.website,
        academicYear: match.academicYear,
        headmasterName: match.headmasterName,
        logoUrl: match.logoUrl,
        tagline: match.tagline,
        schoolId: match.id
      }));
      window.dispatchEvent(new CustomEvent('shalaverse_active_school_changed', { detail: match }));
    }
  };

  const addSchool = async (data: Omit<School, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = await schoolService.createSchool(data);
    await loadSchools();
    return created;
  };

  const updateSchool = async (id: string, partial: Partial<School>) => {
    const updated = await schoolService.updateSchool(id, partial);
    await loadSchools();
    if (currentSchool?.id === id) {
      setCurrentSchool(updated);
    }
    return updated;
  };

  const deleteSchool = async (id: string) => {
    setAllSchools(prev => prev.filter(s => s.id !== id));
    await schoolService.deleteSchool(id);
    const refreshed = await schoolService.getAllSchools();
    setAllSchools(refreshed);
    if (currentSchool?.id === id) {
      const nextActive = refreshed.length > 0 ? refreshed[0] : null;
      setCurrentSchool(nextActive);
      if (nextActive) {
        selectSchool(nextActive.id);
      } else {
        localStorage.removeItem(ACTIVE_SCHOOL_STORAGE_KEY);
      }
    }
  };

  const toggleSchoolStatus = async (id: string, status: 'active' | 'inactive') => {
    setAllSchools(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    if (currentSchool?.id === id) {
      setCurrentSchool(prev => prev ? { ...prev, status } : null);
    }
    const updated = await schoolService.toggleSchoolStatus(id, status);
    setAllSchools(prev => prev.map(s => s.id === id ? { ...s, ...updated, status } : s));
    if (currentSchool?.id === id) {
      setCurrentSchool(prev => prev ? { ...prev, ...updated, status } : null);
    }
    return updated;
  };

  const bulkAddSchools = async (
    schools: Partial<School>[],
    onProgress?: (done: number, total: number) => void
  ) => {
    const res = await schoolService.bulkCreateSchools(schools, onProgress);
    await loadSchools();
    return res;
  };

  const resetBulkSchools = async (
    onProgress?: (done: number, total: number) => void
  ) => {
    setLoading(true);
    try {
      const res = await schoolService.resetBulkImportedSchools(onProgress);
      setAllSchools(DEFAULT_INITIAL_SCHOOLS);
      setCurrentSchool(DEFAULT_INITIAL_SCHOOL);
      localStorage.setItem(ACTIVE_SCHOOL_STORAGE_KEY, DEFAULT_INITIAL_SCHOOL.id);
      return res;
    } finally {
      setLoading(false);
    }
  };

  return (
    <SchoolContext.Provider
      value={{
        allSchools,
        currentSchool,
        loading,
        isSuperAdmin,
        selectSchool,
        refreshSchools: loadSchools,
        addSchool,
        updateSchool,
        deleteSchool,
        toggleSchoolStatus,
        bulkAddSchools,
        resetBulkSchools
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
}
