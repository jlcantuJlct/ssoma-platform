"use client";

import React, { useState, useRef, useEffect } from 'react';
import { getActiveWorkspace } from '@/lib/locations';
import { EmailReportModal } from '@/components/EmailReportModal';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { 
    Trash2, 
    CheckCircle, 
    AlertCircle, 
    Save, 
    Loader2, 
    ArrowLeft, 
    Copy, 
    Shield, 
    Mail, 
    Camera,
    Plus,
    Check,
    X,
    Sparkles,
    AlertTriangle
} from 'lucide-react';
import { InteractiveCaidasInspector, CRITERIOS_CAIDAS, CAIDAS_HOTSPOTS, CaidasHotspotDef, CaidasTarget } from './InteractiveCaidasInspector';

const VoiceInput = ({ value, onChange, placeholder, className, type = "text", inputClass = "" }: any) => {
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);

    const toggleRecording = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('El dictado por voz no está soportado en este navegador.');
            return;
        }
        
        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
        } else {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.lang = 'es-ES';
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            
            let finalTranscriptAtStart = value || '';
            
            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscriptChunk = '';
                
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscriptChunk += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                
                if (finalTranscriptChunk) {
                    finalTranscriptAtStart = (finalTranscriptAtStart + ' ' + finalTranscriptChunk).trim();
                }
                
                onChange((finalTranscriptAtStart + ' ' + interimTranscript).trim());
            };
            
            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };
            
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    return (
        <div className={`relative w-full ${className || ''}`}>
            <input 
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`${inputClass} ${type === 'text' ? 'pr-16' : ''}`}
            />
            {type === 'text' && (
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                    {value && (
                        <button onClick={() => onChange('')} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-200 rounded-md transition-colors" title="Limpiar">
                            <Trash2 size={14} />
                        </button>
                    )}
                    <button onClick={toggleRecording} className={`p-1.5 rounded-md transition-colors ${isRecording ? 'text-red-500 bg-red-100 animate-pulse' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-200'}`} title="Dictado por voz">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/><line x1="8" x2="16" y1="22" y2="22"/></svg>
                    </button>
                </div>
            )}
        </div>
    );
};

export interface CaidasItem {
    id: string;
    trabajador: string;
    tipo: 'A' | 'L'; // A = Arnés, L = Línea
    subtipo?: 'arnes' | 'linea_absorbedor' | 'linea_posicionamiento';
    codigo: string;
    correas: 'V' | 'X';
    costuras: 'V' | 'X';
    anillos: 'V' | 'X';
    mosquetones: 'V' | 'X';
    hebillas: 'V' | 'X';
    gatillo: 'V' | 'X';
    observaciones: string;
    fotoEvidencia: string;
}

export function EPPCaidasCustomForm({ moduleName, version, SignaturePad }: { moduleName: string, version: number, SignaturePad: any }) {
    const router = useRouter();
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [cachedDriveUrl, setCachedDriveUrl] = useState<string | null>(null);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailData, setEmailData] = useState<any>(null);
    const [cachedLevantamientoLink, setCachedLevantamientoLink] = useState<string | null>(null);
    const [responsableLevantamiento, setResponsableLevantamiento] = useState<{name: string, email: string} | null>(null);
    const [contactos, setContactos] = useState<{name: string, email: string}[]>([]);
    
    useEffect(() => { 
        const stored = localStorage.getItem("ssoma_contacts"); 
        if (stored) setContactos(JSON.parse(stored)); 
    }, []);

    // Metadatos oficiales F-OP-017
    const [meta, setMeta] = useState({
        proyecto: getActiveWorkspace().toUpperCase(),
        area: '',
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().substring(0, 5),
        inspeccionadoPor: '',
        cargoInspector: '',
        firmaInspector: '',
        verificadoPor: '',
        firmaVerificador: ''
    });

    useEffect(() => {
        if (user && !meta.inspeccionadoPor) {
            setMeta(prev => ({
                ...prev,
                inspeccionadoPor: user.name || '',
                cargoInspector: user.role || 'Supervisor SSOMA',
                verificadoPor: 'Responsable SSMA'
            }));
        }
    }, [user]);

    // Lista de Equipos evaluados: Arnés, Línea con Amortiguador y Línea sin Amortiguador (100% independientes)
    const [items, setItems] = useState<CaidasItem[]>([
        {
            id: '1',
            trabajador: '',
            tipo: 'A',
            subtipo: 'arnes',
            codigo: 'ARN-01',
            correas: 'V',
            costuras: 'V',
            anillos: 'V',
            mosquetones: 'V',
            hebillas: 'V',
            gatillo: 'V',
            observaciones: '',
            fotoEvidencia: ''
        },
        {
            id: '2',
            trabajador: '',
            tipo: 'L',
            subtipo: 'linea_absorbedor',
            codigo: 'LV-01',
            correas: 'V',
            costuras: 'V',
            anillos: 'V',
            mosquetones: 'V',
            hebillas: 'V',
            gatillo: 'V',
            observaciones: '',
            fotoEvidencia: ''
        },
        {
            id: '3',
            trabajador: '',
            tipo: 'L',
            subtipo: 'linea_posicionamiento',
            codigo: 'LP-01',
            correas: 'V',
            costuras: 'V',
            anillos: 'V',
            mosquetones: 'V',
            hebillas: 'V',
            gatillo: 'V',
            observaciones: '',
            fotoEvidencia: ''
        }
    ]);

    const [activeItemIndex, setActiveItemIndex] = useState<number>(0);
    const [hotspotStatus, setHotspotStatus] = useState<Record<string, 'V' | 'X'>>({});

    const activeItem = items[activeItemIndex] || items[0];

    // Actualizar campo de un equipo
    const updateItem = (index: number, field: keyof CaidasItem, val: any) => {
        const copy = [...items];
        copy[index] = { ...copy[index], [field]: val };
        setItems(copy);
    };

    // Actualizar nombre de trabajador propagando a las líneas acompañantes que estén sin asignar
    const handleTrabajadorChange = (idx: number, name: string) => {
        const copy = [...items];
        const oldName = copy[idx]?.trabajador || '';
        copy[idx] = { ...copy[idx], trabajador: name };
        if (idx === 0) {
            if (copy[1] && (!copy[1].trabajador || copy[1].trabajador === oldName)) copy[1] = { ...copy[1], trabajador: name };
            if (copy[2] && (!copy[2].trabajador || copy[2].trabajador === oldName)) copy[2] = { ...copy[2], trabajador: name };
        }
        setItems(copy);
    };

    // Alternar punto (hotspot) individual desde la figura SVG sin afectar otros equipos
    const handleToggleHotspot = (spot: CaidasHotspotDef, newStatus: 'V' | 'X') => {
        const updatedHotspots = { ...hotspotStatus, [spot.id]: newStatus };
        setHotspotStatus(updatedHotspots);

        let targetIndex = items.findIndex(it => 
            it.subtipo === spot.target || 
            (spot.target === 'arnes' && it.tipo === 'A') ||
            (spot.target === 'linea_absorbedor' && it.subtipo === 'linea_absorbedor') ||
            (spot.target === 'linea_posicionamiento' && it.subtipo === 'linea_posicionamiento')
        );

        if (targetIndex === -1) {
            const newItem: CaidasItem = {
                id: Date.now().toString(),
                trabajador: items[0]?.trabajador || '',
                tipo: spot.target === 'arnes' ? 'A' : 'L',
                subtipo: spot.target as any,
                codigo: spot.target === 'arnes' ? 'ARN-01' : (spot.target === 'linea_absorbedor' ? 'LV-01' : 'LP-01'),
                correas: 'V', costuras: 'V', anillos: 'V', mosquetones: 'V', hebillas: 'V', gatillo: 'V',
                observaciones: '', fotoEvidencia: ''
            };
            items.push(newItem);
            targetIndex = items.length - 1;
        }

        // Determinar si queda algún defecto en ese criterio específico para ese equipo
        const targetSpots = CAIDAS_HOTSPOTS.filter(s => s.target === spot.target && s.key === spot.key);
        const hasAnyDefect = targetSpots.some(s => updatedHotspots[s.id] === 'X');

        const copy = [...items];
        copy[targetIndex] = {
            ...copy[targetIndex],
            [spot.key]: hasAnyDefect ? 'X' : 'V'
        };
        setItems(copy);
        setActiveItemIndex(targetIndex);
    };

    // Alternar criterio de un equipo desde los botones chips sin afectar los otros equipos
    const handleToggleCriterion = (target: CaidasTarget, criterionKey: CaidasHotspotDef['key'], newStatus: 'V' | 'X') => {
        let targetIndex = items.findIndex(it => 
            it.subtipo === target || 
            (target === 'arnes' && it.tipo === 'A') ||
            (target === 'linea_absorbedor' && it.subtipo === 'linea_absorbedor') ||
            (target === 'linea_posicionamiento' && it.subtipo === 'linea_posicionamiento')
        );
        if (targetIndex === -1) return;

        // Actualizar los hotspots de ese target y criterio
        const updatedHotspots = { ...hotspotStatus };
        CAIDAS_HOTSPOTS.filter(s => s.target === target && s.key === criterionKey).forEach(s => {
            updatedHotspots[s.id] = newStatus;
        });
        setHotspotStatus(updatedHotspots);

        const copy = [...items];
        copy[targetIndex] = { ...copy[targetIndex], [criterionKey]: newStatus };
        setItems(copy);
        setActiveItemIndex(targetIndex);
    };

    // Marcar todo un equipo (o todos) como Conforme (V)
    const handleSetAllConformeTarget = (target: CaidasTarget | 'all') => {
        const updatedHotspots = { ...hotspotStatus };
        if (target === 'all') {
            CAIDAS_HOTSPOTS.forEach(s => { updatedHotspots[s.id] = 'V'; });
            setHotspotStatus(updatedHotspots);
            const copy = items.map(it => ({
                ...it,
                correas: 'V', costuras: 'V', anillos: 'V', mosquetones: 'V', hebillas: 'V', gatillo: 'V'
            }));
            setItems(copy as CaidasItem[]);
        } else {
            CAIDAS_HOTSPOTS.filter(s => s.target === target).forEach(s => { updatedHotspots[s.id] = 'V'; });
            setHotspotStatus(updatedHotspots);
            const copy = items.map(it => {
                if (it.subtipo === target || (target === 'arnes' && it.tipo === 'A')) {
                    return {
                        ...it,
                        correas: 'V', costuras: 'V', anillos: 'V', mosquetones: 'V', hebillas: 'V', gatillo: 'V'
                    };
                }
                return it;
            });
            setItems(copy as CaidasItem[]);
        }
    };

    // Añadir nuevo equipo
    const addItem = () => {
        const nextNum = items.length + 1;
        const newItem: CaidasItem = {
            id: Date.now().toString(),
            trabajador: items[0]?.trabajador || '',
            tipo: nextNum % 2 === 0 ? 'L' : 'A',
            subtipo: nextNum % 2 === 0 ? 'linea_absorbedor' : 'arnes',
            codigo: (nextNum % 2 === 0 ? 'LV-' : 'ARN-') + String(nextNum).padStart(2, '0'),
            correas: 'V',
            costuras: 'V',
            anillos: 'V',
            mosquetones: 'V',
            hebillas: 'V',
            gatillo: 'V',
            observaciones: '',
            fotoEvidencia: ''
        };
        setItems([...items, newItem]);
        setActiveItemIndex(items.length);
    };

    // Duplicar equipo
    const duplicateItem = (idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const base = items[idx];
        const nextNum = items.length + 1;
        const copyItem: CaidasItem = {
            ...base,
            id: Date.now().toString(),
            codigo: base.codigo + '-BIS'
        };
        setItems([...items, copyItem]);
        setActiveItemIndex(items.length);
    };

    // Eliminar equipo
    const removeItem = (idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (items.length <= 1) {
            alert('Debe mantener al menos un equipo en la inspección.');
            return;
        }
        const filtered = items.filter((_, i) => i !== idx);
        setItems(filtered);
        if (activeItemIndex >= filtered.length) {
            setActiveItemIndex(filtered.length - 1);
        }
    };

    // Subida y compresión de foto de evidencia
    const handlePhotoUpload = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const maxDim = 800;
                    if (width > height && width > maxDim) {
                        height *= maxDim / width;
                        width = maxDim;
                    } else if (height > maxDim) {
                        width *= maxDim / height;
                        height = maxDim;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    const b64 = canvas.toDataURL('image/jpeg', 0.6);
                    updateItem(idx, 'fotoEvidencia', b64);
                };
                img.src = event.target.result as string;
            }
        };
        reader.readAsDataURL(file);
    };

    // Guardar y Descargar Excel
    const handleSaveAndDownload = async (isEmailing: boolean = false, customEmailData: any = null) => {
        if (items.length === 0) {
            alert('Añada al menos un equipo o trabajador a inspeccionar.');
            return;
        }

        setIsSaving(true);
        try {
            // Verificar si hay ítems defectuosos (X)
            const defectiveList: string[] = [];
            const defectPhotosMap: Record<string, string[]> = {};
            let firstDefectPhoto = '';

            items.forEach((it, idx) => {
                const defCriteria: string[] = [];
                CRITERIOS_CAIDAS.forEach(c => {
                    if (it[c.key] === 'X') defCriteria.push(c.label);
                });
                if (defCriteria.length > 0) {
                    const descStr = `- ${it.trabajador || 'Trabajador ' + (idx + 1)} [${it.tipo === 'A' ? 'Arnés' : 'Línea'} ${it.codigo}]: Defecto en ${defCriteria.join(', ')}`;
                    defectiveList.push(descStr);
                    if (it.fotoEvidencia) {
                        defectPhotosMap[descStr] = [it.fotoEvidencia];
                        if (!firstDefectPhoto) firstDefectPhoto = it.fotoEvidencia;
                    }
                }
            });

            const res = await fetch('/api/export-excel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    moduleName: 'Inspección de Equipo contra caídas',
                    isCaidasMatrix: true,
                    meta,
                    items,
                    saveToDrive: true
                })
            });

            if (res.ok) {
                const data = await res.json();
                let inspectionRecordId = data.inspectionRecordId || Date.now().toString();

                let generatedLevantamientoLink = cachedLevantamientoLink;

                // Crear levantamiento si hay observaciones y responsable asignado
                if (responsableLevantamiento && defectiveList.length > 0 && !generatedLevantamientoLink) {
                    try {
                        const lvRes = await fetch('/api/levantamiento/create', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                moduleName: 'Inspección de Equipo contra caídas',
                                template: items,
                                answers: meta,
                                inspectionRecordId,
                                hallazgos: [{
                                    index: 0,
                                    descripcion: "Observaciones en Equipos Contra Caídas (F-OP-017):\n" + defectiveList.join("\n"),
                                    riesgo: 'Alto',
                                    categoria: 'Condición Subestándar',
                                    responsable: responsableLevantamiento.name,
                                    responsableEmail: responsableLevantamiento.email,
                                    fecha: meta.fecha,
                                    evidencia: firstDefectPhoto,
                                    fotosDefectos: defectPhotosMap
                                }]
                            })
                        });
                        if (lvRes.ok) {
                            const lvData = await lvRes.json();
                            if (lvData.items && lvData.items.length > 0) {
                                generatedLevantamientoLink = window.location.origin + '/levantamiento/' + lvData.items[0].token;
                                setCachedLevantamientoLink(generatedLevantamientoLink);
                            }
                        }
                    } catch(err) {
                        console.error("Error creating levantamiento:", err);
                    }
                }

                setCachedDriveUrl(data.driveUrl);

                // Descarga local
                if (data.fileBase64 && !isEmailing) {
                    const byteCharacters = atob(data.fileBase64);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `INSP_CAIDAS_${meta.fecha || new Date().toISOString().split('T')[0]}.xlsx`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                }

                // Guardar en tabla inspection_records
                await fetch('/api/inspections', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'create',
                        data: {
                            date: meta.fecha || new Date().toISOString().split('T')[0],
                            responsible: meta.inspeccionadoPor || 'Supervisor SSOMA',
                            inspectionType: 'Inspección de Equipo contra caídas',
                            area: meta.proyecto || getActiveWorkspace().toUpperCase(),
                            zone: meta.area || 'Trabajos en Altura',
                            status: defectiveList.length > 0 ? 'Con Observaciones' : 'Completado',
                            observations: `${items.length} equipos contra caídas inspeccionados. ${defectiveList.length > 0 ? defectiveList.length + ' con observaciones.' : 'Todos conformes.'}`,
                            evidencePdf: data.driveUrl || '',
                            evidenceImgs: items.map(it => it.fotoEvidencia).filter(Boolean)
                        }
                    })
                });

                if (isEmailing && customEmailData) {
                    try {
                        const driveLink = data.driveUrl || '';
                        let finalBodyText = customEmailData.message.replace(
                            '[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]',
                            driveLink ? '📎 Enlace al reporte en Drive:\n' + driveLink : ''
                        );
                        if (generatedLevantamientoLink) {
                            finalBodyText += '\n\n✅ Enlace de Levantamiento de Observaciones:\n' + generatedLevantamientoLink;
                        }

                        await fetch('/api/send-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                to: customEmailData.to,
                                subject: customEmailData.subject,
                                text: finalBodyText,
                                html: finalBodyText.replace(/\n/g, '<br>'),
                                fileBase64: data.fileBase64,
                                fileName: `INSP_CAIDAS_${meta.fecha}.xlsx`
                            })
                        });
                        alert('¡Reporte enviado exitosamente por correo!');
                        setShowEmailModal(false);
                    } catch(err: any) {
                        console.error(err);
                        alert('Error al enviar el correo: ' + (err.message || 'Error desconocido'));
                    }
                } else {
                    if (window.confirm("¡Inspección guardada y descargada exitosamente!\n\n¿Desea enviar el reporte por correo ahora?")) {
                        setShowEmailModal(true);
                    } else {
                        window.location.href = '/inspections?openDigital=true';
                    }
                }
            } else {
                const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
                alert('Error al exportar inspección: ' + err.error);
            }
        } catch(e: any) {
            console.error(e);
            alert('Error en el guardado: ' + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const arnesItem = items.find(it => it.subtipo === 'arnes' || it.tipo === 'A') || items[0];
    const lineaAbsItem = items.find(it => it.subtipo === 'linea_absorbedor') || items[1] || items[0];
    const lineaPosItem = items.find(it => it.subtipo === 'linea_posicionamiento') || items[2] || items[0];

    return (
        <div className="max-w-5xl mx-auto pb-24">
            {/* ENCABEZADO OFICIAL EXACTO */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white p-6 shadow-xl relative z-10 mb-6 rounded-b-2xl">
                <button 
                    onClick={() => router.push('/inspections?openDigital=true')} 
                    className="flex items-center gap-2 text-amber-200 hover:text-white transition-colors mb-3"
                >
                    <ArrowLeft size={20} /> Volver a Inspecciones
                </button>
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20">
                        <Shield className="text-amber-200" size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-white uppercase">
                            Inspección de EPP contra caídas
                        </h1>
                        <p className="text-amber-100 text-sm font-medium">
                            Formato Oficial F-OP-017 (Inspección de Equipos Contra Caídas: Arnés, Líneas de Vida, etc.)
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-4 space-y-6">
                {/* 1. DATOS GENERALES (METADATA) */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                    <div className="bg-slate-100 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                        <h2 className="font-bold text-slate-800 text-sm uppercase flex items-center gap-2">
                            <Sparkles size={16} className="text-amber-500" /> Datos Generales de la Inspección
                        </h2>
                        <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-md">
                            F-OP-017
                        </span>
                    </div>

                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="sm:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Proyecto</label>
                            <VoiceInput 
                                value={meta.proyecto} 
                                onChange={(val: string) => setMeta({ ...meta, proyecto: val })} 
                                inputClass="w-full border-b border-slate-200 p-2 text-sm focus:border-amber-500 outline-none bg-slate-50 font-semibold" 
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Área de Trabajo</label>
                            <VoiceInput 
                                value={meta.area} 
                                placeholder="Ej: Torre de Encofrado / Andamio Norte"
                                onChange={(val: string) => setMeta({ ...meta, area: val })} 
                                inputClass="w-full border-b border-slate-200 p-2 text-sm focus:border-amber-500 outline-none bg-slate-50" 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase">Fecha</label>
                            <input 
                                type="date" 
                                value={meta.fecha} 
                                onChange={(e) => setMeta({ ...meta, fecha: e.target.value })} 
                                className="w-full border-b border-slate-200 p-2 text-sm focus:border-amber-500 outline-none bg-slate-50 font-bold" 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase">Hora</label>
                            <input 
                                type="time" 
                                value={meta.hora} 
                                onChange={(e) => setMeta({ ...meta, hora: e.target.value })} 
                                className="w-full border-b border-slate-200 p-2 text-sm focus:border-amber-500 outline-none bg-slate-50 font-bold" 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase">Inspeccionado por (Jefe de Grupo / Inspector)</label>
                            <VoiceInput 
                                value={meta.inspeccionadoPor} 
                                onChange={(val: string) => setMeta({ ...meta, inspeccionadoPor: val })} 
                                inputClass="w-full border-b border-slate-200 p-2 text-sm focus:border-amber-500 outline-none bg-slate-50" 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase">Cargo / Puesto</label>
                            <VoiceInput 
                                value={meta.cargoInspector} 
                                onChange={(val: string) => setMeta({ ...meta, cargoInspector: val })} 
                                inputClass="w-full border-b border-slate-200 p-2 text-sm focus:border-amber-500 outline-none bg-slate-50" 
                            />
                        </div>
                    </div>
                </div>

                {/* 2. INSPECTOR VISUAL INTERACTIVO CON PERSONA, ARNÉS Y LÍNEAS DE VIDA */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 mb-2">
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                                <Sparkles size={18} />
                            </span>
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm uppercase">
                                    Inspector Gráfico Interactivo de Arnés y Líneas de Vida
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Evaluando: <b className="text-amber-600 font-mono">[{activeItem.tipo === 'A' ? 'ARNÉS (A)' : 'LÍNEA (L)'} - {activeItem.codigo || 'S/C'}]</b> {activeItem.trabajador && `de ${activeItem.trabajador}`}
                                </p>
                            </div>
                        </div>

                        {/* Selector de equipo activo a inspeccionar */}
                        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                            {items.map((it, idx) => {
                                const hasDefect = CRITERIOS_CAIDAS.some(c => it[c.key] === 'X');
                                return (
                                    <button
                                        key={it.id}
                                        type="button"
                                        onClick={() => setActiveItemIndex(idx)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                                            activeItemIndex === idx
                                                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                                        }`}
                                    >
                                        <span>#{idx + 1} {it.tipo === 'A' ? 'Arnés' : 'Línea'}</span>
                                        {hasDefect ? (
                                            <span className="text-red-500 font-black">❌</span>
                                        ) : (
                                            <span className="text-emerald-600 font-bold">✓</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <InteractiveCaidasInspector
                        equipmentType={activeItem.tipo}
                        selectedTarget={activeItem.subtipo || (activeItem.tipo === 'A' ? 'arnes' : (activeItemIndex === 1 ? 'linea_absorbedor' : 'linea_posicionamiento'))}
                        code={activeItem.codigo}
                        workerName={activeItem.trabajador || `Equipo #${activeItemIndex + 1}`}
                        hotspotStatus={hotspotStatus}
                        arnesStatus={arnesItem}
                        lineaAbsorbedorStatus={lineaAbsItem}
                        lineaPosicionamientoStatus={lineaPosItem}
                        onToggleHotspot={handleToggleHotspot}
                        onToggleCriterion={handleToggleCriterion}
                        onSetAllConformeTarget={handleSetAllConformeTarget}
                    />
                </div>

                {/* 3. LISTA MATRICIAL DE EQUIPOS INSPECCIONADOS (F-OP-017) */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                    <div className="bg-slate-100 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h2 className="font-bold text-slate-800 text-sm uppercase">
                                Registro de Equipos Inspeccionados ({items.length})
                            </h2>
                            <p className="text-xs text-slate-500">
                                Ingrese el trabajador, tipo de equipo (A o L), código y marque con check (V) o aspa (X)
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={addItem}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                        >
                            <Plus size={16} /> Añadir Equipo / Fila
                        </button>
                    </div>

                    <div className="p-4 space-y-4">
                        {items.map((it, idx) => {
                            const isSelected = activeItemIndex === idx;
                            const hasDefects = CRITERIOS_CAIDAS.some(c => it[c.key] === 'X');

                            return (
                                <div 
                                    key={it.id} 
                                    onClick={() => setActiveItemIndex(idx)}
                                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                                        isSelected 
                                            ? 'border-amber-400 bg-amber-50/20 shadow-md ring-2 ring-amber-400/20' 
                                            : 'border-slate-200 bg-white hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                                                hasDefects ? 'bg-red-500 text-white' : 'bg-slate-800 text-white'
                                            }`}>
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-sm">
                                                    {it.trabajador || `Trabajador sin nombre (${idx + 1})`}
                                                </h4>
                                                <span className="text-[11px] font-semibold text-slate-500">
                                                    Tipo: <b className="text-amber-600">
                                                        {it.subtipo === 'arnes' || it.tipo === 'A' ? '🧍‍♂️ Arnés de Cuerpo Entero (A)' :
                                                         it.subtipo === 'linea_absorbedor' ? '🪢 Línea con Amortiguador (L)' :
                                                         '🪢 Línea sin Amortiguador / Posicionamiento (L)'}
                                                    </b> | Código: <b className="font-mono">{it.codigo || '-'}</b>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const copy = [...items];
                                                    copy[idx] = { ...copy[idx], correas: 'V', costuras: 'V', anillos: 'V', mosquetones: 'V', hebillas: 'V', gatillo: 'V' };
                                                    setItems(copy);
                                                    const target = it.subtipo || (it.tipo === 'A' ? 'arnes' : (idx === 1 ? 'linea_absorbedor' : 'linea_posicionamiento'));
                                                    const updated = { ...hotspotStatus };
                                                    CAIDAS_HOTSPOTS.filter(s => s.target === target).forEach(s => { updated[s.id] = 'V'; });
                                                    setHotspotStatus(updated);
                                                }}
                                                className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                                                title="Marcar todos los criterios en V para este equipo"
                                            >
                                                <Check size={12} /> Todo V
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => duplicateItem(idx, e)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Duplicar equipo"
                                            >
                                                <Copy size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => removeItem(idx, e)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Eliminar fila"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Campos de fila */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4" onClick={(e) => e.stopPropagation()}>
                                        <div className="sm:col-span-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Trabajador Asignado</label>
                                            <VoiceInput 
                                                value={it.trabajador} 
                                                placeholder="Nombre y Apellidos del trabajador"
                                                onChange={(val: string) => handleTrabajadorChange(idx, val)} 
                                                inputClass="w-full border border-slate-200 p-2 text-xs rounded bg-slate-50 outline-none focus:border-amber-500 font-bold" 
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Equipo: Arnés o Línea</label>
                                            <select
                                                value={it.tipo}
                                                onChange={(e) => {
                                                    const newT = e.target.value as 'A' | 'L';
                                                    updateItem(idx, 'tipo', newT);
                                                    if (newT === 'A') updateItem(idx, 'subtipo', 'arnes');
                                                    else if (!it.subtipo || it.subtipo === 'arnes') updateItem(idx, 'subtipo', 'linea_absorbedor');
                                                }}
                                                className="w-full border border-slate-200 p-2 text-xs rounded bg-slate-50 outline-none focus:border-amber-500 font-bold text-amber-700"
                                            >
                                                <option value="A">Arnés (A)</option>
                                                <option value="L">Línea de Vida (L)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Código del Equipo</label>
                                            <VoiceInput 
                                                value={it.codigo} 
                                                placeholder="Ej: ARN-01 / LV-03"
                                                onChange={(val: string) => updateItem(idx, 'codigo', val)} 
                                                inputClass="w-full border border-slate-200 p-2 text-xs rounded bg-slate-50 outline-none focus:border-amber-500 font-mono font-bold" 
                                            />
                                        </div>
                                    </div>

                                    {/* Botones de Criterios (V o X) */}
                                    <div className="bg-slate-900 rounded-xl p-3 mb-3" onClick={(e) => e.stopPropagation()}>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2 text-center sm:text-left">
                                            Estado de los 6 Criterios de Seguridad:
                                        </span>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                                            {CRITERIOS_CAIDAS.map(c => {
                                                const isV = it[c.key] === 'V';
                                                return (
                                                    <button
                                                        key={c.key}
                                                        type="button"
                                                        onClick={() => {
                                                            const newVal: 'V' | 'X' = isV ? 'X' : 'V';
                                                            updateItem(idx, c.key, newVal);
                                                            const target = it.subtipo || (it.tipo === 'A' ? 'arnes' : (idx === 1 ? 'linea_absorbedor' : 'linea_posicionamiento'));
                                                            const updated = { ...hotspotStatus };
                                                            CAIDAS_HOTSPOTS.filter(s => s.target === target && s.key === c.key).forEach(s => { updated[s.id] = newVal; });
                                                            setHotspotStatus(updated);
                                                        }}
                                                        className={`p-2 rounded-lg border text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                                                            isV 
                                                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50' 
                                                                : 'bg-red-950/60 border-red-500/70 text-red-300 shadow-md shadow-red-900/30'
                                                        }`}
                                                    >
                                                        <span className="text-[10px] text-slate-300">{c.label}</span>
                                                        <span className="text-sm font-black">
                                                            {isV ? 'V ✓' : 'X ❌'}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Observaciones y Foto de Evidencia de esta fila */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3" onClick={(e) => e.stopPropagation()}>
                                        <div className="md:col-span-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Observaciones del Equipo</label>
                                            <VoiceInput 
                                                value={it.observaciones} 
                                                placeholder="Ej: Costura desgastada en hombro derecho / Operativo"
                                                onChange={(val: string) => updateItem(idx, 'observaciones', val)} 
                                                inputClass="w-full border border-slate-200 p-2 text-xs rounded bg-slate-50 outline-none focus:border-amber-500" 
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Foto de Evidencia</label>
                                            {!it.fotoEvidencia ? (
                                                <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-2 bg-slate-50 hover:bg-slate-100 flex items-center justify-center gap-2 cursor-pointer transition-colors">
                                                    <Camera size={14} className="text-slate-500" />
                                                    <span className="text-xs font-bold text-slate-600">Subir Foto</span>
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        capture="environment" 
                                                        onChange={(e) => handlePhotoUpload(idx, e)} 
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                                    />
                                                </div>
                                            ) : (
                                                <div className="relative inline-block">
                                                    <img src={it.fotoEvidencia} alt="Evidencia" className="h-16 w-24 object-cover rounded-lg border border-slate-300 shadow-sm" />
                                                    <button 
                                                        type="button"
                                                        onClick={() => updateItem(idx, 'fotoEvidencia', '')} 
                                                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                                        title="Eliminar foto"
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 4. NOTA TÉCNICA OFICIAL F-OP-017 */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 space-y-2">
                    <h4 className="font-black uppercase flex items-center gap-1.5 text-amber-900">
                        <AlertTriangle size={15} /> Nota Técnica para el Supervisor (F-OP-017)
                    </h4>
                    <p className="leading-relaxed">
                        El supervisor debe verificar el estado del arnés como de la línea de anclaje que está siendo utilizada. Inspeccionar la fibra doblándola en forma de <b>"V" invertida</b> con las manos en un tramo de 6 a 8”. Buscar bordes maltratados, fibras rotas, costuras mal hechas, cortadas o daño químico. Poner especial atención a la parte que está alrededor de las hebillas y del aro-D. Revisar los Aros - D si hay distorsión, puntas afiladas, quemaduras, partes rotas o desgastadas, oxidadas. Ribetes encajados fuertemente y sin ningún daño alrededor de la orilla del ribete.
                    </p>
                </div>

                {/* 5. FIRMAS DE RESPONSABLES */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
                    <h3 className="font-bold text-slate-800 text-sm uppercase mb-4">
                        Firmas y Responsables de la Inspección
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                            <h4 className="text-xs font-black text-slate-700 uppercase">Inspeccionado por (Jefe de Grupo)</h4>
                            <p className="text-xs font-bold text-slate-800">{meta.inspeccionadoPor || 'Inspector'}</p>
                            <label className="text-[10px] font-black text-slate-400 uppercase block">Firma Digital</label>
                            <SignaturePad onSave={(val: string) => setMeta({ ...meta, firmaInspector: val })} />
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                            <h4 className="text-xs font-black text-slate-700 uppercase">Verificado por (Responsable SSMA)</h4>
                            <VoiceInput 
                                value={meta.verificadoPor} 
                                placeholder="Nombre del Responsable SSMA"
                                onChange={(val: string) => setMeta({ ...meta, verificadoPor: val })} 
                                inputClass="w-full border-b border-slate-200 p-1 text-xs focus:border-amber-500 outline-none bg-white font-bold" 
                            />
                            <label className="text-[10px] font-black text-slate-400 uppercase block">Firma Digital</label>
                            <SignaturePad onSave={(val: string) => setMeta({ ...meta, firmaVerificador: val })} />
                        </div>
                    </div>
                </div>

                {/* BOTÓN FLOTANTE / INFERIOR DE GUARDAR Y DESCARGAR */}
                <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 sticky bottom-4 z-20">
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm">¿Listo para exportar el reporte?</h4>
                        <p className="text-xs text-slate-500">Se generará el archivo oficial en Excel F-OP-017 con las firmas y evidencias en paralelo.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setShowEmailModal(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-3 rounded-xl text-sm transition-all shadow-md flex items-center gap-2"
                        >
                            <Mail size={18} /> Enviar por Correo
                        </button>
                        <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleSaveAndDownload(false)}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-black px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-amber-600/30 flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Guardar y Descargar Excel
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL DE ENVÍO POR CORREO */}
            <EmailReportModal
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                onSend={(data) => handleSaveAndDownload(true, data)}
                defaultSubject={`Inspección de EPP contra caídas - ${meta.proyecto} (${meta.fecha})`}
                defaultMessage={`Estimados,\n\nSe remite el reporte oficial de Inspección de Equipos Contra Caídas (F-OP-017) realizado en el proyecto ${meta.proyecto}.\n\n[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]\n\nSaludos cordiales,\n${meta.inspeccionadoPor || 'Equipo SSMA'}`}
                initialData={{
                    responsable: meta.inspeccionadoPor,
                    area: meta.proyecto,
                    zone: meta.area
                }}
                contacts={contactos}
                onResponsableChange={(resp) => setResponsableLevantamiento(resp)}
            />
        </div>
    );
}
