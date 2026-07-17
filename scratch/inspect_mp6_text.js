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
            const textMatch = parrafo.match(/<w:t[ >]*?>([\s\S]*?)<\/w:t>/g);
            if (textMatch) {
                const text = textMatch.map(t => t.replace(/<[^>]+>/g, '')).join('');
                console.log(`  Text context: ${text}`);
            } else {
                console.log(`  No text context`);
            }
        }
    }
    return parrafo;
});
