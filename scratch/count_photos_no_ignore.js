const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const docxPath = path.join(process.cwd(), 'plantillas', 'PAD_SAN CLEMENTE ultimo.docx');
const content = fs.readFileSync(docxPath);
const zip = new PizZip(content);
const xmlString = zip.file('word/document.xml').asText();

let shapeCounter = 0;
let realPhotoCounter = 0;
const ignored = []; // NO IGNORE

const regex = /<w:p[ >][\s\S]*?<\/w:p>/g;
let match;
while ((match = regex.exec(xmlString)) !== null) {
    const parrafo = match[0];
    if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
        shapeCounter++;
        if (!ignored.includes(shapeCounter)) {
            const embedRegex = /(r:embed|r:id)="([^"]+)"/g;
            let embedMatch;
            while ((embedMatch = embedRegex.exec(parrafo)) !== null) {
                realPhotoCounter++;
            }
        }
    }
}

console.log("TOTAL FOTOS REALES SIN IGNORAR NADA:", realPhotoCounter);
