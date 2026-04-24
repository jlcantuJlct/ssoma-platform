"use client";

import { useState, useEffect } from "react";
import {
    Activity,
    Upload,
    Trash2,
    FileText,
    Eye,
    X,
    Save,
    Calendar,
    Thermometer,
    Wind,
    Zap,
    Ear
} from "lucide-react";
import { getDriveViewerUrl } from '@/lib/utils';
import { uploadEvidence } from "@/lib/uploadClient";
import { useAuth } from "@/lib/auth";

type MonitoringRecord = {
    id: number;
    date: string;
    agentType: 'Físico' | 'Químico' | 'Ergonómico' | 'Psicosocial' | 'Biológico';
    parameter: string; // Ej: Ruido, Polvo, Iluminación
    location: string;
    files: string[];
};

export default function MonitoringPage() {
    const { user } = useAuth();
    const [records, setRecords] = useState<MonitoringRecord[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        agentType: 'Físico' as const,
        parameter: '',
        location: ''
    });
    const [files, setFiles] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [previewFile, setPreviewFile] = useState<{ url: string, type: 'pdf' | 'image' } | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('monitoring_records_v1');
        if (stored) {
            try { setRecords(JSON.parse(stored)); } catch (e) { }
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('monitoring_records_v1', JSON.stringify(records));
        }
    }, [records, isLoaded]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputFiles = e.target.files;
        if (!inputFiles) return;
        try {
            setIsUploading(true);
            const uploadedUrls: string[] = [];
            for (const file of Array.from(inputFiles)) {
                const url = await uploadEvidence(file, 'MONITOREO', `INF_${form.parameter.replace(/\s+/g, '_')}`, form.date, user?.name || 'S/N', 'monitoreo', 'higiene', form.location, 'Monitoreo Ocupacional');
                uploadedUrls.push(url);
            }
            setFiles(prev => [...prev, ...uploadedUrls]);
        } catch (error: any) { alert(error.message); }
        finally { setIsUploading(false); }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (files.length === 0) return alert("Subir el informe de monitoreo (PDF).");
        const newRecord: MonitoringRecord = { id: Date.now(), ...form, files };
        setRecords(prev => [newRecord, ...prev]);
        setForm(prev => ({ ...prev, parameter: '', location: '' }));
        setFiles([]);
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-[1400px] mx-auto space-y-6">
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4 mb-2">
                                <Activity size={40} className="text-rose-500" />
                                14 Monitoreos Ocupacionales SSTMA
                            </h1>
                            <p className="text-slate-400 font-bold max-w-2xl">Gestión de informes de monitoreo de agentes físicos, químicos, biológicos y ergonómicos.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-1">
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase">Fecha del Monitoreo</label>
                                        <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-rose-500 outline-none" required />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase">Tipo de Agente</label>
                                        <select value={form.agentType} onChange={e => setForm({...form, agentType: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-rose-500 outline-none">
                                            <option value="Físico">Físico (Ruido, Iluminación, etc)</option>
                                            <option value="Químico">Químico (Polvo, Gases)</option>
                                            <option value="Ergonómico">Ergonómico (Posturas, Cargas)</option>
                                            <option value="Psicosocial">Psicosocial</option>
                                            <option value="Biológico">Biológico</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase">Parámetro Medido</label>
                                        <input type="text" placeholder="Ej: Ruido Ocupacional, Polvo Inhalable..." value={form.parameter} onChange={e => setForm({...form, parameter: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-rose-500 outline-none" required />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase">Ubicación / Área</label>
                                        <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-rose-500 outline-none" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase">Cargar Informe (PDF)</label>
                                        <div className="border-2 border-dashed border-slate-800 rounded-2xl p-6 hover:bg-slate-800/50 transition-all text-center group cursor-pointer relative">
                                            <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            <Upload className="mx-auto text-slate-600 group-hover:text-rose-500 mb-2" size={24} />
                                            <p className="text-[10px] font-bold text-slate-500">SUBIR INFORME TÉCNICO</p>
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black uppercase py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98]">
                                        {isUploading ? "Subiendo..." : "Guardar Informe"}
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div className="xl:col-span-2">
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl min-h-[600px]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center gap-4">
                                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400"><Ear size={20} /></div>
                                        <div><p className="text-[10px] font-bold text-slate-500 uppercase">Físicos</p><p className="text-xl font-black text-white">{records.filter(r => r.agentType === 'Físico').length}</p></div>
                                    </div>
                                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center gap-4">
                                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400"><Wind size={20} /></div>
                                        <div><p className="text-[10px] font-bold text-slate-500 uppercase">Químicos</p><p className="text-xl font-black text-white">{records.filter(r => r.agentType === 'Químico').length}</p></div>
                                    </div>
                                </div>
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-black text-slate-500 uppercase border-b border-slate-800">
                                            <th className="pb-4">Fecha</th>
                                            <th className="pb-4">Agente</th>
                                            <th className="pb-4">Parámetro</th>
                                            <th className="pb-4 text-center">Informe</th>
                                            <th className="pb-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {records.map(r => (
                                            <tr key={r.id} className="group hover:bg-slate-800/30">
                                                <td className="py-4 text-xs font-mono text-slate-400">{r.date}</td>
                                                <td className="py-4">
                                                    <span className="text-[10px] font-bold text-white uppercase">{r.agentType}</span>
                                                </td>
                                                <td className="py-4 text-sm font-bold text-slate-300">{r.parameter}</td>
                                                <td className="py-4 text-center">
                                                    {r.files.map((f, i) => (
                                                        <button key={i} onClick={() => setPreviewFile({url: f, type: 'pdf'})} className="p-2 bg-slate-800 text-rose-400 rounded-lg"><FileText size={16} /></button>
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
