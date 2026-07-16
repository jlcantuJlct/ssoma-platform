const fs = require('fs');
const PizZip = require('pizzip');
const { XMLValidator } = require('fast-xml-parser');

const buf = fs.readFileSync('C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_SAN_CLEMENTE_PLANTILLA.docx');
const zip = new PizZip(buf);
const xmlData = zip.file('word/document.xml').asText();

const result = XMLValidator.validate(xmlData);
if (result === true) {
    console.log("SAN CLEMENTE XML is perfectly valid!");
} else {
    console.log("SAN CLEMENTE XML is INVALID:", result);
}
