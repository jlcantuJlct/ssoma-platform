"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Upload, Trash2, DownloadCloud, CheckCircle2, Leaf, Calendar, MapPin, Search, Edit2, X } from 'lucide-react';
import { uploadEvidence } from '@/lib/uploadClient';
import { getInitials } from '@/lib/utils';

import { exportRecordToPDF } from '@/lib/pdfExport';

type AuthRecord = {
    id: number;
    date: string;
    authType: string;
    location: string;
    files: string[];
};

const AUTH_TYPES = [
    "Autorización de canteras",
    "DME Depósito de material excedente",
    "Fuentes de agua",
    "Acopios",
    "ZI Zona industrial"
];

export default function AutorizacionesAuxiliaresPage() {
    const { user } = useAuth();
    const [records, setRecords] = useState<AuthRecord[]>([]);
    const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], authType: '', location: '' });
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [existingFiles, setExistingFiles] = useState<string[]>([]);
    
    // Filtros
    const [filterDate, setFilterDate] = useState("");
    const [filterType, setFilterType] = useState("");
    const [filterLocation, setFilterLocation] = useState("");

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                const res = await fetch('/api/auxiliar-auths');
                const data = await res.json();
                if (data.success) {
                    setRecords(data.records);
                }
            } catch (e) {
                console.error("Error fetching records", e);
            } finally {
                setIsLoaded(true);
            }
        };
        fetchRecords();
    }, []);

    const handleFileUpload = async (e: any) => {
        const inputFiles = (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) ? e.dataTransfer.files : e.target?.files;
        if (!inputFiles || inputFiles.length === 0) return;

        if (inputFiles.length + files.length > 3) {
            alert("Máximo 3 archivos permitidos.");
            return;
        }

        const validFiles: File[] = [];
        for (let i = 0; i < inputFiles.length; i++) {
            const f = inputFiles[i];
            if (f.type === 'application/pdf' || f.type.startsWith('image/')) {
                validFiles.push(f);
            } else {
                alert(`El archivo ${f.name} no es PDF ni Imagen.`);
            }
        }
        setFiles(prev => [...prev, ...validFiles]);
        setIsDragging(false);
        if (e.target) e.target.value = '';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingFile = (index: number) => {
        setExistingFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleEdit = (rec: AuthRecord) => {
        setEditingId(rec.id);
        setForm({
            date: rec.date,
            authType: rec.authType,
            location: rec.location
        });
        setExistingFiles(rec.files || []);
        setFiles([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm({ date: new Date().toISOString().split('T')[0], authType: '', location: '' });
        setFiles([]);
        setExistingFiles([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.authType) return alert("Seleccione el tipo de autorización.");
        if (files.length === 0 && existingFiles.length === 0) return alert("Debe adjuntar al menos un archivo.");

        try {
            setIsUploading(true);
            setUploadProgress(10);
            
            // Simular barra de progreso
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => prev >= 90 ? 90 : prev + 10);
            }, 500);
            
            // Subir archivos a Storage
            const uploadedUrls = [];
            for (let i = 0; i < files.length; i++) {
                const url = await uploadEvidence(
                    files[i],
                    'Medio Ambiente',
                    `AUTH_${form.authType.replace(/\s+/g, '_')}`,
                    form.date,
                    user?.name || 'Admin',
                    'auth',
                    'medio_ambiente',
                    form.location,
                    'Autorizaciones de Áreas Auxiliares'
                );
                uploadedUrls.push(url);
            }

            clearInterval(progressInterval);
            setUploadProgress(100);

            const newRecordData = { ...form, files: [...existingFiles, ...uploadedUrls] };
            
            const res = await fetch('/api/auxiliar-auths', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: editingId ? 'update' : 'create',
                    id: editingId,
                    data: newRecordData,
                    userName: user?.name
                })
            });
            const result = await res.json();

            if (result.success) {
                if (editingId) {
                    setRecords(prev => prev.map(r => r.id === editingId ? { ...r, ...newRecordData } : r));
                    alert("Autorización actualizada correctamente.");
                } else {
                    const newRecord: AuthRecord = { id: result.id, ...newRecordData };
                    setRecords(prev => [newRecord, ...prev]);
                    alert("Autorización guardada correctamente.");
                }
                cancelEdit();
            } else {
                alert("Error al guardar: " + result.error);
            }
        } catch (error: any) {
            alert("Error de conexión: " + error.message);
        } finally {
            setIsUploading(false);
            setTimeout(() => setUploadProgress(0), 1000);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("¿Eliminar este registro de forma permanente?")) {
            try {
                const res = await fetch('/api/auxiliar-auths', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'delete', id, userName: user?.name })
                });
                const result = await res.json();
                if (result.success) {
                    setRecords(prev => prev.filter(r => r.id !== id));
                }
            } catch (e) {
                alert("Error de red");
            }
        }
    };

    const filteredRecords = records.filter(r => {
        return (!filterDate || r.date === filterDate) &&
               (!filterType || r.authType === filterType) &&
               (!filterLocation || r.location.toLowerCase().includes(filterLocation.toLowerCase()));
    });

    if (!isLoaded) {
        return <div className="flex h-screen items-center justify-center bg-slate-950 text-emerald-400">Cargando autorizaciones...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-300 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-6 mx-6 mt-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter mb-2 flex items-center gap-3">
                        <Leaf className="text-emerald-500" size={32} />
                        Autorizaciones de Áreas Auxiliares
                    </h1>
                    <p className="text-slate-400 font-medium tracking-wide">
                        Gestión Medio Ambiental y OSITRAN (Anexo 3)
                    </p>
                </div>
            </header>
            
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                
                {/* FORMULARIO DE CARGA */}
                <div className="bg-slate-900 border border-emerald-500/20 rounded-xl overflow-hidden shadow-lg">
                    <div className="p-4 bg-slate-800/50 border-b border-slate-700/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {editingId ? <Edit2 className="text-amber-400" size={20} /> : <Upload className="text-emerald-400" size={20} />}
                            <h2 className="text-lg font-bold text-slate-100">{editingId ? 'Editar Autorización' : 'Registrar Nueva Autorización'}</h2>
                        </div>
                        {editingId && (
                            <button onClick={cancelEdit} className="text-sm flex items-center gap-1 text-slate-400 hover:text-red-400 transition-colors">
                                <X size={16} /> Cancelar Edición
                            </button>
                        )}
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Fecha</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 text-slate-500" size={16} />
                                    <input 
                                        type="date" 
                                        required
                                        value={form.date}
                                        onChange={e => setForm({...form, date: e.target.value})}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Tipo de Autorización</label>
                                <select
                                    required
                                    value={form.authType}
                                    onChange={e => setForm({...form, authType: e.target.value})}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="">Seleccione un tipo...</option>
                                    {AUTH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Lugar / Frente de Trabajo</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 text-slate-500" size={16} />
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="Ej: Km 15"
                                        value={form.location}
                                        onChange={e => setForm({...form, location: e.target.value})}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 mb-6">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Documento Adjunto (PDF o Imagen)</label>
                            
                            <div 
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer group
                                    ${isDragging 
                                        ? 'border-emerald-400 bg-emerald-500/10 scale-[1.02]' 
                                        : 'border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/30'
                                    }
                                `}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => { handleDragLeave(e); handleFileUpload(e); }}
                                onClick={() => document.getElementById('authFile')?.click()}
                            >
                                <input type="file" id="authFile" className="hidden" accept=".pdf,image/*" multiple onChange={handleFileUpload} />
                                <Upload className={`mx-auto mb-3 transition-colors ${isDragging ? 'text-emerald-400 scale-110' : 'text-slate-500 group-hover:text-emerald-400'}`} size={32} />
                                
                                {isDragging ? (
                                    <p className="text-lg font-bold text-emerald-400">¡Suelta los archivos aquí!</p>
                                ) : (
                                    <>
                                        <p className="text-sm font-medium text-slate-300">Arrastra archivos aquí o haz clic para subir</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Soporta PDF, JPG, PNG <span className="font-bold text-emerald-500/70">({files.length} / 3 archivos seleccionados)</span>
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Barra de progreso de subida */}
                            {isUploading && (
                                <div className="w-full bg-slate-800 rounded-full h-2 mt-4 overflow-hidden border border-slate-700">
                                    <div 
                                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300 relative"
                                        style={{ width: `${uploadProgress}%` }}
                                    >
                                        <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_25%,rgba(255,255,255,0.2)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.2)_75%,rgba(255,255,255,0.2)_100%)] bg-[length:1rem_1rem] animate-[stripes_1s_linear_infinite]" />
                                    </div>
                                    <p className="text-center text-[10px] text-emerald-400 mt-1 uppercase tracking-wider font-bold">Subiendo... {uploadProgress}%</p>
                                </div>
                            )}

                            {existingFiles.length > 0 && (
                                <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                                    <p className="text-xs font-bold text-slate-400 mb-2 uppercase">Archivos Actuales (Ya subidos)</p>
                                    <div className="flex flex-wrap gap-2">
                                        {existingFiles.map((fileUrl, i) => (
                                            <div key={`exist-${i}`} className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-sm">
                                                <DownloadCloud size={14} className="text-blue-400" />
                                                <a href={fileUrl} target="_blank" rel="noreferrer" className="truncate max-w-[120px] hover:text-blue-400 transition-colors text-slate-300">
                                                    Archivo {i+1}
                                                </a>
                                                <button type="button" onClick={() => removeExistingFile(i)} className="text-slate-400 hover:text-red-400 ml-1">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {files.length > 0 && (
                                <div className="flex flex-wrap gap-3 mt-4">
                                    {files.map((file, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-sm">
                                            <CheckCircle2 size={14} className="text-emerald-400" />
                                            <span className="truncate max-w-[150px]" title={file.name}>{file.name}</span>
                                            <button type="button" onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-400 ml-2">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    disabled={isUploading}
                                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg border border-slate-700 transition-all"
                                >
                                    Cancelar
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={isUploading}
                                className={`px-6 py-2.5 font-bold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
                                    ${editingId 
                                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                    }
                                `}
                            >
                                {isUploading ? 'Subiendo y Guardando...' : (editingId ? 'Actualizar Autorización' : 'Guardar Autorización')}
                            </button>
                        </div>
                    </form>
                </div>

                {/* TABLA DE REGISTROS */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                    <div className="p-4 bg-slate-800/50 border-b border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Leaf className="text-emerald-400" size={20} />
                            <h2 className="text-lg font-bold text-slate-100">Historial de Autorizaciones</h2>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2 text-slate-500" size={14} />
                                <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-md py-1 pl-8 pr-2 text-xs text-slate-300" title="Filtrar por fecha" />
                            </div>
                            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-md py-1 px-2 text-xs text-slate-300">
                                <option value="">Todos los Tipos</option>
                                {AUTH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2 text-slate-500" size={14} />
                                <input type="text" placeholder="Buscar lugar..." value={filterLocation} onChange={e => setFilterLocation(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-md py-1 pl-8 pr-2 text-xs text-slate-300" />
                            </div>
                            {(filterDate || filterType || filterLocation) && (
                                <button onClick={() => {setFilterDate(''); setFilterType(''); setFilterLocation('');}} className="text-xs text-red-400 hover:text-red-300 px-2">Limpiar</button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 font-black tracking-wider">Fecha</th>
                                    <th className="px-6 py-4 font-black tracking-wider">Tipo de Autorización</th>
                                    <th className="px-6 py-4 font-black tracking-wider">Lugar</th>
                                    <th className="px-6 py-4 font-black tracking-wider">Archivos</th>
                                    <th className="px-6 py-4 text-right font-black tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-medium">
                                            No se encontraron autorizaciones
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecords.map((r) => (
                                        <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 font-mono text-emerald-400/90">{r.date}</td>
                                            <td className="px-6 py-4 font-medium text-slate-200">{r.authType}</td>
                                            <td className="px-6 py-4 text-slate-400">{r.location}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {r.files.map((fileUrl, i) => (
                                                        <a key={i} href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-xs">
                                                            <DownloadCloud size={12} /> Archivo {i+1}
                                                        </a>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEdit(r)} className="p-1.5 text-slate-500 hover:text-amber-400 transition-colors" title="Editar registro">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => exportRecordToPDF('Autorización de Área Auxiliar', r, `Auth_${r.id}.pdf`)} className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors" title="Descargar como PDF">
                                                        <DownloadCloud size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(r.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors" title="Eliminar registro">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
