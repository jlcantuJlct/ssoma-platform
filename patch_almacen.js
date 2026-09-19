const fs = require('fs');
let code = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

// Patch Almacen planificada logic
code = code.replace(
    /if \(isPlanificada !== -1 && answers\[isPlanificada\]\?\.text === 'X'\) \{\s*worksheet\.getCell\('A10'\)\.value = 'X';/g,
    "if (isPlanificada !== -1 && (answers[isPlanificada]?.text === 'X' || answers[isPlanificada]?.text === 'true' || answers[isPlanificada]?.text === true)) {\n                    worksheet.getCell('A10').value = 'X';"
);
code = code.replace(
    /if \(isNoPlanificada !== -1 && answers\[isNoPlanificada\]\?\.text === 'X'\) \{\s*worksheet\.getCell\('A11'\)\.value = 'X';/g,
    "if (isNoPlanificada !== -1 && (answers[isNoPlanificada]?.text === 'X' || answers[isNoPlanificada]?.text === 'true' || answers[isNoPlanificada]?.text === true)) {\n                    worksheet.getCell('A11').value = 'X';"
);
code = code.replace(
    /if \(isOtro !== -1 && answers\[isOtro\]\?\.text === 'X'\) \{\s*worksheet\.getCell\('A12'\)\.value = 'X';/g,
    "if (isOtro !== -1 && (answers[isOtro]?.text === 'X' || answers[isOtro]?.text === 'true' || answers[isOtro]?.text === true)) {\n                    worksheet.getCell('A12').value = 'X';"
);

// Also patch Almacen matrix
code = code.replace(
    /if \(status === 'C'\) worksheet\.getCell\(`K\$\{targetRow\}`\)\.value = 'X';/g,
    "if (status === 'C' || status === 'X' || status === 'true' || status === true) worksheet.getCell(`K${targetRow}`).value = 'X';"
);
code = code.replace(
    /else if \(status === 'NC'\) worksheet\.getCell\(`L\$\{targetRow\}`\)\.value = 'X';/g,
    "else if (status === 'NC' || status === 'false' || status === false) worksheet.getCell(`L${targetRow}`).value = 'X';"
);


fs.writeFileSync('app/api/export-excel/route.ts', code);
console.log('Patched Almacen logic too');
