"use client";

import { useState, useEffect } from "react";
import { Download, X, Share, MoreVertical, Smartphone, Check, ExternalLink, Copy } from "lucide-react";

interface InstallPWAPromptProps {
    workspace?: string;
    isLongitudinal?: boolean;
    manualOpen?: boolean;
    onCloseManual?: () => void;
}

export default function InstallPWAPrompt({ 
    workspace = 'Red Vial 6', 
    isLongitudinal = false,
    manualOpen = false,
    onCloseManual
}: InstallPWAPromptProps) {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'android' | 'ios'>('android');
    const [promptTried, setPromptTried] = useState(false);

    useEffect(() => {
        // Register service worker for PWA
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW reg fail', err));
            });
        }

        // Detect iOS
        const userAgent = (typeof window !== 'undefined' ? window.navigator.userAgent.toLowerCase() : '');
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);
        if (isIosDevice) setActiveTab('ios');

        // Listen for beforeinstallprompt event (Chrome / Android)
        const handleBeforeInstall = (e: any) => {
            e.preventDefault();
            (window as any).__pwaDeferredPrompt = e;
            setDeferredPrompt(e);
            setShowInstallPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        if ((window as any).__pwaDeferredPrompt) {
            setDeferredPrompt((window as any).__pwaDeferredPrompt);
        }

        // Solo mostrar si el usuario presiona el botón manualmente
        // No forzar popup automático que incomoda en visores de cámara
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);

    // Handle manual open trigger from parent button
    useEffect(() => {
        if (manualOpen) {
            setShowInstallPrompt(true);
        }
    }, [manualOpen]);

    const handleInstallClick = async () => {
        setPromptTried(true);
        const promptEvent = deferredPrompt || (typeof window !== 'undefined' && (window as any).__pwaDeferredPrompt);
        if (promptEvent) {
            try {
                promptEvent.prompt();
                const choice = await promptEvent.userChoice;
                if (choice && choice.outcome === 'accepted') {
                    dismissPrompt();
                    return;
                }
            } catch (err) {
                console.warn("PWA prompt error:", err);
            }
        }
        // Si el navegador no permite el prompt directo (ej: visor QR o Safari), cambiar a la guía paso a paso
        setActiveTab(isIOS ? 'ios' : 'android');
    };

    const handleOpenInChrome = () => {
        if (typeof window !== 'undefined') {
            const cleanUrl = window.location.href.replace(/^https?:\/\//, '');
            const intentUrl = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
            window.location.href = intentUrl;
        }
    };

    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch (e) {
            alert("Enlace: " + window.location.href);
        }
    };

    const dismissPrompt = () => {
        sessionStorage.setItem('pwaPromptDismissed', 'true');
        setShowInstallPrompt(false);
        if (onCloseManual) onCloseManual();
    };

    // Si no está abierto manualmente y no hay prompt que mostrar, no renderizar
    if (!manualOpen && !showInstallPrompt) return null;

    const accentBorder = isLongitudinal ? 'border-emerald-500/60' : 'border-orange-500/60';
    const btnBg = isLongitudinal 
        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/30' 
        : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-orange-500/30';
    const iconSrc = isLongitudinal ? '/icons/l4-192.png' : '/icons/rv6-192.png';
    const appTitle = isLongitudinal ? 'TOP - Longitudinal 4' : 'TOP - Red Vial 6';

    const hasNativePrompt = Boolean(deferredPrompt || (typeof window !== 'undefined' && (window as any).__pwaDeferredPrompt));

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
            <div className={`w-full max-w-md bg-slate-900 border-2 ${accentBorder} rounded-3xl shadow-2xl p-5 sm:p-6 flex flex-col gap-4 relative animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto`}>
                <button 
                    onClick={dismissPrompt}
                    className="absolute top-4 right-4 bg-slate-800 text-slate-400 hover:text-white p-2 rounded-full border border-slate-700 shadow-md transition-colors"
                    title="Cerrar"
                >
                    <X size={18} />
                </button>

                <div className="flex items-center gap-3.5 border-b border-slate-800 pb-4 pr-10">
                    <img src={iconSrc} alt={appTitle} className="w-14 h-14 rounded-2xl shadow-lg border border-white/10 shrink-0" />
                    <div>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${isLongitudinal ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'}`}>
                            {workspace}
                        </span>
                        <h3 className="text-white font-black text-base mt-1">
                            Fijar Icono en tu Celular
                        </h3>
                        <p className="text-slate-400 text-xs">Acceso directo en tu pantalla de inicio</p>
                    </div>
                </div>

                {/* Si el navegador soporta el botón de instalación directa (Android Chrome) */}
                {hasNativePrompt && !promptTried && (
                    <div className="space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Tu navegador permite instalar la aplicación directamente. Presiona el botón a continuación:
                        </p>
                        <button
                            type="button"
                            onClick={handleInstallClick}
                            className={`w-full py-3.5 px-4 rounded-2xl text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 ${btnBg} transition-all active:scale-95`}
                        >
                            <Download size={20} /> Instalar Icono en Pantalla
                        </button>
                    </div>
                )}

                {/* Guía Paso a Paso según el Sistema Operativo */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">Selecciona tu tipo de celular:</span>
                        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => setActiveTab('android')}
                                className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'android' ? (isLongitudinal ? 'bg-emerald-600 text-white' : 'bg-orange-600 text-white') : 'text-slate-400 hover:text-white'}`}
                            >
                                🤖 Android
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('ios')}
                                className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'ios' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                🍎 iPhone
                            </button>
                        </div>
                    </div>

                    {activeTab === 'android' && (
                        <div className="bg-slate-950/90 p-4 rounded-2xl border border-orange-500/30 space-y-3.5 text-xs text-slate-200">
                            {/* BOTÓN PARA SALIR DEL VISOR DE LA CÁMARA Y ABRIR DIRECTO EN CHROME */}
                            <div className="bg-gradient-to-r from-orange-600/25 to-amber-600/25 border border-orange-500/40 p-3.5 rounded-xl space-y-2.5">
                                <p className="font-bold text-white text-xs flex items-center gap-1.5">
                                    <span>🌐</span> Paso 1: Salir de la cámara a Google Chrome
                                </p>
                                <p className="text-[11px] text-slate-300 leading-snug">
                                    Estás dentro del lector de QR. Pulsa el botón abajo para abrir la página en <strong>Google Chrome</strong> (donde sí están los 3 puntos):
                                </p>
                                <button
                                    type="button"
                                    onClick={handleOpenInChrome}
                                    className="w-full py-3 px-4 rounded-xl text-white font-black text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                                >
                                    <ExternalLink size={16} /> Abrir en Google Chrome
                                </button>
                            </div>

                            <div className="pt-1 space-y-2">
                                <p className="font-bold text-orange-400 text-xs">
                                    Paso 2: Una vez en Chrome para fijar el icono:
                                </p>
                                <div className="flex items-start gap-2.5">
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5 ${isLongitudinal ? 'bg-emerald-500 text-black' : 'bg-orange-500 text-black'}`}>1</span>
                                    <p className="leading-snug">
                                        En <strong>Chrome</strong> verás los <strong>3 puntos ⋮</strong> en la esquina superior derecha. Tócalos.
                                    </p>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5 ${isLongitudinal ? 'bg-emerald-500 text-black' : 'bg-orange-500 text-black'}`}>2</span>
                                    <p className="leading-snug">
                                        Selecciona <strong>"Agregar a la pantalla principal"</strong> (o <strong>"Instalar aplicación"</strong>) y pulsa <strong>"Instalar"</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ios' && (
                        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-3 text-xs text-slate-200">
                            <div className="flex items-start gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">1</span>
                                <p className="leading-snug">
                                    En <strong>Safari</strong>, presiona el botón <strong>Compartir</strong> <Share size={14} className="inline text-blue-400 mx-1" /> (el cuadrado con la flecha hacia arriba en la barra inferior).
                                </p>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">2</span>
                                <p className="leading-snug">
                                    Desliza hacia abajo en el menú y selecciona <strong>"Agregar a pantalla de inicio"</strong> <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[11px] font-bold border border-slate-700 ml-1">➕</span>.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Botón para compartir por WhatsApp o copiar enlace */}
                <div className="pt-1 flex flex-col gap-2">
                    <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`📋 *Tarjeta TOP de Seguridad (${workspace})*\n\nPara abrir en Chrome y guardar el icono en tu pantalla, toca aquí:\n${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 text-center"
                    >
                        <span>💬</span> Enviarme el enlace por WhatsApp (Más fácil)
                    </a>
                    <button
                        type="button"
                        onClick={handleCopyUrl}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2.5 px-4 rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-2 active:scale-95"
                    >
                        {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                        {copied ? "¡Enlace copiado! Pégalo en Chrome" : "Copiar enlace para abrir en Chrome"}
                    </button>
                    <button 
                        type="button"
                        onClick={dismissPrompt}
                        className="w-full bg-transparent hover:bg-slate-800/40 text-slate-400 hover:text-white text-xs font-bold py-2 rounded-xl transition-colors text-center"
                    >
                        Cerrar ventana
                    </button>
                </div>
            </div>
        </div>
    );
}
