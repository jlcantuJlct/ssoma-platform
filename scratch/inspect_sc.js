const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const DOC_PATH = path.join(__dirname, '..', 'plantillas', 'PAD_SAN CLEMENTE ultimo.docx');
const buf = fs.readFileSync(DOC_PATH);
const zip = new PizZip(buf);
const xml = zip.file('word/document.xml').asText();
const relsXml = zip.file('word/_rels/document.xml.rels').asText();

const rels = {};
const relPattern = /<Relationship Id="([^"]+)"[^>]+Target="([^"]+)"/g;
let m;
while ((m = relPattern.exec(relsXml)) !== null) {
    rels[m[1]] = m[2];
}

let shapeCounter = 0;
let tagCounter = 0;
const IGNORED = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 68]);

xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (parrafo) => {
    if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
        shapeCounter++;
        if (!IGNORED.has(shapeCounter)) {
            const embeds = [...parrafo.matchAll(/r:embed="([^"]+)"/g)];
            if (embeds.length > 0) {
                tagCounter += embeds.length;
            } else {
                const rIdMatch = parrafo.match(/r:id="([^"]+)"/);
                if (rIdMatch) {
                    tagCounter++;
                }
            }
        }
    }
    return parrafo;
});
console.log(`TOTAL FOTOS REALES: ${tagCounter}`);
