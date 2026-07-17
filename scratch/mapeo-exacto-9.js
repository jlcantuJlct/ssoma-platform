const fs = require('fs');
const PizZip = require('pizzip');
const INPUT = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_SAN CLEMENTE ultimo.docx';
const buf = fs.readFileSync(INPUT);
const zip = new PizZip(buf);
const relsXml = zip.file('word/_rels/document.xml.rels').asText();
const relPattern = /<Relationship Id="rId33"[^>]+Target="([^"]+)"/g;
let m = relPattern.exec(relsXml);
if (m) console.log(m[1]);
