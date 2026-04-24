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
    Package
} from "lucide-react";
import { generateFilename, getDriveViewerUrl, getInitials } from '@/lib/utils';
import jsPDF from 'jspdf';
import { uploadEvidence } from "@/lib/uploadClient";
import { SSOMA_LOCATIONS } from "@/lib/locations";
import { useAuth } from "@/lib/auth";

// --- TYPES ---
type EPPRecord = {
    id: number;
    date: string;
    responsible: string;
    worker: string;
    location: string;
    items: string;
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
        responsible: '',
        worker: '',
        location: '',
        items: ''
    });
    const [files, setFiles] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [previewFile, setPreviewFile] = useState<{ url: string, type: 'pdf' | 'image' } | null>(null);

    // --- EFFECT: LOAD/SAVE ---
    useEffect(() => {
        const stored = localStorage.getItem('epp_records_v1');
        if (stored) {
            try {
                setRecords(JSON.parse(stored));
            } catch (e) { console.error(e); }
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('epp_records_v1', JSON.stringify(records));
        }
    }, [records, isLoaded]);

    // --- HANDLERS ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputFiles = e.target.files;
        if (!inputFiles) return;

        if (!form.worker || !form.location) {
            alert("⚠️ Por favor completa el nombre del trabajador y el lugar antes de subir el archivo.");
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
                    `ENTREGA_EPP_${form.worker.replace(/\s+/g, '_')}`,
                    form.date,
                    form.responsible || user?.name || 'S/N',
                    'epp',
                    'seguridad',
                    form.location,
                    'Entrega de EPP'
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
            alert("Debe subir al menos un archivo de evidencia (Cargo de Entrega).");
            return;
        }

        const newRecord: EPPRecord = {
            id: Date.now(),
            ...form,
            responsible: form.responsible || user?.name || 'S/N',
            files: files
        };

        setRecords(prev => [newRecord, ...prev]);
        setForm(prev => ({ ...prev, worker: '', items: '' }));
        setFiles([]);
        alert("Registro de EPP guardado correctamente.");
    };

    const handleDelete = (id: number) => {
        if (confirm("¿Eliminar este registro?")) {
            setRecords(prev => prev.filter(r => r.id !== id));
        }
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
                                06 Control de Entrega de EPP
                            </h1>
                            <p className="text-slate-400 font-bold max-w-2xl">
                                Gestión y trazabilidad de Equipos de Protección Personal. Registre la entrega y cargue los cargos firmados como evidencia de cumplimiento.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Form */}
                        <div className="xl:col-span-1">
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl sticky top-6">
                                <h3 className="text-blue-400 font-black uppercase text-sm tracking-widest mb-6 flex items-center gap-2">
                                    <Save size={18} /> Nuevo Registro de Entrega
                                </h3>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Fecha de Entrega</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-2.5 text-slate-600" size={16} />
                                                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none" required />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Trabajador</label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-2.5 text-slate-600" size={16} />
                                                <input type="text" placeholder="Nombre completo..." value={form.worker} onChange={e => setForm({...form, worker: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none" required />
                                            </div>
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

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">EPPs Entregados</label>
                                            <div className="relative">
                                                <Package className="absolute left-3 top-2.5 text-slate-600" size={16} />
                                                <input type="text" placeholder="Casco, guantes, botas..." value={form.items} onChange={e => setForm({...form, items: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase">Cargo de Entrega (PDF/Imagen)</label>
                                        <div className="border-2 border-dashed border-slate-800 rounded-2xl p-6 hover:bg-slate-800/50 transition-all text-center group cursor-pointer relative">
                                            <input type="file" multiple onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            <Upload className="mx-auto text-slate-600 group-hover:text-blue-500 mb-2" size={24} />
                                            <p className="text-[10px] font-bold text-slate-500 group-hover:text-slate-300">SUBIR EVIDENCIA FIRMADA</p>
                                        </div>
                                    </div>

                                    {files.length > 0 && (
                                        <div className="flex flex-wrap gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                                            {files.map((f, i) => (
                                                <div key={i} className="relative w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700">
                                                    {f.includes('.pdf') ? <FileText size={20} className="text-red-400" /> : <Eye size={20} className="text-blue-400" />}
                                                    <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={8} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                        {isUploading ? "Subiendo..." : <><Save size={18} /> Registrar Entrega</>}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* List */}
                        <div className="xl:col-span-2">
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl min-h-[600px]">
                                <h3 className="text-white font-black text-lg mb-6 flex items-center gap-2">
                                    <FileText size={20} className="text-slate-500" /> Historial de Entregas
                                </h3>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[10px] font-black text-slate-500 uppercase border-b border-slate-800">
                                                <th className="pb-4">Fecha</th>
                                                <th className="pb-4">Trabajador</th>
                                                <th className="pb-4">Lugar</th>
                                                <th className="pb-4">EPPs</th>
                                                <th className="pb-4 text-center">Documentos</th>
                                                <th className="pb-4 text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {records.map(r => (
                                                <tr key={r.id} className="group hover:bg-slate-800/30 transition-colors">
                                                    <td className="py-4 text-xs font-mono text-slate-400">{r.date}</td>
                                                    <td className="py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-black border border-blue-500/30">
                                                                {getInitials(r.worker)}
                                                            </div>
                                                            <span className="text-sm font-bold text-white">{r.worker}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-xs text-slate-400">{r.location}</td>
                                                    <td className="py-4 text-xs text-slate-500 italic max-w-[150px] truncate" title={r.items}>{r.items || '-'}</td>
                                                    <td className="py-4">
                                                        <div className="flex justify-center -space-x-2">
                                                            {r.files.map((f, i) => (
                                                                <button key={i} onClick={() => setPreviewFile({url: f, type: f.includes('.pdf') ? 'pdf' : 'image'})} className="w-8 h-8 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center hover:z-10 hover:scale-110 transition-transform">
                                                                    {f.includes('.pdf') ? <FileText size={14} className="text-red-400" /> : <Eye size={14} className="text-blue-400" />}
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
                                                    <td colSpan={6} className="py-20 text-center text-slate-600 font-bold uppercase text-xs tracking-widest">No hay registros de entrega</td>
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
                                <Eye size={16} className="text-blue-400" /> Vista de Documento
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
