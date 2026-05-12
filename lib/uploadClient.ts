import { PDFDocument } from 'pdf-lib';
import { getInitials } from './utils';
import { UploadContext } from './types';

/**
 * Comprime un PDF escaneado renderizando cada página a canvas con pdfjs-dist
 * y recomprimiendo las imágenes como JPEG. Reduce PDFs de 10+ MB a < 3 MB.
 */
async function compressPdf(
    file: File,
    scale = 1.5,          // Resolución de renderizado (1.5 = buena calidad, menor tamaño)
    quality = 0.75,       // Calidad JPEG 0-1
    onProgress?: (page: number, total: number) => void
): Promise<File> {
    try {
        console.log(`🗜️ Iniciando compresión real de PDF (${(file.size / 1024 / 1024).toFixed(2)}MB)...`);

        // 1. Cargar pdfjs dinámicamente (solo en cliente)
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        // 2. Cargar el PDF original
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
        const pdfDoc = await loadingTask.promise;
        const totalPages = pdfDoc.numPages;

        console.log(`📄 PDF cargado: ${totalPages} página(s)`);

        // 3. Crear un nuevo PDF para reconstruirlo
        const newPdfDoc = await PDFDocument.create();

        // 4. Renderizar cada página a canvas y recomprimir como JPEG
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            if (onProgress) onProgress(pageNum, totalPages);

            const page = await pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale });

            // Canvas en memoria
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d')!;

            await page.render({ canvasContext: ctx, viewport }).promise;

            // Convertir canvas a Blob JPEG comprimido
            const blob: Blob = await new Promise((res) =>
                canvas.toBlob((b) => res(b!), 'image/jpeg', quality)
            );
            const imgBytes = new Uint8Array(await blob.arrayBuffer());

            // Insertar imagen en el nuevo PDF
            const jpgImage = await newPdfDoc.embedJpg(imgBytes);
            const pdfPage = newPdfDoc.addPage([viewport.width, viewport.height]);
            pdfPage.drawImage(jpgImage, { x: 0, y: 0, width: viewport.width, height: viewport.height });

            console.log(`  ✅ Página ${pageNum}/${totalPages} procesada`);
        }

        // 5. Guardar el nuevo PDF
        const compressedBytes = await newPdfDoc.save({ useObjectStreams: true });
        const compressedFile = new File([compressedBytes], file.name, { type: 'application/pdf' });

        const originalMB = (file.size / 1024 / 1024).toFixed(2);
        const newMB = (compressedFile.size / 1024 / 1024).toFixed(2);
        const reduction = (((file.size - compressedFile.size) / file.size) * 100).toFixed(0);
        console.log(`✅ PDF comprimido: ${originalMB}MB → ${newMB}MB (${reduction}% reducción)`);

        return compressedFile.size < file.size ? compressedFile : file;

    } catch (e) {
        console.warn('⚠️ No se pudo comprimir el PDF con renderizado, se enviará el original:', e);
        // Fallback: intento básico con pdf-lib
        try {
            const arrayBuffer2 = await file.arrayBuffer();
            const pdfDoc2 = await PDFDocument.load(arrayBuffer2);
            const bytes2 = await pdfDoc2.save({ useObjectStreams: true });
            if (bytes2.length < file.size) {
                return new File([bytes2], file.name, { type: 'application/pdf' });
            }
        } catch (_) { /* ignorar */ }
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
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzejhIn8c-dF7bgoIEokyCsm1k-U2D_1Q50BCnjZI9OzTiVcGv5LcsgSql6zsoN69ne/exec";

/**
 * Sube archivo directamente a Google Drive via Apps Script Bridge
 * Útil para archivos > 4MB que Vercel rechaza
 */
async function uploadDirectToDrive(file: File, folderName: string, fileName: string, logData?: any): Promise<string> {
    console.log(`📤 Subida directa a Drive: ${fileName} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
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
            folderId: "1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5", // Carpeta raíz SSOMA (Actualizado a 1j6w activo)
            folderPath: folderName, // NEW: Match 'folderPath' expected by Bridge
            folderName: folderName,
            logData: logData // Enviar datos para el Excel
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
                throw new Error("Google Drive requiere autenticación. El script de Google Apps Script necesita ser re-autorizado o configurado como 'Ejecutar como Mí'.");
            }
            throw new Error("Error de comunicación con Google Drive. Intente de nuevo.");
        }

        if (data.result === 'success') {
            console.log(`✅ Subida exitosa: ${data.url || data.viewLink}`);
            return data.viewLink || data.url;
        } else {
            console.error("❌ Error del Script:", data.error);
            if (data.error && data.error.includes('DriveApp')) {
                 throw new Error("Google Apps Script perdió los permisos. Por favor, re-autoriza el script en Google Apps Script.");
            }
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
    objective?: string,
    logData?: any // Nuevo: Datos para la bitácora
): Promise<string> {
    // 1. Validation: Max Size (50MB as requested by user)
    // NOTE: Vercel Free still has a 4.5MB limit. If file is > 4.5MB and not an image, it may fail.
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_SIZE) {
        throw new Error(`El archivo excede el límite de 50MB. Tamaño actual: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    }

    // 2. Compresión automática (Cliente) - Se activa si el archivo supera 1MB
    // Objetivo: Siempre mantenerse por debajo del límite de Vercel (4.5MB)
    const COMPRESS_THRESHOLD = 1 * 1024 * 1024; // 1 MB
    let fileToUpload = file;

    // --- Compresión de IMÁGENES ---
    if (file.type.startsWith('image/') && file.size > COMPRESS_THRESHOLD) {
        try {
            console.log(`🖼️ Comprimiendo imagen (${(file.size/1024/1024).toFixed(2)}MB)...`);
            // Para imágenes muy grandes del celular, reducimos más agresivamente
            const maxWidth = file.size > 5 * 1024 * 1024 ? 1024 : 1280;
            const quality = file.size > 5 * 1024 * 1024 ? 0.7 : 0.8;
            fileToUpload = await compressImage(file, maxWidth, quality);
            console.log(`✅ Imagen comprimida: ${(file.size/1024/1024).toFixed(2)}MB → ${(fileToUpload.size/1024/1024).toFixed(2)}MB`);
        } catch (e) {
            console.warn('⚠️ Error en compresión de imagen:', e);
        }
    }
    // --- Compresión de PDFs escaneados (renderizado página por página) ---
    else if (file.type === 'application/pdf' && file.size > COMPRESS_THRESHOLD) {
        try {
            console.log(`📄 PDF pesado detectado (${(file.size/1024/1024).toFixed(2)}MB). Comprimiendo...`);
            // Para PDFs muy pesados, usamos menor calidad
            const scale = file.size > 8 * 1024 * 1024 ? 1.2 : 1.5;
            const quality = file.size > 8 * 1024 * 1024 ? 0.65 : 0.75;
            fileToUpload = await compressPdf(file, scale, quality);
        } catch (e) {
            console.warn('⚠️ Error en compresión de PDF:', e);
        }
    }

    // 3. Folder Selection mapping (Hierarchical)
    let standardArea = area ? area.replace(/[^a-zA-Z0-9\s]/g, ' ').trim().toUpperCase() : 'GENERAL';
    if (standardArea.includes('MEDIO') || standardArea.includes('AMBIENTE')) {
        standardArea = 'MEDIO AMBIENTE';
    } else if (standardArea.includes('SEGURIDAD')) {
        standardArea = 'SEGURIDAD';
    } else if (standardArea.includes('SALUD')) {
        standardArea = 'SALUD';
    }
    const safeArea = standardArea;
    
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
            if (logData) formData.append('logData', JSON.stringify(logData));

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
                console.warn(`⚠️ Servidor rechazó subida: ${errorData.error || response.status}. Reintentando por Bridge...`);
                // No lanzamos error aquí, dejamos que caiga al bloque B (Bridge)
            }
        } catch (serverError: any) {
            console.warn("⚠️ Error de conexión con servidor. Reintentando por Bridge...");
        }
    } else {
        console.log("📦 Archivo > 4MB. Saltando servidor y usando Bridge directo.");
    }

    // B. INTENTO VIA BRIDGE APPS SCRIPT (Fallback o Archivos Grandes)
    try {
        console.log("🌐 Intentando subida directa (Bridge Apps Script)...");
        const directUrl = await uploadDirectToDrive(fileToUpload, folderName, fileName, logData);
        console.log(`✅ Exito Bridge! URL: ${directUrl}`);
        return directUrl;
    } catch (directError: any) {
        console.error("❌ Falló subida directa:", directError.message);
        throw new Error(`Error: No se pudo subir el archivo por ningún método. ${directError.message}`);
    }
}
