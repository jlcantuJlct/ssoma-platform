"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, CheckCircle, AlertCircle, Save, Loader2, ArrowLeft } from 'lucide-react';

const EPP_GROUPS = [
    { name: 'CABEZA', items: ['Casco', 'Barbiquejo'] },
    { name: 'CARA', items: ['Careta de esmerilar', 'Careta de soldador'] },
    { name: 'CUERPO', items: ['Camisa', 'Pantalón', 'Polo', 'Mandil', 'Escarpines'] },
    { name: 'OJOS', items: ['Lentes', 'Sobrelente'] },
    { name: 'MANOS', items: ['Guantes de cuero', 'Guantes de jebe', 'Guantes dieléctricos', 'Guantes de hilo'] },
    { name: 'OÍDO', items: ['Tapones', 'Orejeras'] },
    { name: 'PROT. RESPIRATORIA', items: ['Mascarilla descartable', 'Resp. c/filtro p/polvo', 'Resp. c/filtro p/gases', 'Resp. c/filtro p/humos'] },
    { name: 'PIES', items: ['Botines punta de acero', 'Botines dieléctricos', 'Botas de jebe'] }
];

export const EppCustomForm = ({ moduleName, version, SignaturePad }: { moduleName: string, version: number, SignaturePad: any }) => {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    
    // Metadata
    const [meta, setMeta] = useState({
        proyecto: '',
        area: '',
        fecha: new Date().toISOString().split('T')[0],
        nTrabajadores: '',
        responsable: '',
        firmaResponsable: '',
        observaciones: ''
    });

    // Workers
    const [workers, setWorkers] = useState<any[]>([]);

    const addWorker = () => {
        setWorkers([...workers, {
            id: Date.now().toString(),
            name: '',
            role: '',
            badEpps: [],
            correction: '',
            deadline: '',
            verification: '',
            expanded: true
        }]);
    };

    const updateWorker = (idx: number, field: string, val: any) => {
        const copy = [...workers];
        copy[idx][field] = val;
        setWorkers(copy);
    };

    const toggleEpp = (wIdx: number, epp: string) => {
        const copy = [...workers];
        const w = copy[wIdx];
        if (w.badEpps.includes(epp)) {
            w.badEpps = w.badEpps.filter((e: string) => e !== epp);
        } else {
            w.badEpps.push(epp);
        }
        setWorkers(copy);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/inspections/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    moduleName: decodeURIComponent(moduleName),
                    version,
                    data: {
                        meta,
                        workers,
                        isEppMatrix: true
                    }
                })
            });
            if (res.ok) {
                alert('¡Inspección EPP guardada con éxito!');
                router.push('/inspections');
            } else {
                alert('Error al guardar.');
            }
        } catch(e) {
            console.error(e);
            alert('Error al guardar.');
        }
        setIsSaving(false);
    };

    return (
        <div className="max-w-3xl mx-auto pb-24">
            <div className="bg-indigo-600 text-white p-6 shadow-lg relative z-10 mb-6">
                <button onClick={() => router.push('/inspections')} className="flex items-center gap-2 text-indigo-200 hover:text-white transition-colors mb-4">
                    <ArrowLeft size={20} /> Volver
                </button>
                <h1 className="text-2xl font-black mb-2">Inspección de EPP</h1>
                <p className="text-indigo-200 text-sm">Registro matricial por trabajador (F-SIG-044)</p>
            </div>

            <div className="px-4 space-y-4">
                {/* METADATA */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase">Proyecto</label>
                            <input type="text" value={meta.proyecto} onChange={e => setMeta({...meta, proyecto: e.target.value})} className="w-full border-b border-slate-200 p-2 text-sm focus:border-blue-500 outline-none bg-slate-50 rounded" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase">Área</label>
                            <input type="text" value={meta.area} onChange={e => setMeta({...meta, area: e.target.value})} className="w-full border-b border-slate-200 p-2 text-sm focus:border-blue-500 outline-none bg-slate-50 rounded" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase">Fecha</label>
                            <input type="date" value={meta.fecha} onChange={e => setMeta({...meta, fecha: e.target.value})} className="w-full border-b border-slate-200 p-2 text-sm focus:border-blue-500 outline-none bg-slate-50 rounded" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase">N° Trabajadores</label>
                            <input type="number" value={meta.nTrabajadores} onChange={e => setMeta({...meta, nTrabajadores: e.target.value})} className="w-full border-b border-slate-200 p-2 text-sm focus:border-blue-500 outline-none bg-slate-50 rounded" />
                        </div>
                    </div>
                    
                    <div className="mt-2 pt-2 border-t border-slate-100">
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Responsable de Inspección</label>
                        <input type="text" placeholder="Nombre y Puesto" value={meta.responsable} onChange={e => setMeta({...meta, responsable: e.target.value})} className="w-full border-b border-slate-200 p-2 text-sm focus:border-blue-500 outline-none bg-slate-50 rounded mb-3" />
                        
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Firma del Responsable</label>
                        <SignaturePad onSave={(val: string) => setMeta({...meta, firmaResponsable: val})} />
                    </div>
                </div>

                {/* WORKERS */}
                {workers.map((worker, wIdx) => (
                    <div key={worker.id} className="bg-white border-2 border-blue-100 shadow-sm rounded-xl overflow-hidden transition-all">
                        <div 
                            className="bg-blue-50 p-4 flex justify-between items-center cursor-pointer"
                            onClick={() => updateWorker(wIdx, 'expanded', !worker.expanded)}
                        >
                            <div className="flex-1">
                                <h3 className="font-bold text-blue-900">{worker.name || ('Trabajador #' + (wIdx + 1))}</h3>
                                <p className="text-xs text-blue-600">{worker.role || 'Sin puesto especificado'}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {worker.badEpps.length > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full">
                                        {worker.badEpps.length} OBS.
                                    </span>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); setWorkers(workers.filter((_, i) => i !== wIdx)); }} className="text-red-400 hover:text-red-600 p-2">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {worker.expanded && (
                            <div className="p-4 border-t border-blue-100">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                    <input type="text" placeholder="Nombres y Apellidos" value={worker.name} onChange={e => updateWorker(wIdx, 'name', e.target.value)} className="w-full border border-slate-200 p-2 text-sm rounded bg-slate-50 outline-none focus:border-blue-500" />
                                    <input type="text" placeholder="Puesto" value={worker.role} onChange={e => updateWorker(wIdx, 'role', e.target.value)} className="w-full border border-slate-200 p-2 text-sm rounded bg-slate-50 outline-none focus:border-blue-500" />
                                </div>
                                
                                <div className="bg-slate-900 rounded-xl p-4">
                                    <p className="text-xs text-slate-400 mb-3 font-semibold uppercase tracking-wider text-center">Toque los EPPs en <span className="text-red-400">Mal Estado</span></p>
                                    
                                    <div className="space-y-4">
                                        {EPP_GROUPS.map(group => (
                                            <div key={group.name}>
                                                <h5 className="text-[10px] text-slate-500 font-black mb-2 uppercase">{group.name}</h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {group.items.map(epp => {
                                                        const isBad = worker.badEpps.includes(epp);
                                                        return (
                                                            <button
                                                                key={epp}
                                                                onClick={() => toggleEpp(wIdx, epp)}
                                                                className={"px-3 py-1.5 text-xs font-bold rounded-lg border transition-all " + (isBad ? 'bg-red-500/20 text-red-400 border-red-500/50 scale-105 shadow-lg shadow-red-900/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700')}
                                                            >
                                                                {epp} {isBad && ' ❌'}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {worker.badEpps.length > 0 && (
                                    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-3">
                                        <h5 className="text-xs font-black text-orange-800 uppercase flex items-center gap-2"><AlertCircle size={14}/> Acciones Correctivas</h5>
                                        <input type="text" placeholder="Corrección (Ej: Cambio de casco)" value={worker.correction} onChange={e => updateWorker(wIdx, 'correction', e.target.value)} className="w-full border border-orange-200 p-2 text-sm rounded bg-white outline-none focus:border-orange-500" />
                                        <div className="grid grid-cols-2 gap-3">
                                            <input type="text" placeholder="Plazo (Días/Horas)" value={worker.deadline} onChange={e => updateWorker(wIdx, 'deadline', e.target.value)} className="w-full border border-orange-200 p-2 text-sm rounded bg-white outline-none focus:border-orange-500" />
                                            <input type="text" placeholder="Verificación" value={worker.verification} onChange={e => updateWorker(wIdx, 'verification', e.target.value)} className="w-full border border-orange-200 p-2 text-sm rounded bg-white outline-none focus:border-orange-500" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                <button onClick={addWorker} className="w-full py-4 rounded-xl border-2 border-dashed border-blue-300 text-blue-600 font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                    <CheckCircle size={18} /> Añadir Trabajador Evaluado
                </button>
                
                <div className="mt-6">
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Observaciones Generales</label>
                    <textarea value={meta.observaciones} onChange={e => setMeta({...meta, observaciones: e.target.value})} className="w-full border border-slate-200 p-3 text-sm rounded-lg outline-none focus:border-blue-500 min-h-[80px]" placeholder="Observaciones adicionales..."></textarea>
                </div>

                <button onClick={handleSave} disabled={isSaving} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-transform active:scale-95 mt-8 disabled:opacity-50">
                    {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    {isSaving ? 'Guardando...' : 'Guardar Inspección EPP'}
                </button>
            </div>
        </div>
    );
};
