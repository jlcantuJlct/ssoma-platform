const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

// For Talleres:
// `worksheet.getRow(39).height = requiredHeight - 75;`
// Let's replace the whole height logic to always set the height.
const oldTalleresHeight = /const requiredHeight = lineCount \* 18;\s+if \(requiredHeight > 90\) \{\s+worksheet\.getRow\(39\)\.height = requiredHeight - 75;\s+\}/g;
const newTalleresHeight = `worksheet.getRow(39).height = Math.max(90, lineCount * 18);`;
code = code.replace(oldTalleresHeight, newTalleresHeight);

// For Campamento:
const oldCampamentoHeight = /const requiredHeight = lineCount \* 18;\s+if \(requiredHeight > 90\) \{\s+worksheet\.getRow\(57\)\.height = requiredHeight - 75;\s+\}/g;
const newCampamentoHeight = `worksheet.getRow(57).height = Math.max(90, lineCount * 18);`;
code = code.replace(oldCampamentoHeight, newCampamentoHeight);

fs.writeFileSync(path, code);
console.log("Fixed row heights for observations!");
