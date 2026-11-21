"use client";

import { useState, useEffect } from 'react';
import { useAuth, USER_LIST } from '@/lib/auth';
import { Search, Plus, FileText, Calendar, User, MapPin, Upload, Shield, Trash2, Check, X, Filter, RotateCcw, Link as LinkIcon, ExternalLink } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import { uploadEvidence } from '@/lib/uploadClient';
import { SSOMA_LOCATIONS } from '@/lib/locations';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getDriveViewerUrl, generateFilename, canDeleteRecord} from "@/lib/utils";
import PreviewCarouselModal from "@/components/PreviewCarouselModal";
import BatchDownloadZip from "@/components/BatchDownloadZip";
import ActaGeneratorModal from "@/components/ActaGeneratorModal";
import TemplateUploadModal from "@/components/TemplateUploadModal";

// Activities from Annual Program OBJ 01 (Based on F-SIG-023 CASA - Deduplicated)
const SCSST_ACTIVITIES = [
    "Revisión y aprobación del plan SST, programa anual, objetivos estratégicos, planes de salud, plan de emergencia, programa",
    "Reunión ordinaria del Subcomité de seguridad y salud en el trabajo (SCSST).",
    "Inspecciones del SCSST",
    "Capacitaciones Notificación, investigación y reporte de incidentes (SCSST).",
    "Elaboración de Informes trimestrales (SCSST).",
    "Capacitaciones IPERC (SCSST).",
    "Capacitaciones Inspecciones de Seguridad y salud en el trabajo (SCSST).",
    "Capacitaciones seguridad y salud en el trabajo, actualización de la Ley 29783 (SCSST)."
];

export default function SCSSTPage() {
    const { user } = useAuth();
    const [activities, setActivities] = useState<string[]>(SCSST_ACTIVITIES);
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [evidenceMode, setEvidenceMode] = useState<'upload' | 'link'>('upload');
    const [linkInput, setLinkInput] = useState('');
    const [viewingFile, setViewingFile] = useState<any>(null);
    const [isActaModalOpen, setIsActaModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        activity: '',
        responsable: user?.name || 'Usuario SSOMA',
        zona: SSOMA_LOCATIONS[0],
        description: '',
        acuerdos_total: '',
        acuerdos_cerrados: '',
    });

    // Filter state
    const [filters, setFilters] = useState({
        date: '',
        activity: '',
        responsable: '',
        zona: ''
    });

    const [editingId, setEditingId] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            setActivities(SCSST_ACTIVITIES);
            const recRes = await fetch('/api/evidence-records');
            const recData = await recRes.json();
            if (recData.success && Array.isArray(recData.records)) {
                const scsstRecords = recData.records.filter((r: any) => r && r.objective === 'OBJ 01');
                setRecords(scsstRecords);
            }
        } catch (error) {
            console.error('Error fetching SCSST data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filtered Records logic - STRICT WHITELIST for SCSST activities
    const filteredRecords = (records || []).filter(rec => {
        if (!rec) return false;
        
        // Only show records that belong to the official activities
        const isOfficialActivity = SCSST_ACTIVITIES.some(a => 
            a.toLowerCase().trim() === (rec.activity || '').toLowerCase().trim() ||
            (rec.activity && (
                rec.activity.toLowerCase().includes('aprobaci') || 
                rec.activity.toLowerCase().includes('revisi') || 
                rec.activity.toLowerCase().includes('plan sst') || 
                rec.activity.toLowerCase().includes('reuni') || 
                rec.activity.toLowerCase().includes('scsst')
            ))
        );
        if (!isOfficialActivity) return false;

        const matchDate = !filters.date || rec.date === filters.date;
        const matchActivity = !filters.activity || 
            rec.activity === filters.activity ||
            (filters.activity.toLowerCase().includes('aprobaci') && rec.activity?.toLowerCase().includes('aprobaci')) ||
            (filters.activity.toLowerCase().includes('reuni') && rec.activity?.toLowerCase().includes('reuni'));
        const matchResp = !filters.responsable || (rec.responsable || rec.responsible) === filters.responsable;
        const matchZone = !filters.zona || (rec.zona || rec.location) === filters.zona;
        return matchDate && matchActivity && matchResp && matchZone;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Derive filter options - ALWAYS show full lists so user can filter easily
    const filterOptions = {
        dates: Array.from(new Set((records || []).map(r => r?.date).filter(Boolean))).sort().reverse(),
        activities: SCSST_ACTIVITIES,
        responsibles: USER_LIST.map(u => u.name).sort(),
        zones: SSOMA_LOCATIONS.sort()
    };

    const handleEdit = (rec: any) => {
        let acTotal = rec.acuerdos_total !== null && rec.acuerdos_total !== undefined ? String(rec.acuerdos_total) : '';
        let acCerrados = rec.acuerdos_cerrados !== null && rec.acuerdos_cerrados !== undefined ? String(rec.acuerdos_cerrados) : '';
        if (!acTotal && rec.description) {
            const m = rec.description.match(/\[Acuerdos:\s*(\d+)\/(\d+)/i);
            if (m) {
                acCerrados = m[1];
                acTotal = m[2];
            }
        }

        let cleanDesc = rec.description || '';
        cleanDesc = cleanDesc.replace(/\s*\|?\s*\[Acuerdos:[^\]]+\]/g, '').trim();

        setFormData({
            date: rec.date || new Date().toISOString().split('T')[0],
            activity: rec.activity || '',
            responsable: rec.responsable || rec.responsible || '',
            zona: rec.zona || rec.location || '',
            description: cleanDesc,
            acuerdos_total: acTotal,
            acuerdos_cerrados: acCerrados
        });

        let files: string[] = [];
        if (Array.isArray(rec.fileUrls) && rec.fileUrls.length > 0) {
            files = [...rec.fileUrls];
        } else if (rec.fileUrl) {
            if (typeof rec.fileUrl === 'string' && rec.fileUrl.startsWith('[')) {
                try { files = JSON.parse(rec.fileUrl); } catch(e) { files = [rec.fileUrl]; }
            } else {
                files = [rec.fileUrl];
            }
        }
        setUploadedFiles(files);
        setEditingId(rec.id);
        setIsAdding(true);

        setTimeout(() => {
            const formEl = document.getElementById('scsst-activity-form');
            if (formEl) {
                formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                const mainEl = document.querySelector('main');
                if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 80);
    };

    const cancelEdit = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            activity: '',
            responsable: user?.name || 'Usuario SSOMA',
            zona: SSOMA_LOCATIONS[0],
            description: '',
            acuerdos_total: '',
            acuerdos_cerrados: '',
        });
        setUploadedFiles([]);
    };

    const handleSave = async () => {
        let currentFiles = [...uploadedFiles];
        if (linkInput.trim()) {
            currentFiles.push(linkInput.trim());
            setUploadedFiles(currentFiles);
            setLinkInput('');
        }

        if (!formData.activity || currentFiles.length === 0) {
            alert('Por favor complete la actividad y cargue o pegue al menos una evidencia (archivo o enlace).');
            return;
        }

        setIsSaving(true);
        try {
                        const totNum = formData.acuerdos_total !== '' ? parseInt(formData.acuerdos_total) : null;
            const cerNum = formData.acuerdos_cerrados !== '' ? parseInt(formData.acuerdos_cerrados) : null;
            const pct = (totNum !== null && totNum > 0) ? Math.round(((cerNum || 0) / totNum) * 100) : null;

            let finalDesc = formData.description || '';
            if (totNum !== null) {
                const tag = `[Acuerdos: ${cerNum || 0}/${totNum} (${pct}% cerrados)]`;
                if (!finalDesc.includes('[Acuerdos:')) {
                    finalDesc = finalDesc ? `${finalDesc} | ${tag}` : tag;
                }
            }

            const newRecord = {
                id: editingId || Date.now(),
                date: formData.date,
                objective: 'OBJ 01',
                activity: formData.activity,
                description: finalDesc,
                responsable: formData.responsable,
                zona: formData.zona,
                fileUrl: currentFiles[0],
                fileUrls: currentFiles,
                fileType: 'pdf',
                acuerdos_total: totNum,
                acuerdos_cerrados: cerNum,
                porcentaje_cumplimiento: pct
            };

            const action = editingId ? 'UPDATE' : 'CREATE';
            const res = await fetch('/api/evidence-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, record: newRecord, userName: user?.name })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                cancelEdit();
                fetchData();
            } else {
                alert(data.error || 'Error al guardar.');
            }
        } catch (error: any) {
            console.error('Error saving SCSST record:', error);
            alert(`Error al guardar: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: any) => {
        const record = records.find(r => r.id === id);
        if (!canDeleteRecord(id, user?.role || 'user', record?.date)) {
            alert('⏱️ No se puede eliminar este registro.\nLos usuarios solo pueden eliminar documentos dentro de las primeras 24 horas de su ingreso.\nContacte al administrador si necesita realizar esta acción.');
            return;
        }
        if (!confirm('¿Estás seguro de eliminar este registro?')) return;
        
        try {
            const res = await fetch('/api/evidence-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DELETE', id, userName: user?.name })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                fetchData();
            } else {
                alert(data.error || 'Error al eliminar.');
            }
        } catch (error: any) {
            console.error('Error deleting record:', error);
            alert(`Error al eliminar: ${error.message}`);
        }
    };

    const renderCard = (rec: any) => {
        const fileCount = rec.fileUrls ? rec.fileUrls.length : (rec.fileUrl ? 1 : 0);
        const hasFiles = fileCount > 0;
        return (
            <Card key={rec.id} className={`bg-slate-900 border-slate-800 hover:border-emerald-500/30 transition-all group overflow-hidden rounded-2xl ${editingId === rec.id ? 'ring-2 ring-blue-500 border-blue-500/50' : ''}`}>
                <div className="p-4 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-white font-bold text-xs leading-tight mb-1 truncate group-hover:text-emerald-400 transition-colors">
                                {rec.activity}
                            </h3>
                            <div className="flex items-center gap-2 text-slate-500 text-[10px]">
                            <Calendar size={12} />
                            <span>{rec.date}</span>
                        </div>
                        {((rec.acuerdos_total && Number(rec.acuerdos_total) > 0) || (rec.description && rec.description.includes('[Acuerdos:'))) && (
                            <div className="mt-1">
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    {rec.acuerdos_total 
                                        ? `🎯 Acuerdos: ${rec.acuerdos_cerrados || 0}/${rec.acuerdos_total} (${Math.round(((rec.acuerdos_cerrados || 0)/rec.acuerdos_total)*100)}%)`
                                        : (rec.description.match(/\[Acuerdos:[^\]]+\]/)?.[0] || '🎯 Acuerdos')
                                    }
                                </span>
                            </div>
                        )}
                        </div>
                        <div className="flex gap-1">
                            <button 
                                onClick={() => hasFiles && setViewingFile(rec)}
                                className={`p-2 rounded-lg transition-all ${hasFiles ? 'bg-slate-800 hover:bg-emerald-500/20 text-emerald-500' : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'}`}
                                title={hasFiles ? "Ver/Descargar Archivo(s)" : "Sin Archivo"}
                            >
                                <FileText size={14} />
                            </button>
                            {(user?.role === 'developer' || user?.role === 'manager' || user?.name === (rec.responsable || rec.responsible)) && (
                                <>
                                    <button 
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(rec);
                                        }}
                                        className="p-2 bg-slate-800 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-lg transition-all"
                                        title="Editar Registro"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(rec.id)}
                                        className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-all"
                                        title="Eliminar Registro"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/50">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">Responsable</p>
                            <p className="text-[10px] text-slate-300 font-medium truncate">{rec.responsable || rec.responsible}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">Zona / Ubicación</p>
                            <p className="text-[10px] text-slate-300 font-medium truncate">{rec.zona || rec.location || 'N/A'}</p>
                        </div>
                    </div>
                    
                    {rec.description && (
                        <div className="pt-2">
                            <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Descripción</p>
                            <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">{rec.description}</p>
                        </div>
                    )}

                    {hasFiles && (
                        <div className="pt-2">
                            <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Archivo Adjunto</p>
                            <button 
                                onClick={() => setViewingFile(rec)}
                                className="w-full text-left p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors flex items-center gap-2"
                            >
                                <FileText size={14} className="text-emerald-400" />
                                <span className="text-[10px] text-emerald-400 font-bold truncate">
                                    {generateFilename(rec.activity, rec.date, rec.responsable || rec.responsible, 'pdf', 'evidencia', rec.zona || rec.location, 'scsst').replace(/\.[^/.]+$/, "")}
                                    {fileCount > 1 ? ` (+${fileCount-1})` : ''}
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            </Card>
        );
    };

    const isActaAprobacion = (activity: string) => {
        const act = (activity || '').toLowerCase();
        return act.includes('aprobaci') || 
               act.includes('revisi') || 
               act.includes('plan sst') || 
               act.includes('cronograma') ||
               act.includes('programa anual') ||
               act.includes('planes de salud') || 
               act.includes('plan de emergencia') || 
               act.includes('objetivos estrat');
    };

    const actasAprobacion = filteredRecords.filter(r => isActaAprobacion(r.activity));
    
    const reuniones = filteredRecords.filter(r => {
        if (isActaAprobacion(r.activity)) return false;
        const act = (r.activity || '').toLowerCase();
        return act.includes('reuni') || act.includes('acuerdo');
    });

    const capacitaciones = filteredRecords.filter(r => {
        if (isActaAprobacion(r.activity)) return false;
        const act = (r.activity || '').toLowerCase();
        return act.includes('capacitaci');
    });

    const inspecciones = filteredRecords.filter(r => {
        if (isActaAprobacion(r.activity)) return false;
        const act = (r.activity || '').toLowerCase();
        return act.includes('inspecci') && !act.includes('capacitaci');
    });

    const informes = filteredRecords.filter(r => {
        if (isActaAprobacion(r.activity)) return false;
        const act = (r.activity || '').toLowerCase();
        return act.includes('informe');
    });

    const otros = filteredRecords.filter(r => {
        if (isActaAprobacion(r.activity)) return false;
        const act = (r.activity || '').toLowerCase();
        return !act.includes('reuni') && 
               !act.includes('acuerdo') && 
               !act.includes('capacitaci') && 
               !act.includes('inspecci') && 
               !act.includes('informe');
    });

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
            <PreviewCarouselModal 
                isOpen={!!viewingFile}
                onClose={() => setViewingFile(null)}
                record={viewingFile}
            />

            <TemplateUploadModal
                isOpen={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
            />

            <ActaGeneratorModal 
                isOpen={isActaModalOpen}
                onClose={() => setIsActaModalOpen(false)}
            />

            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                <Shield className="text-emerald-500" size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter italic">
                                    SCSST - GESTIÓN DEL SUBCOMITÉ
                                </h1>
                                <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Panel Oficial de Actividades del Objetivo 01</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                        {/* Cargar Formato removed */}
                        {/* Elaboración de acta removed */}
                        <BatchDownloadZip records={records} moduleName="SCSST" />
                        <button 
                            onClick={() => setIsAdding(!isAdding)}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                        >
                            {isAdding ? <X size={20} /> : <Plus size={20} />}
                            {isAdding ? 'Cancelar' : 'Cargar Actividad'}
                        </button>
                    </div>
                </div>

                {/* Form Section */}
                {isAdding && (
                    <Card id="scsst-activity-form" className={`bg-slate-900 border-slate-800 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden rounded-3xl ${editingId ? 'ring-2 ring-blue-500/50 border-blue-500/40' : ''}`}>
                        <CardHeader className="border-b border-slate-800 bg-slate-800/30">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <Upload size={18} className={editingId ? "text-blue-400" : "text-emerald-500"} />
                                    {editingId ? (
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-blue-400">✏️ Editando Registro</span>
                                            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-mono border border-blue-500/30">
                                                ID: {editingId}
                                            </span>
                                        </div>
                                    ) : (
                                        'Nueva Carga de Actividad'
                                    )}
                                </CardTitle>
                                {editingId && (
                                    <button 
                                        type="button"
                                        onClick={cancelEdit}
                                        className="text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-all font-bold flex items-center gap-1.5"
                                    >
                                        <X size={14} /> Cancelar Edición
                                    </button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                
                                <div className="space-y-1.5 col-span-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Fecha de Ejecución</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 text-slate-500" size={15} />
                                        <input name="formData_date" 
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:border-emerald-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5 col-span-1 md:col-span-1 lg:col-span-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Actividad SCSST (Debe coincidir con Programa Anual)</label>
                                    <SearchableSelect name="formData_activity" 
                                        options={activities}
                                        value={formData.activity}
                                        onChange={(val) => setFormData({...formData, activity: val})}
                                        placeholder="Seleccione la actividad..."
                                    />
                                    {activities.length === 0 && (
                                        <p className="text-[9px] text-amber-500 font-bold px-1 mt-1">⚠️ No se encontraron actividades en el Programa Anual (OBJ 01). Cargue el Excel del programa primero.</p>
                                    )}
                                </div>

                                <div className="space-y-1.5 col-span-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Responsable</label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-2.5 text-emerald-500/50 group-focus-within:text-emerald-500 transition-colors" size={15} />
                                        <select name="formData_responsable" 
                                            value={formData.responsable}
                                            onChange={(e) => setFormData({...formData, responsable: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-7 text-xs text-white focus:border-emerald-500 outline-none appearance-none cursor-pointer hover:border-slate-700 transition-all truncate"
                                        >
                                            <option value="">Seleccionar Responsable...</option>
                                            {USER_LIST.map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
                                        </select>
                                        <div className="absolute right-3 top-3 pointer-events-none text-slate-600">
                                            <Filter size={12} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5 col-span-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Ubicación / Zona</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-3 top-2.5 text-emerald-500/50 group-focus-within:text-emerald-500 transition-colors" size={15} />
                                        <select name="formData_zona" 
                                            value={formData.zona}
                                            onChange={(e) => setFormData({...formData, zona: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-7 text-xs text-white focus:border-emerald-500 outline-none appearance-none cursor-pointer hover:border-slate-700 transition-all truncate"
                                        >
                                            <option value="">Seleccionar Lugar...</option>
                                            {SSOMA_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                        <div className="absolute right-3 top-3 pointer-events-none text-slate-600">
                                            <Filter size={12} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5 col-span-1">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Acuerdos: [cantidad]</label>
                                        <span className="text-[9px] text-slate-500 font-bold">Acta</span>
                                    </div>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={formData.acuerdos_total}
                                            onChange={(e) => setFormData({...formData, acuerdos_total: e.target.value})}
                                            placeholder="Ej: 5"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:border-emerald-500 outline-none font-mono transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5 col-span-1">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Acuerdos cerrados: [cantidad]</label>
                                        {formData.acuerdos_total && Number(formData.acuerdos_total) > 0 && (
                                            <span className="text-[9px] font-bold text-emerald-400">
                                                {Math.round(((Number(formData.acuerdos_cerrados) || 0) / Number(formData.acuerdos_total)) * 100)}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={formData.acuerdos_cerrados}
                                            onChange={(e) => setFormData({...formData, acuerdos_cerrados: e.target.value})}
                                            placeholder="Ej: 5"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:border-emerald-500 outline-none font-mono transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Zona de Evidencia y Enlace Directo (Compacta y sin atascos) */}
                                <div className="col-span-1 md:col-span-2 lg:col-span-4 space-y-2">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            Evidencia / Sustento (Archivo o Enlace)
                                        </label>
                                        <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-bold">
                                            <button 
                                                type="button"
                                                onClick={() => setEvidenceMode('upload')}
                                                className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                                                    evidenceMode === 'upload' 
                                                        ? 'bg-emerald-600 text-white shadow' 
                                                        : 'text-slate-400 hover:text-white'
                                                }`}
                                            >
                                                <Upload size={12} /> Subir Archivo
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setEvidenceMode('link')}
                                                className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                                                    evidenceMode === 'link' 
                                                        ? 'bg-emerald-600 text-white shadow' 
                                                        : 'text-slate-400 hover:text-white'
                                                }`}
                                            >
                                                <LinkIcon size={12} /> Pegar Enlace (Drive / Web)
                                            </button>
                                        </div>
                                    </div>

                                    {evidenceMode === 'link' ? (
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <LinkIcon className="absolute left-3 top-2.5 text-slate-500" size={15} />
                                                <input 
                                                    type="url"
                                                    value={linkInput}
                                                    onChange={(e) => setLinkInput(e.target.value)}
                                                    placeholder="Pegar enlace de Google Drive, OneDrive o URL del acta..."
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:border-emerald-500 outline-none font-sans"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            if (linkInput.trim()) {
                                                                setUploadedFiles(prev => [...prev, linkInput.trim()]);
                                                                setLinkInput('');
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    if (linkInput.trim()) {
                                                        setUploadedFiles(prev => [...prev, linkInput.trim()]);
                                                        setLinkInput('');
                                                    }
                                                }}
                                                disabled={!linkInput.trim()}
                                                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
                                            >
                                                <Plus size={14} /> Agregar
                                            </button>
                                        </div>
                                    ) : (
                                        <div 
                                            onDragOver={(e) => { e.preventDefault(); if (!isUploading) setIsDragging(true); }}
                                            onDragLeave={() => setIsDragging(false)}
                                            onDrop={async (e) => {
                                                e.preventDefault();
                                                setIsDragging(false);
                                                if (isUploading) return;
                                                const files = Array.from(e.dataTransfer.files);
                                                if (files.length === 0) return;
                                                setIsUploading(true);
                                                try {
                                                    for (const file of files) {
                                                        const url = await uploadEvidence(
                                                            file, 
                                                            'Actividad', 
                                                            formData.activity || 'ACTIVIDAD_SCSST', 
                                                            formData.date || new Date().toISOString().split('T')[0], 
                                                            formData.responsable || user?.name || 'SCSST_RESPONSABLE',
                                                            'SCSST',
                                                            'SEGURIDAD',
                                                            formData.zona || 'GENERAL',
                                                            'OBJ_01'
                                                        );
                                                        setUploadedFiles(prev => [...prev, url]);
                                                    }
                                                } catch (err: any) {
                                                    console.error(err);
                                                    alert(`Error al subir: ${err.message || 'Problema de conexión'}`);
                                                } finally {
                                                    setIsUploading(false);
                                                }
                                            }}
                                            className={`relative border border-dashed rounded-2xl py-3 px-4 transition-all flex items-center justify-center gap-3 cursor-pointer group ${
                                                isUploading ? 'border-amber-500 bg-amber-500/5 cursor-wait' :
                                                isDragging ? 'border-emerald-500 bg-emerald-500/10' : 
                                                uploadedFiles.length > 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/30'
                                            }`}
                                        >
                                            <input 
                                                type="file"
                                                multiple
                                                disabled={isUploading}
                                                onChange={async (e) => {
                                                    const files = Array.from(e.target.files || []);
                                                    if (files.length === 0) return;
                                                    setIsUploading(true);
                                                    try {
                                                        for (const file of files) {
                                                            const url = await uploadEvidence(
                                                                file, 
                                                                'Actividad', 
                                                                formData.activity || 'ACTIVIDAD_SCSST', 
                                                                formData.date || new Date().toISOString().split('T')[0], 
                                                                formData.responsable || user?.name || 'SCSST_RESPONSABLE',
                                                                'SCSST',
                                                                'SEGURIDAD',
                                                                formData.zona || 'GENERAL',
                                                                'OBJ_01'
                                                            );
                                                            setUploadedFiles(prev => [...prev, url]);
                                                        }
                                                    } catch (err: any) {
                                                        console.error(err);
                                                        alert(`Error al subir: ${err.message || 'Problema de conexión'}`);
                                                    } finally {
                                                        setIsUploading(false);
                                                    }
                                                }}
                                                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-wait"
                                            />
                                            <div className={`p-1.5 rounded-lg ${isUploading ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 group-hover:text-emerald-400'}`}>
                                                <Upload size={16} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-bold text-slate-300">
                                                    {isUploading ? 'Subiendo archivos...' : 'Arrastra o haz clic para subir PDF o imagen'}
                                                </p>
                                                <span className="text-[10px] text-slate-500 font-medium">(PDF, PNG, JPG)</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Lista Compacta de Evidencias */}
                                    {uploadedFiles.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {uploadedFiles.map((url, idx) => {
                                                const isUrl = url.startsWith('http://') || url.startsWith('https://');
                                                const isPdf = url.toLowerCase().endsWith('.pdf');
                                                return (
                                                    <div key={idx} className="bg-slate-900 border border-slate-800 hover:border-emerald-500/30 px-2.5 py-1 rounded-lg flex items-center gap-2 text-[10px]">
                                                        {isUrl && !isPdf ? (
                                                            <ExternalLink size={12} className="text-blue-400 shrink-0" />
                                                        ) : isPdf ? (
                                                            <FileText size={12} className="text-red-400 shrink-0" />
                                                        ) : (
                                                            <Upload size={12} className="text-emerald-400 shrink-0" />
                                                        )}
                                                        <a 
                                                            href={url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-slate-300 hover:text-emerald-400 font-medium truncate max-w-[160px] underline decoration-slate-700"
                                                        >
                                                            {isUrl && !url.includes('/api/') ? 'Enlace Directo' : `Evidencia #${idx + 1}`}
                                                        </a>
                                                        <button 
                                                            type="button"
                                                            onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
                                                            className="text-slate-500 hover:text-red-400 p-0.5 ml-1 transition-colors"
                                                            title="Quitar"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>



                                <div className="col-span-1 md:col-span-2 lg:col-span-4 space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Descripción / Notas Adicionales</label>
                                    <textarea name="formData_description" 
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        placeholder="Ingrese detalles sobre la ejecución de la actividad..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-emerald-500 outline-none h-20 resize-none mt-2"
                                    />
                                </div>

                                <div className="col-span-1 md:col-span-2 lg:col-span-4 flex justify-end gap-3 pt-2">
                                    {editingId && (
                                        <button 
                                            type="button"
                                            onClick={cancelEdit}
                                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                    <button 
                                        disabled={isSaving || isUploading}
                                        onClick={handleSave}
                                        className={`${editingId ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'} disabled:bg-slate-800 disabled:text-slate-500 text-white px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl`}
                                    >
                                        {isSaving ? 'Guardando...' : isUploading ? 'Espere, subiendo...' : editingId ? 'Actualizar Actividad' : 'Registrar Actividad'}
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* List Section */}
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <FileText size={18} className="text-emerald-500" />
                            Rastro de Cargas SCSST
                        </h2>
                        <div className="flex items-center gap-2">
                            <BatchDownloadZip 
                                records={filteredRecords}
                                getUrls={(r) => r.fileUrls || (r.fileUrl ? r.fileUrl.split('|').filter(Boolean) : [])}
                                getFilename={(r, i, total) => {
                                    let ext = 'pdf'; 
                                    if (r.fileType === 'image' || (r.fileUrls && r.fileUrls[0]?.match(/\.(jpg|jpeg|png)$/i))) ext = 'jpg';
                                    return generateFilename(r.activity, r.date, r.responsable || r.responsible, ext as any, 'evidencia', r.zona || r.location, 'scsst').replace(/\.[^/.]+$/, "") + (total > 1 ? `_parte${i+1}` : "") + `.${ext}`;
                                }}
                                zipName={`Evidencias_SCSST_${filters.date || 'Masivas'}.zip`}
                                className="h-[33px] px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold uppercase transition-colors border border-emerald-500/20 flex items-center justify-center gap-2"
                            />
                        </div>
                    </div>

                    {/* RESUMEN MENSUAL Y CONTABILIDAD DE ACUERDOS */}
                    {(() => {
                        let totalAcuerdos = 0;
                        let totalCerrados = 0;
                        let totalCumplidos = 0;

                        const monthlyStats = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'].map((m, i) => {
                            const monthRecs = records.filter(r => {
                                const d = new Date(r.date + 'T00:00:00');
                                return d.getMonth() === i;
                            });
                            const count = monthRecs.length;

                            let monthAcuerdosTotal = 0;
                            let monthAcuerdosCerrados = 0;
                            monthRecs.forEach(r => {
                                if (r.acuerdos_total !== null && r.acuerdos_total !== undefined && !isNaN(Number(r.acuerdos_total))) {
                                    monthAcuerdosTotal += Number(r.acuerdos_total);
                                } else if (r.description) {
                                    const match = r.description.match(/\[Acuerdos:\s*(\d+)\/(\d+)/i);
                                    if (match) monthAcuerdosTotal += Number(match[2]);
                                }

                                if (r.acuerdos_cerrados !== null && r.acuerdos_cerrados !== undefined && !isNaN(Number(r.acuerdos_cerrados))) {
                                    monthAcuerdosCerrados += Number(r.acuerdos_cerrados);
                                } else if (r.description) {
                                    const match = r.description.match(/\[Acuerdos:\s*(\d+)\/(\d+)/i);
                                    if (match) monthAcuerdosCerrados += Number(match[1]);
                                }
                            });

                            const monthCumplido = (monthAcuerdosTotal > 0 && (monthAcuerdosCerrados / monthAcuerdosTotal) >= 0.9) ? 1 : 0;

                            totalAcuerdos += monthAcuerdosTotal;
                            totalCerrados += monthAcuerdosCerrados;
                            totalCumplidos += monthCumplido;

                            return {
                                m,
                                i,
                                count,
                                total: monthAcuerdosTotal,
                                cerrados: monthAcuerdosCerrados,
                                cumplido: monthCumplido
                            };
                        });

                        return (
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 px-2">
                                    {monthlyStats.map(stat => (
                                        <div 
                                            key={stat.m} 
                                            className={`flex flex-col justify-between p-2 rounded-xl border transition-all ${
                                                stat.count > 0 
                                                    ? 'bg-slate-900/90 border-emerald-500/30 shadow-sm' 
                                                    : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1.5">
                                                <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider">{stat.m}</span>
                                                <span className={`text-[8px] font-black px-1.5 py-0.2 rounded ${
                                                    stat.count > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                                                }`} title={`${stat.count} actividad(es) registradas`}>
                                                    {stat.count}
                                                </span>
                                            </div>

                                            <div className="space-y-0.5 my-0.5">
                                                <p className="text-[9px] text-slate-400 leading-tight">
                                                    Acuerdos: <span className="font-bold text-white">{stat.total}</span>
                                                </p>
                                                <p className="text-[9px] text-slate-400 leading-tight truncate">
                                                    <span className="font-bold text-emerald-400">{stat.cerrados}</span> Acuerdos cerrados
                                                </p>
                                            </div>

                                            <div className="mt-1 pt-1 border-t border-slate-800/80 flex items-center justify-between">
                                                <span className="text-[8px] font-bold text-slate-400">Cumplidos:</span>
                                                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded font-mono ${
                                                    stat.cumplido === 1 
                                                        ? 'bg-emerald-500 text-slate-950 font-black' 
                                                        : 'bg-slate-800 text-slate-500'
                                                }`}>
                                                    {stat.cumplido}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl mx-2 text-[11px]">
                                    <div className="flex items-center gap-2">
                                        <Shield size={14} className="text-emerald-400" />
                                        <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                                            Contabilidad Anual de Acuerdos SCSST (Objetivo 1 - Meta: ≥ 90% cerrados):
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-bold">
                                        <span className="text-slate-400">Total Cargas: <strong className="text-white font-mono">{records.length}</strong></span>
                                        <span className="text-slate-400">Total Acuerdos: <strong className="text-white font-mono">{totalAcuerdos}</strong></span>
                                        <span className="text-slate-400">Total Cerrados: <strong className="text-emerald-400 font-mono">{totalCerrados}</strong></span>
                                        <span className="text-slate-400">Meses Cumplidos (Obj 1): <strong className="text-emerald-400 font-mono">{totalCumplidos} / 12</strong></span>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Filters Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-900/30 p-4 rounded-2xl border border-slate-800/50 items-end">
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Fecha</label>
                                {filters.date && (
                                    <button onClick={() => setFilters({...filters, date: ''})} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                        <X size={10} />
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 text-emerald-500/50" size={14} />
                                <input name="filters_date" 
                                    type="date"
                                    value={filters.date}
                                    onChange={(e) => setFilters({...filters, date: e.target.value})}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 pl-9 pr-3 text-[10px] text-white focus:border-emerald-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Actividad</label>
                                {filters.activity && (
                                    <button onClick={() => setFilters({...filters, activity: ''})} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                        <X size={10} />
                                    </button>
                                )}
                            </div>
                            <SearchableSelect name="filters_activity" 
                                options={filterOptions.activities}
                                value={filters.activity}
                                onChange={(val) => setFilters({...filters, activity: val})}
                                placeholder="Todas las actividades"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Responsable</label>
                                {filters.responsable && (
                                    <button onClick={() => setFilters({...filters, responsable: ''})} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                        <X size={10} />
                                    </button>
                                )}
                            </div>
                            <SearchableSelect name="filters_responsable" 
                                options={filterOptions.responsibles}
                                value={filters.responsable}
                                onChange={(val) => setFilters({...filters, responsable: val})}
                                placeholder="Todos los responsables"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Lugar / Zona</label>
                                {filters.zona && (
                                    <button onClick={() => setFilters({...filters, zona: ''})} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                        <X size={10} />
                                    </button>
                                )}
                            </div>
                            <SearchableSelect name="filters_zona" 
                                options={filterOptions.zones}
                                value={filters.zona}
                                onChange={(val) => setFilters({...filters, zona: val})}
                                placeholder="Todas las zonas"
                            />
                        </div>
                        <div className="space-y-1.5 flex flex-col justify-end h-[53px]">
                            <button 
                                onClick={() => setFilters({ date: '', activity: '', responsable: '', zona: '' })}
                                className={`w-full h-[33px] rounded-lg text-[10px] font-bold uppercase transition-all border flex items-center justify-center gap-2 active:scale-95 ${
                                    (filters.date || filters.activity || filters.responsable || filters.zona)
                                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 shadow-lg shadow-red-950/20'
                                    : 'bg-slate-800/50 text-slate-500 border-slate-800 cursor-not-allowed opacity-50'
                                }`}
                                disabled={!(filters.date || filters.activity || filters.responsable || filters.zona)}
                            >
                                <RotateCcw size={12} strokeWidth={3} /> Limpiar Filtros
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Cargando registros...</p>
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl py-20 flex flex-col items-center justify-center text-center px-4">
                            <div className="p-4 bg-slate-800 rounded-full mb-4 text-slate-600">
                                <Search size={40} />
                            </div>
                            <h3 className="text-white font-bold mb-1">No se encontraron resultados</h3>
                            <p className="text-xs text-slate-500 max-w-xs">Intente ajustando los filtros o cargue una nueva evidencia.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                            {/* Columna: Acta de Aprobación */}
                            <div className="space-y-4">
                                <h2 className="text-xs font-black text-violet-400 bg-slate-800/50 p-3 rounded-xl text-center uppercase tracking-widest border-t-2 border-violet-500 flex items-center justify-center gap-1.5 shadow-sm">
                                    <span>Acta de Aprobación</span>
                                    <span className="text-[10px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded-full font-mono">{actasAprobacion.length}</span>
                                </h2>
                                {actasAprobacion.length === 0 ? (
                                    <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center">
                                        <p className="text-[11px] text-slate-500">Sin actas registradas</p>
                                    </div>
                                ) : (
                                    actasAprobacion.map(renderCard)
                                )}
                            </div>

                            {/* Columna: Reuniones */}
                            <div className="space-y-4">
                                <h2 className="text-xs font-black text-emerald-400 bg-slate-800/50 p-3 rounded-xl text-center uppercase tracking-widest border-t-2 border-emerald-500 flex items-center justify-center gap-1.5 shadow-sm">
                                    <span>Reuniones</span>
                                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-mono">{reuniones.length}</span>
                                </h2>
                                {reuniones.length === 0 ? (
                                    <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center">
                                        <p className="text-[11px] text-slate-500">Sin reuniones registradas</p>
                                    </div>
                                ) : (
                                    reuniones.map(renderCard)
                                )}
                            </div>

                            {/* Columna: Capacitaciones */}
                            <div className="space-y-4">
                                <h2 className="text-xs font-black text-blue-400 bg-slate-800/50 p-3 rounded-xl text-center uppercase tracking-widest border-t-2 border-blue-500 flex items-center justify-center gap-1.5 shadow-sm">
                                    <span>Capacitaciones</span>
                                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full font-mono">{capacitaciones.length}</span>
                                </h2>
                                {capacitaciones.length === 0 ? (
                                    <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center">
                                        <p className="text-[11px] text-slate-500">Sin capacitaciones</p>
                                    </div>
                                ) : (
                                    capacitaciones.map(renderCard)
                                )}
                            </div>

                            {/* Columna: Inspecciones */}
                            <div className="space-y-4">
                                <h2 className="text-xs font-black text-rose-400 bg-slate-800/50 p-3 rounded-xl text-center uppercase tracking-widest border-t-2 border-rose-500 flex items-center justify-center gap-1.5 shadow-sm">
                                    <span>Inspecciones</span>
                                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded-full font-mono">{inspecciones.length}</span>
                                </h2>
                                {inspecciones.length === 0 ? (
                                    <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center">
                                        <p className="text-[11px] text-slate-500">Sin inspecciones</p>
                                    </div>
                                ) : (
                                    inspecciones.map(renderCard)
                                )}
                            </div>

                            {/* Columna: Informes Trimestrales */}
                            <div className="space-y-4">
                                <h2 className="text-xs font-black text-amber-400 bg-slate-800/50 p-3 rounded-xl text-center uppercase tracking-widest border-t-2 border-amber-500 flex items-center justify-center gap-1.5 shadow-sm">
                                    <span>Informes Trimestrales</span>
                                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-mono">{informes.length}</span>
                                </h2>
                                {informes.length === 0 && otros.length === 0 ? (
                                    <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center">
                                        <p className="text-[11px] text-slate-500">Sin informes</p>
                                    </div>
                                ) : (
                                    informes.map(renderCard)
                                )}
                                {otros.length > 0 && (
                                    <>
                                        <h2 className="text-xs font-black text-slate-400 bg-slate-800/50 p-3 rounded-xl text-center uppercase tracking-widest border-t-2 border-slate-500 mt-6 flex items-center justify-center gap-1.5 shadow-sm">
                                            <span>Otros</span>
                                            <span className="text-[10px] bg-slate-500/20 text-slate-300 px-1.5 py-0.5 rounded-full font-mono">{otros.length}</span>
                                        </h2>
                                        {otros.map(renderCard)}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

            {viewingFile && (
                <PreviewCarouselModal
                    urls={viewingFile.fileUrls || (viewingFile.fileUrl ? viewingFile.fileUrl.split('|').filter(Boolean) : [])}
                    onClose={() => setViewingFile(null)}
                    canEdit={user?.role === 'developer' || user?.role === 'manager' || user?.name === (viewingFile.responsable || viewingFile.responsible)}
                    filename={generateFilename(viewingFile.activity, viewingFile.date, viewingFile.responsable || viewingFile.responsible, 'pdf', 'evidencia', viewingFile.zona || viewingFile.location, 'scsst')}
                />
            )}

            </div>
        </div>
    );
}

