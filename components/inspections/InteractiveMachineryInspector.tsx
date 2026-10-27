"use client";

import React, { useState, useMemo } from 'react';
import { 
    AlertTriangle, 
    Gauge, 
    Lightbulb, 
    CheckCircle2, 
    X, 
    Sparkles, 
    Flame, 
    Wrench, 
    Droplets, 
    Disc, 
    Zap, 
    Eye,
    Package,
    Shield,
    Volume2,
    RotateCw,
    ChevronLeft,
    ChevronRight,
    Compass,
    Layers,
    Truck
} from 'lucide-react';

export interface MachineryDamagedPart {
    id: string;
    category: 'acceso' | 'cabina' | 'seguridad' | 'fugas';
    name: string;
    checklistItem?: string;
    hotspot: { x: number; y: number };
    icon: React.ElementType;
    issue: string;
    action: string;
    viewAngle?: 'lateral' | 'frontal' | 'posterior';
}

// Helper: Extraer etiqueta corta para tooltip flotante
export const getMachineryShortLabel = (part: MachineryDamagedPart): string => {
    const id = part.id;
    if (id === 'escaleras') return 'Escaleras';
    if (id === 'pasamanos') return 'Pasamanos';
    if (id === 'asiento') return 'Asiento';
    if (id === 'cinturon') return 'Cinturón';
    if (id === 'palanca') return 'Palanca';
    if (id === 'claxon') return 'Claxon';
    if (id === 'luces_cabina') return 'Luz Cabina';
    if (id === 'parabrisas') return 'Parabrisas';
    if (id === 'plumillas') return 'Plumillas';
    if (id === 'espejos') return 'Espejos';
    if (id === 'circulina') return 'Circulina';
    if (id === 'alarma_retroceso') return 'Alarma';
    if (id === 'frenos') return 'Frenos';
    if (id === 'extintor') return 'Extintor';
    if (id === 'conos') return 'Conos';
    if (id === 'kit_derrame') return 'Kit Derrame';
    if (id === 'botiquin') return 'Botiquín';
    if (id === 'luces') return 'Luces';
    if (id === 'cintas') return 'Cintas';
    if (id === 'fuga_aceite') return 'Fuga Aceite';
    if (id === 'fuga_combustible') return 'Fuga Combustible';
    return part.name.split(' ')[0];
};

// ==========================================
// LAS 21 OPCIONES EXACTAS DE LA GRÁFICA
// Acceso (2), Cabina (8), Seguridad (9), Fugas de Fluido (2)
// ==========================================
export const STANDARDIZED_MACHINERY_PARTS: MachineryDamagedPart[] = [
    // --- ACCESO ---
    {
        id: 'escaleras',
        viewAngle: 'lateral',
        category: 'acceso',
        name: 'Escaleras de Acceso',
        checklistItem: 'Escaleras',
        hotspot: { x: 105, y: 172 },
        icon: Wrench,
        issue: 'Peldaños de acceso doblados, agrietados o con superficie resbaladiza',
        action: 'Enderezar y fijar peldaños antideslizantes de subida a cabina.'
    },
    {
        id: 'pasamanos',
        viewAngle: 'lateral',
        category: 'acceso',
        name: 'Pasamanos y Barandas',
        checklistItem: 'Pasamanos',
        hotspot: { x: 106, y: 140 },
        icon: Shield,
        issue: 'Pasamanos suelto, con pernos flojos o riesgo de caída',
        action: 'Ajustar pernos de sujeción y asegurar 3 puntos de apoyo.'
    },

    // --- CABINA DEL OPERADOR ---
    {
        id: 'asiento',
        viewAngle: 'lateral',
        category: 'cabina',
        name: 'Asiento del Operador',
        checklistItem: 'Asiento',
        hotspot: { x: 156, y: 108 },
        icon: Eye,
        issue: 'Suspensión de butaca descalibrada, tapizado roto o riel atascado',
        action: 'Calibrar suspensión ergonómica de asiento del operador.'
    },
    {
        id: 'cinturon',
        viewAngle: 'lateral',
        category: 'cabina',
        name: 'Cinturón de Seguridad',
        checklistItem: 'Cinturón de seguridad (*)',
        hotspot: { x: 178, y: 96 },
        icon: Shield,
        issue: 'Cinturón de 3 pulgadas deshilachado o hebilla no traba al tirón',
        action: 'Cambio de cinturón de seguridad retráctil certificado.'
    },
    {
        id: 'palanca',
        viewAngle: 'lateral',
        category: 'cabina',
        name: 'Palanca de Accionamiento',
        checklistItem: 'Palanca de accionamiento',
        hotspot: { x: 142, y: 132 },
        icon: Gauge,
        issue: 'Palanca de mando / joystick hidráulico con juego excesivo o traba dura',
        action: 'Ajustar articulación de palanca y revisar mandos piloto.'
    },
    {
        id: 'claxon',
        viewAngle: 'lateral',
        category: 'cabina',
        name: 'Claxon / Bocina',
        checklistItem: 'Claxón',
        hotspot: { x: 136, y: 92 },
        icon: Volume2,
        issue: 'Claxon inaudible, pulsador no responde o sin volumen suficiente',
        action: 'Revisar fusible, solenoide y reponer bocina de advertencia.'
    },
    {
        id: 'luces_cabina',
        viewAngle: 'lateral',
        category: 'cabina',
        name: 'Luces de Cabina',
        checklistItem: 'Luces de Cabina',
        hotspot: { x: 155, y: 55 },
        icon: Lightbulb,
        issue: 'Luz interior de cabina quemada o interruptor de cortesía dañado',
        action: 'Cambio de foco interior LED 24V de cabina.'
    },
    {
        id: 'parabrisas',
        viewAngle: 'lateral',
        category: 'cabina',
        name: 'Parabrisas de Cabina',
        checklistItem: 'Parabrizas',
        hotspot: { x: 122, y: 64 },
        icon: Eye,
        issue: 'Vidrio panorámico laminado trizado, rajado o con visibilidad reducida',
        action: 'Cambio de luna laminada de seguridad de cabina.'
    },
    {
        id: 'plumillas',
        viewAngle: 'lateral',
        category: 'cabina',
        name: 'Plumillas Limpiaparabrisas',
        checklistItem: 'Plumillas',
        hotspot: { x: 114, y: 92 },
        icon: Wrench,
        issue: 'Plumilla de jebe cuarteada, reseca o no barre agua eficientemente',
        action: 'Instalar plumilla limpiaparabrisas nueva resistente a intemperie.'
    },
    {
        id: 'espejos',
        viewAngle: 'lateral',
        category: 'cabina',
        name: 'Espejos Retrovisores',
        checklistItem: 'Espejos Retrovisiores (*)',
        hotspot: { x: 92, y: 78 },
        icon: Eye,
        issue: 'Espejos retrovisores trizados, desalineados o con carcasas sueltas',
        action: 'Alinear y asegurar espejos convexos de amplio ángulo de visión.'
    },

    // --- SEGURIDAD ---
    {
        id: 'circulina',
        viewAngle: 'lateral',
        category: 'seguridad',
        name: 'Circulina de Seguridad',
        checklistItem: 'Circulina (*)',
        hotspot: { x: 176, y: 38 },
        icon: Zap,
        issue: 'Circulina estroboscópica ámbar inoperativa o con mica rajada',
        action: 'Reparar switch eléctrico o sustituir circulina estroboscópica LED.'
    },
    {
        id: 'alarma_retroceso',
        viewAngle: 'lateral',
        category: 'seguridad',
        name: 'Alarma de Retroceso',
        checklistItem: 'Alarma de retroceso (*)',
        hotspot: { x: 288, y: 155 },
        icon: Volume2,
        issue: 'Alarma sonora de reversa inaudible a más de 10 metros o inoperativa',
        action: 'Reemplazar chicharra de retroceso de 107 dB y chequear sensor de reversa.'
    },
    {
        id: 'frenos',
        viewAngle: 'lateral',
        category: 'seguridad',
        name: 'Sistema de Frenos',
        checklistItem: 'Sistema de frenos (*)',
        hotspot: { x: 190, y: 172 },
        icon: Disc,
        issue: 'Freno de servicio con carrera larga o freno de parqueo no retiene en pendiente',
        action: 'Purgar circuito de frenos y calibrar zapatas/discos de parqueo.'
    },
    {
        id: 'extintor',
        viewAngle: 'lateral',
        category: 'seguridad',
        name: 'Extintor Contra Incendios',
        checklistItem: 'Extintor',
        hotspot: { x: 208, y: 115 },
        icon: Flame,
        issue: 'Extintor PQS despresurizado, vencido o sin pasador de seguridad precintado',
        action: 'Recargar extintor de 6 kg o 9 kg y actualizar tarjeta de inspección.'
    },
    {
        id: 'conos',
        viewAngle: 'lateral',
        category: 'seguridad',
        name: 'Conos de Seguridad',
        checklistItem: 'Conos de seguridad (en caso aplique)',
        hotspot: { x: 290, y: 115 },
        icon: AlertTriangle,
        issue: 'Conos de señalización ausentes, rotos o sin cinta reflectiva',
        action: 'Equipar con 2 conos reglamentarios de 28 pulgadas con bandas reflectivas.'
    },
    {
        id: 'kit_derrame',
        viewAngle: 'lateral',
        category: 'seguridad',
        name: 'Kit Contra Derrame',
        checklistItem: 'Kit Antiderrame',
        hotspot: { x: 255, y: 115 },
        icon: Package,
        issue: 'Kit antiderrame incompleto: faltan paños absorbentes, salchicha o bolsas',
        action: 'Abastecer kit contra derrames con absorbentes de hidrocarburos.'
    },
    {
        id: 'botiquin',
        viewAngle: 'lateral',
        category: 'seguridad',
        name: 'Botiquín de Primeros Auxilios',
        checklistItem: 'Botiquín',
        hotspot: { x: 188, y: 76 },
        icon: Shield,
        issue: 'Botiquín con insumos faltantes, vencidos o gabinete no accesible',
        action: 'Completar insumos médicos del botiquín según norma técnica.'
    },
    {
        id: 'luces',
        viewAngle: 'lateral',
        category: 'seguridad',
        name: 'Luces y Faros de Trabajo',
        checklistItem: 'Luces (*)',
        hotspot: { x: 70, y: 68 },
        icon: Lightbulb,
        issue: 'Faros delanteros o luces de trabajo LED posteriores inoperativos',
        action: 'Sustituir focos LED faeneros y revisar línea de alimentación 24V.'
    },
    {
        id: 'cintas',
        viewAngle: 'lateral',
        category: 'seguridad',
        name: 'Cintas de Seguridad',
        checklistItem: 'Cintas reflectivas de seguridad (**)',
        hotspot: { x: 220, y: 145 },
        icon: AlertTriangle,
        issue: 'Cintas reflectivas 3M despegadas, desgastadas o con reflectividad nula',
        action: 'Pegar cintas reglamentarias 3M rojo/blanco a lo largo del chasis del equipo.'
    },

    // --- FUGAS DE FLUIDO ---
    {
        id: 'fuga_aceite',
        viewAngle: 'lateral',
        category: 'fugas',
        name: 'Fuga de Aceite de Motor',
        checklistItem: 'Aceite de Motor',
        hotspot: { x: 165, y: 208 },
        icon: Droplets,
        issue: 'Goteo continuo o charco de aceite de motor en el cárter o suelo',
        action: 'Detener equipo, colocar bandeja ecológica y cambiar empaque/retén con fuga.'
    },
    {
        id: 'fuga_combustible',
        viewAngle: 'lateral',
        category: 'fugas',
        name: 'Fuga de Combustible',
        checklistItem: 'Combustible',
        hotspot: { x: 235, y: 208 },
        icon: Droplets,
        issue: 'Fuga o goteo de diésel en cañerías, filtros o tanque de combustible',
        action: 'Ajustar abrazaderas, cambiar filtros de combustible y purgar línea.'
    }
];

// ==========================================
// COMPONENTE HOTSPOT INTERACTIVO
// Micro-punto fijo, Verde al hover/touch, Rojo al seleccionar, con Tooltip flotante
// ==========================================
const HotspotPoint = ({
    part,
    isSelected,
    onTogglePart,
    isCompact = true
}: {
    part: MachineryDamagedPart;
    isSelected: boolean;
    onTogglePart: (part: MachineryDamagedPart) => void;
    isCompact?: boolean;
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const shortLabel = getMachineryShortLabel(part);

    const rClick = isCompact ? 16 : 22;
    const rOuter = isCompact ? 8.5 : 14;
    const rMain = isCompact ? 5.2 : 10;
    const rInner = isCompact ? 1.8 : 3.5;

    // Posición del tooltip
    const isNearTop = part.hotspot.y < 26;
    const tooltipY = isNearTop ? part.hotspot.y + 15 : part.hotspot.y - 12;
    const boxW = Math.max(30, shortLabel.length * 6.2 + 8);

    return (
        <g 
            className="cursor-pointer select-none"
            onClick={() => onTogglePart(part)}
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={() => setIsHovered(false)}
            onTouchStart={() => setIsHovered(true)}
            onTouchEnd={() => setTimeout(() => setIsHovered(false), 2000)}
        >
            {/* Área táctil amplia para celulares */}
            <circle 
                cx={part.hotspot.x} 
                cy={part.hotspot.y} 
                r={rClick} 
                fill="transparent" 
            />

            {/* Aro exterior */}
            {isSelected ? (
                <circle 
                    cx={part.hotspot.x} 
                    cy={part.hotspot.y} 
                    r={rOuter} 
                    fill="none" 
                    stroke="#ef4444" 
                    strokeWidth={isCompact ? 1.8 : 2.5} 
                    strokeOpacity="0.8"
                />
            ) : isHovered ? (
                <circle 
                    cx={part.hotspot.x} 
                    cy={part.hotspot.y} 
                    r={rOuter} 
                    fill="none" 
                    stroke="#22c55e" 
                    strokeWidth={isCompact ? 1.8 : 2.5} 
                    strokeOpacity="0.8"
                />
            ) : (
                <circle 
                    cx={part.hotspot.x} 
                    cy={part.hotspot.y} 
                    r={rOuter} 
                    fill="none" 
                    stroke="#eab308" 
                    strokeWidth={isCompact ? 1 : 1.5} 
                    strokeOpacity="0.3"
                />
            )}

            {/* Círculo central */}
            <circle 
                cx={part.hotspot.x} 
                cy={part.hotspot.y} 
                r={rMain} 
                fill={isSelected ? '#dc2626' : (isHovered ? '#16a34a' : '#ffffff')} 
                stroke={isSelected ? '#b91c1c' : (isHovered ? '#15803d' : '#ca8a04')} 
                strokeWidth={isCompact ? 1.5 : 2} 
                className="filter drop-shadow-xs transition-colors duration-150"
            />

            {/* Núcleo interior */}
            <circle 
                cx={part.hotspot.x} 
                cy={part.hotspot.y} 
                r={rInner} 
                fill={isSelected ? '#ffffff' : (isHovered ? '#ffffff' : '#eab308')} 
                className="transition-colors duration-150"
            />

            {/* TOOLTIP FLOTANTE: Visible exclusivamente al colocar el cursor o dedo por encima */}
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
// COMPONENTE PRINCIPAL INTERACTIVO
// ==========================================
interface InteractiveMachineryInspectorProps {
    machineryCode: string;
    machineryType: string;
    observations: string;
    onUpdateObservations: (newObs: string) => void;
    onUpdateChecklist?: (item: string, status: string) => void;
    onClose?: () => void;
    onSwitchType?: (newType: string) => void;
}

export const InteractiveMachineryInspector: React.FC<InteractiveMachineryInspectorProps> = ({
    machineryCode,
    machineryType,
    observations,
    onUpdateObservations,
    onUpdateChecklist,
    onClose,
    onSwitchType
}) => {
    const [viewAngle, setViewAngle] = useState<'lateral' | 'frontal' | 'posterior'>('lateral');
    const [filterCategory, setFilterCategory] = useState<'all' | 'acceso' | 'cabina' | 'seguridad' | 'fugas'>('all');
    const [isCompactDots, setIsCompactDots] = useState<boolean>(true);

    const parts = STANDARDIZED_MACHINERY_PARTS;

    // Detectar cuáles de los 21 puntos están marcados como dañados según observaciones
    const selectedPartIds = useMemo(() => {
        const obs = observations || '';
        return parts
            .filter(part => obs.toLowerCase().includes(`[${part.name.toLowerCase()}]`))
            .map(part => part.id);
    }, [observations, parts]);

    // Filtrar partes según categoría
    const visibleParts = useMemo(() => {
        return parts.filter(p => {
            return filterCategory === 'all' || p.category === filterCategory;
        });
    }, [parts, filterCategory]);

    // Toggle de selección de defecto
    const togglePart = (part: MachineryDamagedPart) => {
        const tag = `[${part.name}]`;
        const entryText = `• ${tag}: ${part.issue}. Acción: ${part.action}`;
        
        let currentObs = observations || '';
        const isCurrentlySelected = selectedPartIds.includes(part.id);

        if (isCurrentlySelected) {
            // Remover de observaciones
            const regex = new RegExp(`(?:•\\s*)?\\[${escapeRegExp(part.name)}\\]:[^\\n]*(\\n)?`, 'gi');
            currentObs = currentObs.replace(regex, '').trim();

            // Restaurar ítem de checklist a OK o N/A
            if (part.checklistItem && onUpdateChecklist) {
                const isFuga = part.category === 'fugas' || part.name.toLowerCase().includes('fuga');
                onUpdateChecklist(part.checklistItem, isFuga ? 'N/A' : 'OK');
            }
        } else {
            // Agregar a observaciones
            if (currentObs.trim().length > 0) {
                currentObs = `${currentObs.trim()}\n${entryText}`;
            } else {
                currentObs = entryText;
            }

            // Marcar en checklist como Malo ('M') o 'FUGA'
            if (part.checklistItem && onUpdateChecklist) {
                const isFuga = part.category === 'fugas' || part.name.toLowerCase().includes('fuga');
                onUpdateChecklist(part.checklistItem, isFuga ? 'FUGA' : 'M');
            }
        }

        onUpdateObservations(currentObs);
    };

    const clearAllSelected = () => {
        let currentObs = observations || '';
        parts.forEach(part => {
            const regex = new RegExp(`(?:•\\s*)?\\[${escapeRegExp(part.name)}\\]:[^\\n]*(\\n)?`, 'gi');
            currentObs = currentObs.replace(regex, '');
            if (part.checklistItem && onUpdateChecklist) {
                const isFuga = part.category === 'fugas';
                onUpdateChecklist(part.checklistItem, isFuga ? 'N/A' : 'OK');
            }
        });
        onUpdateObservations(currentObs.trim());
    };

    // Navegar ángulos
    const rotateNextAngle = () => {
        if (viewAngle === 'lateral') setViewAngle('frontal');
        else if (viewAngle === 'frontal') setViewAngle('posterior');
        else setViewAngle('lateral');
    };

    const rotatePrevAngle = () => {
        if (viewAngle === 'lateral') setViewAngle('posterior');
        else if (viewAngle === 'posterior') setViewAngle('frontal');
        else setViewAngle('lateral');
    };

    return (
        <div className="bg-white border-2 border-yellow-500 rounded-2xl shadow-xl overflow-hidden flex flex-col transition-all duration-300">
            {/* Header del Inspector */}
            <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-white p-3 sm:p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
                        <Truck className="text-yellow-200" size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-sm tracking-wide uppercase">
                                Inspector de Maquinaria Pesada: {machineryType}
                            </span>
                            <span className="text-[10px] font-mono bg-black/30 text-yellow-200 px-2 py-0.5 rounded-full border border-yellow-400/30">
                                {machineryCode || 'Línea Amarilla'}
                            </span>
                        </div>
                        <p className="text-[11px] text-amber-100 flex items-center gap-1.5 mt-0.5">
                            <Sparkles size={12} className="text-yellow-300" />
                            Acceso, Cabina, Seguridad y Fugas (Aceite y Combustible)
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsCompactDots(!isCompactDots)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                            isCompactDots 
                                ? 'bg-amber-800/80 text-yellow-200 border-yellow-400/50 shadow-inner' 
                                : 'bg-black/30 text-white border-white/30 hover:bg-black/50'
                        }`}
                        title="Alternar tamaño de los puntos de inspección"
                    >
                        {isCompactDots ? '🔘 Puntos Micro' : '🔴 Puntos Grandes'}
                    </button>

                    {onClose && (
                        <button 
                            onClick={onClose}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* BARRA DE VISTAS (ÁNGULOS 3D) */}
            <div className="bg-slate-900 px-3 py-2 flex items-center justify-between border-b border-slate-800 text-white">
                <div className="flex items-center gap-1.5">
                    <Compass size={14} className="text-yellow-400" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                        Ángulo:
                    </span>
                    <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 ml-1">
                        <button
                            type="button"
                            onClick={() => setViewAngle('lateral')}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${
                                viewAngle === 'lateral'
                                    ? 'bg-yellow-500 text-slate-950 shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Truck size={12} />
                            Lateral
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewAngle('frontal')}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${
                                viewAngle === 'frontal'
                                    ? 'bg-yellow-500 text-slate-950 shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            Frontal
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewAngle('posterior')}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${
                                viewAngle === 'posterior'
                                    ? 'bg-yellow-500 text-slate-950 shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            Posterior
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={rotatePrevAngle}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700"
                        title="Girar a vista anterior"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={rotateNextAngle}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700 flex items-center gap-1"
                        title="Girar 3D"
                    >
                        <RotateCw size={12} className="text-yellow-400" />
                        <span className="text-[10px] font-bold hidden sm:inline">Girar</span>
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* FILTROS POR CATEGORÍA ESPECÍFICA */}
            <div className="bg-slate-100 px-3 py-1.5 flex items-center justify-between border-b border-slate-200 overflow-x-auto text-[11px]">
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-bold text-slate-500 uppercase text-[10px] mr-1">Filtro:</span>
                    {[
                        { id: 'all', label: `Todos (${parts.length})` },
                        { id: 'acceso', label: 'Acceso (2)' },
                        { id: 'cabina', label: 'Cabina (8)' },
                        { id: 'seguridad', label: 'Seguridad (9)' },
                        { id: 'fugas', label: 'Fugas (2)' }
                    ].map(f => (
                        <button
                            key={f.id}
                            type="button"
                            onClick={() => setFilterCategory(f.id as any)}
                            className={`px-2 py-0.5 rounded-full font-bold transition-all text-[10px] ${
                                filterCategory === f.id
                                    ? 'bg-slate-800 text-yellow-300 shadow-xs'
                                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-300'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {selectedPartIds.length > 0 && (
                    <button
                        type="button"
                        onClick={clearAllSelected}
                        className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:underline shrink-0 ml-2"
                    >
                        Limpiar marcados ({selectedPartIds.length})
                    </button>
                )}
            </div>

            {/* LIENZO VECTORIAL SVG DINÁMICO */}
            <div className="relative bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-3 sm:p-5 flex items-center justify-center min-h-[290px] sm:min-h-[340px] select-none">
                <div className="w-full max-w-xl aspect-[16/10] relative flex items-center justify-center">
                    <svg 
                        viewBox="0 0 360 230" 
                        className="w-full h-full filter drop-shadow-2xl overflow-visible"
                    >
                        <defs>
                            <linearGradient id="yellowBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#facc15" />
                                <stop offset="50%" stopColor="#eab308" />
                                <stop offset="100%" stopColor="#ca8a04" />
                            </linearGradient>
                            <linearGradient id="metalArmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#64748b" />
                                <stop offset="50%" stopColor="#475569" />
                                <stop offset="100%" stopColor="#334155" />
                            </linearGradient>
                            <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.4" />
                            </linearGradient>
                            <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#1e293b" />
                                <stop offset="50%" stopColor="#334155" />
                                <stop offset="100%" stopColor="#0f172a" />
                            </linearGradient>
                            <linearGradient id="puddleFluidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.8" />
                                <stop offset="50%" stopColor="#0f172a" stopOpacity="0.9" />
                                <stop offset="100%" stopColor="#090d16" stopOpacity="0.95" />
                            </linearGradient>

                            {/* Patrón de Cintas Reflectivas 3M de Seguridad */}
                            <pattern id="machineryRefTape" width="16" height="8" patternUnits="userSpaceOnUse">
                                <rect width="8" height="8" fill="#dc2626" />
                                <rect x="8" width="8" height="8" fill="#ffffff" />
                            </pattern>

                            {/* Gradientes de Extintor, Conos y Parrilla */}
                            <linearGradient id="extinguisherRed" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#ef4444" />
                                <stop offset="60%" stopColor="#dc2626" />
                                <stop offset="100%" stopColor="#991b1b" />
                            </linearGradient>
                            <linearGradient id="coneOrangeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#fb923c" />
                                <stop offset="50%" stopColor="#f97316" />
                                <stop offset="100%" stopColor="#c2410c" />
                            </linearGradient>
                            <linearGradient id="machineryGrille" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#0f172a" />
                                <stop offset="100%" stopColor="#334155" />
                            </linearGradient>
                        </defs>

                        {/* PISO / SUELO */}
                        <line x1="10" y1="205" x2="350" y2="205" stroke="#334155" strokeWidth="2" strokeDasharray="6 4" />

                        {/* MANCHAS DE FUGA EN EL SUELO */}
                        {/* 1. Mancha Aceite */}
                        <ellipse cx="165" cy="208" rx="26" ry="6" fill="url(#puddleFluidGrad)" stroke="#4338ca" strokeWidth="1" strokeDasharray="3 2" opacity="0.85" />
                        <ellipse cx="165" cy="207" rx="16" ry="3.5" fill="#000000" opacity="0.7" />
                        <text x="165" y="210" fill="#a5b4fc" fontSize="5.5" fontWeight="900" textAnchor="middle" letterSpacing="0.4">FUGA ACEITE</text>

                        {/* 2. Mancha Combustible */}
                        <ellipse cx="235" cy="208" rx="26" ry="6" fill="#451a03" stroke="#ea580c" strokeWidth="1" strokeDasharray="3 2" opacity="0.85" />
                        <ellipse cx="235" cy="207" rx="16" ry="3.5" fill="#000000" opacity="0.7" />
                        <text x="235" y="210" fill="#fdba74" fontSize="5.5" fontWeight="900" textAnchor="middle" letterSpacing="0.4">FUGA COMBUSTIBLE</text>

                        {/* SILUETA DE MAQUINARIA SEGÚN TIPO */}
                        <MachinerySilhouette machineryType={machineryType} viewAngle={viewAngle} />

                        {/* ILUSTRACIONES GRÁFICAS DE EQUIPOS DE SEGURIDAD (CONOS, EXTINTOR, FAROS, PARRILLA, BOTIQUÍN, KIT DERRAME, CINTAS) */}
                        <MachinerySafetyEquipment machineryType={machineryType} viewAngle={viewAngle} />

                        {/* PUNTOS INTERACTIVOS (HOTSPOTS) */}
                        {visibleParts.map(part => (
                            <HotspotPoint
                                key={part.id}
                                part={part}
                                isSelected={selectedPartIds.includes(part.id)}
                                onTogglePart={togglePart}
                                isCompact={isCompactDots}
                            />
                        ))}
                    </svg>
                </div>
            </div>

            {/* LEYENDA INFORMATIVA INFERIOR */}
            <div className="bg-slate-50 p-2.5 sm:p-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 font-bold text-[11px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-white border-2 border-yellow-500 inline-block"></span>
                        Punto Disponible
                    </span>
                    <span className="flex items-center gap-1.5 font-bold text-[11px] text-green-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 border border-green-600 inline-block"></span>
                        Tocar / Hover
                    </span>
                    <span className="flex items-center gap-1.5 font-bold text-[11px] text-red-600">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-red-700 inline-block animate-pulse"></span>
                        Defecto Seleccionado
                    </span>
                </div>

                <div className="text-[11px] font-bold text-slate-500">
                    Defectos marcados: <span className="text-red-600 font-black">{selectedPartIds.length}</span>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// SILUETA VECTORIAL SEGÚN EL TIPO DE MAQUINARIA
// ==========================================
const MachinerySilhouette = ({
    machineryType,
    viewAngle
}: {
    machineryType: string;
    viewAngle: 'lateral' | 'frontal' | 'posterior';
}) => {
    const t = (machineryType || '').toLowerCase();

    // VISTA FRONTAL (PARA TODOS LOS EQUIPOS DE MAQUINARIA)
    if (viewAngle === 'frontal') {
        return (
            <g>
                {/* Orugas / Ruedas frontales */}
                <rect x="45" y="155" width="45" height="42" rx="8" fill="url(#trackGrad)" stroke="#64748b" strokeWidth="2" />
                <rect x="270" y="155" width="45" height="42" rx="8" fill="url(#trackGrad)" stroke="#64748b" strokeWidth="2" />
                {/* Chasis frontal */}
                <rect x="75" y="122" width="210" height="58" rx="6" fill="url(#yellowBodyGrad)" stroke="#ca8a04" strokeWidth="2" />
                {/* Cabina panorámica frontal */}
                <rect x="105" y="55" width="150" height="70" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                <rect x="112" y="60" width="136" height="58" rx="4" fill="url(#glassGrad)" />
                {/* Plumillas */}
                <line x1="145" y1="115" x2="175" y2="82" stroke="#cbd5e1" strokeWidth="2.5" />
                <line x1="185" y1="115" x2="215" y2="82" stroke="#cbd5e1" strokeWidth="2.5" />
                {/* Circulina */}
                <rect x="168" y="44" width="24" height="11" rx="3" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
                <circle cx="180" cy="49" r="3" fill="#ffffff" />
                {/* Espejos laterales */}
                <rect x="76" y="68" width="10" height="28" rx="2.5" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
                <rect x="274" y="68" width="10" height="28" rx="2.5" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
                {/* PARRILLA DELANTERA */}
                <rect x="120" y="130" width="120" height="36" rx="4" fill="url(#machineryGrille)" stroke="#334155" strokeWidth="2" />
                <line x1="120" y1="139" x2="240" y2="139" stroke="#64748b" strokeWidth="1.5" />
                <line x1="120" y1="148" x2="240" y2="148" stroke="#64748b" strokeWidth="1.5" />
                <line x1="120" y1="157" x2="240" y2="157" stroke="#64748b" strokeWidth="1.5" />
                <circle cx="180" cy="148" r="7" fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
                {/* FAROS DELANTEROS PRINCIPALES */}
                <g transform="translate(85, 132)">
                    <rect x="0" y="0" width="28" height="24" rx="4" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
                    <circle cx="14" cy="12" r="7" fill="#ffffff" />
                    <circle cx="14" cy="12" r="3.5" fill="#fde047" />
                </g>
                <g transform="translate(247, 132)">
                    <rect x="0" y="0" width="28" height="24" rx="4" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
                    <circle cx="14" cy="12" r="7" fill="#ffffff" />
                    <circle cx="14" cy="12" r="3.5" fill="#fde047" />
                </g>
                {/* CINTAS REFLECTIVAS FRONTALES */}
                <rect x="95" y="172" width="170" height="7" rx="2" fill="url(#machineryRefTape)" stroke="#991b1b" strokeWidth="0.8" />
                <text x="180" y="198" fill="#94a3b8" fontSize="8.5" fontWeight="900" textAnchor="middle" letterSpacing="1">VISTA FRONTAL (DELANTERA)</text>
            </g>
        );
    }

    // VISTA POSTERIOR (PARA TODOS LOS EQUIPOS DE MAQUINARIA)
    if (viewAngle === 'posterior') {
        return (
            <g>
                {/* Orugas / Ruedas posteriores */}
                <rect x="45" y="155" width="45" height="42" rx="8" fill="url(#trackGrad)" stroke="#64748b" strokeWidth="2" />
                <rect x="270" y="155" width="45" height="42" rx="8" fill="url(#trackGrad)" stroke="#64748b" strokeWidth="2" />
                {/* Contrapeso posterior */}
                <rect x="75" y="115" width="210" height="65" rx="8" fill="url(#yellowBodyGrad)" stroke="#ca8a04" strokeWidth="2" />
                <rect x="95" y="125" width="170" height="28" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                <text x="180" y="143" fill="#f8fafc" fontSize="10" fontWeight="900" textAnchor="middle" letterSpacing="1.5">PRECAUCIÓN / MAQUINARIA</text>
                {/* Rejilla de ventilación / Parrilla posterior del motor */}
                <rect x="110" y="65" width="140" height="45" rx="4" fill="url(#machineryGrille)" stroke="#334155" strokeWidth="1.5" />
                <line x1="110" y1="76" x2="250" y2="76" stroke="#64748b" strokeWidth="1.5" />
                <line x1="110" y1="87" x2="250" y2="87" stroke="#64748b" strokeWidth="1.5" />
                <line x1="110" y1="98" x2="250" y2="98" stroke="#64748b" strokeWidth="1.5" />
                {/* Circulina de techo */}
                <rect x="168" y="44" width="24" height="11" rx="3" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
                <circle cx="180" cy="49" r="3" fill="#ffffff" />
                {/* Alarma de retroceso posterior */}
                <g transform="translate(148, 158)">
                    <rect x="0" y="0" width="15" height="13" rx="2" fill="#0f172a" stroke="#ca8a04" strokeWidth="1.2" />
                    <circle cx="7.5" cy="6.5" r="4" fill="#eab308" />
                    <text x="7.5" y="9" fill="#000" fontSize="5" fontWeight="900" textAnchor="middle">🔊</text>
                </g>
                {/* Luces posteriores rojas */}
                <rect x="85" y="158" width="18" height="12" rx="2" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
                <rect x="257" y="158" width="18" height="12" rx="2" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
                {/* Cintas reflectivas posteriores */}
                <rect x="90" y="174" width="180" height="8" rx="2" fill="url(#machineryRefTape)" stroke="#991b1b" strokeWidth="1" />
                <text x="180" y="198" fill="#94a3b8" fontSize="8.5" fontWeight="900" textAnchor="middle" letterSpacing="1">VISTA POSTERIOR (TRASERA)</text>
            </g>
        );
    }

    // EXCAVADORA
    if (t.includes('excavadora') && !t.includes('retro')) {
        return (
            <g>
                <rect x="110" y="165" width="165" height="32" rx="16" fill="url(#trackGrad)" stroke="#64748b" strokeWidth="2" />
                <circle cx="125" cy="181" r="11" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
                <circle cx="260" cy="181" r="11" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
                <circle cx="160" cy="181" r="8" fill="#334155" />
                <circle cx="195" cy="181" r="8" fill="#334155" />
                <circle cx="230" cy="181" r="8" fill="#334155" />
                <path d="M 115 165 L 115 120 L 195 120 L 275 130 L 275 165 Z" fill="url(#yellowBodyGrad)" stroke="#ca8a04" strokeWidth="2" />
                <rect x="115" y="65" width="65" height="58" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                <rect x="118" y="70" width="58" height="48" rx="2" fill="url(#glassGrad)" />
                <path d="M 255 130 Q 278 135 278 165 L 255 165 Z" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />
                <path d="M 155 140 Q 105 55 45 95" fill="none" stroke="url(#yellowBodyGrad)" strokeWidth="12" strokeLinecap="round" />
                <path d="M 45 95 L 30 155" fill="none" stroke="url(#metalArmGrad)" strokeWidth="8" strokeLinecap="round" />
                <path d="M 30 155 Q 18 185 8 185 Q 18 165 30 155 Z" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
                <text x="220" y="148" fill="#713f12" fontSize="9" fontWeight="900" letterSpacing="0.8">EXCAVADORA</text>
            </g>
        );
    }

    // TRACTOR DE ORUGA (BULLDOZER)
    if (t.includes('tractor') || t.includes('oruga') || t.includes('bulldozer')) {
        return (
            <g>
                <rect x="95" y="165" width="180" height="32" rx="16" fill="url(#trackGrad)" stroke="#64748b" strokeWidth="2" />
                <circle cx="112" cy="181" r="12" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
                <circle cx="260" cy="181" r="12" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
                <path d="M 95 165 L 95 125 L 175 125 L 260 125 L 260 165 Z" fill="url(#yellowBodyGrad)" stroke="#ca8a04" strokeWidth="2" />
                <rect x="145" y="65" width="68" height="60" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                <rect x="150" y="70" width="58" height="48" rx="2" fill="url(#glassGrad)" />
                <path d="M 18 155 Q 38 150 40 190 Q 18 190 18 155 Z" fill="#475569" stroke="#1e293b" strokeWidth="2" />
                <polygon points="38,175 105,175 105,182 36,182" fill="url(#metalArmGrad)" />
                <polygon points="265,150 305,168 300,190 280,165" fill="#334155" />
                <text x="145" y="145" fill="#713f12" fontSize="9" fontWeight="900" letterSpacing="0.8">BULLDOZER</text>
            </g>
        );
    }

    // RETROEXCAVADORA
    if (t.includes('retro')) {
        return (
            <g>
                <path d="M 85 165 L 85 130 L 150 130 L 225 130 L 225 165 Z" fill="url(#yellowBodyGrad)" stroke="#ca8a04" strokeWidth="2" />
                <rect x="125" y="68" width="65" height="62" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                <rect x="130" y="72" width="55" height="50" rx="2" fill="url(#glassGrad)" />
                <circle cx="82" cy="182" r="18" fill="#1e293b" stroke="#475569" strokeWidth="3" />
                <circle cx="215" cy="175" r="26" fill="#1e293b" stroke="#475569" strokeWidth="4" />
                <polygon points="20,155 45,150 50,185 18,185" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
                <line x1="45" y1="160" x2="105" y2="145" stroke="url(#yellowBodyGrad)" strokeWidth="6" strokeLinecap="round" />
                <path d="M 230 145 Q 275 95 295 115 L 325 145" fill="none" stroke="url(#yellowBodyGrad)" strokeWidth="7" strokeLinecap="round" />
                <text x="110" y="145" fill="#713f12" fontSize="7.5" fontWeight="900">RETROEXCAVADORA</text>
            </g>
        );
    }

    // CARGADOR FRONTAL
    if (t.includes('cargador') && !t.includes('mini')) {
        return (
            <g>
                <path d="M 95 160 L 95 135 L 165 135 L 265 135 L 265 165 Z" fill="url(#yellowBodyGrad)" stroke="#ca8a04" strokeWidth="2" />
                <rect x="135" y="65" width="65" height="70" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                <rect x="140" y="70" width="55" height="55" rx="2" fill="url(#glassGrad)" />
                <circle cx="95" cy="178" r="25" fill="#1e293b" stroke="#475569" strokeWidth="4" />
                <circle cx="245" cy="178" r="25" fill="#1e293b" stroke="#475569" strokeWidth="4" />
                <polygon points="15,155 40,145 45,190 12,190" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
                <line x1="40" y1="165" x2="120" y2="140" stroke="url(#yellowBodyGrad)" strokeWidth="8" strokeLinecap="round" />
                <text x="175" y="145" fill="#713f12" fontSize="8" fontWeight="900">CARGADOR FRONTAL</text>
            </g>
        );
    }

    // MOTONIVELADORA
    if (t.includes('motoniveladora')) {
        return (
            <g>
                <path d="M 45 175 L 85 115 L 180 115 L 285 145 L 285 175 Z" fill="url(#yellowBodyGrad)" stroke="#ca8a04" strokeWidth="2" />
                <rect x="140" y="65" width="65" height="68" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                <rect x="145" y="70" width="55" height="55" rx="2" fill="url(#glassGrad)" />
                <ellipse cx="42" cy="180" rx="14" ry="18" fill="#1e293b" stroke="#475569" strokeWidth="3" transform="rotate(-8 42 180)" />
                <circle cx="245" cy="180" r="18" fill="#1e293b" stroke="#475569" strokeWidth="3" />
                <circle cx="285" cy="180" r="18" fill="#1e293b" stroke="#475569" strokeWidth="3" />
                <circle cx="130" cy="165" r="16" fill="none" stroke="#475569" strokeWidth="3" />
                <rect x="105" y="180" width="60" height="8" rx="2" fill="#475569" stroke="#1e293b" strokeWidth="1" transform="rotate(10 135 184)" />
                <text x="180" y="150" fill="#713f12" fontSize="7.5" fontWeight="900">MOTONIVELADORA</text>
            </g>
        );
    }

    // PAVIMENTADORA / ESPARCIDOR DE ASFALTO
    if (t.includes('esparcidor') || t.includes('pavimentadora') || (t.includes('asfalto') && !t.includes('imprimador') && !t.includes('distribuidor'))) {
        return (
            <g>
                <path d="M 25 175 L 40 140 L 95 140 L 95 175 Z" fill="#334155" stroke="#1e293b" strokeWidth="2" />
                <path d="M 95 175 L 95 105 L 245 105 L 245 175 Z" fill="url(#yellowBodyGrad)" stroke="#ca8a04" strokeWidth="2" />
                <rect x="125" y="50" width="95" height="8" rx="2" fill="#1e293b" />
                <line x1="135" y1="105" x2="135" y2="55" stroke="#475569" strokeWidth="3" />
                <line x1="205" y1="105" x2="205" y2="55" stroke="#475569" strokeWidth="3" />
                <rect x="100" y="168" width="130" height="24" rx="12" fill="url(#trackGrad)" stroke="#64748b" strokeWidth="2" />
                <rect x="255" y="165" width="55" height="20" rx="3" fill="#475569" stroke="#1e293b" strokeWidth="2" />
                <rect x="250" y="180" width="65" height="6" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
                <text x="155" y="135" fill="#713f12" fontSize="7.5" fontWeight="900">PAVIMENTADORA</text>
            </g>
        );
    }

    // CAMIÓN IMPRIMADOR / DISTRIBUIDOR
    if (t.includes('imprimador') || t.includes('distribuidor')) {
        return (
            <g>
                <path d="M 45 175 L 45 105 L 85 105 L 105 135 L 105 175 Z" fill="url(#yellowBodyGrad)" stroke="#ca8a04" strokeWidth="2" />
                <rect x="52" y="112" width="30" height="25" rx="2" fill="url(#glassGrad)" />
                <rect x="40" y="165" width="275" height="12" fill="#1e293b" />
                <circle cx="75" cy="178" r="16" fill="#1e293b" stroke="#475569" strokeWidth="3" />
                <circle cx="230" cy="178" r="16" fill="#1e293b" stroke="#475569" strokeWidth="3" />
                <circle cx="265" cy="178" r="16" fill="#1e293b" stroke="#475569" strokeWidth="3" />
                <rect x="110" y="85" width="165" height="75" rx="16" fill="#334155" stroke="#1e293b" strokeWidth="2" />
                <rect x="305" y="165" width="30" height="8" rx="2" fill="#0f172a" stroke="#ef4444" strokeWidth="1.5" />
                <text x="180" y="125" fill="#f8fafc" fontSize="8" fontWeight="900" letterSpacing="0.8">DISTRIBUIDOR DE ASFALTO</text>
            </g>
        );
    }

    // RODILLO NEUMÁTICO O COMPACTADOR GENERAL
    return (
        <g>
            <path d="M 85 160 L 85 125 L 265 125 L 265 165 Z" fill="url(#yellowBodyGrad)" stroke="#ca8a04" strokeWidth="2" />
            <rect x="135" y="65" width="70" height="60" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            <rect x="140" y="70" width="60" height="48" rx="2" fill="url(#glassGrad)" />
            <circle cx="75" cy="175" r="26" fill="#64748b" stroke="#334155" strokeWidth="4" />
            <circle cx="235" cy="175" r="24" fill="#1e293b" stroke="#475569" strokeWidth="4" />
            <text x="160" y="145" fill="#713f12" fontSize="7.5" fontWeight="900">COMPACTADOR</text>
        </g>
    );
};

// ==========================================
// ELEMENTOS ILUSTRADOS DE SEGURIDAD (CONOS, EXTINTOR, FAROS, PARRILLA, BOTIQUÍN, KIT DERRAME, CINTAS)
// ==========================================
const MachinerySafetyEquipment = ({
    machineryType,
    viewAngle
}: {
    machineryType: string;
    viewAngle: 'lateral' | 'frontal' | 'posterior';
}) => {
    if (viewAngle === 'lateral') {
        return (
            <g id="machinery-safety-elements-lateral">
                {/* 1. CINTA DE SEGURIDAD REFLECTIVA 3M A LO LARGO DEL CHASIS */}
                <g transform="translate(105, 142)">
                    <rect x="0" y="0" width="165" height="6" rx="1.5" fill="url(#machineryRefTape)" stroke="#991b1b" strokeWidth="0.8" />
                    <line x1="0" y1="3" x2="165" y2="3" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
                </g>

                {/* 2. PARRILLA LATERAL / ENFRIAMIENTO MOTOR */}
                <g transform="translate(242, 126)">
                    <rect x="0" y="0" width="22" height="18" rx="2" fill="url(#machineryGrille)" stroke="#475569" strokeWidth="1" />
                    <line x1="3" y1="4" x2="19" y2="4" stroke="#64748b" strokeWidth="1" />
                    <line x1="3" y1="8" x2="19" y2="8" stroke="#64748b" strokeWidth="1" />
                    <line x1="3" y1="12" x2="19" y2="12" stroke="#64748b" strokeWidth="1" />
                    <line x1="3" y1="15" x2="19" y2="15" stroke="#64748b" strokeWidth="1" />
                </g>

                {/* 3. FAROS DE TRABAJO DELANTEROS Y SOPORTE DE PARRILLA */}
                <g transform="translate(58, 56)">
                    {/* Soporte de montaje metálico */}
                    <rect x="6" y="14" width="8" height="6" fill="#1e293b" />
                    {/* Faro de trabajo doble con carcasa de fundición */}
                    <rect x="0" y="0" width="22" height="16" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                    {/* Lentes reflectores con haz de luz */}
                    <circle cx="6" cy="8" r="4.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
                    <circle cx="6" cy="8" r="2" fill="#ffffff" />
                    <circle cx="16" cy="8" r="4.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
                    <circle cx="16" cy="8" r="2" fill="#ffffff" />
                    {/* Rejilla protectora sobre los faros */}
                    <line x1="0" y1="8" x2="22" y2="8" stroke="#334155" strokeWidth="0.8" />
                    {/* Proyección sutil de haz de luz */}
                    <polygon points="0,8 -20,-2 -20,20" fill="#fef08a" opacity="0.2" />
                </g>

                {/* 4. BOTIQUÍN DE PRIMEROS AUXILIOS INDUSTRIAL */}
                <g transform="translate(178, 66)">
                    {/* Caja médica con esquinas redondeadas y asa */}
                    <rect x="2" y="4" width="20" height="16" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
                    <rect x="8" y="1" width="8" height="3" rx="1" fill="#334155" stroke="#1e293b" strokeWidth="0.8" />
                    {/* Cruz roja de primeros auxilios */}
                    <rect x="10" y="8" width="4" height="8" rx="0.5" fill="#ef4444" />
                    <rect x="8" y="10" width="8" height="4" rx="0.5" fill="#ef4444" />
                    {/* Broches metálicos laterales */}
                    <rect x="3.5" y="7" width="1.5" height="2" fill="#94a3b8" />
                    <rect x="19" y="7" width="1.5" height="2" fill="#94a3b8" />
                </g>

                {/* 5. EXTINTOR CONTRA INCENDIOS COMPLETO */}
                <g transform="translate(201, 98)">
                    {/* Soporte con zuncho metálico */}
                    <rect x="2" y="16" width="14" height="2" fill="#1e293b" />
                    {/* Botella presurizada roja */}
                    <rect x="3" y="10" width="12" height="23" rx="4.5" fill="url(#extinguisherRed)" stroke="#991b1b" strokeWidth="1" />
                    {/* Válvula de bronce y manija de disparo */}
                    <rect x="7" y="5.5" width="4" height="4.5" fill="#475569" />
                    <path d="M 4 7 L 14 4" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" />
                    {/* Manómetro de presión con aguja */}
                    <circle cx="12" cy="7.5" r="2" fill="#ffffff" stroke="#1e293b" strokeWidth="0.6" />
                    <circle cx="12" cy="7.5" r="0.9" fill="#22c55e" />
                    {/* Manguera de descarga de jebe flexible */}
                    <path d="M 7 8 Q 1.5 13 3.5 25" fill="none" stroke="#0f172a" strokeWidth="1.3" strokeLinecap="round" />
                    {/* Tobera / Boquilla */}
                    <rect x="2.5" y="24" width="2.5" height="5" rx="0.8" fill="#1e293b" />
                    {/* Tarjeta de inspección plastificada */}
                    <rect x="5.5" y="18" width="7" height="9" rx="0.8" fill="#ffffff" opacity="0.95" />
                    <rect x="6.5" y="20" width="5" height="1" fill="#dc2626" />
                    <rect x="6.5" y="22" width="5" height="1" fill="#2563eb" />
                </g>

                {/* 6. KIT CONTRA DERRAMES DE HIDROCARBUROS */}
                <g transform="translate(244, 99)">
                    {/* Bidón / Tambor contenedor amarillo */}
                    <rect x="2" y="7" width="20" height="24" rx="3.5" fill="#eab308" stroke="#ca8a04" strokeWidth="1.2" />
                    {/* Ranuras de refuerzo del tambor */}
                    <line x1="2" y1="13" x2="22" y2="13" stroke="#ca8a04" strokeWidth="1" />
                    <line x1="2" y1="21" x2="22" y2="21" stroke="#ca8a04" strokeWidth="1" />
                    {/* Tapa negra hermética con manija */}
                    <rect x="0" y="3.5" width="24" height="4.5" rx="1.5" fill="#1e293b" stroke="#0f172a" strokeWidth="0.8" />
                    <rect x="9" y="1.5" width="6" height="2.5" rx="0.8" fill="#475569" />
                    {/* Rótulo de Kit Antiderrame con ícono */}
                    <rect x="4" y="15" width="16" height="10" rx="1" fill="#ffffff" opacity="0.95" />
                    <text x="12" y="20.5" fill="#0f172a" fontSize="4.2" fontWeight="900" textAnchor="middle">KIT</text>
                    <text x="12" y="23.5" fill="#ea580c" fontSize="2.8" fontWeight="900" textAnchor="middle">DERRAME</text>
                </g>

                {/* 7. 2 CONOS DE SEGURIDAD VIALES CON BANDAS REFLECTIVAS */}
                <g transform="translate(278, 97)">
                    {/* Cono trasero / sombra */}
                    <g transform="translate(9, 1) scale(0.85)">
                        <polygon points="6,25 20,25 14,3 12,3" fill="#ea580c" stroke="#c2410c" strokeWidth="1" />
                        <polygon points="9.5,14 16.5,14 15.5,10 10.5,10" fill="#ffffff" />
                        <polygon points="10.8,8 15.2,8 14.5,5.5 11.5,5.5" fill="#ffffff" />
                        <rect x="3" y="24" width="20" height="4.5" rx="1" fill="#1e293b" />
                    </g>
                    {/* Cono delantero principal */}
                    <polygon points="6,26 20,26 14,2 12,2" fill="url(#coneOrangeGrad)" stroke="#c2410c" strokeWidth="1.2" />
                    {/* Bandas reflectivas blancas */}
                    <polygon points="11,8 15,8 14.2,4.5 11.8,4.5" fill="#ffffff" />
                    <polygon points="9,17 17,17 15.8,11.5 10.2,11.5" fill="#ffffff" />
                    {/* Base de goma pesada negra con bisel */}
                    <rect x="3" y="25" width="20" height="4.5" rx="1.2" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
                </g>
            </g>
        );
    }

    if (viewAngle === 'frontal') {
        return (
            <g id="machinery-safety-elements-frontal">
                {/* 1. EXTINTOR LATERAL EN PILAR */}
                <g transform="translate(88, 88)">
                    <rect x="2" y="6" width="9" height="19" rx="3.5" fill="url(#extinguisherRed)" stroke="#991b1b" strokeWidth="1" />
                    <rect x="4.5" y="3" width="4" height="3" fill="#475569" />
                    <circle cx="8" cy="4.5" r="1.5" fill="#ffffff" stroke="#1e293b" strokeWidth="0.5" />
                </g>

                {/* 2. BOTIQUÍN EN CABINA */}
                <g transform="translate(138, 82)">
                    <rect x="0" y="0" width="16" height="13" rx="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                    <rect x="6.5" y="3" width="3" height="7" fill="#ef4444" />
                    <rect x="4.5" y="5" width="7" height="3" fill="#ef4444" />
                </g>

                {/* 3. KIT ANTIDERRAME EN PISO/ESTRIBO */}
                <g transform="translate(42, 162)">
                    <rect x="0" y="3" width="16" height="18" rx="2.5" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
                    <rect x="-1" y="0" width="18" height="3.5" rx="1" fill="#1e293b" />
                    <rect x="2" y="9" width="12" height="7" rx="0.5" fill="#ffffff" />
                    <text x="8" y="13.5" fill="#0f172a" fontSize="3" fontWeight="900" textAnchor="middle">KIT</text>
                </g>

                {/* 4. CONOS DE SEGURIDAD EN PISO */}
                <g transform="translate(295, 160)">
                    <polygon points="4,22 16,22 11,3 9,3" fill="url(#coneOrangeGrad)" stroke="#c2410c" strokeWidth="1" />
                    <polygon points="6.8,14 13.2,14 12.2,9 7.8,9" fill="#ffffff" />
                    <rect x="2" y="21" width="16" height="3.5" rx="1" fill="#0f172a" />
                </g>
            </g>
        );
    }

    if (viewAngle === 'posterior') {
        return (
            <g id="machinery-safety-elements-posterior">
                {/* 1. EXTINTOR POSTERIOR */}
                <g transform="translate(88, 88)">
                    <rect x="2" y="6" width="9" height="19" rx="3.5" fill="url(#extinguisherRed)" stroke="#991b1b" strokeWidth="1" />
                    <rect x="4.5" y="3" width="4" height="3" fill="#475569" />
                </g>

                {/* 2. CONOS DE SEGURIDAD EN PLATAFORMA */}
                <g transform="translate(295, 160)">
                    <polygon points="4,22 16,22 11,3 9,3" fill="url(#coneOrangeGrad)" stroke="#c2410c" strokeWidth="1" />
                    <polygon points="6.8,14 13.2,14 12.2,9 7.8,9" fill="#ffffff" />
                    <rect x="2" y="21" width="16" height="3.5" rx="1" fill="#0f172a" />
                </g>

                {/* 3. KIT ANTIDERRAME POSTERIOR */}
                <g transform="translate(42, 162)">
                    <rect x="0" y="3" width="16" height="18" rx="2.5" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
                    <rect x="-1" y="0" width="18" height="3.5" rx="1" fill="#1e293b" />
                    <rect x="2" y="9" width="12" height="7" rx="0.5" fill="#ffffff" />
                    <text x="8" y="13.5" fill="#0f172a" fontSize="3" fontWeight="900" textAnchor="middle">KIT</text>
                </g>
            </g>
        );
    }

    return null;
};

// Helper RegExp escape
function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
