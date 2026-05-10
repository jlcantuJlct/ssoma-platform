"use client";

import { useState, useEffect } from 'react';
import { useAuth, USER_LIST } from '@/lib/auth';
import { Search, Plus, FileText, Calendar, User, Upload, Shield, Trash2, Check, X, Filter, BookOpen } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import { uploadEvidence } from '@/lib/uploadClient';
import { SSOMA_LOCATIONS } from '@/lib/locations';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getDriveViewerUrl } from "@/lib/utils";

export default function RISSTMAPage() {
    const { user } = useAuth();
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [programActivities, setProgramActivities] = useState<string[]>(['RISST + RITMA', 'Solo RISST', 'Solo RITMA']);

    // LOAD DYNAMIC ACTIVITIES FROM ANNUAL PROGRAM (OBJ 03)
    useEffect(() => {
        const loadProgram = async () => {
            try {
                const res = await fetch('/api/annual-program');
                const data = await res.json();
                if (data.success && data.programData['obj3']) {
                    const items = data.programData['obj3'] as any[];
                    // Filter activities that seem relevant to RISSTMA or just all from obj3
                    const uniqueDescs = Array.from(new Set(items.map(i => i.description).filter(Boolean))) as string[];
                    if (uniqueDescs.length > 0) {
                        setProgramActivities(uniqueDescs);
                        if (!formData.documentType) {
                            setFormData(prev => ({ ...prev, documentType: uniqueDescs[0] }));
                        }
                    }
                }
            } catch (e) {
                console.error("Error loading program for RISSTMA:", e);
            }
        };
        loadProgram();
    }, []);
    
    // Form state
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        workerName: '',
        dni: '',
        documentType: 'RISST + RITMA',
        responsable: user?.name || '',
        fileUrl: '',
        lugar: ''
    });
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Filter state
    const [filters, setFilters] = useState({
        date: '',
        workerName: '',
        documentType: '',
        lugar: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/risstma-records');
            const data = await res.json();
            if (data.success) {
                setRecords(data.records);
            }
        } catch (error) {
            console.error('Error fetching RISSTMA records:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.workerName || !formData.fileUrl) {
            alert('Por favor seleccione al trabajador y cargue la evidencia.');
            return;
        }

        setIsSaving(true);
        try {
            const newRecord = {
                ...formData,
                id: Date.now()
            };

            const res = await fetch('/api/risstma-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newRecord, userName: user?.name })
            });

            if (res.ok) {
                setRecords(prev => [newRecord, ...prev]);
                setIsAdding(false);
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    workerName: '',
                    dni: '',
                    documentType: 'RISST + RITMA',
                    responsable: user?.name || '',
                    fileUrl: '',
                    lugar: ''
                });
                alert('✅ Registro guardado con éxito.');
            }
        } catch (error) {
            alert('❌ Error al guardar el registro.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Está seguro de eliminar este registro?')) return;

        try {
            const res = await fetch('/api/risstma-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', id, userName: user?.name })
            });

            if (res.ok) {
                setRecords(prev => prev.filter(r => r.id !== id));
            }
        } catch (error) {
            alert('Error al eliminar');
        }
    };

    const filteredRecords = records.filter(rec => {
        const matchDate = !filters.date || rec.date === filters.date;
        const matchName = !filters.workerName || rec.workerName.toLowerCase().includes(filters.workerName.toLowerCase());
        const matchType = !filters.documentType || rec.documentType === filters.documentType;
        const matchLugar = !filters.lugar || rec.lugar === filters.lugar;
        return matchDate && matchName && matchType && matchLugar;
    });

    return (
        <div className="p-6 md:p-8 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
                    <div>
                        <h1 className="text-3xl font-black text-white flex items-center gap-2">
                            <BookOpen className="text-indigo-400" />
                            Control de RISSTMA
                        </h1>
                        <p className="text-slate-400 font-medium">Control de entrega y cargo de reglamentos internos (RISST / RITMA)</p>
                    </div>
                    <button 
                        onClick={() => setIsAdding(!isAdding)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
                            isAdding ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-indigo-600 text-white hover:bg-indigo-500'
                        }`}
                    >
                        {isAdding ? <X size={20} /> : <Plus size={20} />}
                        {isAdding ? 'Cancelar' : 'Registrar Entrega'}
                    </button>
                </header>

                {/* Add Form */}
                {isAdding && (
                    <Card className="border border-slate-800 shadow-2xl bg-slate-900/80 backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-top-4">
                        <CardHeader className="bg-indigo-600/20 text-white border-b border-indigo-500/20">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Shield className="w-5 h-5 text-indigo-400" />
                                Nueva Declaración Jurada de RISSTMA
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 px-1">
                                        <Calendar size={12} /> Fecha de Entrega
                                    </label>
                                    <input 
                                        type="date" 
                                        value={formData.date}
                                        onChange={e => setFormData({...formData, date: e.target.value})}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 px-1">
                                        <User size={12} /> Trabajador
                                    </label>
                                    <SearchableSelect 
                                        options={USER_LIST.map(u => u.name)}
                                        value={formData.workerName}
                                        onChange={val => setFormData({...formData, workerName: val})}
                                        placeholder="Buscar trabajador..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 px-1">
                                        <FileText size={12} /> Documento Entregado
                                    </label>
                                    <select 
                                        value={formData.documentType}
                                        onChange={e => setFormData({...formData, documentType: e.target.value})}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    >
                                        <option value="">Seleccionar Actividad...</option>
                                        {programActivities.map(act => (
                                            <option key={act} value={act}>{act}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 px-1">
                                        Lugar / Sede
                                    </label>
                                    <select 
                                        value={formData.lugar}
                                        onChange={e => setFormData({...formData, lugar: e.target.value})}
                                        className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {SSOMA_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                    </select>
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 px-1">
                                        <Upload size={12} /> Cargo / Declaración Jurada (PDF o Imagen)
                                    </label>
                                    <div 
                                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={async (e) => { 
                                            e.preventDefault(); 
                                            setIsDragging(false); 
                                            const file = e.dataTransfer.files?.[0];
                                            if (file) {
                                                setIsUploading(true);
                                                try {
                                                    const url = await uploadEvidence(file, 'Actividad', `RISSTMA_${formData.workerName.replace(/\s+/g, '_')}`, formData.date, formData.workerName, 'risstma', 'seguridad', formData.lugar);
                                                    if (url) setFormData({...formData, fileUrl: url});
                                                } finally {
                                                    setIsUploading(false);
                                                }
                                            }
                                        }}
                                        className={`relative border-2 border-dashed rounded-3xl p-10 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group ${
                                            isUploading ? 'border-amber-500 bg-amber-500/5 cursor-wait' :
                                            isDragging ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]' : 
                                            formData.fileUrl ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/30'
                                        }`}
                                    >
                                        <input 
                                            type="file" 
                                            accept="image/*,application/pdf"
                                            disabled={isUploading}
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setIsUploading(true);
                                                    try {
                                                        const url = await uploadEvidence(file, 'Actividad', `RISSTMA_${formData.workerName.replace(/\s+/g, '_')}`, formData.date, formData.workerName, 'risstma', 'seguridad', formData.lugar);
                                                        if (url) setFormData({...formData, fileUrl: url});
                                                    } finally {
                                                        setIsUploading(false);
                                                    }
                                                }
                                            }}
                                            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-wait" 
                                        />
                                        <div className={`p-4 rounded-2xl transition-all ${
                                            isUploading ? 'bg-amber-500 text-white animate-pulse' :
                                            isDragging ? 'bg-indigo-500 text-white' : 
                                            'bg-slate-800 text-slate-400 group-hover:text-indigo-400'
                                        }`}>
                                            {isUploading ? <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={32} />}
                                        </div>
                                        <div className="text-center">
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${isUploading ? 'text-amber-500' : 'text-white'}`}>
                                                {isUploading ? 'SUBIENDO...' : isDragging ? '¡SUELTA EL CARGO!' : formData.fileUrl ? '✅ CARGO LISTO' : 'ARRASTRA O HAZ CLIC'}
                                            </p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">
                                                {formData.fileUrl ? 'Documento cargado correctamente' : 'Soporta PDF e Imágenes'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-end">
                                    <button 
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 shadow-emerald-900/20"
                                    >
                                        {isSaving ? <span className="animate-spin text-xl">⏳</span> : <Check size={20} />}
                                        Guardar Registro
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Filters */}
                <div className="bg-slate-900/50 p-4 rounded-2xl shadow-xl border border-slate-800 flex flex-wrap items-center gap-4 backdrop-blur-sm relative">
                    <div className="flex items-center gap-2 text-slate-500 mr-2">
                        <Filter size={18} className="text-indigo-400" />
                        <span className="font-bold text-xs uppercase tracking-widest">Filtros:</span>
                    </div>

                    <div className="relative">
                        <input 
                            type="date" 
                            value={filters.date}
                            onChange={e => setFilters({...filters, date: e.target.value})}
                            className="p-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm outline-none focus:border-indigo-500 pr-8"
                        />
                        {filters.date && (
                            <button onClick={() => setFilters({...filters, date: ''})} className="absolute right-2 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-300 transition-colors" title="Limpiar fecha">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Filtrar por trabajador..."
                            value={filters.workerName}
                            onChange={e => setFilters({...filters, workerName: e.target.value})}
                            className="p-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm outline-none w-48 focus:border-indigo-500 pr-8"
                        />
                        {filters.workerName && (
                            <button onClick={() => setFilters({...filters, workerName: ''})} className="absolute right-2 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-300 transition-colors" title="Limpiar trabajador">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="relative flex items-center">
                        <select 
                            value={filters.lugar}
                            onChange={e => setFilters({...filters, lugar: e.target.value})}
                            className="p-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm outline-none focus:border-indigo-500"
                        >
                            <option value="">Todos los lugares...</option>
                            {SSOMA_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                        {filters.lugar && (
                            <button onClick={() => setFilters({...filters, lugar: ''})} className="absolute right-6 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-300 transition-colors bg-slate-950 rounded" title="Limpiar lugar">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {(filters.date || filters.workerName || filters.lugar) && (
                        <button 
                            onClick={() => setFilters({ date: '', workerName: '', lugar: '' })}
                            className="ml-auto text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-300 transition-colors flex items-center gap-1 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20"
                        >
                            <X size={12} /> Limpiar Filtros
                        </button>
                    )}
                </div>

                {/* Records Table */}
                <div className="bg-slate-900/40 rounded-3xl shadow-2xl overflow-hidden border border-slate-800 backdrop-blur-md">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950 text-slate-500 text-[10px] uppercase tracking-widest font-black border-b border-slate-800">
                                    <th className="p-4 pl-6">Fecha Entrega</th>
                                    <th className="p-4">Trabajador</th>
                                    <th className="p-4">Documento</th>
                                    <th className="p-4">Lugar</th>
                                    <th className="p-4">Evidencia</th>
                                    <th className="p-4 text-right pr-6">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-slate-500">
                                            <div className="animate-pulse flex flex-col items-center gap-2">
                                                <div className="w-8 h-8 bg-slate-800 rounded-full"></div>
                                                Cargando registros...
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-slate-500 font-medium italic">
                                            No se encontraron registros.
                                        </td>
                                    </tr>
                                ) : filteredRecords.map(rec => (
                                    <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="p-4 pl-6 font-bold text-slate-300">{rec.date}</td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white">{rec.workerName}</span>
                                                <span className="text-[10px] text-slate-500 font-mono mt-0.5">DNI: {rec.dni || '---'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-bold border border-indigo-500/20 uppercase">
                                                {rec.documentType}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-slate-300">
                                            {rec.lugar || '---'}
                                        </td>
                                        <td className="p-4">
                                            {rec.fileUrl ? (
                                                <a 
                                                    href={getDriveViewerUrl(rec.fileUrl)} 
                                                    target="_blank" 
                                                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-2 font-bold text-xs group-hover:translate-x-1 transition-transform"
                                                >
                                                    <FileText size={16} /> Ver Cargo
                                                </a>
                                            ) : (
                                                <span className="text-slate-700">Sin archivo</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right pr-6">
                                            {(user?.role === 'developer' || user?.role === 'manager' || user?.name === rec.responsable) && (
                                                <button 
                                                    onClick={() => handleDelete(rec.id)}
                                                    className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                                                    title="Eliminar Registro"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
