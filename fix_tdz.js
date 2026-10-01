const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

c = c.replace(
    /\/\/ Observaciones\s*const observaciones = data\.observaciones \|\| meta\.observaciones \|\| "";/,
    '// Observaciones (ya declarada arriba)'
);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed TDZ bug');
