import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getInitials(name: any): string {
    if (!name || typeof name !== 'string') return "";
    return name
        .trim()
        .split(/\s+/)
        .filter(n => n.length > 0)
        .map((n) => n[0])
        .join("")
        .toUpperCase();
}

/**
 * Generates a filename based on the pattern: 
 * [TIPO]_[Descripcion]_[Fecha]_[Iniciales]_[Lugar].[ext]
 * Example: CAP_Uso_EPP_2026-01-25_JLC_Zona1.jpg
 */
export function generateFilename(
    description: string,
    date: string,
    responsible: string,
    extension: string,
    tipo?: string,
    lugar?: string,
    area?: string
): string {
    // Mapeo de tipos a abreviaturas
    const tipoMap: Record<string, string> = {
        'capacitacion': 'CAP',
        'induccion_gen': 'IND-G',
        'induccion_esp': 'IND-E',
        'entrenamiento': 'ENT',
        'charla': 'CHA',
        'difusion': 'DIF',
        'inspeccion': 'INSP',
        'evidencia': 'EVID',
        'objetivo': 'OBJ',
        'pma': 'PMA',
        'ats': 'ATS',
        'petar': 'PETAR'
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
    const cleanDesc = (description || 'Sin_Descripcion').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, '').replace(/\s+/g, '_').substring(0, 30);
    const initials = getInitials(responsible || 'NN');
    const cleanLugar = lugar ? lugar.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10) : '';

    // Formato: [AREA][TIPO]_Descripcion_Fecha_Iniciales.ext
    const combinedPrefix = `${areaPrefix}${tipoPrefix}`;
    const parts = [combinedPrefix, cleanDesc, date || 'Sin_Fecha'];
    if (initials) parts.push(initials);
    if (cleanLugar) parts.push(cleanLugar);

    return `${parts.join('_')}.${extension}`;
}

/**
 * Generates a folder name based on the pattern:
 * [YYYY-MM]_[TIPO]_[Descripcion]
 * Example: 2026-01_CAP_Uso_EPP
 */
export function generateFolderName(
    description: string,
    date: string,
    tipo?: string
): string {
    const tipoMap: Record<string, string> = {
        'capacitacion': 'CAP',
        'induccion_gen': 'IND',
        'induccion_esp': 'IND',
        'entrenamiento': 'ENT',
        'charla': 'CHA',
        'difusion': 'DIF',
        'inspeccion': 'INSP',
        'evidencia': 'EVID',
        'objetivo': 'OBJ'
    };

    const yearMonth = date ? date.substring(0, 7) : new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' }).substring(0, 7);
    const tipoPrefix = tipo ? (tipoMap[tipo.toLowerCase()] || tipo.substring(0, 4).toUpperCase()) : 'DOC';
    const cleanDesc = (description || 'Sin_Descripcion').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, '').replace(/\s+/g, '_').substring(0, 40);

    return `${yearMonth}_${tipoPrefix}_${cleanDesc}`;
}

/**
 * Standardizes Google Drive URLs.
 * If isThumbnail is true, returns a direct image link via the thumbnail API (useful for <img> tags).
 * If isThumbnail is false, returns the /preview URL (useful for <iframe> native viewer).
 */
export function getDriveViewerUrl(url: string | null | undefined, isThumbnail: boolean = false): string {
    if (!url) return '';
    if (url.includes('drive.google.com/file/d/')) {
        const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            if (isThumbnail) {
                return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
            } else {
                return `https://drive.google.com/file/d/${match[1]}/preview`;
            }
        }
    }
    }
    return url;
}

/**
 * Returns a direct download URL for Google Drive.
 */
export function getDriveDownloadUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.includes('drive.google.com/file/d/')) {
        const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            return `https://drive.google.com/uc?export=download&id=${match[1]}`;
        }
    }
    return url;
}

/**
 * Triggers a ZIP download of multiple files via the server API.
 */
export async function handleBulkDownload(records: any[], zipName: string = 'documentos.zip', onProgress?: (msg: string) => void) {
    if (!records || records.length === 0) {
        alert('No hay documentos para descargar.');
        return;
    }

    if (onProgress) onProgress('Preparando descarga masiva...');

    const files = records.map((r, i) => {
        let title = r.documentType || r.certType || r.wasteType || 'Documento';
        title = title.replace(/[^a-zA-Z0-9]/g, '_');
        const ext = r.fileUrls?.[0]?.toLowerCase().includes('.pdf') ? 'pdf' : 'pdf'; // Default to pdf or extract from url
        const filename = `${r.date}_${title}_${i + 1}.${ext}`;
        return {
            url: r.fileUrls?.[0],
            filename
        };
    }).filter(f => f.url);

    if (files.length === 0) {
        alert('No se encontraron archivos válidos.');
        if (onProgress) onProgress('');
        return;
    }

    try {
        const response = await fetch('/api/download-zip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ files, zipName })
        });

        if (!response.ok) {
            throw new Error('Error al generar el ZIP. Puede que los archivos sean demasiado grandes.');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = zipName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        if (onProgress) onProgress('');
    } catch (error) {
        console.error('Download error:', error);
        alert('Hubo un problema descargando los archivos. Intente con menos registros o individualmente.');
        if (onProgress) onProgress('');
    }
}

/**
 * Ensures a value is a string. If it's an object with label/id, extracts those.
 */
export function sanitizeValue(val: any): string {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
        // Handle common object shapes
        if (val.label !== undefined) return sanitizeValue(val.label);
        if (val.id !== undefined) return sanitizeValue(val.id);
        if (val.name !== undefined) return sanitizeValue(val.name);
        return JSON.stringify(val);
    }
    return String(val);
}

/**
 * Sanitizes an array of objects by ensuring common fields are strings.
 */
export function sanitizeRecords<T extends Record<string, any>>(records: T[], fields: (keyof T)[]): T[] {
    if (!Array.isArray(records)) return [];
    return records.map(record => {
        const newRecord = { ...record };
        fields.forEach(field => {
            if (newRecord[field] !== undefined) {
                newRecord[field] = sanitizeValue(newRecord[field]) as any;
            }
        });
        return newRecord;
    });
}
