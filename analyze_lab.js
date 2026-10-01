const ExcelJS = require('exceljs');
const path = require('path');

async function analyze() {
    const p = path.join(process.cwd(), 'public', 'templates', 'digital', 'Inspección de Laboratorio.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(p);
    const ws = workbook.worksheets[0];
    
    console.log("--- HEADER (Rows 1-10) ---");
    for(let r=1; r<=10; r++) {
        let rowData = [];
        const row = ws.getRow(r);
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            rowData.push(`Col ${colNumber}(${cell._address}): ${cell.value}`);
        });
        if(rowData.length) console.log(`Row ${r}:`, rowData.join(' | '));
    }
    
    console.log("\n--- ITEMS (Checking first col) ---");
    for(let r=11; r<=80; r++) {
        const valA = ws.getCell(`A${r}`).value;
        const valB = ws.getCell(`B${r}`).value;
        if(valB && typeof valB === 'string' && valB.length > 3) {
            console.log(`Row ${r}: A=${valA}, B=${valB.substring(0,40)}...`);
        }
    }
}
analyze().catch(console.error);
