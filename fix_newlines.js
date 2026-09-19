const fs = require('fs');
let c = fs.readFileSync('components/inspections/InternasCustomForm.tsx', 'utf8');
c = c.replace(/\\n/g, '\n');
fs.writeFileSync('components/inspections/InternasCustomForm.tsx', c);
console.log('Fixed literal newlines');
