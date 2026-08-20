const fs = require('fs');
const PizZip = require('./node_modules/pizzip');
const BASE = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual';
const buf = fs.readFileSync(BASE + '\\PAD_SAN CLEMENTE ultimo.docx');
const zip = new PizZip(buf);
const xml = zip.file('word/document.xml').asText();
const paraRegex = /<w:p[ >][\s\S]*?<\/w:p>/g;
const paras = [];
let m;
while ((m = paraRegex.exec(xml)) !== null) paras.push(m[0]);

function getText(p) {
    return p.replace(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g, function(_,t){ return t; })
             .replace(/<[^>]+>/g,'').trim();
}

let sc = 0;
for (let i = 0; i < paras.length; i++) {
    const p = paras[i];
    if (p.includes('<w:drawing') || p.includes('<v:shape') || p.includes('pic:pic')) {
        sc++;
        if (sc >= 14 && sc <= 25) {
            const embeds = (p.match(/r:embed="[^"]+"/g) || []).length;
            let ctx = '';
            for (let b = Math.max(0, i-5); b < i; b++) {
                const t = getText(paras[b]);
                if (t.length > 2) ctx += t.substring(0, 90) + '  //  ';
            }
            console.log('[shape ' + sc + '] parr=' + i + ' | ' + embeds + ' embed(s)');
            console.log('  ctx: ' + ctx.substring(0, 250));
            console.log('');
        }
    }
}
