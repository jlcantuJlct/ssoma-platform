const fs = require('fs');
const PizZip = require('pizzip');
const { DOMParser } = require('@xmldom/xmldom');

function getTargetFromRel(rId, relsElements) {
    for (let i = 0; i < relsElements.length; i++) {
        if (relsElements[i].getAttribute('Id') === rId) {
            return relsElements[i].getAttribute('Target');
        }
    }
    return null;
}

function buildImageMap(originalDoc, ignoredIndices) {
    const buf = fs.readFileSync(originalDoc);
    const zip = new PizZip(buf);
    
    const xmlString = zip.file('word/document.xml').asText();
    const relsString = zip.file('word/_rels/document.xml.rels').asText();
    
    const doc = new DOMParser().parseFromString(xmlString, 'text/xml');
    const relsDoc = new DOMParser().parseFromString(relsString, 'text/xml');
    const relsElements = relsDoc.getElementsByTagName('Relationship');
    
    const elements = doc.getElementsByTagName('*');
    let shapeCounter = 0;
    let tagCounter = 0;
    const mapping = {};
    
    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (el.tagName === 'w:drawing' || el.tagName === 'v:shape' || el.tagName === 'pic:pic') {
            shapeCounter++;
            if (ignoredIndices.includes(shapeCounter)) continue;
            
            // Try to find rId
            let rId = null;
            const blip = el.getElementsByTagName('a:blip')[0];
            if (blip) rId = blip.getAttribute('r:embed');
            
            if (!rId) {
                const imageData = el.getElementsByTagName('v:imagedata')[0];
                if (imageData) rId = imageData.getAttribute('r:id');
            }
            
            if (rId) {
                const target = getTargetFromRel(rId, relsElements);
                if (target) {
                    tagCounter++;
                    const tagName = `foto_${String(tagCounter).padStart(3, '0')}`;
                    mapping[tagName] = target;
                }
            }
        }
    }
    return mapping;
}

const docs = [
    { name: 'PAD_SAN CLEMENTE ultimo.docx', ignored: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 23, 24] },
    { name: 'PAD-CHINCHAYSULLO ultimo.docx', ignored: [1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 23, 24, 67, 91, 92, 211, 224, 226, 228, 232] },
    { name: 'MP Barandas Mayo .docx', ignored: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 19] }
];

docs.forEach(d => {
    try {
        const p = `C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\${d.name}`;
        console.log(`Mapping ${d.name}...`);
        const map = buildImageMap(p, d.ignored);
        console.log(`  Found ${Object.keys(map).length} fillable slots. First is ${map['foto_001']}`);
    } catch (e) {
        console.log(`  Error: ${e.message}`);
    }
});
