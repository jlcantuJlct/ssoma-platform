const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

c = c.replace(
    /const cleanText = text\.trim\(\);/g,
    "const cleanText = text.trim();\n                    if (cleanText === 'Llantas delanteras (*)') console.log('Found llantas!', checklist[cleanText]);"
);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Added logging');
