const fs = require('fs');
const PizZip = require('pizzip');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');

const docs = [
    { name: 'PAD_SAN CLEMENTE ultimo.docx', ignored: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 23, 24] },
    { name: 'PAD-CHINCHAYSULLO ultimo.docx', ignored: [1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 23, 24, 67, 91, 92, 211, 224, 226, 228, 232] },
    { name: 'MP Barandas Mayo .docx', ignored: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 19] }
];

function getTargetFromRel(rId, relsElements) {
    for (let i = 0; i < relsElements.length; i++) {
        if (relsElements[i].getAttribute('Id') === rId) {
            return relsElements[i].getAttribute('Target');
        }
    }
    return null;
}

const docInfo = docs[2]; // Barandas
const buf = fs.readFileSync(`C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\${docInfo.name}`);
const zip = new PizZip(buf);
const xmlString = zip.file('word/document.xml').asText();
const relsString = zip.file('word/_rels/document.xml.rels').asText();

const xmlDoc = new DOMParser().parseFromString(xmlString, 'text/xml');
const relsDoc = new DOMParser().parseFromString(relsString, 'text/xml');
const relsElements = relsDoc.getElementsByTagName('Relationship');

const elements = xmlDoc.getElementsByTagName('*');
let shapeCounter = 0;
let tagCounter = 0;

for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (el.tagName === 'w:drawing' || el.tagName === 'v:shape' || el.tagName === 'pic:pic') {
        shapeCounter++;
        if (docInfo.ignored.includes(shapeCounter)) continue;

        let rId = null;
        const blip = el.getElementsByTagName('a:blip')[0];
        if (blip) rId = blip.getAttribute('r:embed');
        if (!rId) {
            const imageData = el.getElementsByTagName('v:imagedata')[0];
            if (imageData) rId = imageData.getAttribute('r:id');
        }

        if (rId) {
            tagCounter++;
            if (tagCounter <= 5) {
                const target = getTargetFromRel(rId, relsElements);
                console.log(`Tag foto_${String(tagCounter).padStart(3, '0')} uses rId=${rId}, Target=${target}`);
            }
        }
    }
}
