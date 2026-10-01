const ExcelJS = require('exceljs');
const path = require('path');

async function analyze() {
    const p = path.join(process.cwd(), 'public', 'templates', 'digital', 'Inspección de Laboratorio.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(p);
    const ws = workbook.worksheets[0];
    
    console.log("--- Rows 30-45 ---");
    for(let r=30; r<=45; r++) {
        let rowData = [];
        const row = ws.getRow(r);
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            rowData.push(`Col ${colNumber}(${cell._address}): ${cell.value}`);
        });
        if(rowData.length) console.log(`Row ${r}:`, rowData.join(' | '));
    }
}
analyze().catch(console.error);
