const ExcelJS = require('exceljs');
const fs = require('fs');

async function testExport() {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile('C:/Users/jlcan/Desktop/Seguimiento de plataforma de seguridad Antigravity/Formatos/F-SIG-023 Programa Anual  SSTMA - 2026.xlsx');
    
    const ws = wb.worksheets[0];
    let startRow = 10;
    for (let r = 1; r <= ws.rowCount; r++) {
        const cell = ws.getRow(r).getCell(1);
        if (cell.value === 1 || String(cell.value).match(/^\d+$/)) {
            startRow = r;
            break;
        }
    }

    console.log("Start row:", startRow, "Total rows:", ws.rowCount);
    
    // Save styles
    const refRow = ws.getRow(startRow);
    const styles = [];
    for(let c=1; c<=21; c++) {
        // Must clone the style object, otherwise it might be reference-tied
        styles.push(Object.assign({}, refRow.getCell(c).style));
    }

    // Delete existing data rows
    const rowCount = ws.rowCount;
    if (rowCount >= startRow) {
        ws.spliceRows(startRow, rowCount - startRow + 1);
    }

    // Insert new data
    for (let i = 0; i < 5; i++) {
        const row = ws.addRow([]);
        for(let c=1; c<=21; c++) {
            row.getCell(c).style = styles[c-1];
        }
        row.getCell(1).value = i + 1;
        row.getCell(2).value = "OBJ 01";
        row.getCell(3).value = "Test Act " + i;
        row.getCell(4).value = "Mensual";
        row.getCell(5).value = "JL";
        row.getCell(6).value = "Obra";
        
        let colIdx = 7;
        for (let m = 0; m < 12; m++) {
            row.getCell(colIdx++).value = "P:1 E:0";
        }
        row.getCell(colIdx++).value = 12;
        row.getCell(colIdx++).value = 0;
        row.getCell(colIdx).value = 0;
        row.getCell(colIdx).numFmt = '0%';
    }

    await wb.xlsx.writeFile('test_actividades.xlsx');
    console.log("Done");
}

testExport().catch(console.error);
