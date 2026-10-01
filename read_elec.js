const ExcelJS = require('exceljs');

async function readExcel() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de instalaciones eléctricas.xlsx');
    const sheet = workbook.worksheets[0];
    
    for (let i = 1; i <= 30; i++) {
        let rowData = [];
        const row = sheet.getRow(i);
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            if (cell.value) rowData.push(`Col ${colNumber}: ${cell.value}`);
        });
        if (rowData.length > 0) {
            console.log(`Row ${i}: ${rowData.join(' | ')}`);
        }
    }
}
readExcel();
