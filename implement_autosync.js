const fs = require('fs');
const path = 'components/inspections/InternasCustomForm.tsx';
let code = fs.readFileSync(path, 'utf8');

// Ensure useEffect is imported
if (!code.includes('useEffect')) {
    code = code.replace(/import React, \{ useState, useRef \}/, 'import React, { useState, useRef, useEffect }');
}

// Remove the button
const buttonTarget = `<button onClick={generarResumen} className="ml-auto flex items-center gap-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg text-sm transition-colors">
                                <List size={16} /> Auto-completar Hallazgos
                            </button>`;
code = code.replace(buttonTarget, '');

// Replace generarResumen with useEffect
const funcTargetRegex = /const generarResumen = \(\) => \{[\s\S]*?\};\s*/;
const effectCode = `
    useEffect(() => {
        if (hallazgos.length === 0) return;
        const listado = hallazgos.filter(h => h.descripcion || h.riesgo).map((h, i) => \`\${i + 1}. \${h.descripcion || 'Sin descripción'} (Nivel: \${h.riesgo || 'No definido'})\`).join('\\n');
        if (!listado) return;
        
        const header = '\\n--- Resumen de Hallazgos ---\\n';
        setConclusiones(prev => {
            if (prev.includes('--- Resumen de Hallazgos ---')) {
                const parts = prev.split('--- Resumen de Hallazgos ---');
                return parts[0].trim() + header + listado;
            } else {
                return prev ? prev.trim() + header + listado : header.trimStart() + listado;
            }
        });
    }, [hallazgos]);
`;
code = code.replace(funcTargetRegex, effectCode);

fs.writeFileSync(path, code);
console.log("Auto-sync useEffect implemented!");
