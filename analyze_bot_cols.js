const ExcelJS = require('exceljs');
const path = require('path');

async function analyze() {
    const p = path.join(process.cwd(), 'public', 'templates', 'digital', 'Botiquines.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(p);
    const ws = workbook.worksheets[0];
    
    console.log("--- HEADER COLUMNS ---");
    const headerRow = ws.getRow(14);
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        console.log(`Col ${colNumber}(${cell._address}): ${cell.value}`);
    });
}
analyze().catch(console.error);
