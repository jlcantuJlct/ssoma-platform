const fs = require('fs');
const PizZip = require('pizzip');

const ORIGINAL_DOC = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_SAN CLEMENTE ultimo.docx';

function testExtract() {
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
    
    let fotoCounter = 0;
    const map = {};
    
    xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (parrafo) => {
        if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
            fotoCounter++;
            const tagName = `foto_${String(fotoCounter).padStart(3, '0')}`;
            
            // Buscar r:embed="rIdX" o r:id="rIdX"
            let rIdMatch = parrafo.match(/r:embed="([^"]+)"/);
            if (!rIdMatch) {
                rIdMatch = parrafo.match(/r:id="([^"]+)"/);
            }
            
            if (rIdMatch) {
                const rId = rIdMatch[1];
                const target = rels[rId];
                if (target) {
                    map[tagName] = target; // e.g. media/image1.jpeg
                }
            }
        }
        return parrafo;
    });
    
    console.log(`Fotos encontradas: ${fotoCounter}`);
    console.log('Mapeo:', JSON.stringify(map, null, 2).substring(0, 500) + '...');
}

testExtract();
