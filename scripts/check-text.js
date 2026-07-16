const fs = require('fs');
const PizZip = require('pizzip');
const zip = new PizZip(fs.readFileSync('TEST_OUTPUT_BARANDAS.docx'));
const xml = zip.file('word/document.xml').asText();
console.log('Contains Junio 2026:', xml.includes('Junio 2026'));
console.log('Contains MAYO 2026:', xml.includes('MAYO 2026'));
