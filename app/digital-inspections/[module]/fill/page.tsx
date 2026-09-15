"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Mic, MicOff, Trash2, Camera, CheckCircle, AlertCircle, Save, Loader2, ArrowLeft, X } from 'lucide-react';

const SignaturePad = ({ onSave }: { onSave: (data: string) => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    
    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if(ctx) { ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#0f172a'; }
    }, []);

    const start = (e: any) => { setIsDrawing(true); draw(e); };
    const stop = () => { setIsDrawing(false); const canvas = canvasRef.current; if(canvas) { canvas.getContext('2d')?.beginPath(); onSave(canvas.toDataURL()); } };
    const draw = (e: any) => {
        if(!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if(!canvas || !ctx) return;
        const rect = canvas.getBoundingClientRect();
        // Ajuste de escala porque el canvas CSS es w-full pero su ancho interno es 400
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = ((e.clientX || e.touches?.[0]?.clientX) - rect.left) * scaleX;
        const y = ((e.clientY || e.touches?.[0]?.clientY) - rect.top) * scaleY;
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };
    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if(canvas && ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); onSave(''); }
    };

    return (
        <div className="flex flex-col gap-2 w-full mt-2">
            <canvas ref={canvasRef} onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseOut={stop} onTouchStart={start} onTouchMove={draw} onTouchEnd={stop} width={400} height={100} className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 w-full h-[100px] touch-none" />
            <button onClick={clear} className="text-sm text-red-500 font-bold self-end hover:underline">Borrar Firma</button>
        </div>
    );
};

import { EppCustomForm } from '@/components/inspections/EppCustomForm';
import { MachineryCustomForm } from '@/components/inspections/MachineryCustomForm';

export default function FillDigitalInspection() {
    const params = useParams();
    const router = useRouter();
    const moduleName = decodeURIComponent(params.module as string);
    
    const [loading, setLoading] = useState(true);
    const [template, setTemplate] = useState<any[]>([]);
    const [version, setVersion] = useState(1);
    
    const [answers, setAnswers] = useState<any>({});
    const [isRecording, setIsRecording] = useState<number | null>(null);
    const recognitionRef = useRef<any>(null);

    // Estado para las fotos de cada hallazgo (NC o NO CONFORME)
    const [fotosDefectos, setFotosDefectos] = useState<Record<string, string[]>>({});

    const handlePhotoUploadDefecto = (itemName: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setFotosDefectos(prev => ({
                        ...prev,
                        [itemName]: [...(prev[itemName] || []), event.target!.result as string]
                    }));
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhotoDefecto = (itemName: string, index: number) => {
        setFotosDefectos(prev => ({
            ...prev,
            [itemName]: prev[itemName].filter((_, i) => i !== index)
        }));
    };

    useEffect(() => {
        fetch(`/api/templates/get?module=${encodeURIComponent(moduleName)}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    let itemsToUse = data.items;
                    
                    // Parche temporal para formatos de Almacén subidos antes de la actualización del parser
                    if (moduleName.toLowerCase().includes('almac')) {
                        const hasFecha = itemsToUse.some((i: any) => i.text.toLowerCase().includes('fecha'));
                        if (!hasFecha) {
                            // Extraer los ítems conocidos
                            const proyecto = itemsToUse.find((i: any) => i.text.toLowerCase().includes('proyecto')) || itemsToUse[0];
                            const inspector = itemsToUse.find((i: any) => i.text.toLowerCase().includes('inspector')) || { text: 'Inspector', type: 'item' };
                            const responsable = itemsToUse.find((i: any) => i.text.toLowerCase().includes('responsable')) || { text: 'Responsable de área', type: 'item' };
                            
                            // Filtrar los demás ítems (el checklist, etc)
                            const restOfItems = itemsToUse.filter((i: any) => 
                                i !== proyecto && i !== inspector && i !== responsable
                            );

                            itemsToUse = [
                                proyecto,
                                { text: 'Área de inspección específica', type: 'item' },
                                { text: 'Fecha', type: 'item' },
                                inspector,
                                { text: 'Cargo', type: 'item' },
                                responsable,
                                ...restOfItems
                            ];
                        }
                    }

                    setTemplate(itemsToUse);
                    setVersion(data.version);
                    // Init answers state with defaults
                    const initAns: any = {};
                    itemsToUse.forEach((item: any, idx: number) => {
                        let defaultText = '';
                        const t = item.text.toUpperCase();
                        if (t.includes('RAZON SOCIAL') || t.includes('RAZÓN SOCIAL')) defaultText = 'Construccion y Administracion S.A.';
                        else if (t.includes('DOMICILIO')) defaultText = 'Av. Javier Prado Este 4109, Lima 15023';
                        else if (t.includes('PROYECTO')) defaultText = 'RED VIAL 6';
                        
                        let defaultQty = item.qty || '';
                        
                        // Fallback Inteligente para Botiquines en caso el parser de Excel no lo logre aislar por formato de celdas combinadas
                        if (!defaultQty && moduleName.toLowerCase().includes('botiquin')) {
                            const tLow = t.toLowerCase();
                            if (tLow.includes('guantes')) defaultQty = '02';
                            else if (tLow.includes('yodopovidoma')) defaultQty = '01';
                            else if (tLow.includes('agua oxigenada')) defaultQty = '01';
                            else if (tLow.includes('alcohol')) defaultQty = '01';
                            else if (tLow.includes('gasas')) defaultQty = '05';
                            else if (tLow.includes('apósitos') || tLow.includes('apositos')) defaultQty = '08';
                            else if (tLow.includes('esparadrapo')) defaultQty = '01';
                            else if (tLow.includes('venda elástica de 3')) defaultQty = '02';
                            else if (tLow.includes('venda elástica de 4')) defaultQty = '02';
                            else if (tLow.includes('algodón') || tLow.includes('algodon')) defaultQty = '01';
                            else if (tLow.includes('venda triangular')) defaultQty = '01';
                            else if (tLow.includes('paletas') || tLow.includes('lengua')) defaultQty = '10';
                            else if (tLow.includes('cloruro')) defaultQty = '01';
                            else if (tLow.includes('jelonet')) defaultQty = '02';
                            else if (tLow.includes('colirio')) defaultQty = '02';
                            else if (tLow.includes('tijera')) defaultQty = '01';
                            else if (tLow.includes('pinza')) defaultQty = '01';
                            else if (tLow.includes('jabón') || tLow.includes('jabon')) defaultQty = '01';
                            else if (tLow.includes('curitas')) defaultQty = '10';
                        }
                        
                        initAns[idx] = { text: defaultText, isConforme: null, skipped: false, quantity: defaultQty };
                    });
                    setAnswers(initAns);
                } else {
                    alert('No se encontró configuración para este módulo.');
                }
                setLoading(false);
            });

        // Setup Speech Recognition
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'es-ES';
                recognitionRef.current = recognition;
            }
        }
    }, [moduleName]);

    const handleAnswerChange = (idx: number, field: string, value: any) => {
        setAnswers((prev: any) => ({
            ...prev,
            [idx]: { ...prev[idx], [field]: value }
        }));
    };

    const toggleVoiceRecording = (idx: number) => {
        if (!recognitionRef.current) {
            alert('Tu navegador no soporta reconocimiento de voz. Usa Google Chrome.');
            return;
        }

        if (isRecording === idx) {
            recognitionRef.current.stop();
            setIsRecording(null);
        } else {
            if (isRecording !== null) recognitionRef.current.stop();
            
            setIsRecording(idx);
            
            // Fix: avoid replacing previous text, append to it
            let finalTranscriptAtStart = answers[idx]?.text || '';
            
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
                
                handleAnswerChange(idx, 'text', (finalTranscriptAtStart + ' ' + interimTranscript).trim());
            };
            
            recognitionRef.current.onend = () => {
                setIsRecording(null);
            };
            
            recognitionRef.current.start();
        }
    };

    const isConformeField = (text: string) => {
        const t = text.toLowerCase().trim();
        return t === 'señalización' || t === 'señalizacion' || t.includes('acceso al extintor') || t.includes('estado general');
    };

    const isCheckboxField = (text: string) => {
        const t = text.toLowerCase().trim();
        return t === 'inspección planificada' || t === 'inspección no planificada' || t === 'otro';
    };

    const isMetadataField = (text: string) => {
        const t = text.toLowerCase().trim();
        if (t === 'área' || t === 'area' || t === 'área:' || t.includes('área de inspección') || t.includes('area de inspeccion')) return true;
        if (t === 'proyecto' || t === 'proyecto:') return true;
        const keywords = ['inspector', 'responsable', 'ubicación', 'ubicacion', 'observaciones', 'comentario', 'comentarios', 'razón social', 'razon social', 'domicilio', 'cargo', 'fecha', 'hora', 'código', 'codigo', 'versión', 'version', 'conductor', 'placa', 'kilometraje', 'turno', 'empresa'];
        return keywords.some(kw => t.includes(kw));
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>;

    if (moduleName.toLowerCase().includes('epp')) {
        return <EppCustomForm moduleName={moduleName} version={version} SignaturePad={SignaturePad} />;
    }

    if (moduleName.toLowerCase().includes('maquinaria') || moduleName.toLowerCase().includes('máquina') || moduleName.toLowerCase().includes('maquina')) {
        return <MachineryCustomForm moduleName={moduleName} version={version} SignaturePad={SignaturePad} />;
    }

    const badItems = template
        .map((item, idx) => ({ text: item.text, ans: answers[idx] }))
        .filter(({ ans }) => ans?.text === 'NC' || ans?.isConforme === false)
        .map(({ text, ans }) => ({ text, val: ans?.text === 'NC' ? 'NC' : 'NO CONFORME' }));

    return (
        <div className="p-4 md:p-8 max-w-3xl mx-auto">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 font-semibold">
                <ArrowLeft size={16} /> Volver
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                <div className="bg-slate-900 p-6 text-white">
                    <h1 className="text-xl font-bold">
                        {moduleName.toLowerCase().startsWith('inspección') || moduleName.toLowerCase().startsWith('inspeccion') 
                            ? moduleName 
                            : `Inspección de ${moduleName}`}
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Versión de Formato: V{version}</p>
                </div>
                
                <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {template.map((item, idx) => {
                        if (item.type === 'title') {
                            return (
                                <div key={idx} className="col-span-1 md:col-span-2 bg-slate-800 text-white rounded-t-xl px-4 py-3 mt-4 shadow-md border-b-4 border-blue-500 flex items-center gap-2">
                                    <h3 className="text-sm font-black tracking-wider uppercase">{item.text}</h3>
                                </div>
                            );
                        }

                        if (item.text.toLowerCase() === 'cargo' || (item.text.toLowerCase().includes('cargo') && !item.text.toLowerCase().includes('responsable'))) {
                            const hasInspector = template.some(i => i.text.toLowerCase().includes('inspector'));
                            if (hasInspector) {
                                // El cargo normal se renderizará dentro del panel del inspector
                                return null;
                            }
                        }

                        const ans = answers[idx];

                        const requiresConforme = isConformeField(item.text);
                        const isCheckbox = isCheckboxField(item.text);
                        const isChecklistField = !isMetadataField(item.text) && !requiresConforme && !isCheckbox;
                        
                        const isUbicacion = item.text.toLowerCase().includes('ubicación') || item.text.toLowerCase().includes('ubicacion');
                        const isCodigo = item.text.toLowerCase().includes('código') || item.text.toLowerCase().includes('codigo');
                        
                        // Solo mostramos cámara en "código" o en "ubicación"
                        const requiresPhoto = isCodigo || (isUbicacion && idx > 5);

                        // Interceptar nombres
                        let displayText = item.text;
                        const upperText = displayText.toUpperCase().trim();
                        if (upperText === 'ACTUAL' || upperText === 'FECHA ACTUAL') displayText = 'FECHA ACTUAL DE RECARGA';
                        else if (upperText === 'PRÓXIMA' || upperText === 'PROXIMA' || upperText === 'PRÓXIMO') displayText = 'FECHA PRÓXIMA DE RECARGA';

                        const isObservaciones = item.text.toLowerCase().includes('observaciones') || item.text.toLowerCase().includes('comentario');
                        const isProyecto = item.text.toLowerCase().includes('proyecto');
                        const isResponsable = item.text.toLowerCase().includes('responsable');
                        
                        // Solo el checklist, los C/NC, Observaciones y Proyecto ocuparán todo el ancho
                        // Responsable ahora será de la mitad del ancho para que empate con Inspector
                        const isFullWidth = isChecklistField || requiresConforme || isObservaciones || isProyecto;
                        const widthClass = isFullWidth ? 'col-span-1 md:col-span-2' : 'col-span-1';

                        if (item.text.toLowerCase().includes('inspector')) {
                            const cargoIdx = template.findIndex(i => i.text.toLowerCase() === 'cargo' || (i.text.toLowerCase().includes('cargo') && !i.text.toLowerCase().includes('responsable')));
                            const cargoAns = cargoIdx !== -1 ? answers[cargoIdx] : null;

                            return (
                                <div key={idx} className={`${widthClass} bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col gap-2 relative`}>
                                    <h4 className="font-semibold text-slate-700 text-sm">{displayText}</h4>
                                    <div className="relative">
                                        <textarea 
                                            value={ans?.text || ''}
                                            onChange={(e) => handleAnswerChange(idx, 'text', e.target.value)}
                                            placeholder="Nombre del inspector..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pr-12 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y min-h-[48px] h-[48px]"
                                        />
                                    </div>
                                    
                                    {cargoIdx !== -1 && (
                                        <>
                                            <h4 className="font-semibold text-slate-700 text-sm mt-2">Cargo</h4>
                                            <div className="relative">
                                                <textarea 
                                                    value={cargoAns?.text || ''}
                                                    onChange={(e) => handleAnswerChange(cargoIdx, 'text', e.target.value)}
                                                    placeholder="Escribe el cargo..."
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pr-12 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y min-h-[48px] h-[48px]"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                        <h5 className="font-bold text-slate-700 text-sm mb-2">Firma Digital:</h5>
                                        <SignaturePad onSave={(data) => handleAnswerChange(idx, 'signature', data)} />
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={idx} className={`${widthClass} bg-white ${isChecklistField ? 'border-x border-b border-slate-200 hover:bg-slate-50 transition-colors py-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3' : isCheckbox ? 'border border-slate-200 shadow-sm rounded-xl p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3' : 'border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col gap-2 relative'}`}>
                                {isCheckbox ? (
                                    <>
                                        <h4 className="font-semibold text-slate-700 text-sm">{displayText}</h4>
                                        <button 
                                            onClick={() => handleAnswerChange(idx, 'text', ans?.text === 'X' ? '' : 'X')}
                                            className={`w-8 h-8 rounded-md border-2 flex items-center justify-center transition-all ${ans?.text === 'X' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-transparent hover:border-blue-400'}`}
                                        >
                                            <X size={20} className={ans?.text === 'X' ? 'text-white' : 'text-transparent'} />
                                        </button>
                                    </>
                                ) : isChecklistField ? (
                                    <>
                                        <div className="flex-1 flex justify-between items-center gap-2">
                                            <h4 className="font-semibold text-slate-700 text-sm leading-snug">{displayText}</h4>
                                            {requiresPhoto && (
                                                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Adjuntar foto">
                                                    <Camera size={18} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                                                <button 
                                                    onClick={() => handleAnswerChange(idx, 'text', 'C')}
                                                    className={`px-3 py-1.5 rounded font-bold text-xs transition-all ${ans?.text === 'C' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                                                >C</button>
                                                <button 
                                                    onClick={() => handleAnswerChange(idx, 'text', 'NC')}
                                                    className={`px-3 py-1.5 rounded font-bold text-xs transition-all ${ans?.text === 'NC' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                                                >NC</button>
                                                <button 
                                                    onClick={() => handleAnswerChange(idx, 'text', 'N/A')}
                                                    className={`px-3 py-1.5 rounded font-bold text-xs transition-all ${ans?.text === 'N/A' ? 'bg-slate-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                                                >N/A</button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-start gap-4">
                                            <h4 className="font-bold text-slate-800 text-sm leading-relaxed">{displayText}</h4>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {requiresPhoto && (
                                                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Adjuntar foto">
                                                        <Camera size={18} />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => {
                                                        handleAnswerChange(idx, 'text', '');
                                                        handleAnswerChange(idx, 'isConforme', null);
                                                    }} 
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                                                    title="Borrar respuesta"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        {requiresConforme ? (
                                            <div className="grid grid-cols-2 gap-3">
                                                <button 
                                                    onClick={() => handleAnswerChange(idx, 'isConforme', true)}
                                                    className={`p-3 rounded-lg border-2 font-bold flex items-center justify-center gap-2 transition-all ${ans?.isConforme === true ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                                >
                                                    <CheckCircle size={18} /> CONFORME
                                                </button>
                                                <button 
                                                    onClick={() => handleAnswerChange(idx, 'isConforme', false)}
                                                    className={`p-3 rounded-lg border-2 font-bold flex items-center justify-center gap-2 transition-all ${ans?.isConforme === false ? 'bg-red-50 border-red-500 text-red-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                                >
                                                    <AlertCircle size={18} /> NO CONFORME
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="relative flex flex-col gap-2">
                                                {(item.text.toLowerCase().includes('observaciones') || item.text.toLowerCase().includes('comentario')) && badItems.length > 0 && (
                                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                                        <h5 className="font-bold text-red-800 text-xs mb-2">HALLAZGOS REGISTRADOS:</h5>
                                                        <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                                                            {badItems.map((b, i) => (
                                                                <li key={i}><strong>{b.text}</strong> ({b.val})</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                <div className="relative">
                                                    <textarea 
                                                        value={ans?.text || ''}
                                                        onChange={(e) => handleAnswerChange(idx, 'text', e.target.value)}
                                                        placeholder="Escribe o dicta tu respuesta..."
                                                        className={`w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pr-12 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y ${(item.text.toLowerCase().includes('observaciones') || item.text.toLowerCase().includes('comentario')) ? 'min-h-[100px]' : 'min-h-[48px] h-[48px]'}`}
                                                    />
                                                    <button 
                                                        onClick={() => toggleVoiceRecording(idx)}
                                                        className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors ${isRecording === idx ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 text-slate-600 hover:bg-blue-100 hover:text-blue-600'}`}
                                                        title="Dictar por voz"
                                                    >
                                                        {isRecording === idx ? <MicOff size={16} /> : <Mic size={16} />}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        { (item.text.toLowerCase().includes('responsable') || (item.text.toLowerCase().includes('cargo') && !template.some(i => i.text.toLowerCase().includes('inspector')))) && (
                                            <div className="mt-4 pt-4 border-t border-slate-200">
                                                <h5 className="font-bold text-slate-700 text-sm mb-2">Firma Digital:</h5>
                                                <SignaturePad onSave={(data) => handleAnswerChange(idx, 'signature', data)} />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* FOTOGRAFÍAS DE HALLAZGOS */}
            <div className="bg-white border-t-4 border-blue-400 shadow-sm rounded-xl p-5 flex flex-col gap-4 mb-6">
                <h3 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2"><Camera size={18} className="text-blue-500" /> Evidencia Fotográfica de Hallazgos</h3>
                
                {badItems.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No hay hallazgos que requieran fotografía.</p>
                ) : (
                    <div className="space-y-6">
                        {badItems.map((b, bIdx) => (
                            <div key={bIdx} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-bold text-slate-700 text-sm">{b.text} <span className="text-xs bg-white border border-slate-300 px-1.5 py-0.5 rounded ml-2">({b.val})</span></h4>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {(fotosDefectos[b.text] || []).map((foto, idx) => (
                                        <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-300 group">
                                            <img src={foto} alt={"Foto " + b.text} className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => removePhotoDefecto(b.text, idx)}
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
                                            onChange={(e) => handlePhotoUploadDefecto(b.text, e)} 
                                            className="hidden" 
                                        />
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-transform active:scale-95">
                <Save size={20} /> Guardar Inspección Final
            </button>
        </div>
    );
}
