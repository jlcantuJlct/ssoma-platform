const fs = require('fs');
const PizZip = require('pizzip');

const ORIGINAL_DOC = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD-CHINCHAYSULLO ultimo.docx';
const OUTPUT_DOC = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_CHINCHAYSULLO_PLANTILLA.docx';

console.log("📂 Leyendo plantilla original de Chinchaysullo...");
const buf = fs.readFileSync(ORIGINAL_DOC);
const zip = new PizZip(buf);
let xml = zip.file('word/document.xml').asText();

// ── 1. Textos dinámicos ────────────────────────────────────────────────────────
// En Chinchaysullo, el usuario no especificó una palabra clave exacta,
// pero por si acaso dejaremos el reemplazo de "mes año".
// Si el documento dice "Mayo 2026", tal vez deberíamos buscar el texto literal si supiéramos cuál es.
// De momento aplicaremos el mismo que en San Clemente por si existe.
let mesCounter = 0;
xml = xml.replace(/mes[ \u00A0]año/gi, (match) => {
    mesCounter++;
    return '{mes_anio}';
});
if (mesCounter > 0) {
    console.log(`✅ Se reemplazaron ${mesCounter} ocurrencias de "mes año" → {mes_anio}`);
} else {
    console.log(`⚠️ No se encontraron ocurrencias de "mes año" en Chinchaysullo.`);
}

// ── 2. Etiquetas de imagen ───────────────────────────────────────────────────
let shapeCounter = 0;
let tagCounter = 0;
const fotoTagsUsed = [];

const IGNORED_SHAPES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 23, 24];

xml = xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (parrafo) => {
    if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
        shapeCounter++;
        
        if (IGNORED_SHAPES.includes(shapeCounter)) {
            return parrafo;
        }

        tagCounter++;
        const tagName = `foto_${String(tagCounter).padStart(3, '0')}`;
        const pPrMatch = parrafo.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
        const pPr = pPrMatch ? pPrMatch[0] : '<w:pPr><w:jc w:val="center"/></w:pPr>';
        fotoTagsUsed.push(tagName);
        return `<w:p>${pPr}<w:r><w:t>{%${tagName}}</w:t></w:r></w:p>`;
    }
    return parrafo;
});

console.log(`✅ Se reemplazaron ${tagCounter} imágenes con etiquetas {%foto_001} ... {%foto_${String(tagCounter).padStart(3,'0')}}`);

zip.file('word/document.xml', xml);
const outBuf = zip.generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
});

fs.writeFileSync(OUTPUT_DOC, outBuf);

console.log(`\n✅ Plantilla guardada en:\n   ${OUTPUT_DOC}\n`);
