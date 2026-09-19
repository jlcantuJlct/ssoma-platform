const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/if \(!matchedRows\.has\(r\)\)/g, "// @ts-ignore\n                            if (!matchedRows.has(r))");
code = code.replace(/matchedRows\.add\(targetRow\);/g, "// @ts-ignore\n                        matchedRows.add(targetRow);");

fs.writeFileSync(path, code);
console.log("Fixed matchedRows");
