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
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "¡Hola! Soy tu asistente SSOMA. Escribe qué herramienta necesitas o qué fotos buscas para ayudarte.",
            sender: 'assistant'
        }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const scrollRef = useRef<HTMLDivElement>(null);
    const [searchState, setSearchState] = useState<{
        category: string | null;
        location: string | null;
        month: string | null;
        query: string | null;
    }>({
        category: null,
        location: null,
        month: null,
        query: null
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(false);
        dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        
        const moveHandler = (moveEvent: MouseEvent) => {
            const newX = moveEvent.clientX - dragStart.current.x;
            const newY = moveEvent.clientY - dragStart.current.y;
            
            if (Math.abs(newX - position.x) > 5 || Math.abs(newY - position.y) > 5) {
                setIsDragging(true);
            }
            
            setPosition({ x: newX, y: newY });
        };
        
        const upHandler = () => {
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseup', upHandler);
        };
        
        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseup', upHandler);
    };

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
            if (searchState.category === "pma") {
                handleSearch(`fotos`, searchState.location || undefined, month, undefined);
            } else {
                const routes: Record<string, string> = {
                    hhc: "analytics",
                    epp: "epp",
                    permits: "ats",
                    inspections: "inspections"
                };
                setMessages(prev => [...prev, { 
                    id: (Date.now()+1).toString(), 
                    text: `Te estoy llevando al historial de ${searchState.category?.toUpperCase()} filtrado.`, 
                    sender: 'assistant'
                }]);
                setTimeout(() => {
                    window.location.href = `/${routes[searchState.category || ''] || searchState.category}`;
                }, 1500);
            }
        } else if (option.value.startsWith("free_loc_")) {
            const loc = option.value.replace("free_loc_", "");
            setSearchState(prev => ({ ...prev, location: loc }));
            const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            const currentMonth = new Date().getMonth();
            setMessages(prev => [...prev, { 
                id: (Date.now()+1).toString(), 
                text: `Casi listo. ¿De qué mes requieres los registros?`, 
                sender: 'assistant',
                options: [
                    { label: months[currentMonth], value: `free_month_${currentMonth + 1}` },
                    { label: months[currentMonth - 1] || months[11], value: `free_month_${currentMonth}` },
                    { label: "Ver todo el año", value: "all" }
                ],
                type: 'options'
            }]);
        } else if (option.value.startsWith("free_month_") || (option.value === "all" && searchState.query)) {
            const month = option.value.replace("free_month_", "");
            handleSearch(searchState.query || "", searchState.location || undefined, month, undefined);
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

    const handleSearch = async (query: string, loc?: string, month?: string, cat?: string) => {
        setIsTyping(true);
        const queryLower = query.toLowerCase().trim();
        
        if (queryLower === "si" || queryLower === "sí" || queryLower === "ok") {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg?.options && lastMsg.options.length > 0) {
                handleOptionClick(lastMsg.options[0]);
                setIsTyping(false);
                return;
            }
        }

        const toolMap = [
            { keys: ["foto", "imagen", "evidencia", "pma", "limpieza", "baño", "baños"], name: "Fotos PMA", id: "pma" },
            { keys: ["hhc", "manos"], name: "Control HHC", id: "hhc" },
            { keys: ["ats", "petar", "permiso"], name: "ATS/PETAR", id: "permits" },
            { keys: ["epp", "equipo"], name: "Control EPP", id: "epp" },
            { keys: ["inspeccion", "checklist"], name: "Inspecciones", id: "inspections" }
        ];

        const matchedTool = toolMap.find(t => t.keys.some(k => queryLower.includes(k)));

        if (!loc && !month) {
            if (matchedTool) {
                setSearchState({ category: matchedTool.id, location: null, month: null, query: null });
                await new Promise(r => setTimeout(r, 600));
                setMessages(prev => [...prev, { 
                    id: Date.now().toString(), 
                    text: `¿Qué acción deseas realizar con **${matchedTool.name}**?`, 
                    sender: 'assistant',
                    options: [
                        { label: `🔍 Visualizar registros`, value: `tool_view_${matchedTool.id}` },
                        { label: `➕ Ingresar nuevo`, value: `tool_new_${matchedTool.id}` }
                    ],
                    type: 'options'
                }]);
            } else {
                setSearchState(prev => ({ ...prev, query: query, location: null, month: null }));
                await new Promise(r => setTimeout(r, 600));
                setMessages(prev => [...prev, { 
                    id: Date.now().toString(), 
                    text: `Para buscar "${query}", ¿De qué sede o lugar necesitas la información?`, 
                    sender: 'assistant',
                    options: SSOMA_LOCATIONS.map(locationItem => ({ label: locationItem, value: `free_loc_${locationItem}` })),
                    type: 'options'
                }]);
            }
            setIsTyping(false);
            return;
        }

        try {
            const params = new URLSearchParams();
            if (query) params.append('q', query);
            if (loc) params.append('location', loc);
            if (month && month !== 'all') params.append('month', month);
            
            const response = await fetch(`/api/evidence-records?${params.toString()}`);
            const data = await response.json();

            if (data.success && data.records.length > 0) {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    text: `He encontrado ${data.records.length} fotos que coinciden con tu búsqueda.`,
                    sender: 'assistant',
                    results: data.records,
                    type: 'gallery'
                }]);
            } else {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    text: "No encontré resultados específicos. ¿Deseas ver todas las opciones?",
                    sender: 'assistant',
                    options: [
                        { label: "🔍 Ver todo", value: "start_view" },
                        { label: "➕ Registrar", value: "start_upload" }
                    ],
                    type: 'options'
                }]);
            }
        } catch (error) {
            console.error("Error searching:", error);
        } finally {
            setIsTyping(false);
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
        <>
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
                        setSearchState({ category: null, location: null, month: null, query: null });
                    }
                    setIsOpen(!isOpen);
                }}
                style={{ 
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    cursor: isOpen ? 'pointer' : (isDragging ? 'grabbing' : 'grab'),
                    boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)'
                }}
                className={`fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
                    isOpen ? 'bg-slate-800 rotate-90' : 'bg-emerald-600'
                }`}
            >
                {!isOpen && (
                    <>
                        <div className="absolute -left-1.5 top-4 w-2.5 h-6 bg-emerald-500 rounded-full animate-bounce shadow-md border border-emerald-700"></div>
                        <div className="absolute -right-1.5 top-4 w-2.5 h-6 bg-emerald-500 rounded-full animate-pulse shadow-md border border-emerald-700"></div>
                    </>
                )}
                {isOpen ? <X size={28} className="text-white" /> : <Bot size={28} className="text-white animate-pulse" />}
            </button>

            {isOpen && (
                <div 
                    style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
                    className="fixed bottom-24 right-6 z-[9999] w-[90vw] md:w-[400px] h-[70vh] max-h-[600px] bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 pointer-events-auto"
                >
                    <div className="p-4 bg-gradient-to-r from-emerald-600/20 to-blue-600/20 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center">
                                <Sparkles size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-tighter">Asistente SSOMA</h3>
                                <div className="flex items-center gap-1.5 text-emerald-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">En Línea</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
                            <X size={20} />
                        </button>
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in`}>
                                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                                    msg.sender === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                                }`}>
                                    <p>{msg.text}</p>
                                    {msg.type === 'options' && msg.options && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {msg.options.map((opt, idx) => (
                                                <button key={idx} onClick={() => handleOptionClick(opt)} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all uppercase tracking-tighter">
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {msg.type === 'gallery' && msg.results && (
                                        <div className="grid grid-cols-2 gap-2 mt-3">
                                            {msg.results.map((item, idx) => (
                                                <a 
                                                    key={idx} 
                                                    href={item.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="group relative aspect-square rounded-xl overflow-hidden border border-slate-700 bg-slate-900 hover:border-emerald-500 transition-all shadow-lg"
                                                    title="Click para ver original"
                                                >
                                                    <img 
                                                        src={getDriveViewerUrl(item.url, true)} 
                                                        alt={item.title} 
                                                        className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 flex flex-col justify-end p-2 transition-opacity">
                                                        <Search size={16} className="text-white mb-1 mx-auto" />
                                                        <p className="text-[8px] font-bold text-white truncate uppercase tracking-tighter">{item.title}</p>
                                                        <p className="text-[7px] text-emerald-400 font-bold uppercase">{item.location}</p>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Buscando...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-slate-900/50">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Escribe aquí..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-4 pr-12 py-4 text-sm text-white outline-none focus:border-emerald-500 transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white"
                            >
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}

// VERSION_CONTROL: 1.1.1_FORCED_REBUILD_CLEAN
