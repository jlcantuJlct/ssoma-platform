const fs = require('fs');
const PizZip = require('pizzip');
const INPUT = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_SAN CLEMENTE ultimo.docx';
const xml = new PizZip(fs.readFileSync(INPUT)).file('word/document.xml').asText();
let shapeCounter = 0;
xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (parrafo) => {
    if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
        shapeCounter++;
        if (shapeCounter === 15) {
            console.log("=== SHAPE 15 ===");
            const drawings = parrafo.split(/<w:drawing|<v:shape/);
            for (let i = 1; i < drawings.length; i++) {
                const draw = drawings[i];
                const xMatch = draw.match(/<wp:posOffset>(\d+)<\/wp:posOffset>/);
                const rIdMatch = draw.match(/r:embed="([^"]+)"/);
                console.log(`Drawing ${i}: rId=${rIdMatch?.[1]}, x=${xMatch?.[1]}`);
            }
        }
    }
});
