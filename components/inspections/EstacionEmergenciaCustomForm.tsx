"use client";

import React, { useState, useRef, useEffect } from 'react';
import { EmailReportModal } from '@/components/EmailReportModal';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, Camera, Save, Loader2, ArrowLeft, Mail, X, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const sectionsToRender = [
    {
        title: 'INSPECCIÓN DE ESTACIÓN DE PRIMEROS AUXILIOS',
        items: [
            'Paquetes de guantes quirúrgicos',
            'Frasco de yodopovidoma 120 ml solución antiséptico',
            'Frasco de agua oxigenada mediano 120 ml',
            'Frasco de alcohol mediano 250 ml',
            'Paquetes de gasas esterilizadas de 10 cm x 10 cm',
            'Paquetes de apósitos (05 para Sede Central)',
            'Rollo de esparadrapo 5 cm x 4.5 cm',
            'Rollos de venda elástica de 3 plg. X 5 yardas',
            'Rollos de venda elástica de 4 plg. X 5 yardas',
            'Paquete de algodón x 100 g',
            'Venda triangular',
            'Paletas baja lengua (para entabillado de dedos)',
            'Frasco de solución de cloruro de sodio al 9/1000 x 1 l (para lavado de heridas)',
            'Paquetes de gasa tipo jelonet (para quemaduras)',
            'Frascos de colirio de 10 ml (01 para Sede Central)',
            'Tijera punta roma',
            'Pinza',
            'Jabón germicida (solo para Sede Central)',
            'Curitas (solo para Sede Central)',
            'Lava ojo portàtil',
            'Camilla rìgida - inmovilizador de cabeza',
            'frazada',
            'Collarìn regulable',
            'extintor',
            'Registro para control de entrada y salida e insumos',
            'Férula inmovilizadora'
        ]
    }
];

export default function EstacionEmergenciaCustomForm({ SignaturePad }: { SignaturePad: any }) {
    const router = useRouter();
    const { user } = useAuth();

    const [meta, setMeta] = useState({
        hora: (() => { const now = new Date(); return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`; })(),
        proyecto: 'RED VIAL 6',
        area: '',
        fecha: new Date().toISOString().split('T')[0],
        inspector: user?.name || '',
        cargo: '',
        responsable: '',
        tipoInspeccion: 'Planificada'
    });

    const [checklist, setChecklist] = useState<Record<string, string>>({});
    const [observaciones, setObservaciones] = useState('');
    const [itemComments, setItemComments] = useState<Record<string, string>>({});
    const [fotosDefectos, setFotosDefectos] = useState<Record<string, string[]>>({});

    useEffect(() => {
        const newChecklist: Record<string, string> = {};
        sectionsToRender.forEach(section => {
            section.items.forEach(item => {
                newChecklist[item] = 'OK';
            });
        });
        setChecklist(newChecklist);
    }, []);

    const [firmas, setFirmas] = useState({
        inspectorFirma: '',
        responsableFirma: '',
        inspectorNombre: user?.name || '',
        responsableNombre: ''
    });

    useEffect(() => {
        if (user && !firmas.inspectorNombre) {
            setFirmas(prev => ({ ...prev, inspectorNombre: user.name || '' }));
            setMeta(prev => ({ ...prev, inspector: user.name || '' }));
        }
    }, [user]);

    const recognitionRef = useRef<any>(null);
    const [isRecordingMeta, setIsRecordingMeta] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'es-ES';
        }
    }, []);

    const toggleDictation = (field: string, isFirma = false, isItemComment = false) => {
        if (isRecordingMeta === field) {
            recognitionRef.current?.stop();
            setIsRecordingMeta(null);
            return;
        }
        if (recognitionRef.current) {
            setIsRecordingMeta(field);
            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                let newText = transcript;
                if (isFirma) {
                    newText = transcript;
                } else if (isItemComment) {
                    const existing = itemComments[field] || '';
                    newText = existing ? existing + ' ' + transcript : transcript;
                } else if (field === 'observaciones') {
                    newText = observaciones ? observaciones + ' ' + transcript : transcript;
                } else {
                    newText = transcript;
                }

                if (isFirma) {
                    setFirmas(prev => ({ ...prev, [field]: newText }));
                } else if (isItemComment) {
                    handleItemComment(field, newText);
                } else if (field === 'observaciones') {
                    setObservaciones(newText);
                } else {
                    setMeta(prev => ({ ...prev, [field]: newText }));
                    if (field === 'inspector') {
                        setFirmas(prev => ({ ...prev, inspectorNombre: newText }));
                    } else if (field === 'responsable') {
                        setFirmas(prev => ({ ...prev, responsableNombre: newText }));
                    }
                }
            };
            recognitionRef.current.onend = () => setIsRecordingMeta(null);
            recognitionRef.current.start();
        } else {
            alert("El dictado por voz no está soportado en este navegador.");
        }
    };

    const handleItemComment = (item: string, comment: string) => {
        setItemComments(prev => ({ ...prev, [item]: comment }));
        setObservaciones(prev => {
            let next = prev;
            const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp('- ' + escapeRegex(item) + ' \\(NC\\)(: .*)?\\n?', 'g');
            next = next.replace(regex, '');
            if (['NC'].includes(checklist[item])) {
                const prefix = comment ? `- ${item} (NC): ${comment}` : `- ${item} (NC)`;
                next = next ? next.trim() + '\n' + prefix : prefix;
            }
            return next.trim();
        });
    };

    const handleCheck = (item: string, value: string) => {
        setChecklist(prev => ({ ...prev, [item]: value }));
        
        setObservaciones(prev => {
            let next = prev;
            const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp('- ' + escapeRegex(item) + ' \\(NC\\)(: .*)?\\n?', 'g');
            next = next.replace(regex, '');
            
            if (['NC'].includes(value)) {
                const currentComment = itemComments[item];
                const prefix = currentComment ? `- ${item} (NC): ${currentComment}` : `- ${item} (NC)`;
                next = next ? next.trim() + '\n' + prefix : prefix;
            }
            return next.trim();
        });
    };

    const handlePhotoUploadDefecto = (item: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    setFotosDefectos(prev => {
                        const current = prev[item] || [];
                        return { ...prev, [item]: [...current, ev.target!.result as string] };
                    });
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhotoDefecto = (item: string, photoIdx: number) => {
        setFotosDefectos(prev => {
            const current = prev[item] || [];
            return { ...prev, [item]: current.filter((_, i) => i !== photoIdx) };
        });
    };

    const renderMicInput = (label: string, field: string, value: string, isFirma = false) => (
        <div>
            <label className="text-[10px] font-black text-slate-400 uppercase">{label}</label>
            <div className="relative flex items-center mt-1">
                <input 
                    type="text" 
                    value={value} 
                    onChange={e => {
                        if (isFirma) setFirmas(prev => ({ ...prev, [field]: e.target.value }));
                        else {
                            setMeta(prev => ({ ...prev, [field]: e.target.value }));
                            if (field === 'inspector') setFirmas(prev => ({ ...prev, inspectorNombre: e.target.value }));
                            if (field === 'responsable') setFirmas(prev => ({ ...prev, responsableNombre: e.target.value }));
                        }
                    }}
                    className={"w-full border-b p-2 text-sm focus:border-emerald-500 outline-none bg-slate-50 " + (isRecordingMeta === field ? "border-red-400 bg-red-50/50 pr-10" : "border-slate-200 pr-10")} 
                />
                <button type="button" onClick={() => toggleDictation(field, isFirma)} className={"absolute right-2 p-1.5 rounded-full transition-colors " + (isRecordingMeta === field ? "bg-red-100 text-red-500 animate-pulse" : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-blue-500")}>
                    <Mic size={14} />
                </button>
            </div>
        </div>
    );

    const [isSaving, setIsSaving] = useState(false);
    const [cachedDriveUrl, setCachedDriveUrl] = useState<string | null>(null);
    const [cachedLevantamientoLink, setCachedLevantamientoLink] = useState<string | null>(null);
    const [showEmailModal, setShowEmailModal] = useState(false);
        
    const badItemsList = Object.entries(checklist).filter(([_, val]) => ['NC'].includes(val));

    const handleSaveAndDownload = async (isEmailing = false, customEmailData: any = null) => {
        if (!meta.inspector.trim()) {
            alert('Por favor, indica el nombre del Inspector.');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/export-excel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    moduleName: "Estación de Emergencia",
                    isEstacionEmergenciaMatrix: true,
                    meta,
                    checklist,
                    observaciones,
                    firmas,
                    fotosDefectos,
                    saveToDrive: true
                })
            });

            if (res.ok) {
                const data = await res.json();
                let currentInspectionRecordId = null;

                if (data.fileBase64) {
                    setCachedDriveUrl(data.driveUrl);
                    if (!isEmailing) {
                        const byteCharacters = atob(data.fileBase64);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Inspeccion_Botiquines_${meta.fecha}_${Date.now()}.xlsx`;
                    document.body.appendChild(a);
                    a.click();
                        window.URL.revokeObjectURL(url);
                        a.remove();
                    }
                }

                // Guardar en BD local
                try {
                    const dbRes = await fetch('/api/inspections', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'create',
                            data: {
                                date: meta.fecha,
                                responsible: meta.responsable || firmas.responsableNombre || "Responsable",
                                inspectionType: 'Inspección de Estación de Primeros Auxilios',
                                area: meta.proyecto,
                                zone: meta.ubicacion || 'Inspección Digital',
                                status: badItemsList.length > 0 ? 'Abierto' : 'Cerrado',
                                observations: observaciones || 'Generado desde formulario blindado de Almacenes.',
                                evidencePdf: data.driveUrl || '',
                                evidenceImgs: []
                            }
                        })
                    });
                    if (dbRes.ok) {
                        const dbData = await dbRes.json();
                        currentInspectionRecordId = dbData.id;
                    }
                } catch (e) {
                    console.error("Error saving to local DB:", e);
                }

                let generatedLevantamientoLink = cachedLevantamientoLink;

                if (badItemsList.length > 0 && !generatedLevantamientoLink) {
                    try {
                        const lvRes = await fetch('/api/levantamiento/create', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                moduleName: "Estación de Emergencia",
                                template: checklist,
                                answers: { ...meta, observaciones, firmas, fotosDefectos },
                                inspectionRecordId: currentInspectionRecordId,
                                hallazgos: [{
                                    index: 0,
                                    descripcion: badItemsList.map(([key]) => key + (itemComments[key] ? `: ${itemComments[key]}` : '')).join('\n'),
                                    riesgo: 'Medio',
                                    categoria: 'Condición Subestándar',
                                    responsable: meta.responsable || firmas.responsableNombre || "Responsable",
                                    responsableEmail: user?.email || "responsable@casacontratistas.com",
                                    fecha: meta.fecha || new Date().toISOString().split('T')[0],
                                    fotosDefectos: Object.keys(fotosDefectos).length > 0 ? fotosDefectos : {}
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
                    } catch(err) { console.error("Error generating levantamiento:", err); }
                }

                if (isEmailing && customEmailData) {
                    try {
                        const driveLink = data.driveUrl || cachedDriveUrl;
                        let bodyWithLink = customEmailData.message.includes('[📎')
                            ? customEmailData.message.replace('[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]', '📎 Enlace al reporte en Drive:\n' + driveLink)
                            : (driveLink ? customEmailData.message + '\n\n📎 Enlace al reporte en Drive:\n' + driveLink : customEmailData.message);

                        if (generatedLevantamientoLink) {
                            bodyWithLink += '\n\n✅ Enlace de Levantamiento de Observaciones:\n' + generatedLevantamientoLink;
                        }

                        let htmlBody = bodyWithLink.replace(/\n/g, '<br>').replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" style="color:#1a73e8;font-weight:bold;">📄 Ver / Descargar Reporte</a>');
                        
                        if (generatedLevantamientoLink) {
                            htmlBody += '<br><br><p style="text-align:center;background:#f0fdf4;padding:16px;border-radius:12px;border:1px solid #bbf7d0;"><a href="' + generatedLevantamientoLink + '" style="background:#059669;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;font-size:16px;">✅ Ingresar para Levantar Observaciones</a></p>';
                        }

                        const emailRes = await fetch('/api/send-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                to: customEmailData.to,
                                cc: customEmailData.cc,
                                subject: customEmailData.subject,
                                text: bodyWithLink,
                                html: htmlBody,
                                fromEmail: customEmailData.fromEmail,
                                fromName: customEmailData.fromName
                            })
                        });
                        if (!emailRes.ok) throw new Error('Error al enviar correo');
                        alert('✅ Correo enviado correctamente.');
                        window.location.href = '/inspections?openDigital=true';
                        return;
                    } catch (e) {
                        console.error(e);
                        alert('El Excel se guardó, pero hubo un error al enviar el correo.');
                    }
                }

                if (!isEmailing) {
                    if (window.confirm('¡Descarga y guardado exitoso!\n\n1. Por favor abre el Excel que se acaba de descargar y revísalo.\n2. Si todo está correcto, haz clic en "Aceptar" para enviarlo por correo ahora mismo.\n3. Si quieres salir, haz clic en "Cancelar".')) {
                        setShowEmailModal(true);
                    } else {
                        window.location.href = '/inspections?openDigital=true';
                    }
                }

                return {
                    driveUrl: data.driveUrl,
                    levantamientoLink: generatedLevantamientoLink
                };

            } else {
                const errorData = await res.json().catch(() => ({ error: 'Error desconocido' }));
                alert('Error al generar la inspección: ' + errorData.error);
            }
        } catch(e) {
            console.error(e);
            alert('Error de conexión al procesar la inspección.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-24">
            <div className="bg-slate-800 text-white p-6 shadow-lg relative z-10 mb-6">
                <button onClick={() => router.push('/inspections')} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors mb-4">
                    <ArrowLeft size={20} /> Volver
                </button>
                <h1 className="text-2xl font-black mb-1 text-emerald-400">INSPECCIÓN DE BOTIQUÍN</h1>
                <p className="text-slate-400 text-sm">Lista de chequeo F-SIG-028</p>
            </div>

            <div className="px-4 space-y-6">
                <div className="bg-white border-t-4 border-emerald-400 shadow-sm rounded-xl p-5 flex flex-col gap-4">
                    <h3 className="font-bold text-slate-800 border-b pb-2">Datos Generales</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {renderMicInput("Proyecto", "proyecto", meta.proyecto)}
                        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Hora</label>
                            <input type="time" value={meta.hora || ''} onChange={e => setMeta({...meta, hora: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase">Fecha</label>
                            <input type="date" value={meta.fecha} onChange={e => setMeta({...meta, fecha: e.target.value})} className="w-full border-b border-slate-200 p-2 text-sm focus:border-emerald-500 outline-none bg-slate-50 mt-1" />
                        </div>
                        {renderMicInput("Ubicación del Estación de Emergencia", "ubicacion", meta.ubicacion)}
                        {renderMicInput("Inspector", "inspector", meta.inspector)}
                        {renderMicInput("Cargo", "cargo", meta.cargo)}
                        {renderMicInput("Responsable de Área", "responsable", meta.responsable)}
                        
                        <div className="sm:col-span-2 lg:col-span-3 mt-2 flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <label className="text-[10px] font-black text-slate-500 uppercase">Tipo de Inspección:</label>
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 hover:text-emerald-600 transition-colors">
                                    <input type="radio" checked={meta.tipoInspeccion === 'Planificada'} onChange={() => setMeta({...meta, tipoInspeccion: 'Planificada'})} className="w-4 h-4 text-emerald-500 accent-emerald-500" />
                                    Inspección Planificada
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 hover:text-emerald-600 transition-colors">
                                    <input type="radio" checked={meta.tipoInspeccion === 'No Planificada'} onChange={() => setMeta({...meta, tipoInspeccion: 'No Planificada'})} className="w-4 h-4 text-emerald-500 accent-emerald-500" />
                                    Inspección No Planificada
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-100 p-3 rounded-lg flex flex-wrap gap-x-6 gap-y-2 text-[10px] sm:text-xs text-slate-600 border border-slate-200">
                    <div className="flex items-center gap-1"><span className="font-black bg-emerald-500 text-white px-1 rounded">OK</span> Cumple</div>
                    <div className="flex items-center gap-1"><span className="font-black bg-red-500 text-white px-1 rounded">NC</span> No Conforme</div>
                    <div className="flex items-center gap-1"><span className="font-black bg-slate-400 text-white px-1 rounded">N/A</span> No aplica</div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-black text-slate-800 text-center uppercase tracking-wider">Lista de Chequeo</h2>
                    {sectionsToRender.map((section, sIdx) => (
                        <div key={sIdx} className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                            <div className="bg-slate-800 p-3">
                                <h3 className="font-bold text-emerald-400 text-sm uppercase">{section.title}</h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {section.items.map((item) => (
                                    <div key={item} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                                        <div className="text-sm font-semibold text-slate-700 flex-1 pr-4">
                                            {item}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {['OK', 'NC', 'N/A'].map(opt => {
                                                const isSelected = checklist[item] === opt;
                                                let bg = "bg-slate-100 text-slate-400 border-slate-200";
                                                if (isSelected) {
                                                    if (opt === 'OK') bg = "bg-emerald-500 text-white border-emerald-600 shadow-inner";
                                                    if (opt === 'NC') bg = "bg-red-500 text-white border-red-600 shadow-inner";
                                                    if (opt === 'N/A') bg = "bg-slate-500 text-white border-slate-600 shadow-inner";
                                                }
                                                return (
                                                    <button
                                                        key={opt}
                                                        onClick={() => handleCheck(item, opt)}
                                                        className={`w-10 h-10 rounded-lg font-black text-sm border flex items-center justify-center transition-all ${bg} ${!isSelected && 'hover:bg-slate-200'}`}
                                                    >
                                                        {opt}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {checklist[item] === 'NC' && (
                                            <div className="w-full mt-3 bg-red-50 p-3 rounded-lg border border-red-100 flex flex-col gap-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-red-600 uppercase">Detalle y Evidencia:</span>
                                                    <div className="flex gap-2">
                                                        <input type="file" id={`foto-${item}`} accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoUploadDefecto(item, e)} multiple />
                                                        <button onClick={() => document.getElementById(`foto-${item}`)?.click()} className="px-3 py-1.5 bg-white text-red-600 border border-red-200 rounded-md text-xs font-bold flex items-center gap-1.5 hover:bg-red-50 shadow-sm transition-colors">
                                                            <Camera size={14} /> {(fotosDefectos[item]?.length || 0) > 0 ? `Fotos (${fotosDefectos[item].length})` : 'Añadir Foto'}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="relative flex items-center">
                                                    <input 
                                                        type="text" 
                                                        value={itemComments[item] || ''}
                                                        onChange={e => handleItemComment(item, e.target.value)}
                                                        placeholder="Escriba o dicte el detalle de la observación..."
                                                        className={"w-full text-xs p-2.5 pr-16 rounded-md outline-none border focus:border-red-400 " + (isRecordingMeta === item ? "border-red-400 bg-red-100" : "border-red-200 bg-white")}
                                                    />
                                                    <div className="absolute right-1 flex items-center gap-1">
                                                        {itemComments[item] && (
                                                            <button onClick={() => handleItemComment(item, '')} className="p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 transition-colors">
                                                                <X size={12} />
                                                            </button>
                                                        )}
                                                        <button onClick={() => toggleDictation(item, false, true)} className={"p-1.5 rounded-full transition-colors " + (isRecordingMeta === item ? "text-red-500 bg-red-100 animate-pulse" : "text-slate-400 hover:text-blue-500 hover:bg-slate-100")}>
                                                            <Mic size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Observaciones del Chequeo</label>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => setObservaciones('')} className="p-1.5 rounded-full transition-colors flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-600">
                                    <X size={12} /> Borrar
                                </button>
                                <button type="button" onClick={() => toggleDictation('observaciones')} className={"p-1.5 rounded-full transition-colors flex items-center gap-1 text-[10px] font-bold " + (isRecordingMeta === 'observaciones' ? "bg-red-100 text-red-500 animate-pulse shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-blue-500")}>
                                    <Mic size={12} /> {isRecordingMeta === 'observaciones' ? 'Escuchando...' : 'Dictar'}
                                </button>
                            </div>
                        </div>
                        <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} className={"w-full border p-3 text-sm rounded-lg outline-none min-h-[80px] " + (isRecordingMeta === 'observaciones' ? "border-red-400 bg-red-50/30" : "border-slate-200 focus:border-emerald-500")} placeholder="Escriba o dicte aquí sus observaciones extra..." />
                    </div>

                                    {/* FOTOGRAFÍAS DE HALLAZGOS */}
                <div className="bg-white border-t-4 border-emerald-400 shadow-sm rounded-xl p-5 flex flex-col gap-4 mt-6">
                    <h3 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2"><Camera size={18} className="text-emerald-500" /> Evidencia Fotográfica de Hallazgos</h3>
                    
                    {badItemsList.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No hay hallazgos (NC) que requieran fotografía.</p>
                    ) : (
                        <div className="space-y-6">
                            {badItemsList.map(([item, val]) => (
                                <div key={item} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-bold text-slate-700 text-sm">{item} <span className="text-xs bg-white border border-slate-300 px-1.5 py-0.5 rounded ml-2">(NC)</span></h4>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {(fotosDefectos[item] || []).map((foto, idx) => (
                                            <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-300 group">
                                                <img src={foto} alt={"Foto " + item} className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => removePhotoDefecto(item, idx)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col">
                            {renderMicInput("Nombre del Inspector", "inspectorNombre", firmas.inspectorNombre, true)}
                            <div className="mt-4 flex-1 flex flex-col">
                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 text-center">Firma del Inspector</label>
                                <SignaturePad onSave={(val: string) => setFirmas(prev => ({...prev, inspectorFirma: val}))} />
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col">
                            {renderMicInput("Nombre del Responsable", "responsableNombre", firmas.responsableNombre, true)}
                            <div className="mt-4 flex-1 flex flex-col">
                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 text-center">Firma del Responsable</label>
                                <SignaturePad onSave={(val: string) => setFirmas(prev => ({...prev, responsableFirma: val}))} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-50">
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={() => handleSaveAndDownload(false)} disabled={isSaving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-600/30 transition-transform active:scale-95 disabled:opacity-50 text-base">
                        {isSaving && !showEmailModal ? <Loader2 size={22} className="animate-spin" /> : <Save size={22} />}
                        {isSaving && !showEmailModal ? 'Generando...' : 'Finalizar y Descargar'}
                    </button>
                    <button onClick={() => setShowEmailModal(true)} disabled={isSaving} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-600/30 transition-transform active:scale-95 disabled:opacity-50 text-base">
                        {isSaving && showEmailModal ? <Loader2 size={22} className="animate-spin" /> : <Mail size={22} />}
                        {isSaving && showEmailModal ? 'Preparando...' : 'Enviar por Correo'}
                    </button>
                </div>
            </div>

            <EmailReportModal
                initialObservations={Object.entries(checklist).filter(([_, v]) => v === 'NC' || v === 'F').map(([k]) => "- " + k + (itemComments[k] ? ": " + itemComments[k] : "")).join('\n') + (observaciones ? '\n\nOtras observaciones:\n' + observaciones : '')}
                isOpen={showEmailModal} 
                onClose={() => setShowEmailModal(false)}
                isSending={isSaving}
                onSend={async (data) => {
                    await handleSaveAndDownload(true, data);
                }}
            />

            </div>
    );
}
