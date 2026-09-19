const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

const startLab = code.indexOf('else if (isLaboratorio)');
const endLab = code.indexOf('else if (isElectricas)');

let block = code.substring(startLab, endLab);

// Change A35 to A36 for observation text
block = block.replace(/worksheet\.getCell\('A35'\)\.value = finalObsText;/g, "worksheet.getCell('A36').value = finalObsText;");
block = block.replace(/worksheet\.getCell\('A35'\)\.font = /g, "worksheet.getCell('A36').font = ");
block = block.replace(/for \(let r = 35; r <= 40; r\+\+\)/g, "for (let r = 36; r <= 41; r++)");
block = block.replace(/worksheet\.getRow\(35\)\.height/g, "worksheet.getRow(36).height");

fs.writeFileSync(path, code.substring(0, startLab) + block + code.substring(endLab));
console.log("Fixed observations row to 36!");
