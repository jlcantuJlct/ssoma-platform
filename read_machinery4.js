const ExcelJS = require('exceljs');
async function read() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/digital/Inspección de maquinaria.xlsx');
    const ws = workbook.worksheets[0];
    
    let res = [];
    const row = ws.getRow(37);
    row.eachCell({ includeEmpty: false }, (cell) => {
        res.push(cell.address + ': ' + cell.value);
    });
    console.log(res.join('\n'));
}
read();
