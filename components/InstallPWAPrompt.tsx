"use client";

import { useState, useEffect } from "react";
import { Download, X, Share, MoreVertical, Smartphone, Check } from "lucide-react";

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
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Register service worker for PWA
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW reg fail', err));
            });
        }

        // Check if running as installed standalone app
        const checkStandalone = () => {
            const isStand = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
            setIsStandalone(!!isStand);
        };
        checkStandalone();

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        // Listen for beforeinstallprompt event (Chrome / Android)
        const handleBeforeInstall = (e: any) => {
            e.preventDefault();
            (window as any).__pwaDeferredPrompt = e;
            setDeferredPrompt(e);
            setShowInstallPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        // Check if there was already a prompt saved globally
        if ((window as any).__pwaDeferredPrompt) {
            setDeferredPrompt((window as any).__pwaDeferredPrompt);
        }

        // Show prompt if on mobile and not dismissed
        const isMobileDevice = /android|iphone|ipad|ipod|mobile/i.test(userAgent);
        const dismissed = localStorage.getItem('pwaPromptDismissed');
        if (isMobileDevice && !dismissed && !isStandalone) {
            const timer = setTimeout(() => {
                setShowInstallPrompt(true);
            }, 1000);
            return () => clearTimeout(timer);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, [isStandalone]);

    // Handle manual open trigger from parent button
    useEffect(() => {
        if (manualOpen) {
            setShowInstallPrompt(true);
        }
    }, [manualOpen]);

    const handleInstallClick = async () => {
        const promptEvent = deferredPrompt || (window as any).__pwaDeferredPrompt;
        if (promptEvent) {
            promptEvent.prompt();
            const { outcome } = await promptEvent.userChoice;
            if (outcome === 'accepted') {
                setShowInstallPrompt(false);
                if (onCloseManual) onCloseManual();
            }
            setDeferredPrompt(null);
            (window as any).__pwaDeferredPrompt = null;
        }
    };

    const dismissPrompt = () => {
        localStorage.setItem('pwaPromptDismissed', 'true');
        setShowInstallPrompt(false);
        if (onCloseManual) onCloseManual();
    };

    if (isStandalone || (!showInstallPrompt && !manualOpen)) return null;

    const accentBorder = isLongitudinal ? 'border-emerald-500/60' : 'border-orange-500/60';
    const accentBg = isLongitudinal ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400';
    const btnBg = isLongitudinal 
        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500' 
        : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500';

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:hidden animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className={`bg-slate-900 border-2 ${accentBorder} rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-col gap-3 relative`}>
                <button 
                    onClick={dismissPrompt}
                    className="absolute -top-3 -right-3 bg-slate-800 text-slate-400 hover:text-white p-1.5 rounded-full border border-slate-700 shadow-md"
                    title="Cerrar"
                >
                    <X size={16} />
                </button>

                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                    <div className={`${accentBg} p-2.5 rounded-xl flex-shrink-0`}>
                        <Smartphone size={22} />
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-sm flex items-center gap-1.5">
                            Agregar Icono a Pantalla
                        </h4>
                        <p className="text-slate-400 text-xs">Acceso directo en tu celular para {workspace}</p>
                    </div>
                </div>

                {deferredPrompt || (typeof window !== 'undefined' && (window as any).__pwaDeferredPrompt) ? (
                    <div className="space-y-2">
                        <p className="text-xs text-slate-300">
                            Presiona el botón para instalar el icono de <strong>Tarjeta TOP</strong> en la pantalla de inicio de tu celular.
                        </p>
                        <button
                            onClick={handleInstallClick}
                            className={`w-full py-3 px-4 rounded-xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 ${btnBg} transition-all`}
                        >
                            <Download size={18} /> Instalar Icono en Pantalla
                        </button>
                    </div>
                ) : (
                    <div className="text-xs text-slate-300 space-y-2">
                        {isIOS ? (
                            <div className="flex flex-col gap-2 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                                <p className="font-semibold text-white">Instrucciones para iPhone / Safari:</p>
                                <p>1. Toca el botón <strong>Compartir</strong> <Share size={13} className="inline text-blue-400 mx-1" /> en la barra inferior de Safari.</p>
                                <p>2. Desliza hacia abajo y presiona <strong>"Agregar a inicio"</strong> <span className="bg-slate-700 px-1.5 py-0.5 rounded text-[11px] ml-1">➕</span>.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                                <p className="font-semibold text-white">Instrucciones para Android / Chrome:</p>
                                <p>1. Toca los <strong>3 puntos</strong> <MoreVertical size={14} className="inline text-slate-400" /> arriba a la derecha en Chrome.</p>
                                <p>2. Toca <strong>"Agregar a la pantalla principal"</strong> o <strong>"Instalar aplicación"</strong>.</p>
                            </div>
                        )}
                        <button 
                            onClick={dismissPrompt}
                            className="w-full mt-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2 rounded-xl transition-colors border border-slate-700"
                        >
                            Entendido
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
