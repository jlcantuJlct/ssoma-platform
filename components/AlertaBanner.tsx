'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { AlertTriangle, X, ChevronDown, ChevronUp, ExternalLink, Bell } from 'lucide-react';

// Usuarios que reciben alertas (sincronizado con send-alerts)
const ALERT_USERNAMES = [
    'jesus.villalovos',
    'jose.galliquio',
    'adrian.suarez',
    'gladis.aroste',
    'albert.chuquispuma',
];

const MODULE_LINKS: Record<string, string> = {
    'Inspecciones':   '/inspections',
    'ATS':            '/ats',
    'PETAR':          '/petar',
    'HHC':            '/',
    'Objetivos PMA':  '/pma',
    'Evidencias PMA': '/pma',
};

import { usePathname } from 'next/navigation';

export default function AlertaBanner() {
    const pathname = usePathname();
    const { user } = useAuth();

    if (pathname && pathname.startsWith('/public')) return null;
    const [pending, setPending]     = useState<string[]>([]);
    const [dismissed, setDismissed] = useState(false);
    const [expanded, setExpanded]   = useState(true);
    const [loading, setLoading]     = useState(false);

    const checkPending = useCallback(async () => {
        if (!user || !ALERT_USERNAMES.includes(user.username)) return;

        // Verificar si ya fue descartado hoy
        const dismissKey = `ssoma_alert_dismissed_${new Date().toISOString().split('T')[0]}_${user.username}`;
        if (sessionStorage.getItem(dismissKey)) {
            setDismissed(true);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/check-pending?username=${user.username}&name=${encodeURIComponent(user.name)}`);
            const data = await res.json();
            if (data.pending && data.pending.length > 0) {
                setPending(data.pending);
            }
        } catch (err) {
            console.warn('No se pudo verificar módulos pendientes:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        checkPending();
    }, [checkPending]);

    const handleDismiss = () => {
        const dismissKey = `ssoma_alert_dismissed_${new Date().toISOString().split('T')[0]}_${user?.username}`;
        sessionStorage.setItem(dismissKey, '1');
        setDismissed(true);
    };

    if (!user || !ALERT_USERNAMES.includes(user.username)) return null;
    if (dismissed || loading || pending.length === 0) return null;

    return (
        <div className="alert-banner-wrapper">
            {/* Banner principal */}
            <div className="alert-banner">
                <div className="alert-banner-stripe" />

                <div className="alert-banner-content">
                    {/* Icono + título */}
                    <div className="alert-banner-header">
                        <div className="alert-icon-wrapper">
                            <Bell size={18} className="alert-bell-icon" />
                            <span className="alert-badge">{pending.length}</span>
                        </div>
                        <div className="alert-title-block">
                            <p className="alert-title">
                                <AlertTriangle size={14} className="alert-triangle" />
                                Tienes {pending.length} módulo{pending.length > 1 ? 's' : ''} pendiente{pending.length > 1 ? 's' : ''} hoy
                            </p>
                            <p className="alert-subtitle">
                                {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                        </div>

                        <div className="alert-actions">
                            <button onClick={() => setExpanded(!expanded)} className="alert-toggle-btn" title={expanded ? 'Minimizar' : 'Ver módulos'}>
                                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            <button onClick={handleDismiss} className="alert-close-btn" title="Descartar por hoy">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Lista de módulos expandible */}
                    {expanded && (
                        <div className="alert-modules-list">
                            {pending.map((mod) => (
                                <a
                                    key={mod}
                                    href={MODULE_LINKS[mod] || '/'}
                                    className="alert-module-chip"
                                >
                                    <span className="alert-module-dot" />
                                    {mod}
                                    <ExternalLink size={11} className="alert-module-link-icon" />
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .alert-banner-wrapper {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 9999;
                    max-width: 380px;
                    width: calc(100vw - 40px);
                    animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes slideInUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }

                .alert-banner {
                    background: #0f172a;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(239, 68, 68, 0.1);
                    position: relative;
                }

                .alert-banner-stripe {
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, #ef4444, #f97316, #ef4444);
                    background-size: 200% 100%;
                    animation: shimmer 2s linear infinite;
                }

                @keyframes shimmer {
                    0%   { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }

                .alert-banner-content {
                    padding: 16px;
                }

                .alert-banner-header {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                }

                .alert-icon-wrapper {
                    position: relative;
                    flex-shrink: 0;
                    width: 40px;
                    height: 40px;
                    background: rgba(239, 68, 68, 0.15);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: pulse-ring 2s ease-in-out infinite;
                }

                @keyframes pulse-ring {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.3); }
                    50%      { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
                }

                .alert-bell-icon { color: #ef4444; }

                .alert-badge {
                    position: absolute;
                    top: -4px; right: -4px;
                    background: #ef4444;
                    color: #fff;
                    border-radius: 999px;
                    font-size: 10px;
                    font-weight: 800;
                    padding: 0 5px;
                    min-width: 16px;
                    height: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid #0f172a;
                }

                .alert-title-block { flex: 1; min-width: 0; }

                .alert-title {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin: 0;
                    color: #fca5a5;
                    font-weight: 700;
                    font-size: 13px;
                }

                .alert-triangle { color: #f97316; flex-shrink: 0; }

                .alert-subtitle {
                    margin: 2px 0 0;
                    color: #64748b;
                    font-size: 11px;
                    text-transform: capitalize;
                }

                .alert-actions {
                    display: flex;
                    gap: 4px;
                    flex-shrink: 0;
                }

                .alert-toggle-btn,
                .alert-close-btn {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 8px;
                    color: #64748b;
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .alert-toggle-btn:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }
                .alert-close-btn:hover  { background: rgba(239,68,68,0.15); color: #ef4444; border-color: rgba(239,68,68,0.3); }

                .alert-modules-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-top: 12px;
                    padding-top: 12px;
                    border-top: 1px solid rgba(255,255,255,0.06);
                }

                .alert-module-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    color: #fca5a5;
                    font-size: 11px;
                    font-weight: 600;
                    padding: 5px 10px;
                    border-radius: 999px;
                    cursor: pointer;
                    text-decoration: none;
                    transition: all 0.15s;
                }

                .alert-module-chip:hover {
                    background: rgba(239, 68, 68, 0.2);
                    border-color: rgba(239, 68, 68, 0.4);
                    color: #fff;
                    transform: translateY(-1px);
                }

                .alert-module-dot {
                    width: 6px;
                    height: 6px;
                    background: #ef4444;
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                .alert-module-link-icon { opacity: 0.6; }
            `}</style>
        </div>
    );
}
