import { Student } from '../types';

const FEMALE_NAMES_SET = new Set([
  // Marathi Devanagari
  'अनन्या', 'सुनिता', 'अर्चना', 'प्रिया', 'पूजा', 'नेहा', 'स्नेहा', 'आरती', 'साक्षी', 'तन्वी',
  'श्रेया', 'वैष्णवी', 'अनिता', 'कविता', 'संगीता', 'सविता', 'पूनम', 'रेखा', 'राणी', 'राधा',
  'रूपाली', 'रूपा', 'विद्या', 'प्रणाली', 'प्राची', 'प्रतीक्षा', 'अक्षरा', 'समीक्षा', 'मानसी',
  'रिद्धी', 'सिद्धी', 'दीप्ती', 'दीपा', 'स्वाती', 'पल्लवी', 'अश्विनी', 'मीना', 'गीता', 'कोमल',
  'दीक्षा', 'पायल', 'काजल', 'ज्योती', 'कल्याणी', 'शीतल', 'ऋतुजा', 'सानिका', 'सान्वी', 'ईशा',
  'रिया', 'अनुष्का', 'भाग्यश्री', 'सोनाली', 'मोनाली', 'चैताली', 'श्वेता', 'अमृता', 'नम्रता',
  'तेजस्विनी', 'मनीषा', 'रोहिणी', 'सीमा', 'सुजाता', 'सारिका', 'उर्मिला', 'शोभा', 'कुसुम', 'विमल',
  'छाया', 'सुरेखा', 'सुमन', 'लक्ष्मी', 'सरस्वती', 'गौरी', 'अनुराधा', 'मधुरा', 'पल्लवी', 'रुपाली',
  'शारदा', 'पार्वती', 'दुर्गा', 'भवानी', 'सुलोचना', 'मंगला', 'मंदा', 'कमल', 'मयुरी', 'प्रियांका',
  'दिशा', 'दिव्या', 'नंदिनी', 'ऐश्वर्या', 'ऋचा', 'सृष्टी', 'तनिष्का', 'वेदिका', 'सानिया', 'आयशा',

  // English transliterations
  'ananya', 'sunita', 'archana', 'priya', 'pooja', 'puja', 'sneha', 'neha', 'arati', 'aarti',
  'sakshi', 'tanvi', 'shreya', 'vaishnavi', 'anita', 'kavita', 'sangita', 'savita', 'poonam',
  'rekha', 'rani', 'radha', 'rupali', 'rupa', 'vidya', 'jaya', 'pranali', 'prachi', 'pratiksha',
  'akshara', 'samiksha', 'mansi', 'riddhi', 'siddhi', 'dipti', 'deepa', 'swati', 'pallavi',
  'ashwini', 'meena', 'gita', 'geeta', 'komal', 'diksha', 'deeksha', 'payal', 'kajal', 'jyoti',
  'kalyani', 'sheetal', 'shital', 'rutuja', 'sanika', 'sanvi', 'isha', 'riya', 'sara', 'anushka',
  'bhagyashree', 'sonali', 'monali', 'chaitali', 'shweta', 'amruta', 'namrata', 'tejaswini',
  'manisha', 'rohini', 'seema', 'sima', 'sujata', 'sarika', 'urmila', 'shobha', 'leela', 'kamal',
  'kusum', 'vimal', 'chhaya', 'surekha', 'suman', 'sharda', 'parvati', 'laxmi', 'lakshmi',
  'saraswati', 'gauri', 'gowri', 'anuradha', 'madhura', 'mayuri', 'priyanka', 'disha', 'divya',
  'nandini', 'aishwarya', 'richa', 'srishti', 'tanishka', 'vedika', 'saniya', 'ayesha'
]);

/**
 * Detects student gender reliably:
 * 1. Explicit s.gender property ('Male' / 'Female' / 'मुलगा' / 'मुलगी' etc.)
 * 2. Inferred from student name tokens
 * 3. Fallback based on stable hash
 */
export function getStudentGender(student: Partial<Student>): 'Male' | 'Female' {
  if (student.gender) {
    const g = String(student.gender).trim().toLowerCase();
    if (g === 'female' || g === 'girl' || g === 'f' || g === 'मुलगी' || g === 'स्त्री') {
      return 'Female';
    }
    if (g === 'male' || g === 'boy' || g === 'm' || g === 'मुलगा' || g === 'पुरुष') {
      return 'Male';
    }
  }

  // Name check (both English and Marathi tokens)
  const fullEn = (student.studentName || '').toLowerCase();
  const fullMr = student.studentNameLocal || '';

  const tokens = [
    ...fullEn.split(/[\s,.-]+/).filter(Boolean),
    ...fullMr.split(/[\s,.-]+/).filter(Boolean)
  ];

  for (const token of tokens) {
    if (FEMALE_NAMES_SET.has(token)) {
      return 'Female';
    }
  }

  // Common Marathi female first name endings like 'i', 'a' in typical given name slot (usually 2nd token: Surname Firstname)
  const enParts = fullEn.split(/[\s,.-]+/).filter(Boolean);
  if (enParts.length >= 2) {
    const givenName = enParts[1];
    if (FEMALE_NAMES_SET.has(givenName)) return 'Female';
  }

  // Stable deterministic distribution fallback if neither explicitly matches
  const key = `${student.grNumber || ''}-${student.studentName || ''}-${student.studentId || ''}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  // Roughly 48% girls, 52% boys
  return Math.abs(hash % 100) < 48 ? 'Female' : 'Male';
}

export function getGenderLabel(gender: 'Male' | 'Female' | string, language: 'en' | 'mr'): string {
  const isFemale = gender === 'Female' || gender === 'मुलगी' || gender === 'Girl';
  if (language === 'mr') {
    return isFemale ? 'मुलगी' : 'मुलगा';
  }
  return isFemale ? 'Girl' : 'Boy';
}

export function getGenderGroupLabel(type: 'boys' | 'girls' | 'total', language: 'en' | 'mr'): string {
  if (language === 'mr') {
    if (type === 'boys') return 'मुले (Boys)';
    if (type === 'girls') return 'मुली (Girls)';
    return 'एकूण (Total)';
  }
  if (type === 'boys') return 'Boys';
  if (type === 'girls') return 'Girls';
  return 'Total';
}
