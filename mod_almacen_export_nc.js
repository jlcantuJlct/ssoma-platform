const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const target1 = `else if (val === 'X') offset = 11; // L`;
const rep1 = `else if (val === 'NC' || val === 'X') offset = 11; // L`;
c = c.replace(target1, rep1);

const target2 = `else if (val === 'X') worksheet.getCell(rowNum, 12).value = "x";`;
const rep2 = `else if (val === 'NC' || val === 'X') worksheet.getCell(rowNum, 12).value = "x";`;
c = c.replace(target2, rep2);

const target3 = `const badItemsKeys = Object.keys(checklist).filter(k => ['X'].includes(checklist[k]));`;
const rep3 = `const badItemsKeys = Object.keys(checklist).filter(k => ['NC', 'X'].includes(checklist[k]));`;
c = c.replace(target3, rep3);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Replaced X with NC in export logic');
