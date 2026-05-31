"use client";

import { useState, useEffect } from 'react';
import { useAuth, USER_LIST } from '@/lib/auth';
import { FileText, Plus, Trash2, Calendar, User, MapPin, Upload, Folder, X, ShieldCheck, Download, DownloadCloud, Edit2 } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import { uploadEvidence } from '@/lib/uploadClient';
import { SSOMA_LOCATIONS } from '@/lib/locations';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getDriveViewerUrl, getDriveDownloadUrl, handleBulkDownload, generateFilename } from "@/lib/utils";
import { exportTableToPDF, exportRecordToPDF } from '@/lib/pdfExport';
import PreviewCarouselModal from "@/components/PreviewCarouselModal";
import BatchDownloadZip from "@/components/BatchDownloadZip";

const DOCUMENT_TYPES = [
    "4.1. PLAN DE SST",
    "4.2. PROGRAMA DE SST",
    "4.3. PLAN DE CONTINGENCIA",
    "4.4. IPERC",
    "4.5. IDENTIFICACION DE ASPECTOS AMBIENTALES",
    "4.6. MAPA DE RIESGOS",
    "4.7. PETS",
    "4.8. PROGRAMA DE CAPACITACION",
    "4.9. FLUJOGRAMA DE COMUNICACIÓN Y ATENCIÓN"
];

export default function SSTMADocsPage() {
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
    const [downloadMsg, setDownloadMsg] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [viewingFile, setViewingFile] = useState<any>(null);
    
    // Filters
    const [filterDocType, setFilterDocType] = useState('');
    const [filterDate, setFilterDate] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        date: '',
        documentType: '',
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
            const recRes = await fetch('/api/sstma-docs-records');
            const recData = await recRes.json();
            if (recData.success && Array.isArray(recData.records)) {
                const sorted = recData.records.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setRecords(sorted);
            }
        } catch (error) {
            console.error('Error fetching SSTMA Docs data:', error);
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
                    file, 'DocsGestión', formData.documentType || 'DOC_SSTMA', formData.date, formData.responsable, 'SSTMA_DOCS', 'SEGURIDAD', formData.zona, 'DOCS'
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
            documentType: rec.documentType || '',
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
            documentType: '',
            description: '',
        });
        setUploadedFiles([]);
    };

    const handleSave = async () => {
        if (!formData.documentType || uploadedFiles.length === 0) {
            alert('Por favor seleccione el tipo de documento y cargue el archivo correspondiente.');
            return;
        }

        setIsSaving(true);
        try {
            const newRecord = {
                id: editingId || Date.now(),
                date: formData.date,
                documentType: formData.documentType,
                description: formData.description,
                responsable: formData.responsable,
                zona: formData.zona,
                fileUrls: uploadedFiles,
            };

            const action = editingId ? 'UPDATE' : 'CREATE';
            const res = await fetch('/api/sstma-docs-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, record: newRecord })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                if (action === 'CREATE' && data.id) {
                    newRecord.id = data.id;
                }
                setIsAdding(false);
                setEditingId(null);
                setFormData({
                    ...formData,
                    documentType: '',
                    description: '',
                });
                setUploadedFiles([]);
                fetchData();
                alert('Documento registrado correctamente.');
            } else {
                alert(data.error || 'Error al guardar el documento.');
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
            const res = await fetch('/api/sstma-docs-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DELETE', id })
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                fetchData();
            } else {
                alert(data.error || 'Error al eliminar el documento.');
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
                            <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
                                <ShieldCheck className="text-cyan-500" size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter">
                                    Documentos de Gestión SSTMA
                                </h1>
                                <p className="text-xs text-cyan-400 font-bold uppercase tracking-widest">Control Central Documentario</p>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => isAdding ? cancelEdit() : setIsAdding(true)}
                        className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-cyan-600/20 active:scale-95"
                    >
                        {isAdding ? <X size={20} /> : <Plus size={20} />}
                        {isAdding ? 'Cancelar' : 'Cargar Documento'}
                    </button>
                </div>

                {/* Form Section */}
                {isAdding && (
                    <Card className="bg-slate-900 border-slate-800 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden rounded-3xl">
                        <CardHeader className="border-b border-slate-800 bg-slate-800/30">
                            <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Upload size={18} className="text-cyan-500" />
                                Nueva Carga de Documento Oficial
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Fecha de Aprobación/Carga</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 text-slate-500" size={16} />
                                        <input 
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:border-cyan-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 lg:col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Tipo de Documento</label>
                                    <SearchableSelect 
                                        options={DOCUMENT_TYPES}
                                        value={formData.documentType}
                                        onChange={(val) => setFormData({...formData, documentType: val})}
                                        placeholder="Seleccione el tipo de documento..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Responsable</label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-3 text-cyan-500/50" size={16} />
                                        <select 
                                            value={formData.responsable}
                                            onChange={(e) => setFormData({...formData, responsable: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:border-cyan-500 outline-none"
                                        >
                                            <option value="">Seleccionar Responsable...</option>
                                            {USER_LIST.map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2 lg:col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Ubicación / Proyecto</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-3 top-3 text-cyan-500/50" size={16} />
                                        <select 
                                            value={formData.zona}
                                            onChange={(e) => setFormData({...formData, zona: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:border-cyan-500 outline-none"
                                        >
                                            <option value="">Seleccionar Lugar...</option>
                                            {SSOMA_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="md:col-span-3 space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                        Archivo del Documento (Arrastra PDFs)
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
                                            isDragging ? 'border-cyan-500 bg-cyan-500/10' : 
                                            uploadedFiles.length > 0 ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-slate-800 hover:border-slate-700'
                                        }`}
                                    >
                                        <input 
                                            type="file" multiple disabled={isUploading}
                                            onChange={handleFileUpload}
                                            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-wait z-10"
                                        />
                                        <div className={`p-4 rounded-2xl ${isUploading ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 group-hover:text-cyan-400'}`}>
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

                                    {/* Preview files */}
                                    {uploadedFiles.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-4">
                                            {uploadedFiles.map((url, idx) => (
                                                <div key={idx} className="bg-slate-950 px-3 py-2 rounded-2xl border border-slate-800 flex items-center gap-3">
                                                    <FileText size={14} className="text-cyan-400" />
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
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-cyan-500 outline-none h-20 resize-none mt-2"
                                    />
                                </div>

                                <div className="md:col-span-3 flex justify-end pt-4">
                                    <button 
                                        disabled={isSaving || isUploading}
                                        onClick={handleSave}
                                        className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                                    >
                                        {isSaving ? 'Guardando...' : editingId ? 'Actualizar Documento' : 'Registrar Documento'}
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
                            <Folder size={18} className="text-cyan-500" />
                            Control Central Documentario
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className="text-[10px] font-mono text-slate-500 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                                {records.filter(r => (!filterDocType || r.documentType === filterDocType) && (!filterDate || r.date === filterDate)).length} REGISTROS
                            </div>
                            <button
                                onClick={() => {
                                    const filtered = records.filter(r => (!filterDocType || r.documentType === filterDocType) && (!filterDate || r.date === filterDate));
                                    setIsDownloading(true);
                                    exportTableToPDF(
                                        'Documentos de Gestión SSTMA',
                                        [
                                            { header: 'Fecha', dataKey: 'date' },
                                            { header: 'Documento', dataKey: 'documentType' },
                                            { header: 'Responsable', dataKey: 'responsable' },
                                            { header: 'Zona', dataKey: 'zona' },
                                            { header: 'Descripción', dataKey: 'description' }
                                        ],
                                        filtered,
                                        `SSTMA_Docs_${new Date().toISOString().split('T')[0]}.pdf`
                                    );
                                    setIsDownloading(false);
                                }}
                                disabled={isDownloading || records.filter(r => (!filterDocType || r.documentType === filterDocType) && (!filterDate || r.date === filterDate)).length === 0}
                                className="bg-slate-800 hover:bg-emerald-600 disabled:bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all border border-slate-700"
                            >
                                <DownloadCloud size={14} /> PDF
                            </button>
                            <BatchDownloadZip 
                                records={records.filter(r => (!filterDocType || r.documentType === filterDocType) && (!filterDate || r.date === filterDate))}
                                getUrls={(r) => r.fileUrls || []}
                                getFilename={(r, i, total) => {
                                    return generateFilename(r.documentType, r.date, r.responsable, 'pdf', 'documento', r.zona, 'sstma').replace(/\.[^/.]+$/, "") + (total > 1 ? `_parte${i+1}` : "") + '.pdf';
                                }}
                                zipName={`Docs_SSTMA_${filterDate || 'Masivos'}.zip`}
                                className="bg-slate-800 hover:bg-cyan-600 disabled:bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all border border-slate-700 h-[33px]"
                            />
                        </div>
                    </div>

                    {/* FILTERS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-slate-800/30 p-4 rounded-2xl border border-slate-800/50 items-end">
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
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-cyan-500 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Documento</label>
                                {filterDocType && (
                                    <button onClick={() => setFilterDocType('')} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                        <X size={10} />
                                    </button>
                                )}
                            </div>
                            <select 
                                value={filterDocType}
                                onChange={e => setFilterDocType(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-cyan-500 outline-none appearance-none"
                            >
                                <option value="">Todos los documentos...</option>
                                {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1 flex flex-col justify-end h-[53px]">
                            <button 
                                onClick={() => { setFilterDate(''); setFilterDocType(''); }}
                                className={`w-full h-[33px] rounded-lg text-[10px] font-bold uppercase transition-all border flex items-center justify-center gap-2 active:scale-95 ${
                                    (filterDate || filterDocType)
                                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 shadow-lg shadow-red-950/20'
                                    : 'bg-slate-800/50 text-slate-500 border-slate-800 cursor-not-allowed opacity-50'
                                }`}
                                disabled={!(filterDate || filterDocType)}
                            >
                                <X size={14} strokeWidth={3} /> Limpiar Filtros
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {records.filter(r => (!filterDocType || r.documentType === filterDocType) && (!filterDate || r.date === filterDate)).length === 0 ? (
                                <div className="col-span-full text-center py-10 text-slate-500 text-xs font-bold uppercase tracking-widest">
                                    No hay documentos registrados
                                </div>
                            ) : records
                                .filter(r => (!filterDocType || r.documentType === filterDocType) && (!filterDate || r.date === filterDate))
                                .map(rec => (
                                <Card key={rec.id} className="bg-slate-950 border-slate-800 hover:border-cyan-500/30 transition-all">
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-500 font-black flex items-center justify-center text-xs shrink-0">
                                                    <FileText size={16} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white text-xs leading-tight line-clamp-2" title={rec.documentType}>{rec.documentType}</h3>
                                                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                        <Calendar size={10} /> {rec.date}
                                                        <span className="mx-1 opacity-30">|</span>
                                                        <FileText size={10} className="text-cyan-500/70" /> 
                                                        <span className="text-cyan-400 font-medium">{rec.fileUrls?.length || 0}</span> Archivo(s)
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 shrink-0 ml-2">
                                                <button 
                                                    onClick={() => setViewingFile(rec)}
                                                    className="p-1.5 bg-slate-800 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 rounded-lg transition-all"
                                                    title="Ver Documento"
                                                >
                                                    <FileText size={14} />
                                                </button>
                                                <a 
                                                    href={getDriveDownloadUrl(rec.fileUrls && rec.fileUrls[0])}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-1.5 bg-slate-800 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-lg transition-all flex items-center justify-center"
                                                    title="Descargar Documento"
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
                                                        exportRecordToPDF('Documento SSTMA', rec, `Doc_${rec.date}_${rec.documentType}.pdf`);
                                                    }}
                                                    className="p-1.5 bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-lg transition-all flex items-center justify-center"
                                                    title="Descargar Fila en PDF"
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
                                                <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Archivos Adjuntos</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {rec.fileUrls.map((url: string, idx: number) => (
                                                        <button 
                                                            key={idx} 
                                                            onClick={() => {
                                                                setViewingFile(rec);
                                                            }}
                                                            className="text-[9px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-slate-900/80 border border-slate-800 px-2 py-1 rounded-md transition-all hover:border-cyan-500/50"
                                                        >
                                                            <FileText size={10} className="shrink-0" />
                                                            <span className="truncate max-w-[150px]">{rec.documentType || 'Documento'} {rec.fileUrls.length > 1 ? idx + 1 : ''}</span>
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
                    filename={generateFilename(viewingFile.documentType, viewingFile.date, viewingFile.responsable, 'pdf', 'documento', viewingFile.zona, 'sstma')}
                />
            )}
            </div>
        </div>
    );
}
