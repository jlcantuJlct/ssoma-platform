"use client";

import { useState, useEffect } from 'react';
import { useAuth, USER_LIST } from '@/lib/auth';
import { Search, Plus, FileText, Calendar, User, MapPin, Upload, Shield, Trash2, Check, X, Filter } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import { uploadEvidence } from '@/lib/uploadClient';
import { SSOMA_LOCATIONS } from '@/lib/locations';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getDriveViewerUrl } from "@/lib/utils";

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
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    
    // Form state
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        activity: '',
        responsable: user?.name || '',
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

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. We NO LONGER overwrite activities with fetched ones. 
            // We use the 7 standard ones from the image (SCSST_ACTIVITIES).
            setActivities(SCSST_ACTIVITIES);

            // 2. Fetch existing SCSST records (from evidence_center_records with objective OBJ 01)
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

    const handleSave = async () => {
        if (!formData.activity || uploadedFiles.length === 0) {
            alert('Por favor complete la actividad y cargue al menos una evidencia.');
            return;
        }

        setIsSaving(true);
        try {
            const newRecord = {
                id: Date.now(),
                date: formData.date,
                objective: 'OBJ 01',
                activity: formData.activity,
                description: formData.description,
                responsable: formData.responsable,
                zona: formData.zona,
                fileUrl: uploadedFiles[0], // Keep for backward compatibility
                fileUrls: uploadedFiles, // Store the array
                fileType: 'pdf'
            };

            const allRecords = [...records, newRecord];
            
            const res = await fetch('/api/evidence-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: allRecords, userName: user?.name })
            });

            if (res.ok) {
                setIsAdding(false);
                setFormData({
                    ...formData,
                    activity: '',
                    description: '',
                });
                setUploadedFiles([]);
                fetchData();
            }
        } catch (error) {
            console.error('Error saving SCSST record:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: any) => {
        if (!confirm('¿Estás seguro de eliminar este registro?')) return;
        
        try {
            const updated = records.filter(r => r.id !== id);
            await fetch('/api/evidence-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: updated, userName: user?.name })
            });
            fetchData();
        } catch (error) {
            console.error('Error deleting record:', error);
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
                                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={async (e) => {
                                            e.preventDefault();
                                            setIsDragging(false);
                                            const files = Array.from(e.dataTransfer.files);
                                            for (const file of files) {
                                                const url = await uploadEvidence(file);
                                                setUploadedFiles(prev => [...prev, url]);
                                            }
                                        }}
                                        className={`relative border-2 border-dashed rounded-3xl p-8 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group ${
                                            isDragging ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]' : 
                                            uploadedFiles.length > 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/30'
                                        }`}
                                    >
                                        <input 
                                            type="file"
                                            multiple
                                            onChange={async (e) => {
                                                const files = Array.from(e.target.files || []);
                                                for (const file of files) {
                                                    const url = await uploadEvidence(file);
                                                    setUploadedFiles(prev => [...prev, url]);
                                                }
                                            }}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                        <div className={`p-4 rounded-2xl transition-colors ${isDragging ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-emerald-400'}`}>
                                            <Upload size={32} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-black text-white uppercase tracking-widest">
                                                {isDragging ? '¡SUELTA LOS ARCHIVOS!' : 'ARRASTRA O HAZ CLIC AQUÍ'}
                                            </p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                                                {uploadedFiles.length > 0 ? `${uploadedFiles.length} ARCHIVOS CARGADOS` : 'SOPORTA PDF E IMÁGENES'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* File Previews */}
                                    {uploadedFiles.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {uploadedFiles.map((url, idx) => (
                                                <div key={idx} className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2 animate-in zoom-in-95">
                                                    <FileText size={12} className="text-emerald-400" />
                                                    <span className="text-[9px] font-bold text-slate-300">Archivo {idx + 1}</span>
                                                    <button onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
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
                                        disabled={isSaving}
                                        onClick={handleSave}
                                        className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-900/20"
                                    >
                                        {isSaving ? 'Guardando...' : 'Registrar Actividad'}
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
                            {(filters.date || filters.activity || filters.responsable || filters.zona) && (
                                <button 
                                    onClick={() => setFilters({ date: '', activity: '', responsable: '', zona: '' })}
                                    className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-300 transition-colors flex items-center gap-1"
                                >
                                    <X size={12} /> Limpiar Filtros
                                </button>
                            )}
                            <div className="text-[10px] font-mono text-slate-600 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                                {filteredRecords.length} REGISTROS ENCONTRADOS
                            </div>
                        </div>
                    </div>

                    {/* Filters Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-900/30 p-4 rounded-2xl border border-slate-800/50">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Fecha</label>
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
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Actividad</label>
                            <SearchableSelect 
                                options={filterOptions.activities}
                                value={filters.activity}
                                onChange={(val) => setFilters({...filters, activity: val})}
                                placeholder="Todas las actividades"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Responsable</label>
                            <SearchableSelect 
                                options={filterOptions.responsibles}
                                value={filters.responsable}
                                onChange={(val) => setFilters({...filters, responsable: val})}
                                placeholder="Todos los responsables"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Lugar / Zona</label>
                            <SearchableSelect 
                                options={filterOptions.zones}
                                value={filters.zona}
                                onChange={(val) => setFilters({...filters, zona: val})}
                                placeholder="Todas las zonas"
                            />
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
                            {filteredRecords.map((rec) => (
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
                                                    onClick={() => window.open(getDriveViewerUrl(rec.fileUrl), '_blank')}
                                                    className="p-2 bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-lg transition-all"
                                                >
                                                    <FileText size={14} />
                                                </button>
                                                {(user?.role === 'developer' || user?.role === 'manager' || user?.name === (rec.responsable || rec.responsible)) && (
                                                    <button 
                                                        onClick={() => handleDelete(rec.id)}
                                                        className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-all"
                                                        title="Eliminar Registro"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
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
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

