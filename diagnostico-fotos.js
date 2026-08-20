/**
 * diagnostico-fotos.js
 * Compara el número de imágenes entre el Word original y la plantilla.
 * Ejecutar desde la raíz del proyecto ssoma-platform:
 *   node diagnostico-fotos.js
 */

const fs   = require('fs');
const path = require('path');
const PizZip = require('./node_modules/pizzip');

const BASE = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual';
const FILES = {
    original:  path.join(BASE, 'PAD_SAN CLEMENTE ultimo.docx'),
    plantilla: path.join(BASE, 'PAD_SAN_CLEMENTE_PLANTILLA.docx'),
};

function extractText(xml) {
    return xml
        .replace(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g, (_, t) => t)
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .trim();
}

function analyzeDoc(label, filePath) {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(` ${label}`);
    console.log(`${'═'.repeat(70)}`);

    const buf = fs.readFileSync(filePath);
    const zip = new PizZip(buf);
    const xml = zip.file('word/document.xml').asText();

    // Separar todos los párrafos
    const paraRegex = /<w:p[ >][\s\S]*?<\/w:p>/g;
    const paras = [];
    let m;
    while ((m = paraRegex.exec(xml)) !== null) {
        paras.push(m[0]);
    }

    console.log(`  Total párrafos: ${paras.length}`);

    let shapeCounter = 0;
    const shapes = [];

    for (let i = 0; i < paras.length; i++) {
        const p = paras[i];
        if (p.includes('<w:drawing') || p.includes('<v:shape') || p.includes('pic:pic')) {
            shapeCounter++;

            // Extraer texto de contexto (los 3 párrafos anteriores)
            let context = '';
            for (let back = Math.max(0, i - 4); back < i; back++) {
                const t = extractText(paras[back]);
                if (t.length > 2 && t.length < 300) context += t.substring(0, 80) + ' | ';
            }

            // Extraer rId
            let rId = '';
            const rIdM = p.match(/r:embed="([^"]+)"/);
            if (!rIdM) { const rIdM2 = p.match(/r:id="([^"]+)"/); if (rIdM2) rId = rIdM2[1]; }
            else rId = rIdM[1];

            // ¿Cuántos r:embed hay en este párrafo? (imágenes múltiples en mismo párr)
            const embedCount = (p.match(/r:embed="[^"]+"/g) || []).length;

            shapes.push({ idx: shapeCounter, paraIndex: i, rId, context: context.trim(), embedCount });
        }
    }

    console.log(`  Total shapes (imágenes): ${shapeCounter}\n`);

    const limit = Math.min(50, shapes.length);
    console.log(`  Primeros ${limit} shapes:\n`);
    for (let j = 0; j < limit; j++) {
        const s = shapes[j];
        const multiFlag = s.embedCount > 1 ? ` ⚠️ ${s.embedCount} embeds en mismo párrafo` : '';
        const ctx = s.context ? `  ← ${s.context}` : '';
        console.log(`  [${String(s.idx).padStart(3,'0')}] párr=${String(s.paraIndex).padStart(4)} rId=${(s.rId||'—').padEnd(8)}${multiFlag}${ctx}`);
    }

    return { total: shapeCounter, shapes };
}

// ── Ejecutar ─────────────────────────────────────────────────────────────────
try {
    const orig = analyzeDoc('ORIGINAL  →  PAD_SAN CLEMENTE ultimo.docx', FILES.original);
    const plan = analyzeDoc('PLANTILLA →  PAD_SAN_CLEMENTE_PLANTILLA.docx', FILES.plantilla);

    console.log(`\n${'═'.repeat(70)}`);
    console.log(` RESUMEN DE DIFERENCIA`);
    console.log(`${'═'.repeat(70)}`);
    console.log(`  Shapes en el original : ${orig.total}`);
    console.log(`  Shapes en la plantilla: ${plan.total}`);
    const diff = orig.total - plan.total;
    if (diff > 0) {
        console.log(`\n  ⚠️  Faltan ${diff} imágenes en la plantilla vs el original.`);
        console.log(`  Esto sugiere que el script de etiquetado no detectó esas imágenes.`);
    } else if (diff < 0) {
        console.log(`\n  ℹ️  La plantilla tiene ${Math.abs(diff)} shapes más que el original.`);
    } else {
        console.log(`\n  ✅ Mismo número de imágenes en ambos archivos.`);
    }

    // Buscar párrafos con múltiples embeds
    const multiOrig = orig.shapes.filter(s => s.embedCount > 1);
    const multiPlan = plan.shapes.filter(s => s.embedCount > 1);
    if (multiOrig.length > 0) {
        console.log(`\n  ⚠️  El ORIGINAL tiene ${multiOrig.length} párrafos con MÚLTIPLES imágenes:`);
        multiOrig.forEach(s => console.log(`    Shape #${s.idx} (párr ${s.paraIndex}): ${s.embedCount} imágenes en mismo párrafo`));
    }
    if (multiPlan.length > 0) {
        console.log(`\n  ⚠️  La PLANTILLA tiene ${multiPlan.length} párrafos con MÚLTIPLES imágenes:`);
        multiPlan.forEach(s => console.log(`    Shape #${s.idx} (párr ${s.paraIndex}): ${s.embedCount} imágenes en mismo párrafo`));
    }

} catch (e) {
    console.error('\n❌ Error:', e.message);
    console.error(e.stack);
}
