"use client";

import { useState, useEffect } from 'react';
import { useAuth, USER_LIST } from '@/lib/auth';
import { FileText, Plus, Trash2, Calendar, User, MapPin, Upload, Folder, X, ShieldCheck } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import { uploadEvidence } from '@/lib/uploadClient';
import { SSOMA_LOCATIONS } from '@/lib/locations';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getDriveViewerUrl } from "@/lib/utils";

const MONTHS = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
];

export default function InformesPage() {
    const { user } = useAuth();
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    
    // Form state
    const [formData, setFormData] = useState({
        date: '',
        month: '',
        responsable: 'Usuario SSOMA',
        zona: SSOMA_LOCATIONS[0],
        description: '',
    });

    useEffect(() => {
        const currentMonthIndex = new Date().getMonth();
        setFormData(prev => ({
            ...prev,
            date: new Date().toISOString().split('T')[0],
            month: MONTHS[currentMonthIndex],
            responsable: user?.name || 'Usuario SSOMA'
        }));
        fetchData();
    }, [user?.name]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const recRes = await fetch('/api/informes-records');
            const recData = await recRes.json();
            if (recData.success && Array.isArray(recData.records)) {
                setRecords(recData.records);
            }
        } catch (error) {
            console.error('Error fetching Informes data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.month || uploadedFiles.length === 0) {
            alert('Por favor seleccione el mes y cargue el archivo correspondiente.');
            return;
        }

        setIsSaving(true);
        try {
            const newRecord = {
                id: Date.now(),
                date: formData.date,
                month: formData.month,
                description: formData.description,
                responsable: formData.responsable,
                zona: formData.zona,
                fileUrls: uploadedFiles,
            };

            const allRecords = [...records, newRecord];
            
            const res = await fetch('/api/informes-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: allRecords })
            });

            if (res.ok) {
                setIsAdding(false);
                setFormData({
                    ...formData,
                    description: '',
                });
                setUploadedFiles([]);
                fetchData();
            }
        } catch (error) {
            console.error('Error saving record:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: any) => {
        if (!confirm('¿Estás seguro de eliminar este registro?')) return;
        
        try {
            const updated = records.filter(r => r.id !== id);
            await fetch('/api/informes-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: updated })
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
                            <div className="p-3 bg-violet-500/10 rounded-2xl border border-violet-500/20">
                                <ShieldCheck className="text-violet-500" size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter">
                                    Control de Informes
                                </h1>
                                <p className="text-xs text-violet-400 font-bold uppercase tracking-widest">Informes Mensuales por Ubicación</p>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsAdding(!isAdding)}
                        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-violet-600/20 active:scale-95"
                    >
                        {isAdding ? <X size={20} /> : <Plus size={20} />}
                        {isAdding ? 'Cancelar' : 'Cargar Informe'}
                    </button>
                </div>

                {/* Form Section */}
                {isAdding && (
                    <Card className="bg-slate-900 border-slate-800 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden rounded-3xl">
                        <CardHeader className="border-b border-slate-800 bg-slate-800/30">
                            <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Upload size={18} className="text-violet-500" />
                                Nueva Carga de Informe
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Mes del Informe</label>
                                    <SearchableSelect 
                                        options={MONTHS}
                                        value={formData.month}
                                        onChange={(val) => setFormData({...formData, month: val})}
                                        placeholder="Seleccione el mes..."
                                    />
                                </div>

                                <div className="space-y-2 lg:col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Ubicación / Proyecto</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-3 top-3 text-violet-500/50" size={16} />
                                        <select 
                                            value={formData.zona}
                                            onChange={(e) => setFormData({...formData, zona: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:border-violet-500 outline-none"
                                        >
                                            <option value="">Seleccionar Lugar...</option>
                                            {SSOMA_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Responsable</label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-3 text-violet-500/50" size={16} />
                                        <select 
                                            value={formData.responsable}
                                            onChange={(e) => setFormData({...formData, responsable: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:border-violet-500 outline-none"
                                        >
                                            <option value="">Seleccionar Responsable...</option>
                                            {USER_LIST.map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2 lg:col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Fecha de Subida</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 text-slate-500" size={16} />
                                        <input 
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:border-violet-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-3 space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                        Archivo del Informe (Arrastra PDFs)
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
                                                        file, 'Informes', `INFORME_${formData.month}`, formData.date, formData.responsable, 'INFORMES', 'SEGURIDAD', formData.zona, 'DOCS'
                                                    );
                                                    setUploadedFiles(prev => [...prev, url]);
                                                }
                                            } catch (err: any) {
                                                alert(`Error al subir: ${err.message}`);
                                            } finally {
                                                setIsUploading(false);
                                            }
                                        }}
                                        className={`relative border-2 border-dashed rounded-3xl p-10 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group ${
                                            isUploading ? 'border-amber-500 bg-amber-500/5' :
                                            isDragging ? 'border-violet-500 bg-violet-500/10' : 
                                            uploadedFiles.length > 0 ? 'border-violet-500/30 bg-violet-500/5' : 'border-slate-800 hover:border-slate-700'
                                        }`}
                                    >
                                        <input 
                                            type="file" multiple disabled={isUploading}
                                            onChange={async (e) => {
                                                const files = Array.from(e.target.files || []);
                                                if (files.length === 0) return;
                                                
                                                setIsUploading(true);
                                                try {
                                                    for (const file of files) {
                                                        const url = await uploadEvidence(
                                                            file, 'Informes', `INFORME_${formData.month}`, formData.date, formData.responsable, 'INFORMES', 'SEGURIDAD', formData.zona, 'DOCS'
                                                        );
                                                        setUploadedFiles(prev => [...prev, url]);
                                                    }
                                                } catch (err: any) {
                                                    alert(`Error al subir: ${err.message}`);
                                                } finally {
                                                    setIsUploading(false);
                                                }
                                            }}
                                            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-wait"
                                        />
                                        <div className={`p-4 rounded-2xl ${isUploading ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 group-hover:text-violet-400'}`}>
                                            {isUploading ? <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={32} />}
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-black uppercase text-white">{isUploading ? 'SUBIENDO...' : 'ARRASTRA O HAZ CLIC AQUÍ'}</p>
                                        </div>
                                    </div>

                                    {/* Preview files */}
                                    {uploadedFiles.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-4">
                                            {uploadedFiles.map((url, idx) => (
                                                <div key={idx} className="bg-slate-950 px-3 py-2 rounded-2xl border border-slate-800 flex items-center gap-3">
                                                    <FileText size={14} className="text-violet-400" />
                                                    <span className="text-[10px] font-bold text-slate-300">Archivo #{idx + 1}</span>
                                                    <button onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))} className="text-slate-600 hover:text-red-400">
                                                        <X size={14} />
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
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-violet-500 outline-none h-20 resize-none mt-2"
                                    />
                                </div>

                                <div className="md:col-span-3 flex justify-end pt-4">
                                    <button 
                                        disabled={isSaving || isUploading}
                                        onClick={handleSave}
                                        className="bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 text-white px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                                    >
                                        {isSaving ? 'Guardando...' : 'Registrar Informe'}
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* List Section */}
                <div className="space-y-6">
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                        <Folder size={18} className="text-violet-500" />
                        Informes Subidos
                    </h2>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {records.length === 0 ? (
                                <div className="col-span-full text-center py-10 text-slate-500 text-xs font-bold uppercase tracking-widest">
                                    No hay informes subidos aún
                                </div>
                            ) : records.map(rec => (
                                <Card key={rec.id} className="bg-slate-950 border-slate-800 hover:border-violet-500/30 transition-all">
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 font-black flex items-center justify-center text-xs">
                                                    <FileText size={16} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white text-sm">INFORME DE {rec.month}</h3>
                                                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                                        <Calendar size={10} /> {rec.date}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button 
                                                    onClick={() => window.open(getDriveViewerUrl(rec.fileUrls && rec.fileUrls[0]), '_blank')}
                                                    className="p-1.5 bg-slate-800 hover:bg-violet-500/20 text-slate-400 hover:text-violet-400 rounded-lg transition-all"
                                                >
                                                    <FileText size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(rec.id)}
                                                    className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mb-2">
                                            <div>
                                                <p className="text-[9px] font-black text-slate-600 uppercase">Responsable</p>
                                                <p className="text-[10px] text-slate-300 truncate">{rec.responsable}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-600 uppercase">Zona</p>
                                                <p className="text-[10px] text-slate-300 truncate">{rec.zona}</p>
                                            </div>
                                        </div>
                                        {rec.description && (
                                            <div className="pt-2 border-t border-slate-800/50">
                                                <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Descripción</p>
                                                <p className="text-[10px] text-slate-400 line-clamp-2">{rec.description}</p>
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
