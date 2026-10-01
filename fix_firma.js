const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const target1 = `worksheet.addImage(imageId, { tl: { col: 10, row: 5 }, ext: { width: 140, height: 40 } }); // K6`;
const rep1 = `let inspRow = isCampamento ? 6 : 5; // row 6 is Excel Row 7
                      worksheet.addImage(imageId, { tl: { col: 10, row: inspRow }, ext: { width: 140, height: 40 } }); // K6 or K7`;

c = c.replace(target1, rep1);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Fixed inspector firma row for Campamento');
