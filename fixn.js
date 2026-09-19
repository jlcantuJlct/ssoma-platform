const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');
c = c.replace(/const isInternas = normName/g, 'const normName = (moduleName || "").toLowerCase().trim();\n        const isInternas = normName');
fs.writeFileSync('app/api/export-excel/route.ts', c);
