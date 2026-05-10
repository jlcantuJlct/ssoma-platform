"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Download, FileText, CheckCircle2, Loader2, AlertTriangle, ChevronRight } from 'lucide-react';

export default function OsitranReportPage() {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [isRequesting, setIsRequesting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [estimatedSeconds, setEstimatedSeconds] = useState(54); // ~3s por anexo (18 anexos)
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const annexes = [
        "ANEXO 0. INFORME SIMULACRO",
        "ANEXO 1. CERTIFICADO EORS",
        "ANEXO 2. CERTIFICADOS DE OPERATIVIDAD",
        "ANEXO 3. AUTORIZACIONES DE LAS ÁREAS AUXILIARES",
        "ANEXO 4. FLUJOGRAMA",
        "ANEXO 5. CÓDIGO DE CONDUCTA",
        "ANEXO 6. COMPRAS LOCALES",
        "ANEXO 7. CAPACITACIÓN OBRA PREVENCIÓN",
        "ANEXO 8. POLÍTICA Y PLAN",
        "ANEXO 9. ESTADÍSTICAS SSOMA",
        "ANEXO 10. CHARLA DIARIA",
        "ANEXO 11. EMOs",
        "ANEXO 12. ENTREGA DE EPPs",
        "ANEXO 13. SUB COMITÉ",
        "ANEXO 14. SCTR",
        "ANEXO 15. ATS Y PETAR",
        "ANEXO 16. PLAN DE CONTINGENCIA",
        "ANEXO 17. PÓLIZA"
    ];

    const handleExportRequest = async () => {
        setIsRequesting(true);
        setProgress(0);
        setStatus({ type: null, message: '' });

        try {
            const res = await fetch('/api/export-center', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'OSITRAN',
                    month: selectedMonth,
                    year: 2025
                })
            });

            const data = await res.json();

            if (data.success) {
                const requestId = data.requestId;
                setStatus({ 
                    type: 'success', 
                    message: '⏳ Solicitud enviada. El Robot Local está organizando los archivos en tu escritorio...' 
                });

                // Simulación de progreso suave mientras polleamos
                const progressInterval = setInterval(() => {
                    setProgress(prev => {
                        if (prev >= 92) return prev; // Quedarse en 92% hasta que el robot confirme
                        return prev + 1;
                    });
                }, 600); // 1% cada 0.6s -> 100% en ~60s

                // Polling for completion
                const pollInterval = setInterval(async () => {
                    try {
                        const statusRes = await fetch(`/api/export-center?action=check-status&id=${requestId}`);
                        const statusData = await statusRes.json();

                        if (statusData.status === 'completed') {
                            clearInterval(pollInterval);
                            clearInterval(progressInterval);
                            setProgress(100);
                            setIsRequesting(false);
                            setStatus({ 
                                type: 'success', 
                                message: '✅ ¡INFORME OSITRAN LISTO! Los 18 anexos ya están en la carpeta del escritorio.' 
                            });
                        }
                    } catch (e) {
                        console.error("Error polling:", e);
                    }
                }, 3000);

            } else {
                throw new Error(data.error || 'Error al procesar la solicitud');
            }
        } catch (error: any) {
            setIsRequesting(false);
            setProgress(0);
            setStatus({ type: 'error', message: `❌ Error: ${error.message}` });
        }
    };

    return (
        <div className="p-8 bg-slate-900 min-h-screen flex-1 text-slate-100">
            <div className="max-w-5xl mx-auto">
                <header className="mb-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-500 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                            <FileText className="w-6 h-6 text-slate-900" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Generador de Informe <span className="text-amber-500">OSITRAN</span></h1>
                    </div>
                    <p className="text-slate-400">Automatización de reportes mensuales y compilación de anexos para supervisión externa.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Panel de Control */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="bg-slate-800 border-slate-700 overflow-hidden shadow-2xl">
                            <CardHeader className="border-b border-slate-700 bg-slate-800/50">
                                <CardTitle className="text-lg flex items-center gap-2 font-black uppercase tracking-tighter">
                                    <Download className="w-5 h-5 text-amber-500" />
                                    Panel de Generación
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-8">
                                    <div className="flex flex-col gap-4">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Mes del Informe:</label>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                            {months.map((name, idx) => (
                                                <button
                                                    key={name}
                                                    onClick={() => setSelectedMonth(idx)}
                                                    className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                                        selectedMonth === idx 
                                                        ? 'bg-amber-500 text-slate-900 shadow-[0_0_20px_rgba(245,158,11,0.3)] border-transparent' 
                                                        : 'bg-slate-900 text-slate-400 hover:bg-slate-700 border border-slate-700'
                                                    }`}
                                                >
                                                    {name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {isRequesting && (
                                        <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Progreso de Compilación</span>
                                                <span className="text-xl font-black text-white">{progress}%</span>
                                            </div>
                                            <div className="w-full bg-slate-900 rounded-full h-4 p-1 border border-slate-700 shadow-inner">
                                                <div 
                                                    className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                                                <p className="text-[9px] font-bold uppercase tracking-wider italic">
                                                    {progress < 40 ? 'Recolectando evidencias...' : progress < 80 ? 'Generando PDFs de anexos...' : 'Organizando archivos en escritorio...'}
                                                </p>
                                                <span className="ml-auto text-[9px] font-black text-slate-500">Tiempo estimado: ~{Math.max(0, 60 - Math.round(progress * 0.6))}s</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20 flex gap-4 items-start">
                                        <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                                        <div className="text-sm space-y-1">
                                            <p className="text-amber-500 font-black text-[10px] uppercase tracking-widest">Información de Destino</p>
                                            <p className="text-slate-400 text-xs">El sistema creará la carpeta <strong className="text-slate-200">"Informes OSITRAN"</strong> en tu Escritorio con los 18 documentos necesarios.</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleExportRequest}
                                        disabled={isRequesting}
                                        className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 text-slate-900 font-bold rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all transform active:scale-[0.98]"
                                    >
                                        {isRequesting ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                Generando Informe...
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="w-6 h-6" />
                                                Generar Informe de Anexos OSITRAN
                                            </>
                                        )}
                                    </button>

                                    {status.type && (
                                        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
                                            status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                        }`}>
                                            {status.type === 'success' ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <AlertTriangle className="w-6 h-6 shrink-0" />}
                                            <p className="font-medium text-sm">{status.message}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Lista de Anexos */}
                    <div className="lg:col-span-1">
                        <Card className="bg-slate-800 border-slate-700 sticky top-8">
                            <CardHeader className="border-b border-slate-700">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">
                                    Compendio de Anexos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                <div className="divide-y divide-slate-700">
                                    {annexes.map((annex, i) => (
                                        <div key={i} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-700/50 transition-colors group">
                                            <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-[10px] font-bold text-amber-500 group-hover:bg-amber-500 group-hover:text-slate-900 transition-colors">
                                                {i}
                                            </div>
                                            <span className="text-xs text-slate-300 font-medium">{annex}</span>
                                            <ChevronRight className="w-3 h-3 ml-auto text-slate-600 group-hover:text-amber-500" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                            <div className="p-4 bg-slate-800/80 border-t border-slate-700 text-[10px] text-slate-500 text-center italic">
                                Total: 18 Anexos Obligatorios
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
