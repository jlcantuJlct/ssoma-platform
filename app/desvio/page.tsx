"use client";

import { useState, useEffect } from "react";
import {
    Map as MapIcon,
    Upload,
    Trash2,
    Image as ImageIcon,
    Calendar,
    User,
    FileText,
    Eye,
    X,
    Save,
    Target,
    Filter,
    ArrowUpRight,
    MapPin,
    AlertCircle,
    CheckCircle2,
    Download,
    TrendingUp,
    RotateCcw
} from "lucide-react";
import * as Utils from '@/lib/utils';
import jsPDF from 'jspdf';
import { uploadEvidence } from "@/lib/uploadClient";
import { SSOMA_LOCATIONS } from "@/lib/locations";
import { useAuth, USER_LIST } from "@/lib/auth";
import * as Categories from "@/lib/categories";
import SearchableSelect from "@/components/SearchableSelect";

// --- TYPES ---
type DetourEvidenceRecord = {
    id: number;
    date: string;
    responsible: string;
    category: string;
    description: string;
    location: string;
    images: string[];
};

export default function DetourPage() {
    const { user } = useAuth();
    // --- STATE ---
    const [records, setRecords] = useState<DetourEvidenceRecord[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);


    // Form State
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        responsible: '',
        category: '',
        description: '',
        location: ''
    });
    const [images, setImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [previewFile, setPreviewFile] = useState<{ url: string, type: 'pdf' | 'image' } | null>(null);

    // Table Filter State
    const [filterDate, setFilterDate] = useState("");
    const [filterResponsible, setFilterResponsible] = useState("");
    const [filterLocation, setFilterLocation] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    // Categories from static list
    const [detourCategories] = useState<Categories.DetourCategory[]>(Categories.DETOUR_CATEGORIES);


    // --- EFFECT: LOAD/SAVE ---
    useEffect(() => {
        const loadRecords = async () => {
            try {
                const res = await fetch('/api/desvio-records');
                const data = await res.json();
                if (data.success && data.records.length > 0) {
                    const mapped = data.records.map((r: any) => ({
                        id: Number(r.id) || Number(r.record_id),
                        date: r.date,
                        responsible: r.responsible,
                        category: r.category,
                        description: r.description,
                        location: r.location || '',
                        images: typeof r.images === 'string' ? JSON.parse(r.images) : (r.images || [])
                    }));
                    setRecords(mapped);
                    localStorage.setItem('desvio_evidence_records', JSON.stringify(mapped));
                }
            } catch (e) {
                console.warn('Could not fetch Desvio records from cloud:', e);
            }
        };
        loadRecords();

        // Load stored records as fallback
        const stored = localStorage.getItem('desvio_evidence_records');
        if (stored) {
            try {
                setRecords(JSON.parse(stored));
            } catch (e) {
                console.error("Error parsing desvio_evidence_records", e);
            }
        }

        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('desvio_evidence_records', JSON.stringify(records));
            // Sync to cloud
            setIsSyncing(true);
            fetch('/api/desvio-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records, userName: user?.name })
            })
                .catch(e => console.warn('Desvio cloud sync failed:', e))
                .finally(() => setIsSyncing(false));
        }
    }, [records, isLoaded]);

    // --- HANDLERS ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        if (!form.responsible || !form.location || !form.category) {
            alert("⚠️ Por favor completa Responsable, Lugar y Categoría antes de subir archivos.");
            e.target.value = '';
            return;
        }

        if (images.length + files.length > 9) {
            alert(`Solo puedes cargar hasta 9 archivos por registro.`);
            e.target.value = '';
            return;
        }

        try {
            setIsUploading(true);
            const uploadedUrls: string[] = [];
            const filesArray = Array.from(files);

            const catLabel = detourCategories.find(c => c.id === form.category)?.label || form.category || 'Desvio';
            const catShort = catLabel.split(' ').slice(0, 3).join('_').substring(0, 20).replace(/[^a-zA-Z0-9_]/g, '');
            const descWithCat = `${catShort}_${form.location?.replace(/\s+/g, '').substring(0, 12) || 'SinLugar'}`;

            for (const file of filesArray) {
                const extension = file.name.split('.').pop() || 'jpg';
                const filename = await Utils.generateFilename(
                    form.description,
                    form.date,
                    form.responsible,
                    extension
                );
                const url = await uploadEvidence(
                    file,
                    'Desvio',
                    descWithCat,
                    form.date,
                    form.responsible,
                    'desvio',
                    'seguridad',
                    form.location,
                    catLabel,
                    filename
                );
                uploadedUrls.push(url);
            }

            setImages(prev => [...prev, ...uploadedUrls]);
            alert(`✅ Se subieron ${uploadedUrls.length} archivos con éxito.`);
        } catch (error: any) {
            alert(`Error al subir: ${error.message}`);
        } finally {
            setIsUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const removeFile = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isUploading) return;

        if (!form.responsible || !form.category || !form.location) {
            alert("Por favor complete Responsable, Categoría y Lugar.");
            return;
        }

        if (images.length === 0) {
            alert("Debe subir al menos un archivo como evidencia.");
            return;
        }

        const newRecord: DetourEvidenceRecord = {
            id: Date.now(),
            date: form.date,
            responsible: form.responsible,
            category: form.category,
            description: form.description,
            location: form.location,
            images: images
        };

        setRecords(prev => [newRecord, ...prev]);

        // Reset
        setForm(prev => ({ ...prev, category: '', description: '', location: '' }));
        setImages([]);
        alert("Control de Desvío registrado exitosamente.");
    };

    const handleDelete = (id: number) => {
        if (confirm("¿Está seguro de eliminar este registro?")) {
            setRecords(prev => prev.filter(r => r.id !== id));
        }
    };

    const getFileName = (record: DetourEvidenceRecord) => {
        const catLabel = detourCategories.find(c => c.id === record.category)?.label || record.category;
        const catShort = catLabel.split(' ').slice(0, 3).join('_').substring(0, 20).replace(/[^a-zA-Z0-9_]/g, '');
        const lugarShort = (record.location || 'SinLugar').replace(/\s+/g, '').substring(0, 12);
        return `DESVIO_${catShort}_${lugarShort}_${record.date}`;
    };

    const generatePDF = (record: DetourEvidenceRecord) => {
        const doc = new jsPDF();
        let y = 20;

        doc.setFontSize(16);
        doc.setTextColor(20, 100, 200); // Blueish
        doc.text("REPORTE DE CONTROL DE DESVÍO", 105, y, { align: 'center' });
        y += 15;

        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(`Fecha: ${record.date}`, 20, y);
        doc.text(`Responsable: ${record.responsible}`, 80, y);
        doc.text(`Lugar: ${record.location || 'No especificado'}`, 140, y);
        y += 8;

        doc.setFont("helvetica", "bold");
        doc.text("Actividad/Categoría:", 20, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        const categoryLabel = detourCategories.find(c => c.id === record.category)?.label || record.category;
        const categoryLines = doc.splitTextToSize(categoryLabel, 170);
        doc.text(categoryLines, 20, y);
        y += (categoryLines.length * 5) + 5;

        if (record.description) {
            doc.setFont("helvetica", "bold");
            doc.text("Observaciones:", 20, y);
            y += 5;
            doc.setFont("helvetica", "normal");
            const descLines = doc.splitTextToSize(record.description, 170);
            doc.text(descLines, 20, y);
            y += (descLines.length * 5) + 5;
        }

        const imageFiles = record.images.filter(img => !img.toLowerCase().includes('.pdf'));
        const pdfFiles = record.images.filter(img => img.toLowerCase().includes('.pdf'));

        doc.setFont("helvetica", "bold");
        doc.text(`Evidencias (${record.images.length} archivos):`, 20, y);
        y += 10;

        if (pdfFiles.length > 0) {
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 255);
            pdfFiles.forEach((pdf, idx) => {
                doc.text(`Archivo PDF Adjunto: [Ver PDF ${idx + 1}]`, 25, y);
                doc.link(25, y - 4, 100, 5, { url: pdf });
                y += 6;
            });
            y += 4;
            doc.setTextColor(0);
            doc.setFontSize(10);
        }

        imageFiles.forEach((img, index) => {
            if (y > 230) {
                doc.addPage();
                y = 20;
            }
            try {
                doc.addImage(img, 'JPEG', 20, y, 170, 100);
                y += 110;
            } catch (err) {}
        });

        doc.save(`${getFileName(record)}.pdf`);
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-[1600px] mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tighter mb-2 flex items-center gap-3">
                                <ArrowUpRight className="text-blue-500" size={32} />
                                Control de Desvíos
                            </h1>
                            <p className="text-slate-400 font-medium tracking-tight">Registro de Señalización y Vigías en áreas de Desvío</p>
                        </div>
                        <div className="bg-slate-800/50 px-6 py-3 rounded-xl border border-slate-700">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">Registros Totales</p>
                            <p className="text-2xl font-black text-white text-center">{records.length}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                        {/* FORMULARIO */}
                        <div className="xl:col-span-1">
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl sticky top-6">
                                <h3 className="text-blue-400 font-bold text-lg mb-6 flex flex-wrap items-center gap-2 uppercase tracking-tight">
                                    <Upload size={20} />
                                    Nuevo Registro de Desvío
                                    {isSyncing && (
                                        <span className="flex items-center gap-1 text-[8px] bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full animate-pulse border border-blue-700/30">
                                            SINC...
                                        </span>
                                    )}
                                </h3>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Fecha</label>
                                        <div className="relative group">
                                            <Calendar className="absolute left-3 top-2.5 text-slate-500" size={16} />
                                            <input
                                                type="date"
                                                value={form.date}
                                                onChange={e => setForm({ ...form, date: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-white text-sm focus:border-blue-500 outline-none transition-colors"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Responsable</label>
                                        <div className="relative group">
                                            <User className="absolute left-3 top-2.5 text-slate-500" size={16} />
                                            <select
                                                value={form.responsible}
                                                onChange={e => setForm({ ...form, responsible: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-white text-sm focus:border-blue-500 outline-none appearance-none transition-colors"
                                                required
                                            >
                                                <option value="">Seleccionar Responsable...</option>
                                                {USER_LIST.map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
                                            </select>
                                        </div>
                                                              <div className="space-y-2">
                                        <label className="text-[10px] font-black text-emerald-400 uppercase flex items-center gap-2">
                                            <Target size={14} className="text-emerald-500" />
                                            Lugar / Zona
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-3 text-emerald-500/50">
                                                <Filter size={16} />
                                            </div>
                                            <select
                                                value={form.location}
                                                onChange={e => setForm({ ...form, location: e.target.value })}
                                                className="w-full bg-slate-950 border-2 border-emerald-500/20 rounded-xl pl-10 pr-3 py-3 text-white text-sm focus:border-emerald-500 outline-none transition-all shadow-lg shadow-emerald-500/5"
                                                required
                                            >
                                                <option value="">Seleccionar Lugar...</option>
                                                {SSOMA_LOCATIONS.map(loc => (
                                                    <option key={loc} value={loc}>{loc}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Categoría de Desvío</label>
                                        <SearchableSelect 
                                            options={detourCategories}
                                            value={form.category}
                                            onChange={(val) => setForm({ ...form, category: val })}
                                            placeholder="Seleccionar Actividad..."
                                            searchPlaceholder="Buscar actividad..."
                                            icon={<MapIcon size={16} />}
                                            variant="blue"
                                        />
 
                                        {form.category && (
                                            <div className="bg-blue-500/10 border border-blue-500/20 p-2 rounded-lg mt-1">
                                                <p className="text-[10px] text-blue-400 font-medium">
                                                    ℹ️ {detourCategories.find(c => c.id === form.category)?.hint}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                   </div>


                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Archivos (Max 9)</label>
                                        <div className="border-2 border-dashed border-slate-700 rounded-xl p-4 hover:bg-slate-800/50 transition-colors text-center cursor-pointer group relative">
                                            <input
                                                type="file"
                                                onChange={handleFileUpload}
                                                multiple
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                                            />
                                            <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-blue-400">
                                                <Upload size={24} />
                                                <span className="text-xs font-medium">Agregar Fotos o PDF</span>
                                            </div>
                                        </div>
                                    </div>

                                    {images.length > 0 && (
                                        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                                            {images.map((img, idx) => (
                                                <div key={idx} className="relative aspect-square rounded-md overflow-hidden bg-slate-900">
                                                    <iframe src={Utils.getDriveViewerUrl(img, false)} className="w-full h-full border-0 pointer-events-none" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(idx)}
                                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Save size={18} /> Guardar Desvío
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* LISTA */}
                        <div className="xl:col-span-2">
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-hidden">
                                <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                                    <FileText size={20} className="text-emerald-400" /> Rastro de Controles
                                </h3>

                                {/* FILTERS */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-blue-950/10 p-4 rounded-xl border border-blue-500/10 items-end">
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
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-[10px] text-white focus:border-blue-500 outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Responsable</label>
                                            {filterResponsible && (
                                                <button onClick={() => setFilterResponsible("")} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <SearchableSelect 
                                            options={USER_LIST.map(u => ({ id: u.name, label: u.name }))}
                                            value={filterResponsible}
                                            onChange={(val) => setFilterResponsible(val)}
                                            placeholder="Todos los responsables..."
                                            className="[&>div]:bg-slate-950 [&>div]:border-slate-700 [&>div]:py-1.5 [&>div]:px-3 [&>div]:text-[10px]"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Categoría</label>
                                            {filterCategory && (
                                                <button onClick={() => setFilterCategory("")} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <SearchableSelect 
                                            options={detourCategories}
                                            value={filterCategory}
                                            onChange={(val) => setFilterCategory(val)}
                                            placeholder="Todas las categorías..."
                                            className="[&>div]:bg-slate-950 [&>div]:border-slate-700 [&>div]:py-1.5 [&>div]:px-3 [&>div]:text-[10px]"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Lugar</label>
                                            {filterLocation && (
                                                <button onClick={() => setFilterLocation("")} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <SearchableSelect 
                                            options={SSOMA_LOCATIONS.map(loc => ({ id: loc, label: loc }))}
                                            value={filterLocation}
                                            onChange={(val) => setFilterLocation(val)}
                                            placeholder="Todos los lugares..."
                                            className="[&>div]:bg-slate-950 [&>div]:border-slate-700 [&>div]:py-1.5 [&>div]:px-3 [&>div]:text-[10px]"
                                        />
                                    </div>
                                    <div className="flex flex-col justify-end h-full">
                                        <button
                                            onClick={() => {
                                                setFilterDate("");
                                                setFilterResponsible("");
                                                setFilterCategory("");
                                                setFilterLocation("");
                                            }}
                                            className={`w-full h-[33px] rounded-lg text-[10px] font-bold uppercase transition-all border flex items-center justify-center gap-2 active:scale-95 ${
                                                (filterDate || filterResponsible || filterCategory || filterLocation)
                                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 shadow-lg shadow-red-950/20'
                                                : 'bg-slate-800/50 text-slate-500 border-slate-800 cursor-not-allowed opacity-50'
                                            }`}
                                            disabled={!(filterDate || filterResponsible || filterCategory || filterLocation)}
                                        >
                                            <RotateCcw size={12} strokeWidth={3} /> Limpiar Filtros
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
                                            <div key={m} className={`flex-1 flex flex-col items-center justify-center min-w-[45px] py-2 rounded-xl border transition-all ${count > 0 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-slate-950/50 border-slate-800/50 text-slate-600 opacity-40'}`}>
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

                                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                                    <table className="w-full min-w-[800px] text-left text-xs">
                                        <thead className="uppercase font-black text-slate-500 border-b border-slate-800">
                                            <tr>
                                                <th className="pb-3 pl-2">Fecha</th>
                                                <th className="pb-3">Responsable</th>
                                                <th className="pb-3">Categoría</th>
                                                <th className="pb-3">Lugar</th>
                                                <th className="pb-3 text-center">Fotos</th>
                                                <th className="pb-3 text-center">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {records.filter(r => {
                                                const matchesDate = filterDate === "" || r.date === filterDate;
                                                const matchesResp = filterResponsible === "" || (r.responsible?.toLowerCase() || "").includes(filterResponsible.toLowerCase());
                                                const matchesLoc = filterLocation === "" || r.location === filterLocation;
                                                const matchesCat = filterCategory === "" || r.category === filterCategory;
                                                return matchesDate && matchesResp && matchesLoc && matchesCat;
                                            }).length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="py-12 text-center text-slate-600 italic">
                                                        {records.length === 0 ? "No hay registros aún." : "No se encontraron registros con los filtros aplicados."}
                                                    </td>
                                                </tr>
                                            ) : (
                                                records
                                                    .filter(r => {
                                                        const matchesDate = filterDate === "" || r.date === filterDate;
                                                        const matchesResp = filterResponsible === "" || (r.responsible?.toLowerCase() || "").includes(filterResponsible.toLowerCase());
                                                        const matchesLoc = filterLocation === "" || r.location === filterLocation;
                                                        const matchesCat = filterCategory === "" || r.category === filterCategory;
                                                        return matchesDate && matchesResp && matchesLoc && matchesCat;
                                                    })
                                                    .map((r) => (
                                                    <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                                                        <td className="py-4 pl-2 font-mono text-white">{r.date}</td>
                                                        <td className="py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[8px] font-bold">{Utils.getInitials(r.responsible)}</div>
                                                                <span className="truncate max-w-[120px]">{r.responsible}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4">
                                                            <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-[9px] font-bold">
                                                                {detourCategories.find(c => c.id === r.category)?.label || r.category}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 font-medium">{r.location || '-'}</td>
                                                        <td className="py-4">
                                                            <div className="flex justify-center -space-x-1.5">
                                                                {r.images.slice(0, 3).map((img, i) => (
                                                                    <div key={i} className="w-7 h-7 rounded-full border border-slate-900 bg-slate-800 overflow-hidden cursor-pointer hover:scale-110 shadow-lg" onClick={() => setPreviewFile({url: img, type:'image'})}>
                                                                        <ImageIcon className="w-full h-full p-1 text-blue-400" />
                                                                    </div>
                                                                ))}
                                                                {r.images.length > 3 && <div className="w-7 h-7 rounded-full bg-slate-700 text-[8px] flex items-center justify-center font-bold">+{r.images.length - 3}</div>}
                                                            </div>
                                                        </td>
                                                        <td className="py-4">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button onClick={() => generatePDF(r)} className="p-1.5 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-slate-700 transition-colors" title="Ver PDF"><FileText size={14}/></button>
                                                                {(user?.role === 'developer' || user?.role === 'manager' || user?.name === r.responsible) && (
                                                                    <button onClick={() => handleDelete(r.id)} className="p-1.5 hover:bg-red-500/20 text-red-500 rounded-lg border border-slate-700 transition-colors" title="Eliminar"><Trash2 size={14}/></button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {previewFile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4" onClick={() => setPreviewFile(null)}>
                    <div className="relative max-w-4xl w-full flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="w-full p-4 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-white font-bold flex items-center gap-2">Vista Previa</h3>
                            <button onClick={() => setPreviewFile(null)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <div className="w-full h-[70vh] p-2 bg-black/20">
                            <iframe src={Utils.getDriveViewerUrl(previewFile.url, false)} className="w-full h-full rounded-lg border-0 shadow-2xl" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
