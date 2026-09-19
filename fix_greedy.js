const fs = require('fs');
const path = 'app/digital-inspections/[module]/fill/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/t\.includes\('proyecto'\)/g, "(t === 'proyecto' || t === 'proyecto:' || t === 'nombre del proyecto')");
code = code.replace(/t\.includes\('empresa'\)/g, "(t === 'empresa' || t === 'empresa:' || t.startsWith('empresa contratista') || t.startsWith('empresa subcontratista'))");
code = code.replace(/t\.includes\('ubicación'\)/g, "(t === 'ubicación' || t === 'ubicación:' || t === 'ubicación de campamento:' || t === 'ubicación de campamento')");
code = code.replace(/t\.includes\('ubicacion'\)/g, "(t === 'ubicacion' || t === 'ubicacion:' || t === 'ubicacion de campamento:' || t === 'ubicacion de campamento')");

fs.writeFileSync(path, code);
console.log("Greedy matches fixed!");
