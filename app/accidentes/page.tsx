"use client";

import { useState, useEffect } from "react";
import {
    Siren,
    Upload,
    Trash2,
    Eye,
    X,
    Save,
    Calendar,
    User,
    MapPin,
    AlertTriangle,
    FileText,
    Clock,
    Download,
    DownloadCloud,
    RotateCcw
} from "lucide-react";
import SearchableSelect from "@/components/SearchableSelect";
import { getDriveViewerUrl, getDriveDownloadUrl, handleBulkDownload } from '@/lib/utils';
import { exportTableToPDF, exportRecordToPDF } from '@/lib/pdfExport';
import { uploadEvidence } from "@/lib/uploadClient";
import { SSOMA_LOCATIONS } from "@/lib/locations";
import { useAuth, USER_LIST } from "@/lib/auth";

// --- TYPES ---
type AccidenteRecord = {
    id: number;
    date: string;
    time: string;
    location: string;
    type: string;
    description: string;
    involvedPerson: string;
    files: string[];
};

const ACCIDENT_TYPES = [
    "Incidente Leve",
    "Incidente Peligroso",
    "Accidente Leve",
    "Accidente Incapacitante",
    "Accidente Mortal",
    "Enfermedad Ocupacional"
];

export default function AccidentesPage() {
    const { user } = useAuth();

    // --- STATE ---
    const [records, setRecords] = useState<AccidenteRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        location: '',
        type: '',
        description: '',
        involvedPerson: ''
    });
    const [filterLocation, setFilterLocation] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterType, setFilterType] = useState('');
    const [files, setFiles] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadMsg, setDownloadMsg] = useState('');
    const [previewFile, setPreviewFile] = useState<{ url: string, type: 'pdf' | 'image' } | null>(null);

    // --- EFFECT: LOAD ---
    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/accidentes-records');
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

    // --- HANDLERS ---
    const handleFileUpload = async (e: any) => {
        const inputFiles = (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) ? e.dataTransfer.files : e.target?.files;
        if (!inputFiles || inputFiles.length === 0) return;

        if (!form.location || !form.type) {
            alert("⚠️ Por favor completa el lugar y el tipo de evento antes de subir el archivo.");
            if (e.target && e.target.type === 'file') e.target.value = '';
            return;
        }

        try {
            setIsUploading(true);
            const uploadedUrls: string[] = [];
            const filesArray = Array.from(inputFiles);
            setUploadProgress({ current: 0, total: filesArray.length });

            for (const file of filesArray) {
                setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }));
                const url = await uploadEvidence(
                    file,
                    'REGISTROS',
                    `ACCIDENTE_${form.type.replace(/\s/g, '')}_${Date.now()}`,
                    form.date,
                    user?.name || 'S/N',
                    'registros',
                    'seguridad',
                    form.location,
                    'Control de Accidentes'
                );
                uploadedUrls.push(url);
            }

            setFiles(prev => [...prev, ...uploadedUrls]);
        } catch (error: any) {
            alert(`Error al subir: ${error.message}`);
        } finally {
            setIsUploading(false);
            if (e.target && e.target.type === 'file') e.target.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (files.length === 0) {
            alert("Debe subir al menos una evidencia (PDF/Imagen) del accidente o incidente.");
            return;
        }

        const newRecord: AccidenteRecord = {
            id: Date.now(),
            ...form,
            files: files
        };

        try {
            const res = await fetch('/api/accidentes-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'CREATE', record: newRecord })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setRecords(prev => [newRecord, ...prev]);
                    setForm(prev => ({ ...prev, description: '', involvedPerson: '' }));
                    setFiles([]);
                    alert("Registro guardado correctamente.");
                } else {
                    alert(`Error: ${data.error}`);
                }
            }
        } catch (error) {
            console.error('Error saving data:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Eliminar este registro?")) return;
        try {
            const res = await fetch('/api/accidentes-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DELETE', id })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setRecords(prev => prev.filter(r => r.id !== id));
                }
            }
        } catch (error) {
            console.error('Error deleting data:', error);
        }
    };

    const filteredRecords = records.filter(r => {
        const matchesLoc = !filterLocation || r.location === filterLocation;
        const matchesDate = !filterDate || r.date === filterDate;
        const matchesType = !filterType || r.type === filterType;
        return matchesLoc && matchesDate && matchesType;
    });

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-[1400px] mx-auto space-y-6">
                    
                    {/* Header */}
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 blur-3xl -mr-32 -mt-32 rounded-full"></div>
                        <div className="relative z-10">
                            <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4 mb-2">
                                <Siren size={40} className="text-red-500" />
                                Control de Accidentes
                            </h1>
                            <p className="text-slate-400 font-bold max-w-2xl">
                                Registro formal de accidentes, incidentes y enfermedades ocupacionales. Suba el informe preliminar o informe final en PDF.
                            </p>
                        </div>
                        <div className="mt-4 md:mt-0 flex items-center gap-2 z-10">
                            <button
                                onClick={() => {
                                    setIsDownloading(true);
                                    exportTableToPDF(
                                        'Reporte de Accidentes e Incidentes',
                                        [
                                            { header: 'Fecha', dataKey: 'date' },
                                            { header: 'Hora', dataKey: 'time' },
                                            { header: 'Lugar / Sede', dataKey: 'location' },
                                            { header: 'Tipo', dataKey: 'type' },
                                            { header: 'Severidad', dataKey: 'severity' },
                                            { header: 'Detalle', dataKey: 'detail' }
                                        ],
                                        filteredRecords,
                                        `Accidentes_Reporte_${new Date().toISOString().split('T')[0]}.pdf`
                                    );
                                    setIsDownloading(false);
                                }}
                                disabled={isDownloading || filteredRecords.length === 0}
                                className="bg-slate-800 hover:bg-emerald-600 disabled:bg-slate-900 text-white px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all border border-slate-700"
                            >
                                <DownloadCloud size={18} /> Descargar PDF
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                        {/* Form */}
                        <div className="xl:col-span-1">
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl sticky top-6">
                                <h3 className="text-red-400 font-black uppercase text-sm tracking-widest mb-6 flex items-center gap-2">
                                    <Save size={18} /> Nuevo Registro
                                </h3>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-1 space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Fecha</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-2.5 text-slate-600" size={16} />
                                                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-red-500 outline-none" required />
                                            </div>
                                        </div>

                                        <div className="col-span-1 space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Hora</label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-2.5 text-slate-600" size={16} />
                                                <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-red-500 outline-none" required />
                                            </div>
                                        </div>

                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Lugar / Sede</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-2.5 text-slate-600" size={16} />
                                                <select value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-red-500 outline-none appearance-none" required>
                                                    <option value="">Seleccionar Lugar...</option>
                                                    {SSOMA_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Tipo de Evento</label>
                                            <div className="relative">
                                                <AlertTriangle className="absolute left-3 top-2.5 text-amber-500/50" size={16} />
                                                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-red-500 outline-none appearance-none" required>
                                                    <option value="">Seleccionar Tipo...</option>
                                                    {ACCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Involucrado / Responsable</label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-2.5 text-slate-600" size={16} />
                                                <input type="text" placeholder="Nombre completo..." value={form.involvedPerson} onChange={e => setForm({...form, involvedPerson: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-red-500 outline-none" required />
                                            </div>
                                        </div>

                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Breve Descripción</label>
                                            <textarea 
                                                value={form.description} 
                                                onChange={e => setForm({...form, description: e.target.value})} 
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-red-500 outline-none resize-none h-20" 
                                                placeholder="Describa brevemente el evento..."
                                                required 
                                            />
                                        </div>
                                    </div>

                                    {/* DRAG & DROP AREA */}
                                    <div className="space-y-1.5 pt-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                            Evidencia / Informe (PDF)
                                        </label>
                                        <div 
                                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                            onDragLeave={() => setIsDragging(false)}
                                            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e as any); }}
                                            className={`relative border-2 border-dashed rounded-3xl p-8 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group ${
                                                isUploading ? 'border-amber-500 bg-amber-500/5 cursor-wait' :
                                                isDragging ? 'border-red-500 bg-red-500/10 scale-[1.01]' : 
                                                files.length > 0 ? 'border-red-500/30 bg-red-500/5' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/30'
                                            }`}
                                        >
                                            <input 
                                                type="file"
                                                multiple
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                disabled={isUploading}
                                                onChange={handleFileUpload}
                                                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-wait"
                                            />
                                            <div className={`p-4 rounded-2xl transition-all ${
                                                isUploading ? 'bg-amber-500 text-white animate-pulse' :
                                                isDragging ? 'bg-red-500 text-white' : 
                                                'bg-slate-800 text-slate-400 group-hover:text-red-400'
                                            }`}>
                                                {isUploading ? <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={32} />}
                                            </div>
                                            <div className="text-center">
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${isUploading ? 'text-amber-500' : 'text-white'}`}>
                                                    {isUploading ? `SUBIENDO... ${uploadProgress.total > 1 ? `(${uploadProgress.current}/${uploadProgress.total})` : ''}` : isDragging ? '¡SUELTA!' : files.length > 0 ? `✅ ${files.length} EVIDENCIAS LISTAS` : 'ARRASTRA O HAZ CLIC'}
                                                </p>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">
                                                    Soporta múltiples archivos PDF o Imágenes
                                                </p>
                                            </div>
                                        </div>

                                        {files.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-3">
                                                {files.map((url, idx) => (
                                                    <div key={idx} className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2 animate-in zoom-in-95 group">
                                                        <FileText size={12} className="text-red-400" />
                                                        <span className="text-[9px] font-bold text-slate-300">Archivo {idx + 1}</span>
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

                                    <button type="submit" disabled={isUploading || files.length === 0} className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white font-black uppercase py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                        {isUploading ? "Subiendo..." : <span className="flex items-center gap-2"><Save size={18} /> Guardar Registro</span>}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* List */}
                        <div className="xl:col-span-3">
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl min-h-[600px]">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-4">
                                    <h3 className="text-white font-black text-lg flex items-center gap-2">
                                        <Siren size={20} className="text-slate-500" /> Registro de Eventos
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <div className="text-[10px] font-mono text-slate-500 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                                            {filteredRecords.length} REGISTROS
                                        </div>
                                    </div>
                                </div>

                                {/* FILTERS */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-slate-800/30 p-4 rounded-2xl border border-slate-800/50 items-end">
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Fecha</label>
                                            {filterDate && (
                                                <button onClick={() => setFilterDate('')} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <input 
                                            type="date"
                                            value={filterDate}
                                            onChange={e => setFilterDate(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-red-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Tipo</label>
                                            {filterType && (
                                                <button onClick={() => setFilterType('')} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <select 
                                            value={filterType}
                                            onChange={e => setFilterType(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-red-500 outline-none"
                                        >
                                            <option value="">Todos los tipos...</option>
                                            {ACCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
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
                                        <button 
                                            onClick={() => { setFilterLocation(''); setFilterDate(''); setFilterType(''); }}
                                            className={`w-full h-[33px] rounded-lg text-[10px] font-bold uppercase transition-all border flex items-center justify-center gap-2 active:scale-95 ${
                                                (filterLocation || filterDate || filterType)
                                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 shadow-lg shadow-red-950/20'
                                                : 'bg-slate-800/50 text-slate-500 border-slate-800 cursor-not-allowed opacity-50'
                                            }`}
                                            disabled={!(filterLocation || filterDate || filterType)}
                                        >
                                            <RotateCcw size={14} strokeWidth={3} /> Limpiar Filtros
                                        </button>
                                    </div>
                                </div>

                                {/* RESUMEN MENSUAL */}
                                <div className="flex flex-wrap gap-2 mb-6 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
                                    {['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'].map((m, i) => {
                                        const count = records.filter(r => {
                                            const mPart = parseInt(r.date?.split('-')[1] || "0");
                                            return mPart === (i + 1);
                                        }).length;
                                        return (
                                            <div key={m} className={`flex-1 flex flex-col items-center justify-center min-w-[45px] py-2 rounded-xl border transition-all ${count > 0 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-slate-950/50 border-slate-800/50 text-slate-600 opacity-40'}`}>
                                                <span className="text-[7px] font-black uppercase tracking-tighter mb-0.5">{m}</span>
                                                <span className="text-[10px] font-black">{count}</span>
                                            </div>
                                        );
                                    })}
                                    <div className="flex flex-col items-center justify-center min-w-[70px] py-2 rounded-xl border bg-red-500/10 border-red-500/30 text-red-400 ml-auto">
                                        <span className="text-[7px] font-black uppercase tracking-tighter">TOTAL</span>
                                        <span className="text-[10px] font-black">{records.length}</span>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="flex justify-center items-center py-20">
                                        <div className="w-10 h-10 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-[10px] font-black text-slate-500 uppercase border-b border-slate-800">
                                                    <th className="pb-4">Fecha / Hora</th>
                                                    <th className="pb-4">Lugar</th>
                                                    <th className="pb-4">Tipo y Descripción</th>
                                                    <th className="pb-4">Involucrado</th>
                                                    <th className="pb-4 text-center">Docs</th>
                                                    <th className="pb-4 text-right">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {filteredRecords.map(r => (
                                                    <tr key={r.id} className="group hover:bg-slate-800/30 transition-colors">
                                                        <td className="py-4">
                                                            <p className="text-xs font-mono text-slate-400">{r.date}</p>
                                                            <p className="text-[10px] font-black text-white">{r.time}</p>
                                                        </td>
                                                        <td className="py-4 font-black text-slate-300 text-xs">{r.location}</td>
                                                        <td className="py-4">
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 inline-block mb-1">
                                                                {r.type}
                                                            </span>
                                                            <p className="text-xs text-slate-400 max-w-xs truncate" title={r.description}>{r.description}</p>
                                                        </td>
                                                        <td className="py-4 text-xs font-bold text-white uppercase">{r.involvedPerson}</td>
                                                        <td className="py-4">
                                                            <div className="flex justify-center gap-1">
                                                                {r.files && r.files.map((f, i) => (
                                                                    <div key={i} className="flex gap-1">
                                                                        <button onClick={() => setPreviewFile({url: f, type: 'pdf'})} className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-slate-700">
                                                                            <FileText size={14} />
                                                                        </button>
                                                                        <a href={getDriveDownloadUrl(f)} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-800 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors border border-slate-700">
                                                                            <Download size={14} />
                                                                        </a>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <div className="flex justify-end gap-2">
                                                            <button 
                                                                onClick={() => {
                                                                    exportRecordToPDF(
                                                                        'Reporte Individual de Accidente/Incidente',
                                                                        r,
                                                                        `Accidente_${r.date}_${r.location.replace(/\s+/g, '_')}.pdf`
                                                                    );
                                                                }}
                                                                className="p-2 text-slate-600 hover:text-emerald-400 transition-colors"
                                                                title="Descargar Fila en PDF"
                                                            >
                                                                <DownloadCloud size={16} />
                                                            </button>
                                                            <button onClick={() => handleDelete(r.id)} className="p-2 text-slate-600 hover:text-red-400 transition-colors">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </tr>
                                                ))}
                                                {filteredRecords.length === 0 && (
                                                    <tr>
                                                        <td colSpan={6} className="py-20 text-center text-slate-600 font-bold uppercase text-xs tracking-widest">No hay registros</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
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
                                <Eye size={16} className="text-red-400" /> Evidencia Adjunta
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
