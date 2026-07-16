const fs = require('fs');
const PizZip = require('pizzip');
const ORIGINAL_DOC = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_SAN CLEMENTE ultimo.docx';

const buf = fs.readFileSync(ORIGINAL_DOC);
const zip = new PizZip(buf);
const xml = zip.file('word/document.xml').asText();

let fotoCounter = 0;
xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (parrafo) => {
    if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
        fotoCounter++;
        if (fotoCounter === 109 || fotoCounter === 158) {
            console.log(`\n=== FOTO ${fotoCounter} ===`);
            // Busca referencias a imagenes (r:id o r:embed)
            const ids = [...parrafo.matchAll(/r:(id|embed)="([^"]+)"/g)].map(m => m[2]);
            console.log("IDs encontrados:", ids);
            
            // Busca etiquetas de imagen
            const isVml = parrafo.includes('<v:imagedata');
            const isPic = parrafo.includes('<pic:pic');
            const isShape = parrafo.includes('<v:shape');
            console.log(`v:imagedata: ${isVml}, pic:pic: ${isPic}, v:shape: ${isShape}`);
            
            fs.writeFileSync(`scripts/foto_${fotoCounter}.xml`, parrafo);
        }
    }
    return parrafo;
});
