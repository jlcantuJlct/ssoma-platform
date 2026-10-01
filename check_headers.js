const ExcelJS = require('exceljs');

async function checkHeaders() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de instalaciones eléctricas.xlsx');
    const sheet = workbook.worksheets[0];
    
    for (let i = 1; i <= 10; i++) {
        let rowData = [];
        sheet.getRow(i).eachCell({ includeEmpty: true }, (cell, colNumber) => {
            if (cell.value) rowData.push(`Col ${colNumber}: ${cell.value}`);
        });
        if (rowData.length > 0) {
            console.log(`Row ${i}: ${rowData.join(' | ')}`);
        }
    }
}
checkHeaders();
