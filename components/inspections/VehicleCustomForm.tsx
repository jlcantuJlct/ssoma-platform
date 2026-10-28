"use client";

import React, { useState, useRef, useEffect } from 'react';
import { getActiveWorkspace } from '@/lib/locations';
import { EmailReportModal } from '@/components/EmailReportModal';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Save, Loader2, ArrowLeft, CheckCircle, AlertCircle, Mic, X, Camera, Trash2 , Mail, Sparkles} from 'lucide-react';
import { InteractiveVehicleInspector } from './InteractiveVehicleInspector';

const generalSections: { type?: string; category: string; items: string[] }[] = [
    { category: 'CHASIS', items: ['Sistema de suspensión'] },
    { category: 'NEUMÁTICOS', items: ['Llantas delanteras (*)', 'Sistema de dirección (*)', 'Llantas posteriores (*)', 'Espárragos y Tuercas'] },
    { category: 'CABINA OPERADOR', items: ['Estribos (Peldaños)', 'Pasamanos', 'Llave de contacto', 'Cinturón de seguridad (*)', 'Espejos Retrovisiores (*)', 'Luces de Cabina', 'Limpiaparabrizas', 'Freno de mano (*)', 'Timón de dirección (*)', 'Pedales (*)', 'Palanca de velocidades (*)', 'Palanca de Tracción 4x4', 'Claxón (*)', 'Panel de control', 'Asientos', 'Vidrios de ventana', 'Neblineros (**)', 'Tapa tanque combustible'] },
    { category: 'SEGURIDAD', items: ['Circulina (**)', 'Alarma de retroceso (*)', 'Sistema de frenos (*)', 'Botiquín', 'Extintor', 'Conos/Triángulos de seguridad', 'Tacos de seguridad', 'Kit Antiderrame', 'Cintas reflectivas de seguridad (**)', 'Luces (*)'] },
    { type: 'fugas', category: 'FUGAS DE FLUIDO', items: ['Aceite de Motor', 'Combustible (Fugas)', 'Aceite Dirección', 'Aceite Transmisión', 'Aceite Diferenciales'] }
];

const specificSections: Record<string, {category: string, items: string[]}[]> = {
    'Camioneta': [
        { category: 'TRANSPORTE PERSONAL', items: ['Asientos (Personal)', 'Seguro Capot (*)', 'Cinturones de seguridad (*)', 'Ventanas', 'Luces Interiores'] }
    ],
    'Cisterna de Agua': [
        { category: 'CISTERNA DE AGUA', items: ['Tanque de Agua', 'Tapa superior', 'Motobomba de Agua', 'Manguera de succión', 'Válvula Check succión', 'Manguera de descarga', 'Escaleras / barandas ascenso', 'Válvulas de corte de fluido', 'Sistema de aspersión'] }
    ],
    'Cisterna de Combustible': [
        { category: 'CISTERNA DE COMBUSTIBLE', items: ['Tanque de combustible', 'Señalización (rombos NFPA / Indecopi)', 'Válvula de purga', 'Tapa superior', 'Surtidor de combustible', 'Manguera surtidor', 'Contómetro', 'Bomba de despacho', 'Barandas'] }
    ],
    'Camión Baranda': [
        { category: 'CAMIONES BARANDA', items: ['Plataforma posterior', 'Barandas', 'Seguro de baranda', 'Ganchos de amarre', 'Cuerdas y Sogas'] }
    ],
    'Volquete': [
        { category: 'CAMIONES VOLQUETES', items: ['Palanca activación pistón', 'Pistón de Levante Tolva*', 'Motor Hidráulico', 'Pines y seguro de tolva', 'Tolva', 'Compuerta de Tolva'] }
    ],
    'Camión Lubricador': [
        { category: 'CAMIONES LUBRICADORES', items: ['Depósitos de lubricantes', 'Depósito de aceite usado', 'Bombas Neumáticas', 'Manómetros de bomba', 'Depósito de refrigerantes', 'Compresor', 'Motor de compresor', 'Válvulas de seguridad', 'Espacios para herramientas', 'Dispensadores lubricantes'] }
    ],
    'Cama Baja': [
        { category: 'CAMA BAJA (SEMIRREMOLQUE)', items: ['Plataforma Cama Baja', 'Rampas de acceso / levante', 'Cuello de cisne / Tornamesa (*)', 'Pernos y trabas de rampas', 'Ganchos de trinca y cadenas', 'Ejes y suspensión posterior (*)', 'Válvulas y acoples de frenos (*)'] }
    ],
    'Semiremolque': [
        { category: 'SEMIREMOLQUE', items: ['Acople a Tornamesa (*)', 'Acoples sistema de frenos (*)', 'Válvulas (*)'] }
    ]
};

export const VehicleCustomForm = ({ moduleName, version, SignaturePad }: { moduleName: string, version: number, SignaturePad: any }) => {
    const router = useRouter();
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [cachedDriveUrl, setCachedDriveUrl] = useState<string | null>(null);
    const [cachedLevantamientoLink, setCachedLevantamientoLink] = useState<string | null>(null);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailData, setEmailData] = useState<any>(null);
    
    // Metadata
    const [meta, setMeta] = useState({
        proyecto: getActiveWorkspace().toUpperCase(),
        equipo: '',
        marca: '',
        modelo: '',
        serie: '',
        operador: '',
        turno: '',
        fecha: new Date().toISOString().split('T')[0],
        tipoEquipo: 'Camioneta'
    });

    const [checklist, setChecklist] = useState<Record<string, string>>({});
    const [itemComments, setItemComments] = useState<Record<string, string>>({});

    useEffect(() => {
        const newChecklist: Record<string, string> = {};
        const activeSpecific = specificSections[meta.tipoEquipo] || [];

        const cabinaExceptions = [
            'Claxón (*)',
            'Asientos',
            'Limpiaparabrizas',
            'Luces de Cabina',
            'Espejos Retrovisiores (*)',
            'Cinturón de seguridad (*)'
        ];

        [...generalSections, ...activeSpecific].forEach((section: any) => {
            section.items.forEach((item: string) => {
                if (section.type === 'fugas' || section.category === 'FUGAS DE FLUIDO') {
                    newChecklist[item] = 'N/A';
                } else if (section.category === 'CHASIS' && item === 'Sistema de suspensión') {
                    newChecklist[item] = 'N/A';
                } else if (section.category === 'CABINA OPERADOR') {
                    newChecklist[item] = cabinaExceptions.includes(item) ? 'OK' : 'N/A';
                } else {
                    newChecklist[item] = 'OK';
                }
            });
        });
        
        setChecklist(newChecklist);
    }, [meta.tipoEquipo]);

    const [observaciones, setObservaciones] = useState('');
    const [showVisualInspector, setShowVisualInspector] = useState(true);
    const [showChecklistDetails, setShowChecklistDetails] = useState(false);
    const [fotosDefectos, setFotosDefectos] = useState<Record<string, string[]>>({});

    useEffect(() => {
        if (user && !firmas.capatazNombre) {
            setFirmas(prev => ({ ...prev, capatazNombre: user.name || '' }));
        }
    }, [user]);

    const [firmas, setFirmas] = useState({
        operadorNombre: '',
        operadorFirma: '',
        capatazNombre: '',
        capatazFirma: ''
    });

    // Voice dictation setup
    const recognitionRef = useRef<any>(null);
    const [isRecordingMeta, setIsRecordingMeta] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'es-ES';
        }
    }, []);

    const toggleDictation = (field: string, isFirma: boolean = false) => {
        const targetId = isFirma ? ('firma_' + field) : field;

        if (isRecordingMeta === targetId) {
            recognitionRef.current?.stop();
            setIsRecordingMeta(null);
            return;
        }

        if (isRecordingMeta) {
            recognitionRef.current?.stop();
        }

        if (recognitionRef.current) {
            setIsRecordingMeta(targetId);
            
            let finalTranscriptAtStart = '';
            if (isFirma) {
                finalTranscriptAtStart = (firmas as any)[field] || '';
            } else if (field === 'observaciones') {
                finalTranscriptAtStart = observaciones || '';
            } else {
                finalTranscriptAtStart = (meta as any)[field] || '';
            }

            if (finalTranscriptAtStart && !finalTranscriptAtStart.endsWith(' ')) {
                finalTranscriptAtStart += ' ';
            }

            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscriptAtStart += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                const newText = (finalTranscriptAtStart + ' ' + interimTranscript).trim();
                
                if (isFirma) {
                    setFirmas(prev => ({ ...prev, [field]: newText }));
                } else if (field === 'observaciones') {
                    setObservaciones(newText);
                } else {
                    setMeta(prev => ({ ...prev, [field]: newText }));
                    if (field === 'operador') {
                        setFirmas(prev => ({ ...prev, operadorNombre: newText }));
                    }
                }
            };

            recognitionRef.current.onend = () => {
                setIsRecordingMeta(null);
            };

            recognitionRef.current.start();
        } else {
            alert("El dictado por voz no está soportado en este navegador.");
        }
    };

        
    const handleItemComment = (item: string, text: string) => {
        setItemComments(prev => ({...prev, [item]: text}));
        setObservaciones(prev => {
            let next = prev || '';
            const status = checklist[item];
            if (!status) return next;
            
            const prefix = '- ' + item + ' (' + status + ')';
            const newText = text ? prefix + ': ' + text : prefix;
            
            // Split lines, find the line starting with prefix, replace it
            const lines = next.split('\n');
            let found = false;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith(prefix)) {
                    lines[i] = newText;
                    found = true;
                    break;
                }
            }
            if (!found) {
                if (next.trim()) lines.push(newText);
                else return newText;
            }
            return lines.join('\n');
        });
    };

    const handleCheck = (item: string, value: string) => {
        setChecklist(prev => ({ ...prev, [item]: value }));
        
        setObservaciones(prev => {
            let next = prev || '';
            // Quitar cualquier línea antigua de este ítem
            const lines = next.split('\n').filter(l => !l.startsWith('- ' + item + ' ('));
            
            if (['R', 'M', 'F', 'RESUM', 'FUGA'].includes(value)) {
                // Agregar la nueva
                const prefix = '- ' + item + ' (' + value + ')';
                const text = itemComments[item];
                lines.push(text ? prefix + ': ' + text : prefix);
            }
            return lines.join('\n');
        });
    };

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const maxDim = 900;
                    if (width > maxDim || height > maxDim) {
                        if (width > height) {
                            height = Math.round((height * maxDim) / width);
                            width = maxDim;
                        } else {
                            width = Math.round((width * maxDim) / height);
                            height = maxDim;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.65));
                };
                img.onerror = () => {
                    resolve(ev.target?.result as string || '');
                };
                img.src = ev.target?.result as string;
            };
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
        });
    };

    const handlePhotoUploadDefecto = async (item: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        for (const file of Array.from(files)) {
            try {
                const compressed = await compressImage(file);
                if (compressed) {
                    setFotosDefectos(prev => ({
                        ...prev,
                        [item]: [...(prev[item] || []), compressed]
                    }));
                }
            } catch (err) {
                console.error("Error compressing photo:", err);
            }
        }
        e.target.value = '';
    };

    const removePhotoDefecto = (item: string, index: number) => {
        setFotosDefectos(prev => ({
            ...prev,
            [item]: prev[item].filter((_, i) => i !== index)
        }));
    };

    const handleSaveAndDownload = async (isEmailing: boolean = false, customEmailData: any = null) => {
        setIsSaving(true);
        let generatedLevantamientoLink: string | null = cachedLevantamientoLink;
        try {
            
            const combinedObs = Object.entries(itemComments)
                .filter(([_, c]) => c.trim().length > 0)
                .map(([item, c]) => `${item}: ${c}`)
                .join('\n') + (observaciones ? `\n\nGenerales: ${observaciones}` : '');

            const finalFirmas = {
                ...firmas,
                operadorNombre: firmas.operadorNombre || (meta as any).chofer || meta.operador || '',
                capatazNombre: firmas.capatazNombre || user?.name || ''
            };

            const res = await fetch('/api/export-excel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    moduleName: 'Vehículos y Equipos',
                    isMachineryMatrix: true,
                    meta,
                    checklist,
                    observaciones,
                    firmas: finalFirmas,
                    fotosDefectos,
                    saveToDrive: true
                })
            });

            if (res.ok) {
                const data = await res.json();
                const driveLink = data.driveUrl || '';
                if (data.driveUrl) {
                    setCachedDriveUrl(data.driveUrl);
                }

                // 1. Guardar en registros de inspecciones
                let inspectionRecordId = null;
                try {
                    const recRes = await fetch('/api/inspections', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'create',
                            data: {
                                date: meta.fecha || new Date().toISOString().split('T')[0],
                                responsible: (meta as any).chofer || meta.operador || 'Operador',
                                inspectionType: 'Inspecciones y observaciones vehículos (Volquetes, camionetas, camiones.) F-OP-010',
                                area: meta.proyecto || getActiveWorkspace().toUpperCase(),
                                zone: meta.equipo || 'Inspección Digital',
                                status: 'Completado',
                                observations: observaciones || 'Pre-uso de maquinaria generado.',
                                evidencePdf: driveLink,
                                evidenceImgs: []
                            }
                        })
                    });
                    if (recRes.ok) {
                        const recData = await recRes.json();
                        inspectionRecordId = recData.id;
                    }
                } catch(e) { console.error("Error guardando inspección:", e); }

                // 2. Generar Levantamiento de Observaciones ANTES de enviar el correo
                const badItemsList = Object.entries(checklist).filter(([_, val]) => ['R', 'M', 'F', 'RESUM', 'FUGA'].includes(val));
                const hasObservations = badItemsList.length > 0 || (observaciones && observaciones.trim().length > 0);
                
                if (hasObservations && !generatedLevantamientoLink) {
                    try {
                        const hallazgosList = badItemsList.length > 0
                            ? badItemsList.map(([item, status], i) => {
                                const cmmt = itemComments[item] || '';
                                return {
                                    index: i,
                                    descripcion: `- ${item} (${status}): ${cmmt}`.trim(),
                                    riesgo: 'Medio',
                                    categoria: 'Condición Subestándar',
                                    responsable: finalFirmas.capatazNombre || user?.name || "Capataz",
                                    responsableEmail: user?.email || "responsable@casacontratistas.com",
                                    fecha: meta.fecha || new Date().toISOString().split('T')[0],
                                    fotosDefectos: fotosDefectos[item] ? { [item]: fotosDefectos[item] } : {}
                                };
                            })
                            : [{
                                index: 0,
                                descripcion: observaciones || "Observaciones de Vehículos",
                                riesgo: 'Medio',
                                categoria: 'Condición Subestándar',
                                responsable: finalFirmas.capatazNombre || user?.name || "Capataz",
                                responsableEmail: user?.email || "responsable@casacontratistas.com",
                                fecha: meta.fecha || new Date().toISOString().split('T')[0],
                                fotosDefectos: Object.keys(fotosDefectos).length > 0 ? fotosDefectos : {}
                            }];

                        const lvRes = await fetch('/api/levantamiento/create', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                moduleName: 'Vehículos y Equipos',
                                template: checklist,
                                answers: { ...meta, observaciones, firmas: finalFirmas, fotosDefectos },
                                inspectionRecordId,
                                hallazgos: hallazgosList
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

                // 3. Si se está enviando por correo: enviar ahora que ya se tienen driveLink y generatedLevantamientoLink
                if (isEmailing && customEmailData) {
                    try {
                        let bodyWithLink = customEmailData.message.includes('[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]')
                            ? customEmailData.message.replace(
                                '[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]',
                                driveLink ? '📎 Enlace al reporte en Drive:\n' + driveLink : ''
                            )
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
                        if (!emailRes.ok) {
                            const errData = await emailRes.json().catch(() => ({}));
                            throw new Error(errData.error || 'Error enviando correo');
                        }
                        alert('✅ Correo enviado correctamente con el enlace de levantamiento de observaciones.');
                        window.location.href = '/inspections?openDigital=true';
                    } catch (e: any) {
                        console.error(e);
                        alert('Hubo un error al enviar el correo => ' + (e.message || 'Desconocido'));
                    }
                } else if (data.fileBase64) {
                    // Descargar archivo Excel localmente
                    const byteCharacters = atob(data.fileBase64);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `INSP_Vehiculos_${meta.fecha || new Date().toISOString().split('T')[0]}.xlsx`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();

                    if (window.confirm('¡Descarga y guardado exitoso!\n\n1. Por favor abre el Excel que se acaba de descargar y revísalo.\n2. Si todo está correcto, haz clic en "Aceptar" para enviarlo por correo ahora mismo (con su enlace de levantamiento).\n3. Si quieres salir, haz clic en "Cancelar".')) {
                        setShowEmailModal(true);
                    } else {
                        window.location.href = '/inspections?openDigital=true';
                    }
                }
            } else {
                let errorMsg = 'Error desconocido';
                try {
                    const errorData = await res.json();
                    errorMsg = errorData.error || errorMsg;
                } catch {
                    if (res.status === 413) {
                        errorMsg = 'El tamaño de las fotos adjuntas excede el límite del servidor (4.5 MB). Por favor adjunta fotos de menor peso o menos fotos.';
                    } else if (res.status === 504) {
                        errorMsg = 'Tiempo de espera agotado en el servidor (Timeout). Por favor intenta de nuevo.';
                    } else {
                        errorMsg = `Error en el servidor (${res.status}): ${res.statusText || 'Error desconocido'}`;
                    }
                }
                alert('Error al generar la inspección: ' + errorMsg);
            }
        } catch(e) {
            console.error(e);
            alert('Error de conexión al procesar la inspección.');
        } finally {
            setIsSaving(false);
        }
    };

    const renderRadioGroup = (item: string, options: string[]) => {
        return (
            <div className="flex gap-1 sm:gap-2">
                {options.map(opt => {
                    const isSelected = checklist[item] === opt;
                    let colorClass = 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200';
                    if (isSelected) {
                        if (opt === 'OK' || opt === 'N/A') colorClass = 'bg-green-500 text-white border-green-600 shadow-md';
                        if (opt === 'R' || opt === 'RESUM') colorClass = 'bg-yellow-500 text-white border-yellow-600 shadow-md';
                        if (opt === 'M' || opt === 'FUGA') colorClass = 'bg-orange-500 text-white border-orange-600 shadow-md';
                        if (opt === 'F') colorClass = 'bg-red-500 text-white border-red-600 shadow-md';
                    }
                    return (
                        <button
                            key={opt}
                            onClick={() => handleCheck(item, opt)}
                            className={"flex-1 sm:flex-none sm:w-10 h-8 sm:h-10 text-[10px] sm:text-xs font-bold rounded border transition-all flex items-center justify-center " + colorClass}
                        >
                            {opt}
                        </button>
                    )
                })}
            </div>
        )
    };

    const renderMicInput = (label: string, field: string, value: string, isFirma: boolean = false, placeholder: string = "") => {
        const targetId = isFirma ? ('firma_' + field) : field;
        const isRecording = isRecordingMeta === targetId;
        
        const handleClear = () => {
            if (isFirma) {
                setFirmas(prev => ({ ...prev, [field]: '' }));
            } else {
                setMeta(prev => ({ ...prev, [field]: '' }));
                if (field === 'operador') setFirmas(prev => ({ ...prev, operadorNombre: '' }));
            }
        };

        return (
            <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">{label}</label>
                <div className="relative mt-1">
                    <input 
                        type="text" 
                        value={value} 
                        onChange={e => {
                            if (isFirma) {
                                setFirmas(prev => ({ ...prev, [field]: e.target.value }));
                            } else {
                                setMeta(prev => ({ ...prev, [field]: e.target.value }));
                                if (field === 'operador') setFirmas(prev => ({ ...prev, operadorNombre: e.target.value }));
                            }
                        }} 
                        className={"w-full border-b p-2 text-sm outline-none bg-slate-50 pr-16 " + (isRecording ? "border-red-400 bg-red-50/30" : "border-slate-200 focus:border-yellow-500")} 
                        placeholder={placeholder}
                    />
                    <div className="absolute right-1 top-1 flex items-center gap-1">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1.5 rounded-full text-slate-300 hover:bg-slate-200 hover:text-red-500 transition-colors"
                            title="Borrar texto"
                        >
                            <X size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={() => toggleDictation(field, isFirma)}
                            className={"p-1.5 rounded-full transition-colors " + (isRecording ? "bg-red-100 text-red-500 animate-pulse shadow-sm" : "bg-slate-200/50 text-slate-400 hover:bg-slate-200 hover:text-blue-500")}
                            title="Dictar por voz"
                        >
                            <Mic size={14} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const generalNonFugas = generalSections.filter(s => s.type !== 'fugas');
    const fugas = generalSections.filter(s => s.type === 'fugas');
    const activeSpecific = specificSections[meta.tipoEquipo] || [];
    const sectionsToRender = [...generalNonFugas, ...activeSpecific, ...fugas];

    const badItems = Object.entries(checklist).filter(([_, val]) => ['R', 'M', 'F', 'RESUM', 'FUGA'].includes(val));

    return (
        <div className="max-w-4xl mx-auto pb-24">
            <div className="bg-slate-800 text-white p-6 shadow-lg relative z-10 mb-6">
                <button onClick={() => router.push('/inspections')} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors mb-4">
                    <ArrowLeft size={20} /> Volver
                </button>
                <h1 className="text-2xl font-black mb-1 text-yellow-400">Inspección de Vehículos y Equipos</h1>
                <p className="text-slate-400 text-sm">Lista de chequeo F-OP-010</p>
            </div>

            <div className="px-4 space-y-6">
                {/* METADATA */}
                <div className="bg-white border-t-4 border-yellow-400 shadow-sm rounded-xl p-5 flex flex-col gap-4">
                    <h3 className="font-bold text-slate-800 border-b pb-2">Datos Generales</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {renderMicInput("Proyecto", "proyecto", meta.proyecto)}
                        
                        
                        {renderMicInput("Equipo / Código", "equipo", meta.equipo)}
                        {renderMicInput("Marca", "marca", meta.marca)}
                        {renderMicInput("Modelo", "modelo", meta.modelo)}
                        {renderMicInput("Serie", "serie", meta.serie)}
                        {renderMicInput("Operador de Equipo", "operador", meta.operador)}
                        {renderMicInput("Turno", "turno", meta.turno)}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase">Tipo de Equipo</label>
                                <select value={meta.tipoEquipo} onChange={e => setMeta({...meta, tipoEquipo: e.target.value})} className="w-full border-b border-slate-200 p-2 text-sm focus:border-yellow-500 outline-none bg-slate-50 mt-1 cursor-pointer">
                                    <option value="Camioneta">Camioneta</option>
                                    <option value="Cisterna de Agua">Cisterna de Agua</option>
                                    <option value="Cisterna de Combustible">Cisterna de Combustible</option>
                                    <option value="Camión Baranda">Camión Baranda</option>
                                    <option value="Volquete">Camiones Volquetes</option>
                                    <option value="Camión Lubricador">Camiones Lubricadores</option>
                                    <option value="Cama Baja">Camión Remolque Cama Baja</option>
                                    <option value="Semiremolque">Semiremolque</option>
                                    <option value="Vehículo">Otro / General</option>
                                </select>
                            </div>
                        
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase">Fecha</label>
                            <input type="date" value={meta.fecha} onChange={e => setMeta({...meta, fecha: e.target.value})} className="w-full border-b border-slate-200 p-2 text-sm focus:border-yellow-500 outline-none bg-slate-50 mt-1" />
                        </div>
                    </div>
                </div>

                {/* 1. INSPECTOR VISUAL INTERACTIVO CON GIRO 3D (PROMINENTE) */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 sm:p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-yellow-500" />
                            <h3 className="font-bold text-slate-800 text-sm uppercase">Inspector Visual del Vehículo (Giro 3D y Hotspots)</h3>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                            Unidad: {meta.tipoEquipo || 'Camioneta'}
                        </span>
                    </div>

                    <InteractiveVehicleInspector
                        vehicleCode={meta.equipo || 'Vehículo'}
                        vehicleType={meta.tipoEquipo || 'Camioneta'}
                        observations={observaciones}
                        onUpdateObservations={(newObs) => setObservaciones(newObs)}
                        onUpdateChecklist={(item, status) => setChecklist(prev => ({ ...prev, [item]: status }))}
                        onSwitchType={(newType) => setMeta(prev => ({ ...prev, tipoEquipo: newType }))}
                    />
                </div>

                {/* 2. OBSERVACIONES DEL CHEQUEO (AUTO-DESCRIPCIÓN DE PUNTOS MARCADOS + DICTADO) */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Observaciones del Chequeo</label>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setObservaciones('')}
                                className="p-1.5 rounded-full transition-colors flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-600"
                                title="Borrar observaciones"
                            >
                                <X size={12} /> Borrar
                            </button>
                            <button
                                type="button"
                                onClick={() => toggleDictation('observaciones')}
                                className={"p-1.5 rounded-full transition-colors flex items-center gap-1 text-[10px] font-bold " + (isRecordingMeta === 'observaciones' ? "bg-red-100 text-red-500 animate-pulse shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-blue-500")}
                            >
                                <Mic size={12} /> {isRecordingMeta === 'observaciones' ? 'Escuchando...' : 'Dictar'}
                            </button>
                        </div>
                    </div>

                    <textarea 
                        value={observaciones} 
                        onChange={e => setObservaciones(e.target.value)} 
                        className={"w-full border p-3 text-sm rounded-lg outline-none min-h-[90px] " + (isRecordingMeta === 'observaciones' ? "border-red-400 bg-red-50/30" : "border-slate-200 focus:border-yellow-500")} 
                        placeholder="Los defectos marcados en la figura 3D se describen aquí automáticamente con su acción correctiva. Puede complementar escribiendo o dictando..."
                    />
                </div>

                {/* 3. CAJONES DE CHEQUEO (MINIMIZADOS POR DEFECTO CON BOTÓN PARA VER DETALLE) */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setShowChecklistDetails(prev => !prev)}
                        className="w-full p-3 sm:p-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition-colors border-b border-slate-200 cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-600 flex items-center justify-center font-black text-sm">
                                📋
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-xs sm:text-sm uppercase tracking-wide">
                                    Tabla Detallada de Chequeo (OK / R / M / F / N/A)
                                </h3>
                                <p className="text-[10px] text-slate-500 font-medium">
                                    {showChecklistDetails 
                                        ? 'Click para minimizar cajones de marcado' 
                                        : 'Minimizado: los estados se automarcan directamente al tocar los puntos en la figura'}
                                </p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors shrink-0">
                            {showChecklistDetails ? 'Minimizar cajones ▲' : 'Ver cajones ▼'}
                        </span>
                    </button>

                    {showChecklistDetails && (
                        <div className="p-4 space-y-6">
                            {/* LEGEND */}
                            <div className="bg-slate-100 p-3 rounded-lg flex flex-wrap gap-x-6 gap-y-2 text-[10px] sm:text-xs text-slate-600 border border-slate-200">
                                <div className="flex items-center gap-1"><span className="font-black bg-green-500 text-white px-1 rounded">OK</span> Conforme</div>
                                <div className="flex items-center gap-1"><span className="font-black bg-yellow-500 text-white px-1 rounded">R</span> Regular, pero operar, programar cambio</div>
                                <div className="flex items-center gap-1"><span className="font-black bg-orange-500 text-white px-1 rounded">M</span> En mal estado. Reparar a la brevedad</div>
                                <div className="flex items-center gap-1"><span className="font-black bg-red-500 text-white px-1 rounded">F</span> Faltante</div>
                                <div className="flex items-center gap-1"><span className="font-black bg-slate-400 text-white px-1 rounded">N/A</span> No aplica</div>
                            </div>

                            {/* SECTIONS LIST */}
                            {sectionsToRender.map((section, sIdx) => (
                                <div key={sIdx} className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                                    <div className="bg-slate-800 p-3">
                                        <h3 className="font-bold text-yellow-400 text-sm uppercase">{section.category}</h3>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {section.items.map((item) => {
                                            const status = checklist[item];
                                            const isBad = ['R', 'M', 'F', 'RESUM', 'FUGA'].includes(status);
                                            return (
                                            <div key={item} className="p-3 sm:p-4 flex flex-col gap-3 hover:bg-slate-50 transition-colors">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="text-sm font-semibold text-slate-700 flex-1 pr-4">
                                                        {item}
                                                    </div>
                                                    <div>
                                                        {(section as any).type === 'fugas' 
                                                            ? renderRadioGroup(item, ['N/A', 'RESUM', 'FUGA'])
                                                            : renderRadioGroup(item, ['OK', 'R', 'M', 'F', 'N/A'])}
                                                    </div>
                                                </div>
                                                {isBad && (
                                                    <div className="w-full sm:w-96 bg-orange-50 p-2 rounded-lg border border-orange-200 flex flex-col gap-1.5 self-start sm:self-end shadow-sm">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[10px] font-black text-orange-600 uppercase">Detalle del Hallazgo:</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 bg-white border border-orange-200 rounded-md focus-within:border-orange-400 overflow-hidden pr-2">
                                                            <input 
                                                                type="text" 
                                                                value={itemComments[item] || ''}
                                                                onChange={e => handleItemComment(item, e.target.value)}
                                                                placeholder="Describe el problema aquí..."
                                                                className="flex-1 text-xs outline-none p-1.5 bg-transparent font-bold text-slate-700"
                                                            />
                                                            <button 
                                                                type="button" 
                                                                onClick={() => {
                                                                    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                                                                    if (!SpeechRecognition) return alert('Tu navegador no soporta dictado por voz.');
                                                                    const recognition = new SpeechRecognition();
                                                                    recognition.lang = 'es-ES';
                                                                    recognition.interimResults = false;
                                                                    recognition.onresult = (event: any) => {
                                                                        const transcript = event.results[0][0].transcript;
                                                                        handleItemComment(item, (itemComments[item] || "") + " " + transcript);
                                                                    };
                                                                    recognition.start();
                                                                }} 
                                                                className="text-slate-400 hover:text-blue-500 transition-colors p-1 mr-1" 
                                                                title="Dictar por voz"
                                                            >
                                                                <Mic size={14}/>
                                                            </button>
                                                            <button type="button" onClick={() => handleItemComment(item, "")} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Borrar texto"><X size={14}/></button>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <label className="cursor-pointer bg-white border border-slate-200 text-slate-500 px-2 py-1 rounded text-[10px] font-bold hover:bg-slate-50 transition-colors flex items-center gap-1 shadow-sm">
                                                                <Camera size={14} /> <span>Agregar Foto</span>
                                                                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePhotoUploadDefecto(item, e)} />
                                                            </label>
                                                        </div>
                                                        {(fotosDefectos[item] && fotosDefectos[item].length > 0) && (
                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                {fotosDefectos[item].map((photoStr, idx) => (
                                                                    <div key={idx} className="relative group">
                                                                        <img src={photoStr} className="h-16 w-16 object-cover rounded-lg border border-orange-200 shadow-sm" alt="Defecto" />
                                                                        <button onClick={() => removePhotoDefecto(item, idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"><X size={12}/></button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )})}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* FIRMAS (Debajo de observaciones) */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col">
                        {renderMicInput("Nombre del Operador de Equipo", "operadorNombre", firmas.operadorNombre, true, "Escribir o dictar nombre...")}
                        <div className="mt-4 flex-1 flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 text-center">Firma del Operador</label>
                            <SignaturePad onSave={(val: string) => setFirmas(prev => ({ ...prev, operadorFirma: val }))} />
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col">
                        {renderMicInput("Nombre del Capataz / SSMA", "capatazNombre", firmas.capatazNombre, true, "Escribir o dictar nombre...")}
                        <div className="mt-4 flex-1 flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 text-center">Firma del Capataz / SSMA</label>
                            <SignaturePad onSave={(val: string) => setFirmas(prev => ({ ...prev, capatazFirma: val }))} />
                        </div>
                    </div>
                </div>

                {/* FOTOGRAFÍAS DE HALLAZGOS */}
                <div className="bg-white border-t-4 border-blue-400 shadow-sm rounded-xl p-5 flex flex-col gap-4 mt-6">
                    <h3 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2"><Camera size={18} className="text-blue-500" /> Evidencia Fotográfica de Hallazgos</h3>
                    
                    {badItems.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No hay hallazgos (R, M, F) que requieran fotografía.</p>
                    ) : (
                        <div className="space-y-6">
                            {badItems.map(([item, val]) => (
                                <div key={item} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-bold text-slate-700 text-sm">{item} <span className="text-xs bg-white border border-slate-300 px-1.5 py-0.5 rounded ml-2">({val})</span></h4>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {(fotosDefectos[item] || []).map((foto, idx) => (
                                            <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-300 group">
                                                <img src={foto} alt={"Foto " + item} className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => removePhotoDefecto(item, idx)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        
                                        <label className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
                                            <Camera size={20} className="mb-1" />
                                            <span className="text-[10px] font-bold text-center leading-tight">Añadir<br/>Foto</span>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                capture="environment"
                                                multiple
                                                onChange={(e) => handlePhotoUploadDefecto(item, e)} 
                                                className="hidden" 
                                            />
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                      <button onClick={() => handleSaveAndDownload(false)} disabled={isSaving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-600/30 transition-transform active:scale-95 disabled:opacity-50 text-base">
                          {isSaving && !showEmailModal ? <Loader2 size={22} className="animate-spin" /> : <Save size={22} />}
                          {isSaving && !showEmailModal ? 'Generando Excel...' : 'Finalizar y Descargar'}
                      </button>
                      <button onClick={() => setShowEmailModal(true)} disabled={isSaving} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-600/30 transition-transform active:scale-95 disabled:opacity-50 text-base">
                          {isSaving && showEmailModal ? <Loader2 size={22} className="animate-spin" /> : <Mail size={22} />}
                          {isSaving && showEmailModal ? 'Preparando...' : 'Enviar por Correo'}
                      </button>
                  </div>
                  
                  <EmailReportModal
            initialObservations={observaciones || ""} 
                      isOpen={showEmailModal} 
                      onClose={() => setShowEmailModal(false)}
                      isSending={isSaving}
                      onSend={async (data) => {
                          if (cachedDriveUrl) {
                              setIsSaving(true);
                              try {
                                  let bodyWithLink = data.message.includes('[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]')
                                      ? data.message.replace('[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]', '📎 Enlace al reporte en Drive:\n' + cachedDriveUrl)
                                      : data.message + '\n\n📎 Enlace al reporte en Drive:\n' + cachedDriveUrl;
                                  
                                  let levantamientoLink = cachedLevantamientoLink;
                                  if (!levantamientoLink) {
                                      const badItemsList = Object.entries(checklist).filter(([_, val]) => ['R', 'M', 'F', 'RESUM', 'FUGA'].includes(val));
                                      const hasObs = badItemsList.length > 0 || (observaciones && observaciones.trim().length > 0);
                                      if (hasObs) {
                                          try {
                                              const finalFirmas = {
                                                  ...firmas,
                                                  operadorNombre: firmas.operadorNombre || (meta as any).chofer || meta.operador || '',
                                                  capatazNombre: firmas.capatazNombre || user?.name || ''
                                              };
                                              const hallazgosList = badItemsList.length > 0
                                                  ? badItemsList.map(([item, status], i) => {
                                                      const cmmt = itemComments[item] || '';
                                                      return {
                                                          index: i,
                                                          descripcion: `- ${item} (${status}): ${cmmt}`.trim(),
                                                          riesgo: 'Medio',
                                                          categoria: 'Condición Subestándar',
                                                          responsable: finalFirmas.capatazNombre || user?.name || 'Capataz',
                                                          responsableEmail: user?.email || 'responsable@casacontratistas.com',
                                                          fecha: meta.fecha || new Date().toISOString().split('T')[0],
                                                          fotosDefectos: fotosDefectos[item] ? { [item]: fotosDefectos[item] } : {}
                                                      };
                                                  })
                                                  : [{
                                                      index: 0,
                                                      descripcion: observaciones || 'Observaciones de Vehículos',
                                                      riesgo: 'Medio',
                                                      categoria: 'Condición Subestándar',
                                                      responsable: finalFirmas.capatazNombre || user?.name || 'Capataz',
                                                      responsableEmail: user?.email || 'responsable@casacontratistas.com',
                                                      fecha: meta.fecha || new Date().toISOString().split('T')[0],
                                                      fotosDefectos: Object.keys(fotosDefectos).length > 0 ? fotosDefectos : {}
                                                  }];

                                              const lvRes = await fetch('/api/levantamiento/create', {
                                                  method: 'POST',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify({
                                                      moduleName: 'Vehículos y Equipos',
                                                      template: checklist,
                                                      answers: { ...meta, observaciones, firmas: finalFirmas, fotosDefectos },
                                                      hallazgos: hallazgosList
                                                  })
                                              });
                                              if (lvRes.ok) {
                                                  const lvData = await lvRes.json();
                                                  if (lvData.items && lvData.items.length > 0) {
                                                      levantamientoLink = window.location.origin + '/levantamiento/' + lvData.items[0].token;
                                                      setCachedLevantamientoLink(levantamientoLink);
                                                  }
                                              }
                                          } catch(e) {}
                                      }
                                  }

                                  if (levantamientoLink) {
                                      bodyWithLink += '\n\n✅ Enlace de Levantamiento de Observaciones:\n' + levantamientoLink;
                                  }

                                  let htmlBody = bodyWithLink.replace(/\n/g, '<br>').replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" style="color:#1a73e8;font-weight:bold;">📄 Ver / Descargar Reporte</a>');
                                  
                                  if (levantamientoLink) {
                                      htmlBody += '<br><br><p style="text-align:center;background:#f0fdf4;padding:16px;border-radius:12px;border:1px solid #bbf7d0;"><a href="' + levantamientoLink + '" style="background:#059669;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;font-size:16px;">✅ Ingresar para Levantar Observaciones</a></p>';
                                  }

                                  const emailRes = await fetch('/api/send-email', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                          to: data.to, cc: data.cc, subject: data.subject,
                                          text: bodyWithLink,
                                          html: htmlBody,
                                          fromEmail: data.fromEmail, fromName: data.fromName
                                      })
                                  });
                                  if (!emailRes.ok) {
                            const errData = await emailRes.json().catch(() => ({}));
                            throw new Error(errData.error || 'Error enviando correo');
                        }
                                alert('✅ Correo enviado correctamente con el reporte ya revisado.');
                                window.location.href = '/inspections?openDigital=true';
                            } catch(e: any) {
                                console.error("Error enviando correo:", e);
                                alert('Error al enviar el correo: ' + (e.message || 'Error desconocido'));
                            } finally {
                                  setIsSaving(false);
                                  setShowEmailModal(false);
                              }
                          } else {
                              await handleSaveAndDownload(true, data);
                              setShowEmailModal(false);
                          }
                      }}
                  />
            </div>
        </div>
    );
};