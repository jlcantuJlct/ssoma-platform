"use client";

import { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";

export default function InstallPWAPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
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

        if (!isIosDevice) {
            const handleBeforeInstallPrompt = (e: Event) => {
                // Prevent the mini-infobar from appearing on mobile
                e.preventDefault();
                // Stash the event so it can be triggered later.
                setDeferredPrompt(e);
                setShowInstallPrompt(true);
            };

            window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

            return () => {
                window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            };
        } else {
            // For iOS, show the custom prompt if not installed yet
            if (!isStandalone) {
                // Wait a couple seconds before showing the prompt to let the page load
                const timer = setTimeout(() => {
                    setShowInstallPrompt(true);
                }, 2000);
                return () => clearTimeout(timer);
            }
        }
    }, [isStandalone]);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            setShowInstallPrompt(false);
        }
        
        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
    };

    if (isStandalone || !showInstallPrompt) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className="bg-slate-900 border border-[#f97316]/50 rounded-2xl shadow-2xl p-4 flex flex-col sm:flex-row items-center gap-4 relative">
                <button 
                    onClick={() => setShowInstallPrompt(false)}
                    className="absolute -top-2 -right-2 bg-slate-800 text-slate-400 hover:text-white p-1 rounded-full border border-slate-700"
                >
                    <X size={16} />
                </button>

                <div className="bg-[#f97316]/20 p-3 rounded-xl flex-shrink-0">
                    <Download className="text-[#f97316]" size={24} />
                </div>
                
                <div className="flex-1 text-center sm:text-left">
                    <h4 className="text-white font-bold text-sm">Instalar App de Reporte</h4>
                    <p className="text-slate-400 text-xs mt-1">
                        Añade a tu pantalla de inicio para acceso rápido sin internet o datos.
                    </p>
                </div>

                {!isIOS ? (
                    <button 
                        onClick={handleInstallClick}
                        className="bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors w-full sm:w-auto flex-shrink-0 shadow-lg shadow-[#f97316]/20"
                    >
                        Instalar Ahora
                    </button>
                ) : (
                    <div className="bg-slate-800 text-slate-300 text-[10px] p-2 rounded-xl border border-slate-700 text-center w-full sm:w-auto">
                        Toca el botón <Share size={12} className="inline mx-1" /> abajo<br/>y selecciona <strong>"Agregar a inicio"</strong>
                    </div>
                )}
            </div>
        </div>
    );
}
