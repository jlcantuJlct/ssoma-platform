"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { LogOut, User as UserIcon, Settings, ChevronDown } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

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
            // AHORRO: No enviar latidos si la pestaña está oculta
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

    const othersOnline = Object.entries(onlineUsers).filter(([username]) => username !== user.username);

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
                {othersOnline.map(([username, data]) => {
                    const userInitials = data.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                    const gradient = getAvatarColor(data.name);
                    return (
                        <div 
                            key={username}
                            title={`${data.name} (En línea)`}
                            className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-white relative group transition-transform hover:z-10 hover:scale-125 shadow-lg cursor-pointer`}
                        >
                            {userInitials}
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-slate-900 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
                            
                            {/* Hover Name Tooltip */}
                            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-slate-700 shadow-xl">
                                {data.name}
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
}
