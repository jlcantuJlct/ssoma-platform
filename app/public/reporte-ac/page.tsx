"use client";

import { useState, useEffect } from "react";
import {
    AlertTriangle,
    Upload,
    Calendar,
    MapPin,
    CheckCircle2,
    Activity,
    Users,
    Car,
    HardHat,
    ArrowUp,
    Zap,
    Lock,
    Smartphone,
    Wrench,
    Package,
    Trash2,
    ShieldAlert,
    ShieldOff,
    Siren,
    Flame,
    FileWarning,
    SearchX,
    Layers,
    Cone,
    BadgeMinus,
    Wine,
    Ban,
    ShieldX,
    Building,
    LightbulbOff,
    Route,
    Droplets,
    VolumeX,
    Radiation,
    CloudLightning,
    Wind,
    PlugZap,
    FlaskConical,
    User,
    LogOut
} from "lucide-react";

const getCategoryIcon = (text: string, isChecked: boolean, size: number = 20, activeColorClass: string = 'text-[#f97316]') => {
    const t = text.toLowerCase();
    const color = isChecked ? activeColorClass : 'text-slate-500';
    if (t.includes('conducir') && t.includes('autorización')) return <BadgeMinus size={size} className={color} />;
    if (t.includes('vehícul') || t.includes('móviles') || t.includes('conducir')) return <Car size={size} className={color} />;
    if (t.includes('guardas') || t.includes('barandas')) return <ShieldOff size={size} className={color} />;
    if (t.includes('lesiones') || t.includes('accidentes')) return <Siren size={size} className={color} />;
    if (t.includes('fuego') || t.includes('incendio') || t.includes('caliente')) return <Flame size={size} className={color} />;
    if (t.includes('bloqueo') || t.includes('energía')) return <Zap size={size} className={color} />;
    if (t.includes('celular') || t.includes('teléfono')) return <Smartphone size={size} className={color} />;
    if (t.includes('epp')) return <HardHat size={size} className={color} />;
    if (t.includes('normas') || t.includes('ssoma') || t.includes('petar')) return <FileWarning size={size} className={color} />;
    if (t.includes('altura') || t.includes('caída') || t.includes('escaleras') || t.includes('apoyo')) return <ArrowUp size={size} className={color} />;
    if (t.includes('evaluar') || t.includes('riesgos')) return <SearchX size={size} className={color} />;
    if (t.includes('simultánea') || t.includes('múltiples')) return <Layers size={size} className={color} />;
    if (t.includes('delimitar') || t.includes('señalización')) return <Cone size={size} className={color} />;
    if (t.includes('alcohol') || t.includes('drogas')) return <Wine size={size} className={color} />;
    if (t.includes('restringidas')) return <Ban size={size} className={color} />;
    if (t.includes('cargas') || t.includes('izaje') || t.includes('levantar')) return <Package size={size} className={color} />;
    if (t.includes('proteccion inadecuadas') || t.includes('inexistente para hacer')) return <ShieldX size={size} className={color} />;
    if (t.includes('paredes') || t.includes('taludes')) return <Building size={size} className={color} />;
    if (t.includes('herramienta') || t.includes('equipo') || t.includes('defectuosos')) return <Wrench size={size} className={color} />;
    if (t.includes('iluminación')) return <LightbulbOff size={size} className={color} />;
    if (t.includes('caminos') || t.includes('pisos') || t.includes('superficies')) return <Route size={size} className={color} />;
    if (t.includes('congestión')) return <Activity size={size} className={color} />;
    if (t.includes('derrame')) return <Droplets size={size} className={color} />;
    if (t.includes('orden') || t.includes('limpieza') || t.includes('rrss')) return <Trash2 size={size} className={color} />;
    if (t.includes('ruido')) return <VolumeX size={size} className={color} />;
    if (t.includes('radiación')) return <Radiation size={size} className={color} />;
    if (t.includes('climas')) return <CloudLightning size={size} className={color} />;
    if (t.includes('ventilación')) return <Wind size={size} className={color} />;
    if (t.includes('cables') || t.includes('energizados')) return <PlugZap size={size} className={color} />;
    if (t.includes('quimicos')) return <FlaskConical size={size} className={color} />;
    if (t.includes('ergonómicos')) return <User size={size} className={color} />;
    return <AlertTriangle size={size} className={color} />;
};
import { uploadEvidence } from "@/lib/uploadClient";
import { getActiveWorkspace, getLocationsForWorkspace } from "@/lib/locations";
import { getUsersForWorkspace } from "@/lib/auth";
import { ACTOS_LIST, CONDICIONES_LIST } from "@/lib/categories";
import SearchableSelect from "@/components/SearchableSelect";
import InstallPWAPrompt from "@/components/InstallPWAPrompt";

export default function PublicReporteACPage() {
    const [projectWorkspace, setProjectWorkspace] = useState<string>('Red Vial 6');
    const [projectLocations, setProjectLocations] = useState<string[]>([]);
    const [sctrNames, setSctrNames] = useState<{id: string, label: string}[]>([]);
    
    // Form State
    const [form, setForm] = useState<{
        date: string;
        responsible: string;
        location: string;
        descripcion: string;
        accion_inmediata: string;
        type: 'acto' | 'condicion';
        actos_checked: string[];
        condiciones_checked: string[];
    }>({
        date: new Date().toISOString().split('T')[0],
        responsible: '',
        location: '',
        descripcion: '',
        accion_inmediata: '',
        type: 'acto',
        actos_checked: [],
        condiciones_checked: []
    });
    
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [exited, setExited] = useState(false);

    useEffect(() => {
        // 1. Determinar el proyecto desde la URL del QR (?workspace=...) o desde el workspace activo
        let targetWs = 'Red Vial 6';
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const wsParam = params.get('workspace');
            if (wsParam && wsParam.trim()) {
                targetWs = wsParam.trim();
            } else {
                targetWs = getActiveWorkspace() || 'Red Vial 6';
            }
        }
        setProjectWorkspace(targetWs);
        setProjectLocations(getLocationsForWorkspace(targetWs));

        // 2. Cargar usuarios propios del proyecto + SCTR si corresponde
        const projectUsers = getUsersForWorkspace(targetWs).map(u => u.name);
        const initialOptions = projectUsers.map(n => ({ id: n, label: n }));
        setSctrNames(initialOptions);

        const fetchNames = async () => {
            try {
                // Para Longitudinal tramo 4 mostramos prioritariamente su personal propio
                if (targetWs.toLowerCase().includes('longitudinal')) {
                    setSctrNames(initialOptions);
                    return;
                }
                const res = await fetch('/api/sctr-names');
                const data = await res.json();
                if (data.success && Array.isArray(data.names)) {
                    const combined = Array.from(new Set([...projectUsers, ...data.names]));
                    setSctrNames(combined.map((n: string) => ({ id: n, label: n })));
                }
            } catch (e) {
                console.error("Error fetching SCTR names:", e);
            }
        };
        fetchNames();
    }, []);

    const isLongitudinal = projectWorkspace.toLowerCase().includes('longitudinal');

    const handleSave = async () => {
        if (form.actos_checked.length === 0 && form.condiciones_checked.length === 0) {
            alert("Debe seleccionar al menos una clasificación de Acto o Condición.");
            return;
        }

        if (!form.responsible || !form.location) {
            alert("Debe completar Responsable y Lugar.");
            return;
        }

        setIsUploading(true);
        try {
            let uploadedUrl = "";
            let fotoEvidenciaB64 = "";
            if (pdfFile) {
                if (pdfFile.type.startsWith("image/")) {
                    fotoEvidenciaB64 = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(String(reader.result || ""));
                        reader.onerror = () => resolve("");
                        reader.readAsDataURL(pdfFile);
                    });
                }
                uploadedUrl = await uploadEvidence(
                    pdfFile,
                    'ActosInseguros' as any,
                    'Reporte_TOP_Publico',
                    form.date,
                    form.responsible,
                    'EVID',
                    'SEGURIDAD',
                    form.location
                );
            }

            const baseId = Date.now();
            const reportNum = String(baseId).slice(-4);
            const proyectoActivo = projectWorkspace.toUpperCase();
            const horaActual = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

            try {
                const excelRes = await fetch('/api/export-excel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        moduleName: 'F-SIG-060 Tarjeta TOP',
                        isTopMatrix: true,
                        saveToDrive: true,
                        meta: {
                            reportNumber: reportNum,
                            proyecto: proyectoActivo,
                            responsible: form.responsible,
                            date: form.date,
                            hora: horaActual,
                            location: form.location,
                            descripcion: form.descripcion,
                            accion_inmediata: form.accion_inmediata,
                            actos_checked: form.actos_checked,
                            condiciones_checked: form.condiciones_checked,
                            fotoEvidencia: fotoEvidenciaB64
                        }
                    })
                });
                if (excelRes.ok) {
                    const excelData = await excelRes.json();
                    if (excelData.driveUrl && !uploadedUrl) {
                        uploadedUrl = excelData.driveUrl;
                    }
                    if (excelData.fileBase64) {
                        const byteCharacters = atob(excelData.fileBase64);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
                        const byteArray = new Uint8Array(byteNumbers);
                        const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `F-SIG-060_TOP_${form.date}_${reportNum}.xlsx`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                    }
                }
            } catch (excelErr) {
                console.error("Error generando Excel F-SIG-060:", excelErr);
            }

            const newRecords: any[] = [];

            form.actos_checked.forEach((actoStr, i) => {
                newRecords.push({
                    id: baseId + i,
                    date: form.date,
                    responsible: form.responsible,
                    location: form.location,
                    acto: actoStr,
                    condicion: '',
                    cantidad: 1,
                    pdfUrl: uploadedUrl,
                    accion_inmediata: form.accion_inmediata,
                    descripcion: form.descripcion
                });
            });

            form.condiciones_checked.forEach((condStr, i) => {
                newRecords.push({
                    id: baseId + 1000 + i,
                    date: form.date,
                    responsible: form.responsible,
                    location: form.location,
                    acto: '',
                    condicion: condStr,
                    cantidad: 1,
                    pdfUrl: uploadedUrl,
                    accion_inmediata: form.accion_inmediata,
                    descripcion: form.descripcion
                });
            });

            const activeWs = projectWorkspace || 'Red Vial 6';
            try {
                const wsKey = `reporte_ac_records_${activeWs}`;
                const existingLocal = JSON.parse(localStorage.getItem(wsKey) || '[]');
                const updatedLocal = [...newRecords, ...existingLocal];
                localStorage.setItem(wsKey, JSON.stringify(updatedLocal));
                localStorage.setItem('reporte_ac_records', JSON.stringify(updatedLocal));
            } catch (e) {}

            await fetch(`/api/reporte-ac-records?workspace=${encodeURIComponent(activeWs)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: newRecords, userName: form.responsible, workspace: activeWs })
            });

            setSubmitted(true);
        } catch (error) {
            console.error("Save error:", error);
            alert("❌ Error al guardar el reporte.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleExit = () => {
        if (typeof window !== 'undefined') {
            const hasSession = !!localStorage.getItem('ssoma_user');
            try {
                window.close();
            } catch (e) {}
            if (hasSession) {
                window.location.href = '/reporte-ac';
            } else {
                setExited(true);
            }
        }
    };

    if (exited) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-4">
                <div className={`bg-slate-900 border ${isLongitudinal ? 'border-emerald-500/40' : 'border-orange-500/40'} p-8 rounded-[2rem] shadow-2xl text-center max-w-md w-full`}>
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-5">
                        <LogOut size={30} className="text-slate-300" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">Has salido del formulario</h2>
                    <p className="text-slate-400 mb-6 text-sm">Ya puedes cerrar esta pestaña en tu navegador o volver a ingresar si deseas registrar un nuevo reporte.</p>
                    <button
                        onClick={() => setExited(false)}
                        className={`w-full ${isLongitudinal ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-orange-600 hover:bg-orange-500'} text-white font-bold py-3 px-6 rounded-full transition-colors`}
                    >
                        Volver al Formulario
                    </button>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-4">
                <div className={`bg-slate-900 border ${isLongitudinal ? 'border-emerald-500/40' : 'border-orange-500/40'} p-8 rounded-[2rem] shadow-2xl text-center max-w-md w-full`}>
                    <div className={`w-20 h-20 ${isLongitudinal ? 'bg-emerald-500/20' : 'bg-orange-500/20'} rounded-full flex items-center justify-center mx-auto mb-6`}>
                        <CheckCircle2 size={40} className={isLongitudinal ? "text-emerald-400" : "text-orange-500"} />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">¡Reporte Enviado!</h2>
                    <p className="text-slate-400 mb-2">Proyecto: <strong className={isLongitudinal ? "text-emerald-400" : "text-orange-400"}>{projectWorkspace}</strong></p>
                    <p className="text-slate-400 mb-8 text-sm">Gracias por contribuir a la seguridad. Su reporte ha sido registrado en Drive y en el sistema exitosamente.</p>
                    <div className="space-y-3">
                        <button 
                            onClick={() => {
                                setSubmitted(false);
                                setForm({
                                    ...form,
                                    actos_checked: [],
                                    condiciones_checked: [],
                                    accion_inmediata: '',
                                    descripcion: '',
                                    responsible: '',
                                    location: ''
                                });
                                setPdfFile(null);
                            }}
                            className={`w-full ${isLongitudinal ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-orange-600 hover:bg-orange-500'} text-white font-bold py-3 px-6 rounded-full transition-colors`}
                        >
                            Enviar Otro Reporte
                        </button>
                        <button
                            onClick={handleExit}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 px-6 rounded-full transition-colors flex items-center justify-center gap-2 border border-slate-700"
                        >
                            <LogOut size={16} /> Salir
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-4 pb-20">
            <InstallPWAPrompt />
            <div className="max-w-2xl mx-auto space-y-6">
                
                {/* Header */}
                <div className={`bg-gradient-to-br ${isLongitudinal ? 'from-emerald-600 via-teal-700 to-teal-900 shadow-[0_10px_30px_rgba(16,185,129,0.25)]' : 'from-orange-600 to-orange-800 shadow-[0_10px_30px_rgba(249,115,22,0.25)]'} p-6 sm:p-8 rounded-[2rem] relative overflow-hidden`}>
                    <div className="relative z-10">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                            <div className="flex items-center gap-3">
                                <AlertTriangle size={32} className="text-white" />
                                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tighter">
                                    Reporte TOP - {projectWorkspace}
                                </h1>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="bg-black/25 text-white/95 text-[10px] font-bold px-2.5 py-1 rounded border border-white/15 uppercase">Código: F-SIG-060</span>
                                <span className="bg-black/25 text-white/95 text-[10px] font-bold px-2.5 py-1 rounded border border-white/15 uppercase">Versión: 01</span>
                                <button
                                    type="button"
                                    onClick={handleExit}
                                    className="bg-red-500/80 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/20 flex items-center gap-1.5 transition-all shadow-md"
                                    title="Salir del formulario"
                                >
                                    <LogOut size={14} /> Salir
                                </button>
                            </div>
                        </div>
                        <p className="text-white font-bold text-sm sm:text-lg mb-1">
                            Tarjeta de Observación Preventiva de Seguridad
                        </p>
                        <p className="text-white/90 font-bold text-xs flex items-center gap-1.5 bg-black/20 w-fit px-3 py-1 rounded-full border border-white/10 mt-2">
                            <MapPin size={12} /> Proyecto Exclusivo: {projectWorkspace}
                        </p>
                    </div>
                </div>

                <div className={`bg-[#1c222b] border ${isLongitudinal ? 'border-emerald-500/40' : 'border-slate-700/50'} p-5 sm:p-8 rounded-[2rem] shadow-2xl space-y-6 relative`}>
                    
                    <div className="grid grid-cols-1 gap-4">
                        <div className={`border ${isLongitudinal ? 'border-emerald-600/70' : 'border-[#b35922]'} rounded-xl p-3 bg-transparent flex flex-col justify-center`}>
                            <label className="text-[10px] text-slate-400 uppercase flex items-center gap-2 mb-1"><Calendar size={12}/> Fecha:</label>
                            <input name="form_date" type="date" value={form.date} onChange={e=>setForm({...form, date: e.target.value})} className="bg-transparent text-white text-sm font-bold outline-none" />
                        </div>
                        
                        <div className={`border ${isLongitudinal ? 'border-emerald-600/70' : 'border-[#b35922]'} rounded-xl p-3 bg-transparent flex flex-col justify-center`}>
                            <label className="text-[10px] text-slate-400 uppercase flex items-center gap-2 mb-1"><Users size={12}/> Reportado Por ({projectWorkspace}):</label>
                            <SearchableSelect name="form_responsible" 
                                options={sctrNames}
                                value={form.responsible}
                                onChange={(val) => setForm({...form, responsible: val})}
                                placeholder="Escribe o selecciona tu nombre..."
                                className="[&>div]:bg-[#1c222b] [&>div]:border-none [&>div]:p-0"
                            />
                        </div>
                        
                        <div className={`border ${isLongitudinal ? 'border-emerald-600/70' : 'border-[#b35922]'} rounded-xl p-3 bg-transparent flex flex-col justify-center`}>
                            <label className="text-[10px] text-slate-400 uppercase flex items-center gap-2 mb-1"><MapPin size={12}/> Ubicación ({projectWorkspace}):</label>
                            <select name="form_location" value={form.location} onChange={e=>setForm({...form, location: e.target.value})} className="bg-[#1c222b] text-white text-sm font-bold outline-none border-none">
                                <option value="">Seleccionar lugar de {projectWorkspace}...</option>
                                {projectLocations.map((r: string)=><option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-center mt-6 mb-4">
                        <div className="flex bg-[#232a35] rounded-full p-1 border border-slate-700/50 w-full relative">
                            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] ${isLongitudinal ? 'bg-emerald-500' : 'bg-[#f97316]'} rounded-full transition-all duration-300 shadow-md ${form.type === 'acto' ? 'left-1' : 'left-[calc(50%+4px)]'}`}></div>
                            <button type="button" onClick={() => setForm({...form, type: 'acto'})} className={`relative flex-1 px-2 py-2.5 text-xs font-bold uppercase tracking-wider z-10 flex items-center justify-center gap-1 sm:gap-2 transition-colors ${form.type === 'acto' ? 'text-black' : 'text-slate-400 hover:text-slate-200'}`}>
                                <CheckCircle2 size={14} /> Acto Inseguro
                            </button>
                            <button type="button" onClick={() => setForm({...form, type: 'condicion'})} className={`relative flex-1 px-2 py-2.5 text-xs font-bold uppercase tracking-wider z-10 transition-colors ${form.type === 'condicion' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                                Condición Insegura
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-1.5 custom-scrollbar mb-4">
                        {(form.type === 'acto' ? ACTOS_LIST : CONDICIONES_LIST).map(item => {
                            const isChecked = form.type === 'acto' ? form.actos_checked.includes(item) : form.condiciones_checked.includes(item);
                            return (
                                <label key={item} className={`relative flex items-center px-3 py-2 rounded-lg border cursor-pointer transition-all gap-2.5 text-left min-h-[48px] ${isChecked ? (isLongitudinal ? 'border-emerald-500 bg-emerald-500/15 shadow-[0_0_10px_rgba(16,185,129,0.15)]' : 'border-[#f97316] bg-[#f97316]/15 shadow-[0_0_10px_rgba(249,115,22,0.15)]') : 'border-slate-700/80 bg-slate-900/40 hover:border-slate-500 hover:bg-slate-800/50'}`}>
                                    <div className="shrink-0">
                                        {getCategoryIcon(item, isChecked, 16, isLongitudinal ? 'text-emerald-400' : 'text-[#f97316]')}
                                    </div>
                                    <span className={`flex-1 text-[10px] font-semibold leading-snug pr-4 ${isChecked ? 'text-white' : 'text-slate-300'}`}>{item}</span>
                                    <div className="shrink-0">
                                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${isChecked ? (isLongitudinal ? 'bg-emerald-500 border-emerald-500' : 'bg-[#f97316] border-[#f97316]') : 'border-slate-500 bg-transparent'}`}>
                                            {isChecked && <CheckCircle2 size={10} className="text-white" />}
                                        </div>
                                    </div>
                                    <input name="input_38238" 
                                        type="checkbox" 
                                        className="hidden"
                                        checked={isChecked}
                                        onChange={(e) => {
                                            const list = form.type === 'acto' ? form.actos_checked : form.condiciones_checked;
                                            const newChecked = e.target.checked ? [...list, item] : list.filter(x => x !== item);
                                            let updatedDesc = form.descripcion || '';
                                            if (e.target.checked) {
                                                if (!updatedDesc.includes(item)) {
                                                    updatedDesc = updatedDesc.trim() ? `${updatedDesc.trim()}\n- ${item}` : `- ${item}`;
                                                }
                                            } else {
                                                updatedDesc = updatedDesc
                                                    .split('\n')
                                                    .filter(line => line.trim() !== `- ${item}` && line.trim() !== item)
                                                    .join('\n')
                                                    .trim();
                                            }
                                            if (form.type === 'acto') setForm({...form, actos_checked: newChecked, descripcion: updatedDesc});
                                            else setForm({...form, condiciones_checked: newChecked, descripcion: updatedDesc});
                                        }}
                                    />
                                </label>
                            );
                        })}
                    </div>

                    <div className={`border ${isLongitudinal ? 'border-emerald-600/70' : 'border-[#b35922]'} rounded-xl p-4 bg-transparent`}>
                        <label className="text-xs text-slate-400 mb-2 block">Descripción detallada de la observación...</label>
                        <textarea name="form_descripcion" value={form.descripcion} onChange={e=>setForm({...form, descripcion: e.target.value})} className="w-full bg-transparent text-white text-sm outline-none resize-none h-20" placeholder="Ingresar detalles aquí..." />
                    </div>

                    <div className={`border ${isLongitudinal ? 'border-emerald-600/70' : 'border-[#b35922]'} rounded-xl p-4 bg-transparent`}>
                        <label className="text-xs text-slate-400 mb-2 block">Acción Inmediata (Opcional)</label>
                        <textarea name="form_accion_inmediata" value={form.accion_inmediata} onChange={e=>setForm({...form, accion_inmediata: e.target.value})} className="w-full bg-transparent text-white text-sm outline-none resize-none h-16" placeholder="Describir acción..." />
                    </div>

                    <div className="pt-6 space-y-3">
                        <button 
                            onClick={handleSave}
                            disabled={isUploading}
                            className={`w-full ${isLongitudinal ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]' : 'bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] hover:from-[#ff8c00] hover:to-[#ffa600] shadow-[0_0_20px_rgba(255,107,0,0.4)] hover:shadow-[0_0_30px_rgba(255,107,0,0.6)]'} text-white font-bold py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-lg`}
                        >
                            {isUploading ? <Activity className="animate-spin" size={24} /> : null}
                            Registrar Reporte ({projectWorkspace})
                        </button>
                        <button
                            type="button"
                            onClick={handleExit}
                            className="w-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-bold py-3 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 border border-slate-700 text-sm"
                        >
                            <LogOut size={16} /> Salir del Formulario
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
