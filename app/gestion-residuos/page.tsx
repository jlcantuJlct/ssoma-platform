"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { FileText, Plus, Trash2, Calendar, MapPin, Upload, X, Archive, ArrowDownCircle, Download, DownloadCloud } from 'lucide-react';
import { SSOMA_LOCATIONS } from '@/lib/locations';
import { Card } from "@/components/ui/card";
import { getDriveViewerUrl, getDriveDownloadUrl, handleBulkDownload } from "@/lib/utils";
import { uploadEvidence } from '@/lib/uploadClient';
import { exportTableToPDF, exportRecordToPDF } from '@/lib/pdfExport';

const CERTIFICATE_TYPES = [
    "Certificados de Baños Portátiles",
    "Certificados de Disposición Final",
    "Guías de Remisión",
    "Certificados de Residuos Comunes"
];

export default function GestionResiduosPage() {
    const { user } = useAuth();
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadMsg, setDownloadMsg] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    
    // Filters
    const [filterDocType, setFilterDocType] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterLocation, setFilterLocation] = useState('');

    // Form state
    const [selectedZones, setSelectedZones] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        date: '',
        documentType: '',
        responsable: 'Usuario SSOMA',
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
            const recRes = await fetch('/api/residuos-certificados');
            const recData = await recRes.json();
            if (recData.success && Array.isArray(recData.records)) {
                // Map legacy 'certType' to 'documentType' for compatibility if needed
                const normalized = recData.records.map((r: any) => ({
                    ...r,
                    documentType: r.certType || r.documentType || 'Desconocido'
                }));
                setRecords(normalized);
            }
        } catch (error) {
            console.error('Error fetching records:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.documentType || uploadedFiles.length === 0) {
            alert('Por favor seleccione el tipo de documento y cargue el archivo correspondiente.');
            return;
        }

        setIsSaving(true);
        try {
            const newRecord = {
                id: Date.now(),
                date: formData.date,
                documentType: formData.documentType,
                certType: formData.documentType, // Keep legacy certType field sync
                description: formData.description,
                responsable: formData.responsable,
                zona: selectedZones.join(', '),
                fileUrls: uploadedFiles,
            };

            const allRecords = [...records, newRecord];
            
            const res = await fetch('/api/residuos-certificados', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: allRecords })
            });

            if (res.ok) {
                setIsAdding(false);
                setFormData({
                    ...formData,
                    documentType: '',
                    description: '',
                });
                setSelectedZones([]);
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
        if (!confirm('¿Está seguro de eliminar este documento? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const updatedRecords = records.filter(r => r.id !== id);
            const res = await fetch('/api/residuos-certificados', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: updatedRecords })
            });

            if (res.ok) {
                setRecords(updatedRecords);
            }
        } catch (error) {
            console.error('Error deleting record:', error);
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
                    file,
                    'Certificados_Residuos',
                    formData.documentType.replace(/[^A-Za-z0-9]/g, '_') || 'DOC',
                    formData.date,
                    formData.responsable,
                    'RESIDUOS',
                    'MEDIO_AMBIENTE',
                    selectedZones.join(', '),
                    'Gestión de Residuos'
                );
                newUploadedUrls.push(url);
            }
            setUploadedFiles(prev => [...prev, ...newUploadedUrls]);
        } catch (error: any) {
            alert(`Error al subir archivo: ${error.message}`);
        } finally {
            setIsUploading(false);
            if (e.target) if (e.target && e.target.type === 'file') e.target.value = '';
        }
    };

    const removeFile = (indexToRemove: number) => {
        setUploadedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-[1400px] mx-auto space-y-6">
                    
                    {/* Header Premium Glassmorphism */}
                    <div className="bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[120px] rounded-full -mr-32 -mt-32"></div>
                        
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-900/40">
                                    <Archive className="text-white" size={32} />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-white uppercase tracking-tight">Gestión de Residuos</h1>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Control de Certificados y Guías de Remisión</p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => setIsAdding(!isAdding)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center gap-2"
                            >
                                {isAdding ? <X size={20} /> : <Plus size={20} />}
                                {isAdding ? 'Cerrar Panel' : 'Subir Documento'}
                            </button>
                        </div>
                    </div>

                    {/* Add Document Panel */}
                    {isAdding && (
                        <Card className="bg-slate-900/80 border-slate-800 rounded-3xl p-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
                            <h3 className="text-emerald-400 font-black uppercase text-sm tracking-widest mb-6 flex items-center gap-2">
                                <ArrowDownCircle size={18} /> Registrar Nuevo Documento
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Fecha Emisión</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 text-slate-500" size={16} />
                                        <input 
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:border-emerald-500 outline-none"
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Tipo de Documento</label>
                                    <select 
                                        value={formData.documentType}
                                        onChange={(e) => setFormData({...formData, documentType: e.target.value})}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white focus:border-emerald-500 outline-none appearance-none"
                                    >
                                        <option value="">Seleccionar tipo...</option>
                                        {CERTIFICATE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1 md:col-span-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Zonas / Proyectos (Selección Múltiple)</label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {SSOMA_LOCATIONS.map(l => (
                                            <button
                                                key={l}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedZones(prev => 
                                                        prev.includes(l) ? prev.filter(z => z !== l) : [...prev, l]
                                                    );
                                                }}
                                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors ${
                                                    selectedZones.includes(l) ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600'
                                                }`}
                                            >
                                                {l}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1 md:col-span-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Subir Archivos (PDF)</label>
                                    <div 
                                        onDragOver={(e) => { e.preventDefault(); if (!isUploading) setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e as any); }}
                                        className={`relative border-2 border-dashed rounded-xl p-4 transition-all flex items-center justify-center gap-3 cursor-pointer group ${
                                            isUploading ? 'border-amber-500 bg-amber-500/5' :
                                            isDragging ? 'border-emerald-500 bg-emerald-500/10' : 
                                            uploadedFiles.length > 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 hover:border-slate-700'
                                        }`}
                                    >
                                        <input 
                                            type="file" multiple disabled={isUploading}
                                            onChange={handleFileUpload}
                                            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-wait"
                                        />
                                        <div className={`p-2 rounded-lg ${isUploading ? 'bg-amber-500 animate-pulse' : 'bg-slate-800 group-hover:bg-emerald-900/50'}`}>
                                            {isUploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={20} className="text-slate-400 group-hover:text-emerald-400" />}
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <p className="text-xs font-black uppercase text-slate-400 group-hover:text-white">
                                                {isUploading ? `Subiendo... ${uploadProgress.current}/${uploadProgress.total}` : uploadedFiles.length > 0 ? `${uploadedFiles.length} ARCHIVOS LISTOS` : 'Arrastra o haz clic aquí'}
                                            </p>
                                        </div>
                                        {isUploading && uploadProgress.total > 0 && (
                                            <div className="absolute bottom-0 left-0 h-1 bg-amber-500 transition-all duration-300" style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }} />
                                        )}
                                    </div>
                                    
                                    {uploadedFiles.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {uploadedFiles.map((url, idx) => (
                                                <div key={idx} className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
                                                    <FileText size={12} className="text-emerald-400" />
                                                    <span className="text-[10px] font-bold text-slate-300">Archivo {idx + 1}</span>
                                                    <button onClick={() => removeFile(idx)} className="text-slate-600 hover:text-red-400">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="md:col-span-3 flex justify-end pt-2">
                                    <button 
                                        disabled={isSaving || isUploading}
                                        onClick={handleSave}
                                        className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                                    >
                                        {isSaving ? 'Guardando...' : 'Registrar Documento'}
                                    </button>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* List Section */}
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-4">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                                <FileText size={18} className="text-emerald-500" />
                                Registro Documental
                            </h2>
                            <div className="flex items-center gap-2">
                                <div className="text-[10px] font-mono text-slate-500 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                                    {records.filter(r => (!filterDocType || r.documentType === filterDocType) && (!filterDate || r.date === filterDate) && (!filterLocation || r.zona === filterLocation)).length} REGISTROS
                                </div>
                                <button
                                    onClick={() => {
                                        const filtered = records.filter(r => (!filterDocType || r.documentType === filterDocType) && (!filterDate || r.date === filterDate) && (!filterLocation || r.zona?.includes(filterLocation)));
                                        setIsDownloading(true);
                                        exportTableToPDF(
                                            'Gestión de Residuos',
                                            [
                                                { header: 'Fecha', dataKey: 'date' },
                                                { header: 'Documento', dataKey: 'documentType' },
                                                { header: 'Zona / Proyecto', dataKey: 'zona' },
                                            ],
                                            filtered,
                                            `Gestion_Residuos_${new Date().toISOString().split('T')[0]}.pdf`
                                        );
                                        setIsDownloading(false);
                                    }}
                                    disabled={isDownloading || records.filter(r => (!filterDocType || r.documentType === filterDocType) && (!filterDate || r.date === filterDate) && (!filterLocation || r.zona?.includes(filterLocation))).length === 0}
                                    className="bg-slate-800 hover:bg-emerald-600 disabled:bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all border border-slate-700"
                                >
                                    <DownloadCloud size={14} /> PDF
                                </button>
                                <button
                                    onClick={() => {
                                        const filtered = records.filter(r => (!filterDocType || r.documentType === filterDocType) && (!filterDate || r.date === filterDate) && (!filterLocation || r.zona?.includes(filterLocation)));
                                        setIsDownloading(true);
                                        handleBulkDownload(filtered, 'Gestion_Residuos.zip', setDownloadMsg).finally(() => setIsDownloading(false));
                                    }}
                                    disabled={isDownloading || records.filter(r => (!filterDocType || r.documentType === filterDocType) && (!filterDate || r.date === filterDate) && (!filterLocation || r.zona?.includes(filterLocation))).length === 0}
                                    className="bg-slate-800 hover:bg-emerald-600 disabled:bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all border border-slate-700"
                                >
                                    {isDownloading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <DownloadCloud size={14} />}
                                    {isDownloading ? (downloadMsg || 'Comprimiendo...') : 'Descargar Visibles'}
                                </button>
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
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-emerald-500 outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Tipo</label>
                                    {filterDocType && (
                                        <button onClick={() => setFilterDocType('')} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                            <X size={10} />
                                        </button>
                                    )}
                                </div>
                                <select 
                                    value={filterDocType}
                                    onChange={e => setFilterDocType(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-emerald-500 outline-none appearance-none"
                                >
                                    <option value="">Todos los tipos...</option>
                                    {CERTIFICATE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
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
                                <select 
                                    value={filterLocation}
                                    onChange={e => setFilterLocation(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-emerald-500 outline-none appearance-none"
                                >
                                    <option value="">Todos los lugares...</option>
                                    {SSOMA_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1 flex flex-col justify-end h-[53px]">
                                <button 
                                    onClick={() => { setFilterDate(''); setFilterDocType(''); setFilterLocation(''); }}
                                    className={`w-full h-[33px] rounded-lg text-[10px] font-bold uppercase transition-all border flex items-center justify-center gap-2 active:scale-95 ${
                                        (filterDate || filterDocType || filterLocation)
                                        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 shadow-lg shadow-red-950/20'
                                        : 'bg-slate-800/50 text-slate-500 border-slate-800 cursor-not-allowed opacity-50'
                                    }`}
                                    disabled={!(filterDate || filterDocType || filterLocation)}
                                >
                                    <X size={14} strokeWidth={3} /> Limpiar
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {records.filter(r => (!filterDocType || r.documentType === filterDocType) && (!filterDate || r.date === filterDate) && (!filterLocation || r.zona?.includes(filterLocation))).length === 0 ? (
                                    <div className="col-span-full text-center py-10 text-slate-500 text-xs font-bold uppercase tracking-widest">
                                        No hay documentos registrados
                                    </div>
                                ) : records
                                    .filter(r => (!filterDocType || r.documentType === filterDocType) && (!filterDate || r.date === filterDate) && (!filterLocation || r.zona?.includes(filterLocation)))
                                    .map(rec => (
                                    <Card key={rec.id} className="bg-slate-950 border-slate-800 hover:border-emerald-500/30 transition-all">
                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 font-black flex items-center justify-center text-xs shrink-0">
                                                        <FileText size={16} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-white text-xs leading-tight line-clamp-2" title={rec.documentType}>{rec.documentType}</h3>
                                                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                            <Calendar size={10} /> {rec.date}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 shrink-0 ml-2">
                                                    <button 
                                                        onClick={() => window.open(getDriveViewerUrl(rec.fileUrls && rec.fileUrls[0]), '_blank')}
                                                        className="p-1.5 bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-lg transition-all"
                                                        title="Ver Documento"
                                                    >
                                                        <FileText size={14} />
                                                    </button>
                                                    <a 
                                                        href={getDriveDownloadUrl(rec.fileUrls && rec.fileUrls[0])}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-1.5 bg-slate-800 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-lg transition-all flex items-center justify-center"
                                                        title="Descargar ZIP"
                                                    >
                                                        <Download size={14} />
                                                    </a>
                                                    <button 
                                                        onClick={() => exportRecordToPDF('Gestión de Residuos', rec, `Gestion_Residuos_${rec.date}.pdf`)}
                                                        className="p-1.5 bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-lg transition-all flex items-center justify-center"
                                                        title="Descargar PDF"
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
                                            <div className="pt-2 border-t border-slate-800/50">
                                                <p className="text-[9px] font-black text-slate-600 uppercase">Zona / Proyecto</p>
                                                <p className="text-[10px] text-slate-300 truncate">{rec.zona}</p>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
