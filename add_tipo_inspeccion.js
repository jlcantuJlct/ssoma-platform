const fs = require('fs');
let c = fs.readFileSync('components/inspections/AlmacenCustomForm.tsx', 'utf8');

const target1 = `        proyecto: 'RED VIAL 6',
        area: '',
        fecha: new Date().toISOString().split('T')[0],
        inspector: user?.name || '',
        cargo: '',
        responsable: ''
    });`;

const rep1 = `        proyecto: 'RED VIAL 6',
        area: '',
        fecha: new Date().toISOString().split('T')[0],
        inspector: user?.name || '',
        cargo: '',
        responsable: '',
        tipoInspeccion: 'Planificada'
    });`;

c = c.replace(target1, rep1);

const target2 = `                        {renderMicInput("Responsable de Área", "responsable", meta.responsable)}
                    </div>
                </div>`;

const rep2 = `                        {renderMicInput("Responsable de Área", "responsable", meta.responsable)}
                        
                        <div className="sm:col-span-2 lg:col-span-3 mt-2 flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <label className="text-[10px] font-black text-slate-500 uppercase">Tipo de Inspección:</label>
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 hover:text-emerald-600 transition-colors">
                                    <input type="radio" checked={meta.tipoInspeccion === 'Planificada'} onChange={() => setMeta({...meta, tipoInspeccion: 'Planificada'})} className="w-4 h-4 text-emerald-500 accent-emerald-500" />
                                    Inspección Planificada
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 hover:text-emerald-600 transition-colors">
                                    <input type="radio" checked={meta.tipoInspeccion === 'No Planificada'} onChange={() => setMeta({...meta, tipoInspeccion: 'No Planificada'})} className="w-4 h-4 text-emerald-500 accent-emerald-500" />
                                    Inspección No Planificada
                                </label>
                            </div>
                        </div>
                    </div>
                </div>`;

c = c.replace(target2, rep2);

fs.writeFileSync('components/inspections/AlmacenCustomForm.tsx', c);
console.log('Added tipoInspeccion to Almacen form');
