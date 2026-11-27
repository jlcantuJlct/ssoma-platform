import * as XLSX from 'xlsx';

export interface InspectionSubprogramItem {
    item: number;
    title: string;
    formCode?: string;
    responsable?: string;
    programmed: number[]; // 12 months
    executed: number[];   // 12 months
}

export interface InspectionSubprogram {
    id: string;
    code: string;
    version: string;
    title: string;
    areaName: string;
    sede: string;
    fechaActualizacion: string;
    items: InspectionSubprogramItem[];
}

// ── 1. SUBPROGRAMA DE INSPECCIONES DE SEGURIDAD (Prevencionistas / SSOMA) ──
// 14 Ítems Oficiales F-SIG-067 (Sin "hora de la seguridad", Ene=0, Andamios Mar-Jul=1, Caídas Abr-Jun=2)
export const DEFAULT_SUBPROGRAM_INSPECCIONES_SEGURIDAD: InspectionSubprogram = {
    id: 'subprog_insp_seguridad',
    code: 'F-SIG-067',
    version: '01',
    title: 'PROGRAMA ANUAL DE INSPECCIONES OPERACIONALES — SEGURIDAD',
    areaName: 'Prevencionistas / SSOMA',
    sede: 'Red Vial 6 (Obras Nuevas - Zona Industrial Pisco)',
    fechaActualizacion: '29 de Noviembre 2026',
    items: [
        {
            item: 1,
            title: 'Inspecciones y observaciones maquinaria Línea amarilla (Excavadoras, retro, cargador, tractor, moto niveladora, cisterna de agua)',
            formCode: 'F-OP-015 V02 22.12.16 Maquinaria Pesada',
            responsable: 'Prevencionistas',
            programmed: [0, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1],
            executed:   [0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0]
        },
        {
            item: 2,
            title: 'Inspecciones y observaciones vehículos (Volquetes, camionetas, camiones.)',
            formCode: 'F-OP-010 V02 22.12.16 Vehiculos',
            responsable: 'Prevencionistas',
            programmed: [0, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1],
            executed:   [0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0]
        },
        {
            item: 3,
            title: 'Inspección de Equipos de Emergencia (Extintores)',
            formCode: 'F-SIG-058 Registro de inspección de equipos de seguridad o emergencia',
            responsable: 'Prevencionistas',
            programmed: [0, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1],
            executed:   [0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0]
        },
        {
            item: 4,
            title: 'Inspección de generador, tableros eléctrico',
            formCode: 'F-SIG-075 Inspeccion de Instalaciones Eléctricas V01',
            responsable: 'Prevencionistas',
            programmed: [0, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1],
            executed:   [0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0]
        },
        {
            item: 5,
            title: 'Inspección de taller de soldadura / mecánico',
            formCode: 'F-SIG-078 INSPECCIÓN DE TALLER DE SOLDADURA',
            responsable: 'Prevencionistas',
            programmed: [0, 0, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1],
            executed:   [0, 0, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0]
        },
        {
            item: 6,
            title: 'Inspección de EPP básico o específico (Cantidad refiere a la cantidad de personas)',
            formCode: 'F-SIG-074 INSPECCION DE EQUIPOS DE PROTECCIÓN PERSONAL',
            responsable: 'Prevencionistas',
            programmed: [0, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1],
            executed:   [0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0]
        },
        {
            item: 7,
            title: 'Inspección de almacenes y almacén de productos químicos',
            formCode: 'F-SIG-028 Inspeccion Almacén V09',
            responsable: 'Prevencionistas',
            programmed: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            executed:   [0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 8,
            title: 'Inspección de Equipo contra caídas (arnés, línea de vida, etc.)',
            formCode: 'F-OP-017 INSPECCIÓN DE EQUIPOS CONTRA CAIDA',
            responsable: 'Prevencionistas',
            programmed: [0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0],
            executed:   [0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 9,
            title: 'Inspección de escalera o andamios',
            formCode: 'F-OP-001 CHECK LIST DE ANDAMIOS / F-OP-018 INSPECCIÓN DE ESCALERAS',
            responsable: 'Prevencionistas',
            programmed: [0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
            executed:   [0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 10,
            title: 'Inspección de laboratorio (Suelos y Pavimentos)',
            formCode: 'F-SIG-077 INSPECCIÓN DE LABORATORIO',
            responsable: 'Prevencionistas',
            programmed: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            executed:   [0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0]
        },
        {
            item: 11,
            title: 'Inspección de laboratorio (Concreto)',
            formCode: 'F-SIG-077 INSPECCIÓN DE LABORATORIO',
            responsable: 'Prevencionistas',
            programmed: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            executed:   [0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0]
        },
        {
            item: 12,
            title: 'Inspección de planta de asfalto',
            formCode: 'LISTA DE CHEQUEO DE PLANTA DE ASFALTO',
            responsable: 'Prevencionistas',
            programmed: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            executed:   [0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0]
        },
        {
            item: 13,
            title: 'Inspección de planta de concreto',
            formCode: 'LISTA DE CHEQUEO DE PLANTA DE CONCRETO',
            responsable: 'Prevencionistas',
            programmed: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            executed:   [0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0]
        },
        {
            item: 14,
            title: 'Inspección de planta de Chancado',
            formCode: 'LISTA DE CHEQUEO DE PLANTA DE AGREGADOS',
            responsable: 'Prevencionistas',
            programmed: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            executed:   [0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0]
        }
    ]
};

// ── 2. SUBPROGRAMA DE INSPECCIONES DE MEDIO AMBIENTE (Asistente MA) ──
export const DEFAULT_SUBPROGRAM_INSPECCIONES_MA: InspectionSubprogram = {
    id: 'subprog_insp_ma',
    code: 'F-SIG-067',
    version: '01',
    title: 'PROGRAMA ANUAL DE INSPECCIONES OPERACIONALES — MEDIO AMBIENTE',
    areaName: 'Asistente de Medio Ambiente',
    sede: 'Red Vial 6 (Obras Nuevas - Zona Industrial Pisco)',
    fechaActualizacion: '29 de Noviembre 2026',
    items: [
        {
            item: 1,
            title: 'Inspección de residuos sólidos',
            formCode: '(F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente',
            responsable: 'Asistente MA',
            programmed: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            executed:   [0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0]
        },
        {
            item: 2,
            title: 'Inspección de Kit antiderrames',
            formCode: 'F-SIG-076 INSPECCION DE KIT ANTIDERRAME',
            responsable: 'Asistente MA',
            programmed: [0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
            executed:   [0, 1, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0]
        }
    ]
};

// ── 3. SUBPROGRAMA DE INSPECCIONES DE SALUD OCUPACIONAL (Lic. Enfermería) ──
export const DEFAULT_SUBPROGRAM_INSPECCIONES_SALUD: InspectionSubprogram = {
    id: 'subprog_insp_salud',
    code: 'F-SIG-067',
    version: '01',
    title: 'PROGRAMA ANUAL DE INSPECCIONES OPERACIONALES — SALUD OCUPACIONAL',
    areaName: 'Lic. Enfermería',
    sede: 'Red Vial 6 (Obras Nuevas - Zona Industrial Pisco)',
    fechaActualizacion: '29 de Noviembre 2026',
    items: [
        {
            item: 1,
            title: 'Inspecciones botiquines',
            formCode: 'F-SIG-030 INSPECCIÓN DE BOTIQUÍN',
            responsable: 'Lic. Enfermeria',
            programmed: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            executed:   [0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0]
        },
        {
            item: 2,
            title: 'Inspecciones Estaciones de emergencia',
            formCode: 'F-SIG-058 Registro de inspección de equipos de seguridad o emergencia',
            responsable: 'Lic. Enfermeria',
            programmed: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            executed:   [0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0]
        },
        {
            item: 3,
            title: 'Inspección de puntos de hidratación',
            formCode: 'F-SIG-073 Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente',
            responsable: 'Lic. Enfermeria',
            programmed: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            executed:   [0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0]
        },
        {
            item: 4,
            title: 'Inspección de puntos de protección solar',
            formCode: 'F-SIG-073 Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente',
            responsable: 'Lic. Enfermeria',
            programmed: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            executed:   [0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0]
        },
        {
            item: 5,
            title: 'Inspección de lavaderos de manos y servicios higiénicos',
            formCode: 'F-SIG-073 Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente',
            responsable: 'Lic. Enfermeria',
            programmed: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            executed:   [0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0]
        },
        {
            item: 6,
            title: 'Inspección de cocina y comedor',
            formCode: 'F-SIG-073 Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente',
            responsable: 'Lic. Enfermeria',
            programmed: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            executed:   [0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0]
        },
        {
            item: 7,
            title: 'Inspección de EPP médica',
            formCode: 'F-SIG-074 INSPECCION DE EQUIPOS DE PROTECCIÓN PERSONAL',
            responsable: 'Lic. Enfermeria',
            programmed: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            executed:   [0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0]
        },
        {
            item: 8,
            title: 'Inspección de tópico',
            formCode: 'F-SIG-073 Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente',
            responsable: 'Lic. Enfermeria',
            programmed: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            executed:   [0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0]
        }
    ]
};

// ── 4. SUBPROGRAMA DE INSPECCIONES DEL SUBCOMITÉ SCSST (Trimestral) ──
export const DEFAULT_SUBPROGRAM_INSPECCIONES_SCSST: InspectionSubprogram = {
    id: 'subprog_insp_scsst',
    code: 'F-SIG-067',
    version: '01',
    title: 'PROGRAMA ANUAL DE INSPECCIONES OPERACIONALES — SUBCOMITÉ SCSST',
    areaName: 'Subcomité SCSST',
    sede: 'Red Vial 6 (Obras Nuevas - Zona Industrial Pisco)',
    fechaActualizacion: '29 de Noviembre 2026',
    items: [
        {
            item: 1,
            title: 'Inspección trimestral de seguridad y salud en el trabajo del SCSST',
            formCode: 'Acta de Inspección Trimestral SCSST',
            responsable: 'Subcomité SCSST',
            programmed: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
            executed:   [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0]
        }
    ]
};

/**
 * Normaliza cadenas para comparación insensible a tildes, espacios y mayúsculas
 */
function normalize(str: string): string {
    return (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
}

/**
 * Vincula inspecciones registradas en el sistema con el tema del subprograma
 */
export function matchInspectionRecordsForTopic(
    topicTitle: string,
    formCode: string | undefined,
    monthIdx: number,
    records: any[]
): any[] {
    if (!records || records.length === 0) return [];

    const normTopic = normalize(topicTitle);
    const normCode = normalize(formCode || '');

    return records.filter(r => {
        const rawDate = r.date || r.fecha || r.created_at;
        if (!rawDate) return false;

        // Extracción robusta de mes sin desfases por zona horaria UTC
        let m = -1;
        if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
            m = parseInt(rawDate.split('-')[1], 10) - 1;
        } else if (typeof rawDate === 'string' && /^\d{2}\/\d{2}\/\d{4}/.test(rawDate)) {
            m = parseInt(rawDate.split('/')[1], 10) - 1;
        } else {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) m = d.getMonth();
        }
        if (m !== monthIdx) return false;

        const hayTitle = normalize(r.inspectionType || r.inspection_type || r.title || r.tipo || r.area || '');
        const hayCode = normalize(r.form_code || r.code || '');

        if (hayTitle && (normTopic.includes(hayTitle) || hayTitle.includes(normTopic))) return true;
        if (hayCode && normCode && (normCode.includes(hayCode) || hayCode.includes(normCode))) return true;

        if (normTopic.includes('maquinaria') && hayTitle.includes('maquinaria')) return true;
        if (normTopic.includes('vehiculo') && hayTitle.includes('vehiculo')) return true;
        if (normTopic.includes('extintor') && hayTitle.includes('extintor')) return true;
        if (normTopic.includes('epp') && hayTitle.includes('epp')) return true;
        if (normTopic.includes('botiquin') && hayTitle.includes('botiquin')) return true;
        if (normTopic.includes('tablero') && (hayTitle.includes('tablero') || hayTitle.includes('electr'))) return true;
        if (normTopic.includes('caida') && hayTitle.includes('caida')) return true;
        if (normTopic.includes('andamio') && (hayTitle.includes('andamio') || hayTitle.includes('escalera'))) return true;
        if (normTopic.includes('residuo') && hayTitle.includes('residuo')) return true;
        if (normTopic.includes('antiderr') && hayTitle.includes('antiderr')) return true;
        if (normTopic.includes('scsst') && (hayTitle.includes('scsst') || hayTitle.includes('subcomite') || hayTitle.includes('comite'))) return true;
        if (normTopic.includes('cocina') && (hayTitle.includes('cocina') || hayTitle.includes('comedor'))) return true;
        if (normTopic.includes('topico') && hayTitle.includes('topico')) return true;
        if (normTopic.includes('herramienta') && hayTitle.includes('herramienta')) return true;
        if (normTopic.includes('taller') && hayTitle.includes('taller')) return true;
        if (normTopic.includes('almacen') && hayTitle.includes('almacen')) return true;
        if (normTopic.includes('senalizacion') && hayTitle.includes('senalizacion')) return true;
        if (normTopic.includes('campamento') && hayTitle.includes('campamento')) return true;
        if (normTopic.includes('estacion') && (hayTitle.includes('estacion') || hayTitle.includes('primerosauxilios'))) return true;

        return false;
    });
}

/**
 * Vincula inspecciones del SCSST registradas en Control SCSST (evidence_center_records)
 */
export function matchScsstInspectionRecords(
    monthIdx: number,
    evidenceRecords: any[]
): any[] {
    if (!evidenceRecords || evidenceRecords.length === 0) return [];

    return evidenceRecords.filter(rec => {
        if (!rec) return false;
        const rawDate = rec.date || rec.fecha || rec.created_at;
        if (!rawDate) return false;

        let m = -1;
        if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
            const parts = rawDate.split('-');
            m = parseInt(parts[1], 10) - 1;
        } else {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) m = d.getMonth();
        }
        if (m !== monthIdx) return false;

        const isScsstObj = String(rec.objective || '').toUpperCase().includes('OBJ 01') || String(rec.objective || '').toUpperCase().includes('OBJ 1');
        const act = normalize(rec.activity || rec.description || '');

        // Excluir capacitaciones u otras actividades no relacionadas
        if (act.includes('capacitac')) return false;

        return (isScsstObj || act.includes('scsst') || act.includes('subcomite')) && (act.includes('inspecci') || act.includes('trimestral'));
    });
}

/**
 * Parser inteligente de libros Excel para el formato oficial F-SIG-067.
 * Soporta tanto:
 *  - Formato A (Oficial F-SIG-067): 1 columna por mes (ENE..DIC) y 3 filas por ítem (Responsable / Programado / Ejecutado)
 *  - Formato B (Exportado Plataforma): 2 columnas por mes (P / E) y 1 fila por ítem
 */
export function parseInspectionExcelFile(buffer: ArrayBuffer): {
    seguridad?: InspectionSubprogram;
    medioAmbiente?: InspectionSubprogram;
    salud?: InspectionSubprogram;
    scsst?: InspectionSubprogram;
    totalItems: number;
} {
    const wb = XLSX.read(buffer, { type: 'array' });
    let totalItems = 0;
    let seguridadResult: InspectionSubprogram | undefined;
    let maResult: InspectionSubprogram | undefined;
    let saludResult: InspectionSubprogram | undefined;
    let scsstResult: InspectionSubprogram | undefined;

    const normText = (v: any) => String(v ?? '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const MONTH_PATTERNS: string[][] = [
        ['ENE', 'ENERO', 'JAN'],
        ['FEB', 'FEBRERO'],
        ['MAR', 'MARZO'],
        ['ABR', 'ABRIL', 'APR'],
        ['MAY', 'MAYO'],
        ['JUN', 'JUNIO'],
        ['JUL', 'JULIO'],
        ['AGO', 'AGOSTO', 'AUG'],
        ['SET', 'SEP', 'SETIEMBRE', 'SEPTIEMBRE'],
        ['OCT', 'OCTUBRE'],
        ['NOV', 'NOVIEMBRE'],
        ['DIC', 'DICIEMBRE', 'DEC']
    ];

    const splitTitleAndCode = (raw: string): { title: string; formCode: string } => {
        const cleaned = String(raw || '').trim();
        const lines = cleaned.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length >= 2) {
            return {
                title: lines[0],
                formCode: lines.slice(1).join(' ')
            };
        }
        const codeMatch = cleaned.match(/(\(?F-(?:SIG|OP)-\d+.*|LISTA DE CHEQUEO.*)/i);
        if (codeMatch && codeMatch.index && codeMatch.index > 3) {
            return {
                title: cleaned.slice(0, codeMatch.index).trim(),
                formCode: codeMatch[1].trim()
            };
        }
        return { title: cleaned, formCode: '' };
    };

    const detectAreaFromSheetName = (name: string): 'seguridad' | 'ma' | 'salud' | 'scsst' | null => {
        const sLower = normText(name).toLowerCase();
        if (sLower.includes('scsst') || sLower.includes('subcomit') || sLower.includes('comite')) return 'scsst';
        if (sLower.includes('salud') || sLower.includes('medic') || sLower.includes('enferm')) return 'salud';
        if (sLower.includes('medio') || sLower.includes('ambient') || /\bma\b/.test(sLower)) return 'ma';
        if (sLower.includes('seguridad') || sLower.includes('prevencion') || sLower.includes('seg')) return 'seguridad';
        return null;
    };

    const detectAreaFromItems = (items: InspectionSubprogramItem[]): 'seguridad' | 'ma' | 'salud' | 'scsst' => {
        const allResp = items.map(i => normText(i.responsable)).join(' ');
        const allTitles = items.map(i => normText(i.title)).join(' ');
        if (items.length <= 2 && (allResp.includes('SCSST') || allTitles.includes('SCSST'))) return 'scsst';
        if (allResp.includes('ENFERM') || allResp.includes('MEDIC') || allTitles.includes('BOTIQUIN') || allTitles.includes('TOPICO')) return 'salud';
        if (allResp.includes('ASISTENTE MA') || allResp.includes('AMBIENT') || allTitles.includes('RESIDUOS') || allTitles.includes('ANTIDERRAME')) return 'ma';
        return 'seguridad';
    };

    const toNum = (v: any): number => {
        if (typeof v === 'number') return isNaN(v) ? 0 : v;
        const s = String(v ?? '').trim();
        if (!s || !/^\d+(\.\d+)?$/.test(s)) return 0;
        const n = Number(s);
        return isNaN(n) ? 0 : n;
    };

    wb.SheetNames.forEach(sheetName => {
        const ws = wb.Sheets[sheetName];
        if (!ws) return;
        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (data.length < 5) return;

        // Extraer metadatos si existen (Sede y Fecha)
        let sede = 'Red Vial 6 (Obras Nuevas - Zona Industrial Pisco)';
        let fechaActualizacion = '29 de Noviembre 2026';
        for (let r = 0; r < Math.min(data.length, 15); r++) {
            const row = data[r] || [];
            for (let c = 0; c < row.length - 1; c++) {
                const label = normText(row[c]);
                if (label.includes('SEDE') || label.includes('PROYECTO')) {
                    const val = row.slice(c + 1).find(x => String(x ?? '').trim().length > 2);
                    if (val) sede = String(val).trim();
                } else if (label.includes('FECHA DE ACTUALIZ')) {
                    const val = row.slice(c + 1).find(x => String(x ?? '').trim().length > 2);
                    if (val) fechaActualizacion = String(val).trim();
                }
            }
        }

        // Buscar la fila de encabezado con al menos 6 meses (ENE..DIC)
        let headerRowIdx = -1;
        let monthCols: number[] = new Array(12).fill(-1);

        for (let r = 0; r < Math.min(data.length, 30); r++) {
            const row = data[r] || [];
            const candidateCols = new Array(12).fill(-1);
            let foundCount = 0;
            for (let mIdx = 0; mIdx < 12; mIdx++) {
                for (let c = 0; c < row.length; c++) {
                    const cell = normText(row[c]);
                    if (!cell) continue;
                    if (MONTH_PATTERNS[mIdx].some(p => cell === p || cell.startsWith(p))) {
                        candidateCols[mIdx] = c;
                        foundCount++;
                        break;
                    }
                }
            }
            if (foundCount >= 10) {
                headerRowIdx = r;
                monthCols = candidateCols;
                break;
            }
        }

        if (headerRowIdx === -1) return;

        const firstMonthCol = Math.min(...monthCols.filter(c => c !== -1));
        const subRow = data[headerRowIdx + 1] || [];
        const pCountInSubRow = subRow.filter(c => normText(c) === 'P').length;
        const isSideBySidePE = pCountInSubRow >= 10;

        // Verificar si es formato de 3 filas apiladas (Responsable / Programado / Ejecutado)
        let hasStackedRows = false;
        if (!isSideBySidePE) {
            for (let r = headerRowIdx + 1; r < Math.min(data.length, headerRowIdx + 12); r++) {
                const row = data[r] || [];
                const leftCells = row.slice(0, Math.max(firstMonthCol + 1, 4)).map(normText);
                if (leftCells.some(c => c === 'PROGRAMADO' || c === 'EJECUTADO' || c === 'RESPONSABLE')) {
                    hasStackedRows = true;
                    break;
                }
            }
        }

        const parsedItems: InspectionSubprogramItem[] = [];

        if (hasStackedRows) {
            // ── FORMATO A: Oficial F-SIG-067 (Responsable / Programado / Ejecutado en filas apiladas) ──
            let currentTitleRaw = '';
            let currentResp = '';
            let currentProg: number[] | null = null;
            let currentExec: number[] | null = null;

            const flushItem = () => {
                if (!currentTitleRaw || !currentProg) return;
                if (currentTitleRaw.toLowerCase().includes('hora de la seguridad')) return;
                const { title, formCode } = splitTitleAndCode(currentTitleRaw);
                if (!title) return;
                parsedItems.push({
                    item: parsedItems.length + 1,
                    title,
                    formCode,
                    responsable: currentResp || 'Prevencionistas',
                    programmed: currentProg,
                    executed: currentExec || new Array(12).fill(0)
                });
                currentTitleRaw = '';
                currentResp = '';
                currentProg = null;
                currentExec = null;
            };

            for (let r = headerRowIdx + 1; r < data.length; r++) {
                const row = data[r];
                if (!row || row.length === 0) continue;

                const rowJoinedLeft = row.slice(0, Math.max(firstMonthCol + 1, 4)).map(normText);
                if (rowJoinedLeft.some(c => c.includes('TOTAL POR MES') || c.includes('CUMPLIMIENTO EN %'))) {
                    flushItem();
                    break;
                }

                // Determinar el tipo de fila (Responsable / Programado / Ejecutado)
                const isRespRow = rowJoinedLeft.some(c => c === 'RESPONSABLE');
                const isProgRow = rowJoinedLeft.some(c => c === 'PROGRAMADO');
                const isExecRow = rowJoinedLeft.some(c => c === 'EJECUTADO');

                // Buscar texto de título en las columnas previas a las etiquetas
                let rowTitle = '';
                for (let c = 0; c < firstMonthCol; c++) {
                    const rawCell = String(row[c] ?? '').trim();
                    const up = normText(rawCell);
                    if (rawCell.length > 4 && up !== 'RESPONSABLE' && up !== 'PROGRAMADO' && up !== 'EJECUTADO' && !/^\d+$/.test(up)) {
                        rowTitle = rawCell;
                        break;
                    }
                }

                if (rowTitle && (isRespRow || isProgRow)) {
                    // Nuevo ítem
                    flushItem();
                    currentTitleRaw = rowTitle;
                } else if (isRespRow && !rowTitle) {
                    // Fila de responsable vacía (bloque en blanco al final de la hoja)
                    flushItem();
                    continue;
                }

                if (!currentTitleRaw) continue;

                if (isRespRow) {
                    // Tomar el primer responsable no vacío bajo las columnas de meses
                    for (let m = 0; m < 12; m++) {
                        const col = monthCols[m];
                        if (col === -1) continue;
                        const val = String(row[col] ?? '').trim();
                        const up = normText(val);
                        if (val && up !== 'RESPONSABLE' && up !== '0') {
                            currentResp = val;
                            break;
                        }
                    }
                } else if (isProgRow) {
                    const prog = new Array(12).fill(0);
                    for (let m = 0; m < 12; m++) {
                        const col = monthCols[m];
                        if (col !== -1) prog[m] = toNum(row[col]);
                    }
                    currentProg = prog;
                } else if (isExecRow) {
                    const exec = new Array(12).fill(0);
                    for (let m = 0; m < 12; m++) {
                        const col = monthCols[m];
                        if (col !== -1) exec[m] = toNum(row[col]);
                    }
                    currentExec = exec;
                    flushItem();
                }
            }
            flushItem();
        } else {
            // ── FORMATO B: Columnas P/E lado a lado (Exportado desde Plataforma) ──
            const monthColMap: { [m: number]: { p: number; e: number } } = {};
            if (isSideBySidePE) {
                const pCols: number[] = [];
                for (let c = 0; c < subRow.length; c++) {
                    if (normText(subRow[c]) === 'P') pCols.push(c);
                }
                pCols.slice(0, 12).forEach((pCol, idx) => {
                    monthColMap[idx] = { p: pCol, e: pCol + 1 };
                });
            } else {
                monthCols.forEach((col, idx) => {
                    if (col !== -1) monthColMap[idx] = { p: col, e: col + 1 };
                });
            }

            if (Object.keys(monthColMap).length < 10) return;

            for (let r = headerRowIdx + (isSideBySidePE ? 2 : 1); r < data.length; r++) {
                const row = data[r];
                if (!row || row.length === 0) continue;

                const firstStr = normText(row[0] || row[1]);
                if (firstStr.includes('TOTAL') || firstStr.includes('PORCENTAJE') || firstStr.includes('CUMPLIMIENTO')) break;

                let itemNum: number | null = null;
                let title = '';
                let formCode = '';
                let responsable = '';

                for (let c = 0; c < 3; c++) {
                    const val = Number(row[c]);
                    if (!isNaN(val) && val > 0 && Number.isInteger(val)) {
                        itemNum = val;
                        title = String(row[c + 1] || '').trim();
                        formCode = String(row[c + 2] || '').trim();
                        responsable = String(row[c + 3] || '').trim();
                        break;
                    }
                }

                if (!itemNum || !title) continue;
                if (title.toLowerCase().includes('hora de la seguridad')) continue;

                const prog = new Array(12).fill(0);
                const exec = new Array(12).fill(0);
                for (let m = 0; m < 12; m++) {
                    const pCol = monthColMap[m]?.p;
                    const eCol = monthColMap[m]?.e;
                    if (pCol !== undefined) prog[m] = toNum(row[pCol]);
                    if (eCol !== undefined) exec[m] = toNum(row[eCol]);
                }

                parsedItems.push({
                    item: itemNum,
                    title,
                    formCode,
                    responsable,
                    programmed: prog,
                    executed: exec
                });
            }
        }

        if (parsedItems.length > 0) {
            totalItems += parsedItems.length;
            const targetType = detectAreaFromSheetName(sheetName) || detectAreaFromItems(parsedItems);
            const subprogram: InspectionSubprogram = {
                id: targetType === 'scsst' ? 'subprog_insp_scsst' : targetType === 'salud' ? 'subprog_insp_salud' : targetType === 'ma' ? 'subprog_insp_ma' : 'subprog_insp_seguridad',
                code: 'F-SIG-067',
                version: '01',
                title: `PROGRAMA ANUAL DE INSPECCIONES OPERACIONALES — ${targetType.toUpperCase()}`,
                areaName: targetType === 'scsst' ? 'Subcomité SCSST' : targetType === 'salud' ? 'Lic. Enfermería' : targetType === 'ma' ? 'Asistente de Medio Ambiente' : 'Prevencionistas / SSOMA',
                sede,
                fechaActualizacion,
                items: parsedItems
            };

            if (targetType === 'scsst') scsstResult = subprogram;
            else if (targetType === 'salud') saludResult = subprogram;
            else if (targetType === 'ma') maResult = subprogram;
            else seguridadResult = subprogram;
        }
    });

    return {
        seguridad: seguridadResult,
        medioAmbiente: maResult,
        salud: saludResult,
        scsst: scsstResult,
        totalItems
    };
}

/**
 * Genera el libro Excel oficial F-SIG-067 con todas las pestañas,
 * integrando las cantidades en P y en E según la plataforma y Control SCSST
 */
export function generateInspectionExcelWorkbook(
    subprograms: Record<string, InspectionSubprogram>,
    inspectionRecords: any[] = [],
    evidenceRecords: any[] = []
): XLSX.WorkBook {
    const wb = XLSX.utils.book_new();
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'];

    const targets: { key: string; name: string; defaultProg: InspectionSubprogram; isScsst: boolean }[] = [
        { key: 'subprog_insp_seguridad', name: 'Insp. Seguridad', defaultProg: DEFAULT_SUBPROGRAM_INSPECCIONES_SEGURIDAD, isScsst: false },
        { key: 'subprog_insp_ma', name: 'Insp. Medio Ambiente', defaultProg: DEFAULT_SUBPROGRAM_INSPECCIONES_MA, isScsst: false },
        { key: 'subprog_insp_salud', name: 'Insp. Salud Ocupacional', defaultProg: DEFAULT_SUBPROGRAM_INSPECCIONES_SALUD, isScsst: false },
        { key: 'subprog_insp_scsst', name: 'Insp. Subcomite SCSST', defaultProg: DEFAULT_SUBPROGRAM_INSPECCIONES_SCSST, isScsst: true }
    ];

    targets.forEach(({ key, name, defaultProg, isScsst }) => {
        const prog = subprograms[key] || defaultProg;
        const wsData: any[][] = [];

        wsData.push(['', '', 'PROGRAMA ANUAL DE INSPECCIONES OPERACIONALES', '', '', '', '', '', '', '', '', '', '', '', '', 'Código:', 'F-SIG-067']);
        wsData.push([]);
        wsData.push(['', 'SEDE / PROYECTO:', '', prog.sede || 'Red Vial 6 (Obras Nuevas - Zona Industrial Pisco)']);
        wsData.push(['', 'ÁREA / RESPONSABLE:', '', prog.areaName]);
        wsData.push(['', 'FECHA DE ACTUALIZACIÓN:', '', prog.fechaActualizacion || '29 de Noviembre 2026']);
        wsData.push([]);

        const h1 = ['ITEM', 'INSPECCIONES OPERACIONALES', 'CÓDIGO DE REGISTRO', 'RESPONSABLE'];
        months.forEach(m => {
            h1.push(m, '');
        });
        h1.push('TOTAL P', 'TOTAL E', '% CUMP');
        wsData.push(h1);

        const h2 = ['', '', '', ''];
        months.forEach(() => {
            h2.push('P', 'E');
        });
        h2.push('', '', '');
        wsData.push(h2);

        const monthlyTotalsP = new Array(12).fill(0);
        const monthlyTotalsE = new Array(12).fill(0);

        const items = prog.items || [];
        items.forEach(it => {
            const row: any[] = [it.item, it.title, it.formCode || '', it.responsable || ''];
            let totP = 0;
            let totE = 0;

            for (let m = 0; m < 12; m++) {
                const p = (it.programmed && it.programmed[m]) || 0;
                let e = 0;

                if (p > 0) {
                    if (isScsst) {
                        const matched = matchScsstInspectionRecords(m, evidenceRecords);
                        e = matched.length > 0 ? matched.length : ((it.executed && it.executed[m]) || 0);
                    } else {
                        const matched = matchInspectionRecordsForTopic(it.title, it.formCode, m, inspectionRecords);
                        e = matched.length > 0 ? matched.length : ((it.executed && it.executed[m]) || 0);
                    }
                }

                totP += p;
                totE += e;
                monthlyTotalsP[m] += p;
                monthlyTotalsE[m] += e;

                row.push(p > 0 ? p : '', e > 0 ? e : '');
            }

            const pct = totP > 0 ? Math.round((totE / totP) * 100) + '%' : '-';
            row.push(totP, totE, pct);
            wsData.push(row);
        });

        // Totales al pie de página
        const sumTotalP = monthlyTotalsP.reduce((a, b) => a + b, 0);
        const sumTotalE = monthlyTotalsE.reduce((a, b) => a + b, 0);

        const totRowP: any[] = ['TOTAL PROGRAMADO (P)', '', '', ''];
        months.forEach((_, m) => {
            totRowP.push(monthlyTotalsP[m], '');
        });
        totRowP.push(sumTotalP, '', '100%');
        wsData.push(totRowP);

        const totRowE: any[] = ['TOTAL EJECUTADO (E)', '', '', ''];
        months.forEach((_, m) => {
            totRowE.push('', monthlyTotalsE[m]);
        });
        totRowE.push('', sumTotalE, sumTotalP > 0 ? Math.round((sumTotalE / sumTotalP) * 100) + '%' : '0%');
        wsData.push(totRowE);

        const pctRow: any[] = ['% CUMPLIMIENTO MENSUAL', '', '', ''];
        months.forEach((_, m) => {
            const p = monthlyTotalsP[m];
            const e = monthlyTotalsE[m];
            const pct = p > 0 ? Math.round((e / p) * 100) + '%' : '-';
            pctRow.push(pct, '');
        });
        pctRow.push('', '', sumTotalP > 0 ? Math.round((sumTotalE / sumTotalP) * 100) + '%' : '0%');
        wsData.push(pctRow);

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, name);
    });

    return wb;
}
