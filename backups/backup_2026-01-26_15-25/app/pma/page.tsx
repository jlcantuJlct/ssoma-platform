"use client";

import { useState, useEffect } from "react";
import {
    Leaf,
    Upload,
    Trash2,
    Image as ImageIcon,
    Calendar,
    User,
    FileText,
    Eye,
    X,
    Save,
    Target,
    Filter
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import jsPDF from 'jspdf';
import { uploadEvidence, UploadContext } from "@/lib/uploadClient";
import { SSOMA_LOCATIONS } from "@/lib/locations";
import { USER_LIST } from "@/lib/auth";


// --- TYPES ---
type PMAEvidenceRecord = {
    id: number;
    date: string;
    responsible: string;
    category: string;
    description: string;
    location: string;
    images: string[]; // URLs
};

type PMACategory = {
    id: string;
    label: string;
    hint: string;
};

// --- CONSTANTS ---
const RESPONSIBLES = USER_LIST.map(user => user.name);

const DEFAULT_PMA_CATEGORIES: PMACategory[] = [
    {
        id: "ACCESS_MAINTENANCE",
        label: "Mantenimiento de Accesos (Cantera, DME, Plantas, Fuentes de Agua)",
        hint: "Debe evidenciar: Señalización, Limpieza, Delimitación y Riego."
    },
    {
        id: "PORTABLE_TOILETS",
        label: "Alquiler y Mantenimiento de Sanitarios Portátiles",
        hint: "Subir imágenes de los SSHH (hasta 9 fotos)."
    },
    {
        id: "SOLID_WASTE",
        label: "Batería de Residuos Sólidos con TPA + Reposición (10%)",
        hint: "Fotos deben mostrar: Tapas de colores, techo y piso."
    },
    {
        id: "INTERNAL_COLLECTION",
        label: "Recojo y Almacenamiento Interno",
        hint: "Evidenciar: Retiro de residuos de cilindros, carguío al camión, pesado e ingreso a acopio."
    }
];

export default function PMAPage() {
    // --- STATE ---
    const [records, setRecords] = useState<PMAEvidenceRecord[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Dynamic Categories
    const [pmaCategories, setPmaCategories] = useState<PMACategory[]>(DEFAULT_PMA_CATEGORIES);

    // Form State
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        responsible: '',
        category: '',
        description: '',
        location: ''
    });
    const [images, setImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // --- EFFECT: LOAD/SAVE ---
    useEffect(() => {
        const loadRecords = async () => {
            try {
                const res = await fetch('/api/pma-records');
                const data = await res.json();
                if (data.success && data.records.length > 0) {
                    const mapped = data.records.map((r: any) => ({
                        id: Number(r.id) || Number(r.record_id),
                        date: r.date,
                        responsible: r.responsible,
                        category: r.category,
                        description: r.description,
                        location: r.location || '',
                        images: typeof r.images === 'string' ? JSON.parse(r.images) : (r.images || [])
                    }));
                    setRecords(mapped);
                    localStorage.setItem('pma_evidence_records', JSON.stringify(mapped));
                }
            } catch (e) {
                console.warn('Could not fetch PMA records from cloud:', e);
            }
        };
        loadRecords();

        // Load stored records as fallback
        const stored = localStorage.getItem('pma_evidence_records');
        if (stored) {
            try {
                setRecords(JSON.parse(stored));
            } catch (e) {
                console.error("Error parsing pma_evidence_records", e);
            }
        }

        // Load Categories
        const storedCategories = localStorage.getItem('ssoma_pma_categories');
        if (storedCategories) {
            try {
                setPmaCategories(JSON.parse(storedCategories));
            } catch (e) {
                console.error("Error parsing ssoma_pma_categories", e);
            }
        } else {
            localStorage.setItem('ssoma_pma_categories', JSON.stringify(DEFAULT_PMA_CATEGORIES));
        }

        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('pma_evidence_records', JSON.stringify(records));
            // Sync to cloud
            setIsSyncing(true);
            fetch('/api/pma-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records })
            })
                .catch(e => console.warn('PMA cloud sync failed:', e))
                .finally(() => setIsSyncing(false));
        }
    }, [records, isLoaded]);

    // --- HANDLERS ---
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        // Validar datos antes de subir
        if (!form.responsible || !form.location || !form.category) {
            alert("⚠️ Por favor completa Responsable, Lugar y Categoría antes de subir imágenes.\n\nEsto asegura que los archivos se guarden con el nombre correcto.");
            e.target.value = '';
            return;
        }

        // Validar límite total de 9 imágenes
        if (images.length + files.length > 9) {
            alert(`Solo puedes cargar hasta 9 imágenes por registro. Actualmente tienes ${images.length} y elegiste ${files.length}.`);
            e.target.value = '';
            return;
        }

        try {
            setIsUploading(true);
            const uploadedUrls: string[] = [];
            const filesArray = Array.from(files);

            // Generar nombre con categoría reducida
            const catLabel = pmaCategories.find(c => c.id === form.category)?.label || form.category || 'Evidencia';
            const catShort = catLabel.split(' ').slice(0, 3).join('_').substring(0, 20).replace(/[^a-zA-Z0-9_]/g, '');
            const descWithCat = `${catShort}_${form.location?.replace(/\s+/g, '').substring(0, 12) || 'SinLugar'}`;

            for (const file of filesArray) {
                const url = await uploadEvidence(
                    file,
                    'PMA',
                    descWithCat,
                    form.date,
                    form.responsible,
                    'pma',
                    'medio_ambiente',
                    form.location,
                    catLabel // Usamos el 9no arg (objective) para pasar el Nombre de la Categoría
                );
                uploadedUrls.push(url);
            }

            setImages(prev => [...prev, ...uploadedUrls]);
            alert(`✅ Se subieron ${uploadedUrls.length} imágenes con éxito.`);
        } catch (error: any) {
            alert(`Error al subir: ${error.message}`);
        } finally {
            setIsUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isUploading) {
            alert("⏳ Por favor espere a que termine de subir las imágenes...");
            return;
        }

        if (!form.responsible || !form.category || !form.location) {
            alert("Por favor complete Responsable, Categoría y Lugar.");
            return;
        }

        if (images.length === 0) {
            alert("Debe subir al menos una imagen como evidencia.");
            return;
        }

        const newRecord: PMAEvidenceRecord = {
            id: Date.now(),
            date: form.date,
            responsible: form.responsible,
            category: form.category,
            description: form.description,
            location: form.location,
            images: images
        };

        setRecords(prev => [newRecord, ...prev]);

        // Reset
        setForm(prev => ({ ...prev, category: '', description: '', location: '' }));
        setImages([]);
        alert("Evidencia PMA registrada exitosamente.");
    };

    const handleDelete = (id: number) => {
        if (confirm("¿Está seguro de eliminar este registro?")) {
            setRecords(prev => prev.filter(r => r.id !== id));
        }
    };

    // Helper para generar nombre de archivo con categoría reducida
    const getFileName = (record: PMAEvidenceRecord) => {
        const catLabel = pmaCategories.find(c => c.id === record.category)?.label || record.category;
        // Reducir categoría: tomar primeras 3 palabras y max 20 chars
        const catShort = catLabel.split(' ').slice(0, 3).join('_').substring(0, 20).replace(/[^a-zA-Z0-9_]/g, '');
        const lugarShort = (record.location || 'SinLugar').replace(/\s+/g, '').substring(0, 12);
        return `PMA_${catShort}_${lugarShort}_${record.date}`;
    };

    const generatePDF = (record: PMAEvidenceRecord) => {
        const doc = new jsPDF();
        let y = 20;

        // Header
        doc.setFontSize(16);
        doc.setTextColor(0, 100, 0); // Verde oscuro
        doc.text("REPORTE DE EVIDENCIA PMA", 105, y, { align: 'center' });
        y += 15;

        // Info
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(`Fecha: ${record.date}`, 20, y);
        doc.text(`Responsable: ${record.responsible}`, 80, y);
        doc.text(`Lugar: ${record.location || 'No especificado'}`, 140, y);
        y += 8;

        // Category wrapping
        doc.setFont("helvetica", "bold");
        doc.text("Categoría:", 20, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        const categoryLines = doc.splitTextToSize(pmaCategories.find(c => c.id === record.category)?.label || record.category, 170);
        doc.text(categoryLines, 20, y);
        y += (categoryLines.length * 5) + 5;

        if (record.description) {
            doc.setFont("helvetica", "bold");
            doc.text("Observaciones:", 20, y);
            y += 5;
            doc.setFont("helvetica", "normal");
            const descLines = doc.splitTextToSize(record.description, 170);
            doc.text(descLines, 20, y);
            y += (descLines.length * 5) + 5;
        }

        // Images
        doc.setFont("helvetica", "bold");
        doc.text(`Evidencia Fotográfica (${record.images.length} imágenes):`, 20, y);
        y += 10;

        record.images.forEach((img, index) => {
            if (y > 230) {
                doc.addPage();
                y = 20;
            }
            try {
                // Add Image (fit to width 170, keep aspect ratio approx)
                doc.addImage(img, 'JPEG', 20, y, 170, 100);
                y += 110;
            } catch (err) {
                // Ignore invalid images
            }
        });

        doc.save(`${getFileName(record)}.pdf`);
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-[1600px] mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tighter mb-2 flex items-center gap-3">
                                <Leaf className="text-emerald-500" size={32} />
                                Evidencias del PMA
                            </h1>
                            <p className="text-slate-400 font-medium">Plan de Manejo Ambiental - Registro Fotográfico</p>
                        </div>
                        <div className="bg-slate-800/50 px-6 py-3 rounded-xl border border-slate-700">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Registros Totales</p>
                            <p className="text-2xl font-black text-white">{records.length}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                        {/* FORMULARIO */}
                        <div className="xl:col-span-1">
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl sticky top-6">
                                <h3 className="text-emerald-400 font-bold text-lg mb-6 flex flex-wrap items-center gap-2">
                                    <Upload size={20} />
                                    Nueva Evidencia PMA
                                    {isSyncing && (
                                        <span className="flex items-center gap-1 text-[8px] bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full animate-pulse border border-blue-700/30">
                                            <span className="w-1 h-1 bg-blue-400 rounded-full animate-ping"></span>
                                            SINCRONIZANDO...
                                        </span>
                                    )}
                                    {isUploading && (
                                        <span className="flex items-center gap-1 text-[8px] bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded-full animate-pulse border border-indigo-700/30">
                                            <span className="w-1 h-1 bg-indigo-400 rounded-full animate-ping"></span>
                                            SUBIENDO IMÁGENES...
                                        </span>
                                    )}
                                </h3>

                                <form onSubmit={handleSubmit} className="space-y-5">

                                    {/* Fecha */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Fecha</label>
                                        <div className="relative group">
                                            <Calendar className="absolute left-3 top-2.5 text-slate-500" size={16} />
                                            <input
                                                type="date"
                                                value={form.date}
                                                onChange={e => setForm({ ...form, date: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-white text-sm focus:border-emerald-500 outline-none transition-colors"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Responsable */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Responsable</label>
                                        <div className="relative group">
                                            <User className="absolute left-3 top-2.5 text-slate-500" size={16} />
                                            <select
                                                value={form.responsible}
                                                onChange={e => setForm({ ...form, responsible: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-white text-sm focus:border-emerald-500 outline-none appearance-none transition-colors"
                                                required
                                            >
                                                <option value="">Seleccionar Responsable...</option>
                                                {RESPONSIBLES.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Lugar / Zona */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-emerald-400 uppercase flex items-center gap-2">
                                            <Target size={14} className="text-emerald-500" />
                                            Lugar / Zona (Obligatorio)
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-3 text-emerald-500/50">
                                                <Filter size={16} />
                                            </div>
                                            <select
                                                value={form.location}
                                                onChange={e => setForm({ ...form, location: e.target.value })}
                                                className="w-full bg-slate-950 border-2 border-emerald-500/20 rounded-xl pl-10 pr-3 py-3 text-white text-sm focus:border-emerald-500 outline-none transition-all shadow-lg shadow-emerald-500/5"
                                                required
                                            >
                                                <option value="">Seleccionar Lugar...</option>
                                                {SSOMA_LOCATIONS.map(loc => (
                                                    <option key={loc} value={loc}>{loc}</option>
                                                ))}

                                            </select>
                                        </div>
                                    </div>



                                    {/* Categoría */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Categoría PMA</label>
                                        <div className="relative group">
                                            <Leaf className="absolute left-3 top-3 text-slate-500" size={16} />
                                            <select
                                                value={form.category}
                                                onChange={e => setForm({ ...form, category: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-white text-xs focus:border-emerald-500 outline-none appearance-none transition-colors truncate"
                                                required
                                            >
                                                <option value="">Seleccionar Actividad...</option>
                                                {pmaCategories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {/* Hint Text */}
                                        {form.category && (
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg mt-1">
                                                <p className="text-[10px] text-emerald-400 font-medium">
                                                    ℹ️ {pmaCategories.find(c => c.id === form.category)?.hint}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Descripción (Opcional) */}


                                    {/* Upload Images */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Imágenes de Evidencia (Max 9)</label>
                                        <div className="border-2 border-dashed border-slate-700 rounded-xl p-4 hover:bg-slate-800/50 transition-colors text-center cursor-pointer group relative">
                                            <input
                                                type="file"
                                                onChange={handleImageUpload}
                                                accept="image/*"
                                                multiple
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                                            />
                                            <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-emerald-400">
                                                <ImageIcon size={24} />
                                                <span className="text-xs font-medium">Click para agregar fotos (Máx 9 en total)</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Image Previews */}
                                    {images.length > 0 && (
                                        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800 max-h-40 overflow-y-auto">
                                            {images.map((img, idx) => (
                                                <div key={idx} className="relative aspect-square group">
                                                    <img src={img} alt={`preview-${idx}`} className="w-full h-full object-cover rounded-md border border-slate-700" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(idx)}
                                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Save size={18} /> Guardar Evidencia
                                    </button>

                                </form>
                            </div>
                        </div>

                        {/* LISTA / HISTORIAL (TABLA) */}
                        <div className="xl:col-span-2">
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                                <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                                    <FileText size={20} className="text-blue-400" />
                                    Historial de Cargas
                                </h3>

                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[900px] text-left text-sm text-slate-400">
                                        <thead className="text-[10px] uppercase font-black text-slate-500 border-b border-slate-800">
                                            <tr>
                                                <th className="pb-3 pl-2">Fecha</th>
                                                <th className="pb-3">Responsable</th>
                                                <th className="pb-3">Categoría</th>
                                                <th className="pb-3">Archivo</th>
                                                <th className="pb-3">Lugar</th>
                                                <th className="pb-3 text-center">Fotos</th>
                                                <th className="pb-3 text-center">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {records.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="py-12 text-center text-slate-600 italic">
                                                        No hay evidencias registradas en el historial.
                                                    </td>
                                                </tr>
                                            ) : (
                                                records.map((record) => {
                                                    const catLabel = pmaCategories.find(c => c.id === record.category)?.label || record.category;
                                                    return (
                                                        <tr key={record.id} className="hover:bg-slate-800/30 transition-colors group">
                                                            <td className="py-4 pl-2 font-mono text-xs text-white align-top">
                                                                {record.date}
                                                            </td>
                                                            <td className="py-4 align-top">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                                                                        {getInitials(record.responsible)}
                                                                    </div>
                                                                    <span className="text-slate-300 font-medium text-xs truncate max-w-[120px]">{record.responsible}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 align-top">
                                                                <span className="inline-block bg-slate-800 text-slate-300 px-2 py-1 rounded text-[10px] font-bold border border-slate-700 leading-tight">
                                                                    {catLabel}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 align-top">
                                                                <span className="text-[10px] text-blue-400 font-mono truncate max-w-[150px] block" title={`${getFileName(record)}.pdf`}>
                                                                    {getFileName(record)}.pdf
                                                                </span>
                                                            </td>
                                                            <td className="py-4 align-top">
                                                                <span className="text-[11px] text-slate-300 font-medium">{record.location || '-'}</span>
                                                            </td>

                                                            <td className="py-4 align-top">
                                                                <div className="flex justify-center -space-x-2">
                                                                    {record.images.slice(0, 4).map((img, i) => (
                                                                        <div
                                                                            key={i}
                                                                            className="w-8 h-8 rounded-full border-2 border-slate-900 overflow-hidden cursor-pointer hover:scale-110 hover:z-10 transition-transform bg-slate-800"
                                                                            onClick={() => setPreviewImage(img)}
                                                                        >
                                                                            <img src={img} className="w-full h-full object-cover" alt="" />
                                                                        </div>
                                                                    ))}
                                                                    {record.images.length > 4 && (
                                                                        <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-[9px] font-bold text-white z-10">
                                                                            +{record.images.length - 4}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-4 align-top">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button
                                                                        onClick={() => generatePDF(record)}
                                                                        className="p-1.5 bg-slate-800 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors border border-slate-700"
                                                                        title="Descargar Reporte PDF"
                                                                    >
                                                                        <FileText size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDelete(record.id)}
                                                                        className="p-1.5 bg-slate-800 hover:bg-red-900/30 text-red-400 rounded-lg transition-colors border border-slate-700"
                                                                        title="Eliminar Registro"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-5xl w-full flex flex-col items-center">
                        <img src={previewImage} alt="Full Preview" className="max-h-[85vh] rounded-lg shadow-2xl" />
                        <button className="absolute -top-12 right-0 text-white hover:text-red-500 transition-colors p-2 bg-black/50 rounded-full">
                            <X size={24} />
                        </button>
                        <p className="mt-4 text-slate-400 text-sm font-medium">Click fuera de la imagen para cerrar</p>
                    </div>
                </div>
            )}
        </div>
    );
}
