const fs = require('fs');
const PizZip = require('pizzip');
const INPUT = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_SAN CLEMENTE ultimo.docx';
const buf = fs.readFileSync(INPUT);
const zip = new PizZip(buf);

const img6 = zip.file('word/media/image6.png');
if (img6) fs.writeFileSync('scratch/image6.png', img6.asNodeBuffer());
else console.log('image6.png not found');

const img7 = zip.file('word/media/image7.png');
if (img7) fs.writeFileSync('scratch/image7.png', img7.asNodeBuffer());
else console.log('image7.png not found');
