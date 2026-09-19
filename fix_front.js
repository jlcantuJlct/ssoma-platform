const fs = require('fs');
let code = fs.readFileSync('components/inspections/InternasCustomForm.tsx', 'utf8');
code = code.replace(/\\\$/g, '$');
fs.writeFileSync('components/inspections/InternasCustomForm.tsx', code);
console.log("Fixed!");
