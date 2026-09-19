const fs = require('fs');
const path = 'components/inspections/InternasCustomForm.tsx';
let code = fs.readFileSync(path, 'utf8');

const target = `const listado = hallazgos.filter(h => h.descripcion || h.riesgo).map((h, i) => \`\${i + 1}. \${h.descripcion || 'Sin descripción'} (Nivel: \${h.riesgo || 'No definido'})\`).join('\\n');`;

const newCode = `const listado = hallazgos.filter(h => h.descripcion || h.riesgo).map((h, i) => {
            const nivel = h.riesgo || '-';
            const resp = h.responsable || '-';
            const fecha = h.fecha || '-';
            const estado = h.estado || 'Abierto';
            return \`\${i + 1}. \${h.descripcion || 'Sin descripción'} (Nivel: \${nivel} | Resp: \${resp} | Fecha: \${fecha} | Estado: \${estado})\`;
        }).join('\\n');`;

code = code.replace(target, newCode);
fs.writeFileSync(path, code);
console.log("Updated auto-sync format");
