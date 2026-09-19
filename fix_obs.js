const fs = require('fs');
const path = 'app/digital-inspections/[module]/fill/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// I will just add the condition right before `const keywords =`
const regex = /const keywords = \['inspector'/;
const newCode = `if (t.includes('observaciones') || t.includes('comentario') || t === 'comentarios u observaciones adicionales') return true;\n        const keywords = ['inspector'`;

code = code.replace(regex, newCode);
fs.writeFileSync(path, code);
console.log("Metadata field for observaciones fixed!");
