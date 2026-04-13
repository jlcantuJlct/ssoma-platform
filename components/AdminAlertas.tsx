'use client';

import { useState } from 'react';
import { Bell, Send, CheckCircle2, AlertTriangle, Loader2, Mail, Clock, Users } from 'lucide-react';

const USUARIOS = [
    { name: 'Jesus Villalobos Levano',   email: 'jesusvillaloboslevano4@gmail.com' },
    { name: 'Jose Galliquio Montesinos', email: 'josegamontesinos@gmail.com' },
    { name: 'Adrian Suarez Soto',        email: 'adrian142005@hotmail.com' },
    { name: 'Gladys Aroste Huertas',     email: 'gladys.aroste123@gmail.com' },
    { name: 'Albert Chuquispuma Santos', email: 'albertscorpio99@gmail.com' },
];

const CC = ['jlcantu.jlct@gmail.com', 'jcancino@casacontratistas.com', 'rguerra@casacontratistas.com', 'mescobar@casacontratistas.com'];

interface AlertResult {
    user: string;
    status: 'ok' | 'sent' | 'error';
    email?: string;
    pendingModules?: string[];
    message?: string;
    error?: string;
}

export default function AdminAlertas() {
    const [loading, setLoading]     = useState(false);
    const [results, setResults]     = useState<AlertResult[]>([]);
    const [sent, setSent]           = useState(false);
    const [error, setError]         = useState('');

    const handleEnviarAlertas = async () => {
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
                        <h2 className="admin-title">Sistema de Alertas</h2>
                        <p className="admin-subtitle">Envío automático y manual de recordatorios diarios</p>
                    </div>
                </div>

                {/* Info cards */}
                <div className="admin-info-grid">
                    <div className="admin-info-card">
                        <Users size={16} className="info-icon" />
                        <div>
                            <p className="info-label">Personal activo</p>
                            <p className="info-value">{USUARIOS.length} usuarios</p>
                        </div>
                    </div>
                    <div className="admin-info-card">
                        <Mail size={16} className="info-icon" />
                        <div>
                            <p className="info-label">Copia siempre a</p>
                            <p className="info-value">{CC.length} supervisores</p>
                        </div>
                    </div>
                    <div className="admin-info-card">
                        <Clock size={16} className="info-icon" />
                        <div>
                            <p className="info-label">Auto-envío</p>
                            <p className="info-value">5:00 PM diario</p>
                        </div>
                    </div>
                </div>

                {/* Usuarios destinatarios */}
                <div className="usuario-list">
                    <p className="section-label">Destinatarios</p>
                    {USUARIOS.map((u, i) => (
                        <div key={i} className="usuario-row">
                            <div className="usuario-avatar">{u.name.charAt(0)}</div>
                            <div className="usuario-info">
                                <p className="usuario-name">{u.name}</p>
                                <p className="usuario-email">{u.email}</p>
                            </div>
                            {results.length > 0 && (() => {
                                const r = results.find(res => res.user === u.name);
                                if (!r) return null;
                                return r.status === 'sent'
                                    ? <span className="badge badge-sent">Enviado</span>
                                    : r.status === 'ok'
                                    ? <span className="badge badge-ok">Sin pendientes</span>
                                    : <span className="badge badge-error">Error</span>;
                            })()}
                        </div>
                    ))}
                </div>

                {/* CC */}
                <div className="cc-section">
                    <p className="section-label">Con copia a</p>
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
                                    ? `${totalSent} alerta${totalSent > 1 ? 's' : ''} enviada${totalSent > 1 ? 's' : ''}`
                                    : 'No hay pendientes hoy'}{totalOk > 0 ? ` · ${totalOk} sin pendientes` : ''}
                            </span>
                        </div>
                        {results.filter(r => r.pendingModules?.length).map((r, i) => (
                            <div key={i} className="result-detail">
                                <p className="result-user">{r.user}</p>
                                <div className="result-modules">
                                    {r.pendingModules?.map(m => (
                                        <span key={m} className="result-module-chip">{m}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Botón */}
                <button
                    onClick={handleEnviarAlertas}
                    disabled={loading}
                    className="btn-enviar"
                >
                    {loading
                        ? <><Loader2 size={18} className="spin" /> Verificando y enviando...</>
                        : <><Send size={18} /> Enviar Alertas Ahora</>
                    }
                </button>
                <p className="btn-note">
                    Solo se envían correos a quienes <strong>no hayan registrado</strong> información hoy
                </p>
            </div>

            <style jsx>{`
                .admin-alertas { padding: 24px; max-width: 640px; margin: 0 auto; }

                .admin-card {
                    background: #0f172a;
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 20px;
                    padding: 28px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                }

                .admin-header {
                    display: flex; align-items: center; gap: 16px;
                    margin-bottom: 24px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                }

                .admin-header-icon {
                    width: 52px; height: 52px;
                    background: rgba(16, 185, 129, 0.15);
                    border: 1px solid rgba(16,185,129,0.3);
                    border-radius: 14px;
                    display: flex; align-items: center; justify-content: center;
                    color: #10b981;
                }

                .admin-title { margin: 0; color: #f1f5f9; font-size: 18px; font-weight: 700; }
                .admin-subtitle { margin: 4px 0 0; color: #64748b; font-size: 13px; }

                .admin-info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }

                .admin-info-card {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 12px; padding: 14px;
                    display: flex; align-items: center; gap: 10px;
                }

                .info-icon { color: #10b981; flex-shrink: 0; }
                .info-label { margin: 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
                .info-value { margin: 3px 0 0; color: #e2e8f0; font-size: 13px; font-weight: 600; }

                .section-label { margin: 0 0 10px; color: #475569; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }

                .usuario-list { margin-bottom: 20px; }
                .usuario-row {
                    display: flex; align-items: center; gap: 12px;
                    padding: 10px 0;
                    border-bottom: 1px solid rgba(255,255,255,0.04);
                }
                .usuario-row:last-child { border-bottom: none; }

                .usuario-avatar {
                    width: 36px; height: 36px; flex-shrink: 0;
                    background: rgba(16,185,129,0.15);
                    border: 1px solid rgba(16,185,129,0.25);
                    border-radius: 10px;
                    display: flex; align-items: center; justify-content: center;
                    color: #10b981; font-weight: 700; font-size: 14px;
                }

                .usuario-info { flex: 1; min-width: 0; }
                .usuario-name { margin: 0; color: #e2e8f0; font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .usuario-email { margin: 2px 0 0; color: #64748b; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

                .badge { font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 999px; white-space: nowrap; }
                .badge-sent  { background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
                .badge-ok    { background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3); }
                .badge-error { background: rgba(239,68,68,0.15);  color: #f87171; border: 1px solid rgba(239,68,68,0.3); }

                .cc-section { margin-bottom: 20px; }
                .cc-list { display: flex; flex-wrap: wrap; gap: 6px; }
                .cc-chip {
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08);
                    color: #94a3b8; font-size: 11px;
                    padding: 4px 10px; border-radius: 999px;
                }

                .error-box {
                    display: flex; align-items: center; gap: 8px;
                    background: rgba(239,68,68,0.1);
                    border: 1px solid rgba(239,68,68,0.3);
                    color: #f87171; font-size: 13px; font-weight: 600;
                    padding: 12px 16px; border-radius: 10px; margin-bottom: 16px;
                }

                .results-box {
                    background: rgba(16,185,129,0.05);
                    border: 1px solid rgba(16,185,129,0.2);
                    border-radius: 12px; padding: 16px; margin-bottom: 16px;
                }

                .results-summary {
                    display: flex; align-items: center; gap: 8px;
                    color: #10b981; font-weight: 700; font-size: 14px;
                    margin-bottom: 12px;
                }
                .results-icon { flex-shrink: 0; }

                .result-detail { padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05); }
                .result-user { margin: 0 0 6px; color: #e2e8f0; font-size: 12px; font-weight: 600; }
                .result-modules { display: flex; flex-wrap: wrap; gap: 4px; }
                .result-module-chip {
                    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
                    color: #fca5a5; font-size: 11px; font-weight: 600;
                    padding: 3px 8px; border-radius: 999px;
                }

                .btn-enviar {
                    width: 100%;
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    background: linear-gradient(135deg, #059669, #047857);
                    color: #fff; font-weight: 700; font-size: 14px;
                    border: none; border-radius: 12px;
                    padding: 16px; cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 16px rgba(5,150,105,0.3);
                }
                .btn-enviar:hover:not(:disabled) { background: linear-gradient(135deg, #10b981, #059669); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(5,150,105,0.4); }
                .btn-enviar:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                .btn-note { margin: 10px 0 0; color: #475569; font-size: 12px; text-align: center; }
                .btn-note strong { color: #64748b; }
            `}</style>
        </div>
    );
}
