"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth, ALL_USER_LIST } from "@/lib/auth";
import { LogOut, User as UserIcon, Settings, ChevronDown, Activity } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

function UserAvatarWithHistory({ u, isOnline, getAvatarColor }: { u: any, isOnline: boolean, getAvatarColor: (name: string) => string }) {
    const [history, setHistory] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(false);

    const handleMouseEnter = async () => {
        if (history !== null) return; // already fetched
        setLoading(true);
        try {
            const res = await fetch(`/api/audit-history?user=${encodeURIComponent(u.name)}`);
            const data = await res.json();
            if (data.success) {
                setHistory(data.history);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const userInitials = u.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
    const gradient = getAvatarColor(u.name);
    
    return (
        <div 
            onMouseEnter={handleMouseEnter}
            className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-white relative group transition-all duration-300 hover:z-30 hover:scale-125 shadow-lg cursor-pointer ${isOnline ? 'opacity-100' : 'opacity-30 grayscale hover:grayscale-0 hover:opacity-100'}`}
        >
            {userInitials}
            {isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-slate-900 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>}
            
            {/* Hover Tooltip con Historial */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 w-64 pr-3 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                <div className="bg-slate-950 text-white rounded-xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col pointer-events-auto">
                <div className="px-3 py-2 border-b border-slate-800 bg-slate-950/80 flex justify-between items-center">
                    <span className="text-[11px] font-black truncate text-slate-200">{u.name}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {isOnline ? 'En línea' : 'Desconectado'}
                    </span>
                </div>
                <div className="p-2 flex flex-col gap-1.5 max-h-48 overflow-y-auto scrollbar-hide bg-slate-900">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-4 gap-2 text-slate-500">
                            <Activity size={16} className="animate-pulse text-indigo-400" />
                            <span className="text-[9px] uppercase tracking-widest font-bold">Cargando actividad...</span>
                        </div>
                    ) : history && history.length > 0 ? (
                        history.map((log, idx) => {
                            const date = new Date(log.timestamp);
                            let actionColor = 'text-slate-300';
                            if (log.action?.includes('ELIMINA') || log.action?.includes('DELETE')) actionColor = 'text-red-400 font-bold';
                            if (log.action?.includes('NUEV') || log.action?.includes('CREA')) actionColor = 'text-emerald-400 font-bold';
                            if (log.action?.includes('ACTUALIZA') || log.action?.includes('UPDATE')) actionColor = 'text-sky-400 font-bold';

                            return (
                                <div key={idx} className="flex flex-col bg-slate-800/40 p-1.5 rounded-lg border border-slate-800/50 hover:bg-slate-800/80 transition-colors">
                                    <span className={`text-[8.5px] leading-tight ${actionColor} uppercase tracking-wide`}>{log.action}</span>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-[7.5px] text-slate-400 font-mono bg-slate-950/50 px-1 py-0.5 rounded">{log.module}</span>
                                        <span className="text-[7.5px] text-slate-500">{date.toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })}</span>
                                    </div>
                                    {log.details && (
                                        <span className="text-[8px] text-slate-500 mt-0.5 truncate max-w-full" title={log.details}>{log.details}</span>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-4 text-slate-500 opacity-60">
                            <span className="text-[10px] italic">Sin actividad histórica</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function UserMenu() {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const pathname = usePathname();

    const [onlineUsers, setOnlineUsers] = useState<Record<string, { name: string, lastSeen: number }>>({});

    if (pathname && pathname.startsWith('/public')) return null;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Real-time Presence System
    useEffect(() => {
        if (!user) return;

        const heartbeat = async () => {
            if (!user) return;
            if (document.hidden) return;

            try {
                const res = await fetch('/api/presence', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: user.username, name: user.name })
                });
                const data = await res.json();
                if (data.success) {
                    setOnlineUsers(data.presence);
                }
            } catch (e) {
                console.error("Presence heartbeat failed:", e);
            }
        };

        heartbeat(); // Initial
        const interval = setInterval(heartbeat, 30000); // Every 30s

        return () => clearInterval(interval);
    }, [user]);

    if (!user) return null;

    // Helper to pick a distinct colorful gradient based on name
    const getAvatarColor = (name: string) => {
        const colors = [
            "from-blue-500 to-indigo-600",
            "from-purple-500 to-pink-600",
            "from-amber-400 to-orange-500",
            "from-rose-400 to-red-500",
            "from-cyan-400 to-blue-600",
            "from-violet-500 to-fuchsia-600"
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    // Filter out the current user, keep the rest of ALL_USER_LIST
    const otherUsers = ALL_USER_LIST.filter(u => u.username !== user.username);

    return (
        <div className="fixed top-3 right-3 md:top-6 md:right-6 z-50 flex flex-col items-end gap-3" ref={menuRef}>
            
            {/* Current User Profile Button (Floating Avatar) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg shadow-emerald-900/20 border-2 border-slate-800 hover:border-emerald-500 transition-all group overflow-hidden bg-slate-900 flex items-center justify-center z-20"
                title="Mi Perfil"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative text-white font-black text-sm md:text-base tracking-tighter">
                    {user.name.charAt(0).toUpperCase()}
                </span>
                {/* Active Indicator */}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
            </button>

            {/* Menu Dropdown */}
            {isOpen && (
                <div className="absolute top-14 md:top-16 right-0 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-30">
                    <div className="p-4 border-b border-slate-800 bg-slate-950/50">
                        <p className="text-sm font-black text-white truncate">{user.name}</p>
                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">{user.role}</p>
                    </div>
                    <div className="p-2 flex flex-col gap-1">
                        <button 
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                            onClick={() => { setIsOpen(false); /* Optional profile action */ }}
                        >
                            <UserIcon size={16} className="text-emerald-500" />
                            Mi Perfil
                        </button>
                        {user.role === 'developer' && (
                            <button 
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                                onClick={() => { setIsOpen(false); router.push('/settings'); }}
                            >
                                <Settings size={16} className="text-pink-500" />
                                Configuración
                            </button>
                        )}
                        <div className="h-px bg-slate-800 my-1"></div>
                        <button 
                            onClick={() => { setIsOpen(false); logout(); }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all"
                        >
                            <LogOut size={16} />
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            )}

            {/* Real-time Presence List (Floating Stack) */}
            <div className="flex flex-col gap-1.5 items-center z-10 pt-1">
                {otherUsers.map(u => {
                    const isOnline = !!onlineUsers[u.username];
                    return (
                        <UserAvatarWithHistory 
                            key={u.username} 
                            u={u} 
                            isOnline={isOnline} 
                            getAvatarColor={getAvatarColor} 
                        />
                    );
                })}
            </div>

        </div>
    );
}
