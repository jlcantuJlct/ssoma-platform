"use client";

import { useState, useEffect } from "react";
import {
    Upload,
    Trash2,
    FileText,
    X,
    Send,
    Download,
    DownloadCloud
} from "lucide-react";
import { getDriveViewerUrl, getDriveDownloadUrl, handleBulkDownload } from '@/lib/utils';
import { uploadEvidence } from "@/lib/uploadClient";
import { useAuth } from "@/lib/auth";

type LetterRecord = {
    id: number;
    date: string;
    subject: string;
    recipient: string;
    type: 'Enviada' | 'Recibida';
    files: string[];
};

export default function ClientCommunicationPage() {
    const { user } = useAuth();
    const [records, setRecords] = useState<LetterRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        subject: '',
        recipient: '',
        type: 'Enviada' as const
    });
    const [files, setFiles] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadMsg, setDownloadMsg] = useState('');
    const [previewFile, setPreviewFile] = useState<{ url: string, type: 'pdf' | 'image' } | null>(null);

    // Filter State
    const [filterDate, setFilterDate] = useState("");
    const [filterType, setFilterType] = useState("");
    const [filterSearch, setFilterSearch] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/cliente-comms-records');
            const data = await res.json();
            if (data.success && Array.isArray(data.records)) {
                setRecords(data.records);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFileUpload = async (e: any) => {
        const inputFiles = (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) ? e.dataTransfer.files : e.target?.files;
        if (!inputFiles || inputFiles.length === 0) return;
        try {
            setIsUploading(true);
            const uploadedUrls: string[] = [];
            for (const file of Array.from(inputFiles)) {
                const url = await uploadEvidence(file, 'CLIENTE', `CARTA_${form.subject.substring(0, 15)}`, form.date, user?.name || 'S/N', 'cliente', 'general', 'OFICINA', 'Comunicación con Cliente');
                uploadedUrls.push(url);
            }
            setFiles(prev => [...prev, ...uploadedUrls]);
        } catch (error: any) { alert(error.message); }
        finally { setIsUploading(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (files.length === 0) return alert("Subir el PDF de la carta.");
        
        const newRecord: LetterRecord = { id: Date.now(), ...form, files };
        const allRecords = [newRecord, ...records];
        
        try {
            const res = await fetch('/api/cliente-comms-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: allRecords })
            });
            if (res.ok) {
                setRecords(allRecords);
                setForm(prev => ({ ...prev, subject: '', recipient: '' }));
                setFiles([]);
            }
        } catch (error) {
            console.error('Error saving data:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar este registro?')) return;
        const updated = records.filter(r => r.id !== id);
        try {
            await fetch('/api/cliente-comms-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: updated })
            });
            setRecords(updated);
        } catch (error) {
            console.error('Error deleting record:', error);
        }
    };

    // Calculate filtered records
    const filteredRecords = records.filter(r => {
        const matchesDate = !filterDate || r.date === filterDate;
        const matchesType = !filterType || r.type === filterType;
        const matchesSearch = !filterSearch || 
            (r.subject && r.subject.toLowerCase().includes(filterSearch.toLowerCase())) || 
            (r.recipient && r.recipient.toLowerCase().includes(filterSearch.toLowerCase()));
        return matchesDate && matchesType && matchesSearch;
    });

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-[1400px] mx-auto space-y-6">
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div className="relative z-10">
                            <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4 mb-2">
                                <Send size={40} className="text-cyan-500" />
                                08 Comunicación con Cliente
                            </h1>
                            <p className="text-slate-400 font-bold max-w-2xl">Registro de cartas, oficios y respuestas enviadas/recibidas del cliente.</p>
                        </div>
                        
                        <div className="mt-4 md:mt-0 flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setIsDownloading(true);
                                    // Transform format to match what handleBulkDownload expects
                                    const bulkItems = filteredRecords.map(r => ({
                                        fileUrls: r.files,
                                        date: r.date,
                                        zona: 'CLIENTE',
                                        month: r.date.split('-')[1]
                                    }));
                                    handleBulkDownload(bulkItems, 'Comunicaciones.zip', setDownloadMsg).finally(() => setIsDownloading(false));
                                }}
                                disabled={isDownloading || filteredRecords.length === 0}
                                className="bg-slate-800 hover:bg-cyan-600 disabled:bg-slate-900 text-white px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all border border-slate-700"
                            >
                                {isDownloading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <DownloadCloud size={18} />}
                                {isDownloading ? (downloadMsg || 'Comprimiendo...') : 'Descargar Visibles'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-1">
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase">Fecha</label>
                                        <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-cyan-500 outline-none" required />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase">Tipo</label>
                                        <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-cyan-500 outline-none">
                                            <option value="Enviada">Carta Enviada (Salida)</option>
                                            <option value="Recibida">Carta Recibida (Entrada)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase">Asunto / N° de Carta</label>
                                        <input type="text" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-cyan-500 outline-none" required />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase">Destinatario / Remitente</label>
                                        <input type="text" value={form.recipient} onChange={e => setForm({...form, recipient: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-cyan-500 outline-none" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase">Cargar PDF</label>
                                        <div className="border-2 border-dashed border-slate-800 rounded-2xl p-6 hover:bg-slate-800/50 transition-all text-center group cursor-pointer relative">
                                            <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            <Upload className="mx-auto text-slate-600 group-hover:text-cyan-500 mb-2" size={24} />
                                            <p className="text-[10px] font-bold text-slate-500">CLICK PARA SUBIR</p>
                                        </div>
                                    </div>
                                    <button type="submit" disabled={isUploading || files.length === 0} className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-black uppercase py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98]">
                                        {isUploading ? "Subiendo..." : "Registrar Comunicación"}
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div className="xl:col-span-2">
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl min-h-[600px]">
                                {/* FILTERS GRID */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-slate-950/50 p-4 rounded-2xl border border-slate-800 items-end">
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Fecha</label>
                                            {filterDate && (
                                                <button onClick={() => setFilterDate("")} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <input 
                                            type="date"
                                            value={filterDate}
                                            onChange={e => setFilterDate(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-cyan-500 outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Tipo</label>
                                            {filterType && (
                                                <button onClick={() => setFilterType("")} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <select 
                                            value={filterType}
                                            onChange={e => setFilterType(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-cyan-500 outline-none"
                                        >
                                            <option value="">Todos los Tipos...</option>
                                            <option value="Enviada">Carta Enviada</option>
                                            <option value="Recibida">Carta Recibida</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase">Buscar Asunto/Remitente</label>
                                            {filterSearch && (
                                                <button onClick={() => setFilterSearch("")} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <input 
                                            type="text"
                                            placeholder="Palabra clave..."
                                            value={filterSearch}
                                            onChange={e => setFilterSearch(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-cyan-500 outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="flex flex-col justify-end h-full">
                                        {(filterDate || filterType || filterSearch) && (
                                            <button 
                                                onClick={() => { setFilterDate(""); setFilterType(""); setFilterSearch(""); }}
                                                className="w-full h-[33px] bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] font-bold uppercase transition-colors border border-red-500/20 flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                <X size={14} strokeWidth={3} /> Limpiar
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* RESUMEN MENSUAL */}
                                <div className="flex flex-wrap gap-2 mb-8 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
                                    {['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'].map((m, i) => {
                                        const count = records.filter(r => {
                                            const mPart = parseInt(r.date?.split('-')[1] || "0");
                                            return mPart === (i + 1);
                                        }).length;
                                        return (
                                            <div key={m} className={`flex-1 flex flex-col items-center justify-center min-w-[45px] py-2 rounded-xl border transition-all ${count > 0 ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-slate-950/50 border-slate-800/50 text-slate-600 opacity-40'}`}>
                                                <span className="text-[7px] font-black uppercase tracking-tighter mb-0.5">{m}</span>
                                                <span className="text-[10px] font-black">{count}</span>
                                            </div>
                                        );
                                    })}
                                    <div className="flex flex-col items-center justify-center min-w-[70px] py-2 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 ml-auto">
                                        <span className="text-[7px] font-black uppercase tracking-tighter">TOTAL</span>
                                        <span className="text-[10px] font-black">{records.length}</span>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="flex justify-center items-center py-20">
                                        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[10px] font-black text-slate-500 uppercase border-b border-slate-800">
                                                <th className="pb-4">Fecha</th>
                                                <th className="pb-4">Tipo</th>
                                                <th className="pb-4">Asunto / Referencia</th>
                                                <th className="pb-4 text-center">Docs</th>
                                                <th className="pb-4 text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {filteredRecords.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="py-10 text-center text-slate-500 text-xs font-bold uppercase">
                                                        No hay registros disponibles
                                                    </td>
                                                </tr>
                                            ) : filteredRecords.map(r => (
                                                <tr key={r.id} className="group hover:bg-slate-800/30">
                                                    <td className="py-4 text-xs font-mono text-slate-400">{r.date}</td>
                                                    <td className="py-4">
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded ${r.type === 'Enviada' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>{r.type}</span>
                                                    </td>
                                                    <td className="py-4">
                                                        <p className="text-sm font-bold text-white">{r.subject}</p>
                                                        <p className="text-[10px] text-slate-500">{r.recipient}</p>
                                                    </td>
                                                    <td className="py-4 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            {r.files && r.files.length > 0 && r.files.map((f, i) => (
                                                                <div key={i} className="flex gap-1">
                                                                    <button onClick={() => setPreviewFile({url: f, type: 'pdf'})} className="p-1.5 bg-slate-800 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-all" title="Ver Documento">
                                                                        <FileText size={14} />
                                                                    </button>
                                                                    <a href={getDriveDownloadUrl(f)} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-800 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-all" title="Descargar">
                                                                        <Download size={14} />
                                                                    </a>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-right">
                                                        <button onClick={() => handleDelete(r.id)} className="p-1.5 bg-slate-800/50 hover:bg-red-500/20 text-slate-600 hover:text-red-400 rounded-lg transition-all"><Trash2 size={14} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            {previewFile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setPreviewFile(null)}>
                    <div className="relative w-full max-w-5xl bg-slate-900 rounded-3xl overflow-hidden h-[80vh]" onClick={e => e.stopPropagation()}>
                        <iframe src={getDriveViewerUrl(previewFile.url, false)} className="w-full h-full border-none" />
                    </div>
                </div>
            )}
        </div>
    );
}
