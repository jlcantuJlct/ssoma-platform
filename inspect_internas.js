const ExcelJS = require('exceljs');

async function run() {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile('public/templates/digital/Inspecciones Internas SSOMA.xlsx');
    const ws = wb.worksheets[0];
    
    console.log("--- METADATA ---");
    for (let r = 1; r <= 16; r++) {
        let rowStr = [];
        for (let c = 1; c <= 15; c++) {
            const cell = ws.getCell(r, c);
            if (cell.value) rowStr.push(`[R${r}C${c}]: ${JSON.stringify(cell.value)}`);
        }
        if (rowStr.length > 0) console.log(rowStr.join(' | '));
    }
}
run();
