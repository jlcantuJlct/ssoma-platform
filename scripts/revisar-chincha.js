const fs = require('fs');
const PizZip = require('pizzip');
const DOC = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD-CHINCHAYSULLO ultimo.docx';

const buf = fs.readFileSync(DOC);
const zip = new PizZip(buf);
const xml = zip.file('word/document.xml').asText();
const relsXml = zip.file('word/_rels/document.xml.rels').asText();

const rels = {};
const relPattern = /<Relationship Id="([^"]+)"[^>]+Target="([^"]+)"/g;
let m;
while ((m = relPattern.exec(relsXml)) !== null) {
    rels[m[1]] = m[2];
}

const checkShapes = [1, 2, 3, 4, 5, 6, 15, 23, 24, 67, 91, 92, 211, 224, 226, 228, 232];
let shapeCounter = 0;

console.log("=== REVISIÓN DE SHAPES CHINCHAYSULLO ===");
xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (parrafo) => {
    if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
        shapeCounter++;
        if (checkShapes.includes(shapeCounter)) {
            let rIdMatch = parrafo.match(/r:embed="([^"]+)"/);
            if (!rIdMatch) rIdMatch = parrafo.match(/r:id="([^"]+)"/);
            
            let status = "Shape sin imagen/ID (probablemente caja de texto o línea)";
            if (rIdMatch) {
                const target = rels[rIdMatch[1]];
                status = `Imagen vinculada: ${target}`;
            }
            console.log(`Shape ${shapeCounter}: ${status}`);
        }
    }
    return parrafo;
});
