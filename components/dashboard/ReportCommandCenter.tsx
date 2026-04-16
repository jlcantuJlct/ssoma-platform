"use client";

import { useState, useEffect } from "react";
import { 
    X, 
    Save, 
    Upload, 
    FileText, 
    Trash2, 
    Activity, 
    Leaf, 
    Calculator, 
    ClipboardCheck, 
    CheckCircle2, 
    AlertCircle,
    RotateCcw,
    HardDrive,
    ExternalLink,
    Lock,
    Unlock
} from "lucide-react";
import { uploadEvidence } from "@/app/actions";

const ANNEXES_TYPES = [
    { id: 0, label: "INFORME SIMULACRO", isPermanent: false },
    { id: 1, label: "CERTIFICADO EORS", isPermanent: false },
    { id: 2, label: "CERTIFICADOS DE OPERATIVIDAD", isPermanent: false },
    { id: 3, label: "AUTORIZACIONES AREAS AUXILIARES", isPermanent: false },
    { id: 4, label: "FLUJOGRAMA", isPermanent: true },
    { id: 5, label: "CODIGO DE CONDUCTA", isPermanent: true },
    { id: 6, label: "COMPRAS LOCALES", isPermanent: false },
    { id: 7, label: "CAPACITACIONES OBRA", isPermanent: false },
    { id: 8, label: "POLITICA Y PLAN", isPermanent: true },
    { id: 9, label: "ESTADISTICAS SSOMA", isPermanent: false },
    { id: 10, label: "CHARLA DIARIA", isPermanent: false },
    { id: 11, label: "EMOs", isPermanent: false },
    { id: 12, label: "ENTREGA DE EPPS", isPermanent: false },
    { id: 13, label: "SUB COMITE", isPermanent: false },
    { id: 14, label: "SCTR", isPermanent: false },
    { id: 15, label: "ATS Y PETAR", isPermanent: false },
    { id: 16, label: "PLAN DE CONTINGENCIA", isPermanent: true },
    { id: 17, label: "POLIZA", isPermanent: true }
];

interface ReportCommandCenterProps {
    onClose: () => void;
    currentMonth: number; // 0-11
    currentYear: number;
    location: string;
}

export function ReportCommandCenter({ onClose, currentMonth, currentYear, location }: ReportCommandCenterProps) {
    const [activeTab, setActiveTab] = useState<'stats' | 'annexes'>('stats');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Stats State
    const [stats, setStats] = useState<Record<string, number>>({
        HHT: 0,
        ATT: 0, APP: 0, ATP: 0, AM: 0, TDP: 0, EO: 0, EP: 0,
        RES_PEL: 0, RES_NO_PEL: 0, RES_APROV: 0
    });

    // Annexes State
    const [annexes, setAnnexes] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, [currentMonth, currentYear, location]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch Stats
            const resStats = await fetch(`/api/report-tools?type=stats&month=${currentMonth + 1}&year=${currentYear}&location=${location}`);
            const dataStats = await resStats.json();
            if (dataStats.success) {
                const newStats: any = { ...stats };
                dataStats.stats.forEach((s: any) => {
                    newStats[s.stat_key] = s.stat_value;
                });
                setStats(newStats);
            }

            // Fetch Annexes
            const resAnnexes = await fetch(`/api/report-tools?type=annexes&month=${currentMonth + 1}&year=${currentYear}&location=${location}`);
            const dataAnnexes = await resAnnexes.json();
            if (dataAnnexes.success) {
                setAnnexes(dataAnnexes.annexes);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveStats = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/report-tools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'stats',
                    month: currentMonth + 1,
                    year: currentYear,
                    location,
                    data: stats
                })
            });
            if (res.ok) alert("✅ Estadísticas sincronizadas con la Nube");
        } catch (e) {
            alert("❌ Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    const handleUploadAnnex = async (file: File, annexId: number, label: string, isPermanent: boolean) => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('activityId', `ANNEX_${annexId}`); // Virtual ID for storage path
            formData.append('month', (currentMonth + 1).toString());

            const uploadRes = await uploadEvidence(formData);
            if (!uploadRes.success) throw new Error("Upload failed");

            const res = await fetch('/api/report-tools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'annexes',
                    month: currentMonth + 1,
                    year: currentYear,
                    location,
                    data: {
                        annex_id: annexId,
                        label: label,
                        file_path: uploadRes.path,
                        is_permanent: isPermanent
                    }
                })
            });
            if (res.ok) loadData();
        } catch (e) {
            alert("❌ Error al subir anexo");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAnnex = async (id: number) => {
        if (!confirm("¿Eliminar este anexo?")) return;
        setSaving(true);
        try {
            await fetch(`/api/report-tools?id=${id}`, { method: 'DELETE' });
            loadData();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const getAnnexStatus = (annexId: number) => {
        return annexes.find(a => a.annex_id === annexId);
    };

    const monthsNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg ring-4 ring-indigo-500/20">
                            <ClipboardCheck size={28} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Herramientas de Reporte Consolidado</h2>
                            <p className="text-slate-400 font-bold text-sm flex items-center gap-2">
                                <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 uppercase text-[10px]">{location}</span>
                                <span>Período: {monthsNames[currentMonth]} {currentYear}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors bg-slate-800/50 rounded-xl border border-white/5">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-8 py-4 gap-4 bg-slate-950/20">
                    <button 
                        onClick={() => setActiveTab('stats')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'stats' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300 bg-slate-800/50 border border-white/5'}`}
                    >
                        <Calculator size={16} /> KPIs Y ESTADÍSTICAS
                    </button>
                    <button 
                        onClick={() => setActiveTab('annexes')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'annexes' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300 bg-slate-800/50 border border-white/5'}`}
                    >
                        <FileText size={16} /> GESTOR DE ANEXOS (0-17)
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-900/40">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-500 font-black animate-pulse">SINCRO NIZANDO DATOS DE LA NUBE...</p>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'stats' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Seguridad */}
                                        <div className="bg-slate-800/30 border border-slate-700/50 rounded-3xl p-6 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                                                <Activity size={80} className="text-indigo-400" />
                                            </div>
                                            <h3 className="text-white font-black uppercase text-sm mb-6 flex items-center gap-2 border-b border-white/5 pb-2">
                                                <Activity size={16} className="text-indigo-400" /> Indicadores de Seguridad
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Horas Hombre (HHT)</label>
                                                    <div className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2 text-indigo-400 font-black cursor-not-allowed flex justify-between items-center">
                                                        <span>{stats.HHT || 0}</span>
                                                        <span className="text-[8px] tracking-widest text-indigo-900/80 bg-indigo-500/10 px-2 py-0.5 rounded-full font-bold">EXCEL</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Días Perdidos (TDP)</label>
                                                    <div className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2 text-red-500 font-black cursor-not-allowed flex justify-between items-center">
                                                        <span>{stats.TDP || 0}</span>
                                                        <span className="text-[8px] tracking-widest text-red-900/80 bg-red-500/10 px-2 py-0.5 rounded-full font-bold">EXCEL</span>
                                                    </div>
                                                </div>
                                                {['ATT', 'APP', 'ATP', 'AM', 'EO', 'EP'].map(key => (
                                                    <div key={key} className="space-y-1">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase">{key === 'ATT' ? 'Accid. Totales (ATT)' : key}</label>
                                                        <div className="w-full bg-slate-900/30 border border-slate-800 rounded-xl px-4 py-2 text-slate-400 font-mono cursor-not-allowed flex justify-between items-center">
                                                            <span>{stats[key] || 0}</span>
                                                            <span className="text-[8px] tracking-widest text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full font-bold">AUTO</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Medio Ambiente */}
                                        <div className="bg-slate-800/30 border border-slate-700/50 rounded-3xl p-6 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                                                <Leaf size={80} className="text-emerald-400" />
                                            </div>
                                            <h3 className="text-white font-black uppercase text-sm mb-6 flex items-center gap-2 border-b border-white/5 pb-2">
                                                <Leaf size={16} className="text-emerald-400" /> Monitoreo Ambiental (Residuos)
                                            </h3>
                                            <div className="space-y-6">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Residuos Peligrosos (Kg)</label>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="number" 
                                                            value={stats.RES_PEL} 
                                                            onChange={(e) => setStats({...stats, RES_PEL: Number(e.target.value)})}
                                                            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-emerald-400 font-black focus:border-emerald-500 outline-none" 
                                                        />
                                                        <span className="flex items-center text-[10px] font-bold text-slate-600 bg-slate-950 px-3 rounded-xl border border-slate-800">KG</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Residuos NO Peligrosos (Kg)</label>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="number" 
                                                            value={stats.RES_NO_PEL} 
                                                            onChange={(e) => setStats({...stats, RES_NO_PEL: Number(e.target.value)})}
                                                            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-emerald-400 font-black focus:border-emerald-500 outline-none" 
                                                        />
                                                        <span className="flex items-center text-[10px] font-bold text-slate-600 bg-slate-950 px-3 rounded-xl border border-slate-800">KG</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Residuos Aprovechables (Kg)</label>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="number" 
                                                            value={stats.RES_APROV} 
                                                            onChange={(e) => setStats({...stats, RES_APROV: Number(e.target.value)})}
                                                            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-emerald-400 font-black focus:border-emerald-500 outline-none" 
                                                        />
                                                        <span className="flex items-center text-[10px] font-bold text-slate-600 bg-slate-950 px-3 rounded-xl border border-slate-800">KG</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end p-4">
                                        <button 
                                            onClick={handleSaveStats}
                                            disabled={saving}
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-8 py-3 rounded-2xl shadow-xl shadow-emerald-900/20 active:scale-95 transition-all flex items-center gap-2"
                                        >
                                            {saving ? '...' : <><Save size={18} /> GUARDAR ESTADÍSTICAS DEL MES</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'annexes' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="mb-6 bg-indigo-900/20 border border-indigo-500/20 rounded-2xl p-4 flex items-start gap-3">
                                        <AlertCircle className="text-indigo-400 shrink-0" size={20} />
                                        <p className="text-[11px] text-indigo-300 font-medium">
                                            Los anexos marcados como <span className="font-black text-white">Permanente</span> persistirán todos los meses una vez cargados. Los anexos <span className="font-black text-white">Mensuales</span> deben subirse para cada período específico.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {ANNEXES_TYPES.map((type) => {
                                            const saved = getAnnexStatus(type.id);
                                            return (
                                                <div key={type.id} className={`p-4 rounded-2xl border transition-all ${saved ? 'bg-slate-800 border-indigo-500/50' : 'bg-slate-800/40 border-slate-700/50'} relative group`}>
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Anexo {type.id}</span>
                                                            <h4 className="text-[11px] font-black text-white uppercase line-clamp-1" title={type.label}>{type.label}</h4>
                                                        </div>
                                                        {type.isPermanent ? (
                                                            <div className="bg-purple-900/50 text-purple-400 p-1.5 rounded-lg border border-purple-800" title="Persiste todos los meses">
                                                                <Lock size={12} />
                                                            </div>
                                                        ) : (
                                                            <div className="bg-slate-900/50 text-slate-600 p-1.5 rounded-lg border border-slate-800" title="Específico de este mes">
                                                                <RotateCcw size={12} />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {saved ? (
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                                                                <CheckCircle2 size={16} className="text-emerald-500" />
                                                                <span className="text-[9px] text-slate-400 truncate flex-1">{saved.label}</span>
                                                                <a href={saved.file_path} target="_blank" className="text-indigo-400 hover:text-white"><ExternalLink size={12} /></a>
                                                            </div>
                                                            <button 
                                                                onClick={() => handleDeleteAnnex(saved.id)}
                                                                disabled={saving}
                                                                className="flex items-center justify-center gap-1 text-[9px] font-black text-red-400 hover:text-red-300 transition-colors py-1 uppercase"
                                                            >
                                                                <Trash2 size={10} /> Eliminar y Reemplazar
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="relative border-2 border-dashed border-slate-700 rounded-xl py-4 group-hover:border-indigo-500/50 transition-colors bg-slate-950/20 text-center flex flex-col items-center gap-1 cursor-pointer">
                                                            <Upload size={16} className="text-slate-600 group-hover:text-indigo-400" />
                                                            <span className="text-[9px] font-bold text-slate-500 group-hover:text-slate-300">CARGAR PDF / JPG</span>
                                                            <input 
                                                                type="file" 
                                                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                                                onChange={(e) => e.target.files?.[0] && handleUploadAnnex(e.target.files[0], type.id, type.label, type.isPermanent)}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer status */}
                <div className="p-4 bg-slate-950 border-t border-white/5 flex justify-between items-center px-8">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${saving ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                            <span className="text-[10px] font-bold text-slate-500">{saving ? 'SINCRONIZANDO...' : 'SISTEMA CONECTADO'}</span>
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-600 font-mono">ID: {location.replace(/\s+/g, '_')}_MOD_2.5</p>
                </div>
            </div>
        </div>
    );
}
