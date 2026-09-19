const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

c = c.replace(/const isMachinery = ([^;]+);/, `const isMachinery = $1;\n        const isInternas = normName.includes('interna') && normName.includes('ssoma');`);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Added isInternas declaration!');
