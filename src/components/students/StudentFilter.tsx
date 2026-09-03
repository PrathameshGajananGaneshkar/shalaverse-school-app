import { Search, Filter, RotateCcw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { AdmissionClass } from '../../types';

interface StudentFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedYear: string;
  onYearChange: (value: string) => void;
  selectedClass: string;
  onClassChange: (value: string) => void;
  onReset: () => void;
  years: string[];
  totalResults: number;
}

export const CLASS_OPTIONS: AdmissionClass[] = [
  '5th', '6th', '7th', '8th', '9th', '10th',
  '11th', '12th'
];

export function StudentFilter({
  searchTerm,
  onSearchChange,
  selectedYear,
  onYearChange,
  selectedClass,
  onClassChange,
  onReset,
  years,
  totalResults
}: StudentFilterProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs mb-6 print:hidden">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 sm:gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-student-search"
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          {/* Admission Year Filter */}
          <div className="w-full sm:w-44">
            <select
              id="select-admission-year"
              value={selectedYear}
              onChange={(e) => onYearChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            >
              <option value="">{t('allYears')}</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div className="w-full sm:w-40">
            <select
              id="select-admission-class"
              value={selectedClass}
              onChange={(e) => onClassChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            >
              <option value="">{t('allClasses')}</option>
              {CLASS_OPTIONS.map((cls) => (
                <option key={cls} value={cls}>
                  Class {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Reset button */}
          {(searchTerm || selectedYear || selectedClass) && (
            <button
              id="btn-reset-filters"
              type="button"
              onClick={onReset}
              title="Reset Filters"
              className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition flex items-center gap-1.5 shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter result status count */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5 font-medium">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          Showing <strong>{totalResults}</strong> student record{totalResults === 1 ? '' : 's'}
        </span>
        {(searchTerm || selectedYear || selectedClass) && (
          <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] font-semibold">
            Filtered View
          </span>
        )}
      </div>
    </div>
  );
}
