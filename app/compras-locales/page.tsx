"use client";

import { useState, useEffect } from 'react';
import { useAuth, USER_LIST } from '@/lib/auth';
import { ShoppingCart, Plus, Trash2, Calendar, User, MapPin, Upload, X, Download, DownloadCloud, Edit2 } from 'lucide-react';
import { uploadEvidence } from '@/lib/uploadClient';
import { SSOMA_LOCATIONS } from '@/lib/locations';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getDriveDownloadUrl, generateFilename } from "@/lib/utils";
import { exportTableToPDF, exportRecordToPDF } from '@/lib/pdfExport';
import PreviewCarouselModal from "@/components/PreviewCarouselModal";
import BatchDownloadZip from "@/components/BatchDownloadZip";

export default function ComprasLocalesPage() {
    const { user } = useAuth();
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [isDownloading, setIsDownloading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [viewingFile, setViewingFile] = useState<any>(null);
    
    // Filters
    const [filterDate, setFilterDate] = useState('');
    const [filterZona, setFilterZona] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        date: '',
        responsable: 'Usuario SSOMA',
        zona: SSOMA_LOCATIONS[0],
        description: '',
    });

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            date: new Date().toISOString().split('T')[0],
            responsable: user?.name || 'Usuario SSOMA'
        }));
        fetchData();
    }, [user?.name]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const recRes = await fetch('/api/compras-locales');
            const recData = await recRes.json();
            if (recData.success && Array.isArray(recData.records)) {
                const sorted = recData.records.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setRecords(sorted);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: any) => {
        const fileList = e.target?.files || e.dataTransfer?.files || [];
        const files = Array.from(fileList) as File[];
        if (files.length === 0) return;

        setIsUploading(true);
        setUploadProgress({ current: 0, total: files.length });
        const newUploadedUrls: string[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setUploadProgress({ current: i + 1, total: files.length });
                const url = await uploadEvidence(
                    file, 'ComprasLocales', 'COMPRA', formData.date, formData.responsable, 'COMPRAS', 'ADMINISTRACION', formData.zona, 'DOCS'
                );
                newUploadedUrls.push(url);
            }
            setUploadedFiles(prev => [...prev, ...newUploadedUrls]);
        } catch (error: any) {
            alert(`Error al subir archivo: ${error.message}`);
        } finally {
            setIsUploading(false);
            if (e.target && e.target.type === 'file') e.target.value = '';
        }
    };

    const handleEdit = (rec: any) => {
        setFormData({
            date: rec.date || new Date().toISOString().split('T')[0],
            responsable: rec.responsable || user?.name || 'Usuario SSOMA',
            zona: rec.zona || SSOMA_LOCATIONS[0],
            description: rec.description || ''
        });
        setUploadedFiles(rec.fileUrls || []);
        setEditingId(rec.id);
        setIsAdding(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({
            ...formData,
            description: '',
        });
        setUploadedFiles([]);
    };

    const handleSave = async () => {
        if (!formData.description || uploadedFiles.length === 0) {
            alert('Por favor ingrese una descripción de la compra y cargue el archivo correspondiente.');
            return;
        }

        setIsSaving(true);
        try {
            const newRecord = {
                id: editingId || Date.now(),
                date: formData.date,
                description: formData.description,
                responsable: formData.responsable,
                zona: formData.zona,
                fileUrls: uploadedFiles,
            };

            const action = editingId ? 'UPDATE' : 'CREATE';
            const res = await fetch('/api/compras-locales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, record: newRecord })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                cancelEdit();
                fetchData();
                alert('Registro guardado correctamente.');
            } else {
                alert(data.error || 'Error al guardar el registro.');
            }
        } catch (error: any) {
            console.error('Error saving record:', error);
            alert(`Hubo un error al guardar: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: any) => {
        if (!confirm('¿Estás seguro de eliminar este registro?')) return;
        
        try {
            const res = await fetch('/api/compras-locales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DELETE', id })
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                fetchData();
            } else {
                alert(data.error || 'Error al eliminar el registro.');
            }
        } catch (error: any) {
            console.error('Error deleting record:', error);
            alert(`Hubo un error al eliminar: ${error.message}`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-fuchsia-500/10 rounded-2xl border border-fuchsia-500/20">
                                <ShoppingCart className="text-fuchsia-500" size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter">
                                    Compras Locales
                                </h1>
                                <p className="text-xs text-fuchsia-400 font-bold uppercase tracking-widest">Control de Facturas y Boletas</p>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => isAdding ? cancelEdit() : setIsAdding(true)}
                        className="flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-fuchsia-600/20 active:scale-95"
                    >
                        {isAdding ? <X size={20} /> : <Plus size={20} />}
                        {isAdding ? 'Cancelar' : 'Registrar Compra'}
                    </button>
                </div>

                {/* Form Section */}
                {isAdding && (
                    <Card className="bg-slate-900 border-slate-800 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden rounded-3xl">
                        <CardHeader className={`border-b border-slate-800 ${editingId ? 'bg-amber-500/10' : 'bg-slate-800/30'}`}>
                            <CardTitle className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${editingId ? 'text-amber-500' : 'text-white'}`}>
                                {editingId ? <Edit2 size={18} /> : <Upload size={18} className="text-fuchsia-500" />}
                                {editingId ? 'Editar Registro de Compra' : 'Nuevo Registro de Compra'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Fecha</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 text-slate-500" size={16} />
                                        <input 
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:border-fuchsia-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Responsable</label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-3 text-fuchsia-500/50" size={16} />
                                        <select 
                                            value={formData.responsable}
                                            onChange={(e) => setFormData({...formData, responsable: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:border-fuchsia-500 outline-none"
                                        >
                                            <option value="">Seleccionar Responsable...</option>
                                            {USER_LIST.map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Ubicación / Zona</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-3 top-3 text-fuchsia-500/50" size={16} />
                                        <select 
                                            value={formData.zona}
                                            onChange={(e) => setFormData({...formData, zona: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:border-fuchsia-500 outline-none"
                                        >
                                            <option value="">Seleccionar Lugar...</option>
                                            {SSOMA_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="md:col-span-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Descripción de la Compra</label>
                                    <textarea 
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        placeholder="Ej: Compra de 5 galones de agua San Luis..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-fuchsia-500 outline-none h-20 resize-none mt-2"
                                    />
                                </div>

                                <div className="md:col-span-3 space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                        Comprobante (Arrastra PDFs o Imágenes)
                                    </label>
                                    <div 
                                        onDragOver={(e) => { e.preventDefault(); if (!isUploading) setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setIsDragging(false);
                                            if (!isUploading) {
                                                handleFileUpload({ target: { files: e.dataTransfer.files } } as any);
                                            }
                                        }}
                                        className={`relative border-2 border-dashed rounded-3xl p-10 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group overflow-hidden ${
                                            isUploading ? 'border-amber-500 bg-amber-500/5' :
                                            isDragging ? 'border-fuchsia-500 bg-fuchsia-500/10' : 
                                            uploadedFiles.length > 0 ? 'border-fuchsia-500/30 bg-fuchsia-500/5' : 'border-slate-800 hover:border-slate-700'
                                        }`}
                                    >
                                        <input 
                                            type="file" multiple disabled={isUploading}
                                            onChange={handleFileUpload}
                                            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-wait z-10"
                                        />
                                        <div className={`p-4 rounded-2xl ${isUploading ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 group-hover:text-fuchsia-400'}`}>
                                            {isUploading ? <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={32} />}
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-black uppercase text-white">
                                                {isUploading 
                                                    ? `SUBIENDO... ${uploadProgress.current}/${uploadProgress.total}` 
                                                    : uploadedFiles.length > 0 ? `${uploadedFiles.length} ARCHIVOS LISTOS` : 'ARRASTRA O HAZ CLIC AQUÍ'}
                                            </p>
                                        </div>
                                        {isUploading && uploadProgress.total > 0 && (
                                            <div className="absolute bottom-0 left-0 h-1.5 bg-amber-500 transition-all duration-300 z-0" style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }} />
                                        )}
                                    </div>

                                    {uploadedFiles.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-4">
                                            {uploadedFiles.map((url, idx) => (
                                                <div key={idx} className="bg-slate-950 px-3 py-2 rounded-2xl border border-slate-800 flex items-center gap-3">
                                                    <ShoppingCart size={14} className="text-fuchsia-400" />
                                                    <span className="text-[10px] font-bold text-slate-300">Archivo #{idx + 1}</span>
                                                    <button onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))} className="text-slate-600 hover:text-red-400">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="md:col-span-3 flex justify-end pt-4">
                                    <button 
                                        disabled={isSaving || isUploading}
                                        onClick={handleSave}
                                        className={`${editingId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-fuchsia-600 hover:bg-fuchsia-500'} disabled:bg-slate-800 text-white px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all`}
                                    >
                                        {isSaving ? 'Guardando...' : editingId ? 'Actualizar Compra' : 'Registrar Compra'}
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* List Section */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-4">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                            <ShoppingCart size={18} className="text-fuchsia-500" />
                            Registro de Compras
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className="text-[10px] font-mono text-slate-500 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                                {records.filter(r => (!filterZona || r.zona === filterZona) && (!filterDate || r.date.startsWith(filterDate.substring(0,7)))).length} REGISTROS
                            </div>
                            <button
                                onClick={() => {
                                    const filtered = records.filter(r => (!filterZona || r.zona === filterZona) && (!filterDate || r.date.startsWith(filterDate.substring(0,7))));
                                    setIsDownloading(true);
                                    exportTableToPDF(
                                        'Compras Locales',
                                        [
                                            { header: 'Fecha', dataKey: 'date' },
                                            { header: 'Responsable', dataKey: 'responsable' },
                                            { header: 'Zona', dataKey: 'zona' },
                                            { header: 'Descripción', dataKey: 'description' }
                                        ],
                                        filtered,
                                        `Compras_${new Date().toISOString().split('T')[0]}.pdf`
                                    );
                                    setIsDownloading(false);
                                }}
                                disabled={isDownloading || records.length === 0}
                                className="bg-slate-800 hover:bg-emerald-600 disabled:bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all border border-slate-700"
                            >
                                <DownloadCloud size={14} /> PDF
                            </button>
                            <BatchDownloadZip 
                                records={records.filter(r => (!filterZona || r.zona === filterZona) && (!filterDate || r.date.startsWith(filterDate.substring(0,7))))}
                                getUrls={(r) => r.fileUrls || []}
                                getFilename={(r, i, total) => {
                                    return generateFilename('Compra_Local', r.date, r.responsable, 'pdf', 'compra', r.zona, 'sstma').replace(/\.[^/.]+$/, "") + (total > 1 ? `_parte${i+1}` : "") + '.pdf';
                                }}
                                zipName={`Compras_${filterDate || 'Masivos'}.zip`}
                                className="bg-slate-800 hover:bg-fuchsia-600 disabled:bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all border border-slate-700 h-[33px]"
                            />
                        </div>
                    </div>

                    {/* FILTERS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-slate-800/30 p-4 rounded-2xl border border-slate-800/50 items-end">
                        <div className="space-y-1">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Mes</label>
                                {filterDate && (
                                    <button onClick={() => setFilterDate('')} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                        <X size={10} />
                                    </button>
                                )}
                            </div>
                            <input 
                                type="month"
                                value={filterDate}
                                onChange={e => setFilterDate(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-fuchsia-500 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Zona</label>
                                {filterZona && (
                                    <button onClick={() => setFilterZona('')} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                        <X size={10} />
                                    </button>
                                )}
                            </div>
                            <select 
                                value={filterZona}
                                onChange={e => setFilterZona(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-fuchsia-500 outline-none appearance-none"
                            >
                                <option value="">Todas las zonas...</option>
                                {SSOMA_LOCATIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1 flex flex-col justify-end h-[53px]">
                            <button 
                                onClick={() => { setFilterDate(''); setFilterZona(''); }}
                                className={`w-full h-[33px] rounded-lg text-[10px] font-bold uppercase transition-all border flex items-center justify-center gap-2 active:scale-95 ${
                                    (filterDate || filterZona)
                                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 shadow-lg shadow-red-950/20'
                                    : 'bg-slate-800/50 text-slate-500 border-slate-800 cursor-not-allowed opacity-50'
                                }`}
                                disabled={!(filterDate || filterZona)}
                            >
                                <X size={14} strokeWidth={3} /> Limpiar Filtros
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-10 h-10 border-4 border-fuchsia-500/20 border-t-fuchsia-500 rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {records.filter(r => (!filterZona || r.zona === filterZona) && (!filterDate || r.date.startsWith(filterDate.substring(0,7)))).length === 0 ? (
                                <div className="col-span-full text-center py-10 text-slate-500 text-xs font-bold uppercase tracking-widest">
                                    No hay registros
                                </div>
                            ) : records
                                .filter(r => (!filterZona || r.zona === filterZona) && (!filterDate || r.date.startsWith(filterDate.substring(0,7))))
                                .map(rec => (
                                <Card key={rec.id} className="bg-slate-950 border-slate-800 hover:border-fuchsia-500/30 transition-all">
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-fuchsia-500/10 text-fuchsia-500 font-black flex items-center justify-center text-xs shrink-0">
                                                    <ShoppingCart size={16} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white text-xs leading-tight line-clamp-2">Compra Local</h3>
                                                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                        <Calendar size={10} /> {rec.date}
                                                        <span className="mx-1 opacity-30">|</span>
                                                        <span className="text-fuchsia-400 font-medium">{rec.fileUrls?.length || 0}</span> Archivo(s)
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 shrink-0 ml-2">
                                                <button 
                                                    onClick={() => setViewingFile(rec)}
                                                    className="p-1.5 bg-slate-800 hover:bg-fuchsia-500/20 text-slate-400 hover:text-fuchsia-400 rounded-lg transition-all"
                                                    title="Ver"
                                                >
                                                    <ShoppingCart size={14} />
                                                </button>
                                                <a 
                                                    href={getDriveDownloadUrl(rec.fileUrls && rec.fileUrls[0])}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-1.5 bg-slate-800 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-lg transition-all flex items-center justify-center"
                                                    title="Descargar"
                                                >
                                                    <Download size={14} />
                                                </a>
                                                <button 
                                                    onClick={() => handleEdit(rec)}
                                                    className="p-1.5 bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 rounded-lg transition-all flex items-center justify-center"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        exportRecordToPDF('Compra Local', rec, `Compra_${rec.date}.pdf`);
                                                    }}
                                                    className="p-1.5 bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-lg transition-all flex items-center justify-center"
                                                    title="Descargar Fila PDF"
                                                >
                                                    <DownloadCloud size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(rec.id)}
                                                    className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-all"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mb-2 pt-2 border-t border-slate-800/50">
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
                                        {rec.fileUrls && rec.fileUrls.length > 0 && (
                                            <div className="pt-2 mt-2 border-t border-slate-800/50 flex flex-col gap-1">
                                                <div className="flex flex-wrap gap-1">
                                                    {rec.fileUrls.map((url: string, idx: number) => (
                                                        <button 
                                                            key={idx} 
                                                            onClick={() => {
                                                                setViewingFile(rec);
                                                            }}
                                                            className="text-[9px] font-bold text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1 bg-slate-900/80 border border-slate-800 px-2 py-1 rounded-md transition-all hover:border-fuchsia-500/50"
                                                        >
                                                            <ShoppingCart size={10} className="shrink-0" />
                                                            <span>Comprobante {rec.fileUrls.length > 1 ? idx + 1 : ''}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

            {viewingFile && (
                <PreviewCarouselModal
                    urls={viewingFile.fileUrls || []}
                    onClose={() => setViewingFile(null)}
                    canEdit={user?.role === 'developer' || user?.role === 'manager' || user?.name === viewingFile.responsable}
                    onEdit={() => handleEdit(viewingFile)}
                    filename={generateFilename('Compra', viewingFile.date, viewingFile.responsable, 'pdf', 'comprobante', viewingFile.zona, 'sstma')}
                />
            )}
            </div>
        </div>
    );
}
