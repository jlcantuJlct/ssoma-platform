const ExcelJS = require('exceljs');
async function read() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('test_machinery.xlsx');
    const ws = workbook.worksheets[0];
    
    for (let r=10; r<=78; r++) {
        const row = ws.getRow(r);
        row.eachCell({ includeEmpty: false }, (cell) => {
            const val = String(cell.value).trim();
            if (val.toUpperCase().includes('ACEITE DE MOTOR') || (val === 'x' && cell.row > 65)) {
                console.log(cell.address + ': ' + val);
            }
        });
    }
}
read();
