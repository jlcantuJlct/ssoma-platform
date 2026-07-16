const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const ORIGINAL_DOC = path.join(__dirname, '..', 'plantillas', 'PAD_SAN CLEMENTE ultimo.docx');
const OUTPUT_DIR   = path.join(__dirname, '..', 'public', 'referencias_pad');

function extractReferenceImages() {
    console.log('Creando directorio de referencias...');
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    console.log('Cargando documento original...');
    const buf = fs.readFileSync(ORIGINAL_DOC);
    const zip = new PizZip(buf);
    
    const xml = zip.file('word/document.xml').asText();
    const relsXml = zip.file('word/_rels/document.xml.rels').asText();
    
    // Parsear rels
    const rels = {};
    const relPattern = /<Relationship Id="([^"]+)"[^>]+Target="([^"]+)"/g;
    let m;
    while ((m = relPattern.exec(relsXml)) !== null) {
        rels[m[1]] = m[2]; // e.g. rels['rId4'] = 'media/image1.jpeg'
    }
    
    let shapeCounter = 0;
    let tagCounter = 0;
    let saved = 0;
    
    const IGNORED_SHAPES = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 68]);
    
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
                        const mediaPath = target.startsWith('word/') ? target : `word/${target}`;
                        const imgData = zip.file(mediaPath);
                        if (imgData) {
                            const ext = path.extname(target) || '.jpg';
                            const outPath = path.join(OUTPUT_DIR, `${tagName}${ext}`);
                            fs.writeFileSync(outPath, imgData.asNodeBuffer());
                            saved++;
                        }
                    }
                }
            }
        }
        return parrafo;
    });
    
    console.log(`¡Listo! Se guardaron ${saved} imágenes de referencia en /public/referencias_pad/`);
}

extractReferenceImages();
