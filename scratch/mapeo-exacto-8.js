const fs = require('fs');
const PizZip = require('pizzip');
const INPUT = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_SAN CLEMENTE ultimo.docx';
const xml = new PizZip(fs.readFileSync(INPUT)).file('word/document.xml').asText();
let shapeCounter = 0;
xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (parrafo) => {
    if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
        shapeCounter++;
        if (shapeCounter === 30) {
            console.log("=== SHAPE 30 ===");
            const embeds = Array.from(parrafo.matchAll(/r:embed="([^"]+)"/g)).map(m=>m[1]);
            console.log("Embeds:", embeds);
        }
    }
});
