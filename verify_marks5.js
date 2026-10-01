const ExcelJS = require('exceljs');
async function read() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de maquinaria.xlsx');
    const ws = workbook.worksheets[0];
    
    console.log('E38: ' + ws.getCell('E38').value);
    console.log('F38: ' + ws.getCell('F38').value);
}
read();
