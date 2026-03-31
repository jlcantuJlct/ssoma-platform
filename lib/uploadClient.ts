import { PDFDocument } from 'pdf-lib';
import { getInitials } from './utils';
import { UploadContext } from './types';

/**
 * Attempts to compress a PDF file.
 * Currently it focuses on re-saving the document which can sometimes reduce size
 * by removing deleted objects or using more efficient encoding.
 */
async function compressPdf(file: File): Promise<File> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);

        // Re-saving with compression options
        const compressedBytes = await pdfDoc.save({ useObjectStreams: true });

        // Create a new file only if it is actually smaller
        if (compressedBytes.length < file.size) {
            console.log(`Compresión PDF: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedBytes.length / 1024 / 1024).toFixed(2)}MB`);
            return new File([compressedBytes as any], file.name, { type: 'application/pdf' });
        }

        return file;
    } catch (e) {
        console.warn('No se pudo comprimir el PDF, se enviará el original:', e);
        return file;
    }
}

/**
 * Compresses an image file before upload to stay within typical 
 * serverless body size limits (e.g. Vercel's 4.5MB).
 */
async function compressImage(file: File, maxWidth = 1280, quality = 0.8): Promise<File> {
    const imgText = file.type.toLowerCase();
    if (!imgText.includes('jpeg') && !imgText.includes('png') && !imgText.includes('jpg')) {
        return file; // No es una imagen comprimible fácilmente con este método
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Solo redimensionar si es más grande que maxWidth
                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return resolve(file);

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        console.log(`Compresión completada: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
                        resolve(compressedFile);
                    } else {
                        resolve(file);
                    }
                }, 'image/jpeg', quality);
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
}

// URL del puente Apps Script para subida directa (evita límite Vercel 4.5MB)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzapkKUP2aYCoVrDk5nkJUy03u3K10LRCV2Hmt2KyKlEsdHgi4vXseSEbaIiKcudVzW/exec";

/**
 * Sube archivo directamente a Google Drive via Apps Script Bridge
 * Útil para archivos > 4MB que Vercel rechaza
 */
async function uploadDirectToDrive(file: File, folderName: string, fileName: string): Promise<string> {
    console.log(`📤 Subida directa a Drive: ${fileName} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    try {
        // Convertir a Base64 de forma más robusta
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.subarray(i, i + chunkSize);
            binary += String.fromCharCode.apply(null, Array.from(chunk));
        }
        const base64 = btoa(binary);

        console.log(`📦 Archivo convertido a Base64 (${(base64.length / 1024 / 1024).toFixed(2)}MB)`);

        const payload = {
            filename: fileName,
            mimeType: file.type || 'application/octet-stream',
            fileBase64: base64,
            folderId: "1eJ7QWEpAcqM1cwDJFSHsvE43WJJwQG0I", // Carpeta raíz SSOMA (Actualizado)
            folderPath: folderName, // NEW: Match 'folderPath' expected by Bridge
            folderName: folderName
        };

        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'text/plain' }, // text/plain para evitar preflight CORS
            redirect: 'follow'
        });

        if (!response.ok) {
            console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
            throw new Error(`Error de servidor: ${response.status}`);
        }

        const text = await response.text();
        console.log(`📨 Respuesta recibida (${text.length} chars)`);

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("Respuesta no-JSON del Bridge:", text.substring(0, 500));
            if (text.includes('<!DOCTYPE') || text.includes('<html')) {
                throw new Error("Google Drive requiere autenticación. Contacte al administrador.");
            }
            throw new Error("Error de comunicación con Google Drive. Intente de nuevo.");
        }

        if (data.result === 'success') {
            console.log(`✅ Subida exitosa: ${data.url || data.viewLink}`);
            return data.viewLink || data.url;
        } else {
            console.error("❌ Error del Script:", data.error);
            throw new Error(data.error || 'Error desconocido al subir a Drive');
        }
    } catch (error: any) {
        console.error("❌ Error en subida directa:", error);
        throw error;
    }
}

export async function uploadEvidence(
    file: File,
    context: UploadContext,
    title: string,
    date: string,
    responsible: string,
    tipo?: string,
    area?: string,
    lugar?: string,
    objective?: string // New Parameter for Objective Folders
): Promise<string> {
    // 1. Validation: Max Size (50MB as requested by user)
    // NOTE: Vercel Free still has a 4.5MB limit. If file is > 4.5MB and not an image, it may fail.
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_SIZE) {
        throw new Error(`El archivo excede el límite de 50MB. Tamaño actual: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    }

    // 2. Compression (Client-side)
    let fileToUpload = file;

    // Image Compression
    if (file.type.startsWith('image/') && file.size > 2 * 1024 * 1024) {
        try {
            console.log('Comprimiendo imagen pesada...');
            fileToUpload = await compressImage(file);
        } catch (e) {
            console.warn('Error en compresión de imagen:', e);
        }
    }
    // PDF Compression
    else if (file.type === 'application/pdf' && file.size > 2 * 1024 * 1024) {
        try {
            console.log('Intentando optimizar PDF pesado...');
            fileToUpload = await compressPdf(file);
        } catch (e) {
            console.warn('Error en optimización de PDF:', e);
        }
    }

    // 3. Folder Selection mapping (Hierarchical)
    const safeArea = area ? area.replace(/[^a-zA-Z0-9\s]/g, '').trim().toUpperCase() : 'GENERAL';
    const safeLugar = lugar ? lugar.replace(/[^a-zA-Z0-9\s]/g, '').trim().toUpperCase() : 'SIN LUGAR';

    // Get Month Name
    const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    let monthName = "GENERAL";
    if (date) {
        const d = new Date(date + 'T12:00:00');
        if (!isNaN(d.getTime())) {
            monthName = monthNames[d.getMonth()];
        }
    }

    let folderName = '';

    // LOGICA 1: ESTRUCTURA PARA PMA (Solicitud Específica)
    if (context === 'PMA' && objective) {
        const safeCategory = objective.replace(/[^a-zA-Z0-9\s\-\_]/g, '').trim().toUpperCase();
        folderName = `${safeCategory}/${monthName}/${safeLugar}`;
    }
    // LOGICA 2: ESTRUCTURA PARA OBJETIVOS GENERICOS
    else if (objective) {
        const safeObjective = objective.replace(/[^a-zA-Z0-9\s\-\_]/g, '').trim().toUpperCase();
        const safeActivity = title.replace(/[^a-zA-Z0-9\s\-\_]/g, '').substring(0, 50).trim().toUpperCase();
        folderName = `${safeObjective}/${safeActivity}/${monthName}/${safeLugar}`;
    }
    // LOGICA 3: ESTRUCTURA PARA INSPECCIONES
    else {
        const contextMap: Record<string, string> = {
            'Formacion': 'FORMACION',
            'Inspeccion': 'INSPECCIONES',
            'PMA': 'PMA',
            'Actividad': 'ACTIVIDADES'
        };

        let activityCategory = tipo || contextMap[context] || 'VARIOS';
        if (activityCategory.toLowerCase().includes('charla')) activityCategory = 'CHARLA';
        else if (activityCategory.toLowerCase().includes('capacitacion')) activityCategory = 'CAPACITACION';
        else if (activityCategory.toLowerCase().includes('induccion')) activityCategory = 'INDUCCION';
        else if (activityCategory.toLowerCase().includes('entrenamiento')) activityCategory = 'ENTRENAMIENTO';
        else if (activityCategory.toLowerCase().includes('inspecc')) activityCategory = 'INSPECCIONES';
        else activityCategory = activityCategory.replace(/[^a-zA-Z0-9\s]/g, '').toUpperCase();

        folderName = `${safeArea}/${monthName}/${activityCategory}/${safeLugar}`;
    }

    const tipoMap: Record<string, string> = {
        'capacitacion': 'CAP',
        'induccion_gen': 'IND-G',
        'induccion_esp': 'IND-E',
        'entrenamiento': 'ENT',
        'charla': 'CHA',
        'difusion': 'DIF',
        'inspeccion': 'INSP',
        'evidencia': 'EVID',
        'pma': 'PMA'
    };

    const areaMap: Record<string, string> = {
        'seguridad': 'Seg.',
        'medio_ambiente': 'MA.',
        'ambiente': 'MA.',
        'salud': 'Sal.'
    };

    const areaPrefix = area ? (areaMap[area.toLowerCase()] || '') : '';
    const tipoPrefix = tipo ? (tipoMap[tipo.toLowerCase()] || tipo.substring(0, 4).toUpperCase()) : 'DOC';
    const safeTitle = title.replace(/[^a-zA-Z0-9\s-_]/g, '').trim().replace(/\s+/g, '_');
    const ext = file.name.split('.').pop() || 'file';
    const cleanLugar = lugar ? lugar.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_').substring(0, 15) : '';

    // Get Initials responsible
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();
    const initials = getInitials(responsible);

    const parts: string[] = [];
    const fullPrefix = `${areaPrefix}${tipoPrefix}`;
    if (fullPrefix) parts.push(fullPrefix);
    if (safeTitle) parts.push(safeTitle);
    if (initials) parts.push(initials);
    if (cleanLugar) parts.push(cleanLugar);
    if (date) parts.push(date);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-PE', { hour12: false }).replace(/:/g, '-');
    parts.push(timeStr);
    const fileName = `${parts.join('_')}.${ext}`;

    const sizeMB = (fileToUpload.size / 1024 / 1024).toFixed(2);
    console.log(`📤 Iniciando subida (${sizeMB}MB): ${fileName}`);

    // A. INTENTO VIA API SERVIDOR (ROBOT) - RE-ACTIVADO
    if (fileToUpload.size < 4 * 1024 * 1024) {
        try {
            console.log("⚡ Intentando subida vía Servidor...");

            const formData = new FormData();
            formData.append('file', fileToUpload);
            formData.append('folderName', folderName);
            formData.append('fileName', fileName);

            const response = await fetch('/api/upload-evidence', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Subida Exitosa por Servidor: ${data.path}`);
                return data.path;
            } else {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `Error del servidor: ${response.status}`;
                console.error(`❌ Error Crítico del Servidor: ${errorMessage}`);
                throw new Error(errorMessage);
            }
        } catch (serverError: any) {
            console.warn("⚠️ Reintentando por Bridge debido a error de servidor.");
        }
    } else {
        console.log("📦 Archivo > 4MB. Saltando servidor y usando Bridge directo.");
    }

    // B. INTENTO VIA BRIDGE APPS SCRIPT (Fallback o Archivos Grandes)
    try {
        console.log("🌐 Intentando subida directa (Bridge Apps Script)...");
        const directUrl = await uploadDirectToDrive(fileToUpload, folderName, fileName);
        console.log(`✅ Exito Bridge! URL: ${directUrl}`);
        return directUrl;
    } catch (directError: any) {
        console.error("❌ Falló subida directa:", directError.message);
        throw new Error(`Error: No se pudo subir el archivo por ningún método. ${directError.message}`);
    }
}
