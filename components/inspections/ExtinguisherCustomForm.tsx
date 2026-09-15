"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, PlusCircle, Save, Loader2, ArrowLeft, Copy, Flame, Mic, MicOff } from 'lucide-react';

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
                        {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
                    </button>
                </div>
            )}
        </div>
    );
};

export const ExtinguisherCustomForm = ({ moduleName, version, SignaturePad }: { moduleName: string, version: number, SignaturePad: any }) => {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    
    // Metadata Header
    const [meta, setMeta] = useState({
        registro: '',
        fecha: new Date().toISOString().split('T')[0],
        actividadEconomica: 'Construccion',
        razonSocial: 'Construcción y Administración S.A.',
        ruc: '20109565017',
        domicilio: 'Avenida Javier Prado Este No. 4109. Santiago de Surco. Lima 33, Perú',
        nTrabajadores: '',
        proyecto: 'RED VIAL 6',
        ubicacionProyecto: '',
        inspector: '',
        cargoInspector: '',
        fechaFirma: new Date().toISOString().split('T')[0],
        firmaInspector: ''
    });

    // Extinguisher items
    const [extinguishers, setExtinguishers] = useState<any[]>([]);

    const addExtinguisher = () => {
        setExtinguishers([...extinguishers, {
            id: Date.now().toString(),
            tipo: '',
            codigo: '',
            ubicacion: '',
            agente: 'PQS',
            fechaActual: '',
            fechaProxima: '',
            senalizacion: 'C',
            acceso: 'C',
            estado: 'C',
            observaciones: '',
            expanded: true
        }]);
    };

    const duplicateExtinguisher = (idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const itemToCopy = extinguishers[idx];
        
        let newCode = itemToCopy.codigo + ' (Copia)';
        if (/^\d+$/.test(itemToCopy.codigo)) {
            newCode = (parseInt(itemToCopy.codigo, 10) + 1).toString().padStart(itemToCopy.codigo.length, '0');
        }

        setExtinguishers([...extinguishers, {
            ...itemToCopy,
            id: Date.now().toString(),
            codigo: newCode,
            expanded: true
        }]);
    };

    const updateExtinguisher = (idx: number, field: string, val: any) => {
        const copy = [...extinguishers];
        copy[idx][field] = val;
        setExtinguishers(copy);
    };

    const removeExtinguisher = (idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setExtinguishers(extinguishers.filter((_, i) => i !== idx));
    };

    const toggleExpand = (idx: number) => {
        const copy = [...extinguishers];
        copy[idx].expanded = !copy[idx].expanded;
        setExtinguishers(copy);
    };

    const handleSave = async () => {
        if (extinguishers.length === 0) {
            alert('Añade al menos un equipo de emergencia evaluado.');
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
                        extinguishers,
                        isExtinguisherMatrix: true
                    }
                })
            });
            if (res.ok) {
                alert('¡Inspección guardada con éxito!');
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
            <div className="bg-red-700 text-white p-6 shadow-lg relative z-10 mb-6">
                <button onClick={() => router.push('/inspections?openDigital=true')} className="flex items-center gap-2 text-red-200 hover:text-white transition-colors mb-4">
                    <ArrowLeft size={20} /> Volver
                </button>
                <h1 className="text-2xl font-black mb-2 flex items-center gap-3">
                    <Flame className="text-orange-400" /> Registro de Inspección de Equipos de Emergencia
                </h1>
                <p className="text-red-200 text-sm">Registro matricial (F-SIG-058)</p>
            </div>

            <div className="px-4 space-y-6">
                {/* CABECERA GENERAL */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                    <div className="bg-slate-100 p-3 border-b border-slate-200">
                        <h2 className="font-bold text-slate-700 text-sm uppercase">Datos Generales</h2>
                    </div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase">Registro N°</label>
                            <VoiceInput value={meta.registro} onChange={(val: string) => setMeta({...meta, registro: val})} inputClass="w-full border-b border-slate-200 p-2 text-sm focus:border-red-500 outline-none bg-slate-50 rounded" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase">Fecha</label>
                            <VoiceInput type="date" value={meta.fecha} onChange={(val: string) => setMeta({...meta, fecha: val})} inputClass="w-full border-b border-slate-200 p-2 text-sm focus:border-red-500 outline-none bg-slate-50 rounded" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase">Actividad Económica</label>
                            <VoiceInput value={meta.actividadEconomica} onChange={(val: string) => setMeta({...meta, actividadEconomica: val})} inputClass="w-full border-b border-slate-200 p-2 text-sm focus:border-red-500 outline-none bg-slate-50 rounded" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase">Razón Social</label>
                            <VoiceInput value={meta.razonSocial} onChange={(val: string) => setMeta({...meta, razonSocial: val})} inputClass="w-full border-b border-slate-200 p-2 text-sm focus:border-red-500 outline-none bg-slate-50 rounded" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase">RUC</label>
                            <VoiceInput value={meta.ruc} onChange={(val: string) => setMeta({...meta, ruc: val})} inputClass="w-full border-b border-slate-200 p-2 text-sm focus:border-red-500 outline-none bg-slate-50 rounded" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Domicilio</label>
                            <VoiceInput value={meta.domicilio} onChange={(val: string) => setMeta({...meta, domicilio: val})} inputClass="w-full border-b border-slate-200 p-2 text-sm focus:border-red-500 outline-none bg-slate-50 rounded" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase">N° Trabajadores en el Centro</label>
                            <VoiceInput type="number" value={meta.nTrabajadores} onChange={(val: string) => setMeta({...meta, nTrabajadores: val})} inputClass="w-full border-b border-slate-200 p-2 text-sm focus:border-red-500 outline-none bg-slate-50 rounded" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase">Proyecto (Si aplica)</label>
                            <VoiceInput value={meta.proyecto} onChange={(val: string) => setMeta({...meta, proyecto: val})} inputClass="w-full border-b border-slate-200 p-2 text-sm focus:border-red-500 outline-none bg-slate-50 rounded" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Ubicación del Proyecto</label>
                            <VoiceInput value={meta.ubicacionProyecto} onChange={(val: string) => setMeta({...meta, ubicacionProyecto: val})} inputClass="w-full border-b border-slate-200 p-2 text-sm focus:border-red-500 outline-none bg-slate-50 rounded" />
                        </div>
                    </div>
                </div>

                {/* EQUIPOS EVALUADOS */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-slate-700 uppercase">Listado de Equipos de Emergencia</h2>
                        <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full">{extinguishers.length} equipos registrados</span>
                    </div>

                    <div className="space-y-4">
                        {extinguishers.map((ext, idx) => (
                            <div key={ext.id} className={`bg-white border shadow-sm rounded-xl overflow-hidden transition-all ${'${'}ext.estado === 'NC' || ext.acceso === 'NC' || ext.senalizacion === 'NC' ? 'border-red-300' : 'border-slate-200'}`}>
                                <div 
                                    className={`p-4 flex justify-between items-center cursor-pointer ${'${'}ext.estado === 'NC' || ext.acceso === 'NC' || ext.senalizacion === 'NC' ? 'bg-red-50' : 'bg-slate-50 hover:bg-slate-100'}`}
                                    onClick={() => toggleExpand(idx)}
                                >
                                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                            <h3 className="font-bold text-slate-800">{ext.tipo || 'Equipo sin tipo'}</h3>
                                        </div>
                                        <div className="text-sm text-slate-500 flex gap-2">
                                            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded">{ext.codigo || 'Sin código'}</span>
                                            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs">{ext.ubicacion || 'Sin ubicación'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 sm:gap-3 ml-2">
                                        {(ext.estado === 'NC' || ext.acceso === 'NC' || ext.senalizacion === 'NC') && (
                                            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full hidden sm:block">NO CONFORME</span>
                                        )}
                                        <button onClick={(e) => duplicateExtinguisher(idx, e)} className="text-slate-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors" title="Duplicar">
                                            <Copy size={18} />
                                        </button>
                                        <button onClick={(e) => removeExtinguisher(idx, e)} className="text-slate-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors" title="Eliminar">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                {ext.expanded && (
                                    <div className="p-4 sm:p-5 border-t border-slate-100">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Tipo de Equipo</label>
                                                <VoiceInput placeholder="Ej: Extintor, Botiquín..." value={ext.tipo} onChange={(val: string) => updateExtinguisher(idx, 'tipo', val)} inputClass="w-full border border-slate-200 p-2 text-sm rounded bg-slate-50 outline-none focus:border-red-500" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase">N° / Código</label>
                                                <VoiceInput placeholder="Ej: EXT-01" value={ext.codigo} onChange={(val: string) => updateExtinguisher(idx, 'codigo', val)} inputClass="w-full border border-slate-200 p-2 text-sm rounded bg-slate-50 outline-none focus:border-red-500" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Ubicación</label>
                                                <VoiceInput placeholder="Ubicación exacta" value={ext.ubicacion} onChange={(val: string) => updateExtinguisher(idx, 'ubicacion', val)} inputClass="w-full border border-slate-200 p-2 text-sm rounded bg-slate-50 outline-none focus:border-red-500" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Clase de agente</label>
                                                <VoiceInput placeholder="Ej: PQS, CO2..." value={ext.agente} onChange={(val: string) => updateExtinguisher(idx, 'agente', val)} inputClass="w-full border border-slate-200 p-2 text-sm rounded bg-slate-50 outline-none focus:border-red-500" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Fecha Recarga Actual</label>
                                                <VoiceInput type="month" value={ext.fechaActual} onChange={(val: string) => updateExtinguisher(idx, 'fechaActual', val)} inputClass="w-full border border-slate-200 p-2 text-sm rounded bg-white outline-none focus:border-red-500" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Fecha Recarga Próxima</label>
                                                <VoiceInput type="month" value={ext.fechaProxima} onChange={(val: string) => updateExtinguisher(idx, 'fechaProxima', val)} inputClass="w-full border border-slate-200 p-2 text-sm rounded bg-white outline-none focus:border-red-500" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase text-center mb-1">Señalización</label>
                                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                                    {['C', 'NC', 'N/A'].map(opt => (
                                                        <button 
                                                            key={opt}
                                                            onClick={() => updateExtinguisher(idx, 'senalizacion', opt)}
                                                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${'${'}ext.senalizacion === opt ? (opt === 'NC' ? 'bg-red-500 text-white' : 'bg-blue-600 text-white shadow') : 'text-slate-500 hover:bg-slate-200'}`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase text-center mb-1">Acceso al extintor</label>
                                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                                    {['C', 'NC', 'N/A'].map(opt => (
                                                        <button 
                                                            key={opt}
                                                            onClick={() => updateExtinguisher(idx, 'acceso', opt)}
                                                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${'${'}ext.acceso === opt ? (opt === 'NC' ? 'bg-red-500 text-white' : 'bg-blue-600 text-white shadow') : 'text-slate-500 hover:bg-slate-200'}`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase text-center mb-1">Estado general</label>
                                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                                    {['C', 'NC', 'N/A'].map(opt => (
                                                        <button 
                                                            key={opt}
                                                            onClick={() => updateExtinguisher(idx, 'estado', opt)}
                                                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${'${'}ext.estado === opt ? (opt === 'NC' ? 'bg-red-500 text-white' : 'bg-blue-600 text-white shadow') : 'text-slate-500 hover:bg-slate-200'}`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Observaciones / Acciones</label>
                                            <VoiceInput placeholder="Detallar observaciones o acciones correctivas..." value={ext.observaciones} onChange={(val: string) => updateExtinguisher(idx, 'observaciones', val)} inputClass="w-full border border-slate-200 p-2 text-sm rounded bg-slate-50 outline-none focus:border-red-500" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <button onClick={addExtinguisher} className="w-full mt-4 py-4 rounded-xl border-2 border-dashed border-red-300 text-red-600 font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                        <PlusCircle size={18} /> Añadir Equipo de Emergencia
                    </button>
                </div>

                {/* FIRMAS */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 mt-6">
                    <h2 className="font-bold text-slate-700 text-sm uppercase mb-4">Responsable del Registro</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase">Nombres y Apellidos</label>
                                <VoiceInput value={meta.inspector} onChange={(val: string) => setMeta({...meta, inspector: val})} inputClass="w-full border-b border-slate-200 p-2 text-sm focus:border-red-500 outline-none bg-slate-50 rounded" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase">Cargo</label>
                                <VoiceInput value={meta.cargoInspector} onChange={(val: string) => setMeta({...meta, cargoInspector: val})} inputClass="w-full border-b border-slate-200 p-2 text-sm focus:border-red-500 outline-none bg-slate-50 rounded" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase">Fecha de Firma</label>
                                <VoiceInput type="date" value={meta.fechaFirma} onChange={(val: string) => setMeta({...meta, fechaFirma: val})} inputClass="w-full border-b border-slate-200 p-2 text-sm focus:border-red-500 outline-none bg-slate-50 rounded" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Firma Digital</label>
                            <SignaturePad onSave={(val: string) => setMeta({...meta, firmaInspector: val})} />
                        </div>
                    </div>
                </div>

                <button onClick={handleSave} disabled={isSaving} className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 transition-transform active:scale-95 mt-8 disabled:opacity-50">
                    {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    {isSaving ? 'Guardando...' : 'Guardar Inspección'}
                </button>
            </div>
        </div>
    );
};
