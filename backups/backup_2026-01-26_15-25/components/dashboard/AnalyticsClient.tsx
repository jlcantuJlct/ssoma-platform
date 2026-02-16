"use client";

import { useState } from "react";
import { Calculator, ShieldCheck } from "lucide-react";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { ResponsibleProgress } from "@/components/dashboard/ResponsibleProgress";
import { Activity } from "@/lib/types";

interface AnalyticsClientProps {
    activities: Activity[];
}

export default function AnalyticsClient({ activities }: AnalyticsClientProps) {
    const [selectedYear, setSelectedYear] = useState(2026);

    return (
        <div className="space-y-6">
            {/* Header Premium */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
                        <Calculator size={28} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tighter mb-1 flex items-center gap-3 uppercase">
                            Centro de Control <span className="text-emerald-500">HHC</span>
                        </h1>
                        <p className="text-slate-400 font-medium">Historial de Índices y Gestión de Formación</p>
                    </div>
                </div>
                <div className="flex gap-2 bg-slate-950/50 p-1 rounded-xl border border-slate-800 items-center">
                    <div className="px-4 py-2 text-xs font-black text-emerald-400 uppercase tracking-widest border-r border-slate-800 flex items-center gap-2">
                        <span>AÑO</span>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="bg-transparent border-none text-emerald-400 font-black focus:ring-0 outline-none cursor-pointer appearance-none p-0"
                        >
                            {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                                <option key={y} value={y} className="bg-slate-900 text-white">{y}</option>
                            ))}
                        </select>
                    </div>
                    <div className="px-4 py-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                        SSOMA v2.0
                    </div>
                </div>
            </div>

            {/* Main HHC Dashboard Content */}
            <div className="animate-in fade-in duration-500">
                <DashboardCharts
                    activities={activities}
                    mode="hhc"
                    currentYear={selectedYear}
                />
            </div>

            {/* Sección Dinámica de Progreso por Responsable */}
            <ResponsibleProgress />
        </div>
    );
}
