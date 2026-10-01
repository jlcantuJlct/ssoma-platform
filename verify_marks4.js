const ExcelJS = require('exceljs');
async function read() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('test_machinery.xlsx');
    const ws = workbook.worksheets[0];
    
    console.log('C38: ' + ws.getCell('C38').value);
    console.log('D38: ' + ws.getCell('D38').value);
    console.log('E38: ' + ws.getCell('E38').value);
    console.log('F38: ' + ws.getCell('F38').value);
    console.log('G38: ' + ws.getCell('G38').value);
}
read();
