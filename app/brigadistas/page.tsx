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
    fileUrl: string;
};

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

    const [filterDate, setFilterDate] = useState("");
    const [filterResponsible, setFilterResponsible] = useState("");
    const [filterLocation, setFilterLocation] = useState("");

    const [brigadeTypes, setBrigadeTypes] = useState<string[]>([]);

    useEffect(() => {
        const loadTypes = async () => {
            try {
                const res = await fetch('/api/annual-program');
                const data = await res.json();
                if (data.success && data.programData['obj11']) {
                    const items = data.programData['obj11'] as any[];
                    const uniqueTypes = Array.from(new Set(items.map(i => i.description))).filter(Boolean);
                    if (uniqueTypes.length > 0) {
                        setBrigadeTypes(uniqueTypes as string[]);
                        if (!form.brigadistaType) setForm(prev => ({ ...prev, brigadistaType: (uniqueTypes[0] as string) }));
                    } else {
                        setBrigadeTypes(["Contra Incendio", "Primeros Auxilios", "Evacuación y Rescate", "Materiales Peligrosos", "Comunicaciones"]);
                    }
                }
            } catch (e) {
                console.error("Error fetching annual program types:", e);
            }
        };
        loadTypes();
    }, []);

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
                // 1. Preparar log para Excel
                const logData = {
                    control: "BRIGADISTAS",
                    periodo: form.date,
                    empresa: form.responsible,
                    detalle: `Tipo: ${form.brigadistaType}, Lugar: ${form.location}`
                };

                // 2. Subir archivo y anotar en Excel
                const url = await uploadEvidence(
                    file,
                    'Formacion',
                    `BRIG_${form.brigadistaType}_${form.location}`,
                    form.date,
                    form.responsible,
                    'Brigadistas',
                    'Seguridad',
                    form.location,
                    undefined,
                    logData // Enviar datos al Excel
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

    const handleEdit = (record: BrigadistaRecord) => {
        setEditingId(record.id);
        setForm({
            date: record.date,
            responsible: record.responsible,
            brigadistaType: record.brigadistaType,
            location: record.location
        });
        
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
        <div className="flex bg-transparent text-slate-200 font-sans overflow-hidden selection:bg-red-500/30 w-full">
            <main className="flex-1 p-4 md:p-8">
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
                        <div className="xl:col-span-1 space-y-6">
                            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative text-slate-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-white uppercase text-sm tracking-widest font-black">
                                        <Upload size={18} className="text-red-400" /> {editingId ? 'Editar Brigada' : 'Nueva Actividad'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Fecha</label>
                                            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Responsable</label>
                                            <select value={form.responsible} onChange={e => setForm({ ...form, responsible: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none">
                                                <option value="">Seleccionar...</option>
                                                {USER_LIST.map(u => <option key={u.username} value={u.name}>{u.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Tipo de Brigada / Actividad</label>
                                            <select value={form.brigadistaType} onChange={e => setForm({ ...form, brigadistaType: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none">
                                                <option value="">Seleccionar tipo...</option>
                                                {brigadeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Zona / Lugar</label>
                                            <select value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none">
                                                <option value="">Seleccionar lugar...</option>
                                                {SSOMA_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5 pt-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                                Zona de Carga (PDF o Imágenes)
                                            </label>
                                            <div 
                                                onDragOver={handleDrag}
                                                onDragLeave={handleDrag}
                                                onDrop={handleDrop}
                                                className={`relative border-2 border-dashed rounded-3xl p-8 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group ${
                                                    isUploading ? 'border-amber-500 bg-amber-500/5 cursor-wait' :
                                                    dragActive ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]' : 
                                                    uploadedFiles.length > 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/30'
                                                }`}
                                            >
                                                <input 
                                                    type="file"
                                                    multiple
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
                                                        {isUploading ? 'SUBIENDO...' : dragActive ? '¡SUELTA!' : uploadedFiles.length > 0 ? `✅ ${uploadedFiles.length} ARCHIVOS LISTOS` : 'ARRASTRA O HAZ CLIC'}
                                                    </p>
                                                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">
                                                        Soporta PDF e Imágenes
                                                    </p>
                                                </div>
                                            </div>

                                            {/* File List Previews */}
                                            {uploadedFiles.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-3">
                                                    {uploadedFiles.map((f, idx) => (
                                                        <div key={idx} className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2 animate-in zoom-in-95 group">
                                                            {f.type.startsWith('image/') ? <ImageIcon size={12} className="text-teal-400" /> : <FileText size={12} className="text-red-400" />}
                                                            <span className="text-[9px] font-bold text-slate-300 truncate max-w-[100px]">{f.name}</span>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))} 
                                                                className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button type="submit" disabled={isUploading} className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-4">
                                            <Save size={18} /> {editingId ? 'ACTUALIZAR' : 'GUARDAR'}
                                        </button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="xl:col-span-2 space-y-6">
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl min-h-[500px]">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Activity className="text-red-500" size={20} /> Rastro de Brigadas
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white" />
                                    <input type="text" placeholder="Responsable..." value={filterResponsible} onChange={e => setFilterResponsible(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white" />
                                    <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white">
                                        <option value="">Todos...</option>
                                        {SSOMA_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                    </select>
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
                                        <tbody className="divide-y divide-slate-800/50 text-sm">
                                            {records.filter(r => (filterDate === "" || r.date === filterDate) && (filterResponsible === "" || r.responsible.toLowerCase().includes(filterResponsible.toLowerCase())) && (filterLocation === "" || r.location === filterLocation)).map((record) => (
                                                <tr key={record.id} className="hover:bg-slate-800/30 transition-colors">
                                                    <td className="py-4 pl-4 font-mono">{record.date}</td>
                                                    <td className="py-4"><span className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-bold uppercase">{record.brigadistaType}</span></td>
                                                    <td className="py-4">{record.responsible}</td>
                                                    <td className="py-4 text-slate-400 text-xs">{record.location}</td>
                                                    <td className="py-4 text-center">
                                                        {record.fileUrl && (
                                                            <div className="flex flex-col items-center gap-1">
                                                                <div className="flex justify-center gap-1">
                                                                    {record.fileUrl.split('|').slice(0, 3).map((url, i) => (
                                                                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className={`p-1 rounded ${url.toLowerCase().endsWith('.pdf') ? 'text-red-400' : 'text-teal-400'}`}>
                                                                            {url.toLowerCase().endsWith('.pdf') ? <FileText size={12} /> : <ImageIcon size={12} />}
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                                {record.fileUrl.split('|').length > 3 && <span className="text-[8px] text-slate-500">+{record.fileUrl.split('|').length - 3}</span>}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-4 text-right pr-4">
                                                        <div className="flex justify-end gap-1">
                                                            {(user?.role === 'developer' || user?.role === 'manager' || user?.name === record.responsible) && (
                                                                <>
                                                                    <button onClick={() => handleEdit(record)} className="p-2 text-slate-500 hover:text-blue-400"><Pencil size={14}/></button>
                                                                    <button onClick={() => handleDelete(record.id)} className="p-2 text-slate-500 hover:text-red-400"><Trash2 size={14}/></button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
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
