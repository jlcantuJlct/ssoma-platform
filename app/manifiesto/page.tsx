"use client";

import { useState, useEffect } from "react";
import {
    FileText,
    Upload,
    Trash2,
    Eye,
    X,
    Save,
    Calendar,
    Truck,
    MapPin,
    AlertTriangle,
    Download,
    DownloadCloud,
    RotateCcw
} from "lucide-react";
import SearchableSelect from "@/components/SearchableSelect";
import { getDriveViewerUrl, getDriveDownloadUrl, handleBulkDownload, sanitizeRecords } from '@/lib/utils';
import { uploadEvidence } from "@/lib/uploadClient";
import { SSOMA_LOCATIONS } from "@/lib/locations";
import { useAuth } from "@/lib/auth";
import { exportTableToPDF, exportRecordToPDF } from "@/lib/pdfExport";

// --- TYPES ---
type ManifestRecord = {
    id: number;
    date: string;
    manifestNumber: string;
    transportCompany: string;
    wasteType: string;
    quantity: string;
    unit: string;
    location: string;
    files: string[];
};

export default function ManifestPage() {
    const { user } = useAuth();

    // --- STATE ---
    const [records, setRecords] = useState<ManifestRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        manifestNumber: '',
        transportCompany: '',
        wasteType: '',
        quantity: '',
        unit: 'kg',
        location: ''
    });
    const [filterLocation, setFilterLocation] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterWasteType, setFilterWasteType] = useState('');
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
            const res = await fetch('/api/manifiesto-records');
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

        if (!form.manifestNumber || !form.location) {
            alert("⚠️ Por favor completa el N° de Manifiesto y el lugar antes de subir el archivo.");
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
                    'PMA',
                    `MANIFIESTO_${form.manifestNumber}`,
                    form.date,
                    user?.name || 'S/N',
                    'pma',
                    'medio_ambiente',
                    form.location,
                    'Control de Manifiesto de Residuos'
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
            alert("Debe subir el archivo PDF del Manifiesto.");
            return;
        }

        const newRecord: ManifestRecord = {
            id: Date.now(),
            ...form,
            files: files
        };

        const allRecords = [newRecord, ...records];

        try {
            const res = await fetch('/api/manifiesto-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: allRecords })
            });
            if (res.ok) {
                setRecords(allRecords);
                setForm(prev => ({ ...prev, manifestNumber: '', transportCompany: '', wasteType: '', quantity: '' }));
                setFiles([]);
                alert("Manifiesto registrado correctamente.");
            }
        } catch (error) {
            console.error('Error saving data:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Eliminar este registro?")) return;
        const updated = records.filter(r => r.id !== id);
        try {
            await fetch('/api/manifiesto-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: updated })
            });
            setRecords(updated);
        } catch (error) {
            console.error('Error deleting data:', error);
        }
    };

    const filteredRecords = records.filter(r => {
        const matchesLoc = !filterLocation || r.location === filterLocation;
        const matchesDate = !filterDate || r.date === filterDate;
        const matchesType = !filterWasteType || r.wasteType.toLowerCase().includes(filterWasteType.toLowerCase());
        return matchesLoc && matchesDate && matchesType;
    });

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-[1400px] mx-auto space-y-6">
                    
                    {/* Header */}
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl -mr-32 -mt-32 rounded-full"></div>
                        <div className="relative z-10">
                            <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4 mb-2">
                                <FileText size={40} className="text-emerald-500" />
                                Control de Manifiesto de Residuos Peligrosos
                            </h1>
                            <p className="text-slate-400 font-bold max-w-2xl">
                                Gestión de manifiestos de transporte de residuos peligrosos. Asegure la trazabilidad ambiental y el cumplimiento normativo.
                            </p>
                        </div>
                        <div className="mt-4 md:mt-0 flex items-center gap-2 z-10">
                            <button
                                onClick={() => {
                                    setIsDownloading(true);
                                    const bulkItems = filteredRecords.map(r => ({
                                        fileUrls: r.files,
                                        date: r.date,
                                        zona: r.location,
                                        month: r.date.split('-')[1]
                                    }));
                                    handleBulkDownload(bulkItems, 'Manifiestos.zip', setDownloadMsg).finally(() => setIsDownloading(false));
                                }}
                                disabled={isDownloading || filteredRecords.length === 0}
                                className="bg-slate-800 hover:bg-emerald-600 disabled:bg-slate-900 text-white px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all border border-slate-700"
                            >
                                {isDownloading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <DownloadCloud size={18} />}
                                {isDownloading ? (downloadMsg || 'Comprimiendo...') : 'Descargar Visibles'}
                            </button>
                            <button
                                onClick={() => {
                                    const cols = [
                                        { header: 'Fecha', dataKey: 'date' },
                                        { header: 'N° Manifiesto', dataKey: 'manifestNumber' },
                                        { header: 'Transportista', dataKey: 'transportCompany' },
                                        { header: 'Residuo', dataKey: 'wasteType' },
                                        { header: 'Cantidad', dataKey: 'quantity' },
                                        { header: 'Unidad', dataKey: 'unit' },
                                        { header: 'Lugar', dataKey: 'location' }
                                    ];
                                    exportTableToPDF('Control de Manifiestos', cols, filteredRecords, 'Manifiestos.pdf');
                                }}
                                disabled={filteredRecords.length === 0}
                                className="bg-slate-800 hover:bg-emerald-600 disabled:bg-slate-900 text-white px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all border border-slate-700"
                            >
                                <FileText size={18} />
                                Descargar PDF
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                        {/* Form */}
                        <div className="xl:col-span-1">
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl sticky top-6">
                                <h3 className="text-emerald-400 font-black uppercase text-sm tracking-widest mb-6 flex items-center gap-2">
                                    <Save size={18} /> Registrar Nuevo Manifiesto
                                </h3>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Fecha de Emisión</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-2.5 text-slate-600" size={16} />
                                                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-emerald-500 outline-none" required />
                                            </div>
                                        </div>

                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">N° de Manifiesto</label>
                                            <input type="text" placeholder="Ej: MAN-2024-001" value={form.manifestNumber} onChange={e => setForm({...form, manifestNumber: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-500 outline-none" required />
                                        </div>

                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Empresa Operadora (EO-RS)</label>
                                            <div className="relative">
                                                <Truck className="absolute left-3 top-2.5 text-slate-600" size={16} />
                                                <input type="text" placeholder="Nombre de la EO-RS..." value={form.transportCompany} onChange={e => setForm({...form, transportCompany: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-emerald-500 outline-none" required />
                                            </div>
                                        </div>

                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Tipo de Residuo</label>
                                            <div className="relative">
                                                <AlertTriangle className="absolute left-3 top-2.5 text-amber-500/50" size={16} />
                                                <input type="text" placeholder="Ej: Aceite usado, Trapos..." value={form.wasteType} onChange={e => setForm({...form, wasteType: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-emerald-500 outline-none" required />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Cantidad</label>
                                            <input type="number" step="0.01" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-500 outline-none" required />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Unidad</label>
                                            <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-500 outline-none">
                                                <option value="kg">Kilogramos (kg)</option>
                                                <option value="ton">Toneladas (ton)</option>
                                                <option value="gl">Galones (gl)</option>
                                                <option value="m3">Metros Cúbicos (m3)</option>
                                            </select>
                                        </div>

                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Lugar de Origen</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-2.5 text-slate-600" size={16} />
                                                <select value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-emerald-500 outline-none appearance-none" required>
                                                    <option value="">Seleccionar Lugar...</option>
                                                    {SSOMA_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* DRAG & DROP AREA */}
                                    <div className="space-y-1.5 pt-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                            Manifiesto Escaneado (PDF)
                                        </label>
                                        <div 
                                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                            onDragLeave={() => setIsDragging(false)}
                                            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e as any); }}
                                            className={`relative border-2 border-dashed rounded-3xl p-8 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group ${
                                                isUploading ? 'border-amber-500 bg-amber-500/5 cursor-wait' :
                                                isDragging ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]' : 
                                                files.length > 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/30'
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
                                                isDragging ? 'bg-emerald-500 text-white' : 
                                                'bg-slate-800 text-slate-400 group-hover:text-emerald-400'
                                            }`}>
                                                {isUploading ? <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={32} />}
                                            </div>
                                            <div className="text-center">
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${isUploading ? 'text-amber-500' : 'text-white'}`}>
                                                    {isUploading ? `SUBIENDO... ${uploadProgress.total > 1 ? `(${uploadProgress.current}/${uploadProgress.total})` : ''}` : isDragging ? '¡SUELTA!' : files.length > 0 ? `✅ ${files.length} MANIFIESTOS LISTOS` : 'ARRASTRA O HAZ CLIC'}
                                                </p>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">
                                                    Soporta múltiples archivos PDF
                                                </p>
                                            </div>
                                        </div>

                                        {files.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-3">
                                                {files.map((url, idx) => (
                                                    <div key={idx} className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2 animate-in zoom-in-95 group">
                                                        <FileText size={12} className="text-emerald-400" />
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

                                    <button type="submit" disabled={isUploading || files.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-black uppercase py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                        {isUploading ? "Subiendo..." : <span className="flex items-center gap-2"><Save size={18} /> Guardar Manifiesto</span>}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* List */}
                        <div className="xl:col-span-3">
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl min-h-[600px]">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-4">
                                    <h3 className="text-white font-black text-lg flex items-center gap-2">
                                        <FileText size={20} className="text-slate-500" /> Registro Histórico de Manifiestos
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
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-emerald-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Tipo</label>
                                            {filterWasteType && (
                                                <button onClick={() => setFilterWasteType('')} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <input 
                                            type="text"
                                            placeholder="Buscar tipo..."
                                            value={filterWasteType}
                                            onChange={e => setFilterWasteType(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-emerald-500 outline-none"
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
                                        <button 
                                            onClick={() => { setFilterLocation(''); setFilterDate(''); setFilterWasteType(''); }}
                                            className={`w-full h-[33px] rounded-lg text-[10px] font-bold uppercase transition-all border flex items-center justify-center gap-2 active:scale-95 ${
                                                (filterLocation || filterDate || filterWasteType)
                                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 shadow-lg shadow-red-950/20'
                                                : 'bg-slate-800/50 text-slate-500 border-slate-800 cursor-not-allowed opacity-50'
                                            }`}
                                            disabled={!(filterLocation || filterDate || filterWasteType)}
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
                                            <div key={m} className={`flex-1 flex flex-col items-center justify-center min-w-[45px] py-2 rounded-xl border transition-all ${count > 0 ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-slate-950/50 border-slate-800/50 text-slate-600 opacity-40'}`}>
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
                                        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-[10px] font-black text-slate-500 uppercase border-b border-slate-800">
                                                    <th className="pb-4">Fecha</th>
                                                    <th className="pb-4">N° Manifiesto</th>
                                                    <th className="pb-4">Transportista</th>
                                                    <th className="pb-4">Residuo</th>
                                                    <th className="pb-4 text-right">Cantidad</th>
                                                    <th className="pb-4 text-center">Docs</th>
                                                    <th className="pb-4 text-right">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {filteredRecords.map(r => (
                                                    <tr key={r.id} className="group hover:bg-slate-800/30 transition-colors">
                                                        <td className="py-4 text-xs font-mono text-slate-400">{r.date}</td>
                                                        <td className="py-4 font-black text-white text-xs">{r.manifestNumber}</td>
                                                        <td className="py-4 text-xs text-slate-400">{r.transportCompany}</td>
                                                        <td className="py-4">
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">{r.wasteType}</span>
                                                        </td>
                                                        <td className="py-4 text-right text-sm font-mono font-bold text-white">
                                                            {r.quantity} <span className="text-[10px] text-slate-500">{r.unit}</span>
                                                        </td>
                                                        <td className="py-4">
                                                            <div className="flex justify-center gap-1">
                                                                {r.files.map((f, i) => (
                                                                    <div key={i} className="flex gap-1">
                                                                        <button onClick={() => setPreviewFile({url: f, type: 'pdf'})} className="p-1.5 bg-slate-800 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors border border-slate-700">
                                                                            <FileText size={14} />
                                                                        </button>
                                                                        <a href={getDriveDownloadUrl(f)} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-800 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors border border-slate-700">
                                                                            <Download size={14} />
                                                                        </a>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <button onClick={() => exportRecordToPDF('Detalle de Manifiesto', r, `Manifiesto_${r.manifestNumber}.pdf`)} className="p-2 text-slate-600 hover:text-blue-400 transition-colors" title="Descargar Fila">
                                                                    <DownloadCloud size={16} />
                                                                </button>
                                                                <button onClick={() => handleDelete(r.id)} className="p-2 text-slate-600 hover:text-red-400 transition-colors">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {filteredRecords.length === 0 && (
                                                    <tr>
                                                        <td colSpan={7} className="py-20 text-center text-slate-600 font-bold uppercase text-xs tracking-widest">No hay manifiestos registrados</td>
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
                                <Eye size={16} className="text-emerald-400" /> Manifiesto Escaneado
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
