"use client";

import { useState, useEffect } from "react";
import {
    FileText,
    Download,
    Search,
    ShieldCheck,
    Calendar,
    Target,
    Filter,
    Activity as ActivityIcon,
    CalendarDays,
    Upload,
    Trash2,
    Edit,
    Image as ImageIcon,
    User,
    File,
    FileSpreadsheet,
    FileEdit,
    X,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import SearchableSelect from "@/components/SearchableSelect";
import PreviewCarouselModal from "@/components/PreviewCarouselModal";
import BatchDownloadZip from "@/components/BatchDownloadZip";
import { DashboardData, UploadContext } from "@/lib/types";
import { generateFilename, getInitials, getDriveViewerUrl } from "@/lib/utils";
import { uploadEvidence } from "@/lib/uploadClient";
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { SSOMA_LOCATIONS } from "@/lib/locations";
import { Save as SaveIcon } from "lucide-react"; // I noticed SaveIcon was missing or inconsistent
import { USER_LIST, useAuth } from "@/lib/auth";


interface EvidencePageProps {
    data: DashboardData;
}

// REMOVED STATIC ACTIVITIES - Now fetched from Annual Program OBJ 05
const INITIAL_EMO_ACTIVITIES = ["Exámenes Médico Ocupacional (EMO)"];

// Objetivos específicos solicitados (Solo EMO)
const TARGET_OBJECTIVES = [
    { id: 'OBJ 05', label: 'Control de EMO' },
];

const RESPONSIBLES = USER_LIST.map(user => user.name);

type EvidenceRecord = {
    id: number;
    date: string;
    responsible: string;
    objective: string;
    description: string;
    location: string;
    fileType: 'pdf' | 'image' | 'word' | 'excel';
    fileUrl: string;
};

export default function EvidenceCenter({ data }: EvidencePageProps) {
    const { user } = useAuth();
    // STATE
    const [records, setRecords] = useState<EvidenceRecord[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        responsible: '',
        objective: 'OBJ 05',
        activity: '',
        location: ''
    });

    const [uploadedFiles, setUploadedFiles] = useState<{ url: string, name: string, type: 'pdf' | 'image' | 'word' | 'excel' }[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [viewingFile, setViewingFile] = useState<EvidenceRecord | null>(null);
    const [previewIndex, setPreviewIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [emoActivities, setEmoActivities] = useState<string[]>(INITIAL_EMO_ACTIVITIES);
    const [isDownloadingBatch, setIsDownloadingBatch] = useState(false);

    // LOAD DYNAMIC ACTIVITIES FROM ANNUAL PROGRAM (OBJ 05)
    useEffect(() => {
        const loadProgram = async () => {
            try {
                const res = await fetch('/api/annual-program');
                const data = await res.json();
                if (data.success && data.programData['obj5']) {
                    const items = data.programData['obj5'] as any[];
                    const uniqueDescs = Array.from(new Set(items.map(i => i.description).filter(Boolean))) as string[];
                    if (uniqueDescs.length > 0) {
                        setEmoActivities(uniqueDescs);
                        // Auto-set first activity if empty
                        if (!form.activity && uniqueDescs.length > 0) {
                            setForm(prev => ({ ...prev, activity: uniqueDescs[0] }));
                        }
                    }
                }
            } catch (e) {
                console.error("Error loading program for EMO:", e);
            }
        };
        loadProgram();
    }, []);

    // Filters State
    const [filters, setFilters] = useState({
        date: '',
        activity: '',
        responsible: '',
        location: '',
        objective: ''
    });

    // Filtered Records
    const filteredRecords = (records || []).filter(r => {
        if (!r || typeof r !== 'object') return false;
        const matchDate = !filters.date || r.date === filters.date;
        const matchAct = !filters.activity || (r.description || r.activity) === filters.activity;
        const matchResp = !filters.responsible || (r.responsible || r.responsable) === filters.responsible;
        const matchLoc = !filters.location || (r.location || r.zona) === filters.location;
        const matchObj = !filters.objective || r.objective === filters.objective;
        return matchDate && matchAct && matchResp && matchLoc && matchObj;
    });

    // Derive filter options
    const filterOptions = {
        dates: Array.from(new Set((records || []).filter(r => r && r.date).map(r => r.date))).sort().reverse(),
        activities: Array.from(new Set((records || []).filter(r => r && (r.description || r.activity)).map(r => r.description || r.activity))).sort(),
        responsibles: Array.from(new Set((records || []).filter(r => r && (r.responsible || r.responsable)).map(r => r.responsible || r.responsable))).sort(),
        locations: Array.from(new Set((records || []).filter(r => r && (r.location || r.zona)).map(r => r.location || r.zona))).sort(),
        objectives: Array.from(new Set((records || []).filter(r => r && r.objective).map(r => r.objective))).sort()
    };

    // LOAD DATA - Cloud first, then localStorage fallback
    const loadRecords = async (silent = false) => {
        if (!silent) setIsSyncing(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        try {
            const res = await fetch('/api/evidence-records', { signal: controller.signal });
            const data = await res.json();
            if (data.success && data.records.length > 0) {
                // Map from DB format to component format
                const filtered = (data.records || []).map((r: any) => ({
                    id: r.id || r.record_id,
                    date: r.date,
                    responsible: r.responsable || r.responsible,
                    objective: r.objective,
                    description: r.activity || r.description,
                    location: r.zona || r.location || '',
                    fileType: r.file_type || r.fileType,
                    fileUrl: r.file_url || r.fileUrl
                })).filter((r: any) => r.objective === 'OBJ 05');
                
                setRecords(filtered);
                localStorage.setItem('evidence_center_records', JSON.stringify(filtered));
                setIsLoaded(true);
            }
        } catch (error) {
            console.warn('Silent sync failed or timed out:', error);
        } finally {
            clearTimeout(timeoutId);
            if (!silent) setIsSyncing(false);
        }
    };

    useEffect(() => {
        loadRecords(); // Primera carga NO es silenciosa para que veas que funciona
        const interval = setInterval(() => loadRecords(true), 30000); // Sincronización de fondo SILENCIOSA
        return () => clearInterval(interval);
    }, []);

    // SAVE DATA - Local + Cloud sync
    useEffect(() => {
        if (isLoaded && records.length >= 0) {
            localStorage.setItem('evidence_center_records', JSON.stringify(records));
            // Sync to cloud (fire and forget)
            fetch('/api/evidence-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records })
            }).catch(e => console.warn('Evidence records cloud sync failed:', e));
        }
    }, [records, isLoaded]);

    // DRAFT PERSISTENCE
    useEffect(() => {
        if (!editingId) {
            localStorage.setItem('evidence_form_draft_v1', JSON.stringify(form));
        }
    }, [form, editingId]);

    // DRAFT LOAD
    useEffect(() => {
        const savedDraft = localStorage.getItem('evidence_form_draft_v1');
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                if (!form.activity && !form.responsible) {
                    setForm(prev => ({ ...prev, ...draft }));
                }
            } catch (e) {
                console.error("Error loading evidence draft", e);
            }
        }
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const filesArray = Array.from(e.target.files || []);
        if (filesArray.length === 0) return;

        // Validar datos antes de subir
        if (!form.responsible || !form.activity || !form.location) {
            alert("⚠️ Por favor completa RESPONSABLE, ACTIVIDAD y LUGAR antes de subir el archivo.\n\nEsto asegura que el archivo se nombre correctamente con sus prefijos en Google Drive.");
            e.target.value = '';
            return;
        }

        const validFiles = filesArray.filter(file => {
            const isImage = file.type.startsWith('image/');
            const isPdf = file.type === 'application/pdf';
            const isWord = file.type === 'application/msword' || 
                           file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            const isExcel = file.type === 'application/vnd.ms-excel' || 
                            file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            
            const fileSizeMB = file.size / 1024 / 1024;
            if (fileSizeMB > 50) {
                alert(`❌ ARCHIVO DEMASIADO PESADO (${fileSizeMB.toFixed(2)}MB omitido).\nEl límite máximo permitido es de 50MB.`);
                return false;
            }
            return isImage || isPdf || isWord || isExcel;
        });

        if (validFiles.length !== filesArray.length) {
            alert("⚠️ Algunos archivos fueron omitidos por peso o formato no soportado.");
        }

        if (validFiles.length === 0) {
            e.target.value = '';
            return;
        }

        // Determinar Contexto (Carpeta)
        let context: UploadContext = 'Actividad';
        if (form.objective === 'OBJ 01') context = 'Formacion';
        else if (form.objective === 'OBJ 10' || form.objective === 'OBJ 11') context = 'PMA';

        // Determinar el Nombre Completo del Objetivo para la carpeta
        const objectiveObj = TARGET_OBJECTIVES.find(o => o.id === form.objective);
        const objectiveLabel = objectiveObj ? objectiveObj.label : form.objective;

        // Determinar Área para el prefijo
        let area: string = 'seguridad';
        if (context === 'PMA') area = 'medio_ambiente';
        else if (form.objective === 'OBJ 01') area = 'seguridad';

        setIsUploading(true);
        try {
            const newUploads = await Promise.all(validFiles.map(async (file) => {
                const isImage = file.type.startsWith('image/');
                const isPdf = file.type === 'application/pdf';
                const isWord = file.type === 'application/msword' || 
                               file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

                const url = await uploadEvidence(
                    file,
                    context,
                    form.activity,
                    form.date,
                    form.responsible,
                    'evidencia',
                    area,
                    form.location,
                    objectiveLabel
                );
                
                return {
                    url: url,
                    name: file.name,
                    type: isImage ? 'image' : (isPdf ? 'pdf' : (isWord ? 'word' : 'excel'))
                } as any;
            }));

            setUploadedFiles(prev => [...prev, ...newUploads]);
        } catch (error: any) {
            console.error(error);
            alert(`Error al subir algunos archivos: ${error.message}`);
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isUploading) {
            alert("⏳ Por favor espere a que termine de subir el archivo...");
            return;
        }

        // Validaciones generales
        if (!form.responsible || !form.activity || !form.location) {
            alert("Por favor completa Responsable, Actividad y Lugar.");
            return;
        }

        // Si es nuevo registro, archivo es obligatorio
        if (!editingId && uploadedFiles.length === 0) {
            alert("Debes subir al menos un archivo obligatoriamente.");
            return;
        }

        const joinedUrls = uploadedFiles.map(f => f.url).join('|');
        // Let's store primary fileType as the first one or just 'pdf' if mixed, it's mostly visual.
        const joinedTypes = uploadedFiles.length > 0 ? uploadedFiles[0].type : 'pdf';

        const updatedRecords = editingId 
            ? records.map(r => {
                if (r.id === editingId) {
                    return {
                        ...r,
                        date: form.date,
                        responsible: form.responsible,
                        objective: form.objective,
                        description: form.activity,
                        location: form.location,
                        fileType: joinedTypes,
                        fileUrl: joinedUrls || r.fileUrl
                    };
                }
                return r;
            })
            : [{
                id: Date.now(),
                date: form.date,
                responsible: form.responsible,
                objective: form.objective,
                description: form.activity,
                location: form.location,
                fileType: joinedTypes,
                fileUrl: joinedUrls
            } as EvidenceRecord, ...records];

        setRecords(updatedRecords);

        // PERSIST TO DB
        try {
            setIsSyncing(true);
            const res = await fetch('/api/evidence-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    records: updatedRecords, 
                    userName: user?.name || 'Usuario' 
                })
            });
            if (res.ok) {
                alert(editingId ? "Registro actualizado correctamente." : "Evidencia guardada exitosamente.");
            } else {
                console.error("Failed to sync with DB");
                alert("Error al sincronizar con la nube, pero se guardó localmente.");
            }
        } catch (e) {
            console.error("Error syncing:", e);
        } finally {
            setIsSyncing(false);
            setEditingId(null);
            setUploadedFiles([]);
            // @ts-ignore
            setForm(prev => ({ ...prev, activity: '', location: '' }));
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar este registro?")) return;
        
        const updated = records.filter(r => r.id !== id);
        setRecords(updated);
        
        try {
            setIsSyncing(true);
            await fetch('/api/evidence-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    records: updated, 
                    userName: user?.name || 'Usuario' 
                })
            });
        } catch (e) {
            console.error("Error deleting:", e);
        } finally {
            setIsSyncing(false);
            if (editingId === id) {
                setEditingId(null);
                setUploadedFiles([]);
                // @ts-ignore
                setForm(f => ({ ...f, activity: '', responsible: '' }));
            }
        }
    };

    const handleEdit = (record: EvidenceRecord) => {
        setForm({
            date: record.date,
            responsible: record.responsible,
            objective: record.objective,
            activity: record.description,
            location: record.location
        });
        setEditingId(record.id);
        
        if (record.fileUrl) {
            const urls = record.fileUrl.split('|').filter(Boolean);
            setUploadedFiles(urls.map(url => {
                const lowerUrl = url.toLowerCase();
                let type: 'pdf'|'image'|'word'|'excel' = 'image';
                if (lowerUrl.endsWith('.pdf')) type = 'pdf';
                else if (lowerUrl.endsWith('.doc') || lowerUrl.endsWith('.docx')) type = 'word';
                else if (lowerUrl.endsWith('.xls') || lowerUrl.endsWith('.xlsx')) type = 'excel';
                return { url, name: url.split('/').pop() || 'archivo', type };
            }));
        } else {
            setUploadedFiles([]);
        }
        // Scroll to form (opcional, simple UX)
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDownload = (record: EvidenceRecord) => {
        const urls = record.fileUrl ? record.fileUrl.split('|').filter(Boolean) : [];
        if (urls.length === 0) return;

        urls.forEach((url, index) => {
            const isImage = url.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/i);
            const isPdf = url.toLowerCase().match(/\.pdf$/i);
            const isWord = url.toLowerCase().match(/\.(doc|docx)$/i);
            const isExcel = url.toLowerCase().match(/\.(xls|xlsx)$/i);
            
            let ext = 'pdf';
            if (isImage) ext = 'jpg';
            else if (isWord) ext = 'docx';
            else if (isExcel) ext = 'xlsx';

            if (isImage) {
                // If it's an image, convert to PDF
                const doc = new jsPDF();
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.src = url;

                img.onload = () => {
                    const pageWidth = doc.internal.pageSize.getWidth();
                    const pageHeight = doc.internal.pageSize.getHeight();
                    const margin = 10;
                    const maxWidth = pageWidth - (margin * 2);
                    const maxHeight = pageHeight - (margin * 2);

                    const widthRatio = maxWidth / img.width;
                    const heightRatio = maxHeight / img.height;
                    const ratio = Math.min(widthRatio, heightRatio, 1);

                    const finalWidth = img.width * ratio;
                    const finalHeight = img.height * ratio;
                    const x = (pageWidth - finalWidth) / 2;
                    const y = (pageHeight - finalHeight) / 2;

                    doc.addImage(img, 'JPEG', x, y, finalWidth, finalHeight);

                    const context = record.objective === 'OBJ 01' ? 'Formacion' : (record.objective === 'OBJ 10' || record.objective === 'OBJ 11' ? 'PMA' : 'Actividad');
                    const area = context === 'PMA' ? 'medio_ambiente' : 'seguridad';
                    const baseName = generateFilename(record.description, record.date, record.responsible, 'pdf', 'evidencia', undefined, area);
                    const finalName = urls.length > 1 ? baseName.replace('.pdf', `_part${index+1}.pdf`) : baseName;
                    
                    doc.save(finalName);
                };
            } else {
                // Direct download
                const link = document.createElement('a');
                link.href = url;
                
                const context = record.objective === 'OBJ 01' ? 'Formacion' : (record.objective === 'OBJ 10' || record.objective === 'OBJ 11' ? 'PMA' : 'Actividad');
                const area = context === 'PMA' ? 'medio_ambiente' : 'seguridad';
                
                const baseName = generateFilename(record.description, record.date, record.responsible, ext as any, 'evidencia', undefined, area);
                link.download = urls.length > 1 ? baseName.replace(`.${ext}`, `_part${index+1}.${ext}`) : baseName;
                
                link.target = "_blank";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        });
    };

    const handleBatchDownload = async () => {
        if (!filteredRecords || filteredRecords.length === 0) {
            alert("No hay registros para descargar con los filtros actuales.");
            return;
        }
        
        setIsDownloadingBatch(true);
        try {
            const zip = new JSZip();
            const folder = zip.folder("Evidencias_EMO");
            
            let count = 0;
            for (const record of filteredRecords) {
                if (!record.fileUrl) continue;
                const urls = record.fileUrl.split('|').filter(Boolean);
                
                for (let i = 0; i < urls.length; i++) {
                    const url = urls[i];
                    try {
                        // We use a proxy or direct fetch if CORS allows. For Google Drive it might fail CORS, 
                        // but if direct links work in fetch:
                        const response = await fetch(url);
                        const blob = await response.blob();
                        
                        const isImage = url.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/i);
                        const ext = isImage ? 'jpg' : (url.toLowerCase().match(/\.(pdf|doc|docx|xls|xlsx)$/i)?.[1] || 'pdf');
                        
                        const context = record.objective === 'OBJ 01' ? 'Formacion' : (record.objective === 'OBJ 10' || record.objective === 'OBJ 11' ? 'PMA' : 'Actividad');
                        const area = context === 'PMA' ? 'medio_ambiente' : 'seguridad';
                        
                        const baseName = generateFilename(record.description, record.date, record.responsible, ext as any, 'evidencia', undefined, area);
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
            link.download = `Evidencias_EMO_${new Date().toISOString().split('T')[0]}.zip`;
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

    const handleView = (record: EvidenceRecord) => {
        setViewingFile(record);
        setPreviewIndex(0);
    };

    // Obtener actividades dinámicas
    const currentActivities = emoActivities;

    return (
        <div className="min-h-screen bg-transparent relative overflow-hidden">
            <div className="relative p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter mb-2 flex items-center gap-3">
                        <ActivityIcon className="text-rose-500" size={32} />
                        Control de EMO
                    </h1>
                    <p className="text-slate-400 font-medium">Registro de Exámenes Médicos Ocupacionales</p>
                </div>
                <div className="bg-slate-950 px-6 py-3 rounded-xl border border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Registros</p>
                    <p className="text-2xl font-black text-white">{records.length}</p>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* FORMULARIO DE REGISTRO */}
                <div className="xl:col-span-1">
                    <div className={`border rounded-2xl p-6 shadow-2xl sticky top-6 transition-colors ${editingId ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-slate-900 border-slate-800'}`}>
                        <h3 className={`${editingId ? 'text-indigo-400' : 'text-rose-400'} font-bold text-lg mb-6 flex flex-wrap items-center gap-2`}>
                            {editingId ? <Edit size={20} /> : <Upload size={20} />}
                            {editingId ? 'Editando Evidencia' : 'Registro de Evidencia'}
                            {isSyncing && (
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1 text-[8px] bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full animate-pulse border border-blue-700/30">
                                        <span className="w-1 h-1 bg-blue-400 rounded-full animate-ping"></span>
                                        SINCRONIZANDO...
                                    </span>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            if (confirm("¿Forzar el reinicio del estado de sincronización? Esto desbloqueará el botón de guardar.")) {
                                                setIsSyncing(false);
                                            }
                                        }}
                                        className="text-[8px] font-black text-blue-400 hover:text-blue-300 underline uppercase tracking-widest"
                                    >
                                        Forzar Reset
                                    </button>
                                </div>
                            )}
                            {isUploading && (
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1 text-[8px] bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded-full animate-pulse border border-indigo-700/30">
                                        <span className="w-1 h-1 bg-indigo-400 rounded-full animate-ping"></span>
                                        SUBIENDO...
                                    </span>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            if (confirm("¿Forzar la cancelación del estado de carga? (El archivo podría seguir subiéndose en segundo plano pero la interfaz se desbloqueará)")) {
                                                setIsUploading(false);
                                            }
                                        }}
                                        className="text-[8px] font-black text-red-400 hover:text-red-300 underline uppercase tracking-widest"
                                    >
                                        Forzar Cancelar
                                    </button>
                                </div>
                            )}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase">Fecha</label>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={e => setForm({ ...form, date: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase">Responsable</label>
                                <select
                                    value={form.responsible}
                                    onChange={e => setForm({ ...form, responsible: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                                >
                                    <option value="">Seleccionar...</option>
                                    {RESPONSIBLES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase">Actividad / Tema</label>
                                <select
                                    value={form.activity}
                                    onChange={e => setForm({ ...form, activity: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                                    required
                                >
                                    <option value="">Seleccionar Actividad...</option>
                                    {emoActivities.map(act => (
                                        <option key={act} value={act}>{act}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase">Área de Gestión</label>
                                <select
                                    value={form.objective}
                                    onChange={e => setForm({ ...form, objective: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                                >
                                    <option value="OBJ 05">SALUD (EMO)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-emerald-400 uppercase flex items-center gap-2">
                                    <Target size={12} /> Lugar / Zona (Obligatorio)
                                </label>
                                <select
                                    value={form.location}
                                    onChange={e => setForm({ ...form, location: e.target.value })}
                                    className="w-full bg-slate-950 border-2 border-emerald-500/30 rounded-xl px-3 py-3 text-white text-sm focus:border-emerald-500 outline-none shadow-lg shadow-emerald-500/10 transition-all font-bold"
                                    required
                                >
                                    <option value="">Seleccionar Lugar...</option>
                                    {SSOMA_LOCATIONS.map(loc => (
                                        <option key={loc} value={loc}>{loc}</option>
                                    ))}

                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase">
                                    {editingId ? 'Reemplazar Archivo (Opcional)' : 'Archivo (PDF o Imagen)'}
                                </label>
                                <div 
                                    className={`border-2 border-dashed rounded-xl p-4 transition-all text-center cursor-pointer group relative ${isDragging ? 'border-emerald-500 bg-emerald-500/10 scale-[1.02]' : 'border-slate-700 hover:bg-slate-800/50'}`}
                                    onDragOver={() => setIsDragging(true)}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={() => setIsDragging(false)}
                                >
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileUpload}
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-wait"
                                        disabled={isUploading}
                                    />
                                    <div className={`flex flex-col items-center gap-2 transition-colors ${uploadedFiles.length > 0 ? 'text-emerald-400' : (isDragging ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400')}`}>
                                        {uploadedFiles.length > 0 ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center mb-1 shadow-lg shadow-emerald-500/20">
                                                    <Upload size={20} />
                                                </div>
                                                <span className="text-[11px] font-black uppercase tracking-tighter">¡{uploadedFiles.length} ARCHIVO(S) LISTO(S)!</span>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Añade más o guarda</span>
                                            </div>
                                        ) : (
                                            <>
                                                {isUploading ? <div className="w-6 h-6 border-2 border-slate-400 border-t-emerald-500 rounded-full animate-spin" /> : <Upload size={24} />}
                                                <span className="text-xs font-medium">
                                                    {isUploading ? "Subiendo..." : "Arrastra o selecciona archivos"}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                {uploadedFiles.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-3">
                                        {uploadedFiles.map((f, idx) => (
                                            <div key={idx} className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2 animate-in zoom-in-95 group">
                                                {f.type === 'pdf' ? <FileText size={12} className="text-red-400" /> : 
                                                 f.type === 'word' ? <FileEdit size={12} className="text-blue-400" /> :
                                                 f.type === 'excel' ? <FileSpreadsheet size={12} className="text-emerald-400" /> :
                                                 <ImageIcon size={12} className="text-teal-400" />}
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

                            <div className="flex gap-2">
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsSyncing(false);
                                            setIsUploading(false);
                                            setUploadedFiles([]);
                                            setEditingId(null);
                                            localStorage.removeItem('evidence_center_records');
                                            window.location.reload(); // Recarga total para limpiar memoria
                                        }}
                                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all"
                                    >
                                        Cancelar
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className={`flex-[2] text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${editingId ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'}`}
                                >
                                    <SaveIcon size={18} /> {editingId ? 'Actualizar' : 'Guardar Evidencia'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* HISTORIAL */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                <ActivityIcon size={20} className="text-blue-400" />
                                Rastro de Cargas
                            </h3>
                            <div className="flex items-center gap-2">
                                <div className="text-[10px] font-mono text-slate-500 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                                    {filteredRecords.length} REGISTROS
                                </div>
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
                                    <div key={m} className={`flex-1 flex flex-col items-center justify-center min-w-[45px] py-2 rounded-xl border transition-all ${count > 0 ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-slate-950/50 border-slate-800/50 text-slate-600 opacity-40'}`}>
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

                        {/* FILTROS AVANZADOS */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/60 mb-6 items-end">
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Fecha</label>
                                    {filters.date && (
                                        <button onClick={() => setFilters({...filters, date: ''})} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                            <X size={10} />
                                        </button>
                                    )}
                                </div>
                                <SearchableSelect 
                                    options={filterOptions.dates.map(d => ({ id: d, label: d }))}
                                    value={filters.date}
                                    onChange={(val) => setFilters({...filters, date: val})}
                                    placeholder="Todas las fechas"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Responsable</label>
                                    {filters.responsible && (
                                        <button onClick={() => setFilters({...filters, responsible: ''})} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                            <X size={10} />
                                        </button>
                                    )}
                                </div>
                                <SearchableSelect 
                                    options={filterOptions.responsibles.map(r => ({ id: r, label: r }))}
                                    value={filters.responsible}
                                    onChange={(val) => setFilters({...filters, responsible: val})}
                                    placeholder="Todos los responsables"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Lugar</label>
                                    {filters.location && (
                                        <button onClick={() => setFilters({...filters, location: ''})} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                            <X size={10} />
                                        </button>
                                    )}
                                </div>
                                <SearchableSelect 
                                    options={filterOptions.locations.map(l => ({ id: l, label: l }))}
                                    value={filters.location}
                                    onChange={(val) => setFilters({...filters, location: val})}
                                    placeholder="Todos los lugares"
                                />
                            </div>
                            <div className="flex flex-col justify-end h-[53px]">
                                {(filters.date || filters.activity || filters.responsible || filters.location || filters.objective) && (
                                    <button 
                                        onClick={() => setFilters({ date: '', activity: '', responsible: '', location: '', objective: '' })}
                                        className="w-full h-[33px] bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] font-bold uppercase transition-colors border border-red-500/20 flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        <X size={14} strokeWidth={3} /> Limpiar Filtros
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-col justify-end h-[53px]">
                                <button 
                                    onClick={handleBatchDownload}
                                    disabled={isDownloadingBatch || !filteredRecords || filteredRecords.length === 0}
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

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left text-sm text-slate-400 table-fixed">
                                <thead className="text-[10px] uppercase font-black text-slate-500 border-b border-slate-800">
                                    <tr>
                                        <th className="pb-3 pl-2 w-[80px]">Fecha</th>
                                        <th className="pb-3 w-[70px]">Área</th>
                                        <th className="pb-3 w-[60px]">Resp</th>
                                        <th className="pb-3 w-[120px]">Lugar</th>
                                        <th className="pb-3 w-[200px]">Actividad</th>
                                        <th className="pb-3 w-[60px] text-center">Preview</th>
                                        <th className="pb-3 w-[200px]">Archivo</th>
                                        <th className="pb-3 text-center w-[140px]">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {(!filteredRecords || filteredRecords.length === 0) ? (
                                        <tr>
                                            <td colSpan={8} className="py-8 text-center text-slate-600 italic">No se encontraron registros de EMO.</td>
                                        </tr>
                                    ) : (
                                        (filteredRecords || []).map((r) => (
                                            r && (
                                                <tr key={r.id || Math.random()} className="hover:bg-slate-800/30 transition-colors group">
                                                    <td className="py-3 pl-2 font-mono text-xs text-white truncate" title={r.date}>{r.date || 'S/F'}</td>
                                                    <td className="py-3">
                                                        <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black rounded">
                                                            {r.objective === 'OBJ 05' ? 'SALUD' : (r.objective || 'S/A')}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-slate-300 font-medium" title={r.responsible}>{getInitials(r.responsible)}</td>
                                                    <td className="py-3">
                                                        <span className="text-[10px] text-slate-300 font-semibold">{r.location || '-'}</span>
                                                    </td>
                                                    <td className="py-3 text-slate-300 text-[10px] leading-tight whitespace-normal max-w-[180px]">{r.description}</td>
                                                    <td className="py-3 text-center">
                                                        {(() => {
                                                            const urls = r.fileUrl ? r.fileUrl.split('|').filter(Boolean) : [];
                                                            if (urls.length === 0) return <span className="text-slate-600">-</span>;
                                                            
                                                            const firstUrl = urls[0];
                                                            const isImage = r.fileType === 'image' ||
                                                                (firstUrl && (firstUrl.toLowerCase().includes('.jpg') ||
                                                                    firstUrl.toLowerCase().includes('.jpeg') ||
                                                                    firstUrl.toLowerCase().includes('.png') ||
                                                                    firstUrl.toLowerCase().includes('.webp') ||
                                                                    firstUrl.toLowerCase().includes('.gif')));
                                                            
                                                            return (
                                                                <div className="relative inline-block">
                                                                    {isImage && firstUrl ? (
                                                                        <div
                                                                            className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 cursor-pointer hover:scale-110 hover:border-blue-500 transition-all mx-auto"
                                                                            onClick={() => handleView(r)}
                                                                            title="Click para ver"
                                                                        >
                                                                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800">
                                                                                <ImageIcon size={14} className="text-blue-400 mb-0.5" />
                                                                                <span className="text-[7px]">FOTO</span>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div 
                                                                            className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto cursor-pointer hover:bg-slate-700 transition-all"
                                                                            onClick={() => handleView(r)}
                                                                            title="Ver Archivo"
                                                                        >
                                                                            {r.fileType === 'pdf' ? <FileText size={16} className="text-red-400" /> : 
                                                                             r.fileType === 'word' ? <FileEdit size={16} className="text-blue-400" /> :
                                                                             r.fileType === 'excel' ? <FileSpreadsheet size={16} className="text-emerald-400" /> :
                                                                             <File size={16} className="text-slate-500" />}
                                                                        </div>
                                                                    )}
                                                                    {urls.length > 1 && (
                                                                        <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-lg ring-2 ring-slate-900">
                                                                            +{urls.length - 1}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="py-3 text-slate-400 text-xs truncate max-w-[250px]" title={(() => {
                                                        const context = r.objective === 'OBJ 01' ? 'Formacion' : (r.objective === 'OBJ 10' || r.objective === 'OBJ 11' ? 'PMA' : 'Actividad');
                                                        const area = context === 'PMA' ? 'medio_ambiente' : 'seguridad';
                                                        let ext = 'jpg';
                                                        if (r.fileType === 'pdf') ext = 'pdf';
                                                        else if (r.fileType === 'word') ext = 'docx';
                                                        else if (r.fileType === 'excel') ext = 'xlsx';
                                                        return generateFilename(r.description, r.date, r.responsible, ext as any, 'evidencia', undefined, area);
                                                    })()}>
                                                        {(() => {
                                                            const context = r.objective === 'OBJ 01' ? 'Formacion' : (r.objective === 'OBJ 10' || r.objective === 'OBJ 11' ? 'PMA' : 'Actividad');
                                                            const area = context === 'PMA' ? 'medio_ambiente' : 'seguridad';
                                                            let ext = 'jpg';
                                                            if (r.fileType === 'pdf') ext = 'pdf';
                                                            else if (r.fileType === 'word') ext = 'docx';
                                                            else if (r.fileType === 'excel') ext = 'xlsx';
                                                            return generateFilename(r.description, r.date, r.responsible, ext as any, 'evidencia', r.location, area);
                                                        })()}
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {/* VER */}
                                                            <button
                                                                onClick={() => handleView(r)}
                                                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg transition-colors border border-slate-700"
                                                                title="Ver Archivo"
                                                            >
                                                                {r.fileType === 'pdf' ? <FileText size={16} /> : 
                                                                 r.fileType === 'word' ? <FileEdit size={16} /> :
                                                                 r.fileType === 'excel' ? <FileSpreadsheet size={16} /> :
                                                                 <ImageIcon size={16} />}
                                                            </button>

                                                            {/* DESCARGAR */}
                                                            <button
                                                                onClick={() => handleDownload(r)}
                                                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg transition-colors border border-slate-700"
                                                                title="Descargar"
                                                            >
                                                                <Download size={16} />
                                                            </button>

                                                            {/* EDITAR */}
                                                            {(user?.role === 'developer' || user?.role === 'manager' || user?.name === r.responsible) && (
                                                                <button
                                                                    onClick={() => handleEdit(r)}
                                                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition-colors border border-slate-700"
                                                                    title="Editar"
                                                                >
                                                                    <Edit size={16} />
                                                                </button>
                                                            )}

                                                            {/* ELIMINAR */}
                                                            {(user?.role === 'developer' || user?.role === 'manager' || user?.name === r.responsible) && (
                                                                <button
                                                                    onClick={() => handleDelete(r.id)}
                                                                    className="p-1.5 bg-slate-800 hover:bg-red-900/30 text-red-400 rounded-lg transition-colors border border-slate-700"
                                                                    title="Eliminar"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* PREVIEW MODAL */}
            {viewingFile && (
                <PreviewCarouselModal
                    urls={viewingFile.fileUrl ? viewingFile.fileUrl.split('|').filter(Boolean) : []}
                    onClose={() => { setViewingFile(null); setPreviewIndex(0); }}
                    canEdit={user?.role === 'developer' || user?.role === 'manager' || user?.name === viewingFile.responsible}
                    onEdit={() => handleEdit(viewingFile)}
                    filename={(() => {
                        const context = viewingFile.objective === 'OBJ 01' ? 'Formacion' : (viewingFile.objective === 'OBJ 10' || viewingFile.objective === 'OBJ 11' ? 'PMA' : 'Actividad');
                        const area = context === 'PMA' ? 'medio_ambiente' : 'seguridad';
                        let ext = 'pdf';
                        if (viewingFile.fileType === 'word') ext = 'docx';
                        else if (viewingFile.fileType === 'excel') ext = 'xlsx';
                        else if (viewingFile.fileType === 'image') ext = 'jpg';
                        return generateFilename(viewingFile.description, viewingFile.date, viewingFile.responsible, ext as any, 'evidencia', viewingFile.location, area);
                    })()}
                />
            )}
            </div>
        </div>
    );
}



