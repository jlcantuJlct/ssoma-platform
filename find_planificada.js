const ExcelJS = require('exceljs');
async function run() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de Almacén .xlsx');
    const sheet = workbook.worksheets[0];
    sheet.eachRow((row, rowNum) => {
        row.eachCell((cell, colNum) => {
            const val = cell.value ? String(cell.value).toLowerCase() : '';
            if (val.includes('planificada')) {
                console.log(`Found "${cell.value}" at row ${rowNum}, col ${colNum}`);
            }
        });
    });
}
run();
