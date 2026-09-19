const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

async function testExport() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspecciones Internas SSOMA.xlsx');
    const worksheet = workbook.worksheets[0];

    // Mock isInternas block
    const razon = 'Test';
    worksheet.getCell('A5').value = razon;
    worksheet.getCell('O9').value = 'Test';
    
    // Test duplicate row
    const currentRow = 15;
    worksheet.duplicateRow(currentRow, 1, true);

    await workbook.xlsx.writeFile('test_corrupt.xlsx');
    console.log("Generated test_corrupt.xlsx");
}
testExport();
