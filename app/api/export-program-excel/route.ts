export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import ExcelJS from 'exceljs';

const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'];

const INSPECCION_OBJS = ['obj3', 'obj6', 'obj8'];
const CAPACITACION_OBJS = ['obj2', 'obj7', 'obj9', 'obj10', 'obj11'];
const MIXED_OBJS = ['obj1'];

function findPEColumns(ws: ExcelJS.Worksheet, defaultStart: number = 7): { targetColsP: number[], targetColsE: number[] } {
    let targetColsP: number[] = [];
    let targetColsE: number[] = [];
    
    // Buscar la fila que contenga al menos 12 'P' y 12 'E'
    for (let r = 1; r <= 20; r++) {
        const row = ws.getRow(r);
        const pCols: number[] = [];
        const eCols: number[] = [];
        for(let c=1; c<=40; c++) {
            const cellValue = row.getCell(c).value;
            let val = '';
            if (cellValue && typeof cellValue === 'object' && 'richText' in cellValue) {
                val = (cellValue as any).richText.map((rt: any) => rt.text).join('').trim().toUpperCase();
            } else {
                val = String(cellValue || '').trim().toUpperCase();
            }
            if(val === 'P' || val === 'PROGRAMADO') pCols.push(c);
            if (val === 'E') eCols.push(c);
        }
        if (pCols.length >= 12 && eCols.length >= 12) {
            targetColsP = pCols.slice(0, 12);
            targetColsE = eCols.slice(0, 12);
            return { targetColsP, targetColsE };
        }
    }
    
    // Fallback
    for(let i=0; i<12; i++) {
        targetColsP.push(defaultStart + i*2);
        targetColsE.push(defaultStart + 1 + i*2);
    }
    return { targetColsP, targetColsE };
}

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

    const targetSheets: ExcelJS.Worksheet[] = [];
    for (const sheet of wb.worksheets) {
        let isTemplate = false;
        for (let r = 1; r <= Math.min(20, sheet.rowCount); r++) {
            for (let c = 1; c <= 10; c++) {
                const cellValue = sheet.getRow(r).getCell(c).value;
                let val = '';
                if (cellValue && typeof cellValue === 'object' && 'richText' in cellValue) {
                    val = (cellValue as any).richText.map((rt: any) => rt.text).join('').toUpperCase();
                } else {
                    val = String(cellValue || '').toUpperCase();
                }
                if (val.includes('PROGRAMA ANUAL DE')) {
                    isTemplate = true;
                    break;
                }
            }
            if (isTemplate) break;
        }
        if (isTemplate) targetSheets.push(sheet);
    }
    if (targetSheets.length === 0) targetSheets.push(wb.worksheets[0]);

    const allActivities: any[] = [];

    const normalizeStr = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

    const extractData = (objs: string[], isMixed: boolean, targetTipo: string) => {
        objs.forEach(id => {
            const areaMap = matrixData[id] || {};
            Object.keys(areaMap).forEach(area => {
                Object.keys(areaMap[area]).forEach(desc => {
                    const item = areaMap[area][desc];
                    let actualTipo = item.tipo;
                    if (!desc || desc.trim().length < 2) return;
                    if (!actualTipo || actualTipo === 'otro') {
                        const dNorm = normalizeStr(desc);
                        if (dNorm.includes('capacitacion') || dNorm.includes('induccion') || dNorm.includes('charla')) actualTipo = 'capacitacion';
                        else if (dNorm.includes('inspeccion') || dNorm.includes('observacion')) actualTipo = 'inspeccion';
                    }
                    if (isMixed && normalizeStr(actualTipo) !== normalizeStr(targetTipo)) return;
                    
                    const monthsP = item.programmed;
                    const monthsE = item.executed;
                    const totalP = monthsP.reduce((a: number, b: number) => a + (Number(b) || 0), 0);
                    
                    allActivities.push({ 
                        act: { description: desc, area, subtype: 'Capacitación', modality: 'Interna', sede: 'Proyecto' }, 
                        monthsP, monthsE, totalP
                    });
                });
            });
        });
    };

    extractData(CAPACITACION_OBJS, false, '');
    extractData(MIXED_OBJS, true, 'capacitacion');

    for (const ws of targetSheets) {
        let startRow = 9; 
        for (let r = 1; r <= Math.min(25, ws.rowCount); r++) {
            const row = ws.getRow(r);
            let foundP = false;
            for (let c = 1; c <= 40; c++) {
                const cellValue = row.getCell(c).value;
                let val = '';
                if (cellValue && typeof cellValue === 'object' && 'richText' in cellValue) {
                    val = (cellValue as any).richText.map((rt: any) => rt.text).join('').trim().toUpperCase();
                } else {
                    val = String(cellValue || '').trim().toUpperCase();
                }
                if (val === 'P' || val === 'PROGRAMADO') foundP = true;
            }
            if (foundP) {
                startRow = r + 1;
                break;
            }
        }

        const refRow = ws.getRow(startRow);
        const styles: any[] = [];
        for(let c=1; c<=33; c++) {
            styles.push(JSON.parse(JSON.stringify(refRow.getCell(c).style)));
        }

        // Universal Shared Formula Sanitizer
        ws.eachRow((row) => {
            row.eachCell({ includeEmpty: true }, (cell) => {
                if (cell.type === ExcelJS.ValueType.Formula && cell.formula) {
                    cell.value = { formula: cell.formula, result: cell.result };
                }
            });
        });

        let footerRow = ws.rowCount;
        for (let r = startRow; r <= ws.rowCount; r++) {
            const val = String(ws.getRow(r).getCell(1).value || '') + String(ws.getRow(r).getCell(2).value || '');
            if (val.match(/Leyenda|Cumplimiento|TOTAL DE/i)) {
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
        let counter = 1;
        const { targetColsP, targetColsE } = findPEColumns(ws, 6);
        
        // Remove vertical merges in the data area so hidden rows aren't corrupted
        if (ws._merges) {
            const mergesToClear: string[] = [];
            for (const rangeStr of Object.keys(ws._merges)) {
                const m = ws._merges[rangeStr].model;
                if (m.top !== m.bottom && m.bottom >= startRow && m.top < footerRow) {
                    mergesToClear.push(rangeStr);
                }
            }
            mergesToClear.forEach(r => { try { ws.unMergeCells(r); } catch(e) {} });
        }

        allActivities.forEach((data) => {
            if (currentRowIdx >= footerRow) {
                ws.insertRow(currentRowIdx, []);
                footerRow++; 
            }

            const row = ws.getRow(currentRowIdx);
            row.hidden = false;
            // Removed row.height = 15 to allow auto-fit
            for(let col = 1; col <= 33; col++) {
                row.getCell(col).style = JSON.parse(JSON.stringify(styles[col - 1]));
                // Ensure alignment and borders are preserved
                if (styles[col - 1].alignment) row.getCell(col).alignment = { ...styles[col - 1].alignment, wrapText: true };
            }
            row.getCell(1).value = counter++;
            row.getCell(2).value = data.act.description;
            // Column 3 is merged with Column 2
            
            // Forcefully clear all merges intersecting with B and C on this row
            const mergesArr = Object.keys(ws._merges || {});
            for (const rangeStr of mergesArr) {
                const m = ws._merges[rangeStr].model;
                if (m.top <= currentRowIdx && m.bottom >= currentRowIdx && m.left <= 3 && m.right >= 2) {
                    try { ws.unMergeCells(rangeStr); } catch(e) {}
                }
            }
            try { ws.mergeCells(`B${currentRowIdx}:C${currentRowIdx}`); } catch(e) {}
            
            row.getCell(4).value = data.act.sede || 'Proyecto'; // LUGAR / SEDE
            row.getCell(5).value = data.act.area || 'Personal de Obra'; // PARTICIPANTES
            row.getCell(7).value = data.act.modality || 'Interna'; // CAPACITACIÓN, DIFUSIÓN, CHARLA

            for (let col = 2; col <= 5; col++) {
                row.getCell(col).font = { ...row.getCell(col).font, color: { argb: 'FF000000' } };
            }

            for (let i = 0; i < 12; i++) {
                row.getCell(targetColsP[i]).value = Number(data.monthsP[i]) || '';
                row.getCell(targetColsE[i]).value = Number(data.monthsE[i]) || '';
            }
            
            const lastCol = targetColsE[11] + 1; 
            row.getCell(lastCol).value = data.totalP;
            
            row.commit();
            currentRowIdx++;
        });

        for (let r = currentRowIdx; r < footerRow; r++) {
            const row = ws.getRow(r);
            for(let c=1; c<=33; c++) row.getCell(c).value = null;
        }

        // Update footer formulas to encompass the new row range
        for (let r = footerRow; r <= ws.rowCount; r++) {
            const fRow = ws.getRow(r);
            fRow.eachCell(cell => {
                if (cell.type === ExcelJS.ValueType.Formula && cell.formula) {
                    const newFormula = cell.formula.replace(/([A-Z]+)\d+:\1\d+/g, (match, col) => {
                        return `${col}${startRow}:${col}${currentRowIdx - 1}`;
                    });
                    cell.value = { formula: newFormula, result: cell.result };
                }
            });
        }

        // Specifically cap percentage row formulas
        let pRowIdx = -1;
        let eRowIdx = -1;
        let pctRowIdx = -1;
        for (let r = footerRow; r <= ws.rowCount; r++) {
            const valStr = String(ws.getRow(r).getCell(1).value || '') + String(ws.getRow(r).getCell(2).value || '');
            if (valStr.match(/TOTAL DE CAPACITACIONES PROGRAMADAS/i)) pRowIdx = r;
            if (valStr.match(/TOTAL DE CAPACITACIONES EJECUTADAS/i)) eRowIdx = r;
            if (valStr.match(/PORCENTAJE DE CUMPLIMIENTO/i)) pctRowIdx = r;
        }

        if (pRowIdx !== -1 && eRowIdx !== -1 && pctRowIdx !== -1) {
            const pctRow = ws.getRow(pctRowIdx);
            for (let i = 0; i < 12; i++) {
                const colP = targetColsP[i];
                const colE = targetColsE[i];
                const pCell = ws.getRow(pRowIdx).getCell(colP);
                const eCell = ws.getRow(eRowIdx).getCell(colP);
                const colLetter = pCell.address.replace(/[0-9]/g, '');
                
                // Calculate static totals in JS to apply row-level capping correctly
                let totalP = 0;
                let totalE = 0;
                let totalFulfilled = 0;
                
                for (let r = startRow; r < currentRowIdx; r++) {
                    const dataRow = ws.getRow(r);
                    const pVal = Number(dataRow.getCell(colP).value) || 0;
                    const eVal = Number(dataRow.getCell(colE).value) || 0;
                    
                    totalP += pVal;
                    totalE += eVal;
                    totalFulfilled += Math.min(pVal, eVal);
                }
                
                pCell.value = totalP;
                eCell.value = totalE;
                
                const percentage = totalP > 0 ? Math.round((totalFulfilled / totalP) * 100) : 0;
                pctRow.getCell(colP).value = percentage;
            }
        }
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
        let ws = wb.getWorksheet(mapData.name);
        if (!ws) {
            ws = wb.worksheets[sheetDataMap.indexOf(mapData)];
            if (!ws) return;
        }

        // Determine data start and label column by looking for the "Responsable" cell
        let dataStart = 10;
        let labelCol = 2;
        for (let r = 1; r <= ws.rowCount; r++) {
            let found = false;
            for (let c = 1; c <= 10; c++) {
                const cell = ws.getRow(r).getCell(c);
                if (cell.value && String(cell.value).toLowerCase().includes('responsable')) {
                    dataStart = r;
                    labelCol = c;
                    found = true;
                    break;
                }
            }
            if (found) break;
        }
        const eneCol = labelCol + 1;
        const totalCol = eneCol + 12;

        const groupedActivities = new Map<string, any>();
        
        const normalizeStr = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

        const extractData = (objs: string[], isMixed: boolean) => {
            objs.forEach(id => {
                const areaMap = matrixData[id] || {};
                Object.keys(areaMap).forEach(area => {
                    Object.keys(areaMap[area]).forEach(desc => {
                        const item = areaMap[area][desc];
                        let actualTipo = item.tipo;
                        if (!actualTipo || actualTipo === 'otro') {
                            const dNorm = normalizeStr(desc);
                            if (dNorm.includes('capacitacion') || dNorm.includes('induccion') || dNorm.includes('charla')) actualTipo = 'capacitacion';
                            else if (dNorm.includes('inspeccion') || dNorm.includes('observacion')) actualTipo = 'inspeccion';
                        }
                        if (isMixed && normalizeStr(actualTipo) !== 'inspeccion') return;
                        
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
        
        // Also pull in any items from ALL OTHER objectives (Health, Environment, etc.) that have been explicitly typed as 'inspeccion' (or auto-detected)
        const allOtherObjs = Object.keys(matrixData).filter(o => !mapData.objs.includes(o));
        extractData(allOtherObjs, true);

        // Universal Shared Formula Sanitizer: Break all shared formula links to prevent ExcelJS crashes during row operations
        ws.eachRow((row) => {
            row.eachCell({ includeEmpty: true }, (cell) => {
                if (cell.type === ExcelJS.ValueType.Formula && cell.formula) {
                    cell.value = { formula: cell.formula, result: cell.result };
                }
            });
        });

        const refRow1 = ws.getRow(dataStart);
        const refRow2 = ws.getRow(dataStart + 1);
        const refRow3 = ws.getRow(dataStart + 2);
        const height1 = refRow1.height;
        const height2 = refRow2.height;
        const height3 = refRow3.height;
        
        const styles1: any[] = [];
        const styles2: any[] = [];
        const styles3: any[] = [];
        for(let c=1; c<=40; c++) {
            // Clone style and purge any corrupted number formatting from the template
            const s1 = { ...refRow1.getCell(c).style }; delete s1.numFmt;
            const s2 = { ...refRow2.getCell(c).style }; delete s2.numFmt;
            const s3 = { ...refRow3.getCell(c).style }; delete s3.numFmt;
            
            styles1.push(s1);
            styles2.push(s2);
            styles3.push(s3);
        }

        // Wipe EVERYTHING below dataStart to ensure no garbage or broken footers are left
        for (let r = ws.rowCount; r >= dataStart; r--) {
            try { 
                ws.spliceRows(r, 1); 
            } catch(e) {
                const row = ws.getRow(r);
                row.values = [];
                for(let c=1; c<=40; c++) row.getCell(c).style = {};
                row.hidden = true;
                row.height = 0;
            }
        }

        let currentRowIdx = dataStart;
        
        const startLetter = ws.getColumn(eneCol).letter;
        const endLetter = ws.getColumn(eneCol + 11).letter;

        // Rebuild exactly the number of rows needed for the activities
        const activitiesList = Array.from(groupedActivities.values());
        for (let i = 0; i < activitiesList.length; i++) {
            ws.insertRow(currentRowIdx, []);
            ws.insertRow(currentRowIdx + 1, []);
            ws.insertRow(currentRowIdx + 2, []);

            const r1 = ws.getRow(currentRowIdx);
            const r2 = ws.getRow(currentRowIdx + 1);
            const r3 = ws.getRow(currentRowIdx + 2);
            r1.hidden = false; r2.hidden = false; r3.hidden = false;
            if (height1) r1.height = height1;
            if (height2) r2.height = height2;
            if (height3) r3.height = height3;

            for(let c=1; c<=40; c++) {
                r1.getCell(c).style = styles1[c-1];
                r2.getCell(c).style = styles2[c-1];
                r3.getCell(c).style = styles3[c-1];
                
                if (c >= labelCol && c <= totalCol) {
                    r1.getCell(c).font = { ...r1.getCell(c).font, color: { argb: 'FF000000' } };
                    r2.getCell(c).font = { ...r2.getCell(c).font, color: { argb: 'FF000000' } };
                    r3.getCell(c).font = { ...r3.getCell(c).font, color: { argb: 'FF000000' } };
                }
            }

            // Unmerge previous columns
            for (let c = 1; c <= labelCol; c++) {
                const letter = ws.getColumn(c).letter;
                try { ws.unMergeCells(`${letter}${currentRowIdx}`); } catch {}
                try { ws.unMergeCells(`${letter}${currentRowIdx+1}`); } catch {}
                try { ws.unMergeCells(`${letter}${currentRowIdx+2}`); } catch {}
            }

            // Merge Description cells
            if (labelCol > 1) {
                try { ws.mergeCells(`A${currentRowIdx}:${ws.getColumn(labelCol - 1).letter}${currentRowIdx + 2}`); } catch {}
            } else {
                try { ws.mergeCells(`A${currentRowIdx}:A${currentRowIdx + 2}`); } catch {}
            }

            const group = activitiesList[i];
            
            const descCell = r1.getCell(1);
            descCell.value = group.act.description;
            descCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

            r1.getCell(labelCol).value = 'Responsable';
            r2.getCell(labelCol).value = 'Programado';
            r3.getCell(labelCol).value = 'Ejecutado';

            for (let m = 0; m < 12; m++) {
                const colIdx = eneCol + m;
                const pVal = Number(group.mp[m]) || 0;
                const eVal = Number(group.me[m]) || 0;
                
                r1.getCell(colIdx).value = group.resp || 'Prevencionistas';
                r2.getCell(colIdx).value = pVal;
                r3.getCell(colIdx).value = eVal;
            }
            
            // Total Column
            const totalLetter = ws.getColumn(totalCol).letter;
            r1.getCell(totalCol).value = null; 
            r2.getCell(totalCol).value = { formula: `SUM(${startLetter}${currentRowIdx + 1}:${endLetter}${currentRowIdx + 1})` };
            
            let rowMinTerms = [];
            for (let m = 0; m < 12; m++) {
                const mLetter = ws.getColumn(eneCol + m).letter;
                rowMinTerms.push(`MIN(${mLetter}${currentRowIdx + 1},${mLetter}${currentRowIdx + 2})`);
            }
            r3.getCell(totalCol).value = { formula: `IF(${totalLetter}${currentRowIdx + 1}>0, (${rowMinTerms.join('+')})/${totalLetter}${currentRowIdx + 1}, 0)` };
            r3.getCell(totalCol).numFmt = '0%';

            currentRowIdx += 3;
        }

        // Add 1 blank separator row
        ws.insertRow(currentRowIdx, []);
        ws.getRow(currentRowIdx).height = 10;
        currentRowIdx++;

        // Add the Footer
        const pctRowIdx = currentRowIdx;
        const eRowIdx = currentRowIdx + 1;
        const pRowIdx = currentRowIdx + 2;

        ws.insertRow(pctRowIdx, []);
        ws.insertRow(eRowIdx, []);
        ws.insertRow(pRowIdx, []);

        const pctRow = ws.getRow(pctRowIdx);
        const eRow = ws.getRow(eRowIdx);
        const pRow = ws.getRow(pRowIdx);

        pctRow.height = height1 || 25;
        eRow.height = height2 || 25;
        pRow.height = height3 || 25;

        // Apply styles to footer
        const footerStyleBlue = {
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } },
            font: { bold: true, color: { argb: 'FF000000' } },
            border: { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} },
            alignment: { vertical: 'middle', horizontal: 'center', wrapText: true }
        } as Partial<ExcelJS.Style>;

        const footerStyleWhite = {
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } },
            font: { bold: true, color: { argb: 'FF000000' } },
            border: { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} },
            alignment: { vertical: 'middle', horizontal: 'center' }
        } as Partial<ExcelJS.Style>;
        
        for (let i = 1; i <= totalCol; i++) {
            pctRow.getCell(i).style = footerStyleBlue;
            if (i >= eneCol) {
                eRow.getCell(i).style = footerStyleWhite;
                pRow.getCell(i).style = footerStyleWhite;
            } else {
                eRow.getCell(i).style = footerStyleBlue;
                pRow.getCell(i).style = footerStyleBlue;
            }
        }

        try { ws.mergeCells(`A${pctRowIdx}:${ws.getColumn(labelCol).letter}${pctRowIdx}`); } catch {}
        try { ws.mergeCells(`A${eRowIdx}:${ws.getColumn(labelCol).letter}${eRowIdx}`); } catch {}
        try { ws.mergeCells(`A${pRowIdx}:${ws.getColumn(labelCol).letter}${pRowIdx}`); } catch {}

        pctRow.getCell(1).value = 'CUMPLIMIENTO EN PORCENTAJE';
        eRow.getCell(1).value = 'TOTAL POR MES EJECUTADO';
        pRow.getCell(1).value = 'TOTAL POR MES PROGRAMADO';

        for (let i = 0; i < 12; i++) {
            const colIdx = eneCol + i;
            const colLetter = ws.getColumn(colIdx).letter;
            
            let pRowSumCells = [];
            let eRowSumCells = [];
            
            let minTerms = [];
            for (let r = dataStart; r < pctRowIdx - 1; r += 3) {
                pRowSumCells.push(`${colLetter}${r + 1}`);
                eRowSumCells.push(`${colLetter}${r + 2}`);
                minTerms.push(`MIN(${colLetter}${r + 1},${colLetter}${r + 2})`);
            }
            
            if (pRowSumCells.length > 0) {
                pRow.getCell(colIdx).value = { formula: `SUM(${pRowSumCells.join(',')})` };
                eRow.getCell(colIdx).value = { formula: `SUM(${eRowSumCells.join(',')})` };
            } else {
                pRow.getCell(colIdx).value = 0;
                eRow.getCell(colIdx).value = 0;
            }
            
            const pctCell = pctRow.getCell(colIdx);
            if (minTerms.length > 0) {
                pctCell.value = { formula: `IF(${colLetter}${pRowIdx}>0, (${minTerms.join('+')})/${colLetter}${pRowIdx}, 0)` };
            } else {
                pctCell.value = 0;
            }
            pctCell.numFmt = '0%';
        }

        const totalLetter = ws.getColumn(totalCol).letter;
        const startTotalLetter = ws.getColumn(eneCol).letter;
        const endTotalLetter = ws.getColumn(eneCol + 11).letter;
        
        pRow.getCell(totalCol).value = { formula: `SUM(${startTotalLetter}${pRowIdx}:${endTotalLetter}${pRowIdx})` };
        pRow.getCell(totalCol).numFmt = '0';
        
        eRow.getCell(totalCol).value = { formula: `SUM(${startTotalLetter}${eRowIdx}:${endTotalLetter}${eRowIdx})` };
        eRow.getCell(totalCol).numFmt = '0';
        
        const grandPctCell = pctRow.getCell(totalCol);
        
        let allMinTerms = [];
        for (let m = 0; m < 12; m++) {
            const mLetter = ws.getColumn(eneCol + m).letter;
            for (let r = dataStart; r < pctRowIdx - 1; r += 3) {
                allMinTerms.push(`MIN(${mLetter}${r + 1},${mLetter}${r + 2})`);
            }
        }
        
        if (allMinTerms.length > 0) {
            grandPctCell.value = { formula: `IF(${totalLetter}${pRowIdx}>0, (${allMinTerms.join('+')})/${totalLetter}${pRowIdx}, 0)` };
        } else {
            grandPctCell.value = 0;
        }
        grandPctCell.numFmt = '0%';
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

    let ws = wb.worksheets[0];
    for (const sheet of wb.worksheets) {
        let isTemplate = false;
        for (let r = 1; r <= Math.min(20, sheet.rowCount); r++) {
            for (let c = 1; c <= 10; c++) {
                if (String(sheet.getRow(r).getCell(c).value || '').toUpperCase().includes('PROGRAMA ANUAL DE')) {
                    isTemplate = true;
                    break;
                }
            }
            if (isTemplate) break;
        }
        if (isTemplate) {
            ws = sheet;
            break;
        }
    }
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
        row.hidden = false;
        // Removed row.height = 15 to allow auto-fit
        
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
        let colSum = 0;
        for (let r = startRow; r < currentRowIdx; r++) {
            colSum += Number(ws.getRow(r).getCell(c).value) || 0;
        }
        fRow.getCell(c).value = colSum;
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

    let grandP = 0;
    let grandE = 0;
    let grandFulfilled = 0;

    for (let i = 0; i < 12; i++) {
        if (monthFirstCol[i] !== -1) {
            const targetP = monthTargetColsP[i];
            const targetE = targetP + 1;
            
            let totalP = 0;
            let totalE = 0;
            let totalFulfilled = 0;
            
            for (let r = startRow; r < currentRowIdx; r++) {
                const pVal = Number(ws.getRow(r).getCell(targetP).value) || 0;
                const eVal = Number(ws.getRow(r).getCell(targetE).value) || 0;
                totalP += pVal;
                totalE += eVal;
                totalFulfilled += Math.min(pVal, eVal);
            }
            
            grandP += totalP;
            grandE += totalE;
            grandFulfilled += totalFulfilled;

            const pct = totalP > 0 ? (totalFulfilled / totalP) : (totalE > 0 ? 1 : 0);
            const cell = fRowPct.getCell(monthFirstCol[i]);
            cell.value = pct;
            cell.numFmt = '0%';
        }
    }

    const footerPctCell = fRow.getCell(113);
    const grandPct = grandP > 0 ? (grandFulfilled / grandP) : (grandE > 0 ? 1 : 0);
    footerPctCell.value = grandPct;
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

        return new NextResponse(buffer as unknown as BodyInit, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'no-store',
            }
        });
    } catch (error: any) {
        console.error("Export Error:", error);
        return NextResponse.json({ error: error.message || 'Error desconocido' }, { status: 500 });
    }
}
 
