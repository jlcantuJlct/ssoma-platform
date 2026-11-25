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
        const d = new Date(rawDate);
        if (isNaN(d.getTime())) return false;
        if (d.getMonth() !== monthIdx) return false;

        const hayTitle = normalize(r.inspection_type || r.title || r.tipo || r.area || '');
        const hayCode = normalize(r.form_code || r.code || '');

        if (hayTitle && normTopic.includes(hayTitle)) return true;
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

        return (isScsstObj || act.includes('scsst') || act.includes('subcomite')) && act.includes('inspecci');
    });
}

/**
 * Parser inteligente de libros Excel para el formato oficial F-SIG-067
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

    const MONTH_LABELS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'];

    wb.SheetNames.forEach(sheetName => {
        const ws = wb.Sheets[sheetName];
        if (!ws) return;
        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (data.length < 5) return;

        let areaType: 'seguridad' | 'ma' | 'salud' | 'scsst' | null = null;
        const sLower = sheetName.toLowerCase();
        if (sLower.includes('scsst') || sLower.includes('subcomite')) areaType = 'scsst';
        else if (sLower.includes('salud') || sLower.includes('medico') || sLower.includes('enferm')) areaType = 'salud';
        else if (sLower.includes('medio') || sLower.includes('ambiente') || sLower.includes('ma')) areaType = 'ma';
        else if (sLower.includes('seguridad') || sLower.includes('prevencion') || sLower.includes('insp')) areaType = 'seguridad';

        let headerRowIdx = -1;
        let monthColMap: { [m: number]: { p: number; e: number } } = {};

        for (let r = 0; r < Math.min(data.length, 25); r++) {
            const row = data[r] || [];
            for (let c = 0; c < row.length; c++) {
                const cell = String(row[c] || '').trim().toUpperCase();
                if (cell === 'ENE' || cell.startsWith('ENERO')) {
                    headerRowIdx = r;
                    break;
                }
            }
            if (headerRowIdx !== -1) break;
        }

        if (headerRowIdx !== -1) {
            const headerRow = data[headerRowIdx] || [];
            const subRow = data[headerRowIdx + 1] || [];

            MONTH_LABELS.forEach((mLabel, mIdx) => {
                for (let c = 0; c < headerRow.length; c++) {
                    const cell = String(headerRow[c] || '').trim().toUpperCase();
                    if (cell.includes(mLabel)) {
                        monthColMap[mIdx] = { p: c, e: c + 1 };
                        break;
                    }
                }
            });

            if (Object.keys(monthColMap).length < 12) {
                const pCols: number[] = [];
                for (let c = 0; c < subRow.length; c++) {
                    if (String(subRow[c] || '').trim().toUpperCase() === 'P') {
                        pCols.push(c);
                    }
                }
                if (pCols.length >= 12) {
                    pCols.slice(0, 12).forEach((pCol, idx) => {
                        monthColMap[idx] = { p: pCol, e: pCol + 1 };
                    });
                }
            }
        }

        if (Object.keys(monthColMap).length < 12) return;

        const parsedItems: InspectionSubprogramItem[] = [];
        for (let r = headerRowIdx + 2; r < data.length; r++) {
            const row = data[r];
            if (!row || row.length === 0) continue;

            const firstStr = String(row[0] || row[1] || '').trim().toUpperCase();
            if (firstStr.includes('TOTAL') || firstStr.includes('PORCENTAJE')) break;

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

            const prog: number[] = new Array(12).fill(0);
            const exec: number[] = new Array(12).fill(0);

            for (let m = 0; m < 12; m++) {
                const pCol = monthColMap[m]?.p;
                const eCol = monthColMap[m]?.e;
                if (pCol !== undefined) {
                    const rawP = Number(row[pCol]);
                    prog[m] = !isNaN(rawP) ? rawP : 0;
                }
                if (eCol !== undefined) {
                    const rawE = Number(row[eCol]);
                    exec[m] = !isNaN(rawE) ? rawE : 0;
                }
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

        if (parsedItems.length > 0) {
            totalItems += parsedItems.length;
            const targetType = areaType || 'seguridad';
            const subprogram: InspectionSubprogram = {
                id: targetType === 'scsst' ? 'subprog_insp_scsst' : targetType === 'salud' ? 'subprog_insp_salud' : targetType === 'ma' ? 'subprog_insp_ma' : 'subprog_insp_seguridad',
                code: 'F-SIG-067',
                version: '01',
                title: `PROGRAMA ANUAL DE INSPECCIONES OPERACIONALES — ${targetType.toUpperCase()}`,
                areaName: targetType === 'scsst' ? 'Subcomité SCSST' : targetType === 'salud' ? 'Lic. Enfermería' : targetType === 'ma' ? 'Asistente de Medio Ambiente' : 'Prevencionistas / SSOMA',
                sede: 'Red Vial 6 (Obras Nuevas - Zona Industrial Pisco)',
                fechaActualizacion: '29 de Noviembre 2026',
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
