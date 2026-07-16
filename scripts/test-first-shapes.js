const fs = require('fs');
const PizZip = require('pizzip');
const path = require('path');
const ORIGINAL_DOC = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_SAN CLEMENTE ultimo.docx';

const buf = fs.readFileSync(ORIGINAL_DOC);
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
console.log("Extrayendo primeros 10 shapes...");

xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (parrafo) => {
    if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
        shapeCounter++;
        if (shapeCounter <= 10) {
            let rIdMatch = parrafo.match(/r:embed="([^"]+)"/);
            if (!rIdMatch) rIdMatch = parrafo.match(/r:id="([^"]+)"/);
            
            if (rIdMatch) {
                const target = rels[rIdMatch[1]];
                console.log(`Shape ${shapeCounter}: Image target = ${target}`);
                
                // Copy it to public folder to see
                try {
                    const imgBuf = zip.file(`word/${target}`).asNodeBuffer();
                    fs.writeFileSync(`public/referencias_pad/TEST_SHAPE_${shapeCounter}.jpg`, imgBuf);
                } catch(e) {}
            } else {
                console.log(`Shape ${shapeCounter}: No image ID (Shape/Text box)`);
            }
        }
    }
    return parrafo;
});
