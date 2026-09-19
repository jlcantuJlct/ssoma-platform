const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

// The file has two `let currentPhotoRow = 53;`
// The first one is in isElectricas.
// The second one is in isCampamento.
// I will change the second one back to 65.

let startElectricas = code.indexOf('else if (isElectricas)');
let startCampamento = code.indexOf('else if (isCampamento)');

let beforeCampamento = code.substring(0, startCampamento);
let afterCampamento = code.substring(startCampamento);

afterCampamento = afterCampamento.replace(/currentPhotoRow = 53;/g, 'currentPhotoRow = 65;');
afterCampamento = afterCampamento.replace(/A53/g, 'A65');

fs.writeFileSync(path, beforeCampamento + afterCampamento);
console.log("Fixed campamento!");
