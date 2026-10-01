const ExcelJS = require('exceljs');
const path = require('path');

async function analyze() {
    const p = path.join(process.cwd(), 'public', 'templates', 'digital', 'Botiquines.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(p);
    const ws = workbook.worksheets[0];
    
    console.log("--- ROWS 4-10 ---");
    for(let r=4; r<=10; r++) {
        let rowData = [];
        const row = ws.getRow(r);
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            let val = cell.value;
            if (val && typeof val === 'object' && val.richText) val = val.richText.map(rt => rt.text).join('');
            rowData.push(`Col ${colNumber}(${cell._address}): ${val}`);
        });
        if(rowData.length) console.log(`Row ${r}:`, rowData.join(' | '));
    }
}
analyze().catch(console.error);
