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
    Upload
} from "lucide-react";
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
    Cell 
} from 'recharts';
import { SSOMA_LOCATIONS } from "@/lib/locations";
import { useAuth } from "@/lib/auth";

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
    { id: 'metalicos', label: 'RESIDUOS METALICOS', type: 'No Peligroso', color: '#64748b' },
    { id: 'papel_carton', label: 'PAPELES Y CARTONES', type: 'No Peligroso', color: '#3b82f6' },
    { id: 'plasticos', label: 'PLASTICOS', type: 'No Peligroso', color: '#10b981' },
    { id: 'vidrio', label: 'VIDRIO', type: 'No Peligroso', color: '#06b6d4' },
    { id: 'comida', label: 'RESIDUOS DE COMIDA', type: 'No Peligroso', color: '#f59e0b' },
    { id: 'madera', label: 'RESIDUOS DE MADERA', type: 'No Peligroso', color: '#8b5cf6' },
    { id: 'no_aprovechable', label: 'RESIDUOS NO APROVECHABLE', type: 'No Peligroso', color: '#ef4444' },
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
    const [files, setFiles] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [previewFile, setPreviewFile] = useState<{ url: string, type: 'pdf' | 'image' } | null>(null);

    // --- EFFECT: LOAD/SAVE ---
    useEffect(() => {
        const stored = localStorage.getItem('waste_weight_records_v2');
        if (stored) {
            try {
                setRecords(JSON.parse(stored));
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
        const byMonth = records.reduce((acc, r) => {
            const month = r.date.substring(0, 7);
            acc[month] = (acc[month] || 0) + r.weight;
            return acc;
        }, {} as Record<string, number>);

        const barData = Object.entries(byMonth)
            .map(([name, weight]) => ({ name, weight }))
            .sort((a, b) => a.name.localeCompare(b.name))
            .slice(-6);

        return { totalWeight, barData };
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingId) {
            // Edit existing record
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
            // New entries
            const newEntries: WasteWeightRecord[] = [];
            Object.entries(multiWeights).forEach(([label, weight]) => {
                if (Number(weight) > 0) {
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
                alert("Ingresa al menos un peso.");
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

                    {/* Accumulation Summary Matrix */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-hidden">
                        <h3 className="text-white font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                            <TrendingUp size={18} className="text-emerald-500" /> Resumen Acumulado por Tipo
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black text-slate-500 uppercase border-b border-slate-800">
                                        <th className="pb-4 pl-4">Tipo de Residuo</th>
                                        <th className="pb-4 text-center">Este Mes</th>
                                        <th className="pb-4 text-center">Mes Anterior</th>
                                        <th className="pb-4 text-center">Tendencia</th>
                                        <th className="pb-4 text-right pr-4">Total Acumulado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {accumulationData.map((data, idx) => {
                                        const diff = data.currentMonthSum - data.lastMonthSum;
                                        return (
                                            <tr key={idx} className="group hover:bg-slate-800/30 transition-colors">
                                                <td className="py-4 pl-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-8 rounded-full" style={{ backgroundColor: data.color }} />
                                                        <span className="font-bold text-white">{data.label}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-center font-mono font-bold text-emerald-400">
                                                    {data.currentMonthSum.toFixed(2)} kg
                                                </td>
                                                <td className="py-4 text-center font-mono text-slate-500">
                                                    {data.lastMonthSum.toFixed(2)} kg
                                                </td>
                                                <td className="py-4 text-center">
                                                    {diff !== 0 && (
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${diff > 0 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                            {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 text-right pr-4 font-mono font-black text-white text-lg">
                                                    {data.total.toLocaleString()} kg
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                        
                        {/* Multi-Entry Form */}
                            <div className={`bg-slate-900 border rounded-3xl p-6 shadow-xl transition-all ${editingId ? 'border-amber-500 ring-1 ring-amber-500/20' : 'border-slate-800'}`}>
                                <h3 className={`${editingId ? 'text-amber-500' : 'text-emerald-400'} font-black uppercase text-xs tracking-widest mb-6 flex items-center justify-between`}>
                                    <span className="flex items-center gap-2">
                                        {editingId ? <Edit2 size={16} /> : <Plus size={16} />} 
                                        {editingId ? 'Editando Registro' : 'Registro de Pesaje Masivo'}
                                    </span>
                                    {editingId && (
                                        <button onClick={() => { setEditingId(null); setMultiWeights({}); }} className="text-[9px] bg-amber-500/10 px-2 py-1 rounded-lg hover:bg-amber-500/20 transition-colors">
                                            CANCELAR EDICIÓN
                                        </button>
                                    )}
                                </h3>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Fecha</label>
                                            <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none" required />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Sede</label>
                                            <select value={entryLocation} onChange={e => setEntryLocation(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none" required>
                                                <option value="">Sede...</option>
                                                {SSOMA_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-slate-500 uppercase border-b border-slate-800 pb-2">
                                            {editingId ? 'Corregir Peso (KG)' : 'Pesos por Categoría (KG)'}
                                        </p>
                                        {WASTE_CATEGORIES.map(cat => {
                                            // Si estamos editando, solo mostrar el tipo que estamos editando o todos?
                                            // Mejor mostrar el que estamos editando si hay un editingId
                                            if (editingId) {
                                                const recordToEdit = records.find(r => r.id === editingId);
                                                if (cat.label !== recordToEdit?.wasteType) return null;
                                            }

                                            return (
                                                <div key={cat.id} className="flex items-center justify-between gap-4 bg-slate-950 p-2 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                                                    <label className="text-[10px] font-bold text-slate-300 flex-1">{cat.label}</label>
                                                    <input 
                                                        type="number" 
                                                        step="0.01" 
                                                        placeholder="0.00"
                                                        value={multiWeights[cat.label] || ''}
                                                        onChange={e => setMultiWeights({...multiWeights, [cat.label]: e.target.value})}
                                                        className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-emerald-400 font-mono text-right outline-none focus:border-emerald-500"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase">Evidencia (Opcional)</label>
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
                                                {files.length > 0 ? `${files.length} ARCHIVOS` : 'SUBIR TICKET'}
                                            </p>
                                        </div>
                                    </div>

                                    <button type="submit" disabled={isUploading} className={`w-full font-black uppercase py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 ${editingId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white`}>
                                        {isUploading ? "Subiendo..." : <><Save size={18} /> {editingId ? 'Actualizar Pesaje' : 'Guardar Pesajes'}</>}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Charts and History Columns */}
                        <div className="xl:col-span-3 space-y-6">
                            
                            {/* Bar Chart */}
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-80">
                                <h3 className="text-white font-bold text-sm mb-6 flex items-center gap-2">
                                    <BarChart size={16} className="text-emerald-500" /> Evolución Mensual de Pesajes (Total kg)
                                </h3>
                                <ResponsiveContainer width="100%" height="80%">
                                    <RechartsBarChart data={stats.barData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                        <Tooltip 
                                            cursor={{fill: '#1e293b', radius: 4}}
                                            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }}
                                        />
                                        <Bar dataKey="weight" fill="#10b981" radius={[6, 6, 0, 0]} />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* History Table */}
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                                    <h3 className="text-white font-black text-lg flex items-center gap-2">
                                        <BarChart size={20} className="text-slate-500" /> Historial Detallado
                                    </h3>
                                    <select 
                                        value={filterLocation}
                                        onChange={e => setFilterLocation(e.target.value)}
                                        className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                    >
                                        <option value="">Todos los lugares...</option>
                                        {SSOMA_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div className="overflow-x-auto max-h-[400px] overflow-y-auto no-scrollbar">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[10px] font-black text-slate-500 uppercase border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
                                                <th className="pb-4 pl-4">Fecha</th>
                                                <th className="pb-4">Residuo</th>
                                                <th className="pb-4">Lugar</th>
                                                <th className="pb-4 text-center">Evidencia</th>
                                                <th className="pb-4 text-right pr-4">Peso (kg)</th>
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
