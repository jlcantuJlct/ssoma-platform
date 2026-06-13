"use client";

import { useState, useEffect } from "react";
import {
    AlertTriangle,
    Upload,
    Calendar,
    MapPin,
    CheckCircle2,
    Activity,
    Users
} from "lucide-react";
import { uploadEvidence } from "@/lib/uploadClient";
import { SSOMA_LOCATIONS } from "@/lib/locations";
import { ACTOS_LIST, CONDICIONES_LIST } from "@/lib/categories";
import SearchableSelect from "@/components/SearchableSelect";
import InstallPWAPrompt from "@/components/InstallPWAPrompt";

export default function PublicReporteACPage() {
    const [sctrNames, setSctrNames] = useState<{id: string, label: string}[]>([]);
    
    // Form State
    const [form, setForm] = useState<{
        date: string;
        responsible: string;
        location: string;
        descripcion: string;
        accion_inmediata: string;
        type: 'acto' | 'condicion';
        actos_checked: string[];
        condiciones_checked: string[];
    }>({
        date: new Date().toISOString().split('T')[0],
        responsible: '',
        location: '',
        descripcion: '',
        accion_inmediata: '',
        type: 'acto',
        actos_checked: [],
        condiciones_checked: []
    });
    
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchNames = async () => {
            try {
                const res = await fetch('/api/sctr-names');
                const data = await res.json();
                if (data.success && data.names) {
                    setSctrNames(data.names.map((n: string) => ({ id: n, label: n })));
                }
            } catch (e) {
                console.error("Error fetching SCTR names:", e);
            }
        };
        fetchNames();
    }, []);

    const handleSave = async () => {
        if (form.actos_checked.length === 0 && form.condiciones_checked.length === 0) {
            alert("Debe seleccionar al menos una clasificación de Acto o Condición.");
            return;
        }

        if (!form.responsible || !form.location) {
            alert("Debe completar Responsable y Lugar.");
            return;
        }

        setIsUploading(true);
        try {
            let uploadedUrl = "";
            if (pdfFile) {
                uploadedUrl = await uploadEvidence(
                    pdfFile,
                    'ActosInseguros' as any,
                    'Reporte_TOP_Publico',
                    form.date,
                    form.responsible,
                    'EVID',
                    'SEGURIDAD',
                    form.location
                );
            }

            const newRecords: any[] = [];
            const baseId = Date.now();

            form.actos_checked.forEach((actoStr, i) => {
                newRecords.push({
                    id: baseId + i,
                    date: form.date,
                    responsible: form.responsible,
                    location: form.location,
                    acto: actoStr,
                    condicion: '',
                    cantidad: 1,
                    pdfUrl: uploadedUrl,
                    accion_inmediata: form.accion_inmediata,
                    descripcion: form.descripcion
                });
            });

            form.condiciones_checked.forEach((condStr, i) => {
                newRecords.push({
                    id: baseId + 1000 + i,
                    date: form.date,
                    responsible: form.responsible,
                    location: form.location,
                    acto: '',
                    condicion: condStr,
                    cantidad: 1,
                    pdfUrl: uploadedUrl,
                    accion_inmediata: form.accion_inmediata,
                    descripcion: form.descripcion
                });
            });

            await fetch('/api/reporte-ac-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: newRecords, userName: form.responsible })
            });

            setSubmitted(true);
        } catch (error) {
            console.error("Save error:", error);
            alert("❌ Error al guardar el reporte.");
        } finally {
            setIsUploading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-2xl text-center max-w-md w-full">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} className="text-green-500" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">¡Reporte Enviado!</h2>
                    <p className="text-slate-400 mb-8">Gracias por contribuir a la seguridad. Su reporte ha sido registrado exitosamente.</p>
                    <button 
                        onClick={() => {
                            setSubmitted(false);
                            setForm({
                                ...form,
                                actos_checked: [],
                                condiciones_checked: [],
                                accion_inmediata: '',
                                descripcion: '',
                                responsible: '',
                                location: ''
                            });
                            setPdfFile(null);
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-full transition-colors"
                    >
                        Enviar Otro Reporte
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-4 pb-20">
            <InstallPWAPrompt />
            <div className="max-w-2xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="bg-gradient-to-br from-orange-600 to-orange-800 p-6 sm:p-8 rounded-[2rem] relative overflow-hidden shadow-2xl">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <AlertTriangle size={32} className="text-white" />
                            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tighter">
                                Reporte TOP
                            </h1>
                        </div>
                        <p className="text-white/80 font-medium text-sm sm:text-base">
                            Tarjeta de Observación Preventiva - Acceso Libre
                        </p>
                    </div>
                </div>

                <div className="bg-[#1c222b] border border-slate-700/50 p-5 sm:p-8 rounded-[2rem] shadow-2xl space-y-6 relative">
                    
                    <div className="grid grid-cols-1 gap-4">
                        <div className="border border-[#b35922] rounded-xl p-3 bg-transparent flex flex-col justify-center">
                            <label className="text-[10px] text-slate-400 uppercase flex items-center gap-2 mb-1"><Calendar size={12}/> Fecha:</label>
                            <input type="date" value={form.date} onChange={e=>setForm({...form, date: e.target.value})} className="bg-transparent text-white text-sm font-bold outline-none" />
                        </div>
                        
                        <div className="border border-[#b35922] rounded-xl p-3 bg-transparent flex flex-col justify-center">
                            <label className="text-[10px] text-slate-400 uppercase flex items-center gap-2 mb-1"><Users size={12}/> Reportado Por (Búsqueda SCTR):</label>
                            <SearchableSelect 
                                options={sctrNames}
                                value={form.responsible}
                                onChange={(val) => setForm({...form, responsible: val})}
                                placeholder="Escribe tu nombre..."
                                className="[&>div]:bg-[#1c222b] [&>div]:border-none [&>div]:p-0"
                            />
                        </div>
                        
                        <div className="border border-[#b35922] rounded-xl p-3 bg-transparent flex flex-col justify-center">
                            <label className="text-[10px] text-slate-400 uppercase flex items-center gap-2 mb-1"><MapPin size={12}/> Ubicación:</label>
                            <select value={form.location} onChange={e=>setForm({...form, location: e.target.value})} className="bg-[#1c222b] text-white text-sm font-bold outline-none border-none">
                                <option value="">Seleccionar...</option>
                                {SSOMA_LOCATIONS.map((r: string)=><option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="border border-[#b35922] rounded-xl p-4 bg-transparent">
                        <label className="text-xs text-slate-400 mb-2 block">Descripción detallada de la observación...</label>
                        <textarea value={form.descripcion} onChange={e=>setForm({...form, descripcion: e.target.value})} className="w-full bg-transparent text-white text-sm outline-none resize-none h-20" placeholder="Ingresar detalles aquí..." />
                    </div>

                    <div className="border border-[#b35922] rounded-xl p-4 bg-transparent">
                        <label className="text-xs text-slate-400 mb-2 block">Acción Inmediata (Opcional)</label>
                        <textarea value={form.accion_inmediata} onChange={e=>setForm({...form, accion_inmediata: e.target.value})} className="w-full bg-transparent text-white text-sm outline-none resize-none h-16" placeholder="Describir acción..." />
                    </div>

                    <div className="flex justify-center mt-6 mb-4">
                        <div className="flex bg-[#232a35] rounded-full p-1 border border-slate-700/50 w-full relative">
                            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#f97316] rounded-full transition-all duration-300 shadow-md ${form.type === 'acto' ? 'left-1' : 'left-[calc(50%+4px)]'}`}></div>
                            <button type="button" onClick={() => setForm({...form, type: 'acto'})} className={`relative flex-1 px-2 py-2.5 text-xs font-bold uppercase tracking-wider z-10 flex items-center justify-center gap-1 sm:gap-2 transition-colors ${form.type === 'acto' ? 'text-black' : 'text-slate-400 hover:text-slate-200'}`}>
                                <CheckCircle2 size={14} /> Actos
                            </button>
                            <button type="button" onClick={() => setForm({...form, type: 'condicion'})} className={`relative flex-1 px-2 py-2.5 text-xs font-bold uppercase tracking-wider z-10 transition-colors ${form.type === 'condicion' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                                Condiciones
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {(form.type === 'acto' ? ACTOS_LIST : CONDICIONES_LIST).map(item => {
                            const isChecked = form.type === 'acto' ? form.actos_checked.includes(item) : form.condiciones_checked.includes(item);
                            return (
                                <label key={item} className={`relative flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-all aspect-square justify-center items-center text-center gap-2 ${isChecked ? 'border-[#f97316] bg-[#f97316]/10 shadow-[0_0_15px_rgba(249,115,22,0.15)] scale-[1.02]' : 'border-slate-700 bg-transparent hover:border-slate-500 hover:bg-slate-800/50'}`}>
                                    <div className="absolute top-2 right-2">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-[#f97316] border-[#f97316]' : 'border-slate-500 bg-transparent'}`}>
                                            {isChecked && <CheckCircle2 size={12} className="text-white" />}
                                        </div>
                                    </div>
                                    <AlertTriangle size={20} className={isChecked ? 'text-[#f97316]' : 'text-slate-500'} />
                                    <span className={`text-[9px] sm:text-[10px] font-bold leading-tight ${isChecked ? 'text-white' : 'text-slate-300'}`}>{item}</span>
                                    <input 
                                        type="checkbox" 
                                        className="hidden"
                                        checked={isChecked}
                                        onChange={(e) => {
                                            const list = form.type === 'acto' ? form.actos_checked : form.condiciones_checked;
                                            const newChecked = e.target.checked ? [...list, item] : list.filter(x => x !== item);
                                            if (form.type === 'acto') setForm({...form, actos_checked: newChecked});
                                            else setForm({...form, condiciones_checked: newChecked});
                                        }}
                                    />
                                </label>
                            );
                        })}
                    </div>

                    <div className="space-y-1 pt-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Evidencia (Opcional)</label>
                        <div className="relative group" onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) { setPdfFile(e.dataTransfer.files[0]); } }}>
                            <input type="file" accept="image/*,.pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full" />
                            <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${isDragging ? 'border-[#f97316] bg-[#f97316]/20' : pdfFile ? 'border-[#f97316]/50 bg-transparent' : 'border-slate-700 bg-transparent group-hover:border-[#f97316]/50'}`}>
                                <Upload className={`mx-auto mb-2 ${isDragging || pdfFile ? 'text-[#f97316]' : 'text-slate-600'} ${isDragging ? 'animate-bounce' : ''}`} size={20} />
                                <p className={`text-[10px] font-bold uppercase tracking-tighter ${isDragging ? 'text-[#f97316]' : 'text-slate-500'}`}>
                                    {isDragging ? '¡SUELTA EL ARCHIVO AQUÍ!' : pdfFile ? pdfFile.name : 'Subir Foto o PDF'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button 
                            onClick={handleSave}
                            disabled={isUploading}
                            className="w-full bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] hover:from-[#ff8c00] hover:to-[#ffa600] text-white font-bold py-4 px-8 rounded-2xl shadow-[0_0_20px_rgba(255,107,0,0.4)] hover:shadow-[0_0_30px_rgba(255,107,0,0.6)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-lg"
                        >
                            {isUploading ? <Activity className="animate-spin" size={24} /> : null}
                            Registrar Reporte
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
