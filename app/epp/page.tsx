"use client";

import { useState, useEffect } from "react";
import {
    ShieldCheck,
    Upload,
    Trash2,
    FileText,
    Eye,
    X,
    Save,
    Calendar,
    User,
    MapPin,
    Package,
    CheckCircle2
} from "lucide-react";
import { generateFilename, getDriveViewerUrl, getInitials } from '@/lib/utils';
import jsPDF from 'jspdf';
import { uploadEvidence } from "@/lib/uploadClient";
import { SSOMA_LOCATIONS } from "@/lib/locations";
import { useAuth } from "@/lib/auth";

import { 
    RESPONSIBLES 
} from "@/lib/categories";
import SearchableSelect from "@/components/SearchableSelect";

// --- TYPES ---
type EPPRecord = {
    id: number;
    month: string; // YYYY-MM
    date: string;
    responsible: string;
    location: string;
    description: string;
    files: string[];
};

export default function EPPPage() {
    const { user } = useAuth();

    // --- STATE ---
    const [records, setRecords] = useState<EPPRecord[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Form State
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        month: new Date().toISOString().substring(0, 7),
        responsible: '',
        location: '',
        description: ''
    });
    const [filterLocation, setFilterLocation] = useState('');
    const [filterResponsible, setFilterResponsible] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [files, setFiles] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [previewFile, setPreviewFile] = useState<{ url: string, type: 'pdf' | 'image' } | null>(null);

    // --- EFFECT: LOAD/SAVE ---
    useEffect(() => {
        const stored = localStorage.getItem('epp_records_v2');
        if (stored) {
            try {
                setRecords(JSON.parse(stored));
            } catch (e) { console.error(e); }
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('epp_records_v2', JSON.stringify(records));
        }
    }, [records, isLoaded]);

    // --- HANDLERS ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputFiles = e.target.files;
        if (!inputFiles) return;

        if (!form.responsible || !form.location) {
            alert("⚠️ Por favor selecciona el responsable y el lugar antes de subir el PDF.");
            e.target.value = '';
            return;
        }

        try {
            setIsUploading(true);
            const uploadedUrls: string[] = [];
            const filesArray = Array.from(inputFiles);

            for (const file of filesArray) {
                const url = await uploadEvidence(
                    file,
                    'EPP',
                    `EPP_MENSUAL_${form.month}_${form.responsible.replace(/\s+/g, '_')}`,
                    form.date,
                    form.responsible,
                    'epp',
                    'seguridad',
                    form.location,
                    'Control Mensual de EPP'
                );
                uploadedUrls.push(url);
            }

            setFiles(prev => [...prev, ...uploadedUrls]);
        } catch (error: any) {
            alert(`Error al subir: ${error.message}`);
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (files.length === 0) {
            alert("Debe subir al menos un PDF de Cargo de Entrega.");
            return;
        }

        const newRecord: EPPRecord = {
            id: Date.now(),
            ...form,
            files: files
        };

        setRecords(prev => [newRecord, ...prev]);
        setForm(prev => ({ ...prev, description: '' }));
        setFiles([]);
        alert("Registro mensual de EPP guardado correctamente.");
    };

    const handleDelete = (id: number) => {
        if (confirm("¿Eliminar este registro mensual?")) {
            setRecords(prev => prev.filter(r => r.id !== id));
        }
    };

    const getMonthLabel = (monthStr: string) => {
        const [year, month] = monthStr.split('-');
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${months[parseInt(month) - 1]} ${year}`;
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-[1400px] mx-auto space-y-6">
                    
                    {/* Header */}
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-3xl -mr-32 -mt-32 rounded-full"></div>
                        <div className="relative z-10">
                            <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4 mb-2">
                                <ShieldCheck size={40} className="text-blue-500" />
                                06 Control Mensual de EPP
                            </h1>
                            <p className="text-slate-400 font-bold max-w-2xl">
                                Gestión de documentos consolidados de entrega de EPP. Cargue los escaneos mensuales (PDF) de los cargos firmados por sede.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Form */}
                        <div className="xl:col-span-1">
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl sticky top-6">
                                <h3 className="text-blue-400 font-black uppercase text-sm tracking-widest mb-6 flex items-center gap-2">
                                    <Save size={18} /> Nuevo Documento Mensual
                                </h3>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase">Mes del Control</label>
                                                <input 
                                                    type="month" 
                                                    value={form.month} 
                                                    onChange={e => setForm({...form, month: e.target.value})} 
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none" 
                                                    required 
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase">Fecha Registro</label>
                                                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none" required />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Responsable de Entrega</label>
                                            <SearchableSelect
                                                options={RESPONSIBLES}
                                                value={form.responsible}
                                                onChange={(val) => setForm({ ...form, responsible: val })}
                                                placeholder="Seleccionar Responsable..."
                                                icon={<User size={16} />}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Lugar / Sede</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-2.5 text-slate-600" size={16} />
                                                <select value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none appearance-none" required>
                                                    <option value="">Seleccionar...</option>
                                                    {SSOMA_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Descripción / Título del Lote</label>
                                            <input 
                                                type="text" 
                                                placeholder="Ej: Entrega de Botas y Cascos Abril 2024" 
                                                value={form.description} 
                                                onChange={e => setForm({...form, description: e.target.value})} 
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none" 
                                            />
                                            <div className="flex gap-2">
                                                <button 
                                                    type="button"
                                                    onClick={() => setForm({...form, description: 'EPP nuevo o recambio'})}
                                                    className="flex-1 text-[9px] font-black uppercase py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-blue-600/20 hover:border-blue-500/50 transition-all text-slate-400 hover:text-blue-400"
                                                >
                                                    EPP nuevo o recambio
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => setForm({...form, description: 'EPP rutinario'})}
                                                    className="flex-1 text-[9px] font-black uppercase py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-emerald-600/20 hover:border-emerald-500/50 transition-all text-slate-400 hover:text-emerald-400"
                                                >
                                                    EPP rutinario
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* DRAG & DROP AREA - ESTILO ESTANDARIZADO PREMIUM */}
                                    <div className="space-y-1.5 pt-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                            Cargo de Entrega (PDF)
                                        </label>
                                        <div 
                                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                            onDragLeave={() => setIsDragging(false)}
                                            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e as any); }}
                                            className={`relative border-2 border-dashed rounded-3xl p-8 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group ${
                                                isUploading ? 'border-amber-500 bg-amber-500/5 cursor-wait' :
                                                isDragging ? 'border-blue-500 bg-blue-500/10 scale-[1.01]' : 
                                                files.length > 0 ? 'border-blue-500/30 bg-blue-500/5' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/30'
                                            }`}
                                        >
                                            <input 
                                                type="file"
                                                multiple
                                                accept=".pdf"
                                                disabled={isUploading}
                                                onChange={handleFileUpload}
                                                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-wait"
                                            />
                                            <div className={`p-4 rounded-2xl transition-all ${
                                                isUploading ? 'bg-amber-500 text-white animate-pulse' :
                                                isDragging ? 'bg-blue-500 text-white' : 
                                                'bg-slate-800 text-slate-400 group-hover:text-blue-400'
                                            }`}>
                                                {isUploading ? <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={32} />}
                                            </div>
                                            <div className="text-center">
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${isUploading ? 'text-amber-500' : 'text-white'}`}>
                                                    {isUploading ? 'SUBIENDO...' : isDragging ? '¡SUELTA!' : files.length > 0 ? `✅ ${files.length} CARGOS LISTOS` : 'ARRASTRA O HAZ CLIC'}
                                                </p>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">
                                                    Solo archivos PDF firmados
                                                </p>
                                            </div>
                                        </div>

                                        {/* File Previews */}
                                        {files.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-3">
                                                {files.map((url, idx) => (
                                                    <div key={idx} className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2 animate-in zoom-in-95 group">
                                                        <FileText size={12} className="text-red-400" />
                                                        <span className="text-[9px] font-bold text-slate-300">PDF {idx + 1}</span>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))} 
                                                            className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                        {isUploading ? "Subiendo..." : <><Save size={18} /> Guardar Registro Mensual</>}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* List */}
                        <div className="xl:col-span-2">
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl min-h-[600px]">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-4">
                                    <h3 className="text-white font-black text-lg flex items-center gap-2">
                                        <FileText size={20} className="text-slate-500" /> Archivo de Entrega Mensual
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <div className="text-[10px] font-mono text-slate-500 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                                            {records.filter(r => {
                                                const matchesLoc = !filterLocation || r.location === filterLocation;
                                                const matchesResp = !filterResponsible || r.responsible === filterResponsible;
                                                const matchesMonth = !filterMonth || r.month === filterMonth;
                                                return matchesLoc && matchesResp && matchesMonth;
                                            }).length} REGISTROS
                                        </div>
                                    </div>
                                </div>

                                {/* FILTERS */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-slate-800/30 p-4 rounded-2xl border border-slate-800/50 items-end">
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Mes</label>
                                            {filterMonth && (
                                                <button onClick={() => setFilterMonth('')} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <input 
                                            type="month"
                                            value={filterMonth}
                                            onChange={e => setFilterMonth(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Responsable</label>
                                            {filterResponsible && (
                                                <button onClick={() => setFilterResponsible('')} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <SearchableSelect 
                                            options={RESPONSIBLES.map(r => ({ id: r, label: r }))}
                                            value={filterResponsible}
                                            onChange={(val) => setFilterResponsible(val)}
                                            placeholder="Todos los responsables..."
                                            className="[&>div]:bg-slate-950 [&>div]:border-slate-700 [&>div]:py-1.5 [&>div]:px-3 [&>div]:text-[10px]"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Lugar</label>
                                            {filterLocation && (
                                                <button onClick={() => setFilterLocation('')} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <SearchableSelect 
                                            options={SSOMA_LOCATIONS.map(l => ({ id: l, label: l }))}
                                            value={filterLocation}
                                            onChange={(val) => setFilterLocation(val)}
                                            placeholder="Todos los lugares..."
                                            className="[&>div]:bg-slate-950 [&>div]:border-slate-700 [&>div]:py-1.5 [&>div]:px-3 [&>div]:text-[10px]"
                                        />
                                    </div>
                                    <div className="space-y-1 flex flex-col justify-end h-[53px]">
                                        {(filterLocation || filterResponsible || filterMonth) && (
                                            <button 
                                                onClick={() => { setFilterLocation(''); setFilterResponsible(''); setFilterMonth(''); }}
                                                className="w-full h-[33px] bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] font-bold uppercase transition-colors border border-red-500/20 flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                <X size={14} strokeWidth={3} /> Limpiar Filtros
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* RESUMEN MENSUAL */}
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'].map((m, i) => {
                                        const count = records.filter(r => {
                                            const mPart = parseInt(r.month?.split('-')[1] || "0");
                                            return mPart === (i + 1);
                                        }).length;
                                        return (
                                            <div key={m} className={`flex flex-col items-center justify-center min-w-[42px] py-1.5 rounded-xl border ${count > 0 ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-600 opacity-50'}`}>
                                                <span className="text-[7px] font-black uppercase tracking-tighter">{m}</span>
                                                <span className="text-[9px] font-black">{count}</span>
                                            </div>
                                        );
                                    })}
                                    <div className="flex flex-col items-center justify-center min-w-[60px] py-1.5 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 ml-auto">
                                        <span className="text-[7px] font-black uppercase tracking-tighter">TOTAL</span>
                                        <span className="text-[9px] font-black">{records.length}</span>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[10px] font-black text-slate-500 uppercase border-b border-slate-800">
                                                <th className="pb-4">Mes / Periodo</th>
                                                <th className="pb-4">Responsable</th>
                                                <th className="pb-4">Lugar</th>
                                                <th className="pb-4">Descripción</th>
                                                <th className="pb-4 text-center">Archivo PDF</th>
                                                <th className="pb-4 text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {records
                                                .filter(r => {
                                                    const matchesLoc = !filterLocation || r.location === filterLocation;
                                                    const matchesResp = !filterResponsible || r.responsible === filterResponsible;
                                                    const matchesMonth = !filterMonth || r.month === filterMonth;
                                                    return matchesLoc && matchesResp && matchesMonth;
                                                })
                                                .sort((a, b) => b.month.localeCompare(a.month))
                                                .map(r => (
                                                <tr key={r.id} className="group hover:bg-slate-800/30 transition-colors">
                                                    <td className="py-4 text-xs font-black text-blue-400 uppercase tracking-tighter">
                                                        {getMonthLabel(r.month)}
                                                    </td>
                                                    <td className="py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-black border border-blue-500/30">
                                                                {getInitials(r.responsible)}
                                                            </div>
                                                            <span className="text-sm font-bold text-white">{r.responsible}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-xs text-slate-400">{r.location}</td>
                                                    <td className="py-4 text-xs text-slate-500 italic max-w-[150px] truncate" title={r.description}>{r.description || 'Sin descripción'}</td>
                                                    <td className="py-4">
                                                        <div className="flex justify-center gap-2">
                                                            {r.files.map((f, i) => (
                                                                <button key={i} onClick={() => setPreviewFile({url: f, type: 'pdf'})} className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 flex items-center gap-2 hover:bg-red-500/10 hover:border-red-500/50 transition-all text-[10px] font-black text-slate-400 hover:text-red-400">
                                                                    <FileText size={14} /> PDF
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-right">
                                                        <button onClick={() => handleDelete(r.id)} className="p-2 text-slate-600 hover:text-red-400 transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {records.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="py-20 text-center text-slate-600 font-bold uppercase text-xs tracking-widest">No hay documentos cargados</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Preview Modal */}
            {previewFile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setPreviewFile(null)}>
                    <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                            <h3 className="text-white font-bold flex items-center gap-2 uppercase tracking-widest text-xs">
                                <FileText size={16} className="text-red-400" /> Cargo Mensual de EPP
                            </h3>
                            <button onClick={() => setPreviewFile(null)} className="text-slate-400 hover:text-white p-2">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="h-[75vh] w-full">
                            <iframe src={getDriveViewerUrl(previewFile.url, false)} className="w-full h-full border-none" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
