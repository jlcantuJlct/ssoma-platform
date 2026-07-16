const fs = require('fs');
const PizZip = require('pizzip');
const path = require('path');

const ORIGINAL_DOC = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD-CHINCHAYSULLO ultimo.docx';
const OUTPUT_DIR = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\ssoma-platform\\public\\referencias_chincha';

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

console.log("Creando directorio de referencias Chinchaysullo...");
console.log("Cargando documento original...");
const buf = fs.readFileSync(ORIGINAL_DOC);
const zip = new PizZip(buf);
const xml = zip.file('word/document.xml').asText();
const relsXml = zip.file('word/_rels/document.xml.rels').asText();

const rels = {};
const relPattern = /<Relationship Id="([^"]+)"[^>]+Target="([^"]+)"/g;
let m;
while ((m = relPattern.exec(relsXml)) !== null) {
    rels[m[1]] = m[2]; // e.g. rels['rId4'] = 'media/image1.jpeg'
}

let shapeCounter = 0;
let tagCounter = 0;
let saved = 0;

const IGNORED_SHAPES = new Set([1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 23, 24, 67, 91, 92, 211, 224, 226, 228, 232]);

xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (parrafo) => {
    if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
        shapeCounter++;
        
        if (IGNORED_SHAPES.has(shapeCounter)) {
            return parrafo;
        }
        
        const embeds = [...parrafo.matchAll(/r:embed="([^"]+)"/g)];
        const embedCount = embeds.length > 0 ? embeds.length : 1;

        for (let e = 0; e < embedCount; e++) {
            tagCounter++;
            const tagName = `foto_${String(tagCounter).padStart(3, '0')}`;
            
            let rIdMatch = null;
            if (embeds.length > 0) {
                rIdMatch = embeds[e];
            } else {
                rIdMatch = parrafo.match(/r:id="([^"]+)"/);
            }
            
            if (rIdMatch) {
                const rId = rIdMatch[1];
                const target = rels[rId]; 
                if (target) {
                    const ext = path.extname(target) || '.jpg';
                    const outPath = path.join(OUTPUT_DIR, `${tagName}${ext}`);
                    
                    try {
                        const imgData = zip.file(`word/${target}`);
                        if (imgData) {
                            fs.writeFileSync(outPath, imgData.asNodeBuffer());
                            saved++;
                        }
                    } catch (e) {
                        console.error(`Error al extraer ${target} para ${tagName}:`, e.message);
                    }
                }
            }
        }
    }
    return parrafo;
});

console.log(`¡Listo! Se guardaron ${saved} imágenes de referencia en /public/referencias_chincha/`);
