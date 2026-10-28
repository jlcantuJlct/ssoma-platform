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
        hotspot: { x: 146, y: 186 },
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
        hotspot: { x: 142, y: 145 },
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
        hotspot: { x: 192, y: 108 },
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
        hotspot: { x: 198, y: 120 },
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
        hotspot: { x: 168, y: 126 },
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
        hotspot: { x: 78, y: 142 },
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
        hotspot: { x: 176, y: 64 },
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
        hotspot: { x: 148, y: 85 },
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
        hotspot: { x: 152, y: 104 },
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
        hotspot: { x: 132, y: 78 },
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
        hotspot: { x: 175, y: 44 },
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
        hotspot: { x: 252, y: 168 },
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
        hotspot: { x: 218, y: 172 },
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
        hotspot: { x: 212, y: 125 },
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
        hotspot: { x: 244, y: 128 },
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
        hotspot: { x: 240, y: 150 },
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
        hotspot: { x: 182, y: 82 },
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
        hotspot: { x: 42, y: 168 },
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
        hotspot: { x: 178, y: 164 },
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
        hotspot: { x: 110, y: 208 },
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
        hotspot: { x: 175, y: 208 },
        icon: Droplets,
        issue: 'Fuga o goteo de diésel en cañerías, filtros o tanque de combustible',
        action: 'Ajustar abrazaderas, cambiar filtros de combustible y purgar línea.'
    }
];

// ==========================================
// COMPONENTE HOTSPOT INTERACTIVO (PIN CAD TÉCNICO COMPACTO)
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

    const rClick = 16;
    const rOuter = isSelected ? 8.5 : (isHovered ? 8 : 6);
    const rMain = isSelected ? 4.5 : 3.8;
    const rInner = 1.4;

    // Posición del tooltip
    const isNearTop = part.hotspot.y < 30;
    const tooltipY = isNearTop ? part.hotspot.y + 16 : part.hotspot.y - 12;
    const boxW = Math.max(34, shortLabel.length * 6 + 10);

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

            {/* Aro exterior sutil */}
            {isSelected ? (
                <circle 
                    cx={part.hotspot.x} 
                    cy={part.hotspot.y} 
                    r={rOuter} 
                    fill="none" 
                    stroke="#ef4444" 
                    strokeWidth={2} 
                    strokeOpacity="0.8"
                    className="animate-pulse"
                />
            ) : isHovered ? (
                <circle 
                    cx={part.hotspot.x} 
                    cy={part.hotspot.y} 
                    r={rOuter} 
                    fill="none" 
                    stroke="#22c55e" 
                    strokeWidth={1.8} 
                    strokeOpacity="0.9"
                />
            ) : (
                <circle 
                    cx={part.hotspot.x} 
                    cy={part.hotspot.y} 
                    r={rOuter} 
                    fill="none" 
                    stroke="#eab308" 
                    strokeWidth={1} 
                    strokeOpacity="0.4"
                />
            )}

            {/* Círculo central compacto */}
            <circle 
                cx={part.hotspot.x} 
                cy={part.hotspot.y} 
                r={rMain} 
                fill={isSelected ? '#dc2626' : (isHovered ? '#16a34a' : '#ffffff')} 
                stroke={isSelected ? '#b91c1c' : (isHovered ? '#15803d' : '#ca8a04')} 
                strokeWidth={1.2} 
                className="filter drop-shadow-xs transition-colors duration-150"
            />

            {/* Núcleo interior */}
            <circle 
                cx={part.hotspot.x} 
                cy={part.hotspot.y} 
                r={rInner} 
                fill={isSelected ? '#ffffff' : (isHovered ? '#ffffff' : '#ca8a04')} 
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
                        y="-8" 
                        width={boxW} 
                        height="16" 
                        rx="4" 
                        fill={isSelected ? '#991b1b' : '#0f172a'} 
                        stroke={isSelected ? '#f87171' : (isHovered ? '#22c55e' : '#f59e0b')} 
                        strokeWidth="1" 
                    />
                    <text 
                        x="0" 
                        y="3.5" 
                        fill="#ffffff" 
                        fontSize="7.5" 
                        fontWeight="900" 
                        textAnchor="middle" 
                        letterSpacing="0.2"
                    >
                        {shortLabel} {isSelected ? '❌' : '✓'}
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

    // EXCAVADORA HIDRÁULICA SOBRE ORUGAS (HEAVY CRAWLER EXCAVATOR)
    if (t.includes('excavadora') && !t.includes('retro')) {
        return (
            <g id="vector_excavadora">
                {/* Sombra en el suelo */}
                <ellipse cx="180" cy="208" rx="160" ry="9" fill="#020617" opacity="0.6" />

                {/* 1. TREN DE RODAJE Y ORUGAS DE ACERO DE ALTA RESISTENCIA */}
                <g id="undercarriage">
                    <rect x="90" y="165" width="180" height="34" rx="17" fill="url(#trackGrad)" stroke="#475569" strokeWidth="2.5" />
                    {/* Zapatas de oruga en relieve */}
                    <rect x="92" y="167" width="176" height="30" rx="15" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="6 3" />
                    {/* Rueda guía delantera y rueda motriz trasera */}
                    <circle cx="107" cy="182" r="13" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
                    <circle cx="107" cy="182" r="5" fill="#0f172a" />
                    <circle cx="253" cy="182" r="13" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
                    <circle cx="253" cy="182" r="5" fill="#0f172a" />
                    {/* Rodillos inferiores de apoyo de oruga */}
                    {[132, 156, 180, 204, 228].map(rx => (
                        <circle key={rx} cx={rx} cy={183} r="7.5" fill="#1e293b" stroke="#64748b" strokeWidth="1.2" />
                    ))}
                    {/* Escalones de acceso al chasis inferior */}
                    <rect x="86" y="176" width="6" height="12" rx="1.5" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
                </g>

                {/* 2. SUPERESTRUCTURA GIRATORIA (CASA Y CONTRAPESO) */}
                {/* Contrapeso posterior pesado con reborde biselado */}
                <path d="M 235 120 L 278 126 C 285 127 288 135 288 145 L 285 165 L 235 165 Z" fill="#334155" stroke="#1e293b" strokeWidth="2" />
                {/* Carrocería central en amarillo industrial Cat */}
                <path d="M 125 165 L 125 122 C 125 118 130 115 136 115 L 238 115 L 238 165 Z" fill="url(#yellowBodyGrad)" stroke="#ca8a04" strokeWidth="2" />
                {/* Rejillas de disipación de calor del compartimiento motor */}
                <rect x="185" y="124" width="42" height="16" rx="2" fill="url(#machineryGrille)" stroke="#475569" strokeWidth="1" />
                <line x1="187" y1="128" x2="225" y2="128" stroke="#64748b" strokeWidth="1" />
                <line x1="187" y1="132" x2="225" y2="132" stroke="#64748b" strokeWidth="1" />
                <line x1="187" y1="136" x2="225" y2="136" stroke="#64748b" strokeWidth="1" />
                {/* Tubo de escape de gases */}
                <rect x="238" y="96" width="5" height="20" rx="1.5" fill="#0f172a" />

                {/* 3. CABINA DEL OPERADOR PANORÁMICA ROPS */}
                <path d="M 128 122 L 134 68 C 135 64 139 60 145 60 L 180 60 C 185 60 188 64 188 68 L 188 122 Z" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                <path d="M 137 68 L 160 68 L 160 118 L 132 118 Z" fill="url(#glassGrad)" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.4" />
                <path d="M 163 68 L 184 68 L 184 118 L 163 118 Z" fill="url(#glassGrad)" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.4" />
                {/* Butaca del operador y joysticks visibles al interior */}
                <rect x="168" y="90" width="10" height="20" rx="2" fill="#1e293b" />
                <circle cx="173" cy="84" r="4" fill="#334155" />
                {/* Techo de cabina en amarillo */}
                <rect x="130" y="58" width="62" height="6" rx="2" fill="url(#yellowBodyGrad)" stroke="#ca8a04" strokeWidth="1" />
                {/* Espejo lateral exterior */}
                <rect x="124" y="74" width="5" height="14" rx="1.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />

                {/* 4. PLUMA, BALANCÍN Y CUCHARA DE EXCAVACIÓN PESADA */}
                {/* Pluma principal de excavación (Boom) en arco */}
                <path 
                    d="M 148 135 C 130 95 90 48 46 88" 
                    fill="none" 
                    stroke="url(#yellowBodyGrad)" 
                    strokeWidth="14" 
                    strokeLinecap="round" 
                />
                {/* Cilindro hidráulico de elevación de pluma con vástago de acero */}
                <path d="M 142 145 L 98 105" stroke="#334155" strokeWidth="5.5" strokeLinecap="round" />
                <path d="M 98 105 L 80 88" stroke="url(#metalArmGrad)" strokeWidth="3.2" strokeLinecap="round" />
                {/* Brazo de excavación (Stick / Balancín) */}
                <path 
                    d="M 46 88 L 30 162" 
                    fill="none" 
                    stroke="url(#yellowBodyGrad)" 
                    strokeWidth="9" 
                    strokeLinecap="round" 
                />
                {/* Cilindro del balancín */}
                <path d="M 72 70 L 40 115" stroke="#334155" strokeWidth="3.5" />
                {/* Mangueras hidráulicas de alta presión */}
                <path d="M 140 120 Q 95 62 48 90" fill="none" stroke="#0f172a" strokeWidth="2" strokeDasharray="3 1.5" />
                {/* Cuchara de excavación reforzada con 5 dientes */}
                <path 
                    d="M 30 162 C 16 172 10 192 28 198 C 42 202 48 185 38 165 Z" 
                    fill="#334155" 
                    stroke="#1e293b" 
                    strokeWidth="1.8" 
                />
                <polygon points="12,188 4,192 7,196 15,193" fill="#64748b" stroke="#0f172a" strokeWidth="0.8" />
                <polygon points="16,193 8,197 11,201 19,198" fill="#64748b" stroke="#0f172a" strokeWidth="0.8" />
                <polygon points="21,197 13,201 16,205 24,202" fill="#64748b" stroke="#0f172a" strokeWidth="0.8" />

                {/* 5. IDENTIFICADOR */}
                <text x="210" y="152" fill="#713f12" fontSize="7.5" fontWeight="900" letterSpacing="0.8">EXCAVADORA 330</text>
            </g>
        );
    }

    // TRACTOR DE ORUGA / BULLDOZER
    if (t.includes('tractor') || t.includes('oruga') || t.includes('bulldozer')) {
        return (
            <g id="vector_bulldozer">
                {/* Sombra */}
                <ellipse cx="180" cy="208" rx="160" ry="9" fill="#020617" opacity="0.6" />

                {/* Orugas de tracción elevada Caterpillar High-Drive */}
                <g id="bulldozer_tracks">
                    <polygon points="85,195 270,195 285,170 255,145 220,145 100,170" fill="url(#trackGrad)" stroke="#475569" strokeWidth="2" />
                    {/* Rueda motriz elevada */}
                    <circle cx="238" cy="155" r="14" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
                    <circle cx="238" cy="155" r="5" fill="#0f172a" />
                    {/* Rueda guía delantera */}
                    <circle cx="102" cy="182" r="12" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
                    <circle cx="265" cy="182" r="12" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
                    {/* Rodillos inferiores */}
                    {[130, 155, 180, 205, 230].map(bx => (
                        <circle key={bx} cx={bx} cy={186} r="7" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
                    ))}
                </g>

                {/* Chasis motor pesado */}
                <path d="M 88 170 L 92 135 C 94 126 102 120 115 118 L 195 118 L 195 170 Z" fill="url(#yellowBodyGrad)" stroke="#ca8a04" strokeWidth="2" />
                <rect x="108" y="126" width="34" height="15" rx="2" fill="url(#machineryGrille)" stroke="#475569" strokeWidth="1" />
                {/* Tubo de escape vertical */}
                <rect x="135" y="85" width="5" height="34" rx="1.5" fill="#0f172a" />

                {/* Cabina con barras de protección forestal / antivuelco ROPS/FOPS */}
                <rect x="175" y="65" width="62" height="65" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                <rect x="180" y="70" width="52" height="42" rx="2" fill="url(#glassGrad)" />
                {/* Barras de defensa de cabina (Sweeps) */}
                <line x1="94" y1="135" x2="175" y2="65" stroke="#334155" strokeWidth="3" />
                <rect x="172" y="62" width="68" height="6" rx="2" fill="url(#yellowBodyGrad)" stroke="#ca8a04" strokeWidth="1.2" />

                {/* Cuchilla topadora delantera Semi-U de gran capacidad */}
                <path d="M 28 152 Q 44 148 48 195 L 24 195 Q 16 172 28 152 Z" fill="#334155" stroke="#1e293b" strokeWidth="2" />
                {/* Cuchilla de corte inferior antidesgaste */}
                <rect x="18" y="193" width="32" height="5" rx="1" fill="#64748b" stroke="#0f172a" strokeWidth="1" />
                {/* Brazos de empuje reforzados y cilindros hidráulicos de inclinación (Tilt) */}
                <polygon points="46,172 118,172 118,182 44,182" fill="url(#metalArmGrad)" stroke="#334155" strokeWidth="1" />
                <line x1="46" y1="162" x2="88" y2="148" stroke="#334155" strokeWidth="4.5" />
                <line x1="88" y1="148" x2="105" y2="142" stroke="url(#metalArmGrad)" strokeWidth="2.8" />

                {/* Desgarrador posterior multirripper */}
                <polygon points="268,155 308,175 302,198 282,170" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />
                <text x="145" y="152" fill="#713f12" fontSize="7.5" fontWeight="900">BULLDOZER D8</text>
            </g>
        );
    }

    // RETROEXCAVADORA (ALTA DEFINICIÓN VECTORIAL DETALLADA)
    if (t.includes('retro')) {
        return (
            <g id="vector_retroexcavadora_hd">
                {/* 1. SUELO Y SOMBRA PROYECTADA */}
                <ellipse cx="180" cy="208" rx="160" ry="9" fill="#020617" opacity="0.6" />

                {/* 2. CHUTE / SOPORTE DELANTERO Y PALA CARGADORA (FRONT LOADER) */}
                <path d="M 125 152 L 55 178 L 48 188 L 120 162 Z" fill="url(#yellowBodyGrad)" stroke="#ca8a04" strokeWidth="1.5" />
                <path d="M 115 168 L 82 178" stroke="#334155" strokeWidth="4.5" strokeLinecap="round" />
                <path d="M 82 178 L 65 183" stroke="url(#metalArmGrad)" strokeWidth="2.8" strokeLinecap="round" />
                <line x1="88" y1="156" x2="62" y2="170" stroke="#334155" strokeWidth="3" />
                <line x1="62" y1="170" x2="48" y2="182" stroke="#64748b" strokeWidth="2" />
                {/* Cuchara frontal de servicio pesado con dientes */}
                <path 
                    d="M 52 165 L 28 172 L 20 198 L 48 202 L 54 186 Z" 
                    fill="#334155" 
                    stroke="#1e293b" 
                    strokeWidth="1.8" 
                />
                <polygon points="20,198 12,201 16,204 22,203" fill="#64748b" stroke="#0f172a" strokeWidth="0.8" />
                <polygon points="24,203 17,205 21,208 27,206" fill="#64748b" stroke="#0f172a" strokeWidth="0.8" />
                <polygon points="30,205 23,207 27,210 33,208" fill="#64748b" stroke="#0f172a" strokeWidth="0.8" />

                {/* 3. CAPÓ MOTOR, SISTEMA DE ADMISIÓN Y ESCAPE */}
                <path d="M 75 168 L 78 142 C 80 134 88 128 100 126 L 138 124 L 140 168 Z" fill="url(#yellowBodyGrad)" stroke="#ca8a04" strokeWidth="1.8" />
                <rect x="96" y="132" width="28" height="15" rx="2" fill="url(#machineryGrille)" stroke="#475569" strokeWidth="1" />
                <line x1="98" y1="136" x2="122" y2="136" stroke="#64748b" strokeWidth="1" />
                <line x1="98" y1="140" x2="122" y2="140" stroke="#64748b" strokeWidth="1" />
                <line x1="98" y1="144" x2="122" y2="144" stroke="#64748b" strokeWidth="1" />
                {/* Tubo de escape vertical negro con tapa contra lluvia */}
                <rect x="130" y="85" width="4.5" height="40" rx="1.5" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
                <ellipse cx="132" cy="85" rx="3.5" ry="1.5" fill="#475569" />
                <line x1="130" y1="84" x2="136" y2="82" stroke="#e2e8f0" strokeWidth="1.2" />
                {/* Filtro de aire tipo Snorkel */}
                <rect x="122" y="98" width="4" height="26" fill="#1e293b" />
                <circle cx="124" cy="98" r="4.5" fill="#0f172a" stroke="#475569" strokeWidth="1" />

                {/* 4. CHASIS CENTRAL, ESTRIBOS Y TANQUE DE COMBUSTIBLE */}
                <rect x="85" y="162" width="165" height="18" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                <rect x="152" y="164" width="38" height="14" rx="2" fill="#334155" stroke="#475569" strokeWidth="1" />
                <circle cx="185" cy="168" r="2.5" fill="#ef4444" stroke="#7f1d1d" strokeWidth="0.6" />
                {/* Escaleras de acceso antideslizantes de 3 peldaños */}
                <g id="retro_access_stairs" transform="translate(138, 172)">
                    <line x1="0" y1="0" x2="4" y2="24" stroke="#475569" strokeWidth="2" />
                    <line x1="14" y1="0" x2="18" y2="24" stroke="#475569" strokeWidth="2" />
                    <line x1="1" y1="7" x2="15" y2="7" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
                    <line x1="2" y1="15" x2="16" y2="15" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
                    <line x1="3" y1="22" x2="17" y2="22" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
                </g>

                {/* 5. CABINA PANORÁMICA ROPS/FOPS DEL OPERADOR */}
                <path d="M 136 124 L 144 65 C 145 61 150 58 156 58 L 204 58 C 210 58 214 62 215 67 L 218 162 L 140 162 Z" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                <path d="M 148 68 L 176 68 L 176 122 L 142 122 Z" fill="url(#glassGrad)" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.4" />
                <path d="M 180 68 L 208 68 L 212 122 L 180 122 Z" fill="url(#glassGrad)" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.4" />
                <path d="M 180 126 L 214 126 L 215 158 L 180 158 Z" fill="url(#glassGrad)" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.3" />
                <g opacity="0.85">
                    <rect x="184" y="98" width="14" height="24" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                    <circle cx="191" cy="92" r="5" fill="#334155" />
                    <ellipse cx="160" cy="112" rx="4" ry="7" fill="none" stroke="#64748b" strokeWidth="1.5" transform="rotate(-20 160 112)" />
                    <line x1="172" y1="126" x2="170" y2="116" stroke="#94a3b8" strokeWidth="1.8" />
                    <circle cx="170" cy="115" r="2" fill="#ef4444" />
                </g>
                <path d="M 140 60 C 140 56 148 54 158 54 L 208 54 C 218 54 222 56 224 60 L 222 66 L 140 66 Z" fill="url(#yellowBodyGrad)" stroke="#ca8a04" strokeWidth="1.5" />
                <rect x="134" y="76" width="5.5" height="15" rx="1.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                <line x1="139" y1="80" x2="144" y2="82" stroke="#475569" strokeWidth="1.5" />
                <line x1="148" y1="116" x2="164" y2="92" stroke="#0f172a" strokeWidth="1.8" />

                {/* 6. RUEDAS INDUSTRIALES OFF-ROAD DE SERVICIO PESADO */}
                <g id="retro_front_wheel" transform="translate(94, 180)">
                    <circle cx="0" cy="0" r="24" fill="#0f172a" stroke="#1e293b" strokeWidth="4" />
                    <circle cx="0" cy="0" r="21" fill="none" stroke="#334155" strokeWidth="2.5" strokeDasharray="6 3" />
                    <circle cx="0" cy="0" r="14" fill="url(#yellowBodyGrad)" stroke="#ca8a04" strokeWidth="1.5" />
                    <circle cx="0" cy="0" r="7" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
                    <circle cx="-3" cy="-3" r="1.2" fill="#ffffff" />
                    <circle cx="3" cy="-3" r="1.2" fill="#ffffff" />
                    <circle cx="-3" cy="3" r="1.2" fill="#ffffff" />
                    <circle cx="3" cy="3" r="1.2" fill="#ffffff" />
                </g>

                <g id="retro_rear_wheel" transform="translate(218, 168)">
                    <circle cx="0" cy="0" r="36" fill="#0f172a" stroke="#1e293b" strokeWidth="5" />
                    <circle cx="0" cy="0" r="32" fill="none" stroke="#334155" strokeWidth="4" strokeDasharray="9 4" />
                    <circle cx="0" cy="0" r="22" fill="url(#yellowBodyGrad)" stroke="#ca8a04" strokeWidth="2" />
                    <circle cx="0" cy="0" r="10" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                    <circle cx="0" cy="0" r="3" fill="#ca8a04" />
                    <circle cx="-5" cy="-5" r="1.4" fill="#ffffff" />
                    <circle cx="5" cy="-5" r="1.4" fill="#ffffff" />
                    <circle cx="-5" cy="5" r="1.4" fill="#ffffff" />
                    <circle cx="5" cy="5" r="1.4" fill="#ffffff" />
                </g>

                {/* 7. ESTABILIZADOR TRASERO VERTICAL (OUTRIGGER) */}
                <rect x="248" y="152" width="9" height="46" rx="2" fill="#334155" stroke="#1e293b" strokeWidth="1.2" />
                <rect x="242" y="196" width="20" height="5" rx="1.5" fill="#1e293b" stroke="#64748b" strokeWidth="1" />

                {/* 8. BRAZO RETROEXCAVADOR POSTERIOR (BACKHOE BOOM & DIPPER) */}
                <rect x="252" y="132" width="16" height="24" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                <path 
                    d="M 260 140 C 265 110 282 82 305 92 C 318 98 322 112 320 125" 
                    fill="none" 
                    stroke="url(#yellowBodyGrad)" 
                    strokeWidth="11" 
                    strokeLinecap="round" 
                />
                <path d="M 262 135 L 290 98" stroke="#334155" strokeWidth="4.2" strokeLinecap="round" />
                <path d="M 290 98 L 302 88" stroke="url(#metalArmGrad)" strokeWidth="2.5" strokeLinecap="round" />
                <path 
                    d="M 320 125 L 328 172" 
                    fill="none" 
                    stroke="url(#yellowBodyGrad)" 
                    strokeWidth="8" 
                    strokeLinecap="round" 
                />
                <path d="M 302 88 L 324 135" stroke="#334155" strokeWidth="3" />
                <path d="M 265 136 Q 288 100 318 126" fill="none" stroke="#0f172a" strokeWidth="1.8" strokeDasharray="3 1" />
                <path 
                    d="M 326 172 C 322 186 328 198 344 196 C 348 188 346 175 334 168 Z" 
                    fill="#334155" 
                    stroke="#1e293b" 
                    strokeWidth="1.6" 
                />
                <polygon points="344,196 352,198 350,202 342,200" fill="#64748b" stroke="#0f172a" strokeWidth="0.8" />
                <polygon points="341,192 349,194 347,198 339,196" fill="#64748b" stroke="#0f172a" strokeWidth="0.8" />
                <polygon points="338,187 346,189 344,193 336,191" fill="#64748b" stroke="#0f172a" strokeWidth="0.8" />

                {/* 9. RÓTULO TÉCNICO */}
                <text x="142" y="152" fill="#713f12" fontSize="6.5" fontWeight="900" letterSpacing="0.6">RETROEXCAVADORA 4x4</text>
            </g>
        );
    }

    // CARGADOR FRONTAL (WHEEL LOADER)
    if (t.includes('cargador') && !t.includes('mini')) {
        return (
            <g id="vector_cargador_frontal">
                {/* Sombra */}
                <ellipse cx="180" cy="208" rx="160" ry="9" fill="#020617" opacity="0.6" />

                {/* Chasis articulado delantero y trasero con pivote central */}
                <path d="M 100 162 L 100 135 L 165 135 L 260 135 L 260 165 Z" fill="url(#yellowBodyGrad)" stroke="#ca8a04" strokeWidth="2" />
                <circle cx="165" cy="160" r="6" fill="#1e293b" stroke="#64748b" strokeWidth="2" />

                {/* Cabina panorámica elevada */}
                <rect x="145" y="62" width="65" height="72" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                <rect x="150" y="68" width="55" height="56" rx="2" fill="url(#glassGrad)" />
                <rect x="142" y="58" width="72" height="6" rx="2" fill="url(#yellowBodyGrad)" stroke="#ca8a04" strokeWidth="1" />

                {/* Ruedas pesadas masivas iguales adelante y atrás */}
                <g transform="translate(100, 175)">
                    <circle cx="0" cy="0" r="32" fill="#0f172a" stroke="#1e293b" strokeWidth="4" />
                    <circle cx="0" cy="0" r="28" fill="none" stroke="#334155" strokeWidth="3" strokeDasharray="8 4" />
                    <circle cx="0" cy="0" r="18" fill="url(#yellowBodyGrad)" stroke="#ca8a04" strokeWidth="2" />
                    <circle cx="0" cy="0" r="8" fill="#1e293b" />
                </g>
                <g transform="translate(235, 175)">
                    <circle cx="0" cy="0" r="32" fill="#0f172a" stroke="#1e293b" strokeWidth="4" />
                    <circle cx="0" cy="0" r="28" fill="none" stroke="#334155" strokeWidth="3" strokeDasharray="8 4" />
                    <circle cx="0" cy="0" r="18" fill="url(#yellowBodyGrad)" stroke="#ca8a04" strokeWidth="2" />
                    <circle cx="0" cy="0" r="8" fill="#1e293b" />
                </g>

                {/* Brazos de elevación del cargador y mecanismo de inclinación Z-Bar */}
                <path d="M 140 145 L 55 168 L 48 180 L 135 155 Z" fill="url(#yellowBodyGrad)" stroke="#ca8a04" strokeWidth="1.5" />
                <line x1="88" y1="135" x2="55" y2="158" stroke="#334155" strokeWidth="4.5" />
                {/* Cuchara cargadora masiva de volteo */}
                <path d="M 48 152 L 18 165 L 12 198 L 46 202 L 52 178 Z" fill="#334155" stroke="#1e293b" strokeWidth="2" />
                <text x="175" y="152" fill="#713f12" fontSize="7.5" fontWeight="900">CARGADOR FRONTAL 950</text>
            </g>
        );
    }

    // MOTONIVELADORA (MOTOR GRADER)
    if (t.includes('motoniveladora')) {
        return (
            <g id="vector_motoniveladora">
                <ellipse cx="180" cy="208" rx="160" ry="9" fill="#020617" opacity="0.6" />
                {/* Cuello de cisne arqueado delantero */}
                <path d="M 52 175 L 85 110 L 180 110 L 275 142 L 275 175 Z" fill="url(#yellowBodyGrad)" stroke="#ca8a04" strokeWidth="2" />
                <rect x="145" y="65" width="62" height="68" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                <rect x="150" y="70" width="52" height="55" rx="2" fill="url(#glassGrad)" />
                {/* Rueda delantera inclinada */}
                <ellipse cx="48" cy="178" rx="14" ry="20" fill="#0f172a" stroke="#334155" strokeWidth="3" transform="rotate(-12 48 178)" />
                {/* Tándem trasero doble rueda */}
                <circle cx="232" cy="178" r="22" fill="#0f172a" stroke="#1e293b" strokeWidth="3" />
                <circle cx="232" cy="178" r="12" fill="url(#yellowBodyGrad)" />
                <circle cx="278" cy="178" r="22" fill="#0f172a" stroke="#1e293b" strokeWidth="3" />
                <circle cx="278" cy="178" r="12" fill="url(#yellowBodyGrad)" />
                {/* Corona y vertedera central (Hoja niveladora) */}
                <circle cx="132" cy="165" r="18" fill="none" stroke="#475569" strokeWidth="3.5" />
                <rect x="100" y="180" width="72" height="9" rx="2" fill="#334155" stroke="#0f172a" strokeWidth="1.2" transform="rotate(8 136 184)" />
                <text x="180" y="152" fill="#713f12" fontSize="7.5" fontWeight="900">MOTONIVELADORA 140M</text>
            </g>
        );
    }

    // RODILLO COMPACTADOR GENERAL
    return (
        <g id="vector_compactador">
            <ellipse cx="180" cy="208" rx="160" ry="9" fill="#020617" opacity="0.6" />
            <path d="M 85 160 L 85 125 L 265 125 L 265 165 Z" fill="url(#yellowBodyGrad)" stroke="#ca8a04" strokeWidth="2" />
            <rect x="135" y="65" width="70" height="60" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <rect x="140" y="70" width="60" height="48" rx="2" fill="url(#glassGrad)" />
            {/* Rolo de acero vibratorio frontal macizo */}
            <circle cx="82" cy="172" r="30" fill="url(#metalArmGrad)" stroke="#1e293b" strokeWidth="4" />
            <circle cx="82" cy="172" r="12" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
            {/* Ruedas neumáticas traseras */}
            <circle cx="235" cy="172" r="28" fill="#0f172a" stroke="#1e293b" strokeWidth="4" />
            <circle cx="235" cy="172" r="16" fill="url(#yellowBodyGrad)" />
            <text x="160" y="148" fill="#713f12" fontSize="7.5" fontWeight="900">RODILLO COMPACTADOR</text>
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
