import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';

// Load fonts
const fontRegularPath = path.join(process.env.HOME || '/root', '.local/share/fonts/NotoSansDevanagari-Regular.ttf');
const fontBoldPath = path.join(process.env.HOME || '/root', '.local/share/fonts/NotoSansDevanagari-Bold.ttf');

const fontRegularB64 = fs.readFileSync(fontRegularPath).toString('base64');
const fontBoldB64 = fs.readFileSync(fontBoldPath).toString('base64');

// Initialize A4 Landscape jsPDF (842 x 595.28 pt)
const doc = new jsPDF({
  orientation: 'landscape',
  unit: 'pt',
  format: 'a4'
});

// Register fonts
doc.addFileToVFS('NotoSansDevanagari-Regular.ttf', fontRegularB64);
doc.addFont('NotoSansDevanagari-Regular.ttf', 'Deva', 'normal');

doc.addFileToVFS('NotoSansDevanagari-Bold.ttf', fontBoldB64);
doc.addFont('NotoSansDevanagari-Bold.ttf', 'Deva', 'bold');

const W = 842;
const H = 595.28;

// Text sanitizer to prevent jsPDF Node parentheses delimiter parser bug
function safeText(str) {
  if (!str) return '';
  return String(str)
    .replace(/\(/g, '[')
    .replace(/\)/g, ']')
    .replace(/"/g, "'");
}

// Custom text printer that always uses safeText
function printText(text, x, y, options) {
  doc.text(safeText(text), x, y, options);
}

function printSplitText(text, x, y, maxW) {
  const safe = safeText(text);
  const lines = doc.splitTextToSize(safe, maxW);
  doc.text(lines, x, y);
}

// Background for presentation slide
function drawSlideBase(slideNum, totalSlides, title, category) {
  // Deep elegant slate background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, W, H, 'F');

  // Decorative header band
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, W, 64, 'F');

  // Blue accent line under header
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 62, W, 2.5, 'F');

  // Category Tag
  doc.setFillColor(30, 58, 138); // blue-900
  doc.roundedRect(30, 16, 140, 22, 6, 6, 'F');
  doc.setFont('Deva', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(147, 197, 253); // blue-300
  printText(category, 40, 31);

  // Slide Title
  doc.setFont('Deva', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(255, 255, 255);
  printText(title, 185, 33);

  // School small branding at top right
  doc.setFont('Deva', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225); // slate-300
  printText('श्री शिवाजी हायस्कूल व कनिष्ठ महाविद्यालय, चिखली', W - 30, 26, { align: 'right' });
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  printText('UDISE: 27070200119 | शैक्षणिक वर्ष: 2026-2027', W - 30, 40, { align: 'right' });

  // Footer bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, H - 28, W, 28, 'F');
  doc.setDrawColor(51, 65, 85); // slate-700
  doc.setLineWidth(1);
  doc.line(30, H - 28, W - 30, H - 28);

  doc.setFont('Deva', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  printText('Shalaverse - शाळा व्यवस्थापन व डिजिटल जनरल रजिस्टर प्रणाली | संपूर्ण वापर मार्गदर्शिका', 30, H - 11);
  printText(`स्लाईड ${slideNum} / ${totalSlides}`, W - 30, H - 11, { align: 'right' });
}

// Window Mockup container
function drawWindowFrame(x, y, w, h, winTitle) {
  // Window shadow / border
  doc.setFillColor(2, 6, 23); // slate-950
  doc.roundedRect(x, y, w, h, 10, 10, 'F');
  doc.setDrawColor(51, 65, 85); // slate-700
  doc.setLineWidth(1.2);
  doc.roundedRect(x, y, w, h, 10, 10, 'S');

  // Window titlebar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(x, y, w, 28, 10, 10, 'F');
  doc.rect(x, y + 16, w, 12, 'F');
  doc.setDrawColor(51, 65, 85);
  doc.line(x, y + 28, x + w, y + 28);

  // 3 macOS style window dots
  doc.setFillColor(239, 68, 68); // red
  doc.circle(x + 16, y + 14, 4, 'F');
  doc.setFillColor(245, 158, 11); // amber
  doc.circle(x + 28, y + 14, 4, 'F');
  doc.setFillColor(34, 197, 94); // green
  doc.circle(x + 40, y + 14, 4, 'F');

  // Address bar
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(x + 60, y + 6, w - 120, 16, 4, 4, 'F');
  doc.setFont('Deva', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  printText(winTitle, x + w / 2, y + 17, { align: 'center' });
}

// Draw a prominent Red Arrow pointing from (fromX, fromY) to (toX, toY)
function drawRedArrow(fromX, fromY, toX, toY, labelNumber) {
  doc.setDrawColor(239, 68, 68); // red-500
  doc.setLineWidth(3);
  doc.line(fromX, fromY, toX, toY);

  const angle = Math.atan2(toY - fromY, toX - fromX);
  const headLen = 10;
  const p1X = toX - headLen * Math.cos(angle - Math.PI / 6);
  const p1Y = toY - headLen * Math.sin(angle - Math.PI / 6);
  const p2X = toX - headLen * Math.cos(angle + Math.PI / 6);
  const p2Y = toY - headLen * Math.sin(angle + Math.PI / 6);

  doc.setFillColor(239, 68, 68);
  doc.triangle(toX, toY, p1X, p1Y, p2X, p2Y, 'F');

  if (labelNumber) {
    doc.setFillColor(220, 38, 38);
    doc.circle(fromX, fromY, 11, 'F');
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1.2);
    doc.circle(fromX, fromY, 11, 'S');

    doc.setFont('Deva', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    printText(String(labelNumber), fromX, fromY + 3.5, { align: 'center' });
  }
}

// Draw an Annotation Callout Card on the side
function drawCalloutBox(x, y, w, h, num, title, description, badgeColor = 'red') {
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(x, y, w, h, 8, 8, 'F');

  if (badgeColor === 'red') {
    doc.setDrawColor(239, 68, 68);
    doc.setFillColor(220, 38, 38);
  } else if (badgeColor === 'amber') {
    doc.setDrawColor(245, 158, 11);
    doc.setFillColor(217, 119, 6);
  } else if (badgeColor === 'blue') {
    doc.setDrawColor(59, 130, 246);
    doc.setFillColor(37, 99, 235);
  } else {
    doc.setDrawColor(16, 185, 129);
    doc.setFillColor(5, 150, 105);
  }

  doc.setLineWidth(1.5);
  doc.roundedRect(x, y, w, h, 8, 8, 'S');

  doc.circle(x + 18, y + 18, 10, 'F');
  doc.setFont('Deva', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  printText(String(num), x + 18, y + 21.5, { align: 'center' });

  doc.setFont('Deva', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  printText(title, x + 35, y + 21);

  doc.setFont('Deva', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(203, 213, 225);
  printSplitText(description, x + 12, y + 38, w - 24);
}

console.log('Generating sanitized presentation slides...');

// ==========================================
// SLIDE 1: मुखपृष्ठ (COVER PAGE)
// ==========================================
drawSlideBase(1, 8, 'श्री शिवाजी हायस्कूल - संपूर्ण वेबसाइट वापर मार्गदर्शिका', 'प्रस्तावना व परिचय');

// Large Hero Banner Card
doc.setFillColor(30, 41, 59);
doc.roundedRect(30, 80, W - 60, H - 125, 14, 14, 'F');
doc.setDrawColor(59, 130, 246);
doc.setLineWidth(2);
doc.roundedRect(30, 80, W - 60, H - 125, 14, 14, 'S');

// Golden School Badge Header
doc.setFillColor(245, 158, 11);
doc.roundedRect(W / 2 - 160, 105, 320, 26, 6, 6, 'F');
doc.setFont('Deva', 'bold');
doc.setFontSize(11);
doc.setTextColor(15, 23, 42);
printText('★ महाराष्ट्र शासन मान्यताप्राप्त व बोर्ड संलग्न ★', W / 2, 122, { align: 'center' });

// Main Big School Title
doc.setFont('Deva', 'bold');
doc.setFontSize(25);
doc.setTextColor(255, 255, 255);
printText('श्री शिवाजी हायस्कूल आणि ज्युनिअर कॉलेज, चिखली', W / 2, 168, { align: 'center' });

doc.setFont('Deva', 'bold');
doc.setFontSize(14.5);
doc.setTextColor(147, 197, 253);
printText('Shalaverse - शाळा प्रवेश व डिजिटल जनरल रजिस्टर व्यवस्थापन प्रणाली', W / 2, 196, { align: 'center' });

doc.setFont('Deva', 'normal');
doc.setFontSize(11.5);
doc.setTextColor(203, 213, 225);
printText('शाळेची वेबसाइट कशी वापरावी? - स्क्रीनशॉट्स, लाल बाण [Red Arrows] व सविस्तर स्पष्टीकरण मार्गदर्शिका', W / 2, 222, { align: 'center' });

// 4 Feature Pillars Cards
const cardW = 180;
const cardH = 145;
const startX = 45;
const cardY = 255;
const gap = 16;

const pillars = [
  {
    num: '१',
    title: 'सुलभ लॉगिन व सुरक्षा',
    desc: 'शाळेचा ईमेल किंवा UDISE आणि पासवर्ड वापरून सुरक्षित लॉगिन. पासवर्ड विसरल्यास १-क्लिक रिकव्हरी व्यवस्था.'
  },
  {
    num: '२',
    title: 'डिजिटल जनरल रजिस्टर',
    desc: 'इयत्ता १ ली ते १२ वी पर्यंतच्या सर्व विद्यार्थ्यांची संपूर्ण माहिती, जात, जन्मतारीख व आधार सुरक्षित नोंद.'
  },
  {
    num: '३',
    title: '१-क्लिक दाखले [LC/बोनाफाईड]',
    desc: 'शाळा सोडल्याचा दाखला [LC], बोनाफाईड व निर्गम उतारा शासकीय नियमांनुसार स्वयंचलित त्वरित तयार करा.'
  },
  {
    num: '४',
    title: 'एक्सेल बॅकअप व अहवाल',
    desc: 'शाळेचा सर्व डेटा एक्सेलमध्ये सेव्ह करण्याची सुविधा आणि सरल [SARAL] पोर्टलसाठी सुसंगत फॉरमॅट.'
  }
];

pillars.forEach((p, idx) => {
  const cx = startX + idx * (cardW + gap);
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(cx, cardY, cardW, cardH, 10, 10, 'F');
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(1.2);
  doc.roundedRect(cx, cardY, cardW, cardH, 10, 10, 'S');

  doc.setFillColor(37, 99, 235);
  doc.circle(cx + 22, cardY + 22, 12, 'F');
  doc.setFont('Deva', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  printText(p.num, cx + 22, cardY + 26, { align: 'center' });

  doc.setFont('Deva', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  printText(p.title, cx + 42, cardY + 26);

  doc.setDrawColor(51, 65, 85);
  doc.line(cx + 12, cardY + 44, cx + cardW - 12, cardY + 44);

  doc.setFont('Deva', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(203, 213, 225);
  printSplitText(p.desc, cx + 12, cardY + 62, cardW - 24);
});

// Footer School Metadata in Cover
doc.setFont('Deva', 'normal');
doc.setFontSize(9.5);
doc.setTextColor(148, 163, 184);
printText('पत्ता: मुख्य रस्ता, चिखली, जि. बुलढाणा - ४४३२०१ | फोन: ०७२६४-२४२२३३ | ईमेल: shivajischool.chikhli@gmail.com', W / 2, 435, { align: 'center' });

// ==========================================
// SLIDE 2: पायरी १ - लॉगिन स्क्रीन (LOGIN PAGE WITH RED ARROWS)
// ==========================================
doc.addPage();
drawSlideBase(2, 8, 'पायरी १: शाळा पोर्टलमध्ये लॉगिन कसे करावे?', 'लॉगिन मार्गदर्शिका');

const winW = 460;
const winH = 470;
drawWindowFrame(30, 75, winW, winH, 'https://shalaverse.in/login - शाळा लॉगिन पोर्टल');

const cardMx = 30 + 55;
const cardMy = 75 + 40;
const cardMw = 350;
const cardMh = 390;

doc.setFillColor(15, 23, 42);
doc.roundedRect(cardMx, cardMy, cardMw, cardMh, 12, 12, 'F');
doc.setDrawColor(51, 65, 85);
doc.roundedRect(cardMx, cardMy, cardMw, cardMh, 12, 12, 'S');

doc.setFillColor(37, 99, 235);
doc.roundedRect(cardMx + cardMw / 2 - 16, cardMy + 16, 32, 32, 8, 8, 'F');
doc.setFont('Deva', 'bold');
doc.setFontSize(14);
doc.setTextColor(255, 255, 255);
printText('🏫', cardMx + cardMw / 2, cardMy + 38, { align: 'center' });

doc.setFont('Deva', 'bold');
doc.setFontSize(16);
doc.setTextColor(255, 255, 255);
printText('SHALAVERSE', cardMx + cardMw / 2, cardMy + 64, { align: 'center' });

doc.setFont('Deva', 'normal');
doc.setFontSize(9);
doc.setTextColor(147, 197, 253);
printText('शाळा प्रवेश व जनरल रजिस्टर व्यवस्थापन', cardMx + cardMw / 2, cardMy + 78, { align: 'center' });

// Form Label 1: Email / UDISE
const f1Y = cardMy + 105;
doc.setFont('Deva', 'bold');
doc.setFontSize(9.5);
doc.setTextColor(226, 232, 240);
printText('नोंदणीकृत ईमेल किंवा युडायस [UDISE] नंबर *', cardMx + 20, f1Y);

// Input Box 1
doc.setFillColor(2, 6, 23);
doc.roundedRect(cardMx + 20, f1Y + 7, cardMw - 40, 32, 6, 6, 'F');
doc.setDrawColor(59, 130, 246);
doc.setLineWidth(1.5);
doc.roundedRect(cardMx + 20, f1Y + 7, cardMw - 40, 32, 6, 6, 'S');

doc.setFont('Deva', 'normal');
doc.setFontSize(8.8);
doc.setTextColor(148, 163, 184);
printText('✉️  shivajischool.chikhli@gmail.com किंवा 27070200119', cardMx + 30, f1Y + 27);

// Form Label 2: Password
const f2Y = cardMy + 165;
doc.setFont('Deva', 'bold');
doc.setFontSize(9.5);
doc.setTextColor(226, 232, 240);
printText('पासवर्ड *', cardMx + 20, f2Y);

doc.setFont('Deva', 'bold');
doc.setFontSize(8.5);
doc.setTextColor(96, 165, 250);
printText('पासवर्ड विसरलात?', cardMx + cardMw - 20, f2Y, { align: 'right' });

// Input Box 2
doc.setFillColor(2, 6, 23);
doc.roundedRect(cardMx + 20, f2Y + 7, cardMw - 40, 32, 6, 6, 'F');
doc.setDrawColor(51, 65, 85);
doc.setLineWidth(1);
doc.roundedRect(cardMx + 20, f2Y + 7, cardMw - 40, 32, 6, 6, 'S');

doc.setFont('Deva', 'normal');
doc.setFontSize(11);
doc.setTextColor(203, 213, 225);
printText('🔒  ••••••••••••••••  [तुमचा पासवर्ड]', cardMx + 30, f2Y + 27);

// Login Button
const btnY = cardMy + 230;
doc.setFillColor(37, 99, 235);
doc.roundedRect(cardMx + 20, btnY, cardMw - 40, 36, 8, 8, 'F');
doc.setFont('Deva', 'bold');
doc.setFontSize(11.5);
doc.setTextColor(255, 255, 255);
printText('➔  लॉगिन करा - Sign In', cardMx + cardMw / 2, btnY + 23, { align: 'center' });

// Demo Credentials Reminder Box
doc.setFillColor(30, 41, 59);
doc.roundedRect(cardMx + 20, btnY + 52, cardMw - 40, 56, 6, 6, 'F');
doc.setDrawColor(59, 130, 246);
doc.setLineWidth(1);
doc.roundedRect(cardMx + 20, btnY + 52, cardMw - 40, 56, 6, 6, 'S');

doc.setFont('Deva', 'bold');
doc.setFontSize(8.5);
doc.setTextColor(245, 158, 11);
printText('💡 श्री शिवाजी विद्यालय अधिकृत लॉगिन माहिती:', cardMx + 28, btnY + 68);
doc.setFont('Deva', 'normal');
doc.setFontSize(8);
doc.setTextColor(203, 213, 225);
printText('• ईमेल / UDISE: shivajischool.chikhli@gmail.com किंवा 27070200119', cardMx + 28, btnY + 83);
printText('• डिफॉल्ट पासवर्ड: Shala@123 - किंवा तुम्ही सेट केलेला नवीन पासवर्ड', cardMx + 28, btnY + 97);

// Right Side: 4 Callouts with RED ARROWS
const rightX = 510;
const calloutW = 300;

drawCalloutBox(
  rightX,
  75,
  calloutW,
  82,
  '१',
  'शाळेचा ईमेल किंवा UDISE टाका',
  'या रकान्यात शाळेचा अधिकृत ईमेल [shivajischool.chikhli@gmail.com] किंवा शाळेचा ११ अंकी UDISE क्रमांक [27070200119] प्रविष्ट करा.',
  'red'
);
drawRedArrow(rightX - 10, 115, cardMx + cardMw - 20, f1Y + 23, 1);

drawCalloutBox(
  rightX,
  175,
  calloutW,
  82,
  '२',
  'शाळेचा पासवर्ड प्रविष्ट करा',
  'येथे शाळेचा गुप्त पासवर्ड टाईप करा. शाळेचा मूळ पासवर्ड Shala@123 आहे, किंवा तुम्ही जो नवीन पासवर्ड सेट केला असेल तो येथे टाका.',
  'red'
);
drawRedArrow(rightX - 10, 215, cardMx + cardMw - 20, f2Y + 23, 2);

drawCalloutBox(
  rightX,
  275,
  calloutW,
  75,
  '३',
  'लॉगिन करा बटण दाबा',
  'माहिती भरल्यानंतर या निळ्या बटणावर क्लिक करा. माहिती बरोबर असल्यास थेट शाळेचा मुख्य डॅशबोर्ड उघडेल.',
  'blue'
);
drawRedArrow(rightX - 10, 310, cardMx + cardMw - 20, btnY + 18, 3);

drawCalloutBox(
  rightX,
  370,
  calloutW,
  85,
  '४',
  'पासवर्ड विसरलात? [Password Reset]',
  'जर पासवर्ड आठवत नसेल तर "पासवर्ड विसरलात?" वर क्लिक करा. शाळेचा पिन [8788] वापरून तुम्ही तात्काळ नवीन पासवर्ड तयार करू शकता.',
  'amber'
);
drawRedArrow(rightX - 10, 410, cardMx + cardMw - 35, f2Y - 3, 4);

// ==========================================
// SLIDE 3: पायरी २ - मुख्य डॅशबोर्ड (MAIN DASHBOARD WITH RED ARROWS)
// ==========================================
doc.addPage();
drawSlideBase(3, 8, 'पायरी २: मुख्य डॅशबोर्ड व नेव्हिगेशन मार्गदर्शिका', 'डॅशबोर्ड परिचय');

const dWinW = 470;
const dWinH = 470;
drawWindowFrame(30, 75, dWinW, dWinH, 'https://shalaverse.in/dashboard - श्री शिवाजी हायस्कूल डॅशबोर्ड');

const dx = 42;
const dy = 75 + 34;
doc.setFillColor(30, 41, 59);
doc.roundedRect(dx, dy, dWinW - 24, 40, 6, 6, 'F');
doc.setFont('Deva', 'bold');
doc.setFontSize(10.5);
doc.setTextColor(255, 255, 255);
printText('श्री शिवाजी हायस्कूल आणि ज्युनिअर कॉलेज, चिखली', dx + 12, dy + 18);
doc.setFontSize(8);
doc.setTextColor(147, 197, 253);
printText('UDISE: 27070200119 | शैक्षणिक वर्ष: 2026-2027 | मुख्याध्यापक: श्री. व्ही. एम. पाटील', dx + 12, dy + 32);

// Top Right Button in Header: "+ विद्यार्थी जोडा"
const addBtnX = dx + dWinW - 140;
doc.setFillColor(37, 99, 235);
doc.roundedRect(addBtnX, dy + 7, 105, 26, 6, 6, 'F');
doc.setFont('Deva', 'bold');
doc.setFontSize(9);
doc.setTextColor(255, 255, 255);
printText('+ विद्यार्थी जोडा', addBtnX + 52, dy + 23, { align: 'center' });

// 4 Metric cards
const mCardY = dy + 50;
const mCardW = 100;
const mCardH = 55;
const metrics = [
  { label: 'एकूण विद्यार्थी', val: '१,२४८', color: [37, 99, 235] },
  { label: 'मुले - Boys', val: '६८४', color: [16, 185, 129] },
  { label: 'मुली - Girls', val: '५६४', color: [236, 72, 153] },
  { label: 'दाखले वितरीत', val: '८६', color: [245, 158, 11] }
];

metrics.forEach((m, i) => {
  const mx = dx + i * (mCardW + 12);
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(mx, mCardY, mCardW, mCardH, 6, 6, 'F');
  doc.setDrawColor(51, 65, 85);
  doc.roundedRect(mx, mCardY, mCardW, mCardH, 6, 6, 'S');

  doc.setFont('Deva', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  printText(m.label, mx + 8, mCardY + 16);

  doc.setFont('Deva', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(m.color[0], m.color[1], m.color[2]);
  printText(m.val, mx + 8, mCardY + 40);
});

// Quick Action Buttons Row
const qRowY = mCardY + 68;
const qBtns = [
  { label: '📋 जनरल रजिस्टर', col: [59, 130, 246] },
  { label: '📄 शाळा दाखले LC', col: [245, 158, 11] },
  { label: '🎓 बोनाफाईड दाखला', col: [16, 185, 129] },
  { label: '📥 एक्सेल डाउनलोड', col: [168, 85, 247] }
];

qBtns.forEach((qb, i) => {
  const qx = dx + i * (mCardW + 12);
  doc.setFillColor(qb.col[0], qb.col[1], qb.col[2]);
  doc.roundedRect(qx, qRowY, mCardW, 28, 6, 6, 'F');
  doc.setFont('Deva', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  printText(qb.label, qx + mCardW / 2, qRowY + 17, { align: 'center' });
});

// Search & Table Mockup Section
const tY = qRowY + 38;
doc.setFillColor(15, 23, 42);
doc.roundedRect(dx, tY, dWinW - 24, 180, 8, 8, 'F');
doc.setDrawColor(51, 65, 85);
doc.roundedRect(dx, tY, dWinW - 24, 180, 8, 8, 'S');

doc.setFillColor(2, 6, 23);
doc.roundedRect(dx + 12, tY + 10, dWinW - 48, 24, 4, 4, 'F');
doc.setFont('Deva', 'normal');
doc.setFontSize(8);
doc.setTextColor(100, 116, 139);
printText('🔍 विद्यार्थ्याचे नाव, जनरल रजिस्टर [GR] नंबर किंवा आधार नंबरने शोधा...', dx + 22, tY + 25);

// Table Header Row
const thY = tY + 44;
doc.setFillColor(30, 41, 59);
doc.rect(dx + 12, thY, dWinW - 48, 20, 'F');
doc.setFont('Deva', 'bold');
doc.setFontSize(7.5);
doc.setTextColor(203, 213, 225);
printText('GR नं', dx + 20, thY + 14);
printText('विद्यार्थ्याचे संपूर्ण नाव', dx + 65, thY + 14);
printText('वर्ग-तुकडी', dx + 200, thY + 14);
printText('जात / प्रवर्ग', dx + 265, thY + 14);
printText('कृती [Actions]', dx + 355, thY + 14);

// Sample Rows
const sampleRows = [
  { gr: '४२१०', name: 'कदम राहुल विजय', std: '१० वी - अ', caste: 'मराठा - Open', act: '[View] [Edit] [LC]' },
  { gr: '४२११', name: 'पवार स्नेहा गणेश', std: '१० वी - ब', caste: 'कुणबी - OBC', act: '[View] [Edit] [LC]' },
  { gr: '४२१२', name: 'इंगळे रोहन संजय', std: '९ वी - अ', caste: 'बौद्ध - SC', act: '[View] [Edit] [LC]' },
  { gr: '४२१३', name: 'जाधव पूजा संतोष', std: '९ वी - ब', caste: 'मराठा - Open', act: '[View] [Edit] [LC]' },
  { gr: '४२१४', name: 'चव्हाण आकाश रमेश', std: '८ वी - अ', caste: 'भटके - VJNT', act: '[View] [Edit] [LC]' }
];

sampleRows.forEach((r, idx) => {
  const rowY = thY + 20 + idx * 22;
  if (idx % 2 === 1) {
    doc.setFillColor(24, 33, 47);
    doc.rect(dx + 12, rowY, dWinW - 48, 22, 'F');
  }
  doc.setFont('Deva', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(226, 232, 240);
  printText(r.gr, dx + 20, rowY + 15);
  doc.setFont('Deva', 'bold');
  printText(r.name, dx + 65, rowY + 15);
  doc.setFont('Deva', 'normal');
  printText(r.std, dx + 200, rowY + 15);
  printText(r.caste, dx + 265, rowY + 15);
  printText(r.act, dx + 355, rowY + 15);
});

// Right Side: 4 Callouts for Dashboard
const r2X = 520;
const cW2 = 290;

drawCalloutBox(
  r2X,
  75,
  cW2,
  78,
  '१',
  '+ विद्यार्थी जोडा बटण',
  'नवीन प्रवेश घेणाऱ्या विद्यार्थ्याची संपूर्ण माहिती जनरल रजिस्टरमध्ये भरण्यासाठी या निळ्या बटणावर क्लिक करा.',
  'blue'
);
drawRedArrow(r2X - 10, 110, addBtnX + 50, dy + 20, 1);

drawCalloutBox(
  r2X,
  165,
  cW2,
  82,
  '२',
  'शाळेची रिअल-टाईम आकडेवारी',
  'येथे शाळेतील एकूण विद्यार्थी संख्या, मुले, मुली आणि आजपर्यंत काढलेल्या दाखल्यांची संख्या एका दृष्टीक्षेपात समजते.',
  'emerald'
);
drawRedArrow(r2X - 10, 205, dx + 2 * (mCardW + 12), mCardY + 25, 2);

drawCalloutBox(
  r2X,
  260,
  cW2,
  78,
  '३',
  'जलद शोध - Instant Search',
  'विद्यार्थ्याचा GR नंबर, आडनाव किंवा नाव टाईप करताच सेकंदात त्याचे संपूर्ण रेकॉर्ड खाली स्क्रीनवर फिल्टर होते.',
  'amber'
);
drawRedArrow(r2X - 10, 300, dx + dWinW - 60, tY + 22, 3);

drawCalloutBox(
  r2X,
  350,
  cW2,
  85,
  '४',
  'विद्यार्थी कृती [View / Edit / LC]',
  'प्रत्येक विद्यार्थ्याच्या ओळीसमोर View [माहिती पाहणे], Edit [माहिती दुरुस्त करणे] आणि LC [थेट दाखला काढणे] बटणे आहेत.',
  'red'
);
drawRedArrow(r2X - 10, 395, dx + 380, thY + 35, 4);

// ==========================================
// SLIDE 4: पायरी ३ - नवीन विद्यार्थी प्रवेश फॉर्म (ADD STUDENT FORM)
// ==========================================
doc.addPage();
drawSlideBase(4, 8, 'पायरी ३: नवीन विद्यार्थी प्रवेश नोंदणी कशी करावी?', 'नवीन विद्यार्थी प्रवेश');

drawWindowFrame(30, 75, dWinW, dWinH, 'https://shalaverse.in/add-student - नवीन विद्यार्थी प्रवेश फॉर्म');

const fx = 42;
const fy = 75 + 34;

// Section 1: GR Info Header
doc.setFillColor(30, 41, 59);
doc.roundedRect(fx, fy, dWinW - 24, 22, 4, 4, 'F');
doc.setFont('Deva', 'bold');
doc.setFontSize(8.5);
doc.setTextColor(147, 197, 253);
printText('१. जनरल रजिस्टर [GR] व प्रवेश तपशील', fx + 10, fy + 15);

// Row 1 inputs
const r1Y = fy + 26;
doc.setFillColor(15, 23, 42);
doc.roundedRect(fx, r1Y, dWinW - 24, 44, 4, 4, 'F');

doc.setFont('Deva', 'normal');
doc.setFontSize(7.5);
doc.setTextColor(148, 163, 184);
printText('जनरल रजिस्टर [GR] नं *', fx + 10, r1Y + 14);
printText('प्रवेश तारीख *', fx + 120, r1Y + 14);
printText('प्रवेश घेतलेला वर्ग *', fx + 230, r1Y + 14);
printText('तुकडी *', fx + 340, r1Y + 14);

doc.setFillColor(2, 6, 23);
doc.roundedRect(fx + 10, r1Y + 18, 95, 20, 3, 3, 'F');
doc.setFont('Deva', 'bold');
doc.setFontSize(8);
doc.setTextColor(255, 255, 255);
printText('४२१५', fx + 16, r1Y + 32);

doc.setFillColor(2, 6, 23);
doc.roundedRect(fx + 120, r1Y + 18, 95, 20, 3, 3, 'F');
doc.setFont('Deva', 'normal');
printText('१५/०६/२०२६', fx + 126, r1Y + 32);

doc.setFillColor(2, 6, 23);
doc.roundedRect(fx + 230, r1Y + 18, 95, 20, 3, 3, 'F');
printText('१० वी - 10th', fx + 236, r1Y + 32);

doc.setFillColor(2, 6, 23);
doc.roundedRect(fx + 340, r1Y + 18, 85, 20, 3, 3, 'F');
printText('अ - A', fx + 346, r1Y + 32);

// Section 2: Student Name
const s2Y = r1Y + 50;
doc.setFillColor(30, 41, 59);
doc.roundedRect(fx, s2Y, dWinW - 24, 22, 4, 4, 'F');
doc.setFont('Deva', 'bold');
doc.setFontSize(8.5);
doc.setTextColor(147, 197, 253);
printText('२. विद्यार्थ्याचे संपूर्ण नाव [मराठी व इंग्रजी]', fx + 10, s2Y + 15);

const r2Y = s2Y + 26;
doc.setFillColor(15, 23, 42);
doc.roundedRect(fx, r2Y, dWinW - 24, 52, 4, 4, 'F');

doc.setFont('Deva', 'normal');
doc.setFontSize(7.5);
doc.setTextColor(148, 163, 184);
printText('मराठी नाव [आडनाव - नाव - वडिलांचे नाव] *', fx + 10, r2Y + 14);
printText('इंग्रजीत नाव [Full Name in English] *', fx + 230, r2Y + 14);

doc.setFillColor(2, 6, 23);
doc.roundedRect(fx + 10, r2Y + 18, 205, 24, 4, 4, 'F');
doc.setDrawColor(59, 130, 246);
doc.roundedRect(fx + 10, r2Y + 18, 205, 24, 4, 4, 'S');
doc.setFont('Deva', 'bold');
doc.setFontSize(8.5);
doc.setTextColor(255, 255, 255);
printText('देशमुख रोहन प्रकाश', fx + 18, r2Y + 34);

doc.setFillColor(2, 6, 23);
doc.roundedRect(fx + 230, r2Y + 18, 200, 24, 4, 4, 'F');
doc.setFont('Deva', 'normal');
doc.setFontSize(8.5);
doc.setTextColor(203, 213, 225);
printText('Deshmukh Rohan Prakash', fx + 238, r2Y + 34);

// Section 3: Birth & Caste Info
const s3Y = r2Y + 60;
doc.setFillColor(30, 41, 59);
doc.roundedRect(fx, s3Y, dWinW - 24, 22, 4, 4, 'F');
doc.setFont('Deva', 'bold');
doc.setFontSize(8.5);
doc.setTextColor(147, 197, 253);
printText('३. जन्मतारीख, जात, प्रवर्ग व आधार क्रमांक', fx + 10, s3Y + 15);

const r3Y = s3Y + 26;
doc.setFillColor(15, 23, 42);
doc.roundedRect(fx, r3Y, dWinW - 24, 76, 4, 4, 'F');

doc.setFont('Deva', 'normal');
doc.setFontSize(7.5);
doc.setTextColor(148, 163, 184);
printText('जन्मतारीख [अंकी]', fx + 10, r3Y + 14);
printText('जन्मतारीख [अक्षरी - आपोआप तयार होते]', fx + 120, r3Y + 14);
printText('जात व प्रवर्ग', fx + 310, r3Y + 14);

doc.setFillColor(2, 6, 23);
doc.roundedRect(fx + 10, r3Y + 18, 95, 20, 3, 3, 'F');
doc.setFont('Deva', 'bold');
doc.setFontSize(8);
doc.setTextColor(255, 255, 255);
printText('12/08/2010', fx + 16, r3Y + 32);

doc.setFillColor(2, 6, 23);
doc.roundedRect(fx + 120, r3Y + 18, 180, 20, 3, 3, 'F');
doc.setFont('Deva', 'normal');
doc.setFontSize(7.5);
doc.setTextColor(147, 197, 253);
printText('बारा ऑगस्ट दोन हजार दहा', fx + 126, r3Y + 32);

doc.setFillColor(2, 6, 23);
doc.roundedRect(fx + 310, r3Y + 18, 115, 20, 3, 3, 'F');
doc.setFont('Deva', 'normal');
printText('मराठा - खुला प्रवर्ग', fx + 316, r3Y + 32);

// Aadhaar row
doc.setFont('Deva', 'normal');
doc.setFontSize(7.5);
doc.setTextColor(148, 163, 184);
printText('१२ अंकी आधार कार्ड नंबर *', fx + 10, r3Y + 52);
printText('पालकांचा मोबाईल नंबर *', fx + 230, r3Y + 52);

doc.setFillColor(2, 6, 23);
doc.roundedRect(fx + 10, r3Y + 56, 205, 20, 3, 3, 'F');
doc.setFont('Deva', 'bold');
doc.setFontSize(8);
doc.setTextColor(255, 255, 255);
printText('9876 5432 1098', fx + 18, r3Y + 70);

doc.setFillColor(2, 6, 23);
doc.roundedRect(fx + 230, r3Y + 56, 195, 20, 3, 3, 'F');
doc.setFont('Deva', 'normal');
printText('9876543210', fx + 238, r3Y + 70);

// Form Save Button
const fBtnY = r3Y + 86;
doc.setFillColor(16, 185, 129);
doc.roundedRect(fx + 120, fBtnY, 200, 30, 6, 6, 'F');
doc.setFont('Deva', 'bold');
doc.setFontSize(10.5);
doc.setTextColor(255, 255, 255);
printText('💾  विद्यार्थी माहिती जतन करा - Save', fx + 220, fBtnY + 20, { align: 'center' });

// Right Callouts for Add Student
drawCalloutBox(
  r2X,
  75,
  cW2,
  82,
  '१',
  'GR क्रमांक व प्रवेश माहिती',
  'शाळेचा पुढील जनरल रजिस्टर क्रमांक सिस्टीम आपोआप दाखवते. प्रवेश तारीख, प्रवेश दिलेला वर्ग आणि तुकडी अचूक निवडा.',
  'red'
);
drawRedArrow(r2X - 10, 115, fx + 105, r1Y + 28, 1);

drawCalloutBox(
  r2X,
  175,
  cW2,
  82,
  '२',
  'मराठी व इंग्रजी नाव नोंद',
  'विद्यार्थ्याचे नाव मराठीत टाईप करताच इंग्रजी नाव आपोआप ट्रान्सलिटरेट होते. दोन्ही भाषेतील नावे अचूक तपासा.',
  'blue'
);
drawRedArrow(r2X - 10, 215, fx + 215, r2Y + 30, 2);

drawCalloutBox(
  r2X,
  275,
  cW2,
  82,
  '३',
  'जन्मतारीख अक्षरी ऑटो-जनरेशन',
  'अंकी जन्मतारीख निवडताच सिस्टीम ती अक्षरांमध्ये [उदा. बारा ऑगस्ट दोन हजार दहा] अचूक रूपांतरित करते.',
  'amber'
);
drawRedArrow(r2X - 10, 315, fx + 300, r3Y + 28, 3);

drawCalloutBox(
  r2X,
  375,
  cW2,
  80,
  '४',
  'माहिती जतन करा बटण',
  'सर्व रकाने भरल्यानंतर खालील हिरव्या "विद्यार्थी माहिती जतन करा" बटणावर क्लिक करा. विद्यार्थी तात्काळ जनरल रजिस्टरमध्ये जोडला जाईल.',
  'emerald'
);
drawRedArrow(r2X - 10, 415, fx + 320, fBtnY + 15, 4);

// ==========================================
// SLIDE 5: पायरी ४ - शाळा सोडल्याचा दाखला (LC GENERATION)
// ==========================================
doc.addPage();
drawSlideBase(5, 8, 'पायरी ४: शाळा सोडल्याचा दाखला [LC] कसा काढावा?', 'दाखला निर्मिती - LC');

drawWindowFrame(30, 75, dWinW, dWinH, 'https://shalaverse.in/certificates - शाळा सोडल्याचे प्रमाणपत्र [LC]');

const lcx = 45;
const lcy = 75 + 34;
const lcw = dWinW - 30;
const lch = 410;

doc.setFillColor(254, 252, 232);
doc.roundedRect(lcx, lcy, lcw, lch, 6, 6, 'F');
doc.setDrawColor(180, 83, 9);
doc.setLineWidth(2);
doc.roundedRect(lcx, lcy, lcw, lch, 6, 6, 'S');

doc.setLineWidth(0.8);
doc.roundedRect(lcx + 4, lcy + 4, lcw - 8, lch - 8, 4, 4, 'S');

// Top School Title on LC
doc.setFont('Deva', 'bold');
doc.setFontSize(10.5);
doc.setTextColor(120, 53, 15);
printText('श्री शिवाजी हायस्कूल आणि ज्युनिअर कॉलेज, चिखली, जि. बुलढाणा', lcx + lcw / 2, lcy + 22, { align: 'center' });

doc.setFont('Deva', 'normal');
doc.setFontSize(7.5);
doc.setTextColor(146, 64, 14);
printText('UDISE: 27070200119 | मान्यता क्र: बुलढाणा जि.प. शि.वि. / क्र. ९५४२ | बोर्ड: Amravati Division', lcx + lcw / 2, lcy + 34, { align: 'center' });

// Certificate Main Title Badge
doc.setFillColor(180, 83, 9);
doc.roundedRect(lcx + lcw / 2 - 110, lcy + 42, 220, 18, 4, 4, 'F');
doc.setFont('Deva', 'bold');
doc.setFontSize(9.5);
doc.setTextColor(255, 255, 255);
printText('शाळा सोडल्याचा दाखला - LEAVING CERTIFICATE', lcx + lcw / 2, lcy + 55, { align: 'center' });

// Serial & Reg numbers row
const lcr1Y = lcy + 74;
doc.setFont('Deva', 'bold');
doc.setFontSize(7.5);
doc.setTextColor(15, 23, 42);
printText('दाखला क्र: LC/२०२६/१४२', lcx + 15, lcr1Y);
printText('जनरल रजिस्टर [GR] नं: ४२१०', lcx + lcw / 2 - 40, lcr1Y);
printText('स्टुडंट आयडी [UID]: 201027070200119001', lcx + lcw - 15, lcr1Y, { align: 'right' });

// LC Fields Table
const lcfY = lcr1Y + 12;
const lcFields = [
  ['१. विद्यार्थ्याचे संपूर्ण नाव', 'कदम राहुल विजय - Kadam Rahul Vijay'],
  ['२. आईचे नाव', 'सुनीता विजय कदम - Sunita Vijay Kadam'],
  ['३. राष्ट्रीयत्व व मातृभाषा', 'भारतीय - Indian  |  मातृभाषा: मराठी'],
  ['४. धर्म, जात व पोटजात', 'हिंदू - मराठा [खुला प्रवर्ग - Open]'],
  ['५. जन्मस्थळ', 'चिखली, ता. चिखली, जि. बुलढाणा'],
  ['६. जन्मतारीख [अंकी]', '15/08/2010 - पंधरा ऑगस्ट दोन हजार दहा'],
  ['७. पूर्वीची शाळा', 'जि. प. प्राथमिक शाळा, चिखली'],
  ['८. प्रवेश दिनांक व वर्ग', '१५/०६/२०२१  |  वर्ग: ५ वी'],
  ['९. अभ्यासातील प्रगती व वर्तणूक', 'उत्तम - Good  |  वर्तणूक: चांगली - Good'],
  ['१०. शाळा सोडल्याचा दिनांक', '३०/०४/२०२६'],
  ['११. कोणत्या वर्गात शिकत होता', 'इयत्ता १० वी [दहावी] - उत्तीर्ण'],
  ['१२. शाळा सोडण्याचे कारण', 'इयत्ता १० वी उत्तीर्ण होऊन पुढील शिक्षणासाठी']
];

lcFields.forEach((f, i) => {
  const rowY = lcfY + i * 18.5;
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.4);
  doc.line(lcx + 12, rowY, lcx + lcw - 12, rowY);

  doc.setFont('Deva', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  printText(f[0], lcx + 15, rowY + 12);

  doc.setFont('Deva', 'normal');
  printText(f[1], lcx + 170, rowY + 12);
});

// LC Footer
const lcfSignY = lcfY + lcFields.length * 18.5 + 26;
doc.setFont('Deva', 'bold');
doc.setFontSize(7.5);
doc.setTextColor(30, 41, 59);
printText('तयार करणार [लिपिक]', lcx + 25, lcfSignY);
printText('वर्गशिक्षक', lcx + lcw / 2, lcfSignY, { align: 'center' });
printText('मुख्याध्यापक [शिक्का व सही]', lcx + lcw - 25, lcfSignY, { align: 'right' });

// Top Action Controls over LC Mockup
const topActY = 75 + 8;
doc.setFillColor(37, 99, 235);
doc.roundedRect(lcx + lcw - 165, topActY, 75, 18, 4, 4, 'F');
doc.setFont('Deva', 'bold');
doc.setFontSize(7.5);
doc.setTextColor(255, 255, 255);
printText('🖨️ अधिकृत प्रिंट', lcx + lcw - 127, topActY + 12, { align: 'center' });

doc.setFillColor(16, 185, 129);
doc.roundedRect(lcx + lcw - 85, topActY, 78, 18, 4, 4, 'F');
printText('📥 Download PDF', lcx + lcw - 46, topActY + 12, { align: 'center' });

// Right Callouts for LC
drawCalloutBox(
  r2X,
  75,
  cW2,
  82,
  '१',
  'महाराष्ट्र शासन प्रमाणित फॉरमॅट',
  'शाळा सोडल्याचा दाखला महाराष्ट्र शासनाच्या शिक्षण विभागाच्या अधिकृत नियमावली व प्रमाणित नमुन्यानुसार तयार होतो.',
  'amber'
);
drawRedArrow(r2X - 10, 115, lcx + lcw - 15, lcy + 52, 1);

drawCalloutBox(
  r2X,
  175,
  cW2,
  82,
  '२',
  'स्वयंचलित माहिती भरणे - No Error',
  'विद्यार्थ्यांचे नाव, आईचे नाव, जन्मतारीख, जात, प्रगती व शेरा जनरल रजिस्टरमधून १००% अचूक भरले जातात; स्पेलिंग चूक होत नाही.',
  'blue'
);
drawRedArrow(r2X - 10, 215, lcx + lcw - 15, lcfY + 50, 2);

drawCalloutBox(
  r2X,
  275,
  cW2,
  82,
  '३',
  '१-क्लिक प्रिंट - Print to Letterhead',
  'वर दिलेल्या निळ्या "अधिकृत प्रिंट" बटणावर क्लिक करून तुम्ही थेट शाळेच्या लेटरहेडवर अधिकृत रंगीत प्रिंट काढू शकता.',
  'emerald'
);
drawRedArrow(r2X - 10, 315, lcx + lcw - 127, topActY + 9, 3);

drawCalloutBox(
  r2X,
  375,
  cW2,
  80,
  '४',
  'रंगीत PDF डाऊनलोड व सेव्ह',
  '"Download PDF" बटण दाबून दाखला संगणकात PDF म्हणून सेव्ह करा किंवा पालकांना त्वरित व्हॉट्सॲप / ईमेलवर पाठवा.',
  'red'
);
drawRedArrow(r2X - 10, 415, lcx + lcw - 46, topActY + 9, 4);

// ==========================================
// SLIDE 6: पायरी ५ - बोनाफाईड व निर्गम उतारा
// ==========================================
doc.addPage();
drawSlideBase(6, 8, 'पायरी ५: बोनाफाईड प्रमाणपत्र व निर्गम उतारा कसा काढावा?', 'बोनाफाईड व निर्गम उतारा');

const duoW = 225;
const duoH = 430;

// Bonafide Card
const b1X = 35;
const b1Y = 85;
doc.setFillColor(15, 23, 42);
doc.roundedRect(b1X, b1Y, duoW, duoH, 8, 8, 'F');
doc.setDrawColor(59, 130, 246);
doc.setLineWidth(1.5);
doc.roundedRect(b1X, b1Y, duoW, duoH, 8, 8, 'S');

doc.setFillColor(30, 41, 59);
doc.roundedRect(b1X, b1Y, duoW, 30, 8, 8, 'F');
doc.setFont('Deva', 'bold');
doc.setFontSize(9.5);
doc.setTextColor(255, 255, 255);
printText('🎓 बोनाफाईड प्रमाणपत्र - Bonafide', b1X + duoW / 2, b1Y + 20, { align: 'center' });

doc.setFillColor(255, 255, 255);
doc.roundedRect(b1X + 10, b1Y + 40, duoW - 20, duoH - 55, 4, 4, 'F');
doc.setDrawColor(37, 99, 235);
doc.roundedRect(b1X + 10, b1Y + 40, duoW - 20, duoH - 55, 4, 4, 'S');

doc.setFont('Deva', 'bold');
doc.setFontSize(8);
doc.setTextColor(30, 41, 59);
printText('श्री शिवाजी हायस्कूल, चिखली', b1X + duoW / 2, b1Y + 60, { align: 'center' });
doc.setFontSize(7.5);
doc.setTextColor(37, 99, 235);
printText('बोनाफाईड प्रमाणपत्र', b1X + duoW / 2, b1Y + 74, { align: 'center' });

doc.setFont('Deva', 'normal');
doc.setFontSize(7);
doc.setTextColor(51, 65, 85);
const bText = 'प्रमाणित करण्यात येते की, कुमार कदम राहुल विजय हा या विद्यालयात शैक्षणिक वर्ष २०२६-२०२७ मध्ये इयत्ता १० वी [दहावी] तुकडी "अ" मध्ये नियमित शिकत आहे. शाळेच्या जनरल रजिस्टरनुसार त्याची जन्मतारीख १५/०८/२०१० अशी नोंदवलेली आहे.';
printSplitText(bText, b1X + 20, b1Y + 98, duoW - 40);

doc.setFont('Deva', 'bold');
doc.setFontSize(7);
printText('वापर: शिष्यवृत्ती, बस पास, बँक खाते उघडणे.', b1X + 20, b1Y + 165);

doc.setFont('Deva', 'bold');
doc.setFontSize(7.5);
printText('मुख्याध्यापक [स्वाक्षरी व शिक्का]', b1X + duoW / 2, b1Y + duoH - 30, { align: 'center' });

// Nirgam Utara Card
const b2X = b1X + duoW + 15;
doc.setFillColor(15, 23, 42);
doc.roundedRect(b2X, b1Y, duoW, duoH, 8, 8, 'F');
doc.setDrawColor(245, 158, 11);
doc.setLineWidth(1.5);
doc.roundedRect(b2X, b1Y, duoW, duoH, 8, 8, 'S');

doc.setFillColor(30, 41, 59);
doc.roundedRect(b2X, b1Y, duoW, 30, 8, 8, 'F');
doc.setFont('Deva', 'bold');
doc.setFontSize(9.5);
doc.setTextColor(255, 255, 255);
printText('📜 निर्गम उतारा - Nirgam Extract', b2X + duoW / 2, b1Y + 20, { align: 'center' });

doc.setFillColor(254, 252, 232);
doc.roundedRect(b2X + 10, b1Y + 40, duoW - 20, duoH - 55, 4, 4, 'F');
doc.setDrawColor(180, 83, 9);
doc.roundedRect(b2X + 10, b1Y + 40, duoW - 20, duoH - 55, 4, 4, 'S');

doc.setFont('Deva', 'bold');
doc.setFontSize(8);
doc.setTextColor(120, 53, 15);
printText('जनरल रजिस्टर निर्गम उतारा', b2X + duoW / 2, b1Y + 60, { align: 'center' });

doc.setFont('Deva', 'normal');
doc.setFontSize(6.8);
doc.setTextColor(30, 41, 59);
const nRows = [
  '• GR नंबर: ४२१०',
  '• विद्यार्थ्याचे नाव: कदम राहुल विजय',
  '• आईचे नाव: सुनीता विजय कदम',
  '• जात / धर्म: हिंदू - मराठा [Open]',
  '• जन्मतारीख: १५/०८/२०१०',
  '• प्रवेश दिनांक: १५/०६/२०२१',
  '• शाळा सोडल्याची तारीख: ३०/०४/२०२६',
  '• सोडण्याचे कारण: १० वी उत्तीर्ण'
];
nRows.forEach((nr, idx) => {
  printText(nr, b2X + 20, b1Y + 84 + idx * 16);
});

doc.setFont('Deva', 'bold');
doc.setFontSize(7.5);
printText('सत्यप्रत प्रमाणित [मुख्याध्यापक]', b2X + duoW / 2, b1Y + duoH - 30, { align: 'center' });

// Right Callouts
drawCalloutBox(
  r2X,
  85,
  cW2,
  85,
  '१',
  '१-क्लिक बोनाफाईड प्रमाणपत्र',
  'विद्यार्थ्यांना बँक खाते उघडणे, आधार अपडेट किंवा बस कन्सेशनसाठी लागणारा बोनाफाईड दाखला केवळ १ सेकंदात तयार होतो.',
  'blue'
);
drawRedArrow(r2X - 10, 125, b1X + duoW - 15, b1Y + 120, 1);

drawCalloutBox(
  r2X,
  190,
  cW2,
  85,
  '२',
  'जनरल रजिस्टर निर्गम उतारा',
  'शासकीय कामांसाठी किंवा जुन्या विद्यार्थ्यांसाठी जनरल रजिस्टरमधील नोंदीचा अधिकृत निर्गम उतारा तात्काळ काढता येतो.',
  'amber'
);
drawRedArrow(r2X - 10, 230, b2X + duoW - 15, b1Y + 120, 2);

drawCalloutBox(
  r2X,
  295,
  cW2,
  85,
  '३',
  'प्रमाणित शासकीय फॉरमॅट',
  'महाराष्ट्र शासन व शिक्षण विभागाच्या मार्गदर्शक तत्त्वांचे पालन करणारा अधिकृत मजकूर व मांडणी यामध्ये समाविष्ट आहे.',
  'emerald'
);
drawRedArrow(r2X - 10, 335, b1X + duoW / 2, b1Y + duoH - 40, 3);

drawCalloutBox(
  r2X,
  400,
  cW2,
  85,
  '४',
  'थेट प्रिंट व व्हॉट्सॲप शेअर',
  'शाळेच्या संगणकावरून थेट अधिकृत प्रिंटरवर प्रिंट द्या किंवा PDF सेव्ह करून पालकांना व्हॉट्सॲपवर पाठवा.',
  'red'
);
drawRedArrow(r2X - 10, 440, b2X + duoW / 2, b1Y + duoH - 40, 4);

// ==========================================
// SLIDE 7: पायरी ६ - शाळा प्रोफाईल, पासवर्ड व सेटिंग्ज
// ==========================================
doc.addPage();
drawSlideBase(7, 8, 'पायरी ६: शाळा प्रोफाइल, पासवर्ड व सुरक्षा व्यवस्थापन', 'सेटिंग्ज व सुरक्षा');

drawWindowFrame(30, 75, dWinW, dWinH, 'https://shalaverse.in/settings - शाळा सेटिंग्ज व सुरक्षा');

const sx = 45;
const sy = 75 + 34;

doc.setFillColor(30, 41, 59);
doc.roundedRect(sx, sy, dWinW - 30, 24, 4, 4, 'F');
doc.setFont('Deva', 'bold');
doc.setFontSize(9);
doc.setTextColor(147, 197, 253);
printText('🏢 शाळेचे अधिकृत तपशील - School Profile Details', sx + 10, sy + 16);

const spY = sy + 30;
doc.setFillColor(15, 23, 42);
doc.roundedRect(sx, spY, dWinW - 30, 115, 4, 4, 'F');

const sFields = [
  ['शाळेचे नाव [मराठी]:', 'श्री शिवाजी हायस्कूल आणि ज्युनिअर कॉलेज, चिखली'],
  ['शाळेचे नाव [इंग्रजी]:', 'Shri Shivaji High School and Junior College, Chikhli'],
  ['युडायस [UDISE] क्रमांक:', '27070200119  - ११ अंकी अधिकृत कोड'],
  ['मुख्याध्यापकांचे नाव:', 'मुख्याध्यापक श्री. व्ही. एम. पाटील'],
  ['संस्थेचे नाव:', 'श्री शिवाजी शिक्षण प्रसारक मंडळ, चिखली'],
  ['अधिकृत ईमेल व फोन:', 'shivajischool.chikhli@gmail.com | 07264-242233']
];

sFields.forEach((sf, i) => {
  const rY = spY + 8 + i * 17.5;
  doc.setFont('Deva', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  printText(sf[0], sx + 12, rY + 10);

  doc.setFont('Deva', 'normal');
  doc.setTextColor(255, 255, 255);
  printText(sf[1], sx + 125, rY + 10);
});

// Section B: Password & Security PIN Card
const scY = spY + 125;
doc.setFillColor(30, 41, 59);
doc.roundedRect(sx, scY, dWinW - 30, 24, 4, 4, 'F');
doc.setFont('Deva', 'bold');
doc.setFontSize(9);
doc.setTextColor(245, 158, 11);
printText('🔒 पासवर्ड व सुरक्षा व्यवस्थापन - Password & Security', sx + 10, scY + 16);

const secBoxY = scY + 30;
doc.setFillColor(15, 23, 42);
doc.roundedRect(sx, secBoxY, dWinW - 30, 140, 4, 4, 'F');

doc.setFont('Deva', 'normal');
doc.setFontSize(7.5);
doc.setTextColor(148, 163, 184);
printText('चालू पासवर्ड [Current Password] *', sx + 12, secBoxY + 16);
printText('नवीन पासवर्ड [New Password] *', sx + 12, secBoxY + 54);
printText('सुरक्षा रिकव्हरी पिन [Security PIN] *', sx + 230, secBoxY + 54);

doc.setFillColor(2, 6, 23);
doc.roundedRect(sx + 12, secBoxY + 22, 200, 24, 4, 4, 'F');
doc.setFont('Deva', 'normal');
doc.setFontSize(8.5);
doc.setTextColor(203, 213, 225);
printText('••••••••••••  [चालू पासवर्ड टाका]', sx + 20, secBoxY + 38);

doc.setFillColor(2, 6, 23);
doc.roundedRect(sx + 12, secBoxY + 60, 200, 24, 4, 4, 'F');
printText('••••••••••••  [नवीन पासवर्ड]', sx + 20, secBoxY + 76);

doc.setFillColor(2, 6, 23);
doc.roundedRect(sx + 230, secBoxY + 60, 180, 24, 4, 4, 'F');
printText('8788  - ४ अंकी पिन', sx + 238, secBoxY + 76);

doc.setFillColor(245, 158, 11);
doc.roundedRect(sx + 120, secBoxY + 98, 200, 28, 6, 6, 'F');
doc.setFont('Deva', 'bold');
doc.setFontSize(10);
doc.setTextColor(15, 23, 42);
printText('🔐  नवीन पासवर्ड जतन करा', sx + 220, secBoxY + 116, { align: 'center' });

// Right Callouts for Settings
drawCalloutBox(
  r2X,
  75,
  cW2,
  85,
  '१',
  'शाळेचे अधिकृत नाव व तपशील',
  'दाखल्यांवर येणारे मुख्याध्यापकांचे नाव, शाळेचा पत्ता, संपर्क क्रमांक आणि शैक्षणिक वर्ष तुम्ही स्वतः येथून कधीही बदलू शकता.',
  'blue'
);
drawRedArrow(r2X - 10, 115, sx + dWinW - 40, spY + 40, 1);

drawCalloutBox(
  r2X,
  180,
  cW2,
  85,
  '२',
  'सुरक्षित पासवर्ड बदल',
  'शाळेचा पासवर्ड दर काही महिन्यांनी बदलून सुरक्षित ठेवा. पासवर्ड बदलताच जुना पासवर्ड कायमचा रद्द होतो व नवीनच चालतो.',
  'amber'
);
drawRedArrow(r2X - 10, 220, sx + 215, secBoxY + 72, 2);

drawCalloutBox(
  r2X,
  285,
  cW2,
  85,
  '३',
  'सुरक्षा रिकव्हरी पिन [८७८८]',
  'जर कधी पासवर्ड विसरलात, तर हा ४ अंकी सुरक्षा पिन [8788] वापरून लॉगिन पानावरून थेट नवीन पासवर्ड सेट करता येतो.',
  'red'
);
drawRedArrow(r2X - 10, 325, sx + 410, secBoxY + 72, 3);

drawCalloutBox(
  r2X,
  390,
  cW2,
  85,
  '४',
  '१००% क्लाऊड सुरक्षा व बॅकअप',
  'सर्व डेटा आधुनिक क्लाऊड डेटाबेसवर साठवला जातो; त्यामुळे कॉम्प्युटर खराब झाला तरी शाळेचा डेटा कायम सुरक्षित राहतो.',
  'emerald'
);

// ==========================================
// SLIDE 8: शेवटी - मदत, समर्थन व संपर्क (SUPPORT & SUMMARY)
// ==========================================
doc.addPage();
drawSlideBase(8, 8, 'निष्कर्ष व तांत्रिक साहाय्य - Technical Support', 'संपर्क व साहाय्य');

const sumW = W - 60;
const sumH = H - 120;
doc.setFillColor(30, 41, 59);
doc.roundedRect(30, 75, sumW, sumH, 14, 14, 'F');
doc.setDrawColor(59, 130, 246);
doc.setLineWidth(1.8);
doc.roundedRect(30, 75, sumW, sumH, 14, 14, 'S');

doc.setFont('Deva', 'bold');
doc.setFontSize(19);
doc.setTextColor(255, 255, 255);
printText('श्री शिवाजी हायस्कूल शाळा व्यवस्थापन प्रणाली - सारांश व मदत केंद्र', W / 2, 115, { align: 'center' });

doc.setFont('Deva', 'normal');
doc.setFontSize(10.5);
doc.setTextColor(147, 197, 253);
printText('कोणतीही अडचण किंवा शंका असल्यास खालील संपर्क व मार्गदर्शक सूचनांचा वापर करा', W / 2, 135, { align: 'center' });

// 3 Big Summary Columns
const sColW = 236;
const sColH = 265;
const sColY = 160;

// Col 1: Important Credentials Summary
doc.setFillColor(15, 23, 42);
doc.roundedRect(50, sColY, sColW, sColH, 10, 10, 'F');
doc.setDrawColor(51, 65, 85);
doc.roundedRect(50, sColY, sColW, sColH, 10, 10, 'S');

doc.setFillColor(37, 99, 235);
doc.roundedRect(50, sColY, sColW, 28, 10, 10, 'F');
doc.rect(50, sColY + 18, sColW, 10, 'F');
doc.setFont('Deva', 'bold');
doc.setFontSize(10.5);
doc.setTextColor(255, 255, 255);
printText('🔑 महत्त्वाचे लॉगिन तपशील', 50 + sColW / 2, sColY + 19, { align: 'center' });

const credLines = [
  '• शाळा: श्री शिवाजी हायस्कूल, चिखली',
  '• UDISE: 27070200119',
  '• अधिकृत ईमेल:\n  shivajischool.chikhli@gmail.com',
  '• डिफॉल्ट पासवर्ड:\n  Shala@123',
  '• रिकव्हरी पिन: 8788',
  '• पोर्टल लिंक:\n  https://shalaverse.in'
];
let cyOff = sColY + 45;
doc.setFont('Deva', 'normal');
doc.setFontSize(9);
doc.setTextColor(226, 232, 240);
credLines.forEach(cl => {
  printText(cl, 62, cyOff);
  cyOff += cl.includes('\n') ? 28 : 20;
});

// Col 2: Key Benefits
const col2X = 50 + sColW + 20;
doc.setFillColor(15, 23, 42);
doc.roundedRect(col2X, sColY, sColW, sColH, 10, 10, 'F');
doc.setDrawColor(51, 65, 85);
doc.roundedRect(col2X, sColY, sColW, sColH, 10, 10, 'S');

doc.setFillColor(16, 185, 129);
doc.roundedRect(col2X, sColY, sColW, 28, 10, 10, 'F');
doc.rect(col2X, sColY + 18, sColW, 10, 'F');
doc.setFont('Deva', 'bold');
doc.setFontSize(10.5);
doc.setTextColor(255, 255, 255);
printText('✨ मुख्य फायदे व वैशिष्ट्ये', col2X + sColW / 2, sColY + 19, { align: 'center' });

const benLines = [
  '✔ कागदी रजिस्टरऐवजी १००% डिजिटल',
  '✔ १ सेकंदात जुना विद्यार्थी शोधा',
  '✔ LC व बोनाफाईड एका क्लिकवर तयार',
  '✔ स्पेलिंग व जन्मतारीख अचूकता',
  '✔ एक्सेलमध्ये संपूर्ण बॅकअप डाऊनलोड',
  '✔ मोबाइल व कॉम्प्युटरवर सहज चालते',
  '✔ १००% क्लाऊड सुरक्षा व गोपनीयता'
];
let byOff = sColY + 48;
doc.setFont('Deva', 'normal');
doc.setFontSize(9);
doc.setTextColor(203, 213, 225);
benLines.forEach(bl => {
  printText(bl, col2X + 14, byOff);
  byOff += 28;
});

// Col 3: Support & Contact
const col3X = col2X + sColW + 20;
doc.setFillColor(15, 23, 42);
doc.roundedRect(col3X, sColY, sColW, sColH, 10, 10, 'F');
doc.setDrawColor(51, 65, 85);
doc.roundedRect(col3X, sColY, sColW, sColH, 10, 10, 'S');

doc.setFillColor(245, 158, 11);
doc.roundedRect(col3X, sColY, sColW, 28, 10, 10, 'F');
doc.rect(col3X, sColY + 18, sColW, 10, 'F');
doc.setFont('Deva', 'bold');
doc.setFontSize(10.5);
doc.setTextColor(15, 23, 42);
printText('📞 तांत्रिक मदत व सपोर्ट', col3X + sColW / 2, sColY + 19, { align: 'center' });

const supLines = [
  '• पोर्टल व्यवस्थापक:\n  Shalaverse Support Team',
  '• संपर्क ईमेल:\n  p.ganeshkar8788@gmail.com',
  '• शाळा हेल्पलाइन:\n  ०७२६४-२४२२३३',
  '• २४/७ क्लाऊड सर्व्हर चालू',
  '• मोफत ऑनलाइन मार्गदर्शन उपलब्ध',
  '• नियमित डेटा सुरक्षा तपासणी'
];
let syOff = sColY + 45;
doc.setFont('Deva', 'normal');
doc.setFontSize(9);
doc.setTextColor(226, 232, 240);
supLines.forEach(sl => {
  printText(sl, col3X + 14, syOff);
  syOff += sl.includes('\n') ? 28 : 20;
});

// Final Thank you Footer
doc.setFont('Deva', 'bold');
doc.setFontSize(11);
doc.setTextColor(245, 158, 11);
printText('श्री शिवाजी हायस्कूल व कनिष्ठ महाविद्यालय, चिखली - शिक्षण क्षेत्रात आधुनिक तंत्रज्ञानाची नवी क्रांती!', W / 2, H - 75, { align: 'center' });

// Save PDF
const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

const publicPath = path.join(process.cwd(), 'public', 'Shivaji_Vidyalaya_Website_Guide_Presentation.pdf');
fs.writeFileSync(publicPath, pdfBuffer);

const rootPath = path.join(process.cwd(), 'Shivaji_Vidyalaya_Website_Guide_Presentation.pdf');
fs.writeFileSync(rootPath, pdfBuffer);

const artifactDir = path.join(process.cwd(), '.aistudio', 'artifacts', 'brain', '312aa896-9e51-41f9-a2fa-07c3393d7f75');
if (fs.existsSync(artifactDir)) {
  fs.writeFileSync(path.join(artifactDir, 'Shivaji_Vidyalaya_Website_Guide_Presentation.pdf'), pdfBuffer);
}

console.log('Sanitized PDF Generated Successfully!');
console.log('File size:', pdfBuffer.length, 'bytes');
