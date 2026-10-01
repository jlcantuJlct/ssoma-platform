const ExcelJS = require('exceljs');
async function run() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de Almacén .xlsx');
    const ws = workbook.worksheets[0];
    for(let r=100; r<=175; r++) {
        let val = ws.getCell(r, 1).value;
        if(val) console.log(`Row ${r}:`, val);
    }
}
run();
