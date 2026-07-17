const fs = require('fs');
const PizZip = require('pizzip');
const INPUT = 'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual\\PAD_SAN CLEMENTE ultimo.docx';
const buf = fs.readFileSync(INPUT);
const zip = new PizZip(buf);
const relsXml = zip.file('word/_rels/document.xml.rels').asText();
const relPattern = /<Relationship Id="(rId11|rId12|rId13|rId14)"[^>]+Target="([^"]+)"/g;
let m;
while ((m = relPattern.exec(relsXml)) !== null) {
    console.log(m[1], "->", m[2]);
}
