"use client";

import React, { useState, useRef, useEffect } from 'react';
import { EmailReportModal } from '@/components/EmailReportModal';
import { useRouter } from 'next/navigation';
import { Save, Loader2, ArrowLeft, CheckCircle, AlertCircle, Mic, X, Camera, Trash2 , Mail} from 'lucide-react';

const generalSections = [
    { category: 'NEUMÁTICOS', items: ['Llantas delanteras (*)', 'Llantas posteriores (*)'] },
    { category: 'ACCESO', items: ['Escaleras', 'Pasamanos'] },
    { category: 'CABINA OPERADOR', items: ['Asiento', 'Cinturón de seguridad (*)', 'Volante (*)', 'Palanca de accionamiento', 'Claxón', 'Luces de Cabina', 'Parabrizas', 'Plumillas', 'Espejos Retrovisiores (*)'] },
    { category: 'SEGURIDAD', items: ['Circulina (*)', 'Alarma de retroceso (*)', 'Sistema de frenos (*)', 'Extintor', 'Conos de seguridad (en caso aplique)', 'Luces (*)'] },
    { category: 'FUGAS DE FLUIDO', type: 'fugas', items: ['Aceite de Motor', 'Combustible', 'Trasmisión', 'Tornamesa', 'Motor de Vibración', 'Motor de Traslación', 'Diferenciales', 'Mandos finales', 'Cilindros dirección'] }
];

const specificSections: Record<string, {category: string, items: string[]}[]> = {
    'Tractor de Oruga': [
        { category: 'IMPLEMENTO', items: ['Hoja Topadora', 'Cuchillas', 'Cantoneras', 'Cilindro de Levante (*)', 'Cil. de inclinación (*)', 'Mangas hidraulicas (*)', 'Brazos de empuje', 'Ripper', 'Cil. Levante de Ripper', 'Pines y seguros'] },
        { category: 'TREN DE RODAMIENTO', items: ['Orugas', 'Sprocket', 'Rodillos Superior', 'Ruedas guías', 'Tensadores', 'Rodillos Inferiores'] }
    ],
    'Excavadoras': [
        { category: 'IMPLEMENTO', items: ['Cuchara', 'Uñas', 'Brazo', 'Pluma', 'Cilindro Brazo (*)', 'Cilindro Pluma (*)', 'Manguera Hidráulicas (*)', 'Pines y Seguros'] },
        { category: 'TREN DE RODAMIENTO', items: ['Orugas', 'Rodillo Superior', 'Tensadores', 'Rodillo Inferior', 'Sprocket'] }
    ],
    'Retroexcavadoras': [
        { category: 'IMPLEMENTO DELANTERO', items: ['Cucharon', 'Uñas / Cuchillas', 'Pines y seguros', 'Cilindro Hidráulico (*)', 'Brazos de Levante', 'Brazo de Volteo', 'Manguera Hidráulico (*)'] },
        { category: 'IMPLEMENTO POSTERIOR', items: ['Brazo', 'Pluma', 'Cilindro Brazo (*)', 'Cilindro pluma (*)', 'Manguera Hidraulico (*)', 'Pines y seguros', 'Brazo estabilizadora (*)'] }
    ],
    'Rodillo Compactador / Tandem': [
        { category: 'IMPLEMENTO', items: ['Rola compactadora', 'Limpiador de rola', 'Motor de Vibración'] }
    ],
    'Motoniveladora': [
        { category: 'IMPLEMENTO', items: ['Hoja Topadora', 'Cuchilla', 'Cantoneras', 'Sobrecantoneras', 'Pernos / Tuerca', 'Cil. De Levante Cuchilla (*)', 'Cil. de Despl. Cuchilla (*)', 'Cil. Giro Cuchilla (*)', 'Tornamesa de giro (*)', 'Mangueras Hidráulica (*)', 'Ripper', 'Escarificadores', 'Cilindro de Levante ripper', 'Mangueras Hidráulica ripper (*)', 'Pines y Seguro'] }
    ],
    'Minicargador': [
        { category: 'IMPLEMENTO', items: ['Cucharón', 'Uñas / Cuchillas', 'Cil. Hidráulico Levante (*)', 'Cil. Hidráulico volteo (*)'] }
    ],
    'Cargador Frontal': [
        { category: 'IMPLEMENTO', items: ['Cucharón', 'Uñas', 'Pines y Seguros', 'Cilindros hidráulicos *', 'Brazos Levante', 'Brazo de volteo', 'Manguera Hidráulico'] }
    ],
    'Fresadora': [
        { category: 'IMPLEMENTO (FRESADORA)', items: ['Gomas de la Tolva', 'Rodillo de Empuje', 'Protección Central', 'Protección lateral', 'Listones de arrastre', 'Cadenas de cinta', 'Zapatas de gomas', 'Deflector de material', 'Roldanas', 'Rueda Motriz dentada', 'Cadena motriz de la cinta', 'Ala de sin fin', 'Chapa delantera de regla', 'Listones de presión', 'Tubos telescópicos', 'Pasarela de la regla', 'Val. De compuerta lateral', 'Pupitre de mando principal'] },
        { category: 'IMPLEMENTO', items: ['Cadena', 'Zapata', 'Tensión de la cadena', 'Roldanas', 'Rueda Guia', 'Rueda Dentada'] },
        { category: 'TAMBOR DE FRESADO', items: ['Separador', 'Patín protector', 'Portapicas', 'Eyector', 'Picas'] },
        { category: 'INSTALACIÓN DE ROCIO', items: ['Boquillas', 'Dispositivo de riego', 'Filtros'] },
        { category: 'CINTA TRANSPORTADORA', items: ['Rodillos de tracción', 'Cojinetes y cojines de sujeción', 'Polea de Guia', 'Rodillo interior de la cinta', 'Juntas de Gomas laterales', 'Cintas transportadoras'] }
    ]
};

export const MachineryCustomForm = ({ moduleName, version, SignaturePad }: { moduleName: string, version: number, SignaturePad: any }) => {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [cachedDriveUrl, setCachedDriveUrl] = useState<string | null>(null);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailData, setEmailData] = useState<any>(null);
    
    // Metadata
    const [meta, setMeta] = useState({
        proyecto: 'RED VIAL 6',
        equipo: '',
        marca: '',
        modelo: '',
        serie: '',
        operador: '',
        turno: '',
        fecha: new Date().toISOString().split('T')[0],
        tipoEquipo: 'Excavadoras' // Default
    });

    const [checklist, setChecklist] = useState<Record<string, string>>({});
    const [observaciones, setObservaciones] = useState('');
    const [fotosDefectos, setFotosDefectos] = useState<Record<string, string[]>>({});

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

    const handleCheck = (item: string, value: string) => {
        setChecklist(prev => ({ ...prev, [item]: value }));
    };

    const handlePhotoUploadDefecto = (item: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    setFotosDefectos(prev => ({
                        ...prev,
                        [item]: [...(prev[item] || []), ev.target!.result as string]
                    }));
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhotoDefecto = (item: string, index: number) => {
        setFotosDefectos(prev => ({
            ...prev,
            [item]: prev[item].filter((_, i) => i !== index)
        }));
    };

    const handleSaveAndDownload = async (isEmailing: boolean = false, customEmailData: any = null) => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/export-excel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    moduleName: 'Maquinaria',
                    isMachineryMatrix: true,
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

                if (data.fileBase64) {
                    setCachedDriveUrl(data.driveUrl);
                    const byteCharacters = atob(data.fileBase64);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

                    
                    if (isEmailing && customEmailData) {
                        try {
                            // Incluir enlace de Drive en el cuerpo (sin adjunto, sin peso)
                            const driveLink = data.driveUrl || '';
                            const bodyWithLink = customEmailData.message.includes('[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]')
                                ? customEmailData.message.replace(
                                    '[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]',
                                    driveLink ? '📎 Enlace al reporte en Drive:\n' + driveLink : ''
                                )
                                : (driveLink ? customEmailData.message + '\n\n📎 Enlace al reporte en Drive:\n' + driveLink : customEmailData.message);

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
                                        '<a href="$1" style="color:#1a73e8;font-weight:bold;">📄 Ver / Descargar Reporte</a>'
                                    ),
                                    fromEmail: customEmailData.fromEmail,
                                    fromName: customEmailData.fromName
                                })
                            });
                            if (!emailRes.ok) throw new Error('Error al enviar correo');
                        } catch (e) {
                            console.error(e);
                            alert('Hubo un error al enviar el correo, pero el reporte se generó en la plataforma.');
                        }
                    } else {
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                    a.download = `INSP_Maquinaria_${meta.fecha || new Date().toISOString().split('T')[0]}.xlsx`;
                    document.body.appendChild(a);
                    a.click();
                        a.remove();
                    }
                }

                await fetch('/api/inspections', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'create',
                        data: {
                            date: meta.fecha || new Date().toISOString().split('T')[0],
                            responsible: meta.chofer || meta.operador || 'Operador',
                            inspectionType: 'Maquinaria',
                            area: meta.proyecto || 'RED VIAL 6',
                            zone: meta.equipo || 'Inspección Digital',
                            status: 'Completado',
                            observations: observaciones || 'Pre-uso de maquinaria generado.',
                            evidencePdf: data.driveUrl || '',
                            evidenceImgs: []
                        }
                    })
                });

                if (!isEmailing) {
                    if (window.confirm('¡Descarga y guardado exitoso!\n\n1. Por favor abre el Excel que se acaba de descargar y revísalo.\n2. Si todo está correcto, haz clic en "Aceptar" para enviarlo por correo ahora mismo (SIN crear duplicados).\n3. Si quieres salir, haz clic en "Cancelar".')) {
                        setShowEmailModal(true);
                    }
                }
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

    const sectionsToRender = generalSections;

    const badItems = Object.entries(checklist).filter(([_, val]) => ['R', 'M', 'F', 'RESUM', 'FUGA'].includes(val));

    return (
        <div className="max-w-4xl mx-auto pb-24">
            <div className="bg-slate-800 text-white p-6 shadow-lg relative z-10 mb-6">
                <button onClick={() => router.push('/inspections')} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors mb-4">
                    <ArrowLeft size={20} /> Volver
                </button>
                <h1 className="text-2xl font-black mb-1 text-yellow-400">Inspección de Maquinaria Pesada</h1>
                <p className="text-slate-400 text-sm">Lista de chequeo F-OP-015</p>
            </div>

            <div className="px-4 space-y-6">
                {/* METADATA */}
                <div className="bg-white border-t-4 border-yellow-400 shadow-sm rounded-xl p-5 flex flex-col gap-4">
                    <h3 className="font-bold text-slate-800 border-b pb-2">Datos Generales</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {renderMicInput("Proyecto", "proyecto", meta.proyecto)}
                        
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase">Tipo de Equipo</label>
                            <select value={meta.tipoEquipo} onChange={e => setMeta({...meta, tipoEquipo: e.target.value})} className="w-full border-b border-slate-200 p-2 text-sm focus:border-yellow-500 outline-none bg-slate-50 font-bold text-blue-700 mt-1">
                                {Object.keys(specificSections).map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                        </div>
                        
                        {renderMicInput("Equipo / Código", "equipo", meta.equipo)}
                        {renderMicInput("Marca", "marca", meta.marca)}
                        {renderMicInput("Modelo", "modelo", meta.modelo)}
                        {renderMicInput("Serie", "serie", meta.serie)}
                        {renderMicInput("Operador de Equipo", "operador", meta.operador)}
                        {renderMicInput("Turno", "turno", meta.turno)}
                        
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase">Fecha</label>
                            <input type="date" value={meta.fecha} onChange={e => setMeta({...meta, fecha: e.target.value})} className="w-full border-b border-slate-200 p-2 text-sm focus:border-yellow-500 outline-none bg-slate-50 mt-1" />
                        </div>
                    </div>
                </div>

                {/* LEGEND */}
                <div className="bg-slate-100 p-3 rounded-lg flex flex-wrap gap-x-6 gap-y-2 text-[10px] sm:text-xs text-slate-600 border border-slate-200">
                    <div className="flex items-center gap-1"><span className="font-black bg-green-500 text-white px-1 rounded">OK</span> Conforme</div>
                    <div className="flex items-center gap-1"><span className="font-black bg-yellow-500 text-white px-1 rounded">R</span> Regular, pero operar, programar cambio</div>
                    <div className="flex items-center gap-1"><span className="font-black bg-orange-500 text-white px-1 rounded">M</span> En mal estado. Reparar a la brevedad</div>
                    <div className="flex items-center gap-1"><span className="font-black bg-red-500 text-white px-1 rounded">F</span> Faltante</div>
                    <div className="flex items-center gap-1"><span className="font-black bg-slate-400 text-white px-1 rounded">N/A</span> No aplica</div>
                </div>

                {/* CHECKLIST */}
                <div className="space-y-6">
                    <h2 className="text-xl font-black text-slate-800 text-center uppercase tracking-wider">Lista de Chequeo</h2>
                    {sectionsToRender.map((section, sIdx) => (
                        <div key={sIdx} className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                            <div className="bg-slate-800 p-3">
                                <h3 className="font-bold text-yellow-400 text-sm uppercase">{section.category}</h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {section.items.map((item) => (
                                    <div key={item} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                                        <div className="text-sm font-semibold text-slate-700 flex-1 pr-4">
                                            {item}
                                        </div>
                                        <div>
                                            {(section as any).type === 'fugas' 
                                                ? renderRadioGroup(item, ['N/A', 'RESUM', 'FUGA'])
                                                : renderRadioGroup(item, ['OK', 'R', 'M', 'F', 'N/A'])}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    
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

                        {badItems.length > 0 && (
                            <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
                                <h4 className="text-[10px] font-black text-orange-800 uppercase mb-2 flex items-center gap-1"><AlertCircle size={12} /> Hallazgos Registrados:</h4>
                                <ul className="list-disc pl-5 text-xs text-orange-900 space-y-1 font-medium">
                                    {badItems.map(([item, val]) => (
                                        <li key={item}>{item} <span className="font-black bg-white px-1.5 rounded border border-orange-200 ml-1">({val})</span></li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <textarea 
                            value={observaciones} 
                            onChange={e => setObservaciones(e.target.value)} 
                            className={"w-full border p-3 text-sm rounded-lg outline-none min-h-[80px] " + (isRecordingMeta === 'observaciones' ? "border-red-400 bg-red-50/30" : "border-slate-200 focus:border-yellow-500")} 
                            placeholder="Escriba o dicte aquí sus observaciones extra de la maquinaria..."
                        />
                    </div>
                </div>

                {/* FIRMAS (Debajo de observaciones) */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col">
                        {renderMicInput("Nombre del Operador de Equipo", "operadorNombre", firmas.operadorNombre, true, "Escribir o dictar nombre...")}
                        <div className="mt-4 flex-1 flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 text-center">Firma del Operador</label>
                            <SignaturePad onSave={(val: string) => setFirmas({...firmas, operadorFirma: val})} />
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col">
                        {renderMicInput("Nombre del Capataz / SSMA", "capatazNombre", firmas.capatazNombre, true, "Escribir o dictar nombre...")}
                        <div className="mt-4 flex-1 flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 text-center">Firma del Capataz / SSMA</label>
                            <SignaturePad onSave={(val: string) => setFirmas({...firmas, capatazFirma: val})} />
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
            initialObservations={typeof observaciones !== "undefined" ? observaciones : typeof observacionesGenerales !== "undefined" ? observacionesGenerales : ""} 
                      isOpen={showEmailModal} 
                      onClose={() => setShowEmailModal(false)}
                      isSending={isSaving}
                      onSend={async (data) => {
                          if (cachedDriveUrl) {
                              setIsSaving(true);
                              try {
                                  const bodyWithLink = data.message.includes('[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]')
                                      ? data.message.replace('[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]', '📎 Enlace al reporte en Drive:\n' + cachedDriveUrl)
                                      : data.message + '\n\n📎 Enlace al reporte en Drive:\n' + cachedDriveUrl;
                                  
                                  const emailRes = await fetch('/api/send-email', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                          to: data.to, cc: data.cc, subject: data.subject,
                                          text: bodyWithLink,
                                          html: bodyWithLink.replace(/\n/g, '<br>').replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" style="color:#1a73e8;font-weight:bold;">📄 Ver / Descargar Reporte</a>'),
                                          fromEmail: data.fromEmail, fromName: data.fromName
                                      })
                                  });
                                  if (!emailRes.ok) throw new Error('Error enviando correo');
                                  alert('✅ Correo enviado correctamente con el reporte ya revisado.');
                              } catch(e) {
                                  alert('Error al enviar el correo.');
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
