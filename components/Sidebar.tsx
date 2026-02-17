"use client";

import Link from 'next/link';
import {
    LayoutDashboard,
    CheckSquare,
    BarChart2,
    FileText,
    ExternalLink,
    Users,
    ClipboardCheck,
    Siren,
    Activity as ActivityIcon,
    TrendingUp,
    ChevronDown,
    ChevronRight,
    Shield,
    ShieldCheck,
    Menu,
    X,
    Settings,
    Leaf,
    Clipboard
} from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';

export default function Sidebar() {
    const { user } = useAuth();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
        security: true,
        health: true,
        environment: true
    });

    // Ocultar Sidebar en login (Check posterior a hooks)
    if (pathname === '/login') return null;

    const activeSection = searchParams.get('section');
    const activeView = searchParams.get('view');

    const toggleMenu = (key: string) => {
        setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname, searchParams]);

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="md:hidden fixed top-4 right-4 z-[60] p-2 bg-slate-800 text-slate-200 rounded-lg border border-slate-700 shadow-lg"
            >
                {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Overlay for Mobile */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <aside className={`
                w-64 bg-slate-950 border-r border-slate-800 h-screen 
                flex flex-col text-slate-300 z-50
                fixed top-0 left-0 transition-transform duration-300 ease-in-out
                md:translate-x-0 md:sticky
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center gap-2 mb-1">
                        <Shield size={24} className="text-emerald-500" />
                        <h1 className="text-xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent tracking-tighter">
                            DASHBOARD SSOMA
                        </h1>
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">Sistema de Gestión</p>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">


                    {/* PRINCIPAL */}
                    <div className="space-y-1 mb-2">
                        <div className="px-3 py-2">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Principal</span>
                        </div>
                        <SidebarItem
                            icon={<LayoutDashboard size={16} />}
                            label="Panel General"
                            href="/"
                            active={pathname === '/' && (!searchParams.get('view') || searchParams.get('view') === 'analytics')}
                        />
                    </div>

                    {/* HERRAMIENTAS */}
                    <div className="space-y-1 pt-2 border-t border-slate-800">
                        <div className="px-3 py-2">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Herramientas</span>
                        </div>


                        <SidebarItem icon={<ActivityIcon size={16} />} label="Control HHC" href="/analytics" active={pathname === '/analytics'} />
                        <SidebarItem icon={<ClipboardCheck size={16} />} label="Control de Inspección" href="/inspections" active={pathname === '/inspections'} />
                        <SidebarItem icon={<Shield size={16} />} label="Gestión ATS" href="/ats" active={pathname === '/ats'} />
                        <SidebarItem icon={<Clipboard size={16} />} label="Gestión PETAR" href="/petar" active={pathname === '/petar'} />
                        <SidebarItem icon={<LayoutDashboard size={16} />} label="Programa Anual" href="/program" active={pathname === '/program'} />
                        <SidebarItem icon={<CheckSquare size={16} />} label="Objetivos" href="/evidence" active={pathname === '/evidence'} />
                        <SidebarItem icon={<Leaf size={16} />} label="Evidencias PMA" href="/pma" active={pathname === '/pma'} />
                        <SidebarItem icon={<BarChart2 size={16} />} label="Estadística de Accidentabilidad" href="/reports" active={pathname === '/reports'} />

                        {/* SOLO DEVELOPER/MANAGER - Informe del Mes */}
                        {(user?.role === 'developer' || user?.role === 'manager') && (
                            <SidebarItem
                                icon={<FileText size={16} className="text-amber-500" />}
                                label="Informe del Mes"
                                href="/monthly-report"
                                active={pathname === '/monthly-report'}
                            />
                        )}

                        {/* SOLO DEVELOPER - Configuración de Maestros */}
                        {user?.role === 'developer' && (
                            <SidebarItem
                                icon={<Settings size={16} className="text-pink-500" />}
                                label="Configuración Maestros"
                                href="/settings"
                                active={pathname === '/settings'}
                            />
                        )}
                    </div>
                </nav>

                {/* Footer con Creditos Premium */}
                <div className="p-4 border-t border-slate-800 bg-slate-950/50">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative border border-slate-800 bg-slate-900 rounded-lg p-3 flex items-center gap-3 transition-colors group-hover:border-emerald-500/30">
                            <div className="h-8 w-8 rounded bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-slate-700 shadow-inner">
                                <ShieldCheck size={16} className="text-emerald-500/80" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider leading-tight">Desarrollado por</span>
                                <span className="text-[10px] text-emerald-400 font-bold tracking-tight leading-tight">Jose Luis Cancino Tueros</span>
                                <span className="text-[10px] text-green-500 font-bold font-mono mt-0.5">v2026.2 - FIXED</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

function SidebarItem({ icon, label, href, active }: { icon: React.ReactNode, label: string, href: string, active?: boolean }) {
    return (
        <Link
            href={href}
            className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                ${active
                    ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] border border-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 hover:pl-4 border border-transparent'
                }
            `}
        >
            <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                {icon}
            </div>
            {label}
            {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" />
            )}
        </Link>
    );
}
