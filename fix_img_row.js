const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

c = c.replace(
    /else if \(isInstalacionesElectricas\) currentImgRow = 53;/g,
    'else if (isInstalacionesElectricas) currentImgRow = 54;'
);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed currentImgRow to 54');
