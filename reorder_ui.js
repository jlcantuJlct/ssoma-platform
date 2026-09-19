const fs = require('fs');
const path = 'components/inspections/InternasCustomForm.tsx';
let code = fs.readFileSync(path, 'utf8');

const newAccordionBody = `
                                    {/* ACCORDION BODY */}
                                    {h.expanded && (
                                        <div className="p-4 border-t border-indigo-100 bg-white flex flex-col gap-5">
                                            
                                            {/* 1. Descripción */}
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">1. Descripción del Hallazgo</label>
                                                <textarea className="w-full border border-slate-300 rounded-lg p-3 text-sm min-h-[60px] outline-none focus:border-indigo-500" value={h.descripcion} onChange={e => updateHallazgo(h.id, 'descripcion', e.target.value)} placeholder="Describa a detalle lo que se observó..." />
                                            </div>

                                            {/* 2. Evidencia & 3. Nivel de Riesgo */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">2. Evidencia Inicial (Foto)</label>
                                                    <div className="w-full h-[120px] border-2 border-dashed border-slate-300 rounded-xl overflow-hidden relative group bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => fileInputRefs.current[h.id]?.click()}>
                                                        {h.evidencia ? (
                                                            <img src={h.evidencia} alt="Evidencia" className="w-full h-full object-contain group-hover:opacity-75 transition-opacity" />
                                                        ) : (
                                                            <>
                                                                <div className="bg-indigo-100 text-indigo-600 p-2 rounded-full mb-1"><Camera size={20} /></div>
                                                                <span className="text-[10px] font-bold text-slate-500">Subir Fotografía 5x5</span>
                                                            </>
                                                        )}
                                                        <input type="file" accept="image/*" capture="environment" className="hidden" ref={el => { fileInputRefs.current[h.id] = el; }} onChange={e => handlePhotoUpload(e, h.id)} />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">3. Nivel de Riesgo</label>
                                                        <div className="flex gap-2">
                                                            {['Bajo', 'Medio', 'Alto'].map(r => (
                                                                <button key={r} onClick={() => updateHallazgo(h.id, 'riesgo', r)} className={\`flex-1 py-2 rounded text-xs font-bold transition-all border \${h.riesgo === r ? (r === 'Bajo' ? 'bg-green-500 text-white border-green-600 shadow-md' : r === 'Medio' ? 'bg-yellow-500 text-white border-yellow-600 shadow-md' : 'bg-red-500 text-white border-red-600 shadow-md') : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}\`}>
                                                                    {r}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">4. Categoría</label>
                                                        <select className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" value={h.categoria} onChange={e => updateHallazgo(h.id, 'categoria', e.target.value)}>
                                                            <option value="">Seleccione Categoría...</option>
                                                            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 5. Acción Correctiva */}
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">5. Acción Correctiva / Mitigadora</label>
                                                <textarea className="w-full border border-slate-300 rounded-lg p-3 text-sm min-h-[60px] outline-none focus:border-indigo-500" value={h.accion} onChange={e => updateHallazgo(h.id, 'accion', e.target.value)} placeholder="¿Qué se hará para solucionarlo?" />
                                            </div>

                                            {/* 6. Responsable, 7. Fecha, 8. Estado */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">6. Responsable Impl.</label>
                                                    <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" value={h.responsable} onChange={e => updateHallazgo(h.id, 'responsable', e.target.value)} placeholder="Ej. Juan P." />
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
                                            </div>

                                        </div>
                                    )}
`;

const startIndex = code.indexOf('{/* ACCORDION BODY */}');
const endIndex = code.indexOf('</div>\n                            ))}');
const newCode = code.substring(0, startIndex) + newAccordionBody + code.substring(endIndex);
fs.writeFileSync(path, newCode);
console.log("Reordered UI!");
