const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

// For Campamento, force font color to black for A57:
// `worksheet.getCell('A57').value = finalObsText;` -> add font setting
const oldCampamentoObs = /worksheet\.getCell\('A57'\)\.value = finalObsText;/g;
const newCampamentoObs = `worksheet.getCell('A57').value = finalObsText;\n                    worksheet.getCell('A57').font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };`;
code = code.replace(oldCampamentoObs, newCampamentoObs);

// Do the same for Talleres (A39):
const oldTalleresObs = /worksheet\.getCell\('A39'\)\.value = finalObsText;/g;
const newTalleresObs = `worksheet.getCell('A39').value = finalObsText;\n                    worksheet.getCell('A39').font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };`;
code = code.replace(oldTalleresObs, newTalleresObs);

fs.writeFileSync(path, code);
console.log("Forced observation font color to black!");
