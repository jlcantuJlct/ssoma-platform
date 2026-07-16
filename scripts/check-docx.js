const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

function checkDoc(name, path) {
    try {
        const content = fs.readFileSync(path);
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });
        console.log(`✅ ${name} is valid according to docxtemplater.`);
    } catch (e) {
        console.log(`❌ ${name} is INVALID! Error:`, e.message);
    }
}

checkDoc('Chinchaysullo', 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_CHINCHAYSULLO_PLANTILLA.docx');
checkDoc('Jahuay', 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_JAHUAY_PLANTILLA.docx');
checkDoc('Barandas', 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_BARANDAS_PLANTILLA.docx');
