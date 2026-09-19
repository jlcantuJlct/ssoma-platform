const fs = require('fs');
const path = 'components/inspections/InternasCustomForm.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Ensure List is imported
if (!code.includes('List, ')) {
    code = code.replace('FileText,', 'FileText, List,');
}

// 2. Insert the generarResumen function before the return
const targetFunc = `const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, id: number) => {`;
const newFunc = `
    const generarResumen = () => {
        if (hallazgos.length === 0) return alert('No hay hallazgos registrados aún.');
        const listado = hallazgos.map((h, i) => \`\${i + 1}. \${h.descripcion || 'Sin descripción'} (Nivel: \${h.riesgo || 'No definido'})\`).join('\\n');
        const header = '\\n--- Resumen de Hallazgos ---\\n';
        
        if (conclusiones.includes('--- Resumen de Hallazgos ---')) {
            const parts = conclusiones.split('--- Resumen de Hallazgos ---');
            setConclusiones(parts[0].trim() + header + listado);
        } else {
            setConclusiones(conclusiones ? conclusiones.trim() + '\\n' + header + listado : '--- Resumen de Hallazgos ---\\n' + listado);
        }
    };
    
    ` + targetFunc;

if (!code.includes('const generarResumen = () => {')) {
    code = code.replace(targetFunc, newFunc);
}

// 3. Add the button to the UI
const targetUI = `<div className="flex items-center gap-2 text-indigo-900 font-bold mb-4 border-b pb-2">
                            <FileText size={20} />
                            <h3 className="text-lg">Conclusiones y Recomendaciones</h3>
                        </div>`;
const newUI = `<div className="flex items-center gap-2 text-indigo-900 font-bold mb-4 border-b pb-2">
                            <FileText size={20} />
                            <h3 className="text-lg">Conclusiones y Recomendaciones</h3>
                            <button onClick={generarResumen} className="ml-auto flex items-center gap-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg text-sm transition-colors">
                                <List size={16} /> Auto-completar Hallazgos
                            </button>
                        </div>`;
                        
code = code.replace(targetUI, newUI);

fs.writeFileSync(path, code);
console.log("Updated UI for conclusions list!");
