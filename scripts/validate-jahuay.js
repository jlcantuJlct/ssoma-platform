const fs = require('fs');
const PizZip = require('pizzip');
const { XMLValidator } = require('fast-xml-parser');

const buf = fs.readFileSync('C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_JAHUAY_PLANTILLA.docx');
const zip = new PizZip(buf);
const xmlData = zip.file('word/document.xml').asText();

const result = XMLValidator.validate(xmlData);
if (result === true) {
    console.log("JAHUAY XML is perfectly valid!");
} else {
    console.log("JAHUAY XML is INVALID:", result);
}
