/**
 * Master Code-Level School Access Configuration
 * 
 * If you deactivate a school in VS Code / Git:
 * Add the school ID or UDISE number here with value 'inactive'.
 * When you commit to Git and push to Vercel, this takes IMMEDIATE effect
 * on ALL devices (Desktop, Mobile, Tablets, etc.) without any cache interference.
 * 
 * You DO NOT need to purchase a domain or separate hosting for this to work!
 * 
 * Example:
 *   'school_27040200119': 'inactive',
 *   '27040200119': 'inactive',
 */
export const CODE_SCHOOL_STATUS_CONFIG: Record<string, 'active' | 'inactive'> = {
  // Empty by default - Dynamic live control is handled directly via Super Admin Dashboard
};

/**
 * Check if a school is explicitly deactivated in code
 */
export function getCodeSchoolStatus(schoolIdOrUdise: string): 'active' | 'inactive' | null {
  if (!schoolIdOrUdise) return null;
  const clean = schoolIdOrUdise.trim();
  if (clean in CODE_SCHOOL_STATUS_CONFIG) {
    return CODE_SCHOOL_STATUS_CONFIG[clean];
  }
  const digits = clean.replace(/\D/g, '');
  if (digits && digits in CODE_SCHOOL_STATUS_CONFIG) {
    return CODE_SCHOOL_STATUS_CONFIG[digits];
  }
  return null;
}
