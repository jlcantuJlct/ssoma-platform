const fs = require('fs');
const PizZip = require('pizzip');

const ORIGINAL_DOC = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\Peaje Jahuay Ultimo.docx';
const OUTPUT_DOC = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_JAHUAY_PLANTILLA.docx';

console.log("📂 Leyendo plantilla original de Jahuay...");
const buf = fs.readFileSync(ORIGINAL_DOC);
const zip = new PizZip(buf);
let xml = zip.file('word/document.xml').asText();

let mesCounter = 0;
xml = xml.replace(/mes[ \u00A0]año/gi, (match) => {
    mesCounter++;
    return '{mes_anio}';
});
console.log(`✅ Se reemplazaron ${mesCounter} ocurrencias de "mes año" → {mes_anio}`);

let shapeCounter = 0;
let tagCounter = 0;

const IGNORED_SHAPES = [1, 2];

xml = xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (parrafo) => {
    if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
        shapeCounter++;
        if (IGNORED_SHAPES.includes(shapeCounter)) return parrafo;

        tagCounter++;
        const tagName = `foto_${String(tagCounter).padStart(3, '0')}`;
        const pPrMatch = parrafo.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
        const pPr = pPrMatch ? pPrMatch[0] : '<w:pPr><w:jc w:val="center"/></w:pPr>';
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
