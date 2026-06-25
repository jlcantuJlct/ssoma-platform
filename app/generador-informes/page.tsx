"use client";

import React, { useState, useRef, useCallback } from 'react';
import {
    Upload, FileText, Image as ImageIcon, Download, Trash2,
    Sparkles, CheckCircle, AlertCircle, Eye, X, Loader2,
    Info, FilePlus, ChevronRight, Package, Search, Filter, MapPin, FileCheck, RefreshCw
} from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface DetectedTag {
    name: string;
    type: 'text' | 'image';
    label: string;
    value?: string;
    file?: File;
    preview?: string;
    remoteUrl?: string;
    loading?: boolean;
}

interface ProcessingStatus {
    stage: 'idle' | 'loading' | 'reading' | 'ready' | 'generating' | 'done' | 'error';
    message: string;
    progress?: number; // 0-100
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function humanizeTag(tag: string): string {
    return tag
        .replace(/[_%]/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Componente Principal ────────────────────────────────────────────────────

// ─── Utilidad para comprimir imágenes antes de subir ─────────────────────────
const compressImage = (file) => {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            resolve(file);
            return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target?.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;
                let width = img.width;
                let height = img.height;
                
                if (width > height && width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                } else if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(blob => {
                    if (blob) {
                        resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' }));
                    } else reject(new Error('Canvas toBlob failed'));
                }, 'image/jpeg', 0.7);
            };
        };
        reader.onerror = error => reject(error);
    });
};

export default function GeneradorInformesPage() {
    const [templateFile, setTemplateFile] = useState<File | null>(null);
    const [tags, setTags] = useState<DetectedTag[]>([]);
    const [status, setStatus] = useState<ProcessingStatus>({ stage: 'idle', message: '', progress: 0 });
    const [isDraggingTemplate, setIsDraggingTemplate] = useState(false);
    const [dragOverTag, setDragOverTag] = useState<string | null>(null);
    // --- Autoguardado Colaborativo ---
    const loadDraft = useCallback(async (docType: string, currentTags: DetectedTag[]) => {
        try {
            const res = await fetch(`/api/draft?docType=${docType}`);
            if (res.ok) {
                const { fields } = await res.json();
                if (fields && Object.keys(fields).length > 0) {
                    setTags(prev => prev.map(t => {
                        if (fields[t.name]) {
                            if (t.type === 'text') return { ...t, value: fields[t.name] };
                            if (t.type === 'image') return { ...t, remoteUrl: fields[t.name], preview: fields[t.name] };
                        }
                        return t;
                    }));
                }
            }
        } catch (e) {
            console.error('Error loading draft', e);
        }
    }, []);

    const saveDraftTimeout = useRef<NodeJS.Timeout | null>(null);
    React.useEffect(() => {
        if (!templateFile || tags.length === 0) return;
        if (saveDraftTimeout.current) clearTimeout(saveDraftTimeout.current);
        
        saveDraftTimeout.current = setTimeout(async () => {
            const docType = templateFile.name;
            const fields: Record<string, string> = {};
            tags.forEach(t => {
                if (t.type === 'text' && t.value) fields[t.name] = t.value;
                if (t.type === 'image' && t.remoteUrl) fields[t.name] = t.remoteUrl;
            });
            
            if (Object.keys(fields).length > 0) {
                await fetch('/api/draft', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ docType, fields })
                });
            }
        }, 2000);
    }, [tags, templateFile]);

    
    // Polling background sync
    React.useEffect(() => {
        if (!templateFile || tags.length === 0) return;
        const interval = setInterval(() => {
            const docType = templateFile.name;
            fetch(`/api/draft?docType=${docType}`).then(r => r.json()).then(data => {
                if (data.fields) {
                    setTags(prev => prev.map(t => {
                        if (data.fields[t.name]) {
                            if (t.type === 'image' && t.remoteUrl !== data.fields[t.name]) {
                                return { ...t, remoteUrl: data.fields[t.name], preview: data.fields[t.name] };
                            }
                            if (t.type === 'text' && t.value !== data.fields[t.name]) {
                                // Only overwrite text if the local field is empty to avoid overwriting typing
                                if (!t.value) {
                                    return { ...t, value: data.fields[t.name] };
                                }
                            }
                        }
                        return t;
                    }));
                }
            }).catch(() => {});
        }, 5000); // 5 seconds for snappy sync
        return () => clearInterval(interval);
    }, [templateFile, tags.length]);


    const templateInputRef = useRef<HTMLInputElement>(null);

    // ─── Leer la plantilla y detectar etiquetas ──────────────────────────────
    const readTemplate = useCallback(async (file: File) => {
        setTemplateFile(file);
        setTags([]);
        setStatus({ stage: 'reading', message: '📂 Leyendo archivo…', progress: 10 });

        try {
            await new Promise(r => setTimeout(r, 300)); // pequeña pausa para mostrar el mensaje
            setStatus({ stage: 'reading', message: '🔍 Analizando estructura del documento…', progress: 35 });

            const formData = new FormData();
            formData.append('template', file);

            setStatus({ stage: 'reading', message: '🏷️ Detectando etiquetas {campo} y {%foto}…', progress: 60 });

            const res = await fetch('/api/generar-docx/detect-tags', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'No se pudieron detectar las etiquetas.');
            }

            setStatus({ stage: 'reading', message: '⚙️ Construyendo formulario…', progress: 85 });
            const { textTags, imageTags } = await res.json();

            const detected: DetectedTag[] = [
                ...textTags.map((t: string) => ({
                    name: t,
                    type: 'text' as const,
                    label: humanizeTag(t),
                    value: '',
                })),
                ...imageTags.map((t: string) => ({
                    name: t,
                    type: 'image' as const,
                    label: humanizeTag(t.replace('%', '')),
                })),
            ];

            if (detected.length === 0) {
                setStatus({ stage: 'error', message: 'No se encontraron etiquetas. Asegúrate de subir el archivo PLANTILLA (con etiquetas), no el Word original.', progress: 0 });
                return;
            }

            setTags(detected);
            loadDraft('PAD_SAN_CLEMENTE_INTERNAL.docx', detected);
            setStatus({ stage: 'ready', message: `✅ Plantilla lista — ${detected.length} campos detectados (${textTags.length} texto, ${imageTags.length} fotos)`, progress: 100 });

        } catch (e: any) {
            setStatus({ stage: 'error', message: `❌ Error: ${e.message}`, progress: 0 });
        }
    }, []);

    // ─── Cargar plantilla San Clemente automáticamente desde el servidor ────
    const loadSanClemente = useCallback(async () => {
        // En lugar de descargar 137MB al navegador y colapsar la memoria (Aw, Snap),
        // configuramos las etiquetas directamente ya que conocemos la estructura exacta de la plantilla.
        setStatus({ stage: 'loading', message: '⬇️ Cargando plantilla PAD San Clemente…', progress: 20 });
        setTags([]);
        
        // Creamos un archivo ficticio como bandera para que el generador sepa que debe usar el archivo local
        setTemplateFile(new File(["dummy"], "PAD_SAN_CLEMENTE_INTERNAL.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }));
        
        const detected: DetectedTag[] = [
            { name: 'mes_anio', type: 'text', label: 'Mes Anio', value: '' }
        ];
        
        // San Clemente: 259 slots reales (con ignored map 1-14, 72 y nuevo motor multi-embed)
        for (let i = 1; i <= 259; i++) {
            
            detected.push({
                name: `foto_${String(i).padStart(3, '0')}`,
                type: 'image',
                label: `Foto ${String(i).padStart(3, '0')}`
            });
        }
        
        setTimeout(() => {
            setTags(detected);
            setStatus({ stage: 'ready', message: `✅ Plantilla lista — ${detected.length} campos detectados (1 texto, ${detected.length - 1} fotos)`, progress: 100 });
        }, 300); // Pequeño delay visual para que el usuario perciba la acción
    }, []);

    // ─── Cargar plantilla Chinchaysullo automáticamente desde el servidor ────
    const loadChinchaysullo = useCallback(async () => {
        setStatus({ stage: 'loading', message: '⬇️ Cargando plantilla PAD Chinchaysullo…', progress: 20 });
        setTags([]);
        
        setTemplateFile(new File(["dummy"], "PAD_CHINCHAYSULLO_INTERNAL.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }));
        
        const detected: DetectedTag[] = [
            { name: 'mes_anio', type: 'text', label: 'Mes Anio', value: '' }
        ];
        
        // Chinchaysullo: 271 slots reales (291 párrafos - 24 ignorados + 4 imágenes extra en párrafos multi-embed)
        for (let i = 1; i <= 271; i++) {
            detected.push({
                name: `foto_${String(i).padStart(3, '0')}`,
                type: 'image',
                label: `Foto ${String(i).padStart(3, '0')}`
            });
        }
        
        setTimeout(() => {
            setTags(detected);
            setStatus({ stage: 'ready', message: `✅ Plantilla lista — ${detected.length} campos detectados (1 texto, ${detected.length - 1} fotos)`, progress: 100 });
        }, 300);
    }, []);

    // ─── Cargar plantilla Jahuay automáticamente desde el servidor ───────────
    const loadJahuay = useCallback(async () => {
        setStatus({ stage: 'loading', message: '⬇️ Cargando plantilla PAD Peaje Jahuay…', progress: 20 });
        setTags([]);
        
        setTemplateFile(new File(["dummy"], "PAD_JAHUAY_INTERNAL.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }));
        
        const detected: DetectedTag[] = [
            { name: 'mes_anio', type: 'text', label: 'Mes Anio', value: '' }
        ];
        
        // Jahuay: 67 slots reales (45 párrafos - 2 ignorados + 24 imágenes extra en párrafos multi-embed)
        for (let i = 1; i <= 67; i++) {
            detected.push({
                name: `foto_${String(i).padStart(3, '0')}`,
                type: 'image',
                label: `Foto ${String(i).padStart(3, '0')}`
            });
        }
        
        setTimeout(() => {
            setTags(detected);
            setStatus({ stage: 'ready', message: `✅ Plantilla lista — ${detected.length} campos detectados (1 texto, ${detected.length - 1} fotos)`, progress: 100 });
        }, 300);
    }, []);

    // ─── Cargar plantilla Barandas automáticamente desde el servidor ─────────
    const loadBarandas = useCallback(async () => {
        setStatus({ stage: 'loading', message: '⬇️ Cargando plantilla MP Barandas…', progress: 20 });
        setTags([]);
        
        setTemplateFile(new File(["dummy"], "PAD_BARANDAS_INTERNAL.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }));
        
        const detected: DetectedTag[] = [
            { name: 'mes_anio', type: 'text', label: 'Mes Anio', value: '' }
        ];
        
        // Las fotos en Barandas van de foto_001 a foto_070
        for (let i = 1; i <= 70; i++) {
            detected.push({
                name: `foto_${String(i).padStart(3, '0')}`,
                type: 'image',
                label: `Foto ${String(i).padStart(3, '0')}`
            });
        }
        
        setTimeout(() => {
            setTags(detected);
            setStatus({ stage: 'ready', message: `✅ Plantilla lista — ${detected.length} campos detectados (1 texto, ${detected.length - 1} fotos)`, progress: 100 });
        }, 300);
    }, []);

    // ─── Drop de plantilla ───────────────────────────────────────────────────
    const handleTemplateDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingTemplate(false);
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.docx')) {
            readTemplate(file);
        } else {
            setStatus({ stage: 'error', message: 'Solo se aceptan archivos .docx' });
        }
    };

    // ─── Drop de imagen en un campo específico ───────────────────────────────
    const handleImageDrop = (e: React.DragEvent, tagName: string) => {
        e.preventDefault();
        setDragOverTag(null);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            assignImage(tagName, file);
        }
    };

    const assignImage = async (tagName: string, file: File) => {
        const preview = URL.createObjectURL(file);
        setTags(prev => prev.map(t =>
            t.name === tagName ? { ...t, file, preview, loading: true } : t
        ));

        try {
            const ext = file.name.split('.').pop();
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch(`/api/draft/image?filename=${tagName}_${Date.now()}.${ext}`, {
                method: 'POST',
                body: file
            });
            if (res.ok) {
                const blob = await res.json();
                setTags(prev => prev.map(t =>
                    t.name === tagName ? { ...t, remoteUrl: blob.url, loading: false } : t
                ));
            } else {
                setTags(prev => prev.map(t => t.name === tagName ? { ...t, loading: false } : t));
            }
        } catch (e) {
            setTags(prev => prev.map(t => t.name === tagName ? { ...t, loading: false } : t));
        }
    };

    const updateTextValue = (tagName: string, value: string) => {
        setTags(prev => prev.map(t =>
            t.name === tagName ? { ...t, value } : t
        ));
    };

    const clearTag = (tagName: string) => {
        setTags(prev => prev.map(t =>
            t.name === tagName ? { ...t, file: undefined, preview: undefined, value: '' } : t
        ));
    };

    // ─── Generar el documento ─────────────────────────────────────────────────

    const handleClearDraft = async () => {
        const p = prompt("Clave para borrar:");
        if (p !== "161976") { alert("Clave incorrecta"); return; }

        if (!templateFile) return;
        const confirmClear = window.confirm('¿Estás seguro de que quieres limpiar todo el borrador para iniciar un nuevo mes? Esto no se puede deshacer.');
        if (!confirmClear) return;
        
        const docType = templateFile.name;
        setStatus({ stage: 'loading', message: '🧹 Limpiando borrador...', progress: 50 });
        try {
            await fetch(`/api/draft?docType=${docType}`, { method: 'DELETE' });
            
            // Reload clean template
            if (docType === 'PAD_SAN_CLEMENTE_INTERNAL.docx') {
                loadSanClemente();
            } else if (docType === 'PAD_CHINCHAYSULLO_INTERNAL.docx') {
                loadChinchaysullo();
            } else if (docType === 'PAD_JAHUAY_INTERNAL.docx') {
                loadJahuay();
            } else if (docType === 'PAD_BARANDAS_INTERNAL.docx') {
                loadBarandas();
            } else {
                setTags([]);
                setStatus({ stage: 'ready', message: 'Borrador limpiado. Puedes cargar una nueva plantilla.', progress: 100 });
            }
        } catch (e) {
            setStatus({ stage: 'error', message: 'Error al limpiar borrador', progress: 0 });
        }
    };

    const handleGenerate = async () => {
        if (!templateFile) return;
        setStatus({ stage: 'generating', message: '📸 Preparando imágenes…', progress: 20 });
        await new Promise(r => setTimeout(r, 300));
        setStatus({ stage: 'generating', message: '📝 Inyectando datos en la plantilla…', progress: 50 });

        try {
            const formData = new FormData();
            formData.append('template', templateFile);

            // Agregar textos como JSON
            const textData: Record<string, string> = {};
            tags.filter(t => t.type === 'text').forEach(t => {
                textData[t.name] = t.value || '';
            });
            formData.append('textData', JSON.stringify(textData));

            // Agregar imágenes
            tags.filter(t => t.type === 'image' && (t.file || t.remoteUrl)).forEach(t => {
                if (t.remoteUrl) {
                    formData.append(`img_${t.name}`, t.remoteUrl);
                } else if (t.file) {
                    formData.append(`img_${t.name}`, t.file!);
                }
            });

            const res = await fetch('/api/generar-docx', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Error al generar el documento.');
            }

            // Descargar el archivo
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Informe_SSOMA_${new Date().toISOString().split('T')[0]}.docx`;
            a.click();
            URL.revokeObjectURL(url);

            setStatus({ stage: 'done', message: '✅ ¡Informe generado y descargado correctamente!', progress: 100 });
        } catch (e: any) {
            setStatus({ stage: 'error', message: `Error: ${e.message}` });
        }
    };

    // ─── Reset ───────────────────────────────────────────────────────────────
    const handleReset = () => {
        setTemplateFile(null);
        setTags([]);
        setStatus({ stage: 'idle', message: '' });
        if (templateInputRef.current) templateInputRef.current.value = '';
    };

    const imageTags = tags.filter(t => t.type === 'image');
    const textTags = tags.filter(t => t.type === 'text');
    const isReadyToGenerate = status.stage === 'ready' || status.stage === 'done' || status.stage === 'error';
    const filledImages = imageTags.filter(t => t.file).length;
    const filledTexts = textTags.filter(t => t.value).length;

    return (
        <div className="min-h-screen p-6" style={{ background: 'hsl(222, 47%, 4%)' }}>
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="w-full max-w-[2000px] mx-auto mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div style={{
                        background: 'linear-gradient(135deg, hsl(161,94%,30%), hsl(180,80%,35%))',
                        borderRadius: '12px', padding: '10px'
                    }}>
                        <FileText className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Generador de Informes Word</h1>
                        <p className="text-sm" style={{ color: 'hsl(215,20%,65%)' }}>
                            Sube tu plantilla .docx, completa los campos y descarga el informe con las fotos insertadas automáticamente.
                        </p>
                    </div>
                </div>

                {/* Tip info — Instrucciones claras en pasos */}
                <div className="mt-4 rounded-xl p-4" style={{
                    background: 'hsl(222,47%,8%)', border: '1px solid hsl(161,94%,25%)'
                }}>
                    <p className="text-sm font-bold mb-3" style={{ color: 'hsl(161,94%,55%)' }}>
                        🪄 ¿Cómo usar esta herramienta?
                    </p>
                    <div className="space-y-2">
                        {[
                            { step: '1', text: 'Descarga la plantilla con etiquetas ya insertadas (el archivo PLANTILLA que generó el sistema).', highlight: true },
                            { step: '2', text: 'Sube ese archivo .docx aquí. La herramienta detectará automáticamente todos los campos de texto y foto.' },
                            { step: '3', text: 'Escribe el mes/año en el campo de texto y arrastra las fotos a cada zona correspondiente.' },
                            { step: '4', text: 'Haz clic en "Generar y Descargar" para obtener el informe Word completo.' },
                        ].map(item => (
                            <div key={item.step} className="flex items-start gap-3">
                                <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black mt-0.5"
                                    style={{ background: item.highlight ? 'hsl(161,94%,30%)' : 'hsl(222,47%,20%)', color: 'white' }}>
                                    {item.step}
                                </span>
                                <p className="text-sm" style={{ color: item.highlight ? 'hsl(215,20%,85%)' : 'hsl(215,20%,65%)' }}>
                                    {item.text}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 pt-3 flex flex-wrap gap-2" style={{ borderTop: '1px solid hsl(222,47%,15%)' }}>
                        <a
                            href="/api/generar-docx/plantilla-ejemplo"
                            download
                            className="text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1"
                            style={{ background: 'hsl(161,94%,15%)', color: 'hsl(161,94%,55%)', border: '1px solid hsl(161,94%,25%)' }}
                        >
                            ⬇ Plantilla genérica
                        </a>
                        <button
                            onClick={loadSanClemente}
                            disabled={status.stage === 'loading' || status.stage === 'reading'}
                            className="text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1"
                            style={{
                                background: 'linear-gradient(135deg, hsl(210,80%,20%), hsl(210,80%,15%))',
                                color: 'hsl(210,80%,75%)',
                                border: '1px solid hsl(210,80%,35%)',
                                cursor: (status.stage === 'loading' || status.stage === 'reading') ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {(status.stage === 'loading' || status.stage === 'reading') ? '⏳ Cargando…' : '⚡ Cargar PAD San Clemente'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-[2000px] mx-auto grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-6">

                {/* ── Columna Izquierda: Carga de Plantilla ────────────── */}
                <div className="lg:col-span-1 space-y-4">

                    {/* Botón rápido PAD San Clemente */}
                    <button
                        onClick={loadSanClemente}
                        disabled={status.stage === 'loading' || status.stage === 'reading'}
                        className="w-full rounded-2xl p-4 text-left transition-all duration-200 flex items-center gap-3"
                        style={{
                            background: 'linear-gradient(135deg, hsl(210,80%,12%), hsl(222,60%,10%))',
                            border: '1px solid hsl(210,80%,30%)',
                            cursor: (status.stage === 'loading' || status.stage === 'reading') ? 'not-allowed' : 'pointer',
                            opacity: (status.stage === 'loading' || status.stage === 'reading') ? 0.7 : 1,
                        }}
                    >
                        <div style={{ background: 'hsl(210,80%,20%)', borderRadius: '10px', padding: '10px', flexShrink: 0 }}>
                            {(status.stage === 'loading' || status.stage === 'reading')
                                ? <Loader2 size={20} style={{ color: 'hsl(210,80%,65%)' }} className="animate-spin" />
                                : <FileText size={20} style={{ color: 'hsl(210,80%,65%)' }} />
                            }
                        </div>
                        <div>
                            <p className="text-sm font-bold" style={{ color: 'hsl(210,80%,75%)' }}>
                                ⚡ Cargar Plantilla PAD San Clemente
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'hsl(210,60%,50%)' }}>
                                Carga automática — 259 fotos + texto de mes/año
                            </p>
                        </div>
                    </button>

                    <button
                        onClick={loadChinchaysullo}
                        disabled={status.stage === 'generating'}
                        className="w-full rounded-xl p-4 flex items-start gap-4 transition-all duration-200 text-left mb-3"
                        style={{
                            background: 'hsl(280, 50%, 15%)',
                            border: '1px solid hsl(280, 50%, 25%)',
                            opacity: status.stage === 'generating' ? 0.5 : 1
                        }}
                    >
                        <div style={{ background: 'hsl(280, 50%, 20%)', borderRadius: '8px', padding: '10px' }}>
                            {(status.stage === 'loading' || status.stage === 'reading')
                                ? <Loader2 size={20} style={{ color: 'hsl(280, 80%, 75%)' }} className="animate-spin" />
                                : <FileText size={20} style={{ color: 'hsl(280, 80%, 75%)' }} />
                            }
                        </div>
                        <div>
                            <p className="text-sm font-bold" style={{ color: 'hsl(280, 80%, 80%)' }}>
                                ⚡ Cargar Plantilla PAD Chinchaysullo
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'hsl(280, 50%, 65%)' }}>
                                Carga automática — 271 fotos + texto de mes/año
                            </p>
                        </div>
                    </button>

                    <button
                        onClick={loadJahuay}
                        disabled={status.stage === 'generating'}
                        className="w-full rounded-xl p-4 flex items-start gap-4 transition-all duration-200 text-left mb-3"
                        style={{
                            background: 'hsl(30, 80%, 15%)',
                            border: '1px solid hsl(30, 80%, 25%)',
                            opacity: status.stage === 'generating' ? 0.5 : 1
                        }}
                    >
                        <div style={{ background: 'hsl(30, 80%, 20%)', borderRadius: '8px', padding: '10px' }}>
                            {(status.stage === 'loading' || status.stage === 'reading')
                                ? <Loader2 size={20} style={{ color: 'hsl(30, 80%, 70%)' }} className="animate-spin" />
                                : <FileText size={20} style={{ color: 'hsl(30, 80%, 70%)' }} />
                            }
                        </div>
                        <div>
                            <p className="text-sm font-bold" style={{ color: 'hsl(30, 80%, 70%)' }}>
                                ⚡ Cargar Plantilla PAD Peaje Jahuay
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'hsl(30, 80%, 50%)' }}>
                                Carga automática — 67 fotos + texto de mes/año
                            </p>
                        </div>
                    </button>

                    <button
                        onClick={loadBarandas}
                        disabled={status.stage === 'generating'}
                        className="w-full rounded-xl p-4 flex items-start gap-4 transition-all duration-200 text-left mb-6"
                        style={{
                            background: 'hsl(200, 80%, 15%)',
                            border: '1px solid hsl(200, 80%, 25%)',
                            opacity: status.stage === 'generating' ? 0.5 : 1
                        }}
                    >
                        <div style={{ background: 'hsl(200, 80%, 20%)', borderRadius: '8px', padding: '10px' }}>
                            {(status.stage === 'loading' || status.stage === 'reading')
                                ? <Loader2 size={20} style={{ color: 'hsl(200, 80%, 70%)' }} className="animate-spin" />
                                : <FileText size={20} style={{ color: 'hsl(200, 80%, 70%)' }} />
                            }
                        </div>
                        <div>
                            <p className="text-sm font-bold" style={{ color: 'hsl(200, 80%, 70%)' }}>
                                ⚡ Cargar Plantilla MP Barandas
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'hsl(200, 80%, 50%)' }}>
                                Carga automática — 70 fotos + texto de mes/año
                            </p>
                        </div>
                    </button>

                    {/* Barra de progreso — visible mientras carga/detecta/genera */}
                    {(status.stage === 'loading' || status.stage === 'reading' || status.stage === 'generating') && (
                        <div className="rounded-xl p-4" style={{ background: 'hsl(222,47%,8%)', border: '1px solid hsl(222,47%,15%)' }}>
                            <div className="flex items-center gap-2 mb-2">
                                <Loader2 size={14} className="animate-spin" style={{ color: 'hsl(161,94%,45%)' }} />
                                <p className="text-xs font-medium" style={{ color: 'hsl(215,20%,75%)' }}>{status.message}</p>
                            </div>
                            <div className="rounded-full overflow-hidden" style={{ height: '6px', background: 'hsl(222,47%,15%)' }}>
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${status.progress ?? 0}%`,
                                        background: 'linear-gradient(90deg, hsl(161,94%,30%), hsl(180,80%,40%))'
                                    }}
                                />
                            </div>
                            <p className="text-xs mt-1 text-right" style={{ color: 'hsl(215,20%,45%)' }}>{status.progress ?? 0}%</p>
                        </div>
                    )}

                    {/* Drop zone de plantilla */}
                    <div
                        className={`rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${isDraggingTemplate ? 'scale-[1.02]' : ''}`}
                        style={{
                            background: isDraggingTemplate ? 'hsl(161,94%,10%)' : 'hsl(222,47%,8%)',
                            border: `2px dashed ${isDraggingTemplate ? 'hsl(161,94%,45%)' : templateFile ? 'hsl(161,94%,30%)' : 'hsl(222,47%,20%)'}`,
                            transition: 'all 0.2s ease'
                        }}
                        onDragOver={e => { e.preventDefault(); setIsDraggingTemplate(true); }}
                        onDragLeave={() => setIsDraggingTemplate(false)}
                        onDrop={handleTemplateDrop}
                        onClick={() => !templateFile && templateInputRef.current?.click()}
                    >
                        <input
                            ref={templateInputRef}
                            type="file"
                            accept=".docx"
                            className="hidden"
                            onChange={e => {
                                const f = e.target.files?.[0];
                                if (f) readTemplate(f);
                            }}
                        />
                        {templateFile ? (
                            <div>
                                <div className="flex items-center justify-center mb-3">
                                    <div style={{ background: 'hsl(161,94%,15%)', borderRadius: '50%', padding: '12px' }}>
                                        <FileText size={28} style={{ color: 'hsl(161,94%,45%)' }} />
                                    </div>
                                </div>
                                <p className="font-semibold text-white text-sm truncate">{templateFile.name}</p>
                                <p className="text-xs mt-1" style={{ color: 'hsl(215,20%,55%)' }}>
                                    {(templateFile.size / 1024).toFixed(1)} KB
                                </p>
                                <button
                                    onClick={e => { e.stopPropagation(); handleReset(); }}
                                    className="mt-3 text-xs px-3 py-1 rounded-lg transition-colors"
                                    style={{ background: 'hsl(222,47%,15%)', color: 'hsl(215,20%,65%)' }}
                                >
                                    Cambiar plantilla
                                </button>
                            </div>
                        ) : (
                            <div>
                                <Upload size={32} style={{ color: 'hsl(215,20%,45%)' }} className="mx-auto mb-3" />
                                <p className="font-medium text-white text-sm">Arrastra tu plantilla .docx</p>
                                <p className="text-xs mt-1" style={{ color: 'hsl(215,20%,55%)' }}>o haz clic para buscarla</p>
                            </div>
                        )}
                    </div>

                    {/* Estado */}
                    {status.stage !== 'idle' && (
                        <div className={`rounded-xl p-3 flex items-start gap-2 text-sm`} style={{
                            background: status.stage === 'error' ? 'hsl(0,84%,10%)' :
                                status.stage === 'done' ? 'hsl(161,94%,8%)' : 'hsl(222,47%,10%)',
                            border: `1px solid ${status.stage === 'error' ? 'hsl(0,84%,30%)' :
                                status.stage === 'done' ? 'hsl(161,94%,25%)' : 'hsl(222,47%,20%)'}`,
                            color: status.stage === 'error' ? 'hsl(0,84%,70%)' :
                                status.stage === 'done' ? 'hsl(161,94%,55%)' : 'hsl(215,20%,70%)'
                        }}>
                            {status.stage === 'reading' || status.stage === 'generating' ? (
                                <Loader2 size={14} className="animate-spin mt-0.5 flex-shrink-0" />
                            ) : status.stage === 'error' ? (
                                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                            ) : (
                                <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
                            )}
                            <span>{status.message}</span>
                        </div>
                    )}

                    {/* Resumen de campos */}
                    {tags.length > 0 && (
                        <div className="rounded-xl p-4 space-y-2" style={{ background: 'hsl(222,47%,8%)', border: '1px solid hsl(222,47%,15%)' }}>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'hsl(215,20%,55%)' }}>Resumen</p>
                            <div className="flex items-center justify-between">
                                <span className="text-sm" style={{ color: 'hsl(215,20%,70%)' }}>📝 Campos de texto</span>
                                <span className="text-sm font-bold text-white">{filledTexts}/{textTags.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm" style={{ color: 'hsl(215,20%,70%)' }}>🖼️ Campos de imagen</span>
                                <span className="text-sm font-bold text-white">{filledImages}/{imageTags.length}</span>
                            </div>
                        </div>
                    )}

                    {/* Botón generar */}
                    {isReadyToGenerate && tags.length > 0 && (
                        <>
                        <button
                            onClick={handleGenerate}
                            disabled={status.stage === 'generating'}
                            className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-60"
                            style={{
                                background: status.stage === 'generating'
                                    ? 'hsl(161,94%,20%)'
                                    : 'linear-gradient(135deg, hsl(161,94%,28%), hsl(180,80%,32%))',
                                boxShadow: '0 4px 20px hsl(161,94%,20%)'
                            }}
                        >
                            
                            {status.stage === 'generating' ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Generando...
                                </>
                            ) : (
                                <>
                                    <FileCheck size={20} />
                                    Generar Documento
                                </>
                            )}
                        </button>
                        
                        <button
                            onClick={handleClearDraft}
                            disabled={status.stage === 'generating'}
                            className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-60 mt-4"
                            style={{
                                background: 'hsl(348,83%,25%)',
                                border: '1px solid hsl(348,83%,35%)'
                            }}
                        >
                            <Trash2 size={20} />
                            Empezar Nuevo Mes (Limpiar Todo)
                        </button>
                        </>
                    )}

                    {/* Botón descargar plantilla ejemplo */}
                    <a
                        href="/api/generar-docx/plantilla-ejemplo"
                        download
                        className="w-full py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-80 text-sm"
                        style={{ background: 'hsl(222,47%,12%)', color: 'hsl(215,20%,70%)', border: '1px solid hsl(222,47%,20%)' }}
                    >
                        <FilePlus size={16} />
                        Descargar Plantilla de Ejemplo
                    </a>
                </div>

                {/* ── Columna Derecha: Formulario ────────────────────────── */}
                <div className="lg:col-span-3 xl:col-span-4 space-y-6">
                    {tags.length === 0 ? (
                        <div className="rounded-2xl p-12 flex flex-col items-center justify-center h-full text-center" style={{
                            background: 'hsl(222,47%,7%)', border: '1px solid hsl(222,47%,13%)',
                            minHeight: '400px'
                        }}>
                            <Package size={48} style={{ color: 'hsl(222,47%,25%)' }} className="mb-4" />
                            <p className="font-semibold" style={{ color: 'hsl(215,20%,45%)' }}>Tu formulario aparecerá aquí</p>
                            <p className="text-sm mt-2" style={{ color: 'hsl(215,20%,35%)' }}>
                                Sube una plantilla .docx para comenzar
                            </p>
                            <div className="mt-6 flex items-center gap-2 text-xs" style={{ color: 'hsl(215,20%,35%)' }}>
                                <span className="px-2 py-1 rounded" style={{ background: 'hsl(222,47%,12%)' }}>Paso 1: Sube plantilla</span>
                                <ChevronRight size={12} />
                                <span className="px-2 py-1 rounded" style={{ background: 'hsl(222,47%,12%)' }}>Paso 2: Completa campos</span>
                                <ChevronRight size={12} />
                                <span className="px-2 py-1 rounded" style={{ background: 'hsl(222,47%,12%)' }}>Paso 3: Genera Word</span>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">

                            {/* ── Encabezado Plantilla Activa ─────────────────────────── */}
                            <div className="rounded-2xl p-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, hsl(222,47%,10%), hsl(222,47%,6%))', border: '1px solid hsl(222,47%,15%)' }}>
                                <div>
                                    <h2 className="font-bold text-lg text-white flex items-center gap-2">
                                        <FileText size={20} style={{ color: 'hsl(161,94%,55%)' }} />
                                        Editando: {templateFile?.name?.replace(/_PLANTILLA\.docx| ultimo\.docx| Mayo \.docx|\.docx/gi, '').replace(/_/g, ' ') || 'Plantilla Personalizada'}
                                    </h2>
                                    <p className="text-sm mt-1" style={{ color: 'hsl(215,20%,60%)' }}>
                                        Completa los campos y verifica el formulario antes de generar el documento final.
                                    </p>
                                </div>
                            </div>

                            {/* ── Campos de texto ─────────────────────────── */}
                            {textTags.length > 0 && (
                                <div className="rounded-2xl overflow-hidden" style={{ background: 'hsl(222,47%,8%)', border: '1px solid hsl(222,47%,15%)' }}>
                                    <div className="px-5 py-4 border-b" style={{ borderColor: 'hsl(222,47%,12%)' }}>
                                        <h2 className="font-semibold text-white flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                                                style={{ background: 'hsl(161,94%,15%)', color: 'hsl(161,94%,55%)' }}>T</span>
                                            Campos de Texto
                                        </h2>
                                    </div>
                                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {textTags.map(tag => (
                                            <div key={tag.name}>
                                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'hsl(215,20%,60%)' }}>
                                                    <code className="px-1 py-0.5 rounded text-xs mr-1"
                                                        style={{ background: 'hsl(222,47%,15%)', color: '#6ee7b7' }}>
                                                        {`{${tag.name}}`}
                                                    </code>
                                                    {tag.label}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={tag.value || ''}
                                                    onChange={e => updateTextValue(tag.name, e.target.value)}
                                                    placeholder={`Escribe ${tag.label.toLowerCase()}…`}
                                                    className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none transition-colors"
                                                    style={{
                                                        background: 'hsl(222,47%,12%)',
                                                        border: tag.value ? '1px solid hsl(161,94%,30%)' : '1px solid hsl(222,47%,18%)',
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Campos de imagen ────────────────────────── */}
                            {imageTags.length > 0 && (
                                <div className="rounded-2xl overflow-hidden" style={{ background: 'hsl(222,47%,8%)', border: '1px solid hsl(222,47%,15%)' }}>
                                    <div className="px-5 py-4 border-b" style={{ borderColor: 'hsl(222,47%,12%)' }}>
                                        <h2 className="font-semibold text-white flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                                                style={{ background: 'hsl(210,80%,15%)', color: 'hsl(210,80%,60%)' }}>
                                                <ImageIcon size={12} />
                                            </span>
                                            Campos de Imagen
                                        </h2>
                                        <p className="text-xs mt-1" style={{ color: 'hsl(215,20%,50%)' }}>
                                            Arrastra o haz clic para subir cada fotografía
                                        </p>
                                    </div>
                                    <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                                        {imageTags.map(tag => (
                                            <ImageDropZone
                                                key={tag.name}
                                                tag={tag}
                                                docType={(templateFile?.name || '').includes('CHINCHAYSULLO') ? 'chincha' : (templateFile?.name || '').includes('JAHUAY') ? 'jahuay' : (templateFile?.name || '').includes('BARANDAS') ? 'barandas' : 'pad'}
                                                isDragOver={dragOverTag === tag.name}
                                                onDragOver={e => { e.preventDefault(); setDragOverTag(tag.name); }}
                                                onDragLeave={() => setDragOverTag(null)}
                                                onDrop={e => handleImageDrop(e, tag.name)}
                                                onFileChange={f => assignImage(tag.name, f)}
                                                onClear={() => clearTag(tag.name)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Mapeo docType → carpeta estática en CDN ────────────────────────────────
const FOLDER_BY_DOC: Record<string, string> = {
    pad:      'referencias_pad',
    chincha:  'referencias_chincha',
    jahuay:   'referencias_jahuay',
    barandas: 'referencias_barandas',
};
// Extensiones a intentar en orden (sin pasar por la API)
const EXTS = ['png', 'jpg', 'jpeg'];

// Hook: resuelve la primera URL estática que existe para esta imagen.
// Resultado cacheado en sessionStorage para que no vuelva a intentar en la misma sesión.
function useRefSrc(tagName: string, docType: string): string {
    const [src, setSrc] = React.useState<string>('');

    React.useEffect(() => {
        if (src) return; // ya resuelta (sessionStorage o estado previo)
        const folder = FOLDER_BY_DOC[docType] ?? 'referencias_pad';
        let cancelled = false;
        (async () => {
            for (const ext of EXTS) {
                const url = `/${folder}/${tagName}.${ext}?v=2`;
                try {
                    const r = await fetch(url, { method: 'HEAD' });
                    if (!cancelled && r.ok) {
                        
                        setSrc(url);
                        return;
                    }
                } catch { /* ignorar */ }
            }
        })();
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tagName, docType]);

    return src;
}

// ─── Sub-componente: zona de imagen ──────────────────────────────────────────
function ImageDropZone({
    tag, docType, isDragOver, onDragOver, onDragLeave, onDrop, onFileChange, onClear
}: {
    tag: DetectedTag;
    docType: 'chincha' | 'pad' | 'jahuay' | 'barandas';
    isDragOver: boolean;
    onDragOver: React.DragEventHandler;
    onDragLeave: React.DragEventHandler;
    onDrop: React.DragEventHandler;
    onFileChange: (f: File) => void;
    onClear: () => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [showPreview, setShowPreview] = useState(false);
    const refSrc = useRefSrc(tag.name, docType);

    return (
        <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'hsl(215,20%,60%)' }}>
                <code className="px-1 py-0.5 rounded text-xs mr-1"
                    style={{ background: 'hsl(222,47%,15%)', color: '#93c5fd' }}>
                    {`{%${tag.name}}`}
                </code>
                {tag.label}
            </label>
            <div
                className="relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
                style={{
                    aspectRatio: '4/3',
                    background: isDragOver ? 'hsl(210,80%,12%)' : tag.preview ? 'black' : 'hsl(222,47%,11%)',
                    border: `2px dashed ${isDragOver ? 'hsl(210,80%,55%)' : tag.preview ? 'hsl(161,94%,30%)' : 'hsl(222,47%,22%)'}`,
                    transition: 'all 0.2s ease'
                }}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => !tag.preview && inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) onFileChange(f);
                    }}
                />

                {tag.preview ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={tag.preview}
                            alt={tag.label}
                            className={`w-full h-full object-cover transition-all ${tag.loading ? 'opacity-40 grayscale blur-sm' : ''}`}
                        />
                        {tag.loading && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            </div>
                        )}
                        {/* Overlay botones siempre parcialmente visible o visible al hover */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                            <div className="flex gap-2">
                                <button
                                    onClick={e => { e.stopPropagation(); setShowPreview(true); }}
                                    className="px-3 py-2 rounded-lg bg-white/20 hover:bg-white/40 transition flex items-center justify-center"
                                    title="Ver foto"
                                >
                                    <Eye size={16} className="text-white" /> <span className="text-white text-xs font-medium ml-1">Ver</span>
                                </button>
                                <button
                                    onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
                                    className="px-3 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 transition flex items-center justify-center"
                                    title="Cambiar foto"
                                >
                                    <Upload size={16} className="text-white" /> <span className="text-white text-xs font-medium ml-1">Actualizar</span>
                                </button>
                                <button
                                    onClick={e => { e.stopPropagation(); onClear(); }}
                                    className="px-3 py-2 rounded-lg bg-red-500/80 hover:bg-red-500 transition flex items-center justify-center"
                                    title="Eliminar foto"
                                >
                                    <Trash2 size={16} className="text-white" /> <span className="text-white text-xs font-medium ml-1">Eliminar</span>
                                </button>
                            </div>
                            <span className="text-white text-xs font-medium px-2 py-1 bg-black/50 rounded-md">
                                {tag.file?.name.substring(0, 15)}...
                            </span>
                        </div>
                        {/* Badge ok */}
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                            style={{ background: 'hsl(161,94%,40%)' }}>
                            <CheckCircle size={14} className="text-white" />
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-end group overflow-hidden pb-2">
                        {/* Imagen de referencia: apunta directo a la CDN estática, cacheada por SW */}
                        {refSrc && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={refSrc}
                                alt="Referencia"
                                loading="lazy"
                                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity pointer-events-none mix-blend-screen"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                        )}
                        
                        <div className="relative z-10 flex items-center justify-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md transition-all" 
                             style={{ background: isDragOver ? 'rgba(59, 130, 246, 0.8)' : 'rgba(10, 15, 25, 0.75)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <ImageIcon size={14} style={{ color: isDragOver ? 'white' : 'hsl(215,20%,70%)' }} />
                            <p className="text-[11px] font-semibold tracking-wide" style={{ color: isDragOver ? 'white' : 'hsl(215,20%,85%)' }}>
                                {isDragOver ? 'Suelta aquí' : 'Haz clic para subir foto'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de preview ampliado */}
            {showPreview && tag.preview && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.85)' }}
                    onClick={() => setShowPreview(false)}
                >
                    <div className="relative max-w-3xl max-h-full">
                        <button
                            onClick={() => setShowPreview(false)}
                            className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center z-10"
                            style={{ background: 'hsl(0,84%,50%)' }}
                        >
                            <X size={14} className="text-white" />
                        </button>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={tag.preview} alt={tag.label}
                            className="max-w-full max-h-[80vh] rounded-xl object-contain"
                            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}
                        />
                        <p className="text-center text-sm mt-2" style={{ color: 'hsl(215,20%,60%)' }}>
                            {`{%${tag.name}}`} — {tag.label}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
