const ExcelJS = require('exceljs');
const path = require('path');

async function analyze() {
    const p = path.join(process.cwd(), 'public', 'templates', 'digital', 'Botiquines.xlsx');
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
    
    console.log("\n--- ITEMS (Checking first 20 rows of items) ---");
    for(let r=11; r<=30; r++) {
        const valA = ws.getCell(`A${r}`).value;
        const valB = ws.getCell(`B${r}`).value;
        const valC = ws.getCell(`C${r}`).value;
        if(valA !== null || valB !== null) {
            console.log(`Row ${r}: A=${valA}, B=${valB}, C=${valC}`);
        }
    }
}
analyze().catch(console.error);
