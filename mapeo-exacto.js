/**
 * mapeo-exacto.js
 * Muestra el mapeo EXACTO como lo ve el motor route.ts actualmente:
 * con el IGNORED_MAP [1-29], qué foto_NNN corresponde a cada imagen real.
 * Útil para verificar si el baños tiene 4 slots o no.
 */
const fs = require('fs');
const PizZip = require('./node_modules/pizzip');

const BASE = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual';
const FILE = BASE + '\\PAD_SAN CLEMENTE ultimo.docx';

// IGNORED_MAP actual (después del fix de hoy)
const IGNORED = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 19, 25, 27, 28, 29]);

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

console.log('\n=== MAPEO EXACTO con IGNORED_MAP [1-29] ===\n');
console.log('Mostrando los primeros 15 slots de foto_NNN:\n');

for (let i = 0; i < paras.length; i++) {
    const p = paras[i];
    if (p.includes('<w:drawing') || p.includes('<v:shape') || p.includes('pic:pic')) {
        shapeCounter++;
        const isIgnored = IGNORED.has(shapeCounter);

        // Contar embeds individuales
        const embeds = (p.match(/r:embed="[^"]+"/g) || []);
        const embedCount = embeds.length || 1;

        // Contexto (párrafos anteriores)
        let ctx = '';
        for (let b = Math.max(0, i-4); b < i; b++) {
            const t = getText(paras[b]);
            if (t.length > 2) ctx += t.substring(0, 70) + ' | ';
        }

        if (isIgnored) {
            console.log('[shape ' + shapeCounter + '] IGNORADO  (' + embedCount + ' embed)  ctx: ' + ctx.substring(0, 80));
        } else {
            for (let e = 0; e < Math.max(embedCount, 1); e++) {
                tagCounter++;
                if (tagCounter <= 15) {
                    console.log('[shape ' + shapeCounter + ' embed ' + (e+1) + '] foto_' + String(tagCounter).padStart(3,'0') + '  ctx: ' + ctx.substring(0, 100));
                }
            }
        }

        if (tagCounter >= 15) break;
    }
}

console.log('\n=== FIN ===\n');
