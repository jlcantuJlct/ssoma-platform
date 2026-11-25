export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import db from '@/lib/db';
import { matchHhcRecordsForTopic, DEFAULT_SUBPROGRAM_GENERAL, DEFAULT_SUBPROGRAM_BRIGADISTAS } from '@/lib/trainingSubprogramsData';

export async function GET(req: NextRequest) {
    try {
        const url = req.nextUrl;
        const type = url.searchParams.get('type') || 'general';
        const cookieWs = req.cookies.get('ssoma_workspace')?.value;
        const queryWs = url.searchParams.get('workspace');
        const workspace = queryWs || (cookieWs ? decodeURIComponent(cookieWs) : 'Red Vial 6');

        const isBrig = type === 'brigadistas';
        const templateFileName = isBrig 
            ? 'template_f_sig_066_brigadistas.xlsx' 
            : 'template_f_sig_066_general.xlsx';
            
        const templatePath = path.join(process.cwd(), 'public', 'templates', templateFileName);
        
        if (!fs.existsSync(templatePath)) {
            return NextResponse.json({ error: 'Plantilla oficial no encontrada en el servidor' }, { status: 404 });
        }

        // Leer plantilla oficial preservando estilos, celdas combinadas y anchos de columna
        const templateBuffer = fs.readFileSync(templatePath);
        const wb = XLSX.read(templateBuffer, { type: 'buffer', cellStyles: true });

        // Obtener datos guardados de subprogramas desde la base de datos
        let subprograms: any = {};
        try {
            const rows = await db.fetchAll('SELECT subprogram_id, data_json FROM training_subprograms WHERE workspace = ?', [workspace]);
            rows.forEach((r: any) => {
                if (r.subprogram_id && r.data_json) {
                    try {
                        subprograms[r.subprogram_id] = JSON.parse(r.data_json);
                    } catch (e) {}
                }
            });
        } catch (e) {
            console.warn('Error fetching training_subprograms in export:', e);
        }

        // Obtener registros de Control de HHC para auto-alimentar el Ejecutado (E)
        let hhcRecords: any[] = [];
        try {
            hhcRecords = await db.fetchAll('SELECT * FROM hhc_records WHERE workspace = ? ORDER BY date DESC', [workspace]);
        } catch (e) {
            console.warn('Error fetching hhc_records in export:', e);
        }

        if (isBrig) {
            // Actualizar hoja de Brigadistas
            const targetSheetName = wb.SheetNames.find(n => n.toLowerCase().includes('brigad')) || wb.SheetNames[1];
            const ws = wb.Sheets[targetSheetName];
            if (ws) {
                const subprog = subprograms?.subprog_brigadistas || DEFAULT_SUBPROGRAM_BRIGADISTAS;
                const items = subprog.items || DEFAULT_SUBPROGRAM_BRIGADISTAS.items;

                const monthlyTotalsP = new Array(12).fill(0);
                const monthlyTotalsE = new Array(12).fill(0);

                items.forEach((it: any, idx: number) => {
                    const r = 11 + idx; // Fila 12 (0-indexed 11)
                    let itemTotP = 0;
                    let itemTotE = 0;

                    for (let m = 0; m < 12; m++) {
                        const pVal = it.programmed?.[m] || 0;
                        const matched = matchHhcRecordsForTopic(it.tema, it.item, true, m, hhcRecords);
                        // Regla oficial: Solo mostrar ejecutados en meses programados
                        const eVal = pVal > 0 ? (matched.length > 0 ? matched.length : (it.executed?.[m] || 0)) : 0;

                        monthlyTotalsP[m] += pVal;
                        monthlyTotalsE[m] += eVal;
                        itemTotP += pVal;
                        itemTotE += eVal;

                        const pAddr = XLSX.utils.encode_cell({ r, c: 7 + m * 2 });
                        const eAddr = XLSX.utils.encode_cell({ r, c: 8 + m * 2 });

                        ws[pAddr] = pVal > 0 ? { t: 'n', v: pVal } : undefined;
                        ws[eAddr] = eVal > 0 ? { t: 'n', v: eVal } : undefined;
                    }
                });

                // Actualizar filas de totales al pie de Brigadistas
                const totPRowIdx = 18; // Fila 19
                const totERowIdx = 19; // Fila 20
                const pctRowIdx = 20;  // Fila 21

                for (let m = 0; m < 12; m++) {
                    const p = monthlyTotalsP[m];
                    const e = monthlyTotalsE[m];
                    const pAddr = XLSX.utils.encode_cell({ r: totPRowIdx, c: 7 + m * 2 });
                    const eAddr = XLSX.utils.encode_cell({ r: totERowIdx, c: 8 + m * 2 });
                    const pctAddr = XLSX.utils.encode_cell({ r: pctRowIdx, c: 7 + m * 2 });

                    ws[pAddr] = { t: 'n', v: p };
                    ws[eAddr] = { t: 'n', v: e };
                    const pct = p > 0 ? Math.round((Math.min(p, e) / p) * 100) : 0;
                    ws[pctAddr] = { t: 'n', v: pct };
                }
            }
        } else {
            // Actualizar hojas de Personal General: 'Prog. Anual Capac. San clemente' y 'Prog. Anual Capac. Chinchaysull'
            const subprog = subprograms?.subprog_general || DEFAULT_SUBPROGRAM_GENERAL;
            const items = subprog.items || DEFAULT_SUBPROGRAM_GENERAL.items;

            // 1. Hoja San Clemente (Columnas de meses empiezan en columna H, índice 7)
            const wsSC = wb.Sheets['Prog. Anual Capac. San clemente'];
            if (wsSC) {
                const monthlyTotalsP = new Array(12).fill(0);
                const monthlyTotalsE = new Array(12).fill(0);

                items.forEach((it: any, idx: number) => {
                    const r = 11 + idx; // Fila 12 (0-indexed 11)
                    for (let m = 0; m < 12; m++) {
                        const pVal = it.programmed?.[m] || 0;
                        const matched = matchHhcRecordsForTopic(it.tema, it.item, false, m, hhcRecords);
                        // Regla oficial: Solo mostrar ejecutados en meses programados
                        const eVal = pVal > 0 ? (matched.length > 0 ? matched.length : (it.executed?.[m] || 0)) : 0;

                        monthlyTotalsP[m] += pVal;
                        monthlyTotalsE[m] += eVal;

                        const pAddr = XLSX.utils.encode_cell({ r, c: 7 + m * 2 });
                        const eAddr = XLSX.utils.encode_cell({ r, c: 8 + m * 2 });

                        wsSC[pAddr] = pVal > 0 ? { t: 'n', v: pVal } : undefined;
                        wsSC[eAddr] = eVal > 0 ? { t: 'n', v: eVal } : undefined;
                    }
                });

                // Totales al pie de San Clemente
                const totPRowIdx = 43; // Fila 44
                const totERowIdx = 44; // Fila 45
                const pctRowIdx = 45;  // Fila 46

                for (let m = 0; m < 12; m++) {
                    const p = monthlyTotalsP[m];
                    const e = monthlyTotalsE[m];
                    const pAddr = XLSX.utils.encode_cell({ r: totPRowIdx, c: 7 + m * 2 });
                    const eAddr = XLSX.utils.encode_cell({ r: totERowIdx, c: 8 + m * 2 });
                    const pctAddr = XLSX.utils.encode_cell({ r: pctRowIdx, c: 8 + m * 2 });

                    wsSC[pAddr] = { t: 'n', v: p };
                    wsSC[eAddr] = { t: 'n', v: e };
                    const pct = p > 0 ? Math.min(1, Math.round((e / p) * 100) / 100) : 0;
                    wsSC[pctAddr] = { t: 'n', v: pct, z: '0%' };
                }
            }

            // 2. Hoja Chinchaysuyo si existe en la plantilla (Meses empiezan en columna I, índice 8)
            const wsCC = wb.Sheets['Prog. Anual Capac. Chinchaysull'];
            if (wsCC) {
                items.forEach((it: any, idx: number) => {
                    const r = 11 + idx;
                    for (let m = 0; m < 12; m++) {
                        const pVal = it.programmed?.[m] || 0;
                        const matched = matchHhcRecordsForTopic(it.tema, it.item, false, m, hhcRecords);
                        const eVal = pVal > 0 ? (matched.length > 0 ? matched.length : (it.executed?.[m] || 0)) : 0;

                        const pAddr = XLSX.utils.encode_cell({ r, c: 8 + m * 2 });
                        const eAddr = XLSX.utils.encode_cell({ r, c: 9 + m * 2 });

                        wsCC[pAddr] = pVal > 0 ? { t: 'n', v: pVal } : undefined;
                        wsCC[eAddr] = eVal > 0 ? { t: 'n', v: eVal } : undefined;
                    }
                });
            }
        }

        // Generar archivo binario con formato completo
        const outputBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        const downloadName = isBrig
            ? 'F-SIG-066_Programa_Anual_Capacitaciones_Brigadistas_Rev_01.xlsx'
            : 'F-SIG-066_Programa_Anual_Capacitaciones_SSOMA_Red_Vial_6_Rev_02.xlsx';

        return new NextResponse(outputBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${downloadName}"`,
                'Cache-Control': 'no-store, max-age=0'
            }
        });

    } catch (error: any) {
        console.error('Error in export route:', error);
        return NextResponse.json({ error: error.message || 'Error al exportar Excel' }, { status: 500 });
    }
}
