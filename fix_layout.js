const fs = require('fs');
let code = fs.readFileSync('components/inspections/InternasCustomForm.tsx', 'utf8');

// 1. Fix Responsables grid to give more space
const targetRespGrid = `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">`;
const repRespGrid = `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">`;
code = code.replace(targetRespGrid, repRespGrid);

// 2. Fix Hallazgos layout entirely
const targetHallazgos = `<div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-2">
                                <div className="col-span-1 md:col-span-3 flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-slate-600 uppercase">Descripción</label>
                                    <TextInputWithMic isTextArea={true} className="border border-slate-300 rounded-lg p-2 h-24 text-sm resize-none" value={h.descripcion} onChange={(val: string) => updateHallazgo(h.id, 'descripcion', val)} placeholder="Descripción de la observación..." />
                                </div>
                                <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-slate-600 uppercase">Evidencia</label>
                                    <div className="h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-white cursor-pointer relative overflow-hidden group" onClick={() => fileInputRefs.current[h.id]?.click()}>
                                        {h.evidencia ? (
                                            <img src={h.evidencia} alt="Evidencia" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                                        ) : (
                                            <div className="text-slate-400 flex flex-col items-center gap-1 group-hover:text-indigo-500 transition-colors">
                                                <Camera size={24} />
                                                <span className="text-[10px] font-bold">Añadir Foto</span>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" capture="environment" className="hidden" ref={el => { fileInputRefs.current[h.id] = el; }} onChange={e => handlePhotoUpload(e, h.id)} />
                                    </div>
                                </div>
                                <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-slate-600 uppercase">Riesgo</label>
                                        <select className={\`border border-slate-300 rounded-lg p-2 text-sm font-semibold \\\${h.riesgo === 'Bajo' ? 'bg-green-100 text-green-800' : h.riesgo === 'Medio' ? 'bg-yellow-100 text-yellow-800' : h.riesgo === 'Alto' ? 'bg-red-100 text-red-800' : 'bg-white'}\`} value={h.riesgo} onChange={e => updateHallazgo(h.id, 'riesgo', e.target.value)}>
                                            <option value="">Seleccione</option>
                                            <option value="Bajo">Bajo</option>
                                            <option value="Medio">Medio</option>
                                            <option value="Alto">Alto</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-slate-600 uppercase">Estado</label>
                                        <select className={\`border border-slate-300 rounded-lg p-2 text-sm font-semibold \\\${h.estado === 'Abierto' ? 'bg-red-100 text-red-800' : h.estado === 'Cerrado' ? 'bg-green-100 text-green-800' : 'bg-white'}\`} value={h.estado} onChange={e => updateHallazgo(h.id, 'estado', e.target.value)}>
                                            <option value="">Seleccione</option>
                                            <option value="Abierto">Abierto</option>
                                            <option value="Cerrado">Cerrado</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="col-span-1 md:col-span-3 flex flex-col gap-2">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-slate-600 uppercase">Categoría</label>
                                        <select className="border border-slate-300 rounded-lg p-2 text-sm" value={h.categoria} onChange={e => updateHallazgo(h.id, 'categoria', e.target.value)}>
                                            <option value="">Seleccione</option>
                                            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-slate-600 uppercase">Acción Correctiva</label>
                                        <TextInputWithMic isTextArea={true} className="w-full border border-slate-300 rounded-lg p-2 h-10 text-sm resize-none" value={h.accion} onChange={(val: string) => updateHallazgo(h.id, 'accion', val)} />
                                    </div>
                                </div>
                                <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
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
                                        <TextInputWithMic className="w-full border border-slate-300 rounded-lg p-1.5 text-sm" value={h.responsable} onChange={(val: string) => updateHallazgo(h.id, 'responsable', val)} />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-slate-600 uppercase">Fecha Prog.</label>
                                        <input type="date" className="border border-slate-300 rounded-lg p-1.5 text-sm" value={h.fecha} onChange={e => updateHallazgo(h.id, 'fecha', e.target.value)} />
                                    </div>
                                </div>
                            </div>`;

const repHallazgos = `<div className="flex flex-col gap-4 mt-4 pt-2">
                                {/* ROW 1: Descripción, Evidencia Inicial, Riesgo, Estado */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                                    <div className="lg:col-span-6 flex flex-col gap-1">
                                        <label className="text-xs font-bold text-slate-600 uppercase">Descripción de la Observación</label>
                                        <TextInputWithMic isTextArea={true} className="w-full border border-slate-300 rounded-lg p-3 h-24 text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none" value={h.descripcion} onChange={(val: string) => updateHallazgo(h.id, 'descripcion', val)} placeholder="Detalle exactamente lo observado..." />
                                    </div>
                                    <div className="lg:col-span-3 flex flex-col gap-1">
                                        <label className="text-xs font-bold text-slate-600 uppercase">Foto / Evidencia Inicial</label>
                                        <div className="h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-white cursor-pointer relative overflow-hidden group hover:bg-slate-50 transition-colors" onClick={() => fileInputRefs.current[h.id]?.click()}>
                                            {h.evidencia ? (
                                                <img src={h.evidencia} alt="Evidencia" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                                            ) : (
                                                <div className="text-slate-400 flex flex-col items-center gap-1 group-hover:text-indigo-500 transition-colors">
                                                    <Camera size={24} />
                                                    <span className="text-[10px] font-bold">Subir Foto</span>
                                                </div>
                                            )}
                                            <input type="file" accept="image/*" capture="environment" className="hidden" ref={el => { fileInputRefs.current[h.id] = el; }} onChange={e => handlePhotoUpload(e, h.id)} />
                                        </div>
                                    </div>
                                    <div className="lg:col-span-3 flex flex-col gap-3">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold text-slate-600 uppercase">Riesgo</label>
                                            <select className={\`w-full border border-slate-300 rounded-lg p-2 text-sm font-bold \\\${h.riesgo === 'Bajo' ? 'bg-green-100 text-green-800 border-green-300' : h.riesgo === 'Medio' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : h.riesgo === 'Alto' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-white focus:ring-2 focus:ring-indigo-500'}\`} value={h.riesgo} onChange={e => updateHallazgo(h.id, 'riesgo', e.target.value)}>
                                                <option value="">Seleccione</option>
                                                <option value="Bajo">Bajo</option>
                                                <option value="Medio">Medio</option>
                                                <option value="Alto">Alto</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold text-slate-600 uppercase">Estado</label>
                                            <select className={\`w-full border border-slate-300 rounded-lg p-2 text-sm font-bold \\\${h.estado === 'Abierto' ? 'bg-red-100 text-red-800 border-red-300' : h.estado === 'Cerrado' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-white focus:ring-2 focus:ring-indigo-500'}\`} value={h.estado} onChange={e => updateHallazgo(h.id, 'estado', e.target.value)}>
                                                <option value="">Seleccione</option>
                                                <option value="Abierto">Abierto</option>
                                                <option value="Cerrado">Cerrado</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* ROW 2: Categoría, Acción Correctiva */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-slate-600 uppercase">Categoría</label>
                                        <select className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={h.categoria} onChange={e => updateHallazgo(h.id, 'categoria', e.target.value)}>
                                            <option value="">Seleccione</option>
                                            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-slate-600 uppercase">Acción Correctiva</label>
                                        <TextInputWithMic isTextArea={true} className="w-full border border-slate-300 rounded-lg p-2.5 h-[42px] text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none" value={h.accion} onChange={(val: string) => updateHallazgo(h.id, 'accion', val)} />
                                    </div>
                                </div>

                                {/* ROW 3: Responsable, Fecha, Evidencia Levantamiento */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-inner">
                                    <div className="lg:col-span-5 flex flex-col gap-1">
                                        <label className="text-xs font-bold text-slate-600 uppercase">Responsable Impl.</label>
                                        <TextInputWithMic className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={h.responsable} onChange={(val: string) => updateHallazgo(h.id, 'responsable', val)} />
                                    </div>
                                    <div className="lg:col-span-4 flex flex-col gap-1">
                                        <label className="text-xs font-bold text-slate-600 uppercase">Fecha Prog.</label>
                                        <input type="date" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={h.fecha} onChange={e => updateHallazgo(h.id, 'fecha', e.target.value)} />
                                    </div>
                                    <div className="lg:col-span-3 flex flex-col gap-1">
                                        <label className="text-xs font-bold text-green-700 uppercase">Evidencia Levantamiento</label>
                                        <div className="h-20 border-2 border-dashed border-green-300 rounded-lg flex items-center justify-center bg-green-50/30 cursor-pointer relative overflow-hidden group hover:bg-green-50 transition-colors" onClick={() => { const input = document.getElementById('lev_'+h.id); if(input) input.click(); }}>
                                            {h.evidenciaLevantamiento ? (
                                                <img src={h.evidenciaLevantamiento} alt="Levantamiento" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                                            ) : (
                                                <div className="text-green-600 flex flex-col items-center gap-1 group-hover:text-green-800 transition-colors">
                                                    <Camera size={20} />
                                                    <span className="text-[10px] font-bold text-center leading-tight">Foto<br/>Cierre</span>
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
                                </div>
                            </div>`;

code = code.replace(targetHallazgos, repHallazgos);
fs.writeFileSync('components/inspections/InternasCustomForm.tsx', code);
console.log('Fixed Form Layout!');
