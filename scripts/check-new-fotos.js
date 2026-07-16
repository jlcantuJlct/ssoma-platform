const fs = require('fs');
const PizZip = require('pizzip');
const ORIGINAL_DOC = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_SAN CLEMENTE ultimo.docx';

const buf = fs.readFileSync(ORIGINAL_DOC);
const zip = new PizZip(buf);
const xml = zip.file('word/document.xml').asText();

let shapeCounter = 0;
let tagCounter = 0;
const IGNORED_SHAPES = [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 72];

xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (parrafo) => {
    if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
        shapeCounter++;
        
        if (IGNORED_SHAPES.includes(shapeCounter)) return parrafo;
        
        tagCounter++;
        if (tagCounter === 1 || tagCounter === 2 || tagCounter === 3) {
            console.log(`\n=== NEW FOTO_00${tagCounter} (Shape ${shapeCounter}) ===`);
            // Extrayendo un poco del contexto de texto anterior
            const textMatch = parrafo.match(/<w:t>([^<]+)<\/w:t>/g);
            console.log("Texto cercano:", textMatch ? textMatch.map(t => t.replace(/<\/?w:t>/g, '')).join(' ') : "Sin texto");
        }
    }
    return parrafo;
});
