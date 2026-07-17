const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const DOC_PATH = path.join(__dirname, '..', 'plantillas', 'MP6 _ultimo.docx');
const buf = fs.readFileSync(DOC_PATH);
const zip = new PizZip(buf);
const xml = zip.file("word/document.xml") ? zip.file("word/document.xml").asText() : '';

let shapeCounter = 0;
xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (parrafo) => {
    if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
        shapeCounter++;
        if (shapeCounter <= 40) {
            console.log(`\n--- Shape ${shapeCounter} ---`);
            const embeds = [...parrafo.matchAll(/r:embed="([^"]+)"/g)];
            if (embeds.length > 0) {
                embeds.forEach((e, idx) => console.log(`  Embed ${idx+1}: ${e[1]}`));
            } else {
                console.log(`  No embed found (maybe graphic/logo)`);
            }
        }
    }
    return parrafo;
});
console.log(`\nTotal shapes detected: ${shapeCounter}`);
