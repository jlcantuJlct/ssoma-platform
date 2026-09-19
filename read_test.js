const ExcelJS = require('exceljs');
async function run() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('test_taller.xlsx');
    const ws = workbook.worksheets[0];
    console.log("D5:", ws.getCell('D5').value);
    console.log("D6:", ws.getCell('D6').value);
}
run();
