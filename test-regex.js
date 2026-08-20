const fs = require('fs');
const PizZip = require('pizzip');

const docPath = 'plantillas/MP6 _ultimo.docx';
const content = fs.readFileSync(docPath);
const zip = new PizZip(content);
let xmlStr = zip.file('word/document.xml').asText();

const regexSuper = /(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)(?:<[^>]+>|[\s\u00A0oO]|del|al)*2(?:<[^>]+>)*0(?:<[^>]+>)*2(?:<[^>]+>)*[0-9]/gi;

let matches = xmlStr.match(regexSuper);
console.log("Matches with SUPER AGGRESSIVE regex:", matches ? matches.length : 0);

// Does it replace the cover page?
let newXmlStr = xmlStr.replace(regexSuper, '{mes_anio}');
let text = newXmlStr.replace(/<[^>]+>/g, '');

let idx = text.indexOf('Junio');
if (idx !== -1) {
    let snippet = text.substring(idx, idx + 40);
    console.log("Found 'Junio' in text:", snippet);
} else {
    console.log("NO 'Junio' FOUND IN TEXT! SUCCESS!");
}
