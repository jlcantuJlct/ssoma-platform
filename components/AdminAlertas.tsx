'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { getAvailableWorkspaces } from '@/lib/locations';
import { 
    Bell, Send, CheckCircle2, AlertTriangle, Loader2, Mail, Clock, 
    Users, MessageCircle, Briefcase, UserCheck, Shield, Check, X 
} from 'lucide-react';

const CC = ['jlcantu.jlct@gmail.com', 'jcancino@casacontratistas.com', 'rguerra@casacontratistas.com', 'mescobar@casacontratistas.com'];

interface AlertResult {
    user: string;
    status: 'ok' | 'sent' | 'error';
    email?: string;
    pendingModules?: string[];
    phone?: string;
    message?: string;
    error?: string;
}

interface AdminAlertasProps {
    users?: Record<string, any>;
    onToggleUserStatus?: (username: string) => void;
}

export default function AdminAlertas({ users: propUsers, onToggleUserStatus }: AdminAlertasProps = {}) {
    const { user, getAllUsers, toggleUserStatus } = useAuth();
    const workspaces = getAvailableWorkspaces();
    const [selectedWorkspace, setSelectedWorkspace] = useState<string>(user?.workspace || 'Red Vial 6');
    const [loading, setLoading]     = useState(false);
    const [results, setResults]     = useState<AlertResult[]>([]);
    const [sent, setSent]           = useState(false);
    const [error, setError]         = useState('');
    
    // Estado de configuración de canales por usuario (Correo / WhatsApp) sincronizado con Base de Datos
    const [alertSettings, setAlertSettings] = useState<Record<string, { email_enabled: boolean, whatsapp_enabled: boolean, deactivated: boolean }>>({});
    const [savingSettings, setSavingSettings] = useState<string | null>(null);
    const [saveNotification, setSaveNotification] = useState<string | null>(null);

    // Estado individual de cada correo CC a Supervisión
    const [ccList, setCcList] = useState<Array<{ email: string, name?: string, enabled: boolean }>>([
        { email: 'jlcantu.jlct@gmail.com', name: 'Jose Luis Cancino', enabled: true },
        { email: 'jcancino@casacontratistas.com', name: 'J. Cancino', enabled: true },
        { email: 'rguerra@casacontratistas.com', name: 'R. Guerra', enabled: true },
        { email: 'mescobar@casacontratistas.com', name: 'Marcus Escobar', enabled: true },
    ]);

    const handleToggleCc = async (email: string) => {
        const current = ccList.find(c => c.email === email);
        const newEnabled = current ? !current.enabled : false;

        setCcList(prev => prev.map(c => c.email === email ? { ...c, enabled: newEnabled } : c));

        try {
            await fetch('/api/alert-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'cc',
                    email,
                    enabled: newEnabled
                })
            });
            showSaveFeedback(`Copia a ${email} ${newEnabled ? 'activada' : 'desactivada'}`);
        } catch (err) {
            console.error('Error guardando CC:', err);
        }
    };

    // Cargar la configuración persistente desde el servidor
    const loadAlertSettings = async () => {
        try {
            const res = await fetch('/api/alert-settings');
            const data = await res.json();
            if (data.success && data.settings) {
                setAlertSettings(data.settings);
            }
            if (data.ccSettings && Array.isArray(data.ccSettings)) {
                setCcList(data.ccSettings);
            }
        } catch (e) {
            console.error('Error fetching alert settings:', e);
        }
    };

    useEffect(() => {
        loadAlertSettings();
    }, []);

    // Notificación flotante temporal
    const showSaveFeedback = (msg: string) => {
        setSaveNotification(msg);
        setTimeout(() => setSaveNotification(null), 3000);
    };

    // Alternar canal de Correo individual
    const handleToggleEmail = async (username: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const current = alertSettings[username] || { email_enabled: true, whatsapp_enabled: true, deactivated: false };
        const newEmail = !current.email_enabled;
        
        setAlertSettings(prev => ({
            ...prev,
            [username]: { ...current, email_enabled: newEmail }
        }));
        setSavingSettings(username);

        try {
            await fetch('/api/alert-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    email_enabled: newEmail,
                    whatsapp_enabled: current.whatsapp_enabled,
                    deactivated: current.deactivated
                })
            });
            showSaveFeedback(`Correo ${newEmail ? 'activado' : 'desactivado'} para ${username}`);
        } catch (err) {
            console.error('Error guardando correo:', err);
        } finally {
            setSavingSettings(null);
        }
    };

    // Alternar canal de WhatsApp individual
    const handleToggleWhatsApp = async (username: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const current = alertSettings[username] || { email_enabled: true, whatsapp_enabled: true, deactivated: false };
        const newWa = !current.whatsapp_enabled;
        
        setAlertSettings(prev => ({
            ...prev,
            [username]: { ...current, whatsapp_enabled: newWa }
        }));
        setSavingSettings(username);

        try {
            await fetch('/api/alert-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    email_enabled: current.email_enabled,
                    whatsapp_enabled: newWa,
                    deactivated: current.deactivated
                })
            });
            showSaveFeedback(`WhatsApp ${newWa ? 'activado' : 'desactivado'} para ${username}`);
        } catch (err) {
            console.error('Error guardando WhatsApp:', err);
        } finally {
            setSavingSettings(null);
        }
    };

    // Obtener los usuarios actualizados reactivamente desde props o AuthContext
    const allUsers = propUsers || (typeof window !== 'undefined' ? getAllUsers() : {});
    const handleToggle = onToggleUserStatus || toggleUserStatus;

    // Alternar estado de activación/desactivación persistente en BD y en AuthContext
    const handleToggleUserWithDb = async (username: string) => {
        handleToggle(username);
        const current = alertSettings[username] || { email_enabled: true, whatsapp_enabled: true, deactivated: false };
        const willBeDeactivated = !current.deactivated;
        
        setAlertSettings(prev => ({
            ...prev,
            [username]: { ...current, deactivated: willBeDeactivated }
        }));

        try {
            await fetch('/api/alert-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    email_enabled: current.email_enabled,
                    whatsapp_enabled: current.whatsapp_enabled,
                    deactivated: willBeDeactivated
                })
            });
            showSaveFeedback(`Usuario ${willBeDeactivated ? 'excluido de alertas' : 'reactivado en alertas'}`);
        } catch (err) {
            console.error('Error guardando estado de usuario en BD:', err);
        }
    };

    // Filtrar usuarios ACTIVOS (no desactivados) pertenecientes al proyecto seleccionado
    const activeProjectUsers = useMemo(() => {
        return Object.entries(allUsers)
            .filter(([key, u]: [string, any]) => {
                const userWs = u.workspace || 'Red Vial 6';
                const isDeactivated = alertSettings[key]?.deactivated !== undefined 
                    ? alertSettings[key].deactivated 
                    : !!u.deactivated;
                return userWs === selectedWorkspace && !isDeactivated && u.role === 'user';
            })
            .map(([key, u]: [string, any]) => ({
                username: key,
                name: u.name,
                email: u.email || `${key}@example.com`,
                phone: u.phone || '+51900000000',
                workspace: u.workspace || 'Red Vial 6'
            }));
    }, [allUsers, selectedWorkspace, alertSettings]);

    // Usuarios desactivados de este proyecto (para visualización informativa de exclusión)
    const inactiveProjectUsers = useMemo(() => {
        return Object.entries(allUsers)
            .filter(([key, u]: [string, any]) => {
                const userWs = u.workspace || 'Red Vial 6';
                const isDeactivated = alertSettings[key]?.deactivated !== undefined 
                    ? alertSettings[key].deactivated 
                    : !!u.deactivated;
                return userWs === selectedWorkspace && isDeactivated;
            })
            .map(([key, u]: [string, any]) => ({
                username: key,
                name: u.name,
                workspace: u.workspace || 'Red Vial 6'
            }));
    }, [allUsers, selectedWorkspace, alertSettings]);

    const handleEnviarAlertas = async () => {
        if (activeProjectUsers.length === 0) {
            setError(`No hay usuarios activos con rol inspector en el proyecto "${selectedWorkspace}".`);
            return;
        }

        setLoading(true);
        setError('');
        setResults([]);
        setSent(false);

        const usersToSend = activeProjectUsers.map(u => ({
            ...u,
            email_enabled: alertSettings[u.username]?.email_enabled !== false,
            whatsapp_enabled: alertSettings[u.username]?.whatsapp_enabled !== false
        }));

        try {
            const res = await fetch('/api/send-alerts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ssoma_cron_2026`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    workspace: selectedWorkspace,
                    users: usersToSend,
                    cc: ccList.filter(c => c.enabled).map(c => c.email)
                })
            });

            const data = await res.json();

            if (!res.ok || data.error) {
                setError(data.error || 'Error al enviar alertas');
            } else {
                setResults(data.results || []);
                setSent(true);
            }
        } catch (e: any) {
            setError('Error de conexión: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const totalSent = results.filter(r => r.status === 'sent').length;
    const totalOk   = results.filter(r => r.status === 'ok').length;

    return (
        <div className="admin-alertas">
            <div className="admin-card">
                {/* Header */}
                <div className="admin-header">
                    <div className="admin-header-icon">
                        <Bell size={24} />
                    </div>
                    <div>
                        <h2 className="admin-title">Sistema de Alertas por Proyecto</h2>
                        <p className="admin-subtitle">Recordatorios diarios de cumplimiento — Control individual de Correo y WhatsApp</p>
                    </div>
                </div>

                {/* Notificación de guardado en tiempo real */}
                {saveNotification && (
                    <div className="mb-3 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs flex items-center gap-2 animate-pulse">
                        <CheckCircle2 size={14} />
                        <span>{saveNotification}</span>
                    </div>
                )}

                {/* SELECTOR DE PROYECTO */}
                <div className="workspace-selector-container">
                    <label className="section-label flex items-center gap-1.5 mb-2">
                        <Briefcase size={14} className="text-emerald-400" />
                        Seleccionar Proyecto para Alertas:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {workspaces.map(ws => (
                            <button
                                key={ws}
                                type="button"
                                onClick={() => {
                                    setSelectedWorkspace(ws);
                                    setResults([]);
                                    setSent(false);
                                    setError('');
                                }}
                                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                                    selectedWorkspace === ws
                                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                                }`}
                            >
                                <span className="truncate">🏢 {ws}</span>
                                {selectedWorkspace === ws && <span className="text-[10px] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded font-black">Activo</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Info cards */}
                <div className="admin-info-grid mt-4">
                    <div className="admin-info-card">
                        <Users size={16} className="info-icon text-emerald-400" />
                        <div>
                            <p className="info-label">Personal activo</p>
                            <p className="info-value">{activeProjectUsers.length} inspectores</p>
                        </div>
                    </div>
                    <div className="admin-info-card">
                        <Mail size={16} className="info-icon text-cyan-400" />
                        <div>
                            <p className="info-label">Copia siempre a</p>
                            <p className="info-value">{ccList.filter(c => c.enabled).length} de {ccList.length} supervisores</p>
                        </div>
                    </div>
                    <div className="admin-info-card">
                        <Clock size={16} className="info-icon text-amber-400" />
                        <div>
                            <p className="info-label">Proyecto actual</p>
                            <p className="info-value truncate text-[11px]">{selectedWorkspace}</p>
                        </div>
                    </div>
                </div>

                {/* Usuarios destinatarios (SOLO ACTIVOS) con controles Correo/WhatsApp */}
                <div className="usuario-list">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <p className="section-label mb-0">Destinatarios Activos ({selectedWorkspace})</p>
                            <p className="text-[10px] text-slate-500">Haz clic en Correo o WhatsApp para activar o desactivar ese canal para cada persona.</p>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded shrink-0">
                            {activeProjectUsers.length} habilitados
                        </span>
                    </div>

                    {activeProjectUsers.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                            No hay inspectores activos asignados a este proyecto.
                        </div>
                    ) : (
                        activeProjectUsers.map((u, i) => {
                            const setting = alertSettings[u.username];
                            const isEmailOn = setting ? setting.email_enabled : true;
                            const isWaOn = setting ? setting.whatsapp_enabled : true;

                            return (
                                <div key={i} className="usuario-row flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="usuario-avatar shrink-0">{u.name.charAt(0)}</div>
                                        <div className="usuario-info min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <p className="usuario-name truncate">{u.name}</p>
                                                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.2 rounded font-bold">
                                                    Activo
                                                </span>
                                            </div>
                                            <p className="usuario-email truncate">{u.email}</p>
                                            {u.phone && <p className="text-[10px] text-slate-500 font-mono">{u.phone}</p>}
                                        </div>
                                    </div>

                                    {/* CONTROLES INDIVIDUALES POR CANAL */}
                                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center flex-wrap">
                                        {/* Toggle Correo */}
                                        <button
                                            type="button"
                                            onClick={(e) => handleToggleEmail(u.username, e)}
                                            disabled={savingSettings === u.username}
                                            className={`channel-toggle-btn ${
                                                isEmailOn
                                                    ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 hover:bg-sky-500/25'
                                                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400 line-through opacity-60'
                                            }`}
                                            title={isEmailOn ? "Alerta por Correo: ACTIVADA (Haz clic para desactivar)" : "Alerta por Correo: DESACTIVADA (Haz clic para activar)"}
                                        >
                                            <Mail size={12} />
                                            <span>Correo {isEmailOn ? 'ON' : 'OFF'}</span>
                                        </button>

                                        {/* Toggle WhatsApp */}
                                        <button
                                            type="button"
                                            onClick={(e) => handleToggleWhatsApp(u.username, e)}
                                            disabled={savingSettings === u.username}
                                            className={`channel-toggle-btn ${
                                                isWaOn
                                                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                                                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400 line-through opacity-60'
                                            }`}
                                            title={isWaOn ? "Alerta por WhatsApp: ACTIVADA (Haz clic para desactivar)" : "Alerta por WhatsApp: DESACTIVADA (Haz clic para activar)"}
                                        >
                                            <MessageCircle size={12} />
                                            <span>WhatsApp {isWaOn ? 'ON' : 'OFF'}</span>
                                        </button>

                                        {/* Estado de envío reciente si hubo */}
                                        {results.length > 0 && (() => {
                                            const r = results.find(res => res.user === u.name);
                                            if (!r) return null;
                                            return r.status === 'sent'
                                                ? <span className="badge badge-sent">Enviada</span>
                                                : r.status === 'ok'
                                                ? <span className="badge badge-ok">Al Día</span>
                                                : <span className="badge badge-error">Error</span>;
                                        })()}

                                        {/* Botón Desactivar General */}
                                        <button
                                            type="button"
                                            onClick={() => handleToggleUserWithDb(u.username)}
                                            className="text-[10px] text-rose-400 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-700/50 px-2 py-1 rounded font-bold transition-all ml-1"
                                            title="Excluir usuario por completo de todas las alertas"
                                        >
                                            Desactivar
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {/* Exclusión de usuarios desactivados con opción de activar */}
                    {inactiveProjectUsers.length > 0 && (
                        <div className="mt-4 p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] text-rose-400 flex items-center gap-1.5 font-bold">
                                    <span>⛔</span> {inactiveProjectUsers.length} usuario(s) desactivado(s) — EXCLUIDOS DE ALERTAS:
                                </span>
                            </div>
                            <div className="space-y-1.5">
                                {inactiveProjectUsers.map(iu => (
                                    <div key={iu.username} className="flex items-center justify-between bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-rose-300 line-through font-medium">{iu.name}</span>
                                            <span className="text-[9px] text-slate-500 font-mono">({iu.username})</span>
                                            <span className="text-[9px] text-rose-400/80 bg-rose-950/60 border border-rose-900/50 px-1.5 py-0.2 rounded font-semibold hidden sm:inline">
                                                Sin alertas
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleUserWithDb(iu.username)}
                                            className="text-[10px] text-emerald-400 bg-emerald-950/50 hover:bg-emerald-800/40 border border-emerald-700/50 px-2.5 py-1 rounded font-bold transition-all flex items-center gap-1"
                                            title="Activar usuario e incluirlo en alertas"
                                        >
                                            <Check size={12} />
                                            Activar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* CC A SUPERVISIÓN CON ACTIVACIÓN/DESACTIVACIÓN INDIVIDUAL */}
                <div className="cc-section">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <p className="section-label mb-0">Con copia a (Supervisión)</p>
                            <p className="text-[10px] text-slate-500">Haz clic en cada correo para activar o desactivar su copia en las alertas</p>
                        </div>
                        <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded shrink-0">
                            {ccList.filter(c => c.enabled).length} de {ccList.length} activos
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {ccList.map((item, i) => {
                            const isEnabled = item.enabled;
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => handleToggleCc(item.email)}
                                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-left border transition-all ${
                                        isEnabled
                                            ? 'bg-sky-500/15 border-sky-500/40 text-sky-200 hover:bg-sky-500/25 shadow-sm'
                                            : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:border-slate-700'
                                    }`}
                                    title={isEnabled ? "Copia ACTIVADA — Haz clic para desactivar" : "Copia DESACTIVADA — Haz clic para activar"}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${isEnabled ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]' : 'bg-slate-600'}`} />
                                        <div className="min-w-0">
                                            <p className={`text-xs font-semibold truncate ${isEnabled ? 'text-sky-100' : 'text-slate-500 line-through'}`}>
                                                {item.email}
                                            </p>
                                            {item.name && (
                                                <p className="text-[10px] text-slate-400 truncate">
                                                    {item.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold shrink-0 ml-2 ${
                                        isEnabled 
                                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' 
                                            : 'bg-rose-950/40 text-rose-400 border border-rose-900/40'
                                    }`}>
                                        {isEnabled ? 'Activo' : 'Desactivado'}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="error-box">
                        <AlertTriangle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Resultados */}
                {sent && results.length > 0 && (
                    <div className="results-box">
                        <div className="results-summary">
                            <CheckCircle2 size={18} className="results-icon" />
                            <span>
                                {totalSent > 0
                                    ? `${totalSent} alerta${totalSent > 1 ? 's' : ''} enviada${totalSent > 1 ? 's' : ''} para ${selectedWorkspace}`
                                    : `Personal al día en ${selectedWorkspace}`}{totalOk > 0 ? ` · ${totalOk} al día` : ''}
                            </span>
                        </div>
                        {results.filter(r => r.pendingModules?.length).map((r, i) => (
                            <div key={i} className="result-detail" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <p className="result-user">{r.user}</p>
                                    <div className="result-modules">
                                        {r.pendingModules?.map(m => (
                                            <span key={m} className="result-module-chip">{m}</span>
                                        ))}
                                    </div>
                                </div>
                                {r.phone && (
                                    <a 
                                        href={`https://wa.me/${r.phone.replace(/\+/g, '')}?text=${encodeURIComponent(`Hola ${r.user.split(' ')[0]}, te recordamos que tienes registros pendientes en ${selectedWorkspace} para hoy: ${r.pendingModules?.join(', ')}. Por favor regístralos: https://ssoma-platform.vercel.app`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-whatsapp"
                                        title="Enviar recordatorio por WhatsApp manual"
                                    >
                                        <MessageCircle size={14} />
                                        <span>WhatsApp</span>
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Botón */}
                <button
                    onClick={handleEnviarAlertas}
                    disabled={loading || activeProjectUsers.length === 0}
                    className="btn-enviar"
                >
                    {loading
                        ? <><Loader2 size={18} className="spin" /> Verificando {selectedWorkspace}...</>
                        : <><Send size={18} /> Enviar Alertas ({selectedWorkspace})</>
                    }
                </button>
                <p className="btn-note">
                    Las alertas se envían únicamente por los canales habilitados (Correo/WhatsApp) para cada usuario activo.
                </p>
            </div>

            <style jsx>{`
                .admin-alertas { padding: 24px; max-width: 680px; margin: 0 auto; }

                .admin-card {
                    background: #0f172a;
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 20px;
                    padding: 28px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                }

                .admin-header {
                    display: flex; align-items: center; gap: 16px;
                    margin-bottom: 20px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                }

                .admin-header-icon {
                    width: 48px; height: 48px; border-radius: 14px;
                    background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3);
                    display: flex; align-items: center; justify-content: center;
                    color: #10b981; flex-shrink: 0;
                }

                .admin-title { font-size: 18px; font-weight: 800; color: #f8fafc; margin: 0; }
                .admin-subtitle { font-size: 12px; color: #64748b; margin: 3px 0 0; }

                .workspace-selector-container {
                    background: rgba(2,6,23,0.5);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 14px;
                    padding: 14px;
                    margin-bottom: 16px;
                }

                .admin-info-grid {
                    display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
                    margin-bottom: 20px;
                }

                .admin-info-card {
                    background: rgba(2,6,23,0.4); border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 10px;
                }

                .info-label { font-size: 10px; color: #64748b; margin: 0; text-transform: uppercase; font-weight: 700; }
                .info-value { font-size: 13px; font-weight: 700; color: #e2e8f0; margin: 2px 0 0; }

                .section-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }

                .usuario-list { margin-bottom: 20px; }

                .usuario-row {
                    padding: 10px 14px; border-radius: 10px; margin-bottom: 8px;
                    background: rgba(2,6,23,0.4); border: 1px solid rgba(255,255,255,0.05);
                    transition: border-color 0.2s;
                }
                .usuario-row:hover {
                    border-color: rgba(255,255,255,0.1);
                }

                .usuario-avatar {
                    width: 32px; height: 32px; border-radius: 50%;
                    background: #1e293b; color: #10b981; font-weight: 700; font-size: 13px;
                    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
                }

                .usuario-info { flex: 1; min-width: 0; }
                .usuario-name { font-size: 13px; font-weight: 600; color: #f1f5f9; margin: 0; }
                .usuario-email { font-size: 11px; color: #64748b; margin: 0; }

                .channel-toggle-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 4px 8px;
                    font-size: 10px;
                    font-weight: 700;
                    border-radius: 7px;
                    border-width: 1px;
                    border-style: solid;
                    cursor: pointer;
                    transition: all 0.2s ease-in-out;
                    user-select: none;
                }

                .badge { font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 6px; }
                .badge-sent { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
                .badge-ok { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3); }
                .badge-error { background: rgba(245,158,11,0.15); color: #fbbf24; }

                .cc-section { margin-bottom: 20px; }
                .cc-list { display: flex; flex-wrap: wrap; gap: 6px; }
                .cc-chip { font-size: 11px; background: rgba(30,41,59,0.6); color: #94a3b8; padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); }

                .error-box {
                    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
                    border-radius: 10px; padding: 12px 16px; display: flex; align-items: center; gap: 10px;
                    color: #f87171; font-size: 13px; margin-bottom: 16px;
                }

                .results-box {
                    background: rgba(2,6,23,0.6); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 14px; padding: 16px; margin-bottom: 20px;
                }

                .results-summary { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #f8fafc; margin-bottom: 12px; }
                .results-icon { color: #10b981; }

                .result-detail { padding: 10px 0; border-top: 1px solid rgba(255,255,255,0.05); }
                .result-user { font-size: 13px; font-weight: 600; color: #f1f5f9; margin: 0 0 6px; }
                .result-modules { display: flex; flex-wrap: wrap; gap: 6px; }
                .result-module-chip { font-size: 11px; background: rgba(239,68,68,0.12); color: #f87171; padding: 2px 8px; border-radius: 6px; font-weight: 600; }

                .btn-whatsapp {
                    display: inline-flex; align-items: center; gap: 5px;
                    background: #15803d; color: #ffffff; padding: 6px 12px; border-radius: 8px;
                    font-size: 11px; font-weight: 700; text-decoration: none; transition: background 0.2s;
                }
                .btn-whatsapp:hover { background: #16a34a; }

                .btn-enviar {
                    width: 100%; padding: 14px; border-radius: 12px;
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white; font-size: 14px; font-weight: 800; border: none; cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    transition: opacity 0.2s; box-shadow: 0 4px 16px rgba(16,185,129,0.3);
                }
                .btn-enviar:disabled { opacity: 0.5; cursor: not-allowed; }
                .btn-enviar:hover:not(:disabled) { opacity: 0.9; }

                .btn-note { font-size: 11px; color: #64748b; text-align: center; margin: 10px 0 0; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
