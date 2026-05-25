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
    RotateCcw,
    BarChart3,
    Edit2
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import SearchableSelect from "@/components/SearchableSelect";
import { getDriveViewerUrl, getDriveDownloadUrl, handleBulkDownload, sanitizeRecords } from '@/lib/utils';
import { uploadEvidence } from "@/lib/uploadClient";
import { SSOMA_LOCATIONS } from "@/lib/locations";
import { useAuth } from "@/lib/auth";
import { exportTableToPDF, exportRecordToPDF } from "@/lib/pdfExport";

const COMMON_WASTE_TYPES = [
    "ACEITE LUBRICANTE USADO",
    "TIERRA CONTAMINADA CON HIDROCARBUROS",
    "DESECHOS DE ASFALTO",
    "BALDES CONTAMINADOS CON PINTURA",
    "TEROKAL VENCIDO",
    "RESIDUOS CONTAMINADOS CON HIDROCARBURO (TRAPOS INDUSTRIALES Y FILTROS)",
    "CILINDROS VACIOS CONTAMINADOS CON HIDROCARBUROS"
];

// --- TYPES ---
type ManifestItem = {
    wasteType: string;
    quantity: string;
    unit: string;
};

type ManifestRecord = {
    id: number;
    date: string;
    manifestNumber: string;
    transportCompany: string;
    location: string;
    files: string[];
    // Legacy support
    wasteType?: string;
    quantity?: string;
    unit?: string;
    // New multi-item support
    items?: ManifestItem[];
    // Document Type support
    documentType?: string;
};

export default function ManifestPage() {
    const { user } = useAuth();

    // --- STATE ---
    const [records, setRecords] = useState<ManifestRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [documentType, setDocumentType] = useState('Manifiesto');
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        manifestNumber: '',
        transportCompany: '',
        location: ''
    });
    const [items, setItems] = useState<ManifestItem[]>([{ wasteType: '', quantity: '', unit: 'kg' }]);
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
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const CHART_COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1', '#eab308'];

    // --- EFFECT: LOAD ---
    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/manifiesto-records?t=' + Date.now(), { cache: 'no-store' });
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
            alert("Debe subir el archivo PDF del Documento.");
            return;
        }
        if (items.length === 0 || items.some(i => !i.wasteType || !i.quantity)) {
            alert("Debe ingresar al menos un residuo válido con cantidad.");
            return;
        }

        const newRecord: ManifestRecord = {
            id: editingId || Date.now(),
            ...form,
            documentType,
            items: [...items],
            files: files
        };

        let allRecords;
        if (editingId) {
            allRecords = records.map(r => r.id === editingId ? newRecord : r);
        } else {
            allRecords = [newRecord, ...records];
        }

        try {
            const res = await fetch('/api/manifiesto-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: allRecords })
            });
            if (res.ok) {
                setRecords(allRecords);
                setForm(prev => ({ ...prev, manifestNumber: '', transportCompany: '' }));
                setItems([{ wasteType: '', quantity: '', unit: 'kg' }]);
                setFiles([]);
                setEditingId(null);
                alert(`${documentType} ${editingId ? 'actualizado' : 'registrado'} correctamente.`);
            }
        } catch (error) {
            console.error('Error saving data:', error);
        }
    };

    const handleEdit = (record: ManifestRecord) => {
        setEditingId(record.id);
        setDocumentType(record.documentType || 'Manifiesto');
        setForm({
            date: record.date || new Date().toISOString().split('T')[0],
            manifestNumber: record.manifestNumber || '',
            transportCompany: record.transportCompany || '',
            location: record.location || ''
        });
        
        if (record.items && record.items.length > 0) {
            setItems(record.items.map(i => ({...i})));
        } else if (record.wasteType) {
            setItems([{ wasteType: record.wasteType, quantity: record.quantity || '', unit: record.unit || 'kg' }]);
        } else {
            setItems([{ wasteType: '', quantity: '', unit: 'kg' }]);
        }
        
        setFiles([...record.files]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm(prev => ({ ...prev, manifestNumber: '', transportCompany: '' }));
        setItems([{ wasteType: '', quantity: '', unit: 'kg' }]);
        setFiles([]);
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
        
        const validItems = Array.isArray(r.items) ? r.items.filter(i => i && typeof i.wasteType === 'string' && i.wasteType.trim() !== '') : [];
        const wasteNames = validItems.length > 0 ? validItems.map(i => i.wasteType).join(' ') : (r.wasteType || '');
        const matchesType = !filterWasteType || wasteNames.toLowerCase().includes(filterWasteType.toLowerCase());
        
        return matchesLoc && matchesDate && matchesType;
    });

    // Calcular totales mes a mes
    const quantitiesPerMonth = new Array(12).fill(0);
    let totalKg = 0;

    filteredRecords.forEach(r => {
        if (!r.date) return;
        const monthIndex = parseInt(r.date.split('-')[1]) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
            let recTotal = 0;
            const validItems = Array.isArray(r.items) ? r.items.filter(i => i && typeof i.wasteType === 'string' && i.wasteType.trim() !== '') : [];
            if (validItems.length > 0) {
                validItems.forEach(i => {
                    let q = parseFloat(String(i.quantity).replace(/,/g, '')) || 0;
                    if (i.unit === 'ton') q *= 1000;
                    if (i.unit === 'gl') q *= 3.785;
                    recTotal += q;
                });
            } else {
                let q = parseFloat(String(r.quantity || '0').replace(/,/g, '')) || 0;
                if (r.unit === 'ton') q *= 1000;
                if (r.unit === 'gl') q *= 3.785;
                recTotal += q;
            }
            quantitiesPerMonth[monthIndex] += recTotal;
            totalKg += recTotal;
        }
    });

    const MONTH_LABELS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'];

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
                                        { header: 'Residuos', dataKey: 'exportWaste' },
                                        { header: 'Cantidad Total', dataKey: 'exportQuantity' },
                                        { header: 'Lugar', dataKey: 'location' }
                                    ];
                                    const exportData = filteredRecords.map(r => {
                                        const validItems = r.items ? r.items.filter(i => i.wasteType && i.wasteType.trim() !== '') : [];
                                        return {
                                            ...r,
                                            exportWaste: validItems.length > 0 ? validItems.map(i => i.wasteType).join(' | ') : r.wasteType,
                                            exportQuantity: validItems.length > 0 ? `${validItems.reduce((acc, i) => acc + (parseFloat(i.quantity) || 0), 0).toFixed(2)} ${validItems[0]?.unit || 'kg'}` : `${r.quantity} ${r.unit}`
                                        };
                                    });
                                    exportTableToPDF('Control de Manifiestos', cols, exportData, 'Manifiestos.pdf');
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
                                    <Save size={18} /> {editingId ? 'Editar Registro' : 'Registrar Nuevo Manifiesto'}
                                </h3>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Tipo de Registro</label>
                                            <select value={documentType} onChange={e => setDocumentType(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white font-bold focus:border-emerald-500 outline-none appearance-none cursor-pointer">
                                                <option value="Manifiesto">Manifiesto</option>
                                                <option value="Certificado de Transportista">Certificado de Transportista</option>
                                                <option value="Certificado de Disposición Final">Certificado de Disposición Final</option>
                                            </select>
                                        </div>

                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Fecha de Emisión</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-2.5 text-slate-600" size={16} />
                                                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-emerald-500 outline-none" required />
                                            </div>
                                        </div>

                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">
                                                {documentType === 'Manifiesto' ? 'N° de Manifiesto' : 'N° de Certificado'}
                                            </label>
                                            <input type="text" placeholder={`Ej: ${documentType === 'Manifiesto' ? 'MAN-2024-001' : 'CERT-2024-001'}`} value={form.manifestNumber} onChange={e => setForm({...form, manifestNumber: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-500 outline-none" required />
                                        </div>

                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Empresa Operadora (EO-RS)</label>
                                            <div className="relative">
                                                <Truck className="absolute left-3 top-2.5 text-slate-600" size={16} />
                                                <input type="text" placeholder="Nombre de la EO-RS..." value={form.transportCompany} onChange={e => setForm({...form, transportCompany: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-emerald-500 outline-none" required />
                                            </div>
                                        </div>

                                        <div className="col-span-2 space-y-4 pt-4 border-t border-slate-800 mt-4">
                                            <div className="flex justify-between items-center">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase">Detalle de Residuos</label>
                                                    <button type="button" onClick={() => setItems([...items, {wasteType: '', quantity: '', unit: 'kg'}])} className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded hover:bg-emerald-500/20 flex items-center gap-1 transition-colors">
                                                        ➕ Añadir Residuo
                                                    </button>
                                                </div>
                                                
                                                <datalist id="waste-list">
                                                    {COMMON_WASTE_TYPES.map(t => <option key={t} value={t} />)}
                                                </datalist>

                                                <div className="space-y-3">
                                                    {items.map((item, idx) => (
                                                        <div key={idx} className="flex gap-2 items-start bg-slate-950 p-2.5 rounded-xl border border-slate-800 relative group transition-all hover:border-slate-700">
                                                            <div className="flex-1 space-y-2">
                                                                <div className="relative">
                                                                    <AlertTriangle className="absolute left-2.5 top-2 text-amber-500/50" size={14} />
                                                                    <input list="waste-list" placeholder="Seleccione o escriba tipo de residuo..." value={item.wasteType} onChange={e => {
                                                                        const newItems = [...items];
                                                                        newItems[idx].wasteType = e.target.value;
                                                                        setItems(newItems);
                                                                    }} className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-[11px] font-bold text-white focus:border-emerald-500 outline-none" required />
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <input type="number" step="0.01" placeholder="Cant." value={item.quantity} onChange={e => {
                                                                        const newItems = [...items];
                                                                        newItems[idx].quantity = e.target.value;
                                                                        setItems(newItems);
                                                                    }} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] font-mono text-white focus:border-emerald-500 outline-none" required />
                                                                    <select value={item.unit} onChange={e => {
                                                                        const newItems = [...items];
                                                                        newItems[idx].unit = e.target.value;
                                                                        setItems(newItems);
                                                                    }} className="w-[80px] bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] font-bold text-white focus:border-emerald-500 outline-none appearance-none text-center">
                                                                        <option value="kg">kg</option>
                                                                        <option value="ton">ton</option>
                                                                        <option value="gl">gl</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            {items.length > 1 && (
                                                                <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-slate-600 hover:text-red-400 p-1.5 bg-slate-900 rounded-lg border border-slate-800 mt-1 transition-colors">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex justify-between items-center text-xs text-slate-400 font-mono font-bold bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-800 mt-2">
                                                    <span>TOTAL ESTIMADO:</span>
                                                    <span className="text-emerald-400 text-sm">
                                                        {items.reduce((acc, curr) => acc + (parseFloat(curr.quantity) || 0), 0).toFixed(3)}
                                                    </span>
                                                </div>
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
                                            Documento Escaneado (PDF)
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

                                    <div className="flex gap-2">
                                        <button type="submit" disabled={isUploading || files.length === 0} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-black uppercase py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                            {isUploading ? "Subiendo..." : <span className="flex items-center gap-2"><Save size={18} /> {editingId ? 'Actualizar' : 'Guardar'}</span>}
                                        </button>
                                        {editingId && (
                                            <button type="button" onClick={cancelEdit} title="Cancelar Edición" className="px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black uppercase py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center">
                                                <X size={18} />
                                            </button>
                                        )}
                                    </div>
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

                                {/* SUMMARY PANEL */}
                                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-6">
                                    <div className="flex flex-wrap gap-2 items-center mb-3">
                                        <h4 className="text-emerald-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                            <BarChart3 size={14} /> Total de Residuos Dispuestos (kg)
                                        </h4>
                                        <div className="flex-1" />
                                        <button 
                                            onClick={() => setShowAnalytics(true)}
                                            className="bg-slate-800 hover:bg-emerald-600 text-emerald-400 hover:text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all border border-slate-700 shadow-xl"
                                        >
                                            <BarChart3 size={14} />
                                            Ver Gráficos
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-6 md:grid-cols-13 gap-1">
                                        {MONTH_LABELS.map((m, i) => (
                                            <div key={m} className={`bg-slate-900 border ${quantitiesPerMonth[i] > 0 ? 'border-emerald-500/30' : 'border-slate-800'} rounded-lg p-2 text-center flex flex-col justify-center gap-1 transition-all`}>
                                                <span className="text-[9px] font-black text-slate-500">{m}</span>
                                                <span className={`text-[10px] font-bold ${quantitiesPerMonth[i] > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                                                    {quantitiesPerMonth[i] > 0 ? quantitiesPerMonth[i].toLocaleString('en-US', {maximumFractionDigits: 1}) : '0'}
                                                </span>
                                            </div>
                                        ))}
                                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 text-center flex flex-col justify-center gap-1 mt-2 md:mt-0 col-span-full md:col-span-1">
                                            <span className="text-[9px] font-black text-emerald-500">TOTAL</span>
                                            <span className="text-xs font-black text-emerald-400">{totalKg.toLocaleString('en-US', {maximumFractionDigits: 1})}</span>
                                        </div>
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
                                                    <th className="pb-4">N° Documento</th>
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
                                                        <td className="py-4 font-black text-white text-xs">
                                                            <div>{r.manifestNumber}</div>
                                                            {r.documentType && r.documentType !== 'Manifiesto' && (
                                                                <div className="text-[8px] mt-1 uppercase tracking-widest text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-1 py-0.5 rounded inline-block">
                                                                    {r.documentType}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="py-4 text-xs text-slate-400">{r.transportCompany}</td>
                                                        <td className="py-4">
                                                            <div className="flex flex-col gap-1 items-start">
                                                                {(() => {
                                                                    const validItems = Array.isArray(r.items) ? r.items.filter(i => i && typeof i.wasteType === 'string' && i.wasteType.trim() !== '') : [];
                                                                    if (validItems.length > 0) {
                                                                        return validItems.map((i, idx) => (
                                                                            <span key={idx} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 max-w-[200px] truncate" title={`${i.wasteType} (${i.quantity} ${i.unit})`}>
                                                                                {i.wasteType}
                                                                            </span>
                                                                        ));
                                                                    } else if (r.wasteType && r.wasteType.trim() !== '') {
                                                                        return (
                                                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 max-w-[200px] truncate" title={r.wasteType}>
                                                                                {r.wasteType}
                                                                            </span>
                                                                        );
                                                                    } else {
                                                                        return <span className="text-slate-600 text-xs">-</span>;
                                                                    }
                                                                })()}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 text-right text-sm font-mono font-bold text-white">
                                                            {(() => {
                                                                const validItems = Array.isArray(r.items) ? r.items.filter(i => i && typeof i.wasteType === 'string' && i.wasteType.trim() !== '') : [];
                                                                if (validItems.length > 0) {
                                                                    const totalQ = validItems.reduce((acc, i) => acc + (parseFloat(String(i.quantity).replace(/,/g, '')) || 0), 0);
                                                                    return <>{totalQ.toFixed(2)} <span className="text-[10px] text-slate-500">{validItems[0]?.unit || 'kg'}</span></>;
                                                                } else if (r.quantity && String(r.quantity).trim() !== '') {
                                                                    return <>{r.quantity} <span className="text-[10px] text-slate-500">{r.unit}</span></>;
                                                                } else {
                                                                    return <span className="text-slate-600 text-xs">-</span>;
                                                                }
                                                            })()}
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
                                                                <button onClick={() => handleEdit(r)} className="p-2 text-slate-600 hover:text-emerald-400 transition-colors" title="Editar Registro">
                                                                    <Edit2 size={16} />
                                                                </button>
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

            {showAnalytics && (() => {
                const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'];
                const data = months.map(m => ({ name: m, total: 0 } as any));
                const tableData: Record<string, number[]> = {};
                
                records.forEach(r => {
                    const monthIndex = parseInt(r.date.split('-')[1] || "1") - 1;
                    if (monthIndex >= 0 && monthIndex < 12) {
                        const validItems = r.items ? r.items.filter(i => i.wasteType && i.wasteType.trim() !== '') : [];
                        if (validItems.length > 0) {
                            validItems.forEach(i => {
                                const wt = i.wasteType.toUpperCase();
                                const qty = parseFloat(i.quantity) || 0;
                                if (!tableData[wt]) tableData[wt] = new Array(12).fill(0);
                                tableData[wt][monthIndex] += qty;
                                data[monthIndex][wt] = (data[monthIndex][wt] || 0) + qty;
                                data[monthIndex].total += qty;
                            });
                        } else if (r.wasteType) {
                            const wt = r.wasteType.toUpperCase();
                            const qty = parseFloat(r.quantity || "0") || 0;
                            if (!tableData[wt]) tableData[wt] = new Array(12).fill(0);
                            tableData[wt][monthIndex] += qty;
                            data[monthIndex][wt] = (data[monthIndex][wt] || 0) + qty;
                            data[monthIndex].total += qty;
                        }
                    }
                });

                const activeWastes = Object.keys(tableData).filter(w => tableData[w].some(v => v > 0));

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setShowAnalytics(false)}>
                        <div className="relative w-full max-w-7xl h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950 rounded-t-3xl">
                                <div>
                                    <h3 className="text-white text-xl font-black flex items-center gap-3">
                                        <BarChart3 className="text-emerald-400" size={24} /> 
                                        Trazabilidad de Residuos
                                    </h3>
                                    <p className="text-slate-400 text-xs mt-1">Seguimiento mes a mes de cantidades (kg/ton) por tipo de residuo</p>
                                </div>
                                <button onClick={() => setShowAnalytics(false)} className="text-slate-400 hover:text-white p-2 bg-slate-800 rounded-xl transition-colors border border-slate-700">
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-auto p-6 space-y-8">
                                <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs whitespace-nowrap">
                                            <thead>
                                                <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 font-black">
                                                    <th className="p-4 uppercase tracking-widest">Tipo de Residuo</th>
                                                    {months.map(m => <th key={m} className="p-4 text-center">{m}</th>)}
                                                    <th className="p-4 text-right text-emerald-400 bg-emerald-500/10">TOTAL</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {activeWastes.map(w => {
                                                    const rowTotal = tableData[w].reduce((a,b) => a+b, 0);
                                                    return (
                                                        <tr key={w} className="hover:bg-slate-800/50 transition-colors">
                                                            <td className="p-4 text-[10px] font-bold text-white whitespace-normal max-w-[200px]">{w}</td>
                                                            {tableData[w].map((val, i) => (
                                                                <td key={i} className={`p-4 text-center font-mono ${val > 0 ? 'text-white' : 'text-slate-600'}`}>
                                                                    {val > 0 ? val.toFixed(2) : '-'}
                                                                </td>
                                                            ))}
                                                            <td className="p-4 text-right font-mono font-black text-emerald-400 bg-emerald-500/5">
                                                                {rowTotal.toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                <tr className="bg-slate-900/80 font-black border-t-2 border-slate-700">
                                                    <td className="p-4 uppercase tracking-widest text-emerald-400">TOTAL GENERAL</td>
                                                    {months.map((m, i) => (
                                                        <td key={m} className="p-4 text-center font-mono text-emerald-400">
                                                            {data[i].total > 0 ? data[i].total.toFixed(2) : '-'}
                                                        </td>
                                                    ))}
                                                    <td className="p-4 text-right font-mono text-emerald-400 bg-emerald-500/10 text-lg">
                                                        {data.reduce((acc, curr) => acc + curr.total, 0).toFixed(2)}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg">
                                    <h4 className="text-white font-black mb-6 flex items-center gap-2 uppercase tracking-widest text-xs text-slate-400">
                                        Tendencia Anual de Generación (Cantidades)
                                    </h4>
                                    <div className="h-[400px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                                <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} tickMargin={10} axisLine={false} tickLine={false} />
                                                <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} axisLine={false} tickLine={false} tickFormatter={(val) => val.toString()} />
                                                <RechartsTooltip 
                                                    contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '16px', color: '#f8fafc', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                                                    itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                                                    labelStyle={{ color: '#10b981', fontWeight: '900', marginBottom: '8px' }}
                                                />
                                                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                                                
                                                <Line type="monotone" dataKey="total" name="TOTAL GENERAL" stroke="#10b981" strokeWidth={4} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                                                
                                                {activeWastes.map((w, i) => (
                                                    <Line key={w} type="monotone" dataKey={w} name={w} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={false} strokeOpacity={0.6} />
                                                ))}
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
