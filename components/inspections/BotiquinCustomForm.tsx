"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, Trash2, Camera, Save, Loader2, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';

interface BotiquinCustomFormProps {
    moduleName: string;
    version: number;
    SignaturePad: React.ComponentType<{ onSave: (data: string) => void }>;
}

interface ChecklistItem {
    id: number;
    name: string;
    qty: string;
    status: 'C' | 'NC' | 'N/A' | null;
}

const INITIAL_BOTIQUIN_ITEMS: { name: string; qty: string }[] = [
    { name: 'Paquetes de guantes quirúrgicos', qty: '02' },
    { name: 'Frascos de yodopovidona 120ml solución', qty: '01' },
    { name: 'Frascos de agua oxigenada 120ml', qty: '01' },
    { name: 'Frasco de alcohol de 70° 500ml', qty: '01' },
    { name: 'Paquetes de gasas estériles fraccionadas 10x10 cm', qty: '05' },
    { name: 'Paquetes de apósitos estériles 10x10 cm', qty: '08' },
    { name: 'Rollos de esparadrapo 2.5cm x 5m', qty: '01' },
    { name: 'Rollos de venda elástica de 3 pulg x 5 yardas', qty: '02' },
    { name: 'Rollos de venda elástica de 4 pulg x 5 yardas', qty: '02' },
    { name: 'Paquetes de algodón hidrófilo de 100g', qty: '01' },
    { name: 'Venda triangular', qty: '01' },
    { name: 'Paletas bajalengua', qty: '10' },
    { name: 'Frascos de solución salina (cloruro de sodio al 0.9%) de 1000ml', qty: '01' },
    { name: 'Apósitos para quemaduras jelonet 10x10cm', qty: '02' },
    { name: 'Frascos de colirio de 10ml', qty: '02' },
    { name: 'Tijera de trauma', qty: '01' },
    { name: 'Pinza', qty: '01' },
    { name: 'Jabón antiséptico', qty: '01' },
    { name: 'Curitas', qty: '10' }
];

export function BotiquinCustomForm({ moduleName, version, SignaturePad }: BotiquinCustomFormProps) {
    const router = useRouter();

    // Metadata
    const [proyecto, setProyecto] = useState('RED VIAL 6');
    const [fecha, setFecha] = useState(() => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' }));
    const [hora, setHora] = useState(() => {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    });
    const [inspector, setInspector] = useState('');
    const [cargo, setCargo] = useState('');
    const [responsable, setResponsable] = useState('');
    const [ubicacion, setUbicacion] = useState('');
    const [isPlanificada, setIsPlanificada] = useState(true);
    const [isNoPlanificada, setIsNoPlanificada] = useState(false);
    const [isOtro, setIsOtro] = useState(false);

    // Firmas
    const [inspectorSignature, setInspectorSignature] = useState('');
    const [responsableSignature, setResponsableSignature] = useState('');

    // Checklist Items
    const [items, setItems] = useState<ChecklistItem[]>(() =>
        INITIAL_BOTIQUIN_ITEMS.map((item, index) => ({
            id: index + 1,
            name: item.name,
            qty: item.qty,
            status: null
        }))
    );

    // Fotos de hallazgos (NC)
    const [fotosDefectos, setFotosDefectos] = useState<Record<string, string[]>>({});

    // Observaciones
    const [observaciones, setObservaciones] = useState('');

    // Estado de guardado y voz
    const [isSaving, setIsSaving] = useState(false);
    const [activeRecordingField, setActiveRecordingField] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);

    const toggleVoice = (fieldKey: string, currentValue: string, setter: (val: string) => void) => {
        if (typeof window === 'undefined') return;
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('El dictado por voz no está soportado en este navegador.');
            return;
        }

        if (activeRecordingField === fieldKey) {
            recognitionRef.current?.stop();
            setActiveRecordingField(null);
            return;
        }

        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'es-ES';

        let baseText = currentValue || '';

        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalChunk = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalChunk += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            if (finalChunk) {
                baseText = (baseText + ' ' + finalChunk).trim();
            }
            setter((baseText + ' ' + interimTranscript).trim());
        };

        recognition.onend = () => {
            setActiveRecordingField(null);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setActiveRecordingField(fieldKey);
    };

    const handleStatusChange = (id: number, status: 'C' | 'NC' | 'N/A') => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, status } : item));
    };

    const handleQtyChange = (id: number, qty: string) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, qty } : item));
    };

    const handlePhotoUpload = (itemName: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        files.forEach(file => {
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

                        setFotosDefectos(prev => ({
                            ...prev,
                            [itemName]: [...(prev[itemName] || []), compressedBase64]
                        }));
                    };
                    img.src = event.target.result as string;
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (itemName: string, photoIdx: number) => {
        setFotosDefectos(prev => ({
            ...prev,
            [itemName]: prev[itemName].filter((_, i) => i !== photoIdx)
        }));
    };

    const badItems = items.filter(i => i.status === 'NC');

    const handleSaveAndDownload = async () => {
        if (!inspector.trim()) {
            alert('Por favor, indica el nombre del Inspector.');
            return;
        }

        setIsSaving(true);
        try {
            const templateItems = [
                { text: 'Proyecto', type: 'item' },
                { text: 'Fecha de inspección', type: 'item' },
                { text: 'Hora', type: 'item' },
                { text: 'Inspector', type: 'item' },
                { text: 'Cargo', type: 'item' },
                { text: 'Responsable', type: 'item' },
                { text: 'Ubicación del Botiquín', type: 'item' },
                { text: 'Inspección planificada', type: 'item' },
                { text: 'Inspección no planificada', type: 'item' },
                { text: 'Otro', type: 'item' },
                ...items.map(item => ({ text: item.name, type: 'item', qty: item.qty })),
                { text: 'Observaciones', type: 'item' }
            ];

            const answersObj: Record<number, any> = {
                0: { text: proyecto },
                1: { text: fecha },
                2: { text: hora },
                3: { text: inspector, signature: inspectorSignature },
                4: { text: cargo },
                5: { text: responsable, signature: responsableSignature },
                6: { text: ubicacion },
                7: { text: isPlanificada ? 'true' : 'false' },
                8: { text: isNoPlanificada ? 'true' : 'false' },
                9: { text: isOtro ? 'true' : 'false' }
            };

            items.forEach((item, idx) => {
                answersObj[10 + idx] = {
                    text: item.status || '',
                    qty: item.qty
                };
            });

            answersObj[10 + items.length] = { text: observaciones };

            const res = await fetch('/api/export-excel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    moduleName: 'Botiquines',
                    answers: answersObj,
                    template: templateItems,
                    saveToDrive: true,
                    fotosDefectos
                })
            });

            if (res.ok) {
                const data = await res.json();

                if (data.fileBase64) {
                    const byteCharacters = atob(data.fileBase64);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `INSP_Botiquines_${fecha}.xlsx`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                }

                await fetch('/api/inspections', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'create',
                        data: {
                            date: fecha,
                            responsible: inspector,
                            inspectionType: 'Botiquines',
                            area: proyecto,
                            zone: ubicacion || 'Inspección Digital',
                            status: 'Completado',
                            observations: observaciones || 'Generado desde formulario blindado de Botiquines.',
                            evidencePdf: data.driveUrl || '',
                            evidenceImgs: []
                        }
                    })
                });

                alert('¡Inspección de Botiquín guardada exitosamente en Drive y Base de Datos!');
                window.location.href = '/inspections?openDigital=true';
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
        <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24 text-slate-800">
            {/* Header con indicador de blindaje */}
            <div className="flex items-center justify-between mb-4">
                <button 
                    onClick={() => router.push('/inspections?openDigital=true')} 
                    className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm"
                >
                    <ArrowLeft size={16} /> Volver
                </button>
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                    <ShieldCheck size={14} className="text-emerald-600" /> Formato Blindado (V{version || 1})
                </div>
            </div>

            {/* Banner del Formato */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 mb-6 shadow-md border border-slate-800">
                <h1 className="text-xl font-black">Inspección de Botiquines</h1>
                <p className="text-slate-400 text-xs mt-1">Formato F-SIG-030 • Red Vial 6 • Calibración Asegurada</p>
            </div>

            {/* SECCIÓN 1: CABECERA Y METADATOS */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6 space-y-4">
                <h3 className="font-bold text-slate-800 text-sm border-b pb-2">1. Datos Generales de la Inspección</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Proyecto */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Proyecto</label>
                        <input 
                            type="text" 
                            value={proyecto} 
                            onChange={(e) => setProyecto(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" 
                        />
                    </div>

                    {/* Ubicación del Botiquín (D8) */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Ubicación del Botiquín (D8)</label>
                        <div className="relative flex items-center">
                            <input 
                                type="text" 
                                value={ubicacion} 
                                onChange={(e) => setUbicacion(e.target.value)} 
                                placeholder="Ej. Taller Mecánico, Caseta 2..." 
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pr-20 text-sm outline-none focus:border-blue-500" 
                            />
                            <div className="absolute right-2 flex items-center gap-1">
                                <button 
                                    type="button" 
                                    onClick={() => toggleVoice('ubicacion', ubicacion, setUbicacion)}
                                    className={`p-1.5 rounded-md ${activeRecordingField === 'ubicacion' ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-blue-600'}`}
                                    title="Dictar por voz"
                                >
                                    {activeRecordingField === 'ubicacion' ? <MicOff size={16} /> : <Mic size={16} />}
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setUbicacion('')}
                                    className="p-1.5 rounded-md text-slate-400 hover:text-red-500"
                                    title="Limpiar"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Fecha y Hora */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Fecha de Inspección (D5)</label>
                        <input 
                            type="date" 
                            value={fecha} 
                            onChange={(e) => setFecha(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" 
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Hora (I5)</label>
                        <input 
                            type="time" 
                            value={hora} 
                            onChange={(e) => setHora(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" 
                        />
                    </div>
                </div>

                {/* Tipo de Inspección (Checkboxes A10, A11) */}
                <div className="pt-2 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-600 mb-2 block">Tipo de Inspección</label>
                    <div className="flex flex-wrap gap-4 text-sm">
                        <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-100">
                            <input 
                                type="checkbox" 
                                checked={isPlanificada} 
                                onChange={(e) => { setIsPlanificada(e.target.checked); if (e.target.checked) setIsNoPlanificada(false); }}
                                className="w-4 h-4 accent-emerald-600" 
                            />
                            <span className="font-semibold text-slate-700">Inspección Planificada (A10)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-100">
                            <input 
                                type="checkbox" 
                                checked={isNoPlanificada} 
                                onChange={(e) => { setIsNoPlanificada(e.target.checked); if (e.target.checked) setIsPlanificada(false); }}
                                className="w-4 h-4 accent-emerald-600" 
                            />
                            <span className="font-semibold text-slate-700">Inspección No Planificada (A11)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-100">
                            <input 
                                type="checkbox" 
                                checked={isOtro} 
                                onChange={(e) => setIsOtro(e.target.checked)}
                                className="w-4 h-4 accent-emerald-600" 
                            />
                            <span className="font-semibold text-slate-700">Otro</span>
                        </label>
                    </div>
                </div>

                {/* Inspector y Firma (D6, K6) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Inspector a cargo (D6)</label>
                            <div className="relative flex items-center">
                                <input 
                                    type="text" 
                                    value={inspector} 
                                    onChange={(e) => setInspector(e.target.value)} 
                                    placeholder="Nombres y Apellidos..." 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pr-20 text-sm outline-none focus:border-blue-500" 
                                />
                                <div className="absolute right-2 flex items-center gap-1">
                                    <button 
                                        type="button" 
                                        onClick={() => toggleVoice('inspector', inspector, setInspector)}
                                        className={`p-1.5 rounded-md ${activeRecordingField === 'inspector' ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-blue-600'}`}
                                        title="Dictar por voz"
                                    >
                                        {activeRecordingField === 'inspector' ? <MicOff size={16} /> : <Mic size={16} />}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setInspector('')}
                                        className="p-1.5 rounded-md text-slate-400 hover:text-red-500"
                                        title="Limpiar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Cargo del Inspector</label>
                            <div className="relative flex items-center">
                                <input 
                                    type="text" 
                                    value={cargo} 
                                    onChange={(e) => setCargo(e.target.value)} 
                                    placeholder="Ej. Supervisor SSOMA..." 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pr-20 text-sm outline-none focus:border-blue-500" 
                                />
                                <div className="absolute right-2 flex items-center gap-1">
                                    <button 
                                        type="button" 
                                        onClick={() => toggleVoice('cargo', cargo, setCargo)}
                                        className={`p-1.5 rounded-md ${activeRecordingField === 'cargo' ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-blue-600'}`}
                                        title="Dictar por voz"
                                    >
                                        {activeRecordingField === 'cargo' ? <MicOff size={16} /> : <Mic size={16} />}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setCargo('')}
                                        className="p-1.5 rounded-md text-slate-400 hover:text-red-500"
                                        title="Limpiar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Firma del Inspector (K6)</label>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                            <SignaturePad onSave={setInspectorSignature} />
                        </div>
                    </div>
                </div>

                {/* Responsable de área y Firma (D7, K7) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Responsable de Área (D7)</label>
                        <div className="relative flex items-center">
                            <input 
                                type="text" 
                                value={responsable} 
                                onChange={(e) => setResponsable(e.target.value)} 
                                placeholder="Nombres y Apellidos del Responsable..." 
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pr-20 text-sm outline-none focus:border-blue-500" 
                            />
                            <div className="absolute right-2 flex items-center gap-1">
                                <button 
                                    type="button" 
                                    onClick={() => toggleVoice('responsable', responsable, setResponsable)}
                                    className={`p-1.5 rounded-md ${activeRecordingField === 'responsable' ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-blue-600'}`}
                                    title="Dictar por voz"
                                >
                                    {activeRecordingField === 'responsable' ? <MicOff size={16} /> : <Mic size={16} />}
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setResponsable('')}
                                    className="p-1.5 rounded-md text-slate-400 hover:text-red-500"
                                    title="Limpiar"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Firma del Responsable de Área (K7)</label>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                            <SignaturePad onSave={setResponsableSignature} />
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: CHECKLIST DE INSUMOS */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                <div className="bg-slate-800 text-white px-5 py-3.5 flex justify-between items-center">
                    <h3 className="font-bold text-sm">2. Verificación de Insumos del Botiquín</h3>
                    <span className="text-xs bg-slate-700 px-2.5 py-1 rounded-full">{items.length} Insumos Evaluados</span>
                </div>

                <div className="divide-y divide-slate-100">
                    {items.map((item) => (
                        <div key={item.id} className="p-3.5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1">
                                <span className="text-xs font-bold text-slate-400 mr-2">#{item.id}</span>
                                <span className="text-sm font-semibold text-slate-800">{item.name}</span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                {/* Cantidad */}
                                <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg px-2 py-1">
                                    <span className="text-[10px] font-bold text-slate-400 mr-1.5">CANT:</span>
                                    <input 
                                        type="text" 
                                        value={item.qty} 
                                        onChange={(e) => handleQtyChange(item.id, e.target.value)}
                                        className="w-10 bg-transparent text-xs font-bold text-slate-700 text-center outline-none" 
                                    />
                                </div>

                                {/* Botones C / NC / N/A */}
                                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                                    <button 
                                        type="button" 
                                        onClick={() => handleStatusChange(item.id, 'C')} 
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${item.status === 'C' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}
                                    >
                                        C
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => handleStatusChange(item.id, 'NC')} 
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${item.status === 'NC' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}
                                    >
                                        NC
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => handleStatusChange(item.id, 'N/A')} 
                                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${item.status === 'N/A' ? 'bg-slate-500 text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}
                                    >
                                        N/A
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* SECCIÓN 3: EVIDENCIA FOTOGRÁFICA DE HALLAZGOS (NC) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
                <h3 className="font-bold text-slate-800 text-sm border-b pb-2 flex items-center gap-2 mb-4">
                    <Camera size={18} className="text-blue-500" />
                    3. Evidencia Fotográfica de Hallazgos (Se inserta a partir de la fila 48 en Excel)
                </h3>

                {badItems.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4 italic">
                        No hay insumos marcados como "NC" (No Conforme) actualmente.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {badItems.map((b) => (
                            <div key={b.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-bold text-sm text-red-700">{b.name}</span>
                                    <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded">NO CONFORME</span>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    {(fotosDefectos[b.name] || []).map((foto, fIdx) => (
                                        <div key={fIdx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-300 group">
                                            <img src={foto} alt={b.name} className="w-full h-full object-cover" />
                                            <button 
                                                type="button" 
                                                onClick={() => removePhoto(b.name, fIdx)}
                                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}

                                    <label className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-500 cursor-pointer transition-colors bg-white">
                                        <Camera size={20} className="mb-1" />
                                        <span className="text-[10px] font-bold">+ Foto</span>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            capture="environment" 
                                            multiple 
                                            onChange={(e) => handlePhotoUpload(b.name, e)} 
                                            className="hidden" 
                                        />
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SECCIÓN 4: OBSERVACIONES */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-8">
                <h3 className="font-bold text-slate-800 text-sm border-b pb-2 mb-3">
                    4. Observaciones y Conclusiones (A36)
                </h3>

                {/* Resumen dinámico de Hallazgos */}
                {badItems.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-3">
                        <h5 className="font-bold text-red-800 text-xs mb-1.5 flex items-center gap-1.5">
                            <AlertCircle size={14} /> HALLAZGOS REGISTRADOS AUTOMÁTICAMENTE:
                        </h5>
                        <ul className="list-disc pl-5 text-xs text-red-700 space-y-1">
                            {badItems.map((b) => (
                                <li key={b.id}><strong>{b.name}</strong> (NO CONFORME - CANT: {b.qty})</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="relative">
                    <textarea 
                        value={observaciones} 
                        onChange={(e) => setObservaciones(e.target.value)} 
                        rows={4} 
                        placeholder="Escribe o dicta observaciones adicionales. Los hallazgos anteriores se consolidarán automáticamente en el cuadro de redacción del Excel..." 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pr-20 text-sm outline-none focus:border-blue-500 resize-y" 
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-1">
                        <button 
                            type="button" 
                            onClick={() => toggleVoice('observaciones', observaciones, setObservaciones)}
                            className={`p-2 rounded-full ${activeRecordingField === 'observaciones' ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 text-slate-600 hover:bg-blue-100 hover:text-blue-600'}`}
                            title="Dictar por voz"
                        >
                            {activeRecordingField === 'observaciones' ? <MicOff size={16} /> : <Mic size={16} />}
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setObservaciones('')}
                            className="p-2 rounded-full bg-slate-200 text-slate-600 hover:bg-red-100 hover:text-red-600"
                            title="Limpiar"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* BOTÓN FINALIZAR */}
            <div className="sticky bottom-4 z-40">
                <button 
                    onClick={handleSaveAndDownload} 
                    disabled={isSaving} 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-600/30 transition-transform active:scale-95 disabled:opacity-50 text-base"
                >
                    {isSaving ? <Loader2 size={22} className="animate-spin" /> : <Save size={22} />}
                    {isSaving ? 'Generando Excel y Guardando en Drive...' : 'Finalizar y Descargar Excel'}
                </button>
            </div>
        </div>
    );
}