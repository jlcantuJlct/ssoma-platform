import fs from 'fs';
import client from './lib/db';
import ExcelJS from 'exceljs';

const INSPECCION_OBJS = ['obj3', 'obj6', 'obj8'];
const CAPACITACION_OBJS = ['obj2', 'obj7', 'obj9', 'obj11'];
const MIXED_OBJS = ['obj1'];

function findPEColumns(ws: ExcelJS.Worksheet, defaultStart: number = 7) {
    let targetColsP: number[] = [];
    let targetColsE: number[] = [];
    for (let r = 1; r <= 20; r++) {
        const row = ws.getRow(r);
        const pCols: number[] = [];
        const eCols: number[] = [];
        for (let c = 1; c <= 150; c++) {
            const val = String(row.getCell(c).value || '').trim().toUpperCase();
            if (val === 'P') pCols.push(c);
            if (val === 'E') eCols.push(c);
        }
        if (pCols.length >= 12 && eCols.length >= 12) {
            targetColsP = pCols.slice(0, 12);
            targetColsE = eCols.slice(0, 12);
            return { targetColsP, targetColsE };
        }
    }
    for(let i=0; i<12; i++) {
        targetColsP.push(defaultStart + i*2);
        targetColsE.push(defaultStart + 1 + i*2);
    }
    return { targetColsP, targetColsE };
}

async function run() {
    const records = await client.fetchAll("SELECT objective_id, data_json FROM annual_program");
    const dbData: Record<string, any[]> = {};
    records.forEach((r: any) => {
        dbData[r.objective_id] = r.data_json ? JSON.parse(r.data_json) : [];
    });

    // Mock getMatrixData
    const getMatrixData = (objId: string) => {
        const currentList = dbData[objId] || [];
        const grouped: Record<string, any> = {};
        const baseAreas = ['SEGURIDAD', 'MEDIO AMBIENTE', 'SALUD'];
        baseAreas.forEach(a => grouped[a] = {});

        currentList.forEach(item => {
            let area = (item.area || 'SEGURIDAD').toUpperCase();
            let key = baseAreas.find(a => area.includes(a));
            if (!key) {
                key = 'OTROS';
                if (!grouped['OTROS']) grouped['OTROS'] = {};
            }
            if (!grouped[key][item.description]) {
                grouped[key][item.description] = { 
                    programmed: new Array(12).fill(0), 
                    executed: new Array(12).fill(0),
                    executionRecords: {},
                    tipo: item.tipo || 'otro'
                };
            }
            let m = -1;
            if (item.date && typeof item.date === 'string' && item.date.includes('-')) {
                const parts = item.date.split('-'); 
                if (parts.length === 3) m = parseInt(parts[1]) - 1;
            } else if (item.date && item.date.startsWith && item.date.startsWith('2026-')) {
                m = parseInt(item.date.substring(5, 7)) - 1;
            } else if (item.date && typeof item.date === 'string') {
                const match = item.date.match(/202[56]-(\d{2})-\d{2}/);
                if(match) m = parseInt(match[1]) - 1;
            }
            if (m >= 0 && m < 12) {
                if (item.status === 'Realizado') grouped[key][item.description].executed[m]++;
                else grouped[key][item.description].programmed[m]++;
            }
        });
        return grouped;
    };

    const matrixData: Record<string, any> = {};
    ['obj1', 'obj2', 'obj3', 'obj4', 'obj5', 'obj6', 'obj7', 'obj8', 'obj9', 'obj10', 'obj11'].forEach(id => {
        matrixData[id] = getMatrixData(id);
    });

    console.log("Matrix obj2 SEGURIDAD keys:", Object.keys(matrixData['obj2']['SEGURIDAD'] || {}).length);

    let wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Prog. Anual Capacitaciones');
    ws.addRow(['N°', 'TEMA', 'LUGAR', 'PARTICIPANTES', 'TIPO', 'P','E','P','E','P','E','P','E','P','E','P','E','P','E','P','E','P','E','P','E','P','E','P','E']);

    
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

    console.log(`allActivities extracted: ${allActivities.length}`);
    if(allActivities.length > 0) {
        console.log("First activity:", allActivities[0].act.description, "P:", allActivities[0].monthsP);
    }

    const refRow = ws.getRow(startRow);
    const styles: any[] = [];
    for(let c=1; c<=33; c++) {
        styles.push(JSON.parse(JSON.stringify(refRow.getCell(c).style)));
    }

    let footerRow = ws.rowCount;
    for (let r = startRow; r <= ws.rowCount; r++) {
        const val = String(ws.getRow(r).getCell(1).value || '') + String(ws.getRow(r).getCell(2).value || '');
        if (val.match(/Leyenda|Cumplimiento/i)) {
            footerRow = r;
            break;
        }
    }

    let currentRowIdx = startRow;
    counter = 1;
    const { targetColsP, targetColsE } = findPEColumns(ws, 7);
    console.log("PE Columns P:", targetColsP);

    allActivities.forEach((data) => {
        if (currentRowIdx >= footerRow) {
            ws.insertRow(currentRowIdx, []);
            footerRow++; 
        }
        const row = ws.getRow(currentRowIdx);
        for(let col = 1; col <= 33; col++) row.getCell(col).style = styles[col - 1];
        row.getCell(1).value = counter++;
        row.getCell(2).value = data.act.description;
        row.getCell(3).value = data.act.sede || 'Proyecto';
        row.getCell(4).value = data.act.area || 'Personal de Obra';
        row.getCell(5).value = data.act.subtype || 'Capacitación Interna';
        for (let col = 2; col <= 5; col++) {
            row.getCell(col).font = { ...row.getCell(col).font, color: { argb: 'FF000000' } };
        }
        for (let i = 0; i < 12; i++) {
            row.getCell(targetColsP[i]).value = Number(data.monthsP[i]) || '';
            row.getCell(targetColsE[i]).value = Number(data.monthsE[i]) || '';
        }
        row.commit();
        currentRowIdx++;
    });

    console.log("Generated rows up to:", currentRowIdx - 1);
    await wb.xlsx.writeFile("test_output_capacitaciones.xlsx");
    console.log("Saved test_output_capacitaciones.xlsx");
}

run().catch(console.error);
