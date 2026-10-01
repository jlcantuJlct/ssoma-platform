const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

c = c.replace(
    /for\(let r=47; r<=51; r\+\+\) \{ try \{ worksheet\.unMergeCells\("A"\+r\+":M"\+r\); \} catch\(e\)\{\} \}\n                      worksheet\.getCell\("A47"\)\.value = observaciones;\n                      worksheet\.getCell\("A47"\)\.font = \{ color: \{ argb: 'FF000000' \} \};\n                      /m,
    ''
);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Cleaned up duplicate observation write');
