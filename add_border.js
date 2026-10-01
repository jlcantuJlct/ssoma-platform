const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

c = c.replace(
    /worksheet\.getCell\(obsCellStart\)\.font = \{ name: "Arial", size: 10, color: \{ argb: "FF000000" \} \};/g,
    `worksheet.getCell(obsCellStart).font = { name: "Arial", size: 10, color: { argb: "FF000000" } };
              worksheet.getCell(obsCellStart).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };`
);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Added border to observation cell');
