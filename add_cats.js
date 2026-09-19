const fs = require('fs');
let c = fs.readFileSync('components/inspections/InternasCustomForm.tsx', 'utf8');
if(!c.includes('const CATEGORIAS')) {
    c = c.replace('const TextInputWithMic', 'const CATEGORIAS = ["Actos Subestándares", "Condiciones Subestándares"];\nconst TextInputWithMic');
    fs.writeFileSync('components/inspections/InternasCustomForm.tsx', c);
    console.log('Added CATEGORIAS');
}
