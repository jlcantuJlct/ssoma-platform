"use client";

import { useState, useEffect } from "react";
import { Download, X, Share, MoreVertical } from "lucide-react";

export default function InstallPWAPrompt() {
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Register service worker for PWA
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW ref fail', err));
            });
        }

        // Detect if already installed (standalone mode)
        const checkStandalone = () => {
            const isStand = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
            setIsStandalone(isStand);
        };
        
        checkStandalone();

        // Detect iOS Safari
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        // Always show the instructional prompt after a short delay if not standalone
        if (!isStandalone) {
            const timer = setTimeout(() => {
                setShowInstallPrompt(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isStandalone]);

    if (isStandalone || !showInstallPrompt) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className="bg-slate-900 border border-[#f97316]/50 rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-col gap-3 relative">
                <button 
                    onClick={() => setShowInstallPrompt(false)}
                    className="absolute -top-3 -right-3 bg-slate-800 text-slate-400 hover:text-white p-1.5 rounded-full border border-slate-700 shadow-md"
                >
                    <X size={16} />
                </button>

                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                    <div className="bg-[#f97316]/20 p-2 rounded-xl flex-shrink-0">
                        <Download className="text-[#f97316]" size={20} />
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-sm">Instalar App en el Celular</h4>
                        <p className="text-slate-400 text-xs">Añádelo a tu inicio para un acceso rápido</p>
                    </div>
                </div>

                <div className="text-sm text-slate-300">
                    {isIOS ? (
                        <div className="flex flex-col gap-2">
                            <p>1. Toca el botón <strong>Compartir</strong> <Share size={14} className="inline text-blue-400 mx-1" /> en la barra inferior de Safari.</p>
                            <p>2. Selecciona <strong>"Agregar a inicio"</strong> <span className="bg-slate-800 px-2 py-0.5 rounded text-xs ml-1">+</span>.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <p>1. Toca el menú de opciones <MoreVertical size={16} className="inline text-slate-400" /> (los 3 puntos) arriba a la derecha en Chrome.</p>
                            <p>2. Selecciona <strong>"Agregar a la pantalla principal"</strong> o <strong>"Instalar aplicación"</strong>.</p>
                        </div>
                    )}
                </div>
                
                <button 
                    onClick={() => setShowInstallPrompt(false)}
                    className="w-full mt-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2.5 rounded-xl transition-colors border border-slate-700"
                >
                    Entendido
                </button>
            </div>
        </div>
    );
}
