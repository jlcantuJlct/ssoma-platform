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
    File
} from "lucide-react";
import { DashboardData } from "@/lib/types";
import { generateFilename, getInitials } from "@/lib/utils";
import { uploadEvidence, UploadContext } from "@/lib/uploadClient";
import jsPDF from 'jspdf';
import { SSOMA_LOCATIONS } from "@/lib/locations";
import { Save as SaveIcon } from "lucide-react"; // I noticed SaveIcon was missing or inconsistent
import { USER_LIST } from "@/lib/auth";


interface EvidencePageProps {
    data: DashboardData;
}

// Actividades específicas por objetivo
const ACTIVITIES_BY_OBJECTIVE: Record<string, string[]> = {
    'OBJ 01': [
        "Conformación del subcomité de seguridad y salud en el trabajo (SCSST)",
        "Reunión ordinaria del Subcomité de seguridad y salud en el trabajo (SCSST)",
        "Inspecciones del SCSST",
        "Capacitaciones Inspecciones de Seguridad y salud en el trabajo",
        "Capacitaciones Notificación, investigación y reporte de incidentes",
        "Capacitaciones seguridad y salud en el trabajo, actualización de la Ley 29783",
        "Capacitaciones IPERC",
        "Elaboración de Informes trimestrales"
    ],
    'OBJ 04': [
        "Implementación del sistema de RAC",
        "Reporte de actos y condiciones insegura"
    ],
    'OBJ 05': [
        "Exámenes Médico Ocupacional"
    ],
    'OBJ 10': [
        "Control de segregacion"
    ],
    'OBJ 11': [
        "Control de Acopio temporal RRSS",
        "Control de Acopio temporal RRPP"
    ]
};

// Objetivos específicos solicitados
const TARGET_OBJECTIVES = [
    { id: 'OBJ 01', label: 'OBJ 01: Programas de SCSST' },
    { id: 'OBJ 04', label: 'OBJ 04: Reporte A/C Inseguras' },
    { id: 'OBJ 05', label: 'OBJ 05: EMO Realizados' },
    { id: 'OBJ 10', label: 'OBJ 10: Control Segregación RRSS' },
    { id: 'OBJ 11', label: 'OBJ 11: Control Acopios Temporales' },
];

const RESPONSIBLES = USER_LIST.map(user => user.name);

type EvidenceRecord = {
    id: number;
    date: string;
    responsible: string;
    objective: string;
    description: string;
    location: string;
    fileType: 'pdf' | 'image';
    fileUrl: string;
};

export default function EvidenceCenter({ data }: EvidencePageProps) {
    // STATE
    const [records, setRecords] = useState<EvidenceRecord[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        responsible: '',
        objective: 'OBJ 01',
        activity: '',
        location: ''
    });

    const [files, setFiles] = useState<{ url: string, type: 'pdf' | 'image' } | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [viewingFile, setViewingFile] = useState<EvidenceRecord | null>(null);

    // LOAD DATA - Cloud first, then localStorage fallback
    useEffect(() => {
        const loadRecords = async () => {
            try {
                const res = await fetch('/api/evidence-records');
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
                    setRecords(mapped);
                    localStorage.setItem('evidence_center_records', JSON.stringify(mapped));
                    setIsLoaded(true);
                    return;
                }
            } catch (e) {
                console.warn('Could not fetch evidence records from cloud:', e);
            }
            // Fallback to localStorage
            const stored = localStorage.getItem('evidence_center_records');
            if (stored) {
                try {
                    setRecords(JSON.parse(stored));
                } catch (e) {
                    console.error("Error parsing evidence_center_records", e);
                }
            }
            setIsLoaded(true);
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

        const isImage = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf';

        if (!isImage && !isPdf) {
            alert("Solo se permiten imágenes y PDFs");
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
                type: isImage ? 'image' : 'pdf'
            });
            alert("✅ Al momento de cargar se cargó con éxito su archivo o imagen para saber que se registró");

        } catch (error: any) {
            alert(`Error al subir: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
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

        if (editingId) {
            // ACTUALIZAR REGISTRO EXISTENTE
            setRecords(prev => prev.map(r => {
                if (r.id === editingId) {
                    return {
                        ...r,
                        date: form.date,
                        responsible: form.responsible,
                        objective: form.objective,
                        description: form.activity,
                        location: form.location,
                        // Si se subió nuevo archivo, usarlo. Si no, mantener el anterior.
                        fileType: files ? files.type : r.fileType,
                        fileUrl: files ? files.url : r.fileUrl
                    };
                }
                return r;
            }));
            alert("Registro actualizado correctamente.");
            setEditingId(null);
        } else {
            // CREAR NUEVO REGISTRO
            if (!files) return; // Ya validado arriba
            const newRecord: EvidenceRecord = {
                id: Date.now(),
                date: form.date,
                responsible: form.responsible,
                objective: form.objective,
                description: form.activity,
                location: form.location,
                fileType: files.type,
                fileUrl: files.url
            };
            setRecords(prev => [newRecord, ...prev]);
            alert("Evidencia guardada exitosamente.");
        }

        // Reset Form
        // @ts-ignore
        setForm(prev => ({ ...prev, activity: '', location: '' }));
        setFiles(null);
    };

    const handleDelete = (id: number) => {
        setRecords(prev => prev.filter(r => r.id !== id));
        if (editingId === id) {
            setEditingId(null);
            setFiles(null);
            // @ts-ignore
            setForm(f => ({ ...f, activity: '', responsible: '' }));
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
        // If it's already a PDF, download it directly
        if (record.fileType === 'pdf') {
            const link = document.createElement('a');
            link.href = record.fileUrl;
            link.download = (() => {
                const context = record.objective === 'OBJ 01' ? 'Formacion' : (record.objective === 'OBJ 10' || record.objective === 'OBJ 11' ? 'PMA' : 'Actividad');
                const area = context === 'PMA' ? 'medio_ambiente' : 'seguridad';
                return generateFilename(record.description, record.date, record.responsible, 'pdf', 'evidencia', undefined, area);
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
    const currentActivities = ACTIVITIES_BY_OBJECTIVE[form.objective] || [];

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter mb-2 flex items-center gap-3">
                        <ShieldCheck className="text-emerald-500" size={32} />
                        Centro de Evidencias
                    </h1>
                    <p className="text-slate-400 font-medium">Gestión de Archivos para Objetivos Estratégicos (1, 4, 5, 10, 11)</p>
                </div>
                <div className="bg-slate-800/50 px-6 py-3 rounded-xl border border-slate-700">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Registros</p>
                    <p className="text-2xl font-black text-white">{records.length}</p>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* FORMULARIO DE REGISTRO */}
                <div className="xl:col-span-1">
                    <div className={`border rounded-2xl p-6 shadow-2xl sticky top-6 transition-colors ${editingId ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-slate-900 border-slate-800'}`}>
                        <h3 className={`${editingId ? 'text-indigo-400' : 'text-emerald-400'} font-bold text-lg mb-6 flex flex-wrap items-center gap-2`}>
                            {editingId ? <Edit size={20} /> : <Upload size={20} />}
                            {editingId ? 'Editando Evidencia' : 'Registro de Evidencia'}
                            {isSyncing && (
                                <span className="flex items-center gap-1 text-[8px] bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full animate-pulse border border-blue-700/30">
                                    <span className="w-1 h-1 bg-blue-400 rounded-full animate-ping"></span>
                                    SINCRONIZANDO...
                                </span>
                            )}
                            {isUploading && (
                                <span className="flex items-center gap-1 text-[8px] bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded-full animate-pulse border border-indigo-700/30">
                                    <span className="w-1 h-1 bg-indigo-400 rounded-full animate-ping"></span>
                                    SUBIENDO...
                                </span>
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
                                <label className="text-[10px] font-black text-slate-400 uppercase">Objetivo Estratégico</label>
                                <select
                                    value={form.objective}
                                    // @ts-ignore
                                    onChange={e => setForm({ ...form, objective: e.target.value, activity: '' })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                                >
                                    {TARGET_OBJECTIVES.map(obj => (
                                        <option key={obj.id} value={obj.id}>{obj.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase">Actividad</label>
                                <select
                                    // @ts-ignore
                                    value={form.activity}
                                    // @ts-ignore
                                    onChange={e => setForm({ ...form, activity: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                                    disabled={!form.objective}
                                >
                                    <option value="">Seleccionar Actividad...</option>
                                    {currentActivities.map(act => (
                                        <option key={act} value={act}>{act}</option>
                                    ))}
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
                                        accept=".pdf,image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-emerald-400">
                                        {files ? (
                                            files.type === 'pdf' ? <FileText size={24} className="text-red-400" /> : <ImageIcon size={24} className="text-blue-400" />
                                        ) : (
                                            <Upload size={24} />
                                        )}
                                        <span className="text-xs font-medium">
                                            {files ? "Archivo listo" : (editingId ? "Click para cambiar archivo" : "Click para seleccionar")}
                                        </span>
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
                <div className="xl:col-span-2">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                        <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                            <ActivityIcon size={20} className="text-blue-400" />
                            Historial de Cargas
                        </h3>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px] text-left text-sm text-slate-400 table-fixed">
                                <thead className="text-[10px] uppercase font-black text-slate-500 border-b border-slate-800">
                                    <tr>
                                        <th className="pb-3 pl-2 w-[80px]">Fecha</th>
                                        <th className="pb-3 w-[60px]">Resp</th>
                                        <th className="pb-3 w-[100px]">Lugar</th>
                                        <th className="pb-3 w-[80px]">Objetivo</th>
                                        <th className="pb-3 w-[180px]">Actividad</th>
                                        <th className="pb-3 w-[60px] text-center">Preview</th>
                                        <th className="pb-3 w-[200px]">Archivo</th>
                                        <th className="pb-3 text-center w-[140px]">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {(!records || records.length === 0) ? (
                                        <tr>
                                            <td colSpan={8} className="py-8 text-center text-slate-600 italic">No hay registros aún.</td>
                                        </tr>
                                    ) : (
                                        (records || []).map((r) => (
                                            r && (
                                                <tr key={r.id || Math.random()} className="hover:bg-slate-800/30 transition-colors group">
                                                    <td className="py-3 pl-2 font-mono text-xs text-white truncate" title={r.date}>{r.date || 'S/F'}</td>
                                                    <td className="py-3 text-slate-300 font-medium" title={r.responsible}>{getInitials(r.responsible)}</td>
                                                    <td className="py-3">
                                                        <span className="text-[10px] text-slate-300 font-semibold">{r.location || '-'}</span>
                                                    </td>
                                                    <td className="py-3">
                                                        <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[9px] font-bold border border-slate-700 whitespace-nowrap">
                                                            {r.objective}
                                                        </span>
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
                                                                    <img src={r.fileUrl} alt="preview" className="w-full h-full object-cover" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto">
                                                                    <FileText size={16} className="text-slate-500" />
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="py-3 text-slate-400 text-xs truncate max-w-[250px]" title={(() => {
                                                        const context = r.objective === 'OBJ 01' ? 'Formacion' : (r.objective === 'OBJ 10' || r.objective === 'OBJ 11' ? 'PMA' : 'Actividad');
                                                        const area = context === 'PMA' ? 'medio_ambiente' : 'seguridad';
                                                        return generateFilename(r.description, r.date, r.responsible, r.fileType === 'pdf' ? 'pdf' : 'jpg', 'evidencia', undefined, area);
                                                    })()}>
                                                        {(() => {
                                                            const context = r.objective === 'OBJ 01' ? 'Formacion' : (r.objective === 'OBJ 10' || r.objective === 'OBJ 11' ? 'PMA' : 'Actividad');
                                                            const area = context === 'PMA' ? 'medio_ambiente' : 'seguridad';
                                                            return generateFilename(r.description, r.date, r.responsible, r.fileType === 'pdf' ? 'pdf' : 'jpg', 'evidencia', r.location, area);
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
                                                                {r.fileType === 'pdf' ? <FileText size={16} /> : <ImageIcon size={16} />}
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
                                                            <button
                                                                onClick={() => handleEdit(r)}
                                                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition-colors border border-slate-700"
                                                                title="Editar"
                                                            >
                                                                <Edit size={16} />
                                                            </button>

                                                            {/* ELIMINAR */}
                                                            <button
                                                                onClick={() => handleDelete(r.id)}
                                                                className="p-1.5 bg-slate-800 hover:bg-red-900/30 text-red-400 rounded-lg transition-colors border border-slate-700"
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
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
                                {viewingFile.fileType === 'pdf' ? <FileText size={20} className="text-red-400" /> : <ImageIcon size={20} className="text-blue-400" />}
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
                        <div className="flex-1 overflow-auto bg-black/50 flex items-center justify-center p-4">
                            {viewingFile.fileType === 'pdf' ? (
                                <iframe src={viewingFile.fileUrl} className="w-full h-full min-h-[60vh] rounded-lg border border-slate-800" title="PDF Preview"></iframe>
                            ) : (
                                <img src={viewingFile.fileUrl} alt="Preview" className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl" />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}



