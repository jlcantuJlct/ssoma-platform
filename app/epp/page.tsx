"use client";

import React, { useState, useEffect } from "react";
import {
    ShieldCheck,
    Upload,
    Trash2,
    FileText,
    Eye,
    X,
    Save,
    Calendar,
    User,
    MapPin,
    Package,
    CheckCircle2,
    RotateCcw
} from "lucide-react";
import { generateFilename, getDriveViewerUrl, getInitials, sanitizeRecords, sanitizeValue, canDeleteRecord} from '@/lib/utils';
import jsPDF from 'jspdf';
import { uploadEvidence } from "@/lib/uploadClient";
import { SSOMA_LOCATIONS } from "@/lib/locations";
import { useAuth, USER_LIST } from "@/lib/auth";
import * as Categories from "@/lib/categories";
import SearchableSelect from "@/components/SearchableSelect";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

const EPP_CATALOG = [
    { label: 'Guantes de Badana - Color: Amarillo - Marca: Vulkan', unit: 'PAR' },
    { label: 'Buzo Descartable - Modelo: Safeguard - Talla: L', unit: 'UNIDAD' },
    { label: 'Buzo Descartable - Modelo: Safeguard - Talla: XL', unit: 'UNIDAD' },
    { label: 'Filtro 2091 - Modelo: P100 (Partículas) - Marca: 3M', unit: 'PAR' },
    { label: 'Tapón de Oído con Estuche - Mod: Elite Verde - Marca: Clute', unit: 'UNIDAD' },
    { label: 'Cortavientos - Modelo 1 Cara - Tela: Drill Naranja', unit: 'UNIDAD' },
    { label: 'Guantes de Jebe Calibre 35 - Modelo: Protec - Clute - Talla: 9', unit: 'PAR' },
    { label: 'Suspensión de Cinta Nylon Rachet Acolchada - Marca: Spro', unit: 'UNIDAD' },
    { label: 'Botas P. de Acero PVC - Marca: Segusa - Mod: Xtreme - T.43', unit: 'PAR' },
    { label: 'Botas P. de Acero PVC - Marca: Segusa - Mod: Xtreme - T.44', unit: 'PAR' },
    { label: 'Chaleco de Drill - Mod. Capataz - Color: Naranja - Talla: M', unit: 'UNIDAD' },
    { label: 'Chaleco de Drill - Mod. Capataz - Color: Naranja - Talla: L', unit: 'UNIDAD' },
    { label: 'Chaleco de Drill - Mod. Capataz - Color: Naranja - Talla: XL', unit: 'UNIDAD' },
    { label: 'Filtro 2097 - Modelo: P100 (Partículas y V/Orgánicos) - 3M', unit: 'PAR' },
    { label: 'Guantes Anticorte - R. P. Nitrilo - Cut 5 - Marca: Vulkan', unit: 'PAR' },
    { label: 'Anteojos Modelo: Spider HC - Marca: Spro - Lunas: Claras', unit: 'UNIDAD' },
    { label: 'Anteojos Modelo: Spider HC - Marca: Spro - Lunas: Oscuras', unit: 'UNIDAD' },
    { label: 'Respirador Media Cara - Modelo: 7502 - Marca: 3M', unit: 'UNIDAD' },
    { label: 'Filtro 2096 - Modelo: P100 (Gases Ácidos) - Marca: 3M', unit: 'PAR' },
    { label: 'Respirador N95 - Modelo: 8210 - Marca: 3M (20 Unidades)', unit: 'CAJA' },
    { label: 'Guante de Neoprene Corrugado 14" - Marca: Galaxy', unit: 'PAR' },
    { label: 'Guantes de Nitrilo con Puño Tejido - Mod.: Nitro - Marca: Spro', unit: 'PAR' },
    { label: 'Guantes de Nitrilo 13" - Mod. Tychem NT480 - Marca: Dupont', unit: 'PAR' },
    { label: 'Guante de Nitrilo Descartable Touch N Tuff 92-600 - Ansell E.', unit: 'CAJA' }
];


// --- TYPES ---
type EPPInventoryRecord = {
    id: number;
    type: 'IN' | 'OUT';
    item_name: string;
    unit: string;
    quantity: number;
    date: string;
    month: string;
    responsible: string;
    location: string;
    description: string;
    files: string[];
};

type EPPRecord = {
    id: number;
    month: string; // YYYY-MM
    date: string;
    responsible: string;
    location: string;
    description: string;
    files: string[];
};

export default function EPPPage() {
    const { user } = useAuth();

    // --- STATE ---
    const [records, setRecords] = useState<EPPRecord[]>([]);
    const [invRecords, setInvRecords] = useState<EPPInventoryRecord[]>([]);
    const [invForm, setInvForm] = useState({
        type: 'OUT' as 'IN' | 'OUT',
        item_name: '',
        unit: 'UNIDAD',
        quantity: 1,
        date: new Date().toISOString().split('T')[0],
        month: new Date().toISOString().substring(0, 7),
        responsible: '',
        location: '',
        description: ''
    });
    const [invFiles, setInvFiles] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'docs' | 'inventory'>('docs');
    const [invFilterMonth, setInvFilterMonth] = useState('');

    const [isInvUploading, setIsInvUploading] = useState(false);

    const [isLoaded, setIsLoaded] = useState(false);

    // Form State
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        month: new Date().toISOString().substring(0, 7),
        responsible: '',
        location: '',
        description: ''
    });
    const [filterLocation, setFilterLocation] = useState('');
    const [filterResponsible, setFilterResponsible] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [files, setFiles] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [previewFile, setPreviewFile] = useState<{ url: string, type: 'pdf' | 'image' } | null>(null);

    // --- EFFECT: LOAD/SAVE ---
    const fetchRecords = async () => {
        try {
            const res = await fetch('/api/epp-records');
            const data = await res.json();
            if (data.success) {
                setRecords(data.records);
            }
        try {
            const resInv = await fetch('/api/epp-inventory');
            const dataInv = await resInv.json();
            if (dataInv.success) setInvRecords(dataInv.records);
        } catch(e) { console.error(e); }

        } catch (e) {
            console.error('Error fetching EPP records:', e);
        } finally {
            setIsLoaded(true);
        }
    };

    useEffect(() => {
        const performMigrationAndLoad = async () => {
            const stored = localStorage.getItem('epp_records_v2');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        await fetch('/api/epp-records', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'bulk-create',
                                data: sanitizeRecords(parsed, ['responsible', 'location', 'description', 'date', 'month']),
                                userName: user?.name
                            })
                        });
                        localStorage.removeItem('epp_records_v2');
                        alert("¡Excelente! Tus registros locales antiguos han sido sincronizados a la nube.");
                    }
                } catch(e) {
                    console.error("Migration error", e);
                }
            }
            await fetchRecords();
        };

        if (user) {
            performMigrationAndLoad();
        } else {
            // Aún si no hay user cargado al instante, lo intentamos
            performMigrationAndLoad();
        }
    }, [user]);

    // --- HANDLERS ---

    const handleInvFileUpload = async (e: any) => {
        let inputFiles = e?.target?.files;
        if (!inputFiles || inputFiles.length === 0) return;
        try {
            setIsInvUploading(true);
            const uploadedUrls: string[] = [];
            const filesArray = Array.from(inputFiles) as File[];
            for (const file of filesArray) {
                const url = await uploadEvidence(
                    file,
                    'EPP_INV',
                    `INV_${invForm.type}_${invForm.month}`,
                    invForm.date,
                    invForm.responsible || user?.name || 'Sin Asignar',
                    'epp',
                    'seguridad',
                    invForm.location || 'Sin Especificar',
                    'Inventario EPP'
                );
                uploadedUrls.push(url);
            }
            setInvFiles(prev => [...prev, ...uploadedUrls]);
        } catch (error: any) {
            alert(`Error al subir: ${error.message}`);
        } finally {
            setIsInvUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleInvSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invForm.item_name || invForm.quantity <= 0) {
            alert("Debe seleccionar un EPP y cantidad válida.");
            return;
        }
        try {
            setIsInvUploading(true);
            const newRecordData = { ...invForm, files: invFiles };
            const res = await fetch('/api/epp-inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', data: newRecordData, userName: user?.name })
            });
            const result = await res.json();
            if (result.success) {
                const newRecord = { id: result.id, ...newRecordData };
                setInvRecords(prev => [newRecord as EPPInventoryRecord, ...prev]);
                setInvForm(prev => ({ ...prev, quantity: 1, item_name: '' }));
                setInvFiles([]);
                alert("Registro de EPP guardado correctamente.");
            } else {
                alert("Error: " + result.error);
            }
        } catch (error: any) {
            alert("Error: " + error.message);
        } finally {
            setIsInvUploading(false);
        }
    };

    const handleInvItemSelect = (val: string) => {
        const item = EPP_CATALOG.find(i => i.label === val);
        setInvForm({ ...invForm, item_name: val, unit: item ? item.unit : 'UNIDAD' });
    };
    
    // Calcula la data para el gráfico (top EPP consumidos en el mes actual o seleccionado)
    
    const stockMap = React.useMemo(() => {
        const map: Record<string, { in: number, out: number, unit: string }> = {};
        EPP_CATALOG.forEach(item => {
            map[item.label] = { in: 0, out: 0, unit: item.unit };
        });
        invRecords.forEach(r => {
            if (!map[r.item_name]) {
                map[r.item_name] = { in: 0, out: 0, unit: r.unit };
            }
            if (r.type === 'IN') map[r.item_name].in += Number(r.quantity) || 0;
            if (r.type === 'OUT') map[r.item_name].out += Number(r.quantity) || 0;
        });
        return Object.entries(map).map(([name, data]) => ({
            name,
            unit: data.unit,
            in: data.in,
            out: data.out,
            saldo: data.in - data.out
        })).sort((a, b) => a.name.localeCompare(b.name));
    }, [invRecords]);

    const handleInvDelete = async (id: number) => {
        if (!confirm("¿Eliminar este registro de inventario/entrega?")) return;
        try {
            const res = await fetch('/api/epp-inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', id, userName: user?.name })
            });
            const result = await res.json();
            if (result.success) {
                setInvRecords(prev => prev.filter(r => r.id !== id));
            } else {
                alert("Error al eliminar: " + result.error);
            }
        } catch (e) {
            alert("Error de red");
        }
    };

    const chartData = React.useMemo(() => {
        const outRecords = invRecords.filter(r => r.type === 'OUT' && r.month === invFilterMonth);
        const map: Record<string, number> = {};
        outRecords.forEach(r => {
            map[r.item_name] = (map[r.item_name] || 0) + (Number(r.quantity) || 0);
        });
        return Object.entries(map)
            .map(([name, count]) => ({ name: name.split(' - ')[0], fullName: name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // top 5
    }, [invRecords, form.month]);


    const handleFileUpload = async (e: any, droppedFiles?: FileList | File[]) => {
        let inputFiles = droppedFiles || e?.target?.files;
        if (!inputFiles || inputFiles.length === 0) return;

        // Permite subir sin responsable/lugar, usaremos valores por defecto temporales

        try {
            setIsUploading(true);
            const uploadedUrls: string[] = [];
            const filesArray = Array.from(inputFiles);
            setUploadProgress({ current: 0, total: filesArray.length });

            for (const file of filesArray) {
                setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }));
                const url = await uploadEvidence(
                    file,
                    'EPP',
                    `EPP_MENSUAL_${form.month}_${(form.responsible || 'Sin_Asignar').replace(/\s+/g, '_')}`,
                    form.date,
                    form.responsible || 'Sin Asignar',
                    'epp',
                    'seguridad',
                    form.location || 'Sin Especificar',
                    'Control Mensual de EPP'
                );
                uploadedUrls.push(url);
            }

            setFiles(prev => [...prev, ...uploadedUrls]);
        } catch (error: any) {
            alert(`Error al subir: ${error.message}`);
        } finally {
            setIsUploading(false);
            if (e.target && e.target.type === 'file') e.target.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (files.length === 0) {
            alert("Debe subir al menos un PDF de Cargo de Entrega.");
            return;
        }

        try {
            setIsUploading(true);
            const newRecordData = { ...form, files };
            
            const res = await fetch('/api/epp-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create',
                    data: newRecordData,
                    userName: user?.name
                })
            });
            const result = await res.json();

            if (result.success) {
                const newRecord = { id: result.id, ...newRecordData };
                setRecords(prev => [newRecord as EPPRecord, ...prev]);
                setForm(prev => ({ ...prev, description: '' }));
                setFiles([]);
                alert("Registro mensual de EPP guardado correctamente.");
            } else {
                alert("Error al guardar en la nube: " + result.error);
            }
        } catch (error: any) {
            alert("Error de conexión: " + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const record = records.find(r => r.id === id);
        if (!canDeleteRecord(id, user?.role || 'user', record?.date)) {
            alert('\u23f1\ufe0f No se puede eliminar este registro.\nLos usuarios solo pueden eliminar documentos dentro de las primeras 24 horas de su ingreso.\nContacte al administrador si necesita realizar esta acci\u00f3n.');
            return;
        }
        if (confirm("¿Eliminar este registro mensual?")) {
            try {
                const res = await fetch('/api/epp-records', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'delete', id, userName: user?.name })
                });
                const result = await res.json();
                if (result.success) {
                    setRecords(prev => prev.filter(r => r.id !== id));
                } else {
                    alert("Error al eliminar: " + result.error);
                }
            } catch (e) {
                alert("Error de red");
            }
        }
    };

    const getMonthLabel = (monthStr: string) => {
        const [year, month] = monthStr.split('-');
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${months[parseInt(month) - 1]} ${year}`;
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-[1400px] mx-auto space-y-6">
                    
                    {/* Header */}
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-3xl -mr-32 -mt-32 rounded-full"></div>
                        <div className="relative z-10">
                            <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4 mb-2">
                                <ShieldCheck size={40} className="text-blue-500" />
                                06 Control Mensual de EPP
                            </h1>
                            <p className="text-slate-400 font-bold max-w-2xl">
                                Gestión de documentos consolidados de entrega de EPP. Cargue los escaneos mensuales (PDF) de los cargos firmados por sede.
                            </p>
                        </div>
                    </div>

                    
                    {/* TABS */}
                    <div className="flex gap-4 border-b border-slate-800 pb-2">
                        <button 
                            onClick={() => setActiveTab('docs')}
                            className={`px-6 py-3 font-black uppercase text-sm rounded-t-2xl transition-all flex items-center gap-2 ${activeTab === 'docs' ? 'bg-blue-600 text-white shadow-[0_-5px_15px_-5px_rgba(37,99,235,0.5)] border-t border-x border-blue-500' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
                        >
                            <FileText size={18} /> Gestión de Documentos (PDF)
                        </button>
                        <button 
                            onClick={() => setActiveTab('inventory')}
                            className={`px-6 py-3 font-black uppercase text-sm rounded-t-2xl transition-all flex items-center gap-2 ${activeTab === 'inventory' ? 'bg-emerald-600 text-white shadow-[0_-5px_15px_-5px_rgba(16,185,129,0.5)] border-t border-x border-emerald-500' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
                        >
                            <Package size={18} /> Inventario y Entregas (Stock)
                        </button>
                    </div>

                    <div className="mt-6">
                        {activeTab === 'docs' ? (
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                <div className="xl:col-span-1">
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl sticky top-6">
                                <h3 className="text-blue-400 font-black uppercase text-sm tracking-widest mb-6 flex items-center gap-2">
                                    <Save size={18} /> Nuevo Documento Mensual
                                </h3>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase">Mes del Control</label>
                                                <input name="form_month" 
                                                    type="month" 
                                                    value={form.month} 
                                                    onChange={e => setForm({...form, month: e.target.value})} 
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none" 
                                                    required 
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Responsable de Entrega</label>
                                            <SearchableSelect name="SearchableSelect_55870"
                                                options={USER_LIST.map(u => ({ id: u.name, label: u.name }))}
                                                value={form.responsible}
                                                onChange={(val) => setForm({ ...form, responsible: val })}
                                                placeholder="Seleccionar Responsable..."
                                                icon={<User size={16} />}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Lugar / Sede</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-2.5 text-slate-600" size={16} />
                                                <select name="form_location" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none appearance-none" required>
                                                    <option value="">Seleccionar...</option>
                                                    {SSOMA_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Descripción / Título del Lote</label>
                                            <input name="form_description" 
                                                type="text" 
                                                placeholder="Ej: Entrega de Botas y Cascos Abril 2024" 
                                                value={form.description} 
                                                onChange={e => setForm({...form, description: e.target.value})} 
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none" 
                                            />
                                            <div className="flex flex-col gap-2">
                                                <div className="flex gap-2">
                                                    <button 
                                                        type="button"
                                                        onClick={() => setForm({...form, description: 'EPP nuevo o recambio'})}
                                                        className="flex-1 text-[9px] font-black uppercase py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-blue-600/20 hover:border-blue-500/50 transition-all text-slate-400 hover:text-blue-400"
                                                    >
                                                        EPP nuevo/recambio
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setForm({...form, description: 'EPP rutinario'})}
                                                        className="flex-1 text-[9px] font-black uppercase py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-emerald-600/20 hover:border-emerald-500/50 transition-all text-slate-400 hover:text-emerald-400"
                                                    >
                                                        EPP rutinario
                                                    </button>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => setForm({...form, description: 'EPP nuevo o recambio y EPP rutinario'})}
                                                    className="w-full text-[9px] font-black uppercase py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-amber-600/20 hover:border-amber-500/50 transition-all text-slate-400 hover:text-amber-400"
                                                >
                                                    Ambos (Nuevo y Rutinario)
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* DRAG & DROP AREA - ESTILO ESTANDARIZADO PREMIUM */}
                                    <div className="space-y-1.5 pt-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                            Cargo de Entrega (PDF)
                                        </label>
                                        <div 
                                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                            onDragLeave={() => setIsDragging(false)}
                                            onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files && e.dataTransfer.files.length > 0) { handleFileUpload(null, e.dataTransfer.files); } }}
                                            className={`relative border-2 border-dashed rounded-3xl p-8 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group ${
                                                isUploading ? 'border-amber-500 bg-amber-500/5 cursor-wait' :
                                                isDragging ? 'border-blue-500 bg-blue-500/10 scale-[1.01]' : 
                                                files.length > 0 ? 'border-blue-500/30 bg-blue-500/5' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/30'
                                            }`}
                                        >
                                            <input name="input_4869" 
                                                type="file"
                                                multiple
                                                accept=".pdf"
                                                disabled={isUploading}
                                                onChange={handleFileUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait z-50"
                                            />
                                            <div className={`p-4 rounded-2xl transition-all ${
                                                isUploading ? 'bg-amber-500 text-white animate-pulse' :
                                                isDragging ? 'bg-blue-500 text-white' : 
                                                'bg-slate-800 text-slate-400 group-hover:text-blue-400'
                                            }`}>
                                                {isUploading ? <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={32} />}
                                            </div>
                                            <div className="text-center">
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${isUploading ? 'text-amber-500' : 'text-white'}`}>
                                                    {isUploading ? `SUBIENDO... ${uploadProgress.total > 1 ? `(${uploadProgress.current}/${uploadProgress.total})` : ''}` : isDragging ? '¡SUELTA!' : files.length > 0 ? `✅ ${files.length} CARGOS LISTOS` : 'ARRASTRA O HAZ CLIC'}
                                                </p>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">
                                                    Solo archivos PDF firmados
                                                </p>
                                            </div>
                                        </div>

                                        {/* File Previews */}
                                        {files.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-3">
                                                {files.map((url, idx) => (
                                                    <div key={idx} className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2 animate-in zoom-in-95 group">
                                                        <FileText size={12} className="text-red-400" />
                                                        <span className="text-[9px] font-bold text-slate-300">PDF {idx + 1}</span>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))} 
                                                            className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                        {isUploading ? "Subiendo..." : <><Save size={18} /> Guardar Registro Mensual</>}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* List */}
                        <div className="xl:col-span-2">
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl min-h-[600px]">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-4">
                                    <h3 className="text-white font-black text-lg flex items-center gap-2">
                                        <FileText size={20} className="text-slate-500" /> Archivo de Entrega Mensual
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <div className="text-[10px] font-mono text-slate-500 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                                            {records.filter(r => {
                                                const matchesLoc = !filterLocation || r.location === filterLocation;
                                                const matchesResp = !filterResponsible || r.responsible === filterResponsible;
                                                const matchesMonth = !filterMonth || r.month === filterMonth;
                                                return matchesLoc && matchesResp && matchesMonth;
                                            }).length} REGISTROS
                                        </div>
                                    </div>
                                </div>

                                {/* FILTERS */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-slate-800/30 p-4 rounded-2xl border border-slate-800/50 items-end">
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Mes</label>
                                            {filterMonth && (
                                                <button onClick={() => setFilterMonth('')} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <input name="filterMonth" 
                                            type="month"
                                            value={filterMonth}
                                            onChange={e => setFilterMonth(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Responsable</label>
                                            {filterResponsible && (
                                                <button onClick={() => setFilterResponsible('')} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <SearchableSelect name="SearchableSelect_13879" 
                                            options={USER_LIST.map(u => ({ id: u.name, label: u.name }))}
                                            value={filterResponsible}
                                            onChange={(val) => setFilterResponsible(val)}
                                            placeholder="Todos los responsables..."
                                            className="[&>div]:bg-slate-950 [&>div]:border-slate-700 [&>div]:py-1.5 [&>div]:px-3 [&>div]:text-[10px]"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Lugar</label>
                                            {filterLocation && (
                                                <button onClick={() => setFilterLocation('')} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <SearchableSelect name="SearchableSelect_86576" 
                                            options={SSOMA_LOCATIONS.map(l => ({ id: l, label: l }))}
                                            value={filterLocation}
                                            onChange={(val) => setFilterLocation(val)}
                                            placeholder="Todos los lugares..."
                                            className="[&>div]:bg-slate-950 [&>div]:border-slate-700 [&>div]:py-1.5 [&>div]:px-3 [&>div]:text-[10px]"
                                        />
                                    </div>
                                    <div className="space-y-1 flex flex-col justify-end h-[53px]">
                                        <button 
                                            onClick={() => { setFilterLocation(''); setFilterResponsible(''); setFilterMonth(''); }}
                                            className={`w-full h-[33px] rounded-lg text-[10px] font-bold uppercase transition-all border flex items-center justify-center gap-2 active:scale-95 ${
                                                (filterLocation || filterResponsible || filterMonth)
                                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 shadow-lg shadow-red-950/20'
                                                : 'bg-slate-800/50 text-slate-500 border-slate-800 cursor-not-allowed opacity-50'
                                            }`}
                                            disabled={!(filterLocation || filterResponsible || filterMonth)}
                                        >
                                            <RotateCcw size={14} strokeWidth={3} /> Limpiar Filtros
                                        </button>
                                    </div>
                                </div>

                                {/* RESUMEN MENSUAL */}
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'].map((m, i) => {
                                        const count = records.filter(r => {
                                            const mPart = parseInt(r.month?.split('-')[1] || "0");
                                            return mPart === (i + 1);
                                        }).length;
                                        return (
                                            <div key={m} className={`flex flex-col items-center justify-center min-w-[42px] py-1.5 rounded-xl border ${count > 0 ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-600 opacity-50'}`}>
                                                <span className="text-[7px] font-black uppercase tracking-tighter">{m}</span>
                                                <span className="text-[9px] font-black">{count}</span>
                                            </div>
                                        );
                                    })}
                                    <div className="flex flex-col items-center justify-center min-w-[60px] py-1.5 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 ml-auto">
                                        <span className="text-[7px] font-black uppercase tracking-tighter">TOTAL</span>
                                        <span className="text-[9px] font-black">{records.length}</span>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[10px] font-black text-slate-500 uppercase border-b border-slate-800">
                                                <th className="pb-4">Mes / Periodo</th>
                                                <th className="pb-4">Responsable</th>
                                                <th className="pb-4">Lugar</th>
                                                <th className="pb-4">Descripción</th>
                                                <th className="pb-4 text-center">Archivo PDF</th>
                                                <th className="pb-4 text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {records
                                                .filter(r => {
                                                    const matchesLoc = !filterLocation || r.location === filterLocation;
                                                    const matchesResp = !filterResponsible || r.responsible === filterResponsible;
                                                    const matchesMonth = !filterMonth || r.month === filterMonth;
                                                    return matchesLoc && matchesResp && matchesMonth;
                                                })
                                                .sort((a, b) => b.month.localeCompare(a.month))
                                                .map(r => (
                                                <tr key={r.id} className="group hover:bg-slate-800/30 transition-colors">
                                                    <td className="py-4 text-xs font-black text-blue-400 uppercase tracking-tighter">
                                                        {getMonthLabel(r.month)}
                                                    </td>
                                                    <td className="py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-black border border-blue-500/30">
                                                                {getInitials(r.responsible)}
                                                            </div>
                                                            <span className="text-sm font-bold text-white">{r.responsible}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-xs text-slate-400">{r.location}</td>
                                                    <td className="py-4 text-xs text-slate-500 italic max-w-[150px] truncate" title={r.description}>{r.description || 'Sin descripción'}</td>
                                                    <td className="py-4">
                                                        <div className="flex justify-center gap-2">
                                                            {r.files.map((f, i) => (
                                                                <button key={i} onClick={() => setPreviewFile({url: f, type: 'pdf'})} className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 flex items-center gap-2 hover:bg-red-500/10 hover:border-red-500/50 transition-all text-[10px] font-black text-slate-400 hover:text-red-400">
                                                                    <FileText size={14} /> PDF
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-right">
                                                        <button onClick={() => handleDelete(r.id)} className="p-2 text-slate-600 hover:text-red-400 transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {records.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="py-20 text-center text-slate-600 font-bold uppercase text-xs tracking-widest">No hay documentos cargados</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                

                        {/* INVENTORY PANEL */}
                        <div className="xl:col-span-1">
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl sticky top-6 flex flex-col gap-6">
                                <div>
                                    <h3 className="text-emerald-400 font-black uppercase text-sm tracking-widest mb-4 flex items-center gap-2">
                                        <Package size={18} /> Inventario y Entregas
                                    </h3>
                                    
                                    <form onSubmit={handleInvSubmit} className="space-y-4">
                                        <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 mb-4">
                                            <button 
                                                type="button" 
                                                onClick={() => setInvForm({...invForm, type: 'IN'})}
                                                className={`flex-1 text-[10px] font-black uppercase py-2 rounded-lg transition-all ${invForm.type === 'IN' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-500 hover:text-white'}`}
                                            >Ingreso (Stock)</button>
                                            <button 
                                                type="button" 
                                                onClick={() => setInvForm({...invForm, type: 'OUT'})}
                                                className={`flex-1 text-[10px] font-black uppercase py-2 rounded-lg transition-all ${invForm.type === 'OUT' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-500 hover:text-white'}`}
                                            >Salida (Entrega)</button>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Artículo EPP</label>
                                            <SearchableSelect name="SearchableSelect_5803"
                                                options={EPP_CATALOG.map(c => ({ id: c.label, label: c.label }))}
                                                value={invForm.item_name}
                                                onChange={handleInvItemSelect}
                                                placeholder="Buscar artículo..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase">Cantidad</label>
                                                <input name="invForm_quantity" 
                                                    type="number" min="1" 
                                                    value={invForm.quantity} 
                                                    onChange={e => setInvForm({...invForm, quantity: parseInt(e.target.value)||0})}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-500 outline-none" 
                                                    required 
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase">Unidad</label>
                                                <input name="invForm_unit" 
                                                    type="text" 
                                                    value={invForm.unit} 
                                                    disabled
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-500 cursor-not-allowed" 
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Lugar / Sede (Opcional)</label>
                                            <select name="invForm_location" 
                                                value={invForm.location}
                                                onChange={e => setInvForm({...invForm, location: e.target.value})}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none appearance-none cursor-pointer"
                                            >
                                                <option value="">Seleccionar Sede...</option>
                                                {SSOMA_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Responsable (Opcional)</label>
                                            <SearchableSelect name="SearchableSelect_20396"
                                                options={USER_LIST.map(u => ({ id: u.name, label: u.name }))}
                                                value={invForm.responsible}
                                                onChange={(val) => setInvForm({ ...invForm, responsible: val })}
                                                placeholder="Seleccionar..."
                                            />
                                        </div>
                                        
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Evidencia (Opcional)</label>
                                            <div className="flex gap-2">
                                                <label className="flex-1 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 cursor-pointer rounded-xl py-2 flex items-center justify-center gap-2 transition-colors">
                                                    <Upload size={14} className="text-slate-400" />
                                                    <span className="text-[10px] font-bold text-slate-300">SUBIR FOTO/PDF</span>
                                                    <input name="input_93724" type="file" multiple onChange={handleInvFileUpload} disabled={isInvUploading} className="hidden" />
                                                </label>
                                            </div>
                                            {invFiles.length > 0 && (
                                                <div className="text-[9px] font-bold text-emerald-400 mt-1">✓ {invFiles.length} archivos adjuntos</div>
                                            )}
                                        </div>

                                        <button type="submit" disabled={isInvUploading} className={`w-full font-black uppercase py-3 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 ${invForm.type === 'IN' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
                                            {isInvUploading ? "Guardando..." : <><Save size={16} /> Guardar {invForm.type === 'IN' ? 'Ingreso' : 'Entrega'}</>}
                                        </button>
                                    </form>
                                </div>
                                
                                <div className="border-t border-slate-800 pt-6">
                                    <h3 className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-4 flex items-center gap-2">
                                        Top Consumo: {form.month}
                                    </h3>
                                    {chartData.length > 0 ? (
                                        <div className="h-48 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                                                    <XAxis type="number" hide />
                                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 700}} width={80} />
                                                    <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '10px', color: '#fff'}} />
                                                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                                        {chartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="h-24 flex items-center justify-center text-slate-600 text-[10px] font-bold italic border border-dashed border-slate-800 rounded-xl bg-slate-950/50">
                                            Sin entregas este mes
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        
                                
                                {/* INVENTORY RIGHT SIDE */}
                                <div className="xl:col-span-2 flex flex-col gap-6">
                                    {/* STOCK SALDO */}
                                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                                        <h3 className="text-white font-black text-lg flex items-center gap-2 mb-4">
                                            <Package size={20} className="text-emerald-500" /> Saldo de Stock Actual
                                        </h3>
                                        <div className="overflow-x-auto max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 pr-2">
                                            <table className="w-full text-left">
                                                <thead className="sticky top-0 bg-slate-900 z-10">
                                                    <tr className="text-[9px] font-black text-slate-500 uppercase border-b border-slate-800">
                                                        <th className="pb-2">Artículo de EPP</th>
                                                        <th className="pb-2 text-center">Unidad</th>
                                                        <th className="pb-2 text-center text-blue-400">Ingresos</th>
                                                        <th className="pb-2 text-center text-amber-400">Salidas</th>
                                                        <th className="pb-2 text-center text-emerald-400">Saldo</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800/50">
                                                    {stockMap.map(s => (
                                                        <tr key={s.name} className="hover:bg-slate-800/20 transition-colors">
                                                            <td className="py-2 text-[10px] font-bold text-slate-300 max-w-[200px] truncate" title={s.name}>{s.name}</td>
                                                            <td className="py-2 text-[9px] text-center text-slate-500">{s.unit}</td>
                                                            <td className="py-2 text-[11px] font-black text-center text-blue-400">{s.in}</td>
                                                            <td className="py-2 text-[11px] font-black text-center text-amber-400">{s.out}</td>
                                                            <td className="py-2 text-center">
                                                                <span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${s.saldo <= 10 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-emerald-400'}`}>
                                                                    {s.saldo}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* HISTORIAL */}
                                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex-1">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-white font-black text-lg flex items-center gap-2">
                                                <FileText size={20} className="text-slate-500" /> Historial de Movimientos
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <input name="invFilterMonth" 
                                                    type="month"
                                                    value={invFilterMonth}
                                                    onChange={e => setInvFilterMonth(e.target.value)}
                                                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1 text-[10px] text-white focus:border-emerald-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 pr-2">
                                            <table className="w-full text-left">
                                                <thead className="sticky top-0 bg-slate-900 z-10">
                                                    <tr className="text-[9px] font-black text-slate-500 uppercase border-b border-slate-800">
                                                        <th className="pb-2">Fecha</th>
                                                        <th className="pb-2">Tipo</th>
                                                        <th className="pb-2">Sede</th>
                                                        <th className="pb-2">Responsable</th>
                                                        <th className="pb-2">Artículo</th>
                                                        <th className="pb-2 text-center">Cant.</th>
                                                        <th className="pb-2 text-center">Docs</th>
                                                        <th className="pb-2 text-right">Acción</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800/50">
                                                    {invRecords.filter(r => !invFilterMonth || r.month === invFilterMonth).map(r => (
                                                        <tr key={r.id} className="hover:bg-slate-800/20 transition-colors">
                                                            <td className="py-2 text-[10px] text-slate-400">{r.date}</td>
                                                            <td className="py-2">
                                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${r.type === 'IN' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                                    {r.type === 'IN' ? 'Ingreso' : 'Salida'}
                                                                </span>
                                                            </td>
                                                            <td className="py-2 text-[10px] text-slate-300 max-w-[80px] truncate" title={r.location}>{r.location || '-'}</td>
                                                            <td className="py-2 text-[10px] font-bold text-white max-w-[100px] truncate" title={r.responsible}>{r.responsible || '-'}</td>
                                                            <td className="py-2 text-[10px] text-slate-300 max-w-[150px] truncate" title={r.item_name}>{r.item_name}</td>
                                                            <td className="py-2 text-[11px] font-black text-center text-slate-200">{r.quantity}</td>
                                                            <td className="py-2 text-center">
                                                                {r.files?.length > 0 ? (
                                                                    <button onClick={() => setPreviewFile({url: r.files[0], type: 'pdf'})} className="text-[9px] px-2 py-1 bg-slate-800 rounded text-slate-400 hover:text-emerald-400">Ver</button>
                                                                ) : <span className="text-[9px] text-slate-600">-</span>}
                                                            </td>
                                                            <td className="py-2 text-right">
                                                                <button onClick={() => handleInvDelete(r.id)} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {invRecords.length === 0 && (
                                                        <tr>
                                                            <td colSpan={7} className="py-8 text-center text-slate-600 font-bold uppercase text-xs">Sin registros de inventario</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
</main>

            {/* Preview Modal */}
            {previewFile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setPreviewFile(null)}>
                    <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                            <h3 className="text-white font-bold flex items-center gap-2 uppercase tracking-widest text-xs">
                                <FileText size={16} className="text-red-400" /> Cargo Mensual de EPP
                            </h3>
                            <button onClick={() => setPreviewFile(null)} className="text-slate-400 hover:text-white p-2">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="h-[75vh] w-full">
                            <iframe src={getDriveViewerUrl(previewFile.url, false)} className="w-full h-full border-none" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
