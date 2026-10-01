const ExcelJS = require('exceljs');
async function read() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('test_machinery.xlsx');
    const ws = workbook.worksheets[0];
    
    console.log('C15: ' + ws.getCell('C15').value);
    console.log('D21: ' + ws.getCell('D21').value);
    console.log('K15: ' + ws.getCell('K15').value);
    console.log('L15: ' + ws.getCell('L15').value); // Hoja Topadora OK
    console.log('B73: ' + ws.getCell('B73').value); // Aceite de motor Fuga
    console.log('E73: ' + ws.getCell('E73').value);
    console.log('C73: ' + ws.getCell('C73').value);
}
read();
