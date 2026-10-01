const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

c = c.replace(
    "if (offset !== null) {",
    "if (offset !== null) {\n                            console.log('Writing x to ', rowNum, colNum + offset, 'for', cleanText);"
);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Added deep logging');
