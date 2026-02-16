"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Settings, Plus, Trash2, Save, User, MapPin, Leaf, RotateCcw, CloudDownload, HardDrive, Loader2 } from 'lucide-react';
import { SSOMA_LOCATIONS } from '@/lib/locations';

const INITIAL_ZONES = SSOMA_LOCATIONS;

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
    const { user, getAllUsers, saveUser, deleteUser } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    // Master Data States
    const [usersList, setUsersList] = useState<Record<string, any>>({});
    const [zones, setZones] = useState<string[]>(INITIAL_ZONES);
    const [pmaCategories, setPmaCategories] = useState<any[]>(DEFAULT_PMA_CATEGORIES);

    // User Inputs
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'user' | 'manager' | 'developer'>('user');
    const [isEditingUser, setIsEditingUser] = useState(false);

    // Zone Inputs
    const [zoneName, setZoneName] = useState('');
    const [editingZoneIndex, setEditingZoneIndex] = useState<number | null>(null);

    // PMA Inputs
    const [pmaLabel, setPmaLabel] = useState('');
    const [pmaHint, setPmaHint] = useState('');
    const [editingPmaId, setEditingPmaId] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        // Protect Route
        if (user && user.role !== 'developer') {
            router.push('/');
        }

        // Load Data
        const loadData = async () => {
            if (typeof window !== 'undefined') {
                // Users
                setUsersList(getAllUsers());

                // Zones
                const storedZones = localStorage.getItem('ssoma_zones');
                if (storedZones) setZones(JSON.parse(storedZones));

                // PMA Categories - Cloud first, then localStorage
                try {
                    const res = await fetch('/api/pma-categories');
                    const data = await res.json();
                    if (data.success && data.categories.length > 0) {
                        setPmaCategories(data.categories);
                        localStorage.setItem('ssoma_pma_categories', JSON.stringify(data.categories));
                    } else {
                        const storedPma = localStorage.getItem('ssoma_pma_categories');
                        if (storedPma) setPmaCategories(JSON.parse(storedPma));
                    }
                } catch (e) {
                    console.warn('Could not fetch PMA categories from cloud:', e);
                    const storedPma = localStorage.getItem('ssoma_pma_categories');
                    if (storedPma) setPmaCategories(JSON.parse(storedPma));
                }
            }
            setLoading(false);
        };
        loadData();
    }, [user, router, getAllUsers]);



    // --- SYNC LOGIC ---
    const handleSyncDocs = async () => {
        if (!confirm('Esta acción descargará todos los archivos de la Nube (Vercel) a tu Disco Local D: y los eliminará de internet para liberar espacio.\n\nIMPORTANTE: Esto debe hacerse solo desde la PC principal (Servidor). ¿Continuar?')) {
            return;
        }

        setSyncing(true);
        try {
            const res = await fetch('/api/sync-blobs', { method: 'POST' });
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            alert(`Sincronización Completa:\n- Archivos descargados: ${data.downloaded}\n- Espacio liberado: ${data.freedMB} MB\n\nPuede ver los archivos en: D:/Evidencia del sistema de gestion CASA 2026/Descargas_Nube`);
        } catch (error: any) {
            alert('Error en sincronización: ' + error.message);
        } finally {
            setSyncing(false);
        }
    };

    // --- ZONES LOGIC ---
    const saveZones = (newList: string[]) => {
        setZones(newList);
        localStorage.setItem('ssoma_zones', JSON.stringify(newList));
    };

    const handleSaveZone = () => {
        if (!zoneName.trim()) return;

        if (editingZoneIndex !== null) {
            const newList = [...zones];
            newList[editingZoneIndex] = zoneName.trim();
            saveZones(newList);
            setEditingZoneIndex(null);
        } else {
            saveZones([...zones, zoneName.trim()]);
        }
        setZoneName('');
    };

    const handleEditZone = (index: number) => {
        setZoneName(zones[index]);
        setEditingZoneIndex(index);
    };

    const handleRemoveZone = (index: number) => {
        if (confirm('¿Eliminar esta zona?')) {
            const newList = [...zones];
            newList.splice(index, 1);
            saveZones(newList);
            if (editingZoneIndex === index) {
                setEditingZoneIndex(null);
                setZoneName('');
            }
        }
    };

    // --- PMA CATEGORIES LOGIC ---
    const savePmaCategories = (newList: any[]) => {
        setPmaCategories(newList);
        localStorage.setItem('ssoma_pma_categories', JSON.stringify(newList));
        // Sync to cloud (fire and forget)
        fetch('/api/pma-categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categories: newList })
        }).catch(e => console.warn('PMA categories cloud sync failed:', e));
    };

    const handleSavePma = () => {
        if (!pmaLabel.trim()) return;

        if (editingPmaId) {
            // Edit
            const newList = pmaCategories.map(c => {
                if (c.id === editingPmaId) {
                    return { ...c, label: pmaLabel, hint: pmaHint };
                }
                return c;
            });
            savePmaCategories(newList);
            setEditingPmaId(null);
        } else {
            // Create
            const newCat = {
                id: `CUSTOM_${Date.now()}`,
                label: pmaLabel,
                hint: pmaHint
            };
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
        if (confirm('¿Eliminar esta categoría del PMA?')) {
            const newList = pmaCategories.filter(c => c.id !== id);
            savePmaCategories(newList);
            if (editingPmaId === id) {
                setEditingPmaId(null);
                setPmaLabel('');
                setPmaHint('');
            }
        }
    };

    // --- USERS LOGIC ---
    const handleSaveUser = () => {
        if (!username.trim() || !fullName.trim() || !password.trim()) {
            alert('Complete todos los campos');
            return;
        }

        saveUser(username, {
            username,
            name: fullName,
            password: password,
            role: role,
            email: `${username}@example.com`
        });

        setUsersList(getAllUsers());

        // Sync with Responsibles
        const all = getAllUsers();
        // Manual immediate sync logic if needed, or rely on next render
        const newUser = {
            username,
            name: fullName,
            password,
            role,
            email: `${username}@example.com`
        };
        const updatedAll = { ...all, [username]: newUser };

        const responsibleNames = Object.values(updatedAll)
            .filter((u: any) => u.role !== 'manager')
            .map((u: any) => u.name);

        localStorage.setItem('ssoma_responsibles', JSON.stringify(responsibleNames));

        setUsername('');
        setFullName('');
        setPassword('');
        setRole('user');
        setIsEditingUser(false);
    };

    const handleEditUser = (key: string) => {
        const u = usersList[key];
        if (u) {
            setUsername(key);
            setFullName(u.name);
            setPassword(u.password || '');
            setRole(u.role);
            setIsEditingUser(true);
        }
    };

    const handleDeleteUser = (key: string) => {
        if (key === 'jose.cancino') {
            alert('No se puede eliminar al desarrollador principal.');
            return;
        }
        if (window.confirm(`¿Estás seguro de eliminar el usuario "${key}"?`)) {
            deleteUser(key);

            // Manual sync logic
            const currentUsers = JSON.parse(localStorage.getItem('ssoma_users_db') || '{}');
            if (currentUsers[key]) {
                delete currentUsers[key];
                localStorage.setItem('ssoma_users_db', JSON.stringify(currentUsers));
            }

            const updatedUsersList = { ...usersList };
            delete updatedUsersList[key];
            const responsibleNames = Object.values(updatedUsersList)
                .filter((u: any) => u.role !== 'manager')
                .map((u: any) => u.name);
            localStorage.setItem('ssoma_responsibles', JSON.stringify(responsibleNames));

            setUsersList(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    const resetDefaults = () => {
        if (confirm('Restaurar valores de fábrica (Usuarios, Zonas, PMA)?')) {
            localStorage.removeItem('ssoma_users_db');
            localStorage.removeItem('ssoma_zones');
            localStorage.removeItem('ssoma_pma_categories');
            location.reload();
        }
    };

    if (loading || (user?.role !== 'developer')) return null;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
            <div className="max-w-6xl mx-auto p-6 space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tighter mb-2 flex items-center gap-3">
                            <Settings className="text-pink-500" size={32} />
                            Configuración de Maestros
                        </h1>
                        <p className="text-slate-400 font-medium">Gestión de Usuarios, Accesos, Lugares y Categorías</p>
                    </div>
                    <button
                        onClick={resetDefaults}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-red-500 transition-colors text-xs font-bold uppercase tracking-wider"
                    >
                        <RotateCcw size={14} /> Restaurar Fábrica
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* USERS MANAGER */}
                    <Card className="bg-slate-900 border-slate-800 shadow-xl border-l-4 border-l-emerald-500 lg:col-span-2 xl:col-span-1">
                        <CardHeader className="border-b border-slate-800 pb-4">
                            <CardTitle className="text-emerald-400 font-bold flex items-center gap-2">
                                <User size={20} />
                                Gestión de Usuarios y Accesos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {/* Inputs */}
                            <div className="grid grid-cols-2 gap-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                                <div className="col-span-2 md:col-span-1 space-y-1">
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
                                <div className="col-span-2 md:col-span-1 space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-500">Nombre Completo</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Juan Perez"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div className="col-span-2 md:col-span-1 space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-500">Contraseña</label>
                                    <input
                                        type="text"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Clave de acceso"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none font-mono text-emerald-400"
                                    />
                                </div>
                                <div className="col-span-2 md:col-span-1 space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-500">Rol</label>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as any)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                                    >
                                        <option value="user">Usuario (Inspector)</option>
                                        <option value="manager">Gerencia</option>
                                        <option value="developer">Desarrollador</option>
                                    </select>
                                </div>
                                <div className="col-span-2 pt-2">
                                    <button
                                        onClick={handleSaveUser}
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isEditingUser ? <Save size={16} /> : <Plus size={16} />}
                                        {isEditingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                                    </button>
                                    {isEditingUser && (
                                        <button
                                            onClick={() => { setIsEditingUser(false); setUsername(''); setFullName(''); setPassword(''); }}
                                            className="w-full mt-2 text-slate-500 hover:text-white text-xs underline"
                                        >
                                            Cancelar Edición
                                        </button>
                                    )}
                                </div>
                            </div>
                            {/* List */}
                            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {Object.entries(usersList).map(([key, u]: [string, any]) => (
                                    <div key={key} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-200">{u.name}</span>
                                            <span className="text-xs text-slate-500 font-mono">ID: {key}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] uppercase px-2 py-0.5 rounded border ${u.role === 'developer' ? 'border-pink-500/30 text-pink-500' : u.role === 'manager' ? 'border-purple-500/30 text-purple-500' : 'border-slate-700 text-slate-500'}`}>
                                                {u.role}
                                            </span>
                                            <button onClick={() => handleEditUser(key)} className="p-1.5 bg-slate-900 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><Settings size={14} /></button>
                                            {u.role !== 'developer' && (
                                                <button onClick={() => handleDeleteUser(key)} className="p-1.5 bg-slate-900 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"><Trash2 size={14} /></button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-8 lg:col-span-2 xl:col-span-1">

                        {/* ZONES MANAGER */}
                        <Card className="bg-slate-900 border-slate-800 shadow-xl border-l-4 border-l-indigo-500">
                            <CardHeader className="border-b border-slate-800 pb-4">
                                <CardTitle className="text-indigo-400 font-bold flex items-center gap-2">
                                    <MapPin size={20} />
                                    Zonas y Lugares
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={zoneName}
                                        onChange={(e) => setZoneName(e.target.value)}
                                        placeholder="Nombre de la Zona..."
                                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveZone()}
                                    />
                                    <button
                                        onClick={handleSaveZone}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-colors"
                                    >
                                        {editingZoneIndex !== null ? <Save size={20} /> : <Plus size={20} />}
                                    </button>
                                </div>
                                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                    {zones.map((z, i) => (
                                        <div key={i} className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800 group hover:border-indigo-500/30 transition-colors">
                                            <span className="text-sm font-medium text-slate-300">{z}</span>
                                            <div className="flex gap-1">
                                                <button onClick={() => handleEditZone(i)} className="p-1.5 text-slate-600 hover:text-indigo-400 opacity-0 group-hover:opacity-100"><Settings size={14} /></button>
                                                <button onClick={() => handleRemoveZone(i)} className="p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

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


                        {/* BACKUP & RESTORE DATA */}
                        <Card className="bg-slate-900 border-slate-800 shadow-xl border-l-4 border-l-purple-500">
                            <CardHeader className="border-b border-slate-800 pb-4">
                                <CardTitle className="text-purple-400 font-bold flex items-center gap-2">
                                    <HardDrive size={20} />
                                    Respaldo de Datos (Backup)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <p className="text-sm text-slate-400">
                                    Descargue una copia de seguridad de todos los datos actuales (Inspecciones, HHC, Programa Anual) o restaure una copia previa.
                                    <br /><span className="text-amber-400 font-bold text-xs mt-1 block">Use esto para mover datos de Local a Producción.</span>
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => {
                                            const dataToBackup: Record<string, any> = {};
                                            // List of keys to backup
                                            const keys = [
                                                'hhc_records',
                                                'inspections_records',
                                                'annual_program_data',
                                                'dashboard_data_v1',
                                                'monthly_training_program',
                                                'accidentability_stats_2026',
                                                'ssoma_users_db',
                                                'ssoma_zones',
                                                'ssoma_pma_categories',
                                                'pma_evidences',
                                                'monthly_hht_inputs'
                                            ];

                                            keys.forEach(k => {
                                                const val = localStorage.getItem(k);
                                                if (val) dataToBackup[k] = JSON.parse(val);
                                            });

                                            const blob = new Blob([JSON.stringify(dataToBackup, null, 2)], { type: 'application/json' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `ssoma_backup_${new Date().toISOString().split('T')[0]}.json`;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            URL.revokeObjectURL(url);
                                        }}
                                        className="w-full bg-purple-900/50 hover:bg-purple-900 border border-purple-700/50 hover:border-purple-500 text-purple-200 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                                    >
                                        <CloudDownload size={18} />
                                        Descargar Backup
                                    </button>

                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".json"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                if (!confirm("⚠️ ADVERTENCIA: Restaurar un backup SOBREESCRIBIRÁ todos los datos actuales. ¿Estás seguro de continuar?")) {
                                                    e.target.value = '';
                                                    return;
                                                }

                                                const reader = new FileReader();
                                                reader.onload = (event) => {
                                                    try {
                                                        const json = JSON.parse(event.target?.result as string);

                                                        // Restore keys
                                                        Object.keys(json).forEach(key => {
                                                            localStorage.setItem(key, JSON.stringify(json[key]));
                                                        });

                                                        alert("✅ Datos restaurados correctamente. La página se recargará.");
                                                        window.location.reload();
                                                    } catch (err) {
                                                        alert("❌ Error al leer el archivo de respaldo.");
                                                        console.error(err);
                                                    }
                                                };
                                                reader.readAsText(file);
                                            }}
                                            className="hidden"
                                            id="restore-input"
                                        />
                                        <label
                                            htmlFor="restore-input"
                                            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-400 text-slate-200 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <RotateCcw size={18} />
                                            Restaurar Backup
                                        </label>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* CLOUD SYNC CARD */}
                        <Card className="bg-slate-900 border-slate-800 shadow-xl border-l-4 border-l-cyan-500">
                            <CardHeader className="border-b border-slate-800 pb-4">
                                <CardTitle className="text-cyan-400 font-bold flex items-center gap-2">
                                    <CloudDownload size={20} />
                                    Respaldo y Limpieza de Nube
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <p className="text-sm text-slate-400">
                                    El plan gratuito de nube permite solo <span className="text-white font-bold">250 MB</span>.
                                    Use esta herramienta para descargar las evidencias a su disco local y liberar espacio en la nube.
                                </p>

                                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex items-center gap-4">
                                    <HardDrive className="text-slate-500" size={32} />
                                    <div className="flex-1">
                                        <div className="text-xs font-bold text-slate-500 uppercase">Destino Local</div>
                                        <div className="text-sm text-emerald-400 font-mono break-all">D:/Evidencia del sistema de gestion CASA 2026/Descargas_Nube</div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSyncDocs}
                                    disabled={syncing}
                                    className="w-full bg-cyan-900/50 hover:bg-cyan-900 border border-cyan-700/50 hover:border-cyan-500 text-cyan-200 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                                >
                                    {syncing ? <Loader2 size={18} className="animate-spin" /> : <CloudDownload size={18} />}
                                    {syncing ? 'Sincronizando...' : 'Sincronizar Nube -> PC Local'}
                                </button>
                            </CardContent>
                        </Card>

                    </div>

                </div>
            </div>
        </div>
    );
}
