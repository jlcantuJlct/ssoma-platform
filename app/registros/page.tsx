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
    
    // Mock data for initial view
    const [statsData, setStatsData] = useState({
        monthlyCompliance: [
            { name: 'Ene', seguridad: 85, salud: 70, ambiente: 90 },
            { name: 'Feb', seguridad: 88, salud: 75, ambiente: 85 },
            { name: 'Mar', seguridad: 92, salud: 80, ambiente: 88 },
            { name: 'Abr', seguridad: 95, salud: 85, ambiente: 92 },
        ],
        incidents: [
            { month: 'Ene', accidents: 1, nearMiss: 4 },
            { month: 'Feb', accidents: 0, nearMiss: 6 },
            { month: 'Mar', accidents: 1, nearMiss: 3 },
            { month: 'Abr', accidents: 0, nearMiss: 5 },
        ]
    });

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-[1600px] mx-auto space-y-8">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 blur-[100px] -mr-48 -mt-48 rounded-full"></div>
                        <div className="relative z-10">
                            <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4 mb-2">
                                <BarChart2 size={40} className="text-purple-500" />
                                12 Centro de Estadísticas y Registros
                            </h1>
                            <p className="text-slate-400 font-bold max-w-2xl">
                                Análisis avanzado de indicadores clave de desempeño (KPIs). Visualización de tendencias y cumplimiento normativo consolidado.
                            </p>
                        </div>
                        <div className="flex gap-3 relative z-10">
                            <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl border border-slate-700 flex items-center gap-2 text-xs font-bold transition-all">
                                <Download size={16} /> Exportar Reporte
                            </button>
                            <button className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-purple-900/20 flex items-center gap-2 text-xs font-bold transition-all">
                                <Filter size={16} /> Filtros Avanzados
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Cumplimiento Anual', val: '92%', color: 'text-emerald-400', icon: <Target size={20} /> },
                            { label: 'Horas Hombre Sin Acc.', val: '450k', color: 'text-blue-400', icon: <Shield size={20} /> },
                            { label: 'Inspecciones Realizadas', val: '124', color: 'text-purple-400', icon: <BarChart2 size={20} /> },
                            { label: 'Capacitaciones', val: '56', color: 'text-amber-400', icon: <Activity size={20} /> },
                        ].map((card, i) => (
                            <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl hover:border-slate-700 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 text-slate-400 group-hover:text-white transition-colors">
                                        {card.icon}
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global 2026</span>
                                </div>
                                <p className="text-xs font-bold text-slate-500 mb-1">{card.label}</p>
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
                                    Cumplimiento por Área (%)
                                </h3>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Seguridad</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Ambiente</span>
                                    </div>
                                </div>
                            </div>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={statsData.monthlyCompliance}>
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
                                        />
                                        <Area type="monotone" dataKey="seguridad" stroke="#10b981" fillOpacity={1} fill="url(#colorSeg)" strokeWidth={3} />
                                        <Area type="monotone" dataKey="ambiente" stroke="#3b82f6" fill="transparent" strokeWidth={3} strokeDasharray="5 5" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Incident Trend */}
                        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-xl">
                            <h3 className="text-xl font-black text-white tracking-tight mb-8 flex items-center gap-3">
                                <Activity size={24} className="text-rose-500" />
                                Tendencia de Incidentes
                            </h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={statsData.incidents}>
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
                            <h3 className="text-xl font-black text-white tracking-tight">Matriz de Desempeño Operativo</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { title: 'Inspecciones de Seguridad', p: 40, e: 38, color: 'emerald' },
                                { title: 'Monitoreos Ambientales', p: 12, e: 10, color: 'blue' },
                                { title: 'Exámenes Médicos (EMO)', p: 85, e: 82, color: 'purple' },
                            ].map((item, i) => (
                                <div key={i} className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.title}</p>
                                        <p className="text-lg font-black text-white">{Math.round((item.e/item.p)*100)}%</p>
                                    </div>
                                    <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                        <div 
                                            className={`h-full bg-${item.color}-500 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-1000`} 
                                            style={{ width: `${(item.e/item.p)*100}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase">
                                        <span>Programado: {item.p}</span>
                                        <span className={`text-${item.color}-400`}>Ejecutado: {item.e}</span>
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
