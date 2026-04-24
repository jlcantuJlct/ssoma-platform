"use client";

import { useAuth } from "@/lib/auth";
import { LogOut, User, Activity, Bell, Search, Settings } from "lucide-react";
import { useState } from "react";

export function Header() {
    const { user, logout } = useAuth();
    const [showProfile, setShowProfile] = useState(false);

    if (!user) return null;

    const initials = user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    return (
        <header className="sticky top-0 z-40 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-3 flex items-center justify-between">
            {/* Left side: Breadcrumbs or Search */}
            <div className="flex items-center gap-4">
                <div className="relative group hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={14} />
                    <input 
                        type="text" 
                        placeholder="Buscar en la plataforma..." 
                        className="bg-slate-800/50 border border-slate-700 rounded-full py-1.5 pl-9 pr-4 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 w-64 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest md:hidden">
                    <Activity size={14} className="text-emerald-500" />
                    SSOMA Antigravity
                </div>
            </div>

            {/* Right side: Notifications, Active Users, Profile */}
            <div className="flex items-center gap-4">
                {/* Real-time Presence Mock */}
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">En línea</span>
                </div>

                <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                    <Bell size={18} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-900"></span>
                </button>

                <div className="h-6 w-px bg-slate-800 mx-1"></div>

                <div className="relative">
                    <button 
                        onClick={() => setShowProfile(!showProfile)}
                        className="flex items-center gap-3 group"
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-black text-white uppercase leading-none">{user.name}</p>
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter mt-1">{user.role}</p>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-emerald-900/40 ring-2 ring-emerald-500/20 group-hover:scale-105 transition-all">
                            {initials}
                        </div>
                    </button>

                    {showProfile && (
                        <div className="absolute right-0 mt-3 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-slate-800">
                                <p className="text-xs font-black text-white">{user.name}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{user.email}</p>
                            </div>
                            <div className="p-2">
                                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                                    <User size={14} /> Perfil de Usuario
                                </button>
                                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                                    <Settings size={14} /> Configuración
                                </button>
                                <div className="h-px bg-slate-800 my-1 mx-2"></div>
                                <button 
                                    onClick={logout}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
                                >
                                    <LogOut size={14} /> Cerrar Sesión
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
