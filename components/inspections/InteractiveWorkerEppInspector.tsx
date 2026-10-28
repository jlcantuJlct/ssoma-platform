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
        y: 48,
        items: ['Casco']
    },
    {
        id: 'barbiquejo',
        category: 'cabeza',
        name: 'Barbiquejo',
        shortLabel: 'Barbiquejo',
        x: 275,
        y: 125,
        items: ['Barbiquejo']
    },
    {
        id: 'ojos',
        category: 'ojos',
        name: 'Protección Ocular',
        shortLabel: 'Lentes',
        x: 230,
        y: 88,
        items: ['Lentes', 'Sobrelente']
    },
    {
        id: 'cara',
        category: 'cara',
        name: 'Protección Facial',
        shortLabel: 'Careta',
        x: 170,
        y: 102,
        items: ['Careta de esmerilar', 'Careta de soldador']
    },
    {
        id: 'oido',
        category: 'oido',
        name: 'Protección Auditiva',
        shortLabel: 'Orejeras',
        x: 290,
        y: 92,
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
        y: 220,
        items: ['Camisa', 'Polo']
    },
    {
        id: 'mandil',
        category: 'cuerpo',
        name: 'Mandil de Cuero',
        shortLabel: 'Mandil',
        x: 176,
        y: 275,
        items: ['Mandil']
    },
    {
        id: 'manos_izq',
        category: 'manos',
        name: 'Guantes de Protección (Mano Izq)',
        shortLabel: 'Guantes',
        x: 125,
        y: 355,
        items: ['Guantes de cuero', 'Guantes de jebe', 'Guantes dieléctricos', 'Guantes de hilo']
    },
    {
        id: 'manos_der',
        category: 'manos',
        name: 'Guantes de Protección (Mano Der)',
        shortLabel: 'Guantes',
        x: 335,
        y: 355,
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
        x: 172,
        y: 512,
        items: ['Escarpines']
    },
    {
        id: 'pies_izq',
        category: 'pies',
        name: 'Calzado de Seguridad (Pie Izq)',
        shortLabel: 'Botines',
        x: 178,
        y: 572,
        items: ['Botines punta de acero', 'Botines dieléctricos', 'Botas de jebe']
    },
    {
        id: 'pies_der',
        category: 'pies',
        name: 'Calzado de Seguridad (Pie Der)',
        shortLabel: 'Botines',
        x: 282,
        y: 572,
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
                        {/* ========================================================
                            ILUSTRACIÓN DEL TRABAJADOR CON SU EQUIPO COMPLETO (EPP)
                            Diseño Anatómico, Proporcionado y Moderno
                            ======================================================== */}
                        <g id="worker-full-body" opacity="0.95">
                            {/* Sombra ambiental multicapa en el piso */}
                            <ellipse cx="230" cy="595" rx="130" ry="12" fill="#020617" opacity="0.7" />
                            <ellipse cx="230" cy="595" rx="80" ry="6" fill="#020617" opacity="0.5" />

                            {/* --- PIERNAS Y PANTALÓN INDUSTRIAL CON CORTE ANATÓMICO --- */}
                            {/* Pierna Izquierda: contorno de muslo, rodilla, pantorrilla y bota */}
                            <path d="M 172 355 C 164 395 160 430 162 460 C 160 488 162 518 166 545 L 202 545 C 202 518 200 488 200 460 C 206 430 216 395 224 385 Z" fill="url(#eppPantsGrad)" stroke="#334155" strokeWidth="1.5" strokeLinejoin="round" />
                            
                            {/* Pierna Derecha: simétrica y natural */}
                            <path d="M 288 355 C 296 395 300 430 298 460 C 300 488 298 518 294 545 L 258 545 C 258 518 260 488 260 460 C 254 430 244 395 236 385 Z" fill="url(#eppPantsGrad)" stroke="#334155" strokeWidth="1.5" strokeLinejoin="round" />
                            
                            {/* Curva suave de entrepierna */}
                            <path d="M 224 385 Q 230 392 236 385" fill="none" stroke="#0f172a" strokeWidth="2.5" />
                            <line x1="230" y1="355" x2="230" y2="382" stroke="#0f172a" strokeWidth="1.8" />

                            {/* Parches ergonómicos reforzados en rodillas */}
                            <path d="M 162 445 Q 181 440 200 445 L 199 472 Q 181 478 163 472 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                            <path d="M 260 445 Q 279 440 298 445 L 297 472 Q 279 478 261 472 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />

                            {/* Cintas reflectivas 3M en botamangas (curvatura cilíndrica) */}
                            {/* Fila superior pierna izquierda y derecha */}
                            <path d="M 163 488 Q 181 494 200 488 L 200 497 Q 181 503 163 497 Z" fill="url(#eppReflectiveTape)" stroke="#94a3b8" strokeWidth="0.8" />
                            <path d="M 260 488 Q 279 494 297 488 L 297 497 Q 279 503 260 497 Z" fill="url(#eppReflectiveTape)" stroke="#94a3b8" strokeWidth="0.8" />
                            {/* Fila inferior pierna izquierda y derecha */}
                            <path d="M 164 507 Q 182 513 201 507 L 201 516 Q 182 522 164 516 Z" fill="url(#eppReflectiveTape)" stroke="#94a3b8" strokeWidth="0.8" />
                            <path d="M 259 507 Q 278 513 296 507 L 296 516 Q 278 522 259 516 Z" fill="url(#eppReflectiveTape)" stroke="#94a3b8" strokeWidth="0.8" />

                            {/* --- CALZADO: BOTINES DE SEGURIDAD CON PUNTA DE ACERO --- */}
                            {/* Botín Izquierdo */}
                            <path d="M 165 545 C 160 558 152 576 150 588 C 150 594 158 596 178 596 L 206 596 C 210 592 208 582 206 568 L 202 545 Z" fill="url(#eppBootsGrad)" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round" />
                            <rect x="148" y="590" width="60" height="7" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
                            <path d="M 149 580 C 149 589 158 591 176 591 L 176 576 C 164 576 152 579 149 580 Z" fill="#64748b" opacity="0.4" />
                            <line x1="178" y1="554" x2="194" y2="554" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="176" y1="560" x2="192" y2="560" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="174" y1="566" x2="190" y2="566" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" />

                            {/* Botín Derecho */}
                            <path d="M 295 545 C 300 558 308 576 310 588 C 310 594 302 596 282 596 L 254 596 C 250 592 252 582 254 568 L 258 545 Z" fill="url(#eppBootsGrad)" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round" />
                            <rect x="252" y="590" width="60" height="7" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
                            <path d="M 311 580 C 311 589 302 591 284 591 L 284 576 C 296 576 308 579 311 580 Z" fill="#64748b" opacity="0.4" />
                            <line x1="266" y1="554" x2="282" y2="554" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="268" y1="560" x2="284" y2="560" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="270" y1="566" x2="286" y2="566" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" />

                            {/* --- BRAZOS Y MANGAS: POSTURA NATURAL Y ERGONÓMICA --- */}
                            {/* Brazo Izquierdo (Manga azul con caída natural sobre el costado) */}
                            <path d="M 154 186 C 142 195 130 230 126 270 C 122 300 122 325 124 336 L 146 338 C 146 325 146 295 152 265 C 158 238 165 220 166 215 Z" fill="#1e293b" stroke="#334155" strokeWidth="1.5" strokeLinejoin="round" />
                            
                            {/* Brazo Derecho */}
                            <path d="M 306 186 C 318 195 330 230 334 270 C 338 300 338 325 336 336 L 314 338 C 314 325 314 295 308 265 C 302 238 295 220 294 215 Z" fill="#1e293b" stroke="#334155" strokeWidth="1.5" strokeLinejoin="round" />

                            {/* Cintas reflectivas envolventes en los antebrazos */}
                            <path d="M 124 285 L 148 288 L 147 296 L 123 293 Z" fill="url(#eppReflectiveTape)" stroke="#94a3b8" strokeWidth="0.8" />
                            <path d="M 336 285 L 312 288 L 313 296 L 337 293 Z" fill="url(#eppReflectiveTape)" stroke="#94a3b8" strokeWidth="0.8" />

                            {/* --- GUANTES DE SEGURIDAD (POSTURA ANATÓMICA JUNTO AL CUERPO) --- */}
                            {/* Guante Izquierdo */}
                            <g transform="translate(112, 334)">
                                <rect x="9" y="0" width="24" height="8" rx="2.5" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.2" />
                                <path d="M 11 8 C 6 16 7 28 10 36 C 13 41 22 43 27 38 C 30 32 31 22 29 8 Z" fill="url(#eppGlovesGrad)" stroke="#854d0e" strokeWidth="1.5" />
                                <path d="M 14 20 Q 20 28 26 20" fill="none" stroke="#a16207" strokeWidth="1.5" />
                                <path d="M 28 15 C 32 19 32 26 28 28" fill="none" stroke="#854d0e" strokeWidth="1.4" strokeLinecap="round" />
                            </g>

                            {/* Guante Derecho */}
                            <g transform="translate(324, 334)">
                                <rect x="3" y="0" width="24" height="8" rx="2.5" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.2" />
                                <path d="M 25 8 C 30 16 29 28 26 36 C 23 41 14 43 9 38 C 6 32 5 22 7 8 Z" fill="url(#eppGlovesGrad)" stroke="#854d0e" strokeWidth="1.5" />
                                <path d="M 22 20 Q 16 28 10 20" fill="none" stroke="#a16207" strokeWidth="1.5" />
                                <path d="M 8 15 C 4 19 4 26 8 28" fill="none" stroke="#854d0e" strokeWidth="1.4" strokeLinecap="round" />
                            </g>

                            {/* --- CHALECO DE SEGURIDAD INDUSTRIAL: CORTE ERGONÓMICO ESTILIZADO --- */}
                            {/* Cuerpo principal del chaleco: hombros en declive natural, torso entallado y caída curva en cadera */}
                            <path d="M 210 168 C 182 173 162 178 152 186 C 146 192 147 205 150 218 C 154 240 164 250 165 285 C 166 315 158 345 156 358 Q 230 370 304 358 C 302 345 294 315 295 285 C 296 250 306 240 310 218 C 313 205 314 192 308 186 C 298 178 278 173 250 168 Z" fill="url(#eppVestGrad)" stroke="#c2410c" strokeWidth="2" strokeLinejoin="round" />

                            {/* Cremallera central reforzada */}
                            <line x1="230" y1="196" x2="230" y2="363" stroke="#0f172a" strokeWidth="3" />
                            <line x1="230" y1="196" x2="230" y2="363" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />

                            {/* Cintas reflectivas 3M con curvatura y perspectiva anatómica */}
                            <path d="M 174 176 L 180 250 L 192 250 L 186 178 Z" fill="url(#eppReflectiveTape)" stroke="#cbd5e1" strokeWidth="0.8" />
                            <path d="M 286 176 L 280 250 L 268 250 L 274 178 Z" fill="url(#eppReflectiveTape)" stroke="#cbd5e1" strokeWidth="0.8" />
                            
                            <path d="M 180 262 L 180 361 L 192 362 L 192 262 Z" fill="url(#eppReflectiveTape)" stroke="#cbd5e1" strokeWidth="0.8" />
                            <path d="M 280 262 L 280 361 L 268 362 L 268 262 Z" fill="url(#eppReflectiveTape)" stroke="#cbd5e1" strokeWidth="0.8" />

                            {/* Cintas Horizontales con volumen cilíndrico */}
                            <path d="M 158 248 Q 230 256 302 248 L 302 260 Q 230 268 158 260 Z" fill="url(#eppReflectiveTape)" stroke="#cbd5e1" strokeWidth="0.8" />
                            <path d="M 155 308 Q 230 316 305 308 L 306 320 Q 230 328 154 320 Z" fill="url(#eppReflectiveTape)" stroke="#cbd5e1" strokeWidth="0.8" />

                            {/* Bolsillos de chaleco con solapas redondeadas */}
                            <rect x="180" y="212" width="28" height="32" rx="4" fill="#ea580c" stroke="#9a3412" strokeWidth="1.2" />
                            <path d="M 178 212 L 210 212 Q 210 218 206 220 L 182 220 Q 178 218 178 212 Z" fill="#c2410c" stroke="#9a3412" strokeWidth="1" />
                            
                            <rect x="252" y="212" width="28" height="32" rx="4" fill="#ea580c" stroke="#9a3412" strokeWidth="1.2" />
                            <rect x="255" y="216" width="22" height="23" rx="2" fill="#ffffff" fillOpacity="0.85" stroke="#cbd5e1" strokeWidth="0.8" />
                            <rect x="259" y="222" width="14" height="3" rx="1" fill="#0284c7" />

                            {/* --- CUELLO Y ROSTRO CON PROPORCIÓN HUMANA --- */}
                            {/* Cuello orgánico que ensancha suavemente hacia el pecho */}
                            <path d="M 216 138 C 216 154 212 163 208 168 L 252 168 C 248 163 244 154 244 138 Z" fill="#fcd34d" stroke="#d97706" strokeWidth="1" />
                            {/* Cuello en V de la camisa interior */}
                            <polygon points="210,166 250,166 230,195" fill="#0f172a" />
                            <polygon points="208,166 218,186 229,172" fill="#1e293b" />
                            <polygon points="252,166 242,186 231,172" fill="#1e293b" />

                            {/* Cabeza / Rostro con mandíbula estilizada */}
                            <ellipse cx="230" cy="114" rx="26" ry="29" fill="#fed7aa" stroke="#f97316" strokeWidth="1" />

                            {/* --- PROTECTORES AUDITIVOS (OREJERAS TÉCNICAS) --- */}
                            <rect x="194" y="93" width="12" height="24" rx="5" fill="#dc2626" stroke="#991b1b" strokeWidth="1.2" />
                            <rect x="254" y="93" width="12" height="24" rx="5" fill="#dc2626" stroke="#991b1b" strokeWidth="1.2" />
                            <path d="M 199 94 Q 230 73 261 94" fill="none" stroke="#1e293b" strokeWidth="2.5" />

                            {/* --- LENTES DE SEGURIDAD ENVOLVENTES (VISOR CYAN) --- */}
                            <g id="safety-goggles">
                                <path d="M 204 89 Q 230 85 256 89 L 254 99 Q 230 103 206 99 Z" fill="#0284c7" opacity="0.35" stroke="#0369a1" strokeWidth="1.5" />
                                <ellipse cx="217" cy="94" rx="10.5" ry="6.5" fill="#38bdf8" opacity="0.65" stroke="#0284c7" strokeWidth="1" />
                                <ellipse cx="243" cy="94" rx="10.5" ry="6.5" fill="#38bdf8" opacity="0.65" stroke="#0284c7" strokeWidth="1" />
                                <line x1="212" y1="91" x2="220" y2="93" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                                <line x1="238" y1="91" x2="246" y2="93" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                            </g>

                            {/* --- PROTECCIÓN RESPIRATORIA: RESPIRADOR SILICONA MEDIA CARA --- */}
                            <g id="respirator-mask">
                                <path d="M 214 112 Q 230 108 246 112 L 248 137 Q 230 146 212 137 Z" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
                                <circle cx="211" cy="132" r="8" fill="#f8fafc" stroke="#475569" strokeWidth="1.5" />
                                <circle cx="211" cy="132" r="4.5" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.8" />
                                <circle cx="249" cy="132" r="8" fill="#f8fafc" stroke="#475569" strokeWidth="1.5" />
                                <circle cx="249" cy="132" r="4.5" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.8" />
                                <circle cx="230" cy="134" r="4.5" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                            </g>

                            {/* --- BARBIQUEJO DE 3 PUNTOS CON MENTONERA --- */}
                            <g id="chinstrap">
                                <path d="M 202 86 Q 230 148 258 86" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                                <rect x="222" y="138" width="16" height="5" rx="2.5" fill="#334155" stroke="#0f172a" strokeWidth="0.8" />
                            </g>

                            {/* --- CASCO DE SEGURIDAD INDUSTRIAL AERODINÁMICO --- */}
                            <g id="safety-helmet">
                                <path d="M 192 80 C 188 38 218 32 230 32 C 242 32 272 38 268 80 Z" fill="url(#eppHelmetGrad)" stroke="#94a3b8" strokeWidth="1.8" />
                                <path d="M 226 32 Q 230 30 234 32 L 233 78 L 227 78 Z" fill="#e2e8f0" />
                                <path d="M 188 77 Q 230 72 272 77 L 270 83 Q 230 78 190 83 Z" fill="#ffffff" stroke="#64748b" strokeWidth="1.2" />
                                <rect x="192" y="67" width="4" height="7" rx="1.5" fill="#475569" />
                                <rect x="264" y="67" width="4" height="7" rx="1.5" fill="#475569" />
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
