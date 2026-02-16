"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList, Cell, ReferenceLine } from "recharts";
import { Activity, MONTHS } from "@/lib/types";

interface ComparisonChartProps {
    activity: Activity;
    selectedMonthIndex?: number;
}

export function ComparisonChart({ activity, selectedMonthIndex = -1 }: ComparisonChartProps) {
    const allData = MONTHS.map((month, index) => ({
        name: month,
        Plan: activity.data.plan[index],
        Ejecutado: activity.data.executed[index],
        // Metadatos para tooltips custom
        compliance: activity.data.plan[index] > 0
            ? Math.round((activity.data.executed[index] / activity.data.plan[index]) * 100)
            : 0,
        index: index
    }));

    // Filter logic: show all if no month selected, or just the specific month
    const data = selectedMonthIndex === -1
        ? allData
        : allData.filter(d => d.index === selectedMonthIndex);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-slate-100 ring-1 ring-slate-900/5 text-slate-800 z-50">
                    <p className="font-black text-xs uppercase tracking-widest text-slate-400 mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <span className="text-xs font-bold w-16 uppercase">{entry.name}:</span>
                            <span className="text-base font-black font-mono">{entry.value}</span>
                        </div>
                    ))}
                    {payload[0].payload.Plan > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${payload[0].payload.compliance >= 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                {payload[0].payload.compliance}% CUMPLIMIENTO
                            </span>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full relative">
            <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data} margin={{ top: 25, right: 10, left: 0, bottom: 5 }} barGap={2}>
                    <defs>
                        <linearGradient id="barPlan" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8} />
                        </linearGradient>
                        <linearGradient id="barExec" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                            <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                        </linearGradient>
                        {/* Shadow filter for 3D effect */}
                        <filter id="shadow" height="130%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                            <feOffset dx="0" dy="2" result="offsetblur" />
                            <feFlood floodColor="rgba(0,0,0,0.2)" />
                            <feComposite in2="offsetblur" operator="in" />
                            <feMerge>
                                <feMergeNode />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

                    <XAxis
                        dataKey="name"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#94a3b8', fontWeight: 800, fontSize: 9 }}
                        interval={0}
                        dy={10}
                    />

                    <YAxis
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#cbd5e1', fontWeight: 700 }}
                        width={30}
                    />

                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', opacity: 0.8 }} />

                    <Legend
                        iconType="circle"
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '20px' }}
                    />

                    <Bar
                        dataKey="Plan"
                        fill="url(#barPlan)"
                        radius={[4, 4, 0, 0]}
                        name="PROGRAMADO"
                        filter="url(#shadow)"
                        maxBarSize={50}
                    >
                        {selectedMonthIndex === -1 && <LabelList dataKey="Plan" position="top" style={{ fill: '#94a3b8', fontSize: 9, fontWeight: '800' }} formatter={(val: any) => val > 0 ? val : ''} />}
                    </Bar>

                    <Bar
                        dataKey="Ejecutado"
                        fill="url(#barExec)"
                        radius={[4, 4, 0, 0]}
                        name="EJECUTADO"
                        filter="url(#shadow)"
                        maxBarSize={50}
                    >
                        {selectedMonthIndex === -1 && <LabelList dataKey="Ejecutado" position="top" style={{ fill: '#059669', fontSize: 10, fontWeight: '900' }} formatter={(val: any) => val > 0 ? val : ''} />}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
