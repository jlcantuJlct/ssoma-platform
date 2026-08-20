"use client";

import React, { useState } from 'react';
import { X, Upload, Plus, Trash2, FileText, Download, Calendar, MapPin, Users, Target, CheckCircle2, Wand2, Image } from 'lucide-react';

interface ActaGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const YEARS = [2024, 2025, 2026, 2027];

export default function ActaGeneratorModal({ isOpen, onClose }: ActaGeneratorModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDrafting, setIsDrafting] = useState(false);
    
    // Form State
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [month, setMonth] = useState(new Date().getMonth().toString());
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [location, setLocation] = useState('Sala de Reuniones Principal');
    
    // Dynamic Lists
    const [attendees, setAttendees] = useState<{nombre: string, cargo: string, tipo: string, firma?: string}[]>([
        { nombre: '', cargo: '', tipo: 'empleador', firma: '' }
    ]);
    const [agenda, setAgenda] = useState<string[]>(['']);
    const [agreements, setAgreements] = useState<{acuerdo: string, responsable: string, fecha: string}[]>([
        { acuerdo: '', responsable: '', fecha: '' }
    ]);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const formData = new FormData();
            if (file) formData.append('file', file);
            
            const actaData = {
                year,
                month,
                date,
                startTime,
                endTime,
                location,
                attendees: attendees.filter(a => a.nombre.trim() !== '').map(a => ({
                    nombre: a.nombre,
                    cargo: a.cargo,
                    tipo: a.tipo,
                    firma: a.firma
                })),
                agenda: agenda.filter(a => a.trim() !== ''),
                agreements: agreements.filter(a => a.acuerdo.trim() !== '')
            };
            
            formData.append('actaData', JSON.stringify(actaData));

            const res = await fetch('/api/generate-acta-scsst', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Acta_SCSST_${MONTHS[parseInt(month)]}_${year}.docx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                onClose();
            } else {
                const err = await res.json();
                alert(`Error: ${err.error}`);
            }
        } catch (error: any) {
            console.error(error);
            alert('Ocurrió un error al generar el acta.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAutoDraft = async () => {
        setIsDrafting(true);
        try {
            const res = await fetch('/api/draft-acta-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ year, month })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                if (data.data.agenda) {
                    setAgenda(data.data.agenda);
                }
                if (data.data.acuerdos) {
                    setAgreements(data.data.acuerdos);
                }
                alert('La IA ha completado la agenda y acuerdos. Por favor revise.');
            } else {
                alert(`Error de IA: ${data.error || 'Desconocido'}`);
            }
        } catch (error: any) {
            console.error('Error drafting AI:', error);
            alert('Error al solicitar a la IA: ' + error.message);
        } finally {
            setIsDrafting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
                
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-500/10 rounded-xl">
                            <FileText className="text-emerald-500" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Generador Automático de Actas (SCSST)</h2>
                            <p className="text-sm text-slate-400">Configure los detalles para generar el documento oficial.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-center">
                        <button 
                            onClick={handleAutoDraft} 
                            disabled={isDrafting}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all"
                        >
                            {isDrafting ? 'Pensando...' : <><Wand2 size={16} /> Redactar con IA</>}
                        </button>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 custom-scrollbar">
                    
                    {/* Columna Izquierda: Datos Básicos */}
                    <div className="space-y-6">
                        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                            <h3 className="text-emerald-400 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                                <Calendar size={14} /> 1. Parámetros y Fecha
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Año del Acta</label>
                                    <select value={year} onChange={e => setYear(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-emerald-500 outline-none">
                                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Mes (Para Estadísticas e IA)</label>
                                    <select value={month} onChange={e => setMonth(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-emerald-500 outline-none">
                                        {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2 col-span-3 md:col-span-1">
                                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Fecha Reunión</label>
                                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-emerald-500 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Hora Inicio</label>
                                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-emerald-500 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Hora Fin</label>
                                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-emerald-500 outline-none" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Lugar</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 text-slate-500" size={16} />
                                    <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-emerald-500 outline-none" placeholder="Ej. Sala de Reuniones..." />
                                </div>
                            </div>
                        </div>

                        {/* Asistentes */}
                        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-emerald-400 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                                    <Users size={14} /> 2. Lista de Asistentes
                                </h3>
                                <button onClick={() => setAttendees([...attendees, {nombre:'', cargo:'', tipo:'empleador', firma:''}])} className="text-emerald-500 hover:bg-emerald-500/20 p-1.5 rounded-lg transition-colors">
                                    <Plus size={16} />
                                </button>
                            </div>
                            
                            <div className="space-y-3">
                                {attendees.map((a, i) => (
                                    <div key={i} className="flex gap-2 items-start">
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                                            <input type="text" placeholder="Nombre completo" value={a.nombre} onChange={e => { const n = [...attendees]; n[i].nombre = e.target.value; setAttendees(n); }} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none" />
                                            <select value={a.cargo} onChange={e => { const n = [...attendees]; n[i].cargo = e.target.value; setAttendees(n); }} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none">
                                                <option value="" disabled>Cargo...</option>
                                                <option value="Presidente">Presidente</option>
                                                <option value="Secretario">Secretario</option>
                                                <option value="Miembro">Miembro</option>
                                            </select>
                                            <select value={a.tipo} onChange={e => { const n = [...attendees]; n[i].tipo = e.target.value; setAttendees(n); }} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none">
                                                <option value="empleador">Titular Empleador</option>
                                                <option value="trabajador">Titular Trabajador</option>
                                                <option value="invitado">Invitado</option>
                                            </select>
                                            <div className={`relative border-2 border-dashed rounded-lg flex items-center justify-center h-full overflow-hidden transition-colors ${a.firma ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-800 hover:border-emerald-500/50 bg-slate-900'}`}>
                                                <input 
                                                    type="file" 
                                                    accept="image/*"
                                                    title="Arrastrar firma aquí"
                                                    onChange={e => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                const n = [...attendees];
                                                                n[i].firma = reader.result as string;
                                                                setAttendees(n);
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                                />
                                                {a.firma ? (
                                                    <img src={a.firma} alt="Firma" className="h-6 object-contain" />
                                                ) : (
                                                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                                                        <Image size={12} /> <span className="hidden sm:inline">Arrastrar</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={() => setAttendees(attendees.filter((_, idx) => idx !== i))} className="p-2 bg-slate-900 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded-lg transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha: Agenda, Acuerdos y Archivo */}
                    <div className="space-y-6">
                        
                        {/* Agenda */}
                        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-emerald-400 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                                    <Target size={14} /> 3. Temas de Agenda
                                </h3>
                                <button onClick={() => setAgenda([...agenda, ''])} className="text-emerald-500 hover:bg-emerald-500/20 p-1.5 rounded-lg transition-colors">
                                    <Plus size={16} />
                                </button>
                            </div>
                            <div className="space-y-2">
                                {agenda.map((item, i) => (
                                    <div key={i} className="flex gap-2">
                                        <textarea rows={2} placeholder={`Tema ${i+1}`} value={item} onChange={e => { const n = [...agenda]; n[i] = e.target.value; setAgenda(n); }} className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none resize-none" />
                                        <button onClick={() => setAgenda(agenda.filter((_, idx) => idx !== i))} className="p-2 bg-slate-900 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded-lg transition-colors h-fit">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Acuerdos */}
                        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-emerald-400 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                                    <CheckCircle2 size={14} /> 4. Acuerdos Tomados
                                </h3>
                                <button onClick={() => setAgreements([...agreements, {acuerdo:'', responsable:'', fecha:''}])} className="text-emerald-500 hover:bg-emerald-500/20 p-1.5 rounded-lg transition-colors">
                                    <Plus size={16} />
                                </button>
                            </div>
                            <div className="space-y-3">
                                {agreements.map((a, i) => (
                                    <div key={i} className="flex gap-2 items-start">
                                        <div className="flex-1 space-y-2">
                                            <textarea rows={4} placeholder={`Desarrollo o Acuerdo ${i+1}`} value={a.acuerdo} onChange={e => { const n = [...agreements]; n[i].acuerdo = e.target.value; setAgreements(n); }} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none resize-none" />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="text" placeholder="Responsable (Opcional)" value={a.responsable} onChange={e => { const n = [...agreements]; n[i].responsable = e.target.value; setAgreements(n); }} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none" />
                                                <input type="date" value={a.fecha} onChange={e => { const n = [...agreements]; n[i].fecha = e.target.value; setAgreements(n); }} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none" />
                                            </div>
                                        </div>
                                        <button onClick={() => setAgreements(agreements.filter((_, idx) => idx !== i))} className="p-2 bg-slate-900 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded-lg transition-colors h-full">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Plantilla Upload (Opcional Override) */}
                        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                            <h3 className="text-emerald-400 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                                <Upload size={14} /> 5. Reemplazar Plantilla Local (Opcional)
                            </h3>
                            <div className="relative border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer group bg-slate-900/50">
                                <input 
                                    type="file" 
                                    accept=".docx"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            setFile(e.target.files[0]);
                                        }
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="text-center">
                                    <p className="text-sm font-medium text-white">{file ? file.name : 'Si desea usar otra plantilla, cárguela aquí'}</p>
                                    <p className="text-[10px] text-slate-500 mt-1">De lo contrario, usará la guardada en el servidor</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-800 transition-colors">
                        Cancelar
                    </button>
                    <button 
                        onClick={handleGenerate} 
                        disabled={isGenerating}
                        className="px-6 py-2.5 rounded-xl text-sm font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                    >
                        {isGenerating ? (
                            <>Generando Acta...</>
                        ) : (
                            <><Download size={16} /> Procesar y Descargar</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}


