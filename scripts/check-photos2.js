const fs = require('fs');
const PizZip = require('pizzip');
const ORIGINAL_DOC = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_SAN CLEMENTE ultimo.docx';

const buf = fs.readFileSync(ORIGINAL_DOC);
const zip = new PizZip(buf);
const xml = zip.file('word/document.xml').asText();

const parts = xml.split(/<w:drawing|<v:shape/);
for (let i = 4; i <= 14; i++) {
    if (parts[i]) {
        let text = parts[i].substring(0, 800).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        console.log(`Foto ${i}: ${text.substring(0, 100)}`);
    }
}
