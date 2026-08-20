/**
 * diagnostico-todas-plantillas.js
 * Cuenta el total de imágenes INDIVIDUALES (no párrafos) en cada Word original.
 * Detecta cuántos párrafos tienen múltiples imágenes y el total real de slots.
 */
const fs = require('fs');
const PizZip = require('./node_modules/pizzip');

const BASE = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual';

const DOCS = [
    { label: 'PAD San Clemente',  file: 'PAD_SAN CLEMENTE ultimo.docx',  ignoredParr: 29 },
    { label: 'PAD Chinchaysullo', file: 'PAD-CHINCHAYSULLO ultimo.docx',  ignoredParr: 24 }, // ignorados actuales: 1-3,6-15,23-24 → max=24
    { label: 'PAD Jahuay',        file: 'Peaje Jahuay Mayo.docx',          ignoredParr: 2  },
    { label: 'MP Barandas',       file: 'MP Barandas Mayo .docx',          ignoredParr: 19 },
];

function analyzeDoc(label, filePath, ignoredMaxParr) {
    console.log('\n' + '═'.repeat(70));
    console.log(' ' + label + '  →  ' + filePath);
    console.log('═'.repeat(70));

    if (!fs.existsSync(filePath)) {
        console.log('  ⚠️  Archivo no encontrado: ' + filePath);
        return;
    }

    const buf = fs.readFileSync(filePath);
    const zip = new PizZip(buf);
    const xml = zip.file('word/document.xml').asText();

    const paraRegex = /<w:p[ >][\s\S]*?<\/w:p>/g;
    const paras = [];
    let m;
    while ((m = paraRegex.exec(xml)) !== null) paras.push(m[0]);

    let parrCounter = 0;
    let totalIndividualImages = 0;
    let replaceable = 0;
    let multiEmbedParrs = [];

    for (let i = 0; i < paras.length; i++) {
        const p = paras[i];
        if (p.includes('<w:drawing') || p.includes('<v:shape') || p.includes('pic:pic')) {
            parrCounter++;

            // Contar embeds individuales en este párrafo
            const embeds = (p.match(/r:embed="[^"]+"/g) || []).length || 1;
            totalIndividualImages += embeds;

            const isIgnored = parrCounter <= ignoredMaxParr;

            if (!isIgnored) {
                replaceable += embeds;
                if (embeds > 1) {
                    multiEmbedParrs.push({ parrIdx: parrCounter, count: embeds });
                }
            }
        }
    }

    console.log('  Párrafos con imágenes (shapes):  ' + parrCounter);
    console.log('  Imágenes INDIVIDUALES totales:   ' + totalIndividualImages);
    console.log('  Párrafos ignorados (portada etc): ' + ignoredMaxParr);
    console.log('  ✅ Slots REEMPLAZABLES reales:    ' + replaceable + '  (slots foto_001 → foto_' + String(replaceable).padStart(3,'0') + ')');

    if (multiEmbedParrs.length > 0) {
        console.log('\n  ⚠️  Párrafos con MÚLTIPLES imágenes en zona REEMPLAZABLE:  ' + multiEmbedParrs.length);
        multiEmbedParrs.slice(0, 15).forEach(function(x) {
            console.log('    Párrafo #' + x.parrIdx + ':  ' + x.count + ' imágenes (solo 1 era reemplazable con el motor antiguo)');
        });
        if (multiEmbedParrs.length > 15) console.log('    ... y ' + (multiEmbedParrs.length - 15) + ' más');
        
        const lost = multiEmbedParrs.reduce(function(acc, x){ return acc + x.count - 1; }, 0);
        console.log('\n  🔴 Imágenes perdidas por el bug:  ' + lost + '  (no se podían reemplazar)');
    } else {
        console.log('\n  ✅ Sin múltiples imágenes por párrafo — sin pérdidas.');
    }
}

DOCS.forEach(function(d) {
    analyzeDoc(d.label, require('path').join(BASE, d.file), d.ignoredParr);
});

console.log('\n' + '═'.repeat(70));
console.log(' FIN DEL DIAGNÓSTICO');
console.log('═'.repeat(70) + '\n');
