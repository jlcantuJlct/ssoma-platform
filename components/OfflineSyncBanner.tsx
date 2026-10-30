"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
    Wifi, 
    WifiOff, 
    RefreshCw, 
    CheckCircle, 
    AlertTriangle, 
    Trash2, 
    Send, 
    Clock, 
    X,
    ChevronDown,
    ChevronUp,
    Smartphone
} from 'lucide-react';
import { 
    getPendingInspections, 
    syncAllPendingInspections, 
    syncSingleInspection, 
    deleteFromOfflineQueue, 
    subscribeToOfflineQueue, 
    OfflineInspection 
} from '@/lib/offlineQueue';

export default function OfflineSyncBanner() {
    const [isOnline, setIsOnline] = useState<boolean>(true);
    const [pendingItems, setPendingItems] = useState<OfflineInspection[]>([]);
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
    const [syncProgress, setSyncProgress] = useState<string>('');
    const [lastSyncResult, setLastSyncResult] = useState<{ synced: number; failed: number } | null>(null);

    const refreshPending = useCallback(async () => {
        const items = await getPendingInspections();
        setPendingItems(items);
    }, []);

    const handleSyncAll = useCallback(async () => {
        if (!navigator.onLine || isSyncing) return;
        setIsSyncing(true);
        setSyncProgress('Iniciando sincronización...');
        try {
            const res = await syncAllPendingInspections();
            setLastSyncResult({ synced: res.synced, failed: res.failed });
            await refreshPending();
            if (res.synced > 0) {
                setTimeout(() => setLastSyncResult(null), 6000);
            }
        } catch (e: any) {
            console.error('Error en syncAll:', e);
        } finally {
            setIsSyncing(false);
            setSyncProgress('');
        }
    }, [isSyncing, refreshPending]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        setIsOnline(navigator.onLine);
        refreshPending();

        const handleOnline = () => {
            setIsOnline(true);
            refreshPending();
            // Auto sincronizar al recuperar señal si hay pendientes
            getPendingInspections().then(items => {
                if (items.length > 0) {
                    handleSyncAll();
                }
            });
        };

        const handleOffline = () => {
            setIsOnline(false);
            refreshPending();
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        const unsubscribe = subscribeToOfflineQueue(refreshPending);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            unsubscribe();
        };
    }, [refreshPending, handleSyncAll]);

    // Si no está offline y no hay items pendientes ni en proceso, no renderizar nada para mantener la UI limpia
    if (isOnline && pendingItems.length === 0 && !lastSyncResult && !isSyncing) {
        return null;
    }

    const pendingCount = pendingItems.length;

    return (
        <>
            {/* Barra flotante inferior / superior responsiva */}
            <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 transition-all duration-300">
                <div className={`p-4 rounded-2xl shadow-2xl backdrop-blur-md border text-white transition-colors ${
                    !isOnline 
                        ? 'bg-amber-950/90 border-amber-600/40 text-amber-200 shadow-amber-900/30' 
                        : pendingCount > 0 
                            ? 'bg-sky-950/95 border-sky-500/40 text-sky-100 shadow-sky-950/50' 
                            : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200 shadow-emerald-900/30'
                }`}>
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            {!isOnline ? (
                                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                                    <WifiOff size={20} className="animate-pulse" />
                                </div>
                            ) : pendingCount > 0 ? (
                                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 shrink-0">
                                    <Smartphone size={20} />
                                </div>
                            ) : (
                                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                                    <CheckCircle size={20} />
                                </div>
                            )}

                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold uppercase tracking-wider opacity-80">
                                    {!isOnline ? 'Modo Offline (Sin Señal)' : 'Sincronización SSOMA'}
                                </p>
                                <p className="text-sm font-black truncate">
                                    {!isOnline ? (
                                        pendingCount > 0 
                                            ? `${pendingCount} reporte(s) guardado(s) en celular` 
                                            : 'Trabajando sin internet'
                                    ) : isSyncing ? (
                                        syncProgress || 'Subiendo reportes...'
                                    ) : pendingCount > 0 ? (
                                        `${pendingCount} reporte(s) listo(s) para subir`
                                    ) : (
                                        'Todo sincronizado con la nube'
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            {isOnline && pendingCount > 0 && (
                                <button
                                    onClick={handleSyncAll}
                                    disabled={isSyncing}
                                    title="Sincronizar ahora"
                                    className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 disabled:opacity-50 transition-all cursor-pointer"
                                >
                                    <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                                    <span>{isSyncing ? 'Subiendo' : 'Subir'}</span>
                                </button>
                            )}

                            {pendingCount > 0 && (
                                <button
                                    onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                                    className="p-1.5 rounded-lg hover:bg-white/10 active:scale-90 transition-colors text-white/80 hover:text-white"
                                    title="Ver lista de reportes pendientes"
                                >
                                    {isDrawerOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Mensaje de resultado de última sincronización */}
                    {lastSyncResult && (
                        <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs font-semibold">
                            <span className="text-emerald-300">
                                ✅ {lastSyncResult.synced} subido(s) con éxito
                                {lastSyncResult.failed > 0 && ` • ⚠️ ${lastSyncResult.failed} fallaron`}
                            </span>
                            <button onClick={() => setLastSyncResult(null)} className="opacity-60 hover:opacity-100">
                                <X size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal / Drawer con el listado detallado de inspecciones pendientes */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-700 w-full md:max-w-xl max-h-[85vh] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                        {/* Cabecera */}
                        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400">
                                    <Smartphone size={22} />
                                </div>
                                <div>
                                    <h3 className="font-black text-white text-base">Bandeja de Pendientes (Offline)</h3>
                                    <p className="text-xs text-slate-400">
                                        {pendingItems.length} inspección(es) guardada(s) en la memoria de este celular
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsDrawerOpen(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Lista de reportes guardados */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-800/40">
                            {pendingItems.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    <CheckCircle size={40} className="mx-auto text-emerald-400 mb-2 opacity-80" />
                                    <p className="font-bold text-sm">No tienes inspecciones pendientes</p>
                                    <p className="text-xs text-slate-500 mt-1">Todos tus reportes están al día en la plataforma.</p>
                                </div>
                            ) : (
                                pendingItems.map((item) => (
                                    <div key={item.id} className="pt-3 first:pt-0 bg-slate-800/40 p-3.5 rounded-2xl border border-slate-700/50">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-sky-400 uppercase tracking-wider">
                                                        {item.moduleName}
                                                    </span>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-700 text-slate-300">
                                                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-bold text-white mt-1 truncate">
                                                    {item.meta?.equipo || item.meta?.chofer || item.meta?.responsable || 'Inspección de campo'}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    {item.meta?.proyecto || 'Obra'} • Fecha: {item.meta?.fecha || item.createdAt.split('T')[0]}
                                                </p>
                                                {item.emailData?.to && (
                                                    <p className="text-xs text-indigo-300 mt-1 flex items-center gap-1 truncate">
                                                        <Send size={12} /> Para: {item.emailData.to.join(', ')}
                                                    </p>
                                                )}
                                                {item.lastError && (
                                                    <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                                                        <AlertTriangle size={12} /> {item.lastError}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0">
                                                {isOnline && (
                                                    <button
                                                        onClick={async () => {
                                                            setIsSyncing(true);
                                                            try {
                                                                await syncSingleInspection(item);
                                                                await refreshPending();
                                                            } finally {
                                                                setIsSyncing(false);
                                                            }
                                                        }}
                                                        disabled={isSyncing}
                                                        title="Subir solo este reporte"
                                                        className="p-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/40 text-sky-300 transition-colors"
                                                    >
                                                        <RefreshCw size={16} className={isSyncing && item.status === 'syncing' ? 'animate-spin' : ''} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={async () => {
                                                        if (confirm('¿Eliminar esta inspección de la cola de pendientes?')) {
                                                            await deleteFromOfflineQueue(item.id);
                                                            await refreshPending();
                                                        }
                                                    }}
                                                    title="Eliminar de pendientes"
                                                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pie con botón de sincronización general */}
                        {pendingItems.length > 0 && (
                            <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
                                <span className="text-xs text-slate-400">
                                    {!isOnline ? 'Conéctate a WiFi o datos para sincronizar' : 'Listo para subir a la plataforma'}
                                </span>
                                <button
                                    onClick={handleSyncAll}
                                    disabled={!isOnline || isSyncing}
                                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30 disabled:opacity-50 transition-all cursor-pointer"
                                >
                                    <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                                    <span>{isSyncing ? 'Sincronizando...' : 'Subir Todos Ahora'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
