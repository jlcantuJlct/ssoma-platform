const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const target = `        if (data.evidenciaLevantamiento) {
          let levPhotoRow = sigRow + 3;`;
const rep = `        if (data.evidenciaLevantamiento) {
          let levPhotoRow = (typeof sigRow !== 'undefined' ? sigRow : r) + 3;`;
c = c.replace(target, rep);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed sigRow TS error');
