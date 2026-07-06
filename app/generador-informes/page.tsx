"use client";

import React, { useState, useRef, useCallback } from 'react';
import {
    Upload, FileText, Image as ImageIcon, Download, Trash2,
    Sparkles, CheckCircle, AlertCircle, Eye, X, Loader2,
    Info, FilePlus, ChevronRight, Package, Search, Filter, MapPin, FileCheck, RefreshCw, Archive, History,
    Shield, ChevronDown
} from 'lucide-react';
import { compressImage } from '@/lib/uploadClient';
import { useAuth, ALL_USER_LIST } from '@/lib/auth';

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
    uploaderInitials?: string;
    uploaderName?: string;
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

// ─── Lógica de Caché Local (Cero Consumo) ─────────────────────────────────
async function cacheImageURL(remoteUrl: string, blob: Blob) {
    if (typeof window === 'undefined') return;
    try {
        const cache = await caches.open('ssoma-image-cache-v1');
        await cache.put(remoteUrl, new Response(blob));
    } catch (e) {
        console.error("Error guardando en caché local:", e);
    }
}

async function getCachedImageURL(remoteUrl: string): Promise<string> {
    if (typeof window === 'undefined') return remoteUrl;
    try {
        const cache = await caches.open('ssoma-image-cache-v1');
        const response = await cache.match(remoteUrl);
        if (response) {
            const blob = await response.blob();
            return URL.createObjectURL(blob); // Retorna desde disco ($0 consumo)
        } else {
            // Si no está, la descargamos UNA VEZ y la guardamos
            const fetchRes = await fetch(remoteUrl);
            if (fetchRes.ok) {
                const blob = await fetchRes.blob();
                await cache.put(remoteUrl, new Response(blob));
                return URL.createObjectURL(blob);
            }
        }
    } catch (e) {
        console.error("Error leyendo caché local:", e);
    }
    return remoteUrl; // fallback
}

async function clearImageCache() {
    if (typeof window === 'undefined') return;
    try {
        await caches.delete('ssoma-image-cache-v1');
    } catch (e) {}
}

let sharedCanvas: HTMLCanvasElement | null = null;
let sharedImg: HTMLImageElement | null = null;

const compressImageClient = async (file: File | Blob, maxWidth = 1000, quality = 0.7): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') return reject(new Error('SSR'));
        if (!sharedCanvas) sharedCanvas = document.createElement('canvas');
        if (!sharedImg) sharedImg = new Image();

        const objectUrl = URL.createObjectURL(file);
        
        sharedImg.onload = () => {
            URL.revokeObjectURL(objectUrl); // Release memory immediately
            
            let width = sharedImg!.width;
            let height = sharedImg!.height;
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }
            sharedCanvas!.width = width;
            sharedCanvas!.height = height;
            
            const ctx = sharedCanvas!.getContext('2d');
            ctx?.drawImage(sharedImg!, 0, 0, width, height);
            
            sharedCanvas!.toBlob((blob) => {
                // Wipe canvas pixels immediately to free memory
                ctx?.clearRect(0, 0, width, height);
                sharedCanvas!.width = 0;
                sharedCanvas!.height = 0;
                sharedImg!.src = ''; // Clean up image source
                
                if (blob) resolve(blob);
                else reject(new Error('Canvas toBlob failed'));
            }, 'image/jpeg', quality);
        };
        
        sharedImg.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            sharedImg!.src = '';
            reject(new Error('Failed to load image for compression'));
        };
        
        sharedImg.src = objectUrl;
    });
};

function TemplatePermissionManager({ templateName, permissions, setPermissions }: { templateName: string, permissions: Record<string, string[]>, setPermissions: any }) {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    if (!user || (user.role !== 'developer' && user.role !== 'manager')) return null;

    const allowed = permissions[templateName] || [];

    const toggleUser = async (username: string) => {
        const newAllowed = allowed.includes(username) ? allowed.filter((u: string) => u !== username) : [...allowed, username];
        setPermissions((prev: Record<string, string[]>) => ({ ...prev, [templateName]: newAllowed }));
        
        try {
            await fetch('/api/template-permissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templateName, allowedUsers: newAllowed })
            });
        } catch(e) { console.error('Error guardando permisos', e); }
    };

    return (
        <div className="relative mb-2 w-full z-10">
            <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Shield size={14} className="text-emerald-500" />
                    <span>Permisos de Acceso ({allowed.length})</span>
                </div>
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50 max-h-48 overflow-y-auto">
                    <div className="p-2 text-[10px] text-slate-400 border-b border-slate-700">Selecciona quién puede cargar fotos:</div>
                    {ALL_USER_LIST.map(u => (
                        <label key={u.username} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-700/50 cursor-pointer text-xs">
                            <input 
                                type="checkbox" 
                                checked={allowed.includes(u.username)}
                                onChange={() => toggleUser(u.username)}
                                className="rounded bg-slate-900 border-slate-600 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="text-slate-200">{u.name}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function GeneradorInformesPage() {
    const { user } = useAuth();
    const [templateFile, setTemplateFile] = useState<File | null>(null);
    const [tags, setTags] = useState<DetectedTag[]>([]);
    const [status, setStatus] = useState<ProcessingStatus>({ stage: 'idle', message: '', progress: 0 });
    const [isDraggingTemplate, setIsDraggingTemplate] = useState(false);
    const [dragOverTag, setDragOverTag] = useState<string | null>(null);
    const [allReferences, setAllReferences] = useState<Record<string, Record<string, string>>>({});
    const [templatePermissions, setTemplatePermissions] = useState<Record<string, string[]>>({});
    const deletedFieldsRef = useRef<string[]>([]);

    // Cargar mapa estático y permisos al entrar a la página
    React.useEffect(() => {
        fetch('/references_map.json')
            .then(r => r.json())
            .then(data => setAllReferences(data))
            .catch(() => {});
            
        fetch('/api/template-permissions')
            .then(r => r.json())
            .then(data => {
                if (data.permissions) setTemplatePermissions(data.permissions);
            })
            .catch(() => {});
    }, []);

    const canAccessTemplate = (templateName: string) => {
        if (!user) return false;
        if (user.role === 'developer' || user.role === 'manager') return true;
        const allowed = templatePermissions[templateName];
        if (!allowed || allowed.length === 0) return true; // Si no hay permisos definidos, asume libre acceso
        return allowed.includes(user.username);
    };
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [archives, setArchives] = useState<any[]>([]);
    // --- Autoguardado Colaborativo ---
    const loadDraft = useCallback(async (docType: string, currentTags: DetectedTag[]) => {
        try {
            const res = await fetch(`/api/draft?docType=${docType}`);
            if (res.ok) {
                const { fields } = await res.json();
                if (fields && Object.keys(fields).length > 0) {
                    let oldUploaders: any = {};
                    try { if (fields['_uploaders_']) oldUploaders = JSON.parse(fields['_uploaders_']); } catch(e){}

                    setTags(prev => prev.map(t => {
                        if (fields[t.name]) {
                            if (t.type === 'text') return { ...t, value: fields[t.name] };
                            if (t.type === 'image') return { 
                                ...t, 
                                remoteUrl: fields[t.name], 
                                uploaderInitials: fields[`_uploaderInitials_${t.name}`] || oldUploaders[t.name]?.initials || '', 
                                uploaderName: fields[`_uploaderName_${t.name}`] || oldUploaders[t.name]?.name || '' 
                            }; // No set preview yet
                        }
                        return t;
                    }));

                    // Cargar imágenes desde caché local en BLOQUE para máxima velocidad
                    const updates = [];
                    for (const t of currentTags) {
                        if (t.type === 'image' && fields[t.name]) {
                            updates.push(getCachedImageURL(fields[t.name]).then(url => ({ name: t.name, url })));
                        }
                    }
                    if (updates.length > 0) {
                        Promise.all(updates).then(results => {
                            setTags(prev => {
                                const m = [...prev];
                                for (const res of results) {
                                    const idx = m.findIndex(pt => pt.name === res.name);
                                    if (idx !== -1) m[idx] = { ...m[idx], preview: res.url };
                                }
                                return m;
                            });
                        });
                    }
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
        
        const currentDocType = templateFile.name;
        saveDraftTimeout.current = setTimeout(async () => {
            const docType = currentDocType;
            const fields: Record<string, string | null> = {};
            
              tags.forEach(t => {
                  if (t.type === 'text' && t.value !== undefined) fields[t.name] = t.value;
                  if (t.type === 'image' && t.remoteUrl !== undefined) {
                      fields[t.name] = t.remoteUrl;
                      fields[`_uploaderInitials_${t.name}`] = t.uploaderInitials || '';
                      fields[`_uploaderName_${t.name}`] = t.uploaderName || '';
                  }
              });
              
              if (deletedFieldsRef.current.length > 0) {
                  deletedFieldsRef.current.forEach(f => {
                      fields[f] = null;
                      fields[`_uploaderInitials_${f}`] = null;
                      fields[`_uploaderName_${f}`] = null;
                  });
                  deletedFieldsRef.current = [];
              }
    
            if (Object.keys(fields).length > 0) {
                await fetch('/api/draft', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ docType, fields })
                });
            }
        }, 2000);
    }, [tags, templateFile]);

    
    // Sincronización automática de fondo cada 10 minutos
    React.useEffect(() => {
        if (!templateFile || tags.length === 0) return;
        const interval = setInterval(() => {
            // AHORRO INTELIGENTE: Si la pantalla está apagada, bloqueada o en otra pestaña, NO consumir datos.
            if (document.hidden) return; 

            const docType = templateFile.name;
            fetch(`/api/draft?docType=${docType}`).then(r => r.json()).then(data => {
                if (data.fields) {
                    setTags(prev => prev.map(t => {
                        if (data.fields[t.name]) {
                            if (t.type === 'image' && t.remoteUrl !== data.fields[t.name]) {
                                getCachedImageURL(data.fields[t.name]).then(localUrl => {
                                    setTags(current => current.map(pt => pt.name === t.name ? { ...pt, remoteUrl: data.fields[t.name], preview: localUrl } : pt));
                                });
                                return t;
                            }
                            if (t.type === 'text' && t.value !== data.fields[t.name]) {
                                if (!t.value) {
                                    return { ...t, value: data.fields[t.name] };
                                }
                            }
                        }
                        return t;
                    }));
                }
            }).catch(() => {});
        }, 60000); // 1 minuto (60,000 ms)
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
            loadDraft('PAD_SAN_CLEMENTE_INTERNAL.docx', detected);
            setStatus({ stage: 'ready', message: `✅ Plantilla lista — ${detected.length} campos detectados (1 texto, ${detected.length - 1} fotos)`, progress: 100 });
        }, 300); // Pequeño delay visual para que el usuario perciba la acción
    }, [loadDraft]);

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
            loadDraft('PAD_CHINCHAYSULLO_INTERNAL.docx', detected);
            setStatus({ stage: 'ready', message: `✅ Plantilla lista — ${detected.length} campos detectados (1 texto, ${detected.length - 1} fotos)`, progress: 100 });
        }, 300);
    }, [loadDraft]);

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
            loadDraft('PAD_JAHUAY_INTERNAL.docx', detected);
            setStatus({ stage: 'ready', message: `✅ Plantilla lista — ${detected.length} campos detectados (1 texto, ${detected.length - 1} fotos)`, progress: 100 });
        }, 300);
    }, [loadDraft]);

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
            loadDraft('PAD_BARANDAS_INTERNAL.docx', detected);
            setStatus({ stage: 'ready', message: `✅ Plantilla lista — ${detected.length} campos detectados (1 texto, ${detected.length - 1} fotos)`, progress: 100 });
        }, 300);
    }, [loadDraft]);

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
        const userInitials = user ? user.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : '';
        
        // Show loading state immediately without heavy preview
        setTags(prev => prev.map(t =>
            t.name === tagName ? { ...t, loading: true, uploaderInitials: userInitials, uploaderName: user?.name } : t
        ));

        try {
            const ext = file.name.split('.').pop() || 'jpg';
            
            // 1. COMPRESS FIRST to prevent GPU OOM from rendering raw 4K images
            let finalFile: File | Blob = file;
            if (file.type.startsWith('image/')) {
                try {
                    finalFile = await compressImageClient(file, 800, 0.6); // Low res for fast preview & upload
                } catch (e) {
                    console.warn("No se pudo comprimir la imagen, usando original.", e);
                }
            }

            const preview = URL.createObjectURL(finalFile);
            
            // 2. Set the compressed preview to the state so the browser doesn't crash decoding it
            setTags(prev => prev.map(t =>
                t.name === tagName ? { ...t, file: finalFile as File, preview } : t
            ));

            const formData = new FormData();
            formData.append('file', finalFile);
            
            const res = await fetch(`/api/draft/image?filename=${tagName}_${Date.now()}.${ext}`, {
                method: 'POST',
                body: finalFile
            });
            if (res.ok) {
                const blobUrl = await res.json();
                // 1. Guardar en caché local para que no consuma datos mañana
                await cacheImageURL(blobUrl.url, file);

                setTags(prev => prev.map(t =>
                    t.name === tagName ? { ...t, remoteUrl: blobUrl.url, loading: false } : t
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
            t.name === tagName ? { ...t, file: undefined, preview: undefined, value: '', remoteUrl: '', uploaderInitials: '', uploaderName: '' } : t
        ));
    };

    const handleClearDraft = async () => {
        if (!templateFile) return;
        if (!confirm(`¿Estás seguro de que deseas VACIAR LA PLANTILLA ${templateFile.name}?\nEsto borrará todas las fotos que se hayan guardado en ella.`)) return;
        
        try {
            await fetch(`/api/draft?docType=${templateFile.name}`, { method: 'DELETE' });
            setTags(prev => prev.map(t => ({
                ...t,
                value: t.type === 'text' ? '' : undefined,
                remoteUrl: undefined,
                file: undefined,
                preview: undefined,
                uploaderInitials: undefined,
                uploaderName: undefined
            })));
        } catch (error) {
            console.error('Error al limpiar plantilla', error);
        }
    };

    // ─── Generar el documento ─────────────────────────────────────────────────

    const loadArchives = async () => {
        if (!templateFile) return;
        try {
            const res = await fetch(`/api/draft/archive?docType=${templateFile.name}`);
            const data = await res.json();
            setArchives(data.archives || []);
        } catch (e) {
            console.error(e);
        }
    };

    const loadHistoricalMonth = async (id: number, monthName: string) => {
        setStatus({ stage: 'loading', message: `📂 Cargando histórico: ${monthName}...`, progress: 50 });
        try {
            const res = await fetch(`/api/draft/archive?id=${id}`);
            const data = await res.json();
            if (data.fields) {
                setTags(prev => prev.map(t => {
                    // Reset fields first
                    let newTag = { ...t, file: undefined, preview: undefined, value: '', remoteUrl: undefined };
                    if (data.fields[t.name]) {
                        if (t.type === 'text') newTag.value = data.fields[t.name];
                        if (t.type === 'image') {
                            newTag.remoteUrl = data.fields[t.name];
                        }
                    }
                    return newTag;
                }));

                const updates = [];
                Object.keys(data.fields).forEach(key => {
                    const val = data.fields[key];
                    if (typeof val === 'string' && (val.startsWith('http') || val.includes('/'))) {
                        updates.push(getCachedImageURL(val).then(url => ({ name: key, url })));
                    }
                });

                if (updates.length > 0) {
                    Promise.all(updates).then(results => {
                        setTags(prev => {
                            const m = [...prev];
                            for (const res of results) {
                                const idx = m.findIndex(pt => pt.name === res.name);
                                if (idx !== -1) m[idx] = { ...m[idx], preview: res.url };
                            }
                            return m;
                        });
                    });
                }
            }
            setShowHistoryModal(false);
            setStatus({ stage: 'ready', message: `✅ Histórico cargado: ${monthName}`, progress: 100 });
        } catch (e) {
            setStatus({ stage: 'error', message: 'Error al cargar mes histórico', progress: 0 });
        }
    };

    const deleteArchive = async (id: number) => {
        if (!window.confirm("¿Seguro que deseas eliminar este archivo histórico para siempre?")) return;
        try {
            await fetch(`/api/draft/archive?id=${id}`, { method: 'DELETE' });
            loadArchives();
        } catch (e) {
            console.error("Error al borrar historial", e);
        }
    };

    const handleArchiveMonth = async () => {
        const p = prompt("Clave de administrador (Para archivar):");
        if (p !== "161976") { alert("Clave incorrecta"); return; }

        if (!templateFile) return;
        const monthName = prompt("¿Bajo qué nombre deseas archivar este mes? (Ej. Junio 2026)");
        if (!monthName) return;
        
        const docType = templateFile.name;
        setStatus({ stage: 'loading', message: `📦 Archivando ${monthName}...`, progress: 50 });
        try {
            const fields: Record<string, string> = {};
            tags.forEach(t => {
                if (t.type === 'text' && t.value) fields[t.name] = t.value;
                if (t.type === 'image' && t.remoteUrl) fields[t.name] = t.remoteUrl;
            });
            
            // Guardar en el histórico
            await fetch('/api/draft/archive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ docType, monthName, fields })
            });

            // Limpiar el borrador activo para el nuevo mes
            await fetch(`/api/draft?docType=${docType}`, { method: 'DELETE' });
            
            // Purgar caché local para liberar memoria del navegador
            await clearImageCache();
            
            // Reload clean template
            if (docType === 'PAD_SAN_CLEMENTE_INTERNAL.docx') loadSanClemente();
            else if (docType === 'PAD_CHINCHAYSULLO_INTERNAL.docx') loadChinchaysullo();
            else if (docType === 'PAD_JAHUAY_INTERNAL.docx') loadJahuay();
            else if (docType === 'PAD_BARANDAS_INTERNAL.docx') loadBarandas();
            else {
                setTags([]);
                setStatus({ stage: 'ready', message: `Mes ${monthName} archivado. Listo para un nuevo mes.`, progress: 100 });
            }
        } catch (e) {
            setStatus({ stage: 'error', message: 'Error al archivar mes', progress: 0 });
        }
    };



    const handleGenerate = async (e?: React.MouseEvent) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!templateFile) return;

        let wakeLock: any = null;
        try {
            if ('wakeLock' in navigator) {
                wakeLock = await (navigator as any).wakeLock.request('screen');
            }
        } catch (err) {}

        try {
            setStatus({ stage: 'generating', message: '📥 Descargando plantilla...', progress: 10 });
            
            let templateBuffer: ArrayBuffer;
            if (templateFile.size < 100) {
                // Es un archivo "dummy" interno, descargar del servidor local
                const tRes = await fetch(`/api/get-template?name=${encodeURIComponent(templateFile.name)}`);
                if (!tRes.ok) throw new Error('No se pudo descargar la plantilla base.');
                templateBuffer = await tRes.arrayBuffer();
            } else {
                // Plantilla cargada manualmente por el usuario
                templateBuffer = await templateFile.arrayBuffer();
            }

            const textData: Record<string, string> = {};
            tags.filter(t => t.type === 'text').forEach(t => {
                textData[t.name] = t.value || '';
            });

            const imageTags = tags.filter(t => t.type === 'image' && (t.file || t.remoteUrl));
            const imageBuffers: Record<string, ArrayBuffer> = {};

            for (let i = 0; i < imageTags.length; i++) {
                const t = imageTags[i];
                setStatus({ stage: 'generating', message: `📸 Descargando imagen ${i + 1} de ${imageTags.length}…`, progress: 10 + Math.floor((i / imageTags.length) * 40) });
                await new Promise(r => setTimeout(r, 10)); // Yield a la UI
                
                try {
                    if (t.file) {
                        imageBuffers[t.name] = await t.file.arrayBuffer();
                    } else if (t.remoteUrl) {
                        // Usar el proxy para evitar bloqueos de CORS
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 10000);
                        const r = await fetch(`/api/proxy-image?url=${encodeURIComponent(t.remoteUrl)}`, { signal: controller.signal });
                        clearTimeout(timeoutId);
                        
                        if (r.ok) {
                            imageBuffers[t.name] = await r.arrayBuffer();
                        } else {
                            console.warn(`Error de red al descargar ${t.name}`);
                        }
                    }
                } catch (err: any) {
                    console.warn(`Saltando imagen ${t.name} por error de descarga:`, err.message);
                }
            }
            
            setStatus({ stage: 'generating', message: '📝 Ensamblando Word en tu navegador... (Puede tardar unos segundos)', progress: 60 });
            
            // Yield a la UI antes del trabajo pesado
            await new Promise(r => setTimeout(r, 100));
            
            // Importar dinámicamente para evitar problemas de SSR si los hay
            const { generateDocumentClientSide } = await import('@/lib/docxGenerator');
            
            let originalName = templateFile.name;
            if (originalName.includes('INTERNAL')) {
                if (originalName.includes('CHINCHAYSULLO')) originalName = 'PAD_CHINCHAYSULLO_PLANTILLA.docx';
                else if (originalName.includes('JAHUAY')) originalName = 'PAD_JAHUAY_PLANTILLA.docx';
                else if (originalName.includes('BARANDAS')) originalName = 'PAD_BARANDAS_PLANTILLA.docx';
                else originalName = 'PAD_SAN_CLEMENTE_PLANTILLA.docx';
            }

            const outputBlob = await generateDocumentClientSide(
                templateBuffer,
                originalName,
                textData,
                imageBuffers
            );

            setStatus({ stage: 'generating', message: '✅ ¡Documento listo!', progress: 95 });

            const url = URL.createObjectURL(outputBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Informe_SSOMA_${new Date().toISOString().split('T')[0]}.docx`;
            a.click();
            URL.revokeObjectURL(url);

            setStatus({ stage: 'done', message: '✅ ¡Informe generado y descargado correctamente!', progress: 100 });
        } catch (e: any) {
            setStatus({ stage: 'error', message: `Error: ${e.message}` });
        } finally {
            if (wakeLock) {
                try { await wakeLock.release(); } catch(e) {}
            }
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
    const filledImages = imageTags.filter(t => t.file || t.remoteUrl).length;
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
                    <div className="mb-4">
                        <TemplatePermissionManager templateName="PAD_SAN_CLEMENTE_INTERNAL.docx" permissions={templatePermissions} setPermissions={setTemplatePermissions} />
                        <button
                            onClick={loadSanClemente}
                            disabled={!canAccessTemplate('PAD_SAN_CLEMENTE_INTERNAL.docx') || status.stage === 'loading' || status.stage === 'reading'}
                            className="w-full rounded-2xl p-4 text-left transition-all duration-200 flex items-center gap-3"
                            style={{
                                background: 'linear-gradient(135deg, hsl(210,80%,12%), hsl(222,60%,10%))',
                                border: '1px solid hsl(210,80%,30%)',
                                cursor: (!canAccessTemplate('PAD_SAN_CLEMENTE_INTERNAL.docx') || status.stage === 'loading' || status.stage === 'reading') ? 'not-allowed' : 'pointer',
                                opacity: (!canAccessTemplate('PAD_SAN_CLEMENTE_INTERNAL.docx') || status.stage === 'loading' || status.stage === 'reading') ? 0.5 : 1,
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
                    </div>

                    <div className="mb-3">
                        <TemplatePermissionManager templateName="PAD_CHINCHAYSULLO_INTERNAL.docx" permissions={templatePermissions} setPermissions={setTemplatePermissions} />
                        <button
                            onClick={loadChinchaysullo}
                            disabled={!canAccessTemplate('PAD_CHINCHAYSULLO_INTERNAL.docx') || status.stage === 'generating'}
                            className="w-full rounded-xl p-4 flex items-start gap-4 transition-all duration-200 text-left"
                            style={{
                                background: 'hsl(280, 50%, 15%)',
                                border: '1px solid hsl(280, 50%, 25%)',
                                cursor: (!canAccessTemplate('PAD_CHINCHAYSULLO_INTERNAL.docx') || status.stage === 'generating') ? 'not-allowed' : 'pointer',
                                opacity: (!canAccessTemplate('PAD_CHINCHAYSULLO_INTERNAL.docx') || status.stage === 'generating') ? 0.5 : 1
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
                    </div>

                    <div className="mb-3">
                        <TemplatePermissionManager templateName="PAD_JAHUAY_INTERNAL.docx" permissions={templatePermissions} setPermissions={setTemplatePermissions} />
                        <button
                            onClick={loadJahuay}
                            disabled={!canAccessTemplate('PAD_JAHUAY_INTERNAL.docx') || status.stage === 'generating'}
                            className="w-full rounded-xl p-4 flex items-start gap-4 transition-all duration-200 text-left"
                            style={{
                                background: 'hsl(30, 80%, 15%)',
                                border: '1px solid hsl(30, 80%, 25%)',
                                cursor: (!canAccessTemplate('PAD_JAHUAY_INTERNAL.docx') || status.stage === 'generating') ? 'not-allowed' : 'pointer',
                                opacity: (!canAccessTemplate('PAD_JAHUAY_INTERNAL.docx') || status.stage === 'generating') ? 0.5 : 1
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
                    </div>

                    <div className="mb-6">
                        <TemplatePermissionManager templateName="PAD_BARANDAS_INTERNAL.docx" permissions={templatePermissions} setPermissions={setTemplatePermissions} />
                        <button
                            onClick={loadBarandas}
                            disabled={!canAccessTemplate('PAD_BARANDAS_INTERNAL.docx') || status.stage === 'generating'}
                            className="w-full rounded-xl p-4 flex items-start gap-4 transition-all duration-200 text-left"
                            style={{
                                background: 'hsl(200, 80%, 15%)',
                                border: '1px solid hsl(200, 80%, 25%)',
                                cursor: (!canAccessTemplate('PAD_BARANDAS_INTERNAL.docx') || status.stage === 'generating') ? 'not-allowed' : 'pointer',
                                opacity: (!canAccessTemplate('PAD_BARANDAS_INTERNAL.docx') || status.stage === 'generating') ? 0.5 : 1
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
                    </div>

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
                        <div className="flex gap-4">
                            <button
                                type="button"
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
                                type="button"
                                onClick={handleClearDraft}
                                disabled={status.stage === 'generating'}
                                className="py-3 px-6 rounded-xl font-bold text-white flex items-center justify-center transition-all duration-200 active:scale-95 hover:bg-red-600 disabled:opacity-60"
                                style={{
                                    background: 'hsl(0,80%,35%)',
                                    border: '1px solid hsl(0,80%,45%)'
                                }}
                                title="Vaciar plantilla (borrar todas las fotos cargadas aquí)"
                            >
                                <Trash2 size={22} />
                            </button>
                        </div>
                        
                        <button
                            onClick={handleArchiveMonth}
                            disabled={status.stage === 'generating'}
                            className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-60 mt-4"
                            style={{
                                background: 'hsl(215,83%,35%)',
                                border: '1px solid hsl(215,83%,45%)'
                            }}
                        >
                            <Archive size={20} />
                            Archivar y Empezar Nuevo Mes
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
                        <FilePlus size={14} />
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
                                <button
                                    onClick={() => { loadArchives(); setShowHistoryModal(true); }}
                                    className="px-4 py-2 rounded-lg font-bold text-white flex items-center gap-2 transition-colors"
                                    style={{ background: 'hsl(215,83%,30%)', border: '1px solid hsl(215,83%,40%)' }}
                                >
                                    <History size={14} />
                                    Ver Historial de Meses
                                </button>
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
                                                    className="w-full p-1.5 rounded-md text-sm text-white outline-none transition-colors"
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
                                                docType={templateFile?.name || ''}
                                                refSrc={allReferences[templateFile?.name || '']?.[tag.name.toLowerCase()]}
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

            {/* Modal de Historial */}
            {showHistoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: 'hsl(222,47%,10%)', border: '1px solid hsl(222,47%,20%)' }}>
                        <div className="flex justify-between items-center p-5 border-b border-white/10">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <History size={20} className="text-blue-400" />
                                Historial de Meses Archivados
                            </h2>
                            <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-white transition">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 max-h-[60vh] overflow-y-auto">
                            {archives.length === 0 ? (
                                <p className="text-slate-400 text-center py-6">No tienes ningún mes archivado para esta plantilla aún.</p>
                            ) : (
                                <div className="space-y-3">
                                    {archives.map(arch => (
                                        <div key={arch.id} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition">
                                            <div>
                                                <h3 className="font-bold text-white text-lg">{arch.month_name}</h3>
                                                <p className="text-xs text-slate-400">Archivado el: {new Date(arch.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={() => loadHistoricalMonth(arch.id, arch.month_name)}
                                                    className="px-3 py-1.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-white transition text-sm font-semibold"
                                                >
                                                    Cargar Info
                                                </button>
                                                <button
                                                    onClick={() => deleteArchive(arch.id)}
                                                    className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-white/10 bg-black/20 text-xs text-slate-400">
                            <AlertCircle size={14} className="inline mr-1 text-amber-500" />
                            Nota: Cargar un mes histórico reemplazará el borrador que tengas actualmente en pantalla.
                        </div>
                    </div>
                </div>
            )}
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

function ImageDropZone({ tag, docType, refSrc, isDragOver, onDragOver, onDragLeave, onDrop, onFileChange, onClear
}: {
    tag: DetectedTag;
    docType: string; refSrc?: string;
    isDragOver: boolean;
    onDragOver: React.DragEventHandler;
    onDragLeave: React.DragEventHandler;
    onDrop: React.DragEventHandler;
    onFileChange: (f: File) => void;
    onClear: () => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [showPreview, setShowPreview] = useState(false);
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
                className="relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 group"
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
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {refSrc && (
                            <>
                                <img
                                    src={refSrc}
                                    alt="Referencia"
                                    loading="lazy"
                                    className="absolute inset-0 w-full h-full object-cover transition-opacity pointer-events-none opacity-30 mix-blend-screen group-hover:opacity-100 group-active:opacity-100"
                                    style={{ zIndex: 0 }}
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ef4444 10px, #ef4444 11px)',
                                    zIndex: 0
                                }}></div>
                            </>
                        )}
                        <img
                            src={tag.preview}
                            alt={tag.label}
                            className={`relative w-full h-full object-cover transition-all duration-300 group-hover:opacity-10 group-active:opacity-10 ${tag.loading ? 'opacity-40 grayscale blur-sm' : ''}`}
                            style={{ zIndex: 1 }}
                        />
                        {tag.loading && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            </div>
                        )}
                        {/* Overlay botones siempre parcialmente visible o visible al hover */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-start gap-1.5 pt-4 pb-2"
                             style={{ zIndex: 10 }}>
                            <div className="flex gap-2">
                                <button
                                    onClick={e => { e.stopPropagation(); setShowPreview(true); }}
                                    className="p-1.5 rounded-md bg-white/20 hover:bg-white/40 transition flex items-center justify-center"
                                    title="Ver foto"
                                >
                                    <Eye size={14} className="text-white" />
                                </button>
                                <button
                                    onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
                                    className="p-1.5 rounded-md bg-blue-500/80 hover:bg-blue-500 transition flex items-center justify-center"
                                    title="Cambiar foto"
                                >
                                    <Upload size={14} className="text-white" />
                                </button>
                                <button
                                    onClick={e => { 
                                        e.stopPropagation(); 
                                        deletedFieldsRef.current.push(tag.name);
                                        onClear(); 
                                    }}
                                    className="p-1.5 rounded-md bg-red-500/80 hover:bg-red-500 transition flex items-center justify-center"
                                    title="Eliminar foto"
                                >
                                    <Trash2 size={14} className="text-white" />
                                </button>
                            </div>
                            <span className="text-white text-[9px] font-medium px-1.5 py-0.5 bg-black/50 rounded-md">
                                {tag.file?.name.substring(0, 15)}...
                            </span>
                        </div>
                            {/* Uploader Initials Avatar on Hover */}
                            {(tag.uploaderInitials || tag.remoteUrl) && (
                                <div className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900 z-20 group/avatar cursor-help transition-opacity opacity-100"
                                    style={{ background: 'linear-gradient(135deg, hsl(215,83%,45%), hsl(215,83%,35%))' }}
                                    title={`Subido por: ${tag.uploaderName || 'Usuario'}`}>
                                    <span className="text-white font-black text-[10px]">{tag.uploaderInitials || '?'}</span>
                                </div>
                            )}
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
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={refSrc}
                                    alt="Referencia"
                                    loading="eager"
                                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-opacity pointer-events-none mix-blend-screen"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                                {/* Patrón de líneas diagonales para indicar que está vacío */}
                                <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay"
                                     style={{ background: 'repeating-linear-gradient(45deg, #ef4444, #ef4444 10px, transparent 10px, transparent 20px)' }}>
                                </div>
                            </>
                        )}
                        
                        <div className="relative z-10 flex items-center justify-center gap-1.5 px-2 py-1 rounded-full backdrop-blur-md transition-all" 
                             style={{ background: isDragOver ? 'rgba(59, 130, 246, 0.8)' : 'rgba(239, 68, 68, 0.25)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                            <ImageIcon size={14} style={{ color: isDragOver ? 'white' : '#fca5a5' }} />
                            <p className="text-[9px] font-medium tracking-wider" style={{ color: isDragOver ? 'white' : '#fca5a5' }}>
                                {isDragOver ? 'Suelta aquí' : 'Falta cargar foto'}
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




