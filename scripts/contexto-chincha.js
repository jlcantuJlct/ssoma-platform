const fs = require('fs');
const PizZip = require('pizzip');
const DOC = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD-CHINCHAYSULLO ultimo.docx';

const buf = fs.readFileSync(DOC);
const zip = new PizZip(buf);
const xml = zip.file('word/document.xml').asText();

const checkShapes = [67, 91, 92, 211, 224, 226, 228, 232];
let shapeCounter = 0;
let lastTexts = [];

xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (parrafo) => {
    // Extraer texto de este párrafo
    const textMatch = parrafo.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    if (textMatch) {
        const text = textMatch.map(t => t.replace(/<[^>]+>/g, '')).join('');
        if (text.trim().length > 5) {
            lastTexts.push(text.trim());
            if (lastTexts.length > 5) lastTexts.shift(); // Guardar los últimos 5 textos largos
        }
    }

    if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
        shapeCounter++;
        if (checkShapes.includes(shapeCounter)) {
            console.log(`\n=== SHAPE ${shapeCounter} ===`);
            console.log("Texto justo antes de este cuadro:");
            lastTexts.slice(-3).forEach(t => console.log(`- ${t}`));
        }
    }
    return parrafo;
});
