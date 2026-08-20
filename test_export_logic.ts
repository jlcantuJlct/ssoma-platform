import client from './lib/db';
import ExcelJS from 'exceljs';
import fs from 'fs';

async function run() {
    // Fake data
    const matrixData = {
        'obj2': {
            'AREA': {
                'ACTIVIDAD 1': {
                    programmed: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    executed: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    tipo: 'capacitacion',
                    act: { description: 'CHARLA INDUCCION', sede: 'LIMA', area: 'TODOS', subtype: 'CHARLA' }
                }
            }
        }
    };
    
    const templateRow = await client.fetchOne("SELECT file_data FROM program_templates WHERE tipo = 'capacitacion'");
    let wb = new ExcelJS.Workbook();
    if (templateRow && templateRow.file_data) {
        await wb.xlsx.load(Buffer.from(templateRow.file_data, 'base64'));
    } else {
        console.log("NO TEMPLATE");
        return;
    }
    const ws = wb.worksheets[0];

    function findPEColumns(ws: ExcelJS.Worksheet, defaultStart: number = 7): { targetColsP: number[], targetColsE: number[] } {
        let targetColsP: number[] = [];
        let targetColsE: number[] = [];
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
        for(let i=0; i<12; i++) {
            targetColsP.push(defaultStart + i*2);
            targetColsE.push(defaultStart + 1 + i*2);
        }
        return { targetColsP, targetColsE };
    }

    let startRow = 9; 
    for (let r = 1; r <= Math.min(20, ws.rowCount); r++) {
        const cell = ws.getRow(r).getCell(1);
        if (cell.value === 1 || String(cell.value).match(/^\d+$/)) {
            startRow = r;
            break;
        }
    }

    let footerRow = ws.rowCount; 
    while (footerRow > startRow) {
        const val = String(ws.getRow(footerRow).getCell(2).value || '').toUpperCase();
        if (val.includes('RESPONSABLE') || val.includes('REVISADO') || val.includes('APROBADO')) break;
        footerRow--;
    }
    if (footerRow <= startRow) footerRow = ws.rowCount + 1;

    console.log("Start Row:", startRow);
    console.log("Footer Row:", footerRow);

    const refRow = ws.getRow(startRow);
    const styles: any[] = [];
    for(let c=1; c<=33; c++) {
        styles.push(refRow.getCell(c).style);
    }

    let currentRowIdx = startRow;
    let counter = 1;
    const { targetColsP, targetColsE } = findPEColumns(ws, 6);
    console.log("P columns:", targetColsP);

    Object.keys(matrixData['obj2']['AREA']).forEach(desc => {
        const data: any = matrixData['obj2']['AREA'][desc];
        
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

        for(let i=0; i<12; i++) {
            if (data.programmed[i] > 0) row.getCell(targetColsP[i]).value = data.programmed[i];
            if (data.executed[i] > 0) row.getCell(targetColsE[i]).value = data.executed[i];
        }

        currentRowIdx++;
    });

    await wb.xlsx.writeFile('test_export_capacitacion.xlsx');
    console.log("Done.");
}
run();
