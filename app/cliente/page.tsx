"use client";

import { useState, useEffect } from "react";
import {
    ExternalLink,
    Upload,
    Trash2,
    FileText,
    Eye,
    X,
    Save,
    Calendar,
    User,
    Send
} from "lucide-react";
import { getDriveViewerUrl } from '@/lib/utils';
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
    const [isLoaded, setIsLoaded] = useState(false);
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        subject: '',
        recipient: '',
        type: 'Enviada' as const
    });
    const [files, setFiles] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [previewFile, setPreviewFile] = useState<{ url: string, type: 'pdf' | 'image' } | null>(null);

    // Filter State
    const [filterDate, setFilterDate] = useState("");
    const [filterType, setFilterType] = useState("");
    const [filterSearch, setFilterSearch] = useState("");

    useEffect(() => {
        const stored = localStorage.getItem('client_comm_records_v1');
        if (stored) {
            try { setRecords(JSON.parse(stored)); } catch (e) { }
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('client_comm_records_v1', JSON.stringify(records));
        }
    }, [records, isLoaded]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputFiles = e.target.files;
        if (!inputFiles) return;
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (files.length === 0) return alert("Subir el PDF de la carta.");
        const newRecord: LetterRecord = { id: Date.now(), ...form, files };
        setRecords(prev => [newRecord, ...prev]);
        setForm(prev => ({ ...prev, subject: '', recipient: '' }));
        setFiles([]);
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-[1400px] mx-auto space-y-6">
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4 mb-2">
                                <Send size={40} className="text-cyan-500" />
                                08 Comunicación con Cliente
                            </h1>
                            <p className="text-slate-400 font-bold max-w-2xl">Registro de cartas, oficios y respuestas enviadas/recibidas del cliente.</p>
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
                                    <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98]">
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
                                        {records
                                            .filter(r => {
                                                const matchesDate = !filterDate || r.date === filterDate;
                                                const matchesType = !filterType || r.type === filterType;
                                                const matchesSearch = !filterSearch || r.description.toLowerCase().includes(filterSearch.toLowerCase()) || r.reference.toLowerCase().includes(filterSearch.toLowerCase());
                                                return matchesDate && matchesType && matchesSearch;
                                            })
                                            .map(r => (
                                            <tr key={r.id} className="group hover:bg-slate-800/30">
                                                <td className="py-4 text-xs font-mono text-slate-400">{r.date}</td>
                                                <td className="py-4">
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded ${r.type === 'Enviada' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>{r.type}</span>
                                                </td>
                                                <td className="py-4 text-sm font-bold text-white">{r.subject}</td>
                                                <td className="py-4 text-center">
                                                    {r.files.map((f, i) => (
                                                        <button key={i} onClick={() => setPreviewFile({url: f, type: 'pdf'})} className="p-2 bg-slate-800 text-cyan-400 rounded-lg"><FileText size={16} /></button>
                                                    ))}
                                                </td>
                                                <td className="py-4 text-right">
                                                    <button onClick={() => setRecords(records.filter(x => x.id !== r.id))} className="text-slate-600 hover:text-red-400"><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
