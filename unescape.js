const fs = require('fs');
const file = 'components/inspections/InternasCustomForm.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/\\`/g, '`');
code = code.replace(/\\\$/g, '$');

fs.writeFileSync(file, code);
console.log("Unescaped backticks and dollar signs!");
