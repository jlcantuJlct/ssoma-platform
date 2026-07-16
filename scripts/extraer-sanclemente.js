const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const DOC_PATH = path.join(__dirname, '..', 'plantillas', 'PAD_SAN CLEMENTE ultimo.docx');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'referencias_sanclemente');

function extract() {
    if (fs.existsSync(OUTPUT_DIR)) {
        fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const buf = fs.readFileSync(DOC_PATH);
    const zip = new PizZip(buf);
    
    const xml = zip.file("word/document.xml") ? zip.file("word/document.xml").asText() : '';
    const relsXml = zip.file("word/_rels/document.xml.rels") ? zip.file("word/_rels/document.xml.rels").asText() : '';

    const rels = {};
    const relPattern = /<Relationship Id="([^"]+)"[^>]+Target="([^"]+)"/g;
    let m;
    while ((m = relPattern.exec(relsXml)) !== null) {
        rels[m[1]] = m[2]; // e.g. rels['rId4'] = 'media/image1.jpeg'
    }

    let shapeCounter = 0;
    let tagCounter = 0;
    let saved = 0;
    
    // De app/api/generar-docx/route.ts: 'PAD_SAN_CLEMENTE_PLANTILLA.docx': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 68]
    const IGNORED_SHAPES = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 68]);

    xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (parrafo) => {
        if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
            shapeCounter++;
            if (IGNORED_SHAPES.has(shapeCounter)) return parrafo;

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
    
    console.log(`\nExtraídas ${saved} fotos reales de ${tagCounter} tags de foto encontrados en San Clemente.`);
    
    // Generar mapeo
    const map = {};
    for (let i = 1; i <= saved; i++) {
        const tag = `foto_${String(i).padStart(3, '0')}`;
        // Find extension
        const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.startsWith(tag));
        if (files.length > 0) {
            map[tag] = `/referencias_sanclemente/${files[0]}?v=2`; // v=2 for cache busting
        }
    }
    
    const referencesMapPath = path.join(__dirname, '..', 'public', 'references_map.json');
    const mapJson = JSON.parse(fs.readFileSync(referencesMapPath));
    mapJson['PAD_SAN_CLEMENTE_INTERNAL.docx'] = map;
    fs.writeFileSync(referencesMapPath, JSON.stringify(mapJson, null, 2));
    console.log(`Actualizado references_map.json para PAD_SAN_CLEMENTE_INTERNAL.docx`);
}

extract();
