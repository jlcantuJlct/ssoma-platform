const fs = require('fs');
const PizZip = require('pizzip');
const path = require('path');

const ORIGINAL_DOC = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD-CHINCHAYSULLO ultimo.docx';
const OUTPUT_DIR = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\chinchaysullo_refs';

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

console.log("Cargando documento Chinchaysullo...");
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

let shapeCounter = 0;
let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Mapeo Chinchaysullo</title>
    <style>
        body { font-family: sans-serif; background: #111; color: white; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
        .card { background: #222; padding: 10px; border-radius: 8px; text-align: center; }
        img { max-width: 100%; height: 150px; object-fit: contain; background: #333; }
        .error { color: #f87171; font-size: 12px; }
    </style>
</head>
<body>
    <h1>Mapeo de Fotos - PAD Chinchaysullo</h1>
    <div class="grid">
`;

xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (parrafo) => {
    if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
        shapeCounter++;
        let rIdMatch = parrafo.match(/r:embed="([^"]+)"/);
        if (!rIdMatch) rIdMatch = parrafo.match(/r:id="([^"]+)"/);
        
        let fileStatus = "No hay imagen (Shape vacío)";
        let fileName = null;

        if (rIdMatch) {
            const target = rels[rIdMatch[1]];
            const ext = path.extname(target) || '.jpg';
            fileName = `shape_${String(shapeCounter).padStart(3, '0')}${ext}`;
            
            try {
                const imgData = zip.file(`word/${target}`);
                if (imgData) {
                    fs.writeFileSync(path.join(OUTPUT_DIR, fileName), imgData.asNodeBuffer());
                    fileStatus = "OK";
                }
            } catch (e) {
                fileStatus = "Error al extraer";
            }
        }
        
        html += `
        <div class="card">
            <h3>Shape ${shapeCounter}</h3>
            ${fileName && fileStatus === "OK" ? `<img src="chinchaysullo_refs/${fileName}" />` : `<div style="height:150px;display:flex;align-items:center;justify-content:center;background:#444;">${fileStatus}</div>`}
        </div>`;
    }
    return parrafo;
});

html += `
    </div>
</body>
</html>
`;

fs.writeFileSync('C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\MAPA_CHINCHAYSULLO.html', html);
console.log(`¡Mapeo generado! Se analizaron ${shapeCounter} formas.`);
