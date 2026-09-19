const fs = require('fs');
const path = 'app/digital-inspections/[module]/fill/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const regexIsGeneral = /const isGeneralHeader = item\.type !== 'title' && \([^;]+;/;
const newIsGeneral = `const isGeneralHeader = item.type !== 'title' && (t === 'cargo' || t === 'inspector' || t === 'inspector:' || t === 'nombre y apellido' || t === 'nombre y apellido:' || t === 'proyecto' || t === 'proyecto:' || t === 'nombre del proyecto' || t === 'fecha' || t.startsWith('fecha:') || t === 'fecha actual' || t === 'fecha próxima' || t === 'fecha proxima' || isArea || t === 'empresa' || t === 'empresa:' || t.startsWith('empresa contratista') || t.startsWith('empresa subcontratista') || t === 'ubicación' || t === 'ubicación:' || t === 'ubicación de campamento:' || t === 'ubicación de campamento' || t === 'ubicacion' || t === 'ubicacion:' || t === 'ubicacion de campamento:' || t === 'ubicacion de campamento' || t === 'hora' || t === 'hora:' || t === 'turno' || t === 'turno:' || t === 'conductor' || t === 'conductor:' || t === 'placa' || t === 'placa:' || t === 'kilometraje' || t === 'kilometraje:' || t === 'código' || t === 'código:' || t === 'codigo' || t === 'codigo:' || t === 'versión' || t === 'versión:' || t === 'version' || t === 'version:' || t === 'responsable' || t === 'responsable:' || t === 'responsable de áreas' || t === 'responsable de areas' || isCheckboxField(item.text));`;

code = code.replace(regexIsGeneral, newIsGeneral);
fs.writeFileSync(path, code);
console.log("isGeneralHeader fixed!");
