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
    X
} from "lucide-react";
import SearchableSelect from "@/components/SearchableSelect";
import { DashboardData, UploadContext } from "@/lib/types";
import { generateFilename, getInitials, getDriveViewerUrl } from "@/lib/utils";
import { uploadEvidence } from "@/lib/uploadClient";
import jsPDF from 'jspdf';
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

    const [files, setFiles] = useState<{ url: string, type: 'pdf' | 'image' | 'word' | 'excel' } | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [viewingFile, setViewingFile] = useState<EvidenceRecord | null>(null);
    const [emoActivities, setEmoActivities] = useState<string[]>(INITIAL_EMO_ACTIVITIES);

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
    useEffect(() => {
        const loadRecords = async () => {
            setIsSyncing(true);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

            try {
                const res = await fetch('/api/evidence-records', { signal: controller.signal });
                clearTimeout(timeoutId);
                const data = await res.json();
                if (data.success && data.records.length > 0) {
                    // Map from DB format to component format
                    const mapped = data.records.map((r: any) => ({
                        id: r.id || r.record_id,
                        date: r.date,
                        responsible: r.responsable || r.responsible,
                        objective: r.objective,
                        description: r.activity || r.description,
                        location: r.zona || r.location || '',
                        fileType: r.file_type || r.fileType,
                        fileUrl: r.file_url || r.fileUrl
                    }));
                    const filtered = mapped.filter((r: any) => r.objective === 'OBJ 05');
                    setRecords(filtered);
                    localStorage.setItem('evidence_center_records', JSON.stringify(filtered));
                    setIsLoaded(true);
                }
            } catch (e: any) {
                if (e.name === 'AbortError') {
                    console.warn('Sync timed out');
                } else {
                    console.warn('Could not fetch evidence records from cloud:', e);
                }
            } finally {
                setIsSyncing(false);
                setIsLoaded(true);
            }
        };
        loadRecords();

        // AUTO-SYNC: Actualizar cada 30 segundos para sincronizar entre dispositivos
        const syncInterval = setInterval(loadRecords, 30000);
        return () => clearInterval(syncInterval);
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
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar datos antes de subir
        if (!form.responsible || !form.activity || !form.location) {
            alert("⚠️ Por favor completa RESPONSABLE, ACTIVIDAD y LUGAR antes de subir el archivo.\n\nEsto asegura que el archivo se nombre correctamente con sus prefijos en Google Drive.");
            e.target.value = '';
            return;
        }

        // CONTROL DE TAMAÑO PARA EVITAR BLOQUEOS
        const fileSizeMB = file.size / 1024 / 1024;
        if (fileSizeMB > 50) {
            alert(`❌ ARCHIVO DEMASIADO PESADO (${fileSizeMB.toFixed(2)}MB).\nEl límite máximo permitido es de 50MB para evitar errores en la red.`);
            e.target.value = '';
            return;
        }

        if (fileSizeMB > 15) {
            const proceed = confirm(`⚠️ El archivo es pesado (${fileSizeMB.toFixed(2)}MB).\nLa carga puede tardar varios minutos y parecer "atorada". ¿Deseas continuar?`);
            if (!proceed) {
                e.target.value = '';
                return;
            }
        }

        const isImage = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf';
        const isWord = file.type === 'application/msword' || 
                       file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        const isExcel = file.type === 'application/vnd.ms-excel' || 
                        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        if (!isImage && !isPdf && !isWord && !isExcel) {
            alert("⚠️ Formato no soportado. Por favor sube Imágenes, PDFs, archivos Word (.docx) o Excel (.xlsx)");
            return;
        }

        // Determinar Contexto (Carpeta)
        let context: UploadContext = 'Actividad';
        if (form.objective === 'OBJ 01') context = 'Formacion';
        else if (form.objective === 'OBJ 10' || form.objective === 'OBJ 11') context = 'PMA';

        // Determinar el Nombre Completo del Objetivo para la carpeta
        const objectiveObj = TARGET_OBJECTIVES.find(o => o.id === form.objective);
        const objectiveLabel = objectiveObj ? objectiveObj.label : form.objective;

        // Determinar Área para el prefijo (solo para nombre de archivo, ya no para carpeta raiz en este caso)
        let area: string = 'seguridad';
        if (context === 'PMA') area = 'medio_ambiente';
        else if (form.objective === 'OBJ 01') area = 'seguridad';

        try {
            setIsUploading(true);
            const url = await uploadEvidence(
                file,
                context,
                form.activity, // Title (Nombre Actividad) if objective is passed
                form.date,
                form.responsible,
                'evidencia', // Tipo
                area,
                form.location, // Lugar
                objectiveLabel // NUEVO PARAMETRO: Nombre del Objetivo para la estructura de carpetas
            );

            setFiles({
                url: url,
                fileType: isImage ? 'image' : (isPdf ? 'pdf' : (isWord ? 'word' : 'excel'))
            } as any);
            alert("✅ Al momento de cargar se cargó con éxito su archivo o imagen para saber que se registró");

        } catch (error: any) {
            alert(`Error al subir: ${error.message}`);
        } finally {
            setIsUploading(false);
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
        if (!editingId && !files) {
            alert("Debes subir un archivo obligatoriamente.");
            return;
        }

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
                        fileType: files ? files.type : r.fileType,
                        fileUrl: files ? files.url : r.fileUrl
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
                fileType: files?.type || 'pdf',
                fileUrl: files?.url || ''
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
            setFiles(null);
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
                setFiles(null);
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
        setFiles(null);
        // Scroll to form (opcional, simple UX)
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDownload = (record: EvidenceRecord) => {
        // If it's a PDF, Word or Excel, download it directly
        if (record.fileType === 'pdf' || record.fileType === 'word' || record.fileType === 'excel') {
            const link = document.createElement('a');
            link.href = record.fileUrl;
            link.download = (() => {
                const context = record.objective === 'OBJ 01' ? 'Formacion' : (record.objective === 'OBJ 10' || record.objective === 'OBJ 11' ? 'PMA' : 'Actividad');
                const area = context === 'PMA' ? 'medio_ambiente' : 'seguridad';
                
                let ext = 'pdf';
                if (record.fileType === 'word') ext = 'docx';
                else if (record.fileType === 'excel') ext = 'xlsx';

                return generateFilename(record.description, record.date, record.responsible, ext as any, 'evidencia', undefined, area);
            })();
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }

        // If it's an image, convert to PDF
        const doc = new jsPDF();
        const img = new Image();
        img.src = record.fileUrl;

        img.onload = () => {
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // Margins (e.g., 10mm)
            const margin = 10;
            const maxWidth = pageWidth - (margin * 2);
            const maxHeight = pageHeight - (margin * 2);

            let imgWidth = img.width;
            let imgHeight = img.height;

            // Calculate ratio to fit
            const widthRatio = maxWidth / imgWidth;
            const heightRatio = maxHeight / imgHeight;
            const ratio = Math.min(widthRatio, heightRatio, 1); // Never scale up, only down (though usually images are large, so 1 is fine limit)

            const finalWidth = imgWidth * ratio;
            const finalHeight = imgHeight * ratio;

            // Center image
            const x = (pageWidth - finalWidth) / 2;
            const y = (pageHeight - finalHeight) / 2; // Center vertically or top margin? User said "dentro del margen". Centering is safe.

            const downloadName = (() => {
                const context = record.objective === 'OBJ 01' ? 'Formacion' : (record.objective === 'OBJ 10' || record.objective === 'OBJ 11' ? 'PMA' : 'Actividad');
                const area = context === 'PMA' ? 'medio_ambiente' : 'seguridad';
                return generateFilename(record.description, record.date, record.responsible, 'pdf', 'evidencia', undefined, area);
            })();
            doc.save(downloadName);
        };
    };

    const handleView = (record: EvidenceRecord) => {
        setViewingFile(record);
    };

    // Obtener actividades dinámicas
    const currentActivities = emoActivities;

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">

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
                                <div className="border-2 border-dashed border-slate-700 rounded-xl p-4 hover:bg-slate-800/50 transition-colors text-center cursor-pointer group relative">
                                    <input
                                        type="file"
                                        onChange={handleFileUpload}
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className={`flex flex-col items-center gap-2 transition-colors ${files ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'}`}>
                                        {files ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center mb-1 shadow-lg shadow-emerald-500/20">
                                                    {files.type === 'pdf' ? <FileText size={20} /> : 
                                                     files.type === 'word' ? <FileEdit size={20} /> :
                                                     files.type === 'excel' ? <FileSpreadsheet size={20} /> :
                                                     <ImageIcon size={20} />}
                                                </div>
                                                <span className="text-[11px] font-black uppercase tracking-tighter">¡1 Archivo Cargado!</span>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Listo para guardar</span>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload size={24} />
                                                <span className="text-xs font-medium">
                                                    {editingId ? "Click para cambiar archivo" : "Arrastra o selecciona archivo"}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingId(null);
                                            setFiles(null);
                                            // @ts-ignore
                                            setForm(prev => ({ ...prev, activity: '', responsible: '' }));
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
                                {(filters.date || filters.activity || filters.responsible || filters.location || filters.objective) && (
                                    <button 
                                        onClick={() => setFilters({ date: '', activity: '', responsible: '', location: '', objective: '' })}
                                        className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-300 transition-colors flex items-center gap-1"
                                    >
                                        <X size={12} /> Limpiar Filtros
                                    </button>
                                )}
                                <div className="text-[10px] font-mono text-slate-500 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                                    {filteredRecords.length} REGISTROS
                                </div>
                            </div>
                        </div>

                        {/* FILTROS AVANZADOS */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/60 mb-6">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Fecha</label>
                                <SearchableSelect 
                                    options={filterOptions.dates}
                                    value={filters.date}
                                    onChange={(val) => setFilters({...filters, date: val})}
                                    placeholder="Todas las fechas"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Responsable</label>
                                <SearchableSelect 
                                    options={filterOptions.responsibles}
                                    value={filters.responsible}
                                    onChange={(val) => setFilters({...filters, responsible: val})}
                                    placeholder="Todos los responsables"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Lugar</label>
                                <SearchableSelect 
                                    options={filterOptions.locations}
                                    value={filters.location}
                                    onChange={(val) => setFilters({...filters, location: val})}
                                    placeholder="Todos los lugares"
                                />
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
                                                            const isImage = r.fileType === 'image' ||
                                                                (r.fileUrl && (r.fileUrl.toLowerCase().includes('.jpg') ||
                                                                    r.fileUrl.toLowerCase().includes('.jpeg') ||
                                                                    r.fileUrl.toLowerCase().includes('.png') ||
                                                                    r.fileUrl.toLowerCase().includes('.webp') ||
                                                                    r.fileUrl.toLowerCase().includes('.gif')));
                                                            return isImage && r.fileUrl ? (
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setViewingFile(null)}>
                    <div className="relative bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/50">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                {viewingFile.fileType === 'pdf' ? <FileText size={20} className="text-red-400" /> : 
                                 viewingFile.fileType === 'word' ? <FileEdit size={20} className="text-blue-400" /> :
                                 viewingFile.fileType === 'excel' ? <FileSpreadsheet size={20} className="text-emerald-400" /> :
                                 <ImageIcon size={20} className="text-blue-400" />}
                                Vista Previa
                            </h3>
                            <div className="flex items-center gap-2">
                                <a
                                    href={viewingFile.fileUrl}
                                    download
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                                    title="Abrir original"
                                >
                                    <Download size={18} />
                                </a>
                                <button onClick={() => setViewingFile(null)} className="p-2 hover:bg-red-900/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors">
                                    <Trash2 size={24} className="rotate-45" />
                                </button>
                            </div>
                        </div>
                        <div className="w-full h-[75vh] flex items-center justify-center p-4">
                            <iframe 
                                src={getDriveViewerUrl(viewingFile.fileUrl, false)} 
                                className="w-full h-full min-h-[60vh] rounded-lg border border-slate-800 shadow-2xl" 
                                title="File Preview">
                            </iframe>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}



