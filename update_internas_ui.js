const fs = require('fs');
const path = 'components/inspections/InternasCustomForm.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add Evidencia Levantamiento field to initial state
code = code.replace(
    /evidencia: '', riesgo: ''/g,
    `evidencia: '', evidenciaLevantamiento: '', riesgo: ''`
);

// 2. Add the UI for Evidencia Levantamiento
// In the current layout, the columns are:
// md:col-span-12 -> Descripcion
// md:col-span-2 -> grid with Evidencia Inicial & Nivel/Categoria
// wait, the layout has:
/*
<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
    <div>
        <label>Evidencia Inicial</label>
        ...
    </div>
    <div className="flex flex-col gap-4">
        ... Riesgo, Categoria
    </div>
</div>
...
<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
    <div>Responsable Impl</div>
    <div>Fecha Prog</div>
    <div>Estado</div>
</div>
*/
// The user wants Evidencia Levantamiento "debajo de la fecha programada, entre fecha programada y estado".
// We can change the last row layout to accommodate this.
const oldLastRow = `<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">6. Responsable Impl.</label>
                                                    <TextInputWithMic className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" value={h.responsable} onChange={(val: string) => updateHallazgo(h.id, 'responsable', val)} placeholder="Ej. Juan P." />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">7. Fecha Prog.</label>
                                                    <input type="date" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" value={h.fecha} onChange={e => updateHallazgo(h.id, 'fecha', e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">8. Estado</label>
                                                    <div className="flex gap-2">
                                                        {['Abierto', 'Cerrado'].map(st => (
                                                            <button key={st} onClick={() => updateHallazgo(h.id, 'estado', st)} className={\`flex-1 py-2 rounded text-xs font-bold transition-all border \${h.estado === st ? (st === 'Abierto' ? 'bg-red-500 text-white border-red-600 shadow-md' : 'bg-green-500 text-white border-green-600 shadow-md') : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}\`}>
                                                                {st}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>`;

const newLastRow = `<div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start">
                                                <div className="flex flex-col gap-5">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">6. Responsable Impl.</label>
                                                        <TextInputWithMic className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" value={h.responsable} onChange={(val: string) => updateHallazgo(h.id, 'responsable', val)} placeholder="Ej. Juan P." />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">7. Fecha Prog.</label>
                                                        <input type="date" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" value={h.fecha} onChange={e => updateHallazgo(h.id, 'fecha', e.target.value)} />
                                                    </div>
                                                </div>
                                                
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Evidencia de Levantamiento (Opcional)</label>
                                                    <div className="w-full h-[150px] border-2 border-dashed border-slate-300 rounded-xl overflow-hidden relative group bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => { const input = document.getElementById('lev_'+h.id); if(input) input.click(); }}>
                                                        {h.evidenciaLevantamiento ? (
                                                            <img src={h.evidenciaLevantamiento} alt="Levantamiento" className="w-full h-full object-contain group-hover:opacity-75 transition-opacity" />
                                                        ) : (
                                                            <>
                                                                <div className="bg-green-100 text-green-600 p-2 rounded-full mb-1"><Camera size={20} /></div>
                                                                <span className="text-[10px] font-bold text-slate-500">Subir Foto (Levantamiento)</span>
                                                            </>
                                                        )}
                                                        <input id={'lev_'+h.id} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => {
                                                            if (e.target.files && e.target.files[0]) {
                                                                const reader = new FileReader();
                                                                reader.onload = (event) => {
                                                                    if (event.target?.result) updateHallazgo(h.id, 'evidenciaLevantamiento', event.target.result as string);
                                                                };
                                                                reader.readAsDataURL(e.target.files[0]);
                                                            }
                                                        }} />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">8. Estado</label>
                                                    <div className="flex gap-2">
                                                        {['Abierto', 'Cerrado'].map(st => (
                                                            <button key={st} onClick={() => updateHallazgo(h.id, 'estado', st)} className={\`flex-1 py-2 rounded text-xs font-bold transition-all border \${h.estado === st ? (st === 'Abierto' ? 'bg-red-500 text-white border-red-600 shadow-md' : 'bg-green-500 text-white border-green-600 shadow-md') : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}\`}>
                                                                {st}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>`;

code = code.replace(oldLastRow, newLastRow);

// 3. Update the submit payload to auto-append the list of findings to conclusiones
const submitTarget = `const payload = {`;
const submitReplacement = `
            let conclusionesAutogeneradas = conclusiones;
            if (hallazgos.length > 0) {
                const listado = hallazgos.map((h, i) => \`\${i + 1}. \${h.descripcion || 'Sin descripción'} (Nivel: \${h.riesgo || 'No definido'})\`).join('\\n');
                conclusionesAutogeneradas = conclusiones ? conclusiones + '\\n\\nResumen de Hallazgos:\\n' + listado : 'Resumen de Hallazgos:\\n' + listado;
            }

            const payload = {`;
code = code.replace(submitTarget, submitReplacement);

// Change the mapping in payload
const answerTarget = `{ text: conclusiones }`;
const answerReplacement = `{ text: conclusionesAutogeneradas }`;
code = code.replace(answerTarget, answerReplacement);

fs.writeFileSync(path, code);
console.log("Internas UI Updated for Levantamiento & Conclusiones!");
