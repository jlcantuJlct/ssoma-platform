const fs = require('fs');
const PizZip = require('pizzip');
const ORIGINAL_DOC = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_SAN CLEMENTE ultimo.docx';

const buf = fs.readFileSync(ORIGINAL_DOC);
const zip = new PizZip(buf);
const xml = zip.file('word/document.xml').asText();
const relsXml = zip.file('word/_rels/document.xml.rels').asText();

const rels = {};
const relPattern = /<Relationship Id="([^"]+)"[^>]+Target="([^"]+)"/g;
let m;
while ((m = relPattern.exec(relsXml)) !== null) {
    rels[m[1]] = m[2];
}

let fotoCounter = 0;
xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (parrafo) => {
    if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
        fotoCounter++;
        if ([109, 158, 159, 162, 165, 189, 190].includes(fotoCounter)) {
            console.log(`\n=== FOTO ${fotoCounter} ===`);
            const idMatches = [...parrafo.matchAll(/r:(id|embed)="([^"]+)"/g)];
            if (idMatches.length > 0) {
                idMatches.forEach(match => {
                    const rId = match[2];
                    console.log(`- ${rId} -> ${rels[rId]}`);
                });
            } else {
                console.log("- Sin IDs de imagen (posiblemente sea una forma o texto)");
            }
        }
    }
    return parrafo;
});
