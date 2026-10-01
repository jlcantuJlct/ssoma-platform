const ExcelJS = require('exceljs');
async function run() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de campamento.xlsx');
    const sheet = workbook.worksheets[0];
    console.log("J7 text:", sheet.getCell('J7').value);
    console.log("K7 text:", sheet.getCell('K7').value);
    console.log("M7 text:", sheet.getCell('M7').value);
}
run();
