"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
    Settings, Plus, Trash2, Save, User, MapPin, Leaf, RotateCcw, 
    CloudDownload, HardDrive, Loader2, Bell, BookOpen, Briefcase, 
    Layers, Users, CheckCircle2, ChevronRight, UserCheck, UserX,
    Key, Eye, EyeOff, Copy
} from 'lucide-react';
import AdminAlertas from '@/components/AdminAlertas';
import ContactsManager from '@/components/ContactsManager';
import { 
    getAvailableWorkspaces, 
    addAvailableWorkspace, 
    getLocationsForWorkspace, 
    saveLocationsForWorkspace 
} from '@/lib/locations';

const DEFAULT_PMA_CATEGORIES = [
    {
        id: "ACCESS_MAINTENANCE",
        label: "Mantenimiento de Accesos (Cantera, DME, Plantas, Fuentes de Agua)",
        hint: "Debe evidenciar: Señalización, Limpieza, Delimitación y Riego."
    },
    {
        id: "PORTABLE_TOILETS",
        label: "Alquiler y Mantenimiento de Sanitarios Portátiles",
        hint: "Subir imágenes de los SSHH (hasta 9 fotos)."
    },
    {
        id: "SOLID_WASTE",
        label: "Batería de Residuos Sólidos con TPA + Reposición (10%)",
        hint: "Fotos deben mostrar: Tapas de colores, techo y piso."
    },
    {
        id: "INTERNAL_COLLECTION",
        label: "Recojo y Almacenamiento Interno",
        hint: "Evidenciar: Retiro de residuos de cilindros, carguío al camión, pesado e ingreso a acopio."
    }
];

export default function SettingsPage() {
    const { user, getAllUsers, saveUser, deleteUser, toggleUserStatus } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    // Workspaces
    const [workspaces, setWorkspaces] = useState<string[]>([]);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<string>('Red Vial 6');

    // Users
    const [usersList, setUsersList] = useState<Record<string, any>>({});
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'user' | 'manager' | 'developer'>('user');
    const [userWorkspace, setUserWorkspace] = useState<string>('Red Vial 6');
    const [userDeactivated, setUserDeactivated] = useState<boolean>(false);
    const [isEditingUser, setIsEditingUser] = useState(false);
    const [showPasswords, setShowPasswords] = useState<boolean>(true);

    // Locations per project
    const [zonesByProject, setZonesByProject] = useState<Record<string, string[]>>({});
    const [zoneName, setZoneName] = useState('');
    const [zoneProject, setZoneProject] = useState<string>('Red Vial 6');
    const [editingZoneIndex, setEditingZoneIndex] = useState<{ project: string; index: number } | null>(null);

    // PMA Categories
    const [pmaCategories, setPmaCategories] = useState<any[]>(DEFAULT_PMA_CATEGORIES);
    const [pmaLabel, setPmaLabel] = useState('');
    const [pmaHint, setPmaHint] = useState('');
    const [editingPmaId, setEditingPmaId] = useState<string | null>(null);

    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        // Protect Route
        if (user && user.role !== 'developer' && user.role !== 'manager') {
            router.push('/');
        }

        const wsList = getAvailableWorkspaces();
        setWorkspaces(wsList);
        if (wsList.length > 0) {
            setActiveWorkspaceTab(wsList[0]);
            setUserWorkspace(wsList[0]);
            setZoneProject(wsList[0]);
        }

        // Cargar zonas para cada proyecto
        const initialZones: Record<string, string[]> = {};
        wsList.forEach(ws => {
            initialZones[ws] = getLocationsForWorkspace(ws);
        });
        setZonesByProject(initialZones);

        // Users
        setUsersList(getAllUsers());

        // PMA Categories
        try {
            fetch('/api/pma-categories')
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.categories.length > 0) {
                        setPmaCategories(data.categories);
                    } else {
                        const storedPma = localStorage.getItem('ssoma_pma_categories');
                        if (storedPma) setPmaCategories(JSON.parse(storedPma));
                    }
                })
                .catch(() => {
                    const storedPma = localStorage.getItem('ssoma_pma_categories');
                    if (storedPma) setPmaCategories(JSON.parse(storedPma));
                });
        } catch (e) {}

        setLoading(false);
    }, [user, router, getAllUsers]);

    // Crear Proyecto
    const handleAddWorkspace = () => {
        if (!newWorkspaceName.trim()) return;
        const trimmed = newWorkspaceName.trim();
        const updated = addAvailableWorkspace(trimmed);
        setWorkspaces(updated);
        setActiveWorkspaceTab(trimmed);
        setUserWorkspace(trimmed);
        setZoneProject(trimmed);
        setZonesByProject(prev => ({
            ...prev,
            [trimmed]: getLocationsForWorkspace(trimmed)
        }));
        setNewWorkspaceName('');
        alert(`✅ Proyecto "${trimmed}" creado con éxito. Ahora puedes asignarle usuarios y lugares.`);
    };

    // Guardar / Editar Usuario
    const handleSaveUser = () => {
        if (!username.trim() || !fullName.trim() || !password.trim()) {
            alert('Complete todos los campos obligatorios.');
            return;
        }

        saveUser(username, {
            username,
            name: fullName,
            password: password,
            role: role,
            workspace: userWorkspace,
            deactivated: userDeactivated,
            email: `${username}@example.com`
        });

        const all = getAllUsers();
        setUsersList(all);

        // Sync with Responsibles (solo activos)
        const responsibleNames = Object.values(all)
            .filter((u: any) => u.role !== 'manager' && !u.deactivated)
            .map((u: any) => u.name);

        localStorage.setItem('ssoma_responsibles', JSON.stringify(responsibleNames));

        setUsername('');
        setFullName('');
        setPassword('');
        setRole('user');
        setUserDeactivated(false);
        setIsEditingUser(false);
    };

    const handleEditUser = (key: string) => {
        const u = usersList[key];
        if (u) {
            setUsername(key);
            setFullName(u.name);
            setPassword(u.password || '');
            setRole(u.role);
            setUserWorkspace(u.workspace || activeWorkspaceTab);
            setUserDeactivated(!!u.deactivated);
            setIsEditingUser(true);
        }
    };

    const handleToggleUserStatus = (key: string) => {
        if (key === 'jose.cancino') {
            alert('No se puede desactivar al desarrollador principal.');
            return;
        }
        toggleUserStatus(key);
        const all = getAllUsers();
        setUsersList(all);
    };

    const handleDeleteUser = (key: string) => {
        if (key === 'jose.cancino') {
            alert('No se puede eliminar al desarrollador principal.');
            return;
        }
        if (window.confirm(`¿Estás seguro de eliminar el usuario "${key}"?`)) {
            deleteUser(key);
            const currentUsers = JSON.parse(localStorage.getItem('ssoma_users_db') || '{}');
            if (currentUsers[key]) {
                delete currentUsers[key];
                localStorage.setItem('ssoma_users_db', JSON.stringify(currentUsers));
            }

            const updatedUsersList = { ...usersList };
            delete updatedUsersList[key];
            setUsersList(updatedUsersList);
        }
    };

    // Zonas por Proyecto
    const handleSaveZone = () => {
        if (!zoneName.trim() || !zoneProject) return;

        const currentList = zonesByProject[zoneProject] || [];
        let updatedList: string[];

        if (editingZoneIndex && editingZoneIndex.project === zoneProject) {
            updatedList = [...currentList];
            updatedList[editingZoneIndex.index] = zoneName.trim();
            setEditingZoneIndex(null);
        } else {
            updatedList = [...currentList, zoneName.trim()];
        }

        saveLocationsForWorkspace(zoneProject, updatedList);
        setZonesByProject(prev => ({ ...prev, [zoneProject]: updatedList }));
        setZoneName('');
    };

    const handleEditZone = (project: string, index: number) => {
        const item = zonesByProject[project]?.[index];
        if (item) {
            setZoneName(item);
            setZoneProject(project);
            setEditingZoneIndex({ project, index });
        }
    };

    const handleRemoveZone = (project: string, index: number) => {
        if (confirm(`¿Eliminar este lugar de ${project}?`)) {
            const currentList = zonesByProject[project] || [];
            const updated = [...currentList];
            updated.splice(index, 1);
            saveLocationsForWorkspace(project, updated);
            setZonesByProject(prev => ({ ...prev, [project]: updated }));
            if (editingZoneIndex?.project === project && editingZoneIndex.index === index) {
                setEditingZoneIndex(null);
                setZoneName('');
            }
        }
    };

    // PMA Categories
    const savePmaCategories = (newList: any[]) => {
        setPmaCategories(newList);
        localStorage.setItem('ssoma_pma_categories', JSON.stringify(newList));
        fetch('/api/pma-categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categories: newList })
        }).catch(e => console.warn('PMA categories cloud sync failed:', e));
    };

    const handleSavePma = () => {
        if (!pmaLabel.trim()) return;

        if (editingPmaId) {
            const newList = pmaCategories.map(c => c.id === editingPmaId ? { ...c, label: pmaLabel, hint: pmaHint } : c);
            savePmaCategories(newList);
            setEditingPmaId(null);
        } else {
            const newCat = { id: `CUSTOM_${Date.now()}`, label: pmaLabel, hint: pmaHint };
            savePmaCategories([...pmaCategories, newCat]);
        }
        setPmaLabel('');
        setPmaHint('');
    };

    const handleEditPma = (id: string) => {
        const cat = pmaCategories.find(c => c.id === id);
        if (cat) {
            setPmaLabel(cat.label);
            setPmaHint(cat.hint || '');
            setEditingPmaId(id);
        }
    };

    const handleDeletePma = (id: string) => {
        if (confirm('¿Eliminar esta categoría?')) {
            const newList = pmaCategories.filter(c => c.id !== id);
            savePmaCategories(newList);
        }
    };

    // Separar usuarios por proyecto
    const usersByProject: Record<string, [string, any][]> = {};
    workspaces.forEach(ws => {
        usersByProject[ws] = [];
    });

    Object.entries(usersList).forEach(([key, u]: [string, any]) => {
        const ws = u.workspace || 'Red Vial 6';
        if (!usersByProject[ws]) {
            usersByProject[ws] = [];
        }
        usersByProject[ws].push([key, u]);
    });

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">
                <Loader2 className="animate-spin text-emerald-500 mr-2" size={24} />
                Cargando Configuración de Maestros...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
                            <Settings className="text-emerald-400 animate-spin-slow" size={32} />
                            Configuración de Maestros
                        </h1>
                        <p className="text-xs md:text-sm text-slate-400 mt-1">
                            Administración Multi-Proyecto: Proyectos, Usuarios, Lugares y Categorías independientes
                        </p>
                    </div>
                </div>

                {/* 1. SECCIÓN: GESTIÓN DE PROYECTOS (CREAR NUEVO PROYECTO) */}
                <Card className="bg-slate-900 border-slate-800 shadow-xl border-l-4 border-l-cyan-500">
                    <CardHeader className="border-b border-slate-800 pb-4">
                        <CardTitle className="text-cyan-400 font-bold flex items-center gap-2">
                            <Briefcase size={20} />
                            Gestión de Proyectos Activos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                value={newWorkspaceName}
                                onChange={(e) => setNewWorkspaceName(e.target.value)}
                                placeholder="Nombre del nuevo proyecto (ej. Autopista del Sol, Tramo 5)..."
                                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:border-cyan-500 outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddWorkspace()}
                            />
                            <button
                                onClick={handleAddWorkspace}
                                className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus size={16} /> Crear Proyecto
                            </button>
                        </div>

                        {/* Píldoras de proyectos existentes */}
                        <div className="flex flex-wrap gap-2 pt-2">
                            {workspaces.map(ws => (
                                <div
                                    key={ws}
                                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 transition-all ${
                                        activeWorkspaceTab === ws
                                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                                    }`}
                                >
                                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                                    {ws}
                                    <span className="text-[10px] text-slate-500 font-mono">
                                        ({usersByProject[ws]?.length || 0} usuarios)
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* 2. SECCIÓN: GESTIÓN DE USUARIOS POR PROYECTO (PANELES SEPARADOS) */}
                <Card className="bg-slate-900 border-slate-800 shadow-xl border-l-4 border-l-emerald-500">
                    <CardHeader className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-emerald-400 font-bold flex items-center gap-2">
                                <Users size={20} />
                                Gestión de Usuarios y Accesos
                            </CardTitle>
                            <p className="text-xs text-slate-400 mt-1">
                                Crea usuarios asignándoles su proyecto correspondiente. Los paneles inferiores muestran a los usuarios organizados por cada proyecto.
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-8">
                        {/* Formulario de Crear / Editar Usuario */}
                        <div className="bg-slate-950/70 p-5 rounded-xl border border-slate-800 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                    <User size={15} className="text-emerald-400" />
                                    {isEditingUser ? `Editar Usuario: ${username}` : 'Registrar Nuevo Usuario'}
                                </span>
                                {isEditingUser && (
                                    <button
                                        onClick={() => {
                                            setIsEditingUser(false);
                                            setUsername('');
                                            setFullName('');
                                            setPassword('');
                                        }}
                                        className="text-xs text-rose-400 hover:underline"
                                    >
                                        Cancelar Edición
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-500">Usuario (ID Login)</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="ej. juan.perez"
                                        disabled={isEditingUser}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none disabled:opacity-50"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-500">Nombre Completo</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Juan Perez"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-500">Contraseña</label>
                                    <input
                                        type="text"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Clave de acceso"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none font-mono text-emerald-400"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-500">Rol</label>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as any)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                                    >
                                        <option value="user">Usuario (Inspector)</option>
                                        <option value="manager">Gerencia / Manager</option>
                                        <option value="developer">Desarrollador</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-500">Proyecto Asignado (Trasladar / Asignar)</label>
                                    <select
                                        value={userWorkspace}
                                        onChange={(e) => setUserWorkspace(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                                    >
                                        {workspaces.map(ws => (
                                            <option key={ws} value={ws}>
                                                🏢 {ws}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-500">Estado de Acceso</label>
                                    <select
                                        value={userDeactivated ? "inactive" : "active"}
                                        onChange={(e) => setUserDeactivated(e.target.value === "inactive")}
                                        className={`w-full border rounded-lg px-3 py-2 text-sm outline-none font-bold ${
                                            userDeactivated 
                                                ? 'bg-rose-950/40 border-rose-600 text-rose-300' 
                                                : 'bg-emerald-950/40 border-emerald-600 text-emerald-300'
                                        }`}
                                    >
                                        <option value="active">🟢 Activo (Con Acceso)</option>
                                        <option value="inactive">🔴 Inactivo (Bloqueado)</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={handleSaveUser}
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isEditingUser ? <Save size={16} /> : <Plus size={16} />}
                                        {isEditingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* PANELES SEPARADOS LADO A LADO PARA CADA PROYECTO */}
                        <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Layers size={18} className="text-emerald-400" />
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                                        Paneles de Usuarios por Proyecto
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowPasswords(!showPasswords)}
                                    className="self-start sm:self-auto text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-600 transition-colors shadow-sm"
                                    title="Alternar visibilidad de contraseñas de usuarios"
                                >
                                    {showPasswords ? <EyeOff size={13} className="text-amber-400" /> : <Eye size={13} className="text-amber-400" />}
                                    <span className="font-medium">{showPasswords ? 'Ocultar Contraseñas' : 'Ver Contraseñas'}</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {workspaces.map(ws => {
                                    const list = usersByProject[ws] || [];
                                    const isRedVial = ws === 'Red Vial 6';
                                    const isLongitudinal = ws === 'Longitudinal tramo 4';
                                    
                                    const borderColor = isRedVial 
                                        ? 'border-blue-500/40 bg-blue-950/10' 
                                        : isLongitudinal 
                                            ? 'border-amber-500/40 bg-amber-950/10' 
                                            : 'border-emerald-500/40 bg-emerald-950/10';

                                    const badgeColor = isRedVial 
                                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                                        : isLongitudinal 
                                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';

                                    const activeUsersCount = list.filter(([_, u]: any) => !u.deactivated).length;
                                    const inactiveUsersCount = list.length - activeUsersCount;

                                    return (
                                        <div 
                                            key={ws} 
                                            className={`rounded-2xl border ${borderColor} p-4 flex flex-col space-y-3 shadow-lg`}
                                        >
                                            {/* Cabecera del Panel del Proyecto */}
                                            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-slate-100 flex items-center gap-1.5">
                                                        {isRedVial ? '🏗️' : isLongitudinal ? '🛣️' : '📁'} {ws}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                                        {activeUsersCount} activos
                                                    </span>
                                                    {inactiveUsersCount > 0 && (
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border bg-rose-500/10 text-rose-400 border-rose-500/30">
                                                            {inactiveUsersCount} inactivos
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Lista de Usuarios del Proyecto */}
                                            <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                                {list.length === 0 ? (
                                                    <div className="p-6 text-center text-xs text-slate-500 italic bg-slate-950/40 rounded-xl border border-slate-800/50">
                                                        No hay usuarios registrados en este proyecto.
                                                    </div>
                                                ) : (
                                                    list.map(([key, u]: [string, any]) => {
                                                        const isDeactivated = !!u.deactivated;
                                                        return (
                                                            <div 
                                                                key={key} 
                                                                className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                                                                    isDeactivated 
                                                                        ? 'bg-rose-950/20 border-rose-900/40 opacity-80' 
                                                                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                                                }`}
                                                            >
                                                                <div className="flex flex-col min-w-0 pr-2">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className={`text-xs font-bold truncate ${isDeactivated ? 'text-rose-300 line-through' : 'text-slate-200'}`}>
                                                                            {u.name}
                                                                        </span>
                                                                        {isDeactivated ? (
                                                                            <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded font-bold">
                                                                                ⛔ INACTIVO
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-bold">
                                                                                🟢 ACTIVO
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                        <span className="text-[10px] text-slate-500 font-mono">ID: {key}</span>
                                                                        <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded border font-mono font-bold ${
                                                                            u.role === 'developer' 
                                                                                ? 'border-pink-500/30 text-pink-400 bg-pink-500/10' 
                                                                                : u.role === 'manager' 
                                                                                    ? 'border-purple-500/30 text-purple-400 bg-purple-500/10' 
                                                                                    : 'border-slate-700 text-slate-400 bg-slate-800/50'
                                                                        }`}>
                                                                            {u.role}
                                                                        </span>

                                                                        {/* CONTRASEÑA VISIBLE PARA ADMINISTRADOR */}
                                                                        <div className="flex items-center gap-1 bg-slate-900/90 border border-amber-500/30 rounded-md px-1.5 py-0.5">
                                                                            <Key size={10} className="text-amber-400 shrink-0" />
                                                                            <span className="text-[9px] text-slate-400 font-medium">Clave:</span>
                                                                            <span className="font-mono text-amber-300 font-bold text-[10px] select-all tracking-wide">
                                                                                {showPasswords ? (u.password || 'Sin clave') : '••••••••'}
                                                                            </span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    if (u.password) {
                                                                                        navigator.clipboard.writeText(u.password);
                                                                                        alert(`Contraseña copiada para ${u.name}:\n${u.password}`);
                                                                                    }
                                                                                }}
                                                                                className="text-slate-500 hover:text-amber-300 ml-0.5 p-0.5 transition-colors"
                                                                                title="Copiar contraseña"
                                                                            >
                                                                                <Copy size={10} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                                                    {/* Botón Activar / Desactivar */}
                                                                    {u.role !== 'developer' && (
                                                                        <button
                                                                            onClick={() => handleToggleUserStatus(key)}
                                                                            className={`px-2 py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ${
                                                                                isDeactivated
                                                                                    ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-400 hover:bg-emerald-800/40'
                                                                                    : 'bg-rose-950/60 border-rose-700/60 text-rose-400 hover:bg-rose-800/40'
                                                                            }`}
                                                                            title={isDeactivated ? 'Habilitar acceso al proyecto' : 'Bloquear acceso al proyecto'}
                                                                        >
                                                                            {isDeactivated ? (
                                                                                <>
                                                                                    <UserCheck size={13} />
                                                                                    <span className="text-[10px]">Activar</span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <UserX size={13} />
                                                                                    <span className="text-[10px]">Desactivar</span>
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    )}

                                                                    <button 
                                                                        onClick={() => handleEditUser(key)} 
                                                                        className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                                                        title="Editar Usuario / Trasladar Proyecto"
                                                                    >
                                                                        <Settings size={13} />
                                                                    </button>
                                                                    {u.role !== 'developer' && (
                                                                        <button 
                                                                            onClick={() => handleDeleteUser(key)} 
                                                                            className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                                                                            title="Eliminar Usuario"
                                                                        >
                                                                            <Trash2 size={13} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. SECCIÓN: GESTIÓN DE LUGARES Y ZONAS POR PROYECTO */}
                <Card className="bg-slate-900 border-slate-800 shadow-xl border-l-4 border-l-indigo-500">
                    <CardHeader className="border-b border-slate-800 pb-4">
                        <CardTitle className="text-indigo-400 font-bold flex items-center gap-2">
                            <MapPin size={20} />
                            Gestión de Lugares y Zonas por Proyecto
                        </CardTitle>
                        <p className="text-xs text-slate-400 mt-1">
                            Crea y edita los frentes, campamentos y lugares específicos para cada proyecto de forma independiente.
                        </p>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        {/* Selector de Proyecto y Formulario */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Seleccionar Proyecto</label>
                                <select
                                    value={zoneProject}
                                    onChange={(e) => setZoneProject(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                                >
                                    {workspaces.map(ws => (
                                        <option key={ws} value={ws}>🏢 {ws}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-[10px] uppercase font-bold text-slate-500">
                                    {editingZoneIndex ? 'Editar Lugar / Zona' : 'Nombre del Lugar / Frente'}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={zoneName}
                                        onChange={(e) => setZoneName(e.target.value)}
                                        placeholder={`ej. Campamento Huancavelica, PAD 2...`}
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveZone()}
                                    />
                                    <button
                                        onClick={handleSaveZone}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5"
                                    >
                                        {editingZoneIndex ? <><Save size={15} /> Guardar</> : <><Plus size={15} /> Agregar</>}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Paneles de Lugares por Proyecto (Lado a Lado) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {workspaces.map(ws => {
                                const list = zonesByProject[ws] || [];
                                return (
                                    <div key={ws} className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 flex flex-col space-y-3">
                                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                                            <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                                                📍 {ws}
                                            </span>
                                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                                                {list.length} lugares
                                            </span>
                                        </div>

                                        <div className="max-h-[250px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                                            {list.length === 0 ? (
                                                <div className="p-4 text-center text-xs text-slate-500 italic bg-slate-900/40 rounded-lg">
                                                    Sin lugares asignados
                                                </div>
                                            ) : (
                                                list.map((loc, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        className="flex items-center justify-between bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80 hover:border-indigo-500/30 transition-colors text-xs"
                                                    >
                                                        <span className="text-slate-300 truncate pr-2">{loc}</span>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <button 
                                                                onClick={() => handleEditZone(ws, idx)} 
                                                                className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
                                                                title="Editar Lugar"
                                                            >
                                                                <Settings size={13} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleRemoveZone(ws, idx)} 
                                                                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded transition-colors"
                                                                title="Eliminar Lugar"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* 4. OTRAS CONFIGURACIONES (PMA, ALERTAS, BACKUP) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* PMA CATEGORIES MANAGER */}
                    <Card className="bg-slate-900 border-slate-800 shadow-xl border-l-4 border-l-amber-500">
                        <CardHeader className="border-b border-slate-800 pb-4">
                            <CardTitle className="text-amber-400 font-bold flex items-center gap-2">
                                <Leaf size={20} />
                                Categorías PMA
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="space-y-3 p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                                <input
                                    type="text"
                                    value={pmaLabel}
                                    onChange={(e) => setPmaLabel(e.target.value)}
                                    placeholder="Nombre de la Categoría..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none"
                                />
                                <input
                                    type="text"
                                    value={pmaHint}
                                    onChange={(e) => setPmaHint(e.target.value)}
                                    placeholder="Hint / Ayuda (Opcional)..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs focus:border-amber-500 outline-none"
                                />
                                <button
                                    onClick={handleSavePma}
                                    className="w-full bg-amber-600 hover:bg-amber-500 text-white p-2 rounded-lg transition-colors flex items-center justify-center gap-2 font-bold text-xs uppercase"
                                >
                                    {editingPmaId ? <><Save size={16} /> Actualizar Categoría</> : <><Plus size={16} /> Agregar Categoría</>}
                                </button>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {pmaCategories.map((c) => (
                                    <div key={c.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 group hover:border-amber-500/30 transition-colors flex justify-between items-start">
                                        <div className='flex-1'>
                                            <p className="text-sm font-medium text-slate-300">{c.label}</p>
                                            {c.hint && <p className="text-[10px] text-slate-500 mt-1 italic">{c.hint}</p>}
                                        </div>
                                        <div className="flex gap-1 ml-2">
                                            <button onClick={() => handleEditPma(c.id)} className="p-1.5 text-slate-600 hover:text-amber-400 opacity-0 group-hover:opacity-100"><Settings size={14} /></button>
                                            <button onClick={() => handleDeletePma(c.id)} className="p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* ALERTAS EMAIL & CONTACTS */}
                    <div className="space-y-8">
                        <Card className="bg-slate-900 border-slate-800 shadow-xl border-l-4 border-l-red-500">
                            <CardHeader className="border-b border-slate-800 pb-4">
                                <CardTitle className="text-red-400 font-bold flex items-center gap-2">
                                    <Bell size={20} />
                                    Recordatorios de Módulos Pendientes (Cron)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 px-0 pb-0">
                                <AdminAlertas />
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900 border-slate-800 shadow-xl border-l-4 border-l-blue-500">
                            <CardHeader className="border-b border-slate-800 pb-4">
                                <CardTitle className="text-blue-400 font-bold flex items-center gap-2">
                                    <BookOpen size={20} />
                                    Contactos para Alertas de Inspecciones
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <ContactsManager />
                            </CardContent>
                        </Card>
                    </div>
                </div>

            </div>
        </div>
    );
}
