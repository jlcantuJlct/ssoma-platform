const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/\\}\\s*\\}\\s*else if \\(isInternas\\) \\{/, '} else if (isInternas) {');

fs.writeFileSync(path, code);
console.log("Regex syntax fixed!");
