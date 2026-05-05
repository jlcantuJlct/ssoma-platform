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
    Users,
    Image as ImageIcon,
    CheckCircle2
} from "lucide-react";
import { generateFilename, getInitials } from "@/lib/utils";

// --- TYPES ---
type BrigadistaRecord = {
    id: number;
    date: string;
    responsible: string;
    brigadistaType: string;
    location: string;
    fileUrl: string; // Will store multiple URLs joined by '|'
};

// REMOVED STATIC TYPES - Now fetched from Annual Program SEG 06


export default function BrigadistasPage() {
    const { user } = useAuth();

    // STATE
    const [records, setRecords] = useState<BrigadistaRecord[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        responsible: '',
        brigadistaType: '',
        location: ''
    });

    const [uploadedFiles, setUploadedFiles] = useState<{ url: string, name: string, type: string }[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Filter State
    const [filterDate, setFilterDate] = useState("");
    const [filterResponsible, setFilterResponsible] = useState("");
    const [filterLocation, setFilterLocation] = useState("");

    const [brigadeTypes, setBrigadeTypes] = useState<string[]>([]);

    // LOAD DYNAMIC TYPES FROM ANNUAL PROGRAM (SEG 06 - Brigadistas)
    useEffect(() => {
        const loadTypes = async () => {
            try {
                const res = await fetch('/api/annual-program');
                const data = await res.json();
                if (data.success && data.programData['obj11']) {
                    const items = data.programData['obj11'] as any[];
                    const uniqueTypes = Array.from(new Set(items.map(i => i.description))).filter(Boolean);
                    if (uniqueTypes.length > 0) {
                        setBrigadeTypes(uniqueTypes);
                        if (!form.brigadistaType) setForm(prev => ({ ...prev, brigadistaType: uniqueTypes[0] }));
                    }
                    else {
                        // Fallback defaults if program is empty
                        setBrigadeTypes(["Contra Incendio", "Primeros Auxilios", "Evacuación y Rescate", "Materiales Peligrosos", "Comunicaciones"]);
                    }
                }
            } catch (e) {
                console.error("Error fetching annual program types for Brigadistas:", e);
            }
        };
        loadTypes();
    }, []);

    // LOAD RECORDS
    useEffect(() => {
        const loadRecords = async () => {
            try {
                const res = await fetch('/api/brigadista-records');
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

    const handleFiles = async (selectedFiles: FileList | File[]) => {
        const filesArray = Array.from(selectedFiles);
        if (filesArray.length === 0) return;

        // Validaciones previas
        const validFiles = filesArray.filter(f => {
            const isPdf = f.type === 'application/pdf';
            const isImage = f.type.startsWith('image/');
            return isPdf || isImage;
        });

        if (validFiles.length !== filesArray.length) {
            alert("⚠️ Algunos archivos fueron omitidos. Solo se permiten PDF e Imágenes.");
        }

        if (validFiles.length === 0) return;

        if (!form.responsible || !form.location || !form.brigadistaType) {
            alert("⚠️ Por favor completa los campos del formulario antes de subir archivos.");
            return;
        }

        setIsUploading(true);
        try {
            const newUploads = await Promise.all(validFiles.map(async (file) => {
                const url = await uploadEvidence(
                    file,
                    'Actividad',
                    `Brigada-${form.brigadistaType}-${form.location}`,
                    form.date,
                    form.responsible,
                    'brigadista',
                    'seguridad',
                    form.location
                );
                return { url, name: file.name, type: file.type };
            }));

            setUploadedFiles(prev => [...prev, ...newUploads]);
        } catch (error: any) {
            console.error(error);
            alert(`Error al subir algunos archivos: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) handleFiles(e.target.files);
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
        if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.responsible || !form.location || !form.date || !form.brigadistaType) {
            alert("Por favor completa todos los campos del formulario.");
            return;
        }

        if (uploadedFiles.length === 0 && !editingId) {
            alert("Es obligatorio subir al menos una evidencia (Imagen o PDF).");
            return;
        }

        const joinedUrls = uploadedFiles.map(f => f.url).join('|');

        const payload = {
            date: form.date,
            responsible: form.responsible,
            brigadistaType: form.brigadistaType,
            location: form.location,
            fileUrl: joinedUrls
        };

        try {
            const res = await fetch('/api/brigadista-records', {
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
                    alert("✅ Actividad de brigada registrada.");
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
            brigadistaType: '',
            location: ''
        });
        setUploadedFiles([]);
    };

    const handleEdit = (record: BrigadistaRecord) => {
        setEditingId(record.id);
        setForm({
            date: record.date,
            responsible: record.responsible,
            brigadistaType: record.brigadistaType,
            location: record.location
        });
        
        // Parse current URLs
        if (record.fileUrl) {
            const urls = record.fileUrl.split('|').filter(Boolean);
            setUploadedFiles(urls.map(url => ({ 
                url, 
                name: url.split('/').pop() || 'archivo', 
                type: url.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg' 
            })));
        } else {
            setUploadedFiles([]);
        }
        
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Eliminar este registro?")) return;
        try {
            const res = await fetch('/api/brigadista-records', {
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
        <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden selection:bg-red-500/30 w-full">
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-[1600px] mx-auto space-y-8">
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tighter mb-2 flex items-center gap-3">
                                <Users className="text-red-500" size={32} />
                                Control de Brigadistas
                            </h1>
                            <p className="text-slate-400 font-medium">Gestión y Seguimiento de Brigadas de Emergencia</p>
                        </div>
                        <div className="bg-slate-800/50 px-6 py-3 rounded-xl border border-slate-700">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Actividades</p>
                            <p className="text-2xl font-black text-white">{records.length}</p>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* FORM */}
                        <div className="xl:col-span-1 space-y-6">
                            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-white uppercase text-sm tracking-widest font-black">
                                        <Upload size={18} className="text-red-400" /> {editingId ? 'Editar Brigada' : 'Nueva Actividad'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Fecha</label>
                                            <input
                                                type="date"
                                                value={form.date}
                                                onChange={e => setForm({ ...form, date: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none transition-colors"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Responsable</label>
                                            <select
                                                value={form.responsible}
                                                onChange={e => setForm({ ...form, responsible: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none transition-colors"
                                            >
                                                <option value="">Seleccionar...</option>
                                                {USER_LIST.map(u => <option key={u.username} value={u.name}>{u.name}</option>)}
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Tipo de Brigada / Actividad</label>
                                            <select
                                                value={form.brigadistaType}
                                                onChange={e => setForm({ ...form, brigadistaType: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none transition-colors"
                                            >
                                                <option value="">Seleccionar tipo...</option>
                                                {brigadeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Zona / Lugar</label>
                                            <select
                                                value={form.location}
                                                onChange={e => setForm({ ...form, location: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none transition-colors"
                                            >
                                                <option value="">Seleccionar lugar...</option>
                                                {SSOMA_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                            </select>
                                        </div>

                                        {/* DRAG & DROP AREA */}
                                        <div className="space-y-1 pt-2">
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Evidencias ({uploadedFiles.length})</label>
                                                <div className="flex gap-2 text-[9px] font-bold">
                                                    <span className="text-red-400">PDF: {uploadedFiles.filter(f => f.type === 'application/pdf').length}</span>
                                                    <span className="text-teal-400">IMG: {uploadedFiles.filter(f => f.type.startsWith('image/')).length}</span>
                                                </div>
                                            </div>
                                            
                                            <div 
                                                className={`relative group border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${
                                                    dragActive ? 'border-red-500 bg-red-500/10 scale-[1.02]' : 
                                                    uploadedFiles.length > 0 ? 'border-teal-500/50 bg-teal-500/5' : 'border-slate-700 hover:bg-slate-800/50'
                                                }`}
                                                onDragEnter={handleDrag}
                                                onDragLeave={handleDrag}
                                                onDragOver={handleDrag}
                                                onDrop={handleDrop}
                                            >
                                                <input
                                                    type="file"
                                                    accept=".pdf,image/*"
                                                    onChange={handleFileInput}
                                                    multiple
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                />
                                                <div className="flex flex-col items-center gap-2">
                                                    {isUploading ? (
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                                                    ) : (
                                                        <div className="bg-slate-800 p-2 rounded-full group-hover:bg-slate-700 transition-colors">
                                                            <Upload className="text-slate-400 group-hover:text-white" size={20} />
                                                        </div>
                                                    )}
                                                    <div className="space-y-1">
                                                        <p className="text-[11px] font-bold text-slate-300">
                                                            {isUploading ? "Subiendo..." : "Agregar más archivos"}
                                                        </p>
                                                        <p className="text-[9px] text-slate-500 italic">PDF o Imágenes</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* List of uploaded files */}
                                            {uploadedFiles.length > 0 && (
                                                <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                                                    {uploadedFiles.map((f, idx) => (
                                                        <div key={idx} className="flex items-center justify-between bg-slate-950/50 p-2 rounded-lg border border-slate-800 group">
                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                {f.type.startsWith('image/') ? <ImageIcon size={14} className="text-teal-400" /> : <FileText size={14} className="text-red-400" />}
                                                                <span className="text-[10px] text-slate-400 truncate max-w-[150px]">{f.name}</span>
                                                            </div>
                                                            <button 
                                                                type="button"
                                                                onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
                                                                className="text-slate-600 hover:text-red-400 p-1"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isUploading}
                                            className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black py-4 rounded-xl shadow-lg shadow-red-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
                                        >
                                            <Save size={18} /> {editingId ? 'ACTUALIZAR REGISTRO' : 'GUARDAR ACTIVIDAD'}
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
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Activity className="text-red-500" size={20} /> Rastro de Brigadas
                                </h3>

                                {/* FILTERS */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-slate-800/30 p-4 rounded-xl border border-slate-800/50">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Filtrar Fecha</label>
                                        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Responsable</label>
                                        <input type="text" placeholder="Buscar..." value={filterResponsible} onChange={e => setFilterResponsible(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Lugar</label>
                                        <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none">
                                            <option value="">Todos...</option>
                                            {SSOMA_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-[10px] uppercase font-black text-slate-500 border-b border-slate-800">
                                                <th className="pb-4 pl-4">Fecha</th>
                                                <th className="pb-4">Tipo de Brigada</th>
                                                <th className="pb-4">Responsable</th>
                                                <th className="pb-4">Lugar</th>
                                                <th className="pb-4 text-center">Evidencia</th>
                                                <th className="pb-4 text-right pr-4">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {records.filter(r => {
                                                return (filterDate === "" || r.date === filterDate) &&
                                                       (filterResponsible === "" || r.responsible.toLowerCase().includes(filterResponsible.toLowerCase())) &&
                                                       (filterLocation === "" || r.location === filterLocation);
                                            }).map((record) => (
                                                <tr key={record.id} className="hover:bg-slate-800/30 transition-colors group text-sm">
                                                    <td className="py-4 pl-4 font-mono text-slate-300">{record.date}</td>
                                                    <td className="py-4">
                                                        <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20 uppercase">
                                                            {record.brigadistaType}
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
                                                            <div className="flex flex-col items-center gap-1">
                                                                <div className="flex justify-center gap-1">
                                                                    {record.fileUrl.split('|').slice(0, 3).map((url, i) => (
                                                                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" 
                                                                           className={`inline-flex p-1.5 rounded-lg transition-colors ${url.toLowerCase().endsWith('.pdf') ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-teal-500/10 text-teal-400 hover:bg-teal-500/20'}`}
                                                                           title={url.toLowerCase().endsWith('.pdf') ? 'Ver PDF' : 'Ver Imagen'}
                                                                        >
                                                                            {url.toLowerCase().endsWith('.pdf') ? <FileText size={12} /> : <ImageIcon size={12} />}
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                                {record.fileUrl.split('|').length > 3 && (
                                                                    <span className="text-[8px] font-black text-slate-500">+{record.fileUrl.split('|').length - 3} más</span>
                                                                )}
                                                            </div>
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
        </div>
    );
}
