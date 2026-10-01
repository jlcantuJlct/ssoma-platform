const ExcelJS = require('exceljs');
async function run() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de Almacén .xlsx');
    const ws = workbook.worksheets[0];
    console.log("83:", ws.getCell("A83").value, ws.getCell("A83").isMerged);
    console.log("84:", ws.getCell("A84").value);
    console.log("Total rows:", ws.rowCount);
}
run();
