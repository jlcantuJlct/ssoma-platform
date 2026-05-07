"use client";

import { useState, useEffect, useRef } from "react";
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
    Filter,
    CheckCircle2,
    Edit2,
    ChevronLeft,
    ChevronRight,
    ExternalLink
} from "lucide-react";
import { generateFilename, getDriveViewerUrl, getInitials } from '@/lib/utils';
import jsPDF from 'jspdf';
import { uploadEvidence } from "@/lib/uploadClient";
import { SSOMA_LOCATIONS } from "@/lib/locations";
import { useAuth } from "@/lib/auth";
import { PMA_CATEGORIES, PMACategory, RESPONSIBLES, ALL_RESPONSIBLES } from "@/lib/categories";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

// --- TYPES ---
type PMAEvidenceRecord = {
    id: number;
    date: string;
    responsible: string;
    category: string;
    description: string;
    location: string;
    images: string[];
};

const MIGRATION_MAP: Record<string, string> = {
    "SIGNAGE_PERIMETERS": "DELIMITATION_AREAS",
    "WASTE_RRSS_STATION": "WASTE_CONTAINERS",
    "SIGNAGE_MA": "SIGNAGE_MA",
    "ACCESS_MAINTENANCE": "DUST_WATERING",
    "DUST_IRRIGATION": "DUST_WATERING",
    "WASTE_SPILL_KIT": "SPILL_KIT",
    "WELLBEING_DINING": "W_DINING_CLEAN",
    "OPS_PPE_ARNES": "SST_PPE_USE",
    "WELLBEING_HYDRATION": "W_HYDRATION",
    "WELLBEING_CLEANING": "W_BATHROOMS",
    "WELLBEING_HANDWASH": "W_HANDWASH",
    "OPS_LOCKOUT": "SST_AST_REVIEW",
    "COMM_INFO_PANEL": "SOCIAL_SUGGESTION_BOX",
    "SIGNAGE_SST": "SST_SIGNAGE",
    "WASTE_SEGREGATION": "WASTE_CONTAINERS",
    "OPS_PPE_TAPONES": "SST_PPE_USE",
    "SST_EMERGENCY_STATION": "SST_EMERGENCY_STATION",
    "SST_EMERGENCY_VEHICLE": "SST_EMERGENCY_VEHICLE",
    "OPS_PPE_DELIVERY": "SST_PPE_DELIVERY",
    "WELLBEING_BATHROOMS": "W_BATHROOMS",
    "PORTABLE_TOILETS": "W_BATHROOMS",
    "WELLBEING_SHOWERS": "W_SHOWERS",
    "WELLBEING_DINING_CLEAN": "W_DINING_CLEAN",
    "BAÑOS_Y_LIMPIEZA": "W_BATHROOMS",
    "CLEANING": "W_DINING_CLEAN",
    "HYGIENE": "W_BATHROOMS"
};

export default function PMAPage() {
    const { user } = useAuth();

    // --- STATE ---
    const [records, setRecords] = useState<PMAEvidenceRecord[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);


    // Form State
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('es-PE', { hour12: false }),
        responsible: '',
        category: '',
        description: '',
        location: ''
    });
    const [images, setImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Table Filter State
    const [filterDate, setFilterDate] = useState("");
    const [filterResponsible, setFilterResponsible] = useState("");
    const [filterLocation, setFilterLocation] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    
    // Categories from static list (Independent from Annual Program as requested)
    const [pmaCategories, setPmaCategories] = useState<PMACategory[]>(PMA_CATEGORIES);



    // --- EFFECT: LOAD/SAVE ---
    useEffect(() => {
        const init = async () => {
            // 1. Load stored records first
            const stored = localStorage.getItem('pma_evidence_records');
            let initialRecords: PMAEvidenceRecord[] = [];
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) {
                        initialRecords = parsed.filter(r => r && typeof r === 'object').map(r => ({
                            ...r,
                            category: MIGRATION_MAP[r.category] || r.category
                        }));
                    }
                    setRecords(initialRecords);
                } catch (e) {
                    console.error("Error parsing pma_evidence_records", e);
                }
            }

            // 2. Fetch from cloud
            try {
                const res = await fetch('/api/pma-records');
                const data = await res.json();
                if (data.success && data.records.length > 0) {
                    const mapped = data.records.map((r: any) => {
                        let parsedImages = [];
                        try {
                            parsedImages = typeof r.images === 'string' ? JSON.parse(r.images) : (r.images || []);
                        } catch (e) {
                            console.warn("Could not parse images for record", r.id, e);
                            parsedImages = [];
                        }
                        return {
                            id: Number(r.id) || Number(r.record_id),
                            date: r.date,
                            responsible: r.responsible,
                            category: MIGRATION_MAP[r.category] || r.category,
                            description: r.description,
                            location: r.location || '',
                            images: Array.isArray(parsedImages) ? parsedImages : []
                        };
                    });

                    // Deduplicate and merge: prefer cloud data but keep unique local ones
                    const merged = [...mapped];
                    // Create a set of content keys from cloud records
                    const getRecordKey = (r: any) => {
                        if (!r) return 'invalid';
                        const imgs = Array.isArray(r.images) ? r.images : [];
                        return `${r.date || ''}|${r.responsible || ''}|${r.category || ''}|${r.location || ''}|${imgs.length}`;
                    };
                    const cloudKeys = new Set(mapped.map(getRecordKey));
                    
                    initialRecords.forEach(r => {
                        if (!r || typeof r !== 'object') return; // Skip invalid records
                        const key = getRecordKey(r);
                        if (key !== 'invalid' && !cloudKeys.has(key)) {
                            merged.push(r);
                        }
                    });

                    // Final deduplication by content key
                    const finalRecords = Array.from(new Map(
                        merged
                            .filter(r => r && typeof r === 'object')
                            .map(r => [getRecordKey(r), r])
                    ).values());

                    const sorted = finalRecords.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
                    setRecords(sorted);
                    localStorage.setItem('pma_evidence_records', JSON.stringify(sorted));
                }
            } catch (e) {
                console.warn('Could not fetch PMA records from cloud:', e);
            } finally {
                setIsLoaded(true);
            }
        };

        init();
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('pma_evidence_records', JSON.stringify(records));
            // Sync to cloud
            setIsSyncing(true);
            fetch('/api/pma-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records, userName: user?.name })
            })
                .catch(e => console.warn('PMA cloud sync failed:', e))
                .finally(() => setIsSyncing(false));
        }
    }, [records, isLoaded]);

    // --- HANDLERS ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        // Validar datos antes de subir
        if (!form.responsible || !form.location || !form.category) {
            alert("⚠️ Por favor completa Responsable, Lugar y Categoría antes de subir archivos.\n\nEsto asegura que los archivos se guarden con el nombre correcto.");
            e.target.value = '';
            return;
        }

        // Validar límite total de 9 archivos
        if (images.length + files.length > 9) {
            alert(`Solo puedes cargar hasta 9 archivos por registro. Actualmente tienes ${images.length} y elegiste ${files.length}.`);
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
                    catLabel
                );
                uploadedUrls.push(url);
            }

            setImages(prev => [...prev, ...uploadedUrls]);
            alert(`✅ Se subieron ${uploadedUrls.length} archivos con éxito.`);
        } catch (error: any) {
            alert(`Error al subir: ${error.message}`);
        } finally {
            setIsUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const removeFile = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };
    
    const handleEdit = (record: PMAEvidenceRecord) => {
        const [datePart, timePart] = (record.date || "").split(" ");
        setEditingId(record.id);
        const rawCat = record.category?.trim?.() || record.category;
        setForm({
            date: datePart || record.date,
            time: timePart || "00:00:00",
            responsible: record.responsible,
            category: MIGRATION_MAP[rawCat] || rawCat,
            description: record.description || '',
            location: record.location || ''
        });
        setImages(record.images || []);
        // Scroll suave al formulario
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm({
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('es-PE', { hour12: false }),
            responsible: '',
            category: '',
            description: '',
            location: ''
        });
        setImages([]);
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
            alert("Debe subir al menos un archivo (PDF o Imagen) como evidencia.");
            return;
        }

        if (editingId) {
            // MODO EDICIÓN
            setRecords(prev => prev.map(r => r.id === editingId ? {
                ...r,
                date: `${form.date} ${form.time}`,
                responsible: form.responsible,
                category: form.category,
                description: form.description,
                location: form.location,
                images: images
            } : r));
            setEditingId(null);
            alert("✅ Registro actualizado correctamente.");
        } else {
            // MODO NUEVO
            const newRecord: PMAEvidenceRecord = {
                id: Date.now(),
                date: `${form.date} ${form.time}`,
                responsible: form.responsible,
                category: form.category,
                description: form.description,
                location: form.location,
                images: images
            };
            setRecords(prev => [newRecord, ...prev]);
            alert("Evidencia PMA registrada exitosamente.");
        }

        // Reset
        setForm(prev => ({ 
            ...prev, 
            category: '', 
            description: '', 
            location: '',
            time: new Date().toLocaleTimeString('es-PE', { hour12: false }) 
        }));
        setImages([]);
    };

    const nextImage = () => {
        setCurrentImageIndex(prev => (prev + 1) % selectedImages.length);
    };

    const prevImage = () => {
        setCurrentImageIndex(prev => (prev - 1 + selectedImages.length) % selectedImages.length);
    };

    // Keyboard support for gallery
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedImages.length === 0) return;
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
            if (e.key === 'Escape') setSelectedImages([]);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImages]);

    // --- HELPERS ---
    const getFormattedData = (record: PMAEvidenceRecord) => {
        const categoryTranslations: Record<string, string> = {
            "WASTE_SEGREGATION": "Segregación de Residuos",
            "CLEANING": "Limpieza y Desinfección",
            "HYGIENE": "Higiene y Bienestar",
            "BAÑOS_Y_LIMPIEZA": "Baños y Limpieza",
            "W_BATHROOMS": "Baños y Limpieza",
            "WASTE_CONTAINERS": "Contenedores de Residuos",
            "SST_PPE_USE": "Uso de EPP",
            "OPS_PPE_TAPONES": "Uso de EPP",
            "OPS_PPE_DELIVERY": "Entrega de EPP",
            "WELLBEING_BATHROOMS": "Baños y Limpieza",
            "SIGNAGE_PERIMETERS": "Delimitación de las áreas y perimetro",
            "WELLBEING_HANDWASH": "Lavamanos",
            "WELLBEING_SHOWERS": "Duchas",
            "WELLBEING_HYDRATION": "Punto de Hidratación",
            "WELLBEING_DINING_CLEAN": "Limpieza de Comedor",
            "WASTE_TRANSPORT": "Recolección y transporte de los residuos",
            "WASTE_STORAGE_NP": "Centro de acopio de Residuos No peligrosos",
            "WASTE_STORAGE_P": "Centro de acopio de Residuos peligrosos",
            "WASTE_INTERNAL_COLLECT": "Recojo Interno",
            "SPILL_KIT": "Kit antiderrame",
            "SPILL_TRAY": "Uso de Bandeja antiderrames",
            "CISTERN_MESH": "Mangueras cuentan con cabezal con malla",
            "CISTERN_SPILL_KIT": "Cisterna cuenta con kit Antiderrame",
            "WATER_COURSE_PROTECT": "Vehículos no ingresan al curso de agua",
            "DUST_WATERING": "Realización de riego",
            "NOISE_SILENCER": "Maquinarias con silenciador",
            "DUST_CONTROL_SIGN": "Señal de control de polvo",
            "SIGNAGE_MA": "Señalización MA ambiental instalada",
            "SIGNAGE_PROHIBITION": "Señalización MA de prohibición",
            "SST_SIGNAGE": "Señale de SST uso de EPP",
            "SST_AST_REVIEW": "Revisión y llenado de AST",
            "SST_IPERC_DISPLAY": "Matriz IPERC en exhibición",
            "SST_EMERGENCY_STATION": "Estación de Emergencia",
            "SST_EMERGENCY_VEHICLE": "Vehículo de Emergencia",
            "SST_HEALTH_TOPIC": "Tópico y su especialista de Salud",
            "SST_PHONE_DIRECTORY": "Directorio telefónico de emergencia",
            "SOCIAL_SUGGESTION_BOX": "Buzón de Sugerencia",
            "SOCIAL_COMPLAINTS_BOOK": "Libro de Reclamos",
            "FLORA_FAUNA_TALK": "Charla sobre cuidado de la Flora y Fauna",
            "MONITORING": "Monitoreos"
        };

        const rawCat = record.category?.trim?.() || record.category || record.description;
        const officialCategory = PMA_CATEGORIES.find(c => c.id === rawCat);
        const catLabel = officialCategory ? officialCategory.label : (categoryTranslations[rawCat] || rawCat || 'S/A');

        const displayLocation = (record.location || "").replace(/Hawuay/i, "Jahuay");

        return { catLabel, displayLocation };
    };

    const handleDelete = (id: number) => {
        if (confirm("¿Está seguro de eliminar este registro?")) {
            setRecords(prev => prev.filter(r => r.id !== id));
        }
    };

    // Helper para generar nombre de archivo con categoría reducida
    const getFileName = (record: PMAEvidenceRecord) => {
        const { catLabel, displayLocation } = getFormattedData(record);
        const catShort = catLabel.split(' ').slice(0, 3).join('_').substring(0, 20).replace(/[^a-zA-Z0-9_]/g, '');
        const lugarShort = (displayLocation || 'SinLugar').replace(/\s+/g, '').substring(0, 12);
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
        const { catLabel, displayLocation } = getFormattedData(record);
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(`Fecha: ${record.date}`, 20, y);
        doc.text(`Responsable: ${record.responsible}`, 80, y);
        doc.text(`Lugar: ${displayLocation || 'No especificado'}`, 140, y);
        y += 8;

        // Category wrapping
        doc.setFont("helvetica", "bold");
        doc.text("Categoría:", 20, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        const categoryLines = doc.splitTextToSize(catLabel, 170);
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

        // Separate images and PDFs
        const imageFiles = record.images.filter(img => !img.toLowerCase().includes('.pdf'));
        const pdfFiles = record.images.filter(img => img.toLowerCase().includes('.pdf'));

        // Evidence section
        doc.setFont("helvetica", "bold");
        doc.text(`Registro de Evidencia (${record.images.length} archivos):`, 20, y);
        y += 10;

        if (pdfFiles.length > 0) {
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 255);
            pdfFiles.forEach((pdf, idx) => {
                doc.text(`Archivo PDF Adjunto: [Ver PDF ${idx + 1}]`, 25, y);
                doc.link(25, y - 4, 100, 5, { url: pdf });
                y += 6;
            });
            y += 4;
            doc.setTextColor(0);
            doc.setFontSize(10);
        }

        imageFiles.forEach((img, index) => {
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
                                    {editingId ? (
                                        <span className="flex items-center gap-1 text-[10px] bg-amber-900/50 text-amber-300 px-3 py-1 rounded-full border border-amber-700/30">
                                            <Edit2 size={10} /> MODO EDICIÓN ACTIVO
                                        </span>
                                    ) : (
                                        <Upload size={20} />
                                    )}
                                    {editingId ? 'Modificar Registro' : 'Nueva Evidencia PMA'}
                                    {isSyncing && (
                                        <span className="flex items-center gap-1 text-[8px] bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full animate-pulse border border-blue-700/30">
                                            <span className="w-1 h-1 bg-blue-400 rounded-full animate-ping"></span>
                                            SINCRONIZANDO...
                                        </span>
                                    )}
                                    {isUploading && (
                                        <span className="flex items-center gap-1 text-[8px] bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded-full animate-pulse border border-indigo-700/30">
                                            <span className="w-1 h-1 bg-indigo-400 rounded-full animate-ping"></span>
                                            SUBIENDO ARCHIVOS...
                                        </span>
                                    )}
                                </h3>

                                <form onSubmit={handleSubmit} className="space-y-5">

                                    <div className="grid grid-cols-2 gap-4">
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
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Hora (HH:MM:SS)</label>
                                            <input
                                                type="text"
                                                value={form.time}
                                                onChange={e => setForm({ ...form, time: e.target.value })}
                                                placeholder="00:00:00"
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none transition-colors font-mono"
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
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Control de Fotos PMA</label>
                                        <SearchableSelect 
                                            options={pmaCategories}
                                            value={form.category}
                                            onChange={(val) => setForm({ ...form, category: val })}
                                            placeholder="Seleccionar Actividad..."
                                            searchPlaceholder="Buscar actividad..."
                                            icon={<Leaf size={16} />}
                                        />
                                        
                                        {/* Hint Text */}
                                        {form.category && (
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg mt-1">
                                                <p className="text-[10px] text-emerald-400 font-medium">
                                                    ℹ️ {pmaCategories.find(c => c.id === form.category)?.hint}
                                                </p>
                                            </div>
                                        )}
                                    </div>


                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Archivos de Evidencia (PDF o Imagen, Max 9)</label>
                                        <div 
                                            className={`border-2 border-dashed rounded-xl p-6 transition-all text-center cursor-pointer group relative ${
                                                isDragging ? 'border-emerald-500 bg-emerald-500/20 scale-[1.02] shadow-lg shadow-emerald-500/20' : 
                                                images.length > 0 ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'
                                            }`}
                                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                            onDragLeave={() => setIsDragging(false)}
                                            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e as any); }}
                                        >
                                            <input
                                                type="file"
                                                onChange={handleFileUpload}
                                                accept="image/*,.pdf"
                                                multiple
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                                            />
                                            <div className={`flex flex-col items-center gap-2 ${isDragging || images.length > 0 ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'}`}>
                                                {isDragging ? (
                                                    <div className="animate-bounce">
                                                        <Upload size={32} />
                                                    </div>
                                                ) : images.length > 0 ? (
                                                    <CheckCircle2 size={24} className="animate-in zoom-in duration-300" />
                                                ) : (
                                                    <Upload size={24} />
                                                )}
                                                
                                                <span className="text-xs font-black uppercase tracking-widest">
                                                    {isDragging ? '¡SUELTA LOS ARCHIVOS AQUÍ!' : 
                                                     isUploading ? `CARGANDO ${images.length + 1} ARCHIVOS...` :
                                                     images.length > 0 ? `${images.length} ARCHIVOS LISTOS` : 
                                                     'ARRASTRAR O CLIC PARA SUBIR'}
                                                </span>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase">PDF e Imágenes aceptados</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* File Previews */}
                                    {images.length > 0 && (
                                        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800 max-h-40 overflow-y-auto">
                                            {images.map((img, idx) => {
                                                const isPdf = img.toLowerCase().includes('.pdf');
                                                return (
                                                    <div key={idx} className="relative aspect-square group">
                                                        {isPdf ? (
                                                            <div className="w-full h-full flex items-center justify-center bg-slate-900 border border-slate-700 rounded-md">
                                                                <FileText className="text-red-400" size={24} />
                                                            </div>
                                                        ) : (
                                                            <div className="w-full h-full rounded-md border border-slate-700 overflow-hidden relative">
                                                                <iframe 
                                                                    src={getDriveViewerUrl(img, false)} 
                                                                    title="Evidencia adjunta" 
                                                                    className="w-full h-full min-h-[150px] border-0" 
                                                                />
                                                                <div className="absolute inset-0 z-10"></div> {/* Protector para clicks */}
                                                            </div>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFile(idx)}
                                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        {editingId && (
                                            <button
                                                type="button"
                                                onClick={cancelEdit}
                                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl border border-slate-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <X size={18} /> Cancelar
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            className={`${editingId ? 'flex-[2]' : 'w-full'} bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex items-center justify-center gap-2`}
                                        >
                                            <Save size={18} /> {editingId ? 'Guardar Cambios' : 'Guardar Evidencia'}
                                        </button>
                                    </div>

                                </form>
                            </div>
                        </div>

                        {/* LISTA / HISTORIAL (TABLA) */}
                        <div className="xl:col-span-2">
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                                <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                                    <FileText size={20} className="text-blue-400" /> Rastro de Cargas
                                </h3>

                                {/* FILTERS */}
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 bg-emerald-950/10 p-4 rounded-xl border border-emerald-500/10 items-end">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Filtrar por Fecha</label>
                                        <input
                                            type="date"
                                            value={filterDate}
                                            onChange={e => setFilterDate(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-[10px] text-white focus:border-emerald-500 outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Filtrar por Responsable</label>
                                        <SearchableSelect 
                                            options={ALL_RESPONSIBLES.map(r => ({ id: r, label: r }))}
                                            value={filterResponsible}
                                            onChange={(val) => setFilterResponsible(val)}
                                            placeholder="Todos los responsables..."
                                            className="[&>div]:bg-slate-950 [&>div]:border-slate-700 [&>div]:py-1.5 [&>div]:px-3 [&>div]:text-[10px]"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Filtrar por Categoría</label>
                                        <SearchableSelect 
                                            options={pmaCategories}
                                            value={filterCategory}
                                            onChange={(val) => setFilterCategory(val)}
                                            placeholder="Todas las categorías..."
                                            className="[&>div]:bg-slate-950 [&>div]:border-slate-700 [&>div]:py-1.5 [&>div]:px-3 [&>div]:text-[10px]"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Filtrar por Lugar</label>
                                        <SearchableSelect 
                                            options={SSOMA_LOCATIONS.map(loc => ({ id: loc, label: loc }))}
                                            value={filterLocation}
                                            onChange={(val) => setFilterLocation(val)}
                                            placeholder="Todos los lugares..."
                                            className="[&>div]:bg-slate-950 [&>div]:border-slate-700 [&>div]:py-1.5 [&>div]:px-3 [&>div]:text-[10px]"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <button
                                            onClick={() => {
                                                setFilterDate("");
                                                setFilterResponsible("");
                                                setFilterCategory("");
                                                setFilterLocation("");
                                            }}
                                            className="w-full h-[33px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold uppercase transition-colors border border-slate-700 flex items-center justify-center gap-2"
                                        >
                                            <Trash2 size={12} /> Limpiar
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[900px] text-left text-sm text-slate-400">
                                        <thead className="text-[10px] uppercase font-black text-slate-500 border-b border-slate-800">
                                            <tr>
                                                <th className="pb-3 pl-2">Fecha</th>
                                                <th className="pb-3">Responsable</th>
                                                <th className="pb-3">Categoría</th>
                                                <th className="pb-3">Lugar</th>
                                                <th className="pb-3 text-center">Archivos</th>
                                                <th className="pb-3 text-center">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {(() => {
                                                const filtered = records.filter(r => {
                                                    const safeDate = String(r.date || "");
                                                    const safeLoc = String(r.location || "").toLowerCase().replace(/h/g, 'j').trim();
                                                    const safeCat = String(r.category || "");

                                                    const normFilterResp = filterResponsible.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                                                    const safeResp = String(r.responsible || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                                                    
                                                    const matchesDate = filterDate === "" || safeDate.includes(filterDate);
                                                    const matchesResp = filterResponsible === "" || 
                                                                        normFilterResp.includes(safeResp) || 
                                                                        safeResp.includes(normFilterResp);
                                                    
                                                    const normFilterLoc = (filterLocation || "").toLowerCase().replace(/h/g, 'j').trim();
                                                    const matchesLoc = filterLocation === "" || safeLoc === normFilterLoc || safeLoc.includes(normFilterLoc);
                                                    
                                                    const matchesCat = filterCategory === "" || safeCat === filterCategory || safeCat === filterCategory.trim();
                                                    return matchesDate && matchesResp && matchesLoc && matchesCat;
                                                });

                                                if (filtered.length === 0) {
                                                    return (
                                                        <tr>
                                                            <td colSpan={7} className="py-12 text-center text-slate-600 italic">
                                                                {records.length === 0 ? "No hay evidencias registradas en el rastro." : "No se encontraron registros con los filtros aplicados."}
                                                            </td>
                                                        </tr>
                                                    );
                                                }

                                                return filtered.map((record) => {
                                                    const { catLabel, displayLocation } = getFormattedData(record);
                                                    return (
                                                        <tr key={record.id} className="hover:bg-slate-800/30 transition-colors group">
                                                            <td className="py-4 pl-2 font-mono text-[10px] text-white align-top leading-tight">
                                                                {record.date.split(" ").map((part, i) => (
                                                                    <div key={i} className={i === 1 ? "text-emerald-400" : ""}>{part}</div>
                                                                ))}
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
                                                                <span className="text-[11px] text-slate-300 font-medium">{displayLocation || '-'}</span>
                                                            </td>

                                                            <td className="py-4 align-top">
                                                                <div className="flex justify-center -space-x-2">
                                                                    {Array.isArray(record.images) && record.images.slice(0, 4).map((img, i) => {
                                                                        const isPdf = img?.toLowerCase().includes('.pdf');
                                                                        return (
                                                                                <div
                                                                                    key={i}
                                                                                    className="w-8 h-8 rounded-full border-2 border-slate-900 overflow-hidden cursor-pointer hover:scale-110 hover:z-10 transition-transform bg-slate-800 flex items-center justify-center"
                                                                                    onClick={() => {
                                                                                        setSelectedImages(record.images || []);
                                                                                        setCurrentImageIndex(i);
                                                                                    }}
                                                                                >
                                                                                {isPdf ? (
                                                                                    <FileText size={14} className="text-red-400" />
                                                                                ) : (
                                                                                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 border border-slate-700 overflow-hidden">
                                                                                        <ImageIcon size={14} className="text-blue-400 mb-1" />
                                                                                        <span className="text-[7px]">FOTO</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    {Array.isArray(record.images) && record.images.length > 4 && (
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
                                                                            onClick={() => handleEdit(record)}
                                                                            className="p-1.5 bg-slate-800 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors border border-slate-700"
                                                                            title="Modificar Registro"
                                                                        >
                                                                            <Edit2 size={14} />
                                                                        </button>
                                                                        {(user?.role === 'developer' || user?.role === 'manager' || user?.name === record.responsible) && (
                                                                            <button
                                                                                onClick={() => handleDelete(record.id)}
                                                                                className="p-1.5 bg-slate-800 hover:bg-red-900/30 text-red-400 rounded-lg transition-colors border border-slate-700"
                                                                                title="Eliminar Registro"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {/* Image Preview Modal con Carrusel */}
            {selectedImages.length > 0 && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200">
                    {/* Header con contador */}
                    <div className="absolute top-4 inset-x-4 flex items-center justify-between z-50">
                        <div className="bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-black border border-emerald-500/30 flex items-center gap-2">
                            <ImageIcon size={14} />
                            FOTO {currentImageIndex + 1} DE {selectedImages.length}
                        </div>
                        <button 
                            onClick={() => setSelectedImages([])}
                            className="p-2 bg-white/10 hover:bg-red-500/20 text-white rounded-full transition-colors border border-white/20"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Navegación - Izquierda */}
                    {selectedImages.length > 1 && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); prevImage(); }}
                            className="absolute left-4 md:left-8 z-50 p-4 bg-black/40 hover:bg-emerald-500/40 text-white rounded-full transition-all border border-white/10 group"
                        >
                            <ChevronLeft size={32} className="group-hover:scale-125 transition-transform" />
                        </button>
                    )}

                    {/* Imagen Principal */}
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                        <img 
                            key={currentImageIndex} 
                            src={getDriveViewerUrl(selectedImages[currentImageIndex], true)} 
                            alt="Evidencia"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 fade-in duration-300"
                        />
                        
                        {/* Zoom/Link Controls Overlay */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-2xl z-50">
                             <a 
                                href={selectedImages[currentImageIndex]} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-white/70 hover:text-emerald-400 transition-colors text-[10px] font-bold"
                                title="Abrir original"
                            >
                                <ExternalLink size={16} /> ABRIR ORIGINAL
                            </a>
                        </div>
                    </div>

                    {/* Tira de Miniaturas (Thumbnails) */}
                    {selectedImages.length > 1 && (
                        <div className="absolute bottom-20 inset-x-0 flex justify-center gap-2 p-4 overflow-x-auto no-scrollbar">
                            <div className="flex gap-2 bg-black/40 backdrop-blur-md p-2 rounded-xl border border-white/5 shadow-2xl">
                                {selectedImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                                        className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all hover:scale-110 active:scale-95 ${
                                            currentImageIndex === idx ? 'border-emerald-500 scale-110 shadow-lg shadow-emerald-500/20' : 'border-white/10 opacity-50 hover:opacity-100'
                                        }`}
                                    >
                                        <img 
                                            src={getDriveViewerUrl(img, true)} 
                                            alt={`Miniatura ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        {currentImageIndex === idx && (
                                            <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Navegación - Derecha */}
                    {selectedImages.length > 1 && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); nextImage(); }}
                            className="absolute right-4 md:right-8 z-50 p-4 bg-black/40 hover:bg-emerald-500/40 text-white rounded-full transition-all border border-white/10 group"
                        >
                            <ChevronRight size={32} className="group-hover:scale-125 transition-transform" />
                        </button>
                    )}

                    <div className="absolute bottom-4 text-white/30 text-[9px] font-black tracking-[0.3em] uppercase pointer-events-none">
                        Usa las flechas ← → para navegar · ESC para cerrar
                    </div>
                </div>
            )}
        </div>
    );
}
