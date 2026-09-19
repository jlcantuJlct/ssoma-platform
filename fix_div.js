const fs = require('fs');
let code = fs.readFileSync('components/inspections/InternasCustomForm.tsx', 'utf8');

const targetTop = `<div className="max-w-6xl mx-auto p-4 md:p-6 bg-white rounded-2xl shadow-xl mt-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{moduleName.toUpperCase()}</h2>`;

const repTop = `<div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden mt-6">
            <div className="bg-gradient-to-r from-indigo-800 to-blue-700 p-6 md:p-8 text-white mb-6">
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">{moduleName.toUpperCase()}</h2>
                <p className="text-indigo-100 mt-2 text-sm">Complete el formulario digital detallado de inspecciones y hallazgos.</p>
            </div>
            <div className="p-4 md:p-6 pt-0">`;

code = code.replace(targetTop, repTop);
fs.writeFileSync('components/inspections/InternasCustomForm.tsx', code);
console.log('Fixed top div');
