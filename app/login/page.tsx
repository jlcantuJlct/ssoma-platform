"use client";

import { useState, useMemo } from 'react';
import { useAuth, USER_LIST as STATIC_USER_LIST } from '@/lib/auth'; // Renamed to avoid confusion if needed, or just unused
import { Shield, Lock, User, Mail, ArrowRight, CheckCircle2, Eye, EyeOff, Copy, Key, ChevronDown } from 'lucide-react';

export default function LoginPage() {
    const { login, sendRecoveryEmail, recoverCredential, updatePassword, getAllUsers } = useAuth();

    // Dynamic User List
    const userList = useMemo(() => {
        if (getAllUsers) {
            const users = getAllUsers();
            return Object.entries(users).map(([k, v]) => ({ username: k, name: v.name }));
        }
        return STATIC_USER_LIST || [];
    }, [getAllUsers]);

    // States
    const [selectedUser, setSelectedUser] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    // Recovery States
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);

    const [newRecoveryPassword, setNewRecoveryPassword] = useState(''); // Estado para nueva clave
    const [recoveredPassword, setRecoveredPassword] = useState<string | null>(null);
    const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!selectedUser) {
            setError('Por favor seleccione un usuario.');
            return;
        }

        // ACCESO DIRECTO GERENCIA
        if (selectedUser === 'gerencia') {
            if (login('gerencia', 'access-granted-manager')) {
                return; // Redirección ocurre en login()
            }
        }

        if (!login(selectedUser, password)) {
            setError('Credenciales incorrectas. Intente nuevamente.');
        }
    };

    const handleVisualRecovery = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setRecoveredPassword(null);

        if (!selectedUser) {
            setError('Seleccione un usuario.');
            return;
        }

        // 1. Obtener Credencial (Sin validar correo)
        const currentPass = recoverCredential(selectedUser);

        if (currentPass) {
            // 2. Si hay nueva contraseña, actualizarla
            if (newRecoveryPassword) {
                updatePassword(selectedUser, newRecoveryPassword);
                setRecoveredPassword(newRecoveryPassword);
            } else {
                setRecoveredPassword(currentPass);
            }
        } else {
            setError('Usuario no encontrado.');
        }
    };

    const handleSendEmail = async () => {
        setRecoveryStatus('sending');
        const success = await sendRecoveryEmail(selectedUser);
        if (success) {
            setRecoveryStatus('sent');
        } else {
            setError('Error al enviar correo.');
            setRecoveryStatus('idle');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">

            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[80px]" />
            </div>

            <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl relative z-10 overflow-hidden transform transition-all">
                {/* Header */}
                <div className="bg-slate-950/50 p-6 md:p-8 text-center border-b border-slate-800 relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)] group">
                            <Shield className="text-emerald-500 w-8 h-8 md:w-10 md:h-10 group-hover:scale-110 transition-transform duration-500" />
                        </div>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter mb-2">DASHBOARD SSOMA</h1>
                    <p className="text-xs text-slate-500 uppercase tracking-[0.3em] font-bold">Sistema de Gestión Integral</p>
                </div>

                {/* Main Content */}
                <div className="p-6 md:p-8">
                    {!isRecoveryMode ? (
                        // LOGIN FORM
                        <form onSubmit={handleLogin} className="space-y-6">

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <User size={14} className="text-emerald-500" />
                                    Seleccionar Usuario
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedUser}
                                        onChange={(e) => setSelectedUser(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none cursor-pointer hover:bg-slate-900"
                                        required
                                    >
                                        <option value="" disabled>-- Seleccione su cuenta --</option>
                                        {userList.map(u => (
                                            <option key={u.username} value={u.username} className="bg-slate-900">
                                                {u.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={20} />
                                </div>
                            </div>

                            {/* Password Field - HIDDEN FOR GERENCIA */}
                            {selectedUser !== 'gerencia' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <Lock size={14} className="text-emerald-500" />
                                        Contraseña
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-4 pr-12 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-700"
                                            required={selectedUser !== 'gerencia'}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-500 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold p-3 rounded-lg text-center animate-shake">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] uppercase tracking-wide text-sm flex items-center justify-center gap-2 group ${selectedUser === 'gerencia'
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-900/40'
                                    : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-emerald-900/40'
                                    }`}
                            >
                                {selectedUser === 'gerencia' ? 'Acceso Gerencial Directo' : 'Iniciar Sesión'}
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>

                            <div className="text-center pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setIsRecoveryMode(true); setError(''); setRecoveredPassword(null); setNewRecoveryPassword(''); }}
                                    className="text-xs text-slate-500 hover:text-emerald-400 transition-colors font-medium underline underline-offset-4"
                                >
                                    ¿Primera vez o olvidaste tu clave?
                                </button>
                            </div>
                        </form>
                    ) : (
                        // RECOVERY / FIRST TIME FORM
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <h3 className="text-white font-bold text-lg">Configurar Acceso</h3>
                                <p className="text-slate-400 text-xs">Seleccione su usuario y cree su nueva clave.</p>
                            </div>

                            {!recoveredPassword ? (
                                <form onSubmit={handleVisualRecovery} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Usuario</label>
                                        <select
                                            value={selectedUser}
                                            onChange={(e) => setSelectedUser(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                                            required
                                        >
                                            <option value="" disabled>-- Seleccione usuario --</option>
                                            {userList.map(u => (
                                                <option key={u.username} value={u.username}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>



                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 opacity-80">
                                            <Lock size={14} className="text-orange-500" />
                                            Nueva Clave (Opcional)
                                        </label>
                                        <input
                                            type="text"
                                            value={newRecoveryPassword}
                                            onChange={(e) => setNewRecoveryPassword(e.target.value)}
                                            placeholder="Dejar vacío para mantener la actual..."
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-orange-500 transition-all text-sm placeholder:text-slate-600"
                                        />
                                    </div>

                                    {error && <p className="text-red-400 text-xs text-center font-bold bg-red-500/10 p-2 rounded">{error}</p>}

                                    <button
                                        type="submit"
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/30 transition-all text-sm flex items-center justify-center gap-2"
                                    >
                                        <Key size={16} />
                                        {newRecoveryPassword ? 'Actualizar y Ver Clave' : 'Visualizar Clave Actual'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setIsRecoveryMode(false)}
                                        className="w-full text-slate-500 hover:text-white text-xs py-2 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </form>
                            ) : (
                                // SUCCESS DISPLAY
                                <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center space-y-3">
                                        <div className="flex justify-center">
                                            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
                                                <CheckCircle2 size={20} />
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-slate-400 text-xs uppercase font-bold mb-1">Tu Clave de Acceso</p>
                                            <div className="flex items-center justify-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-2">
                                                <code className="text-emerald-400 font-mono text-lg font-bold tracking-wider">
                                                    {recoveredPassword}
                                                </code>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(recoveredPassword || '')}
                                                    className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-white transition-colors"
                                                    title="Copiar"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => { setIsRecoveryMode(false); setPassword(recoveredPassword || ''); }}
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-xs"
                                        >
                                            Ir al Login
                                        </button>
                                        <button
                                            onClick={handleSendEmail}
                                            disabled={recoveryStatus !== 'idle'}
                                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold text-xs border border-slate-700"
                                        >
                                            {recoveryStatus === 'sent' ? 'Enviado ✔' : 'Enviar a Correo'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-900 border-t border-slate-800 p-4 text-center">
                    <p className="text-[10px] text-slate-600">Acceso restringido a personal autorizado</p>
                </div>
            </div>
        </div>
    );
}
