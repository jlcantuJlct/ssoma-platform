const ExcelJS = require('exceljs');
async function extract() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de instalaciones eléctricas.xlsx');
    const sheet = workbook.worksheets[0];
    
    for (let i = 4; i <= 8; i++) {
        const row = sheet.getRow(i);
        console.log(`Row ${i} merges:`);
        row.eachCell({ includeEmpty: true }, (cell, col) => {
            console.log(`  Col ${col}: address=${cell.address}, value="${cell.value}", type=${cell.type}, merged=${cell.isMerged}`);
        });
    }
}
extract();
