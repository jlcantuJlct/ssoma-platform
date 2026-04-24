"use client";

import { useState, useEffect } from "react";
import {
    BarChart2,
    TrendingUp,
    Shield,
    Activity,
    Leaf,
    Download,
    Filter,
    Calendar,
    Target
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    AreaChart,
    Area
} from 'recharts';
import { useAuth } from "@/lib/auth";

export default function StatisticsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
    const [selectedYear, setSelectedYear] = useState(2026);
    
    // Raw data to allow re-filtering
    const [rawData, setRawData] = useState<any>({
        inspections: [],
        hhc: [],
        program: {},
        accidents: null
    });

    // Real data state for UI
    const [stats, setStats] = useState({
        totalInspections: 0,
        totalHHC: 0,
        compliancePct: 0,
        hht: 0,
        monthlyCompliance: [] as any[],
        incidents: [] as any[],
        performanceMatrix: [] as any[]
    });

    const MONTHS_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const [inspRes, hhcRes, progRes, accidentRes] = await Promise.all([
                    fetch('/api/inspections').then(r => r.json()).catch(() => ({ records: [] })),
                    fetch('/api/hhc-records').then(r => r.json()).catch(() => ({ records: [] })),
                    fetch('/api/annual-program').then(r => r.json()).catch(() => ({ programData: {} })),
                    Promise.resolve(localStorage.getItem('accidentability_stats_2026'))
                ]);

                const data = {
                    inspections: inspRes.records || [],
                    hhc: hhcRes.records || [],
                    program: progRes.programData || {},
                    accidents: accidentRes ? JSON.parse(accidentRes) : null
                };
                setRawData(data);
                processData(data, selectedMonth, selectedYear);
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, []);

    // Re-process when filters change
    useEffect(() => {
        if (!loading) {
            processData(rawData, selectedMonth, selectedYear);
        }
    }, [selectedMonth, selectedYear]);

    const processData = (data: any, month: number, year: number) => {
        const { inspections, hhc, program, accidents } = data;

        // 1. Filter Inspections by Month/Year
        const filteredInsp = inspections.filter((r: any) => {
            const d = new Date(r.date);
            return (d.getMonth() + 1 === month || month === 0) && d.getFullYear() === year;
        });

        // 2. Filter HHC by Month/Year
        const filteredHHC = hhc.filter((r: any) => {
            const d = new Date(r.date);
            return (d.getMonth() + 1 === month || month === 0) && d.getFullYear() === year;
        });
        const totalHHC = filteredHHC.reduce((acc: number, r: any) => acc + (Number(r.hhc) || 0), 0);

        // 3. Monthly Compliance (Trend always shows up to current, but we can highlight selected)
        const monthlyComp = MONTHS_SHORT.map((name, i) => {
            const mIdx = i + 1;
            let segSum = 0, segCount = 0;
            Object.values(program).forEach((area: any) => {
                Object.values(area).forEach((obj: any) => {
                    if (obj.matrix && obj.matrix[mIdx]) {
                        const m = obj.matrix[mIdx];
                        segSum += (m.exec >= m.plan ? 1 : (m.exec / (m.plan || 1)));
                        segCount++;
                    }
                });
            });
            const avg = segCount > 0 ? (segSum / segCount) * 100 : 0;
            return { name, seguridad: Math.round(avg), ambiente: Math.round(Math.max(0, avg - 5)) };
        }).slice(0, 12);

        // 4. Incidents Trend
        const incidentTrend = MONTHS_SHORT.map((monthName, i) => {
            const mKey = (i + 1).toString();
            const mData = accidents?.months?.[mKey] || {};
            return {
                month: monthName,
                accidents: (mData.ATT || 0) + (mData.APP || 0) + (mData.ATP || 0) + (mData.AM || 0),
                nearMiss: mData.INC || 0
            };
        }).slice(0, 12);

        // 5. Performance Matrix for SELECTED month
        const findProgExecForMonth = (searchLabel: string, m: number) => {
            let p = 0, e = 0;
            Object.values(program).forEach((area: any) => {
                Object.values(area).forEach((obj: any) => {
                    if (obj.label?.toLowerCase().includes(searchLabel.toLowerCase())) {
                        if (m === 0) { // All year
                            p += obj.plan || 0;
                            e += obj.exec || 0;
                        } else if (obj.matrix && obj.matrix[m]) {
                            p += obj.matrix[m].plan || 0;
                            e += obj.matrix[m].exec || 0;
                        }
                    }
                });
            });
            return { p, e };
        };

        const inspProg = findProgExecForMonth('Inspección', month);
        const monitProg = findProgExecForMonth('Monitoreo', month);
        const emoProg = findProgExecForMonth('Exámenes Médicos', month);

        // Calculate specific HHT for month
        const monthAccidents = accidents?.months?.[month.toString()] || {};
        const hhtValue = month === 0 ? (accidents?.totals?.HHT || 0) : (monthAccidents.HHT || 0);

        setStats({
            totalInspections: filteredInsp.length,
            totalHHC: Math.round(totalHHC),
            compliancePct: month === 0 ? (monthlyComp.reduce((a, b) => a + b.seguridad, 0) / 12) : (monthlyComp[month - 1]?.seguridad || 0),
            hht: hhtValue,
            monthlyCompliance: monthlyComp,
            incidents: incidentTrend,
            performanceMatrix: [
                { title: 'Inspecciones de Seguridad', p: inspProg.p || (month === 0 ? 40 : 4), e: inspProg.e || filteredInsp.length, color: 'emerald' },
                { title: 'Monitoreos Ambientales', p: monitProg.p || (month === 0 ? 12 : 1), e: monitProg.e || 0, color: 'blue' },
                { title: 'Exámenes Médicos (EMO)', p: emoProg.p || (month === 0 ? 100 : 10), e: emoProg.e || 0, color: 'purple' },
            ]
        });
    };

    if (loading) {
        return (
            <div className="h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="animate-spin text-purple-500" size={48} />
                    <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-xs">Cargando Inteligencia de Datos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-[1600px] mx-auto space-y-8">
                    
                    {/* Header with Filters */}
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 blur-[100px] -mr-48 -mt-48 rounded-full"></div>
                        <div className="relative z-10">
                            <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4 mb-2">
                                <BarChart2 size={40} className="text-purple-500" />
                                12 Centro de Estadísticas
                            </h1>
                            <p className="text-slate-400 font-bold max-w-2xl">
                                Filtrando datos de <span className="text-purple-400">{selectedMonth === 0 ? 'Todo el Año' : MONTHS_FULL[selectedMonth - 1]}</span> de {selectedYear}.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4 relative z-10 w-full xl:w-auto">
                            <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
                                <select 
                                    value={selectedMonth} 
                                    onChange={e => setSelectedMonth(Number(e.target.value))}
                                    className="bg-transparent text-white text-xs font-black px-4 py-2 outline-none appearance-none cursor-pointer border-r border-slate-800 hover:text-purple-400 transition-colors"
                                >
                                    <option value={0} className="bg-slate-900">TODO EL AÑO</option>
                                    {MONTHS_FULL.map((m, i) => <option key={i} value={i+1} className="bg-slate-900">{m.toUpperCase()}</option>)}
                                </select>
                                <select 
                                    value={selectedYear} 
                                    onChange={e => setSelectedYear(Number(e.target.value))}
                                    className="bg-transparent text-white text-xs font-black px-4 py-2 outline-none appearance-none cursor-pointer hover:text-purple-400 transition-colors"
                                >
                                    <option value={2024} className="bg-slate-900">2024</option>
                                    <option value={2025} className="bg-slate-900">2025</option>
                                    <option value={2026} className="bg-slate-900">2026</option>
                                </select>
                                <div className="flex items-center pr-3 pl-1 text-slate-600">
                                    <Calendar size={14} />
                                </div>
                            </div>
                            
                            <button className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-2xl border border-slate-700 flex items-center gap-2 text-xs font-black transition-all shadow-xl active:scale-95">
                                <Download size={16} /> EXPORTAR
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Cumplimiento', val: `${Math.round(stats.compliancePct)}%`, color: 'text-emerald-400', icon: <Target size={20} /> },
                            { label: 'HHT Periodo', val: stats.hht.toLocaleString(), color: 'text-blue-400', icon: <Shield size={20} /> },
                            { label: 'Inspecciones', val: stats.totalInspections, color: 'text-purple-400', icon: <BarChart2 size={20} /> },
                            { label: 'Horas Capacitación', val: stats.totalHHC, color: 'text-amber-400', icon: <Activity size={20} /> },
                        ].map((card, i) => (
                            <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl hover:border-slate-700 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 text-slate-400 group-hover:text-white transition-colors">
                                        {card.icon}
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedMonth === 0 ? 'ANUAL' : 'MENSUAL'}</span>
                                </div>
                                <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-tighter">{card.label}</p>
                                <p className={`text-3xl font-black ${card.color}`}>{card.val}</p>
                            </div>
                        ))}
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* Compliance Chart */}
                        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-xl">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                                    <TrendingUp size={24} className="text-emerald-500" />
                                    Tendencia Anual {selectedYear}
                                </h3>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Seguridad</span>
                                    </div>
                                </div>
                            </div>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.monthlyCompliance}>
                                        <defs>
                                            <linearGradient id="colorSeg" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="name" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                                            cursor={{ stroke: '#334155', strokeWidth: 2 }}
                                        />
                                        <Area type="monotone" dataKey="seguridad" stroke="#10b981" fillOpacity={1} fill="url(#colorSeg)" strokeWidth={3} />
                                        {/* Highlight selected month */}
                                        {selectedMonth > 0 && (
                                            <ReferenceLine x={MONTHS_SHORT[selectedMonth - 1]} stroke="#8b5cf6" strokeDasharray="3 3" />
                                        )}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Incident Trend */}
                        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-xl">
                            <h3 className="text-xl font-black text-white tracking-tight mb-8 flex items-center gap-3">
                                <Activity size={24} className="text-rose-500" />
                                Histórico de Siniestralidad
                            </h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.incidents}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="month" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip 
                                            cursor={{fill: '#1e293b', radius: 8}}
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px' }}
                                        />
                                        <Bar dataKey="nearMiss" name="Cuasi-accidentes" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                        <Bar dataKey="accidents" name="Accidentes" fill="#ef4444" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>

                    {/* Bottom Section - Detailed Stats */}
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-xl">
                        <div className="flex items-center gap-4 mb-8">
                            <Shield size={24} className="text-blue-500" />
                            <h3 className="text-xl font-black text-white tracking-tight">Efectividad Operativa: {selectedMonth === 0 ? 'Año' : MONTHS_FULL[selectedMonth - 1]}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {stats.performanceMatrix.map((item, i) => (
                                <div key={i} className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.title}</p>
                                        <p className="text-lg font-black text-white">{Math.min(100, Math.round((item.e/Math.max(1, item.p))*100))}%</p>
                                    </div>
                                    <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                        <div 
                                            className={`h-full bg-${item.color}-500 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-1000`} 
                                            style={{ width: `${Math.min(100, (item.e/Math.max(1, item.p))*100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase">
                                        <span>Programado: {item.p}</span>
                                        <span className={`text-${item.color}-400 font-bold`}>Ejecutado: {item.e}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// Helper needed for the highlight line
import { ReferenceLine } from 'recharts';

