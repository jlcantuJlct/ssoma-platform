const fs = require('fs');
let code = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

// Patch planificada logic for Talleres
code = code.replace(
    /if \(isPlanificada !== -1 && answers\[isPlanificada\]\?\.text === 'X'\) { worksheet\.getCell\('A10'\)\.value = 'X'; worksheet\.getCell\('A10'\)\.alignment = { horizontal: 'center', vertical: 'middle' }; }/g,
    "if (isPlanificada !== -1 && (answers[isPlanificada]?.text === 'X' || answers[isPlanificada]?.text === 'true' || answers[isPlanificada]?.text === true)) { worksheet.getCell('A10').value = 'X'; worksheet.getCell('A10').alignment = { horizontal: 'center', vertical: 'middle' }; }"
);
code = code.replace(
    /if \(isNoPlanificada !== -1 && answers\[isNoPlanificada\]\?\.text === 'X'\) { worksheet\.getCell\('A11'\)\.value = 'X'; worksheet\.getCell\('A11'\)\.alignment = { horizontal: 'center', vertical: 'middle' }; }/g,
    "if (isNoPlanificada !== -1 && (answers[isNoPlanificada]?.text === 'X' || answers[isNoPlanificada]?.text === 'true' || answers[isNoPlanificada]?.text === true)) { worksheet.getCell('A11').value = 'X'; worksheet.getCell('A11').alignment = { horizontal: 'center', vertical: 'middle' }; }"
);
code = code.replace(
    /if \(isOtro !== -1 && answers\[isOtro\]\?\.text === 'X'\) { worksheet\.getCell\('A12'\)\.value = 'X'; worksheet\.getCell\('A12'\)\.alignment = { horizontal: 'center', vertical: 'middle' }; }/g,
    "if (isOtro !== -1 && (answers[isOtro]?.text === 'X' || answers[isOtro]?.text === 'true' || answers[isOtro]?.text === true)) { worksheet.getCell('A12').value = 'X'; worksheet.getCell('A12').alignment = { horizontal: 'center', vertical: 'middle' }; }"
);

// Patch item status logic
code = code.replace(
    /if \(status === 'C'\) worksheet\.getCell\(`K\$\{targetRow\}`\)\.value = 'X';/g,
    "if (status === 'C' || status === 'X' || status === 'true' || status === true) worksheet.getCell(`K${targetRow}`).value = 'X';"
);
code = code.replace(
    /else if \(status === 'NC'\) worksheet\.getCell\(`L\$\{targetRow\}`\)\.value = 'X';/g,
    "else if (status === 'NC' || status === 'false' || status === false) worksheet.getCell(`L${targetRow}`).value = 'X';"
);

fs.writeFileSync('app/api/export-excel/route.ts', code);
console.log('Patched export logic');
