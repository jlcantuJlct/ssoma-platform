const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

// The Campamento block uses H10, H11, H12. We need to change it to A10, A11, A12.
// Let's replace 'H10' with 'A10', 'H11' with 'A11', and 'H12' with 'A12' 
// BUT only in the block that has H10.

const regexH10 = /worksheet\.getCell\('H10'\)/g;
const regexH11 = /worksheet\.getCell\('H11'\)/g;
const regexH12 = /worksheet\.getCell\('H12'\)/g;

code = code.replace(regexH10, "worksheet.getCell('A10')");
code = code.replace(regexH11, "worksheet.getCell('A11')");
code = code.replace(regexH12, "worksheet.getCell('A12')");

fs.writeFileSync(path, code);
console.log("Checkboxes patched to A10, A11, A12!");
