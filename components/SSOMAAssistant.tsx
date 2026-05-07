"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
    MessageSquare, 
    X, 
    Send, 
    Bot, 
    Search, 
    Image as ImageIcon, 
    Calendar,
    MapPin,
    ArrowRight,
    Sparkles,
    Loader2
} from 'lucide-react';
import { PMA_CATEGORIES } from '@/lib/categories';
import { SSOMA_LOCATIONS } from '@/lib/locations';
import { getDriveViewerUrl } from '@/lib/utils';

type Message = {
    id: string;
    text: string;
    sender: 'user' | 'assistant';
    results?: any[];
    options?: { label: string, value: string }[];
    type?: 'text' | 'gallery' | 'options';
};

export default function SSOMAAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "¡Hola! Soy tu asistente SSOMA. Escribe qué herramienta necesitas o qué fotos buscas para ayudarte.",
            sender: 'assistant'
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [currentFlow, setCurrentFlow] = useState<string | null>(null);
    
    const dragStart = useRef({ x: 0, y: 0 });
    const scrollRef = useRef<HTMLDivElement>(null);

    // Lógica de Arrastre (Drag) con Protección de Bordes
    const handleMouseDown = (e: React.MouseEvent) => {
        if (isOpen) return; // No arrastrar si está abierto el chat
        setIsDragging(true);
        dragStart.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            
            let newX = e.clientX - dragStart.current.x;
            let newY = e.clientY - dragStart.current.y;

            // RESTRICCIONES DE BORDES (Boundaries)
            const padding = 20;
            const bubbleSize = 60;
            
            // Límites para la burbuja (relativos a bottom-right: 24px)
            const maxX = 24; 
            const minX = -(window.innerWidth - bubbleSize - padding);
            
            const maxY = 24;
            const minY = -(window.innerHeight - bubbleSize - padding);

            newX = Math.max(minX, Math.min(maxX, newX));
            newY = Math.max(minY, Math.min(maxY, newY));

            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const [searchState, setSearchState] = useState({
        category: null as string | null,
        location: null as string | null,
        month: null as string | null
    });

    const handleOptionClick = (option: { label: string, value: string }) => {
        setMessages(prev => [...prev, { id: Date.now().toString(), text: option.label, sender: 'user' }]);
        
        if (option.value === "start_view") {
            setMessages(prev => [...prev, { 
                id: (Date.now()+1).toString(), 
                text: "Entendido. ¿Qué tipo de registros deseas visualizar?", 
                sender: 'assistant',
                options: [
                    { label: "📸 Fotos PMA", value: "tool_view_pma" },
                    { label: "✋ Control HHC", value: "tool_view_hhc" },
                    { label: "📄 Entrega EPP", value: "tool_view_epp" },
                    { label: "📑 ATS/PETAR", value: "tool_view_permits" },
                    { label: "📋 Inspecciones", value: "tool_view_inspections" }
                ],
                type: 'options'
            }]);
        } else if (option.value === "start_upload") {
            setMessages(prev => [...prev, { 
                id: (Date.now()+1).toString(), 
                text: "¿Qué herramienta necesitas utilizar para el ingreso de datos?", 
                sender: 'assistant',
                options: [
                    { label: "📸 Fotos PMA", value: "goto_pma" },
                    { label: "📄 Entrega EPP", value: "goto_epp" },
                    { label: "📋 Inspecciones", value: "goto_inspections" },
                    { label: "📑 ATS/PETAR", value: "goto_ats" },
                    { label: "✋ Control HHC", value: "goto_analytics" }
                ],
                type: 'options'
            }]);
        } else if (option.value.startsWith("tool_view_")) {
            const tool = option.value.replace("tool_view_", "");
            setSearchState(prev => ({ ...prev, category: tool }));
            setMessages(prev => [...prev, { 
                id: (Date.now()+1).toString(), 
                text: "Excelente. ¿De qué sede o lugar necesitas la información?", 
                sender: 'assistant',
                options: SSOMA_LOCATIONS.map(loc => ({ label: loc, value: `loc_${loc}` })),
                type: 'options'
            }]);
        } else if (option.value.startsWith("loc_")) {
            const loc = option.value.replace("loc_", "");
            setSearchState(prev => ({ ...prev, location: loc }));
            const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            const currentMonth = new Date().getMonth();
            setMessages(prev => [...prev, { 
                id: (Date.now()+1).toString(), 
                text: `Casi listo. ¿De qué mes requieres los registros?`, 
                sender: 'assistant',
                options: [
                    { label: months[currentMonth], value: `month_${currentMonth + 1}` },
                    { label: months[currentMonth - 1] || months[11], value: `month_${currentMonth}` },
                    { label: "Ver todo el año", value: "month_all" }
                ],
                type: 'options'
            }]);
        } else if (option.value.startsWith("month_")) {
            const month = option.value.replace("month_", "");
            
            // Si es PMA, hacemos búsqueda real en galería
            if (searchState.category === "pma") {
                handleSearch(`fotos`, searchState.location || undefined, month, undefined);
            } else {
                // Para otras herramientas, redirigimos a su historial
                const routes: Record<string, string> = {
                    hhc: "analytics",
                    epp: "epp",
                    permits: "ats",
                    inspections: "inspections"
                };
                setMessages(prev => [...prev, { 
                    id: (Date.now()+1).toString(), 
                    text: `Te estoy llevando al historial de ${searchState.category?.toUpperCase()} filtrado por los criterios seleccionados.`, 
                    sender: 'assistant'
                }]);
                setTimeout(() => {
                    window.location.href = `/${routes[searchState.category || ''] || searchState.category}`;
                }, 1500);
            }
        } else if (option.value.startsWith("goto_")) {
            const tool = option.value.replace("goto_", "");
            window.location.href = `/${tool}`;
        } else if (option.value.startsWith("tool_new_")) {
            const tool = option.value.replace("tool_new_", "");
            const routes: Record<string, string> = {
                hhc: "analytics",
                training: "registros",
                permits: "ats",
                pma: "pma",
                epp: "epp",
                inspections: "inspections"
            };
            window.location.href = `/${routes[tool] || tool}`;
        }
    };
    };

    const handleSearch = async (query: string, loc?: string, month?: string, cat?: string) => {
        setIsTyping(true);
        const queryLower = query.toLowerCase().trim();
        
        // MANEJO DE RESPUESTAS AFIRMATIVAS (CONTEXTO)
        if (queryLower === "si" || queryLower === "sí" || queryLower === "ok" || queryLower === "vale") {
            // Si el último mensaje tenía opciones, tomamos la primera (generalmente la positiva)
            const lastMsg = messages[messages.length - 1];
            if (lastMsg?.options && lastMsg.options.length > 0) {
                handleOptionClick(lastMsg.options[0]);
                setIsTyping(false);
                return;
            }
        }

        // MAPA MAESTRO DE PALABRAS CLAVE PARA TODA LA PLATAFORMA
        const toolMap = [
            { keys: ["hhc", "higiene", "manos"], name: "Control HHC", id: "hhc" },
            { keys: ["formacion", "charla", "capacitacion", "entrenamiento"], name: "Formación/Charlas", id: "training" },
            { keys: ["ats", "petar", "permiso", "alto riesgo"], name: "ATS/PETAR", id: "permits" },
            { keys: ["epp", "equipo", "proteccion"], name: "Control EPP", id: "epp" },
            { keys: ["pma", "fotos", "limpieza", "residuos", "baño", "baño", "baños"], name: "Fotos PMA", id: "pma" },
            { keys: ["manifiesto", "basura", "peligroso"], name: "Manifiestos", id: "manifiesto" },
            { keys: ["inspeccion", "checklist", "verificacion"], name: "Inspecciones", id: "inspections" },
            { keys: ["programa", "anual", "planificacion"], name: "Programa Anual", id: "program" },
            { keys: ["emo", "salud", "medico", "examen"], name: "Control EMO", id: "emo" },
            { keys: ["scsst", "comite", "seguridad"], name: "Control SCSST", id: "scsst" },
            { keys: ["desvio", "incumplimiento", "hallazgo"], name: "Control de Desvíos", id: "desvio" },
            { keys: ["ac", "correctiva", "preventiva"], name: "Reporte de A/C", id: "ac" },
            { keys: ["simulacro", "emergencia", "evacuacion"], name: "Simulacros", id: "simulacro" },
            { keys: ["brigadista", "primeros auxilios"], name: "Brigadistas", id: "brigadistas" }
        ];

        const matchedTool = toolMap.find(t => t.keys.some(k => queryLower.includes(k)));

        // Si detectamos un tema nuevo, reseteamos el estado de búsqueda para evitar conflictos
        if (matchedTool && !loc && !month) {
            setSearchState({ category: matchedTool.id, location: null, month: null });
            await new Promise(r => setTimeout(r, 600));
            setMessages(prev => [...prev, { 
                id: Date.now().toString(), 
                text: `He detectado que buscas información sobre **${matchedTool.name}**. ¿Qué acción deseas realizar?`, 
                sender: 'assistant',
                options: [
                    { label: `🔍 Visualizar registros (Ver)`, value: `tool_view_${matchedTool.id}` },
                    { label: `➕ Ingresar nuevo registro (Nuevo)`, value: `tool_new_${matchedTool.id}` }
                ],
                type: 'options'
            }]);
            setIsTyping(false);
            return;
        }

        const locationMatch = loc || SSOMA_LOCATIONS.find(l => queryLower.includes(l.toLowerCase()));
        const categoryMatch = cat || PMA_CATEGORIES.find(c => 
            queryLower.includes(c.label.toLowerCase()) || 
            c.id.toLowerCase().includes(queryLower.replace(/\s+/g, '_'))
        )?.id;

        try {
            let apiUrl = `/api/evidence-records?location=${locationMatch || ''}&category=${categoryMatch || ''}&limit=12`;
            if (month && month !== 'all') apiUrl += `&month=${month}`;

            const res = await fetch(apiUrl);
            const data = await res.json();
            
            if (data.success && data.records.length > 0) {
                const results = data.records
                    .map((r: any) => ({
                        id: r.id,
                        url: Array.isArray(r.images) ? r.images[0] : (typeof r.images === 'string' ? JSON.parse(r.images)[0] : r.file_url),
                        title: r.category_label || r.category || r.activity,
                        date: r.date,
                        location: r.zona || r.location,
                        file_type: (r.file_type || '').toLowerCase()
                    }))
                    .filter((r: any) => {
                        const url = (r.url || '').toLowerCase();
                        const isImage = url.match(/\.(jpg|jpeg|png|webp|gif)$/i) || r.file_type.includes('image');
                        const isPdf = url.endsWith('.pdf') || r.file_type.includes('pdf');
                        return isImage && !isPdf;
                    });

                if (results.length > 0) {
                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        text: `He encontrado estas fotos en ${locationMatch || 'la plataforma'}:`,
                        sender: 'assistant',
                        results: results,
                        type: 'gallery'
                    }]);
                } else {
                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        text: `Encontré registros para este criterio, pero son documentos. ¿Deseas ir a la herramienta para verlos?`,
                        sender: 'assistant',
                        options: matchedTool ? [{ label: "Ir a la herramienta", value: `tool_view_${matchedTool.id}` }] : [],
                        type: 'options'
                    }]);
                }
            } else {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    text: `No encontré resultados específicos. ¿Deseas que te lleve a la sección de **${matchedTool?.name || 'Búsqueda'}** para revisar manualmente?`,
                    sender: 'assistant',
                    options: matchedTool ? [{ label: "Sí, llévame ahí", value: `tool_view_${matchedTool.id}` }] : [],
                    type: 'options'
                }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: "Error de conexión con el servidor.",
                sender: 'assistant'
            }]);
        } finally {
            setIsTyping(false);
            setSearchState({ category: null, location: null, month: null });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { id: Date.now().toString(), text: userMsg, sender: 'user' }]);
        setInput("");
        handleSearch(userMsg);
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
            <style jsx="true">{`
                @keyframes robot-wave {
                    0%, 100% { transform: rotate(-12deg); }
                    50% { transform: rotate(12deg); }
                }
                @keyframes robot-point {
                    0%, 100% { transform: translateY(0) rotate(45deg); }
                    50% { transform: translateY(6px) rotate(65deg); }
                }
                .robot-arm {
                    position: absolute;
                    width: 10px;
                    height: 22px;
                    background: #10b981;
                    border-radius: 5px;
                    border: 2px solid #064e3b;
                    z-index: -1;
                }
                .arm-left {
                    left: -6px;
                    top: 14px;
                    transform-origin: top right;
                    animation: robot-wave 2.2s infinite ease-in-out;
                }
                .arm-right {
                    right: -6px;
                    top: 14px;
                    transform-origin: top left;
                    animation: robot-point 1.8s infinite ease-in-out;
                }
                .robot-glow {
                    box-shadow: 0 0 25px rgba(16, 185, 129, 0.4);
                }
            `}</style>
            
            {/* Bubble Button */}
            <button
                onMouseDown={handleMouseDown}
                onClick={() => {
                    if (isDragging) return;
                    if (!isOpen) {
                        setMessages([
                            {
                                id: '1',
                                text: "¡Hola! Soy tu asistente SSOMA. Escribe qué herramienta necesitas o qué fotos buscas para ayudarte.",
                                sender: 'assistant'
                            }
                        ]);
                        setSearchState({ category: null, location: null, month: null });
                    }
                    setIsOpen(!isOpen);
                }}
                style={{ 
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    cursor: isOpen ? 'pointer' : (isDragging ? 'grabbing' : 'grab')
                }}
                className={`fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 robot-glow ${
                    isOpen ? 'bg-slate-800 rotate-90' : 'bg-emerald-600'
                }`}
            >
                {!isOpen && (
                    <>
                        <div className="robot-arm arm-left shadow-md"></div>
                        <div className="robot-arm arm-right shadow-md"></div>
                    </>
                )}

                {isOpen ? <X size={28} className="text-white" /> : <Bot size={28} className="text-white animate-pulse" />}
                
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                    </span>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div 
                    style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
                    className="fixed bottom-24 right-6 z-[100] w-[90vw] md:w-[400px] h-[70vh] max-h-[600px] bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300"
                >
                    
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-emerald-600/20 to-blue-600/20 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/20">
                                <Sparkles size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-tighter">Asistente SSOMA</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">En Línea</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth custom-scrollbar">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                                    msg.sender === 'user' 
                                    ? 'bg-emerald-600 text-white rounded-tr-none' 
                                    : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                                }`}>
                                    <p className="leading-relaxed">{msg.text}</p>
                                    
                                    {msg.type === 'options' && msg.options && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {msg.options.map((opt, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleOptionClick(opt)}
                                                    className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all uppercase tracking-tighter"
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {msg.type === 'gallery' && msg.results && (
                                        <div className="grid grid-cols-2 gap-2 mt-3">
                                            {msg.results.map((item, idx) => (
                                                <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
                                                    <img 
                                                        src={getDriveViewerUrl(item.url, true)} 
                                                        alt={item.title}
                                                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <p className="text-[8px] font-bold text-white truncate">{item.title}</p>
                                                        <p className="text-[6px] text-slate-400">{item.location}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Buscando en la nube...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-slate-900/50">
                        <div className="relative group">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Escribe tu búsqueda aquí..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-4 pr-12 py-4 text-sm text-white focus:border-emerald-500 outline-none transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-emerald-900/20"
                            >
                                <ArrowRight size={20} className="text-white" />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
