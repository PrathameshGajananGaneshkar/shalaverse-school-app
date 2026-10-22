export type Language = 'en' | 'mr';

export type AdmissionClass = 
  | '1st' | '2nd' | '3rd' | '4th' | '5th' 
  | '6th' | '7th' | '8th' | '9th' | '10th' 
  | '11th' | '12th';

export interface Student {
  id?: string;
  studentId: string;
  grNumber: string;
  admissionYear: string;
  admissionDate: string;
  admissionClass: AdmissionClass;

  // Personal Information
  studentName: string;
  studentNameLocal?: string; // Regional (Marathi / Devanagari)
  gender?: 'Male' | 'Female' | 'Other' | string;
  genderLocal?: string; // लिंग: मुलगा / मुलगी / इतर
  fatherName: string;
  fatherNameLocal?: string;
  motherName: string;
  motherNameLocal?: string;
  birthDate: string;
  birthPlace: string;
  birthPlaceLocal?: string;
  nationality: string;
  motherTongue: string;

  // Caste & Identity
  religion: string;
  religionLocal?: string;
  caste: string;
  casteLocal?: string;
  subCaste: string;
  subCasteLocal?: string;
  uid: string; // Aadhaar / UID number

  // Previous School
  previousSchool: string;
  previousSchoolLocal?: string;

  // Contact
  mobile: string;
  address: string;
  addressLocal?: string;

  // School Record Information
  academicProgress: string;
  academicProgressLocal?: string;
  behaviour: string;
  behaviourLocal?: string;
  leavingReason: string;
  leavingReasonLocal?: string;
  certificateDate: string;
  headmasterSignature?: string;

  // School Ownership
  schoolId?: string;

  // Timestamps
  createdAt?: string | number | Date;
  updatedAt?: string | number | Date;
}

export interface School {
  id: string; // unique ID e.g. "school_27070200119"
  schoolName: string;
  schoolNameLocal: string; // Marathi name
  udiseNumber: string;
  boardAffiliation: string;
  recognitionNo?: string;
  affiliationNo?: string;
  boardName?: string;
  address: string;
  phone: string;
  email: string; // Single login email for the school
  password?: string; // Login password for the school
  securityPin?: string;
  website?: string;
  academicYear: string;
  headmasterName: string;
  logoUrl?: string;
  tagline?: string;
  status: 'active' | 'inactive';
  subscriptionPlan?: string;
  expiryDate?: string;
  studentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolSettings {
  schoolName: string;
  schoolNameLocal?: string; // Regional language title
  udiseNumber: string;
  boardAffiliation: string;
  recognitionNo?: string;
  affiliationNo?: string;
  boardName?: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  academicYear: string;
  headmasterName: string;
  logoUrl: string;
  tagline?: string;
  schoolId?: string;
}

export interface DocumentLog {
  id?: string;
  documentType: 'TC' | 'BONAFIDE' | 'NIRGAM_UTARA';
  studentId: string;
  studentName: string;
  grNumber: string;
  studentClass: string;
  issuedDate: string;
  academicYear: string;
  issuedBy: string;
  purpose?: string;
  schoolId?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'school' | 'admin' | 'principal' | 'teacher' | 'clerk';
  schoolId?: string;
}
