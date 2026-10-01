const ExcelJS = require('exceljs');
async function run() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de Almacén .xlsx');
    const sheet = workbook.worksheets[0];
    
    console.log('Row 10 cells:');
    [1, 2, 9, 10, 11, 12, 13].forEach(c => console.log(`Col ${c}:`, sheet.getCell(10, c).value));
    
    console.log('Row 11 cells:');
    [1, 2, 9, 10, 11, 12, 13].forEach(c => console.log(`Col ${c}:`, sheet.getCell(11, c).value));
}
run();
