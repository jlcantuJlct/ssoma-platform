const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');
c = c.replace(/\\n/g, '\n');
c = c.replace(/}\s*}\s*else if\s*\(isInternas\)\s*{/, '} else if (isInternas) {');
fs.writeFileSync('app/api/export-excel/route.ts', c);
