"use client";

import React, { useEffect, useState } from 'react';
import { ComplianceGauge } from './ComplianceGauge';
import { User, MapPin, Activity } from 'lucide-react';

// Configuration Presets for original team to preserve custom mappings
const PRESETS: Record<string, any> = {
    'Jose Galliquio': {
        name: "Jose Galliquio",
        zones: ["PAD San Clemente", "Zona Industrial Pisco lado B"],
        area: "seguridad",
        label: "PAD San Clemente / Pisco B",
        matchName: false
    },
    'Albert Chuquisapon': {
        name: "Albert Chuquisapon",
        zones: ["PAD Chinchaysullo"],
        area: "seguridad",
        label: "PAD Chinchaysullo",
        matchName: false
    },
    'Benjy Vega': {
        name: "Benjy Vega",
        zones: ["Cañete", "Mant. Periodico", "Mant. Rutinario", "Peaje Hawuay"],
        area: "seguridad",
        label: "Cañete, Peajes y Mant.",
        matchName: false
    },
    'Gladis Aroste': {
        name: "Gladis Aroste",
        zones: [],
        area: "salud",
        label: "Área de Salud",
        matchName: true
    },
    'Jesus Villalogos': {
        name: "Jesus Villalogos",
        zones: [],
        area: "seguridad",
        label: "Inspector General",
        matchName: true
    },
    'Adrian Suarez': {
        name: "Adrian Suarez",
        zones: [],
        area: "seguridad",
        label: "Inspector General",
        matchName: true
    },
    'Fabricio Galvez': {
        name: "Fabricio Galvez",
        zones: ["Zona Industrial Pisco lado A"],
        area: "seguridad",
        label: "Zona Ind. Pisco A",
        matchName: false
    }
};

export function ResponsibleProgress() {
    const [stats, setStats] = useState<Record<string, { executed: number, total: number, percent: number }>>({});
    const [activeConfigs, setActiveConfigs] = useState<Record<string, any>>({});
    const [monthName, setMonthName] = useState("");

    useEffect(() => {
        try {
            // Load Data
            const hhcStored = localStorage.getItem('hhc_records');
            const programStored = localStorage.getItem('monthly_training_program');
            const responsiblesStored = localStorage.getItem('ssoma_responsibles');
            const inspectionsStored = localStorage.getItem('inspections_records');
            const pmaStored = localStorage.getItem('pma_evidence_records');
            const annualStored = localStorage.getItem('annual_program_data');

            const hhcRecords: any[] = hhcStored ? JSON.parse(hhcStored) : [];
            const program: any[] = programStored ? JSON.parse(programStored) : [];
            const responsiblesList: string[] = responsiblesStored ? JSON.parse(responsiblesStored) : Object.keys(PRESETS);
            const inspectionRecords: any[] = inspectionsStored ? JSON.parse(inspectionsStored) : [];
            const pmaRecords: any[] = pmaStored ? JSON.parse(pmaStored) : [];
            const annualProgram: any = annualStored ? JSON.parse(annualStored) : {};

            // Filter for Current Month
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();

            setMonthName(new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(now));

            // 1. Build Dynamic Configurations
            const newConfigs: Record<string, any> = {};

            responsiblesList.forEach(name => {
                // EXCLUDE Developer/Admin
                if (name === 'Jose Luis Cancino' || name.toLowerCase().includes('gerencia')) return;

                // Use Preset if exists, else Default
                if (PRESETS[name]) {
                    newConfigs[name] = PRESETS[name];
                } else {
                    newConfigs[name] = {
                        name: name,
                        zones: [],
                        area: 'seguridad', // Default assumption
                        label: 'Inspector General',
                        matchName: true
                    };
                }
            });

            setActiveConfigs(newConfigs);

            // 2. Calculate Totals
            const newStats: any = {};

            // Helper to match responsible
            const isResponsible = (r: any, config: any) => {
                // Match Name
                if (config.matchName) {
                    return r.responsable?.toLowerCase().includes(config.name.toLowerCase().split(' ')[0]) ||
                        r.responsible?.toLowerCase().includes(config.name.toLowerCase().split(' ')[0]);
                }
                // Match Zone
                if (r.lugar && config.zones.some((z: string) => r.lugar.toLowerCase().includes(z.toLowerCase()))) {
                    return true;
                }
                // Fallback Match Name
                return r.responsable?.toLowerCase().includes(config.name.toLowerCase().split(' ')[0]) ||
                    r.responsible?.toLowerCase().includes(config.name.toLowerCase().split(' ')[0]);
            };

            Object.entries(newConfigs).forEach(([key, config]) => {
                // --- PLANNED ---

                // 1. Trainings (Plan)
                const planTrainings = program.filter(p => {
                    if (!p || !p.date) return false;
                    const d = new Date(p.date);
                    return d.getMonth() === currentMonth &&
                        d.getFullYear() === currentYear &&
                        p.area === config.area;
                }).length;

                // 2. Inspections (Plan) - From Annual Program based on Area
                let targetObj = 'obj3'; // Default Safety
                if (config.area === 'salud') targetObj = 'obj7';
                if (config.area === 'environment') targetObj = 'obj9';

                const areaActivities = annualProgram[targetObj] || [];

                // Sum plan values for current month
                const planInspections = areaActivities.reduce((acc: number, act: any) => {
                    const val = act?.data?.plan?.[currentMonth];
                    return acc + (Number(val) || 0);
                }, 0);

                // 3. PMA (Plan)
                const planPMA = 12; // Fixed constant

                const totalPlan = planTrainings + planInspections + planPMA;

                // --- EXECUTED ---

                // 1. Trainings (Exec)
                const execTrainings = hhcRecords.filter(r => {
                    if (!r || !r.date) return false;
                    const d = new Date(r.date);
                    const isMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                    return isMonth && isResponsible(r, config);
                }).length;

                // 2. Inspections (Exec)
                const execInspections = inspectionRecords.filter(r => {
                    if (!r || !r.date) return false;
                    const d = new Date(r.date);
                    const isMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                    return isMonth && isResponsible(r, config);
                }).length;

                // 3. PMA (Exec)
                const execPMA = pmaRecords.filter(r => {
                    if (!r || !r.date) return false;
                    const d = new Date(r.date);
                    const isMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                    return isMonth && isResponsible(r, config);
                }).length;

                const totalExec = execTrainings + execInspections + execPMA;

                // Avoid division by zero
                const finalPlan = totalPlan === 0 ? (totalExec > 0 ? totalExec : 1) : totalPlan;
                const pct = Math.min(Math.round((totalExec / finalPlan) * 100), 100);

                newStats[key] = {
                    executed: totalExec,
                    total: finalPlan,
                    percent: pct
                };
            });

            setStats(newStats);
        } catch (error) {
            console.error("ResponsibleProgress Data Error:", error);
        }
    }, []);

    return (
        <div className="pt-8 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-slate-800 rounded-lg">
                    <Activity size={20} className="text-indigo-400" />
                </div>
                <div>
                    <h2 className="text-lg font-black text-slate-400 uppercase tracking-widest leading-none">
                        Avance de Capacitaciones
                    </h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
                        Desempeño Mensual por Responsable ({monthName})
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-6 perspective-[1000px]">
                {Object.values(activeConfigs).map((config: any) => {
                    const stat = stats[config.name] || { percent: 0, executed: 0, total: 0 };
                    return (
                        <div key={config.name} className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 p-3 rounded-[1.25rem] shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-50"></div>

                            {/* Glass Reflection */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                            {/* Header */}
                            <div className="text-center mb-2 z-10 w-full">
                                <h3 className="text-[9px] font-black text-white uppercase tracking-widest mb-1 shadow-black drop-shadow-md truncate w-full" title={config.name}>
                                    {config.name}
                                </h3>
                                <div className="flex items-center justify-center gap-1.5 text-[7px] text-slate-400 font-bold uppercase tracking-tight bg-slate-950/40 px-2 py-0.5 rounded-full border border-slate-800/50">
                                    <MapPin size={6} className="text-indigo-400" />
                                    <span className="truncate max-w-[80px]">{config.label}</span>
                                </div>
                            </div>

                            {/* Gauge */}
                            <div className="mb-0 relative z-10 drop-shadow-lg -mt-1">
                                <ComplianceGauge
                                    value={stat.percent}
                                    title=""
                                    width={100}
                                    height={70}
                                />
                            </div>

                            {/* Footer Stats */}
                            <div className="w-full flex justify-between items-center px-3 py-2 bg-slate-950/80 rounded-xl text-[9px] font-mono text-slate-500 border border-slate-800/50 z-10 shadow-inner">
                                <span>EJEC: <span className="text-white font-bold text-[10px]">{stat.executed}</span></span>
                                <span>PLAN: <span className="text-indigo-400 font-bold text-[10px]">{stat.total}</span></span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
