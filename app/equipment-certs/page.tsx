"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
    Truck, 
    Plus, 
    Search, 
    Calendar, 
    FileText, 
    Trash2, 
    Loader2, 
    AlertCircle,
    Settings,
    Tool,
    ShieldCheck,
    Clock,
    Upload,
    X,
    Folder
} from 'lucide-react';
import { uploadEvidence } from '@/lib/uploadClient';
import { getDriveViewerUrl, canDeleteRecord} from '@/lib/utils';

interface EquipmentCert {
    id: number;
    equipment_name: string;
    plate_id: string;
    cert_type: string;
    cert_type: string;
    mes_registro: string;
    fileUrls: string[];
}

const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function EquipmentCertsPage() {
    const [records, setRecords] = useState<EquipmentCert[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCertType, setFilterCertType] = useState("");
    const [filterCompany, setFilterCompany] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);

    const [form, setForm] = useState({
        equipment_name: '',
        plate_id: '',
        cert_type: 'Certificado de Operatividad',
        mes_registro: MESES[new Date().getMonth()],
        fileUrls: [] as string[]
    });

    useEffect(() => {
        loadRecords();
    }, []);

    const loadRecords = async () => {
        try {
            const res = await fetch('/api/equipment-certs');
            const data = await res.json();
            if (data.success) setRecords(data.records);
        } catch (error) {
            console.error("Error loading records:", error);
        } finally {
            setIsLoaded(true);
        }
    };

    const handleFileSelect = (e: any) => {
        const fileList = e.target?.files || e.dataTransfer?.files || [];
        const files = Array.from(fileList) as File[];
        if (files.length === 0) return;
        setPendingFiles(prev => [...prev, ...files]);
        if (e.target && e.target.type === 'file') e.target.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        let finalTitle = form.equipment_name.trim();
        if (!finalTitle) {
            finalTitle = `Archivos de ${form.mes_registro}`;
        }

        if (pendingFiles.length === 0) {
            alert('Por favor, adjunte al menos un documento.');
            return;
        }

        setIsSubmitting(true);
        setIsUploading(true);
        setUploadProgress({ current: 0, total: pendingFiles.length });
        
        const uploadedUrls: string[] = [];

        try {
            // Subir archivos primero
            for (let i = 0; i < pendingFiles.length; i++) {
                const file = pendingFiles[i];
                setUploadProgress({ current: i + 1, total: pendingFiles.length });
                const url = await uploadEvidence(
                    file, 'Equipos', form.cert_type, new Date().toISOString().split('T')[0], 'SSOMA', 'EQUIPMENT', 'EQUIPO', form.plate_id || 'GENERAL', 'CERT'
                );
                uploadedUrls.push(url);
            }

            // Guardar en BD
            const dataToSave = { ...form, equipment_name: finalTitle, fileUrls: uploadedUrls };
            const res = await fetch('/api/equipment-certs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', data: dataToSave })
            });

            if (res.ok) {
                setForm({ equipment_name: '', plate_id: '', cert_type: 'Certificado de Operatividad', mes_registro: MESES[new Date().getMonth()], fileUrls: [] });
                setPendingFiles([]);
                setShowForm(false);
                loadRecords();
                alert('Certificado registrado y archivos subidos correctamente.');
            } else {
                alert('Error al guardar el registro en la base de datos.');
            }
        } catch (error: any) {
            console.error("Error creating record:", error);
            alert(`Error durante el proceso: ${error.message}`);
        } finally {
            setIsSubmitting(false);
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const record = records.find(r => r.id === id);
        if (!canDeleteRecord(id, user?.role || 'user', record?.date)) {
            alert('⏱️ No se puede eliminar este registro.\nLos usuarios solo pueden eliminar documentos dentro de las primeras 24 horas de su ingreso.\nContacte al administrador si necesita realizar esta acción.');
            return;
        }
        if (!confirm("¿Eliminar este certificado de equipo?")) return;
        try {
            await fetch('/api/equipment-certs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', data: { id } })
            });
            loadRecords();
        } catch (error) {
            console.error("Error deleting record:", error);
        }
    };

    const filteredRecords = records.filter(r => {
        const matchesSearch = !searchTerm || r.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()) || (r.plate_id && r.plate_id.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = !filterCertType || r.cert_type === filterCertType;
        const matchesMonth = !filterDate || r.mes_registro === filterDate; // Resurposed filterDate to act as Month filter
        return matchesSearch && matchesType && matchesMonth;
    });

    return (
        <div className="p-8 bg-slate-950 min-h-screen flex-1 text-slate-100">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                                <Truck className="w-6 h-6 text-slate-950" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tighter">Certificados de Operatividad</h1>
                        </div>
                        <p className="text-slate-400 font-medium italic">Control de certificados de equipos pesados, livianos y herramientas (Anexo 2)</p>
                    </div>

                    <button 
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all transform active:scale-95 shadow-[0_4px_20px_rgba(59,130,246,0.3)]"
                    >
                        {showForm ? <Trash2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        {showForm ? 'Cancelar' : 'Nuevo Certificado'}
                    </button>
                </header>

                {showForm && (
                    <Card className="bg-slate-900 border-slate-800 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                        <CardHeader>
                            <CardTitle className="text-xl text-blue-400 flex items-center gap-2">
                                <Settings className="w-5 h-5" /> Registro de Certificación Técnico-Operativa
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Título / Descripción</label>
                                    <input name="form_equipment_name" 
                                        className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Ej: Archivos de Mayo..."
                                        value={form.equipment_name}
                                        onChange={e => setForm({...form, equipment_name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Mes de Registro</label>
                                    <select name="form_mes_registro" 
                                        className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={form.mes_registro}
                                        onChange={e => setForm({...form, mes_registro: e.target.value})}
                                    >
                                        {MESES.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Certificado</label>
                                    <select name="form_cert_type" 
                                        className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={form.cert_type}
                                        onChange={e => setForm({...form, cert_type: e.target.value})}
                                    >
                                        <option value="Certificado de Operatividad">Certificado de Operatividad</option>
                                        <option value="Programa de Mantenimiento">Programa de Mantenimiento</option>
                                    </select>
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">
                                        Archivo del Documento (Arrastra PDFs)
                                    </label>
                                    <div 
                                        onDragOver={(e) => { e.preventDefault(); if (!isUploading) setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setIsDragging(false);
                                            if (!isUploading) {
                                                handleFileSelect({ target: { files: e.dataTransfer.files } } as any);
                                            }
                                        }}
                                        className={`relative border-2 border-dashed rounded-3xl p-10 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group overflow-hidden ${
                                            isUploading ? 'border-amber-500 bg-amber-500/5' :
                                            isDragging ? 'border-blue-500 bg-blue-500/10' : 
                                            pendingFiles.length > 0 ? 'border-blue-500/30 bg-blue-500/5' : 'border-slate-800 hover:border-slate-700'
                                        }`}
                                    >
                                        <input name="input_70731" 
                                            type="file" multiple disabled={isUploading}
                                            onChange={handleFileSelect}
                                            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-wait z-10"
                                        />
                                        <div className={`p-4 rounded-2xl ${isUploading ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 group-hover:text-blue-400'}`}>
                                            {isUploading ? <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={32} />}
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-black uppercase text-white">
                                                {isUploading 
                                                    ? `SUBIENDO Y REGISTRANDO... ${uploadProgress.current}/${uploadProgress.total}` 
                                                    : pendingFiles.length > 0 ? `${pendingFiles.length} ARCHIVO(S) SELECCIONADO(S)` : 'ARRASTRA O HAZ CLIC AQUÍ'}
                                            </p>
                                        </div>
                                        {isUploading && uploadProgress.total > 0 && (
                                            <div className="absolute bottom-0 left-0 h-1.5 bg-amber-500 transition-all duration-300 z-0" style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }} />
                                        )}
                                    </div>

                                    {/* Preview files */}
                                    {pendingFiles.length > 0 && !isUploading && (
                                        <div className="flex flex-wrap gap-2 pt-4">
                                            {pendingFiles.map((f, idx) => (
                                                <div key={idx} className="bg-slate-950 px-3 py-2 rounded-2xl border border-slate-800 flex items-center gap-3">
                                                    <FileText size={14} className="text-blue-400" />
                                                    <span className="text-[10px] font-bold text-slate-300 max-w-[150px] truncate" title={f.name}>{f.name}</span>
                                                    <button type="button" onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== idx))} className="text-slate-600 hover:text-red-400">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-3">
                                    <button 
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-500 transition-all disabled:bg-slate-700"
                                    >
                                        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'REGISTRAR CERTIFICADO'}
                                    </button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 items-end">
                    <div className="space-y-1">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase">Buscar Título/Descripción</label>
                            {searchTerm && (
                                <button onClick={() => setSearchTerm("")} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                    <X size={10} />
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                            <input name="searchTerm" 
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 pl-9 pr-3 text-[10px] text-white focus:border-blue-500 outline-none transition-all"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase">Tipo de Certificado</label>
                            {filterCertType && (
                                <button onClick={() => setFilterCertType("")} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                    <X size={10} />
                                </button>
                            )}
                        </div>
                        <select name="filterCertType" 
                            value={filterCertType}
                            onChange={e => setFilterCertType(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-blue-500 outline-none"
                        >
                            <option value="">Todos los Tipos...</option>
                            <option value="Certificado de Operatividad">Certificado de Operatividad</option>
                            <option value="Programa de Mantenimiento">Programa de Mantenimiento</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase">Mes de Registro</label>
                            {filterDate && (
                                <button onClick={() => setFilterDate("")} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                    <X size={10} />
                                </button>
                            )}
                        </div>
                        <select name="filterDate" 
                            value={filterDate}
                            onChange={e => setFilterDate(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-blue-500 outline-none"
                        >
                            <option value="">Todos los Meses...</option>
                            {MESES.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col justify-end h-full">
                        {(searchTerm || filterCertType || filterDate || filterCompany) && (
                            <button 
                                onClick={() => { setSearchTerm(""); setFilterCertType(""); setFilterDate(""); setFilterCompany(""); }}
                                className="w-full h-[33px] bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] font-bold uppercase transition-colors border border-red-500/20 flex items-center justify-center gap-2 active:scale-95"
                            >
                                <X size={14} strokeWidth={3} /> Limpiar Filtros
                            </button>
                        )}
                    </div>
                </div>

                {/* RESUMEN MENSUAL */}
                <div className="flex flex-wrap gap-2 mb-8 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
                    {MESES.map(m => {
                        const count = records.filter(r => r.mes_registro === m).length;
                        return (
                            <div key={m} className={`flex-1 flex flex-col items-center justify-center min-w-[45px] py-2 rounded-xl border transition-all ${count > 0 ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-slate-950/50 border-slate-800/50 text-slate-600 opacity-40'}`}>
                                <span className="text-[7px] font-black uppercase tracking-tighter mb-0.5">{m.substring(0,3)}</span>
                                <span className="text-[10px] font-black">{count}</span>
                            </div>
                        );
                    })}
                    <div className="flex flex-col items-center justify-center min-w-[70px] py-2 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 ml-auto">
                        <span className="text-[7px] font-black uppercase tracking-tighter">TOTAL</span>
                        <span className="text-[10px] font-black">{records.length}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {!isLoaded ? (
                        [1,2,3].map(i => <div key={i} className="h-56 bg-slate-900 animate-pulse rounded-2xl border border-slate-800" />)
                    ) : filteredRecords.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-slate-500 font-medium italic">No hay certificados registrados.</div>
                    ) : (
                        filteredRecords.map(record => (
                            <Card key={record.id} className="bg-slate-900 border-slate-800 hover:border-blue-500/30 transition-all group overflow-hidden">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                                            <ShieldCheck size={12} className="text-blue-500" />
                                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{record.cert_type}</span>
                                        </div>
                                        <button onClick={() => handleDelete(record.id)} className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                                    </div>

                                    <h3 className="text-xl font-bold mb-1">{record.equipment_name}</h3>
                                    {record.plate_id && <p className="text-xs text-slate-500 mb-4 font-mono font-bold tracking-widest">{record.plate_id}</p>}

                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500 uppercase font-bold">Mes de Registro:</span>
                                            <span className="text-slate-300 font-bold">{record.mes_registro || 'No especificado'}</span>
                                        </div>
                                    </div>

                                    {record.fileUrls && record.fileUrls.length > 0 ? (
                                        <div className="pt-2 mt-2 border-t border-slate-800/50 flex flex-col gap-1">
                                            <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Archivos Adjuntos</p>
                                            <div className="flex flex-wrap gap-1">
                                                {record.fileUrls.map((url: string, idx: number) => (
                                                    <a 
                                                        key={idx} 
                                                        href={getDriveViewerUrl(url)} 
                                                        target="_blank" 
                                                        rel="noreferrer" 
                                                        className="text-[9px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-slate-900/80 border border-slate-800 px-2 py-1 rounded-md transition-all hover:border-blue-500/50"
                                                    >
                                                        <FileText size={10} className="shrink-0" />
                                                        <span className="truncate max-w-[150px]">{record.cert_type} {record.fileUrls.length > 1 ? idx + 1 : ''}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full py-3 bg-slate-800/30 text-slate-600 text-xs font-bold rounded-xl text-center border border-dashed border-slate-700">Evidencia no disponible</div>
                                    )}
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
