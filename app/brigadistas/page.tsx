"use client";

import { useState, useEffect } from "react";
import { useAuth, USER_LIST } from "@/lib/auth";
import { SSOMA_LOCATIONS } from "@/lib/locations";
import { uploadEvidence } from "@/lib/uploadClient";
import Sidebar from '@/components/Sidebar';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    FileText,
    Upload,
    Trash2,
    Save,
    Activity,
    Shield,
    Pencil,
    Users,
    X,
    Image as ImageIcon,
    AlertTriangle,
    Filter,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Download,
    FileSpreadsheet,
    FileEdit
} from "lucide-react";
import SearchableSelect from "@/components/SearchableSelect";
import { generateFilename, getInitials, getDriveViewerUrl } from "@/lib/utils";
import JSZip from 'jszip';

// --- TYPES ---
type BrigadistaRecord = {
    id: number;
    date: string;
    responsible: string;
    brigadistaType: string;
    location: string;
    fileUrl: string;
};

export default function BrigadistasPage() {
    const { user } = useAuth();

    // STATE
    const [records, setRecords] = useState<BrigadistaRecord[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [isLoaded, setIsLoaded] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        responsible: '',
        brigadistaType: '',
        location: ''
    });

    const [uploadedFiles, setUploadedFiles] = useState<{ url: string, name: string, type: string }[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [filterDate, setFilterDate] = useState("");
    const [filterResponsible, setFilterResponsible] = useState("");
    const [filterLocation, setFilterLocation] = useState("");

    const [brigadeTypes, setBrigadeTypes] = useState<string[]>([]);
    
    const [viewingFile, setViewingFile] = useState<BrigadistaRecord | null>(null);
    const [previewIndex, setPreviewIndex] = useState(0);
    const [isDownloadingBatch, setIsDownloadingBatch] = useState(false);

    useEffect(() => {
        const loadTypes = async () => {
            try {
                const res = await fetch('/api/annual-program');
                const data = await res.json();
                if (data.success && data.programData['obj11']) {
                    const items = data.programData['obj11'] as any[];
                    const uniqueTypes = Array.from(new Set(items.map(i => i.description))).filter(Boolean);
                    if (uniqueTypes.length > 0) {
                        setBrigadeTypes(uniqueTypes as string[]);
                        if (!form.brigadistaType) setForm(prev => ({ ...prev, brigadistaType: (uniqueTypes[0] as string) }));
                    } else {
                        setBrigadeTypes(["Contra Incendio", "Primeros Auxilios", "Evacuación y Rescate", "Materiales Peligrosos", "Comunicaciones"]);
                    }
                }
            } catch (e) {
                console.error("Error fetching annual program types:", e);
            }
        };
        loadTypes();
    }, []);

    useEffect(() => {
        const loadRecords = async () => {
            try {
                const res = await fetch('/api/brigadista-records');
                const data = await res.json();
                if (data.success && Array.isArray(data.records)) {
                    setRecords(data.records);
                }
            } catch (e) {
                console.error("Error loading records:", e);
            }
            setIsLoaded(true);
        };
        loadRecords();

        if (user && !form.responsible) {
            setForm(prev => ({ ...prev, responsible: user.name }));
        }
    }, [user]);

    const handleFiles = async (selectedFiles: FileList | File[]) => {
        const filesArray = Array.from(selectedFiles);
        if (filesArray.length === 0) return;

        const validFiles = filesArray.filter(f => {
            const isPdf = f.type === 'application/pdf';
            const isImage = f.type.startsWith('image/');
            return isPdf || isImage;
        });

        if (validFiles.length !== filesArray.length) {
            alert("⚠️ Algunos archivos fueron omitidos. Solo se permiten PDF e Imágenes.");
        }

        if (validFiles.length === 0) return;

        if (!form.responsible || !form.location || !form.brigadistaType) {
            alert("⚠️ Por favor completa los campos del formulario antes de subir archivos.");
            return;
        }

        setIsUploading(true);
        try {
            const newUploads = await Promise.all(validFiles.map(async (file) => {
                // 1. Preparar log para Excel
                const logData = {
                    control: "BRIGADISTAS",
                    periodo: form.date,
                    empresa: form.responsible,
                    detalle: `Tipo: ${form.brigadistaType}, Lugar: ${form.location}`
                };

                // 2. Subir archivo y anotar en Excel
                const url = await uploadEvidence(
                    file,
                    'Formacion',
                    `BRIG_${form.brigadistaType}_${form.location}`,
                    form.date,
                    form.responsible,
                    'Brigadistas',
                    'Seguridad',
                    form.location,
                    undefined,
                    logData // Enviar datos al Excel
                );
                return { url, name: file.name, type: file.type };
            }));

            setUploadedFiles(prev => [...prev, ...newUploads]);
        } catch (error: any) {
            console.error(error);
            alert(`Error al subir algunos archivos: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) handleFiles(e.target.files);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    };

    const resetForm = () => {
        setEditingId(null);
        setForm({
            date: new Date().toISOString().split('T')[0],
            responsible: user?.name || '',
            brigadistaType: '',
            location: ''
        });
        setUploadedFiles([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.responsible || !form.location || !form.date || !form.brigadistaType) {
            alert("Por favor completa todos los campos del formulario.");
            return;
        }

        if (uploadedFiles.length === 0 && !editingId) {
            alert("Es obligatorio subir al menos una evidencia (Imagen o PDF).");
            return;
        }

        const joinedUrls = uploadedFiles.map(f => f.url).join('|');

        const payload = {
            date: form.date,
            responsible: form.responsible,
            brigadistaType: form.brigadistaType,
            location: form.location,
            fileUrl: joinedUrls
        };

        try {
            const res = await fetch('/api/brigadista-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: editingId ? 'update' : 'create', 
                    id: editingId, 
                    data: payload,
                    userName: user?.name 
                })
            });
            const result = await res.json();

            if (result.success) {
                if (editingId) {
                    setRecords(prev => prev.map(r => r.id === editingId ? { ...payload, id: editingId, fileUrl: payload.fileUrl || r.fileUrl } : r));
                    alert("✅ Registro actualizado.");
                } else {
                    setRecords(prev => [{ ...payload, id: result.id }, ...prev]);
                    alert("✅ Actividad de brigada registrada.");
                }
                resetForm();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        }
    };

    const handleEdit = (record: BrigadistaRecord) => {
        setEditingId(record.id);
        setForm({
            date: record.date,
            responsible: record.responsible,
            brigadistaType: record.brigadistaType,
            location: record.location
        });
        
        if (record.fileUrl) {
            const urls = record.fileUrl.split('|').filter(Boolean);
            setUploadedFiles(urls.map(url => ({ 
                url, 
                name: url.split('/').pop() || 'archivo', 
                type: url.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg' 
            })));
        } else {
            setUploadedFiles([]);
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Eliminar este registro?")) return;
        try {
            const res = await fetch('/api/brigadista-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', id, userName: user?.name })
            });
            if ((await res.json()).success) {
                setRecords(prev => prev.filter(r => r.id !== id));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleBatchDownload = async () => {
        const filteredRecords = records.filter(r => (filterDate === "" || r.date === filterDate) && (filterResponsible === "" || r.responsible.toLowerCase().includes(filterResponsible.toLowerCase())) && (filterLocation === "" || r.location === filterLocation));
        if (!filteredRecords || filteredRecords.length === 0) {
            alert("No hay registros para descargar con los filtros actuales.");
            return;
        }
        
        setIsDownloadingBatch(true);
        try {
            const zip = new JSZip();
            const folder = zip.folder("Evidencias_Brigadas");
            
            let count = 0;
            for (const record of filteredRecords) {
                if (!record.fileUrl) continue;
                const urls = record.fileUrl.split('|').filter(Boolean);
                
                for (let i = 0; i < urls.length; i++) {
                    const url = urls[i];
                    try {
                        const response = await fetch(url);
                        const blob = await response.blob();
                        
                        const isImage = url.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/i);
                        const ext = isImage ? 'jpg' : (url.toLowerCase().match(/\.(pdf|doc|docx|xls|xlsx)$/i)?.[1] || 'pdf');
                        
                        const baseName = generateFilename(`BRIG_${record.brigadistaType}`, record.date, record.responsible, ext as any, 'evidencia', record.location, 'seguridad');
                        const finalName = urls.length > 1 ? baseName.replace(`.${ext}`, `_part${i+1}.${ext}`) : baseName;
                        
                        folder?.file(finalName, blob);
                        count++;
                    } catch (e) {
                        console.error("Error downloading file for zip:", url, e);
                    }
                }
            }
            
            if (count === 0) {
                alert("No se pudieron descargar los archivos (posible bloqueo de red/CORS). Intente descarga individual.");
                setIsDownloadingBatch(false);
                return;
            }
            
            const content = await zip.generateAsync({ type: "blob" });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `Evidencias_Brigadas_${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (error) {
            console.error("Error creating zip:", error);
            alert("Ocurrió un error al generar el archivo ZIP.");
        } finally {
            setIsDownloadingBatch(false);
        }
    };

    return (
        <div className="flex bg-transparent text-slate-200 font-sans overflow-hidden selection:bg-red-500/30 w-full">
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-[1600px] mx-auto space-y-8">
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tighter mb-2 flex items-center gap-3">
                                <Users className="text-red-500" size={32} />
                                Control de Brigadistas
                            </h1>
                            <p className="text-slate-400 font-medium">Gestión y Seguimiento de Brigadas de Emergencia</p>
                        </div>
                        <div className="bg-slate-800/50 px-6 py-3 rounded-xl border border-slate-700">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Actividades</p>
                            <p className="text-2xl font-black text-white">{records.length}</p>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        <div className="xl:col-span-1 space-y-6">
                            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative text-slate-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-white uppercase text-sm tracking-widest font-black">
                                        <Upload size={18} className="text-red-400" /> {editingId ? 'Editar Brigada' : 'Nueva Actividad'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Fecha</label>
                                            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Responsable</label>
                                            <select value={form.responsible} onChange={e => setForm({ ...form, responsible: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none">
                                                <option value="">Seleccionar...</option>
                                                {USER_LIST.map(u => <option key={u.username} value={u.name}>{u.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Tipo de Brigada / Actividad</label>
                                            <select value={form.brigadistaType} onChange={e => setForm({ ...form, brigadistaType: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none">
                                                <option value="">Seleccionar tipo...</option>
                                                {brigadeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Zona / Lugar</label>
                                            <select value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none">
                                                <option value="">Seleccionar lugar...</option>
                                                {SSOMA_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5 pt-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                                Zona de Carga (PDF o Imágenes)
                                            </label>
                                            <div 
                                                onDragOver={handleDrag}
                                                onDragLeave={handleDrag}
                                                onDrop={handleDrop}
                                                className={`relative border-2 border-dashed rounded-3xl p-8 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group ${
                                                    isUploading ? 'border-amber-500 bg-amber-500/5 cursor-wait' :
                                                    dragActive ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]' : 
                                                    uploadedFiles.length > 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/30'
                                                }`}
                                            >
                                                <input 
                                                    type="file"
                                                    multiple
                                                    accept=".pdf,image/*"
                                                    disabled={isUploading}
                                                    onChange={handleFileInput}
                                                    className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-wait"
                                                />
                                                <div className={`p-4 rounded-2xl transition-all ${
                                                    isUploading ? 'bg-amber-500 text-white animate-pulse' :
                                                    dragActive ? 'bg-emerald-500 text-white' : 
                                                    'bg-slate-800 text-slate-400 group-hover:text-emerald-400'
                                                }`}>
                                                    {isUploading ? <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={32} />}
                                                </div>
                                                <div className="text-center">
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${isUploading ? 'text-amber-500' : 'text-white'}`}>
                                                        {isUploading ? `SUBIENDO... ${uploadProgress.total > 1 ? `(${uploadProgress.current}/${uploadProgress.total})` : ''}` : dragActive ? '¡SUELTA!' : uploadedFiles.length > 0 ? `✅ ${uploadedFiles.length} ARCHIVOS LISTOS` : 'ARRASTRA O HAZ CLIC'}
                                                    </p>
                                                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">
                                                        Soporta PDF e Imágenes
                                                    </p>
                                                </div>
                                            </div>

                                            {/* File List Previews */}
                                            {uploadedFiles.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-3">
                                                    {uploadedFiles.map((f, idx) => (
                                                        <div key={idx} className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2 animate-in zoom-in-95 group">
                                                            {f.type.startsWith('image/') ? <ImageIcon size={12} className="text-teal-400" /> : <FileText size={12} className="text-red-400" />}
                                                            <span className="text-[9px] font-bold text-slate-300 truncate max-w-[100px]">{f.name}</span>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))} 
                                                                className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button type="submit" disabled={isUploading} className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-4">
                                            <Save size={18} /> {editingId ? 'ACTUALIZAR' : 'GUARDAR'}
                                        </button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="xl:col-span-2 space-y-6">
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl min-h-[500px]">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Activity className="text-red-500" size={20} /> Rastro de Brigadas
                                    </h3>
                                    <div className="text-[10px] font-mono text-slate-500 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                                        {records.filter(r => {
                                            const matchesLoc = !filterLocation || r.location === filterLocation;
                                            const matchesResp = !filterResponsible || r.responsible.toLowerCase().includes(filterResponsible.toLowerCase());
                                            const matchesDate = !filterDate || r.date === filterDate;
                                            return matchesLoc && matchesResp && matchesDate;
                                        }).length} REGISTROS
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
                                            <label className="text-[9px] font-black text-slate-500 uppercase">Responsable</label>
                                            {filterResponsible && (
                                                <button onClick={() => setFilterResponsible('')} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <input 
                                            type="text"
                                            placeholder="Buscar..."
                                            value={filterResponsible}
                                            onChange={e => setFilterResponsible(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-red-500 outline-none"
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
                                    <div className="flex flex-col justify-end h-full">
                                        {(filterLocation || filterDate || filterResponsible) && (
                                            <button 
                                                onClick={() => { setFilterLocation(''); setFilterDate(''); setFilterResponsible(''); }}
                                                className="w-full h-[33px] bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] font-bold uppercase transition-colors border border-red-500/20 flex items-center justify-center gap-2 active:scale-95 mb-2"
                                            >
                                                <X size={14} strokeWidth={3} /> Limpiar Filtros
                                            </button>
                                        )}
                                        <button 
                                            onClick={handleBatchDownload}
                                            disabled={isDownloadingBatch || records.filter(r => (filterDate === "" || r.date === filterDate) && (filterResponsible === "" || r.responsible.toLowerCase().includes(filterResponsible.toLowerCase())) && (filterLocation === "" || r.location === filterLocation)).length === 0}
                                            className="w-full h-[33px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold uppercase transition-colors border border-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isDownloadingBatch ? (
                                                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Download size={14} strokeWidth={3} />
                                            )}
                                            Descargar Zip
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
                                    <div className="flex flex-col items-center justify-center min-w-[70px] py-2 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 ml-auto">
                                        <span className="text-[7px] font-black uppercase tracking-tighter">TOTAL</span>
                                        <span className="text-[10px] font-black">{records.length}</span>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-[10px] uppercase font-black text-slate-500 border-b border-slate-800">
                                                <th className="pb-4 pl-4">Fecha</th>
                                                <th className="pb-4">Tipo</th>
                                                <th className="pb-4">Responsable</th>
                                                <th className="pb-4">Lugar</th>
                                                <th className="pb-4 text-center">Evidencia</th>
                                                <th className="pb-4 text-right pr-4">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50 text-sm">
                                            {records.filter(r => (filterDate === "" || r.date === filterDate) && (filterResponsible === "" || r.responsible.toLowerCase().includes(filterResponsible.toLowerCase())) && (filterLocation === "" || r.location === filterLocation)).map((record) => (
                                                <tr key={record.id} className="hover:bg-slate-800/30 transition-colors">
                                                    <td className="py-4 pl-4 font-mono">{record.date}</td>
                                                    <td className="py-4"><span className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-bold uppercase">{record.brigadistaType}</span></td>
                                                    <td className="py-4">{record.responsible}</td>
                                                    <td className="py-4 text-slate-400 text-xs">{record.location}</td>
                                                    <td className="py-4 text-center">
                                                        {record.fileUrl && (() => {
                                                            const urls = record.fileUrl.split('|').filter(Boolean);
                                                            if (urls.length === 0) return null;
                                                            const firstUrl = urls[0];
                                                            const isImage = firstUrl.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/i);
                                                            const isPdf = firstUrl.toLowerCase().match(/\.pdf$/i);
                                                            
                                                            return (
                                                                <div className="relative inline-block">
                                                                    <div 
                                                                        className={`w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto cursor-pointer hover:bg-slate-700 transition-all ${isImage ? 'overflow-hidden' : ''}`}
                                                                        onClick={() => { setViewingFile(record); setPreviewIndex(0); }}
                                                                        title="Ver Archivo(s)"
                                                                    >
                                                                        {isImage ? (
                                                                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800">
                                                                                <ImageIcon size={14} className="text-blue-400 mb-0.5" />
                                                                                <span className="text-[7px]">FOTO</span>
                                                                            </div>
                                                                        ) : isPdf ? <FileText size={16} className="text-red-400" /> : <FileText size={16} className="text-slate-500" />}
                                                                    </div>
                                                                    {urls.length > 1 && (
                                                                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-lg ring-2 ring-slate-900">
                                                                            +{urls.length - 1}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="py-4 text-right pr-4">
                                                        <div className="flex justify-end gap-1">
                                                            {(user?.role === 'developer' || user?.role === 'manager' || user?.name === record.responsible) && (
                                                                <>
                                                                    <button onClick={() => handleEdit(record)} className="p-2 text-slate-500 hover:text-blue-400"><Pencil size={14}/></button>
                                                                    <button onClick={() => handleDelete(record.id)} className="p-2 text-slate-500 hover:text-red-400"><Trash2 size={14}/></button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* PREVIEW MODAL */}
            {viewingFile && (() => {
                const urls = viewingFile.fileUrl ? viewingFile.fileUrl.split('|').filter(Boolean) : [];
                if (urls.length === 0) return null;
                const currentUrl = urls[previewIndex] || urls[0];
                
                const isImage = currentUrl.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/i);
                const isPdf = currentUrl.toLowerCase().match(/\.pdf$/i);
                const isWord = currentUrl.toLowerCase().match(/\.(doc|docx)$/i);
                const isExcel = currentUrl.toLowerCase().match(/\.(xls|xlsx)$/i);

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setViewingFile(null)}>
                        <div className="relative bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-white font-bold flex items-center gap-2">
                                        {isPdf ? <FileText size={20} className="text-red-400" /> : 
                                         isWord ? <FileEdit size={20} className="text-blue-400" /> :
                                         isExcel ? <FileSpreadsheet size={20} className="text-emerald-400" /> :
                                         <ImageIcon size={20} className="text-blue-400" />}
                                        Vista Previa {urls.length > 1 && <span className="text-slate-400 text-sm ml-2 font-normal">(Archivo {previewIndex + 1} de {urls.length})</span>}
                                    </h3>
                                    {(user?.role === 'developer' || user?.role === 'manager' || user?.name === viewingFile.responsible) && (
                                        <button 
                                            onClick={() => {
                                                handleEdit(viewingFile);
                                                setViewingFile(null);
                                            }}
                                            className="ml-4 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-xs font-bold uppercase transition-colors border border-amber-500/20 flex items-center gap-2"
                                        >
                                            <Pencil size={14} /> Cambiar Evidencia
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {urls.length > 1 && (
                                        <div className="flex items-center gap-1 mr-4 bg-slate-950 rounded-lg p-1 border border-slate-800">
                                            <button 
                                                onClick={() => setPreviewIndex(prev => prev > 0 ? prev - 1 : urls.length - 1)}
                                                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                                            >
                                                <ChevronLeft size={16} />
                                            </button>
                                            <button 
                                                onClick={() => setPreviewIndex(prev => prev < urls.length - 1 ? prev + 1 : 0)}
                                                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    )}
                                    <a
                                        href={currentUrl}
                                        download
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                                        title="Descargar este archivo"
                                    >
                                        <Download size={18} /> Descargar Individual
                                    </a>
                                    <button onClick={() => setViewingFile(null)} className="p-2 hover:bg-red-900/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors ml-2">
                                        <Trash2 size={24} className="rotate-45" />
                                    </button>
                                </div>
                            </div>
                            <div className="w-full h-[75vh] flex items-center justify-center p-4 relative group">
                                {urls.length > 1 && (
                                    <>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setPreviewIndex(prev => prev > 0 ? prev - 1 : urls.length - 1); }}
                                            className="absolute left-4 z-10 p-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-slate-700 shadow-xl"
                                        >
                                            <ChevronLeft size={24} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setPreviewIndex(prev => prev < urls.length - 1 ? prev + 1 : 0); }}
                                            className="absolute right-4 z-10 p-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-slate-700 shadow-xl"
                                        >
                                            <ChevronRight size={24} />
                                        </button>
                                    </>
                                )}
                                <iframe 
                                    src={getDriveViewerUrl(currentUrl, false)} 
                                    className="w-full h-full min-h-[60vh] rounded-lg border border-slate-800 shadow-2xl bg-slate-950" 
                                    title="File Preview">
                                </iframe>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
