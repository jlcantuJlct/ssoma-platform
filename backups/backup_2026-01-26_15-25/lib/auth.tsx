"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Tipos de Usuario
export type UserRole = 'developer' | 'user' | 'manager';

export interface User {
    username: string;
    name: string;
    role: UserRole;
    email?: string;
}

// Interfaz para la lista pública de usuarios
export interface PublicUser {
    username: string;
    name: string;
}

// Configuración de Usuarios (Base de datos simulada)
// En una app real, esto vendría de una DB.
export interface FullUser extends User {
    password?: string;
}

export const INITIAL_USERS: Record<string, { password: string, name: string, role: UserRole, email: string }> = {
    'jose.cancino': {
        password: '161976Jlct',
        name: 'Jose Luis Cancino',
        role: 'developer',
        email: 'jlcancino@example.com'
    },
    'gerencia': {
        password: 'GerenciaSSO2026',
        name: 'Gerencia General',
        role: 'manager',
        email: 'gerencia@antigravity.com'
    },
    'jose.galliquio': { password: 'JGalliq@2026', name: 'Jose Galliquio', role: 'user', email: 'jgalliquio@example.com' },
    'albert.chuquisapon': { password: 'AChuqui@2026', name: 'Albert Chuquisapon', role: 'user', email: 'achuquisapon@example.com' },
    'jesus.villalogos': { password: 'JVillal@2026', name: 'Jesus Villalogos', role: 'user', email: 'jvillalogos@example.com' },
    'adrian.suarez': { password: 'ASuarez@2026', name: 'Adrian Suarez', role: 'user', email: 'asuarez@example.com' },
    'fabricio.galvez': { password: 'FGalvez@2026', name: 'Fabricio Galvez', role: 'user', email: 'fgalvez@example.com' },
    'benjy.vega': { password: 'BVega@2026', name: 'Benjy Vega', role: 'user', email: 'bvega@example.com' },
    'gladis.aroste': { password: 'GAroste@2026', name: 'Gladis Aroste', role: 'user', email: 'garoste@example.com' },
};

// Exportar lista para el Login
export const USER_LIST: PublicUser[] = Object.keys(INITIAL_USERS).map(key => ({
    username: key,
    name: INITIAL_USERS[key].name
}));

interface AuthContextType {
    user: User | null;
    login: (username: string, pass: string) => boolean;
    logout: () => void;
    sendRecoveryEmail: (username: string) => Promise<boolean>;
    updatePassword: (username: string, newPass: string) => boolean;
    recoverCredential: (username: string) => string | null;
    // New Management Methods
    getAllUsers: () => Record<string, FullUser>;
    saveUser: (username: string, userData: FullUser) => void;
    deleteUser: (username: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Inicializar usuarios desde localStorage si existe, sino usar INITIAL_USERS
    const [mockUsers, setMockUsers] = useState<typeof INITIAL_USERS>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('ssoma_users_db');
            if (stored) {
                try {
                    return JSON.parse(stored);
                } catch (e) {
                    console.error('Error parsing stored users', e);
                }
            }
        }
        return INITIAL_USERS;
    });

    const router = useRouter();
    const pathname = usePathname();

    // Persistencia de sesión simple
    useEffect(() => {
        const storedUser = localStorage.getItem('ssoma_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);

        // Force sync of static users to ensure updates in code (like password fixes) are reflected
        setMockUsers(prev => {
            const updated = { ...prev };
            let changed = false;
            Object.entries(INITIAL_USERS).forEach(([key, val]) => {
                if (JSON.stringify(updated[key]) !== JSON.stringify(val)) {
                    updated[key] = val;
                    changed = true;
                }
            });
            return changed ? updated : prev;
        });
    }, []);

    // Persistencia de usuarios (DB simulada)
    useEffect(() => {
        localStorage.setItem('ssoma_users_db', JSON.stringify(mockUsers));
    }, [mockUsers]);

    // Proteger rutas
    useEffect(() => {
        if (!loading && !user && pathname !== '/login') {
            router.push('/login');
        }
    }, [user, loading, pathname, router]);

    const login = (username: string, pass: string) => {
        const foundUser = mockUsers[username];

        if (foundUser && foundUser.password === pass) {
            const userData: User = {
                username,
                name: foundUser.name,
                role: foundUser.role,
                email: foundUser.email
            };
            setUser(userData);
            localStorage.setItem('ssoma_user', JSON.stringify(userData));
            router.push('/');
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('ssoma_user');
        router.push('/login');
    };

    // Simular envío de correo
    const sendRecoveryEmail = async (username: string) => {
        return new Promise<boolean>((resolve) => {
            const user = mockUsers[username];
            if (user) {
                console.log(`[SIMULACION] Enviando credenciales a ${user.email} para usuario ${username}`);
                setTimeout(() => resolve(true), 1500);
            } else {
                resolve(false);
            }
        });
    };

    // Recuperar credencial visualmente (Sin validar correo, solicitado por usuario)
    const recoverCredential = (username: string) => {
        const user = mockUsers[username];
        if (user) {
            return user.password;
        }
        return null;
    };

    // Actualizar contraseña (Simulación)
    const updatePassword = (username: string, newPass: string) => {
        if (mockUsers[username]) {
            setMockUsers(prev => ({
                ...prev,
                [username]: {
                    ...prev[username],
                    password: newPass
                }
            }));
            return true;
        }
        return false;
    };

    // Gestión de Usuarios (Admin/Dev)
    const getAllUsers = () => mockUsers as Record<string, FullUser>;

    const saveUser = (username: string, userData: FullUser) => {
        setMockUsers(prev => ({
            ...prev,
            [username]: {
                name: userData.name,
                role: userData.role,
                email: userData.email || '',
                password: userData.password || prev[username]?.password || 'default123'
            }
        }));
    };

    const deleteUser = (username: string) => {
        setMockUsers(prev => {
            const next = { ...prev };
            delete next[username];
            return next;
        });
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            sendRecoveryEmail,
            updatePassword,
            recoverCredential,
            getAllUsers,
            saveUser,
            deleteUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
