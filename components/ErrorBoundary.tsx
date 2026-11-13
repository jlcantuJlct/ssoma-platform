"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught:", error, errorInfo);
    }

    handleReload = () => {
        // Limpiar localStorage corrupto si existe
        try {
            const keys = [
                'hhc_records', 
                'pma_evidence_records', 
                'evidence_center_records', 
                'inspections_records',
                'annual_program_data',
                'pma_records',
                'ats_records',
                'petar_records',
                'desvio_records',
                'risstma_records'
            ];
            keys.forEach(key => {
                const data = localStorage.getItem(key);
                if (data) {
                    try {
                        JSON.parse(data);
                    } catch {
                        localStorage.removeItem(key);
                        console.warn(`Removed corrupted ${key}`);
                    }
                }
            });
        } catch (e) {
            console.warn("Could not clean localStorage", e);
        }
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            const isChunkOrOffline = 
                this.state.error?.name === 'ChunkLoadError' || 
                this.state.error?.message?.includes('Loading chunk') ||
                (typeof navigator !== 'undefined' && !navigator.onLine);

            return (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
                    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 sm:p-8 max-w-md text-center shadow-2xl">
                        <div className={`w-16 h-16 ${isChunkOrOffline ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-500'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                            <AlertTriangle size={32} />
                        </div>
                        <h2 className="text-xl font-black text-white mb-2">
                            {isChunkOrOffline ? 'Herramienta no descargada aún' : 'Algo salió mal'}
                        </h2>
                        <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                            {isChunkOrOffline 
                                ? 'Para usar esta herramienta sin conexión, debes abrirla al menos una vez mientras tengas internet para que se guarde en la memoria del celular.' 
                                : 'Ha ocurrido un error inesperado al procesar los datos de la aplicación.'}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => { window.location.href = '/'; }}
                                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-700 text-sm"
                            >
                                Volver al Inicio
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm shadow-lg shadow-emerald-900/30"
                            >
                                <RefreshCw size={16} />
                                Reintentar
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
