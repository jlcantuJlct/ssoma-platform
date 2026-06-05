"use client";

import { useAuth } from "@/lib/auth";
import { LogOut, User, Activity, Bell, Search, Settings, Users } from "lucide-react";
import UserMenu from "@/components/UserMenu";

export function Header() {
    const { user } = useAuth();

    if (!user) return null;

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

                {/* Recordatorio de Pago y Mudanza */}
                <div className="hidden xl:flex items-center gap-3 px-4 py-1.5 bg-amber-500/5 border border-amber-500/20 rounded-full ml-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></div>
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Mantenimiento:</span>
                    <span className="text-[10px] text-amber-200/60 font-medium">
                        20 May (Mudar a Supabase) | 25 May (Cortar Pago Neon)
                    </span>
                </div>
            </div>

            {/* Right side: Notifications, Profile */}
            <div className="flex items-center gap-4">
                <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                    <Bell size={18} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-900"></span>
                </button>

                <div className="h-6 w-px bg-slate-800 mx-1"></div>

                <UserMenu />
            </div>
        </header>
    );
}
