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

    const yearMonth = date ? date.substring(0, 7) : new Date().toISOString().substring(0, 7);
    const tipoPrefix = tipo ? (tipoMap[tipo.toLowerCase()] || tipo.substring(0, 4).toUpperCase()) : 'DOC';
    const cleanDesc = (description || 'Sin_Descripcion').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, '').replace(/\s+/g, '_').substring(0, 40);

    return `${yearMonth}_${tipoPrefix}_${cleanDesc}`;
}
