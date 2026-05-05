"use client";
 
import { useState, useEffect } from "react";
import {
    AlertTriangle,
    Upload,
    Trash2,
    Calendar,
    MapPin,
    FileText,
    Eye,
    X,
    Save,
    CheckCircle2,
    Search,
    Download,
    Plus,
    Activity,
    BarChart3,
    TrendingUp
} from "lucide-react";
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie
} from 'recharts';
import { generateFilename, getDriveViewerUrl } from '@/lib/utils';
import jsPDF from 'jspdf';
import { uploadEvidence } from "@/lib/uploadClient";
import { SSOMA_LOCATIONS } from "@/lib/locations";
import { useAuth } from "@/lib/auth";
import { ACTOS_LIST, CONDICIONES_LIST, RESPONSIBLES } from "@/lib/categories";
import SearchableSelect from "@/components/SearchableSelect";

// --- TYPES ---
type ReporteACRecord = {
    id: number;
    date: string;
    responsible: string;
    acto: string;
    condicion: string;
    cantidad: number;
    location: string;
    pdfUrl: string;
};

export default function ReporteACPage() {
    const { user } = useAuth();

    // --- STATE ---
    const [records, setRecords] = useState<ReporteACRecord[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    
    // Form State
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        responsible: user?.name || '',
        acto: '',
        condicion: '',
        cantidad: 1,
        location: ''
    });
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [previewFile, setPreviewFile] = useState<{ url: string, type: 'pdf' | 'image' } | null>(null);

    // Filters
    const [filterDate, setFilterDate] = useState("");
    const [filterLocation, setFilterLocation] = useState("");
    const [filterActo, setFilterActo] = useState("");

    // Dynamic Activities from Program (OBJ 04)
    const [programActivities, setProgramActivities] = useState<any[]>([]);

    // --- EFFECT: LOAD DYNAMIC ACTIVITIES (OBJ 04) ---
    useEffect(() => {
        const loadProgram = async () => {
            try {
                const res = await fetch('/api/annual-program');
                const data = await res.json();
                if (data.success && data.programData['obj4']) {
                    setProgramActivities(data.programData['obj4']);
                }
            } catch (e) {
                console.error("Error fetching annual program:", e);
            }
        };
        loadProgram();
    }, []);

    // --- EFFECT: LOAD/SAVE ---
    useEffect(() => {
        const init = async () => {
            const stored = localStorage.getItem('reporte_ac_records');
            if (stored) {
                try { setRecords(JSON.parse(stored)); } catch (e) { }
            }

            try {
                const res = await fetch('/api/reporte-ac-records');
                const data = await res.json();
                if (data.success && data.records.length > 0) {
                    const mapped = data.records.map((r: any) => ({
                        id: Number(r.record_id) || r.id,
                        date: r.date,
                        responsible: r.responsible,
                        acto: r.acto,
                        condicion: r.condicion,
                        cantidad: Number(r.cantidad),
                        location: r.location,
                        pdfUrl: r.pdf_url
                    }));
                    setRecords(mapped);
                    localStorage.setItem('reporte_ac_records', JSON.stringify(mapped));
                }
            } catch (e) { }
            setIsLoaded(true);
        };
        init();
    }, []);

    const handleSync = async (currentRecords: ReporteACRecord[]) => {
        setIsSyncing(true);
        try {
            await fetch('/api/reporte-ac-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: currentRecords, userName: user?.name })
            });
        } catch (e) {
            console.error("Sync error:", e);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSave = async () => {
        if (!form.acto && !form.condicion) {
            alert("Debe seleccionar al menos un Acto o Condición.");
            return;
        }

        setIsUploading(true);
        try {
            let uploadedUrl = "";
            if (pdfFile) {
                const filename = `AC_${form.date}_${form.location.replace(/\s+/g, '_')}.pdf`;
                uploadedUrl = await uploadEvidence(pdfFile, filename);
            }

            const newRecord: ReporteACRecord = {
                id: Date.now(),
                ...form,
                pdfUrl: uploadedUrl
            };

            const updated = [newRecord, ...records];
            setRecords(updated);
            localStorage.setItem('reporte_ac_records', JSON.stringify(updated));
            handleSync(updated);

            // Reset
            setForm({ ...form, acto: '', condicion: '', cantidad: 1 });
            setPdfFile(null);
            alert("✅ Reporte de A/C registrado con éxito.");
        } catch (error) {
            console.error("Save error:", error);
            alert("❌ Error al guardar el reporte.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = (id: number) => {
        if (!confirm("¿Eliminar este registro?")) return;
        const updated = records.filter(r => r.id !== id);
        setRecords(updated);
        localStorage.setItem('reporte_ac_records', JSON.stringify(updated));
        handleSync(updated);
    };

    const filteredRecords = (records || []).filter(r => {
        const matchesDate = !filterDate || (r.date && r.date.includes(filterDate));
        const matchesLocation = !filterLocation || (r.location && r.location.toLowerCase().includes(filterLocation.toLowerCase()));
        const matchesActo = !filterActo || (r.acto && r.acto.includes(filterActo));
        
        return matchesDate && matchesLocation && matchesActo;
    });

    // --- CHART DATA LOGIC ---
    const getChartData = () => {
        const actosCount: Record<string, number> = {};
        const condicionesCount: Record<string, number> = {};

        records.forEach(r => {
            if (r.acto) actosCount[r.acto] = (actosCount[r.acto] || 0) + r.cantidad;
            if (r.condicion) condicionesCount[r.condicion] = (condicionesCount[r.condicion] || 0) + r.cantidad;
        });

        const actosData = Object.entries(actosCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const condicionesData = Object.entries(condicionesCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        return { actosData, condicionesData };
    };

    const { actosData, condicionesData } = getChartData();

    if (!isLoaded) return <div className="h-screen bg-slate-950 flex items-center justify-center text-white">Cargando...</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[80px] -mr-32 -mt-32 rounded-full"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4 mb-2">
                                <AlertTriangle size={40} className="text-orange-500" />
                                Reporte de Actos y Condiciones (A/C)
                            </h1>
                            <p className="text-slate-400 font-bold max-w-2xl">
                                Herramienta para el registro de actos y condiciones inseguras identificadas en campo, sincronizado con el OBJ 04 del Programa Anual.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-center min-w-[120px]">
                                <p className="text-[10px] font-black text-orange-500 uppercase">Actos</p>
                                <p className="text-2xl font-black text-white">{records.filter(r => r.acto).length}</p>
                            </div>
                            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-center min-w-[120px]">
                                <p className="text-[10px] font-black text-blue-500 uppercase">Condiciones</p>
                                <p className="text-2xl font-black text-white">{records.filter(r => r.condicion).length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Analysis Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-white flex items-center gap-2">
                                <TrendingUp size={20} className="text-orange-500" />
                                Top Actos Inseguros
                            </h3>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={actosData.slice(0, 5)} layout="vertical" margin={{ left: 20, right: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        width={150} 
                                        axisLine={false} 
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                                        tickFormatter={(value) => value.length > 25 ? value.substring(0, 25) + '...' : value}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }}
                                        itemStyle={{ color: '#fb923c', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                        {actosData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#ea580c' : '#fb923c'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-white flex items-center gap-2">
                                <TrendingUp size={20} className="text-blue-500" />
                                Top Condiciones Inseguras
                            </h3>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={condicionesData.slice(0, 5)} layout="vertical" margin={{ left: 20, right: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        width={150} 
                                        axisLine={false} 
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                                        tickFormatter={(value) => value.length > 25 ? value.substring(0, 25) + '...' : value}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }}
                                        itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                        {condicionesData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#2563eb' : '#3b82f6'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Form Side */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-xl space-y-6">
                            <h2 className="text-xl font-black text-white flex items-center gap-2 mb-4">
                                <Plus size={20} className="text-orange-500" />
                                Nuevo Reporte
                            </h2>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha</label>
                                    <input 
                                        type="date"
                                        value={form.date}
                                        onChange={e => setForm({...form, date: e.target.value})}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lugar / Área</label>
                                    <SearchableSelect 
                                        options={SSOMA_LOCATIONS}
                                        value={form.location}
                                        onChange={val => setForm({...form, location: val})}
                                        placeholder="Seleccionar lugar..."
                                        icon={<MapPin size={16} />}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Acto Inseguro</label>
                                    <SearchableSelect 
                                        options={ACTOS_LIST}
                                        value={form.acto}
                                        onChange={val => setForm({...form, acto: val})}
                                        placeholder="Seleccionar acto..."
                                        icon={<AlertTriangle size={16} className="text-orange-500" />}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Condición Insegura</label>
                                    <SearchableSelect 
                                        options={CONDICIONES_LIST}
                                        value={form.condicion}
                                        onChange={val => setForm({...form, condicion: val})}
                                        placeholder="Seleccionar condición..."
                                        icon={<AlertTriangle size={16} className="text-blue-500" />}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cantidad</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        value={form.cantidad}
                                        onChange={e => setForm({...form, cantidad: Number(e.target.value)})}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Evidencia (PDF)</label>
                                    <div className="relative group">
                                        <input 
                                            type="file"
                                            accept=".pdf"
                                            onChange={e => setPdfFile(e.target.files?.[0] || null)}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="bg-slate-950 border-2 border-dashed border-slate-800 rounded-xl p-6 text-center group-hover:border-orange-500/50 transition-all">
                                            <Upload className={`mx-auto mb-2 ${pdfFile ? 'text-orange-500' : 'text-slate-600'}`} size={24} />
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">
                                                {pdfFile ? pdfFile.name : 'Subir Archivo PDF'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleSave}
                                    disabled={isUploading}
                                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-xl shadow-lg shadow-orange-900/20 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50"
                                >
                                    {isUploading ? <Activity className="animate-spin" size={16} /> : <Save size={16} />}
                                    Registrar Reporte
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table Side */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] shadow-xl overflow-hidden">
                            <div className="p-6 border-b border-slate-800 flex flex-wrap gap-4 items-center justify-between">
                                <h3 className="text-lg font-black text-white flex items-center gap-2">
                                    <FileText size={20} className="text-orange-500" />
                                    Registros Recientes
                                </h3>
                                <div className="flex gap-2">
                                    <input 
                                        placeholder="Filtrar Lugar..." 
                                        className="bg-slate-950 border border-slate-800 text-xs px-3 py-1.5 rounded-lg outline-none focus:border-orange-500"
                                        value={filterLocation}
                                        onChange={e => setFilterLocation(e.target.value)}
                                    />
                                    <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                                        <Search size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-950/50">
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Fecha</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Responsable</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Acto / Condición</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase text-center">Cant.</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Lugar</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {filteredRecords.map(r => (
                                            <tr key={r.id} className="hover:bg-slate-800/30 transition-colors group">
                                                <td className="px-6 py-4 text-xs font-bold">{r.date}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-black border border-slate-700">
                                                            {r.responsible.substring(0,2).toUpperCase()}
                                                        </div>
                                                        <span className="text-xs">{r.responsible}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        {r.acto && <span className="block text-[10px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/20 w-fit">A: {r.acto}</span>}
                                                        {r.condicion && <span className="block text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 w-fit">C: {r.condicion}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-black text-orange-500">{r.cantidad}</td>
                                                <td className="px-6 py-4 text-[10px] text-slate-400 font-medium uppercase">{r.location}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {r.pdfUrl && (
                                                            <button 
                                                                onClick={() => setPreviewFile({ url: r.pdfUrl, type: 'pdf' })}
                                                                className="p-2 hover:bg-orange-500/20 text-slate-400 hover:text-orange-400 rounded-lg transition-all"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => handleDelete(r.id)}
                                                            className="p-2 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                        >
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

            {/* PREVIEW MODAL */}
            {previewFile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-950/95 backdrop-blur-md">
                    <div className="relative w-full max-w-5xl h-full flex flex-col bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                <FileText className="text-orange-500" />
                                Visualización de Evidencia
                            </h3>
                            <button 
                                onClick={() => setPreviewFile(null)}
                                className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 bg-slate-950 p-4">
                            <iframe 
                                src={getDriveViewerUrl(previewFile.url)} 
                                className="w-full h-full rounded-2xl border border-slate-800"
                                title="Visualizador"
                            />
                        </div>
                        <div className="p-4 border-t border-slate-800 flex justify-center">
                            <a 
                                href={previewFile.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-8 py-3 bg-slate-800 hover:bg-orange-600 text-white font-black rounded-xl transition-all uppercase text-xs tracking-widest"
                            >
                                <Download size={18} /> Descargar Original
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
