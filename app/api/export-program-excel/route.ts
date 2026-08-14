export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import ExcelJS from 'exceljs';

const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'];

const INSPECCION_OBJS = ['obj3', 'obj6', 'obj8'];
const CAPACITACION_OBJS = ['obj2', 'obj7', 'obj9', 'obj11'];
const MIXED_OBJS = ['obj1'];

function getColLetter(colIdx: number) {
    let temp = 0;
    let letter = '';
    while (colIdx > 0) {
        temp = (colIdx - 1) % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        colIdx = Math.floor((colIdx - temp - 1) / 26);
    }
    return letter;
}

async function getTemplateBuffer(tipo: string): Promise<Buffer | null> {
    try {
        const row = await db.fetchOne('SELECT file_data FROM program_templates WHERE tipo = ?', [tipo]);
        if (!row || !row.file_data) return null;
        return Buffer.from(row.file_data, 'base64');
    } catch {
        return null;
    }
}

async function getAllProgramData(): Promise<Record<string, any[]>> {
    const records = await db.fetchAll('SELECT * FROM annual_program');
    const programData: Record<string, any[]> = {};
    records.forEach((r: any) => {
        try {
            programData[r.objective_id] = r.data_json ? JSON.parse(r.data_json) : [];
        } catch {
            programData[r.objective_id] = [];
        }
    });
    return programData;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTAR CAPACITACIONES (F-SIG-066)
// ─────────────────────────────────────────────────────────────────────────────
async function exportCapacitaciones(matrixData: Record<string, any>): Promise<Buffer> {
    const templateBuffer = await getTemplateBuffer('capacitacion');
    const wb = new ExcelJS.Workbook();
    
    if (templateBuffer) {
        await wb.xlsx.load(templateBuffer);
    } else {
        const ws = wb.addWorksheet('Prog. Anual Capacitaciones');
        ws.addRow(['N°', 'TEMA', 'ÁREA', 'SEDE', 'TIPO', 'MODALIDAD']);
    }

    const ws = wb.worksheets[0];
    
    let startRow = 9; 
    for (let r = 1; r <= Math.min(20, ws.rowCount); r++) {
        const cell = ws.getRow(r).getCell(1);
        if (cell.value === 1 || String(cell.value).match(/^\d+$/)) {
            startRow = r;
            break;
        }
    }

    const allActivities: any[] = [];
    let counter = 1;

    const extractData = (objs: string[], isMixed: boolean, targetTipo: string) => {
        objs.forEach(id => {
            const areaMap = matrixData[id] || {};
            Object.keys(areaMap).forEach(area => {
                Object.keys(areaMap[area]).forEach(desc => {
                    const item = areaMap[area][desc];
                    if (isMixed && item.tipo !== targetTipo) return;
                    
                    const monthsP = item.programmed;
                    const monthsE = item.executed;
                    const totalP = monthsP.reduce((a: number, b: number) => a + (Number(b) || 0), 0);
                    
                    allActivities.push({ 
                        act: { description: desc, area, subtype: 'Capacitación', modality: 'Interna', sede: 'Proyecto' }, 
                        monthsP, monthsE, totalP, counter: counter++ 
                    });
                });
            });
        });
    };

    extractData(CAPACITACION_OBJS, false, '');
    extractData(MIXED_OBJS, true, 'capacitacion');

    const refRow = ws.getRow(startRow);
    const styles: any[] = [];
    for(let c=1; c<=33; c++) {
        styles.push(JSON.parse(JSON.stringify(refRow.getCell(c).style)));
    }

    // Find footer row
    let footerRow = ws.rowCount;
    for (let r = startRow; r <= ws.rowCount; r++) {
        const val = String(ws.getRow(r).getCell(1).value || '') + String(ws.getRow(r).getCell(2).value || '');
        if (val.match(/Leyenda|Cumplimiento/i)) {
            footerRow = r;
            break;
        }
    }

    for (let r = startRow; r < footerRow; r++) {
        const row = ws.getRow(r);
        row.eachCell(cell => {
            if (cell.type === ExcelJS.ValueType.Formula) {
                cell.value = cell.result !== undefined ? cell.result : null;
            }
        });
    }

    let currentRowIdx = startRow;
    counter = 1;
    
    allActivities.forEach((data) => {
        if (currentRowIdx >= footerRow) {
            ws.insertRow(currentRowIdx, []);
            footerRow++; 
        }

        const row = ws.getRow(currentRowIdx);
        for(let col = 1; col <= 33; col++) {
            row.getCell(col).style = styles[col - 1];
        }
        row.getCell(1).value = counter++;
        row.getCell(2).value = data.act.description;
        row.getCell(3).value = data.act.sede || 'Proyecto';
        row.getCell(4).value = data.act.area || 'Personal de Obra';
        row.getCell(5).value = data.act.subtype || 'Capacitación Interna';

        let colIdx = 6; 
        for (let i = 0; i < 12; i++) {
            row.getCell(colIdx++).value = Number(data.monthsP[i]) || '';
            row.getCell(colIdx++).value = Number(data.monthsE[i]) || '';
        }
        row.getCell(colIdx).value = data.totalP;
        
        row.commit();
        currentRowIdx++;
    });

    for (let r = currentRowIdx; r < footerRow; r++) {
        const row = ws.getRow(r);
        for(let c=1; c<=33; c++) row.getCell(c).value = null;
    }

    return (await wb.xlsx.writeBuffer()) as Buffer;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTAR INSPECCIONES (F-SIG-067)
// ─────────────────────────────────────────────────────────────────────────────
async function exportInspecciones(matrixData: Record<string, any>): Promise<Buffer> {
    const templateBuffer = await getTemplateBuffer('inspeccion');
    const wb = new ExcelJS.Workbook();
    
    if (templateBuffer) {
        await wb.xlsx.load(templateBuffer);
    } else {
        wb.addWorksheet('Prog. Anual de Insp. SHO');
    }

    const sheetDataMap = [
        { name: 'Prog. Anual de Insp. SHO', objs: ['obj3'], mixed: true },
        { name: 'Prog. Anual Insp. Salud', objs: ['obj6'], mixed: false },
        { name: 'Prog. Anual de Insp. MA', objs: ['obj8'], mixed: false }
    ];

    sheetDataMap.forEach(mapData => {
        const ws = wb.getWorksheet(mapData.name);
        if (!ws) return;

        let dataStart = 10;
        for (let r = 1; r <= ws.rowCount; r++) {
            const cell = ws.getRow(r).getCell(3);
            if (cell.value && String(cell.value).toLowerCase().includes('responsable')) {
                dataStart = r;
                break;
            }
        }

        const groupedActivities = new Map<string, any>();
        
        const extractData = (objs: string[], isMixed: boolean) => {
            objs.forEach(id => {
                const areaMap = matrixData[id] || {};
                Object.keys(areaMap).forEach(area => {
                    Object.keys(areaMap[area]).forEach(desc => {
                        const item = areaMap[area][desc];
                        if (isMixed && item.tipo !== 'inspeccion') return;
                        
                        const resp = area || 'Prevencionistas';
                        const key = `${desc}_${resp}`;
                        if (!groupedActivities.has(key)) {
                            groupedActivities.set(key, { 
                                act: { description: desc }, 
                                resp,
                                mp: item.programmed, 
                                me: item.executed 
                            });
                        }
                    });
                });
            });
        };

        extractData(mapData.objs, false);
        if (mapData.mixed) {
            extractData(['obj1'], true);
        }

        const refRow1 = ws.getRow(dataStart);
        const refRow2 = ws.getRow(dataStart + 1);
        const refRow3 = ws.getRow(dataStart + 2);
        
        const styles1: any[] = [];
        const styles2: any[] = [];
        const styles3: any[] = [];
        for(let c=1; c<=17; c++) {
            styles1.push(JSON.parse(JSON.stringify(refRow1.getCell(c).style)));
            styles2.push(JSON.parse(JSON.stringify(refRow2.getCell(c).style)));
            styles3.push(JSON.parse(JSON.stringify(refRow3.getCell(c).style)));
        }

        let currentRowIdx = dataStart;
        
        let footerRow = ws.rowCount;
        for (let r = dataStart; r <= ws.rowCount; r++) {
            const val = String(ws.getRow(r).getCell(1).value || '') + String(ws.getRow(r).getCell(3).value || '');
            if (val.match(/Leyenda|Cumplimiento/i)) {
                footerRow = r;
                break;
            }
        }

        for (let r = dataStart; r < footerRow; r++) {
            const row = ws.getRow(r);
            row.eachCell(cell => {
                if (cell.type === ExcelJS.ValueType.Formula) {
                    cell.value = cell.result !== undefined ? cell.result : null;
                }
            });
        }

        Array.from(groupedActivities.values()).forEach(group => {
            const { act, resp, mp, me } = group;
            const totP = mp.reduce((a:any, b:any) => a + (Number(b) || 0), 0);
            const totE = me.reduce((a:any, b:any) => a + (Number(b) || 0), 0);

            if (currentRowIdx + 2 >= footerRow) {
                ws.insertRow(currentRowIdx, []);
                ws.insertRow(currentRowIdx + 1, []);
                ws.insertRow(currentRowIdx + 2, []);
                footerRow += 3;
            }

            const r1 = ws.getRow(currentRowIdx);
            const r2 = ws.getRow(currentRowIdx + 1);
            const r3 = ws.getRow(currentRowIdx + 2);

            for(let c=1; c<=17; c++) {
                r1.getCell(c).style = styles1[c-1];
                r2.getCell(c).style = styles2[c-1];
                r3.getCell(c).style = styles3[c-1];
            }

            r1.getCell(1).value = act.description;
            r1.getCell(3).value = 'Responsable';
            for (let m = 0; m < 12; m++) r1.getCell(4 + m).value = resp;
            r1.getCell(16).value = 0;

            r2.getCell(3).value = 'Programado';
            for (let m = 0; m < 12; m++) r2.getCell(4 + m).value = Number(mp[m]) || '';
            r2.getCell(16).value = totP;

            r3.getCell(3).value = 'Ejecutado';
            for (let m = 0; m < 12; m++) r3.getCell(4 + m).value = Number(me[m]) || '';
            r3.getCell(16).value = totE;

            currentRowIdx += 3;
        });

        for (let r = currentRowIdx; r < footerRow; r++) {
            const row = ws.getRow(r);
            for(let c=1; c<=17; c++) row.getCell(c).value = null;
        }
    });

    return (await wb.xlsx.writeBuffer()) as Buffer;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTAR ACTIVIDADES GENERAL (F-SIG-023)
// ─────────────────────────────────────────────────────────────────────────────
async function exportActividades(matrixData: Record<string, any>): Promise<Buffer> {
    const templateBuffer = await getTemplateBuffer('actividades');
    const wb = new ExcelJS.Workbook();
    
    if (templateBuffer) {
        await wb.xlsx.load(templateBuffer);
    } else {
        wb.addWorksheet('Prog. Anual de Gestión');
    }

    const ws = wb.worksheets[0];
    let startRow = 10;
    for (let r = 1; r <= ws.rowCount; r++) {
        const cell = ws.getRow(r).getCell(1);
        if (cell.value === 1 || String(cell.value).match(/^\d+$/)) {
            startRow = r;
            break;
        }
    }

    const ALL_OBJECTIVES = [
        { id: 'obj1', label: 'OBJ 01: SCSST' },
        { id: 'obj2', label: 'OBJ 02: Capacitación' },
        { id: 'obj3', label: 'OBJ 03: Inspecciones Seguridad' },
        { id: 'obj4', label: 'OBJ 04: Reporte A/C Inseguras' },
        { id: 'obj5', label: 'OBJ 05: EMO Realizados' },
        { id: 'obj6', label: 'SEG 01: Inspecciones de Salud' },
        { id: 'obj7', label: 'SEG 02: Formaciones de Salud' },
        { id: 'obj8', label: 'SEG 03: Inspecciones M. Ambiente' },
        { id: 'obj9', label: 'SEG 04: Formaciones M. Ambiente' },
        { id: 'obj10', label: 'SEG 05: Control de Simulacros' },
        { id: 'obj11', label: 'SEG 06: Control de Brigadistas' },
    ];

    const refRow = ws.getRow(startRow);
    const styles: any[] = [];
    for(let c=1; c<=113; c++) {
        styles.push(JSON.parse(JSON.stringify(refRow.getCell(c).style)));
    }

    let counter = 1;
    let currentRowIdx = startRow;
    
    let footerRow = ws.rowCount;
    for (let r = startRow; r <= ws.rowCount; r++) {
        const val = String(ws.getRow(r).getCell(1).value || '') + String(ws.getRow(r).getCell(2).value || '');
        if (val.match(/Leyenda|Cumplimiento/i)) {
            footerRow = r;
            break;
        }
    }

    for (let r = startRow; r < footerRow; r++) {
        const row = ws.getRow(r);
        row.eachCell(cell => {
            if (cell.type === ExcelJS.ValueType.Formula) {
                cell.value = cell.result !== undefined ? cell.result : null;
            }
        });
    }

    if (ws._merges) {
        const mergesToClear = [];
        for (const rangeStr of Object.keys(ws._merges)) {
            const m = ws._merges[rangeStr].model;
            if (m.top >= startRow && m.bottom < footerRow) {
                mergesToClear.push(rangeStr);
            }
        }
        mergesToClear.forEach(r => ws.unMergeCells(r));
    }

    const groupedActivities = new Map<string, any>();
    ALL_OBJECTIVES.forEach(({ id, label }) => {
        const areaMap = matrixData[id] || {};
        Object.keys(areaMap).forEach(area => {
            Object.keys(areaMap[area]).forEach(desc => {
                const item = areaMap[area][desc];
                const key = `${id}_${desc}_${area}`;
                if (!groupedActivities.has(key)) {
                    groupedActivities.set(key, { act: { description: desc, area }, label, mp: item.programmed, me: item.executed });
                }
            });
        });
    });

    const monthTargetColsP: number[] = [];
    const row7 = ws.getRow(7);
    const MONTH_NAMES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SETIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    
    for (const mName of MONTH_NAMES) {
        let maxC = -1;
        for (let c = 7; c <= 112; c++) {
            const val = String(row7.getCell(c).value || '').trim().toUpperCase();
            if (val === mName) {
                maxC = c;
            }
        }
        if (maxC !== -1) {
            monthTargetColsP.push(maxC - 1); 
        } else {
            monthTargetColsP.push(7 + monthTargetColsP.length * 8); 
        }
    }

    let currentLabel = '';
    let labelStartRow = -1;

    Array.from(groupedActivities.values()).forEach((group) => {
        const { act, label, mp, me } = group;
        const totP = mp.reduce((a:any, b:any) => a + (Number(b) || 0), 0);
        const totE = me.reduce((a:any, b:any) => a + (Number(b) || 0), 0);
        const pct = totP > 0 ? (totE / totP) : 0; 

        if (currentRowIdx >= footerRow) {
            ws.insertRow(currentRowIdx, []);
            footerRow++;
        }
        
        if (label !== currentLabel) {
            if (currentLabel !== '' && labelStartRow !== -1 && currentRowIdx - 1 > labelStartRow) {
                ws.mergeCells(labelStartRow, 2, currentRowIdx - 1, 2);
                ws.getCell(labelStartRow, 2).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            }
            currentLabel = label;
            labelStartRow = currentRowIdx;
        }

        const row = ws.getRow(currentRowIdx);
        
        for(let c=1; c<=113; c++) row.getCell(c).style = JSON.parse(JSON.stringify(styles[c-1]));

        row.getCell(1).value = counter++;
        row.getCell(2).value = label;
        row.getCell(3).value = act.description;
        row.getCell(4).value = 'Mensual'; 
        row.getCell(5).value = act.area || '';
        row.getCell(6).value = act.area || 'Obra'; 

        for(let c=7; c<=110; c++) row.getCell(c).value = '';

        for (let i = 0; i < 12; i++) {
            const targetP = monthTargetColsP[i];
            const targetE = targetP + 1;
            row.getCell(targetP).value = Number(mp[i]) || ''; 
            row.getCell(targetE).value = Number(me[i]) || ''; 
        }
        
        const sumPStrAct = monthTargetColsP.map(c => `${getColLetter(c)}${currentRowIdx}`).join('+');
        const sumEStrAct = monthTargetColsP.map(c => `${getColLetter(c + 1)}${currentRowIdx}`).join('+');
        
        const pctCell = row.getCell(113);
        pctCell.value = { formula: `IF((${sumPStrAct})>0, MIN((${sumEStrAct})/(${sumPStrAct}), 1), IF((${sumEStrAct})>0, 1, 0))` };
        pctCell.numFmt = '0%';
        
        currentRowIdx++;
    });

    if (currentLabel !== '' && labelStartRow !== -1 && currentRowIdx - 1 > labelStartRow) {
        ws.mergeCells(labelStartRow, 2, currentRowIdx - 1, 2);
        ws.getCell(labelStartRow, 2).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    }

    for (let r = currentRowIdx; r < footerRow; r++) {
        const row = ws.getRow(r);
        for(let c=1; c<=113; c++) row.getCell(c).value = null;
    }

    const fRow = ws.getRow(footerRow);
    const fRowPct = ws.getRow(footerRow + 1);
    
    for(let c=7; c<=112; c++) {
        const letter = getColLetter(c);
        fRow.getCell(c).value = { formula: `SUM(${letter}${startRow}:${letter}${currentRowIdx - 1})` };
    }

    const monthFirstCol: number[] = [];
    for (const mName of MONTH_NAMES) {
        let minC = -1;
        for (let c = 7; c <= 112; c++) {
            const val = String(row7.getCell(c).value || '').trim().toUpperCase();
            if (val === mName) {
                if (minC === -1) minC = c;
            }
        }
        monthFirstCol.push(minC !== -1 ? minC : -1);
    }

    for (let i = 0; i < 12; i++) {
        if (monthFirstCol[i] !== -1) {
            const targetP = monthTargetColsP[i];
            const targetE = targetP + 1;
            const letP = getColLetter(targetP);
            const letE = getColLetter(targetE);
            fRowPct.getCell(monthFirstCol[i]).value = { formula: `IF(${letP}${footerRow}>0, MIN(${letE}${footerRow}/${letP}${footerRow}, 1), IF(${letE}${footerRow}>0, 1, 0))` };
        }
    }

    const sumPStr = monthTargetColsP.map(c => `${getColLetter(c)}${footerRow}`).join('+');
    const sumEStr = monthTargetColsP.map(c => `${getColLetter(c + 1)}${footerRow}`).join('+');
    
    const footerPctCell = fRow.getCell(113);
    footerPctCell.value = { formula: `IF((${sumPStr})>0, MIN((${sumEStr})/(${sumPStr}), 1), IF((${sumEStr})>0, 1, 0))` };
    footerPctCell.numFmt = '0%';

    return (await wb.xlsx.writeBuffer()) as Buffer;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST HANDLER
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    const tipo = req.nextUrl.searchParams.get('tipo');

    if (!tipo || !['actividades', 'capacitacion', 'inspeccion'].includes(tipo)) {
        return NextResponse.json(
            { error: 'Parámetro tipo requerido' },
            { status: 400 }
        );
    }

    try {
        const body = await req.json();
        const matrixData = body.matrixData;

        if (!matrixData) {
             return NextResponse.json({ error: 'Faltan datos de matriz' }, { status: 400 });
        }

        let buffer: Buffer;
        let filename: string;

        if (tipo === 'capacitacion') {
            buffer = await exportCapacitaciones(matrixData);
            filename = 'Programa_Anual_Capacitaciones_2026.xlsx';
        } else if (tipo === 'inspeccion') {
            buffer = await exportInspecciones(matrixData);
            filename = 'Programa_Anual_Inspecciones_2026.xlsx';
        } else {
            buffer = await exportActividades(matrixData);
            filename = 'Programa_Anual_Actividades_2026.xlsx';
        }

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'no-store',
            }
        });
    } catch (error: any) {
        console.error('Export error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
