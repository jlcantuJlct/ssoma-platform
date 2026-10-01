const ExcelJS = require('exceljs');
async function run() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de campamento.xlsx');
    const sheet = workbook.worksheets[0];
    ['C4', 'E4', 'E5', 'G5', 'H5'].forEach(c => console.log(c, sheet.getCell(c).value));
}
run();
