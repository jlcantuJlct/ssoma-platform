'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { getAvailableWorkspaces } from '@/lib/locations';
import { Bell, Send, CheckCircle2, AlertTriangle, Loader2, Mail, Clock, Users, MessageCircle, Briefcase, UserCheck, Shield } from 'lucide-react';

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

export default function AdminAlertas() {
    const { user, getAllUsers } = useAuth();
    const workspaces = getAvailableWorkspaces();
    const [selectedWorkspace, setSelectedWorkspace] = useState<string>(user?.workspace || 'Red Vial 6');
    const [loading, setLoading]     = useState(false);
    const [results, setResults]     = useState<AlertResult[]>([]);
    const [sent, setSent]           = useState(false);
    const [error, setError]         = useState('');

    // Obtener los usuarios de la base de datos local / autenticación
    const allUsers = typeof window !== 'undefined' ? getAllUsers() : {};

    // Filtrar usuarios ACTIVOS (no desactivados) pertenecientes al proyecto seleccionado
    const activeProjectUsers = useMemo(() => {
        return Object.entries(allUsers)
            .filter(([_, u]: [string, any]) => {
                const userWs = u.workspace || 'Red Vial 6';
                return userWs === selectedWorkspace && !u.deactivated && u.role === 'user';
            })
            .map(([key, u]: [string, any]) => ({
                username: key,
                name: u.name,
                email: u.email || `${key}@example.com`,
                phone: u.phone || '+51900000000',
                workspace: u.workspace || 'Red Vial 6'
            }));
    }, [allUsers, selectedWorkspace]);

    // Usuarios desactivados de este proyecto (para visualización informativa de exclusión)
    const inactiveProjectUsers = useMemo(() => {
        return Object.entries(allUsers)
            .filter(([_, u]: [string, any]) => {
                const userWs = u.workspace || 'Red Vial 6';
                return userWs === selectedWorkspace && !!u.deactivated;
            })
            .map(([key, u]: [string, any]) => ({
                username: key,
                name: u.name
            }));
    }, [allUsers, selectedWorkspace]);

    const handleEnviarAlertas = async () => {
        if (activeProjectUsers.length === 0) {
            setError(`No hay usuarios activos con rol inspector en el proyecto "${selectedWorkspace}".`);
            return;
        }

        setLoading(true);
        setError('');
        setResults([]);
        setSent(false);

        try {
            const res = await fetch('/api/send-alerts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ssoma_cron_2026`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    workspace: selectedWorkspace,
                    users: activeProjectUsers
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
                        <p className="admin-subtitle">Recordatorios diarios de cumplimiento — Solo personal activo</p>
                    </div>
                </div>

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
                            <p className="info-value">{CC.length} supervisores</p>
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

                {/* Usuarios destinatarios (SOLO ACTIVOS) */}
                <div className="usuario-list">
                    <div className="flex items-center justify-between mb-2">
                        <p className="section-label">Destinatarios Activos ({selectedWorkspace})</p>
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                            {activeProjectUsers.length} habilitados
                        </span>
                    </div>

                    {activeProjectUsers.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                            No hay inspectores activos asignados a este proyecto.
                        </div>
                    ) : (
                        activeProjectUsers.map((u, i) => (
                            <div key={i} className="usuario-row">
                                <div className="usuario-avatar">{u.name.charAt(0)}</div>
                                <div className="usuario-info">
                                    <div className="flex items-center gap-1.5">
                                        <p className="usuario-name">{u.name}</p>
                                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.2 rounded font-bold">
                                            Activo
                                        </span>
                                    </div>
                                    <p className="usuario-email">{u.email}</p>
                                </div>
                                {results.length > 0 && (() => {
                                    const r = results.find(res => res.user === u.name);
                                    if (!r) return null;
                                    return r.status === 'sent'
                                        ? <span className="badge badge-sent">Alerta Enviada</span>
                                        : r.status === 'ok'
                                        ? <span className="badge badge-ok">Al Día</span>
                                        : <span className="badge badge-error">Error</span>;
                                })()}
                            </div>
                        ))
                    )}

                    {/* Exclusión de usuarios desactivados */}
                    {inactiveProjectUsers.length > 0 && (
                        <div className="mt-3 p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/20 flex items-center justify-between">
                            <span className="text-[11px] text-rose-400 flex items-center gap-1.5 font-medium">
                                <span>⛔</span> {inactiveProjectUsers.length} usuario(s) desactivado(s) excluidos de alertas
                            </span>
                            <span className="text-[10px] text-rose-500 font-mono">
                                {inactiveProjectUsers.map(x => x.name.split(' ')[0]).join(', ')}
                            </span>
                        </div>
                    )}
                </div>

                {/* CC */}
                <div className="cc-section">
                    <p className="section-label">Con copia a (Supervisión)</p>
                    <div className="cc-list">
                        {CC.map((email, i) => (
                            <span key={i} className="cc-chip">{email}</span>
                        ))}
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
                                        title="Enviar recordatorio por WhatsApp"
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
                    Las alertas se evalúan estrictamente dentro de los registros y metas de <strong>{selectedWorkspace}</strong>
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
                    display: flex; align-items: center; gap: 12px;
                    padding: 10px 14px; border-radius: 10px; margin-bottom: 6px;
                    background: rgba(2,6,23,0.4); border: 1px solid rgba(255,255,255,0.04);
                }

                .usuario-avatar {
                    width: 32px; height: 32px; border-radius: 50%;
                    background: #1e293b; color: #10b981; font-weight: 700; font-size: 13px;
                    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
                }

                .usuario-info { flex: 1; min-width: 0; }
                .usuario-name { font-size: 13px; font-weight: 600; color: #f1f5f9; margin: 0; }
                .usuario-email { font-size: 11px; color: #64748b; margin: 0; }

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
