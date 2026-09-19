const fs = require('fs');
let c = fs.readFileSync('components/inspections/InternasCustomForm.tsx', 'utf8');
c = c.replace(/join\('\r?\n'\)/g, "join('\\n')");
c = c.replace(/const header = '\r?\n--- Resumen de Hallazgos ---\r?\n';/g, "const header = '\\n--- Resumen de Hallazgos ---\\n';");
fs.writeFileSync('components/inspections/InternasCustomForm.tsx', c);
console.log('Fixed syntax literals!');
