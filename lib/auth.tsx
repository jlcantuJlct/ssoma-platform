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
    phone?: string;
    workspace?: string;
    deactivated?: boolean;
}

// Interfaz para la lista pública de usuarios
export interface PublicUser {
    username: string;
    name: string;
}

// Configuración de Usuarios (Base de datos simulada)
// En una real, esto vendría de una DB.
export interface FullUser extends User {
    password?: string;
    deactivated?: boolean;
}

export const INITIAL_USERS: Record<string, { password: string, name: string, role: UserRole, email: string, phone?: string, workspace: string, deactivated?: boolean }> = {
    'jose.cancino': {
        password: '161976Jlct',
        name: 'Jose Luis Cancino',
        role: 'developer',
        email: 'jlcancino@example.com',
        phone: '+51949260281',
        workspace: 'Red Vial 6'
    },
    'gerencia': {
        password: 'GerenciaSSO2026',
        name: 'Gerencia General',
        role: 'manager',
        email: 'gerencia@antigravity.com',
        phone: '+51900000000',
        workspace: 'Red Vial 6'
    },
    'jose.galliquio': { password: 'JGalliq@2026', name: 'Jose Galliquio Montesinos', role: 'user', email: 'josegamontesinos@gmail.com', phone: '+51986103867', workspace: 'Red Vial 6' },
    'albert.chuquispuma': { password: 'AChuqui@2026', name: 'Albert Chuquispuma Santos', role: 'user', email: 'albertscorpio99@gmail.com', phone: '+51929906173', workspace: 'Red Vial 6' },
    'jesus.villalovos': { password: 'JVillal@2026', name: 'Jesus Villalobos Levano', role: 'user', email: 'jesusvillaloboslevano4@gmail.com', phone: '+51928893280', workspace: 'Red Vial 6' },
    'adrian.suarez': { password: 'ASuarez@2026', name: 'Adrian Suarez Soto', role: 'user', email: 'adrian142005@hotmail.com', phone: '+51943697255', workspace: 'Red Vial 6' },
    'fabricio.galvez': { password: 'FGalvez@2026', name: 'Fabricio Galvez', role: 'user', email: 'fgalvez@casacontratistas.com', phone: '+51900000000', workspace: 'Red Vial 6' },
    'benjy.vega': { password: 'BVega@2026', name: 'Benjy Vega', role: 'user', email: 'bvega@casacontratistas.com', phone: '+51900000000', workspace: 'Red Vial 6' },
    'gladis.aroste': { password: 'GAroste@2026', name: 'Gladis Aroste Huertas', role: 'user', email: 'gladys.aroste123@gmail.com', phone: '+51969683799', workspace: 'Red Vial 6' },
    'brayan.pena': { password: 'BPeña@2026', name: 'Brayan Jeanpool Peña Villafuerte', role: 'user', email: '20173143@unica.edu.pe', phone: '+51971087023', deactivated: true, workspace: 'Red Vial 6' },
    'tramo4.admin': { password: 'Tramo4@2026', name: 'Admin Tramo 4', role: 'manager', email: 'tramo4@example.com', phone: '+51900000000', workspace: 'Longitudinal tramo 4' },
    'Luis.cancino': { password: '161976Jlct', name: 'Jose Luis Cancino Tueros', role: 'developer', email: 'jlcancino@example.com', phone: '+51949260281', workspace: 'Longitudinal tramo 4' },
    'A.suarez': { password: 'ASuarez@2026', name: 'Adrián Suárez Soto', role: 'user', email: 'adrian142005@hotmail.com', phone: '+51943697255', workspace: 'Longitudinal tramo 4' },
};

// Exportar lista para el Login y Selectores Activos (Solo usuarios activos)
export const USER_LIST: PublicUser[] = Object.keys(INITIAL_USERS)
    .filter(key => !(INITIAL_USERS[key] as any).deactivated)
    .map(key => ({
        username: key,
        name: INITIAL_USERS[key].name
    }));

// Exportar lista completa para Filtros e Historial (Incluye desactivados para mantener trazabilidad)
export const ALL_USER_LIST: PublicUser[] = Object.keys(INITIAL_USERS).map(key => ({
    username: key,
    name: INITIAL_USERS[key].name
}));

export const AVAILABLE_WORKSPACES = ['Red Vial 6', 'Longitudinal tramo 4'] as const;

interface AuthContextType {
    user: User | null;
    login: (username: string, pass: string) => { success: boolean; error?: string };
    logout: () => void;
    switchWorkspace: (workspace: string) => void;
    sendRecoveryEmail: (username: string) => Promise<boolean>;
    updatePassword: (username: string, newPass: string) => boolean;
    recoverCredential: (username: string) => string | null;
    // New Management Methods
    getAllUsers: () => Record<string, FullUser>;
    saveUser: (username: string, userData: FullUser) => void;
    deleteUser: (username: string) => void;
    toggleUserStatus: (username: string) => void;
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
                    const parsed = JSON.parse(stored);
                    return { ...INITIAL_USERS, ...parsed };
                } catch (e) {
                    console.error('Error parsing stored users', e);
                }
            }
        }
        return INITIAL_USERS;
    });

    const router = useRouter();
    const pathname = usePathname();

    // Persistencia de sesión simple con validación estricta de estado activo
    useEffect(() => {
        const storedUser = localStorage.getItem('ssoma_user');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                const storedDb = localStorage.getItem('ssoma_users_db');
                const usersDb = storedDb ? JSON.parse(storedDb) : INITIAL_USERS;
                const dbUser = usersDb[parsed.username] || INITIAL_USERS[parsed.username];

                // Si el usuario está desactivado, borrar su sesión completamente
                if (dbUser?.deactivated) {
                    localStorage.removeItem('ssoma_user');
                    document.cookie = 'ssoma_workspace=; path=/; max-age=0; SameSite=Lax';
                    setUser(null);
                } else {
                    setUser(parsed);
                    if (parsed.workspace) {
                        document.cookie = `ssoma_workspace=${encodeURIComponent(parsed.workspace)}; path=/; max-age=31536000; SameSite=Lax`;
                    }
                }
            } catch (e) {
                localStorage.removeItem('ssoma_user');
                setUser(null);
            }
        }
        setLoading(false);

        // Force sync of static users to ensure updates in code (like password fixes) are reflected
        setMockUsers(prev => {
            const updated = { ...prev };
            let changed = false;
            
            // 1. Update or add users from INITIAL_USERS if not customized
            Object.entries(INITIAL_USERS).forEach(([key, val]) => {
                if (!updated[key]) {
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

    // Proteger rutas y expulsar a usuarios desactivados en tiempo real
    useEffect(() => {
        const isPublicRoute = 
            pathname === '/login' || 
            pathname.startsWith('/public') || 
            pathname.startsWith('/formacion-virtual');

        if (!loading) {
            if (!user && !isPublicRoute) {
                router.push('/login');
            } else if (user) {
                // Verificar si fue desactivado mientras navegaba
                const currentRecord = mockUsers[user.username];
                if (currentRecord?.deactivated) {
                    localStorage.removeItem('ssoma_user');
                    document.cookie = 'ssoma_workspace=; path=/; max-age=0; SameSite=Lax';
                    setUser(null);
                    router.push('/login');
                }
            }
        }
    }, [user, loading, pathname, router, mockUsers]);

    const login = (username: string, pass: string): { success: boolean; error?: string } => {
        const foundUser = mockUsers[username];

        if (!foundUser) {
            return { success: false, error: 'Usuario no encontrado.' };
        }

        if (foundUser.deactivated) {
            return { 
                success: false, 
                error: 'Este usuario se encuentra DESACTIVADO. No tiene autorización para ingresar a los proyectos de la plataforma.' 
            };
        }

        if (foundUser.password !== pass) {
            return { success: false, error: 'Credenciales incorrectas. Intente nuevamente.' };
        }

        const userData: User = {
            username,
            name: foundUser.name,
            role: foundUser.role,
            email: foundUser.email,
            workspace: foundUser.workspace,
            deactivated: false
        };
        setUser(userData);
        localStorage.setItem('ssoma_user', JSON.stringify(userData));
        const ws = foundUser.workspace || 'Red Vial 6';
        document.cookie = `ssoma_workspace=${encodeURIComponent(ws)}; path=/; max-age=31536000; SameSite=Lax`;
        router.push('/');
        return { success: true };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('ssoma_user');
        document.cookie = 'ssoma_workspace=; path=/; max-age=0; SameSite=Lax';
        router.push('/login');
    };

    const switchWorkspace = (newWorkspace: string) => {
        if (!user) return;
        const updatedUser = { ...user, workspace: newWorkspace };
        setUser(updatedUser);
        localStorage.setItem('ssoma_user', JSON.stringify(updatedUser));
        document.cookie = `ssoma_workspace=${encodeURIComponent(newWorkspace)}; path=/; max-age=31536000; SameSite=Lax`;
        window.location.reload();
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
                workspace: userData.workspace || 'Red Vial 6',
                email: userData.email || '',
                phone: userData.phone || prev[username]?.phone || '+51900000000',
                password: userData.password || prev[username]?.password || 'default123',
                deactivated: userData.deactivated !== undefined ? userData.deactivated : (prev[username]?.deactivated || false)
            }
        }));
    };

    const toggleUserStatus = (username: string) => {
        setMockUsers(prev => {
            if (!prev[username]) return prev;
            const willBeDeactivated = !prev[username].deactivated;
            const updated = {
                ...prev,
                [username]: {
                    ...prev[username],
                    deactivated: willBeDeactivated
                }
            };
            // Si el usuario actualmente logueado es desactivado, forzar logout
            if (user?.username === username && willBeDeactivated) {
                localStorage.removeItem('ssoma_user');
                setUser(null);
                router.push('/login');
            }
            return updated;
        });
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
            switchWorkspace,
            sendRecoveryEmail,
            updatePassword,
            recoverCredential,
            getAllUsers,
            saveUser,
            deleteUser,
            toggleUserStatus
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
