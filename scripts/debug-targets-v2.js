const fs = require('fs');
const PizZip = require('pizzip');

const docs = [
    { name: 'PAD_SAN CLEMENTE ultimo.docx', ignored: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 23, 24] },
    { name: 'PAD-CHINCHAYSULLO ultimo.docx', ignored: [1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 23, 24, 67, 91, 92, 211, 224, 226, 228, 232] },
    { name: 'MP Barandas Mayo .docx', ignored: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 19] }
];

const docInfo = docs[2]; // Barandas
const buf = fs.readFileSync(`C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\${docInfo.name}`);
const zip = new PizZip(buf);
const xmlString = zip.file('word/document.xml').asText();
const relsXml = zip.file('word/_rels/document.xml.rels').asText();

const rels = {};
const relPattern = /<Relationship Id="([^"]+)"[^>]+Target="([^"]+)"/g;
let m;
while ((m = relPattern.exec(relsXml)) !== null) {
    rels[m[1]] = m[2];
}

let shapeCounter = 0;
let tagCounter = 0;

xmlString.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (parrafo) => {
    if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
        shapeCounter++;
        
        if (docInfo.ignored.includes(shapeCounter)) return parrafo;
        
        tagCounter++;
        const tagName = `foto_${String(tagCounter).padStart(3, '0')}`;
        
        let rIdMatch = parrafo.match(/r:embed="([^"]+)"/);
        if (!rIdMatch) rIdMatch = parrafo.match(/r:id="([^"]+)"/);
        
        if (rIdMatch) {
            const rId = rIdMatch[1];
            const target = rels[rId];
            if (tagCounter <= 5) {
                console.log(`Tag ${tagName} uses rId=${rId}, Target=${target}`);
            }
        }
    }
    return parrafo;
});
