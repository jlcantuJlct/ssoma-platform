const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const regex = /(else if \(isAlmacen \|\| isTalleres \|\| isCampamento\) \{\s*const meta = data\.meta \|\| data\.answers \|\| \{\};\s*const checklist = [^\n]+\n)/;
c = c.replace(regex, `$1          const firmas = data.firmas || meta.firmas || {};\n          const observaciones = data.observaciones || meta.observaciones || "";\n`);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed firmas reference in Manejador 5 using regex');
