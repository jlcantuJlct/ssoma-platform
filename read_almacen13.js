const ExcelJS = require('exceljs');
async function run() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de Almacén .xlsx');
    const ws = workbook.worksheets[0];
    console.log("6:", ws.getCell("K6").value);
    console.log("7:", ws.getCell("K7").value);
    console.log("8:", ws.getCell("K8").value);
}
run();
