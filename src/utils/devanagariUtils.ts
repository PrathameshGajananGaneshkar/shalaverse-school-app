import { Student, AdmissionClass } from '../types';

/**
 * Common Marathi / Hindi translation dictionaries and phonetic transliteration engine.
 */

// Common First Names, Middle Names, Surnames
const NAME_DICTIONARY: Record<string, { mr: string; hi: string }> = {
  // Surnames
  'deshmukh': { mr: 'देशमुख', hi: 'देशमुख' },
  'patil': { mr: 'पाटील', hi: 'पाटिल' },
  'joshi': { mr: 'जोशी', hi: 'जोशी' },
  'shinde': { mr: 'शिंदे', hi: 'शिंदे' },
  'gaikwad': { mr: 'गायकवाड', hi: 'गायकवाड़' },
  'khan': { mr: 'खान', hi: 'खान' },
  'kulkarni': { mr: 'कुलकर्णी', hi: 'कुलकर्णी' },
  'jadhav': { mr: 'जाधव', hi: 'जाधव' },
  'chavan': { mr: 'चव्हाण', hi: 'चव्हाण' },
  'pawar': { mr: 'पवार', hi: 'पवार' },
  'more': { mr: 'मोरे', hi: 'मोरे' },
  'kadam': { mr: 'कदम', hi: 'कदम' },
  'sawant': { mr: 'सावंत', hi: 'सावंत' },
  'shaikh': { mr: 'शेख', hi: 'शेख' },
  'sayyed': { mr: 'सय्यद', hi: 'सैयद' },
  'raut': { mr: 'राऊत', hi: 'राउत' },
  'bhosale': { mr: 'भोसले', hi: 'भोसले' },
  'kale': { mr: 'काळे', hi: 'काले' },
  'mane': { mr: 'माने', hi: 'माने' },
  'ingale': { mr: 'इंगळे', hi: 'इंगले' },
  'waghmare': { mr: 'वाघमारे', hi: 'वाघमारे' },
  'kamble': { mr: 'कांबळे', hi: 'कांबले' },
  'ghadge': { mr: 'घाडगे', hi: 'घाडगे' },
  'ghatge': { mr: 'घाटगे', hi: 'घाटगे' },
  'salunke': { mr: 'साळुंखे', hi: 'सालुंखे' },
  'mali': { mr: 'माळी', hi: 'माली' },
  'thorat': { mr: 'थोरात', hi: 'थोरात' },
  'ganeshkar': { mr: 'गणेशकर', hi: 'गणेशकर' },
  'wagh': { mr: 'वाघ', hi: 'वाघ' },
  'tamboli': { mr: 'तांबोळी', hi: 'तांबोली' },
  'deshastha': { mr: 'देशस्थ', hi: 'देशस्थ' },
  'kokanastha': { mr: 'कोकणस्थ', hi: 'कोंकणस्थ' },

  // First / Middle Names (Girls & Boys)
  'akanksha': { mr: 'आकांक्षा', hi: 'आकांक्षा' },
  'aakanksha': { mr: 'आकांक्षा', hi: 'आकांक्षा' },
  'aarti': { mr: 'आरती', hi: 'आरती' },
  'aarav': { mr: 'आरव', hi: 'आरव' },
  'aakash': { mr: 'आकाश', hi: 'आकाश' },
  'akash': { mr: 'आकाश', hi: 'आकाश' },
  'ananya': { mr: 'अनन्या', hi: 'अनन्या' },
  'anjali': { mr: 'अंजली', hi: 'अंजली' },
  'anushka': { mr: 'अनुष्का', hi: 'अनुष्का' },
  'aditya': { mr: 'आदित्य', hi: 'आदित्य' },
  'aditi': { mr: 'अदिती', hi: 'अदिति' },
  'aniket': { mr: 'अनिकेत', hi: 'अनिकेत' },
  'abhishek': { mr: 'अभिषेक', hi: 'अभिषेक' },
  'amol': { mr: 'अमोल', hi: 'अमोल' },
  'anand': { mr: 'आनंद', hi: 'आनंद' },
  'anita': { mr: 'अनिता', hi: 'अनीता' },
  'archana': { mr: 'अर्चना', hi: 'अर्चना' },
  'ashok': { mr: 'अशोक', hi: 'अशोक' },
  'ashwini': { mr: 'अश्विनी', hi: 'अश्विनी' },
  'atharva': { mr: 'अथर्व', hi: 'अथर्व' },
  'atul': { mr: 'अतुल', hi: 'अतुल' },
  'avinash': { mr: 'अविनाश', hi: 'अविनाश' },
  'ayesha': { mr: 'आयशा', hi: 'आयशा' },
  'arif': { mr: 'आरिफ', hi: 'आरिफ' },
  'amit': { mr: 'अमित', hi: 'अमित' },
  'ajay': { mr: 'अजय', hi: 'अजय' },
  'baburao': { mr: 'बाबुराव', hi: 'बाबूराव' },
  'bhakti': { mr: 'भक्ती', hi: 'भक्ति' },
  'bharat': { mr: 'भारत', hi: 'भारत' },
  'bhagwan': { mr: 'भगवान', hi: 'भगवान' },
  'deepak': { mr: 'दीपक', hi: 'दीपक' },
  'dipak': { mr: 'दीपक', hi: 'दीपक' },
  'deepali': { mr: 'दीपाली', hi: 'दीपाली' },
  'dipali': { mr: 'दीपाली', hi: 'दीपाली' },
  'dinesh': { mr: 'दिनेश', hi: 'दिनेश' },
  'divya': { mr: 'दिव्या', hi: 'दिव्या' },
  'farzana': { mr: 'फरझाना', hi: 'फरजाना' },
  'ganesh': { mr: 'गणेश', hi: 'गणेश' },
  'gayatri': { mr: 'गायत्री', hi: 'गायत्री' },
  'govind': { mr: 'गोविंद', hi: 'गोविंद' },
  'harsh': { mr: 'हर्ष', hi: 'हर्ष' },
  'harshal': { mr: 'हर्षल', hi: 'हर्षल' },
  'isha': { mr: 'ईशा', hi: 'ईशा' },
  'jay': { mr: 'जय', hi: 'जय' },
  'jayant': { mr: 'जयंत', hi: 'जयंत' },
  'jyoti': { mr: 'ज्योती', hi: 'ज्योति' },
  'kajal': { mr: 'काजल', hi: 'काजल' },
  'kalyani': { mr: 'कल्याणी', hi: 'कल्याणी' },
  'kavita': { mr: 'कविता', hi: 'कविता' },
  'kishor': { mr: 'किशोर', hi: 'किशोर' },
  'komal': { mr: 'कोमल', hi: 'कोमल' },
  'krishna': { mr: 'कृष्णा', hi: 'कृष्णा' },
  'mahadev': { mr: 'महादेव', hi: 'महादेव' },
  'mahesh': { mr: 'महेश', hi: 'महेश' },
  'manasi': { mr: 'मानसी', hi: 'मानसी' },
  'manisha': { mr: 'मनीषा', hi: 'मनीषा' },
  'mayuri': { mr: 'मयुरी', hi: 'मयूरी' },
  'medha': { mr: 'मेधा', hi: 'मेधा' },
  'mohammed': { mr: 'मोहम्मद', hi: 'मोहम्मद' },
  'mukesh': { mr: 'मुकेश', hi: 'मुकेश' },
  'narayan': { mr: 'नारायण', hi: 'नारायण' },
  'naresh': { mr: 'नरेश', hi: 'नरेश' },
  'neha': { mr: 'नेहा', hi: 'नेहा' },
  'nikita': { mr: 'निकिता', hi: 'निकिता' },
  'nilesh': { mr: 'निलेश', hi: 'निलेश' },
  'omkar': { mr: 'ओंकार', hi: 'ओंकार' },
  'pallavi': { mr: 'पल्लवी', hi: 'पल्लवी' },
  'pooja': { mr: 'पूजा', hi: 'पूजा' },
  'puja': { mr: 'पूजा', hi: 'पूजा' },
  'prakash': { mr: 'प्रकाश', hi: 'प्रकाश' },
  'pramod': { mr: 'प्रमोद', hi: 'प्रमोद' },
  'pranali': { mr: 'प्रणाली', hi: 'प्रणाली' },
  'prasad': { mr: 'प्रसाद', hi: 'प्रसाद' },
  'prashant': { mr: 'प्रशांत', hi: 'प्रशांत' },
  'prathamesh': { mr: 'प्रथमेश', hi: 'प्रथमेश' },
  'pratiksha': { mr: 'प्रतीक्षा', hi: 'प्रतीक्षा' },
  'pravin': { mr: 'प्रवीण', hi: 'प्रवीण' },
  'priya': { mr: 'प्रिया', hi: 'प्रिया' },
  'priyanka': { mr: 'प्रियंका', hi: 'प्रियंका' },
  'radha': { mr: 'राधा', hi: 'राधा' },
  'radhika': { mr: 'राधिका', hi: 'राधिका' },
  'rahul': { mr: 'राहुल', hi: 'राहुल' },
  'rajesh': { mr: 'राजेश', hi: 'राजेश' },
  'rajendra': { mr: 'राजेन्द्र', hi: 'राजेन्द्र' },
  'ramesh': { mr: 'रमेश', hi: 'रमेश' },
  'rohan': { mr: 'रोहन', hi: 'रोहन' },
  'rohit': { mr: 'रोहित', hi: 'रोहित' },
  'rutuja': { mr: 'ऋतुजा', hi: 'ऋतुजा' },
  'sachin': { mr: 'सचिन', hi: 'सचिन' },
  'sakshi': { mr: 'साक्षी', hi: 'साक्षी' },
  'samruddhi': { mr: 'समृद्धी', hi: 'समृद्धि' },
  'sandesh': { mr: 'संदेश', hi: 'संदेश' },
  'sanika': { mr: 'सानिका', hi: 'सानिका' },
  'sanjay': { mr: 'संजय', hi: 'संजय' },
  'santosh': { mr: 'संतोष', hi: 'संतोष' },
  'sayali': { mr: 'सायली', hi: 'सायली' },
  'seema': { mr: 'सीमा', hi: 'सीमा' },
  'shailesh': { mr: 'शैलेश', hi: 'शैलेश' },
  'shital': { mr: 'शीतल', hi: 'शीतल' },
  'shivaji': { mr: 'शिवाजी', hi: 'शिवाजी' },
  'shraddha': { mr: 'श्रद्धा', hi: 'श्रद्धा' },
  'shravani': { mr: 'श्रावणी', hi: 'श्रावणी' },
  'shreya': { mr: 'श्रेया', hi: 'श्रेया' },
  'shrikant': { mr: 'श्रीकांत', hi: 'श्रीकांत' },
  'sneha': { mr: 'स्नेहा', hi: 'स्नेहा' },
  'snehal': { mr: 'स्नेहल', hi: 'स्नेहल' },
  'sonali': { mr: 'सोनाली', hi: 'सोनाली' },
  'sunil': { mr: 'सुनील', hi: 'सुनील' },
  'sunita': { mr: 'सुनिता', hi: 'सुनीता' },
  'surekha': { mr: 'सुरेखा', hi: 'सुरेखा' },
  'suresh': { mr: 'सुरेश', hi: 'सुरेश' },
  'swapnil': { mr: 'स्वप्नील', hi: 'स्वप्निल' },
  'swati': { mr: 'स्वाती', hi: 'स्वाति' },
  'tanvi': { mr: 'तन्वी', hi: 'तन्वी' },
  'umesh': { mr: 'उमेश', hi: 'उमेश' },
  'vaishali': { mr: 'वैशाली', hi: 'वैशाली' },
  'vaishnavi': { mr: 'वैष्णवी', hi: 'वैष्णवी' },
  'vasant': { mr: 'वसंत', hi: 'वसंत' },
  'vasantrao': { mr: 'वसंतराव', hi: 'वसंतराव' },
  'vedant': { mr: 'वेदांत', hi: 'वेदांत' },
  'vijay': { mr: 'विजय', hi: 'विजय' },
  'vikas': { mr: 'विकास', hi: 'विकास' },
  'vinod': { mr: 'विनोद', hi: 'विनोद' },
  'vishal': { mr: 'विशाल', hi: 'विशाल' },
  'vitthal': { mr: 'विठ्ठल', hi: 'विट्ठल' },
  'yash': { mr: 'यश', hi: 'यश' }
};

// Cities, Districts & Locations
const LOCATION_DICTIONARY: Record<string, { mr: string; hi: string }> = {
  'pune': { mr: 'पुणे', hi: 'पुणे' },
  'kolhapur': { mr: 'कोल्हापूर', hi: 'कोल्हापुर' },
  'nashik': { mr: 'नाशिक', hi: 'नासिक' },
  'satara': { mr: 'सातारा', hi: 'सतारा' },
  'aurangabad': { mr: 'छत्रपती संभाजीनगर (औरंगाबाद)', hi: 'छत्रपति संभाजीनगर (औरंगाबाद)' },
  'solapur': { mr: 'सोलापूर', hi: 'सोलापुर' },
  'chikhli': { mr: 'चिखली', hi: 'चिखली' },
  'buldhana': { mr: 'बुलढाणा', hi: 'बुलढाणा' },
  'deshmukh': { mr: 'देशमुख', hi: 'देशमुख' },
  'akanksha': { mr: 'आकांक्षा', hi: 'आकांक्षा' },
  'shobha': { mr: 'शोभा', hi: 'शोभा' },
  'mumbai': { mr: 'मुंबई', hi: 'मुंबई' },
  'thane': { mr: 'ठाणे', hi: 'ठाणे' },
  'nagpur': { mr: 'नागपूर', hi: 'नागपुर' },
  'amravati': { mr: 'अमरावती', hi: 'अमरावती' },
  'nanded': { mr: 'नांदेड', hi: 'नांदेड़' },
  'sangli': { mr: 'सांगली', hi: 'सांगली' },
  'kothrud': { mr: 'कोथरूड', hi: 'कोथरुड' },
  'karve nagar': { mr: 'कर्वे नगर', hi: 'कर्वे नगर' },
  'baner': { mr: 'बाणेर', hi: 'बानेर' },
  'hadapsar': { mr: 'हडपसर', hi: 'हडपसर' },
  'guruwar peth': { mr: 'गुरुवार पेठ', hi: 'गुरुवार पेठ' },
  'maharashtra': { mr: 'महाराष्ट्र', hi: 'महाराष्ट्र' },
  'india': { mr: 'भारत', hi: 'भारत' }
};

// Caste & Religion
const CASTE_DICTIONARY: Record<string, { mr: string; hi: string }> = {
  'maratha': { mr: 'मराठा', hi: 'मराठा' },
  '96 kuli': { mr: '९६ कुळी', hi: '९६ कुली' },
  '96-kuli': { mr: '९६ कुळी', hi: '९६ कुली' },
  'brahmin': { mr: 'ब्राह्मण', hi: 'ब्राह्मण' },
  'deshastha': { mr: 'देशस्थ', hi: 'देशस्थ' },
  'kokanastha': { mr: 'कोकणस्थ', hi: 'कोंकणस्थ' },
  'mali': { mr: 'माळी', hi: 'माली' },
  'mahar': { mr: 'महार', hi: 'महार' },
  'matang': { mr: 'मातंग', hi: 'मातंग' },
  'chambhar': { mr: 'चांभार', hi: 'चर्मकार' },
  'kunbi': { mr: 'कुणबी', hi: 'कुनबी' },
  'dhangar': { mr: 'धनगर', hi: 'धनगर' },
  'vanjari': { mr: 'वंजारी', hi: 'वंजारी' },
  'lingayat': { mr: 'लिंगायत', hi: 'लिंगायत' },
  'pinjari': { mr: 'पिंजारी', hi: 'पिंजारी' },
  'tamboli': { mr: 'तांबोळी', hi: 'तांबोली' },
  'open': { mr: 'खुला प्रवर्ग', hi: 'सामान्य वर्ग' },
  'obc': { mr: 'इतर मागास वर्ग', hi: 'अन्य पिछड़ा वर्ग' },
  'sc': { mr: 'अनुसूचित जाती', hi: 'अनुसूचित जाति' },
  'st': { mr: 'अनुसूचित जमाती', hi: 'अनुसूचित जनजाति' },
  'nt': { mr: 'भटक्या जमाती', hi: 'विमुक्त जनजाति' },
  'vjnt': { mr: 'विमुक्त व भटक्या जमाती', hi: 'विमुक्त व घुमंतू जाति' },
  'sbc': { mr: 'विशेष मागास प्रवर्ग', hi: 'विशेष पिछड़ा वर्ग' },
  'ews': { mr: 'आर्थिक दुर्बल घटक', hi: 'आर्थिक रूप से कमजोर' }
};

const BOARD_DICTIONARY: Record<string, { mr: string; hi: string }> = {
  'amravati': { mr: 'अमरावती', hi: 'अमरावती' },
  'pune': { mr: 'पुणे', hi: 'पुणे' },
  'mumbai': { mr: 'मुंबई', hi: 'मुंबई' },
  'nagpur': { mr: 'नागपूर', hi: 'नागपुर' },
  'nashik': { mr: 'नाशिक', hi: 'नासिक' },
  'kolhapur': { mr: 'कोल्हापूर', hi: 'कोल्हापुर' },
  'aurangabad': { mr: 'छत्रपती संभाजीनगर', hi: 'छत्रपति संभाजीनगर' },
  'chhatrapati sambhajinagar': { mr: 'छत्रपती संभाजीनगर', hi: 'छत्रपति संभाजीनगर' },
  'latur': { mr: 'लातूर', hi: 'लातुर' },
  'konkan': { mr: 'कोकण', hi: 'कोंकण' },
  'maharashtra state board': { mr: 'महाराष्ट्र राज्य मंडळ', hi: 'महाराष्ट्र राज्य बोर्ड' }
};

const RELIGION_DICTIONARY: Record<string, { mr: string; hi: string }> = {
  'hindu': { mr: 'हिंदू', hi: 'हिन्दू' },
  'muslim': { mr: 'मुस्लिम', hi: 'मुस्लिम' },
  'islam': { mr: 'इस्लाम', hi: 'इस्लाम' },
  'jain': { mr: 'जैन', hi: 'जैन' },
  'buddhist': { mr: 'बौद्ध', hi: 'बौद्ध' },
  'christian': { mr: 'ख्रिश्चन', hi: 'ईसाई' },
  'sikh': { mr: 'शीख', hi: 'सिख' },
  'parsi': { mr: 'पारशी', hi: 'पारसी' }
};

const NATIONALITY_DICTIONARY: Record<string, { mr: string; hi: string }> = {
  'indian': { mr: 'भारतीय', hi: 'भारतीय' },
  'india': { mr: 'भारतीय', hi: 'भारतीय' }
};

const MOTHER_TONGUE_DICTIONARY: Record<string, { mr: string; hi: string }> = {
  'marathi': { mr: 'मराठी', hi: 'मराठी' },
  'hindi': { mr: 'हिंदी', hi: 'हिंदी' },
  'urdu': { mr: 'उर्दू', hi: 'उर्दू' },
  'gujarati': { mr: 'गुजराती', hi: 'गुजराती' },
  'kannada': { mr: 'कन्नड', hi: 'कन्नड़' },
  'tamil': { mr: 'तमिळ', hi: 'तमिल' },
  'telugu': { mr: 'तेलगू', hi: 'तेलुगु' },
  'english': { mr: 'इंग्रजी', hi: 'अंग्रेजी' }
};

const CLASS_MAP: Record<string, { mr: string; hi: string; en: string }> = {
  '1st': { mr: '१ ली', hi: '१ वीं', en: '1st' },
  '2nd': { mr: '२ री', hi: '२ वीं', en: '2nd' },
  '3rd': { mr: '३ री', hi: '३ वीं', en: '3rd' },
  '4th': { mr: '४ थी', hi: '४ वीं', en: '4th' },
  '5th': { mr: '५ वी', hi: '५ वीं', en: '5th' },
  '6th': { mr: '६ वी', hi: '६ वीं', en: '6th' },
  '7th': { mr: '७ वी', hi: '७ वीं', en: '7th' },
  '8th': { mr: '८ वी', hi: '८ वीं', en: '8th' },
  '9th': { mr: '९ वी', hi: '९ वीं', en: '9th' },
  '10th': { mr: '१० वी', hi: '१० वीं', en: '10th' },
  '11th': { mr: '११ वी', hi: '११ वीं', en: '11th' },
  '12th': { mr: '१२ वी', hi: '१२ वीं', en: '12th' }
};

/**
 * Extensive reverse dictionary mapping Devanagari words/phrases to pure English
 */
const DEVANAGARI_TO_ENGLISH_MAP: Record<string, string> = {
  // Locations
  'चिखली': 'Chikhli',
  'बुलढाणा': 'Buldhana',
  'बुलडाणा': 'Buldhana',
  'पुणे': 'Pune',
  'मुंबई': 'Mumbai',
  'नागपूर': 'Nagpur',
  'नाशिक': 'Nashik',
  'सातारा': 'Satara',
  'कोल्हापूर': 'Kolhapur',
  'औरंगाबाद': 'Aurangabad',
  'छत्रपती संभाजीनगर': 'Chhatrapati Sambhajinagar',
  'सोलापूर': 'Solapur',
  'ठाणे': 'Thane',
  'अमरावती': 'Amravati',
  'अकोला': 'Akola',
  'जळगाव': 'Jalgaon',
  'नांदेड': 'Nanded',
  'सांगली': 'Sangli',
  'कोथरूड': 'Kothrud',
  'कर्वे नगर': 'Karve Nagar',
  'बाणेर': 'Baner',
  'हडपसर': 'Hadapsar',
  'गुरुवार पेठ': 'Guruwar Peth',
  'महाराष्ट्र': 'Maharashtra',
  'भारत': 'India',
  'मु. पो.': 'At Post',
  'मु.पो.': 'At Post',
  'मु.': 'At',
  'पो.': 'Post',
  'ता.': 'Tal.',
  'तालुका': 'Taluka',
  'तहसील': 'Taluka',
  'जि.': 'Dist.',
  'जिल्हा': 'District',
  'जिला': 'District',

  // Religions
  'हिंदू': 'Hindu',
  'हिन्दू': 'Hindu',
  'मुस्लिम': 'Muslim',
  'मुसलमान': 'Muslim',
  'इस्लाम': 'Muslim',
  'जैन': 'Jain',
  'बौद्ध': 'Buddhist',
  'ख्रिश्चन': 'Christian',
  'ईसाई': 'Christian',
  'शीख': 'Sikh',
  'सिख': 'Sikh',
  'पारशी': 'Parsi',
  'पारसी': 'Parsi',

  // Castes & Categories
  'कुणबी': 'Kunbi',
  'कुनबी': 'Kunbi',
  'मराठा': 'Maratha',
  '९६ कुळी': '96 Kuli',
  '९६ कुली': '96 Kuli',
  'ब्राह्मण': 'Brahmin',
  'देशस्थ': 'Deshastha',
  'कोकणस्थ': 'Kokanastha',
  'माळी': 'Mali',
  'माली': 'Mali',
  'महार': 'Mahar',
  'मातंग': 'Matang',
  'चांभार': 'Chambhar',
  'चर्मकार': 'Chambhar',
  'धनगर': 'Dhangar',
  'वंजारी': 'Vanjari',
  'लिंगायत': 'Lingayat',
  'पिंजारी': 'Pinjari',
  'तांबोळी': 'Tamboli',
  'तांबोली': 'Tamboli',
  'तेली': 'Teli',
  'खुला': 'Open',
  'खुला प्रवर्ग': 'Open',
  'सामान्य वर्ग': 'Open',
  'इतर मागास वर्ग': 'OBC',
  'इतर मागासवर्गीय': 'OBC',
  'ओबीसी': 'OBC',
  'अनुसूचित जाती': 'SC',
  'एससी': 'SC',
  'अनुसूचित जमाती': 'ST',
  'एसटी': 'ST',
  'भटक्या जमाती': 'NT',
  'एनटी': 'NT',
  'विमुक्त व भटक्या जमाती': 'VJNT',
  'व्हिजेएनटी': 'VJNT',
  'विशेष मागास प्रवर्ग': 'SBC',
  'एसबीसी': 'SBC',
  'आर्थिक दुर्बल घटक': 'EWS',
  'आर्थिकदृष्ट्या दुर्बल': 'EWS',
  'सामाजिक व शैक्षणिक मागास': 'SEBC',
  'ईडब्ल्यूएस': 'EWS',
  'तिरोळे': 'Tirole',
  'तिरोळे कुणबी': 'Tirole Kunbi',
  'झाडे': 'Jhade',
  'लेवा': 'Leva',
  'लेवा पाटीदार': 'Leva Patidar',
  'लेवा पाटील': 'Leva Patil',

  // Mother Tongues
  'मराठी': 'Marathi',
  'हिंदी': 'Hindi',
  'उर्दू': 'Urdu',
  'गुजराती': 'Gujarati',
  'कन्नड': 'Kannada',
  'कन्नड़': 'Kannada',
  'तेलगू': 'Telugu',
  'तेलुगु': 'Telugu',
  'तमिळ': 'Tamil',
  'तमिल': 'Tamil',
  'बंगाली': 'Bengali',
  'इंग्रजी': 'English',
  'अंग्रेजी': 'English',

  // Nationalities
  'भारतीय': 'Indian',

  // Progress
  'उत्कृष्ट': 'Excellent',
  'उत्तम': 'Good',
  'चांगली': 'Good',
  'चांगले': 'Good',
  'समाधानकारक': 'Satisfactory',
  'संतोषजनक': 'Satisfactory',
  'अतिउत्कृष्ट': 'Outstanding',
  'अति उत्कृष्ट': 'Outstanding',
  'अतिउत्तम': 'Distinction',
  'विशेष प्राविण्य': 'Distinction',
  'विशेष योग्यता': 'Distinction',
  'प्रथम श्रेणी': 'First Class',
  'उत्तम व समाधानकारक': 'Good & Satisfactory',

  // Conduct
  'सद्वर्तनी': 'Well Behaved',
  'आज्ञाधारक': 'Obedient',
  'शिस्तबद्ध': 'Disciplined',
  'सहकार्यशील': 'Cooperative',
  'अनुकरणीय': 'Exemplary',
  'उत्तम व आज्ञाधारक': 'Good & Obedient',
  'उत्तम व शिस्तबद्ध': 'Good & Disciplined',
  'उत्कृष्ट व सहकार्यशील': 'Excellent & Cooperative',

  // Leaving Reasons
  'पालकांची बदली': "Parent's Transfer",
  'पालकांची बदली झाल्यामुळे': "Due to Parent's Transfer",
  'पालकांची मुंबई येथे बदली': "Parent's Transfer to Mumbai",
  'अभ्यासक्रम पूर्ण': 'Completed Course',
  'अभ्यासक्रम पूर्ण झाल्यामुळे': 'Due to Completion of Course',
  'पुढील उच्च शिक्षणासाठी': 'For Higher Education',
  'पुढील शिक्षणासाठी': 'For Further Studies',
  'गावी स्थलांतरित झाल्यामुळे': 'Due to Relocation to Native Place',
  'दुसऱ्या शाळेत प्रवेशासाठी': 'For Admission in Another School',
  'स्वेच्छेने / पालकांच्या विनंतीनुसार': "As per Parent's Request",
  'पालकांच्या विनंतीनुसार': "As per Parent's Request",
  'इयत्ता १० वी उत्तीर्ण होऊन शाळा सोडली': 'Passed 10th Standard',
  'इयत्ता १२ वी उत्तीर्ण होऊन शाळा सोडली': 'Passed 12th Standard',

  // Schools & Education
  'जिल्हा परिषद प्राथमिक शाळा': 'Zilla Parishad Primary School',
  'जि. प. प्राथमिक शाळा': 'Z. P. Primary School',
  'जिल्हा परिषद उच्च प्राथमिक शाळा': 'Zilla Parishad Upper Primary School',
  'जि. प. उच्च प्राथमिक शाळा': 'Z. P. Upper Primary School',
  'आदर्श हायस्कूल': 'Adarsh High School',
  'छत्रपती शाहू विद्यालय': 'Chatrapati Shahu Vidyalaya',
  'सरस्वती बाल मंदिर': 'Saraswati Bal Mandir',
  'न्यू इंग्लिश स्कूल': 'New English School',
  'नॅशनल इंग्लिश मीडियम स्कूल': 'National English Medium School',
  'श्री शिवाजी शिक्षण संस्था': 'Shri Shivaji Shikshan Sanstha',
  'थेट प्रवेश / नवीन प्रवेश': 'Direct Admission',
  'थेट प्रवेश': 'Direct Admission',
  'नवीन प्रवेश': 'New Admission',

  // Boards
  'महाराष्ट्र राज्य मंडळ': 'Maharashtra State Board',
  'महाराष्ट्र राज्य माध्यमिक व उच्च माध्यमिक शिक्षण मंडळ': 'Maharashtra State Board of Secondary and Higher Secondary Education',
  'केंद्रीय माध्यमिक शिक्षण मंडळ': 'CBSE',

  // Purposes
  'शैक्षणिक / शासकीय कामासाठी व शिष्यवृत्ती अर्जासाठी': 'Educational, Official & Scholarship Application',
  'बस पास / रेल्वे पास सवलतीसाठी': 'For Bus / Railway Concession Pass',
  'आधार कार्ड / पॅन कार्ड नोंदणीसाठी': 'For Aadhaar / Identity Verification',
  'बँक खाते उघडण्यासाठी': 'For Opening Bank Account',
  'शासकीय योजना लाभासाठी': 'For Govt Welfare Scheme Application',

  // General phrases
  'सर्व शालेय फी पूर्ण भरलेली आहे. कोणतीही बाकी नाही.': 'All school dues paid in full. No dues pending.',
  'देशमुख': 'Deshmukh',
  'आकांक्षा': 'Akanksha',
  'रमेश': 'Ramesh',
  'शोभा': 'Shobha'
};

/**
 * Phonetic Devanagari to Latin Transliteration for names and words
 */
export function devanagariToLatin(devText: string): string {
  if (!devText) return '';

  // First check direct dictionary match
  const low = devText.toLowerCase().trim();
  if (DEVANAGARI_TO_ENGLISH_MAP[low]) {
    return DEVANAGARI_TO_ENGLISH_MAP[low];
  }

  // Common Marathi surname / name mappings
  for (const [latin, obj] of Object.entries(NAME_DICTIONARY)) {
    if (devText.includes(obj.mr) || devText.includes(obj.hi)) {
      devText = devText.replace(new RegExp(obj.mr, 'g'), latin.charAt(0).toUpperCase() + latin.slice(1));
      devText = devText.replace(new RegExp(obj.hi, 'g'), latin.charAt(0).toUpperCase() + latin.slice(1));
    }
  }

  // Devanagari consonants and vowels phonetic table
  const devanagariMap: [RegExp, string][] = [
    // Complex conjuncts / special characters
    [/ज्ञ/g, 'Dny'],
    [/क्ष/g, 'Ksh'],
    [/श्र/g, 'Shr'],
    [/त्र/g, 'Tr'],

    // Independent Vowels
    [/अं/g, 'An'],
    [/अः/g, 'Ah'],
    [/आई/g, 'Ai'],
    [/आ/g, 'A'],
    [/अ/g, 'A'],
    [/ई/g, 'Ee'],
    [/इ/g, 'I'],
    [/ऊ/g, 'Oo'],
    [/उ/g, 'U'],
    [/ऋ/g, 'R'],
    [/ऐ/g, 'Ai'],
    [/ए/g, 'E'],
    [/औ/g, 'Au'],
    [/ओ/g, 'O'],
    [/ऍ/g, 'A'],
    [/ऑ/g, 'O'],

    // Consonants with inherent vowel
    [/ख्/g, 'kh'], [/ख/g, 'kh'],
    [/ग्/g, 'g'], [/घ्/g, 'gh'], [/घ/g, 'gh'], [/ग/g, 'g'],
    [/ङ्/g, 'ng'], [/ङ/g, 'ng'],
    [/छ्/g, 'chh'], [/छ/g, 'chh'],
    [/च्/g, 'ch'], [/च/g, 'ch'],
    [/झ्/g, 'jh'], [/झ/g, 'jh'],
    [/ज्/g, 'j'], [/ज/g, 'j'],
    [/ञ्/g, 'ny'], [/ञ/g, 'ny'],
    [/ठ्/g, 'th'], [/ठ/g, 'th'],
    [/ट्/g, 't'], [/ट/g, 't'],
    [/ढ्/g, 'dh'], [/ढ/g, 'dh'],
    [/ड्/g, 'd'], [/ड/g, 'd'],
    [/ण्/g, 'n'], [/ण/g, 'n'],
    [/थ्/g, 'th'], [/थ/g, 'th'],
    [/त्/g, 't'], [/त/g, 't'],
    [/ध्/g, 'dh'], [/ध/g, 'dh'],
    [/द्/g, 'd'], [/द/g, 'd'],
    [/न्/g, 'n'], [/न/g, 'n'],
    [/फ्/g, 'ph'], [/फ/g, 'ph'],
    [/ब्/g, 'b'], [/भ्/g, 'bh'], [/भ/g, 'bh'], [/ब/g, 'b'],
    [/म्/g, 'm'], [/म/g, 'm'],
    [/य्/g, 'y'], [/य/g, 'y'],
    [/र्/g, 'r'], [/र/g, 'r'],
    [/ल्/g, 'l'], [/ल/g, 'l'],
    [/व्/g, 'v'], [/व/g, 'v'],
    [/श्/g, 'sh'], [/श/g, 'sh'],
    [/ष्/g, 'sh'], [/ष/g, 'sh'],
    [/स्/g, 's'], [/स/g, 's'],
    [/ह्/g, 'h'], [/ह/g, 'h'],
    [/ळ्/g, 'l'], [/ळ/g, 'l'],
    [/क्/g, 'k'], [/क/g, 'k'],

    // Matras (Vowel signs)
    [/ा/g, 'a'],
    [/ी/g, 'i'],
    [/ि/g, 'i'],
    [/ू/g, 'u'],
    [/ु/g, 'u'],
    [/ृ/g, 'ri'],
    [/े/g, 'e'],
    [/ै/g, 'ai'],
    [/ो/g, 'o'],
    [/ौ/g, 'au'],
    [/ं/g, 'n'],
    [/ः/g, 'h'],
    [/ॅ/g, 'a'],
    [/ॉ/g, 'o'],
    [/्/g, ''], // virama

    // Numbers
    [/०/g, '0'], [/१/g, '1'], [/२/g, '2'], [/३/g, '3'], [/४/g, '4'],
    [/५/g, '5'], [/६/g, '6'], [/७/g, '7'], [/८/g, '8'], [/९/g, '9']
  ];

  let res = devText;
  for (const [pat, rep] of devanagariMap) {
    res = res.replace(pat, rep);
  }

  // Capitalize words cleanly
  return res
    .split(/\s+/)
    .map(w => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '')
    .join(' ')
    .trim();
}

/**
 * Strips all Devanagari text, removes Devanagari brackets like "(हिंदू)" or "(कुणबी)",
 * and translates/transliterates pure Devanagari input into clean English.
 * Also removes outer or stray circular brackets like "(DESHMUKH AKANKSHA RAMESH)" -> "DESHMUKH AKANKSHA RAMESH".
 */
export function cleanEnglishText(text?: string): string {
  if (!text) return '';
  let str = text.trim();

  // If the entire text is wrapped in parentheses or brackets e.g. "(DESHMUKH AKANKSHA RAMESH)" or "(Shobha)"
  const wrappedMatch = str.match(/^[([](.*)[)\]]$/);
  if (wrappedMatch) {
    str = wrappedMatch[1].trim();
  }

  // Check if string contains bracketed text e.g. "Outside (Inside)"
  const bracketMatch = str.match(/^(.*?)\s*[([](.*)[)\]]\s*$/);
  if (bracketMatch) {
    const outside = bracketMatch[1].trim();
    const inside = bracketMatch[2].trim();

    const outsideHasLatin = /[a-zA-Z]/.test(outside);
    const insideHasLatin = /[a-zA-Z]/.test(inside);
    const outsideHasDevanagari = /[\u0900-\u097F]/.test(outside);
    const insideHasDevanagari = /[\u0900-\u097F]/.test(inside);

    if (insideHasLatin && outsideHasDevanagari) {
      // e.g. "देशमुख आकांक्षा रमेश (DESHMUKH AKANKSHA RAMESH)" or "शोभा (Shobha)" -> use the inside clean English text!
      str = inside;
    } else if (outsideHasLatin && insideHasDevanagari) {
      // e.g. "DESHMUKH AKANKSHA RAMESH (देशमुख आकांक्षा रमेश)" or "Shobha (शोभा)" -> use the outside clean English text!
      str = outside;
    } else if (outsideHasLatin) {
      str = outside;
    } else if (insideHasLatin) {
      str = inside;
    }
  }

  // 1. Remove all parentheses or brackets containing Devanagari characters e.g. "(हिंदू)", "(कुणबी)"
  str = str.replace(/\s*\([^)]*[\u0900-\u097F][^)]*\)/g, '');
  str = str.replace(/\s*\[[^\]]*[\u0900-\u097F][^\]]*\]/g, '');

  // 2. If Latin characters or numbers exist, remove any remaining stray Devanagari characters, remove brackets, and clean up punctuation
  if (/[a-zA-Z]/.test(str)) {
    str = str.replace(/[\u0900-\u097F]/g, '');
    str = str.replace(/[()[\]{}]/g, '');
    str = str.replace(/\s{2,}/g, ' ');
    // Remove dangling separators like " / " or " - " at the ends
    str = str.replace(/^[\s,./\-|:]+|[\s,./\-|:]+$/g, '').trim();
    return str;
  }

  // 3. If there are NO Latin characters (i.e. it is pure Devanagari like 'चिखली' or 'हिंदू' or 'मराठी' or 'शोभा')
  const low = str.toLowerCase().trim();

  // Direct reverse dictionary lookup
  if (DEVANAGARI_TO_ENGLISH_MAP[low]) {
    return DEVANAGARI_TO_ENGLISH_MAP[low];
  }

  // Check known words and phrases in reverse map
  for (const [dev, eng] of Object.entries(DEVANAGARI_TO_ENGLISH_MAP)) {
    if (str.includes(dev)) {
      str = str.replace(new RegExp(dev, 'g'), eng);
    }
  }

  // If after replacing known phrases it still contains Devanagari, convert phonetically
  if (/[\u0900-\u097F]/.test(str)) {
    str = devanagariToLatin(str);
  }

  // Clean trailing punctuation and remove any leftover brackets
  return str.replace(/[()[\]{}]/g, '').replace(/\s{2,}/g, ' ').replace(/^[\s,./\-|:]+|[\s,./\-|:]+$/g, '').trim();
}

/**
 * Detects and removes duplicated full names or repetitive phrase blocks.
 * e.g. "देशमुख आकांक्षा रमेश देशमुख आकांक्षा रमेश" -> "देशमुख आकांक्षा रमेश"
 * e.g. "DESHMUKH AKANKSHA RAMESH DESHMUKH AKANKSHA RAMESH" -> "DESHMUKH AKANKSHA RAMESH"
 * e.g. "देशमुख आकांक्षा रमेश / देशमुख आकांक्षा रमेश" -> "देशमुख आकांक्षा रमेश"
 */
export function deduplicateRepeatedPhrase(str: string): string {
  if (!str) return '';
  let s = str.trim();

  // Normalize separators like " / ", " - ", ", " between duplicate halves
  s = s.replace(/\s*[/,|\\-]\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();

  // 1. Direct Regex check: whole string repeated twice
  const exactWholeRepeat = /^(.{2,})\s+\1$/u;
  const match = s.match(exactWholeRepeat);
  if (match) {
    return match[1].trim();
  }

  // 2. Token-level check
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    // Exact even split: e.g. 6 words where first 3 == last 3, or 4 words where first 2 == last 2, or 2 words [A, A]
    if (words.length % 2 === 0) {
      const half = words.length / 2;
      const firstHalf = words.slice(0, half).join(' ');
      const secondHalf = words.slice(half).join(' ');
      if (
        firstHalf.localeCompare(secondHalf, undefined, { sensitivity: 'accent' }) === 0 ||
        firstHalf.toLowerCase() === secondHalf.toLowerCase()
      ) {
        return firstHalf;
      }
    }

    // Subsequence repeat check: e.g. [A, B, C, A, B, C] or [X, A, B, A, B]
    for (let len = Math.floor(words.length / 2); len >= 1; len--) {
      for (let i = 0; i <= words.length - 2 * len; i++) {
        const seq1 = words.slice(i, i + len).join(' ').toLowerCase();
        const seq2 = words.slice(i + len, i + 2 * len).join(' ').toLowerCase();
        if (seq1 === seq2) {
          words.splice(i + len, len);
          return deduplicateRepeatedPhrase(words.join(' '));
        }
      }
    }
  }

  return s;
}

/**
 * Fix Devanagari shaping issues, repair broken leading matras, and strip duplicate parentheticals/circular brackets
 */
export function cleanDevanagariText(str: string): string {
  if (!str) return '';
  let cleaned = str.trim();

  // Remove surrounding circular/square brackets if any e.g. "(देशमुख आकांक्षा रमेश)"
  const wrapped = cleaned.match(/^[([](.*)[)\]]$/);
  if (wrapped) {
    cleaned = wrapped[1].trim();
  }

  // Fix common corrupted transliterations like leading matras \u093E (ा) with or without dotted circle
  cleaned = cleaned.replace(/[\u25CC\u00A0]?\s*[\u093E]?कानकशा/gi, 'आकांक्षा');
  cleaned = cleaned.replace(/(^|[\s(])[\u25CC\u00A0]?ा([क-ह])/g, '$1आ$2');
  cleaned = cleaned.replace(/(^|[\s(])[\u25CC\u00A0]?ि([क-ह])/g, '$1इ$2');
  cleaned = cleaned.replace(/(^|[\s(])[\u25CC\u00A0]?ी([क-ह])/g, '$1ई$2');
  cleaned = cleaned.replace(/(^|[\s(])[\u25CC\u00A0]?ु([क-ह])/g, '$1उ$2');
  cleaned = cleaned.replace(/(^|[\s(])[\u25CC\u00A0]?ू([क-ह])/g, '$1ऊ$2');
  cleaned = cleaned.replace(/(^|[\s(])[\u25CC\u00A0]?े([क-ह])/g, '$1ए$2');
  cleaned = cleaned.replace(/(^|[\s(])[\u25CC\u00A0]?ै([क-ह])/g, '$1ऐ$2');
  cleaned = cleaned.replace(/(^|[\s(])[\u25CC\u00A0]?ो([क-ह])/g, '$1ओ$2');
  cleaned = cleaned.replace(/(^|[\s(])[\u25CC\u00A0]?ौ([क-ह])/g, '$1औ$2');
  
  // Remove standalone dotted circles (\u25CC)
  cleaned = cleaned.replace(/\u25CC/g, '');

  cleaned = cleaned.replace(/[()[\]{}]/g, '').trim();
  return deduplicateRepeatedPhrase(cleaned);
}

/**
 * Clean dual-language or duplicate bracketed strings.
 * e.g. "देशमुख आकांक्षा रमेश (DESHMUKH AKANKSHA RAMESH)" -> "देशमुख आकांक्षा रमेश" for mr/hi
 * or "DESHMUKH AKANKSHA RAMESH" for en.
 */
export function extractCleanLanguageName(text: string, targetLang: 'en' | 'mr' | 'hi' = 'mr'): string {
  if (!text) return '';
  const raw = text.trim();

  // English requested
  if (targetLang === 'en') {
    return deduplicateRepeatedPhrase(cleanEnglishText(raw).replace(/[()[\]{}]/g, '').trim());
  }

  // If wrapped completely in brackets
  const wrapped = raw.match(/^[([](.*)[)\]]$/);
  const cleanRaw = wrapped ? wrapped[1].trim() : raw;

  // Check if string contains bracketed text e.g. "Main Text (Bracket Text)"
  const match = cleanRaw.match(/^(.*?)\s*[([](.*)[)\]]\s*$/);
  if (match) {
    const outside = match[1].trim();
    const inside = match[2].trim();

    const outsideHasDevanagari = /[\u0900-\u097F]/.test(outside);
    const insideHasDevanagari = /[\u0900-\u097F]/.test(inside);

    if (outsideHasDevanagari) {
      return deduplicateRepeatedPhrase(cleanDevanagariText(outside).replace(/[()[\]{}]/g, '').trim());
    }
    if (insideHasDevanagari) {
      return deduplicateRepeatedPhrase(cleanDevanagariText(inside).replace(/[()[\]{}]/g, '').trim());
    }
    // Both are Latin, transliterate outside
    return deduplicateRepeatedPhrase(transliterateToDevanagari(outside).replace(/[()[\]{}]/g, '').trim());
  }

  // If text already contains Devanagari characters
  if (/[\u0900-\u097F]/.test(cleanRaw)) {
    // If it also contains Latin words (e.g. "DESHMUKH AKANKSHA RAMESH देशमुख आकांक्षा रमेश" or "देशमुख आकांक्षा रमेश DESHMUKH AKANKSHA RAMESH")
    // Keep ONLY the Devanagari words and strip Latin characters
    const devanagariOnly = cleanRaw
      .replace(/[a-zA-Z0-9]/g, ' ')
      .replace(/[()[\]{}/\\|,_\-:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (devanagariOnly && devanagariOnly.length >= 2) {
      return deduplicateRepeatedPhrase(cleanDevanagariText(devanagariOnly));
    }
    return deduplicateRepeatedPhrase(cleanDevanagariText(cleanRaw));
  }

  // Pure Latin, transliterate to Devanagari
  return deduplicateRepeatedPhrase(transliterateToDevanagari(cleanRaw).replace(/[()[\]{}]/g, '').trim());
}

/**
 * Convert Latin characters phonetically to Devanagari as a high-quality fallback
 */
export function transliterateToDevanagari(text: string): string {
  if (!text) return '';
  
  // If text has both Devanagari and Latin, extract the Devanagari part if it already has words!
  if (/[\u0900-\u097F]/.test(text) && /[a-zA-Z]/.test(text)) {
    const devanagariOnly = text
      .replace(/[a-zA-Z0-9]/g, ' ')
      .replace(/[()[\]{}/\\|,_\-:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (devanagariOnly && devanagariOnly.length >= 2) {
      return deduplicateRepeatedPhrase(cleanDevanagariText(devanagariOnly));
    }
  }

  // If already pure Devanagari, clean and return
  if (/[\u0900-\u097F]/.test(text) && !/[a-zA-Z]/.test(text)) {
    return deduplicateRepeatedPhrase(cleanDevanagariText(text));
  }

  // Tokenize by spaces, punctuation, brackets
  const words = text.split(/(\s+|[,\-()./\[\]])/);

  const result = words.map(chunk => {
    if (!chunk || /^\s+$/.test(chunk) || /^[,\-()./\[\]]$/.test(chunk)) {
      return chunk;
    }

    if (/[\u0900-\u097F]/.test(chunk)) {
      return cleanDevanagariText(chunk);
    }

    const lower = chunk.toLowerCase().trim();

    // Check dictionaries first
    if (NAME_DICTIONARY[lower]) return NAME_DICTIONARY[lower].mr;
    if (LOCATION_DICTIONARY[lower]) return LOCATION_DICTIONARY[lower].mr;
    if (CASTE_DICTIONARY[lower]) return CASTE_DICTIONARY[lower].mr;
    if (RELIGION_DICTIONARY[lower]) return RELIGION_DICTIONARY[lower].mr;
    if (NATIONALITY_DICTIONARY[lower]) return NATIONALITY_DICTIONARY[lower].mr;
    if (MOTHER_TONGUE_DICTIONARY[lower]) return MOTHER_TONGUE_DICTIONARY[lower].mr;

    // Direct words
    if (lower === 'school') return 'शाळा';
    if (lower === 'high') return 'हायस्कूल';
    if (lower === 'vidyalaya') return 'विद्यालय';
    if (lower === 'primary') return 'प्राथमिक';
    if (lower === 'secondary') return 'माध्यमिक';
    if (lower === 'passed') return 'उत्तीर्ण';
    if (lower === 'class' || lower === 'std') return 'इयत्ता';

    // Phonetic rule-based conversion
    return phoneticLatinToDevanagari(chunk);
  }).join('');

  return deduplicateRepeatedPhrase(cleanDevanagariText(result));
}

function phoneticLatinToDevanagari(str: string): string {
  let s = str.toLowerCase().trim();
  if (!s) return '';

  // Direct common words fallback
  if (NAME_DICTIONARY[s]) return NAME_DICTIONARY[s].mr;

  // Syllable / Pattern matching for Indian names
  // 1. Initial Vowels (independent vowels)
  const initialVowels: [RegExp, string][] = [
    [/^aa|^aak/g, 'आ'],
    [/^ai/g, 'ऐ'],
    [/^au/g, 'औ'],
    [/^a/g, 'अ'],
    [/^ee|^ii/g, 'ई'],
    [/^i/g, 'इ'],
    [/^oo|^uu/g, 'ऊ'],
    [/^u/g, 'उ'],
    [/^e/g, 'ए'],
    [/^o/g, 'ओ'],
    [/^am|^an(?=[kptbcds])/g, 'अं'],
    [/^ru/g, 'ऋ']
  ];

  let initialPrefix = '';
  for (const [regex, dev] of initialVowels) {
    if (regex.test(s)) {
      initialPrefix = dev;
      s = s.replace(regex, '');
      break;
    }
  }

  // 2. Multi-char consonants & conjuncts
  const consonantsAndVowels: [RegExp, string][] = [
    [/ksha|kshi|kshu|ksho|ksh/g, 'क्ष'],
    [/dnya|jnya|gya|gy/g, 'ज्ञ'],
    [/shree|shri/g, 'श्री'],
    [/shra/g, 'श्र'],
    [/tra/g, 'त्र'],
    [/pra/g, 'प्र'],
    [/kra/g, 'क्र'],
    [/gra/g, 'ग्र'],
    [/dra/g, 'द्र'],
    [/bra/g, 'ब्र'],
    [/vra/g, 'व्र'],
    [/mra/g, 'म्र'],
    [/rya/g, 'र्य'],
    [/tya/g, 'त्य'],
    [/sta/g, 'स्त'],
    [/ska/g, 'स्क'],
    [/spa/g, 'स्प'],
    [/sma/g, 'स्म'],
    [/swa|sva/g, 'स्व'],
    [/chh/g, 'छ'],
    [/ch/g, 'च'],
    [/sh/g, 'श'],
    [/th/g, 'थ'],
    [/dh/g, 'ध'],
    [/bh/g, 'भ'],
    [/kh/g, 'ख'],
    [/gh/g, 'घ'],
    [/jh/g, 'झ'],
    [/ph/g, 'फ'],
    
    // Single consonants
    [/k/g, 'क'],
    [/g/g, 'ग'],
    [/j/g, 'ज'],
    [/t/g, 'त'],
    [/d/g, 'द'],
    [/n/g, 'न'],
    [/p/g, 'प'],
    [/b/g, 'ब'],
    [/m/g, 'म'],
    [/y/g, 'य'],
    [/r/g, 'र'],
    [/l/g, 'ल'],
    [/v|w/g, 'व'],
    [/s/g, 'स'],
    [/h/g, 'ह'],

    // Dependent Vowels (Matras after consonants)
    [/ee|ii/g, 'ी'],
    [/oo|uu/g, 'ू'],
    [/aa/g, 'ा'],
    [/ai/g, 'ै'],
    [/au/g, 'ौ'],
    [/i/g, 'ि'],
    [/u/g, 'ु'],
    [/e/g, 'े'],
    [/o/g, 'ो'],
    [/a/g, ''] // 'a' after consonant is the default inherent vowel in Devanagari
  ];

  let body = s;
  for (const [pattern, dev] of consonantsAndVowels) {
    body = body.replace(pattern, dev);
  }

  const result = initialPrefix + body;
  return cleanDevanagariText(result);
}

// Full text translators for documents
export function getLocalizedStudentName(student: Student, lang: 'en' | 'mr' | 'hi'): string {
  if (lang === 'en') {
    const raw = student.studentName || student.studentNameLocal || '';
    const clean = cleanEnglishText(raw);
    return deduplicateRepeatedPhrase(clean).replace(/[()[\]{}]/g, '').trim().toUpperCase();
  }
  // Marathi / Hindi
  const raw = student.studentNameLocal || student.studentName || '';
  const clean = extractCleanLanguageName(raw, lang);
  return deduplicateRepeatedPhrase(clean).replace(/[()[\]{}]/g, '').trim();
}

export function getLocalizedFatherName(student: Student, lang: 'en' | 'mr' | 'hi'): string {
  if (!student.fatherName && !student.fatherNameLocal) return '-';
  if (lang === 'en') {
    const raw = student.fatherName || student.fatherNameLocal || '';
    const clean = cleanEnglishText(raw);
    return deduplicateRepeatedPhrase(clean).replace(/[()[\]{}]/g, '').trim().toUpperCase();
  }
  const raw = student.fatherNameLocal || student.fatherName || '';
  const clean = extractCleanLanguageName(raw, lang);
  return deduplicateRepeatedPhrase(clean).replace(/[()[\]{}]/g, '').trim();
}

export function getLocalizedMotherName(student: Student, lang: 'en' | 'mr' | 'hi'): string {
  if (!student.motherName && !student.motherNameLocal) return '-';
  if (lang === 'en') {
    const raw = student.motherName || student.motherNameLocal || '';
    const clean = cleanEnglishText(raw);
    return deduplicateRepeatedPhrase(clean).replace(/[()[\]{}]/g, '').trim().toUpperCase();
  }
  const raw = student.motherNameLocal || student.motherName || '';
  const clean = extractCleanLanguageName(raw, lang);
  return deduplicateRepeatedPhrase(clean).replace(/[()[\]{}]/g, '').trim();
}

export function getLocalizedBirthPlace(student: Student, lang: 'en' | 'mr' | 'hi'): string {
  if (!student.birthPlace) return '-';
  if (lang === 'en') {
    return cleanEnglishText(student.birthPlace);
  }
  if (student.birthPlaceLocal) return extractCleanLanguageName(student.birthPlaceLocal, lang);

  const raw = student.birthPlace;
  const parts = raw.split(/,\s*/);
  const localized = parts.map(part => {
    const low = part.toLowerCase().trim();
    if (LOCATION_DICTIONARY[low]) {
      return lang === 'hi' ? LOCATION_DICTIONARY[low].hi : LOCATION_DICTIONARY[low].mr;
    }
    return transliterateToDevanagari(part);
  });
  return localized.join(', ');
}

export function getLocalizedNationality(student: Student, lang: 'en' | 'mr' | 'hi'): string {
  if (lang === 'en') {
    return cleanEnglishText(student.nationality) || 'Indian';
  }
  const low = (student.nationality || 'Indian').toLowerCase().trim();
  if (NATIONALITY_DICTIONARY[low]) {
    return lang === 'hi' ? NATIONALITY_DICTIONARY[low].hi : NATIONALITY_DICTIONARY[low].mr;
  }
  return lang === 'mr' ? 'भारतीय' : lang === 'hi' ? 'भारतीय' : 'Indian';
}

export function getLocalizedMotherTongue(student: Student, lang: 'en' | 'mr' | 'hi'): string {
  if (lang === 'en') {
    return cleanEnglishText(student.motherTongue) || 'Marathi';
  }
  const low = (student.motherTongue || 'Marathi').toLowerCase().trim();
  if (MOTHER_TONGUE_DICTIONARY[low]) {
    return lang === 'hi' ? MOTHER_TONGUE_DICTIONARY[low].hi : MOTHER_TONGUE_DICTIONARY[low].mr;
  }
  return transliterateToDevanagari(student.motherTongue || 'Marathi');
}

export function getLocalizedReligion(student: Student, lang: 'en' | 'mr' | 'hi'): string {
  if (!student.religion) return lang === 'mr' ? 'हिंदू' : lang === 'hi' ? 'हिन्दू' : 'Hindu';
  if (lang === 'en') {
    return cleanEnglishText(student.religion) || 'Hindu';
  }
  if (student.religionLocal) return extractCleanLanguageName(student.religionLocal, lang);

  const clean = cleanEnglishText(student.religion);
  const low = clean.toLowerCase().trim();
  if (RELIGION_DICTIONARY[low]) {
    return lang === 'hi' ? RELIGION_DICTIONARY[low].hi : RELIGION_DICTIONARY[low].mr;
  }
  return transliterateToDevanagari(student.religion);
}

export function getLocalizedCaste(student: Student, lang: 'en' | 'mr' | 'hi'): string {
  if (!student.caste) return '-';
  if (lang === 'en') {
    return cleanEnglishText(student.caste);
  }
  if (student.casteLocal) return extractCleanLanguageName(student.casteLocal, lang);

  const clean = cleanEnglishText(student.caste);
  const low = clean.toLowerCase().trim();
  if (CASTE_DICTIONARY[low]) {
    return lang === 'hi' ? CASTE_DICTIONARY[low].hi : CASTE_DICTIONARY[low].mr;
  }
  return transliterateToDevanagari(student.caste);
}

export function getLocalizedSubCaste(student: Student, lang: 'en' | 'mr' | 'hi'): string {
  if (!student.subCaste || student.subCaste === '-') return '-';
  if (lang === 'en') {
    return cleanEnglishText(student.subCaste);
  }
  if (student.subCasteLocal) return extractCleanLanguageName(student.subCasteLocal, lang);

  const clean = cleanEnglishText(student.subCaste);
  const low = clean.toLowerCase().trim();
  if (CASTE_DICTIONARY[low]) {
    return lang === 'hi' ? CASTE_DICTIONARY[low].hi : CASTE_DICTIONARY[low].mr;
  }
  return transliterateToDevanagari(student.subCaste);
}

export function getLocalizedPreviousSchool(student: Student, lang: 'en' | 'mr' | 'hi'): string {
  if (!student.previousSchool) {
    return lang === 'mr' ? 'थेट प्रवेश / नवीन प्रवेश' : lang === 'hi' ? 'सीधा प्रवेश' : 'Direct Admission';
  }
  if (lang === 'en') {
    return cleanEnglishText(student.previousSchool);
  }
  if (student.previousSchoolLocal) return extractCleanLanguageName(student.previousSchoolLocal, lang);

  const raw = student.previousSchool;
  
  // Specific known schools
  if (raw.includes('Adarsh High School')) {
    return lang === 'mr' ? 'आदर्श हायस्कूल, कोथरूड, पुणे' : 'आदर्श हाई स्कूल, कोथरुड, पुणे';
  }
  if (raw.includes('Chatrapati Shahu Vidyalaya')) {
    return lang === 'mr' ? 'छत्रपती शाहू विद्यालय, कोल्हापूर' : 'छत्रपति शाहू विद्यालय, कोल्हापुर';
  }
  if (raw.includes('Saraswati Bal Mandir')) {
    return lang === 'mr' ? 'सरस्वती बाल मंदिर, नाशिक' : 'सरस्वती बाल मंदिर, नासिक';
  }
  if (raw.includes('Zilla Parishad Primary School') || raw.includes('Z. P. Primary School')) {
    return lang === 'mr' ? 'जिल्हा परिषद प्राथमिक शाळा, सातारा' : 'जिला परिषद प्राथमिक विद्यालय, सतारा';
  }
  if (raw.includes('National English Medium School')) {
    return lang === 'mr' ? 'नॅशनल इंग्लिश मीडियम स्कूल, पुणे' : 'नेशनल इंग्लिश मीडियम स्कूल, पुणे';
  }
  if (raw.includes('New English School')) {
    return lang === 'mr' ? 'न्यू इंग्लिश स्कूल, सोलापूर' : 'न्यू इंग्लिश स्कूल, सोलापुर';
  }

  return transliterateToDevanagari(raw);
}

export function getLocalizedClass(cls: AdmissionClass | string, lang: 'en' | 'mr' | 'hi'): string {
  const match = CLASS_MAP[cls];
  if (match) {
    return match[lang] || match.en;
  }
  return cls;
}

export function getLocalizedProgress(progress?: string, lang: 'en' | 'mr' | 'hi' = 'mr'): string {
  if (!progress) return lang === 'mr' ? 'समाधानकारक / उत्तम' : lang === 'hi' ? 'संतोषजनक / उत्तम' : 'Good & Satisfactory';
  if (lang === 'en') {
    return cleanEnglishText(progress);
  }

  const clean = cleanEnglishText(progress);
  const low = clean.toLowerCase().trim();
  if (low.includes('excellent') && low.includes('a+')) {
    return lang === 'mr' ? 'उत्कृष्ट (अ+ श्रेणी)' : 'उत्कृष्ट (ए+ ग्रेड)';
  }
  if (low.includes('excellent') || low.includes('outstanding')) {
    return lang === 'mr' ? 'उत्कृष्ट' : 'उत्कृष्ट';
  }
  if (low.includes('first class')) {
    return lang === 'mr' ? 'प्रथम श्रेणी' : 'प्रथम श्रेणी';
  }
  if (low.includes('distinction')) {
    return lang === 'mr' ? 'विशेष प्राविण्य' : 'विशेष योग्यता';
  }
  if (low.includes('satisfactory')) {
    return lang === 'mr' ? 'समाधानकारक' : 'संतोषजनक';
  }
  if (low.includes('good')) {
    return lang === 'mr' ? 'उत्तम' : 'उत्तम';
  }
  return lang === 'mr' ? 'उत्तम व समाधानकारक' : 'उत्तम एवं संतोषजनक';
}

export function getLocalizedBehaviour(behaviour?: string, lang: 'en' | 'mr' | 'hi' = 'mr'): string {
  if (!behaviour) return lang === 'mr' ? 'उत्तम व आज्ञाधारक' : lang === 'hi' ? 'उत्तम एवं आज्ञाकारी' : 'Good & Obedient';
  if (lang === 'en') {
    return cleanEnglishText(behaviour);
  }

  const clean = cleanEnglishText(behaviour);
  const low = clean.toLowerCase().trim();
  if (low.includes('cooperative')) {
    return lang === 'mr' ? 'उत्कृष्ट व सहकार्यशील' : 'अति उत्तम एवं सहयोगी';
  }
  if (low.includes('disciplined')) {
    return lang === 'mr' ? 'उत्तम व शिस्तबद्ध' : 'उत्तम एवं अनुशासित';
  }
  if (low.includes('exemplary')) {
    return lang === 'mr' ? 'अनुकरणीय' : 'अनुकरणीय';
  }
  if (low.includes('well behaved')) {
    return lang === 'mr' ? 'सद्वर्तनी व आज्ञाधारक' : 'सदाचारी एवं आज्ञाकारी';
  }
  if (low.includes('punctual')) {
    return lang === 'mr' ? 'वेळेचे पालन करणारा' : 'समयनिष्ठ';
  }
  if (low.includes('obedient')) {
    return lang === 'mr' ? 'उत्तम व आज्ञाधारक' : 'उत्तम एवं आज्ञाकारी';
  }
  if (low.includes('good')) {
    return lang === 'mr' ? 'उत्तम' : 'उत्तम';
  }
  return lang === 'mr' ? 'उत्तम' : 'उत्तम';
}

export function getLocalizedLeavingReason(reason?: string, lang: 'en' | 'mr' | 'hi' = 'mr'): string {
  if (!reason) {
    return lang === 'mr' ? 'पालकांची बदली / अभ्यासक्रम पूर्ण' : lang === 'hi' ? 'अभिभावक का स्थानांतरण / पाठ्यक्रम पूर्ण' : 'Parent Transfer / Completed Course';
  }
  if (lang === 'en') {
    return cleanEnglishText(reason);
  }

  const clean = cleanEnglishText(reason);
  const low = clean.toLowerCase().trim();
  if (low.includes('transfer')) {
    return lang === 'mr' ? 'पालकांची बदली' : 'अभिभावक का स्थानांतरण';
  }
  if (low.includes('higher education') || low.includes('higher studies')) {
    return lang === 'mr' ? 'पुढील उच्च शिक्षणासाठी' : 'उच्च शिक्षा हेतु';
  }
  if (low.includes('completed')) {
    return lang === 'mr' ? 'अभ्यासक्रम पूर्ण झाल्यामुळे' : 'पाठ्यक्रम पूर्ण होने पर';
  }
  if (low.includes('passed 10th')) {
    return lang === 'mr' ? 'इयत्ता १० वी उत्तीर्ण होऊन शाळा सोडली' : 'कक्षा १०वीं उत्तीर्ण';
  }
  if (low.includes('passed 12th')) {
    return lang === 'mr' ? 'इयत्ता १२ वी उत्तीर्ण होऊन शाळा सोडली' : 'कक्षा १२वीं उत्तीर्ण';
  }
  if (low.includes('parent request')) {
    return lang === 'mr' ? 'पालकांच्या विनंतीनुसार' : 'अभिभावक के अनुरोध पर';
  }
  return transliterateToDevanagari(reason);
}

export function getLocalizedBoard(boardName?: string, lang: 'en' | 'mr' | 'hi' = 'mr'): string {
  if (!boardName) return lang === 'mr' ? 'अमरावती' : lang === 'hi' ? 'अमरावती' : 'Amravati';
  if (lang === 'en') {
    return cleanEnglishText(boardName);
  }
  const clean = cleanEnglishText(boardName);
  const low = clean.toLowerCase().trim();
  if (BOARD_DICTIONARY[low]) {
    return lang === 'hi' ? BOARD_DICTIONARY[low].hi : BOARD_DICTIONARY[low].mr;
  }
  return transliterateToDevanagari(boardName);
}

export function getLocalizedAddress(address?: string, lang: 'en' | 'mr' | 'hi' = 'mr'): string {
  if (!address) return '';
  if (lang === 'en') {
    return cleanEnglishText(address);
  }

  if (address.includes('At Post Chikhli') || address.includes('Chikhli, Dist. Buldhana')) {
    return lang === 'mr' 
      ? 'मु. पो. चिखली, जि. बुलढाणा, महाराष्ट्र - ४४३२०१' 
      : 'मु. पो. चिखली, जिला बुलढाणा, महाराष्ट्र - ४४३२०१';
  }

  let text = address;
  text = text.replace(/At Post|A\/P|At & Post/gi, lang === 'mr' ? 'मु. पो.' : 'मु. पो.');
  text = text.replace(/Dist\.?|District/gi, lang === 'mr' ? 'जि.' : 'जिला');
  text = text.replace(/Tal\.?|Taluka/gi, lang === 'mr' ? 'ता.' : 'तहसील');
  text = text.replace(/Maharashtra/gi, 'महाराष्ट्र');
  text = text.replace(/India/gi, 'भारत');

  return transliterateToDevanagari(text);
}

export function getLocalizedRecognitionNo(recNo?: string, lang: 'en' | 'mr' | 'hi' = 'mr'): string {
  if (!recNo) {
    return lang === 'mr' 
      ? 'क्र. व. दि. बु. जि. प. / माध्यमिक शाळा / तपासणी १११५० शिक्षण विभाग बुलढाणा, दि. १८/१०/१९६५'
      : lang === 'hi'
      ? 'क्र. व. दि. बु. जि. प. / माध्यमिक विद्यालय / निरीक्षण १११५० शिक्षा विभाग बुलढाणा, दि. १८/१०/१९६५'
      : 'Kr. Va Di. Bu. Ji. Pa. / Secondary School / Inspection 11150 Education Department Buldhana, Dt. 18/10/65';
  }
  if (lang === 'en') {
    return cleanEnglishText(recNo);
  }
  
  if (recNo.includes('Kr. Va Di. Bu. Ji. Pa.') || recNo.includes('Education Department Buldhana')) {
    return lang === 'mr' 
      ? 'क्र. व. दि. बु. जि. प. / माध्यमिक शाळा / तपासणी १११५० शिक्षण विभाग बुलढाणा, दि. १८/१०/१९६५'
      : 'क्र. व. दि. बु. जि. प. / माध्यमिक विद्यालय / निरीक्षण १११५० शिक्षा विभाग बुलढाणा, दि. १८/१०/१९६५';
  }

  return transliterateToDevanagari(recNo);
}

export function getLocalizedSansthaName(sansthaAffiliation?: string, lang: 'en' | 'mr' | 'hi' = 'mr'): string {
  if (lang === 'en') {
    return cleanEnglishText(sansthaAffiliation) || 'Shri Shivaji Shikshan Sanstha, Amravati – Managed by';
  }
  if (lang === 'mr' || lang === 'hi') {
    return 'श्री शिवाजी शिक्षण संस्था, अमरावती द्वारा संचालित';
  }
  return sansthaAffiliation || 'Shri Shivaji Shikshan Sanstha, Amravati – Managed by';
}

export function cleanAndLocalizePlace(val?: string, lang: 'en' | 'mr' | 'hi' = 'mr'): string {
  if (!val) {
    return lang === 'en' ? 'At Post Chikhli' : 'मु. पो. चिखली';
  }

  if (lang === 'en') {
    let s = val
      .replace(/मु\.?\s*पो\.?/gi, 'At Post ')
      .replace(/ता\.?/gi, 'Tal. ')
      .replace(/जि\.?/gi, 'Dist. ')
      .replace(/चिखली/gi, 'Chikhli')
      .replace(/बुलढाणा/gi, 'Buldhana');
    return cleanEnglishText(s).trim() || 'At Post Chikhli';
  }

  // Marathi / Hindi
  let s = val.trim();

  // Explicit match for At Post Chikhli variations
  if (/^(at\s*post|at\s*&\s*post|a\/p|at|post)?\s*chikhli$/i.test(s)) {
    if (/at\s*post|at\s*&\s*post|a\/p/i.test(s)) {
      return 'मु. पो. चिखली';
    }
    return 'चिखली';
  }

  // General replacements
  s = s.replace(/\bAt\s*&\s*Post\b|\bAt\s+Post\b|\bA\/P\b|\bA\.\s*P\.\b/gi, 'मु. पो.');
  s = s.replace(/\bPost\b/gi, 'पो.');
  s = s.replace(/\bTaluka\b|\bTal\b\.?/gi, 'ता.');
  s = s.replace(/\bDistrict\b|\bDist\b\.?/gi, lang === 'hi' ? 'जिला' : 'जि.');
  s = s.replace(/\bChikhli\b/gi, 'चिखली');
  s = s.replace(/\bBuldhana\b|\bBuldana\b/gi, 'बुलढाणा');
  s = s.replace(/\bMehkar\b/gi, 'मेहकर');
  s = s.replace(/\bKhamgaon\b/gi, 'खामगाव');
  s = s.replace(/\bMalkapur\b/gi, 'मलकापूर');
  s = s.replace(/\bJalgaon\b/gi, 'जळगाव');
  s = s.replace(/\bAkola\b/gi, 'अकोला');
  s = s.replace(/\bAmravati\b/gi, 'अमरावती');
  s = s.replace(/\bPune\b/gi, 'पुणे');
  s = s.replace(/\bMumbai\b/gi, 'मुंबई');
  s = s.replace(/\bNagpur\b/gi, 'नागपूर');
  s = s.replace(/\bNashik\b|\bNasik\b/gi, 'नाशिक');
  s = s.replace(/\bMaharashtra\b/gi, 'महाराष्ट्र');
  s = s.replace(/\bIndia\b/gi, 'भारत');

  // If there are still any English letters, transliterate them to Devanagari
  if (/[a-zA-Z]/.test(s)) {
    s = transliterateToDevanagari(s);
  }

  return s.trim();
}

export function cleanAndLocalizeTaluka(val?: string, lang: 'en' | 'mr' | 'hi' = 'mr'): string {
  const localized = cleanAndLocalizePlace(val, lang);
  if (lang === 'en') {
    return localized.replace(/^At\s+Post\s+/i, '').replace(/,\s*Dist.*$/i, '').trim() || 'Chikhli';
  }
  return localized.replace(/^मु\.?\s*पो\.?\s*/i, '').replace(/,\s*जि.*$/i, '').trim() || 'चिखली';
}

