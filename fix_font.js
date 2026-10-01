const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const target = `worksheet.getCell(obsCellStart).value = observaciones;
              worksheet.getCell(obsCellStart).alignment = { wrapText: true, vertical: "top" };`;

const rep = `worksheet.getCell(obsCellStart).value = observaciones;
              worksheet.getCell(obsCellStart).alignment = { wrapText: true, vertical: "top" };
              worksheet.getCell(obsCellStart).font = { color: { argb: "FF000000" }, size: 10 };`;

c = c.replace(target, rep);
fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed font color');
