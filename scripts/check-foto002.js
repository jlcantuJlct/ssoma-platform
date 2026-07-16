const fs = require('fs');
const PizZip = require('pizzip');
const ORIGINAL_DOC = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_SAN CLEMENTE ultimo.docx';

const buf = fs.readFileSync(ORIGINAL_DOC);
const zip = new PizZip(buf);
const xml = zip.file('word/document.xml').asText();

let shapeCounter = 0;
let tagCounter = 0;
const IGNORED_SHAPES = [1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 72];

xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (parrafo) => {
    if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
        shapeCounter++;
        
        if (IGNORED_SHAPES.includes(shapeCounter)) return parrafo;
        
        tagCounter++;
        if (tagCounter === 2) {
            console.log(`\n=== FOTO_002 (Shape ${shapeCounter}) ===`);
            fs.writeFileSync('scripts/foto002_context.xml', parrafo);
        }
    }
    return parrafo;
});
