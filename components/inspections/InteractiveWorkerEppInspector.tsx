"use client";

import React, { useState } from 'react';
import { 
    Shield, 
    AlertTriangle, 
    CheckCircle2, 
    X, 
    Eye, 
    Volume2, 
    Wind, 
    Footprints, 
    Sparkles
} from 'lucide-react';

export interface EppHotspotDef {
    id: string;
    category: 'cabeza' | 'cara' | 'ojos' | 'oido' | 'respiratoria' | 'cuerpo' | 'manos' | 'pies';
    name: string;
    shortLabel: string;
    x: number;
    y: number;
    items: string[];
}

export const EPP_HOTSPOTS: EppHotspotDef[] = [
    {
        id: 'casco',
        category: 'cabeza',
        name: 'Casco de Seguridad',
        shortLabel: 'Casco',
        x: 230,
        y: 45,
        items: ['Casco']
    },
    {
        id: 'barbiquejo',
        category: 'cabeza',
        name: 'Barbiquejo',
        shortLabel: 'Barbiquejo',
        x: 282,
        y: 122,
        items: ['Barbiquejo']
    },
    {
        id: 'ojos',
        category: 'ojos',
        name: 'Protección Ocular',
        shortLabel: 'Lentes',
        x: 230,
        y: 86,
        items: ['Lentes', 'Sobrelente']
    },
    {
        id: 'cara',
        category: 'cara',
        name: 'Protección Facial',
        shortLabel: 'Careta',
        x: 165,
        y: 100,
        items: ['Careta de esmerilar', 'Careta de soldador']
    },
    {
        id: 'oido',
        category: 'oido',
        name: 'Protección Auditiva',
        shortLabel: 'Orejeras',
        x: 295,
        y: 90,
        items: ['Tapones', 'Orejeras']
    },
    {
        id: 'respiratoria',
        category: 'respiratoria',
        name: 'Protección Respiratoria',
        shortLabel: 'Respirador',
        x: 230,
        y: 128,
        items: ['Mascarilla descartable', 'Resp. c/filtro p/polvo', 'Resp. c/filtro p/gases', 'Resp. c/filtro p/humos']
    },
    {
        id: 'cuerpo_superior',
        category: 'cuerpo',
        name: 'Ropa de Trabajo Superior / Chaleco',
        shortLabel: 'Uniforme',
        x: 230,
        y: 215,
        items: ['Camisa', 'Polo']
    },
    {
        id: 'mandil',
        category: 'cuerpo',
        name: 'Mandil de Cuero',
        shortLabel: 'Mandil',
        x: 172,
        y: 275,
        items: ['Mandil']
    },
    {
        id: 'manos_izq',
        category: 'manos',
        name: 'Guantes de Protección (Mano Izq)',
        shortLabel: 'Guantes',
        x: 95,
        y: 345,
        items: ['Guantes de cuero', 'Guantes de jebe', 'Guantes dieléctricos', 'Guantes de hilo']
    },
    {
        id: 'manos_der',
        category: 'manos',
        name: 'Guantes de Protección (Mano Der)',
        shortLabel: 'Guantes',
        x: 365,
        y: 345,
        items: ['Guantes de cuero', 'Guantes de jebe', 'Guantes dieléctricos', 'Guantes de hilo']
    },
    {
        id: 'pantalon',
        category: 'cuerpo',
        name: 'Pantalón de Trabajo',
        shortLabel: 'Pantalón',
        x: 230,
        y: 410,
        items: ['Pantalón']
    },
    {
        id: 'escarpines',
        category: 'cuerpo',
        name: 'Escarpines de Cuero',
        shortLabel: 'Escarpines',
        x: 162,
        y: 515,
        items: ['Escarpines']
    },
    {
        id: 'pies_izq',
        category: 'pies',
        name: 'Calzado de Seguridad (Pie Izq)',
        shortLabel: 'Botines',
        x: 168,
        y: 575,
        items: ['Botines punta de acero', 'Botines dieléctricos', 'Botas de jebe']
    },
    {
        id: 'pies_der',
        category: 'pies',
        name: 'Calzado de Seguridad (Pie Der)',
        shortLabel: 'Botines',
        x: 292,
        y: 575,
        items: ['Botines punta de acero', 'Botines dieléctricos', 'Botas de jebe']
    }
];

export const EPP_CATEGORIES = [
    { id: 'all', label: 'Todos', icon: Shield },
    { id: 'cabeza', label: 'Cabeza', icon: Shield },
    { id: 'cara', label: 'Cara', icon: Sparkles },
    { id: 'ojos', label: 'Ojos', icon: Eye },
    { id: 'oido', label: 'Oído', icon: Volume2 },
    { id: 'respiratoria', label: 'Resp.', icon: Wind },
    { id: 'cuerpo', label: 'Cuerpo', icon: Shield },
    { id: 'manos', label: 'Manos', icon: Shield },
    { id: 'pies', label: 'Pies', icon: Footprints }
];

interface InteractiveWorkerEppInspectorProps {
    workerName?: string;
    badEpps: string[];
    onToggleEpp: (eppItem: string) => void;
    eppSizeMap?: Record<string, string[]>;
    onSelectSize?: (eppItem: string, size: string) => void;
    currentCorrection?: string;
}

export const InteractiveWorkerEppInspector: React.FC<InteractiveWorkerEppInspectorProps> = ({
    workerName,
    badEpps,
    onToggleEpp,
    eppSizeMap,
    onSelectSize,
    currentCorrection
}) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [activeModalHotspot, setActiveModalHotspot] = useState<EppHotspotDef | null>(null);
    const [hoveredHotspotId, setHoveredHotspotId] = useState<string | null>(null);

    const isHotspotBad = (spot: EppHotspotDef) => {
        return spot.items.some(item => badEpps.includes(item));
    };

    const getHotspotBadCount = (spot: EppHotspotDef) => {
        return spot.items.filter(item => badEpps.includes(item)).length;
    };

    const handleHotspotClick = (spot: EppHotspotDef) => {
        if (spot.items.length === 1) {
            onToggleEpp(spot.items[0]);
        } else {
            setActiveModalHotspot(spot);
        }
    };

    const filteredHotspots = selectedCategory === 'all' 
        ? EPP_HOTSPOTS 
        : EPP_HOTSPOTS.filter(s => s.category === selectedCategory);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col my-4">
            {/* Header del Inspector */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-2">
                            Inspección Visual de EPP
                            {workerName && <span className="text-xs text-indigo-400 font-normal">({workerName})</span>}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                            Toca los puntos en la figura para marcar el EPP en <span className="text-red-400 font-bold">Mal Estado o Faltante</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                        Observaciones: <b className={badEpps.length > 0 ? "text-red-400" : "text-emerald-400"}>{badEpps.length}</b>
                    </span>
                </div>
            </div>

            {/* Categorías / Filtros Anatómicos */}
            <div className="bg-slate-950/70 px-4 py-2.5 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
                {EPP_CATEGORIES.map(cat => {
                    const isSelected = selectedCategory === cat.id;
                    const catBadCount = cat.id === 'all' 
                        ? badEpps.length 
                        : EPP_HOTSPOTS.filter(s => s.category === cat.id).reduce((acc, s) => acc + getHotspotBadCount(s), 0);

                    return (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                isSelected 
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            }`}
                        >
                            <span>{cat.label}</span>
                            {catBadCount > 0 && (
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                    isSelected ? 'bg-red-500 text-white' : 'bg-red-500/20 text-red-400 border border-red-500/40'
                                }`}>
                                    {catBadCount}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Canvas Principal con la Ilustración del Trabajador y los Hotspots */}
            <div className="relative p-4 sm:p-6 flex items-center justify-center bg-radial from-slate-900 to-slate-950 min-h-[460px]">
                <div className="relative w-full max-w-[420px] aspect-[460/620] select-none">
                    <svg 
                        viewBox="0 0 460 620" 
                        className="w-full h-full filter drop-shadow-2xl"
                    >
                        <defs>
                            {/* Gradiente Casco Blanco/Alta Visibilidad */}
                            <linearGradient id="eppHelmetGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="60%" stopColor="#f1f5f9" />
                                <stop offset="100%" stopColor="#cbd5e1" />
                            </linearGradient>

                            {/* Gradiente Chaleco Naranja de Alta Visibilidad */}
                            <linearGradient id="eppVestGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#f97316" />
                                <stop offset="50%" stopColor="#ea580c" />
                                <stop offset="100%" stopColor="#c2410c" />
                            </linearGradient>

                            {/* Gradiente Pantalón Azul Marino */}
                            <linearGradient id="eppPantsGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#1e293b" />
                                <stop offset="100%" stopColor="#0f172a" />
                            </linearGradient>

                            {/* Cintas Reflectivas 3M */}
                            <linearGradient id="eppReflectiveTape" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#e2e8f0" />
                                <stop offset="50%" stopColor="#ffffff" />
                                <stop offset="100%" stopColor="#cbd5e1" />
                            </linearGradient>

                            {/* Botines de Seguridad */}
                            <linearGradient id="eppBootsGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#334155" />
                                <stop offset="50%" stopColor="#1e293b" />
                                <stop offset="100%" stopColor="#020617" />
                            </linearGradient>

                            {/* Guantes de Seguridad */}
                            <linearGradient id="eppGlovesGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#fde047" />
                                <stop offset="70%" stopColor="#eab308" />
                                <stop offset="100%" stopColor="#ca8a04" />
                            </linearGradient>

                            {/* Filtro Resplandor */}
                            <filter id="eppGlow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>

                        {/* ========================================================
                            ILUSTRACIÓN DEL TRABAJADOR CON SU EQUIPO COMPLETO (EPP)
                            ======================================================== */}
                        <g id="worker-full-body" opacity="0.95">
                            {/* Sombra proyectada en el piso */}
                            <ellipse cx="230" cy="600" rx="140" ry="14" fill="#020617" opacity="0.6" />

                            {/* --- PIERNAS Y PANTALÓN CON CINTAS REFLECTIVAS --- */}
                            {/* Pierna Izquierda */}
                            <path d="M 175 350 L 160 540 L 200 545 L 210 380 Z" fill="url(#eppPantsGrad)" stroke="#334155" strokeWidth="1.5" />
                            {/* Pierna Derecha */}
                            <path d="M 285 350 L 300 540 L 260 545 L 250 380 Z" fill="url(#eppPantsGrad)" stroke="#334155" strokeWidth="1.5" />
                            {/* Entrepierna */}
                            <path d="M 210 380 Q 230 400 250 380" fill="none" stroke="#0f172a" strokeWidth="2" />

                            {/* Cintas reflectivas 3M en botamangas del pantalón */}
                            <rect x="156" y="475" width="46" height="8" rx="2" fill="url(#eppReflectiveTape)" stroke="#94a3b8" strokeWidth="0.8" />
                            <rect x="258" y="475" width="46" height="8" rx="2" fill="url(#eppReflectiveTape)" stroke="#94a3b8" strokeWidth="0.8" />
                            <rect x="157" y="495" width="44" height="8" rx="2" fill="url(#eppReflectiveTape)" stroke="#94a3b8" strokeWidth="0.8" />
                            <rect x="259" y="495" width="44" height="8" rx="2" fill="url(#eppReflectiveTape)" stroke="#94a3b8" strokeWidth="0.8" />

                            {/* --- CALZADO: BOTINES PUNTA DE ACERO --- */}
                            {/* Botín Izquierdo */}
                            <path d="M 152 542 L 140 580 Q 140 592 155 595 L 205 595 Q 212 590 208 575 L 200 542 Z" fill="url(#eppBootsGrad)" stroke="#475569" strokeWidth="1.5" />
                            {/* Suela gruesa antideslizante con tacos */}
                            <rect x="138" y="590" width="70" height="7" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
                            {/* Puntera reforzada (Punta de acero) */}
                            <path d="M 138 578 Q 140 590 155 590 L 165 590 L 160 575 Z" fill="#475569" opacity="0.6" />
                            {/* Pasadores de seguridad amarillos */}
                            <line x1="170" y1="550" x2="190" y2="550" stroke="#facc15" strokeWidth="1.5" />
                            <line x1="168" y1="556" x2="188" y2="556" stroke="#facc15" strokeWidth="1.5" />
                            <line x1="166" y1="562" x2="186" y2="562" stroke="#facc15" strokeWidth="1.5" />

                            {/* Botín Derecho */}
                            <path d="M 308 542 L 320 580 Q 320 592 305 595 L 255 595 Q 248 590 252 575 L 260 542 Z" fill="url(#eppBootsGrad)" stroke="#475569" strokeWidth="1.5" />
                            <rect x="252" y="590" width="70" height="7" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
                            <path d="M 322 578 Q 320 590 305 590 L 295 590 L 300 575 Z" fill="#475569" opacity="0.6" />
                            <line x1="270" y1="550" x2="290" y2="550" stroke="#facc15" strokeWidth="1.5" />
                            <line x1="272" y1="556" x2="292" y2="556" stroke="#facc15" strokeWidth="1.5" />
                            <line x1="274" y1="562" x2="294" y2="562" stroke="#facc15" strokeWidth="1.5" />

                            {/* --- TORSO: CAMISA MANGA LARGA + CHALECO DE SEGURIDAD 3M --- */}
                            {/* Mangas de camisa de trabajo (Azul marino) */}
                            {/* Brazo Izquierdo */}
                            <path d="M 155 175 L 110 320 L 135 330 L 175 220 Z" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                            {/* Brazo Derecho */}
                            <path d="M 305 175 L 350 320 L 325 330 L 285 220 Z" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />

                            {/* Cintas reflectivas en mangas de camisa */}
                            <rect x="114" y="270" width="28" height="7" rx="1.5" transform="rotate(20 114 270)" fill="url(#eppReflectiveTape)" stroke="#94a3b8" strokeWidth="0.6" />
                            <rect x="318" y="270" width="28" height="7" rx="1.5" transform="rotate(-20 318 270)" fill="url(#eppReflectiveTape)" stroke="#94a3b8" strokeWidth="0.6" />

                            {/* Cuerpo principal / Torso (Chaleco naranja) */}
                            <path d="M 160 165 L 300 165 L 315 355 L 145 355 Z" fill="url(#eppVestGrad)" stroke="#c2410c" strokeWidth="2" />

                            {/* Cintas reflectivas 3M en el chaleco (Verticales y horizontales) */}
                            {/* Fila Horizontal Superior */}
                            <rect x="150" y="250" width="160" height="12" rx="2" fill="url(#eppReflectiveTape)" stroke="#cbd5e1" strokeWidth="0.8" />
                            {/* Fila Horizontal Inferior */}
                            <rect x="146" y="310" width="168" height="12" rx="2" fill="url(#eppReflectiveTape)" stroke="#cbd5e1" strokeWidth="0.8" />
                            {/* Tirantes Verticales Reflectivos */}
                            <rect x="180" y="165" width="14" height="145" fill="url(#eppReflectiveTape)" stroke="#cbd5e1" strokeWidth="0.8" />
                            <rect x="266" y="165" width="14" height="145" fill="url(#eppReflectiveTape)" stroke="#cbd5e1" strokeWidth="0.8" />

                            {/* Cuello del uniforme y cremallera */}
                            <polygon points="215,165 245,165 230,195" fill="#0f172a" />
                            <line x1="230" y1="195" x2="230" y2="355" stroke="#1e293b" strokeWidth="2.5" />

                            {/* Bolsillo porta-lapicero / radio en el chaleco */}
                            <rect x="188" y="210" width="28" height="34" rx="2" fill="#ea580c" stroke="#9a3412" strokeWidth="1" />
                            <rect x="244" y="210" width="28" height="34" rx="2" fill="#ea580c" stroke="#9a3412" strokeWidth="1" />

                            {/* --- GUANTES DE SEGURIDAD (EN AMBAS MANOS) --- */}
                            {/* Mano Izquierda */}
                            <g transform="translate(85, 320)">
                                <path d="M 24 5 L 28 28 Q 28 42 16 46 Q 4 42 4 28 L 6 8 Z" fill="url(#eppGlovesGrad)" stroke="#854d0e" strokeWidth="1.5" />
                                {/* Dedos con palma reforzada */}
                                <rect x="2" y="28" width="7" height="16" rx="3" fill="#ca8a04" stroke="#854d0e" strokeWidth="1" />
                                <rect x="10" y="32" width="7" height="18" rx="3" fill="#ca8a04" stroke="#854d0e" strokeWidth="1" />
                                <rect x="18" y="28" width="7" height="15" rx="3" fill="#ca8a04" stroke="#854d0e" strokeWidth="1" />
                                {/* Puño elástico de seguridad */}
                                <rect x="3" y="2" width="24" height="7" rx="2" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1" />
                            </g>

                            {/* Mano Derecha */}
                            <g transform="translate(345, 320)">
                                <path d="M 6 5 L 2 28 Q 2 42 14 46 Q 26 42 26 28 L 24 8 Z" fill="url(#eppGlovesGrad)" stroke="#854d0e" strokeWidth="1.5" />
                                <rect x="5" y="28" width="7" height="15" rx="3" fill="#ca8a04" stroke="#854d0e" strokeWidth="1" />
                                <rect x="13" y="32" width="7" height="18" rx="3" fill="#ca8a04" stroke="#854d0e" strokeWidth="1" />
                                <rect x="21" y="28" width="7" height="16" rx="3" fill="#ca8a04" stroke="#854d0e" strokeWidth="1" />
                                <rect x="3" y="2" width="24" height="7" rx="2" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1" />
                            </g>

                            {/* --- CUELLO Y CABEZA --- */}
                            {/* Cuello */}
                            <rect x="216" y="145" width="28" height="24" rx="3" fill="#fcd34d" stroke="#d97706" strokeWidth="1" />

                            {/* Rostro base */}
                            <ellipse cx="230" cy="115" rx="26" ry="30" fill="#fed7aa" stroke="#f97316" strokeWidth="1" />

                            {/* --- OREJERAS / PROTECTORES AUDITIVOS --- */}
                            {/* Orejera Izquierda */}
                            <rect x="195" y="96" width="10" height="22" rx="4" fill="#dc2626" stroke="#991b1b" strokeWidth="1.2" />
                            {/* Orejera Derecha */}
                            <rect x="255" y="96" width="10" height="22" rx="4" fill="#dc2626" stroke="#991b1b" strokeWidth="1.2" />
                            {/* Banda superior de sujeción al casco */}
                            <path d="M 200 96 Q 230 75 260 96" fill="none" stroke="#1e293b" strokeWidth="2.5" />

                            {/* --- OJOS: LENTES DE SEGURIDAD ENVOLVENTES --- */}
                            <g id="safety-goggles">
                                {/* Montura */}
                                <path d="M 206 90 Q 230 87 254 90 L 252 98 Q 230 102 208 98 Z" fill="#0284c7" opacity="0.3" stroke="#0369a1" strokeWidth="1.5" />
                                {/* Lunas protectoras con reflejo */}
                                <ellipse cx="218" cy="94" rx="10" ry="6" fill="#38bdf8" opacity="0.6" stroke="#0284c7" strokeWidth="1" />
                                <ellipse cx="242" cy="94" rx="10" ry="6" fill="#38bdf8" opacity="0.6" stroke="#0284c7" strokeWidth="1" />
                                <line x1="214" y1="91" x2="220" y2="93" stroke="#ffffff" strokeWidth="1.2" />
                                <line x1="238" y1="91" x2="244" y2="93" stroke="#ffffff" strokeWidth="1.2" />
                            </g>

                            {/* --- PROTECCIÓN RESPIRATORIA: RESPIRADOR MEDIA CARA --- */}
                            <g id="respirator-mask">
                                {/* Mascarilla elastomérica */}
                                <path d="M 216 114 Q 230 110 244 114 L 246 136 Q 230 144 214 136 Z" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
                                {/* Filtro Izquierdo (Cartucho circular para polvos/gases) */}
                                <circle cx="212" cy="132" r="7.5" fill="#f8fafc" stroke="#475569" strokeWidth="1.2" />
                                <circle cx="212" cy="132" r="4.5" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.8" />
                                {/* Filtro Derecho */}
                                <circle cx="248" cy="132" r="7.5" fill="#f8fafc" stroke="#475569" strokeWidth="1.2" />
                                <circle cx="248" cy="132" r="4.5" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.8" />
                                {/* Válvula de exhalación frontal */}
                                <circle cx="230" cy="134" r="3.5" fill="#1e293b" />
                            </g>

                            {/* --- BARBIQUEJO (SUJECIÓN MENTÓN) --- */}
                            <g id="chinstrap">
                                <path d="M 204 88 Q 230 148 256 88" fill="none" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
                                {/* Copa mentonera de jebe */}
                                <rect x="223" y="137" width="14" height="4.5" rx="2" fill="#334155" stroke="#0f172a" strokeWidth="0.8" />
                            </g>

                            {/* --- CASCO DE SEGURIDAD INDUSTRIAL --- */}
                            <g id="safety-helmet">
                                {/* Casquete principal con cresta aerodinámica */}
                                <path d="M 194 80 Q 192 42 230 36 Q 268 42 266 80 Z" fill="url(#eppHelmetGrad)" stroke="#94a3b8" strokeWidth="1.8" />
                                {/* Cresta central de refuerzo */}
                                <path d="M 226 36 Q 230 34 234 36 L 233 78 L 227 78 Z" fill="#cbd5e1" />
                                {/* Visera frontal proyectada hacia adelante */}
                                <path d="M 190 78 Q 230 74 270 78 L 268 83 Q 230 79 192 83 Z" fill="#f8fafc" stroke="#64748b" strokeWidth="1.2" />
                                {/* Ranuras universales laterales para orejeras */}
                                <rect x="193" y="68" width="4" height="7" rx="1" fill="#475569" />
                                <rect x="263" y="68" width="4" height="7" rx="1" fill="#475569" />
                            </g>
                        </g>

                        {/* ========================================================
                            PUNTOS CALIENTES INTERACTIVOS (HOTSPOTS) CON TOOLTIPS
                            ======================================================== */}
                        {filteredHotspots.map(spot => {
                            const isBad = isHotspotBad(spot);
                            const isHovered = hoveredHotspotId === spot.id;
                            const badCount = getHotspotBadCount(spot);

                            // Posición de tooltip
                            const isNearTop = spot.y < 50;
                            const tooltipY = isNearTop ? spot.y + 18 : spot.y - 14;
                            const boxW = Math.max(38, spot.shortLabel.length * 6.8 + 14);

                            return (
                                <g 
                                    key={spot.id}
                                    className="cursor-pointer select-none"
                                    onClick={() => handleHotspotClick(spot)}
                                    onPointerEnter={() => setHoveredHotspotId(spot.id)}
                                    onPointerLeave={() => setHoveredHotspotId(null)}
                                    onTouchStart={() => setHoveredHotspotId(spot.id)}
                                    onTouchEnd={() => setTimeout(() => setHoveredHotspotId(null), 2500)}
                                >
                                    {/* Zona táctil invisible amplia */}
                                    <circle cx={spot.x} cy={spot.y} r="18" fill="transparent" />

                                    {/* Anillo Pulsante / Exterior */}
                                    {isBad ? (
                                        <circle 
                                            cx={spot.x} 
                                            cy={spot.y} 
                                            r="11" 
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
                                            r="11" 
                                            fill="none" 
                                            stroke="#22c55e" 
                                            strokeWidth="2.2" 
                                            strokeOpacity="0.8"
                                        />
                                    ) : (
                                        <circle 
                                            cx={spot.x} 
                                            cy={spot.y} 
                                            r="9" 
                                            fill="none" 
                                            stroke="#38bdf8" 
                                            strokeWidth="1.2" 
                                            strokeOpacity="0.4"
                                        />
                                    )}

                                    {/* Círculo Principal */}
                                    <circle 
                                        cx={spot.x} 
                                        cy={spot.y} 
                                        r="6.5" 
                                        fill={isBad ? '#dc2626' : (isHovered ? '#16a34a' : '#0284c7')} 
                                        stroke={isBad ? '#fca5a5' : (isHovered ? '#bbf7d0' : '#bae6fd')} 
                                        strokeWidth="1.5" 
                                        className="transition-colors duration-150 shadow-lg"
                                    />

                                    {/* Núcleo Interior */}
                                    <circle 
                                        cx={spot.x} 
                                        cy={spot.y} 
                                        r="2.2" 
                                        fill="#ffffff" 
                                    />

                                    {/* Contador pequeño si hay más de 1 ítem observado en este punto */}
                                    {badCount > 1 && (
                                        <g transform={`translate(${spot.x + 6}, ${spot.y - 6})`}>
                                            <circle cx="0" cy="0" r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="0.8" />
                                            <text x="0" y="2.5" fill="#ffffff" fontSize="6" fontWeight="bold" textAnchor="middle">{badCount}</text>
                                        </g>
                                    )}

                                    {/* TOOLTIP FLOTANTE (Visible solo en hover o touch activo) */}
                                    {isHovered && (
                                        <g 
                                            className="pointer-events-none transition-all duration-150"
                                            transform={`translate(${spot.x}, ${tooltipY})`}
                                        >
                                            <rect 
                                                x={-boxW / 2} 
                                                y="-9" 
                                                width={boxW} 
                                                height="18" 
                                                rx="4.5" 
                                                fill={isBad ? '#dc2626' : '#0f172a'} 
                                                stroke={isBad ? '#ffffff' : (isHovered ? '#22c55e' : '#38bdf8')} 
                                                strokeWidth="1.2" 
                                                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
                                            />
                                            <text 
                                                x="0" 
                                                y="3" 
                                                fill="#ffffff" 
                                                fontSize="8.5" 
                                                fontWeight="900" 
                                                textAnchor="middle" 
                                                letterSpacing="0.3"
                                            >
                                                {spot.shortLabel} {isBad ? '❌' : '✓'}
                                            </text>
                                        </g>
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>

            {/* Modal / Selector de Sub-ítems para zonas con múltiples opciones (ej. Respirador, Guantes, Calzado) */}
            {activeModalHotspot && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                            <div className="flex items-center gap-2">
                                <span className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                                    <Shield size={18} />
                                </span>
                                <div>
                                    <h5 className="font-bold text-white text-sm">{activeModalHotspot.name}</h5>
                                    <p className="text-[11px] text-slate-400">Selecciona los elementos en <span className="text-red-400 font-bold">Mal Estado o Faltantes</span></p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setActiveModalHotspot(null)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-2 mb-5">
                            {activeModalHotspot.items.map(item => {
                                const isBad = badEpps.includes(item);
                                const hasSizes = eppSizeMap && eppSizeMap[item];
                                
                                return (
                                    <div 
                                        key={item}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                                            isBad 
                                                ? 'bg-red-500/15 border-red-500/40 text-red-200' 
                                                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                                        }`}
                                        onClick={() => onToggleEpp(item)}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border font-bold text-xs ${
                                                isBad ? 'bg-red-500 border-red-400 text-white' : 'border-slate-600 bg-slate-900'
                                            }`}>
                                                {isBad ? '✕' : ''}
                                            </div>
                                            <span className="text-sm font-semibold">{item}</span>
                                        </div>

                                        {isBad && hasSizes && onSelectSize && (
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <select
                                                    value={(() => {
                                                        const regex = new RegExp(`\\[Talla de ${item}:\\s*(.*?)\\]`);
                                                        const match = (currentCorrection || '').match(regex);
                                                        return match ? match[1].trim() : '...';
                                                    })()}
                                                    onChange={(e) => onSelectSize(item, e.target.value)}
                                                    className="bg-red-500/20 text-red-300 border border-red-500/50 rounded-lg px-2.5 py-1 text-xs font-bold outline-none cursor-pointer"
                                                >
                                                    <option value="...">Talla</option>
                                                    {eppSizeMap[item].map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <button 
                            onClick={() => setActiveModalHotspot(null)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-indigo-600/30"
                        >
                            Listo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
