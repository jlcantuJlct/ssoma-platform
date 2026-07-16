const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const DOC_PATH = path.join(__dirname, '..', 'plantillas', 'MP6 _ultimo.docx');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'referencias_mp6');

function extract() {
    if (fs.existsSync(OUTPUT_DIR)) {
        fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const buf = fs.readFileSync(DOC_PATH);
    const zip = new PizZip(buf);
    
    const xml = zip.file("word/document.xml") ? zip.file("word/document.xml").asText() : '';
    const xmlRels = zip.file("word/_rels/document.xml.rels") ? zip.file("word/_rels/document.xml.rels").asText() : '';

    let shapeCounter = 0;
    let tagCounter = 0;
    let saved = 0;
    
    // MP6 specific ignored shapes (logos on cover)
    const IGNORED_SHAPES = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);

    xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (parrafo) => {
        if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
            shapeCounter++;
            if (IGNORED_SHAPES.has(shapeCounter)) return parrafo;

            const embeds = [...parrafo.matchAll(/r:embed="([^"]+)"/g)];
            const embedCount = embeds.length > 0 ? embeds.length : 1;
            
            for (let i = 0; i < embedCount; i++) {
                tagCounter++;
                if (embeds[i]) {
                    const rId = embeds[i][1];
                    const targetMatch = xmlRels.match(new RegExp(`<Relationship Id="${rId}".*?Target="([^"]+)"`));
                    if (targetMatch) {
                        const mediaPath = 'word/' + targetMatch[1];
                        const ext = path.extname(mediaPath).toLowerCase();
                        const tag = `foto_${String(tagCounter).padStart(3, '0')}`;
                        
                        try {
                            const imgData = zip.file(mediaPath).asNodeBuffer();
                            fs.writeFileSync(path.join(OUTPUT_DIR, `${tag}${ext}`), imgData);
                            saved++;
                        } catch (e) {
                            console.error(`Error extraiendo ${mediaPath}:`, e.message);
                        }
                    }
                }
            }
        }
        return parrafo;
    });
    
    console.log(`\nExtraídas ${saved} fotos reales de ${tagCounter} tags de foto encontrados.`);
}

extract();
