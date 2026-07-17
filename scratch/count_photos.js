const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const docxPath = path.join(process.cwd(), 'plantillas', 'PAD_SAN CLEMENTE ultimo.docx');
const zip = new AdmZip(docxPath);
const xmlString = zip.readAsText('word/document.xml');

// Contar todos los párrafos que tienen una imagen adentro
let shapeCounter = 0;
let realPhotoCounter = 0;
const ignored = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 72]; // Ignores actuales para San Clemente

const regex = /<w:p[ >][\s\S]*?<\/w:p>/g;
let match;
while ((match = regex.exec(xmlString)) !== null) {
    const parrafo = match[0];
    if (parrafo.includes('<w:drawing') || parrafo.includes('<v:shape') || parrafo.includes('pic:pic')) {
        shapeCounter++;
        if (!ignored.includes(shapeCounter)) {
            // Contamos los embed reales adentro (esto es lo que hace la ruta ahora)
            const embedRegex = /(r:embed|r:id)="([^"]+)"/g;
            let embedMatch;
            while ((embedMatch = embedRegex.exec(parrafo)) !== null) {
                realPhotoCounter++;
            }
        }
    }
}

console.log("TOTAL SHAPES (Incluyendo ignorados):", shapeCounter);
console.log("TOTAL FOTOS REALES ENCONTRADAS:", realPhotoCounter);
