const fs = require('fs');
const PizZip = require('pizzip');
const zip = new PizZip(fs.readFileSync('C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\MP Barandas Mayo .docx'));
const xml = zip.file('word/document.xml').asText();
const idx = xml.indexOf('Mayo');
if (idx !== -1) {
    console.log(xml.substring(idx - 60, idx + 60));
} else {
    console.log("No Mayo found");
}
