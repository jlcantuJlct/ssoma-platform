"use client";

import { useState, useEffect } from "react";
import { useAuth, USER_LIST } from "@/lib/auth";
import { SSOMA_LOCATIONS } from "@/lib/locations";
import { PETAR_TYPES, RESPONSIBLES } from "@/lib/categories";
import { uploadEvidence } from "@/lib/uploadClient";
import Sidebar from '@/components/Sidebar';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    FileText,
    Download,
    Upload,
    Trash2,
    Eye,
    Save,
    Activity,
    Clipboard,
    Search,
    Pencil,
    CheckCircle2,
    RotateCcw,
    X,
    DownloadCloud
} from "lucide-react";
import SearchableSelect from "@/components/SearchableSelect";
import { generateFilename, getInitials } from "@/lib/utils";
import { exportTableToPDF, exportRecordToPDF } from "@/lib/pdfExport";

// --- TYPES ---
type PetarRecord = {
    id: number;
    date: string;
    responsible: string;
    location: string;
    type: string;
    fileUrl: string;
};

export default function PetarPage() {
    const { user } = useAuth();

    // STATE
    const [records, setRecords] = useState<PetarRecord[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        responsible: '',
        location: '',
        type: 'Caliente' as PetarRecord['type']
    });

    const [file, setFile] = useState<{ url: string, name: string } | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Filter State
    const [filterDate, setFilterDate] = useState("");
    const [filterResponsible, setFilterResponsible] = useState("");
    const [filterLocation, setFilterLocation] = useState("");

    // LOAD RECORDS FROM DATABASE
    useEffect(() => {
        const loadRecords = async () => {
            try {
                const res = await fetch('/api/petar-records');
                const data = await res.json();
                
                let apiRecords: any[] = [];
                if (data.success && Array.isArray(data.records)) {
                    apiRecords = data.records;
                }

                const stored = localStorage.getItem('petar_records');
                let mergedRecords = [...apiRecords];
                let hasUnsyncedLocal = false;
                let localRecordsToSync: any[] = [];

                if (stored) {
                    try {
                        const localRecords = JSON.parse(stored);
                        if (Array.isArray(localRecords) && localRecords.length > 0) {
                            // Encontrar registros locales que no estén en la base de datos (por fecha, tipo, etc. O simplemente por ID temporal)
                            // Como los IDs de DB son números pequeños, los locales antiguos pueden tener IDs generados por Date.now()
                            for (const localRec of localRecords) {
                                // Comprobación simple para evitar duplicados exactos
                                const exists = apiRecords.find(r => 
                                    r.date === localRec.date && 
                                    r.responsible === localRec.responsible &&
                                    r.type === localRec.type
                                );
                                if (!exists) {
                                    mergedRecords.push(localRec);
                                    localRecordsToSync.push(localRec);
                                    hasUnsyncedLocal = true;
                                }
                            }
                        }
                    } catch (parseErr) {
                        console.error("Error parsing petar_records", parseErr);
                    }
                }

                if (hasUnsyncedLocal && localRecordsToSync.length > 0) {
                    // Sincronizar automáticamente con la base de datos
                    fetch('/api/petar-records', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'bulk-create', data: localRecordsToSync })
                    }).catch(console.error);
                }
                
                // Ordenar por fecha descendente
                mergedRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setRecords(mergedRecords);
            } catch (e) {
                console.error("Error loading PETAR records from API:", e);
                // Fallback: try localStorage
                const stored = localStorage.getItem('petar_records');
                if (stored) {
                    try {
                        setRecords(JSON.parse(stored));
                    } catch (parseErr) {
                        console.error("Error parsing petar_records", parseErr);
                    }
                }
            }
            setIsLoaded(true);
        };
        loadRecords();

        // Auto-set responsible if user is logged in
        if (user && !form.responsible) {
            setForm(prev => ({ ...prev, responsible: user.name }));
        }
    }, [user]);

    // Sync to localStorage as backup (but API is primary)
    useEffect(() => {
        if (isLoaded && records.length > 0) {
            localStorage.setItem('petar_records', JSON.stringify(records));
        }
    }, [records, isLoaded]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (selectedFile.type !== 'application/pdf') {
            alert("⚠️ Solo se permiten archivos PDF para PETAR.");
            return;
        }

        if (!form.responsible || !form.location) {
            alert("⚠️ Por favor completa RESPONSABLE y LUGAR antes de subir el archivo para generar el nombre correcto.");
            e.target.value = '';
            return;
        }

        setIsUploading(true);
        try {
            const url = await uploadEvidence(
                selectedFile,
                'Actividad', // Contexto genérico o crear uno nuevo si necesario
                `PETAR-${form.type}`, // Tiulo
                form.date,
                form.responsible,
                'petar', // Explicit type for folder routing
                'seguridad',
                form.location
            );

            setFile({ url, name: selectedFile.name });
            alert("✅ Archivo PDF subido correctamente.");
        } catch (error: any) {
            console.error(error);
            alert(`Error al subir: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.responsible || !form.location || !form.date) {
            alert("Por favor completa todos los campos del formulario.");
            return;
        }

        if (!file && !editingId) {
            alert("Es obligatorio subir el archivo PDF del PETAR firmado.");
            return;
        }

        const newRecord = {
            date: form.date,
            responsible: form.responsible,
            location: form.location,
            type: form.type,
            fileUrl: file?.url || '' // Allow empty if editing
        };

        if (editingId) {
            // UPDATE MODE
            const original = records.find(r => r.id === editingId);
            if (!file?.url && original) {
                newRecord.fileUrl = original.fileUrl;
            }

            try {
                const res = await fetch('/api/petar-records', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'update', id: editingId, data: newRecord, userName: user?.name })
                });
                const result = await res.json();

                if (result.success) {
                    setRecords(prev => prev.map(r => r.id === editingId ? { ...newRecord, id: editingId, fileUrl: newRecord.fileUrl } : r));
                    alert("✅ PETAR actualizado correctamente.");
                    cancelEdit();
                } else {
                    throw new Error(result.error || 'Error desconocido');
                }
            } catch (error: any) {
                console.error("Error updating API:", error);
                alert(`Error al actualizar: ${error.message}`);
            }

        } else {
            // CREATE MODE
            if (!file) return;

            try {
                const res = await fetch('/api/petar-records', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'create', data: newRecord, userName: user?.name })
                });
                const result = await res.json();

                if (result.success) {
                    // Add with the real ID from database
                    setRecords(prev => [{ ...newRecord, id: result.id } as PetarRecord, ...prev]);
                    setForm(prev => ({ ...prev, type: 'Caliente' }));
                    setFile(null);
                    alert("✅ PETAR registrado exitosamente.");
                } else {
                    throw new Error(result.error || 'Error desconocido');
                }
            } catch (error: any) {
                console.error("Error saving to API:", error);
                // Fallback: save locally
                const localRecord: PetarRecord = { ...newRecord, id: Date.now(), fileUrl: file.url };
                setRecords(prev => [localRecord, ...prev]);
                setForm(prev => ({ ...prev, type: 'Caliente' }));
                setFile(null);
                alert("⚠️ PETAR guardado localmente (sin conexión).");
            }
        }
    };

    const handleEdit = (record: PetarRecord) => {
        setEditingId(record.id);
        setForm({
            date: record.date,
            responsible: record.responsible,
            location: record.location,
            type: record.type
        });
        // Preserve file visual state not really needed, just allow update without file
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm({
            date: new Date().toISOString().split('T')[0],
            responsible: '',
            location: '',
            type: 'Caliente'
        });
        setFile(null);
    };

    const handleDelete = async (id: number) => {
        if (confirm("¿Estás seguro de eliminar este registro?")) {
            try {
                const res = await fetch('/api/petar-records', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'delete', id, userName: user?.name })
                });
                const result = await res.json();

                if (result.success) {
                    setRecords(prev => prev.filter(r => r.id !== id));
                } else {
                    throw new Error(result.error);
                }
            } catch (error: any) {
                console.error("Error deleting from API:", error);
                // Still remove locally
                setRecords(prev => prev.filter(r => r.id !== id));
            }
        }
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden selection:bg-emerald-500/30">
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-[1600px] mx-auto space-y-8">

                    {/* Header */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tighter mb-2 flex items-center gap-3">
                                <Clipboard className="text-orange-500" size={32} />
                                Control de PETAR
                            </h1>
                            <p className="text-slate-400 font-medium">Permisos Escritos de Trabajo de Alto Riesgo</p>
                        </div>
                        <div className="bg-slate-800/50 px-6 py-3 rounded-xl border border-slate-700 flex flex-col gap-2">
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Registros</p>
                                <p className="text-2xl font-black text-white">{records.length}</p>
                            </div>
                            <button
                                onClick={() => {
                                    const cols = [
                                        { header: 'Fecha', dataKey: 'date' },
                                        { header: 'Responsable', dataKey: 'responsible' },
                                        { header: 'Lugar', dataKey: 'location' },
                                        { header: 'Tipo', dataKey: 'type' }
                                    ];
                                    const filtered = records.filter(r => {
                                        const matchesDate = filterDate === "" || r.date === filterDate;
                                        const matchesResp = filterResponsible === "" || (r.responsible?.toLowerCase() || "").includes(filterResponsible.toLowerCase());
                                        const matchesLoc = filterLocation === "" || r.location === filterLocation;
                                        return matchesDate && matchesResp && matchesLoc;
                                    });
                                    exportTableToPDF('Control de PETAR', cols, filtered, 'Petar.pdf');
                                }}
                                className="bg-slate-700 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all border border-slate-600 justify-center"
                            >
                                <FileText size={14} /> Descargar PDF
                            </button>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                        {/* FORMULARIO */}
                        <div className="xl:col-span-1 space-y-6">
                            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-white">
                                        <Upload size={20} className="text-orange-400" /> {editingId ? 'Editar PETAR' : 'Nuevo PETAR'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-5 relative z-10">

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Fecha</label>
                                            <input
                                                type="date"
                                                value={form.date}
                                                onChange={e => setForm({ ...form, date: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-orange-500 outline-none transition-colors"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Responsable</label>
                                            <select
                                                value={form.responsible}
                                                onChange={e => setForm({ ...form, responsible: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-orange-500 outline-none transition-colors"
                                            >
                                                <option value="">Seleccionar...</option>
                                                {USER_LIST.map(u => (
                                                    <option key={u.username} value={u.name}>{u.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ubicación / Lugar</label>
                                            <select
                                                value={form.location}
                                                onChange={e => setForm({ ...form, location: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-orange-500 outline-none transition-colors"
                                            >
                                                <option value="">Seleccionar...</option>
                                                {SSOMA_LOCATIONS.map(loc => (
                                                    <option key={loc} value={loc}>{loc}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tipo de PETAR</label>
                                            <select
                                                value={form.type}
                                                // @ts-ignore
                                                onChange={e => setForm({ ...form, type: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-orange-500 outline-none transition-colors"
                                            >
                                                {PETAR_TYPES.map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2 pt-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Archivo PETAR (PDF)</label>
                                            <div className="relative group">
                                                <input
                                                    type="file"
                                                    accept=".pdf"
                                                    onChange={handleFileUpload}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                />
                                                <div className={`border-2 border-dashed ${file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 hover:bg-slate-800/50'} rounded-xl p-6 text-center transition-all duration-300`}>
                                                    <div className="flex flex-col items-center gap-3">
                                                        {isUploading ? (
                                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                                                        ) : file ? (
                                                            <div className="bg-emerald-500/20 p-3 rounded-full relative">
                                                                <FileText className="text-emerald-400" size={24} />
                                                                <CheckCircle2 size={12} className="absolute -top-1 -right-1 text-emerald-400 bg-slate-900 rounded-full" />
                                                            </div>
                                                        ) : (
                                                            <div className="bg-slate-800 p-3 rounded-full group-hover:bg-slate-700 transition-colors">
                                                                <Upload className="text-slate-400 group-hover:text-white" size={24} />
                                                            </div>
                                                        )}

                                                        <div className="space-y-1">
                                                            <p className={`text-xs font-bold ${file ? 'text-emerald-400' : 'text-slate-300'}`}>
                                                                {isUploading ? "Subiendo..." : (file ? "Archivo seleccionado" : (editingId ? "Subir NUEVO archivo (Opcional)" : "Click para subir PDF"))}
                                                            </p>
                                                            {file && <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{file.name}</p>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isUploading}
                                            className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
                                        >
                                            <Save size={18} /> {editingId ? 'Actualizar PETAR' : 'Registrar PETAR'}
                                        </button>

                                        {editingId && (
                                            <button
                                                type="button"
                                                onClick={cancelEdit}
                                                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-all uppercase tracking-wide text-xs"
                                            >
                                                Cancelar Edición
                                            </button>
                                        )}

                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                        {/* HISTORIAL */}
                        <div className="xl:col-span-2 space-y-6">
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden min-h-[500px]">
                                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                    <Activity className="text-blue-500" size={20} /> Rastro de Registros
                                </h3>

                                {/* RESUMEN MENSUAL */}
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'].map((m, i) => {
                                        const count = records.filter(r => {
                                            const d = new Date(r.date + 'T00:00:00');
                                            return d.getMonth() === i;
                                        }).length;
                                        return (
                                            <div key={m} className={`flex flex-col items-center justify-center min-w-[42px] py-1.5 rounded-xl border ${count > 0 ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-slate-950 border-slate-800 text-slate-600 opacity-50'}`}>
                                                <span className="text-[7px] font-black uppercase tracking-tighter">{m}</span>
                                                <span className="text-[9px] font-black">{count}</span>
                                            </div>
                                        );
                                    })}
                                    <div className="flex flex-col items-center justify-center min-w-[60px] py-1.5 rounded-xl border bg-blue-500/10 border-blue-500/30 text-blue-400 ml-auto">
                                        <span className="text-[7px] font-black uppercase tracking-tighter">TOTAL</span>
                                        <span className="text-[9px] font-black">{records.length}</span>
                                    </div>
                                </div>

                                {/* FILTERS */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-slate-800/30 p-4 rounded-xl border border-slate-800/50 items-end">
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Fecha</label>
                                            {filterDate && (
                                                <button onClick={() => setFilterDate("")} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="date"
                                            value={filterDate}
                                            onChange={e => setFilterDate(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-orange-500 outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Responsable</label>
                                            {filterResponsible && (
                                                <button onClick={() => setFilterResponsible("")} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <SearchableSelect 
                                            options={RESPONSIBLES}
                                            value={filterResponsible}
                                            onChange={(val) => setFilterResponsible(val)}
                                            placeholder="Todos los responsables..."
                                            className="[&>div]:bg-slate-950 [&>div]:border-slate-700 [&>div]:py-1.5 [&>div]:px-3 [&>div]:text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Lugar</label>
                                            {filterLocation && (
                                                <button onClick={() => setFilterLocation("")} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <SearchableSelect 
                                            options={SSOMA_LOCATIONS}
                                            value={filterLocation}
                                            onChange={(val) => setFilterLocation(val)}
                                            placeholder="Todos los lugares..."
                                            className="[&>div]:bg-slate-950 [&>div]:border-slate-700 [&>div]:py-1.5 [&>div]:px-3 [&>div]:text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1 flex flex-col justify-end h-[53px]">
                                        <button 
                                            onClick={() => { setFilterDate(""); setFilterResponsible(""); setFilterLocation(""); }}
                                            className={`w-full h-[33px] rounded-lg text-[10px] font-bold uppercase transition-all border flex items-center justify-center gap-2 active:scale-95 ${
                                                (filterDate || filterResponsible || filterLocation)
                                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 shadow-lg shadow-red-950/20'
                                                : 'bg-slate-800/50 text-slate-500 border-slate-800 cursor-not-allowed opacity-50'
                                            }`}
                                            disabled={!(filterDate || filterResponsible || filterLocation)}
                                        >
                                            <RotateCcw size={12} strokeWidth={3} /> Limpiar Filtros
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-[10px] uppercase font-black text-slate-500 border-b border-slate-800">
                                                <th className="pb-4 pl-4">Fecha</th>
                                                <th className="pb-4">Responsable</th>
                                                <th className="pb-4">Lugar</th>
                                                <th className="pb-4">Tipo</th>
                                                <th className="pb-4 text-center">Archivo</th>
                                                <th className="pb-4 text-right pr-4">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {records.filter(r => {
                                                const matchesDate = filterDate === "" || r.date === filterDate;
                                                const matchesResp = filterResponsible === "" || (r.responsible?.toLowerCase() || "").includes(filterResponsible.toLowerCase());
                                                const matchesLoc = filterLocation === "" || r.location === filterLocation;
                                                return matchesDate && matchesResp && matchesLoc;
                                            }).length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="py-12 text-center text-slate-500 italic">
                                                        {records.length === 0 ? "No hay registros de PETAR aún." : "No se encontraron registros con los filtros aplicados."}
                                                    </td>
                                                </tr>
                                            ) : (
                                                records
                                                    .filter(r => {
                                                        const matchesDate = filterDate === "" || r.date === filterDate;
                                                        const matchesResp = filterResponsible === "" || (r.responsible?.toLowerCase() || "").includes(filterResponsible.toLowerCase());
                                                        const matchesLoc = filterLocation === "" || r.location === filterLocation;
                                                        return matchesDate && matchesResp && matchesLoc;
                                                    })
                                                    .map((record) => (
                                                    <tr key={record.id} className="hover:bg-slate-800/30 transition-colors group text-sm">
                                                        <td className="py-4 pl-4 font-mono text-slate-300">{record.date}</td>
                                                        <td className="py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                                    {getInitials(record.responsible)}
                                                                </div>
                                                                <span className="text-slate-300 font-medium truncate max-w-[150px]" title={record.responsible}>
                                                                    {record.responsible}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 text-slate-400">{record.location}</td>
                                                        <td className="py-4">
                                                            <span className="bg-orange-950/40 text-orange-300 px-2 py-1 rounded text-xs font-bold border border-orange-500/20">
                                                                {record.type}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 text-center">
                                                            <a
                                                                href={record.fileUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 text-slate-400 hover:text-orange-400 transition-colors group/link"
                                                                title="Ver PDF"
                                                            >
                                                                <FileText size={14} />
                                                                <span className="text-[10px] font-mono group-hover/link:underline truncate max-w-[120px]">
                                                                    {generateFilename(
                                                                        record.type,
                                                                        record.date,
                                                                        record.responsible,
                                                                        'pdf',
                                                                        'petar',
                                                                        record.location,
                                                                        'seguridad'
                                                                    )}
                                                                </span>
                                                            </a>
                                                        </td>
                                                        <td className="py-4 text-right pr-4">
                                                            <div className="flex justify-end gap-1">
                                                                {(user?.role === 'developer' || user?.role === 'manager' || record.responsible === user?.name) && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => exportRecordToPDF('Detalle de PETAR', record, `PETAR_${record.type}.pdf`)}
                                                                            className="text-slate-500 hover:text-orange-400 p-2 hover:bg-orange-500/10 rounded-lg transition-colors"
                                                                            title="Descargar PDF"
                                                                        >
                                                                            <DownloadCloud size={16} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleEdit(record)}
                                                                            className="text-slate-500 hover:text-blue-400 p-2 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                                            title="Editar"
                                                                        >
                                                                            <Pencil size={16} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDelete(record.id)}
                                                                            className="text-slate-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                                                            title="Eliminar"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </>
                                                                )}
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
                </div>
            </main>
        </div>
    );
}

