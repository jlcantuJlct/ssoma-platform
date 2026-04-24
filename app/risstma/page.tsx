"use client";

import { useState, useEffect } from 'react';
import { useAuth, USER_LIST } from '@/lib/auth';
import { Search, Plus, FileText, Calendar, User, Upload, Shield, Trash2, Check, X, Filter, BookOpen } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import { uploadEvidence } from '@/lib/uploadClient';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getDriveViewerUrl } from "@/lib/utils";

export default function RISSTMAPage() {
    const { user } = useAuth();
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        workerName: '',
        dni: '',
        documentType: 'RISST + RITMA',
        responsable: user?.name || '',
        fileUrl: ''
    });

    // Filter state
    const [filters, setFilters] = useState({
        date: '',
        workerName: '',
        documentType: ''
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
                body: JSON.stringify(newRecord)
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
                    fileUrl: ''
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
                body: JSON.stringify({ action: 'delete', id })
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
        return matchDate && matchName && matchType;
    });

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2">
                            <BookOpen className="text-indigo-600" />
                            Control de RISSTMA
                        </h1>
                        <p className="text-slate-500 font-medium">Control de entrega y cargo de reglamentos internos (RISST / RITMA)</p>
                    </div>
                    <button 
                        onClick={() => setIsAdding(!isAdding)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
                            isAdding ? 'bg-slate-200 text-slate-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                    >
                        {isAdding ? <X size={20} /> : <Plus size={20} />}
                        {isAdding ? 'Cancelar' : 'Registrar Entrega'}
                    </button>
                </header>

                {/* Add Form */}
                {isAdding && (
                    <Card className="border-none shadow-xl bg-white overflow-hidden animate-in fade-in slide-in-from-top-4">
                        <CardHeader className="bg-indigo-600 text-white">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Nueva Declaración Jurada de RISSTMA
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <Calendar size={14} /> Fecha de Entrega
                                    </label>
                                    <input 
                                        type="date" 
                                        value={formData.date}
                                        onChange={e => setFormData({...formData, date: e.target.value})}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <User size={14} /> Trabajador
                                    </label>
                                    <SearchableSelect 
                                        options={USER_LIST.map(u => u.name)}
                                        value={formData.workerName}
                                        onChange={val => setFormData({...formData, workerName: val})}
                                        placeholder="Buscar trabajador..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <FileText size={14} /> Documento Entregado
                                    </label>
                                    <select 
                                        value={formData.documentType}
                                        onChange={e => setFormData({...formData, documentType: e.target.value})}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option>RISST + RITMA</option>
                                        <option>Solo RISST</option>
                                        <option>Solo RITMA</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <Upload size={14} /> Cargo / Declaración Jurada (PDF o Imagen)
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input 
                                            type="file" 
                                            accept="image/*,application/pdf"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const url = await uploadEvidence(file);
                                                    if (url) setFormData({...formData, fileUrl: url});
                                                }
                                            }}
                                            className="hidden" 
                                            id="file-upload"
                                        />
                                        <label 
                                            htmlFor="file-upload"
                                            className="flex-1 cursor-pointer p-4 border-2 border-dashed border-slate-300 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all flex flex-col items-center gap-2 text-slate-500"
                                        >
                                            {formData.fileUrl ? (
                                                <div className="flex items-center gap-2 text-emerald-600 font-bold">
                                                    <CheckCircle2 className="w-6 h-6" /> Evidencia Lista
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="w-8 h-8 text-slate-400" />
                                                    <span className="text-sm">Clic para subir el cargo firmado</span>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                <div className="flex items-end">
                                    <button 
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-500 mr-2">
                        <Filter size={18} />
                        <span className="font-bold text-sm">Filtros:</span>
                    </div>
                    <input 
                        type="date" 
                        value={filters.date}
                        onChange={e => setFilters({...filters, date: e.target.value})}
                        className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                    />
                    <input 
                        type="text" 
                        placeholder="Filtrar por trabajador..."
                        value={filters.workerName}
                        onChange={e => setFilters({...filters, workerName: e.target.value})}
                        className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none w-48"
                    />
                </div>

                {/* Records Table */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-widest font-black">
                                    <th className="p-4 pl-6">Fecha Entrega</th>
                                    <th className="p-4">Trabajador</th>
                                    <th className="p-4">Documento</th>
                                    <th className="p-4">Evidencia</th>
                                    <th className="p-4 text-right pr-6">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-slate-400">
                                            <div className="animate-pulse flex flex-col items-center gap-2">
                                                <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                                                Cargando registros...
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                                            No se encontraron registros.
                                        </td>
                                    </tr>
                                ) : filteredRecords.map(rec => (
                                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-4 pl-6 font-bold text-slate-700">{rec.date}</td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800">{rec.workerName}</span>
                                                <span className="text-xs text-slate-400">DNI: {rec.dni || '---'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold border border-indigo-100">
                                                {rec.documentType}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {rec.fileUrl ? (
                                                <a 
                                                    href={getDriveViewerUrl(rec.fileUrl)} 
                                                    target="_blank" 
                                                    className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-bold text-sm"
                                                >
                                                    <FileText size={16} /> Ver Cargo
                                                </a>
                                            ) : (
                                                <span className="text-slate-300">Sin archivo</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right pr-6">
                                            <button 
                                                onClick={() => handleDelete(rec.id)}
                                                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
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
