"use client";

import { useState, useEffect } from "react";
import { useAuth, USER_LIST } from "@/lib/auth";
import { SSOMA_LOCATIONS } from "@/lib/locations";
import { uploadEvidence } from "@/lib/uploadClient";
import Sidebar from '@/components/Sidebar';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    FileText,
    Upload,
    Trash2,
    Save,
    Activity,
    Shield,
    Pencil,
    Siren,
    X,
    AlertTriangle,
    Image as ImageIcon,
    Filter
} from "lucide-react";
import SearchableSelect from "@/components/SearchableSelect";
import { generateFilename, getInitials } from "@/lib/utils";

// --- TYPES ---
type SimulacroRecord = {
    id: number;
    date: string;
    responsible: string;
    drillType: string;
    location: string;
    fileUrl: string;
};

// REMOVED STATIC TYPES - Now fetched from Annual Program SEG 05


export default function SimulacroPage() {
    const { user } = useAuth();

    // STATE
    const [records, setRecords] = useState<SimulacroRecord[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        responsible: '',
        drillType: '',
        location: ''
    });

    const [file, setFile] = useState<{ url: string, name: string, type: string } | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Filter State
    const [filterDate, setFilterDate] = useState("");
    const [filterResponsible, setFilterResponsible] = useState("");
    const [filterLocation, setFilterLocation] = useState("");

    const [drillTypes, setDrillTypes] = useState<string[]>([]);

    // LOAD DYNAMIC TYPES FROM ANNUAL PROGRAM (SEG 05 - Simulacros)
    useEffect(() => {
        const loadTypes = async () => {
            try {
                const res = await fetch('/api/annual-program');
                const data = await res.json();
                if (data.success && data.programData['obj10']) {
                    const items = data.programData['obj10'] as any[];
                    const uniqueTypes = Array.from(new Set(items.map(i => i.description))).filter(Boolean);
                    if (uniqueTypes.length > 0) {
                        setDrillTypes(uniqueTypes);
                        if (!form.drillType) setForm(prev => ({ ...prev, drillType: uniqueTypes[0] }));
                    }
                    else {
                        // Fallback defaults if program is empty
                        setDrillTypes(["Sismo", "Incendio", "Primeros Auxilios", "Derrame de Materiales Peligrosos", "Evacuación"]);
                    }
                }
            } catch (e) {
                console.error("Error fetching annual program types for Simulacros:", e);
            }
        };
        loadTypes();
    }, []);

    // LOAD RECORDS
    useEffect(() => {
        const loadRecords = async () => {
            try {
                const res = await fetch('/api/simulacro-records');
                const data = await res.json();
                if (data.success && Array.isArray(data.records)) {
                    setRecords(data.records);
                }
            } catch (e) {
                console.error("Error loading records:", e);
            }
            setIsLoaded(true);
        };
        loadRecords();

        if (user && !form.responsible) {
            setForm(prev => ({ ...prev, responsible: user.name }));
        }
    }, [user]);

    const handleFile = async (selectedFile: File) => {
        if (!selectedFile) return;

        const isPdf = selectedFile.type === 'application/pdf';
        const isImage = selectedFile.type.startsWith('image/');

        if (!isPdf && !isImage) {
            alert("⚠️ Solo se permiten archivos PDF o Imágenes.");
            return;
        }

        if (!form.responsible || !form.location || !form.drillType) {
            alert("⚠️ Por favor completa los campos antes de subir el archivo.");
            return;
        }

        setIsUploading(true);
        try {
            const url = await uploadEvidence(
                selectedFile,
                'Actividad',
                `Simulacro-${form.drillType}-${form.location}`,
                form.date,
                form.responsible,
                'simulacro',
                'seguridad',
                form.location
            );

            setFile({ url, name: selectedFile.name, type: selectedFile.type });
            alert("✅ Archivo subido correctamente.");
        } catch (error: any) {
            console.error(error);
            alert(`Error al subir: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.responsible || !form.location || !form.date || !form.drillType) {
            alert("Por favor completa todos los campos del formulario.");
            return;
        }

        if (!file && !editingId) {
            alert("Es obligatorio subir una evidencia (Imagen o PDF).");
            return;
        }

        const payload = {
            date: form.date,
            responsible: form.responsible,
            drillType: form.drillType,
            location: form.location,
            fileUrl: file?.url || ''
        };

        try {
            const res = await fetch('/api/simulacro-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: editingId ? 'update' : 'create', 
                    id: editingId, 
                    data: payload,
                    userName: user?.name
                })
            });
            const result = await res.json();

            if (result.success) {
                if (editingId) {
                    setRecords(prev => prev.map(r => r.id === editingId ? { ...payload, id: editingId, fileUrl: payload.fileUrl || r.fileUrl } : r));
                    alert("✅ Registro actualizado.");
                } else {
                    setRecords(prev => [{ ...payload, id: result.id }, ...prev]);
                    alert("✅ Simulacro registrado.");
                }
                resetForm();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setForm({
            date: new Date().toISOString().split('T')[0],
            responsible: user?.name || '',
            drillType: '',
            location: ''
        });
        setFile(null);
    };

    const handleEdit = (record: SimulacroRecord) => {
        setEditingId(record.id);
        setForm({
            date: record.date,
            responsible: record.responsible,
            drillType: record.drillType,
            location: record.location
        });
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Eliminar este registro?")) return;
        try {
            const res = await fetch('/api/simulacro-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', id, userName: user?.name })
            });
            if ((await res.json()).success) {
                setRecords(prev => prev.filter(r => r.id !== id));
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden selection:bg-teal-500/30 w-full">
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-[1600px] mx-auto space-y-8">
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tighter mb-2 flex items-center gap-3">
                                <Siren className="text-orange-500" size={32} />
                                Control de Simulacros
                            </h1>
                            <p className="text-slate-400 font-medium">Registro y Evidencias de Ensayos de Emergencia</p>
                        </div>
                        <div className="bg-slate-800/50 px-6 py-3 rounded-xl border border-slate-700">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Simulacros</p>
                            <p className="text-2xl font-black text-white">{records.length}</p>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* FORM */}
                        <div className="xl:col-span-1 space-y-6">
                            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-white uppercase text-sm tracking-widest font-black">
                                        <Upload size={18} className="text-orange-400" /> {editingId ? 'Editar Registro' : 'Nuevo Registro'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Fecha del Simulacro</label>
                                            <input
                                                type="date"
                                                value={form.date}
                                                onChange={e => setForm({ ...form, date: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 outline-none transition-colors"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Responsable / Ejecutor</label>
                                            <select
                                                value={form.responsible}
                                                onChange={e => setForm({ ...form, responsible: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 outline-none transition-colors"
                                            >
                                                <option value="">Seleccionar...</option>
                                                {USER_LIST.map(u => <option key={u.username} value={u.name}>{u.name}</option>)}
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Tipo de Simulacro</label>
                                            <select
                                                value={form.drillType}
                                                onChange={e => setForm({ ...form, drillType: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 outline-none transition-colors"
                                            >
                                                <option value="">Seleccionar tipo...</option>
                                                {drillTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Zona / Lugar</label>
                                            <select
                                                value={form.location}
                                                onChange={e => setForm({ ...form, location: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 outline-none transition-colors"
                                            >
                                                <option value="">Seleccionar lugar...</option>
                                                {SSOMA_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                            </select>
                                        </div>

                                        {/* DRAG & DROP AREA - ESTILO ESTANDARIZADO PREMIUM */}
                                        <div className="space-y-1.5 pt-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                                Evidencia (PDF o Imagen)
                                            </label>
                                            <div 
                                                onDragOver={handleDrag}
                                                onDragLeave={handleDrag}
                                                onDrop={handleDrop}
                                                className={`relative border-2 border-dashed rounded-3xl p-8 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group ${
                                                    isUploading ? 'border-amber-500 bg-amber-500/5 cursor-wait' :
                                                    dragActive ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]' : 
                                                    file ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/30'
                                                }`}
                                            >
                                                <input 
                                                    type="file"
                                                    accept=".pdf,image/*"
                                                    disabled={isUploading}
                                                    onChange={handleFileInput}
                                                    className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-wait"
                                                />
                                                <div className={`p-4 rounded-2xl transition-all ${
                                                    isUploading ? 'bg-amber-500 text-white animate-pulse' :
                                                    dragActive ? 'bg-emerald-500 text-white' : 
                                                    'bg-slate-800 text-slate-400 group-hover:text-emerald-400'
                                                }`}>
                                                    {isUploading ? <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={32} />}
                                                </div>
                                                <div className="text-center">
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${isUploading ? 'text-amber-500' : 'text-white'}`}>
                                                        {isUploading ? 'SUBIENDO...' : dragActive ? '¡SUELTA!' : file ? '✅ EVIDENCIA LISTA' : 'ARRASTRA O HAZ CLIC'}
                                                    </p>
                                                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">
                                                        {file ? 'Documento cargado correctamente' : 'Soporta PDF e Imágenes'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Safe File Preview */}
                                            {file && (
                                                <div className="pt-3">
                                                    <div className="bg-slate-950/50 px-3 py-2 rounded-2xl border border-slate-800 flex items-center justify-between animate-in zoom-in-95 group hover:border-orange-500/30 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-1.5 rounded-lg ${file.name.toLowerCase().endsWith('.pdf') ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                                <FileText size={14} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                                                    {file.name.toLowerCase().endsWith('.pdf') ? 'Documento PDF' : 'Imagen Evidencia'}
                                                                </span>
                                                                <span className="text-[8px] text-slate-500 font-bold truncate max-w-[120px]">
                                                                    Vista previa disponible
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            type="button"
                                                            onClick={() => setFile(null)} 
                                                            className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isUploading}
                                            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-black py-4 rounded-xl shadow-lg shadow-orange-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
                                        >
                                            <Save size={18} /> {editingId ? 'ACTUALIZAR REGISTRO' : 'GUARDAR SIMULACRO'}
                                        </button>

                                        {editingId && (
                                            <button type="button" onClick={resetForm} className="w-full py-2 text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors">
                                                Cancelar Edición
                                            </button>
                                        )}
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                        {/* TABLE */}
                        <div className="xl:col-span-2 space-y-6">
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden min-h-[500px]">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Activity className="text-orange-500" size={20} /> Rastro de Simulacros
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-500 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                                        {records.filter(r => {
                                            const matchesLoc = !filterLocation || r.location === filterLocation;
                                            const matchesResp = !filterResponsible || r.responsible.toLowerCase().includes(filterResponsible.toLowerCase());
                                            const matchesDate = !filterDate || r.date === filterDate;
                                            return matchesLoc && matchesResp && matchesDate;
                                        }).length} REGISTROS
                                    </div>
                                </h3>

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
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-orange-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase">Responsable</label>
                                            {filterResponsible && (
                                                <button onClick={() => setFilterResponsible('')} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <input 
                                            type="text"
                                            placeholder="Buscar..."
                                            value={filterResponsible}
                                            onChange={e => setFilterResponsible(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-orange-500 outline-none"
                                        />
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
                                        <SearchableSelect 
                                            options={SSOMA_LOCATIONS.map(l => ({ id: l, label: l }))}
                                            value={filterLocation}
                                            onChange={(val) => setFilterLocation(val)}
                                            placeholder="Todos los lugares..."
                                            className="[&>div]:bg-slate-950 [&>div]:border-slate-700 [&>div]:py-1.5 [&>div]:px-3 [&>div]:text-[10px]"
                                        />
                                    </div>
                                    <div className="flex flex-col justify-end h-full">
                                        {(filterLocation || filterDate || filterResponsible) && (
                                            <button 
                                                onClick={() => { setFilterLocation(''); setFilterDate(''); setFilterResponsible(''); }}
                                                className="w-full h-[33px] bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] font-bold uppercase transition-colors border border-red-500/20 flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                <X size={14} strokeWidth={3} /> Limpiar Filtros
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* RESUMEN MENSUAL */}
                                <div className="flex flex-wrap gap-2 mb-6 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
                                    {['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'].map((m, i) => {
                                        const count = records.filter(r => {
                                            const mPart = parseInt(r.date?.split('-')[1] || "0");
                                            return mPart === (i + 1);
                                        }).length;
                                        return (
                                            <div key={m} className={`flex-1 flex flex-col items-center justify-center min-w-[45px] py-2 rounded-xl border transition-all ${count > 0 ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-slate-950/50 border-slate-800/50 text-slate-600 opacity-40'}`}>
                                                <span className="text-[7px] font-black uppercase tracking-tighter mb-0.5">{m}</span>
                                                <span className="text-[10px] font-black">{count}</span>
                                            </div>
                                        );
                                    })}
                                    <div className="flex flex-col items-center justify-center min-w-[70px] py-2 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 ml-auto">
                                        <span className="text-[7px] font-black uppercase tracking-tighter">TOTAL</span>
                                        <span className="text-[10px] font-black">{records.length}</span>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-[10px] uppercase font-black text-slate-500 border-b border-slate-800">
                                                <th className="pb-4 pl-4">Fecha</th>
                                                <th className="pb-4">Tipo</th>
                                                <th className="pb-4">Responsable</th>
                                                <th className="pb-4">Lugar</th>
                                                <th className="pb-4 text-center">Evidencia</th>
                                                <th className="pb-4 text-right pr-4">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {records
                                                .filter(r => {
                                                    const matchesLoc = !filterLocation || r.location === filterLocation;
                                                    const matchesResp = !filterResponsible || r.responsible.toLowerCase().includes(filterResponsible.toLowerCase());
                                                    const matchesDate = !filterDate || r.date === filterDate;
                                                    return matchesLoc && matchesResp && matchesDate;
                                                })
                                                .sort((a, b) => b.date.localeCompare(a.date))
                                                .map((record) => (
                                                <tr key={record.id} className="hover:bg-slate-800/30 transition-colors group text-sm">
                                                    <td className="py-4 pl-4 font-mono text-slate-300">{record.date}</td>
                                                    <td className="py-4">
                                                        <span className="px-2 py-1 rounded bg-orange-500/10 text-orange-400 text-[10px] font-bold border border-orange-500/20 uppercase">
                                                            {record.drillType}
                                                        </span>
                                                    </td>
                                                    <td className="py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                                {getInitials(record.responsible)}
                                                            </div>
                                                            <span className="text-slate-300 font-medium">{record.responsible}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-slate-400 text-xs">{record.location}</td>
                                                    <td className="py-4 text-center">
                                                        {record.fileUrl && (
                                                            <button onClick={() => setPreviewFile(record.fileUrl!)} className="inline-flex p-2 bg-slate-800 rounded-lg text-teal-400 hover:bg-teal-500/20 transition-colors">
                                                                <Eye size={16} />
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="py-4 text-right pr-4">
                                                        <div className="flex justify-end gap-1">
                                                            {(user?.role === 'developer' || user?.role === 'manager' || user?.name === record.responsible) && (
                                                                <>
                                                                    <button onClick={() => handleEdit(record)} className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Editar"><Pencil size={14}/></button>
                                                                    <button onClick={() => handleDelete(record.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar"><Trash2 size={14}/></button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {records.length === 0 && (
                                                <tr><td colSpan={6} className="py-12 text-center text-slate-600 italic">No hay registros.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* PREVIEW */}
            {previewFile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="relative w-full max-w-5xl h-full flex flex-col bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <h3 className="text-xl font-black text-white flex items-center gap-3 italic">
                                <Siren className="text-orange-500" /> VISUALIZACIÓN DE EVIDENCIA
                            </h3>
                            <button onClick={() => setPreviewFile(null)} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-all active:scale-95">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 bg-slate-950 p-2">
                            <iframe 
                                src={getDriveViewerUrl(previewFile)} 
                                className="w-full h-full rounded-2xl border border-slate-800"
                                title="Visualizador"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
