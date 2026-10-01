const ExcelJS = require('exceljs');
async function run() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de campamento.xlsx');
    const sheet = workbook.worksheets[0];
    console.log("Row 52 cell K:", sheet.getCell('K52').value); // C
    console.log("Row 52 cell L:", sheet.getCell('L52').value); // NC
}
run();
