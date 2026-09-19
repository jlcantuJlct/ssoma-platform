const fs = require('fs');
const path = 'app/digital-inspections/[module]/fill/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /const keywords = \['inspector'.*?return keywords\.some\(kw => t\.includes\(kw\)\);/s;

const newCode = `const keywords = ['inspector', 'nombre y apellido', 'responsable', 'ubicación', 'ubicacion', 'observaciones', 'comentario', 'comentarios', 'razón social', 'razon social', 'domicilio', 'cargo', 'hora', 'código', 'codigo', 'versión', 'version', 'placa', 'kilometraje', 'turno'];
        return keywords.some(kw => t === kw || t === kw + ':' || t === kw + ' de campamento' || t === kw + ' de campamento:' || t === 'responsable de áreas' || t === 'responsable de areas');`;

code = code.replace(regex, newCode);
fs.writeFileSync(path, code);
console.log("Keywords fixed!");
