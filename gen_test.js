const fs = require('fs');
let c = fs.readFileSync('test_export.js', 'utf8');
const img = 'data:image/png;base64,' + fs.readFileSync('public/templates/digital/official_casa_logo.png', 'base64');
c = c.replace('"[]"', 'JSON.stringify([{id:1, descripcion:"Test", riesgo:"Alto", estado:"Abierto", evidencia: "' + img + '", evidenciaLevantamiento: "' + img + '"}])');
fs.writeFileSync('test_export_img.js', c);
console.log("Ready");
