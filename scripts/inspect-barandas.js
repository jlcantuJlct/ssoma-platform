const fs = require('fs');
const PizZip = require('pizzip');
const DOC = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\MP Barandas Mayo .docx';

try {
    const buf = fs.readFileSync(DOC);
    const zip = new PizZip(buf);
    const xml = zip.file('word/document.xml').asText();

    let shapeCounter = 0;
    let lastTexts = [];

    xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (parrafo) => {
        const textMatch = parrafo.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
        if (textMatch) {
            const text = textMatch.map(t => t.replace(/<[^>]+>/g, '')).join('');
            if (text.trim().length > 5) {
                lastTexts.push(text.trim());
                if (lastTexts.length > 5) lastTexts.shift();
            }
        }

        if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
            shapeCounter++;
            if (shapeCounter <= 30) {
                console.log(`\n=== SHAPE ${shapeCounter} ===`);
                console.log("Texto cercano:");
                lastTexts.slice(-2).forEach(t => console.log(`- ${t}`));
            }
        }
        return parrafo;
    });
    console.log(`\nTotal de formas detectadas: ${shapeCounter}`);
} catch (e) {
    console.error("Error leyendo el documento:", e.message);
}
