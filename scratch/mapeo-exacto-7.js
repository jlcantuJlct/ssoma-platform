const fs = require('fs');
const PizZip = require('pizzip');
const INPUT = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_SAN CLEMENTE ultimo.docx';
const xml = new PizZip(fs.readFileSync(INPUT)).file('word/document.xml').asText();
const paragraphs = xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g);
let shapeCounter = 0;
for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    if (p.includes('<w:drawing') || p.includes('<v:shape') || p.includes('pic:pic')) {
        shapeCounter++;
        if (shapeCounter >= 14 && shapeCounter <= 17) {
            console.log(`\n=== SHAPE ${shapeCounter} ===`);
            // print text of 2 previous paragraphs and this paragraph
            for (let j = Math.max(0, i-2); j <= i; j++) {
                const text = paragraphs[j].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
                if (text) console.log(`[P${j}]`, text);
            }
        }
    }
}
