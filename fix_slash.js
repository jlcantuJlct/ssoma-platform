const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/\\n/g, '\n');

fs.writeFileSync(path, code);
console.log("Fixed!");
