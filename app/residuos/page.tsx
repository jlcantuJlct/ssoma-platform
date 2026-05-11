"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Trash2,
    Plus,
    Save,
    Calendar,
    MapPin,
    AlertTriangle,
    TrendingUp,
    BarChart,
    PieChart as PieIcon,
    ArrowDownRight,
    Scale,
    CheckCircle2,
    Upload,
    Eye,
    Edit2,
    X,
    Filter,
    RotateCcw
} from "lucide-react";
import SearchableSelect from "@/components/SearchableSelect";
import { sanitizeRecords, sanitizeValue } from "@/lib/utils";
import { 
    BarChart as RechartsBarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    PieChart as RechartsPieChart, 
    Pie, 
    Cell,
    LineChart,
    Line,
    Legend
} from 'recharts';
import { SSOMA_LOCATIONS } from "@/lib/locations";
import { useAuth } from "@/lib/auth";
import { uploadEvidence } from "@/lib/uploadClient";

// --- TYPES ---
type WasteWeightRecord = {
    id: number;
    date: string;
    wasteType: string;
    weight: number;
    location: string;
    category: 'Peligroso' | 'No Peligroso' | 'RAEE';
    files: string[];
};

const WASTE_CATEGORIES = [
    // No Peligrosos (Aprovechables)
    { id: 'metalicos', label: 'RESIDUOS METALICOS', type: 'No Peligroso', color: '#64748b', unit: 'kg' },
    { id: 'papel_carton', label: 'PAPELES Y CARTONES', type: 'No Peligroso', color: '#3b82f6', unit: 'kg' },
    { id: 'plasticos', label: 'PLASTICOS', type: 'No Peligroso', color: '#10b981', unit: 'kg' },
    { id: 'vidrio', label: 'VIDRIO', type: 'No Peligroso', color: '#06b6d4', unit: 'kg' },
    { id: 'comida', label: 'RESIDUOS DE COMIDA', type: 'No Peligroso', color: '#f59e0b', unit: 'kg' },
    { id: 'madera', label: 'RESIDUOS DE MADERA', type: 'No Peligroso', color: '#8b5cf6', unit: 'kg' },
    { id: 'no_aprovechable', label: 'RESIDUOS NO APROVECHABLE', type: 'No Peligroso', color: '#ef4444', unit: 'kg' },
    
    // Peligrosos y Especiales
    { id: 'trapos', label: 'TRAPOS INDUSTRIALES', type: 'Peligroso', color: '#991b1b', unit: 'kg' },
    { id: 'tierra', label: 'TIERRA CONTAMINADA', type: 'Peligroso', color: '#78350f', unit: 'kg' },
    { id: 'solidos_p', label: 'RESIDUOS SOLIDOS (PEL)', type: 'Peligroso', color: '#b91c1c', unit: 'kg' },
    { id: 'liquidos_p', label: 'RESIDUOS LIQUIDOS', type: 'Peligroso', color: '#1e3a8a', unit: 'cilindro' },
    { id: 'topico', label: 'RESIDUOS DE TOPICO', type: 'Peligroso', color: '#be123c', unit: 'kg' },
    { id: 'raees', label: 'RAEEs', type: 'RAEE', color: '#4d7c0f', unit: 'kg' },
];

export default function WasteManagementPage() {
    const { user } = useAuth();

    // --- STATE ---
    const [records, setRecords] = useState<WasteWeightRecord[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Form State (Multi-entry)
    const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
    const [entryLocation, setEntryLocation] = useState('');
    const [multiWeights, setMultiWeights] = useState<Record<string, string>>({});
    const [editingId, setEditingId] = useState<number | null>(null);
    
    const [filterLocation, setFilterLocation] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterWasteType, setFilterWasteType] = useState('');
    const [files, setFiles] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [previewFile, setPreviewFile] = useState<{ url: string, type: 'pdf' | 'image' } | null>(null);

    // --- EFFECT: LOAD/SAVE ---
    useEffect(() => {
        const stored = localStorage.getItem('waste_weight_records_v2');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setRecords(sanitizeRecords(parsed, ['wasteType', 'location', 'date']));
                }
            } catch (e) { console.error(e); }
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('waste_weight_records_v2', JSON.stringify(records));
        }
    }, [records, isLoaded]);

    // --- ANALYTICS & ACCUMULATION ---
    const accumulationData = useMemo(() => {
        const currentMonth = new Date().toISOString().substring(0, 7);
        const lastMonthDate = new Date();
        lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
        const lastMonth = lastMonthDate.toISOString().substring(0, 7);

        return WASTE_CATEGORIES.map(cat => {
            const catRecords = records.filter(r => r.wasteType === cat.label);
            const total = catRecords.reduce((acc, r) => acc + r.weight, 0);
            const currentMonthSum = catRecords
                .filter(r => r.date.startsWith(currentMonth))
                .reduce((acc, r) => acc + r.weight, 0);
            const lastMonthSum = catRecords
                .filter(r => r.date.startsWith(lastMonth))
                .reduce((acc, r) => acc + r.weight, 0);

            return {
                ...cat,
                currentMonthSum,
                lastMonthSum,
                total
            };
        });
    }, [records]);

    const stats = useMemo(() => {
        const totalWeight = records.reduce((acc, r) => acc + r.weight, 0);
        
        // Group weights by Month and then by Type for the Line Chart
        const monthsMap: Record<string, any> = {};
        
        records.forEach(r => {
            const month = r.date.substring(0, 7);
            if (!monthsMap[month]) {
                monthsMap[month] = { name: month };
                // Initialize all categories with 0 to avoid breaks in the line
                WASTE_CATEGORIES.forEach(cat => monthsMap[month][cat.label] = 0);
            }
            monthsMap[month][r.wasteType] = (monthsMap[month][r.wasteType] || 0) + r.weight;
        });

        const lineData = Object.values(monthsMap)
            .sort((a: any, b: any) => a.name.localeCompare(b.name))
            .slice(-12); // Show last year

        return { totalWeight, lineData };
    }, [records]);

    // --- HANDLERS ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputFiles = e.target.files;
        if (!inputFiles) return;

        if (!entryLocation) {
            alert("⚠️ Por favor selecciona el lugar antes de subir la evidencia.");
            e.target.value = '';
            return;
        }

        try {
            setIsUploading(true);
            const uploadedUrls: string[] = [];
            const filesArray = Array.from(inputFiles);

            for (const file of filesArray) {
                const url = await uploadEvidence(
                    file,
                    'PMA',
                    `PESAJE_MASIVO_${entryLocation.replace(/\s+/g, '_')}`,
                    entryDate,
                    user?.name || 'S/N',
                    'pma',
                    'medio_ambiente',
                    entryLocation,
                    'Pesaje de Residuos'
                );
                uploadedUrls.push(url);
            }

            setFiles(prev => [...prev, ...uploadedUrls]);
        } catch (error: any) {
            alert(`Error al subir: ${error.message}`);
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent, wasteTypeFilter: 'No Peligroso' | 'Peligroso') => {
        e.preventDefault();
        
        if (!entryLocation) {
            alert("⚠️ Selecciona una SEDE primero.");
            return;
        }

        if (editingId) {
            const label = Object.keys(multiWeights)[0];
            const weight = multiWeights[label];
            const cat = WASTE_CATEGORIES.find(c => c.label === label);

            setRecords(prev => prev.map(r => r.id === editingId ? {
                ...r,
                date: entryDate,
                wasteType: label,
                weight: Number(weight),
                location: entryLocation,
                category: (cat?.type as any) || 'No Peligroso',
                files: files.length > 0 ? files : r.files
            } : r));

            setEditingId(null);
            alert("Registro actualizado correctamente.");
        } else {
            const newEntries: WasteWeightRecord[] = [];
            // Filter categories relevant to this panel
            const relevantCategories = WASTE_CATEGORIES.filter(c => 
                wasteTypeFilter === 'No Peligroso' ? c.type === 'No Peligroso' : c.type !== 'No Peligroso'
            ).map(c => c.label);

            Object.entries(multiWeights).forEach(([label, weight]) => {
                if (relevantCategories.includes(label) && Number(weight) > 0) {
                    const cat = WASTE_CATEGORIES.find(c => c.label === label);
                    newEntries.push({
                        id: Date.now() + Math.random(),
                        date: entryDate,
                        wasteType: label,
                        weight: Number(weight),
                        location: entryLocation,
                        category: (cat?.type as any) || 'No Peligroso',
                        files: files
                    });
                }
            });

            if (newEntries.length === 0) {
                alert("Ingresa al menos un peso en este panel.");
                return;
            }

            setRecords(prev => [...newEntries, ...prev]);
            alert("Pesajes registrados correctamente.");
        }

        setMultiWeights({});
        setFiles([]);
    };

    const handleEdit = (record: WasteWeightRecord) => {
        setEditingId(record.id);
        setEntryDate(record.date);
        setEntryLocation(record.location);
        setMultiWeights({ [record.wasteType]: record.weight.toString() });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id: number) => {
        if (confirm("¿Eliminar este pesaje?")) {
            setRecords(prev => prev.filter(r => r.id !== id));
        }
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-[1600px] mx-auto space-y-6">
                    
                    {/* Header */}
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl -mr-32 -mt-32 rounded-full"></div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4 mb-2">
                                    <Scale size={40} className="text-emerald-500" />
                                    Panel de Control de Residuos
                                </h1>
                                <p className="text-slate-400 font-bold max-w-2xl">
                                    Monitoreo acumulado de segregación. Registre los pesos por tipo de residuo y visualice el progreso mensual automáticamente.
                                </p>
                            </div>
                            <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 text-center min-w-[200px]">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Peso Total Acumulado (KG)</p>
                                <p className="text-4xl font-black text-emerald-400">{stats.totalWeight.toLocaleString()} <span className="text-sm">kg</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Accumulation Summary Matrix Split */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Non-Hazardous Summary */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                            <h3 className="text-emerald-400 font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                                <TrendingUp size={18} /> Residuos Aprovechables (No Peligrosos)
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <tbody className="divide-y divide-slate-800">
                                        {accumulationData.filter(d => d.type === 'No Peligroso').map((data, idx) => {
                                            const diff = data.currentMonthSum - data.lastMonthSum;
                                            return (
                                                <tr key={idx} className="group hover:bg-slate-800/30 transition-colors">
                                                    <td className="py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: data.color }} />
                                                            <span className="font-bold text-white text-xs">{data.label}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        <span className="text-[10px] font-mono font-bold text-emerald-400">{data.currentMonthSum.toFixed(1)} {data.unit}</span>
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <span className="text-sm font-black text-white">{data.total.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">{data.unit}</span></span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Hazardous Summary */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                            <h3 className="text-red-400 font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                                <AlertTriangle size={18} /> Residuos Peligrosos y Especiales
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <tbody className="divide-y divide-slate-800">
                                        {accumulationData.filter(d => d.type !== 'No Peligroso').map((data, idx) => {
                                            return (
                                                <tr key={idx} className="group hover:bg-slate-800/30 transition-colors">
                                                    <td className="py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: data.color }} />
                                                            <span className="font-bold text-white text-xs">{data.label}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        <span className="text-[10px] font-mono font-bold text-red-400">{data.currentMonthSum.toFixed(1)} {data.unit}</span>
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <span className="text-sm font-black text-white">{data.total.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">{data.unit}</span></span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* General Configuration Bar */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-wrap items-center justify-center gap-8">
                        <div className="flex items-center gap-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha de Carga:</label>
                            <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-emerald-400 font-bold outline-none focus:border-emerald-500" />
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sede / Ubicación:</label>
                            <select value={entryLocation} onChange={e => setEntryLocation(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white font-bold outline-none focus:border-emerald-500">
                                <option value="">Seleccionar Sede...</option>
                                {SSOMA_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                        
                        {/* LEFT: Aprovechables Form */}
                        <div className="xl:col-span-1 space-y-6">
                            <div className={`bg-slate-900 border rounded-3xl p-6 shadow-xl transition-all ${editingId ? 'opacity-50 pointer-events-none' : 'border-emerald-500/30'}`}>
                                <h3 className="text-emerald-400 font-black uppercase text-xs tracking-widest mb-6 flex items-center gap-2">
                                    <Plus size={16} /> Pesaje Aprovechables
                                </h3>

                                <form onSubmit={e => handleSubmit(e, 'No Peligroso')} className="space-y-6">
                                    <div className="space-y-3">
                                        {WASTE_CATEGORIES.filter(c => c.type === 'No Peligroso').map(cat => (
                                            <div key={cat.id} className="flex items-center justify-between gap-4 bg-slate-950 p-2 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition-colors">
                                                <label className="text-[10px] font-bold text-slate-300 flex-1">{cat.label}</label>
                                                <input 
                                                    type="number" 
                                                    step="0.01" 
                                                    placeholder="0.00"
                                                    value={multiWeights[cat.label] || ''}
                                                    onChange={e => setMultiWeights({...multiWeights, [cat.label]: e.target.value})}
                                                    className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-emerald-400 font-mono text-right outline-none focus:border-emerald-500"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-2">
                                        <div 
                                            className={`border-2 border-dashed rounded-2xl p-4 transition-all text-center group cursor-pointer relative ${
                                                isDragging ? 'border-emerald-500 bg-emerald-500/20' : 'border-slate-800 hover:border-slate-600'
                                            }`}
                                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                            onDragLeave={() => setIsDragging(false)}
                                            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e as any); }}
                                        >
                                            <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-50" multiple />
                                            <Upload className={`mx-auto mb-2 ${isDragging ? 'text-emerald-500 animate-bounce' : 'text-slate-600'}`} size={20} />
                                            <p className="text-[10px] font-bold text-slate-500 group-hover:text-slate-300">
                                                {files.length > 0 ? `${files.length} ARCHIVOS` : 'SUBIR EVIDENCIA'}
                                            </p>
                                        </div>
                                    </div>

                                    <button type="submit" disabled={isUploading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50">
                                        {isUploading ? "Subiendo..." : <><Save size={18} /> Guardar Aprovechables</>}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* CENTER: Charts and History (2 columns wide) */}
                        <div className="xl:col-span-2 space-y-6">
                            
                            {/* Chart 1: Aprovechables */}
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-72">
                                <h3 className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <BarChart size={16} /> Tendencia: Residuos Aprovechables
                                </h3>
                                <ResponsiveContainer width="100%" height="75%">
                                    <LineChart data={stats.lineData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '9px' }} />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '15px' }} />
                                        {WASTE_CATEGORIES.filter(c => c.type === 'No Peligroso').map(cat => (
                                            <Line key={cat.id} type="monotone" dataKey={cat.label} stroke={cat.color} strokeWidth={2} dot={{ r: 3 }} name={cat.label} />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Chart 2: Peligrosos */}
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-72">
                                <h3 className="text-red-400 font-bold text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <AlertTriangle size={16} /> Tendencia: Residuos Peligrosos
                                </h3>
                                <ResponsiveContainer width="100%" height="75%">
                                    <LineChart data={stats.lineData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '9px' }} />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '15px' }} />
                                        {WASTE_CATEGORIES.filter(c => c.type !== 'No Peligroso').map(cat => (
                                            <Line key={cat.id} type="monotone" dataKey={cat.label} stroke={cat.color} strokeWidth={2} dot={{ r: 3 }} name={cat.label} />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Detailed History Table Card */}
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-4">
                                    <h3 className="text-white font-black text-lg flex items-center gap-2">
                                        <BarChart size={20} className="text-slate-500" /> Historial Detallado
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <div className="text-[10px] font-mono text-slate-500 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                                            {records.filter(r => {
                                                const matchesLoc = !filterLocation || r.location === filterLocation;
                                                const matchesDate = !filterDate || r.date === filterDate;
                                                const matchesType = !filterWasteType || r.wasteType === filterWasteType;
                                                return matchesLoc && matchesDate && matchesType;
                                            }).length} REGISTROS
                                        </div>
                                    </div>
                                </div>

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
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-emerald-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Tipo</label>
                                            {filterWasteType && (
                                                <button onClick={() => setFilterWasteType('')} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <SearchableSelect 
                                            options={WASTE_CATEGORIES.map(c => ({ id: c.label, label: c.label }))}
                                            value={filterWasteType}
                                            onChange={(val) => setFilterWasteType(val)}
                                            placeholder="Todos los tipos..."
                                            className="[&>div]:bg-slate-950 [&>div]:border-slate-700 [&>div]:py-1.5 [&>div]:px-3 [&>div]:text-[10px]"
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
                                    <div className="space-y-1 flex flex-col justify-end h-[53px]">
                                        <button 
                                            onClick={() => { setFilterLocation(''); setFilterDate(''); setFilterWasteType(''); }}
                                            className={`w-full h-[33px] rounded-lg text-[10px] font-bold uppercase transition-all border flex items-center justify-center gap-2 active:scale-95 ${
                                                (filterLocation || filterDate || filterWasteType)
                                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 shadow-lg shadow-red-950/20'
                                                : 'bg-slate-800/50 text-slate-500 border-slate-800 cursor-not-allowed opacity-50'
                                            }`}
                                            disabled={!(filterLocation || filterDate || filterWasteType)}
                                        >
                                            <RotateCcw size={14} strokeWidth={3} /> Limpiar Filtros
                                        </button>
                                    </div>
                                </div>

                                {/* RESUMEN MENSUAL */}
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'].map((m, i) => {
                                        const count = records.filter(r => {
                                            const d = new Date(r.date + 'T00:00:00');
                                            return d.getMonth() === i;
                                        }).length;
                                        return (
                                            <div key={m} className={`flex flex-col items-center justify-center min-w-[42px] py-1.5 rounded-xl border ${count > 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-600 opacity-50'}`}>
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
                                <div className="overflow-x-auto max-h-[400px] overflow-y-auto no-scrollbar">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[10px] font-black text-slate-500 uppercase border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
                                                <th className="pb-4 pl-4">Fecha</th>
                                                <th className="pb-4">Residuo</th>
                                                <th className="pb-4">Lugar</th>
                                                <th className="pb-4 text-center">Evidencia</th>
                                                <th className="pb-4 text-right pr-4">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {records.filter(r => !filterLocation || r.location === filterLocation).map(r => (
                                                <tr key={r.id} className="group hover:bg-slate-800/30 transition-colors">
                                                    <td className="py-4 pl-4 text-xs font-mono text-slate-400">{r.date}</td>
                                                    <td className="py-4 text-sm font-bold text-white">{r.wasteType}</td>
                                                    <td className="py-4 text-xs text-slate-400">{r.location}</td>
                                                    <td className="py-4 text-center">
                                                        {r.files && r.files.length > 0 ? (
                                                            <button onClick={() => setPreviewFile({url: r.files[0], type: 'image'})} className="p-1.5 rounded bg-slate-800 border border-slate-700 hover:border-emerald-500">
                                                                <Eye size={14} className="text-emerald-500" />
                                                            </button>
                                                        ) : <span className="text-[10px] text-slate-700 italic">N/A</span>}
                                                    </td>
                                                    <td className="py-4 text-right pr-4">
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => handleEdit(r)} className="p-2 text-slate-600 hover:text-amber-400 transition-colors">
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button onClick={() => handleDelete(r.id)} className="p-2 text-slate-600 hover:text-red-400 transition-colors">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Peligrosos Form */}
                        <div className="xl:col-span-1 space-y-6">
                            <div className={`bg-slate-900 border rounded-3xl p-6 shadow-xl transition-all ${editingId ? 'border-amber-500 ring-2' : 'border-red-500/30'}`}>
                                <h3 className={`${editingId ? 'text-amber-500' : 'text-red-400'} font-black uppercase text-xs tracking-widest mb-6 flex items-center justify-between`}>
                                    <span className="flex items-center gap-2">
                                        {editingId ? <Edit2 size={16} /> : <AlertTriangle size={16} />} 
                                        {editingId ? 'Modificando' : 'Pesaje Peligrosos'}
                                    </span>
                                    {editingId && (
                                        <button onClick={() => { setEditingId(null); setMultiWeights({}); }} className="text-[9px] bg-amber-500/10 px-2 py-1 rounded-lg">
                                            CANCELAR
                                        </button>
                                    )}
                                </h3>

                                <form onSubmit={e => handleSubmit(e, 'Peligroso')} className="space-y-6">
                                    <div className="space-y-3">
                                        {WASTE_CATEGORIES.filter(c => c.type !== 'No Peligroso').map(cat => {
                                            if (editingId) {
                                                const recordToEdit = records.find(r => r.id === editingId);
                                                if (cat.label !== recordToEdit?.wasteType) return null;
                                            }

                                            return (
                                                <div key={cat.id} className="flex items-center justify-between gap-4 bg-slate-950 p-2 rounded-xl border border-slate-800 hover:border-red-500/50 transition-colors">
                                                    <div className="flex-1">
                                                        <label className="text-[10px] font-bold text-slate-300 block leading-tight">{cat.label}</label>
                                                        <span className="text-[8px] text-slate-500 font-mono uppercase">{cat.unit}</span>
                                                    </div>
                                                    <input 
                                                        type="number" 
                                                        step="0.01" 
                                                        placeholder="0.0"
                                                        value={multiWeights[cat.label] || ''}
                                                        onChange={e => setMultiWeights({...multiWeights, [cat.label]: e.target.value})}
                                                        className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-red-400 font-mono text-right outline-none focus:border-red-500"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="border-2 border-dashed border-slate-800 rounded-2xl p-4 text-center cursor-pointer hover:border-red-500/50 relative">
                                            <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-50" multiple />
                                            <Upload className="mx-auto mb-2 text-slate-600" size={20} />
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">Subir Manifiesto / Guía</p>
                                        </div>
                                    </div>

                                    <button type="submit" disabled={isUploading} className={`w-full ${editingId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-red-700 hover:bg-red-600'} text-white font-black uppercase py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2`}>
                                        {isUploading ? "Subiendo..." : <><Save size={18} /> {editingId ? 'Guardar Cambios' : 'Guardar Peligrosos'}</>}
                                    </button>
                                </form>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {/* Preview Modal */}
            {previewFile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setPreviewFile(null)}>
                    <div className="relative max-w-4xl w-full flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
                        <img src={previewFile.url} className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border border-white/10" />
                        <button onClick={() => setPreviewFile(null)} className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest transition-all">
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
