const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

c = c.replace(
    /worksheet\.getCell\(obsCellStart\)\.alignment = \{ wrapText: true, vertical: "top" \};/g,
    'worksheet.getCell(obsCellStart).alignment = { wrapText: true, vertical: "top" };\n            worksheet.getCell(obsCellStart).font = { name: "Arial", size: 10, color: { argb: "FF000000" } };'
);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed font correctly');
