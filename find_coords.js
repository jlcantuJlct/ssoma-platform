const ExcelJS = require('exceljs');

async function findCoords() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de instalaciones eléctricas.xlsx');
    const sheet = workbook.worksheets[0];
    
    for (let i = 1; i <= 60; i++) {
        let rowData = [];
        const row = sheet.getRow(i);
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            if (cell.value && typeof cell.value === 'string' && cell.value.toLowerCase().includes('comentarios')) {
                console.log(`Comentarios Row: ${i}`);
            }
            if (cell.value && typeof cell.value === 'string' && cell.value.toLowerCase().includes('firma')) {
                console.log(`Firma Row: ${i}`);
            }
            if (cell.value && typeof cell.value === 'string' && cell.value.toLowerCase().includes('inspector')) {
                console.log(`Inspector Row: ${i}`);
            }
            if (cell.value && typeof cell.value === 'string' && cell.value.toLowerCase().includes('responsable')) {
                console.log(`Responsable Row: ${i}`);
            }
        });
    }
}
findCoords();
