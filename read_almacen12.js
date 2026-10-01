const ExcelJS = require('exceljs');
async function run() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de Almacén .xlsx');
    const ws = workbook.worksheets[0];
    for(let r=83; r<=175; r++) {
        let rowHasVal = false;
        for(let c=1; c<=20; c++) {
            if(ws.getCell(r, c).value) rowHasVal = true;
        }
        if(rowHasVal) console.log(`Row ${r} has values`);
    }
}
run();
