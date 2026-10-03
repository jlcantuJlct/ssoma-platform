"use client";

import React, { useState, useRef, useEffect } from "react";
import { Camera, Trash2, ArrowLeft, Mail, PlusCircle, Check, Loader2, ChevronDown, ChevronUp, User, MapPin, Clock, Calendar, AlertTriangle, FileText, List, CheckCircle2, Mic, MicOff, Save } from "lucide-react";
import { EmailReportModal } from '@/components/EmailReportModal';
import { useRouter } from 'next/navigation';

const CATEGORIAS = [
    "TRANSPORTE DE PERSONAL",
    "TRABAJO EN CAMPO CON TORMENTAS ELECTRICAS",
    "OPERACIÓN DE VEHICULOS Y EQUIPOS",
    "TRABAJOS CON RIESGO DE CAIDAS DE ROCAS / EXCAVACIONES Y ZANJAS",
    "MANIPULACIÓN DE EXPLOSIVOS",
    "IZAJE",
    "TRABAJO EN ALTURA",
    "TRABAJOS EN ESPACIOS CONFINADOS",
    "MANIPULACION Y USO DE NEUMATICOS",
    "USO DE PRODUCTOS QUIMICOS",
    "TRABAJOS CON RIESGO A ENERGIAS PELIGROSAS",
    "TRABAJOS CERCA A FUENTE DE AGUA",
    "TRABAJOS EN CALIENTE",
    "TRABAJOS CON HERRAMIENTAS DE PODER",
    "EPP",
    "POSICIÓN DEL TRABAJADOR",
    "ERGONOMIA",
    "HERRAMIENTAS Y EQUIPOS",
    "DOCUMENTOS (PETS/ATS/PETAR/CHECK LIST)",
    "ORDEN Y LIMPIEZA",
    "MEDIO AMBIENTE",
    "OTROS"
];

const TextInputWithMic = ({ value, onChange, placeholder, className, isTextArea = false }: any) => {
    value = value || '';
    const [isListening, setIsListening] = useState(false);
    
    const toggleListen = () => {
        if (isListening) {
            setIsListening(false);
            return;
        }
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Su navegador no soporta reconocimiento de voz.');
            return;
        }
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
            }
            if (finalTranscript) {
                onChange(value + (value ? ' ' : '') + finalTranscript);
            }
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        
        recognition.start();
    };

    return (
        <div className="relative w-full">
            {isTextArea ? (
                <textarea className={`${className} bg-white text-slate-900 pr-20 transition-colors`} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
            ) : (
                <input className={`${className} bg-white text-slate-900 pr-20 transition-colors`} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
            )}
            <div className="absolute right-2 top-2 flex items-center gap-1">
                <button type="button" onClick={toggleListen} className={`p-1.5 rounded-lg transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                    {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                </button>
                <button type="button" onClick={() => onChange('')} disabled={!value} className={`p-1.5 rounded-lg transition-colors ${value ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-red-500' : 'text-slate-300 opacity-50 cursor-not-allowed'}`}><Trash2 size={14} /></button>
            </div>
        </div>
    );
};

export function InternasCustomForm({ moduleName, version, SignaturePad }: any) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [generatedReport, setGeneratedReport] = useState<{ fileBase64: string; driveUrl: string; fileName: string } | null>(null);
    const [proyecto, setProyecto] = useState('RED VIAL 6');
    const [direccion, setDireccion] = useState('');
    const [responsableArea, setResponsableArea] = useState('');
    const [area, setArea] = useState('');
    const [tipo, setTipo] = useState('');
    const [hora, setHora] = useState('');
    const [fecha, setFecha] = useState('');

    const [razonSocial, setRazonSocial] = useState('Construcción y Administración S.A.');
    const [ruc, setRuc] = useState('20109565017');
    const [domicilio, setDomicilio] = useState('Av. Javier Prado Este Nro. 4109 - Santiago de Surco - Lima');
    const [actividad, setActividad] = useState('Ingeniería / Construcción');
    const [trabajadores, setTrabajadores] = useState('');

    
    const [responsables, setResponsables] = useState<string[]>(['']);
    
    const [hallazgos, setHallazgos] = useState<any[]>([
        { id: 1, descripcion: '', evidencia: '', evidenciaLevantamiento: '', riesgo: '', categoria: '', accion: '', responsable: '', responsableEmail: '', responsableManual: false, fecha: '', estado: '' }
    ]);
    
    const [conclusiones, setConclusiones] = useState('');
    
    const [regNombre, setRegNombre] = useState('');
    const [regCargo, setRegCargo] = useState('');
    const [regFecha, setRegFecha] = useState('');
    const [regFirma, setRegFirma] = useState('');

    const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

    // Directorio de contactos para asignar responsables con correo
    const [contactos, setContactos] = useState<{ name: string; email: string }[]>([]);
    useEffect(() => {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('ssoma_contacts') : null;
        if (stored) {
            try { setContactos(JSON.parse(stored)); } catch (e) { /* lista vacía */ }
        }
    }, []);

    const handleResponsableChange = (idx: number, val: string) => {
        const newResp = [...responsables];
        newResp[idx] = val;
        setResponsables(newResp);
    };

    const addHallazgo = () => {
        setHallazgos([...hallazgos, { id: Date.now(), descripcion: '', evidencia: '', evidenciaLevantamiento: '', riesgo: '', categoria: '', accion: '', responsable: '', responsableEmail: '', responsableManual: false, fecha: '', estado: '' }]);
    };

    const removeHallazgo = (id: number) => {
        setHallazgos(hallazgos.filter(h => h.id !== id));
    };

    const updateHallazgo = (id: number, field: string, val: any) => {
        setHallazgos(hallazgos.map(h => h.id === id ? { ...h, [field]: val } : h));
    };

    
    
    useEffect(() => {
        if (hallazgos.length === 0) return;
        const listado = hallazgos.filter(h => h.descripcion || h.riesgo).map((h, i) => {
            const nivel = h.riesgo || '-';
            const resp = h.responsable || '-';
            const fecha = h.fecha || '-';
            const estado = h.estado || 'Abierto';
            return `${i + 1}. ${h.descripcion || 'Sin descripción'} (Nivel: ${nivel} | Resp: ${resp} | Fecha: ${fecha} | Estado: ${estado})`;
        }).join('\n');
        if (!listado) return;
        
        const header = '\n--- Resumen de Hallazgos ---\n';
        setConclusiones(prev => {
            if (prev.includes('--- Resumen de Hallazgos ---')) {
                const parts = prev.split('--- Resumen de Hallazgos ---');
                return parts[0].trim() + header + listado;
            } else {
                return prev ? prev.trim() + header + listado : header.trimStart() + listado;
            }
        });
    }, [hallazgos]);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, id: number) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    updateHallazgo(id, 'evidencia', event.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const submit = async () => {
        setIsSaving(true);
        try {
            const payload = {
                template: [
                    { text: 'Proyecto:', type: 'question' },
                    { text: 'Dirección:', type: 'question' },
                    { text: 'Responsable Área:', type: 'question' },
                    { text: 'Área:', type: 'question' },
                    { text: 'Tipo:', type: 'question' },
                    { text: 'Hora:', type: 'question' },
                    { text: 'Fecha:', type: 'question' },
                    { text: 'N° Trabajadores:', type: 'question' },
                    { text: 'Responsables:', type: 'question' },
                    { text: 'Hallazgos:', type: 'question' },
                    { text: 'Conclusiones:', type: 'question' },
                    { text: 'RegNombre:', type: 'question' },
                    { text: 'RegCargo:', type: 'question' },
                    { text: 'RegFecha:', type: 'question' },
                    { text: 'RegFirma:', type: 'question' }
                ],
                answers: [
                    { text: proyecto },
                    { text: direccion },
                    { text: responsableArea },
                    { text: area },
                    { text: tipo },
                    { text: hora },
                    { text: fecha },
                    { text: trabajadores },
                    { text: JSON.stringify(responsables) },
                    { text: JSON.stringify(hallazgos) },
                    { text: conclusiones },
                    { text: regNombre },
                    { text: regCargo },
                    { text: regFecha },
                    { signature: regFirma }
                ]
            };
            
            const res = await fetch('/api/export-excel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ moduleName, version, ...payload, saveToDrive: true })
            });

            if (res.ok) {
                const data = await res.json();
                const fileName = `INSP_${moduleName}_${new Date().toISOString().split('T')[0]}.xlsx`;
                const fileBase64: string = data.fileBase64 || '';
                const driveUrl: string = data.driveUrl || '';

                // 1. Descargar el archivo localmente
                if (fileBase64) {
                    const byteCharacters = atob(fileBase64);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                }

                setGeneratedReport({ fileBase64, driveUrl, fileName });

                // 2. Registrar la inspección en la base de datos
                let inspectionRecordId: number | null = null;
                try {
                    const dbResponse = await fetch('/api/inspections', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'create',
                            data: {
                                date: fecha || new Date().toISOString().split('T')[0],
                                responsible: regNombre || 'Sin responsable',
                                inspectionType: moduleName,
                                area: area || proyecto || 'Seguridad',
                                zone: `Inspección Interna SSOMA${tipo ? ` - ${tipo}` : ''}`,
                                status: 'Completado',
                                observations: conclusiones || 'Generado desde formulario digital de Inspecciones Internas.',
                                evidencePdf: driveUrl,
                                evidenceImgs: []
                            }
                        })
                    });
                    const dbData = await dbResponse.json();
                    if (dbData?.id) inspectionRecordId = dbData.id;
                } catch (dbErr) {
                    console.error('Error registrando inspección en BD:', dbErr);
                }

                // 3. Crear enlaces de levantamiento para hallazgos abiertos con responsable
                let enlacesEnviados = 0;
                try {
                    const pendientes = hallazgos
                        .map((h, i) => ({ ...h, index: i }))
                        .filter((h: any) => h.estado !== 'Cerrado' && h.responsableEmail);

                    if (pendientes.length > 0) {
                        const lvRes = await fetch('/api/levantamiento/create', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ moduleName, template: payload.template, answers: payload.answers, hallazgos: pendientes, inspectionRecordId })
                        });
                        const lvData = await lvRes.json();
                        const origin = window.location.origin;
                        for (const item of (lvData.items || [])) {
                            const link = `${origin}/levantamiento/${item.token}`;
                            const mailRes = await fetch('/api/send-email', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    to: [item.email],
                                    subject: `⚠️ Acción requerida: Levantar hallazgo - ${moduleName}`,
                                    text: `Hola ${item.responsable},\n\nSe te asignó levantar la siguiente observación:\n"${item.description}"\n\nIngresa al siguiente enlace para subir tu evidencia y cerrar la observación:\n${link}`,
                                    html: `<p>Hola <b>${item.responsable}</b>,</p><p>Se te asignó levantar la siguiente observación:</p><p style="background:#fef3c7;padding:12px;border-radius:8px;"><i>"${item.description}"</i></p><p><a href="${link}" style="background:#059669;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">✅ Levantar mi observación</a></p><p>Si el botón no funciona, copia este enlace:<br>${link}</p>`
                                })
                            });
                            if (mailRes.ok) enlacesEnviados++;
                        }
                    }
                } catch (lvErr) {
                    console.error('Error creando/enviando levantamientos:', lvErr);
                }

                const abiertosSinCorreo = hallazgos.filter((h: any) => h.estado !== 'Cerrado' && !h.responsableEmail).length;
                let mensajeFinal = '✅ Excel generado, guardado en Drive y registrado en el sistema.';
                if (enlacesEnviados > 0) {
                    mensajeFinal = `✅ Excel generado, guardado en Drive y registrado.\n📧 Se enviaron ${enlacesEnviados} enlace(s) de levantamiento a los responsables.`;
                }
                if (abiertosSinCorreo > 0) {
                    mensajeFinal += `\n\n⚠️ ATENCIÓN: ${abiertosSinCorreo} hallazgo(s) abierto(s) NO recibieron enlace de levantamiento porque no tienen responsable con correo asignado en la tarjeta del hallazgo.`;
                }
                alert(mensajeFinal);

                // 3. Abrir el modal de correo con el enlace de Drive
                setShowEmailModal(true);
            } else {
                alert("Error al generar Excel");
            }
        } catch (e) {
            console.error(e);
            alert("Error al exportar");
        } finally {
            setIsSaving(false);
        }
    };

    const resumenHallazgos = hallazgos
        .filter(h => h.descripcion || h.riesgo)
        .map((h, i) => {
            const nivel = h.riesgo || '-';
            const resp = h.responsable || '-';
            const fechaH = h.fecha || '-';
            const estado = h.estado || 'Abierto';
            return `${i + 1}. ${h.descripcion || 'Sin descripción'} (Nivel: ${nivel} | Resp: ${resp} | Fecha: ${fechaH} | Estado: ${estado})`;
        })
        .join('\n');

    const handleSendEmail = async (emailData: { to: string[]; cc: string[]; subject: string; message: string; fromEmail: string; fromName: string }) => {
        setIsSendingEmail(true);
        try {
            const driveLink = generatedReport?.driveUrl || '';
            const placeholder = '[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]';
            const bodyWithLink = emailData.message.includes(placeholder)
                ? emailData.message.replace(placeholder, driveLink ? '📎 Enlace al reporte en Drive:\n' + driveLink : '')
                : (driveLink ? emailData.message + '\n\n📎 Enlace al reporte en Drive:\n' + driveLink : emailData.message);

            const emailRes = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: emailData.to,
                    cc: emailData.cc,
                    subject: emailData.subject,
                    text: bodyWithLink,
                    html: bodyWithLink.replace(/\n/g, '<br>').replace(
                        /(https?:\/\/[^\s]+)/g,
                        '<a href="$1" style="color:#1a73e8;font-weight:bold;">📄 Ver / Descargar Reporte</a>'
                    ),
                    fromEmail: emailData.fromEmail,
                    fromName: emailData.fromName
                })
            });

            if (!emailRes.ok) {
                            const errData = await emailRes.json().catch(() => ({}));
                            throw new Error(errData.error || 'Error enviando correo');
                        }

            alert('📧 Correo enviado correctamente con el enlace del reporte.');
            setShowEmailModal(false);
        } catch (e) {
            console.error(e);
            alert('Hubo un error al enviar el correo, pero el reporte se generó correctamente.');
        } finally {
            setIsSendingEmail(false);
        }
    };

    return (
        <>
            <div className="max-w-6xl mx-auto mb-6">
                <button 
                    onClick={() => router.push('/inspections?openDigital=true')} 
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium transition-colors"
                >
                    <ArrowLeft size={18} /> Volver
                </button>
            </div>
            <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden mt-6">
            <div className="bg-gradient-to-r from-indigo-800 to-blue-700 p-6 md:p-8 text-white mb-6">
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">{moduleName.toUpperCase()}</h2>
                <p className="text-indigo-100 mt-2 text-sm">Complete el formulario digital detallado de inspecciones y hallazgos.</p>
            </div>
            <div className="p-4 md:p-6 pt-0">
            
            {/* METADATA */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
                <div className="flex flex-col gap-1 md:col-span-3">
                    <label className="text-sm font-semibold text-slate-700">Proyecto:</label>
                    <TextInputWithMic className="border border-slate-300 rounded-lg p-2" value={proyecto} onChange={setProyecto} />
                </div>
                <div className="flex flex-col gap-1 md:col-span-3">
                    <label className="text-sm font-semibold text-slate-700">Dirección del Proyecto:</label>
                    <TextInputWithMic className="border border-slate-300 rounded-lg p-2" value={direccion} onChange={setDireccion} />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Responsable del Área:</label>
                    <TextInputWithMic className="border border-slate-300 rounded-lg p-2" value={responsableArea} onChange={setResponsableArea} />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Área Inspeccionada:</label>
                    <TextInputWithMic className="border border-slate-300 rounded-lg p-2" value={area} onChange={setArea} />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">N° Trabajadores en el Centro Laboral:</label>
                    <TextInputWithMic className="border border-slate-300 rounded-lg p-2" value={trabajadores} onChange={setTrabajadores} />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Tipo de Inspección:</label>
                    <div className="flex gap-2 h-full items-end">
                        {['Planeada', 'No planeada', 'Otro'].map(t => (
                            <button
                                key={t}
                                onClick={() => setTipo(t)}
                                className={`flex-1 py-2 px-2 text-xs rounded-lg font-bold transition-all border ${tipo === t ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Fecha:</label>
                    <input type="date" className="border border-slate-300 rounded-lg p-2" value={fecha} onChange={e => setFecha(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Hora:</label>
                    <input type="time" className="border border-slate-300 rounded-lg p-2" value={hora} onChange={e => setHora(e.target.value)} />
                </div>
            </div>

            <div className="mb-8">
                <div className="flex items-center justify-between mb-3 border-b pb-2">
                    <h3 className="text-lg font-bold text-slate-800">Responsables de la Inspección</h3>
                    {responsables.length < 8 && (
                        <button onClick={() => setResponsables([...responsables, ''])} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                            <PlusCircle size={14} /> Agregar Responsable
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {responsables.map((r, i) => (
                        <div key={i} className="relative group">
                            <TextInputWithMic placeholder={`Responsable ${i+1}`} className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={r} onChange={(val: string) => handleResponsableChange(i, val)} />
                            {responsables.length > 1 && (
                                <button onClick={() => { const newR = [...responsables]; newR.splice(i, 1); setResponsables(newR); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors">
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* HALLAZGOS */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-lg font-bold text-slate-800">Hallazgos Registrados</h3>
                    <button onClick={addHallazgo} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors">
                        <PlusCircle size={14} /> Agregar Hallazgo
                    </button>
                </div>
                
                <div className="flex flex-col gap-6">
                    {hallazgos.map((h, i) => (
                        <div key={h.id} className="relative bg-blue-50/50 border border-blue-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="absolute -top-3 -left-3 bg-slate-800 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">{i + 1}</div>
                            <button onClick={() => removeHallazgo(h.id)} className="absolute top-2 right-2 text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={20} /></button>
                            
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-2">
                                <div className="col-span-1 md:col-span-3 flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-slate-600 uppercase">Descripción</label>
                                    <TextInputWithMic isTextArea={true} className="border border-slate-300 rounded-lg p-2 h-24 text-sm resize-none" value={h.descripcion} onChange={(val: string) => updateHallazgo(h.id, 'descripcion', val)} placeholder="Descripción de la observación..." />
                                </div>
                                <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-slate-600 uppercase">Evidencia</label>
                                    <div className="h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-white cursor-pointer relative overflow-hidden group" onClick={() => fileInputRefs.current[h.id]?.click()}>
                                        {h.evidencia ? (
                                            <img src={h.evidencia} alt="Evidencia" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                                        ) : (
                                            <div className="text-slate-400 flex flex-col items-center gap-1 group-hover:text-indigo-500 transition-colors">
                                                <Camera size={24} />
                                                <span className="text-[10px] font-bold">Añadir Foto</span>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" capture="environment" className="hidden" ref={el => { fileInputRefs.current[h.id] = el; }} onChange={e => handlePhotoUpload(e, h.id)} />
                                    </div>
                                </div>
                                <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-slate-600 uppercase">Riesgo</label>
                                        <select className={`border border-slate-300 rounded-lg p-2 text-sm font-semibold ${h.riesgo === 'Bajo' ? 'bg-green-100 text-green-800' : h.riesgo === 'Medio' ? 'bg-yellow-100 text-yellow-800' : h.riesgo === 'Alto' ? 'bg-red-100 text-red-800' : 'bg-white'}`} value={h.riesgo} onChange={e => updateHallazgo(h.id, 'riesgo', e.target.value)}>
                                            <option value="">Seleccione</option>
                                            <option value="Bajo">Bajo</option>
                                            <option value="Medio">Medio</option>
                                            <option value="Alto">Alto</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-slate-600 uppercase">Estado</label>
                                        <select className={`border border-slate-300 rounded-lg p-2 text-sm font-semibold ${h.estado === 'Abierto' ? 'bg-red-100 text-red-800' : h.estado === 'Cerrado' ? 'bg-green-100 text-green-800' : 'bg-white'}`} value={h.estado} onChange={e => updateHallazgo(h.id, 'estado', e.target.value)}>
                                            <option value="">Seleccione</option>
                                            <option value="Abierto">Abierto</option>
                                            <option value="Cerrado">Cerrado</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="col-span-1 md:col-span-3 flex flex-col gap-2">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-slate-600 uppercase">Categoría</label>
                                        <select className="border border-slate-300 rounded-lg p-2 text-sm" value={h.categoria} onChange={e => updateHallazgo(h.id, 'categoria', e.target.value)}>
                                            <option value="">Seleccione</option>
                                            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-slate-600 uppercase">Acción Correctiva</label>
                                        <TextInputWithMic isTextArea={true} className="w-full border border-slate-300 rounded-lg p-2 h-10 text-sm resize-none" value={h.accion} onChange={(val: string) => updateHallazgo(h.id, 'accion', val)} />
                                    </div>
                                </div>
                                <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-slate-600 uppercase">Evidencia Levantamiento</label>
                                    <div className="h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-white cursor-pointer relative overflow-hidden group" onClick={() => { const input = document.getElementById('lev_'+h.id); if(input) input.click(); }}>
                                        {h.evidenciaLevantamiento ? (
                                            <img src={h.evidenciaLevantamiento} alt="Levantamiento" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                                        ) : (
                                            <div className="text-slate-400 flex flex-col items-center gap-1 group-hover:text-green-500 transition-colors">
                                                <Camera size={24} />
                                                <span className="text-[10px] font-bold text-center">Añadir Foto<br/>Levantamiento</span>
                                            </div>
                                        )}
                                        <input id={'lev_'+h.id} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => {
                                            if (e.target.files && e.target.files[0]) {
                                                const reader = new FileReader();
                                                reader.onload = (event) => {
                                                    if (event.target?.result) updateHallazgo(h.id, 'evidenciaLevantamiento', event.target.result as string);
                                                };
                                                reader.readAsDataURL(e.target.files[0]);
                                            }
                                        }} />
                                    </div>
                                </div>
                                <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-slate-600 uppercase">Responsable Impl.</label>
                                        <select
                                            className={`border rounded-lg p-1.5 text-sm ${h.responsableEmail && !h.responsableManual ? 'border-green-300 bg-green-50 font-semibold' : 'border-slate-300 bg-white'}`}
                                            value={h.responsableManual ? '__manual__' : (h.responsableEmail ? `${h.responsable}|${h.responsableEmail}` : '')}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                if (v === '__manual__') {
                                                    updateHallazgo(h.id, 'responsableManual', true);
                                                    updateHallazgo(h.id, 'responsableEmail', '');
                                                } else if (v === '') {
                                                    updateHallazgo(h.id, 'responsableManual', false);
                                                    updateHallazgo(h.id, 'responsableEmail', '');
                                                    updateHallazgo(h.id, 'responsable', '');
                                                } else {
                                                    const parts = v.split('|');
                                                    updateHallazgo(h.id, 'responsableManual', false);
                                                    updateHallazgo(h.id, 'responsable', parts[0]);
                                                    updateHallazgo(h.id, 'responsableEmail', parts[1]);
                                                }
                                            }}
                                        >
                                            <option value="">Seleccione responsable...</option>
                                            {contactos.map((c) => (
                                                <option key={c.email} value={`${c.name}|${c.email}`}>{c.name}</option>
                                            ))}
                                            <option value="__manual__">Otro (correo manual)</option>
                                        </select>
                                        {h.responsableManual && (
                                            <div className="flex flex-col gap-1 mt-1">
                                                <input placeholder="Nombre del responsable" className="w-full border border-slate-300 rounded-lg p-1.5 text-sm" value={h.responsable || ''} onChange={(e) => updateHallazgo(h.id, 'responsable', e.target.value)} />
                                                <input placeholder="Correo del responsable" type="email" className="w-full border border-slate-300 rounded-lg p-1.5 text-sm" value={h.responsableEmail || ''} onChange={(e) => updateHallazgo(h.id, 'responsableEmail', e.target.value)} />
                                            </div>
                                        )}
                                        {!h.responsableManual && h.responsableEmail && (
                                            <span className="text-[10px] text-green-700 font-semibold break-all">📧 {h.responsableEmail}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-slate-600 uppercase">Fecha Prog.</label>
                                        <input type="date" className="border border-slate-300 rounded-lg p-1.5 text-sm" value={h.fecha} onChange={e => updateHallazgo(h.id, 'fecha', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {hallazgos.length === 0 && (
                        <div className="text-center text-slate-500 py-6 border-2 border-dashed border-slate-300 rounded-xl">No hay hallazgos registrados.</div>
                    )}
                </div>
            </div>

            {/* CONCLUSIONES Y CIERRE */}
            <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-800 mb-3 border-b pb-2">Conclusiones y Recomendaciones</h3>
                <TextInputWithMic isTextArea={true} className="w-full border border-slate-300 rounded-xl p-4 h-24 resize-none focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Escriba aquí las conclusiones finales..." value={conclusiones} onChange={(val: string) => setConclusiones(val)} />
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Responsable del Registro</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-slate-700">Nombres y Apellidos</label>
                            <TextInputWithMic className="border border-slate-300 rounded-lg p-2" value={regNombre} onChange={setRegNombre} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-slate-700">Cargo</label>
                            <TextInputWithMic className="border border-slate-300 rounded-lg p-2" value={regCargo} onChange={setRegCargo} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-slate-700">Fecha</label>
                            <input type="date" className="border border-slate-300 rounded-lg p-2" value={regFecha} onChange={e => setRegFecha(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700">Firma Digital</label>
                        <SignaturePad onSave={(data: string) => setRegFirma(data)} />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                {generatedReport && (
                    <button 
                        onClick={() => setShowEmailModal(true)} 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
                    >
                        <Mail size={20} />
                        Enviar por Correo
                    </button>
                )}
                <button 
                    onClick={submit} 
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-600/30 disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                    Generar Excel de Inspecciones Internas
                </button>
            </div>
            </div>
        </div>

            <EmailReportModal
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                onSend={handleSendEmail}
                defaultSubject={`Reporte de Inspección Interna SSOMA - ${proyecto || 'Proyecto'}${tipo ? ` (${tipo})` : ''}`}
                isSending={isSendingEmail}
                initialObservations={resumenHallazgos || conclusiones}
            />
        </>
    );
}