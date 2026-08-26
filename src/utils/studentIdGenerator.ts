/**
 * Utility functions for generating and formatting unique Student IDs (विद्यार्थी ओळख क्रमांक)
 */

export function generateStudentId(
  grNumber?: string,
  academicYear?: string,
  prefix: string = 'STU'
): string {
  // Extract 4-digit year from academic year like '2026-2027' or use current year
  let yearStr = new Date().getFullYear().toString();
  if (academicYear) {
    const match = academicYear.match(/\d{4}/);
    if (match) {
      yearStr = match[0];
    }
  }

  // If GR number is provided, clean and pad it
  if (grNumber && grNumber.trim()) {
    const cleanGR = grNumber.trim().replace(/\s+/g, '');
    return `${prefix}-${yearStr}-${cleanGR}`;
  }

  // Random 4-digit unique suffix
  const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
  return `${prefix}-${yearStr}-${randomSuffix}`;
}

export function generateSequentialStudentId(
  index: number,
  academicYear?: string,
  prefix: string = 'STU'
): string {
  let yearStr = new Date().getFullYear().toString();
  if (academicYear) {
    const match = academicYear.match(/\d{4}/);
    if (match) {
      yearStr = match[0];
    }
  }

  const paddedNum = (index + 1).toString().padStart(4, '0');
  return `${prefix}-${yearStr}-${paddedNum}`;
}
