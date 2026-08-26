import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save, 
  School, 
  User, 
  Award, 
  Phone, 
  FileCheck2, 
  Languages,
  Sparkles,
  RefreshCw,
  Fingerprint
} from 'lucide-react';
import { Student, AdmissionClass } from '../../types';
import { CLASS_OPTIONS } from './StudentFilter';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { transliterateToDevanagari } from '../../utils/devanagariUtils';
import { generateStudentId } from '../../utils/studentIdGenerator';

interface StudentFormProps {
  initialData?: Partial<Student>;
  onSubmit: (data: Omit<Student, 'id'>) => Promise<void>;
  isEditing?: boolean;
  isLoading?: boolean;
}

export function StudentForm({
  initialData,
  onSubmit,
  isEditing = false,
  isLoading = false
}: StudentFormProps) {
  const { t } = useLanguage();
  const { settings } = useSettings();
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState<Omit<Student, 'id'>>({
    studentId: initialData?.studentId || `STU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    grNumber: initialData?.grNumber || '',
    admissionYear: initialData?.admissionYear || settings.academicYear || '2026-2027',
    admissionDate: initialData?.admissionDate || new Date().toISOString().split('T')[0],
    admissionClass: (initialData?.admissionClass as AdmissionClass) || '9th',

    studentName: initialData?.studentName || '',
    studentNameLocal: initialData?.studentNameLocal || '',
    fatherName: initialData?.fatherName || '',
    fatherNameLocal: initialData?.fatherNameLocal || '',
    motherName: initialData?.motherName || '',
    motherNameLocal: initialData?.motherNameLocal || '',
    birthDate: initialData?.birthDate || '',
    birthPlace: initialData?.birthPlace || 'Pune, Maharashtra',
    birthPlaceLocal: initialData?.birthPlaceLocal || '',
    nationality: initialData?.nationality || 'Indian',
    motherTongue: initialData?.motherTongue || 'Marathi',

    religion: initialData?.religion || 'Hindu',
    caste: initialData?.caste || 'Open',
    casteLocal: initialData?.casteLocal || '',
    subCaste: initialData?.subCaste || '',
    subCasteLocal: initialData?.subCasteLocal || '',
    uid: initialData?.uid || '',

    previousSchool: initialData?.previousSchool || '',
    previousSchoolLocal: initialData?.previousSchoolLocal || '',

    mobile: initialData?.mobile || '',
    address: initialData?.address || '',
    addressLocal: initialData?.addressLocal || '',

    academicProgress: initialData?.academicProgress || 'Good',
    behaviour: initialData?.behaviour || 'Good',
    leavingReason: initialData?.leavingReason || '',
    certificateDate: initialData?.certificateDate || '',
    headmasterSignature: initialData?.headmasterSignature || settings.headmasterName || 'Headmaster'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);

  const handleChange = (field: keyof Omit<Student, 'id'>, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-suggest local field if local is empty and user types English
      if (field === 'studentName' && !prev.studentNameLocal) {
        updated.studentNameLocal = transliterateToDevanagari(value);
      }
      if (field === 'fatherName' && !prev.fatherNameLocal) {
        updated.fatherNameLocal = transliterateToDevanagari(value);
      }
      if (field === 'motherName' && !prev.motherNameLocal) {
        updated.motherNameLocal = transliterateToDevanagari(value);
      }
      if (field === 'birthPlace' && !prev.birthPlaceLocal) {
        updated.birthPlaceLocal = transliterateToDevanagari(value);
      }
      if (field === 'caste' && !prev.casteLocal) {
        updated.casteLocal = transliterateToDevanagari(value);
      }

      return updated;
    });

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleRegenerateStudentId = (forceRandom: boolean = false) => {
    const newId = forceRandom 
      ? generateStudentId('', formData.admissionYear) 
      : generateStudentId(formData.grNumber, formData.admissionYear);
    setFormData(prev => ({ ...prev, studentId: newId }));
  };

  const handleBlur = (field: keyof Omit<Student, 'id'>) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const autoFillMarathi = () => {
    setFormData(prev => ({
      ...prev,
      studentNameLocal: transliterateToDevanagari(prev.studentName),
      fatherNameLocal: transliterateToDevanagari(prev.fatherName),
      motherNameLocal: transliterateToDevanagari(prev.motherName),
      birthPlaceLocal: transliterateToDevanagari(prev.birthPlace),
      casteLocal: transliterateToDevanagari(prev.caste),
      subCasteLocal: transliterateToDevanagari(prev.subCaste),
      previousSchoolLocal: transliterateToDevanagari(prev.previousSchool),
      addressLocal: transliterateToDevanagari(prev.address),
    }));
  };

  const validateField = (field: keyof Omit<Student, 'id'>, value: any): boolean => {
    let err = '';
    if (field === 'studentName' && (!value || !value.trim())) {
      err = t('nameRequired');
    } else if (field === 'grNumber' && (!value || !value.trim())) {
      err = t('grRequired');
    } else if (field === 'admissionYear' && (!value || !value.trim())) {
      err = t('yearRequired');
    } else if (field === 'admissionClass' && !value) {
      err = t('classRequired');
    } else if (field === 'birthDate' && !value) {
      err = t('dobRequired');
    } else if (field === 'mobile' && value) {
      const cleanMobile = value.replace(/\s+/g, '').replace(/[^0-9]/g, '');
      if (cleanMobile.length > 0 && cleanMobile.length < 10) {
        err = t('mobileInvalid');
      }
    } else if (field === 'uid' && value) {
      const cleanUid = value.replace(/\s+/g, '').replace(/[^0-9]/g, '');
      if (cleanUid.length > 0 && cleanUid.length !== 12) {
        err = t('uidInvalid');
      }
    }

    setErrors(prev => ({ ...prev, [field]: err }));
    return !err;
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.studentName.trim()) newErrors.studentName = t('nameRequired');
    if (!formData.grNumber.trim()) newErrors.grNumber = t('grRequired');
    if (!formData.admissionYear.trim()) newErrors.admissionYear = t('yearRequired');
    if (!formData.admissionClass) newErrors.admissionClass = t('classRequired');
    if (!formData.birthDate) newErrors.birthDate = t('dobRequired');

    if (formData.mobile) {
      const cleanMobile = formData.mobile.replace(/\s+/g, '').replace(/[^0-9]/g, '');
      if (cleanMobile.length > 0 && cleanMobile.length < 10) {
        newErrors.mobile = t('mobileInvalid');
      }
    }

    if (formData.uid) {
      const cleanUid = formData.uid.replace(/\s+/g, '').replace(/[^0-9]/g, '');
      if (cleanUid.length > 0 && cleanUid.length !== 12) {
        newErrors.uid = t('uidInvalid');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateAll()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Banner & Instructions */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            {isEditing ? t('editStudent') : t('addStudent')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            General Register (G.R.) Entry Form • bilingual English & Marathi / Devanagari support
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={autoFillMarathi}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold hover:bg-orange-100 transition shadow-xs"
            title="Auto-fill Marathi names and terms from English"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>मराठी नाव स्वयंचलित भरा</span>
          </button>
          <span className="hidden sm:inline-block text-xs font-semibold text-blue-900 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
            Academic Year: {settings.academicYear || '2026-2027'}
          </span>
        </div>
      </div>

      {/* SECTION 1: ADMISSION INFORMATION */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center gap-2">
          <School className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-bold tracking-wide uppercase">
            Section 1: {t('admissionInfo')}
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {/* GR Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              G.R. Number <span className="text-red-500">*</span>
            </label>
            <input
              id="input-gr-number"
              type="text"
              required
              value={formData.grNumber}
              onChange={(e) => {
                const val = e.target.value;
                handleChange('grNumber', val);
                // If studentId matches generic STU pattern, auto-sync with GR
                if (!formData.studentId || formData.studentId.startsWith('STU-')) {
                  setFormData(prev => ({
                    ...prev,
                    studentId: generateStudentId(val, prev.admissionYear)
                  }));
                }
              }}
              onBlur={() => handleBlur('grNumber')}
              placeholder="e.g. 4125"
              className={`w-full px-3.5 py-2.5 rounded-lg border font-mono font-bold text-sm transition ${
                errors.grNumber 
                  ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-500' 
                  : 'border-slate-300 bg-slate-50 focus:bg-white focus:ring-blue-600'
              }`}
            />
            {errors.grNumber && <p className="text-xs text-red-600 mt-1">{errors.grNumber}</p>}
          </div>

          {/* Student ID (Auto-Generated Unique ID) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Student ID <span className="text-blue-600 font-semibold">(Auto)</span>
              </label>
              <button
                type="button"
                id="btn-regenerate-student-id"
                onClick={() => handleRegenerateStudentId(false)}
                title="Regenerate Student ID"
                className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>रीसेट</span>
              </button>
            </div>
            <div className="relative">
              <input
                id="input-student-id"
                type="text"
                required
                value={formData.studentId}
                onChange={(e) => handleChange('studentId', e.target.value)}
                placeholder="STU-2026-4125"
                className="w-full px-3 py-2.5 rounded-lg border border-blue-300 bg-blue-50/60 font-mono font-bold text-sm text-blue-900 focus:bg-white focus:ring-blue-600 transition"
              />
              <Fingerprint className="w-4 h-4 text-blue-500 absolute right-2.5 top-3 pointer-events-none opacity-60" />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">विद्यार्थी युनिक ओळख आयडी</p>
          </div>

          {/* Admission Year */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Admission Year <span className="text-red-500">*</span>
            </label>
            <input
              id="input-admission-year"
              type="text"
              required
              value={formData.admissionYear}
              onChange={(e) => handleChange('admissionYear', e.target.value)}
              onBlur={() => handleBlur('admissionYear')}
              placeholder="e.g. 2026-2027"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm font-medium focus:bg-white focus:ring-blue-600"
            />
            {errors.admissionYear && <p className="text-xs text-red-600 mt-1">{errors.admissionYear}</p>}
          </div>

          {/* Admission Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Admission Date <span className="text-red-500">*</span>
            </label>
            <input
              id="input-admission-date"
              type="date"
              required
              value={formData.admissionDate}
              onChange={(e) => handleChange('admissionDate', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
            />
          </div>

          {/* Admission Class */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Admission Class <span className="text-red-500">*</span>
            </label>
            <select
              id="select-form-class"
              required
              value={formData.admissionClass}
              onChange={(e) => handleChange('admissionClass', e.target.value as AdmissionClass)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm font-bold text-blue-900 focus:bg-white focus:ring-blue-600"
            >
              {CLASS_OPTIONS.map((cls) => (
                <option key={cls} value={cls}>
                  Class {cls}
                </option>
              ))}
            </select>
            {errors.admissionClass && <p className="text-xs text-red-600 mt-1">{errors.admissionClass}</p>}
          </div>
        </div>
      </div>

      {/* SECTION 2: PERSONAL INFORMATION */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold tracking-wide uppercase">
              Section 2: {t('personalInfo')}
            </h3>
          </div>
          <span className="flex items-center gap-1 text-xs text-slate-300 font-normal">
            <Languages className="w-3.5 h-3.5 text-orange-400" />
            English & मराठी दोन्ही मध्ये भरता येते
          </span>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Student Full Name (English) */}
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Student Full Name in English (Surname First) <span className="text-red-500">*</span>
            </label>
            <input
              id="input-student-name"
              type="text"
              required
              value={formData.studentName}
              onChange={(e) => handleChange('studentName', e.target.value)}
              onBlur={() => handleBlur('studentName')}
              placeholder="e.g. Deshmukh Prathamesh Rajesh"
              className={`w-full px-3.5 py-2.5 rounded-lg border font-bold text-sm transition ${
                errors.studentName 
                  ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-500' 
                  : 'border-slate-300 bg-slate-50 focus:bg-white focus:ring-blue-600'
              }`}
            />
            {errors.studentName && <p className="text-xs text-red-600 mt-1">{errors.studentName}</p>}
          </div>

          {/* Student Full Name (Marathi/Local) */}
          <div>
            <label className="block text-xs font-bold text-orange-950 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <span>विद्यार्थ्याचे नाव (मराठी/देवनागरी)</span>
              <span className="text-[10px] text-orange-600 lowercase">(ऐच्छिक)</span>
            </label>
            <input
              id="input-student-name-local"
              type="text"
              value={formData.studentNameLocal || ''}
              onChange={(e) => handleChange('studentNameLocal', e.target.value)}
              placeholder="उदा. देशमुख प्रथमेश राजेश"
              className="w-full px-3.5 py-2.5 rounded-lg border border-orange-300 bg-orange-50/40 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-orange-500"
            />
          </div>

          {/* Father's Name (English) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Father's Full Name (English)
            </label>
            <input
              id="input-father-name"
              type="text"
              value={formData.fatherName}
              onChange={(e) => handleChange('fatherName', e.target.value)}
              placeholder="e.g. Rajesh Vasantrao Deshmukh"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
            />
          </div>

          {/* Father's Name (Marathi) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              वडिलांचे नाव (मराठी)
            </label>
            <input
              id="input-father-name-local"
              type="text"
              value={formData.fatherNameLocal || ''}
              onChange={(e) => handleChange('fatherNameLocal', e.target.value)}
              placeholder="उदा. राजेश वसंतराव देशमुख"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
            />
          </div>

          {/* Mother's Name (English) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mother's Name (English)
            </label>
            <input
              id="input-mother-name"
              type="text"
              value={formData.motherName}
              onChange={(e) => handleChange('motherName', e.target.value)}
              placeholder="e.g. Sunita Rajesh Deshmukh"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
            />
          </div>

          {/* Mother's Name (Marathi) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              आईचे नाव (मराठी)
            </label>
            <input
              id="input-mother-name-local"
              type="text"
              value={formData.motherNameLocal || ''}
              onChange={(e) => handleChange('motherNameLocal', e.target.value)}
              placeholder="उदा. सुनिता राजेश देशमुख"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Date of Birth (DOB) <span className="text-red-500">*</span>
            </label>
            <input
              id="input-birth-date"
              type="date"
              required
              value={formData.birthDate}
              onChange={(e) => handleChange('birthDate', e.target.value)}
              onBlur={() => handleBlur('birthDate')}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
            />
            {errors.birthDate && <p className="text-xs text-red-600 mt-1">{errors.birthDate}</p>}
          </div>

          {/* Birth Place */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Birth Place (Town / Tal / Dist)
            </label>
            <input
              id="input-birth-place"
              type="text"
              value={formData.birthPlace}
              onChange={(e) => handleChange('birthPlace', e.target.value)}
              placeholder="e.g. Chikhli, Dist Buldhana"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
            />
          </div>

          {/* Birth Place (Marathi) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              जन्मस्थळ (मराठी)
            </label>
            <input
              id="input-birth-place-local"
              type="text"
              value={formData.birthPlaceLocal || ''}
              onChange={(e) => handleChange('birthPlaceLocal', e.target.value)}
              placeholder="उदा. चिखली, जि. बुलढाणा"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
            />
          </div>

          {/* Nationality */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nationality / राष्ट्रीयत्व
            </label>
            <input
              id="input-nationality"
              type="text"
              value={formData.nationality}
              onChange={(e) => handleChange('nationality', e.target.value)}
              placeholder="Default: Indian"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
            />
          </div>

          {/* Mother Tongue */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mother Tongue / मातृभाषा
            </label>
            <input
              id="input-mother-tongue"
              type="text"
              value={formData.motherTongue}
              onChange={(e) => handleChange('motherTongue', e.target.value)}
              placeholder="Default: Marathi"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: CASTE & IDENTITY INFORMATION */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-bold tracking-wide uppercase">
            Section 3: {t('casteIdentity')}
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Religion */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Religion / धर्म
            </label>
            <input
              id="input-religion"
              type="text"
              value={formData.religion}
              onChange={(e) => handleChange('religion', e.target.value)}
              placeholder="e.g. Hindu / Muslim / Jain"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
            />
          </div>

          {/* Caste */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Caste / Category / जात
            </label>
            <input
              id="input-caste"
              type="text"
              value={formData.caste}
              onChange={(e) => handleChange('caste', e.target.value)}
              placeholder="e.g. Maratha / OBC / SC / ST"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
            />
          </div>

          {/* Sub-Caste */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Sub-Caste / पोटजात
            </label>
            <input
              id="input-subcaste"
              type="text"
              value={formData.subCaste}
              onChange={(e) => handleChange('subCaste', e.target.value)}
              placeholder="e.g. 96 Kuli / Kunbi / Mali"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
            />
          </div>

          {/* Aadhaar UID */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              UID / Aadhaar Number (12 Digits)
            </label>
            <input
              id="input-uid"
              type="text"
              maxLength={14}
              value={formData.uid}
              onChange={(e) => handleChange('uid', e.target.value)}
              onBlur={() => handleBlur('uid')}
              placeholder="e.g. 4589 1234 5678"
              className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-sm transition ${
                errors.uid 
                  ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-500' 
                  : 'border-slate-300 bg-slate-50 focus:bg-white focus:ring-blue-600'
              }`}
            />
            {errors.uid && <p className="text-xs text-red-600 mt-1">{errors.uid}</p>}
          </div>
        </div>
      </div>

      {/* SECTION 4: PREVIOUS SCHOOL & SECTION 5: CONTACT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 4: Previous School */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center gap-2">
            <School className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold tracking-wide uppercase">
              Section 4: {t('previousSchoolInfo')}
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Previous School Name & Class Attended (English)
              </label>
              <textarea
                id="input-previous-school"
                rows={2}
                value={formData.previousSchool}
                onChange={(e) => handleChange('previousSchool', e.target.value)}
                placeholder="e.g. Adarsh High School, Chikhli (Class 8th Passed)"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                यापूर्वीची शाळा (मराठी/देवनागरी)
              </label>
              <textarea
                id="input-previous-school-local"
                rows={2}
                value={formData.previousSchoolLocal || ''}
                onChange={(e) => handleChange('previousSchoolLocal', e.target.value)}
                placeholder="उदा. आदर्श हायस्कूल, चिखली (इयत्ता ८ वी उत्तीर्ण)"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Contact Information */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center gap-2">
            <Phone className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold tracking-wide uppercase">
              Section 5: {t('contactInfo')}
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mobile Number (10 Digits)
              </label>
              <input
                id="input-mobile"
                type="tel"
                value={formData.mobile}
                onChange={(e) => handleChange('mobile', e.target.value)}
                onBlur={() => handleBlur('mobile')}
                placeholder="e.g. 98221 45678"
                className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-sm transition ${
                  errors.mobile 
                    ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-500' 
                    : 'border-slate-300 bg-slate-50 focus:bg-white focus:ring-blue-600'
                }`}
              />
              {errors.mobile && <p className="text-xs text-red-600 mt-1">{errors.mobile}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Residential Address / पत्ता
              </label>
              <textarea
                id="input-address"
                rows={2}
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="e.g. At Post Chikhli, Shivaji Nagar, Dist Buldhana - 443201"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 6: SCHOOL RECORD INFORMATION */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-bold tracking-wide uppercase">
            Section 6: {t('schoolRecordInfo')}
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Academic Progress */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Academic Progress / प्रगती
            </label>
            <input
              id="input-progress"
              type="text"
              value={formData.academicProgress}
              onChange={(e) => handleChange('academicProgress', e.target.value)}
              placeholder="e.g. Good / Excellent / उत्तम"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
            />
          </div>

          {/* Conduct / Behaviour */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Conduct & Behaviour / वर्तणूक
            </label>
            <input
              id="input-behaviour"
              type="text"
              value={formData.behaviour}
              onChange={(e) => handleChange('behaviour', e.target.value)}
              placeholder="e.g. Good / Very Good / उत्तम"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
            />
          </div>

          {/* Reason for Leaving School */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Reason for Leaving School / शाळा सोडण्याचे कारण
            </label>
            <input
              id="input-leaving-reason"
              type="text"
              value={formData.leavingReason}
              onChange={(e) => handleChange('leavingReason', e.target.value)}
              placeholder="e.g. Parent Transfer / Higher Education"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
            />
          </div>

          {/* Certificate Issue Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Certificate Issue Date / दाखला दिनांक
            </label>
            <input
              id="input-certificate-date"
              type="date"
              value={formData.certificateDate}
              onChange={(e) => handleChange('certificateDate', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
            />
          </div>

          {/* Headmaster Signature Authority */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Headmaster / Principal Authority Title
            </label>
            <input
              id="input-headmaster-sig"
              type="text"
              value={formData.headmasterSignature}
              onChange={(e) => handleChange('headmasterSignature', e.target.value)}
              placeholder="e.g. Principal, Shree Shivaji High School and Junior College, Chikhli"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-end gap-3 sticky bottom-4 z-20">
        <button
          type="button"
          id="btn-form-cancel"
          onClick={() => navigate('/students')}
          disabled={isLoading}
          className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition"
        >
          {t('cancel')}
        </button>

        <button
          type="submit"
          id="btn-form-save"
          disabled={isLoading}
          className="px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-md transition flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isLoading ? t('saving') : (isEditing ? t('update') : t('save'))}</span>
        </button>
      </div>
    </form>
  );
}
