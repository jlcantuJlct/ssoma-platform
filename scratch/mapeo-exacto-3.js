const fs = require('fs');
const PizZip = require('pizzip');

const INPUT = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_SAN CLEMENTE ultimo.docx';
const buf = fs.readFileSync(INPUT);
const zip = new PizZip(buf);
const xml = zip.file('word/document.xml').asText();

let shapeCounter = 0;
xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (parrafo) => {
    if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
        shapeCounter++;
        if (shapeCounter === 15) {
            console.log("=== SHAPE 15 ===");
            console.log(parrafo.substring(0, 1500));
        }
        if (shapeCounter === 16) {
            console.log("=== SHAPE 16 ===");
            console.log(parrafo.substring(0, 1500));
        }
    }
});
