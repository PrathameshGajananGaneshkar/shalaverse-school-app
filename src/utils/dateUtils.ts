// Format YYYY-MM-DD to DD/MM/YYYY
export function formatDate(dateString?: string | null): string {
  if (!dateString) return '-';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch {
    // fallback
  }
  return dateString;
}

// Convert numbers 0-99 to English words
const EN_ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const EN_TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function enNumberToWords(num: number): string {
  if (num === 0) return 'Zero';
  if (num < 20) return EN_ONES[num];
  if (num < 100) return EN_TENS[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + EN_ONES[num % 10] : '');
  if (num < 1000) return EN_ONES[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + enNumberToWords(num % 100) : '');
  if (num < 100000) return enNumberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + enNumberToWords(num % 1000) : '');
  return String(num);
}

const EN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Marathi Date in Words
const MR_DAYS = [
  '', 'एक', 'दोन', 'तीन', 'चार', 'पाच', 'सहा', 'सात', 'आठ', 'नऊ', 'दहा',
  'अकरा', 'बारा', 'तेरा', 'चौदा', 'पंधरा', 'सोळा', 'सतरा', 'अठरा', 'एकोणीस', 'वीस',
  'एकवीस', 'बावीस', 'तेवीस', 'चोवीस', 'पंचवीस', 'सव्वीस', 'सत्तावीस', 'अठ्ठावीस', 'एकोणतीस', 'तीस', 'एकतीस'
];

const MR_MONTHS = [
  'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून',
  'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'
];

const MR_ONES = ['', 'एक', 'दोन', 'तीन', 'चार', 'पाच', 'सहा', 'सात', 'आठ', 'नऊ'];
const MR_TENS_10_TO_99 = [
  '', 'दहा', 'वीस', 'तीस', 'चाळीस', 'पन्नास', 'साठ', 'सत्तर', 'ऐंशी', 'नव्वद'
];

function mrYearToWords(year: number): string {
  if (year >= 2000 && year < 2100) {
    const rem = year - 2000;
    if (rem === 0) return 'दोन हजार';
    if (rem <= 31) return `दोन हजार ${MR_DAYS[rem] || rem}`;
    return `दोन हजार ${rem}`;
  }
  if (year >= 1900 && year < 2000) {
    const rem = year - 1900;
    return `एकोणीसशे ${rem}`;
  }
  return String(year);
}

// Hindi Date in Words
const HI_DAYS = [
  '', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस',
  'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस', 'बीस',
  'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाईस', 'उनतीस', 'तीस', 'इकतीस'
];

const HI_MONTHS = [
  'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
];

function hiYearToWords(year: number): string {
  if (year >= 2000 && year < 2100) {
    const rem = year - 2000;
    if (rem === 0) return 'दो हज़ार';
    if (rem <= 31) return `दो हज़ार ${HI_DAYS[rem] || rem}`;
    return `दो हज़ार ${rem}`;
  }
  if (year >= 1900 && year < 2000) {
    const rem = year - 1900;
    return `उन्नीस सौ ${rem}`;
  }
  return String(year);
}

export function dateToWords(dateString?: string | null, lang: 'en' | 'mr' | 'hi' = 'en'): string {
  if (!dateString) return '-';
  try {
    let day = 0;
    let monthIdx = 0;
    let year = 0;

    if (dateString.includes('-')) {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          year = parseInt(parts[0], 10);
          monthIdx = parseInt(parts[1], 10) - 1;
          day = parseInt(parts[2], 10);
        } else {
          // DD-MM-YYYY
          day = parseInt(parts[0], 10);
          monthIdx = parseInt(parts[1], 10) - 1;
          year = parseInt(parts[2], 10);
        }
      }
    } else if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          // DD/MM/YYYY
          day = parseInt(parts[0], 10);
          monthIdx = parseInt(parts[1], 10) - 1;
          year = parseInt(parts[2], 10);
        } else {
          // YYYY/MM/DD
          year = parseInt(parts[0], 10);
          monthIdx = parseInt(parts[1], 10) - 1;
          day = parseInt(parts[2], 10);
        }
      }
    }

    if (day > 0 && monthIdx >= 0 && year > 0) {
      if (lang === 'mr') {
        const dStr = MR_DAYS[day] || String(day);
        const mStr = MR_MONTHS[monthIdx] || '';
        const yStr = mrYearToWords(year);
        return `${dStr} ${mStr} ${yStr}`;
      }

      if (lang === 'hi') {
        const dStr = HI_DAYS[day] || String(day);
        const mStr = HI_MONTHS[monthIdx] || '';
        const yStr = hiYearToWords(year);
        return `${dStr} ${mStr} ${yStr}`;
      }

      const dayWords = enNumberToWords(day);
      const monthWord = EN_MONTHS[monthIdx] || '';
      const yearWords = enNumberToWords(year);
      return `${dayWords} ${monthWord} ${yearWords}`;
    }
  } catch {
    // fallback
  }
  return dateString;
}
