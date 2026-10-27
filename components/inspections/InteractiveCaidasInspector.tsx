"use client";

import React, { useState } from 'react';
import { 
    Shield, 
    AlertTriangle, 
    CheckCircle2, 
    X, 
    Eye, 
    Sparkles,
    Check,
    RotateCcw
} from 'lucide-react';

export interface CaidasHotspotDef {
    id: string;
    key: 'correas' | 'costuras' | 'anillos' | 'mosquetones' | 'hebillas' | 'gatillo';
    label: string;
    target: 'arnes' | 'linea_absorbedor' | 'linea_posicionamiento' | 'ambos';
    x: number;
    y: number;
    description: string;
}

export const CAIDAS_HOTSPOTS: CaidasHotspotDef[] = [
    // --- ARNÉS DE CUERPO ENTERO ---
    {
        id: 'arnes_correas_hombros',
        key: 'correas',
        label: 'Correas de Hombros',
        target: 'arnes',
        x: 180,
        y: 135,
        description: 'Revisar cortes, quemaduras, desgaste, fibras deshilachadas o contacto químico en cintas de hombro'
    },
    {
        id: 'arnes_correas_pecho',
        key: 'correas',
        label: 'Cinta Pectoral',
        target: 'arnes',
        x: 180,
        y: 180,
        description: 'Verificar cinta pectoral que retiene los tirantes del arnés en su posición'
    },
    {
        id: 'arnes_hebillas_pecho',
        key: 'hebillas',
        label: 'Hebilla Pectoral',
        target: 'arnes',
        x: 180,
        y: 195,
        description: 'Hebilla de conexión rápida o pasador pectoral: verificar deformación, óxido y cierre firme'
    },
    {
        id: 'arnes_anillo_d_pecho',
        key: 'anillos',
        label: 'Anillo en "D" Esternal',
        target: 'arnes',
        x: 180,
        y: 165,
        description: 'Anillo en D frontal/esternal para ascenso/descenso y detención: sin fisuras, golpes ni distorsión'
    },
    {
        id: 'arnes_anillo_d_dorsal',
        key: 'anillos',
        label: 'Anillo en "D" Dorsal',
        target: 'arnes',
        x: 235,
        y: 150,
        description: 'Anillo en D posterior para anclaje contra caídas: verificar alineación, sin rebabas ni corrosión'
    },
    {
        id: 'arnes_costuras_torso',
        key: 'costuras',
        label: 'Costuras de Seguridad',
        target: 'arnes',
        x: 160,
        y: 220,
        description: 'Puntos de costura con hilo de seguridad en contraste: sin hilos rotos, descosidos o desgastados'
    },
    {
        id: 'arnes_correas_piernas',
        key: 'correas',
        label: 'Correas de Piernas',
        target: 'arnes',
        x: 160,
        y: 285,
        description: 'Cintas de pernera y subpélvicas: verificar cortes, flexibilidad y que no tengan rigidez por suciedad/pintura'
    },
    {
        id: 'arnes_hebillas_piernas',
        key: 'hebillas',
        label: 'Hebillas de Piernas',
        target: 'arnes',
        x: 200,
        y: 275,
        description: 'Hebillas machiembradas o de pase rápido en perneras: cierre firme, sin holguras'
    },

    // --- LÍNEA DE VIDA CON AMORTIGUADOR (ABSORBEDOR) ---
    {
        id: 'linea_abs_mosqueton_arnes',
        key: 'mosquetones',
        label: 'Mosquetón a Arnés',
        target: 'linea_absorbedor',
        x: 370,
        y: 60,
        description: 'Mosquetón de acero/aluminio estándar con seguro: sin deformaciones ni desgaste'
    },
    {
        id: 'linea_abs_gatillo_1',
        key: 'gatillo',
        label: 'Gatillo con Seguro Aut.',
        target: 'linea_absorbedor',
        x: 370,
        y: 85,
        description: 'Gatillo y traba de seguridad: cierre automático rápido, resorte en perfecto estado'
    },
    {
        id: 'linea_abs_paquete',
        key: 'correas',
        label: 'Paquete Amortiguador',
        target: 'linea_absorbedor',
        x: 370,
        y: 135,
        description: 'Absorbedor de impacto (Shock pack): termocontraíble intacto, sin activación por caída previa'
    },
    {
        id: 'linea_abs_costuras',
        key: 'costuras',
        label: 'Costuras de Absorbedor',
        target: 'linea_absorbedor',
        x: 370,
        y: 175,
        description: 'Costuras de resistencia en absorbedor y terminales: sin roturas ni hilos sueltos'
    },
    {
        id: 'linea_abs_cinta',
        key: 'correas',
        label: 'Cinta Tubular Doble',
        target: 'linea_absorbedor',
        x: 370,
        y: 225,
        description: 'Cuerpo de la línea de vida: cinta tubular de alta tenacidad sin cortes ni abrasión'
    },
    {
        id: 'linea_abs_mosqueton_grande',
        key: 'mosquetones',
        label: 'Mosquetón Estructurero (2¼")',
        target: 'linea_absorbedor',
        x: 370,
        y: 290,
        description: 'Gancho estructurero para anclaje a tubos/perfiles: cuerpo sólido, sin grietas'
    },
    {
        id: 'linea_abs_gatillo_grande',
        key: 'gatillo',
        label: 'Gatillo de Doble Seguro',
        target: 'linea_absorbedor',
        x: 370,
        y: 315,
        description: 'Mecanismo de doble seguro del gancho estructurero: traba automática y apertura suave'
    },

    // --- LÍNEA DE VIDA SIN AMORTIGUADOR (POSICIONAMIENTO / RESTRICCIÓN) ---
    {
        id: 'linea_pos_mosqueton_1',
        key: 'mosquetones',
        label: 'Mosquetón de Extremo',
        target: 'linea_posicionamiento',
        x: 470,
        y: 75,
        description: 'Mosquetón de anclaje de posicionamiento'
    },
    {
        id: 'linea_pos_gatillo_1',
        key: 'gatillo',
        label: 'Gatillo con Seguro',
        target: 'linea_posicionamiento',
        x: 470,
        y: 95,
        description: 'Gatillo de cierre y seguro en mosquetón de posicionamiento'
    },
    {
        id: 'linea_pos_cuerda',
        key: 'correas',
        label: 'Cuerda / Cinta Regulable',
        target: 'linea_posicionamiento',
        x: 470,
        y: 170,
        description: 'Cuerda o cinta de restricción/posicionamiento: sin deshilachado ni quemaduras'
    },
    {
        id: 'linea_pos_hebilla_regulador',
        key: 'hebillas',
        label: 'Hebilla Reguladora',
        target: 'linea_posicionamiento',
        x: 470,
        y: 200,
        description: 'Hebilla o freno de ajuste de longitud de posicionamiento'
    },
    {
        id: 'linea_pos_costuras',
        key: 'costuras',
        label: 'Costuras con Guardacabo',
        target: 'linea_posicionamiento',
        x: 470,
        y: 240,
        description: 'Costuras de terminación protegidas con funda plástica transparente'
    },
    {
        id: 'linea_pos_mosqueton_2',
        key: 'mosquetones',
        label: 'Mosquetón Terminal',
        target: 'linea_posicionamiento',
        x: 470,
        y: 295,
        description: 'Mosquetón terminal para enganche al anillo en D lateral'
    },
    {
        id: 'linea_pos_gatillo_2',
        key: 'gatillo',
        label: 'Gatillo de Cierre',
        target: 'linea_posicionamiento',
        x: 470,
        y: 320,
        description: 'Gatillo de cierre del segundo mosquetón'
    }
];

export const CRITERIOS_CAIDAS: { key: CaidasHotspotDef['key']; label: string; col: string; desc: string }[] = [
    { key: 'correas', label: 'Correas', col: 'I', desc: 'Cintas principales, de hombro, pecho, piernas y subpélvicas' },
    { key: 'costuras', label: 'Costuras', col: 'J', desc: 'Costuras de unión, hilos de seguridad e indicadores de caída' },
    { key: 'anillos', label: 'Anillos en "D"', col: 'K', desc: 'Anillo dorsal, esternal y laterales contra caídas' },
    { key: 'mosquetones', label: 'Mosquetones', col: 'L', desc: 'Ganchos conectores, estructureros y de anclaje' },
    { key: 'hebillas', label: 'Hebillas', col: 'M', desc: 'Hebillas de ajuste, pasadores y reguladores' },
    { key: 'gatillo', label: 'Gatillo', col: 'N', desc: 'Mecanismo de seguro automático y resorte de apertura' }
];

export type CaidasTarget = 'arnes' | 'linea_absorbedor' | 'linea_posicionamiento';

export interface CaidasEquipmentStatus {
    correas: 'V' | 'X';
    costuras: 'V' | 'X';
    anillos: 'V' | 'X';
    mosquetones: 'V' | 'X';
    hebillas: 'V' | 'X';
    gatillo: 'V' | 'X';
}

export interface InteractiveCaidasInspectorProps {
    equipmentType?: 'A' | 'L'; // A = Arnés, L = Línea
    code?: string;
    workerName?: string;
    // Estado de los puntos individuales por su id único ('arnes_hebillas_pecho', etc.)
    hotspotStatus?: Record<string, 'V' | 'X'>;
    // Estados independientes por cada uno de los 3 equipos
    arnesStatus?: CaidasEquipmentStatus;
    lineaAbsorbedorStatus?: CaidasEquipmentStatus;
    lineaPosicionamientoStatus?: CaidasEquipmentStatus;
    // Retrocompatibilidad con statusMap (puede contener claves compuestas `${target}_${key}` o las 6 directas)
    statusMap?: Record<string, 'V' | 'X'>;
    // Callbacks
    onToggleHotspot?: (spot: CaidasHotspotDef, newStatus: 'V' | 'X') => void;
    onToggleCriterion?: (target: CaidasTarget, key: CaidasHotspotDef['key'], newStatus: 'V' | 'X') => void;
    onToggleStatus?: (key: CaidasHotspotDef['key'], currentStatus: 'V' | 'X', target?: CaidasTarget, spotId?: string) => void;
    onSetAllConforme?: () => void;
    onSetAllConformeTarget?: (target: CaidasTarget | 'all') => void;
}

export const InteractiveCaidasInspector: React.FC<InteractiveCaidasInspectorProps> = ({
    equipmentType = 'A',
    code,
    workerName,
    hotspotStatus,
    arnesStatus,
    lineaAbsorbedorStatus,
    lineaPosicionamientoStatus,
    statusMap,
    onToggleHotspot,
    onToggleCriterion,
    onToggleStatus,
    onSetAllConforme,
    onSetAllConformeTarget
}) => {
    const [hoveredHotspotId, setHoveredHotspotId] = useState<string | null>(null);
    const [filterView, setFilterView] = useState<'all' | 'arnes' | 'linea_absorbedor' | 'linea_posicionamiento'>('all');

    // Comprobación de defecto aislada estrictamente por equipo y por punto
    const isDefective = (spot: CaidasHotspotDef): boolean => {
        // 1. Estado exacto del hotspot único si está definido en hotspotStatus
        if (hotspotStatus && hotspotStatus[spot.id] !== undefined) {
            return hotspotStatus[spot.id] === 'X';
        }
        // 2. Si statusMap contiene el id exacto del hotspot
        if (statusMap && statusMap[spot.id] !== undefined) {
            return statusMap[spot.id] === 'X';
        }
        // 3. Clave compuesta específica de equipo y criterio: `${spot.target}_${spot.key}`
        const compKey = `${spot.target}_${spot.key}`;
        if (statusMap && statusMap[compKey] !== undefined) {
            return statusMap[compKey] === 'X';
        }
        // 4. Estados por equipo pasados como objetos independientes
        if (spot.target === 'arnes' && arnesStatus && arnesStatus[spot.key] !== undefined) {
            return arnesStatus[spot.key] === 'X';
        }
        if (spot.target === 'linea_absorbedor' && lineaAbsorbedorStatus && lineaAbsorbedorStatus[spot.key] !== undefined) {
            return lineaAbsorbedorStatus[spot.key] === 'X';
        }
        if (spot.target === 'linea_posicionamiento' && lineaPosicionamientoStatus && lineaPosicionamientoStatus[spot.key] !== undefined) {
            return lineaPosicionamientoStatus[spot.key] === 'X';
        }
        // 5. Si statusMap solo tiene las 6 claves estándar y viene equipmentType
        if (statusMap && statusMap[spot.key] !== undefined) {
            if (equipmentType === 'A' && spot.target === 'arnes') {
                return statusMap[spot.key] === 'X';
            }
            if (equipmentType === 'L' && (spot.target === 'linea_absorbedor' || spot.target === 'linea_posicionamiento')) {
                return statusMap[spot.key] === 'X';
            }
        }
        return false;
    };

    // Obtener estado de un criterio para un equipo específico
    const getTargetCriterionStatus = (target: CaidasTarget, key: CaidasHotspotDef['key']): 'V' | 'X' => {
        if (target === 'arnes' && arnesStatus) return arnesStatus[key] || 'V';
        if (target === 'linea_absorbedor' && lineaAbsorbedorStatus) return lineaAbsorbedorStatus[key] || 'V';
        if (target === 'linea_posicionamiento' && lineaPosicionamientoStatus) return lineaPosicionamientoStatus[key] || 'V';
        
        // Verificar si algún hotspot de ese target y key está defectuoso
        const spots = CAIDAS_HOTSPOTS.filter(s => s.target === target && s.key === key);
        const hasDefect = spots.some(s => isDefective(s));
        return hasDefect ? 'X' : 'V';
    };

    const handleToggle = (spot: CaidasHotspotDef) => {
        const currentIsDef = isDefective(spot);
        const newStatus: 'V' | 'X' = currentIsDef ? 'V' : 'X';
        if (onToggleHotspot) {
            onToggleHotspot(spot, newStatus);
        }
        if (onToggleStatus) {
            onToggleStatus(spot.key, newStatus, spot.target, spot.id);
        }
    };

    const handleToggleCriterionClick = (target: CaidasTarget, key: CaidasHotspotDef['key']) => {
        const currentVal = getTargetCriterionStatus(target, key);
        const newVal: 'V' | 'X' = currentVal === 'V' ? 'X' : 'V';
        if (onToggleCriterion) {
            onToggleCriterion(target, key, newVal);
        } else if (onToggleStatus) {
            onToggleStatus(key, newVal, target);
        }
    };

    // Conteo de defectos por cada equipo por separado
    const arnesDefects = CAIDAS_HOTSPOTS.filter(s => s.target === 'arnes' && isDefective(s)).length;
    const absDefects = CAIDAS_HOTSPOTS.filter(s => s.target === 'linea_absorbedor' && isDefective(s)).length;
    const posDefects = CAIDAS_HOTSPOTS.filter(s => s.target === 'linea_posicionamiento' && isDefective(s)).length;
    const totalDefects = arnesDefects + absDefects + posDefects;

    const visibleHotspots = CAIDAS_HOTSPOTS.filter(s => {
        if (filterView === 'arnes') return s.target === 'arnes';
        if (filterView === 'linea_absorbedor') return s.target === 'linea_absorbedor';
        if (filterView === 'linea_posicionamiento') return s.target === 'linea_posicionamiento';
        return true;
    });

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col my-4">
            {/* Header del Inspector */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-2">
                            Inspector Visual de Equipos Contra Caídas
                            {workerName && <span className="text-xs text-amber-400 font-normal">({workerName})</span>}
                            {code && <span className="text-xs bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300 font-mono">[{code}]</span>}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                            Cada equipo es independiente: toque los puntos para alternar entre <span className="text-emerald-400 font-bold">Conforme (V)</span> y <span className="text-red-400 font-bold">Defectuoso (X)</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {(onSetAllConforme || onSetAllConformeTarget) && (
                        <button
                            type="button"
                            onClick={() => {
                                if (onSetAllConformeTarget) onSetAllConformeTarget('all');
                                else if (onSetAllConforme) onSetAllConforme();
                            }}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/40 transition-colors flex items-center gap-1.5"
                            title="Marcar todos los equipos en estado Conforme (V)"
                        >
                            <Check size={14} /> Todos V
                        </button>
                    )}
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                        Observados: <b className={totalDefects > 0 ? "text-red-400" : "text-emerald-400"}>{totalDefects}</b>
                    </span>
                </div>
            </div>

            {/* Barra de pestañas de vista por equipo */}
            <div className="bg-slate-950/80 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1 flex-wrap">
                    <button
                        type="button"
                        onClick={() => setFilterView('all')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            filterView === 'all' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                    >
                        🌐 Vista Completa
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterView('arnes')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                            filterView === 'arnes' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                    >
                        <span>🧍‍♂️ Arnés</span>
                        {arnesDefects > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterView('linea_absorbedor')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                            filterView === 'linea_absorbedor' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                    >
                        <span>🪢 Línea c/ Amortiguador</span>
                        {absDefects > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterView('linea_posicionamiento')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                            filterView === 'linea_posicionamiento' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                    >
                        <span>🪢 Línea s/ Amortiguador</span>
                        {posDefects > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                    </button>
                </div>
            </div>

            {/* Sub-barras independientes por equipo: cada uno con sus propios criterios */}
            <div className="bg-slate-950 px-4 py-2 border-b border-slate-800/60 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                {/* 1. Arnés de cuerpo entero */}
                <div className={`p-2 rounded-xl border transition-all ${arnesDefects > 0 ? 'bg-red-950/20 border-red-900/50' : 'bg-slate-900/80 border-slate-800'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-200 flex items-center gap-1">
                            🧍‍♂️ Arnés de Cuerpo Entero
                        </span>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${arnesDefects > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {arnesDefects > 0 ? `${arnesDefects} obs.` : 'Conforme ✓'}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {[
                            { key: 'correas' as const, label: 'Correas' },
                            { key: 'costuras' as const, label: 'Costuras' },
                            { key: 'anillos' as const, label: 'Anillos D' },
                            { key: 'hebillas' as const, label: 'Hebillas' }
                        ].map(c => {
                            const isDef = getTargetCriterionStatus('arnes', c.key) === 'X';
                            return (
                                <button
                                    key={c.key}
                                    type="button"
                                    onClick={() => handleToggleCriterionClick('arnes', c.key)}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors flex items-center gap-0.5 ${
                                        isDef ? 'bg-red-500/20 border-red-500 text-red-300' : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                                    }`}
                                >
                                    <span>{c.label}:</span>
                                    <span className={isDef ? 'text-red-400' : 'text-emerald-400'}>{isDef ? 'X ❌' : 'V ✓'}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Línea con amortiguador */}
                <div className={`p-2 rounded-xl border transition-all ${absDefects > 0 ? 'bg-red-950/20 border-red-900/50' : 'bg-slate-900/80 border-slate-800'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-200 flex items-center gap-1">
                            🪢 Línea con Amortiguador
                        </span>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${absDefects > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {absDefects > 0 ? `${absDefects} obs.` : 'Conforme ✓'}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {[
                            { key: 'correas' as const, label: 'Absorbedor' },
                            { key: 'costuras' as const, label: 'Costuras' },
                            { key: 'mosquetones' as const, label: 'Mosquetón' },
                            { key: 'gatillo' as const, label: 'Gatillo' }
                        ].map(c => {
                            const isDef = getTargetCriterionStatus('linea_absorbedor', c.key) === 'X';
                            return (
                                <button
                                    key={c.key}
                                    type="button"
                                    onClick={() => handleToggleCriterionClick('linea_absorbedor', c.key)}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors flex items-center gap-0.5 ${
                                        isDef ? 'bg-red-500/20 border-red-500 text-red-300' : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                                    }`}
                                >
                                    <span>{c.label}:</span>
                                    <span className={isDef ? 'text-red-400' : 'text-emerald-400'}>{isDef ? 'X ❌' : 'V ✓'}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Línea sin amortiguador */}
                <div className={`p-2 rounded-xl border transition-all ${posDefects > 0 ? 'bg-red-950/20 border-red-900/50' : 'bg-slate-900/80 border-slate-800'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-200 flex items-center gap-1">
                            🪢 Línea sin Amortiguador
                        </span>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${posDefects > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {posDefects > 0 ? `${posDefects} obs.` : 'Conforme ✓'}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {[
                            { key: 'correas' as const, label: 'Cuerda/Cinta' },
                            { key: 'costuras' as const, label: 'Costuras' },
                            { key: 'mosquetones' as const, label: 'Mosquetones' },
                            { key: 'hebillas' as const, label: 'Hebilla Reg.' },
                            { key: 'gatillo' as const, label: 'Gatillo' }
                        ].map(c => {
                            const isDef = getTargetCriterionStatus('linea_posicionamiento', c.key) === 'X';
                            return (
                                <button
                                    key={c.key}
                                    type="button"
                                    onClick={() => handleToggleCriterionClick('linea_posicionamiento', c.key)}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors flex items-center gap-0.5 ${
                                        isDef ? 'bg-red-500/20 border-red-500 text-red-300' : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                                    }`}
                                >
                                    <span>{c.label}:</span>
                                    <span className={isDef ? 'text-red-400' : 'text-emerald-400'}>{isDef ? 'X ❌' : 'V ✓'}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ÁREA GRÁFICA INTERACTIVA SVG */}
            <div className="relative w-full flex items-center justify-center p-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 min-h-[420px] select-none">
                <svg
                    viewBox="0 0 540 380"
                    className="w-full max-w-2xl h-auto drop-shadow-2xl"
                    style={{ maxHeight: '460px' }}
                >
                    <defs>
                        {/* Gradientes y filtros para render industrial */}
                        <linearGradient id="bodyGradCaidas" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#334155" />
                            <stop offset="100%" stopColor="#1e293b" />
                        </linearGradient>

                        <linearGradient id="webbingHarness" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="50%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>

                        <linearGradient id="webbingLanyard" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#0ea5e9" />
                            <stop offset="100%" stopColor="#0284c7" />
                        </linearGradient>

                        <linearGradient id="shockPackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="50%" stopColor="#dc2626" />
                            <stop offset="100%" stopColor="#991b1b" />
                        </linearGradient>

                        <linearGradient id="steelMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#e2e8f0" />
                            <stop offset="50%" stopColor="#94a3b8" />
                            <stop offset="100%" stopColor="#64748b" />
                        </linearGradient>

                        <filter id="caidasShadow" x="-10%" y="-10%" width="120%" height="120%">
                            <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.5" />
                        </filter>
                    </defs>

                    {/* SECCIÓN 1: TRABAJADOR CON ARNÉS DE CUERPO ENTERO */}
                    <g id="worker_harness" transform="translate(0, 0)">
                        {/* Etiqueta de la sección */}
                        <rect x="55" y="15" width="170" height="22" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                        <text x="140" y="30" fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle" letterSpacing="0.5">
                            🧍‍♂️ ARNÉS DE CUERPO ENTERO (A)
                        </text>

                        {/* Silueta del Trabajador (Casco y Cuerpo) */}
                        {/* Casco */}
                        <path d="M 155 70 Q 180 48 205 70 Q 208 78 180 78 Q 152 78 155 70 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
                        {/* Cabeza */}
                        <ellipse cx="180" cy="85" rx="15" ry="16" fill="#cbd5e1" opacity="0.9" />
                        {/* Cuello */}
                        <rect x="174" y="99" width="12" height="12" fill="#94a3b8" />

                        {/* Torso (Ropa de trabajo) */}
                        <path 
                            d="M 140 110 L 220 110 L 212 250 L 148 250 Z" 
                            fill="url(#bodyGradCaidas)" 
                            stroke="#475569" 
                            strokeWidth="1.5"
                        />

                        {/* Brazos */}
                        <path d="M 140 110 L 118 190 L 132 195 L 148 135 Z" fill="#334155" stroke="#475569" strokeWidth="1" />
                        <path d="M 220 110 L 242 190 L 228 195 L 212 135 Z" fill="#334155" stroke="#475569" strokeWidth="1" />

                        {/* Piernas */}
                        <path d="M 150 250 L 140 365 L 168 365 L 175 250 Z" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                        <path d="M 185 250 L 192 365 L 220 365 L 210 250 Z" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />

                        {/* CINTAS DEL ARNÉS (CORREAS AMARILLO/NARANJA) */}
                        {/* Tirante Hombro Izquierdo */}
                        <path d="M 158 110 L 168 250" stroke="url(#webbingHarness)" strokeWidth="10" strokeLinecap="round" />
                        {/* Tirante Hombro Derecho */}
                        <path d="M 202 110 L 192 250" stroke="url(#webbingHarness)" strokeWidth="10" strokeLinecap="round" />

                        {/* Cinta Pectoral Horizontal */}
                        <line x1="162" y1="180" x2="198" y2="180" stroke="url(#webbingHarness)" strokeWidth="8" strokeLinecap="round" />

                        {/* Cintas en "V" pélvicas */}
                        <path d="M 168 245 L 180 265 L 192 245" fill="none" stroke="url(#webbingHarness)" strokeWidth="9" />

                        {/* Pernera Izquierda */}
                        <path d="M 142 275 Q 155 295 174 285" fill="none" stroke="url(#webbingHarness)" strokeWidth="9" strokeLinecap="round" />
                        {/* Pernera Derecha */}
                        <path d="M 186 285 Q 205 295 218 275" fill="none" stroke="url(#webbingHarness)" strokeWidth="9" strokeLinecap="round" />

                        {/* COSTURAS REFORZADAS (Líneas punteadas de alta visibilidad) */}
                        <line x1="160" y1="130" x2="160" y2="155" stroke="#000000" strokeWidth="2.5" strokeDasharray="3 2" />
                        <line x1="200" y1="130" x2="200" y2="155" stroke="#000000" strokeWidth="2.5" strokeDasharray="3 2" />
                        <line x1="165" y1="215" x2="165" y2="235" stroke="#000000" strokeWidth="2.5" strokeDasharray="3 2" />
                        <line x1="195" y1="215" x2="195" y2="235" stroke="#000000" strokeWidth="2.5" strokeDasharray="3 2" />

                        {/* ELEMENTOS METÁLICOS DEL ARNÉS */}
                        {/* Anillo en "D" Esternal (Frontal) */}
                        <path d="M 174 160 L 186 160 A 8 8 0 0 1 186 172 L 174 172 Z" fill="none" stroke="url(#steelMetal)" strokeWidth="3" />
                        
                        {/* Hebilla Pectoral */}
                        <rect x="175" y="190" width="10" height="12" rx="2" fill="url(#steelMetal)" stroke="#334155" strokeWidth="1" />
                        <rect x="178" y="193" width="4" height="6" fill="#1e293b" />

                        {/* Hebillas de Piernas */}
                        <rect x="152" y="278" width="10" height="9" rx="1.5" fill="url(#steelMetal)" stroke="#334155" strokeWidth="1" />
                        <rect x="198" y="278" width="10" height="9" rx="1.5" fill="url(#steelMetal)" stroke="#334155" strokeWidth="1" />

                        {/* Anillo en D Dorsal (vista lateral proyectada) */}
                        <g transform="translate(225, 140)">
                            <path d="M 0 0 L 12 0 A 10 10 0 0 1 12 20 L 0 20 Z" fill="none" stroke="url(#steelMetal)" strokeWidth="3.5" />
                            <text x="18" y="14" fill="#94a3b8" fontSize="8" fontWeight="bold">Dorsal</text>
                        </g>

                        {/* Etiqueta de Inspección y Capacidad */}
                        <rect x="160" y="245" width="14" height="8" rx="1" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" />
                        <text x="167" y="251" fill="#0f172a" fontSize="5" fontWeight="black" textAnchor="middle">SSMA</text>
                    </g>

                    {/* SECCIÓN 2: LÍNEA DE VIDA CON AMORTIGUADOR DE IMPACTO */}
                    <g id="linea_con_absorbedor" transform="translate(0, 0)">
                        {/* Etiqueta de la sección */}
                        <rect x="305" y="15" width="130" height="22" rx="6" fill="#1e293b" stroke="#0284c7" strokeWidth="1" />
                        <text x="370" y="30" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle" letterSpacing="0.3">
                            🪢 CON AMORTIGUADOR
                        </text>

                        {/* Mosquetón Superior al Arnés */}
                        <path 
                            d="M 363 48 C 358 55 358 75 363 82 C 370 88 378 88 382 82 C 386 75 386 55 382 48 C 378 44 370 44 363 48 Z" 
                            fill="none" 
                            stroke="url(#steelMetal)" 
                            strokeWidth="4" 
                        />
                        {/* Gatillo del Mosquetón Superior */}
                        <line x1="378" y1="56" x2="378" y2="76" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" />
                        <circle cx="378" cy="66" r="3" fill="#ef4444" />

                        {/* Cinta de Conexión Corta */}
                        <line x1="370" y1="84" x2="370" y2="105" stroke="url(#webbingLanyard)" strokeWidth="9" strokeLinecap="round" />

                        {/* PAQUETE ABSORBEDOR DE IMPACTO (SHOCK PACK) */}
                        <rect x="354" y="105" width="32" height="60" rx="4" fill="url(#shockPackGrad)" stroke="#b91c1c" strokeWidth="1.5" filter="url(#caidasShadow)" />
                        {/* Cintas de amarre del amortiguador */}
                        <line x1="354" y1="120" x2="386" y2="120" stroke="#f8fafc" strokeWidth="1.5" strokeDasharray="3 2" />
                        <line x1="354" y1="135" x2="386" y2="135" stroke="#f8fafc" strokeWidth="2" />
                        <line x1="354" y1="150" x2="386" y2="150" stroke="#f8fafc" strokeWidth="1.5" strokeDasharray="3 2" />
                        <text x="370" y="139" fill="#ffffff" fontSize="7" fontWeight="black" textAnchor="middle" letterSpacing="0.5">SHOCK</text>
                        <text x="370" y="147" fill="#fef08a" fontSize="6" fontWeight="bold" textAnchor="middle">ABSORBER</text>

                        {/* Costuras de terminación inferior del absorbedor */}
                        <line x1="362" y1="172" x2="378" y2="172" stroke="#000000" strokeWidth="2" strokeDasharray="2 1.5" />

                        {/* Cuerda / Cintas de Extensión Dobles (Brazos de la línea) */}
                        <path d="M 370 170 Q 360 210 366 265" fill="none" stroke="url(#webbingLanyard)" strokeWidth="7" strokeLinecap="round" />
                        <path d="M 370 170 Q 382 210 376 265" fill="none" stroke="url(#webbingLanyard)" strokeWidth="7" strokeLinecap="round" />

                        {/* GANCHO ESTRUCTURERO GRANDE (2¼") */}
                        <path 
                            d="M 360 268 C 345 285 345 325 365 345 C 385 355 400 335 398 310 C 395 285 380 270 365 268 Z" 
                            fill="none" 
                            stroke="url(#steelMetal)" 
                            strokeWidth="5" 
                        />
                        {/* Gatillo del gancho grande */}
                        <path d="M 378 280 L 372 325" stroke="#fbbf24" strokeWidth="4.5" strokeLinecap="round" />
                        {/* Seguro automático del gatillo */}
                        <rect x="368" y="295" width="7" height="12" rx="2" fill="#ef4444" stroke="#7f1d1d" strokeWidth="0.8" />
                    </g>

                    {/* SECCIÓN 3: LÍNEA DE VIDA SIN AMORTIGUADOR (POSICIONAMIENTO) */}
                    <g id="linea_sin_absorbedor" transform="translate(0, 0)">
                        {/* Etiqueta de la sección */}
                        <rect x="445" y="15" width="90" height="22" rx="6" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
                        <text x="490" y="30" fill="#cbd5e1" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                            SIN ABSORBEDOR
                        </text>

                        {/* Mosquetón Superior */}
                        <path 
                            d="M 464 62 C 459 70 459 88 464 96 C 471 102 479 102 483 96 C 487 88 487 70 483 62 C 479 58 471 58 464 62 Z" 
                            fill="none" 
                            stroke="url(#steelMetal)" 
                            strokeWidth="3.5" 
                        />
                        {/* Gatillo superior */}
                        <line x1="479" y1="70" x2="479" y2="88" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
                        <circle cx="479" cy="79" r="2.5" fill="#ef4444" />

                        {/* Cuerda / Cinta de Posicionamiento */}
                        <path d="M 473 98 L 473 190" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round" />

                        {/* Hebilla Reguladora de Longitud */}
                        <rect x="466" y="190" width="14" height="16" rx="2" fill="url(#steelMetal)" stroke="#334155" strokeWidth="1.2" />
                        <line x1="466" y1="198" x2="480" y2="198" stroke="#1e293b" strokeWidth="2" />
                        <text x="488" y="201" fill="#94a3b8" fontSize="7" fontWeight="bold">Ajuste</text>

                        {/* Extensión inferior de la cuerda */}
                        <path d="M 473 206 L 473 280" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round" />

                        {/* Costuras reforzadas con guardacabo */}
                        <line x1="469" y1="230" x2="469" y2="250" stroke="#000000" strokeWidth="2" strokeDasharray="2 1.5" />
                        <rect x="467" y="260" width="12" height="16" rx="3" fill="#38bdf8" opacity="0.3" stroke="#0284c7" strokeWidth="1" />

                        {/* Mosquetón Inferior */}
                        <path 
                            d="M 464 285 C 459 293 459 311 464 319 C 471 325 479 325 483 319 C 487 311 487 293 483 285 C 479 281 471 281 464 285 Z" 
                            fill="none" 
                            stroke="url(#steelMetal)" 
                            strokeWidth="3.5" 
                        />
                        {/* Gatillo inferior */}
                        <line x1="479" y1="293" x2="479" y2="311" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
                        <circle cx="479" cy="302" r="2.5" fill="#ef4444" />
                    </g>

                    {/* RENDERIZADO DE HOTSPOTS INTERACTIVOS */}
                    {visibleHotspots.map(spot => {
                        const isDef = isDefective(spot);
                        const isHovered = hoveredHotspotId === spot.id;
                        const tooltipBoxW = Math.max(70, spot.label.length * 6.5 + 16);
                        const tooltipY = spot.y < 60 ? spot.y + 22 : spot.y - 18;

                        return (
                            <g
                                key={spot.id}
                                className="cursor-pointer select-none"
                                onClick={() => handleToggle(spot)}
                                onPointerEnter={() => setHoveredHotspotId(spot.id)}
                                onPointerLeave={() => setHoveredHotspotId(null)}
                                onTouchStart={() => setHoveredHotspotId(spot.id)}
                                onTouchEnd={() => setTimeout(() => setHoveredHotspotId(null), 2500)}
                            >
                                {/* Zona táctil amplia invisible */}
                                <circle cx={spot.x} cy={spot.y} r="18" fill="transparent" />

                                {/* Anillo pulsante o exterior */}
                                {isDef ? (
                                    <circle
                                        cx={spot.x}
                                        cy={spot.y}
                                        r="12"
                                        fill="none"
                                        stroke="#ef4444"
                                        strokeWidth="2.5"
                                        strokeOpacity="0.9"
                                        className="animate-pulse"
                                    />
                                ) : isHovered ? (
                                    <circle
                                        cx={spot.x}
                                        cy={spot.y}
                                        r="12"
                                        fill="none"
                                        stroke="#22c55e"
                                        strokeWidth="2.2"
                                        strokeOpacity="0.8"
                                    />
                                ) : (
                                    <circle
                                        cx={spot.x}
                                        cy={spot.y}
                                        r="9.5"
                                        fill="none"
                                        stroke="#f59e0b"
                                        strokeWidth="1.2"
                                        strokeOpacity="0.5"
                                    />
                                )}

                                {/* Círculo principal */}
                                <circle
                                    cx={spot.x}
                                    cy={spot.y}
                                    r="7"
                                    fill={isDef ? '#dc2626' : (isHovered ? '#16a34a' : '#0284c7')}
                                    stroke={isDef ? '#fecaca' : (isHovered ? '#bbf7d0' : '#bae6fd')}
                                    strokeWidth="1.5"
                                    className="transition-colors duration-150"
                                />

                                {/* Letra V o X en el centro */}
                                <text
                                    x={spot.x}
                                    y={spot.y + 3}
                                    fill="#ffffff"
                                    fontSize="8"
                                    fontWeight="900"
                                    textAnchor="middle"
                                >
                                    {isDef ? 'X' : 'V'}
                                </text>

                                {/* TOOLTIP FLOTANTE (SOLO VISIBLE EN HOVER O TOQUE ACTIVO) */}
                                {isHovered && (
                                    <g
                                        className="pointer-events-none transition-all duration-150"
                                        transform={`translate(${spot.x}, ${tooltipY})`}
                                    >
                                        <rect
                                            x={-tooltipBoxW / 2}
                                            y="-10"
                                            width={tooltipBoxW}
                                            height="20"
                                            rx="5"
                                            fill={isDef ? '#991b1b' : '#0f172a'}
                                            stroke={isDef ? '#f87171' : '#38bdf8'}
                                            strokeWidth="1.2"
                                            filter="url(#caidasShadow)"
                                        />
                                        <text
                                            x="0"
                                            y="4"
                                            fill="#ffffff"
                                            fontSize="9"
                                            fontWeight="900"
                                            textAnchor="middle"
                                            letterSpacing="0.3"
                                        >
                                            {spot.label} {isDef ? '❌ (X)' : '✓ (V)'}
                                        </text>
                                    </g>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};
