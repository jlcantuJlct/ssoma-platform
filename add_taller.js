const fs = require('fs');
let code = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');
code = code.replace("const isAlmacen = normName.includes('almacen');", "const isAlmacen = normName.includes('almacen');\n        const isTalleres = normName.includes('taller');");
fs.writeFileSync('app/api/export-excel/route.ts', code);
console.log('Added isTalleres');
