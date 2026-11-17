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
    LogOut,
    Check,
    X
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
import VoiceDictation from "@/components/VoiceDictation";

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
        persona_observada: string;
        is_anonymous: boolean;
    }>({
        date: new Date().toISOString().split('T')[0],
        responsible: '',
        location: '',
        descripcion: '',
        accion_inmediata: '',
        type: 'acto',
        actos_checked: [],
        condiciones_checked: [],
        persona_observada: '',
        is_anonymous: false
    });
    
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [exited, setExited] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    // Estado del proceso de agregar a la pantalla (Modal Interactivo)
    const [showInstallModal, setShowInstallModal] = useState(false);
    const [installing, setInstalling] = useState(false);
    const [installProgress, setInstallProgress] = useState(0);
    const [installSuccess, setInstallSuccess] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isStand = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
            setIsStandalone(!!isStand);

            const handleBeforeInstall = (e: any) => {
                e.preventDefault();
                (window as any).__pwaDeferredPrompt = e;
            };
            window.addEventListener('beforeinstallprompt', handleBeforeInstall);

            // Al abrir el QR o la página, desplegar automáticamente la pregunta para fijar en pantalla
            const autoPromptTimer = setTimeout(() => {
                setShowInstallModal(true);
            }, 400);

            return () => {
                clearTimeout(autoPromptTimer);
                window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            };
        }
    }, []);

    const handleConfirmInstall = async () => {
        setInstalling(true);
        setInstallProgress(15);

        // Si el navegador capturó el prompt nativo de Android Chrome
        const promptEvent = typeof window !== 'undefined' ? (window as any).__pwaDeferredPrompt : null;
        if (promptEvent) {
            try {
                setInstallProgress(40);
                await promptEvent.prompt();
                setInstallProgress(75);
                const choice = await promptEvent.userChoice;
                if (choice && choice.outcome === 'accepted') {
                    setInstallProgress(100);
                    setInstallSuccess(true);
                    setInstalling(false);
                    setTimeout(() => {
                        setShowInstallModal(false);
                    }, 2000);
                    return;
                }
            } catch (err) {
                console.warn("Prompt error:", err);
            }
        }

        // Proceso visual guiado y registro de ServiceWorker para el celular
        try {
            if ('serviceWorker' in navigator) {
                await navigator.serviceWorker.register('/sw.js');
            }
        } catch (e) {}

        let current = 25;
        const interval = setInterval(() => {
            current += 25;
            setInstallProgress(Math.min(current, 90));
            if (current >= 90) {
                clearInterval(interval);
                setTimeout(() => {
                    setInstallProgress(100);
                    setInstallSuccess(true);
                    setInstalling(false);
                    setTimeout(() => {
                        setShowInstallModal(false);
                    }, 2200);
                }, 400);
            }
        }, 180);
    };

    useEffect(() => {
        // 1. Determinar el proyecto desde la URL del QR (?workspace=...) o desde el workspace activo
        let targetWs = 'Red Vial 6';
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const wsParam = params.get('workspace');
            if (wsParam && wsParam.trim()) {
                targetWs = wsParam.trim();
                localStorage.setItem('ssoma_qr_workspace', targetWs);
            } else {
                targetWs = localStorage.getItem('ssoma_qr_workspace') || getActiveWorkspace() || 'Red Vial 6';
            }
        }
        setProjectWorkspace(targetWs);
        setProjectLocations(getLocationsForWorkspace(targetWs));

        // 2. Vincular el manifest y el icono exclusivo del proyecto al navegador
        try {
            const isLong = targetWs.toLowerCase().includes('longitudinal');
            const targetManifest = isLong ? '/manifest-l4.json' : '/manifest-rv6.json';
            const targetAppleIcon = isLong ? '/icons/l4-192.png' : '/icons/rv6-192.png';

            let manifestTag = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
            if (!manifestTag) {
                manifestTag = document.createElement('link');
                manifestTag.rel = 'manifest';
                document.head.appendChild(manifestTag);
            }
            manifestTag.href = targetManifest;

            let appleIconTag = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
            if (!appleIconTag) {
                appleIconTag = document.createElement('link');
                appleIconTag.rel = 'apple-touch-icon';
                document.head.appendChild(appleIconTag);
            }
            appleIconTag.href = targetAppleIcon;
        } catch (e) {}

        // 3. Cargar usuarios propios del proyecto + SCTR si corresponde
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

        const effectiveResponsible = (form.is_anonymous || form.responsible === 'ANÓNIMO') ? 'ANÓNIMO' : form.responsible;

        if (!effectiveResponsible && !form.is_anonymous) {
            alert("Debe seleccionar o escribir quién reporta (o marcar la opción Anónimo).");
            return;
        }

        if (!form.location) {
            alert("Debe seleccionar el Lugar / Ubicación.");
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
                    effectiveResponsible,
                    'EVID',
                    'SEGURIDAD',
                    form.location
                );
            }

            const baseId = Date.now();
            const reportNum = String(baseId).slice(-4);
            const proyectoActivo = projectWorkspace.toUpperCase();
            const horaActual = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
            const effectivePersonaObservada = form.type === 'acto' ? (form.persona_observada?.trim() || '') : '';

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
                            responsible: effectiveResponsible,
                            is_anonymous: Boolean(form.is_anonymous || form.responsible === 'ANÓNIMO'),
                            persona_observada: effectivePersonaObservada,
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
                    responsible: effectiveResponsible,
                    is_anonymous: Boolean(form.is_anonymous || form.responsible === 'ANÓNIMO'),
                    persona_observada: effectivePersonaObservada,
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
                    responsible: effectiveResponsible,
                    is_anonymous: Boolean(form.is_anonymous || form.responsible === 'ANÓNIMO'),
                    persona_observada: '',
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
                body: JSON.stringify({ records: newRecords, userName: effectiveResponsible, workspace: activeWs })
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
                                    location: '',
                                    persona_observada: '',
                                    is_anonymous: false
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
            {/* Modal emergente que se abre automáticamente al escanear el QR */}
            {showInstallModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className={`w-full max-w-md bg-slate-900 border-2 ${isLongitudinal ? 'border-emerald-500/70 shadow-[0_0_50px_rgba(16,185,129,0.3)]' : 'border-orange-500/70 shadow-[0_0_50px_rgba(249,115,22,0.3)]'} rounded-3xl p-6 relative animate-in zoom-in-95 duration-200 text-center space-y-4`}>
                        
                        <button
                            type="button"
                            onClick={() => setShowInstallModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-colors border border-slate-700"
                            title="Cerrar"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex justify-center pt-2">
                            <div className="relative">
                                <img 
                                    src={isLongitudinal ? '/icons/l4-192.png' : '/icons/rv6-192.png'} 
                                    alt="Icono TOP" 
                                    className="w-20 h-20 rounded-2xl shadow-2xl border-2 border-white/20 mx-auto"
                                />
                                <span className={`absolute -bottom-2 -right-2 ${isLongitudinal ? 'bg-emerald-500' : 'bg-orange-500'} text-white rounded-full p-1 shadow-md`}>
                                    <Check size={14} />
                                </span>
                            </div>
                        </div>

                        <div>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${isLongitudinal ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'}`}>
                                {projectWorkspace} • F-SIG-060
                            </span>
                            <h3 className="text-xl sm:text-2xl font-black text-white mt-2 tracking-tight">
                                ¿Deseas agregar la Tarjeta TOP a tu pantalla?
                            </h3>
                            <p className="text-slate-300 text-xs sm:text-sm mt-1.5 leading-relaxed px-2">
                                Al autorizarlo, se fija el icono oficial de <strong>{projectWorkspace}</strong> en tu celular para ingresar directo cuando quieras reportar, sin volver a escanear el QR.
                            </p>
                        </div>

                        {installing ? (
                            <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-orange-400 flex items-center gap-2">
                                        <Activity className="animate-spin text-orange-400" size={16} />
                                        <span>Instalando y fijando icono en tu pantalla...</span>
                                    </span>
                                    <span className="text-white font-mono text-sm">{installProgress}%</span>
                                </div>
                                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                                    <div 
                                        className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-400 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(249,115,22,0.9)]"
                                        style={{ width: `${installProgress}%` }}
                                    ></div>
                                </div>
                                <p className="text-[11px] text-slate-400">Configurando acceso directo en el sistema...</p>
                            </div>
                        ) : installSuccess ? (
                            <div className="bg-emerald-500/20 border-2 border-emerald-500/60 p-4 rounded-2xl text-emerald-300 text-xs sm:text-sm font-bold space-y-2 animate-in zoom-in-95">
                                <div className="flex items-center justify-center gap-2 text-white text-base">
                                    <CheckCircle2 size={24} className="text-emerald-400" />
                                    <span>¡Autorizado con éxito!</span>
                                </div>
                                <p className="text-slate-200 text-xs font-normal">
                                    El icono ha sido configurado en tu pantalla de inicio. Ya puedes acceder directamente.
                                </p>
                                <button 
                                    type="button"
                                    onClick={() => setShowInstallModal(false)} 
                                    className="mt-2 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition-colors"
                                >
                                    Continuar al Formulario
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2 pt-2">
                                <button
                                    type="button"
                                    onClick={handleConfirmInstall}
                                    className={`w-full py-4 px-6 font-black text-sm sm:text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${isLongitudinal ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 shadow-emerald-500/40' : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 shadow-orange-500/40'}`}
                                >
                                    <Check size={20} /> SÍ, AGREGAR A LA PANTALLA
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowInstallModal(false)}
                                    className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-bold text-xs rounded-xl transition-colors border border-slate-700"
                                >
                                    Ahora no, solo llenar el formulario
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="bg-black/25 text-white/95 text-[10px] font-bold px-2.5 py-1 rounded border border-white/15 uppercase">F-SIG-060</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setInstallSuccess(false);
                                        setInstalling(false);
                                        setInstallProgress(0);
                                        setShowInstallModal(true);
                                    }}
                                    className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/20 flex items-center gap-1.5 transition-all shadow-md backdrop-blur-sm"
                                    title="Instalar como icono en la pantalla del celular"
                                >
                                    📲 Instalar Icono
                                </button>
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

                {/* Banner de acceso para fijar icono si cerró el modal */}
                {!isStandalone && !installSuccess && (
                    <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-lg transition-all animate-in fade-in duration-300 ${isLongitudinal ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-orange-950/40 border-orange-500/40'}`}>
                        <div className="flex items-center gap-3">
                            <img src={isLongitudinal ? '/icons/l4-192.png' : '/icons/rv6-192.png'} alt="Icono" className="w-10 h-10 rounded-xl shrink-0 border border-white/10" />
                            <div>
                                <p className="text-white text-xs sm:text-sm font-bold">
                                    ¿Fijar la Tarjeta TOP como icono en tu celular?
                                </p>
                                <p className="text-slate-400 text-[11px] leading-tight">
                                    Acceso directo en tu pantalla de inicio para reportar sin volver a escanear el QR.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setInstallSuccess(false);
                                setInstalling(false);
                                setInstallProgress(0);
                                setShowInstallModal(true);
                            }}
                            className={`px-3.5 py-2.5 rounded-xl text-white font-bold text-xs shrink-0 shadow-md flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 ${isLongitudinal ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30' : 'bg-orange-600 hover:bg-orange-500 shadow-orange-600/30'}`}
                        >
                            <span>➕</span> Fijar Icono
                        </button>
                    </div>
                )}

                <div className={`bg-[#1c222b] border ${isLongitudinal ? 'border-emerald-500/40' : 'border-slate-700/50'} p-5 sm:p-8 rounded-[2rem] shadow-2xl space-y-6 relative`}>
                    
                    {/* 1. SELECCIÓN PRINCIPAL: ACTO INSEGURO vs CONDICIÓN INSEGURA */}
                    <div className="bg-slate-900/80 p-1.5 rounded-2xl border border-slate-700/60 shadow-inner mb-4">
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                type="button" 
                                onClick={() => setForm({...form, type: 'acto'})} 
                                className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${form.type === 'acto' ? (isLongitudinal ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30' : 'bg-gradient-to-r from-[#ff6b00] to-[#f97316] text-white shadow-orange-500/30 scale-[1.01]') : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                <CheckCircle2 size={16} /> Acto Inseguro
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setForm({...form, type: 'condicion'})} 
                                className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${form.type === 'condicion' ? (isLongitudinal ? 'bg-teal-500 text-slate-950 shadow-teal-500/30' : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-blue-500/30 scale-[1.01]') : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                Condición Insegura
                            </button>
                        </div>
                    </div>

                    {/* 2. DATOS GENERALES: FECHA Y UBICACIÓN */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div className={`border ${isLongitudinal ? 'border-emerald-600/70' : 'border-[#b35922]/70'} rounded-xl p-3 bg-slate-900/40 flex flex-col justify-center`}>
                            <label className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5 mb-1.5"><Calendar size={13} className="text-orange-400"/> Fecha:</label>
                            <input name="form_date" type="date" value={form.date} onChange={e=>setForm({...form, date: e.target.value})} className="bg-transparent text-white text-sm font-bold outline-none cursor-pointer" />
                        </div>
                        <div className={`border ${isLongitudinal ? 'border-emerald-600/70' : 'border-[#b35922]/70'} rounded-xl p-3 bg-slate-900/40 flex flex-col justify-center`}>
                            <label className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5 mb-1.5"><MapPin size={13} className="text-orange-400"/> Ubicación ({projectWorkspace}):</label>
                            <select name="form_location" value={form.location} onChange={e=>setForm({...form, location: e.target.value})} className="bg-[#1c222b] text-white text-sm font-bold outline-none border-none cursor-pointer">
                                <option value="">Seleccionar lugar de {projectWorkspace}...</option>
                                {projectLocations.map((r: string)=><option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* 3. REPORTERO: IDENTIFICADO O ANÓNIMO */}
                    <div className={`border ${isLongitudinal ? 'border-emerald-600/70' : 'border-[#b35922]/70'} rounded-xl p-3.5 bg-slate-900/40 space-y-2.5 mb-4`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <label className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                                <Users size={13} className="text-orange-400" /> ¿Quién Reporta? ({projectWorkspace})
                            </label>
                            <div className="flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-slate-700/60 self-start sm:self-auto">
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, is_anonymous: false, responsible: f.responsible === 'ANÓNIMO' ? '' : f.responsible }))}
                                    className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1.5 ${!form.is_anonymous && form.responsible !== 'ANÓNIMO' ? 'bg-orange-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    <User size={12} /> Identificarme
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, is_anonymous: true, responsible: 'ANÓNIMO' }))}
                                    className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1.5 ${form.is_anonymous || form.responsible === 'ANÓNIMO' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    <span>🕶️</span> Anónimo
                                </button>
                            </div>
                        </div>

                        {form.is_anonymous || form.responsible === 'ANÓNIMO' ? (
                            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-2">
                                <span className="text-base">🕶️</span>
                                <span>Reporte Confidencial Anónimo — Tu identidad no será revelada.</span>
                            </div>
                        ) : (
                            <SearchableSelect name="form_responsible" 
                                options={sctrNames}
                                value={form.responsible}
                                onChange={(val) => setForm({...form, responsible: val})}
                                placeholder="Escribe o selecciona tu nombre..."
                                className="[&>div]:bg-[#1c222b] [&>div]:border-none [&>div]:p-0"
                            />
                        )}
                    </div>

                    {/* 4. PERSONA OBSERVADA (SOLO SI ES ACTO INSEGURO) */}
                    {form.type === 'acto' && (
                        <div className={`border-2 ${isLongitudinal ? 'border-emerald-500/60 bg-emerald-950/20' : 'border-orange-500/60 bg-orange-950/25'} rounded-2xl p-4 space-y-2.5 transition-all animate-in fade-in slide-in-from-top-3 duration-300 shadow-lg mb-4`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
                                        <User size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-orange-400 uppercase tracking-wide">Persona Observada / Involucrada</h4>
                                        <p className="text-[10px] text-slate-400">¿A quién se observó cometiendo el acto inseguro?</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-700/60">
                                    <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Por voz:</span>
                                    <VoiceDictation 
                                        onResult={(text) => {
                                            const clean = text.trim().toUpperCase();
                                            setForm(f => ({ 
                                                ...f, 
                                                persona_observada: f.persona_observada ? `${f.persona_observada} ${clean}` : clean 
                                            }));
                                        }}
                                        onClear={() => setForm(f => ({ ...f, persona_observada: '' }))}
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <input 
                                    type="text"
                                    list="sctr-workers-public-list"
                                    value={form.persona_observada || ''}
                                    onChange={(e) => setForm({ ...form, persona_observada: e.target.value.toUpperCase() })}
                                    placeholder="Escribe, selecciona o dicta por voz el nombre del trabajador..."
                                    className="w-full bg-[#1c222b] text-white text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl border border-orange-500/40 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/30 transition-all placeholder:text-slate-500"
                                />
                                <datalist id="sctr-workers-public-list">
                                    {sctrNames.map(w => (
                                        <option key={w.id} value={w.label} />
                                    ))}
                                </datalist>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-orange-300/80">
                                <span>💡</span>
                                <span>Puedes seleccionar el trabajador de la lista desplegable o pulsar el micrófono para dictarlo por voz.</span>
                            </div>
                        </div>
                    )}

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

                    <div className={`border ${isLongitudinal ? 'border-emerald-600/70' : 'border-[#b35922]'} rounded-xl p-4 bg-transparent relative group`}>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs text-slate-400">Descripción detallada de la observación...</label>
                            <VoiceDictation 
                                onResult={(text) => setForm({...form, descripcion: form.descripcion ? form.descripcion + ' ' + text : text})} 
                                onClear={() => setForm({...form, descripcion: ''})}
                            />
                        </div>
                        <textarea name="form_descripcion" value={form.descripcion} onChange={e=>setForm({...form, descripcion: e.target.value})} className="w-full bg-transparent text-white text-sm outline-none resize-none h-20" placeholder="Ingresar detalles aquí..." />
                    </div>

                    <div className={`border ${isLongitudinal ? 'border-emerald-600/70' : 'border-[#b35922]'} rounded-xl p-4 bg-transparent relative group`}>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs text-slate-400">Acción Inmediata (Opcional)</label>
                            <VoiceDictation 
                                onResult={(text) => setForm({...form, accion_inmediata: form.accion_inmediata ? form.accion_inmediata + ' ' + text : text})} 
                                onClear={() => setForm({...form, accion_inmediata: ''})}
                            />
                        </div>
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
