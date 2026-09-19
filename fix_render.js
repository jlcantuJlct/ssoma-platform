const fs = require('fs');
const path = 'app/digital-inspections/[module]/fill/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Fix inspector check in renderField
code = code.replace(
    "if (item.text.toLowerCase().includes('inspector') || item.text.toLowerCase().includes('nombre y apellido')) {",
    "const _t = item.text.toLowerCase().trim();\n        if (['inspector', 'inspector:', 'nombre y apellido', 'nombre y apellido:'].includes(_t)) {"
);

// 2. Fix cargoIdx inside inspector block
code = code.replace(
    "const cargoIdx = template.findIndex(i => i.text.toLowerCase() === 'cargo' || \n(i.text.toLowerCase().includes('cargo') && !i.text.toLowerCase().includes('inspector') && !i.text.toLowerCase().includes('nombre y apellido') && !i.text.toLowerCase().includes('responsable')));",
    "const cargoIdx = template.findIndex(i => i.text.toLowerCase().trim() === 'cargo' || i.text.toLowerCase().trim() === 'cargo:');"
);
// In case the newline doesn't match perfectly, let's use regex:
code = code.replace(/const cargoIdx = template\.findIndex\(i => i\.text\.toLowerCase\(\) === 'cargo'.*?\);/s, "const cargoIdx = template.findIndex(i => i.text.toLowerCase().trim() === 'cargo' || i.text.toLowerCase().trim() === 'cargo:');");


// 3. Fix responsable check in renderField
code = code.replace(/if \(item\.text\.toLowerCase\(\)\.includes\('responsable'\) \|\| \(item\.text\.toLowerCase\(\)\.includes\('cargo'\) && !template\.some.*?\) \{/s, "if (['responsable', 'responsable:', 'responsable de áreas', 'responsable de areas'].includes(_t) || (_t === 'cargo' && !template.some(i => ['inspector', 'inspector:', 'nombre y apellido', 'nombre y apellido:'].includes(i.text.toLowerCase().trim())))) {");

// 4. Fix Signature Pad below (where it renders firma digital inside checklist/generic if)
code = code.replace(/\{ \(item\.text\.toLowerCase\(\)\.includes\('responsable'\) \|\| \(item\.text\.toLowerCase\(\)\.includes\('cargo'\) && !template\.some.*?\) && \(/s, "{ (['responsable', 'responsable:', 'responsable de áreas', 'responsable de areas'].includes(item.text.toLowerCase().trim()) || (item.text.toLowerCase().trim() === 'cargo' && !template.some(i => ['inspector', 'inspector:', 'nombre y apellido', 'nombre y apellido:'].includes(i.text.toLowerCase().trim())))) && (");


fs.writeFileSync(path, code);
console.log("Render blocks fixed!");
