"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
    Shield, 
    AlertTriangle, 
    CheckCircle2, 
    X, 
    Eye, 
    Sparkles,
    Check,
    RotateCcw,
    Camera,
    Upload,
    ImageIcon,
    RefreshCw,
    SlidersHorizontal
} from 'lucide-react';

export interface CaidasHotspotDef {
    id: string;
    key: 'correas' | 'costuras' | 'anillos' | 'mosquetones' | 'hebillas' | 'gatillo';
    label: string;
    target: 'arnes' | 'linea_absorbedor' | 'linea_posicionamiento' | 'ambos';
    dotX: number;
    dotY: number;
    badgeY: number;
    x?: number;
    y?: number;
    description: string;
}

export const CAIDAS_HOTSPOTS: CaidasHotspotDef[] = [
    // --- ARNÉS DE CUERPO ENTERO ---
    {
        id: 'arnes_correas_hombros',
        key: 'correas',
        label: 'Correas de Hombros y Torso',
        target: 'arnes',
        dotX: 135,
        dotY: 105,
        badgeY: 38,
        description: 'Cintas de hombros: sin cortes, deshilachados, quemaduras ni rigidez química'
    },
    {
        id: 'arnes_anillo_d_pecho',
        key: 'anillos',
        label: 'Anillo en "D" Esternal (Pecho)',
        target: 'arnes',
        dotX: 160,
        dotY: 140,
        badgeY: 82,
        description: 'Anillo en D frontal/esternal para detención y rescate: sin fisuras ni distorsión'
    },
    {
        id: 'arnes_correas_pecho',
        key: 'correas',
        label: 'Cinta Pectoral de Retención',
        target: 'arnes',
        dotX: 160,
        dotY: 158,
        badgeY: 126,
        description: 'Cinta transversal del pecho que retiene los tirantes del arnés en su posición'
    },
    {
        id: 'arnes_costuras_torso',
        key: 'costuras',
        label: 'Costuras de Seguridad',
        target: 'arnes',
        dotX: 140,
        dotY: 185,
        badgeY: 170,
        description: 'Puntos de costura estructurales con hilo de contraste: sin roturas ni desgaste'
    },
    {
        id: 'arnes_hebillas_pecho',
        key: 'hebillas',
        label: 'Hebillas de Ajuste Rápido',
        target: 'arnes',
        dotX: 178,
        dotY: 220,
        badgeY: 214,
        description: 'Hebillas metálicas de pase o conexión rápida en torso y cintura'
    },
    {
        id: 'arnes_correas_piernas',
        key: 'correas',
        label: 'Cintas de Piernas / Perneras',
        target: 'arnes',
        dotX: 130,
        dotY: 290,
        badgeY: 258,
        description: 'Cintas de pernera y subpélvicas: verificar cortes, flexibilidad y limpieza'
    },
    {
        id: 'arnes_hebillas_piernas',
        key: 'hebillas',
        label: 'Hebillas de Perneras',
        target: 'arnes',
        dotX: 170,
        dotY: 300,
        badgeY: 302,
        description: 'Hebillas de ajuste de perneras: enganche seguro sin desajuste espontáneo'
    },
    {
        id: 'arnes_anillo_d_dorsal',
        key: 'anillos',
        label: 'Anillo en "D" Dorsal (Espalda)',
        target: 'arnes',
        dotX: 198,
        dotY: 98,
        badgeY: 346,
        description: 'Anillo principal posterior contra caídas: centrado, sin rebabas ni óxido'
    },

    // --- LÍNEA DE VIDA CON AMORTIGUADOR (ABSORBEDOR) ---
    {
        id: 'linea_abs_mosqueton_arnes',
        key: 'mosquetones',
        label: 'Mosquetón de Acero a Arnés',
        target: 'linea_absorbedor',
        dotX: 160,
        dotY: 48,
        badgeY: 42,
        description: 'Mosquetón oval/pera de acero con seguro para conexión al anillo dorsal'
    },
    {
        id: 'linea_abs_gatillo_1',
        key: 'gatillo',
        label: 'Gatillo con Seguro de Mosquetón',
        target: 'linea_absorbedor',
        dotX: 174,
        dotY: 52,
        badgeY: 92,
        description: 'Gatillo y traba de seguridad: cierre y bloqueo automático rápido'
    },
    {
        id: 'linea_abs_paquete',
        key: 'correas',
        label: 'Paquete Amortiguador de Impacto',
        target: 'linea_absorbedor',
        dotX: 160,
        dotY: 120,
        badgeY: 142,
        description: 'Absorbedor de energía: cubierta transparente intacta, sin despliegue ni rotura'
    },
    {
        id: 'linea_abs_costuras',
        key: 'costuras',
        label: 'Costuras del Amortiguador',
        target: 'linea_absorbedor',
        dotX: 160,
        dotY: 160,
        badgeY: 192,
        description: 'Costuras de retención de energía y terminales: sin roturas ni hilos sueltos'
    },
    {
        id: 'linea_abs_cinta',
        key: 'correas',
        label: 'Cinta Tubular Doble (2 Colas)',
        target: 'linea_absorbedor',
        dotX: 130,
        dotY: 230,
        badgeY: 242,
        description: 'Cintas tubulares en Y de alta tenacidad: libres de cortes o abrasión'
    },
    {
        id: 'linea_abs_mosqueton_grande',
        key: 'mosquetones',
        label: 'Ganchos Estructureros (2¼")',
        target: 'linea_absorbedor',
        dotX: 115,
        dotY: 315,
        badgeY: 292,
        description: 'Ganchos de gran apertura de acero forjado para anclaje a tubos/andamios'
    },
    {
        id: 'linea_abs_gatillo_grande',
        key: 'gatillo',
        label: 'Doble Seguro de Ganchos',
        target: 'linea_absorbedor',
        dotX: 132,
        dotY: 330,
        badgeY: 342,
        description: 'Mecanismo de doble bloqueo de los ganchos rebar: accionamiento suave y seguro'
    },

    // --- LÍNEA DE VIDA SIN AMORTIGUADOR (POSICIONAMIENTO / RESTRICCIÓN) ---
    {
        id: 'linea_pos_mosqueton_1',
        key: 'mosquetones',
        label: 'Mosquetón de Conexión a Arnés',
        target: 'linea_posicionamiento',
        dotX: 160,
        dotY: 48,
        badgeY: 42,
        description: 'Mosquetón de acero para anclaje a los anillos laterales del arnés'
    },
    {
        id: 'linea_pos_gatillo_1',
        key: 'gatillo',
        label: 'Gatillo con Seguro Automático',
        target: 'linea_posicionamiento',
        dotX: 174,
        dotY: 52,
        badgeY: 92,
        description: 'Gatillo con seguro giratorio: traba inmediata sin trabarse'
    },
    {
        id: 'linea_pos_cuerda',
        key: 'correas',
        label: 'Cuerda Semiestática y Funda',
        target: 'linea_posicionamiento',
        dotX: 160,
        dotY: 120,
        badgeY: 142,
        description: 'Cuerda trenzada de 12-16mm con funda protectora deslizante anti-rozamiento'
    },
    {
        id: 'linea_pos_hebilla_regulador',
        key: 'hebillas',
        label: 'Freno / Regulador Mecánico',
        target: 'linea_posicionamiento',
        dotX: 160,
        dotY: 195,
        badgeY: 192,
        description: 'Dispositivo de ajuste de longitud de aleación ligera: mordaza y palanca firmes'
    },
    {
        id: 'linea_pos_costuras',
        key: 'costuras',
        label: 'Guardacabo y Costuras Protegidas',
        target: 'linea_posicionamiento',
        dotX: 160,
        dotY: 260,
        badgeY: 242,
        description: 'Terminales cosidos protegidos con funda termorretráctil transparente y guardacabo'
    },
    {
        id: 'linea_pos_mosqueton_2',
        key: 'mosquetones',
        label: 'Mosquetón Terminal de Anclaje',
        target: 'linea_posicionamiento',
        dotX: 160,
        dotY: 325,
        badgeY: 292,
        description: 'Mosquetón del extremo regulable: cuerpo rígido sin corrosión ni deformaciones'
    },
    {
        id: 'linea_pos_gatillo_2',
        key: 'gatillo',
        label: 'Gatillo de Cierre de Seguridad',
        target: 'linea_posicionamiento',
        dotX: 174,
        dotY: 335,
        badgeY: 342,
        description: 'Gatillo y seguro del mosquetón terminal: cierra de forma automática'
    }
];

export const CRITERIOS_CAIDAS: { key: CaidasHotspotDef['key']; label: string; col: string; desc: string }[] = [
    { key: 'correas', label: 'Correas', col: 'I', desc: 'Cintas principales, de hombro, pecho, piernas y subpélvicas' },
    { key: 'costuras', label: 'Costuras', col: 'J', desc: 'Costuras de unión, hilos de seguridad e indicadores de caída' },
    { key: 'anillos', label: 'Anillos en "D"', col: 'K', desc: 'Anillo dorsal, esternal y laterales contra caídas' },
    { key: 'mosquetones', label: 'Mosquetones', col: 'L', desc: 'Ganchos conectores, estructureros y de anclaje' },
    { key: 'hebillas', label: 'Hebillas', col: 'M', desc: 'Hebillas de ajuste, pasadores y reguladores' },
    { key: 'gatillo', label: 'Gatillo con Seguro', col: 'N', desc: 'Mecanismo de traba y cierre automático de seguridad' }
];

export type CaidasTarget = 'arnes' | 'linea_absorbedor' | 'linea_posicionamiento';

export interface InteractiveCaidasInspectorProps {
    equipmentType?: 'A' | 'L';
    selectedTarget?: CaidasTarget;
    code?: string;
    workerName?: string;
    hotspotStatus?: { [hotspotId: string]: 'V' | 'X' };
    arnesStatus?: { [key: string]: 'V' | 'X' };
    lineaAbsorbedorStatus?: { [key: string]: 'V' | 'X' };
    lineaPosicionamientoStatus?: { [key: string]: 'V' | 'X' };
    statusMap?: { [key: string]: 'V' | 'X' };
    onToggleHotspot?: (spot: CaidasHotspotDef, newStatus: 'V' | 'X') => void;
    onToggleCriterion?: (target: CaidasTarget, key: CaidasHotspotDef['key'], newStatus: 'V' | 'X') => void;
    onToggleStatus?: (key: CaidasHotspotDef['key'], newStatus: 'V' | 'X', target?: CaidasTarget, hotspotId?: string) => void;
    onSetAllConforme?: () => void;
    onSetAllConformeTarget?: (target: CaidasTarget | 'all') => void;
}

const DEFAULT_PHOTOS: Record<CaidasTarget, string> = {
    arnes: '/inspections/caidas/arnes_worker.jpg',
    linea_absorbedor: '/inspections/caidas/linea_absorbedor.jpg',
    linea_posicionamiento: '/inspections/caidas/linea_posicionamiento.jpg'
};

export const InteractiveCaidasInspector: React.FC<InteractiveCaidasInspectorProps> = ({
    equipmentType = 'A',
    selectedTarget,
    code = '',
    workerName = '',
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
    const [filterView, setFilterView] = useState<'all' | CaidasTarget>(
        selectedTarget || (equipmentType === 'A' ? 'arnes' : 'linea_absorbedor')
    );

    // Modo de renderizado: 'vector' (Esquema Técnico Vectorizado CAD) o 'photo' (Fotografía Real HD)
    const [renderMode, setRenderMode] = useState<'vector' | 'photo'>('vector');

    // Fotos personalizadas subidas por el usuario
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [customPhotos, setCustomPhotos] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        try {
            const stored = localStorage.getItem('ssoma_custom_caidas_photos');
            if (stored) {
                setCustomPhotos(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Error cargando fotos de equipos:', e);
        }
    }, []);

    // Sincronizar automáticamente cuando el usuario selecciona otro equipo en la barra superior
    useEffect(() => {
        if (selectedTarget) {
            setFilterView(selectedTarget);
        }
    }, [selectedTarget]);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            if (base64) {
                const targetKey = filterView === 'all' ? 'arnes' : filterView;
                const updated = { ...customPhotos, [targetKey]: base64 };
                setCustomPhotos(updated);
                setRenderMode('photo');
                try {
                    localStorage.setItem('ssoma_custom_caidas_photos', JSON.stringify(updated));
                } catch (err) {
                    console.error('Error guardando foto:', err);
                }
            }
        };
        reader.readAsDataURL(file);
    };

    const handleResetPhoto = (targetKey: string) => {
        const updated = { ...customPhotos };
        delete updated[targetKey];
        setCustomPhotos(updated);
        try {
            localStorage.setItem('ssoma_custom_caidas_photos', JSON.stringify(updated));
        } catch (err) {
            console.error('Error restableciendo foto:', err);
        }
    };

    // Comprobación de defecto aislada estrictamente por equipo y por punto
    const isDefective = (spot: CaidasHotspotDef): boolean => {
        if (hotspotStatus && hotspotStatus[spot.id] !== undefined) {
            return hotspotStatus[spot.id] === 'X';
        }
        if (statusMap && statusMap[spot.id] !== undefined) {
            return statusMap[spot.id] === 'X';
        }
        const compKey = `${spot.target}_${spot.key}`;
        if (statusMap && statusMap[compKey] !== undefined) {
            return statusMap[compKey] === 'X';
        }
        if (spot.target === 'arnes' && arnesStatus && arnesStatus[spot.key] !== undefined) {
            return arnesStatus[spot.key] === 'X';
        }
        if (spot.target === 'linea_absorbedor' && lineaAbsorbedorStatus && lineaAbsorbedorStatus[spot.key] !== undefined) {
            return lineaAbsorbedorStatus[spot.key] === 'X';
        }
        if (spot.target === 'linea_posicionamiento' && lineaPosicionamientoStatus && lineaPosicionamientoStatus[spot.key] !== undefined) {
            return lineaPosicionamientoStatus[spot.key] === 'X';
        }
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

    // Conteo de defectos por equipo
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

    const activeTarget = filterView === 'all' ? 'arnes' : filterView;
    const currentPhoto = customPhotos[activeTarget] || DEFAULT_PHOTOS[activeTarget];
    const isCustomPhoto = !!customPhotos[activeTarget];

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
                            Inspector Gráfico de Equipos Contra Caídas
                            {workerName && <span className="text-xs text-amber-400 font-normal">({workerName})</span>}
                            {code && <span className="text-xs bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300 font-mono">[{code}]</span>}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                            Esquema técnico vectorizado con detalles de ingeniería: toque los componentes para alternar entre <span className="text-emerald-400 font-bold">Conforme (V)</span> y <span className="text-red-400 font-bold">Observado (X)</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Selector de Modo: Vectorial (Plano Técnico de Ingeniería) vs Fotografía Real */}
                    <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-700">
                        <button
                            type="button"
                            onClick={() => setRenderMode('vector')}
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                                renderMode === 'vector' 
                                    ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                                    : 'text-slate-400 hover:text-white'
                            }`}
                            title="Ver esquema técnico vectorizado (alta precisión CAD)"
                        >
                            <Sparkles size={13} />
                            <span>Vector Técnico</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setRenderMode('photo')}
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                                renderMode === 'photo' 
                                    ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                                    : 'text-slate-400 hover:text-white'
                            }`}
                            title="Ver fotografía de producto industrial en alta definición"
                        >
                            <Camera size={13} />
                            <span>Foto Real</span>
                        </button>
                    </div>

                    {/* Botón para subir foto propia si se usa el modo foto */}
                    {renderMode === 'photo' && (
                        <>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handlePhotoUpload} 
                            />
                            
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 shadow-sm"
                                title="Subir foto real de los equipos físicos de tu obra"
                            >
                                <Upload size={13} className="text-amber-400" />
                                <span>{isCustomPhoto ? 'Cambiar Foto' : 'Subir foto'}</span>
                            </button>

                            {isCustomPhoto && (
                                <button
                                    type="button"
                                    onClick={() => handleResetPhoto(activeTarget)}
                                    className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 transition-colors flex items-center gap-1"
                                    title="Restablecer a la imagen oficial"
                                >
                                    <RefreshCw size={12} />
                                </button>
                            )}
                        </>
                    )}

                    {(onSetAllConforme || onSetAllConformeTarget) && (
                        <button
                            type="button"
                            onClick={() => {
                                if (onSetAllConformeTarget) onSetAllConformeTarget(filterView);
                                else if (onSetAllConforme) onSetAllConforme();
                            }}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/40 transition-colors flex items-center gap-1.5"
                            title="Marcar equipo actual en estado Conforme (V)"
                        >
                            <Check size={14} /> Todos V
                        </button>
                    )}
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                        Observados: <b className={totalDefects > 0 ? "text-red-400" : "text-emerald-400"}>{totalDefects}</b>
                    </span>
                </div>
            </div>

            {/* Pestañas de Selección de Equipo */}
            <div className="bg-slate-950/70 border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                        type="button"
                        onClick={() => setFilterView('arnes')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                            filterView === 'arnes' 
                                ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <span>🧍‍♂️ Arnés de Cuerpo Entero</span>
                        {arnesDefects > 0 && <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded-full">{arnesDefects}</span>}
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterView('linea_absorbedor')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                            filterView === 'linea_absorbedor' 
                                ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <span>🪝 Línea con Amortiguador</span>
                        {absDefects > 0 && <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded-full">{absDefects}</span>}
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterView('linea_posicionamiento')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                            filterView === 'linea_posicionamiento' 
                                ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <span>🪢 Línea sin Amortiguador</span>
                        {posDefects > 0 && <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded-full">{posDefects}</span>}
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterView('all')}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                            filterView === 'all' 
                                ? 'bg-slate-700 text-white shadow-md' 
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <Eye size={13} />
                        <span>Ver Todos (3)</span>
                    </button>
                </div>

                <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-3">
                    <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Conforme (V)
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span> Observado / Defecto (X)
                    </span>
                </div>
            </div>

            {/* TARJETAS DE CRITERIOS AISLADAS */}
            <div className="bg-slate-950/40 p-3 border-b border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                {/* 1. Arnés */}
                {(filterView === 'all' || filterView === 'arnes') && (
                    <div className={`p-2.5 rounded-xl border transition-all ${arnesDefects > 0 ? 'bg-red-950/20 border-red-900/50' : 'bg-slate-900/80 border-slate-800'}`}>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-slate-200 flex items-center gap-1.5">
                                🧍‍♂️ Arnés de Cuerpo Entero
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${arnesDefects > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                {arnesDefects > 0 ? `${arnesDefects} obs.` : 'Conforme ✓'}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
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
                                        className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors flex items-center gap-1 ${
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
                )}

                {/* 2. Línea con amortiguador */}
                {(filterView === 'all' || filterView === 'linea_absorbedor') && (
                    <div className={`p-2.5 rounded-xl border transition-all ${absDefects > 0 ? 'bg-red-950/20 border-red-900/50' : 'bg-slate-900/80 border-slate-800'}`}>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-slate-200 flex items-center gap-1.5">
                                🪝 Línea con Amortiguador (Absorbedor)
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${absDefects > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                {absDefects > 0 ? `${absDefects} obs.` : 'Conforme ✓'}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                { key: 'correas' as const, label: 'Cintas/Shock' },
                                { key: 'costuras' as const, label: 'Costuras' },
                                { key: 'mosquetones' as const, label: 'Mosquetones' },
                                { key: 'gatillo' as const, label: 'Gatillo/Seg.' }
                            ].map(c => {
                                const isDef = getTargetCriterionStatus('linea_absorbedor', c.key) === 'X';
                                return (
                                    <button
                                        key={c.key}
                                        type="button"
                                        onClick={() => handleToggleCriterionClick('linea_absorbedor', c.key)}
                                        className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors flex items-center gap-1 ${
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
                )}

                {/* 3. Línea sin amortiguador */}
                {(filterView === 'all' || filterView === 'linea_posicionamiento') && (
                    <div className={`p-2.5 rounded-xl border transition-all ${posDefects > 0 ? 'bg-red-950/20 border-red-900/50' : 'bg-slate-900/80 border-slate-800'}`}>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-slate-200 flex items-center gap-1.5">
                                🪢 Línea sin Amortiguador (Posicionamiento)
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${posDefects > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                {posDefects > 0 ? `${posDefects} obs.` : 'Conforme ✓'}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
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
                                        className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors flex items-center gap-1 ${
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
                )}
            </div>

            {/* ÁREA GRÁFICA INTERACTIVA */}
            <div className="relative w-full flex items-center justify-center p-3 sm:p-5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 min-h-[460px] select-none">
                {filterView === 'all' ? (
                    // VISTA TRIPLE COMPARATIVA
                    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl py-2">
                        {/* 1. Arnés Card */}
                        <div 
                            onClick={() => setFilterView('arnes')}
                            className="group cursor-pointer bg-slate-950 border border-slate-800 hover:border-amber-500 rounded-2xl p-3 transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/10 flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-black text-xs text-white uppercase flex items-center gap-1.5">
                                    🧍‍♂️ Arnés de Cuerpo Entero
                                </span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${arnesDefects > 0 ? 'bg-red-500 text-white' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                    {arnesDefects > 0 ? `${arnesDefects} obs.` : 'Conforme ✓'}
                                </span>
                            </div>
                            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-900 border border-slate-800 group-hover:border-amber-400/50 flex items-center justify-center">
                                {renderMode === 'photo' ? (
                                    <img 
                                        src={customPhotos['arnes'] || DEFAULT_PHOTOS.arnes} 
                                        alt="Arnés de Seguridad" 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                    />
                                ) : (
                                    <div className="p-4 text-center">
                                        <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-4xl mb-2">
                                            🧍‍♂️
                                        </div>
                                        <span className="text-xs font-bold text-slate-300">Esquema CAD Vectorial</span>
                                        <p className="text-[10px] text-slate-500 mt-1">Clic para inspeccionar componentes</p>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2.5">
                                    <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                                        Inspeccionar componentes →
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Línea con Amortiguador Card */}
                        <div 
                            onClick={() => setFilterView('linea_absorbedor')}
                            className="group cursor-pointer bg-slate-950 border border-slate-800 hover:border-amber-500 rounded-2xl p-3 transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/10 flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-black text-xs text-white uppercase flex items-center gap-1.5">
                                    🪝 Línea con Amortiguador
                                </span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${absDefects > 0 ? 'bg-red-500 text-white' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                    {absDefects > 0 ? `${absDefects} obs.` : 'Conforme ✓'}
                                </span>
                            </div>
                            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-900 border border-slate-800 group-hover:border-amber-400/50 flex items-center justify-center">
                                {renderMode === 'photo' ? (
                                    <img 
                                        src={customPhotos['linea_absorbedor'] || DEFAULT_PHOTOS.linea_absorbedor} 
                                        alt="Línea con Amortiguador" 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                    />
                                ) : (
                                    <div className="p-4 text-center">
                                        <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-4xl mb-2">
                                            🪝
                                        </div>
                                        <span className="text-xs font-bold text-slate-300">Esquema CAD Vectorial</span>
                                        <p className="text-[10px] text-slate-500 mt-1">Clic para inspeccionar componentes</p>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2.5">
                                    <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                                        Inspeccionar componentes →
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Línea sin Amortiguador Card */}
                        <div 
                            onClick={() => setFilterView('linea_posicionamiento')}
                            className="group cursor-pointer bg-slate-950 border border-slate-800 hover:border-amber-500 rounded-2xl p-3 transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/10 flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-black text-xs text-white uppercase flex items-center gap-1.5">
                                    🪢 Línea de Posicionamiento
                                </span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${posDefects > 0 ? 'bg-red-500 text-white' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                    {posDefects > 0 ? `${posDefects} obs.` : 'Conforme ✓'}
                                </span>
                            </div>
                            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-900 border border-slate-800 group-hover:border-amber-400/50 flex items-center justify-center">
                                {renderMode === 'photo' ? (
                                    <img 
                                        src={customPhotos['linea_posicionamiento'] || DEFAULT_PHOTOS.linea_posicionamiento} 
                                        alt="Línea de Posicionamiento" 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                    />
                                ) : (
                                    <div className="p-4 text-center">
                                        <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-4xl mb-2">
                                            🪢
                                        </div>
                                        <span className="text-xs font-bold text-slate-300">Esquema CAD Vectorial</span>
                                        <p className="text-[10px] text-slate-500 mt-1">Clic para inspeccionar componentes</p>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2.5">
                                    <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                                        Inspeccionar componentes →
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // VISTA INDIVIDUAL DE ALTA DEFINICIÓN (ESQUEMA TÉCNICO CAD O FOTOGRAFÍA + PUNTOS LATERALES CON GUÍAS)
                    <svg
                        viewBox="0 0 650 395"
                        className="w-full max-w-3xl h-auto drop-shadow-2xl"
                        style={{ maxHeight: '520px' }}
                    >
                        <defs>
                            <filter id="caidasCardShadow" x="-10%" y="-10%" width="120%" height="120%">
                                <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity="0.6" />
                            </filter>

                            {/* Patrón de rejilla milimétrica técnica Blueprint */}
                            <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.8" opacity="0.6" />
                            </pattern>

                            {/* Gradiente de aleación de acero pulido forjado */}
                            <linearGradient id="vectorSteel" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="35%" stopColor="#cbd5e1" />
                                <stop offset="70%" stopColor="#64748b" />
                                <stop offset="100%" stopColor="#334155" />
                            </linearGradient>

                            {/* Gradiente de gatillo y seguro en aleación dorada */}
                            <linearGradient id="vectorGold" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#fef08a" />
                                <stop offset="50%" stopColor="#eab308" />
                                <stop offset="100%" stopColor="#854d0e" />
                            </linearGradient>

                            {/* Gradiente de cinta de poliéster de alta tenacidad naranja industrial */}
                            <linearGradient id="vectorWebbing" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#ea580c" />
                                <stop offset="30%" stopColor="#f97316" />
                                <stop offset="70%" stopColor="#fb923c" />
                                <stop offset="100%" stopColor="#c2410c" />
                            </linearGradient>

                            {/* Gradiente anatómico del maniquí técnico */}
                            <linearGradient id="mannequinBody" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#334155" />
                                <stop offset="60%" stopColor="#1e293b" />
                                <stop offset="100%" stopColor="#0f172a" />
                            </linearGradient>

                            <clipPath id="activePhotoClip">
                                <rect x="20" y="16" width="280" height="364" rx="16" />
                            </clipPath>
                        </defs>

                        {/* ========================================================
                            CANVAS GRÁFICO (A LA IZQUIERDA):
                            ESQUEMA VECTORIAL TÉCNICO CAD O FOTOGRAFÍA INDUSTRIAL
                            ======================================================== */}
                        <g filter="url(#caidasCardShadow)">
                            {/* Marco contenedor */}
                            <rect 
                                x="20" 
                                y="16" 
                                width="280" 
                                height="364" 
                                rx="16" 
                                fill="#090d16" 
                                stroke={totalDefects > 0 ? "#7f1d1d" : "#1e293b"} 
                                strokeWidth="2" 
                            />

                            {/* Rejilla técnica de fondo */}
                            <rect x="20" y="16" width="280" height="364" rx="16" fill="url(#cadGrid)" />

                            {renderMode === 'photo' ? (
                                // MODO FOTOGRAFÍA REAL INDUSTRIAL HD
                                <>
                                    <image 
                                        href={currentPhoto}
                                        xlinkHref={currentPhoto}
                                        x="20" 
                                        y="16" 
                                        width="280" 
                                        height="364" 
                                        preserveAspectRatio="xMidYMid slice"
                                        clipPath="url(#activePhotoClip)"
                                    />
                                    <rect 
                                        x="20" 
                                        y="16" 
                                        width="280" 
                                        height="364" 
                                        rx="16" 
                                        fill="none" 
                                        stroke="#ffffff" 
                                        strokeWidth="1" 
                                        strokeOpacity="0.15" 
                                    />
                                </>
                            ) : (
                                // MODO ESQUEMA VECTORIAL TÉCNICO CAD PROFESIONAL
                                <g id="cad_vector_schematic">
                                    {/* ----------------------------------------------------
                                        ESQUEMA 1: MANIQUÍ TÉCNICO CON ARNÉS DE CUERPO ENTERO
                                        ---------------------------------------------------- */}
                                    {filterView === 'arnes' && (
                                        <g id="vector_arnes">
                                            {/* Sombra en el piso */}
                                            <ellipse cx="160" cy="370" rx="65" ry="7" fill="#020617" opacity="0.6" />

                                            {/* --- SILUETA TÉCNICA DEL MANIQUÍ (ANATOMÍA HUMANA PROPORCIONADA) --- */}
                                            {/* Piernas ergonómicas en pantalón de trabajo técnico */}
                                            <path d="M 134 250 C 130 275 126 315 128 360 L 148 360 C 148 325 152 288 155 258 Z" fill="url(#mannequinBody)" stroke="#334155" strokeWidth="1.2" />
                                            <path d="M 186 250 C 190 275 194 315 192 360 L 172 360 C 172 325 168 288 165 258 Z" fill="url(#mannequinBody)" stroke="#334155" strokeWidth="1.2" />
                                            <path d="M 155 258 Q 160 266 165 258" fill="none" stroke="#0f172a" strokeWidth="2" />

                                            {/* Botas técnicas industriales */}
                                            <rect x="124" y="358" width="26" height="8" rx="2.5" fill="#020617" stroke="#475569" strokeWidth="1" />
                                            <rect x="170" y="358" width="26" height="8" rx="2.5" fill="#020617" stroke="#475569" strokeWidth="1" />

                                            {/* Torso atlético y hombros proporcionados */}
                                            <path d="M 124 105 C 114 116 112 145 116 195 C 118 220 124 235 128 248 L 192 248 C 196 235 202 220 204 195 C 208 145 206 116 196 105 Z" fill="url(#mannequinBody)" stroke="#334155" strokeWidth="1.4" />
                                            
                                            {/* Brazos técnicos */}
                                            <path d="M 122 108 C 112 122 105 155 104 200 L 115 204 C 117 165 122 135 128 120 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                                            <path d="M 198 108 C 208 122 215 155 216 200 L 205 204 C 203 165 198 135 192 120 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />

                                            {/* Cuello y cabeza ergonómica */}
                                            <path d="M 154 90 C 154 96 153 102 150 108 L 170 108 C 167 102 166 96 166 90 Z" fill="#475569" />
                                            <ellipse cx="160" cy="78" rx="16" ry="18" fill="#334155" stroke="#475569" strokeWidth="1" />

                                            {/* Barbiquejo técnico con mentonera */}
                                            <path d="M 148 70 Q 160 94 172 70" fill="none" stroke="#0f172a" strokeWidth="1.8" />
                                            <rect x="156" y="88" width="8" height="3" rx="1" fill="#64748b" />

                                            {/* Casco técnico industrial con visera */}
                                            <path d="M 140 68 C 138 42 152 36 160 36 C 168 36 182 42 180 68 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
                                            <path d="M 136 67 Q 160 63 184 67 L 182 71 Q 160 67 138 71 Z" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
                                            <rect x="144" y="52" width="32" height="4" rx="1" fill="#f59e0b" />

                                            {/* Gafas técnicas de protección */}
                                            <rect x="146" y="70" width="28" height="8" rx="3" fill="#38bdf8" opacity="0.6" stroke="#0284c7" strokeWidth="1" />

                                            {/* --- ARNÉS DE CUERPO ENTERO DE ALTA TENACIDAD (DETALLE TÉCNICO CAD) --- */}
                                            {/* Cruce dorsal posterior (Pad de espalda) y Anillo en D Dorsal */}
                                            <g id="vector_dorsal_assembly">
                                                <rect x="188" y="90" width="18" height="18" rx="4" fill="#020617" stroke="#334155" strokeWidth="1.2" />
                                                <path 
                                                    d="M 194 92 L 202 92 C 206 92 208 95 208 99 C 208 103 206 106 202 106 L 194 106 Z" 
                                                    fill="none" 
                                                    stroke="url(#vectorSteel)" 
                                                    strokeWidth="3.2" 
                                                />
                                            </g>

                                            {/* Tirantes de hombros en cinta tubular naranja de 45mm */}
                                            <path d="M 132 100 L 152 195 L 152 235" fill="none" stroke="url(#vectorWebbing)" strokeWidth="11" strokeLinecap="round" />
                                            <path d="M 188 100 L 168 195 L 168 235" fill="none" stroke="url(#vectorWebbing)" strokeWidth="11" strokeLinecap="round" />

                                            {/* Textura de urdimbre y pespuntes de costura estructural en tirantes */}
                                            <path d="M 132 100 L 152 195 L 152 235" fill="none" stroke="#000000" strokeWidth="1.2" strokeDasharray="3 2" />
                                            <path d="M 188 100 L 168 195 L 168 235" fill="none" stroke="#000000" strokeWidth="1.2" strokeDasharray="3 2" />

                                            {/* Costuras de seguridad en contraste (Patrón zigzag de alta resistencia) */}
                                            <line x1="134" y1="172" x2="148" y2="172" stroke="#fef08a" strokeWidth="2.5" strokeDasharray="2 1.5" />
                                            <line x1="172" y1="172" x2="186" y2="172" stroke="#fef08a" strokeWidth="2.5" strokeDasharray="2 1.5" />
                                            <line x1="136" y1="184" x2="148" y2="184" stroke="#fef08a" strokeWidth="2.5" strokeDasharray="2 1.5" />
                                            <line x1="172" y1="184" x2="184" y2="184" stroke="#fef08a" strokeWidth="2.5" strokeDasharray="2 1.5" />

                                            {/* Anillo en "D" Esternal (Pecho) forjado en acero */}
                                            <g id="vector_sternal_d_ring">
                                                <rect x="152" y="132" width="16" height="16" rx="3" fill="#020617" stroke="#334155" strokeWidth="1" />
                                                <path 
                                                    d="M 154 135 L 163 135 C 168 135 171 138 171 142 C 171 146 168 149 163 149 L 154 149 Z" 
                                                    fill="none" 
                                                    stroke="url(#vectorSteel)" 
                                                    strokeWidth="3.6" 
                                                />
                                            </g>

                                            {/* Cinta Pectoral transversal con hebilla de conexión rápida */}
                                            <line x1="147" y1="158" x2="173" y2="158" stroke="url(#vectorWebbing)" strokeWidth="6.5" strokeLinecap="round" />
                                            <rect x="156" y="154" width="8" height="8" rx="2" fill="url(#vectorSteel)" stroke="#0f172a" strokeWidth="1" />

                                            {/* Faja lumbar ergonómica termoformada y cinturón de posicionamiento */}
                                            <rect x="120" y="218" width="80" height="18" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                                            <rect x="124" y="222" width="72" height="10" rx="2" fill="url(#vectorWebbing)" />

                                            {/* Anillos en "D" Laterales de posicionamiento */}
                                            <path d="M 124 221 L 119 221 C 116 221 114 224 114 227 C 114 230 116 233 119 233 L 124 233 Z" fill="none" stroke="url(#vectorSteel)" strokeWidth="3" />
                                            <path d="M 196 221 L 201 221 C 204 221 206 224 206 227 C 206 230 204 233 201 233 L 196 233 Z" fill="none" stroke="url(#vectorSteel)" strokeWidth="3" />

                                            {/* Hebillas de ajuste en cintura */}
                                            <rect x="154" y="221" width="12" height="12" rx="2.5" fill="url(#vectorSteel)" stroke="#0f172a" strokeWidth="1.2" />

                                            {/* Cintas de Perneras con hebillas de conexión rápida */}
                                            {/* Pernera Izquierda */}
                                            <path d="M 124 270 C 122 288 132 305 148 305" fill="none" stroke="url(#vectorWebbing)" strokeWidth="9" strokeLinecap="round" />
                                            <path d="M 124 270 C 122 288 132 305 148 305" fill="none" stroke="#000000" strokeWidth="1.2" strokeDasharray="3 2" />
                                            <rect x="142" y="295" width="10" height="9" rx="2" fill="url(#vectorSteel)" stroke="#0f172a" strokeWidth="1" />

                                            {/* Pernera Derecha */}
                                            <path d="M 196 270 C 198 288 188 305 172 305" fill="none" stroke="url(#vectorWebbing)" strokeWidth="9" strokeLinecap="round" />
                                            <path d="M 196 270 C 198 288 188 305 172 305" fill="none" stroke="#000000" strokeWidth="1.2" strokeDasharray="3 2" />
                                            <rect x="168" y="295" width="10" height="9" rx="2" fill="url(#vectorSteel)" stroke="#0f172a" strokeWidth="1" />

                                            {/* Cinta subpélvica de soporte */}
                                            <line x1="140" y1="262" x2="180" y2="262" stroke="url(#vectorWebbing)" strokeWidth="7" strokeLinecap="round" opacity="0.9" />

                                            {/* Etiqueta de inspección y trazabilidad con funda de protección */}
                                            <rect x="122" y="125" width="7" height="16" rx="1.5" fill="#f8fafc" stroke="#0f172a" strokeWidth="0.8" />
                                            <line x1="124" y1="128" x2="127" y2="128" stroke="#000000" strokeWidth="1" />
                                            <line x1="124" y1="131" x2="127" y2="131" stroke="#000000" strokeWidth="1" />
                                            <line x1="124" y1="134" x2="127" y2="134" stroke="#000000" strokeWidth="1" />
                                        </g>
                                    )}

                                    {/* ----------------------------------------------------
                                        ESQUEMA 2: LÍNEA DE VIDA CON AMORTIGUADOR DE IMPACTO
                                        ---------------------------------------------------- */}
                                    {filterView === 'linea_absorbedor' && (
                                        <g id="vector_absorbedor">
                                            {/* 1. Mosquetón Superior de Acero Oval Asimétrico */}
                                            <g id="vector_top_carabiner">
                                                <path 
                                                    d="M 152 34 C 144 42 144 60 152 66 C 160 72 168 72 172 66 C 178 60 178 42 172 34 C 166 28 158 28 152 34 Z" 
                                                    fill="none" 
                                                    stroke="url(#vectorSteel)" 
                                                    strokeWidth="4.5" 
                                                />
                                                <line x1="172" y1="42" x2="172" y2="58" stroke="url(#vectorGold)" strokeWidth="4.2" strokeLinecap="round" />
                                                <circle cx="172" cy="50" r="3" fill="#ef4444" />
                                                {/* Textura de rosca/seguro */}
                                                <line x1="170" y1="46" x2="174" y2="46" stroke="#000000" strokeWidth="1" />
                                                <line x1="170" y1="54" x2="174" y2="54" stroke="#000000" strokeWidth="1" />
                                            </g>

                                            {/* Guardacabo y costuras de unión superior */}
                                            <rect x="154" y="68" width="12" height="14" rx="2.5" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                                            <line x1="156" y1="73" x2="164" y2="73" stroke="#fef08a" strokeWidth="2" strokeDasharray="1.5 1" />
                                            <line x1="156" y1="77" x2="164" y2="77" stroke="#fef08a" strokeWidth="2" strokeDasharray="1.5 1" />

                                            {/* 2. Paquete Amortiguador de Impacto (Energy Absorber Pack) */}
                                            <g id="vector_shock_pack">
                                                {/* Carcasa exterior termoplástica transparente */}
                                                <rect 
                                                    x="142" 
                                                    y="84" 
                                                    width="36" 
                                                    height="76" 
                                                    rx="6" 
                                                    fill="#0f172a" 
                                                    opacity="0.85" 
                                                    stroke="#0284c7" 
                                                    strokeWidth="1.5" 
                                                />
                                                
                                                {/* Cinta plegada en acordeón (Tear-webbing) visible al interior */}
                                                <path 
                                                    d="M 148 94 L 172 94 L 148 102 L 172 102 L 148 110 L 172 110 L 148 118 L 172 118 L 148 126 L 172 126 L 148 134 L 172 134 L 148 142 L 172 142" 
                                                    fill="none" 
                                                    stroke="url(#vectorWebbing)" 
                                                    strokeWidth="3.2" 
                                                    strokeLinecap="round" 
                                                />

                                                {/* Costuras estructurales de retención del paquete */}
                                                <line x1="146" y1="106" x2="174" y2="106" stroke="#ffffff" strokeWidth="1.8" strokeDasharray="2 1.5" />
                                                <line x1="146" y1="130" x2="174" y2="130" stroke="#ffffff" strokeWidth="1.8" strokeDasharray="2 1.5" />

                                                {/* Etiqueta técnica normativa y advertencia de caída previa */}
                                                <rect x="146" y="146" width="28" height="10" rx="1.5" fill="#eab308" />
                                                <text x="160" y="153.5" fill="#000000" fontSize="5" fontWeight="900" textAnchor="middle" letterSpacing="0.2">ANSI Z359.13</text>
                                            </g>

                                            {/* Distribuidor de carga y anilla forjada de bifurcación en "Y" */}
                                            <circle cx="160" cy="168" r="7" fill="none" stroke="url(#vectorSteel)" strokeWidth="3" />

                                            {/* 3. Cintas de extensión tubular doble en Y (Brazos elásticos gemelos) */}
                                            <g id="vector_double_lanyard_arms">
                                                {/* Brazo Izquierdo */}
                                                <path d="M 155 174 C 138 200 128 230 120 265" fill="none" stroke="url(#vectorWebbing)" strokeWidth="8" strokeLinecap="round" />
                                                <path d="M 155 174 C 138 200 128 230 120 265" fill="none" stroke="#000000" strokeWidth="1.2" strokeDasharray="4 2" />

                                                {/* Brazo Derecho */}
                                                <path d="M 165 174 C 182 200 192 230 200 265" fill="none" stroke="url(#vectorWebbing)" strokeWidth="8" strokeLinecap="round" />
                                                <path d="M 165 174 C 182 200 192 230 200 265" fill="none" stroke="#000000" strokeWidth="1.2" strokeDasharray="4 2" />
                                            </g>

                                            {/* Guardacabos y costuras de unión a los ganchos */}
                                            <rect x="113" y="260" width="14" height="12" rx="2.5" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                                            <line x1="115" y1="266" x2="125" y2="266" stroke="#fef08a" strokeWidth="2" strokeDasharray="1.5 1" />

                                            <rect x="193" y="260" width="14" height="12" rx="2.5" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                                            <line x1="195" y1="266" x2="205" y2="266" stroke="#fef08a" strokeWidth="2" strokeDasharray="1.5 1" />

                                            {/* 4. Dos Ganchos Estructureros Grandes (2¼" Rebar Hooks) de Acero Forjado */}
                                            {/* Gancho Izquierdo */}
                                            <g id="vector_hook_left" transform="translate(85, 270)">
                                                <path 
                                                    d="M 38 4 C 18 15 16 52 38 72 C 58 84 76 65 72 40 C 69 15 54 2 38 4 Z" 
                                                    fill="none" 
                                                    stroke="url(#vectorSteel)" 
                                                    strokeWidth="5" 
                                                    strokeLinejoin="round" 
                                                />
                                                <path d="M 52 14 L 44 60" stroke="url(#vectorGold)" strokeWidth="4.5" strokeLinecap="round" />
                                                <rect x="42" y="30" width="8" height="14" rx="2" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1" />
                                                <circle cx="38" cy="18" r="2.5" fill="#64748b" />
                                            </g>

                                            {/* Gancho Derecho */}
                                            <g id="vector_hook_right" transform="translate(165, 270)">
                                                <path 
                                                    d="M 38 4 C 18 15 16 52 38 72 C 58 84 76 65 72 40 C 69 15 54 2 38 4 Z" 
                                                    fill="none" 
                                                    stroke="url(#vectorSteel)" 
                                                    strokeWidth="5" 
                                                    strokeLinejoin="round" 
                                                />
                                                <path d="M 52 14 L 44 60" stroke="url(#vectorGold)" strokeWidth="4.5" strokeLinecap="round" />
                                                <rect x="42" y="30" width="8" height="14" rx="2" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1" />
                                                <circle cx="38" cy="18" r="2.5" fill="#64748b" />
                                            </g>
                                        </g>
                                    )}

                                    {/* ----------------------------------------------------
                                        ESQUEMA 3: LÍNEA DE POSICIONAMIENTO Y RESTRICCIÓN
                                        ---------------------------------------------------- */}
                                    {filterView === 'linea_posicionamiento' && (
                                        <g id="vector_posicionamiento">
                                            {/* 1. Mosquetón Superior de Acero de Anclaje */}
                                            <g id="vector_pos_top_carabiner">
                                                <path 
                                                    d="M 152 34 C 144 42 144 60 152 66 C 160 72 168 72 172 66 C 178 60 178 42 172 34 C 166 28 158 28 152 34 Z" 
                                                    fill="none" 
                                                    stroke="url(#vectorSteel)" 
                                                    strokeWidth="4.5" 
                                                />
                                                <line x1="172" y1="42" x2="172" y2="58" stroke="url(#vectorGold)" strokeWidth="4.2" strokeLinecap="round" />
                                                <circle cx="172" cy="50" r="3" fill="#ef4444" />
                                            </g>

                                            {/* Guardacabo y costuras superiores con funda transparente */}
                                            <rect x="154" y="68" width="12" height="18" rx="3" fill="#0284c7" opacity="0.3" stroke="#38bdf8" strokeWidth="1" />
                                            <line x1="156" y1="74" x2="164" y2="74" stroke="#ffffff" strokeWidth="2" strokeDasharray="1.5 1" />
                                            <line x1="156" y1="80" x2="164" y2="80" stroke="#ffffff" strokeWidth="2" strokeDasharray="1.5 1" />

                                            {/* 2. Cuerda semiestática de 12mm de alta visibilidad */}
                                            <path d="M 160 86 L 160 190" stroke="#f59e0b" strokeWidth="10" strokeLinecap="round" />
                                            <path d="M 160 86 L 160 190" stroke="#000000" strokeWidth="1.8" strokeDasharray="6 4" />

                                            {/* Funda protectora deslizante anti-rozamiento */}
                                            <g id="vector_rope_sleeve">
                                                <rect x="153" y="102" width="14" height="52" rx="3.5" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.2" />
                                                <line x1="155" y1="108" x2="165" y2="108" stroke="#ef4444" strokeWidth="2" />
                                                <line x1="155" y1="148" x2="165" y2="148" stroke="#ef4444" strokeWidth="2" />
                                                <text x="160" y="132" fill="#e0f2fe" fontSize="6.5" fontWeight="900" textAnchor="middle" transform="rotate(-90 160 132)">PROTECTOR</text>
                                            </g>

                                            {/* 3. Freno / Tensor de Posicionamiento Mecánico de Aleación Ligera */}
                                            <g id="vector_rope_grab_adjuster" filter="url(#caidasCardShadow)">
                                                {/* Cuerpo del bloqueador de aluminio anodizado */}
                                                <rect x="148" y="186" width="24" height="26" rx="4" fill="url(#vectorSteel)" stroke="#334155" strokeWidth="1.6" />
                                                {/* Palanca ergonómica de regulación */}
                                                <path d="M 172 192 L 184 186 C 186 185 188 187 187 189 L 180 200 Z" fill="url(#vectorGold)" stroke="#854d0e" strokeWidth="1" />
                                                {/* Eje de la leva excéntrica con seguro */}
                                                <circle cx="160" cy="198" r="4.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
                                                <text x="160" y="208" fill="#1e293b" fontSize="5.5" fontWeight="900" textAnchor="middle">FRENO</text>
                                            </g>

                                            {/* Tramo de cuerda inferior saliente del regulador */}
                                            <path d="M 160 212 L 160 295" stroke="#f59e0b" strokeWidth="10" strokeLinecap="round" />
                                            <path d="M 160 212 L 160 295" stroke="#000000" strokeWidth="1.8" strokeDasharray="6 4" />

                                            {/* 4. Terminal cocido con guardacabo plástico y funda termocontraíble */}
                                            <rect x="153" y="275" width="14" height="22" rx="3" fill="#0284c7" opacity="0.35" stroke="#38bdf8" strokeWidth="1" />
                                            <line x1="155" y1="282" x2="165" y2="282" stroke="#ffffff" strokeWidth="2" strokeDasharray="1.5 1" />
                                            <line x1="155" y1="288" x2="165" y2="288" stroke="#ffffff" strokeWidth="2" strokeDasharray="1.5 1" />

                                            {/* 5. Mosquetón Terminal con Cierre de Seguridad Automático */}
                                            <g id="vector_pos_bottom_carabiner">
                                                <path 
                                                    d="M 152 305 C 144 313 144 331 152 337 C 160 343 168 343 172 337 C 178 331 178 313 172 305 C 166 299 158 299 152 305 Z" 
                                                    fill="none" 
                                                    stroke="url(#vectorSteel)" 
                                                    strokeWidth="4.5" 
                                                />
                                                <line x1="172" y1="313" x2="172" y2="329" stroke="url(#vectorGold)" strokeWidth="4.2" strokeLinecap="round" />
                                                <circle cx="172" cy="321" r="3" fill="#ef4444" />
                                            </g>
                                        </g>
                                    )}
                                </g>
                            )}

                            {/* Placa identificadora de equipo sobre el esquema */}
                            <rect x="28" y="24" width="264" height="26" rx="7" fill="#020617" opacity="0.85" stroke="#1e293b" strokeWidth="1" />
                            <text x="160" y="41" fill="#f8fafc" fontSize="10.5" fontWeight="900" textAnchor="middle" letterSpacing="0.4">
                                {filterView === 'arnes' && '🧍‍♂️ ARNÉS DE CUERPO ENTERO (CAD)'}
                                {filterView === 'linea_absorbedor' && '🪝 LÍNEA CON AMORTIGUADOR (CAD)'}
                                {filterView === 'linea_posicionamiento' && '🪢 LÍNEA DE POSICIONAMIENTO (CAD)'}
                            </text>
                        </g>

                        {/* ========================================================
                            LÍNEAS GUÍA Y PUNTOS DE INSPECCIÓN (AL COSTADO DERECHO)
                            ======================================================== */}
                        {visibleHotspots.map(spot => {
                            const isDef = isDefective(spot);
                            const isHovered = hoveredHotspotId === spot.id;
                            const badgeX = 330;
                            const badgeY = spot.badgeY;
                            const badgeW = 300;
                            const badgeH = filterView === 'arnes' ? 34 : 38;
                            const badgeCenterY = badgeY + badgeH / 2;

                            return (
                                <g
                                    key={spot.id}
                                    className="cursor-pointer select-none"
                                    onClick={() => handleToggle(spot)}
                                    onPointerEnter={() => setHoveredHotspotId(spot.id)}
                                    onPointerLeave={() => setHoveredHotspotId(null)}
                                >
                                    {/* Línea guía punteada técnica desde el componente hasta el botón lateral */}
                                    <line
                                        x1={spot.dotX}
                                        y1={spot.dotY}
                                        x2={badgeX}
                                        y2={badgeCenterY}
                                        stroke={isDef ? "#ef4444" : (isHovered ? "#38bdf8" : "#475569")}
                                        strokeWidth={isHovered || isDef ? "1.8" : "1.2"}
                                        strokeDasharray="4 3"
                                        opacity={isHovered ? 1 : 0.75}
                                    />

                                    {/* Punto de mira técnico exacto sobre el esquema */}
                                    <circle
                                        cx={spot.dotX}
                                        cy={spot.dotY}
                                        r={isHovered ? 7 : (isDef ? 6 : 5)}
                                        fill={isDef ? "#dc2626" : (isHovered ? "#38bdf8" : "#10b981")}
                                        stroke="#ffffff"
                                        strokeWidth="1.8"
                                        className={isDef ? "animate-pulse" : ""}
                                    />

                                    {/* Tarjeta de evaluación lateral (Botón de clic) */}
                                    <rect
                                        x={badgeX}
                                        y={badgeY}
                                        width={badgeW}
                                        height={badgeH}
                                        rx="8"
                                        fill={isDef ? "#450a0a" : (isHovered ? "#0f2e4e" : "#1e293b")}
                                        stroke={isDef ? "#ef4444" : (isHovered ? "#38bdf8" : "#334155")}
                                        strokeWidth={isHovered || isDef ? "1.6" : "1"}
                                        filter="url(#caidasCardShadow)"
                                        className="transition-colors duration-150"
                                    />

                                    {/* Círculo indicador de estado (V / X) */}
                                    <circle
                                        cx={badgeX + 20}
                                        cy={badgeCenterY}
                                        r="11"
                                        fill={isDef ? "#dc2626" : "#059669"}
                                        stroke={isDef ? "#fecaca" : "#bbf7d0"}
                                        strokeWidth="1.2"
                                    />

                                    <text
                                        x={badgeX + 20}
                                        y={badgeCenterY + 4}
                                        fill="#ffffff"
                                        fontSize="11"
                                        fontWeight="900"
                                        textAnchor="middle"
                                    >
                                        {isDef ? 'X' : 'V'}
                                    </text>

                                    {/* Nombre del componente técnico */}
                                    <text
                                        x={badgeX + 40}
                                        y={badgeCenterY + 4}
                                        fill={isDef ? "#fca5a5" : "#f1f5f9"}
                                        fontSize="11.5"
                                        fontWeight={isDef || isHovered ? "900" : "bold"}
                                        letterSpacing="0.2"
                                    >
                                        {spot.label}
                                    </text>

                                    {/* Etiqueta de estado en el extremo derecho */}
                                    <rect
                                        x={badgeX + badgeW - 82}
                                        y={badgeCenterY - 10}
                                        width="72"
                                        height="20"
                                        rx="5"
                                        fill={isDef ? "#ef4444" : "#10b981"}
                                        fillOpacity={isDef ? "0.2" : "0.15"}
                                        stroke={isDef ? "#ef4444" : "#10b981"}
                                        strokeWidth="1"
                                    />

                                    <text
                                        x={badgeX + badgeW - 46}
                                        y={badgeCenterY + 3.5}
                                        fill={isDef ? "#f87171" : "#34d399"}
                                        fontSize="9.5"
                                        fontWeight="900"
                                        textAnchor="middle"
                                    >
                                        {isDef ? 'OBSERVADO' : 'CONFORME'}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                )}
            </div>
        </div>
    );
};
