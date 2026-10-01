const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

c = c.replace(
    /worksheet\.getCell\(rowNum, colNum \+ offset\)\.value = "x";/g,
    "worksheet.getCell(rowNum, colNum + offset).value = \"x\";\n                            console.log(`Writing x to ${rowNum}, ${colNum + offset} for ${cleanText} (tipo: ${tipo})`);"
);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Added log');
