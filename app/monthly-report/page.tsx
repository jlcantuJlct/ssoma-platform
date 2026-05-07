"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
    FileText,
    Download,
    ChevronLeft,
    Wrench,
    Save,
    RotateCcw,
    Activity,
    ClipboardCheck,
    Shield,
    HardHat,
    Leaf
} from "lucide-react";
import { uploadEvidence } from "@/app/actions";

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function MonthlyReportPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [showFeedingPanel, setShowFeedingPanel] = useState(false);
    const [savingTools, setSavingTools] = useState(false);

    // Manual stats state
    const [manualStats, setManualStats] = useState<Record<string, number>>({
        HHT: 0, ATT: 0, APP: 0, ATP: 0, AM: 0, TDP: 0, EO: 0, EP: 0,
        RES_PEL: 0, RES_NO_PEL: 0, RES_APROV: 0
    });

    // --- ACCESS CONTROL ---
    useEffect(() => {
        if (user && user.role !== 'developer' && user.role !== 'manager') {
            router.push('/');
        }
    }, [user, router]);

    // --- LOAD DATA ---
    useEffect(() => {
        const loadReportTools = async () => {
            setLoadingData(true);
            try {
                const res = await fetch(`/api/report-tools?type=stats&month=${selectedMonth + 1}&year=${selectedYear}&location=SAN CLEMENTE`);
                const data = await res.json();
                if (data.success) {
                    const newStats = { ...manualStats };
                    data.stats.forEach((s: any) => {
                        newStats[s.stat_key] = s.stat_value;
                    });
                    setManualStats(newStats);
                }
            } catch (e) {
                console.error("Error loading tools:", e);
            } finally {
                setLoadingData(false);
            }
        };

        loadReportTools();
    }, [selectedMonth, selectedYear]);

    const saveReportStats = async () => {
        setSavingTools(true);
        try {
            await fetch('/api/report-tools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'stats',
                    month: selectedMonth + 1,
                    year: selectedYear,
                    location: 'SAN CLEMENTE',
                    data: manualStats
                })
            });
            alert("✅ Estadísticas guardadas");
        } catch (e) {
            alert("❌ Error al guardar");
        } finally {
            setSavingTools(false);
        }
    };

    const handleAutoFill = async () => {
        setLoadingData(true);
        try {
            alert("📊 Sincronizando datos oficiales desde el Excel de Estadísticas...");
            const res = await fetch(`/api/report-tools/excel-extract?month=${selectedMonth + 1}&location=SAN CLEMENTE`);
            const data = await res.json();
            if (data.success) {
                setManualStats(prev => ({ ...prev, ...data.stats }));
                alert(`✅ Datos de ${MONTHS[selectedMonth]} sincronizados correctamente.`);
            } else {
                alert("❌ Error al extraer datos del Excel: " + data.error);
            }
        } catch (e: any) {
            alert("❌ Error de conexión al servidor");
        } finally {
            setLoadingData(false);
        }
    };

    const pollStatus = async (requestId: any) => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/export-center?action=check-status&id=${requestId}`, {
                    headers: { 'Authorization': 'Bearer ssoma_cron_2026' }
                });
                const data = await res.json();
                if (data.status === 'completed') {
                    clearInterval(interval);
                    alert("✅ ¡INFORME LISTO!\n\nEl Robot ha terminado de generar el informe. Ya puedes abrirlo en tu carpeta de 'Informe mensual'.");
                }
            } catch (e) {
                console.error("Error polling status:", e);
            }
        }, 5000);
        
        // Timeout de seguridad después de 5 minutos
        setTimeout(() => clearInterval(interval), 300000);
    };

    const handleGenerateWord = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch('/api/export-center', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create',
                    month: selectedMonth + 1,
                    year: selectedYear,
                    type: 'MONTHLY_WORD'
                })
            });
            
            const data = await res.json();
            if (data.success) {
                alert("🤖 ¡Robot Despertado!\n\nLa solicitud ha sido enviada al Robot Local. Te avisaré por aquí en cuanto el informe esté listo en tu carpeta.");
                pollStatus(data.requestId);
            } else {
                throw new Error(data.error || "Error al solicitar al robot");
            }
        } catch (error: any) {
            alert(`❌ Error al despertar al robot: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-white flex items-center justify-center">
            <div className="max-w-2xl w-full space-y-8 bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-xl">
                
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex p-4 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 mb-2">
                        <FileText size={40} className="text-emerald-500" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white uppercase">Generador de Informe</h1>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto">Selecciona el periodo para compilar el documento Word con estadísticas y evidencias.</p>
                </div>

                {/* Main Control */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mes del Reporte</label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-emerald-500 outline-none transition-all font-bold"
                            >
                                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Año</label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-emerald-500 outline-none transition-all font-bold"
                            >
                                <option value={2025}>2025</option>
                                <option value={2026}>2026</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleGenerateWord}
                            disabled={isGenerating || loadingData}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/20 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-tighter text-lg"
                        >
                            {isGenerating ? (
                                <><div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> DESPERTANDO ROBOT...</>
                            ) : (
                                <><Activity size={24} className="text-emerald-300" /> SOLICITAR INFORME AL ROBOT</>
                            )}
                        </button>

                        {/* NUEVO BOTÓN DIRECTO PARA LA PLANTILLA DE 109MB */}
                        <a
                            href={`/api/export-word?month=${selectedMonth + 1}&year=${selectedYear}&location=SAN CLEMENTE`}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-tighter text-sm"
                        >
                            <Download size={20} className="text-blue-200" /> GENERAR WORD DIRECTO (SIN ROBOT)
                        </a>

                        <button 
                            onClick={() => setShowFeedingPanel(!showFeedingPanel)}
                            className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 py-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all border border-slate-800"
                        >
                            <Wrench size={16} /> {showFeedingPanel ? 'OCULTAR ESTADÍSTICAS' : 'EDITAR ESTADÍSTICAS MANUALES'}
                        </button>
                    </div>
                </div>

                {/* Feeding Panel (Stats) */}
                {showFeedingPanel && (
                    <div className="pt-6 border-t border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="bg-slate-950/50 rounded-3xl p-6 space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                    <Activity size={16} /> Datos de Accidentabilidad
                                </h3>
                                <div className="flex gap-2">
                                    <button onClick={handleAutoFill} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400" title="Sincronizar Excel">
                                        <RotateCcw size={14} />
                                    </button>
                                    <button onClick={saveReportStats} disabled={savingTools} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase">
                                        <Save size={14} className="inline mr-1" /> Guardar
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-600 uppercase">HHT (Horas Hombre)</label>
                                    <input type="number" value={manualStats.HHT} onChange={(e) => setManualStats({...manualStats, HHT: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-600 uppercase">TDP (Días Perdidos)</label>
                                    <input type="number" value={manualStats.TDP} onChange={(e) => setManualStats({...manualStats, TDP: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm" />
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                                {['ATT', 'APP', 'ATP', 'AM'].map(key => (
                                    <div key={key} className="space-y-1">
                                        <label className="text-[8px] font-bold text-slate-700 uppercase">{key}</label>
                                        <input type="number" value={manualStats[key]} onChange={(e) => setManualStats({...manualStats, [key]: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white" />
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                                {['RES_PEL', 'RES_NO_PEL', 'RES_APROV'].map(key => (
                                    <div key={key} className="space-y-1">
                                        <label className="text-[8px] font-bold text-slate-700 uppercase">{key.replace('RES_', '')}</label>
                                        <input type="number" value={manualStats[key]} onChange={(e) => setManualStats({...manualStats, [key]: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-emerald-500 font-bold" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Bottom Navigation */}
                <div className="flex justify-center pt-4">
                    <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-2 transition-colors">
                        <ChevronLeft size={14} /> Volver al Panel
                    </button>
                </div>

            </div>
        </div>
    );
}
