const fs = require('fs');
let code = fs.readFileSync('components/inspections/InternasCustomForm.tsx', 'utf8');

const target = `<div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-slate-600 uppercase">Responsable Impl.</label>
                                        <input className="border border-slate-300 rounded-lg p-1.5 text-sm" value={h.responsable} onChange={e => updateHallazgo(h.id, 'responsable', e.target.value)} />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-slate-600 uppercase">Fecha Prog.</label>
                                        <input type="date" className="border border-slate-300 rounded-lg p-1.5 text-sm" value={h.fecha} onChange={e => updateHallazgo(h.id, 'fecha', e.target.value)} />
                                    </div>
                                </div>`;

const replacement = `<div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-slate-600 uppercase">Evidencia Levantamiento</label>
                                    <div className="h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-white cursor-pointer relative overflow-hidden group" onClick={() => { const input = document.getElementById('lev_'+h.id); if(input) input.click(); }}>
                                        {h.evidenciaLevantamiento ? (
                                            <img src={h.evidenciaLevantamiento} alt="Levantamiento" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                                        ) : (
                                            <div className="text-slate-400 flex flex-col items-center gap-1 group-hover:text-green-500 transition-colors">
                                                <Camera size={24} />
                                                <span className="text-[10px] font-bold text-center">Añadir Foto<br/>Levantamiento</span>
                                            </div>
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
                                <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-slate-600 uppercase">Responsable Impl.</label>
                                        <input className="border border-slate-300 rounded-lg p-1.5 text-sm" value={h.responsable} onChange={e => updateHallazgo(h.id, 'responsable', e.target.value)} />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-slate-600 uppercase">Fecha Prog.</label>
                                        <input type="date" className="border border-slate-300 rounded-lg p-1.5 text-sm" value={h.fecha} onChange={e => updateHallazgo(h.id, 'fecha', e.target.value)} />
                                    </div>
                                </div>`;

code = code.replace(target, replacement);

fs.writeFileSync('components/inspections/InternasCustomForm.tsx', code);
console.log('Injected Evidencia Levantamiento UI!');
