const fs = require('fs');
const PizZip = require('pizzip');

try {
    const templatePath = 'plantillas/PAD_CHINCHAYSULLO_PLANTILLA.docx';
    const buffer = fs.readFileSync(templatePath);
    const zip = new PizZip(buffer);
    let xml = zip.file('word/document.xml').asText();
    
    // Check for month/year string formats
    console.log("Has MAYO 2026? ", /MAYO[\s\u00A0]*202[0-9]/gi.test(xml));
    console.log("Has mes año? ", /mes[\s\u00A0]*año/gi.test(xml));
    console.log("Has {mes_anio}? ", xml.includes('{mes_anio}'));

    let textSnippets = xml.match(/(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)[\s\u00A0]*202[0-9]/gi);
    console.log("Matches found:", textSnippets);
    
    const drawingMatches = xml.match(/<w:drawing[ >]/g);
    const shapeMatches = xml.match(/<v:shape[ >]/g);
    const picMatches = xml.match(/pic:pic[ >]/g);
    
    console.log("Total <w:drawing>: ", drawingMatches ? drawingMatches.length : 0);
    console.log("Total <v:shape>: ", shapeMatches ? shapeMatches.length : 0);
    console.log("Total pic:pic: ", picMatches ? picMatches.length : 0);
    
} catch (e) {
    console.error(e);
}
