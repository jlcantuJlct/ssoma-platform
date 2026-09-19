const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/if \(!matchedRows\.has\(r\)/g, "if (typeof matchedRows !== 'undefined' && !matchedRows.has(r)");

fs.writeFileSync(path, code);
console.log("Fixed matchedRows");
