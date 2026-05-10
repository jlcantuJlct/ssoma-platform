"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Download, FileText, CheckCircle2, Loader2, AlertTriangle, ChevronRight, MapPin, FolderSync } from 'lucide-react';
import { SSOMA_LOCATIONS } from '@/lib/locations';

export default function OsitranReportPage() {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedLocations, setSelectedLocations] = useState<string[]>(['PAD San Clemente']);
    const [isRequesting, setIsRequesting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState<'request' | 'folders' | 'download' | 'complete' | null>(null);
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
        "ANEXO 11. EMOS",
        "ANEXO 12. ENTREGA DE EPPS",
        "ANEXO 13. SUB COMITÉ",
        "ANEXO 14. SCTR",
        "ANEXO 15. ATS Y PETAR",
        "ANEXO 16. PLAN DE CONTINGENCIA",
        "ANEXO 17. PÓLIZA"
    ];

    const handleExportRequest = async () => {
        setIsRequesting(true);
        setProgress(0);
        setCurrentStep('request');
        setStatus({ type: null, message: '' });

        try {
            const res = await fetch('/api/export-center', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'OSITRAN',
                    month: selectedMonth,
                    year: 2026,
                    location: selectedLocations.join(', ')
                })
            });

            const data = await res.json();

            if (data.success) {
                const requestId = data.requestId;
                setCurrentStep('folders');
                setStatus({ 
                    type: 'success', 
                    message: '⏳ Solicitud enviada. El Robot Local está iniciando la descarga...' 
                });

                // Polling for completion
                const pollInterval = setInterval(async () => {
                    try {
                        const statusRes = await fetch(`/api/export-center?action=check-status&id=${requestId}`);
                        const statusData = await statusRes.json();

                        if (statusData.progress) {
                            setProgress(statusData.progress);
                            // Cambiar paso basado en porcentaje
                            if (statusData.progress > 5 && statusData.progress <= 30) setCurrentStep('folders');
                            if (statusData.progress > 30 && statusData.progress <= 90) setCurrentStep('download');
                            if (statusData.progress > 90) setCurrentStep('complete');
                        }

                        if (statusData.status === 'completed') {
                            clearInterval(pollInterval);
                            setProgress(100);
                            setCurrentStep('complete');
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
            setCurrentStep(null);
            setStatus({ type: 'error', message: `❌ Error: ${error.message}` });
        }
    };

    return (
        <div className="p-4 md:p-8 bg-slate-950 min-h-screen flex-1 text-slate-100">
            <div className="max-w-6xl mx-auto">
                <header className="mb-10 bg-slate-900/40 p-6 rounded-3xl border border-slate-800 backdrop-blur-md">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-amber-500 rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.3)]">
                            <FileText className="w-8 h-8 text-slate-950" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter uppercase italic">Generador de Informe <span className="text-amber-500">OSITRAN</span></h1>
                            <p className="text-slate-400 text-sm font-medium">Automatización de reportes mensuales y compilación de anexos para supervisión externa.</p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Panel de Control */}
                    <div className="lg:col-span-8 space-y-6">
                        <Card className="bg-slate-900 border-slate-800 overflow-hidden shadow-2xl border-2">
                            <CardHeader className="border-b border-slate-800 bg-slate-900/50 p-6">
                                <CardTitle className="text-xl flex items-center gap-3 font-black uppercase tracking-widest text-white">
                                    <FolderSync className="w-6 h-6 text-amber-500" />
                                    Panel de Generación Premium
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="space-y-10">
                                    {/* SELECCIÓN DE LUGAR */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MapPin className="w-4 h-4 text-amber-500" />
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Sede / Ubicación del Informe:</label>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {SSOMA_LOCATIONS.map((loc) => (
                                                <button
                                                    key={loc}
                                                    onClick={() => {
                                                        setSelectedLocations(prev => 
                                                            prev.includes(loc) 
                                                                ? prev.filter(l => l !== loc) 
                                                                : [...prev, loc]
                                                        );
                                                    }}
                                                    className={`px-4 py-3 rounded-xl text-[10px] font-bold transition-all border ${
                                                        selectedLocations.includes(loc) 
                                                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                                                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                                                    }`}
                                                >
                                                    {loc}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* SELECCIÓN DE MES */}
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">Mes del Informe:</label>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                            {months.map((name, idx) => (
                                                <button
                                                    key={name}
                                                    onClick={() => setSelectedMonth(idx)}
                                                    className={`px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                                        selectedMonth === idx 
                                                        ? 'bg-amber-500 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.4)] border-transparent' 
                                                        : 'bg-slate-950 text-slate-500 hover:bg-slate-800 border-slate-800'
                                                    }`}
                                                >
                                                    {name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {isRequesting && (
                                        <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800 space-y-6 shadow-inner animate-in zoom-in-95 duration-500">
                                            <div className="flex justify-between items-center">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Estado del Robot</span>
                                                    <p className="text-sm font-bold text-white flex items-center gap-2">
                                                        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                                                        {currentStep === 'request' && 'Validando solicitud...'}
                                                        {currentStep === 'folders' && 'Creando estructura de carpetas...'}
                                                        {currentStep === 'download' && 'Descargando anexos desde SharePoint...'}
                                                        {currentStep === 'complete' && 'Finalizando organización...'}
                                                    </p>
                                                </div>
                                                <span className="text-4xl font-black text-amber-500 tabular-nums">{progress}%</span>
                                            </div>

                                            <div className="relative pt-1">
                                                <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-slate-900 border border-slate-800 shadow-inner">
                                                    <div 
                                                        style={{ width: `${progress}%` }}
                                                        className="shadow-[0_0_20px_rgba(245,158,11,0.5)] flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-amber-600 to-amber-300 transition-all duration-1000 ease-out"
                                                    ></div>
                                                </div>
                                                
                                                {/* Steps indicators */}
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className={`h-1.5 rounded-full transition-colors ${progress > 5 ? 'bg-amber-500' : 'bg-slate-800'}`}></div>
                                                    <div className={`h-1.5 rounded-full transition-colors ${progress > 30 ? 'bg-amber-500' : 'bg-slate-800'}`}></div>
                                                    <div className={`h-1.5 rounded-full transition-colors ${progress > 90 ? 'bg-amber-500' : 'bg-slate-800'}`}></div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 mt-2">
                                                    <span className={`text-[8px] font-black uppercase text-center ${progress > 5 ? 'text-amber-500' : 'text-slate-600'}`}>Estructura</span>
                                                    <span className={`text-[8px] font-black uppercase text-center ${progress > 30 ? 'text-amber-500' : 'text-slate-600'}`}>Descarga</span>
                                                    <span className={`text-[8px] font-black uppercase text-center ${progress > 90 ? 'text-amber-500' : 'text-slate-600'}`}>Verificación</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {!isRequesting && (
                                        <div className="p-5 bg-amber-500/5 rounded-2xl border border-amber-500/20 flex gap-4 items-start shadow-inner">
                                            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                                            <div className="text-sm space-y-1">
                                                <p className="text-amber-500 font-black text-[10px] uppercase tracking-widest">Información de Destino</p>
                                                <p className="text-slate-400 text-xs">El sistema creará la carpeta <strong className="text-slate-200">"Informes OSITRAN / {selectedLocations.join(', ')}"</strong> en tu Escritorio con los 18 documentos necesarios del mes de {months[selectedMonth]}.</p>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleExportRequest}
                                        disabled={isRequesting}
                                        className="w-full py-5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black uppercase tracking-widest text-sm rounded-2xl shadow-[0_20px_40px_-15px_rgba(245,158,11,0.3)] flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] group"
                                    >
                                        {isRequesting ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                Procesando con Robot Local...
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                                Generar Informe de Anexos OSITRAN
                                            </>
                                        )}
                                    </button>

                                    {status.type && (
                                        <div className={`p-5 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2 border-2 ${
                                            status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                                        }`}>
                                            <div className={`p-2 rounded-full ${status.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                                {status.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                                            </div>
                                            <p className="font-bold text-sm leading-relaxed">{status.message}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Lista de Anexos */}
                    <div className="lg:col-span-4">
                        <Card className="bg-slate-900 border-slate-800 sticky top-8 shadow-2xl rounded-3xl overflow-hidden border">
                            <CardHeader className="border-b border-slate-800 bg-slate-900/50 p-6">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                                    Compendio de Anexos (18)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="divide-y divide-slate-800/50">
                                    {annexes.map((annex, i) => (
                                        <div key={i} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-800/30 transition-all group cursor-default">
                                            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-[10px] font-black text-amber-500 border border-slate-700 group-hover:bg-amber-500 group-hover:text-slate-950 group-hover:border-transparent transition-all">
                                                {i.toString().padStart(2, '0')}
                                            </div>
                                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-tight group-hover:text-slate-200 transition-colors">{annex}</span>
                                            <ChevronRight className="w-4 h-4 ml-auto text-slate-700 group-hover:text-amber-500 transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                            <div className="p-6 bg-slate-900/80 border-t border-slate-800 text-[10px] text-slate-500 font-black uppercase tracking-widest text-center">
                                Total: 18 Anexos Obligatorios
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1e293b;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #334155;
                }
            `}</style>
        </div>
    );
}
