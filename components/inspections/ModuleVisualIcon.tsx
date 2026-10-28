import React from 'react';

interface ModuleVisualIconProps {
    name?: string;
    description?: string;
    icon?: string;
    image?: string;
    className?: string;
    isActive?: boolean;
}

export const ModuleVisualIcon: React.FC<ModuleVisualIconProps> = ({
    name = '',
    description = '',
    icon = '',
    image,
    className = 'w-20 h-20 md:w-24 md:h-24',
    isActive = true
}) => {
    // Si tiene una imagen personalizada subida por el usuario
    if (image && image.length > 10) {
        return (
            <div className={`relative overflow-hidden rounded-2xl shadow-xl border border-cyan-500/30 group-hover:scale-105 group-hover:border-cyan-400 group-hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.5)] transition-all duration-300 ${className}`}>
                <img 
                    src={image} 
                    alt={name} 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-cyan-400" />
                <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-cyan-400" />
            </div>
        );
    }

    const n = (name + ' ' + description + ' ' + icon).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Componente base contenedor con estilo Cyber-HUD Glassmorphism
    const TechBadgeWrapper = ({ 
        children, 
        theme = 'cyan', 
        borderColor = 'border-cyan-500/40', 
        glowColor = 'rgba(6,182,212,0.3)', 
        accentColor = '#06B6D4' 
    }: { 
        children: React.ReactNode; 
        theme?: string; 
        borderColor?: string; 
        glowColor?: string; 
        accentColor?: string; 
    }) => (
        <div className={`relative rounded-2xl p-3 flex items-center justify-center bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-black border ${borderColor} shadow-[0_0_25px_-5px_${glowColor}] group-hover:shadow-[0_0_35px_-2px_${glowColor}] group-hover:scale-105 group-hover:border-white/40 transition-all duration-300 backdrop-blur-xl ${className}`}>
            {/* Esquinas tácticas HUD */}
            <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2" style={{ borderColor: accentColor }} />
            <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2" style={{ borderColor: accentColor }} />
            <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2" style={{ borderColor: accentColor }} />
            <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2" style={{ borderColor: accentColor }} />
            
            {/* Halo de luz central */}
            <div 
                className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-35"
                style={{ background: `radial-gradient(circle at center, ${accentColor} 0%, transparent 70%)` }}
            />

            {/* Malla de telemetría sutil */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:8px_8px] rounded-2xl pointer-events-none" />

            {/* Micro chip LED indicador */}
            <div className="absolute top-2 right-2.5 flex items-center gap-0.5">
                <span className="w-1 h-1 rounded-full animate-ping opacity-75" style={{ backgroundColor: accentColor }} />
                <span className="w-1 h-1 rounded-full" style={{ backgroundColor: accentColor }} />
            </div>

            {/* Contenido vectorial */}
            <div className="relative z-10 w-full h-full flex items-center justify-center">
                {children}
            </div>
        </div>
    );

    // 1. VEHÍCULOS Y EQUIPOS (Sleek Industrial 4x4 Mining Utility Pickup)
    if (n.includes('vehiculo') || n.includes('camion') || n.includes('volquete') || n.includes('camioneta') || icon === 'truck') {
        return (
            <TechBadgeWrapper borderColor="border-sky-500/40" glowColor="rgba(14,165,233,0.35)" accentColor="#38BDF8">
                <svg viewBox="0 0 72 72" className="w-full h-full drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]" fill="none">
                    {/* Línea de horizonte / suelo con telemetría */}
                    <path d="M6 56L66 56" stroke="#38BDF8" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.4" />
                    
                    {/* Pértiga de seguridad con banderín y luz LED destellante */}
                    <line x1="42" y1="28" x2="42" y2="12" stroke="#0F172A" strokeWidth="1.2" />
                    <polygon points="42,13 50,16 42,19" fill="#EA580C" />
                    <circle cx="42" cy="12" r="1.8" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="0.8" />

                    {/* Barra antivuelco (Rollbar) negra en tolva */}
                    <path d="M41 38V27H47L52 38" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    {/* Circulina ámbar en cabina */}
                    <rect x="30" y="23" width="7" height="3" rx="1.2" fill="#F59E0B" stroke="#B45309" strokeWidth="0.8" />

                    {/* Carrocería de Camioneta Pickup 4x4 */}
                    <path 
                        d="M8 44L10 40C10 38 12 36 16 36L24 35L31 26C33 24 35 24 40 24H44V36L62 37C64 37 65 39 65 41L65 49H8V44Z" 
                        fill="url(#realTruckGrad)" 
                        stroke="#38BDF8" 
                        strokeWidth="1.5" 
                        strokeLinejoin="round" 
                    />

                    {/* Ventanas doble cabina polarizadas */}
                    <path d="M26 35L32 27H37V35H26Z" fill="#0284C7" fillOpacity="0.85" stroke="#BAE6FD" strokeWidth="0.8" />
                    <path d="M39 27H43V35H39V27Z" fill="#0284C7" fillOpacity="0.85" stroke="#BAE6FD" strokeWidth="0.8" />

                    {/* Cinta reflectiva 3M roja/blanca lateral */}
                    <line x1="18" y1="43" x2="63" y2="43" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 2" />

                    {/* Faro delantero LED proyector */}
                    <path d="M8 40L14 39V43L8 44Z" fill="#FEF08A" stroke="#38BDF8" strokeWidth="0.8" />
                    {/* Luz trasera roja */}
                    <rect x="63" y="39" width="2" height="6" rx="1" fill="#EF4444" />

                    {/* Ruedas todoterreno 4x4 */}
                    <g transform="translate(20, 50)">
                        <circle cx="0" cy="0" r="7.5" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.8" />
                        <circle cx="0" cy="0" r="4.2" fill="#334155" stroke="#64748B" strokeWidth="1" />
                        <circle cx="0" cy="0" r="1.5" fill="#38BDF8" />
                    </g>
                    <g transform="translate(53, 50)">
                        <circle cx="0" cy="0" r="7.5" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.8" />
                        <circle cx="0" cy="0" r="4.2" fill="#334155" stroke="#64748B" strokeWidth="1" />
                        <circle cx="0" cy="0" r="1.5" fill="#38BDF8" />
                    </g>

                    <defs>
                        <linearGradient id="realTruckGrad" x1="8" y1="24" x2="65" y2="49" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#1E293B" />
                            <stop offset="0.4" stopColor="#0F172A" />
                            <stop offset="1" stopColor="#0369A1" />
                        </linearGradient>
                    </defs>
                </svg>
            </TechBadgeWrapper>
        );
    }

    // 2. EXTINTORES (Smart Plasma-Shield Extinguisher)
    if (n.includes('extintor') || icon === 'extinguisher') {
        return (
            <TechBadgeWrapper borderColor="border-red-500/50" glowColor="rgba(239,68,68,0.4)" accentColor="#EF4444">
                <svg viewBox="0 0 72 72" className="w-full h-full drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]" fill="none">
                    {/* Aros de telemetría HUD */}
                    <circle cx="36" cy="38" r="30" stroke="#EF4444" strokeWidth="1" strokeDasharray="4 6" strokeOpacity="0.3" />
                    {/* Cilindro de aleación de fibra de carbono roja */}
                    <rect x="25" y="24" width="22" height="34" rx="7" fill="url(#fireExtGrad)" stroke="#EF4444" strokeWidth="2" />
                    <rect x="27" y="26" width="4" height="30" rx="2" fill="#FCA5A5" fillOpacity="0.4" />
                    {/* Display de presión digital holográfico */}
                    <rect x="29" y="36" width="14" height="12" rx="2" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
                    <circle cx="36" cy="42" r="3.5" stroke="#38BDF8" strokeWidth="1" strokeDasharray="2 1" />
                    <line x1="36" y1="42" x2="38" y2="40" stroke="#22C55E" strokeWidth="1.2" strokeLinecap="round" />
                    {/* Valvulería de titanio superior */}
                    <rect x="33" y="19" width="6" height="5" fill="#64748B" stroke="#94A3B8" strokeWidth="1" />
                    <path d="M35 19L46 11M37 19L47 16" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="38" cy="15" r="2" fill="none" stroke="#F59E0B" strokeWidth="1.5" />
                    {/* Manguera de alta presión con boquilla electroóptica */}
                    <path d="M39 22C46 23 52 29 50 40L49 50" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
                    <path d="M39 22C46 23 52 29 50 40L49 50" stroke="#EF4444" strokeWidth="1" strokeDasharray="2 3" />
                    <rect x="47" y="47" width="5" height="7" rx="1.5" fill="#334155" stroke="#38BDF8" strokeWidth="1" />
                    <defs>
                        <linearGradient id="fireExtGrad" x1="25" y1="24" x2="47" y2="58" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#DC2626" />
                            <stop offset="0.7" stopColor="#991B1B" />
                            <stop offset="1" stopColor="#450A0A" />
                        </linearGradient>
                    </defs>
                </svg>
            </TechBadgeWrapper>
        );
    }

    // 3. BOTIQUINES (Smart Bio-Med Crate / First Aid HUD)
    if (n.includes('botiquin') || n.includes('primeros auxilios') || icon === 'first-aid') {
        return (
            <TechBadgeWrapper borderColor="border-emerald-500/45" glowColor="rgba(16,185,129,0.35)" accentColor="#10B981">
                <svg viewBox="0 0 72 72" className="w-full h-full drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]" fill="none">
                    {/* Asa reforzada con blindaje */}
                    <path d="M28 17C28 13 31 11 36 11C41 11 44 13 44 17" stroke="#34D399" strokeWidth="3" strokeLinecap="round" />
                    {/* Maletín médico tecnológico */}
                    <rect x="14" y="18" width="44" height="38" rx="8" fill="url(#medKitGrad)" stroke="#10B981" strokeWidth="2" />
                    <rect x="16" y="20" width="40" height="34" rx="6" fill="#064E3B" fillOpacity="0.5" />
                    {/* Broches magnéticos iluminados */}
                    <rect x="23" y="17" width="5" height="5" rx="1.5" fill="#34D399" />
                    <rect x="44" y="17" width="5" height="5" rx="1.5" fill="#34D399" />
                    {/* Escudo central con Cruz Médica Holográfica */}
                    <circle cx="36" cy="37" r="13" fill="#0F172A" stroke="#10B981" strokeWidth="1.5" />
                    <path d="M33 28H39V46H33V28Z" fill="#34D399" />
                    <path d="M27 34H45V40H27V34Z" fill="#34D399" />
                    {/* Línea de monitor cardíaco ECG */}
                    <path d="M16 48L24 48L27 44L30 52L33 46L36 48L56 48" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <defs>
                        <linearGradient id="medKitGrad" x1="14" y1="18" x2="58" y2="56" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#059669" />
                            <stop offset="0.6" stopColor="#047857" />
                            <stop offset="1" stopColor="#064E3B" />
                        </linearGradient>
                    </defs>
                </svg>
            </TechBadgeWrapper>
        );
    }

    // 4. INSPECCIÓN DE EPP (Smart Cyber Helmet / AR HUD)
    if (n.includes('epp') && !n.includes('caida')) {
        return (
            <TechBadgeWrapper borderColor="border-yellow-500/45" glowColor="rgba(234,179,8,0.35)" accentColor="#FACC15">
                <svg viewBox="0 0 72 72" className="w-full h-full drop-shadow-[0_0_12px_rgba(234,179,8,0.5)]" fill="none">
                    {/* Corona del casco con nervaduras aerodinámicas */}
                    <path d="M18 40C18 24 25 14 36 14C47 14 54 24 54 40H18Z" fill="url(#cyberHelmetGrad)" stroke="#FACC15" strokeWidth="2" />
                    <path d="M33 14C33 14 36 12 39 14V40H33V14Z" fill="#EAB308" />
                    {/* Borde / Visera perimetral */}
                    <path d="M12 40C12 38 15 37 20 37H52C57 37 60 38 60 40C60 43 56 45 51 45H21C16 45 12 43 12 40Z" fill="#CA8A04" stroke="#FACC15" strokeWidth="1" />
                    {/* Visor inteligente Holográfico AR (Cian futurista) */}
                    <path d="M22 43C22 49 27 52 32 52C35 52 36 50 36 48C36 50 37 52 40 52C45 52 50 49 50 43" stroke="#38BDF8" strokeWidth="3" fill="#0284C7" fillOpacity="0.4" strokeLinecap="round" />
                    {/* Retícula HUD en el visor */}
                    <circle cx="32" cy="46" r="1.5" fill="#38BDF8" />
                    <circle cx="40" cy="46" r="1.5" fill="#38BDF8" />
                    <line x1="28" y1="46" x2="30" y2="46" stroke="#38BDF8" strokeWidth="1" />
                    <line x1="42" y1="46" x2="44" y2="46" stroke="#38BDF8" strokeWidth="1" />
                    {/* Sensor de impacto / baliza lateral */}
                    <rect x="52" y="32" width="4" height="6" rx="1" fill="#38BDF8" />
                    <defs>
                        <linearGradient id="cyberHelmetGrad" x1="18" y1="14" x2="54" y2="40" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#FDE047" />
                            <stop offset="0.6" stopColor="#EAB308" />
                            <stop offset="1" stopColor="#A16207" />
                        </linearGradient>
                    </defs>
                </svg>
            </TechBadgeWrapper>
        );
    }

    // 5. INSPECCIÓN DE MAQUINARIA (Realistic Heavy Hydraulic Excavator / Línea Amarilla)
    if (n.includes('maquinaria') || n.includes('linea amarilla') || n.includes('pesada')) {
        return (
            <TechBadgeWrapper borderColor="border-amber-500/50" glowColor="rgba(245,158,11,0.4)" accentColor="#F59E0B">
                <svg viewBox="0 0 72 72" className="w-full h-full drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]" fill="none">
                    {/* Línea de suelo con textura técnica */}
                    <path d="M6 57L66 57" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.35" />

                    {/* Tren de rodaje de orugas de acero */}
                    <rect x="10" y="49" width="40" height="9" rx="4.5" fill="#0F172A" stroke="#F59E0B" strokeWidth="1.6" />
                    {/* Ruedas guía, rodillos inferiores y rueda motriz */}
                    <circle cx="15" cy="53.5" r="3" fill="#334155" stroke="#F59E0B" strokeWidth="0.8" />
                    <circle cx="23" cy="53.5" r="2.4" fill="#334155" stroke="#94A3B8" strokeWidth="0.6" />
                    <circle cx="30" cy="53.5" r="2.4" fill="#334155" stroke="#94A3B8" strokeWidth="0.6" />
                    <circle cx="37" cy="53.5" r="2.4" fill="#334155" stroke="#94A3B8" strokeWidth="0.6" />
                    <circle cx="45" cy="53.5" r="3" fill="#334155" stroke="#F59E0B" strokeWidth="0.8" />

                    {/* Tornamesa / corona de giro */}
                    <rect x="22" y="46.5" width="16" height="3" fill="#334155" />

                    {/* Superestructura giratoria de excavadora */}
                    <path d="M12 47H44C46 47 47 45 47 43V38C47 36 45 35 43 35H15C13 35 12 36 12 38V47Z" fill="url(#mechYellowGrad)" stroke="#B45309" strokeWidth="1.2" />
                    {/* Contrapeso trasero negro con reflectivo */}
                    <path d="M12 36H18V47H12C11 47 10 45 10 43V40C10 38 11 36 12 36Z" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
                    <rect x="11" y="41" width="6" height="2" fill="#EF4444" />

                    {/* Cabina ROPS con cristal panorámico */}
                    <path d="M26 23H38C39 23 40 24 40 25V35H24V25C24 24 25 23 26 23Z" fill="#1E293B" stroke="#F59E0B" strokeWidth="1.2" />
                    <path d="M26 25H38V34H26V25Z" fill="#0284C7" fillOpacity="0.8" stroke="#38BDF8" strokeWidth="0.8" />
                    {/* Foco de trabajo en cabina */}
                    <rect x="36" y="21" width="3" height="2" rx="0.5" fill="#FEF08A" stroke="#CA8A04" strokeWidth="0.5" />

                    {/* Pluma curva (Boom) de excavación */}
                    <path d="M38 38C42 32 46 22 53 19" stroke="#F59E0B" strokeWidth="4.5" strokeLinecap="round" />
                    <path d="M38 38C42 32 46 22 53 19" stroke="#FEF08A" strokeWidth="1.2" strokeLinecap="round" />
                    {/* Cilindro hidráulico de levante */}
                    <line x1="36" y1="42" x2="45" y2="28" stroke="#0F172A" strokeWidth="1.8" />
                    <line x1="40" y1="35" x2="45" y2="28" stroke="#CBD5E1" strokeWidth="1.2" />

                    {/* Brazo balancín (Arm / Stick) */}
                    <path d="M53 19L62 30" stroke="#F59E0B" strokeWidth="3.6" strokeLinecap="round" />
                    {/* Bulón de articulación */}
                    <circle cx="53" cy="19" r="2.2" fill="#0F172A" stroke="#FEF08A" strokeWidth="1" />

                    {/* Cucharón de excavación con dientes */}
                    <path d="M62 30L69 36C70 40 66 45 61 44L58 38Z" fill="#475569" stroke="#1E293B" strokeWidth="1.2" strokeLinejoin="round" />
                    <line x1="68" y1="42" x2="70" y2="44" stroke="#F59E0B" strokeWidth="1.2" />
                    <line x1="65" y1="43.5" x2="66.5" y2="45.5" stroke="#F59E0B" strokeWidth="1.2" />
                    <line x1="62" y1="44.5" x2="63" y2="46.5" stroke="#F59E0B" strokeWidth="1.2" />

                    <defs>
                        <linearGradient id="mechYellowGrad" x1="12" y1="35" x2="47" y2="47" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#FBBF24" />
                            <stop offset="0.5" stopColor="#F59E0B" />
                            <stop offset="1" stopColor="#D97706" />
                        </linearGradient>
                    </defs>
                </svg>
            </TechBadgeWrapper>
        );
    }

    // 6. INSPECCIÓN DE ALMACÉN (Automated Smart Warehouse / Logistic Racks)
    if (n.includes('almacen')) {
        return (
            <TechBadgeWrapper borderColor="border-blue-500/45" glowColor="rgba(59,130,246,0.35)" accentColor="#3B82F6">
                <svg viewBox="0 0 72 72" className="w-full h-full drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]" fill="none">
                    {/* Estructura matriz de almacenamiento vertical */}
                    <rect x="12" y="14" width="3.5" height="44" fill="#3B82F6" rx="1" />
                    <rect x="56" y="14" width="3.5" height="44" fill="#3B82F6" rx="1" />
                    <rect x="12" y="32" width="48" height="3" fill="#1D4ED8" />
                    <rect x="12" y="50" width="48" height="3" fill="#1D4ED8" />
                    <rect x="12" y="16" width="48" height="2.5" fill="#1D4ED8" />
                    {/* Cajas inteligentes con códigos QR y barras LED */}
                    <rect x="18" y="37" width="16" height="13" rx="2" fill="#D97706" stroke="#F59E0B" strokeWidth="1" />
                    <line x1="22" y1="41" x2="30" y2="41" stroke="#38BDF8" strokeWidth="1.5" />
                    <line x1="22" y1="44" x2="27" y2="44" stroke="#FEF08A" strokeWidth="1.5" />
                    <rect x="37" y="39" width="16" height="11" rx="2" fill="#2563EB" stroke="#60A5FA" strokeWidth="1" />
                    <circle cx="45" cy="44.5" r="2.5" fill="#93C5FD" />
                    {/* Nivel superior */}
                    <rect x="21" y="21" width="13" height="11" rx="1.5" fill="#F59E0B" />
                    <rect x="37" y="22" width="14" height="10" rx="1.5" fill="#059669" />
                    {/* Escáner láser infrarrojo */}
                    <line x1="12" y1="28" x2="60" y2="28" stroke="#EF4444" strokeWidth="1" strokeDasharray="3 2" />
                </svg>
            </TechBadgeWrapper>
        );
    }

    // 7. INSPECCIÓN DE TALLERES (Mecánica y Maestranza: Engranaje, Llave de Tuercas y Martillo de Alto Contraste)
    if (n.includes('taller')) {
        return (
            <TechBadgeWrapper borderColor="border-cyan-400/50" glowColor="rgba(6,182,212,0.45)" accentColor="#22D3EE">
                <svg viewBox="0 0 72 72" className="w-full h-full drop-shadow-[0_0_14px_rgba(6,182,212,0.6)]" fill="none">
                    {/* Engranaje Industrial de precisión de fondo */}
                    <g opacity="0.85">
                        <path d="M32 12H40V16.5C41.5 17 43 17.6 44.3 18.5L47.5 15.3L53.2 21L50 24.2C50.9 25.5 51.5 27 52 28.5H56.5V36.5H52C51.5 38 50.9 39.5 50 40.8L53.2 44L47.5 49.7L44.3 46.5C43 47.4 41.5 48 40 48.5V53H32V48.5C30.5 48 29 47.4 27.7 46.5L24.5 49.7L18.8 44L22 40.8C21.1 39.5 20.5 38 20 36.5H15.5V28.5H20C20.5 27 21.1 25.5 22 24.2L18.8 21L24.5 15.3L27.7 18.5C29 17.6 30.5 17 32 16.5V12Z" fill="#0F172A" stroke="#06B6D4" strokeWidth="2.2" strokeLinejoin="round" />
                        <circle cx="36" cy="32.5" r="9" fill="#1E293B" stroke="#22D3EE" strokeWidth="2" />
                        <circle cx="36" cy="32.5" r="4" fill="#0284C7" />
                    </g>

                    {/* Martillo de Mecánico (Diagonal Derecha a Izquierda, capa inferior) */}
                    <g transform="rotate(35 36 36)">
                        {/* Mango */}
                        <rect x="33" y="14" width="6" height="42" rx="3" fill="#D97706" stroke="#0F172A" strokeWidth="2" />
                        <rect x="33.5" y="32" width="5" height="20" rx="1.5" fill="#1E293B" />
                        {/* Cabeza del martillo */}
                        <path d="M22 13H50V21H22V13Z" fill="#CBD5E1" stroke="#0F172A" strokeWidth="2.2" strokeLinejoin="round" />
                        <rect x="20" y="11" width="4" height="12" rx="1.5" fill="#94A3B8" stroke="#0F172A" strokeWidth="1.5" />
                        <path d="M48 13L54 17L48 21V13Z" fill="#94A3B8" stroke="#0F172A" strokeWidth="1.5" />
                    </g>

                    {/* Llave Inglesa / Francesa Cromada (Diagonal Izquierda a Derecha, en primer plano) */}
                    <g transform="rotate(-35 36 36)">
                        {/* Mango de alta definición */}
                        <rect x="33" y="13" width="6" height="44" rx="3" fill="#38BDF8" stroke="#0F172A" strokeWidth="2.2" />
                        <rect x="34.5" y="18" width="3" height="32" rx="1.5" fill="#FFFFFF" fillOpacity="0.9" />
                        <circle cx="36" cy="51" r="2" fill="#0F172A" />
                        {/* Mordaza / Cabeza de la llave */}
                        <path d="M28 17C28 10 32 8 36 8C40 8 44 10 44 17H39V13H33V17H28Z" fill="#0284C7" stroke="#0F172A" strokeWidth="2.2" strokeLinejoin="round" />
                        <rect x="27.5" y="9" width="17" height="6.5" rx="2" fill="#38BDF8" stroke="#0F172A" strokeWidth="1.8" />
                        <rect x="32" y="8" width="8" height="6" fill="#0F172A" />
                    </g>
                </svg>
            </TechBadgeWrapper>
        );
    }

    // 8. INSPECCIÓN DE CAMPAMENTO (Smart Habitation Dome / Eco-Habitat)
    if (n.includes('campamento')) {
        return (
            <TechBadgeWrapper borderColor="border-teal-500/45" glowColor="rgba(20,184,166,0.35)" accentColor="#14B8A6">
                <svg viewBox="0 0 72 72" className="w-full h-full drop-shadow-[0_0_12px_rgba(20,184,166,0.5)]" fill="none">
                    {/* Módulo habitacional bioclimático */}
                    <rect x="14" y="28" width="44" height="28" rx="4" fill="url(#campGrad)" stroke="#14B8A6" strokeWidth="2" />
                    {/* Paneles solares fotovoltaicos en el techo */}
                    <path d="M11 28L36 14L61 28H11Z" fill="#0F766E" stroke="#2DD4BF" strokeWidth="2" />
                    <line x1="23" y1="21" x2="49" y2="21" stroke="#5EEAD4" strokeWidth="1" />
                    <line x1="36" y1="14" x2="36" y2="28" stroke="#5EEAD4" strokeWidth="1.5" />
                    {/* Esclusa de acceso presurizada */}
                    <rect x="31" y="40" width="10" height="16" rx="2" fill="#042F2E" stroke="#2DD4BF" strokeWidth="1.5" />
                    <circle cx="38" cy="48" r="1.2" fill="#2DD4BF" />
                    {/* Ventanales inteligentes con sensor */}
                    <rect x="19" y="34" width="8" height="8" rx="1.5" fill="#0284C7" stroke="#38BDF8" strokeWidth="1" />
                    <rect x="45" y="34" width="8" height="8" rx="1.5" fill="#0284C7" stroke="#38BDF8" strokeWidth="1" />
                    <defs>
                        <linearGradient id="campGrad" x1="14" y1="28" x2="58" y2="56" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#115E59" />
                            <stop offset="1" stopColor="#042F2E" />
                        </linearGradient>
                    </defs>
                </svg>
            </TechBadgeWrapper>
        );
    }

    // 9. INSTALACIONES ELÉCTRICAS (Quantum Power Grid / Arc Breaker)
    if (n.includes('electrica') || n.includes('electrico')) {
        return (
            <TechBadgeWrapper borderColor="border-amber-400/50" glowColor="rgba(251,191,36,0.4)" accentColor="#FBBF24">
                <svg viewBox="0 0 72 72" className="w-full h-full drop-shadow-[0_0_14px_rgba(251,191,36,0.6)]" fill="none">
                    {/* Gabinete de control industrial con apantallamiento electromagnético */}
                    <rect x="18" y="14" width="36" height="44" rx="4" fill="#0F172A" stroke="#FBBF24" strokeWidth="2" />
                    <rect x="22" y="18" width="28" height="36" rx="2" fill="#1E293B" />
                    {/* Indicadores LED de fases R-S-T */}
                    <circle cx="27" cy="24" r="2" fill="#EF4444" />
                    <circle cx="36" cy="24" r="2" fill="#EAB308" />
                    <circle cx="45" cy="24" r="2" fill="#22C55E" />
                    {/* Módulo disyuntor automático */}
                    <rect x="26" y="44" width="6" height="7" fill="#475569" stroke="#94A3B8" strokeWidth="1" />
                    <rect x="34" y="44" width="6" height="7" fill="#475569" stroke="#94A3B8" strokeWidth="1" />
                    <rect x="42" y="44" width="6" height="7" fill="#475569" stroke="#94A3B8" strokeWidth="1" />
                    {/* Rayo de plasma de alta tensión con brillo estroboscópico */}
                    <path d="M38 27L28 36H37L32 46L46 34H37L42 27H38Z" fill="#FACC15" stroke="#FEF08A" strokeWidth="1.2" strokeLinejoin="round" />
                </svg>
            </TechBadgeWrapper>
        );
    }

    // 10. COCINA Y COMEDORES (Plato con Cubiertos de Alta Visibilidad)
    if (n.includes('cocina') || n.includes('comedor')) {
        return (
            <TechBadgeWrapper borderColor="border-rose-500/50" glowColor="rgba(244,63,94,0.45)" accentColor="#F43F5E">
                <svg viewBox="0 0 72 72" className="w-full h-full drop-shadow-[0_0_14px_rgba(244,63,94,0.6)]" fill="none">
                    {/* Gran Plato de Comedor Central Blanco Puro */}
                    <circle cx="36" cy="36" r="22" fill="#FFFFFF" stroke="#E11D48" strokeWidth="2.8" />
                    <circle cx="36" cy="36" r="16" fill="#F8FAFC" stroke="#FB7185" strokeWidth="1.5" />
                    <circle cx="36" cy="36" r="10" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />

                    {/* Cubierto Izquierdo: Tenedor ergonómico blanco de alta definición */}
                    <g transform="translate(6, 14)">
                        <path d="M3 2V12M6 2V12M9 2V12M1 2V7C1 11.5 3.5 13.5 5 14.5V44H7V14.5C8.5 13.5 11 11.5 11 7V2H9.5V9H7.5V2H6.5V9H4.5V2H3.5V9H2.5V2H1Z" fill="#FFFFFF" stroke="#334155" strokeWidth="1" strokeLinejoin="round" />
                    </g>

                    {/* Cubierto Derecho: Cuchillo de mesa blanco de alta definición */}
                    <g transform="translate(56, 14)">
                        <path d="M2 2V18C2 21 3.5 23 5 24V44H7.5V2C7.5 2 7.5 2 2 2Z" fill="#FFFFFF" stroke="#334155" strokeWidth="1" strokeLinejoin="round" />
                        <line x1="7.5" y1="2" x2="7.5" y2="44" stroke="#94A3B8" strokeWidth="1.2" />
                    </g>
                </svg>
            </TechBadgeWrapper>
        );
    }

    // 11. LABORATORIO (Bio-Chemical Matrix / Quantum Flask)
    if (n.includes('laboratorio')) {
        return (
            <TechBadgeWrapper borderColor="border-purple-500/50" glowColor="rgba(168,85,247,0.4)" accentColor="#A855F7">
                <svg viewBox="0 0 72 72" className="w-full h-full drop-shadow-[0_0_14px_rgba(168,85,247,0.6)]" fill="none">
                    {/* Anillos orbitales de partículas cuánticas */}
                    <ellipse cx="36" cy="40" rx="26" ry="10" stroke="#C084FC" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.4" transform="rotate(-15 36 40)" />
                    {/* Matraz de borosilicato inteligente */}
                    <path d="M31 15H41M33 15V24L17 52C15 56 18 59 22 59H50C54 59 57 56 55 52L39 24V15" stroke="#E9D5FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {/* Reactivo químico fluorescente violeta */}
                    <path d="M21 47L26 38C30 40 34 38 38 39C42 40 47 38 51 47C52 51 51 56 48 56H24C21 56 20 51 21 47Z" fill="url(#chemPurpleGrad)" />
                    {/* Burbujas nano-activas flotantes */}
                    <circle cx="30" cy="49" r="2" fill="#F0ABFC" />
                    <circle cx="41" cy="46" r="2.5" fill="#F0ABFC" />
                    <circle cx="36" cy="32" r="1.8" fill="#F0ABFC" />
                    <circle cx="38" cy="22" r="1.2" fill="#E879F9" />
                    {/* Marcadores de gradación láser */}
                    <line x1="28" y1="45" x2="33" y2="45" stroke="#FFF" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="31" y1="39" x2="35" y2="39" stroke="#FFF" strokeWidth="1.2" strokeLinecap="round" />
                    <defs>
                        <linearGradient id="chemPurpleGrad" x1="21" y1="38" x2="51" y2="56" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#A855F7" />
                            <stop offset="1" stopColor="#6B21A8" />
                        </linearGradient>
                    </defs>
                </svg>
            </TechBadgeWrapper>
        );
    }

    // 12. INSPECCIONES INTERNAS SSOMA (Cyber Aegis / Security Matrix)
    if (n.includes('interna') || n.includes('ssoma')) {
        return (
            <TechBadgeWrapper borderColor="border-emerald-500/50" glowColor="rgba(16,185,129,0.4)" accentColor="#10B981">
                <svg viewBox="0 0 72 72" className="w-full h-full drop-shadow-[0_0_14px_rgba(16,185,129,0.6)]" fill="none">
                    {/* Escudo poligonal Cyber-Armor */}
                    <path d="M36 12L55 19V36C55 48 47 56 36 60C25 56 17 48 17 36V19L36 12Z" fill="url(#ssomaShieldGrad)" stroke="#34D399" strokeWidth="2.2" strokeLinejoin="round" />
                    {/* Capa de blindaje interior */}
                    <path d="M36 17L50 22V35C50 45 43 51 36 55V17Z" fill="#059669" fillOpacity="0.6" />
                    {/* Holograma Checkmark de Auditoría */}
                    <path d="M27 36L34 43L47 28" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M27 36L34 43L47 28" stroke="#A7F3D0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <defs>
                        <linearGradient id="ssomaShieldGrad" x1="36" y1="12" x2="36" y2="60" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#10B981" />
                            <stop offset="0.6" stopColor="#047857" />
                            <stop offset="1" stopColor="#064E3B" />
                        </linearGradient>
                    </defs>
                </svg>
            </TechBadgeWrapper>
        );
    }

    // 13. CAÍDAS / ARNÉS (Persona con su Arnés de Seguridad Completo y Casco)
    if (n.includes('caida') || n.includes('arnes')) {
        return (
            <TechBadgeWrapper borderColor="border-amber-500/50" glowColor="rgba(245,158,11,0.45)" accentColor="#F59E0B">
                <svg viewBox="0 0 72 72" className="w-full h-full drop-shadow-[0_0_14px_rgba(245,158,11,0.6)]" fill="none">
                    {/* Cuerda de Vida / Línea de anclaje dorsal superior */}
                    <line x1="36" y1="4" x2="36" y2="24" stroke="#F97316" strokeWidth="3" strokeDasharray="2 1" />
                    <rect x="33.5" y="4" width="5" height="6" rx="2" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />

                    {/* Cabeza y Casco de Seguridad Amarillo Industrial */}
                    <circle cx="36" cy="18" r="5" fill="#FED7AA" />
                    <path d="M28 16C28 10 31 7 36 7C41 7 44 10 44 16H28Z" fill="#FACC15" stroke="#EAB308" strokeWidth="1.5" />
                    <rect x="26" y="15" width="20" height="2.8" rx="1.2" fill="#EAB308" />

                    {/* Cuerpo de la persona (Torso y brazos con ropa de trabajo) */}
                    <path d="M24 30C24 25 28 23 36 23C44 23 48 25 48 30V46H24V30Z" fill="#1E293B" stroke="#334155" strokeWidth="1.2" />
                    {/* Brazos laterales */}
                    <path d="M24 27L17 41L20 42L25 31Z" fill="#1E293B" />
                    <path d="M48 27L55 41L52 42L47 31Z" fill="#1E293B" />

                    {/* Piernas de la persona */}
                    <rect x="25" y="46" width="9" height="18" rx="2" fill="#1E293B" />
                    <rect x="38" y="46" width="9" height="18" rx="2" fill="#1E293B" />
                    {/* Calzado / Botas de seguridad */}
                    <rect x="24" y="61" width="10" height="4" rx="1.5" fill="#475569" stroke="#64748B" strokeWidth="1" />
                    <rect x="38" y="61" width="10" height="4" rx="1.5" fill="#475569" stroke="#64748B" strokeWidth="1" />

                    {/* --- EL ARNÉS DE SEGURIDAD PUESTO SOBRE LA PERSONA --- */}
                    {/* Tirantes de hombro en naranja brillante de alta visibilidad */}
                    <line x1="29" y1="24" x2="29" y2="45" stroke="#F97316" strokeWidth="4" strokeLinecap="round" />
                    <line x1="29" y1="24" x2="29" y2="45" stroke="#FEF08A" strokeWidth="1.2" />

                    <line x1="43" y1="24" x2="43" y2="45" stroke="#F97316" strokeWidth="4" strokeLinecap="round" />
                    <line x1="43" y1="24" x2="43" y2="45" stroke="#FEF08A" strokeWidth="1.2" />

                    {/* Cinta de pecho del arnés con hebilla plateada */}
                    <line x1="28" y1="32" x2="44" y2="32" stroke="#EA580C" strokeWidth="3" />
                    <rect x="34" y="30.5" width="4" height="4" rx="1" fill="#FFFFFF" stroke="#475569" strokeWidth="1" />

                    {/* Cinturón faja de cintura del arnés */}
                    <rect x="23" y="42" width="26" height="4.5" rx="1" fill="#EA580C" stroke="#C2410C" strokeWidth="0.8" />
                    <rect x="34" y="41.5" width="4" height="5.5" rx="1" fill="#FFFFFF" stroke="#475569" strokeWidth="1" />

                    {/* Perneras del arnés en ambos muslos */}
                    <rect x="25" y="50" width="9" height="4" rx="1" fill="#F97316" stroke="#C2410C" strokeWidth="0.8" />
                    <rect x="38" y="50" width="9" height="4" rx="1" fill="#F97316" stroke="#C2410C" strokeWidth="0.8" />
                </svg>
            </TechBadgeWrapper>
        );
    }

    // 14. KIT ANTIDERRAME (Hazmat Bio-Containment Pod)
    if (n.includes('derrame')) {
        return (
            <TechBadgeWrapper borderColor="border-lime-500/50" glowColor="rgba(132,204,22,0.4)" accentColor="#84CC16">
                <svg viewBox="0 0 72 72" className="w-full h-full drop-shadow-[0_0_12px_rgba(132,204,22,0.5)]" fill="none">
                    {/* Tambor químico de rescate / salvamento */}
                    <rect x="22" y="21" width="28" height="38" rx="4" fill="url(#hazmatGrad)" stroke="#84CC16" strokeWidth="2" />
                    {/* Bandas de seguridad industrial */}
                    <line x1="22" y1="33" x2="50" y2="33" stroke="#4D7C0F" strokeWidth="2" />
                    <line x1="22" y1="46" x2="50" y2="46" stroke="#4D7C0F" strokeWidth="2" />
                    {/* Tapa sellada hermética */}
                    <ellipse cx="36" cy="21" rx="14" ry="4" fill="#A3E635" stroke="#65A30D" strokeWidth="1.5" />
                    {/* Icono de gota química luminosa */}
                    <circle cx="36" cy="40" r="8" fill="#0F172A" />
                    <path d="M36 34C36 34 30 41 30 44C30 47.3 32.7 50 36 50C39.3 50 42 47.3 42 44C42 41 36 34 36 34Z" fill="#84CC16" />
                    <defs>
                        <linearGradient id="hazmatGrad" x1="22" y1="21" x2="50" y2="59" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#EAB308" />
                            <stop offset="0.7" stopColor="#CA8A04" />
                            <stop offset="1" stopColor="#854D0E" />
                        </linearGradient>
                    </defs>
                </svg>
            </TechBadgeWrapper>
        );
    }

    // 15. ESTACIÓN DE EMERGENCIA (Decon & First-Aid Terminal)
    if (n.includes('estacion') || n.includes('emergencia')) {
        return (
            <TechBadgeWrapper borderColor="border-red-500/50" glowColor="rgba(239,68,68,0.4)" accentColor="#EF4444">
                <svg viewBox="0 0 72 72" className="w-full h-full drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]" fill="none">
                    {/* Torre tecnológica de emergencia */}
                    <rect x="20" y="16" width="32" height="42" rx="4" fill="#064E3B" stroke="#10B981" strokeWidth="2" />
                    {/* Letrero digital de Cruz Verde */}
                    <rect x="25" y="21" width="22" height="15" rx="2" fill="#FFFFFF" />
                    <path d="M33 24H39V33H33V24Z" fill="#059669" />
                    <path d="M29 27H43V30H29V27Z" fill="#059669" />
                    {/* Difusores de chorro lavaojos de emergencia */}
                    <path d="M28 44C28 41 44 41 44 44" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="32" cy="48" r="1.5" fill="#38BDF8" />
                    <circle cx="40" cy="48" r="1.5" fill="#38BDF8" />
                    {/* Alarma estroboscópica superior */}
                    <circle cx="36" cy="13" r="3" fill="#EF4444" stroke="#FCA5A5" strokeWidth="1" />
                </svg>
            </TechBadgeWrapper>
        );
    }

    // Fallback Futurista
    return (
        <TechBadgeWrapper borderColor="border-blue-500/40" glowColor="rgba(59,130,246,0.3)" accentColor="#3B82F6">
            <svg viewBox="0 0 72 72" className="w-full h-full drop-shadow-[0_0_10px_rgba(59,130,246,0.4)]" fill="none">
                <rect x="20" y="16" width="32" height="42" rx="4" fill="#1E293B" stroke="#3B82F6" strokeWidth="2" />
                <rect x="28" y="12" width="16" height="6" rx="2" fill="#3B82F6" />
                <line x1="26" y1="26" x2="46" y2="26" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
                <line x1="26" y1="34" x2="42" y2="34" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
                <line x1="26" y1="42" x2="46" y2="42" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
            </svg>
        </TechBadgeWrapper>
    );
};
