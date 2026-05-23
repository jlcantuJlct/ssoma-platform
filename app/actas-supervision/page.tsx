"use client";

import { useState, useEffect } from "react";
import { useAuth, USER_LIST } from "@/lib/auth";
import { SSOMA_LOCATIONS } from "@/lib/locations";
import { uploadEvidence } from "@/lib/uploadClient";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    FileText,
    Upload,
    Trash2,
    Save,
    Activity,
    Clipboard,
    Shield,
    CheckCircle2,
    Calendar,
    MapPin,
    Plus,
    ImageIcon,
    FileIcon,
    AlertCircle,
    X
} from "lucide-react";
import SearchableSelect from "@/components/SearchableSelect";
import { getInitials } from "@/lib/utils";
import { exportTableToPDF, exportRecordToPDF } from '@/lib/pdfExport';
import { DownloadCloud } from "lucide-react";

// --- TYPES ---
type Acta = {
    id: string;
    date: string;
    place: string;
    report_number: string;
};

type Levantamiento = {
    id: string;
    report_number: string;
    date: string;
    place: string;
    responsible: string;
    lifting_number: number;
    evidence_img?: string;
    evidence_pdf?: string;
};

export default function ActasSupervisionPage() {
    const { user } = useAuth();

    // STATE
    const [actas, setActas] = useState<Acta[]>([]);
    const [levantamientos, setLevantamientos] = useState<Levantamiento[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

    // Filter State
    const [filterDate, setFilterDate] = useState("");
    const [filterPlace, setFilterPlace] = useState("");
    const [filterReport, setFilterReport] = useState("");
    const [filterResponsible, setFilterResponsible] = useState("");

    // FORMS
    const [actaForm, setActaForm] = useState({
        date: new Date().toISOString().split('T')[0],
        place: '',
        reportNumber: ''
    });

    const [liftingForm, setLiftingForm] = useState({
        reportNumber: '',
        date: new Date().toISOString().split('T')[0],
        place: '',
        responsible: '',
        liftingNumber: 1
    });

    const [files, setFiles] = useState<{ img: string | null, pdf: string | null }>({ img: null, pdf: null });

    // LOAD DATA
    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await fetch('/api/actas-supervision');
                const data = await res.json();
                if (data.success) {
                    setActas(data.actas || []);
                    setLevantamientos(data.levantamientos || []);
                }
            } catch (e) {
                console.error("Error loading Actas:", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();

        if (user && !liftingForm.responsible) {
            setLiftingForm(prev => ({ ...prev, responsible: user.name }));
        }
    }, [user]);

    // HANDLERS
    const handleFileUpload = async (e: any, type: 'img' | 'pdf') => {
        const selectedFile = ((e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) ? e.dataTransfer.files : e.target?.files)?.[0];
        if (!selectedFile) return;

        if (type === 'pdf' && selectedFile.type !== 'application/pdf') {
            alert("⚠️ Solo se permiten archivos PDF.");
            return;
        }
        if (type === 'img' && !selectedFile.type.startsWith('image/')) {
            alert("⚠️ Solo se permiten imágenes.");
            return;
        }

        setIsUploading(true);
        try {
            const url = await uploadEvidence(
                selectedFile,
                'Actividad',
                `LEVANTAMIENTO-${liftingForm.reportNumber || 'S/N'}`,
                liftingForm.date,
                liftingForm.responsible || user?.name || 'Usuario',
                'actas',
                'seguridad',
                liftingForm.place || 'GENERAL'
            );

            setFiles(prev => ({ ...prev, [type]: url }));
            alert(`✅ ${type === 'img' ? 'Imagen' : 'PDF'} subido correctamente.`);
        } catch (error: any) {
            console.error(error);
            alert(`Error al subir: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmitActa = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!actaForm.date || !actaForm.place || !actaForm.reportNumber) {
            alert("Completa todos los campos del acta.");
            return;
        }

        try {
            const res = await fetch('/api/actas-supervision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'create', 
                    type: 'acta', 
                    data: actaForm, 
                    userName: user?.name 
                })
            });
            const result = await res.json();
            if (result.success) {
                setActas(prev => [{ ...actaForm, id: result.id, report_number: actaForm.reportNumber, date: actaForm.date, place: actaForm.place }, ...prev]);
                setActaForm({ date: new Date().toISOString().split('T')[0], place: '', reportNumber: '' });
                alert("✅ Acta registrada exitosamente.");
            } else {
                alert("Error: " + result.error);
            }
        } catch (e) {
            console.error(e);
            alert("Error al guardar el acta.");
        }
    };

    const handleSubmitLifting = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!liftingForm.reportNumber || !liftingForm.date || !liftingForm.responsible) {
            alert("Completa los campos obligatorios del levantamiento.");
            return;
        }

        try {
            const res = await fetch('/api/actas-supervision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'create', 
                    type: 'levantamiento', 
                    data: { ...liftingForm, evidenceImg: files.img, evidencePdf: files.pdf }, 
                    userName: user?.name 
                })
            });
            const result = await res.json();
            if (result.success) {
                setLevantamientos(prev => [{ ...liftingForm, id: result.id, evidence_img: files.img || '', evidence_pdf: files.pdf || '' }, ...prev]);
                setLiftingForm(prev => ({ ...prev, liftingNumber: prev.liftingNumber + 1 }));
                setFiles({ img: null, pdf: null });
                alert("✅ Levantamiento registrado correctamente.");
            } else {
                alert("Error: " + result.error);
            }
        } catch (e) {
            console.error(e);
            alert("Error al guardar el levantamiento.");
        }
    };

    const handleDelete = async (id: string, type: 'acta' | 'levantamiento') => {
        if (!confirm("¿Eliminar este registro?")) return;
        try {
            const res = await fetch('/api/actas-supervision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', type, id, userName: user?.name })
            });
            if ((await res.json()).success) {
                if (type === 'acta') setActas(prev => prev.filter(a => a.id !== id));
                else setLevantamientos(prev => prev.filter(l => l.id !== id));
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden w-full">
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-[1600px] mx-auto space-y-8">
                    
                    {/* Header */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 backdrop-blur-md shadow-2xl">
                        <div className="flex items-center gap-4">
                            <div className="bg-emerald-500/20 p-3 rounded-2xl border border-emerald-500/30">
                                <Clipboard className="text-emerald-400" size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
                                    Control de Actas de Supervisión
                                </h1>
                                <p className="text-emerald-500/70 font-black text-[10px] uppercase tracking-[0.3em]">Seguimiento de Observaciones y Levantamientos</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-slate-800/50 px-6 py-3 rounded-2xl border border-slate-700 text-center">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Actas</p>
                                <p className="text-2xl font-black text-white">{actas.length}</p>
                            </div>
                            <div className="bg-emerald-500/10 px-6 py-3 rounded-2xl border border-emerald-500/20 text-center">
                                <p className="text-[9px] font-black text-emerald-500/50 uppercase tracking-widest mb-1">Levantamientos</p>
                                <p className="text-2xl font-black text-emerald-400">{levantamientos.length}</p>
                            </div>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* LEFT COLUMN: FORMS */}
                        <div className="lg:col-span-4 space-y-8">
                            
                            {/* ACTA REGISTRATION */}
                            <Card className="bg-slate-900/50 border-slate-800 shadow-2xl backdrop-blur-sm overflow-hidden border-t-2 border-t-emerald-500">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-white text-lg font-black uppercase italic">
                                        <Plus size={20} className="text-emerald-400" /> Registro de Acta
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmitActa} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                <Calendar size={12} /> Fecha
                                            </label>
                                            <input
                                                type="date"
                                                value={actaForm.date}
                                                onChange={e => setActaForm({ ...actaForm, date: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                <MapPin size={12} /> Lugar
                                            </label>
                                            <select
                                                value={actaForm.place}
                                                onChange={e => setActaForm({ ...actaForm, place: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none transition-all"
                                            >
                                                <option value="">Seleccionar Lugar...</option>
                                                {SSOMA_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                <FileText size={12} /> N° Informe de Observaciones
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Ej: INF-001-2026"
                                                value={actaForm.reportNumber}
                                                onChange={e => setActaForm({ ...actaForm, reportNumber: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none transition-all"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95 uppercase text-xs tracking-widest"
                                        >
                                            Registrar Informe
                                        </button>
                                    </form>
                                </CardContent>
                            </Card>

                            {/* LIFTING REGISTRATION (PANEL DE LEVANTAMIENTO) */}
                            <Card className="bg-slate-900/50 border-slate-800 shadow-2xl backdrop-blur-sm overflow-hidden border-t-2 border-t-blue-500">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-white text-lg font-black uppercase italic">
                                        <Activity size={20} className="text-blue-400" /> Panel de Levantamiento
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmitLifting} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Informe N° (Escoger)</label>
                                            <select
                                                value={liftingForm.reportNumber}
                                                onChange={e => setLiftingForm({ ...liftingForm, reportNumber: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none transition-all"
                                            >
                                                <option value="">Seleccionar Informe...</option>
                                                {actas.map(a => <option key={a.id} value={a.report_number}>{a.report_number} - {a.place}</option>)}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha Levantamiento</label>
                                                <input
                                                    type="date"
                                                    value={liftingForm.date}
                                                    onChange={e => setLiftingForm({ ...liftingForm, date: e.target.value })}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:border-blue-500 outline-none transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">N° Levantamiento</label>
                                                <select
                                                    value={liftingForm.liftingNumber}
                                                    onChange={e => setLiftingForm({ ...liftingForm, liftingNumber: parseInt(e.target.value) })}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:border-blue-500 outline-none transition-all"
                                                >
                                                    {Array.from({ length: 50 }, (_, i) => i + 1).map(n => (
                                                        <option key={n} value={n}>Levantamiento {n}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lugar</label>
                                            <select
                                                value={liftingForm.place}
                                                onChange={e => setLiftingForm({ ...liftingForm, place: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none transition-all"
                                            >
                                                <option value="">Seleccionar Lugar...</option>
                                                {SSOMA_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Responsable</label>
                                            <select
                                                value={liftingForm.responsible}
                                                onChange={e => setLiftingForm({ ...liftingForm, responsible: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none transition-all"
                                            >
                                                <option value="">Seleccionar Responsable...</option>
                                                {USER_LIST.map(u => <option key={u.username} value={u.name}>{u.name}</option>)}
                                            </select>
                                        </div>

                                        {/* UPLOADS */}
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="relative group">
                                                <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'img')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                                <div className={`p-4 border-2 border-dashed rounded-2xl text-center transition-all ${files.img ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-800 bg-slate-950 hover:border-blue-500/50'}`}>
                                                    <ImageIcon className={files.img ? 'text-emerald-400 mx-auto mb-1' : 'text-slate-600 mx-auto mb-1'} size={20} />
                                                    <span className="text-[8px] font-black uppercase text-slate-500">{files.img ? 'Imagen Lista' : 'Cargar Imagen'}</span>
                                                </div>
                                            </div>
                                            <div className="relative group">
                                                <input type="file" accept=".pdf" onChange={e => handleFileUpload(e, 'pdf')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                                <div className={`p-4 border-2 border-dashed rounded-2xl text-center transition-all ${files.pdf ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-800 bg-slate-950 hover:border-blue-500/50'}`}>
                                                    <FileIcon className={files.pdf ? 'text-emerald-400 mx-auto mb-1' : 'text-slate-600 mx-auto mb-1'} size={20} />
                                                    <span className="text-[8px] font-black uppercase text-slate-500">{files.pdf ? 'PDF Listo' : 'Cargar PDF'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isUploading}
                                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95 uppercase text-xs tracking-widest disabled:opacity-50"
                                        >
                                            {isUploading ? 'Subiendo...' : 'Registrar Levantamiento'}
                                        </button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN: HISTORY */}
                        <div className="lg:col-span-8 space-y-8">
                            <Card className="bg-slate-900/50 border-slate-800 shadow-2xl backdrop-blur-sm min-h-[600px]">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-white text-xl font-black uppercase italic tracking-tighter">
                                        <Shield className="text-emerald-500" size={24} /> Historial de Supervisión
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {/* FILTERS GRID */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-slate-950/50 p-4 rounded-2xl border border-slate-800 items-end">
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Fecha</label>
                                                {filterDate && (
                                                    <button onClick={() => setFilterDate("")} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                        <X size={10} />
                                                    </button>
                                                )}
                                            </div>
                                            <input 
                                                type="date"
                                                value={filterDate}
                                                onChange={e => setFilterDate(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-emerald-500 outline-none transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Lugar</label>
                                                {filterPlace && (
                                                    <button onClick={() => setFilterPlace("")} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                        <X size={10} />
                                                    </button>
                                                )}
                                            </div>
                                            <SearchableSelect 
                                                options={SSOMA_LOCATIONS.map(l => ({ id: l, label: l }))}
                                                value={filterPlace}
                                                onChange={(val) => setFilterPlace(val)}
                                                placeholder="Todos los lugares..."
                                                className="[&>div]:bg-slate-950 [&>div]:border-slate-800 [&>div]:py-1.5 [&>div]:px-3 [&>div]:text-[10px]"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-[9px] font-black text-slate-500 uppercase">N° Informe / Responsable</label>
                                                {filterReport && (
                                                    <button onClick={() => setFilterReport("")} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                        <X size={10} />
                                                    </button>
                                                )}
                                            </div>
                                            <input 
                                                type="text"
                                                placeholder="Buscar..."
                                                value={filterReport}
                                                onChange={e => setFilterReport(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-emerald-500 outline-none transition-colors"
                                            />
                                        </div>
                                        <div className="flex flex-col justify-end h-full gap-2">
                                            {(filterDate || filterPlace || filterReport) && (
                                                <button 
                                                    onClick={() => { setFilterDate(""); setFilterPlace(""); setFilterReport(""); }}
                                                    className="w-full h-[33px] bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] font-bold uppercase transition-colors border border-red-500/20 flex items-center justify-center gap-2 active:scale-95"
                                                >
                                                    <X size={14} strokeWidth={3} /> Limpiar
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => {
                                                    const filteredActas = actas.filter(acta => {
                                                        const matchesDate = !filterDate || acta.date === filterDate;
                                                        const matchesPlace = !filterPlace || acta.place === filterPlace;
                                                        const matchesReport = !filterReport || acta.report_number.toLowerCase().includes(filterReport.toLowerCase());
                                                        const matchesLiftingSearch = levantamientos.some(l => 
                                                            l.report_number === acta.report_number && 
                                                            (l.responsible.toLowerCase().includes(filterReport.toLowerCase()) || 
                                                             l.place.toLowerCase().includes(filterReport.toLowerCase()))
                                                        );
                                                        return (matchesDate && matchesPlace && matchesReport) || (matchesDate && matchesPlace && filterReport && matchesLiftingSearch);
                                                    });
                                                    
                                                    exportTableToPDF(
                                                        'Control de Actas de Supervisión',
                                                        [
                                                            { header: 'N° Informe', dataKey: 'report_number' },
                                                            { header: 'Fecha', dataKey: 'date' },
                                                            { header: 'Lugar', dataKey: 'place' },
                                                        ],
                                                        filteredActas,
                                                        `Actas_Supervision_${new Date().toISOString().split('T')[0]}.pdf`
                                                    );
                                                }}
                                                className="w-full h-[33px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold uppercase transition-colors border border-emerald-500 flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                <DownloadCloud size={14} /> PDF Filtrado
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {actas
                                            .filter(acta => {
                                                const matchesDate = !filterDate || acta.date === filterDate;
                                                const matchesPlace = !filterPlace || acta.place === filterPlace;
                                                const matchesReport = !filterReport || acta.report_number.toLowerCase().includes(filterReport.toLowerCase());
                                                
                                                // Also check if any levantamiento matches report/responsible search
                                                const matchesLiftingSearch = levantamientos.some(l => 
                                                    l.report_number === acta.report_number && 
                                                    (l.responsible.toLowerCase().includes(filterReport.toLowerCase()) || 
                                                     l.place.toLowerCase().includes(filterReport.toLowerCase()))
                                                );

                                                return (matchesDate && matchesPlace && matchesReport) || (matchesDate && matchesPlace && filterReport && matchesLiftingSearch);
                                            })
                                            .length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-20 text-slate-600 space-y-4">
                                                <AlertCircle size={48} className="opacity-20" />
                                                <p className="font-black uppercase tracking-widest text-xs italic">No hay registros de supervisión</p>
                                            </div>
                                        ) : (
                                            actas.map(acta => (
                                                <div key={acta.id} className="bg-slate-950/50 border border-slate-800 rounded-3xl overflow-hidden shadow-inner group transition-all hover:border-emerald-500/30">
                                                    {/* Acta Header */}
                                                    <div className="p-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-slate-900/30">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                                <FileText className="text-emerald-500" size={24} />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-lg font-black text-white italic">{acta.report_number}</h4>
                                                                <div className="flex items-center gap-3 mt-0.5">
                                                                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase">
                                                                        <Calendar size={10} /> {acta.date}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-emerald-500/60 flex items-center gap-1 uppercase">
                                                                        <MapPin size={10} /> {acta.place}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button 
                                                                onClick={() => {
                                                                    const count = levantamientos.filter(l => l.report_number === acta.report_number).length;
                                                                    exportRecordToPDF(
                                                                        'Acta de Supervisión',
                                                                        { ...acta, totalLevantamientos: count },
                                                                        `Acta_${acta.report_number}.pdf`
                                                                    );
                                                                }}
                                                                className="p-2 text-slate-600 hover:text-emerald-400 transition-colors"
                                                                title="Descargar PDF"
                                                            >
                                                                <DownloadCloud size={18} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDelete(acta.id, 'acta')}
                                                                className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Levantamientos for this Acta */}
                                                    <div className="p-4 space-y-3">
                                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] px-2 mb-2">Levantamientos de Observaciones</p>
                                                        {levantamientos.filter(l => l.report_number === acta.report_number).length === 0 ? (
                                                            <p className="text-[10px] text-slate-700 italic px-2">Sin levantamientos registrados aún.</p>
                                                        ) : (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                {levantamientos
                                                                    .filter(l => l.report_number === acta.report_number)
                                                                    .sort((a,b) => a.lifting_number - b.lifting_number)
                                                                    .map(lifting => (
                                                                        <div key={lifting.id} className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex items-center justify-between group/lifting">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-[10px] font-black text-blue-400 border border-blue-500/20">
                                                                                    #{lifting.lifting_number}
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-xs font-black text-slate-200">Levantamiento {lifting.lifting_number}</p>
                                                                                    <p className="text-[9px] font-bold text-slate-500 uppercase">{lifting.responsible} • {lifting.date}</p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                {lifting.evidence_img && (
                                                                                    <a href={lifting.evidence_img} target="_blank" className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all">
                                                                                        <ImageIcon size={14} />
                                                                                    </a>
                                                                                )}
                                                                                {lifting.evidence_pdf && (
                                                                                    <a href={lifting.evidence_pdf} target="_blank" className="p-1.5 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                                                                                        <FileIcon size={14} />
                                                                                    </a>
                                                                                )}
                                                                                <button 
                                                                                    onClick={() => handleDelete(lifting.id, 'levantamiento')}
                                                                                    className="p-1.5 text-slate-700 hover:text-red-400 transition-colors"
                                                                                >
                                                                                    <Trash2 size={14} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
