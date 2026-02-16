import { PDFDocument } from 'pdf-lib';

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
            return new File([compressedBytes], file.name, { type: 'application/pdf' });
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
    const safeArea = area ? area.replace(/[^a-zA-Z0-9\s]/g, '').trim() : 'General';
    const safeLugar = lugar ? lugar.replace(/[^a-zA-Z0-9\s]/g, '').trim() : 'Sin Lugar';

    // Get Month Name
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    let monthName = "General";
    if (date) {
        const d = new Date(date + 'T12:00:00');
        if (!isNaN(d.getTime())) {
            monthName = monthNames[d.getMonth()];
        }
    }

    let folderName = '';

    // LOGICA 1: ESTRUCTURA PARA PMA (Solicitud Específica)
    // Evidencias SSOMA 2026 > [Nombre de Categoría PMA] > [Mes] > [Lugar]
    if (context === 'PMA' && objective) {
        const safeCategory = objective.replace(/[^a-zA-Z0-9\s\-\_]/g, '').trim();
        folderName = `Evidencias SSOMA 2026/${safeCategory}/${monthName}/${safeLugar}`;
    }
    // LOGICA 2: ESTRUCTURA PARA OBJETIVOS GENERICOS
    // Nombre del Objetivo Estratégico > Nombre de la Actividad > Mes > lugar > y el archivo
    else if (objective) {
        const safeObjective = objective.replace(/[^a-zA-Z0-9\s\-\_]/g, '').trim();
        // Activity Name is passed in 'title' for Evidence Center uploads
        const safeActivity = title.replace(/[^a-zA-Z0-9\s\-\_]/g, '').substring(0, 50).trim();

        folderName = `Evidencias SSOMA 2026/${safeObjective}/${safeActivity}/${monthName}/${safeLugar}`;
    }
    // LOGICA 3: ESTRUCTURA PARA INSPECCIONES (Logica Anterior)
    // Area > Mes > Tipo > Lugar
    else {
        // Determine 'Tipo' Folder (Charla, Capacitacion, Inspeccion, etc.)
        const contextMap: Record<string, string> = {
            'Formacion': 'Formacion',
            'Inspeccion': 'Inspecciones',
            'PMA': 'PMA',
            'Actividad': 'Actividades'
        };

        let activityCategory = tipo || contextMap[context] || 'Varios';

        // Heuristics to clean up the category name for the folder
        if (activityCategory.toLowerCase().includes('charla')) activityCategory = 'Charla';
        else if (activityCategory.toLowerCase().includes('capacitacion')) activityCategory = 'Capacitacion';
        else if (activityCategory.toLowerCase().includes('induccion')) activityCategory = 'Induccion';
        else if (activityCategory.toLowerCase().includes('entrenamiento')) activityCategory = 'Entrenamiento';
        else if (activityCategory.toLowerCase().includes('inspecc')) activityCategory = 'Inspecciones';
        else activityCategory = activityCategory.replace(/[^a-zA-Z0-9\s]/g, '');

        folderName = `Evidencias SSOMA 2026/${safeArea}/${monthName}/${activityCategory}/${safeLugar}`;
    }

    // Mapeo de tipos a abreviaturas (Sincronizado con utils.ts)
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

    // Mapeo de áreas a prefijos (Como pidió el usuario)
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

    // Construct parts for the filename
    const parts: string[] = [];
    const fullPrefix = `${areaPrefix}${tipoPrefix}`;
    if (fullPrefix) parts.push(fullPrefix);
    if (safeTitle) parts.push(safeTitle);
    if (cleanLugar) parts.push(cleanLugar);
    if (date) parts.push(date);

    const fileName = `${parts.join('_')}.${ext}`;

    // 5. Upload Request
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('folderName', folderName);
    formData.append('fileName', fileName);

    try {
        const response = await fetch('/api/upload-evidence', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 413) {
                throw new Error('El archivo es demasiado grande para el servidor (Límite Vercel Free 4.5MB). Por favor use archivos más pequeños o contacte soporte para upgrade.');
            }
            throw new Error(data.error || 'Error subiendo archivo');
        }

        return data.path;
    } catch (error: any) {
        console.error("Upload failed", error);
        throw error;
    }
}
