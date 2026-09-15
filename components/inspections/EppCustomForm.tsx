"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, CheckCircle, AlertCircle, Save, Loader2, ArrowLeft, Copy, Shield } from 'lucide-react';

const VoiceInput = ({ value, onChange, placeholder, className, type = "text", inputClass = "" }: any) => {
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);

    const toggleRecording = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('El dictado por voz no está soportado en este navegador.');
            return;
        }
        
        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
        } else {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.lang = 'es-ES';
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            
            let finalTranscriptAtStart = value || '';
            
            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscriptChunk = '';
                
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscriptChunk += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                
                if (finalTranscriptChunk) {
                    finalTranscriptAtStart = (finalTranscriptAtStart + ' ' + finalTranscriptChunk).trim();
                }
                
                onChange((finalTranscriptAtStart + ' ' + interimTranscript).trim());
            };
            
            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };
            
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    return (
        <div className={`relative w-full ${className || ''}`}>
            <input 
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`${inputClass} ${type === 'text' ? 'pr-16' : ''}`}
            />
            {type === 'text' && (
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                    {value && (
                        <button onClick={() => onChange('')} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-200 rounded-md transition-colors" title="Limpiar">
                            <Trash2 size={14} />
                        </button>
                    )}
                    <button onClick={toggleRecording} className={`p-1.5 rounded-md transition-colors ${isRecording ? 'text-red-500 bg-red-100 animate-pulse' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-200'}`} title="Dictado por voz">
                        <Shield size={14} className={isRecording ? "hidden" : "hidden"} />
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/><line x1="8" x2="16" y1="22" y2="22"/></svg>
                    </button>
                </div>
            )}
        </div>
    );
};

const VoiceTextarea = ({ value, onChange, placeholder, className, inputClass = "" }: any) => {
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);

    const toggleRecording = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('El dictado por voz no está soportado en este navegador.');
            return;
        }
        
        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
        } else {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.lang = 'es-ES';
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            
            let finalTranscriptAtStart = value || '';
            
            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscriptChunk = '';
                
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscriptChunk += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                
                if (finalTranscriptChunk) {
                    finalTranscriptAtStart = (finalTranscriptAtStart + ' ' + finalTranscriptChunk).trim();
                }
                
                onChange((finalTranscriptAtStart + ' ' + interimTranscript).trim());
            };
            
            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };
            
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    return (
        <div className={`relative w-full ${className || ''}`}>
            <textarea 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`${inputClass} pr-16`}
            />
            <div className="absolute right-2 top-2 flex flex-col items-center gap-1">
                {value && (
                    <button onClick={() => onChange('')} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-200 rounded-md transition-colors" title="Limpiar">
                        <Trash2 size={14} />
                    </button>
                )}
                <button onClick={toggleRecording} className={`p-1.5 rounded-md transition-colors ${isRecording ? 'text-red-500 bg-red-100 animate-pulse' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-200'}`} title="Dictado por voz">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/><line x1="8" x2="16" y1="22" y2="22"/></svg>
                </button>
            </div>
        </div>
    );
};

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
    
    // Metadata Header
    const [meta, setMeta] = useState({
        proyecto: 'RED VIAL 6',
        area: '',
        fecha: new Date().toISOString().split('T')[0],
        nTrabajadores: '',
        responsable: '',
        cargoResponsable: '',
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

    const duplicateWorker = (idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const itemToCopy = workers[idx];
        setWorkers([...workers, {
            ...itemToCopy,
            id: Date.now().toString(),
            expanded: true
        }]);
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
        if (workers.length === 0) {
            alert('Añade al menos un trabajador evaluado.');
            return;
        }

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
                router.push('/inspections?openDigital=true');
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
        <div className="max-w-4xl mx-auto pb-24">
            <div className="bg-indigo-700 text-white p-6 shadow-lg relative z-10 mb-6">
                <button onClick={() => router.push('/inspections?openDigital=true')} className="flex items-center gap-2 text-indigo-200 hover:text-white transition-colors mb-4">
                    <ArrowLeft size={20} /> Volver
                </button>
                <h1 className="text-2xl font-black mb-2 flex items-center gap-3">
                    <Shield className="text-indigo-300" /> Inspección de Equipos de Protección Personal
                </h1>
                <p className="text-indigo-200 text-sm">Registro matricial por trabajador (F-SIG-044)</p>
            </div>

            <div className="px-4 space-y-6">
                {/* CABECERA GENERAL */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                    <div className="bg-slate-100 p-3 border-b border-slate-200">
                        <h2 className="font-bold text-slate-700 text-sm uppercase">Datos Generales</h2>
                    </div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2 md:col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Proyecto</label>
                            <VoiceInput value={meta.proyecto} onChange={(val: string) => setMeta({...meta, proyecto: val})} inputClass="w-full border-b border-slate-200 p-2 text-sm focus:border-indigo-500 outline-none bg-slate-50 rounded" />
                        </div>
                        <div className="sm:col-span-2 md:col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Área</label>
                            <VoiceInput value={meta.area} onChange={(val: string) => setMeta({...meta, area: val})} inputClass="w-full border-b border-slate-200 p-2 text-sm focus:border-indigo-500 outline-none bg-slate-50 rounded" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase">Fecha</label>
                            <VoiceInput type="date" value={meta.fecha} onChange={(val: string) => setMeta({...meta, fecha: val})} inputClass="w-full border-b border-slate-200 p-2 text-sm focus:border-indigo-500 outline-none bg-slate-50 rounded" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase">N° Trabajadores en el Centro</label>
                            <VoiceInput type="number" value={meta.nTrabajadores} onChange={(val: string) => setMeta({...meta, nTrabajadores: val})} inputClass="w-full border-b border-slate-200 p-2 text-sm focus:border-indigo-500 outline-none bg-slate-50 rounded" />
                        </div>
                    </div>
                </div>

                {/* WORKERS */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-slate-700 uppercase">Listado de Trabajadores</h2>
                        <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full">{workers.length} trabajadores</span>
                    </div>

                    <div className="space-y-4">
                        {workers.map((worker, wIdx) => (
                            <div key={worker.id} className={`bg-white border shadow-sm rounded-xl overflow-hidden transition-all ${worker.badEpps.length > 0 ? 'border-orange-300' : 'border-slate-200'}`}>
                                <div 
                                    className={`p-4 flex justify-between items-center cursor-pointer ${worker.badEpps.length > 0 ? 'bg-orange-50' : 'bg-slate-50 hover:bg-slate-100'}`}
                                    onClick={() => updateWorker(wIdx, 'expanded', !worker.expanded)}
                                >
                                    <div className="flex-1 flex items-center gap-3">
                                        <span className="bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{wIdx + 1}</span>
                                        <div>
                                            <h3 className="font-bold text-slate-800 line-clamp-1">{worker.name || 'Trabajador sin nombre'}</h3>
                                            <p className="text-xs text-slate-500">{worker.role || 'Sin puesto'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-2">
                                        {worker.badEpps.length > 0 && (
                                            <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-full hidden sm:block">
                                                {worker.badEpps.length} OBS.
                                            </span>
                                        )}
                                        <button onClick={(e) => duplicateWorker(wIdx, e)} className="text-slate-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors" title="Duplicar">
                                            <Copy size={18} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setWorkers(workers.filter((_, i) => i !== wIdx)); }} className="text-slate-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors" title="Eliminar">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                {worker.expanded && (
                                    <div className="p-4 sm:p-5 border-t border-slate-100">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Nombres y Apellidos</label>
                                                <VoiceInput placeholder="Ej: Juan Pérez" value={worker.name} onChange={(val: string) => updateWorker(wIdx, 'name', val)} inputClass="w-full border border-slate-200 p-2 text-sm rounded bg-slate-50 outline-none focus:border-indigo-500" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Puesto</label>
                                                <VoiceInput placeholder="Ej: Operario" value={worker.role} onChange={(val: string) => updateWorker(wIdx, 'role', val)} inputClass="w-full border border-slate-200 p-2 text-sm rounded bg-slate-50 outline-none focus:border-indigo-500" />
                                            </div>
                                        </div>
                                        
                                        <div className="bg-slate-900 rounded-xl p-4 sm:p-5">
                                            <p className="text-xs text-slate-400 mb-4 font-semibold uppercase tracking-wider text-center">Toque los EPPs en <span className="text-red-400 font-bold">Mal Estado</span></p>
                                            
                                            <div className="space-y-5">
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
                                                                        className={"px-3 py-1.5 text-xs font-bold rounded-lg border transition-all " + (isBad ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow-lg shadow-red-900/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700')}
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
                                            <div className="mt-5 p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-4">
                                                <h5 className="text-xs font-black text-orange-800 uppercase flex items-center gap-2"><AlertCircle size={14}/> Acciones Correctivas</h5>
                                                <div>
                                                    <label className="text-[10px] font-black text-orange-800/60 uppercase">Corrección a tomar</label>
                                                    <VoiceInput placeholder="Ej: Cambio de casco" value={worker.correction} onChange={(val: string) => updateWorker(wIdx, 'correction', val)} inputClass="w-full border border-orange-200 p-2 text-sm rounded bg-white outline-none focus:border-orange-500" />
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] font-black text-orange-800/60 uppercase">Plazo</label>
                                                        <VoiceInput placeholder="Días/Horas" value={worker.deadline} onChange={(val: string) => updateWorker(wIdx, 'deadline', val)} inputClass="w-full border border-orange-200 p-2 text-sm rounded bg-white outline-none focus:border-orange-500" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black text-orange-800/60 uppercase">Verificación de corrección</label>
                                                        <VoiceInput placeholder="Evidencia/Firma" value={worker.verification} onChange={(val: string) => updateWorker(wIdx, 'verification', val)} inputClass="w-full border border-orange-200 p-2 text-sm rounded bg-white outline-none focus:border-orange-500" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <button onClick={addWorker} className="w-full mt-4 py-4 rounded-xl border-2 border-dashed border-indigo-300 text-indigo-600 font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
                        <CheckCircle size={18} /> Añadir Trabajador Evaluado
                    </button>
                </div>
                
                {/* OBSERVACIONES */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Observaciones Generales</label>
                    <VoiceTextarea value={meta.observaciones} onChange={(val: string) => setMeta({...meta, observaciones: val})} inputClass="w-full border border-slate-200 p-3 text-sm rounded-lg outline-none focus:border-indigo-500 min-h-[80px]" placeholder="Observaciones adicionales..." />
                </div>

                {/* FIRMAS */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
                    <h2 className="font-bold text-slate-700 text-sm uppercase mb-4">Responsable de la Inspección</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase">Nombres y Apellidos</label>
                                <VoiceInput value={meta.responsable} onChange={(val: string) => setMeta({...meta, responsable: val})} inputClass="w-full border-b border-slate-200 p-2 text-sm focus:border-indigo-500 outline-none bg-slate-50 rounded" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase">Puesto / Cargo</label>
                                <VoiceInput value={meta.cargoResponsable} onChange={(val: string) => setMeta({...meta, cargoResponsable: val})} inputClass="w-full border-b border-slate-200 p-2 text-sm focus:border-indigo-500 outline-none bg-slate-50 rounded" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Firma Digital</label>
                            <SignaturePad onSave={(val: string) => setMeta({...meta, firmaResponsable: val})} />
                        </div>
                    </div>
                </div>

                <button onClick={handleSave} disabled={isSaving} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-transform active:scale-95 mt-8 disabled:opacity-50">
                    {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    {isSaving ? 'Guardando...' : 'Guardar Inspección EPP'}
                </button>
            </div>
        </div>
    );
};
