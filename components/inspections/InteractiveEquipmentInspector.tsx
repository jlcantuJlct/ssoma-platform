"use client";

import React, { useState, useMemo } from 'react';
import { 
    Gauge, 
    Wind, 
    ShieldAlert, 
    Wrench, 
    Shield, 
    Tag, 
    Anchor, 
    Lightbulb, 
    BatteryWarning, 
    ToggleRight, 
    Zap, 
    Box, 
    CheckCircle2, 
    AlertTriangle, 
    X,
    Flame,
    Sparkles,
    Info,
    Package,
    Plug
} from 'lucide-react';

export interface DamagedPart {
    id: string;
    name: string;
    hotspot: { x: number; y: number };
    icon: React.ElementType;
    issue: string;
    action: string;
}

const EXTINGUISHER_PARTS: DamagedPart[] = [
    {
        id: 'manometro',
        name: 'Manómetro / Presión',
        hotspot: { x: 190, y: 105 },
        icon: Gauge,
        issue: 'Manómetro averiado o aguja fuera del rango verde (despresurizado)',
        action: 'Realizar recarga y prueba hidrostática.'
    },
    {
        id: 'manguera',
        name: 'Manguera y Tobera',
        hotspot: { x: 235, y: 245 },
        icon: Wind,
        issue: 'Manguera agrietada, con fuga o tobera rota/obstruida',
        action: 'Reemplazar manguera y tobera.'
    },
    {
        id: 'pasador',
        name: 'Pasador y Precinto',
        hotspot: { x: 122, y: 92 },
        icon: ShieldAlert,
        issue: 'Falta pasador de seguridad o precinto plástico roto',
        action: 'Colocar nuevo pasador y precinto.'
    },
    {
        id: 'palanca',
        name: 'Palanca y Manija',
        hotspot: { x: 135, y: 55 },
        icon: Wrench,
        issue: 'Palanca trabada, doblada o con corrosión',
        action: 'Mantenimiento a válvula de descarga.'
    },
    {
        id: 'cilindro',
        name: 'Cilindro / Cuerpo',
        hotspot: { x: 160, y: 290 },
        icon: Shield,
        issue: 'Cilindro con golpes, abolladuras o corrosión',
        action: 'Retirar para prueba y pintura.'
    },
    {
        id: 'dispensador',
        name: 'Dispensador / Gabinete',
        hotspot: { x: 42, y: 255 },
        icon: Package,
        issue: 'Dispensador/gabinete ausente, con vidrio roto o deteriorado',
        action: 'Instalar o reponer dispensador protector de extintor.'
    },
    {
        id: 'etiqueta',
        name: 'Etiqueta / Tarjeta',
        hotspot: { x: 95, y: 210 },
        icon: Tag,
        issue: 'Tarjeta o collarín vencido, ilegible o faltante',
        action: 'Actualizar tarjeta de inspección.'
    },
    {
        id: 'soporte',
        name: 'Soporte y Anclaje',
        hotspot: { x: 160, y: 430 },
        icon: Anchor,
        issue: 'Soporte flojo o altura incorrecta (1.50 m)',
        action: 'Asegurar soporte según norma.'
    }
];

const LUMINARIA_PARTS: DamagedPart[] = [
    {
        id: 'faros',
        name: 'Faros / Lámparas LED',
        hotspot: { x: 95, y: 75 },
        icon: Lightbulb,
        issue: 'Faros LED no encienden o tienen mica rota',
        action: 'Reemplazar focos LED.'
    },
    {
        id: 'bateria',
        name: 'Batería Interna',
        hotspot: { x: 180, y: 220 },
        icon: BatteryWarning,
        issue: 'Batería sin autonomía (no retiene carga)',
        action: 'Sustituir batería recargable.'
    },
    {
        id: 'test',
        name: 'Botón Test / LEDs',
        hotspot: { x: 180, y: 155 },
        icon: ToggleRight,
        issue: 'Botón TEST no responde o LED apagado',
        action: 'Revisar circuito de control.'
    },
    {
        id: 'cable',
        name: 'Cable y Clavija',
        hotspot: { x: 260, y: 315 },
        icon: Zap,
        issue: 'Cable expuesto, pelado o clavija rota',
        action: 'Reparar o cambiar cable y clavija.'
    },
    {
        id: 'tomacorriente',
        name: 'Tomacorriente',
        hotspot: { x: 308, y: 350 },
        icon: Plug,
        issue: 'Tomacorriente de pared suelto, quemado o sin energía',
        action: 'Revisar tomacorriente y tensión 220V.'
    },
    {
        id: 'carcasa',
        name: 'Carcasa / Difusor',
        hotspot: { x: 180, y: 260 },
        icon: Box,
        issue: 'Carcasa fisurada o con suciedad interna',
        action: 'Limpiar y sellar carcasa.'
    },
    {
        id: 'anclaje',
        name: 'Anclaje / Soporte',
        hotspot: { x: 60, y: 190 },
        icon: Anchor,
        issue: 'Fijación a muro suelta o con riesgo de caída',
        action: 'Ajustar anclaje a pared.'
    }
];

interface InteractiveEquipmentInspectorProps {
    equipmentCode: string;
    equipmentType: string;
    observations: string;
    onUpdateObservations: (newObs: string) => void;
    onClose?: () => void;
    onSwitchType?: (newType: string) => void;
}

export const InteractiveEquipmentInspector: React.FC<InteractiveEquipmentInspectorProps> = ({
    equipmentCode,
    equipmentType,
    observations,
    onUpdateObservations,
    onClose,
    onSwitchType
}) => {
    // Detect if current item is a luminaria or an extinguisher
    const isLuminaria = useMemo(() => {
        const lower = (equipmentType || '').toLowerCase();
        return lower.includes('luminaria') || lower.includes('luz') || lower.includes('lampara');
    }, [equipmentType]);

    const activeParts = isLuminaria ? LUMINARIA_PARTS : EXTINGUISHER_PARTS;

    // Detect which parts are currently reported in the observations text
    const selectedPartIds = useMemo(() => {
        const obs = observations || '';
        return activeParts
            .filter(part => obs.toLowerCase().includes(`[${part.name.toLowerCase()}]`))
            .map(part => part.id);
    }, [observations, activeParts]);

    const togglePart = (part: DamagedPart) => {
        const tag = `[${part.name}]`;
        const entryText = `• ${tag}: ${part.issue}. Acción: ${part.action}`;
        
        let currentObs = observations || '';

        // If already selected, remove it
        if (selectedPartIds.includes(part.id)) {
            const regex = new RegExp(`(?:•\\s*)?\\[${escapeRegExp(part.name)}\\]:[^\\n]*(\\n)?`, 'gi');
            currentObs = currentObs.replace(regex, '').trim();
        } else {
            // Add to observations
            if (currentObs.trim().length > 0) {
                currentObs = `${currentObs.trim()}\n${entryText}`;
            } else {
                currentObs = entryText;
            }
        }

        onUpdateObservations(currentObs);
    };

    const clearAllSelected = () => {
        let currentObs = observations || '';
        activeParts.forEach(part => {
            const regex = new RegExp(`(?:•\\s*)?\\[${escapeRegExp(part.name)}\\]:[^\\n]*(\\n)?`, 'gi');
            currentObs = currentObs.replace(regex, '');
        });
        onUpdateObservations(currentObs.trim());
    };

    return (
        <div className="bg-white border-2 border-red-500 rounded-2xl shadow-xl overflow-hidden flex flex-col transition-all duration-300 animate-in fade-in zoom-in-95">
            {/* Header del Inspector Compacto */}
            <div className="bg-gradient-to-r from-red-700 via-red-600 to-rose-700 text-white p-2.5 sm:p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
                        {isLuminaria ? <Lightbulb className="text-yellow-300" size={16} /> : <Flame className="text-orange-300" size={16} />}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-white/20 px-1.5 py-0.2 rounded text-white/95 truncate">
                                {equipmentCode || 'Equipo'}
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-semibold text-red-100 flex items-center gap-1">
                                <Sparkles size={10} className="text-yellow-300" /> Inspector Visual
                            </span>
                        </div>
                        <h3 className="font-extrabold text-xs sm:text-sm text-white leading-tight mt-0.5 truncate">
                            {isLuminaria ? 'Luminaria de Emergencia' : 'Extintor contra Incendios'}
                        </h3>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {onClose && (
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="p-1 hover:bg-white/20 rounded-md text-white/80 hover:text-white transition-colors"
                            title="Ocultar inspector"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Selector Rápido de Tipo de Equipo */}
            <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between gap-1.5">
                <span className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1 shrink-0">
                    <Info size={11} className="text-slate-400" /> Ver:
                </span>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => onSwitchType && onSwitchType('Extintor PQS')}
                        className={`text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full font-bold transition-all border flex items-center gap-1 ${
                            !isLuminaria 
                                ? 'bg-red-600 text-white border-red-700 shadow-xs ring-1 ring-red-200' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-600'
                        }`}
                    >
                        🧯 Extintor
                    </button>
                    <button
                        type="button"
                        onClick={() => onSwitchType && onSwitchType('Luminaria de Emergencia')}
                        className={`text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full font-bold transition-all border flex items-center gap-1 ${
                            isLuminaria 
                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-1 ring-amber-200' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-600'
                        }`}
                    >
                        💡 Luminaria
                    </button>
                </div>
            </div>

            {/* Instrucción visual compacta */}
            <div className="px-3 pt-2 pb-0.5 text-center">
                <p className="text-[10px] sm:text-[11px] text-slate-500 leading-tight">
                    Toca los puntos en la imagen para marcar las <strong className="text-red-600 font-bold">partes dañadas</strong>.
                </p>
            </div>

            {/* Ilustración SVG Interactiva con altura controlada para celular */}
            <div className="relative p-2 sm:p-3 flex items-center justify-center bg-gradient-to-b from-slate-50/70 to-slate-100/50">
                <div className="max-h-[200px] sm:max-h-[270px] w-full flex items-center justify-center">
                    {isLuminaria ? (
                        <LuminariaSVG 
                            parts={activeParts} 
                            selectedIds={selectedPartIds} 
                            onTogglePart={togglePart} 
                        />
                    ) : (
                        <ExtinguisherSVG 
                            parts={activeParts} 
                            selectedIds={selectedPartIds} 
                            onTogglePart={togglePart} 
                        />
                    )}
                </div>
            </div>

            {/* Resumen de Daños y Chips Rápidos reducidos para celular */}
            <div className="p-2.5 sm:p-3 border-t border-slate-100 bg-white space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <AlertTriangle size={13} className="text-red-500" />
                        <span className="text-[10px] sm:text-[11px] font-black uppercase text-slate-700 tracking-wide">
                            Partes con Defecto
                        </span>
                        <span className={`text-[9px] sm:text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                            selectedPartIds.length > 0 ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                            {selectedPartIds.length}
                        </span>
                    </div>
                    {selectedPartIds.length > 0 && (
                        <button
                            type="button"
                            onClick={clearAllSelected}
                            className="text-[10px] font-bold text-slate-400 hover:text-red-600 transition-colors"
                        >
                            Limpiar marcas
                        </button>
                    )}
                </div>

                {/* Grid compacto de 2 columnas para celular */}
                <div className="grid grid-cols-2 gap-1.5 max-h-36 sm:max-h-48 overflow-y-auto pr-1">
                    {activeParts.map((part) => {
                        const isSelected = selectedPartIds.includes(part.id);
                        const Icon = part.icon;
                        return (
                            <button
                                key={part.id}
                                type="button"
                                onClick={() => togglePart(part)}
                                className={`text-left p-1.5 sm:p-2 rounded-lg border transition-all flex items-start gap-1.5 ${
                                    isSelected
                                        ? 'bg-red-50 border-red-500 text-red-900 shadow-xs ring-1 ring-red-400'
                                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                                }`}
                            >
                                <div className={`p-1 rounded shrink-0 mt-0.5 transition-colors ${
                                    isSelected ? 'bg-red-500 text-white' : 'bg-white text-slate-500 border border-slate-200'
                                }`}>
                                    <Icon size={12} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                        <p className="font-bold text-[10px] sm:text-[11px] truncate leading-tight">{part.name}</p>
                                        {isSelected && <CheckCircle2 size={11} className="text-red-600 shrink-0" />}
                                    </div>
                                    <p className="text-[8px] sm:text-[9px] text-slate-400 line-clamp-1 leading-tight mt-0.5">{part.issue}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// Helper to escape regex
function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ==========================================
// COMPONENTE PUNTO INTERACTIVO (HOTSPOT)
// Fijo, sin desplazamientos, Verde al hover/touch, Rojo al seleccionar
const getEquipShortLabel = (part: DamagedPart): string => {
    const n = part.name.toLowerCase();
    if (n.includes('manómetro') || n.includes('manometro')) return 'Manómetro';
    if (n.includes('manguera') || n.includes('corneta')) return 'Manguera';
    if (n.includes('pasador') || n.includes('precinto')) return 'Pasador';
    if (n.includes('palanca')) return 'Palanca';
    if (n.includes('cilindro') || n.includes('tanque')) return 'Cilindro';
    if (n.includes('tarjeta') || n.includes('etiqueta')) return 'Tarjeta';
    if (n.includes('gabinete') || n.includes('dispensador')) return 'Gabinete';
    if (n.includes('lámpara') || n.includes('foco')) return 'Focos';
    if (n.includes('batería') || n.includes('bateria')) return 'Batería';
    if (n.includes('cable') || n.includes('enchufe')) return 'Cable';
    if (n.includes('tomacorriente')) return 'Enchufe';
    if (n.includes('botón') || n.includes('test')) return 'Botón Test';
    return part.name.split(' ')[0];
};

const HotspotPoint = ({
    part,
    isSelected,
    onTogglePart
}: {
    part: DamagedPart;
    isSelected: boolean;
    onTogglePart: (part: DamagedPart) => void;
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const shortLabel = getEquipShortLabel(part);
    const boxW = Math.max(32, shortLabel.length * 6.2 + 8);
    const tooltipY = part.hotspot.y > 28 ? part.hotspot.y - 12 : part.hotspot.y + 16;

    return (
        <g 
            className="cursor-pointer select-none"
            onClick={() => onTogglePart(part)}
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={() => setIsHovered(false)}
            onTouchStart={() => setIsHovered(true)}
            onTouchEnd={() => setTimeout(() => setIsHovered(false), 2000)}
        >
            {/* Área táctil invisible amplia (44x44px equivalente) para celular */}
            <circle 
                cx={part.hotspot.x} 
                cy={part.hotspot.y} 
                r="18" 
                fill="transparent" 
            />

            {/* Aro exterior fijo */}
            {isSelected ? (
                <circle 
                    cx={part.hotspot.x} 
                    cy={part.hotspot.y} 
                    r="9.5" 
                    fill="none" 
                    stroke="#ef4444" 
                    strokeWidth="1.8" 
                    strokeOpacity="0.8"
                />
            ) : isHovered ? (
                <circle 
                    cx={part.hotspot.x} 
                    cy={part.hotspot.y} 
                    r="9.5" 
                    fill="none" 
                    stroke="#22c55e" 
                    strokeWidth="1.8" 
                    strokeOpacity="0.8"
                />
            ) : (
                <circle 
                    cx={part.hotspot.x} 
                    cy={part.hotspot.y} 
                    r="9" 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="1" 
                    strokeOpacity="0.3"
                />
            )}

            {/* Círculo principal compacto */}
            <circle 
                cx={part.hotspot.x} 
                cy={part.hotspot.y} 
                r="5.5" 
                fill={isSelected ? '#dc2626' : (isHovered ? '#16a34a' : '#ffffff')} 
                stroke={isSelected ? '#b91c1c' : (isHovered ? '#15803d' : '#10b981')} 
                strokeWidth="1.5" 
                className="filter drop-shadow-xs transition-colors duration-150"
            />

            {/* Núcleo central */}
            <circle 
                cx={part.hotspot.x} 
                cy={part.hotspot.y} 
                r="2" 
                fill={isSelected ? '#ffffff' : (isHovered ? '#ffffff' : '#10b981')} 
                className="transition-colors duration-150"
            />

            {/* Tooltip flotante: Visible exclusivamente al colocar el cursor o dedo por encima */}
            {isHovered && (
                <g 
                    className="pointer-events-none transition-all duration-150"
                    transform={`translate(${part.hotspot.x}, ${tooltipY})`}
                >
                    <rect 
                        x={-boxW / 2} 
                        y="-7.5" 
                        width={boxW} 
                        height="14" 
                        rx="3.5" 
                        fill={isSelected ? '#dc2626' : '#0f172a'} 
                        stroke={isSelected ? '#ffffff' : (isHovered ? '#22c55e' : '#475569')} 
                        strokeWidth="1" 
                    />
                    <text 
                        x="0" 
                        y="2.5" 
                        fill="#ffffff" 
                        fontSize="7.5" 
                        fontWeight="900" 
                        textAnchor="middle" 
                        letterSpacing="0.3"
                    >
                        {shortLabel}
                    </text>
                </g>
            )}
        </g>
    );
};

// ==========================================
// SVG ILUSTRACIÓN EXTINTOR INTERACTIVO
// ==========================================
const ExtinguisherSVG = ({
    parts,
    selectedIds,
    onTogglePart
}: {
    parts: DamagedPart[];
    selectedIds: string[];
    onTogglePart: (part: DamagedPart) => void;
}) => {
    return (
        <svg 
            viewBox="0 0 320 470" 
            className="w-auto h-full max-h-[195px] sm:max-h-[265px] drop-shadow-sm select-none"
        >
            <defs>
                <linearGradient id="extCylinder" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#991b1b" />
                    <stop offset="25%" stopColor="#dc2626" />
                    <stop offset="55%" stopColor="#ef4444" />
                    <stop offset="85%" stopColor="#dc2626" />
                    <stop offset="100%" stopColor="#7f1d1d" />
                </linearGradient>

                <linearGradient id="specularGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                    <stop offset="50%" stopColor="#ffffff" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>

                <linearGradient id="metalValve" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#64748b" />
                    <stop offset="50%" stopColor="#334155" />
                    <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>

                <radialGradient id="gaugeDial" cx="50%" cy="50%" r="50%">
                    <stop offset="70%" stopColor="#f8fafc" />
                    <stop offset="100%" stopColor="#e2e8f0" />
                </radialGradient>
            </defs>

            {/* Gabinete / Dispensador Protector Exterior */}
            <rect 
                x="30" 
                y="35" 
                width="260" 
                height="425" 
                rx="10" 
                fill="#f8fafc" 
                stroke="#cbd5e1" 
                strokeWidth="2" 
                strokeDasharray="6,4" 
            />
            {/* Manija/Cerradura del Dispensador */}
            <rect x="28" y="240" width="6" height="32" rx="3" fill="#64748b" stroke="#334155" strokeWidth="1" />
            <text x="38" y="52" fill="#94a3b8" fontSize="8" fontWeight="bold" letterSpacing="1">DISPENSADOR / GABINETE</text>

            {/* Base / Piso */}
            <ellipse cx="160" cy="445" rx="75" ry="12" fill="#0f172a" opacity="0.15" />
            
            {/* Soporte de Base */}
            <path d="M 105 405 Q 160 415 215 405 L 210 440 Q 160 448 110 440 Z" fill="#1e293b" />

            {/* Cuerpos cilíndrico */}
            <path 
                d="M 105 180 C 105 125 215 125 215 180 L 215 410 C 215 425 105 425 105 410 Z" 
                fill="url(#extCylinder)" 
                stroke="#7f1d1d" 
                strokeWidth="2" 
            />
            <path 
                d="M 125 160 C 125 140 145 135 150 135 L 150 410 C 145 410 125 405 125 395 Z" 
                fill="url(#specularGlow)" 
            />

            {/* Cuello */}
            <rect x="148" y="115" width="24" height="20" rx="3" fill="url(#metalValve)" stroke="#1e293b" strokeWidth="1.5" />

            {/* Manija fija */}
            <path 
                d="M 150 115 L 90 95 C 80 90 85 80 95 85 L 148 102 Z" 
                fill="#334155" 
                stroke="#1e293b" 
                strokeWidth="2" 
            />

            {/* Palanca de disparo */}
            <path 
                d="M 152 100 L 92 65 C 80 60 88 50 98 55 L 158 85 Z" 
                fill="#475569" 
                stroke="#0f172a" 
                strokeWidth="2" 
            />

            {/* Pasador de seguridad */}
            <circle cx="122" cy="92" r="11" fill="none" stroke="#eab308" strokeWidth="3" />
            <line x1="122" y1="92" x2="152" y2="98" stroke="#ca8a04" strokeWidth="3" strokeLinecap="round" />
            <rect x="132" y="88" width="10" height="7" rx="1.5" fill="#ef4444" stroke="#b91c1c" />

            {/* Manómetro */}
            <g transform="translate(180, 95)">
                <circle cx="10" cy="10" r="15" fill="#cbd5e1" stroke="#334155" strokeWidth="2" />
                <circle cx="10" cy="10" r="12" fill="url(#gaugeDial)" />
                <path d="M 2 10 A 8 8 0 0 1 6 4" fill="none" stroke="#ef4444" strokeWidth="2.5" />
                <path d="M 6 4 A 8 8 0 0 1 14 4" fill="none" stroke="#22c55e" strokeWidth="3" />
                <path d="M 14 4 A 8 8 0 0 1 18 10" fill="none" stroke="#ef4444" strokeWidth="2.5" />
                <line x1="10" y1="10" x2="10" y2="4" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* Manguera y Tobera */}
            <circle cx="170" cy="125" r="5" fill="#1e293b" />
            <path 
                d="M 172 125 C 265 140 255 310 240 370" 
                fill="none" 
                stroke="#1e293b" 
                strokeWidth="9" 
                strokeLinecap="round" 
            />
            <path 
                d="M 172 125 C 265 140 255 310 240 370" 
                fill="none" 
                stroke="#475569" 
                strokeWidth="3" 
                strokeLinecap="round" 
                opacity="0.6" 
            />
            <polygon points="234,360 246,362 250,395 230,395" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />

            {/* Placa Extintor */}
            <g transform="translate(120, 220)">
                <rect x="0" y="0" width="80" height="95" rx="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
                <rect x="5" y="5" width="70" height="18" fill="#1e293b" rx="2" />
                <text x="40" y="18" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle" letterSpacing="1">EXTINTOR</text>
                
                <rect x="8" y="28" width="18" height="14" fill="#3b82f6" rx="2" />
                <text x="17" y="39" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">A</text>
                
                <rect x="31" y="28" width="18" height="14" fill="#ef4444" rx="2" />
                <text x="40" y="39" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">B</text>
                
                <rect x="54" y="28" width="18" height="14" fill="#eab308" rx="2" />
                <text x="63" y="39" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">C</text>

                <line x1="10" y1="50" x2="70" y2="50" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="10" y1="58" x2="65" y2="58" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="10" y1="66" x2="60" y2="66" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="10" y1="74" x2="68" y2="74" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="10" y1="82" x2="55" y2="82" stroke="#cbd5e1" strokeWidth="2" />
            </g>

            {/* Tarjeta de Inspección */}
            <g transform="translate(65, 185) rotate(-8)">
                <line x1="45" y1="0" x2="35" y2="-45" stroke="#fef08a" strokeWidth="1.5" />
                <rect x="0" y="0" width="48" height="65" rx="3" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
                <circle cx="24" cy="8" r="3" fill="#ca8a04" />
                <rect x="6" y="16" width="36" height="5" fill="#ca8a04" rx="1" />
                <line x1="6" y1="27" x2="42" y2="27" stroke="#ca8a04" strokeWidth="1" strokeDasharray="2,2" />
                <line x1="6" y1="35" x2="42" y2="35" stroke="#ca8a04" strokeWidth="1" strokeDasharray="2,2" />
                <line x1="6" y1="43" x2="42" y2="43" stroke="#ca8a04" strokeWidth="1" strokeDasharray="2,2" />
                <line x1="6" y1="51" x2="42" y2="51" stroke="#ca8a04" strokeWidth="1" strokeDasharray="2,2" />
            </g>

            {/* PUNTOS INTERACTIVOS (HOTSPOTS) */}
            {parts.map((part) => (
                <HotspotPoint 
                    key={part.id} 
                    part={part} 
                    isSelected={selectedIds.includes(part.id)} 
                    onTogglePart={onTogglePart} 
                />
            ))}
        </svg>
    );
};

// ==========================================
// SVG ILUSTRACIÓN LUMINARIA DE EMERGENCIA
// ==========================================
const LuminariaSVG = ({
    parts,
    selectedIds,
    onTogglePart
}: {
    parts: DamagedPart[];
    selectedIds: string[];
    onTogglePart: (part: DamagedPart) => void;
}) => {
    return (
        <svg 
            viewBox="0 0 360 380" 
            className="w-auto h-full max-h-[195px] sm:max-h-[265px] drop-shadow-sm select-none"
        >
            <defs>
                <linearGradient id="bodyPlastic" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="60%" stopColor="#f1f5f9" />
                    <stop offset="100%" stopColor="#e2e8f0" />
                </linearGradient>

                <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#fde047" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* Sombra base */}
            <ellipse cx="180" cy="350" rx="130" ry="14" fill="#0f172a" opacity="0.12" />

            {/* Soportes Faros */}
            <path d="M 90 120 L 95 85 L 105 85 L 100 120 Z" fill="#64748b" />
            <path d="M 270 120 L 265 85 L 255 85 L 260 120 Z" fill="#64748b" />

            {/* Faro Izquierdo */}
            <g transform="translate(50, 40)">
                <circle cx="45" cy="40" r="42" fill="url(#lampGlow)" />
                <rect x="15" y="10" width="60" height="60" rx="30" fill="#334155" stroke="#1e293b" strokeWidth="2" />
                <circle cx="45" cy="40" r="24" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
                <circle cx="45" cy="40" r="6" fill="#eab308" />
                <circle cx="36" cy="34" r="3" fill="#eab308" />
                <circle cx="54" cy="34" r="3" fill="#eab308" />
                <circle cx="36" cy="46" r="3" fill="#eab308" />
                <circle cx="54" cy="46" r="3" fill="#eab308" />
            </g>

            {/* Faro Derecho */}
            <g transform="translate(220, 40)">
                <circle cx="45" cy="40" r="42" fill="url(#lampGlow)" />
                <rect x="15" y="10" width="60" height="60" rx="30" fill="#334155" stroke="#1e293b" strokeWidth="2" />
                <circle cx="45" cy="40" r="24" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
                <circle cx="45" cy="40" r="6" fill="#eab308" />
                <circle cx="36" cy="34" r="3" fill="#eab308" />
                <circle cx="54" cy="34" r="3" fill="#eab308" />
                <circle cx="36" cy="46" r="3" fill="#eab308" />
                <circle cx="54" cy="46" r="3" fill="#eab308" />
            </g>

            {/* Gabinete principal */}
            <rect 
                x="55" 
                y="110" 
                width="250" 
                height="190" 
                rx="16" 
                fill="url(#bodyPlastic)" 
                stroke="#cbd5e1" 
                strokeWidth="2.5" 
            />

            {/* Ranuras ventilación */}
            <line x1="80" y1="130" x2="110" y2="130" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
            <line x1="80" y1="138" x2="110" y2="138" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
            <line x1="250" y1="130" x2="280" y2="130" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
            <line x1="250" y1="138" x2="280" y2="138" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />

            {/* Panel central */}
            <rect x="110" y="140" width="140" height="120" rx="10" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
            <text x="180" y="165" fill="#475569" fontSize="10" fontWeight="900" textAnchor="middle" letterSpacing="1.5">EMERGENCY LIGHT</text>
            <text x="180" y="177" fill="#94a3b8" fontSize="7" fontWeight="bold" textAnchor="middle">AUTONOMÍA 90 MIN</text>

            {/* Botón TEST */}
            <g transform="translate(145, 190)">
                <rect x="0" y="0" width="70" height="26" rx="6" fill="#dc2626" stroke="#b91c1c" strokeWidth="1.5" className="filter drop-shadow-sm" />
                <text x="35" y="17" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle" letterSpacing="1">TEST</text>
            </g>

            {/* LEDs Indicadores */}
            <g transform="translate(135, 230)">
                <circle cx="15" cy="10" r="5" fill="#22c55e" stroke="#16a34a" strokeWidth="1.5" />
                <text x="15" y="24" fill="#64748b" fontSize="7" fontWeight="bold" textAnchor="middle">AC ON</text>

                <circle cx="75" cy="10" r="5" fill="#ef4444" stroke="#dc2626" strokeWidth="1.5" />
                <text x="75" y="24" fill="#64748b" fontSize="7" fontWeight="bold" textAnchor="middle">CHARGE</text>
            </g>

            {/* Cable de alimentación hacia el tomacorriente */}
            <path 
                d="M 285 280 C 310 305 260 330 295 350" 
                fill="none" 
                stroke="#334155" 
                strokeWidth="5" 
                strokeLinecap="round" 
            />

            {/* Placa de Tomacorriente de Pared */}
            <g transform="translate(294, 332)">
                {/* Placa rectangular */}
                <rect x="0" y="0" width="28" height="38" rx="4" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" className="filter drop-shadow-xs" />
                {/* Tornillos superior/inferior */}
                <circle cx="14" cy="4" r="1.2" fill="#64748b" />
                <circle cx="14" cy="34" r="1.2" fill="#64748b" />
                {/* Ranuras hembra del tomacorriente */}
                <rect x="8" y="12" width="2.5" height="7" rx="0.8" fill="#1e293b" />
                <rect x="17" y="12" width="2.5" height="7" rx="0.8" fill="#1e293b" />
                {/* Ranura redonda tierra */}
                <circle cx="14" cy="23" r="1.5" fill="#1e293b" />
            </g>

            {/* Clavija / Enchufe macho insertado */}
            <rect x="290" y="342" width="13" height="16" rx="3" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />

            {/* PUNTOS INTERACTIVOS (HOTSPOTS) */}
            {parts.map((part) => (
                <HotspotPoint 
                    key={part.id} 
                    part={part} 
                    isSelected={selectedIds.includes(part.id)} 
                    onTogglePart={onTogglePart} 
                />
            ))}
        </svg>
    );
};
