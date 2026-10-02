"use client";

import React, { useState, useRef, useEffect } from 'react';
import { EmailReportModal } from '@/components/EmailReportModal';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Mic, MicOff, Trash2, Camera, Save, Loader2, ArrowLeft, ShieldCheck, AlertCircle , Mail, Shield, PlusCircle, Copy, ChevronRight, X} from 'lucide-react';

interface KitAntiderrameCustomFormProps {
    moduleName: string;
    version: number;
    SignaturePad: React.ComponentType<{ onSave: (data: string) => void }>;
}

const KIT_ITEMS = [
    { name: 'Cilindro de Kit antiderrame', reqQty: '1' },
    { name: 'Bandeja Anti derrame de madera o metal', reqQty: '1' },
    { name: 'Paños absorbentes (blanco)', reqQty: '20' },
    { name: 'Paños absorbentes (Amarillo)', reqQty: '20' },
    { name: 'Trapos Industriales', reqQty: '20' },
    { name: 'Bolsas Rojas', reqQty: '10' },
    { name: 'Bolsas Negras', reqQty: '10' },
    { name: 'Pala', reqQty: '1' },
    { name: 'Pico', reqQty: '1' },
    { name: 'Guantes de nitrilo', reqQty: '2' },
    { name: 'Guantes de Neoprene', reqQty: '2' },
    { name: 'Salchichas absorventes', reqQty: '2' },
    { name: 'Respirador media Cara O Mascarrilla descartable', reqQty: '2' },
    { name: 'Trajes Tivek', reqQty: '2' }
];

const VoiceInput = ({ value, onChange, placeholder, className, inputClass = "", type = "text" }: any) => {
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
            {type === 'textarea' ? (
                <textarea 
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`${inputClass} bg-white text-slate-900 pr-16 transition-colors`}
                    rows={3}
                />
            ) : (
                <input 
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`${inputClass} bg-white text-slate-900 pr-16 transition-colors`}
                />
            )}
            <div className="absolute right-2 top-2 flex flex-col items-center gap-1">
                {value && (
                    <button onClick={() => onChange('')} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-200 rounded-md transition-colors" title="Limpiar">
                        <Trash2 size={14} />
                    </button>
                )}
                <button onClick={toggleRecording} className={`p-1.5 rounded-md transition-colors ${isRecording ? 'text-red-500 bg-red-100 animate-pulse' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-200'}`} title="Dictado por voz">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/><line x1="8" x2="16" y1="22" y2="22"/></svg>
                </button>
            </div>
        </div>
    );
};

export function KitAntiderrameCustomForm({ moduleName, version, SignaturePad }: KitAntiderrameCustomFormProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [cachedDriveUrl, setCachedDriveUrl] = useState<string | null>(null);
    const [cachedLevantamientoLink, setCachedLevantamientoLink] = useState<string | null>(null);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailData, setEmailData] = useState<any>(null);
    const [responsableLevantamiento, setResponsableLevantamiento] = useState<{name: string, email: string} | null>(null);
    const [contactos, setContactos] = useState<{name: string, email: string}[]>([]);
    useEffect(() => { const stored = localStorage.getItem('ssoma_contacts'); if (stored) setContactos(JSON.parse(stored)); }, []);


    // Metadata Header
    const [meta, setMeta] = useState({
        proyecto: 'RED VIAL 6',
        lugar: '',
        fecha: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' }),
        tipoInspeccion: 'Planeada',
        inspector: '',
        cargoInspector: '',
        firmaInspector: '',
        responsable: '',
        cargoResponsable: '',
        firmaResponsable: ''
    });

    useEffect(() => {
        if (user && !meta.inspector) {
            setMeta(prev => ({
                ...prev,
                inspector: user.name || '',
                cargoInspector: user.role || ''
            }));
        }
    }, [user]);

    // Kits Array
    const [kits, setKits] = useState<any[]>([]);

    const addKit = () => {
        const initItems: any = {};
        KIT_ITEMS.forEach(item => {
            initItems[item.name] = { status: 'C', missingQty: '' };
        });

        setKits([...kits, {
            id: Date.now().toString(),
            codigo: '',
            ubicacion: '',
            expanded: true,
            items: initItems,
            observaciones: '',
            fotosDefectos: [] // Usamos el mismo diseño visual de evidencia
        }]);
    };

    useEffect(() => {
        if (kits.length === 0) {
            addKit();
        }
    }, []);

    const updateKit = (idx: number, field: string, val: any) => {
        const copy = [...kits];
        copy[idx][field] = val;
        setKits(copy);
    };

    const duplicateKit = (idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const itemToCopy = kits[idx];
        setKits([...kits, {
            ...itemToCopy,
            id: Date.now().toString(),
            expanded: true,
            codigo: itemToCopy.codigo + ' (Copia)'
        }]);
    };

    const handlePhotoUpload = (kIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
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
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
                    
                    const copy = [...kits];
                    if (!copy[kIdx].fotosDefectos) copy[kIdx].fotosDefectos = [];
                    copy[kIdx].fotosDefectos.push(compressedBase64);
                    setKits(copy);
                };
                img.src = event.target.result as string;
            }
        };
        reader.readAsDataURL(file);
    };

    const removePhoto = (kIdx: number, photoIdx: number) => {
        const copy = [...kits];
        copy[kIdx].fotosDefectos.splice(photoIdx, 1);
        setKits(copy);
    };

    const escapeRegExp = (string: string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const handleItemChange = (kitIdx: number, itemName: string, field: string, val: any) => {
        const copy = [...kits];
        
        copy[kitIdx].items[itemName][field] = val;
        
        const newStatus = copy[kitIdx].items[itemName].status;
        const newMissingQty = copy[kitIdx].items[itemName].missingQty || '';
        
        let obs = copy[kitIdx].observaciones || '';
        
        const safeItemName = itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(`\\[${safeItemName}:.*?\\]\\s*`, 'g');
        obs = obs.replace(searchRegex, '');
        
        if (newStatus === 'NC' || newStatus === 'F') {
            const labelStr = newStatus === 'NC' ? 'NO CONFORME' : 'FALTANTE';
            const qtyStr = newMissingQty ? ` - Cant: ${newMissingQty}` : '';
            const prefix = `[${itemName}: ${labelStr}${qtyStr}]`;
            obs = `${prefix}\n${obs}`.trim();
            obs = obs.replace(/\]\s+\[/g, ']\n[');
        }
        
        copy[kitIdx].observaciones = obs;
        setKits(copy);
    };

    const toggleExpand = (idx: number) => {
        const copy = [...kits];
        copy[idx].expanded = !copy[idx].expanded;
        setKits(copy);
    };

    
    const handleSaveAndDownload = async (isEmailing: boolean = false, customEmailData: any = null) => {
        if (kits.length === 0) {
            alert('Añade al menos un Kit evaluado.');
            return;
        }

        setIsSaving(true);
        try {
            const exportKits = kits.map(k => ({
                ...k,
                fotoEvidencia: k.fotosDefectos && k.fotosDefectos.length > 0 ? k.fotosDefectos[0] : ''
            }));

            const res = await fetch('/api/export-excel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    moduleName: 'Kit Antiderrame',
                    isKitAntiderrameMatrix: true,
                    meta,
                    kits: exportKits,
                    saveToDrive: true
                })
            });

            const badKits = kits.filter(k => Object.values(k.items).some((it: any) => it.status === 'NC' || it.status === 'F'));

            if (res.ok) {
                const data = await res.json();
                if (data.fileBase64) {
                    setCachedDriveUrl(data.driveUrl);
                    
                    if (!isEmailing) {
                        const byteCharacters = atob(data.fileBase64);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
                        const byteArray = new Uint8Array(byteNumbers);
                        const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                        
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = `Inspeccion_Kit_Antiderrame_${meta.fecha || new Date().toISOString().split('T')[0]}.xlsx`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                }

                // Guardar en Registro
                let inspectionRecordId = null;
                if (!isEmailing) {
                    try {
                        const dbRes = await fetch('/api/inspections', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'create',
                                data: {
                                    date: meta.fecha || new Date().toISOString().split('T')[0],
                                    responsible: meta.inspector || 'Supervisor SSOMA',
                                    inspectionType: 'Kit Antiderrame',
                                    area: meta.proyecto || 'RED VIAL 6',
                                    zone: meta.lugar || 'Inspección Digital',
                                    status: badKits.length > 0 ? 'Abierto' : 'Cerrado',
                                    observations: `${kits.length} kits inspeccionados. ${badKits.length > 0 ? badKits.length + " con observaciones." : ""}`,
                                    evidencePdf: data.driveUrl || '',
                                    evidenceImgs: []
                                }
                            })
                        });
                        const dbData = await dbRes.json();
                        if (dbData?.id) { inspectionRecordId = dbData.id; }
                    } catch(err: any) { console.error('Error DB:', err); }
                }

                // Generar Levantamiento
                let generatedLevantamientoLink = cachedLevantamientoLink;
                if (!isEmailing && responsableLevantamiento && badKits.length > 0) {
                    const respUser = responsableLevantamiento;
                    
                    const desc = badKits.map((b: any) => `- Kit ${b.codigo || 'S/N'} (${b.ubicacion || 'S/U'}):\n${b.observaciones || ''}`).join("\n\n");
                    
                    let allFotos: any = {};
                    badKits.forEach((b: any) => {
                        if (b.fotosDefectos && b.fotosDefectos.length > 0) {
                            const descLine = `- Kit ${b.codigo || 'S/N'} (${b.ubicacion || 'S/U'}):\n${b.observaciones || ''}`;
                            allFotos[descLine] = [b.fotosDefectos[0]];
                        }
                    });

                    const hallazgosArray = [{
                        index: 0,
                        descripcion: desc,
                        riesgo: 'Medio',
                        categoria: 'Condición Subestándar',
                        responsable: respUser?.name || "Responsable",
                        responsableEmail: respUser?.email || "responsable@casacontratistas.com",
                        fecha: meta.fecha || new Date().toISOString().split('T')[0],
                        fotosDefectos: allFotos
                    }];

                    try {
                        const lvRes = await fetch('/api/levantamiento/create', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                moduleName: 'Kit Antiderrame',
                                template: kits,
                                answers: meta,
                                inspectionRecordId,
                                hallazgos: hallazgosArray
                            })
                        });
                        if (lvRes.ok) {
                            const lvData = await lvRes.json();
                            if (lvData.items && lvData.items.length > 0) {
                                generatedLevantamientoLink = `${window.location.origin}/levantamiento/${lvData.items[0].token}`;
                                setCachedLevantamientoLink(generatedLevantamientoLink);
                            }
                        }
                    } catch(err) { console.error("Error levantamiento:", err); }
                }

                // Inject levantamiento link into email
                if (isEmailing && customEmailData) {
                    try {
                        const driveLink = cachedDriveUrl || data.driveUrl || '';
                        let bodyWithLink = customEmailData.message;
                        
                        if (generatedLevantamientoLink) {
                            bodyWithLink += '\n\n🔗 *Enlace para Levantamiento de Observaciones:*\n' + generatedLevantamientoLink;
                        }
                        
                        bodyWithLink = bodyWithLink.includes('[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]')
                            ? bodyWithLink.replace(
                                '[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]',
                                driveLink ? '📎 Enlace al reporte en Drive:\n' + driveLink : ''
                            )
                            : (driveLink ? bodyWithLink + '\n\n📎 Enlace al reporte en Drive:\n' + driveLink : bodyWithLink);

                        const emailRes = await fetch('/api/send-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                to: customEmailData.to,
                                cc: customEmailData.cc,
                                subject: customEmailData.subject,
                                text: bodyWithLink,
                                html: bodyWithLink.replace(/\n/g, '<br>').replace(
                                    /(https?:\/\/[^\s]+)/g,
                                    '<a href="$1" style="color:#1a73e8;font-weight:bold;">📄 Abrir Enlace</a>'
                                ),
                                fromEmail: customEmailData.fromEmail,
                                fromName: customEmailData.fromName
                            })
                        });
                        if (!emailRes.ok) throw new Error('Error enviando correo');
                        alert('✅ Correo enviado exitosamente.');
                        window.location.href = '/inspections?openDigital=true';
                    } catch (e) {
                        console.error(e);
                        alert('Hubo un error al enviar el correo, pero el reporte se generó en la plataforma.');
                    }
                } else {
                    if (window.confirm('¡Descarga y guardado exitoso!\n\n1. Por favor abre el Excel descargado.\n2. Si todo está correcto, haz clic en "Aceptar" para enviarlo por correo.\n3. Si quieres salir al panel, haz clic en "Cancelar".')) {
                        const badK = kits.filter(k => Object.values(k.items).some((it: any) => it.status === 'NC' || it.status === 'F'));
                        let extra = '';
                        if (responsableLevantamiento && badK.length > 0) {
                            extra = '\n\nSe ha detectado al menos un equipo con estado No Conforme / Faltante. Se adjuntará el enlace para levantar la observación y responder con la evidencia de reparación.';
                        }
                        
                        const obsText = desc ? '\n\nSegún la inspección realizada, se informa de las siguientes observaciones:\n\n' + desc.replace(/===KIT===/g, '\n') : '\n\nNo se reportaron observaciones adicionales.';
                        setEmailData({
                            to: user?.email || '',
                            cc: responsableLevantamiento ? responsableLevantamiento.email : '',
                            subject: '🚨 Reporte de Inspección: Kit Antiderrame',
                            message: 'Buenas tardes,\n\nAdjunto el enlace al reporte de inspección de Kit Antiderrame realizado en ' + (meta.lugar || 'campo') + '.' + extra + obsText + '\n\n[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]\n\nPor favor, revisar el documento adjunto.\n\nSaludos,\n' + (user?.name || ''),
                            fromEmail: user?.email || 'notificaciones@ssoma.com',
                            fromName: user?.name || 'Sistema SSOMA'
                        });
                        setShowEmailModal(true);
                    } else {
                        window.location.href = '/inspections?openDigital=true';
                    }
                }
            } else {
                alert('Error al conectar con el servidor.');
            }
        } catch (error) {
            console.error(error);
            alert('Ocurrió un error inesperado al exportar.');
        } finally {
            setIsSaving(false);
            if(isEmailing) setShowEmailModal(false);
        }
    };


    return (
        <div className="max-w-4xl mx-auto pb-24">
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => router.back()} className="text-slate-400 hover:text-white flex items-center gap-2 font-medium px-4 py-2 bg-slate-800 rounded-xl transition-colors">
                    <ArrowLeft size={18} /> Volver
                </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <ShieldCheck size={120} />
                </div>
                <h2 className="text-3xl font-black text-white tracking-tighter mb-2 relative z-10">
                    Inspección de Kit Antiderrame
                </h2>
                <p className="text-slate-400 font-medium relative z-10">Formato F-SIG-076 • Gestión Ambiental</p>
            </div>

            {/* SECCIÓN 1: DATOS GENERALES */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
                <h3 className="font-bold text-slate-800 text-sm border-b pb-2 mb-4">1. Datos Generales de la Inspección</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Proyecto</label>
                        <VoiceInput value={meta.proyecto} onChange={(val: string) => setMeta({...meta, proyecto: val})} inputClass="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-cyan-500 transition-colors" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Lugar de Inspección</label>
                        <VoiceInput value={meta.lugar} onChange={(val: string) => setMeta({...meta, lugar: val})} placeholder="Ej. Taller Mecánico..." inputClass="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-cyan-500 transition-colors" />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Fecha de Inspección</label>
                        <input type="date" value={meta.fecha} onChange={(e) => setMeta({...meta, fecha: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-cyan-500 transition-colors" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Tipo de Inspección</label>
                        <div className="flex gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 h-[46px] items-center">
                            <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer border-r border-slate-200 pr-2">
                                <input type="radio" checked={meta.tipoInspeccion === 'Planeada'} onChange={() => setMeta({...meta, tipoInspeccion: 'Planeada'})} className="accent-cyan-600" />
                                <span className="text-xs font-bold text-slate-700">Planeada</span>
                            </label>
                            <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer pl-2">
                                <input type="radio" checked={meta.tipoInspeccion === 'No Planeada'} onChange={() => setMeta({...meta, tipoInspeccion: 'No Planeada'})} className="accent-cyan-600" />
                                <span className="text-xs font-bold text-slate-700">No Planeada</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: KITS INSPECCIONADOS (Estilo Extintores) */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-slate-700 uppercase text-sm">Listado de Kits Evaluados</h2>
                    <span className="bg-cyan-100 text-cyan-800 text-xs font-bold px-3 py-1 rounded-full">{kits.length} kits registrados</span>
                </div>

                <div className="space-y-4">
                    {kits.map((kit, kIdx) => {
                        const hasBadItem = Object.values(kit.items).some((it: any) => it.status === 'NC' || it.status === 'F');

                        return (
                            <div key={kit.id} className={`bg-white border shadow-sm rounded-xl overflow-hidden transition-all ${hasBadItem ? 'border-red-300' : 'border-slate-200'}`}>
                                {/* Header Card */}
                                <div 
                                    className={`p-4 flex justify-between items-center cursor-pointer ${hasBadItem ? 'bg-red-50' : 'bg-slate-50 hover:bg-slate-100'}`}
                                    onClick={() => toggleExpand(kIdx)}
                                >
                                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{kIdx + 1}</span>
                                            <h3 className="font-bold text-slate-800">{kit.codigo || 'Kit Sin Código'}</h3>
                                        </div>
                                        <div className="text-sm text-slate-500 flex gap-2">
                                            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs">{kit.ubicacion || 'Sin ubicación'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 sm:gap-3 ml-2">
                                        {hasBadItem && (
                                            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full hidden sm:block">NO CONFORME</span>
                                        )}
                                        <button onClick={(e) => duplicateKit(kIdx, e)} className="text-slate-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors" title="Duplicar">
                                            <Copy size={18} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setKits(kits.filter((_, i) => i !== kIdx)); }} className="text-slate-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors" title="Eliminar">
                                            <Trash2 size={18} />
                                        </button>
                                        <div className={`p-1 text-slate-400 transition-transform ${kit.expanded ? 'rotate-90' : ''}`}>
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                </div>

                                {/* Body Card */}
                                {kit.expanded && (
                                    <div className="p-4 sm:p-5 border-t border-slate-100 bg-white">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Código del Kit</label>
                                                <VoiceInput placeholder="Ej: KIT-01" value={kit.codigo} onChange={(val: string) => updateKit(kIdx, 'codigo', val)} inputClass="w-full border border-slate-200 p-2 text-sm rounded bg-slate-50 outline-none focus:border-cyan-500" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Ubicación Exacta</label>
                                                <VoiceInput placeholder="Ej: Taller principal - Pared norte" value={kit.ubicacion} onChange={(val: string) => updateKit(kIdx, 'ubicacion', val)} inputClass="w-full border border-slate-200 p-2 text-sm rounded bg-slate-50 outline-none focus:border-cyan-500" />
                                            </div>
                                        </div>

                                        <div className="mb-5">
                                            <h5 className="text-[10px] font-black text-slate-400 uppercase mb-3 border-b border-slate-100 pb-1">Verificación de Componentes</h5>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                                {KIT_ITEMS.map((item, idx) => {
                                                    const status = kit.items[item.name]?.status || 'C';
                                                    return (
                                                        <div key={idx} className={`flex flex-col gap-2 p-3 bg-slate-50 border rounded-xl transition-colors ${status === 'NC' || status === 'F' ? 'border-red-200 bg-red-50/30' : 'border-slate-200 hover:border-cyan-300'}`}>
                                                            <div className="flex justify-between items-start gap-2 h-8">
                                                                <label className="text-[10px] font-black text-slate-600 uppercase leading-tight flex-1">
                                                                    {item.name}
                                                                </label>
                                                                <span className="text-[9px] font-bold bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                                                                    Req: {item.reqQty}
                                                                </span>
                                                            </div>
                                                            <div className="flex bg-slate-200 p-1 rounded-lg">
                                                                <button 
                                                                    onClick={() => handleItemChange(kIdx, item.name, 'status', 'C')} 
                                                                    className={`flex-1 py-1.5 text-[10px] font-black rounded-md transition-all ${status === 'C' ? 'bg-emerald-400 text-slate-900 shadow-md border border-emerald-500' : 'text-slate-500 hover:bg-slate-300'}`}
                                                                >
                                                                    C
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleItemChange(kIdx, item.name, 'status', 'NC')} 
                                                                    className={`flex-1 py-1.5 text-[10px] font-black rounded-md transition-all ${status === 'NC' ? 'bg-amber-400 text-slate-900 shadow-md border border-amber-500' : 'text-slate-500 hover:bg-slate-300'}`}
                                                                >
                                                                    NC
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleItemChange(kIdx, item.name, 'status', 'F')} 
                                                                    className={`flex-1 py-1.5 text-[10px] font-black rounded-md transition-all ${status === 'F' ? 'bg-red-500 text-white shadow-md border border-red-600' : 'text-slate-500 hover:bg-slate-300'}`}
                                                                >
                                                                    F
                                                                </button>
                                                            </div>
                                                            {(status === 'F' || status === 'NC') && (
                                                                <input 
                                                                    type="number"
                                                                    min="0"
                                                                    placeholder="Cant. Faltante" 
                                                                    value={kit.items[item.name]?.missingQty || ''}
                                                                    onChange={(e) => handleItemChange(kIdx, item.name, 'missingQty', e.target.value)}
                                                                    className="w-full bg-white border border-red-300 rounded-md text-xs px-2 py-1.5 outline-none focus:border-red-500 text-red-900 font-medium mt-1"
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Observaciones del Kit</label>
                                                <VoiceInput 
                                                    type="textarea" 
                                                    placeholder="Detallar hallazgos, faltantes, etc..." 
                                                    value={kit.observaciones} 
                                                    onChange={(val: string) => updateKit(kIdx, 'observaciones', val)} 
                                                    inputClass="w-full border border-slate-200 p-3 text-sm rounded-lg bg-slate-50 outline-none focus:border-cyan-500 min-h-[90px]" 
                                                />
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                                                        <Camera size={14} className="text-slate-500" /> Fotos del Kit
                                                    </label>
                                                    <label className="cursor-pointer text-xs font-bold text-cyan-700 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-lg border border-cyan-200 transition-colors flex items-center gap-1.5">
                                                        <Camera size={14} /> Añadir Foto
                                                        <input 
                                                            type="file" 
                                                            accept="image/*" 
                                                            capture="environment" 
                                                            multiple 
                                                            className="hidden" 
                                                            onChange={(e) => handlePhotoUpload(kIdx, e)} 
                                                        />
                                                    </label>
                                                </div>

                                                {(kit.fotosDefectos && kit.fotosDefectos.length > 0) ? (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {kit.fotosDefectos.map((photoB64: string, pIdx: number) => (
                                                            <div key={pIdx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 shadow-sm group">
                                                                <img src={photoB64} alt="Evidencia" className="w-full h-full object-cover" />
                                                                <button 
                                                                    onClick={() => removePhoto(kIdx, pIdx)} 
                                                                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 transition-colors shadow"
                                                                    title="Eliminar foto"
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-slate-400 bg-slate-50 p-4 border border-dashed border-slate-200 rounded-lg text-center">
                                                        No hay fotos agregadas
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <button onClick={addKit} className="w-full mt-4 py-4 rounded-xl border-2 border-dashed border-cyan-300 text-cyan-600 font-bold hover:bg-cyan-50 transition-colors flex items-center justify-center gap-2">
                    <PlusCircle size={18} /> Añadir otro Kit Antiderrame
                </button>
            </div>

            
            {/* Panel de Asignación de Levantamiento */}
            {kits.filter(k => Object.values(k.items).some((it: any) => it.status === 'NC' || it.status === 'F')).length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-8 shadow-sm">
                    <h3 className="font-bold text-orange-800 text-sm mb-2 flex items-center gap-1.5">
                        <AlertCircle size={16} /> Asignar Levantamiento de Observación General
                    </h3>
                    <p className="text-xs text-orange-700 mb-3">
                        Se ha detectado kit(s) con observación. Asigna un responsable para corregir esta situación general.
                    </p>
                    <div className="relative">
                        <select
                            className="w-full bg-white border border-orange-300 px-4 py-3 rounded-xl text-slate-800 text-sm font-semibold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all appearance-none cursor-pointer"
                            onChange={(e) => {
                                const c = contactos.find(x => x.email === e.target.value);
                                setResponsableLevantamiento(c || null);
                            }}
                        >
                            <option value="">-- No enviar solicitud de levantamiento --</option>
                            {contactos.map(c => (
                                <option key={c.email} value={c.email}>{c.name} ({c.email})</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-orange-400">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                    </div>
                </div>
            )}

            {/* SECCIÓN 3: FIRMAS */}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-8">
                <h3 className="font-bold text-slate-800 text-sm border-b pb-2 mb-4">3. Aprobaciones y Firmas</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Firma Inspector */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Inspeccionado por (Nombres):</label>
                            <VoiceInput value={meta.inspector} onChange={(val: string) => setMeta({...meta, inspector: val})} placeholder="Nombres y Apellidos..." inputClass="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-500" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Cargo:</label>
                            <VoiceInput value={meta.cargoInspector} onChange={(val: string) => setMeta({...meta, cargoInspector: val})} placeholder="Ej. Supervisor SSOMA" inputClass="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-500" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Firma Digital (Obligatorio)</label>
                            <SignaturePad onSave={(data) => setMeta({...meta, firmaInspector: data})} />
                        </div>
                    </div>

                    {/* Firma Responsable */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Responsable del Área (Nombres):</label>
                            <VoiceInput value={meta.responsable} onChange={(val: string) => setMeta({...meta, responsable: val})} placeholder="Nombres y Apellidos..." inputClass="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-500" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Cargo:</label>
                            <VoiceInput value={meta.cargoResponsable} onChange={(val: string) => setMeta({...meta, cargoResponsable: val})} placeholder="Ej. Residente de Obra" inputClass="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-500" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Firma Digital</label>
                            <SignaturePad onSave={(data) => setMeta({...meta, firmaResponsable: data})} />
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTÓN FINALIZAR */}
            
            
            {/* BOTÓN FINALIZAR */}
            <div className="sticky bottom-4 z-40">
                <button 
                    onClick={() => handleSaveAndDownload(false)} 
                    disabled={isSaving} 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-600/30 transition-transform active:scale-95 disabled:opacity-50 text-base"
                >
                    {isSaving && !showEmailModal ? <Loader2 size={22} className="animate-spin" /> : <Save size={22} />}
                    {isSaving && !showEmailModal ? 'Generando Excel...' : 'Finalizar Inspección (Descargar y Guardar)'}
                </button>
            </div>

            {showEmailModal && (
                <EmailReportModal
                    isOpen={showEmailModal}
                    onClose={() => setShowEmailModal(false)}
                    onSend={(data) => handleSaveAndDownload(true, data)}
                    initialData={emailData}
                    isSending={isSaving}
                    contactos={contactos}
                />
            )}
        </div>
    );
}

