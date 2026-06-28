"use client";

import React, { useState, useEffect } from 'react';
import { Activity, ExternalLink, Database, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function NetworkHealthWidget() {
    const [estimatedGB, setEstimatedGB] = useState(0);
    const [status, setStatus] = useState<'safe' | 'warning' | 'danger'>('safe');
    const LIMIT_GB = 5; // Límite gratuito de Supabase

    useEffect(() => {
        // Lógica para estimar consumo (Simulado basado en registros en localStorage)
        // Como no tenemos la API de Management, estimamos basado en el peso de evidencias cargadas
        const calculateEstimate = () => {
            try {
                let totalRecords = 0;
                
                // Buscar registros cacheados
                const cachedEvidence = localStorage.getItem('evidence_center_records');
                if (cachedEvidence) {
                    const records = JSON.parse(cachedEvidence);
                    totalRecords += records.length;
                }

                // Asumimos un costo de ancho de banda histórico + uso promedio mensual
                // Para este visor estimativo, usamos una fórmula matemática:
                // (Total Registros * Peso Promedio de Registro y Fotos) + Uso base mensual
                // Esto es meramente referencial para que el usuario tenga un indicador.
                
                // Digamos que si han curado el problema del polling, están en ~0.5 GB.
                const baseMonthlyUsageGB = 0.45; 
                const usagePerRecordGB = 0.0001; // ~100KB por registro
                
                const calculatedGB = baseMonthlyUsageGB + (totalRecords * usagePerRecordGB);
                setEstimatedGB(Number(calculatedGB.toFixed(2)));

                if (calculatedGB < 3.5) setStatus('safe');
                else if (calculatedGB < 4.5) setStatus('warning');
                else setStatus('danger');

            } catch (error) {
                console.error("Error calculating estimate:", error);
            }
        };

        calculateEstimate();
        // Recalcular cada minuto por si hay nuevas subidas
        const interval = setInterval(calculateEstimate, 60000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = () => {
        switch (status) {
            case 'safe': return 'text-emerald-400';
            case 'warning': return 'text-amber-400';
            case 'danger': return 'text-red-400';
        }
    };

    const getStatusBg = () => {
        switch (status) {
            case 'safe': return 'bg-emerald-400/10 border-emerald-400/20';
            case 'warning': return 'bg-amber-400/10 border-amber-400/20';
            case 'danger': return 'bg-red-400/10 border-red-400/20';
        }
    };

    const percentage = Math.min((estimatedGB / LIMIT_GB) * 100, 100);

    return (
        <div className={`rounded-xl border p-4 ${getStatusBg()} transition-all`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Activity className={getStatusColor()} size={18} />
                    <h3 className={`font-bold ${getStatusColor()}`}>Salud de Red (Supabase)</h3>
                </div>
                {status === 'safe' && <CheckCircle className="text-emerald-400" size={16} />}
                {status === 'warning' && <Info className="text-amber-400" size={16} />}
                {status === 'danger' && <AlertTriangle className="text-red-400" size={16} />}
            </div>

            <div className="space-y-1 mb-3">
                <div className="flex justify-between text-xs text-slate-300">
                    <span>Consumo Estimado (Mes)</span>
                    <span className="font-mono">{estimatedGB} GB / {LIMIT_GB} GB</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ${
                            status === 'safe' ? 'bg-emerald-400' : status === 'warning' ? 'bg-amber-400' : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>

            <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
                Este es un visor estimado basado en la cantidad de evidencias en el sistema y el peso comprimido de las fotos.
            </p>

            <a 
                href="https://supabase.com/dashboard/projects"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors border border-slate-700 hover:border-slate-600"
            >
                <Database size={14} />
                <span>Ver Consumo Oficial en Supabase</span>
                <ExternalLink size={14} className="opacity-50" />
            </a>
        </div>
    );
}
