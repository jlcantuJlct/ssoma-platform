const fs = require('fs');
const PizZip = require('pizzip');
const { DOMParser } = require('@xmldom/xmldom');

const buf = fs.readFileSync('C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\MP Barandas Mayo .docx');
const zip = new PizZip(buf);
const xmlString = zip.file('word/document.xml').asText();

const doc = new DOMParser().parseFromString(xmlString, 'text/xml');
const elements = doc.getElementsByTagName('w:drawing');

for (let i = 0; i < 5; i++) {
    if (elements[i]) {
        console.log(`w:drawing ${i} parent is:`, elements[i].parentNode.tagName);
    }
}
