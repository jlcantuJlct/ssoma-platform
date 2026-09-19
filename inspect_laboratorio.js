const ExcelJS = require('exceljs');

async function run() {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile('public/templates/digital/Inspección de Laboratorio.xlsx');
    const ws = wb.worksheets[0];
    
    console.log("--- METADATA ---");
    for (let r = 1; r <= 15; r++) {
        let rowStr = [];
        for (let c = 1; c <= 8; c++) {
            const cell = ws.getCell(r, c);
            if (cell.value) rowStr.push(`[R${r}C${c}]: ${JSON.stringify(cell.value)}`);
        }
        if (rowStr.length > 0) console.log(rowStr.join(' | '));
    }

    console.log("\n--- GRID ---");
    let inGrid = false;
    for (let r = 10; r <= 80; r++) {
        let bVal = ws.getCell(`B${r}`).value;
        if (bVal && typeof bVal === 'object' && bVal.richText) bVal = bVal.richText.map(t=>t.text).join('');
        if (bVal) {
            console.log(`[Row ${r}] B:`, String(bVal).substring(0, 80).replace(/\n/g, ' '));
        }
        let aVal = ws.getCell(`A${r}`).value;
        if (aVal && String(aVal).toLowerCase().includes('observacion')) {
            console.log(`[Row ${r}] A (OBS):`, String(aVal));
        }
    }
}
run();
