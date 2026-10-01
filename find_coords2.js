const ExcelJS = require('exceljs');

async function findCoords() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de instalaciones eléctricas.xlsx');
    const sheet = workbook.worksheets[0];
    
    for (let i = 47; i <= 51; i++) {
        console.log(`Row ${i} merges:`, sheet.getRow(i).getCell(1).model.master);
    }
}
findCoords();
