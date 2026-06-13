"use client";

import { useState, useEffect } from 'react';
import { useAuth, USER_LIST } from '@/lib/auth';
import { Search, Plus, FileText, Calendar, User, MapPin, Upload, Shield, Trash2, Check, X, Filter, RotateCcw } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import { uploadEvidence } from '@/lib/uploadClient';
import { SSOMA_LOCATIONS } from '@/lib/locations';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getDriveViewerUrl, generateFilename, canDeleteRecord} from "@/lib/utils";
import PreviewCarouselModal from "@/components/PreviewCarouselModal";
import BatchDownloadZip from "@/components/BatchDownloadZip";

// Activities from Annual Program OBJ 01 (Based on image)
const SCSST_ACTIVITIES = [
    "Inspecciones del SCSST",
    "Capacitaciones Notificación, investigación y reporte de incidentes (SCSST).",
    "Elaboración de Informes trimestrales (SCSST).",
    "Capacitaciones IPERC (SCSST).",
    "Reunión ordinaria del Subcomité de seguridad y salud en el trabajo (SCSST).",
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
    const [viewingFile, setViewingFile] = useState<any>(null);
    
    // Form state
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        activity: '',
        responsable: user?.name || 'Usuario SSOMA',
        zona: SSOMA_LOCATIONS[0],
        description: '',
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
        
        // Only show records that belong to the 7 official activities
        const isOfficialActivity = SCSST_ACTIVITIES.includes(rec.activity);
        if (!isOfficialActivity) return false;

        const matchDate = !filters.date || rec.date === filters.date;
        const matchActivity = !filters.activity || rec.activity === filters.activity;
        const matchResp = !filters.responsable || (rec.responsable || rec.responsible) === filters.responsable;
        const matchZone = !filters.zona || (rec.zona || rec.location) === filters.zona;
        return matchDate && matchActivity && matchResp && matchZone;
    });

    // Derive filter options - ALWAYS show full lists so user can filter easily
    const filterOptions = {
        dates: Array.from(new Set((records || []).map(r => r?.date).filter(Boolean))).sort().reverse(),
        activities: SCSST_ACTIVITIES,
        responsibles: USER_LIST.map(u => u.name).sort(),
        zones: SSOMA_LOCATIONS.sort()
    };

    const handleEdit = (rec: any) => {
        setFormData({
            date: rec.date,
            activity: rec.activity,
            responsable: rec.responsable || rec.responsible || '',
            zona: rec.zona || rec.location || '',
            description: rec.description || ''
        });
        setUploadedFiles(rec.fileUrls || (rec.fileUrl ? [rec.fileUrl] : []));
        setEditingId(rec.id);
        setIsAdding(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({
            ...formData,
            activity: '',
            description: '',
        });
        setUploadedFiles([]);
    };

    const handleSave = async () => {
        if (!formData.activity || uploadedFiles.length === 0) {
            alert('Por favor complete la actividad y cargue al menos una evidencia.');
            return;
        }

        setIsSaving(true);
        try {
            const newRecord = {
                id: editingId || Date.now(),
                date: formData.date,
                objective: 'OBJ 01',
                activity: formData.activity,
                description: formData.description,
                responsable: formData.responsable,
                zona: formData.zona,
                fileUrl: uploadedFiles[0],
                fileUrls: uploadedFiles,
                fileType: 'pdf'
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

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
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
                    <button 
                        onClick={() => setIsAdding(!isAdding)}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                    >
                        {isAdding ? <X size={20} /> : <Plus size={20} />}
                        {isAdding ? 'Cancelar' : 'Cargar Actividad'}
                    </button>
                </div>

                {/* Form Section */}
                {isAdding && (
                    <Card className="bg-slate-900 border-slate-800 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden rounded-3xl">
                        <CardHeader className="border-b border-slate-800 bg-slate-800/30">
                            <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Upload size={18} className="text-emerald-500" />
                                Nueva Carga de Actividad
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Fecha de Ejecución</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 text-slate-500" size={16} />
                                        <input 
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:border-emerald-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 lg:col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Actividad SCSST (Debe coincidir con Programa Anual)</label>
                                    <SearchableSelect 
                                        options={activities}
                                        value={formData.activity}
                                        onChange={(val) => setFormData({...formData, activity: val})}
                                        placeholder="Seleccione la actividad..."
                                    />
                                    {activities.length === 0 && (
                                        <p className="text-[9px] text-amber-500 font-bold px-1 mt-1">⚠️ No se encontraron actividades en el Programa Anual (OBJ 01). Cargue el Excel del programa primero.</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Responsable</label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-3 text-emerald-500/50 group-focus-within:text-emerald-500 transition-colors" size={16} />
                                        <select 
                                            value={formData.responsable}
                                            onChange={(e) => setFormData({...formData, responsable: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:border-emerald-500 outline-none appearance-none cursor-pointer hover:border-slate-700 transition-all"
                                        >
                                            <option value="">Seleccionar Responsable...</option>
                                            {USER_LIST.map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
                                        </select>
                                        <div className="absolute right-3 top-3.5 pointer-events-none text-slate-600">
                                            <Filter size={12} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Ubicación / Zona</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-3 top-3 text-emerald-500/50 group-focus-within:text-emerald-500 transition-colors" size={16} />
                                        <select 
                                            value={formData.zona}
                                            onChange={(e) => setFormData({...formData, zona: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:border-emerald-500 outline-none appearance-none cursor-pointer hover:border-slate-700 transition-all"
                                        >
                                            <option value="">Seleccionar Lugar...</option>
                                            {SSOMA_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                        <div className="absolute right-3 top-3.5 pointer-events-none text-slate-600">
                                            <Filter size={12} />
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-3 space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                        Zona de Carga (Arrastra PDFs o Imágenes)
                                    </label>
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
                                        className={`relative border-2 border-dashed rounded-3xl p-10 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group ${
                                            isUploading ? 'border-amber-500 bg-amber-500/5 cursor-wait' :
                                            isDragging ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]' : 
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
                                        <div className={`p-4 rounded-2xl transition-all ${
                                            isUploading ? 'bg-amber-500 text-white animate-pulse' :
                                            isDragging ? 'bg-emerald-500 text-white' : 
                                            'bg-slate-800 text-slate-400 group-hover:text-emerald-400'
                                        }`}>
                                            {isUploading ? <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={32} />}
                                        </div>
                                        <div className="text-center">
                                            <p className={`text-xs font-black uppercase tracking-widest ${isUploading ? 'text-amber-500' : 'text-white'}`}>
                                                {isUploading ? 'SUBIENDO ARCHIVOS...' : isDragging ? '¡SUELTA LOS ARCHIVOS!' : 'ARRASTRA O HAZ CLIC AQUÍ'}
                                            </p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                                                {isUploading ? 'POR FAVOR ESPERE UN MOMENTO' : uploadedFiles.length > 0 ? `✅ ${uploadedFiles.length} ARCHIVOS LISTOS` : 'SOPORTA PDF E IMÁGENES'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* File Previews */}
                                    {uploadedFiles.length > 0 && (
                                        <div className="space-y-3 pt-4 border-t border-slate-800/50 mt-4">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                    Evidencias Listas ({uploadedFiles.length})
                                                </label>
                                                <div className="flex gap-3 text-[9px] font-black uppercase tracking-tighter">
                                                    <span className="text-red-400">PDF: {uploadedFiles.filter(url => url.toLowerCase().endsWith('.pdf')).length}</span>
                                                    <span className="text-emerald-400">IMG: {uploadedFiles.filter(url => !url.toLowerCase().endsWith('.pdf')).length}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {uploadedFiles.map((url, idx) => {
                                                    const isPdf = url.toLowerCase().endsWith('.pdf');
                                                    return (
                                                        <div key={idx} className="bg-slate-950/50 px-3 py-2 rounded-2xl border border-slate-800 flex items-center gap-3 animate-in zoom-in-95 group hover:border-emerald-500/30 transition-all">
                                                            <div className={`p-1.5 rounded-lg ${isPdf ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                                <FileText size={14} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                                                    {isPdf ? 'Documento PDF' : 'Imagen Evidencia'}
                                                                </span>
                                                                <span className="text-[8px] text-slate-500 font-bold truncate max-w-[80px]">
                                                                    #{idx + 1}
                                                                </span>
                                                            </div>
                                                            <button 
                                                                onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))} 
                                                                className="ml-1 p-1 text-slate-600 hover:text-red-400 transition-colors"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="md:col-span-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Descripción / Notas Adicionales</label>
                                    <textarea 
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        placeholder="Ingrese detalles sobre la ejecución de la actividad..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-emerald-500 outline-none h-20 resize-none mt-2"
                                    />
                                </div>

                                <div className="md:col-span-3 flex justify-end pt-4">
                                    <button 
                                        disabled={isSaving || isUploading}
                                        onClick={handleSave}
                                        className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-900/20"
                                    >
                                        {isSaving ? 'Guardando...' : isUploading ? 'Espere, subiendo...' : 'Registrar Actividad'}
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

                    {/* RESUMEN MENSUAL */}
                    <div className="flex flex-wrap gap-2 px-2">
                        {['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'].map((m, i) => {
                            const count = records.filter(r => {
                                const d = new Date(r.date + 'T00:00:00');
                                return d.getMonth() === i;
                            }).length;
                            return (
                                <div key={m} className={`flex flex-col items-center justify-center min-w-[45px] py-1.5 rounded-xl border ${count > 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-600 opacity-50'}`}>
                                    <span className="text-[7px] font-black uppercase tracking-tighter">{m}</span>
                                    <span className="text-[9px] font-black">{count}</span>
                                </div>
                            );
                        })}
                        <div className="flex flex-col items-center justify-center min-w-[60px] py-1.5 rounded-xl border bg-blue-500/10 border-blue-500/30 text-blue-400 ml-auto">
                            <span className="text-[7px] font-black uppercase tracking-tighter">TOTAL</span>
                            <span className="text-[9px] font-black">{records.length}</span>
                        </div>
                    </div>

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
                                <input 
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
                            <SearchableSelect 
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
                            <SearchableSelect 
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
                            <SearchableSelect 
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredRecords.map((rec) => {
                                const fileCount = rec.fileUrls ? rec.fileUrls.length : (rec.fileUrl ? 1 : 0);
                                const hasFiles = fileCount > 0;
                                return (
                                <Card key={rec.id} className="bg-slate-900 border-slate-800 hover:border-emerald-500/30 transition-all group overflow-hidden rounded-2xl">
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
                                                            onClick={() => handleEdit(rec)}
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
                            })}
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
