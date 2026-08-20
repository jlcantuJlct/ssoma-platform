const fs = require('fs');
const PizZip = require('./node_modules/pizzip');

const BASE = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual';
const FILE = BASE + '\\PAD_SAN CLEMENTE ultimo.docx';

// ORIGINAL IGNORED MAP
const IGNORED = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 23, 24]);

const buf = fs.readFileSync(FILE);
const zip = new PizZip(buf);
const xml = zip.file('word/document.xml').asText();

function getText(p) {
    return p.replace(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g, function(_,t){ return t; })
             .replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
}

const paraRegex = /<w:p[ >][\s\S]*?<\/w:p>/g;
const paras = [];
let m;
while ((m = paraRegex.exec(xml)) !== null) paras.push(m[0]);

let shapeCounter = 0;
let tagCounter = 0;

console.log('\n=== MAPEO EXACTO LOGICA ANTIGUA ===\n');

for (let i = 0; i < paras.length; i++) {
    const p = paras[i];
    if (p.includes('<w:drawing') || p.includes('<v:shape') || p.includes('pic:pic')) {
        shapeCounter++;
        const isIgnored = IGNORED.has(shapeCounter);

        // Contexto
        let ctx = '';
        for (let b = Math.max(0, i-4); b < i; b++) {
            const t = getText(paras[b]);
            if (t.length > 2) ctx += t.substring(0, 70) + ' | ';
        }

        if (isIgnored) {
            console.log('[shape ' + shapeCounter + '] IGNORADO  ctx: ' + ctx.substring(0, 80));
        } else {
            // LÓGICA ANTIGUA: SOLO 1 TAG POR PÁRRAFO
            tagCounter++;
            if (tagCounter <= 30) {
                console.log('[shape ' + shapeCounter + ' OLD LOGIC] foto_' + String(tagCounter).padStart(3,'0') + '  ctx: ' + ctx.substring(0, 100));
            }
        }
        if (tagCounter >= 30) break;

    }
}
