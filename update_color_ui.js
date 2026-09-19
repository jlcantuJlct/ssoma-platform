const fs = require('fs');
let code = fs.readFileSync('components/inspections/InternasCustomForm.tsx', 'utf8');

// 1. Replace the top container to add color
const targetTop = `<div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-8 uppercase tracking-tight">Inspecciones Internas SSOMA</h2>`;

const repTop = `<div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-800 to-blue-700 p-6 md:p-8 text-white mb-6">
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Inspecciones Internas SSOMA</h2>
                <p className="text-indigo-100 mt-2 text-sm">Complete el formulario digital detallado de inspecciones y hallazgos.</p>
            </div>
            <div className="p-6 md:p-8 pt-0">`;

code = code.replace(targetTop, repTop);

// 2. Add an extra closing div at the end since we added `<div className="p-6 md:p-8 pt-0">`
const targetEnd = `Generar Excel de Inspecciones Internas
                </button>
            </div>
        </div>`;

const repEnd = `Generar Excel de Inspecciones Internas
                </button>
            </div>
            </div>
        </div>`;

code = code.replace(targetEnd, repEnd);

// 3. Replace the Tipo de Inspección dropdown with pills
const targetTipo = `<select className="border border-slate-300 rounded-lg p-2" value={tipo} onChange={e => setTipo(e.target.value)}>
                        <option value="">Seleccione...</option>
                        <option value="Planeada">Planeada</option>
                        <option value="No planeada">No planeada</option>
                        <option value="Otro">Otro</option>
                    </select>`;

const repTipo = `<div className="flex gap-2 h-full items-end">
                        {['Planeada', 'No planeada', 'Otro'].map(t => (
                            <button
                                key={t}
                                onClick={() => setTipo(t)}
                                className={\`flex-1 py-2 px-1 text-[11px] sm:text-xs rounded-lg font-bold transition-all border \${tipo === t ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'}\`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>`;

code = code.replace(targetTipo, repTipo);

// 4. Colorize the Hallazgos background to a subtle blue/indigo
const targetHallazgoItem = `<div key={h.id} className="relative bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">`;
const repHallazgoItem = `<div key={h.id} className="relative bg-blue-50/50 border border-blue-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">`;

code = code.replace(targetHallazgoItem, repHallazgoItem);

fs.writeFileSync('components/inspections/InternasCustomForm.tsx', code);
console.log('UI Updated with colors and pills!');
