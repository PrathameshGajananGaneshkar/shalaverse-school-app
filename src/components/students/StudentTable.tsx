import { useState, useEffect, useMemo } from 'react';
import { Eye, Edit3, Trash2, UserPlus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Student } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { Badge } from '../common/Badge';

interface StudentTableProps {
  students: Student[];
  onView: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onAddNew?: () => void;
  isLoading?: boolean;
}

export function StudentTable({
  students,
  onView,
  onEdit,
  onDelete,
  onAddNew,
  isLoading
}: StudentTableProps) {
  const { t, language } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Reset to page 1 whenever students list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [students.length]);

  const totalPages = Math.ceil(students.length / pageSize) || 1;
  const validPage = Math.min(Math.max(currentPage, 1), totalPages);

  const paginatedStudents = useMemo(() => {
    const startIndex = (validPage - 1) * pageSize;
    return students.slice(startIndex, startIndex + pageSize);
  }, [students, validPage, pageSize]);

  if (students.length === 0 && !isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">{t('noStudentsFound')}</h3>
        <p className="text-sm text-slate-500 mb-5 max-w-md mx-auto">
          {t('noMatchingFound')}
        </p>
        {onAddNew && (
          <button
            type="button"
            id="btn-empty-add-student"
            onClick={onAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-xs transition"
          >
            <UserPlus className="w-4 h-4" />
            {t('addStudent')}
          </button>
        )}
      </div>
    );
  }

  const startRecord = (validPage - 1) * pageSize + 1;
  const endRecord = Math.min(validPage * pageSize, students.length);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top summary bar for large datasets */}
      {students.length > 50 && (
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 font-semibold gap-2">
          <span>
            {language === 'mr' ? (
              <>एकूण <strong className="text-blue-900 font-bold">{students.length}</strong> विद्यार्थ्यांपैकी {startRecord} ते {endRecord} दाखवत आहे</>
            ) : (
              <>Showing {startRecord} to {endRecord} of <strong className="text-blue-900 font-bold">{students.length}</strong> students</>
            )}
          </span>
          <div className="flex items-center gap-2">
            <span>{language === 'mr' ? 'प्रति पान:' : 'Per Page:'}</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-700"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-900 text-white font-semibold border-b border-slate-800">
              <th className="py-3.5 px-4 sm:px-6 w-28 whitespace-nowrap">{language === 'mr' ? 'जी.आर. क्र.' : 'GR No.'}</th>
              <th className="py-3.5 px-4 sm:px-6 w-36 whitespace-nowrap">{language === 'mr' ? 'विद्यार्थी आयडी' : 'Student ID'}</th>
              <th className="py-3.5 px-4 sm:px-6">{language === 'mr' ? 'विद्यार्थ्याचे नाव' : 'Student Name'}</th>
              <th className="py-3.5 px-4 sm:px-6 w-28 whitespace-nowrap">{language === 'mr' ? 'इयत्ता' : 'Class'}</th>
              <th className="py-3.5 px-4 sm:px-6 w-32 whitespace-nowrap">{language === 'mr' ? 'प्रवेश वर्ष' : 'Admission Year'}</th>
              <th className="py-3.5 px-4 sm:px-6 w-48 text-right whitespace-nowrap">{language === 'mr' ? 'कृती' : 'Action'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedStudents.map((student, idx) => (
              <tr
                key={student.id || student.studentId || idx}
                className="hover:bg-blue-50/40 transition-colors group"
              >
                {/* GR No */}
                <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                  <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                    {student.grNumber || '-'}
                  </span>
                </td>

                {/* Student ID */}
                <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                    {student.studentId || (student.grNumber ? `STU-${student.admissionYear?.slice(0, 4) || '2026'}-${student.grNumber}` : '-')}
                  </span>
                </td>

                {/* Student Name & Father's Name */}
                <td className="py-3.5 px-4 sm:px-6">
                  <div>
                    <span className="font-bold text-slate-900 block leading-tight">
                      {student.studentName}
                    </span>
                    {student.fatherName && (
                      <span className="text-xs text-slate-500 block mt-0.5">
                        {language === 'mr' ? 'पालक: ' : 'S/O / D/O: '}{student.fatherName}
                      </span>
                    )}
                  </div>
                </td>

                {/* Class */}
                <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                  <Badge variant="blue" size="sm">
                    {language === 'mr' ? `इयत्ता ${student.admissionClass}` : `Class ${student.admissionClass}`}
                  </Badge>
                </td>

                {/* Admission Year */}
                <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-slate-600 font-medium">
                  {student.admissionYear || '-'}
                </td>

                {/* Action Buttons: Strict ONE-LINE layout with specific colors */}
                <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                  <div className="inline-flex items-center justify-end gap-1.5 flex-nowrap">
                    {/* View Button - Blue */}
                    <button
                      id={`btn-view-${student.grNumber || student.id}`}
                      type="button"
                      onClick={() => onView(student)}
                      title={t('view')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t('view')}</span>
                    </button>

                    {/* Edit Button - Green */}
                    <button
                      id={`btn-edit-${student.grNumber || student.id}`}
                      type="button"
                      onClick={() => onEdit(student)}
                      title={t('edit')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-xs transition shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{t('edit')}</span>
                    </button>

                    {/* Delete Button - Red */}
                    <button
                      id={`btn-delete-${student.grNumber || student.id}`}
                      type="button"
                      onClick={() => onDelete(student)}
                      title={t('delete')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold shadow-xs transition shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('delete')}</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            {language === 'mr' ? (
              <>पान <strong className="text-slate-800">{validPage}</strong> / <strong>{totalPages}</strong> (एकूण {students.length} विद्यार्थी)</>
            ) : (
              <>Page <strong className="text-slate-800">{validPage}</strong> of <strong>{totalPages}</strong> (Total {students.length} students)</>
            )}
          </div>
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={validPage <= 1}
              className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title={language === 'mr' ? 'पहिले पान' : 'First Page'}
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={validPage <= 1}
              className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 text-xs font-semibold px-2.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{language === 'mr' ? 'मागे' : 'Prev'}</span>
            </button>

            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-200">
              {validPage}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={validPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 text-xs font-semibold px-2.5"
            >
              <span>{language === 'mr' ? 'पुढे' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={validPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title={language === 'mr' ? 'शेवटचे पान' : 'Last Page'}
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
