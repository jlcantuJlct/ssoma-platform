const fs = require('fs');
const PizZip = require('pizzip');
const zip = new PizZip(fs.readFileSync('C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\MP Barandas Mayo .docx'));
const xml = zip.file('word/document.xml').asText();
const idx = xml.indexOf('2026');
if (idx !== -1) {
    console.log(xml.substring(idx - 100, idx + 100));
} else {
    console.log("No 2026 found");
}
