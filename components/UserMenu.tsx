"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { LogOut, User as UserIcon, Settings, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UserMenu() {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!user) return null;

    return (
        <div className="fixed top-4 right-16 md:top-6 md:right-8 z-50" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-1.5 pr-4 rounded-full shadow-lg hover:border-emerald-500/50 transition-all group"
            >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-lg shadow-inner">
                    {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col items-start hidden md:flex">
                    <span className="text-sm font-bold text-slate-200">{user.name.split(" ")[0]}</span>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">{user.role}</span>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""} ml-2`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-5">
                    <div className="p-4 border-b border-slate-800 bg-slate-950/50">
                        <p className="text-sm font-black text-white truncate">{user.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user.email || 'Usuario SSOMA'}</p>
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
        </div>
    );
}
