"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Download, FolderSync, CheckCircle2, Loader2, AlertTriangle, MapPin } from 'lucide-react';
import { SSOMA_LOCATIONS } from '@/lib/locations';

export default function ExportCenterPage() {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedLocations, setSelectedLocations] = useState<string[]>(['ALL']);

    const toggleLocation = (loc: string) => {
        if (loc === 'ALL') {
            setSelectedLocations(['ALL']);
            return;
        }
        let newLocs = selectedLocations.filter(l => l !== 'ALL');
        if (newLocs.includes(loc)) {
            newLocs = newLocs.filter(l => l !== loc);
            if (newLocs.length === 0) newLocs = ['ALL'];
        } else {
            newLocs.push(loc);
        }
        setSelectedLocations(newLocs);
    };
    const [isRequesting, setIsRequesting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState<'request' | 'folders' | 'download' | 'complete' | null>(null);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
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
                    month: selectedMonth,
                    year: 2026,
                    location: selectedLocations.join(',')
                })
            });

            const data = await res.json();

            if (data.success) {
                const requestId = data.requestId;
                setCurrentStep('folders');
                setStatus({ 
                    type: 'success', 
                    message: '⏳ Solicitud enviada. El Robot Local está trabajando... Por favor, no cierres esta ventana.' 
                });

                // Despertar al robot local INMEDIATAMENTE
                try {
                    fetch('http://127.0.0.1:3005/trigger', { mode: 'no-cors' }).catch(() => {});
                } catch (e) {}

                // Polling for completion
                const pollInterval = setInterval(async () => {
                    try {
                        const statusRes = await fetch(`/api/export-center?action=check-status&id=${requestId}`);
                        const statusData = await statusRes.json();

                        if (statusData.progress) {
                            setProgress(statusData.progress);
                            if (statusData.progress > 20 && statusData.progress < 80) setCurrentStep('download');
                            if (statusData.progress >= 80) setCurrentStep('complete');
                        }

                        if (statusData.status === 'completed') {
                            clearInterval(pollInterval);
                            setProgress(100);
                            setCurrentStep('complete');
                            setIsRequesting(false);
                            setStatus({ 
                                type: 'success', 
                                message: '✅ ¡TRABAJO TERMINADO! El robot ha finalizado la descarga y organización en tu escritorio.' 
                            });
                        }
                    } catch (e) {
                        console.error("Error polling:", e);
                    }
                }, 5000); 

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
        <div className="p-4 md:p-8 bg-slate-950 min-h-screen flex-1 text-slate-200">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="bg-slate-900/40 p-8 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl -mr-32 -mt-32 rounded-full"></div>
                    <div className="relative z-10">
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter italic uppercase">Centro de Exportación <span className="text-indigo-400">SharePoint</span></h1>
                        <p className="text-slate-400 mt-2 font-medium">Organiza y descarga toda la evidencia mensual directamente en tu escritorio.</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-7 space-y-6">
                        <Card className="bg-slate-900 border-slate-800 shadow-2xl overflow-hidden rounded-3xl border-2">
                            <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white p-6">
                                <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-widest">
                                    <FolderSync className="w-7 h-7" />
                                    Preparar Archivo Central SIG CASA
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl flex gap-4 text-amber-200 shadow-inner">
                                    <AlertTriangle className="w-6 h-6 shrink-0 text-amber-500" />
                                    <p className="text-sm font-medium leading-relaxed">
                                        Esta función creará la estructura de 17 carpetas en tu escritorio dentro de <strong className="text-amber-400">"Share point SIG CASA"</strong>. 
                                        Requiere que el Robot Local esté ejecutándose en tu PC.
                                    </p>
                                </div>

                                {/* SELECCIÓN DE LUGAR */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MapPin className="w-4 h-4 text-indigo-400" />
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Sede / Ubicación (Múltiple):</label>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => toggleLocation('ALL')}
                                            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                selectedLocations.includes('ALL')
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40 ring-1 ring-indigo-400/50'
                                                : 'bg-slate-950 border border-slate-800 text-slate-500 hover:border-indigo-500/50 hover:bg-slate-900'
                                            }`}
                                        >
                                            TODAS LAS SEDES
                                        </button>
                                        {SSOMA_LOCATIONS.map(loc => (
                                            <button
                                                key={loc}
                                                onClick={() => toggleLocation(loc)}
                                                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                    selectedLocations.includes(loc)
                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40 ring-1 ring-indigo-400/50'
                                                    : 'bg-slate-950 border border-slate-800 text-slate-500 hover:border-indigo-500/50 hover:bg-slate-900'
                                                }`}
                                            >
                                                {loc}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Seleccionar Mes a Exportar:</label>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                        {months.map((name, idx) => (
                                            <button
                                                key={name}
                                                onClick={() => setSelectedMonth(idx)}
                                                className={`px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all transform active:scale-95 ${
                                                    selectedMonth === idx 
                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 ring-2 ring-indigo-400/50' 
                                                    : 'bg-slate-950 border border-slate-800 text-slate-500 hover:border-indigo-500/50 hover:bg-slate-900'
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
                                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Estado del Robot Local</span>
                                                <p className="text-sm font-bold text-white flex items-center gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                                                    {currentStep === 'request' && 'Sincronizando con la nube...'}
                                                    {currentStep === 'folders' && 'Creando carpetas en escritorio...'}
                                                    {currentStep === 'download' && 'Descargando archivos desde Drive...'}
                                                    {currentStep === 'complete' && 'Operación terminada.'}
                                                </p>
                                            </div>
                                            <span className="text-4xl font-black text-indigo-400 tabular-nums">{progress}%</span>
                                        </div>

                                        <div className="relative pt-1">
                                            <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-slate-900 border border-slate-800">
                                                <div 
                                                    style={{ width: `${progress}%` }}
                                                    className="shadow-[0_0_20px_rgba(79,70,229,0.4)] flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-indigo-600 to-blue-400 transition-all duration-700 ease-out"
                                                ></div>
                                            </div>
                                            
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className={`h-1 rounded-full ${progress > 5 ? 'bg-indigo-500' : 'bg-slate-800'}`}></div>
                                                <div className={`h-1 rounded-full ${progress > 20 ? 'bg-indigo-500' : 'bg-slate-800'}`}></div>
                                                <div className={`h-1 rounded-full ${progress > 90 ? 'bg-indigo-500' : 'bg-slate-800'}`}></div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-6 border-t border-slate-800">
                                    <button
                                        onClick={handleExportRequest}
                                        disabled={isRequesting}
                                        className="w-full py-5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-2xl shadow-indigo-900/20 flex items-center justify-center gap-3 transition-all transform active:scale-[0.98]"
                                    >
                                        {isRequesting ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                Trabajando...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-6 h-6" />
                                                Solicitar Exportación a Escritorio
                                            </>
                                        )}
                                    </button>
                                </div>

                                {status.type && (
                                    <div className={`p-5 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 ${
                                        status.type === 'success' ? 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/20' : 'bg-red-500/10 text-red-200 border border-red-500/20'
                                    }`}>
                                        <div className={`p-2 rounded-full ${status.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                            {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-red-500" />}
                                        </div>
                                        <p className="text-sm font-bold">{status.message}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-5">
                        <Card className="bg-slate-900 border-slate-800 shadow-2xl rounded-3xl border-2 sticky top-8">
                            <CardContent className="p-8">
                                <h3 className="font-black text-white uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                                    <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
                                    Estructura que se creará:
                                </h3>
                                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    {[
                                        "01. SCSST", "02. ANALISIS DE TRABAJO SEGURO (AST)", "03. COMPROMISO DE CUMPLIMIENTO",
                                        "04. DOCUMENTOS DE GESTION DE SSTMA", "05. VIGILANCIA DE LA SALUD OCUPACIONAL",
                                        "06. EQUIPOS DE PROTECCION PERSONAL", "07. INFORMES", "08. COMUNICACION CON LA SUPERVISION O CLIENTE",
                                        "09. REGISTRO DE INDUCCIÓN, CAPACITACIÓN...", "10. MANIFIESTO", "11. PERMISOS", "12. REGISTROS",
                                        "13. REGISTRO DE INSPECCIONES INTERNAS", "14. MONITOREOS DE SSTMA", "15. GESTIÓN DE RESIDUOS",
                                        "16. Fotografías", "17. CUMPLIMIENTO DE ENVIO DE INFO..."
                                    ].map((folder, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800/50 hover:border-indigo-500/30 hover:bg-slate-800/30 transition-all group">
                                            <span className="text-indigo-500 font-bold text-xs">{(i+1).toString().padStart(2, '0')}</span>
                                            <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-200 transition-colors uppercase truncate">
                                                {folder.split('. ')[1] || folder}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                                    <p className="text-[10px] text-slate-500 font-bold italic uppercase tracking-tighter text-center">
                                        * Cada carpeta contendrá subcarpetas automáticas por Año y Mes (ej: 2026 / 04. ABRIL).
                                    </p>
                                </div>
                            </CardContent>
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
