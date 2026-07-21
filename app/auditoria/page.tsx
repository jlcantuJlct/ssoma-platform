"use client";

import { useState, useEffect } from 'react';
import { getAuditLogs } from '@/app/actions';
import { useAuth } from '@/lib/auth';
import { 
    Activity, 
    Search, 
    RefreshCcw,
    Calendar,
    User as UserIcon,
    ShieldAlert,
    Filter,
    X
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AuditoriaPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterModule, setFilterModule] = useState('');

    useEffect(() => {
        if (!loading && (!user || (user.role !== 'developer' && user.role !== 'manager'))) {
            router.push('/');
        }
    }, [user, loading, router]);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const res = await getAuditLogs(200); // Traer los últimos 200 logs
            if (res.success && res.data) {
                setLogs(res.data);
            }
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user && (user.role === 'developer' || user.role === 'manager')) {
            fetchLogs();
        }
    }, [user]);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = 
            (log.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.details || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesModule = filterModule ? log.module === filterModule : true;

        return matchesSearch && matchesModule;
    });

    const uniqueModules = Array.from(new Set(logs.map(l => l.module).filter(Boolean)));

    if (loading) return null;
    if (!user || (user.role !== 'developer' && user.role !== 'manager')) return null;

    return (
        <main className="flex-1 min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
            
            <div className="flex-1 p-4 md:p-6 overflow-y-auto z-10">
                <div className="max-w-7xl mx-auto space-y-6">
                    
                    <div className="mb-4">
                        <h1 className="text-2xl font-black text-white tracking-tighter">Auditoría y Registro de Actividad</h1>
                        <p className="text-sm text-slate-400">Rastro de acciones en la plataforma</p>
                    </div>

                    {/* Controles Superiores */}
                    <div className="flex flex-col md:flex-row gap-4 items-end justify-between bg-slate-900/50 p-4 rounded-2xl border border-slate-800 backdrop-blur-xl">
                        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Search size={12} /> Búsqueda General
                                </label>
                                <input name="searchTerm"
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar por usuario, acción, detalle..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 transition-colors"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Filter size={12} /> Filtrar por Módulo
                                </label>
                                <select name="filterModule"
                                    value={filterModule}
                                    onChange={(e) => setFilterModule(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 transition-colors appearance-none"
                                >
                                    <option value="">Todos los módulos</option>
                                    {uniqueModules.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                            {(searchTerm || filterModule) && (
                                <button
                                    onClick={() => { setSearchTerm(''); setFilterModule(''); }}
                                    className="px-4 py-2.5 rounded-xl border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider hover:bg-red-500/10 flex items-center gap-2 transition-all"
                                >
                                    <X size={14} /> Limpiar
                                </button>
                            )}
                            <button
                                onClick={fetchLogs}
                                disabled={isLoading}
                                className="flex-1 md:flex-none px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-50"
                            >
                                <RefreshCcw size={14} className={isLoading ? "animate-spin" : ""} /> 
                                {isLoading ? 'Cargando...' : 'Actualizar'}
                            </button>
                        </div>
                    </div>

                    {/* Tabla de Resultados */}
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-900/80 border-b border-slate-800 text-[10px] uppercase tracking-widest text-slate-400">
                                        <th className="p-4 font-black w-48">Fecha y Hora</th>
                                        <th className="p-4 font-black w-48">Usuario</th>
                                        <th className="p-4 font-black w-32">Módulo</th>
                                        <th className="p-4 font-black">Acción</th>
                                        <th className="p-4 font-black hidden md:table-cell">Detalles</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50 text-sm">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="p-12 text-center text-slate-500">
                                                <RefreshCcw size={24} className="animate-spin mx-auto mb-4 text-indigo-500" />
                                                <p className="text-xs uppercase tracking-widest font-bold">Cargando registros...</p>
                                            </td>
                                        </tr>
                                    ) : filteredLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-12 text-center text-slate-500">
                                                <Activity size={32} className="mx-auto mb-4 opacity-20" />
                                                <p className="text-xs uppercase tracking-widest font-bold">No se encontraron registros</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredLogs.map(log => {
                                            const logDate = new Date(log.timestamp);
                                            const formattedDate = logDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
                                            const formattedTime = logDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                            
                                            // Coloring actions based on type
                                            let actionColor = 'text-slate-300';
                                            if (log.action?.includes('ELIMINA') || log.action?.includes('DELETE')) actionColor = 'text-red-400 font-bold';
                                            if (log.action?.includes('NUEV') || log.action?.includes('CREA')) actionColor = 'text-emerald-400 font-bold';
                                            if (log.action?.includes('ACTUALIZA') || log.action?.includes('UPDATE')) actionColor = 'text-sky-400 font-bold';

                                            return (
                                                <tr key={log.id} className="hover:bg-slate-800/20 transition-colors group">
                                                    <td className="p-4 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="text-slate-300 font-medium">{formattedDate}</span>
                                                            <span className="text-[10px] text-slate-500 font-mono mt-0.5">{formattedTime}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                                                                <UserIcon size={12} />
                                                            </div>
                                                            <span className="font-bold text-slate-200">{log.user_name || 'Desconocido'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap">
                                                        <span className="px-2.5 py-1 rounded-md bg-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 border border-slate-700">
                                                            {log.module || '-'}
                                                        </span>
                                                    </td>
                                                    <td className={`p-4 ${actionColor}`}>
                                                        {log.action}
                                                    </td>
                                                    <td className="p-4 hidden md:table-cell text-slate-400 text-xs truncate max-w-xs">
                                                        {log.details || '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {!isLoading && filteredLogs.length > 0 && (
                            <div className="p-4 border-t border-slate-800 bg-slate-900/80 text-center flex justify-between items-center">
                                <span className="text-xs text-slate-500 font-bold tracking-widest uppercase">Total mostrados: {filteredLogs.length}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
