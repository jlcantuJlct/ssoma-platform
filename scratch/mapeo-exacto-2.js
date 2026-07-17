const fs = require('fs');
const PizZip = require('pizzip');

const INPUT = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_SAN CLEMENTE ultimo.docx';
const buf = fs.readFileSync(INPUT);
const zip = new PizZip(buf);
const xml = zip.file('word/document.xml').asText();

let shapeCounter = 0;
let tagCounter = 0;
const IGNORED_MAP = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 72];

console.log("=== MAPEO EXACTO con IGNORED_MAP [1-14, 72] ===");

xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (parrafo) => {
    if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
        shapeCounter++;
        
        let ctx = parrafo.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').substring(0, 70);

        if (IGNORED_MAP.includes(shapeCounter)) {
            console.log(`[shape ${shapeCounter}] IGNORADO  ctx: ${ctx}`);
            return parrafo;
        }

        const allEmbeds = Array.from(parrafo.matchAll(/r:embed="([^"]+)"/g)).map(m => m[1]);
        if (allEmbeds.length === 0) {
            const rIdMatch = parrafo.match(/r:id="([^"]+)"/);
            if (rIdMatch) allEmbeds.push(rIdMatch[1]);
        }
        
        for (let i = 0; i < allEmbeds.length; i++) {
            tagCounter++;
            console.log(`[shape ${shapeCounter} embed ${i+1}] foto_${String(tagCounter).padStart(3, '0')} ctx: ${ctx}`);
        }
    }
});
console.log(`Total slots San Clemente: ${tagCounter}`);
