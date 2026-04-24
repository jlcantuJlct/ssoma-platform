"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Download, FolderSync, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';

export default function ExportCenterPage() {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [isRequesting, setIsRequesting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const handleExportRequest = async () => {
        setIsRequesting(true);
        setStatus({ type: null, message: '' });

        try {
            const res = await fetch('/api/export-center', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    month: selectedMonth,
                    year: 2025,
                    timestamp: new Date().toISOString()
                })
            });

            const data = await res.json();

            if (data.success) {
                setStatus({ 
                    type: 'success', 
                    message: '✅ ¡Solicitud enviada! Asegúrate de que el Robot Local esté encendido para que comience a crear las carpetas en tu escritorio.' 
                });
            } else {
                throw new Error(data.error || 'Error al procesar la solicitud');
            }
        } catch (error: any) {
            setStatus({ type: 'error', message: `❌ Error: ${error.message}` });
        } finally {
            setIsRequesting(false);
        }
    };

    return (
        <div className="p-8 bg-slate-50 min-h-full flex-1">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">Centro de Exportación SharePoint</h1>
                    <p className="text-slate-500 mt-2">Organiza y descarga toda la evidencia mensual directamente en tu escritorio.</p>
                </header>

                    <div className="grid gap-6">
                        <Card className="border-none shadow-md overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                                <CardTitle className="flex items-center gap-2">
                                    <FolderSync className="w-6 h-6" />
                                    Preparar Archivo Central SIG CASA
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="space-y-6">
                                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3 text-amber-800">
                                        <AlertTriangle className="w-6 h-6 shrink-0" />
                                        <p className="text-sm">
                                            Esta función creará la estructura de 17 carpetas en tu escritorio dentro de <strong>"Share point SIG CASA"</strong>. 
                                            Requiere que el Robot Local esté ejecutándose en tu PC.
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <label className="text-sm font-semibold text-slate-700">Seleccionar Mes a Exportar:</label>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                            {months.map((name, idx) => (
                                                <button
                                                    key={name}
                                                    onClick={() => setSelectedMonth(idx)}
                                                    className={`px-3 py-2 rounded-md text-sm transition-all ${
                                                        selectedMonth === idx 
                                                        ? 'bg-indigo-600 text-white shadow-md scale-105' 
                                                        : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'
                                                    }`}
                                                >
                                                    {name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <button
                                            onClick={handleExportRequest}
                                            disabled={isRequesting}
                                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all transform active:scale-95"
                                        >
                                            {isRequesting ? (
                                                <>
                                                    <Loader2 className="w-6 h-6 animate-spin" />
                                                    Procesando Solicitud...
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
                                        <div className={`p-4 rounded-lg flex items-center gap-3 ${
                                            status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                                        }`}>
                                            {status.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                                            <p className="font-medium">{status.message}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-md">
                            <CardContent className="p-6">
                                <h3 className="font-bold text-slate-700 mb-4">Estructura que se creará:</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">📁 01. SCSST</div>
                                    <div className="flex items-center gap-2">📁 02. ANALISIS DE TRABAJO SEGURO (AST)</div>
                                    <div className="flex items-center gap-2">📁 03. COMPROMISO DE CUMPLIMIENTO</div>
                                    <div className="flex items-center gap-2">📁 04. DOCUMENTOS DE GESTION DE SSTMA</div>
                                    <div className="flex items-center gap-2">📁 05. VIGILANCIA DE LA SALUD OCUPACIONAL</div>
                                    <div className="flex items-center gap-2">📁 06. EQUIPOS DE PROTECCION PERSONAL</div>
                                    <div className="flex items-center gap-2">📁 07. INFORMES</div>
                                    <div className="flex items-center gap-2">📁 08. COMUNICACION CON LA SUPERVISION O CLIENTE</div>
                                    <div className="flex items-center gap-2">📁 09. REGISTRO DE INDUCCIÓN, CAPACITACIÓN...</div>
                                    <div className="flex items-center gap-2">📁 10. MANIFIESTO</div>
                                    <div className="flex items-center gap-2">📁 11. PERMISOS</div>
                                    <div className="flex items-center gap-2">📁 12. REGISTROS</div>
                                    <div className="flex items-center gap-2">📁 13. REGISTRO DE INSPECCIONES INTERNAS</div>
                                    <div className="flex items-center gap-2">📁 14. MONITOREOS DE SSTMA</div>
                                    <div className="flex items-center gap-2">📁 15. GESTIÓN DE RESIDUOS</div>
                                    <div className="flex items-center gap-2">📁 16. Fotografías</div>
                                    <div className="flex items-center gap-2">📁 17. CUMPLIMIENTO DE ENVIO DE INFO...</div>
                                </div>
                                <p className="mt-6 text-xs text-slate-400 italic">
                                    * Cada carpeta contendrá subcarpetas por Año y Mes (ej: 2025 / 04. ABRIL).
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
