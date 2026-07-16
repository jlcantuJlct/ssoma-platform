const fs = require('fs');
const PizZip = require('pizzip');
const zip = new PizZip(fs.readFileSync('C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\MP Barandas Mayo .docx'));
const xml = zip.file('word/document.xml').asText();
console.log('MAYO', xml.includes('MAYO'));
console.log('2026', xml.includes('2026'));
console.log('Mayo', xml.includes('Mayo'));
