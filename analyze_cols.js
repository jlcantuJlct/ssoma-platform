const ExcelJS = require('exceljs');
const path = require('path');

async function analyze() {
    const p = path.join(process.cwd(), 'public', 'templates', 'digital', 'Inspeccion de cocina y comedor.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(p);
    const ws = workbook.worksheets[0];
    
    console.log("--- Header Row 14 ---");
    const row = ws.getRow(14);
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        console.log(`Col ${colNumber}(${cell._address}): ${cell.value}`);
    });
}
analyze().catch(console.error);
