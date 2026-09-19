const fs = require('fs');
const path = 'components/inspections/InternasCustomForm.tsx';
let code = fs.readFileSync(path, 'utf8');

const target = `let conclusionesAutogeneradas = conclusiones;
            if (hallazgos.length > 0) {
                const listado = hallazgos.map((h, i) => \`\${i + 1}. \${h.descripcion || 'Sin descripción'} (Nivel: \${h.riesgo || 'No definido'})\`).join('\\n');
                conclusionesAutogeneradas = conclusiones ? conclusiones + '\\n\\nResumen de Hallazgos:\\n' + listado : 'Resumen de Hallazgos:\\n' + listado;
            }`;
code = code.replace(target, '');
code = code.replace(/{ text: conclusionesAutogeneradas }/g, '{ text: conclusiones }');

fs.writeFileSync(path, code);
console.log("Removed hidden auto-append");
