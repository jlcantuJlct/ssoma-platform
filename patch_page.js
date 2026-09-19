const fs = require('fs');
const path = 'app/digital-inspections/[module]/fill/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// The pattern usually is `'responsable de áreas', 'responsable de areas'`
// Let's replace it with `'responsable de áreas', 'responsable de areas', 'responsable de área', 'responsable de área:', 'responsable de area', 'responsable de area:'`

const oldResp = /'responsable de áreas', 'responsable de areas'/g;
const newResp = `'responsable de áreas', 'responsable de areas', 'responsable de área', 'responsable de área:', 'responsable de area', 'responsable de area:'`;
code = code.replace(oldResp, newResp);

// Also check if `isGeneralHeader` string has it:
// `t === 'responsable de áreas' || t === 'responsable de areas'`
const oldGenHeader = /t === 'responsable de áreas' \|\| t === 'responsable de areas'/g;
const newGenHeader = `t === 'responsable de áreas' || t === 'responsable de areas' || t === 'responsable de área' || t === 'responsable de área:' || t === 'responsable de area' || t === 'responsable de area:'`;
code = code.replace(oldGenHeader, newGenHeader);

fs.writeFileSync(path, code);
console.log("Patched page.tsx responsable checks!");
