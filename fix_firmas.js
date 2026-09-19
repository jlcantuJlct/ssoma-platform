const fs = require('fs');
const path = 'app/digital-inspections/[module]/fill/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const regexFirmasCond = /\(template\.some\(i => i\.text\.toLowerCase\(\)\.includes\('inspector'\) \|\| i\.text\.toLowerCase\(\)\.includes\('nombre y apellido'\)\) \|\| template\.some\(i => i\.text\.toLowerCase\(\)\.includes\('responsable'\)\)\)/g;
const newFirmasCond = `(template.some(i => ['inspector', 'inspector:', 'nombre y apellido', 'nombre y apellido:'].includes(i.text.toLowerCase().trim())) || template.some(i => ['responsable', 'responsable:', 'responsable de áreas', 'responsable de areas'].includes(i.text.toLowerCase().trim())))`;

code = code.replace(regexFirmasCond, newFirmasCond);

const regexFirmasItem = /if \(!t\.includes\('inspector'\) && !t\.includes\('nombre y apellido'\) && !t\.includes\('responsable'\) && !\(t\.includes\('cargo'\) && !template\.some\(i => i\.text\.toLowerCase\(\)\.includes\('inspector'\) \|\| i\.text\.toLowerCase\(\)\.includes\('nombre y apellido'\)\)\)\) return null;/g;
const newFirmasItem = `if (!['inspector', 'inspector:', 'nombre y apellido', 'nombre y apellido:'].includes(t) && !['responsable', 'responsable:', 'responsable de áreas', 'responsable de areas'].includes(t) && !(t === 'cargo' && !template.some(i => ['inspector', 'inspector:', 'nombre y apellido', 'nombre y apellido:'].includes(i.text.toLowerCase().trim())))) return null;`;

code = code.replace(regexFirmasItem, newFirmasItem);

fs.writeFileSync(path, code);
console.log("Firmas block fixed!");
