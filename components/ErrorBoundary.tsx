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
            const keys = ['hhc_records', 'pma_evidence_records', 'evidence_center_records', 'inspections_records'];
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
            return (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
                    <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="text-red-500" size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">
                            Algo salió mal
                        </h2>
                        <p className="text-slate-400 text-sm mb-6">
                            Ha ocurrido un error inesperado. Esto puede deberse a datos corruptos en el navegador.
                        </p>
                        <button
                            onClick={this.handleReload}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 mx-auto transition-colors"
                        >
                            <RefreshCw size={18} />
                            Recargar Página
                        </button>
                        <p className="text-[10px] text-slate-600 mt-4">
                            Si el problema persiste, limpia los datos del navegador (F12 → Application → Clear Storage)
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
