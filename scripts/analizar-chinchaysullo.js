const fs = require('fs');
const PizZip = require('pizzip');
const DOC = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD-CHINCHAYSULLO ultimo.docx';

console.log("Leyendo documento... (esto puede tomar unos segundos)");
const buf = fs.readFileSync(DOC);
const zip = new PizZip(buf);
const xml = zip.file('word/document.xml').asText();

let shapeCounter = 0;
xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (parrafo) => {
    if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
        shapeCounter++;
    }
    return parrafo;
});

const mesAnioCount = (xml.match(/mes[ \u00A0]año/gi) || []).length;

console.log(`\nANÁLISIS DE CHINCHAYSULLO`);
console.log(`- Formas/Imágenes encontradas: ${shapeCounter}`);
console.log(`- Ocurrencias de "mes año": ${mesAnioCount}`);
