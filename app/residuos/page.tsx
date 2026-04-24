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
    Scale
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
};

const WASTE_CATEGORIES = [
    { id: 'general', label: 'Residuos Generales', type: 'No Peligroso', color: '#64748b' },
    { id: 'oil', label: 'Aceites Usados', type: 'Peligroso', color: '#ef4444' },
    { id: 'plastic', label: 'Plásticos', type: 'No Peligroso', color: '#3b82f6' },
    { id: 'metal', label: 'Chatarra Metálica', type: 'No Peligroso', color: '#f59e0b' },
    { id: 'medical', label: 'Residuos Biocontaminados', type: 'Peligroso', color: '#ec4899' },
    { id: 'electronic', label: 'RAEE (Electrónicos)', type: 'RAEE', color: '#8b5cf6' },
];

export default function WasteManagementPage() {
    const { user } = useAuth();

    // --- STATE ---
    const [records, setRecords] = useState<WasteWeightRecord[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Form State
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        wasteType: '',
        weight: '',
        location: ''
    });

    // --- EFFECT: LOAD/SAVE ---
    useEffect(() => {
        const stored = localStorage.getItem('waste_weight_records_v1');
        if (stored) {
            try {
                setRecords(JSON.parse(stored));
            } catch (e) { console.error(e); }
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('waste_weight_records_v1', JSON.stringify(records));
        }
    }, [records, isLoaded]);

    // --- ANALYTICS ---
    const stats = useMemo(() => {
        const totalWeight = records.reduce((acc, r) => acc + r.weight, 0);
        const byType = records.reduce((acc, r) => {
            acc[r.wasteType] = (acc[r.wasteType] || 0) + r.weight;
            return acc;
        }, {} as Record<string, number>);

        const pieData = Object.entries(byType).map(([name, value]) => ({
            name,
            value,
            color: WASTE_CATEGORIES.find(c => c.label === name)?.color || '#94a3b8'
        }));

        const byMonth = records.reduce((acc, r) => {
            const month = r.date.substring(0, 7); // YYYY-MM
            acc[month] = (acc[month] || 0) + r.weight;
            return acc;
        }, {} as Record<string, number>);

        const barData = Object.entries(byMonth)
            .map(([name, weight]) => ({ name, weight }))
            .sort((a, b) => a.name.localeCompare(b.name))
            .slice(-6);

        return { totalWeight, pieData, barData };
    }, [records]);

    // --- HANDLERS ---
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const categoryInfo = WASTE_CATEGORIES.find(c => c.label === form.wasteType);
        
        const newRecord: WasteWeightRecord = {
            id: Date.now(),
            date: form.date,
            wasteType: form.wasteType,
            weight: Number(form.weight),
            location: form.location,
            category: (categoryInfo?.type as any) || 'No Peligroso'
        };

        setRecords(prev => [newRecord, ...prev]);
        setForm(prev => ({ ...prev, weight: '' }));
        alert("Pesaje registrado correctamente.");
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
                                    15 Pesaje de Residuos
                                </h1>
                                <p className="text-slate-400 font-bold max-w-2xl">
                                    Control volumétrico y de peso de residuos generados por sede. Monitoree las metas de reducción y segregación en tiempo real.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 text-center">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Peso Total (Año)</p>
                                    <p className="text-3xl font-black text-emerald-400">{stats.totalWeight.toLocaleString()} <span className="text-sm">kg</span></p>
                                </div>
                                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 text-center">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Registros</p>
                                    <p className="text-3xl font-black text-white">{records.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                        
                        {/* Form Column */}
                        <div className="xl:col-span-1 space-y-6">
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                                <h3 className="text-emerald-400 font-black uppercase text-xs tracking-widest mb-6 flex items-center gap-2">
                                    <Plus size={16} /> Registro de Pesaje
                                </h3>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase">Fecha de Pesaje</label>
                                        <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-500 outline-none" required />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase">Tipo de Residuo</label>
                                        <select value={form.wasteType} onChange={e => setForm({...form, wasteType: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-500 outline-none" required>
                                            <option value="">Seleccionar Tipo...</option>
                                            {WASTE_CATEGORIES.map(c => <option key={c.id} value={c.label}>{c.label}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase">Peso (kg)</label>
                                        <div className="relative">
                                            <input type="number" step="0.01" placeholder="0.00" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-500 outline-none" required />
                                            <span className="absolute right-4 top-2 text-[10px] font-black text-slate-600">KG</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase">Lugar / Sede</label>
                                        <select value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-500 outline-none" required>
                                            <option value="">Seleccionar Lugar...</option>
                                            {SSOMA_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>

                                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                        <Save size={18} /> Guardar Pesaje
                                    </button>
                                </form>
                            </div>

                            {/* Mini Stats Card */}
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                                <h3 className="text-slate-500 font-black uppercase text-[10px] tracking-widest mb-4 flex items-center gap-2">
                                    <PieIcon size={14} /> Distribución por Tipo
                                </h3>
                                <div className="h-48 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPieChart>
                                            <Pie
                                                data={stats.pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={60}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {stats.pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }}
                                                itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                                            />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Charts and History Columns */}
                        <div className="xl:col-span-3 space-y-6">
                            
                            {/* Charts Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-64">
                                    <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                                        <TrendingUp size={16} className="text-emerald-500" /> Evolución Mensual (kg)
                                    </h3>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsBarChart data={stats.barData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                            <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                            <Tooltip 
                                                cursor={{fill: '#1e293b', radius: 4}}
                                                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }}
                                            />
                                            <Bar dataKey="weight" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        </RechartsBarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-64 flex flex-col">
                                    <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                                        <AlertTriangle size={16} className="text-amber-500" /> Alertas de Segregación
                                    </h3>
                                    <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                                        {records.filter(r => r.category === 'Peligroso').slice(0, 5).map(r => (
                                            <div key={r.id} className="bg-slate-950 border-l-4 border-red-500 p-3 rounded-lg flex justify-between items-center">
                                                <div>
                                                    <p className="text-xs font-bold text-white">{r.wasteType}</p>
                                                    <p className="text-[10px] text-slate-500">{r.location} - {r.date}</p>
                                                </div>
                                                <span className="text-xs font-black text-red-400">{r.weight} kg</span>
                                            </div>
                                        ))}
                                        {records.filter(r => r.category === 'Peligroso').length === 0 && (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-600 italic text-xs">
                                                No hay alertas críticas registradas
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* History Table */}
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                                <h3 className="text-white font-black text-lg mb-6 flex items-center gap-2">
                                    <BarChart size={20} className="text-slate-500" /> Historial de Pesajes
                                </h3>
                                <div className="overflow-x-auto max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[10px] font-black text-slate-500 uppercase border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
                                                <th className="pb-4 pl-4">Fecha</th>
                                                <th className="pb-4">Residuo</th>
                                                <th className="pb-4">Categoría</th>
                                                <th className="pb-4">Sede / Lugar</th>
                                                <th className="pb-4 text-right">Peso (kg)</th>
                                                <th className="pb-4 text-right pr-4">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {records.map(r => (
                                                <tr key={r.id} className="group hover:bg-slate-800/30 transition-colors">
                                                    <td className="py-4 pl-4 text-xs font-mono text-slate-400">{r.date}</td>
                                                    <td className="py-4 text-sm font-bold text-white">{r.wasteType}</td>
                                                    <td className="py-4">
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                                                            r.category === 'Peligroso' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                                                            r.category === 'RAEE' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                            'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                                        }`}>
                                                            {r.category.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-xs text-slate-400">{r.location}</td>
                                                    <td className="py-4 text-right text-sm font-mono font-black text-white">
                                                        {r.weight.toFixed(2)}
                                                    </td>
                                                    <td className="py-4 text-right pr-4">
                                                        <button onClick={() => handleDelete(r.id)} className="p-2 text-slate-600 hover:text-red-400 transition-colors">
                                                            <Trash2 size={16} />
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
                </div>
            </main>
        </div>
    );
}
