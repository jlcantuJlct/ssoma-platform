const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const sharp = require('sharp');

async function compressDocx(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`Archivo no encontrado: ${filePath}`);
        return;
    }
    console.log(`\n======================================`);
    console.log(`Comprimiendo: ${filePath}`);
    const data = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(data);
    
    const filesToCompress = [];
    zip.forEach((relativePath, file) => {
        if (relativePath.startsWith('word/media/') && (relativePath.endsWith('.jpeg') || relativePath.endsWith('.jpg') || relativePath.endsWith('.png'))) {
            filesToCompress.push({ relativePath, file });
        }
    });
    
    let compressedCount = 0;
    for (const { relativePath, file } of filesToCompress) {
        const imgData = await file.async('nodebuffer');
        if (imgData.length > 300 * 1024) { // Compress images larger than 300KB
            try {
                const compressed = await sharp(imgData)
                    .resize({ width: 800, withoutEnlargement: true })
                    .jpeg({ quality: 65 })
                    .toBuffer();
                zip.file(relativePath, compressed);
                compressedCount++;
            } catch (e) {
                console.error(`Error comprimiendo ${relativePath}:`, e.message);
            }
        }
    }
    
    console.log(`Se comprimieron ${compressedCount} imágenes.`);
    const newContent = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    fs.writeFileSync(filePath, newContent);
    console.log(`Guardado exitosamente: ${filePath}`);
}

async function run() {
    await compressDocx(path.join(__dirname, 'plantillas', 'PAD_CHINCHAYSULLO_PLANTILLA.docx'));
    await compressDocx(path.join(__dirname, 'plantillas', 'PAD_SAN_CLEMENTE_PLANTILLA.docx'));
    await compressDocx(path.join(__dirname, 'plantillas', 'PAD_SAN CLEMENTE  GUIA .docx'));
    await compressDocx(path.join(__dirname, 'plantillas', 'MP Barandas Mayo .docx'));
    await compressDocx(path.join(__dirname, 'plantillas', 'MP6 _ultimo.docx'));
    await compressDocx(path.join(__dirname, 'plantillas', 'PAD_BARANDAS_PLANTILLA.docx'));
    await compressDocx(path.join(__dirname, 'plantillas', 'PAD_SAN CLEMENTE ultimo.docx'));
}

run().catch(console.error);
